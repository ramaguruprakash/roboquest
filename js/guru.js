"use strict";

// Dronacharya — the AI teacher shared by RoboQuest and its sibling games. 🧙
//
// A guru, not an answer key. The kid asks; Claude replies with a question or a
// nudge, never the solution. The brain lives behind a tiny proxy you deploy
// (see proxy/) so this page never holds an API key: the kid signs in once with
// a first name and a password from a grown-up, and the proxy checks the password.
//
// What this file does:
//   · runs the kid's program through the real interpreter and writes a short
//     plain-English report of what happened (so Claude coaches the ACTUAL bug),
//   · draws the chat drawer with the avatar, sign-in card, quick questions,
//     a hold-to-talk mic (speech recognition) and spoken replies (speech synthesis),
//   · sends { name, token, context, history, question, spoken } to the proxy.
//
// A game may call Guru.init({...}) before the drawer first opens to give the guru
// its own name, avatar, storage prefix, quick questions and context builders.
// RoboQuest uses the defaults. Rainier Rescue passes kind "quest".
//
// It also loads in node (no DOM) so js/test.js can check the report writer.

const Guru = (() => {
  // Where the proxy lives. Empty until you deploy proxy/ to Vercel, then e.g.
  //   "https://roboquest-guru.vercel.app/api/guru"
  const DEFAULT_ENDPOINT = "https://roboquest-guru.vercel.app/api/guru";
  // For local testing: open the game once as  ?guru=http://localhost:3000/api/guru
  // and it remembers that endpoint (see proxy/dev.js). Clear with  ?guru=reset
  // The endpoint key is shared by every game on this origin on purpose.
  const GURU_ENDPOINT = resolveEndpoint();
  function resolveEndpoint() {
    if (typeof window === "undefined") return DEFAULT_ENDPOINT;
    try {
      const fromUrl = new URLSearchParams(location.search).get("guru");
      if (fromUrl === "reset") localStorage.removeItem("roboquest-guru-endpoint");
      else if (fromUrl) localStorage.setItem("roboquest-guru-endpoint", fromUrl);
      return localStorage.getItem("roboquest-guru-endpoint") || DEFAULT_ENDPOINT;
    } catch {
      return DEFAULT_ENDPOINT;
    }
  }

  const MAX_HISTORY = 20;

  const isNode = typeof module !== "undefined" && typeof window === "undefined";
  const RoboLang = typeof Robo !== "undefined" ? Robo : isNode ? require("./interpreter.js") : null;

  const ESC = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const stripHTML = (s) =>
    String(s || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

  // ---------- Configuration (a game may override any of this via init) ----------

  const cfg = {
    name: "Dronacharya",
    subtitle: "your coding guru",
    avatar: "img/guru.svg",          // relative to the page that loads this file
    storagePrefix: "roboquest-guru-", // identity + chats; a sibling game uses its own
    signinPlaceholder: "Robo's friend",
    hintLabel: "🗝️ Just show me the hint",
    stuckQuestion: "I'm stuck. Can you help me think?",
    voice: true,                      // offer the mic and spoken replies when the browser can
    chips: {
      robo: ["🤔 I'm stuck", "❓ What does the error mean?", "📖 Explain the new word", "🎯 Am I close?"],
      web: ["🤔 I'm stuck", "🏷️ Which tag do I need?", "🎯 Am I close?"],
    },
    chipQuestions: {
      "🤔 I'm stuck": "I'm stuck. Can you help me think?",
      "❓ What does the error mean?": "What does the error mean?",
      "📖 Explain the new word": "Can you explain the new word in this level?",
      "🎯 Am I close?": "Am I close?",
      "🏷️ Which tag do I need?": "Which tag do I need?",
    },
    // greeting(ctx, kidName) -> string. Default below handles robo + web.
    greeting: null,
    // kind -> (ctx) => context object for the proxy. robo + web are built in.
    builders: {},
  };

  function init(opts) {
    if (!opts) return;
    for (const k of ["name", "subtitle", "avatar", "storagePrefix", "signinPlaceholder", "hintLabel", "stuckQuestion", "voice", "greeting"]) {
      if (opts[k] !== undefined) cfg[k] = opts[k];
    }
    Object.assign(cfg.chips, opts.chips || {});
    Object.assign(cfg.chipQuestions, opts.chipQuestions || {});
    Object.assign(cfg.builders, opts.builders || {});
  }

  const IDENTITY_KEY = () => cfg.storagePrefix + "identity";
  const CHAT_KEY = (k) => cfg.storagePrefix + "chat-" + k;
  const VOICE_KEY = () => cfg.storagePrefix + "voice";

  // ---------- The report: what did the kid's program actually do? ----------

  // Judge one world's final state with the game's rules, as plain facts.
  function judgeWorld(lv, w, final) {
    const why = [];
    if (w.goal && (final.x !== w.goal.x || final.y !== w.goal.y)) {
      why.push(`ended at column ${final.x}, row ${final.y} facing ${final.dir}; the flag is at column ${w.goal.x}, row ${w.goal.y}`);
    }
    if (final.gems.length && !lv.gemsOptional) {
      why.push(`${final.gems.length} gem(s) left at ${final.gems.map((k) => "(" + k.replace(",", ", ") + ")").join(" ")}`);
    }
    if (w.target) {
      const targetMap = new Map(w.target.map(([x, y, ch]) => [x + "," + y, ch || "⭐"]));
      const droppedMap = new Map(final.dropped);
      const misplaced = [...droppedMap.keys()].filter((k) => !targetMap.has(k)).length;
      const wrong = [...droppedMap].filter(([k, ch]) => targetMap.has(k) && targetMap.get(k) !== ch).length;
      const missing = [...targetMap.keys()].filter((k) => !droppedMap.has(k)).length;
      if (misplaced) why.push(`${misplaced} stamp(s) outside the picture`);
      if (wrong) why.push(`${wrong} square(s) with the wrong character`);
      if (missing) why.push(`${missing} picture square(s) still unstamped`);
    }
    if (w.deliveries) {
      const deliveryMap = new Map(w.deliveries.map(([x, y, c]) => [x + "," + y, c || null]));
      const placedMap = new Map(final.placed);
      const litter = [...placedMap.keys()].filter((k) => !deliveryMap.has(k)).length;
      const wrongColor = [...deliveryMap].filter(([k, c]) => placedMap.has(k) && c && placedMap.get(k) !== c).length;
      const waiting = [...deliveryMap.keys()].filter((k) => !placedMap.has(k)).length;
      if (litter) why.push(`${litter} gem(s) set down on squares that don't want one`);
      if (wrongColor) why.push(`${wrongColor} delivery square(s) got the wrong color (backpack is last-in-first-out)`);
      if (waiting) why.push(`${waiting} delivery square(s) still empty`);
    }
    if (lv.requirePack != null && final.pack.length !== lv.requirePack) {
      why.push(`backpack holds ${final.pack.length} gem(s), the level wants exactly ${lv.requirePack}`);
    }
    return why;
  }

  // Plain-English report of the program against the level. Pure — used by tests.
  function reportRobo(lv, code) {
    if (!code.trim()) return "The program is empty.";
    const worlds = lv.worlds || [lv.world];
    const label = (i) => `${lv.worldLabel || "World"} ${i + 1}`;
    const out = [];
    const lineCount = RoboLang.countCodeLines(code);
    out.push(`${lineCount} code line(s)${lv.maxLines ? ` (limit ${lv.maxLines}${lineCount > lv.maxLines ? " — OVER the limit" : ""})` : ""}.`);
    const missing = (lv.mustUse || []).filter((kw) => !new RegExp("\\b" + kw + "\\b").test(code));
    if (missing.length) out.push(`Missing required word(s): ${missing.join(", ")}.`);

    let program;
    try {
      program = RoboLang.parse(code);
    } catch (e) {
      if (!e.friendly) throw e;
      out.push(`Does not parse — line ${e.lineNo}: "${e.message}"`);
      return out.join(" ");
    }

    let allWon = true;
    for (let i = 0; i < worlds.length; i++) {
      const w = worlds[i];
      const r = RoboLang.run(program, w);
      if (r.error) {
        allWon = false;
        out.push(`${label(i)}: crashed at line ${r.error.lineNo} — "${r.error.message}"`);
        continue;
      }
      const why = judgeWorld(lv, w, r.final);
      if (!why.length) {
        out.push(`${label(i)}: WON.`);
        continue;
      }
      allWon = false;
      const gemsLeft = new Set(r.final.gems);
      if (gemsLeft.size && r.steps.some((s) => s.action === "move" && gemsLeft.has(s.x + "," + s.y))) {
        why.push("Robo walked over a gem without picking it up");
      }
      out.push(`${label(i)}: not solved — ${why.join("; ")}.`);
    }
    if (allWon && !missing.length && !(lv.maxLines && lineCount > lv.maxLines)) {
      out.push("The current program WOULD WIN if run.");
    }
    return out.join(" ");
  }

  function describeWorld(w, i, lv) {
    const parts = [
      `${w.cols} columns × ${w.rows} rows`,
      `Robo starts at column ${w.robot.x}, row ${w.robot.y} facing ${w.robot.dir}`,
    ];
    if (w.goal) parts.push(`flag at column ${w.goal.x}, row ${w.goal.y}`);
    if (w.gems && w.gems.length) parts.push(`gems at ${w.gems.map((g) => `(${g[0]}, ${g[1]}${g[2] ? " " + g[2] : ""})`).join(" ")}`);
    if (w.walls && w.walls.length) {
      parts.push(w.walls.length > 30 ? `${w.walls.length} wall squares (a maze)` : `walls at ${w.walls.map(([x, y]) => `(${x}, ${y})`).join(" ")}`);
    }
    if (w.target) parts.push(`picture to stamp (${w.target.length} squares): ${w.target.map(([x, y, ch]) => `(${x}, ${y}${ch ? " '" + ch + "'" : ""})`).join(" ")}`);
    if (w.deliveries) parts.push(`delivery squares at ${w.deliveries.map(([x, y, c]) => `(${x}, ${y}${c ? " wants " + c : ""})`).join(" ")}`);
    return `${lv.worldLabel || "World"} ${i + 1}: ${parts.join("; ")}.`;
  }

  // Report for a Web Studio level: the checklist plus any unbalanced tags.
  function reportWeb(lv, code, checks) {
    const src = code.replace(/<!--[\s\S]*?-->/g, "");
    if (!src.trim()) return "The page is empty.";
    const out = [];
    for (const t of ["h1", "h2", "p", "ul", "li", "button"]) {
      const opens = (src.match(new RegExp(`<${t}(\\s[^>]*)?>`, "gi")) || []).length;
      const closes = (src.match(new RegExp(`</${t}\\s*>`, "gi")) || []).length;
      if (opens !== closes) out.push(`<${t}>: ${opens} opener(s) but ${closes} closer(s).`);
    }
    for (const c of checks || []) out.push(`${c.ok ? "✓" : "✗"} ${c.label}`);
    if (checks && checks.length && checks.every((c) => c.ok)) out.push("Every check passes — the page WOULD WIN.");
    return out.join(" ");
  }

  const BUILTIN_BUILDERS = {
    web(ctx) {
      const lv = ctx.level;
      return {
        kind: "web",
        level: { title: lv.title, intro: stripHTML(lv.intro), newTags: lv.newTags || [], hint: lv.hint, solution: lv.solution },
        code: ctx.code.slice(0, 4000),
        report: reportWeb(lv, ctx.code, ctx.checks),
      };
    },
    robo(ctx) {
      const lv = ctx.level;
      const worlds = lv.worlds || [lv.world];
      return {
        kind: "robo",
        level: {
          title: lv.title, concept: lv.concept, intro: stripHTML(lv.intro),
          maxLines: lv.maxLines || null, mustUse: lv.mustUse || [], newCommands: lv.newCommands || [],
          knownCommands: ctx.knownCommands || [], hint: lv.hint, solution: lv.solution,
          completed: !!ctx.completed, attempts: ctx.attempts || 0,
        },
        worlds: worlds.map((w, i) => describeWorld(w, i, lv)),
        code: ctx.code.slice(0, 4000),
        report: reportRobo(lv, ctx.code),
      };
    },
  };

  // Everything Claude needs to coach this exact moment. ctx comes from the game.
  function buildContext(ctx) {
    const build = cfg.builders[ctx.kind] || BUILTIN_BUILDERS[ctx.kind] || BUILTIN_BUILDERS.robo;
    return build(ctx);
  }

  async function askCloud(ctx, question, history, identity, spoken) {
    const res = await fetch(GURU_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: identity.name,
        token: identity.token,
        context: buildContext(ctx),
        history: history.slice(-8).map((m) => ({ role: m.role === "kid" ? "user" : "assistant", text: m.text })),
        question,
        spoken: !!spoken,
      }),
    });
    if (!res.ok) {
      const err = new Error("guru proxy " + res.status);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    if (!data || typeof data.reply !== "string") throw new Error("bad reply");
    return data.reply;
  }

  // ---------- Voice: hearing the kid, and reading replies aloud (browser only) ----------

  const speech = (() => {
    const hasWindow = typeof window !== "undefined";
    const Recognition = hasWindow ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    const synth = hasWindow && "speechSynthesis" in window ? window.speechSynthesis : null;

    // Pick a warm English voice once voices have loaded (they arrive async in Chrome).
    let chosen = null;
    const PREFERRED = ["Samantha", "Karen", "Moira", "Daniel", "Google UK English Female", "Google US English", "Microsoft Aria", "Microsoft Zira"];
    function pickVoice() {
      if (!synth) return null;
      const voices = synth.getVoices();
      if (!voices.length) return null;
      for (const name of PREFERRED) {
        const v = voices.find((x) => x.name.startsWith(name));
        if (v) return v;
      }
      return voices.find((v) => /^en/i.test(v.lang) && v.localService) || voices.find((v) => /^en/i.test(v.lang)) || voices[0];
    }
    if (synth) {
      chosen = pickVoice();
      synth.addEventListener?.("voiceschanged", () => { chosen = pickVoice(); });
    }

    // Emoji and markup make the voice stumble; strip them before speaking.
    const forSpeech = (text) =>
      String(text).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "").replace(/\s+/g, " ").trim();

    // A game may plug in a better voice (e.g. ElevenLabs via the proxy). It gets
    // (text, opts) and resolves true if it played; otherwise we fall back to the browser.
    let provider = null;
    function setProvider(fn) { provider = fn; }

    function speak(text, opts = {}) {
      const clean = forSpeech(text);
      if (!clean) return false;
      if (synth) synth.cancel();
      if (provider) {
        provider(clean, { voice: "guru", ...opts }).then((played) => { if (!played) speakLocal(clean, opts); }).catch(() => speakLocal(clean, opts));
        return true;
      }
      return speakLocal(clean, opts);
    }
    function speakLocal(clean, opts) {
      if (!synth) return false;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      if (!chosen) chosen = pickVoice();
      if (chosen) u.voice = chosen;
      u.rate = opts.rate || 0.95;
      u.pitch = opts.pitch || 1.05;
      if (opts.onEnd) u.onend = opts.onEnd;
      synth.speak(u);
      return true;
    }
    function stop() { if (synth) synth.cancel(); if (provider && provider.stop) provider.stop(); }

    // Hold-to-talk. onText(interimTranscript) streams words as they arrive;
    // onDone(finalTranscript) fires when the kid lets go and recognition settles.
    function listen(onText, onDone, onError) {
      if (!Recognition) return null;
      const rec = new Recognition();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = true;
      rec.maxAlternatives = 1;
      let finalText = "";
      let interim = "";
      let stopped = false;
      rec.onresult = (e) => {
        interim = "";
        finalText = "";
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript + " ";
          else interim += r[0].transcript + " ";
        }
        onText((finalText + interim).trim());
      };
      rec.onerror = (e) => { if (onError) onError(e.error || "error"); };
      rec.onend = () => { stopped = true; onDone((finalText + interim).trim()); };
      try { rec.start(); } catch { return null; }
      return {
        stop() { if (!stopped) { try { rec.stop(); } catch { /* already stopped */ } } },
      };
    }

    return { canListen: !!Recognition, get canSpeak() { return !!synth || !!provider; }, speak, stop, listen, setProvider };
  })();

  // ---------- The chat drawer (browser only) ----------

  let els = null;
  let active = null; // { key, provider } — which level is on screen and how to read it
  let prev = null;   // the level under a wing (Web Studio), restored when it closes
  const chats = {};  // levelKey -> [{ role: "guru"|"kid", text }]  (plain text)
  let busy = false;
  let onHintRequest = null;
  let listening = null; // the active hold-to-talk session

  function identity() {
    try { return JSON.parse(localStorage.getItem(IDENTITY_KEY()) || "null") || null; } catch { return null; }
  }
  function saveIdentity(id) {
    localStorage.setItem(IDENTITY_KEY(), JSON.stringify(id));
  }
  function ready() {
    const id = identity();
    return !!GURU_ENDPOINT && !!(id && id.token);
  }
  function voiceOn() {
    if (!cfg.voice || !speech.canSpeak) return false;
    try { return localStorage.getItem(VOICE_KEY()) !== "off"; } catch { return true; }
  }
  function setVoiceOn(on) {
    try { localStorage.setItem(VOICE_KEY(), on ? "on" : "off"); } catch { /* fine */ }
    if (!on) speech.stop();
    if (els) els.voiceBtn.textContent = on ? "🔊" : "🔇";
  }

  function chatFor(key) {
    if (!chats[key]) {
      try { chats[key] = JSON.parse(localStorage.getItem(CHAT_KEY(key)) || "[]"); } catch { chats[key] = []; }
    }
    return chats[key];
  }
  function pushMsg(key, msg) {
    const list = chatFor(key);
    list.push(msg);
    while (list.length > MAX_HISTORY) list.shift();
    try { localStorage.setItem(CHAT_KEY(key), JSON.stringify(list)); } catch { /* chat is a convenience */ }
  }

  function avatarImg(cls) {
    return `<img class="${cls}" src="${ESC(cfg.avatar)}" alt="">`;
  }

  function build() {
    if (els) return;
    const root = document.createElement("aside");
    root.className = "guru-panel";
    root.id = "guruPanel";
    root.hidden = true;
    root.setAttribute("aria-label", `${cfg.name}, ${cfg.subtitle}`);
    const showMic = cfg.voice && speech.canListen;
    const showVoice = cfg.voice && speech.canSpeak;
    root.innerHTML =
      `<div class="guru-head">
         ${avatarImg("guru-avatar")}
         <div class="guru-title"><b>${ESC(cfg.name)}</b><small id="guruSub">${ESC(cfg.subtitle)}</small></div>
         <button class="guru-icon-btn" id="guruVoice" title="Read replies aloud" ${showVoice ? "" : "hidden"}>🔊</button>
         <button class="guru-icon-btn" id="guruSettings" title="Change name or password">⚙️</button>
         <button class="guru-icon-btn" id="guruClose" aria-label="Close">✕</button>
       </div>
       <div class="guru-signin" id="guruSignin" hidden>
         <p class="guru-namaste">🙏 Namaste! Before we begin…</p>
         <label>What's your first name?
           <input id="guruName" maxlength="24" autocomplete="off" placeholder="${ESC(cfg.signinPlaceholder)}"></label>
         <label>Secret password from your grown-up
           <input id="guruToken" type="password" maxlength="64" autocomplete="off"></label>
         <p class="guru-signin-note" id="guruSigninNote"></p>
         <button class="run-btn guru-go" id="guruGo">Let's go →</button>
       </div>
       <div class="guru-messages" id="guruMessages" aria-live="polite"></div>
       <div class="guru-chips" id="guruChips"></div>
       <form class="guru-input" id="guruForm">
         <button type="button" class="guru-mic" id="guruMic" title="Hold to talk" aria-label="Hold to talk" ${showMic ? "" : "hidden"}>🎤</button>
         <input id="guruText" maxlength="240" autocomplete="off" placeholder="${showMic ? "Hold 🎤 and talk, or type…" : `Ask ${ESC(cfg.name)} anything…`}">
         <button type="submit" class="run-btn guru-send">Ask</button>
       </form>
       <div class="guru-foot">
         <span id="guruMode"></span>
         <button type="button" class="guru-link" id="guruHintLink">${ESC(cfg.hintLabel)}</button>
       </div>`;
    document.body.appendChild(root);
    const q = (sel) => root.querySelector(sel);
    els = {
      root, sub: q("#guruSub"), signin: q("#guruSignin"), name: q("#guruName"), token: q("#guruToken"),
      signinNote: q("#guruSigninNote"), go: q("#guruGo"), messages: q("#guruMessages"), chips: q("#guruChips"),
      form: q("#guruForm"), text: q("#guruText"), mode: q("#guruMode"), hintLink: q("#guruHintLink"),
      mic: q("#guruMic"), voiceBtn: q("#guruVoice"),
    };

    q("#guruClose").addEventListener("click", close);
    q("#guruSettings").addEventListener("click", () => showSignin());
    els.voiceBtn.addEventListener("click", () => setVoiceOn(!voiceOn()));
    els.voiceBtn.textContent = voiceOn() ? "🔊" : "🔇";
    els.go.addEventListener("click", (e) => {
      e.preventDefault();
      saveIdentity({ name: els.name.value.trim().slice(0, 24), token: els.token.value.trim() });
      els.signin.hidden = true;
      if (!chatFor(active.key).length) greet();
      renderChat();
      els.text.focus();
    });
    els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = els.text.value.trim();
      if (!text) return;
      els.text.value = "";
      ask(text);
    });
    els.hintLink.addEventListener("click", () => { if (onHintRequest) onHintRequest(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !root.hidden) close();
    });

    // Hold-to-talk: press starts listening, release sends what was heard.
    if (showMic) {
      const start = (e) => {
        e.preventDefault();
        if (busy || listening) return;
        speech.stop(); // don't transcribe the guru's own voice
        els.text.value = "";
        els.mic.classList.add("listening");
        els.text.placeholder = "Listening… let go when you're done";
        listening = speech.listen(
          (text) => { els.text.value = text; },
          (finalText) => {
            listening = null;
            els.mic.classList.remove("listening");
            els.text.placeholder = "Hold 🎤 and talk, or type…";
            if (finalText) {
              els.text.value = "";
              ask(finalText, { spoken: true });
            }
          },
          (err) => {
            listening = null;
            els.mic.classList.remove("listening");
            els.text.placeholder = "Hold 🎤 and talk, or type…";
            if (err === "not-allowed" || err === "service-not-allowed") {
              els.text.placeholder = "The mic is blocked — ask a grown-up to allow it, or type";
            }
          },
        );
        if (!listening) els.mic.classList.remove("listening");
      };
      const stop = () => { if (listening) listening.stop(); };
      els.mic.addEventListener("pointerdown", start);
      els.mic.addEventListener("pointerup", stop);
      els.mic.addEventListener("pointerleave", stop);
      els.mic.addEventListener("pointercancel", stop);
      els.mic.addEventListener("contextmenu", (e) => e.preventDefault());
    }
  }

  function showSignin() {
    const id = identity() || { name: "", token: "" };
    els.name.value = id.name || "";
    els.token.value = id.token || "";
    els.signinNote.textContent = GURU_ENDPOINT
      ? "The password lets me think with the cloud. Only your grown-up has it."
      : `${cfg.name}'s cloud isn't set up on this copy of the game yet.`;
    els.signin.hidden = false;
    els.name.focus();
  }

  function renderChat() {
    const ctx = active.provider();
    const list = chatFor(active.key);
    els.messages.innerHTML = list.map((m) =>
      `<div class="guru-msg ${m.role}">` +
      (m.role === "guru" ? avatarImg("guru-msg-avatar") : "") +
      `<div class="guru-bubble">${ESC(m.text).replace(/\n/g, "<br>")}</div></div>`
    ).join("");
    els.messages.scrollTop = els.messages.scrollHeight;
    els.chips.innerHTML = "";
    for (const c of cfg.chips[ctx.kind] || cfg.chips.robo) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "guru-chip";
      b.textContent = c;
      b.addEventListener("click", () => ask(cfg.chipQuestions[c] || c));
      els.chips.appendChild(b);
    }
    const id = identity() || {};
    els.mode.textContent = ready() ? `☁️ ${id.name || "friend"}` : "🔒 no password yet";
    els.sub.textContent = `about “${ctx.level.title}”`;
  }

  function defaultGreeting(ctx, kidName) {
    const name = kidName ? `, ${kidName}` : "";
    return ctx.kind === "web"
      ? `Namaste${name}! 🙏 I'm ${cfg.name}. I won't type your page for you — but I'll help you see what it needs. What's puzzling you?`
      : `Namaste${name}! 🙏 I'm ${cfg.name}, ${cfg.subtitle}. I never give answers — I give better questions. What's puzzling you?`;
  }

  function greet() {
    const id = identity() || {};
    const ctx = active.provider();
    const text = (cfg.greeting || defaultGreeting)(ctx, id.name || "");
    pushMsg(active.key, { role: "guru", text });
    if (voiceOn()) speech.speak(text);
  }

  async function ask(question, opts = {}) {
    if (busy || !active) return;
    const key = active.key;
    const ctx = active.provider();
    const id = identity() || {};
    pushMsg(key, { role: "kid", text: question });
    renderChat();

    if (!ready()) {
      const text = GURU_ENDPOINT
        ? "I need the secret password from your grown-up before I can think with the cloud. Tap ⚙️ to add it — or press 🗝️ below for the level's hint."
        : "My cloud isn't connected on this copy of the game. Press 🗝️ below for the level's hint!";
      pushMsg(key, { role: "guru", text });
      renderChat();
      if (voiceOn()) speech.speak(text);
      return;
    }

    busy = true;
    els.text.disabled = true;
    const typing = document.createElement("div");
    typing.className = "guru-msg guru typing";
    typing.innerHTML = `${avatarImg("guru-msg-avatar")}<div class="guru-bubble">hmm…</div>`;
    els.messages.appendChild(typing);
    els.messages.scrollTop = els.messages.scrollHeight;

    let reply;
    try {
      reply = await askCloud(ctx, question, chatFor(key).slice(0, -1), id, opts.spoken);
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        reply = "That password didn't open the door. 🔒 Ask your grown-up to check it (tap ⚙️), then ask me again.";
        saveIdentity({ name: id.name, token: "" });
      } else if (e.status === 429) {
        reply = "So many questions so fast — I'm meditating for a minute. 🧘 Try your idea in the meantime, then ask again.";
      } else {
        reply = "I can't reach the cloud right now. ☁️ Check the internet, or press 🗝️ below for the level's hint.";
      }
    }
    typing.remove();
    busy = false;
    els.text.disabled = false;
    pushMsg(key, { role: "guru", text: reply });
    if (active && active.key === key) {
      renderChat();
      if (voiceOn()) speech.speak(reply);
      if (!opts.spoken) els.text.focus();
    }
  }

  // ---------- Public API ----------

  // Which level is on screen, and how to read it. provider() returns
  // { kind: "robo"|"web"|..., level, code, ... } fresh each call.
  function setLevel(key, provider) {
    if (active && active.key.split(":")[0] !== key.split(":")[0]) prev = active;
    active = { key, provider };
    if (isOpen()) renderChat();
  }
  // A wing (the Web Studio) closed — back to the level underneath.
  function restore() {
    if (!prev) return;
    active = prev;
    prev = null;
    if (isOpen()) renderChat();
  }
  function open(question) {
    build();
    if (!active) return;
    els.root.hidden = false;
    if (!identity()) {
      showSignin();
      return;
    }
    els.signin.hidden = true;
    if (!chatFor(active.key).length) greet();
    renderChat();
    if (question) ask(question);
    else els.text.focus();
  }
  function close() {
    if (els) els.root.hidden = true;
    if (listening) listening.stop();
    speech.stop();
  }
  function isOpen() {
    return !!els && !els.root.hidden;
  }
  function onHint(fn) {
    onHintRequest = fn;
  }
  // "Start over": forget every chat, keep who the kid is.
  function resetChats() {
    for (const k of Object.keys(chats)) delete chats[k];
    const prefix = cfg.storagePrefix + "chat-";
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) localStorage.removeItem(k);
    }
    if (isOpen()) renderChat();
  }

  return {
    get NAME() { return cfg.name; },
    get endpoint() { return GURU_ENDPOINT; },
    init, setLevel, restore, open, close, isOpen, onHint, resetChats,
    // Read-aloud for the game itself (scene text, notes), independent of the guru's toggle.
    speech,
    // Pure pieces, for tests:
    reportRobo, reportWeb, describeWorld, buildContext, stripHTML,
  };
})();

if (typeof module !== "undefined") module.exports = Guru;
