"use strict";

// Robo's Web Studio — the app shell for the HTML levels.
// A full-screen wing (like the spellbook): editor on the right, a LIVE
// preview in the middle, and a "make it like this" target pane. Judging
// inspects the preview's real DOM — forgiving by design.

const WebStudio = (() => {
  const $ = (id) => document.getElementById(id);
  const ESC = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const PROGRESS_KEY = "roboquest-web-progress";
  const CODE_KEY = (id) => "roboquest-web-code-" + id;

  let els = null; // looked up lazily — the script loads before the DOM below it
  let current = 0;
  let previewTimer = null;
  let completed = loadProgress();

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]");
      return new Set(saved.filter((id) => WEB_LEVELS.some((lv) => lv.id === id)));
    } catch {
      return new Set();
    }
  }
  function saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completed]));
  }

  function level() {
    return WEB_LEVELS[current];
  }

  // The pretty wrapper every level's body HTML lands in — the kid writes only
  // the body, but their tags always appear on a page that already looks great.
  function wrap(bodyHTML) {
    return (
      "<!doctype html><html><head><meta charset='utf-8'><style>" +
      "html{background:linear-gradient(160deg,#dfe9ff,#fbe9ff);min-height:100%;}" +
      "body{max-width:520px;margin:16px auto;background:#fff;border-radius:18px;" +
      "padding:18px 26px 24px;box-shadow:0 8px 26px rgba(80,70,180,.18);" +
      "font-family:'Comic Sans MS','Chalkboard SE','Segoe UI',sans-serif;color:#33305a;line-height:1.45;}" +
      "h1{color:#5b4dbe;margin:10px 0;}h2{color:#e8618c;margin:14px 0 4px;}" +
      "p{margin:7px 0;}ul{margin:7px 0;padding-left:26px;}li{margin:4px 0;}" +
      "img{width:110px;vertical-align:middle;margin:6px;}" +
      "button{font-family:inherit;font-size:1rem;background:#ffd94d;border:2.5px solid #33305a;" +
      "border-radius:999px;padding:8px 18px;margin:6px 4px;cursor:pointer;box-shadow:0 3px 0 #33305a;}" +
      "button:active{transform:translateY(3px);box-shadow:none;}" +
      "</style></head><body>" + bodyHTML + "</body></html>"
    );
  }

  // ---------- Checks ----------
  // Declarative and forgiving: filter matches, then compare counts.
  function checkResult(c, doc) {
    let matches = [...doc.querySelectorAll(c.find)];
    if (c.textMin) matches = matches.filter((el) => el.textContent.trim().length >= c.textMin);
    if (c.srcPattern) matches = matches.filter((el) => c.srcPattern.test(el.getAttribute("src") || ""));
    const n = matches.length;
    if (c.max != null && n > c.max) return false;
    return n >= (c.min != null ? c.min : 1);
  }
  function firstMiss(lv, doc) {
    for (const c of lv.checks) {
      if (!checkResult(c, doc)) return c.miss;
    }
    return null;
  }

  // ---------- Rendering ----------

  function say(text, mood) {
    els.speech.className = "speech" + (mood ? " " + mood : "");
    els.speechText.innerHTML = text;
  }

  function renderChecklist(doc) {
    const lv = level();
    if (!lv.checklist) {
      els.checklist.hidden = true;
      return;
    }
    els.checklist.hidden = false;
    els.checklistBody.innerHTML = lv.checks
      .map((c) => {
        const ok = doc ? checkResult(c, doc) : false;
        return `<li class="${ok ? "check-ok" : "check-todo"}">${ok ? "✅" : "⬜"} ${ESC(c.label)}</li>`;
      })
      .join("");
  }

  function updatePreview(onLoaded) {
    els.preview.onload = () => {
      renderChecklist(els.preview.contentDocument);
      if (onLoaded) onLoaded(els.preview.contentDocument);
    };
    els.preview.srcdoc = wrap(els.editor.value);
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => updatePreview(), 250);
  }

  function updateTally() {
    els.tally.textContent = `⭐ ${completed.size} / ${WEB_LEVELS.length}`;
  }

  function loadLevel(idx) {
    current = idx;
    const lv = level();
    els.levelTitle.textContent = `${lv.emoji} ${idx + 1}. ${lv.title}`;
    els.intro.innerHTML = lv.intro;
    els.hintText.textContent = lv.hint;
    els.hintBox.open = false;
    els.newTags.innerHTML = (lv.newTags || [])
      .map((t) => `<code class="new-tag">${ESC(t)}</code>`)
      .join(" ");
    els.newTagsRow.hidden = !(lv.newTags || []).length;
    els.editor.value = localStorage.getItem(CODE_KEY(lv.id)) || lv.starter;
    // Target pane: the finale is a free build — show the checklist card instead.
    els.targetBox.hidden = !!lv.checklist;
    if (!lv.checklist) els.target.srcdoc = wrap(lv.solution);
    els.winBox.hidden = true;
    updateTally();
    updatePreview();
    say(
      idx === 0
        ? "Welcome to my studio! Type in the editor — the page changes LIVE. When it matches the picture, press <b>✨ Show Robo!</b>"
        : lv.checklist
          ? "This one's all yours! Build until every checklist box turns green. 🧑‍💻"
          : "Ready! Make your page match the picture, then press <b>✨ Show Robo!</b>"
    );
    els.editor.focus();
  }

  function judge() {
    const lv = level();
    updatePreview((doc) => {
      const miss = firstMiss(lv, doc);
      if (miss) {
        say(ESC(miss), "sad");
        return;
      }
      const firstTime = !completed.has(lv.id);
      completed.add(lv.id);
      saveProgress();
      updateTally();
      say("It's PERFECT. You're a real web builder! 🎉", "happy");
      els.winTitle.textContent = lv.id === "web-9" ? "🏆 You built your own page!" : "🎉 Page complete!";
      els.winSub.textContent =
        lv.id === "web-9"
          ? "A page about you, built by you. You're officially a WEB DEVELOPER! 🧑‍💻"
          : firstTime
            ? "Robo hangs it in the studio gallery. On to the next one!"
            : "Built it again — nice!";
      els.winNext.hidden = current >= WEB_LEVELS.length - 1;
      els.winBox.hidden = false;
    });
  }

  // ---------- The studio's section in the Levels map ----------

  function tocSection(onOpen) {
    const section = document.createElement("div");
    section.className = "toc-arena";
    const done = WEB_LEVELS.filter((lv) => completed.has(lv.id)).length;
    section.innerHTML =
      `<h2>${WEB_META.emoji} ${ESC(WEB_META.title)} <span class="toc-progress">⭐ ${done} / ${WEB_LEVELS.length}</span></h2>` +
      `<p class="toc-blurb">${ESC(WEB_META.blurb)}</p>`;
    const list = document.createElement("div");
    list.className = "toc-levels";
    WEB_LEVELS.forEach((lv, i) => {
      const row = document.createElement("button");
      row.className = "toc-level" + (completed.has(lv.id) ? " done" : "");
      row.innerHTML =
        `<span class="toc-mark">${completed.has(lv.id) ? "⭐" : "▶"}</span>` +
        `<span class="toc-num">${i + 1}.</span> ${ESC(lv.title)}`;
      row.addEventListener("click", () => {
        if (onOpen) onOpen();
        open(i);
      });
      list.appendChild(row);
    });
    section.appendChild(list);
    return section;
  }

  // ---------- Open / close ----------

  function lookupEls() {
    if (els) return;
    els = {
      screen: $("studioScreen"),
      back: $("studioBack"),
      tally: $("studioTally"),
      levelTitle: $("studioLevelTitle"),
      intro: $("studioIntro"),
      newTagsRow: $("studioNewTagsRow"),
      newTags: $("studioNewTags"),
      hintBox: $("studioHintBox"),
      hintText: $("studioHintText"),
      checklist: $("studioChecklist"),
      checklistBody: $("studioChecklistBody"),
      targetBox: $("studioTargetBox"),
      target: $("studioTarget"),
      preview: $("studioPreview"),
      editor: $("studioEditor"),
      runBtn: $("studioRunBtn"),
      resetBtn: $("studioResetBtn"),
      speech: $("studioSpeech"),
      speechText: $("studioSpeechText"),
      winBox: $("studioWin"),
      winTitle: $("studioWinTitle"),
      winSub: $("studioWinSub"),
      winNext: $("studioWinNext"),
      winStay: $("studioWinStay"),
    };
    els.editor.addEventListener("input", () => {
      localStorage.setItem(CODE_KEY(level().id), els.editor.value);
      schedulePreview();
    });
    els.runBtn.addEventListener("click", judge);
    els.resetBtn.addEventListener("click", () => {
      els.editor.value = level().starter;
      localStorage.removeItem(CODE_KEY(level().id));
      updatePreview();
      say("Fresh page! Ready when you are.");
    });
    els.back.addEventListener("click", close);
    els.winNext.addEventListener("click", () => {
      els.winBox.hidden = true;
      if (current < WEB_LEVELS.length - 1) loadLevel(current + 1);
    });
    els.winStay.addEventListener("click", () => {
      els.winBox.hidden = true;
      els.editor.focus();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !els.screen.hidden) close();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !els.screen.hidden) {
        e.preventDefault();
        judge();
      }
    });
  }

  function open(idx) {
    lookupEls();
    els.screen.hidden = false;
    loadLevel(idx != null ? idx : firstUnfinished());
  }
  function close() {
    els.screen.hidden = true;
  }
  function firstUnfinished() {
    const i = WEB_LEVELS.findIndex((lv) => !completed.has(lv.id));
    return i === -1 ? 0 : i;
  }
  function resetProgress() {
    completed = new Set();
    saveProgress();
    for (const lv of WEB_LEVELS) localStorage.removeItem(CODE_KEY(lv.id));
  }

  return { open, close, tocSection, resetProgress };
})();
