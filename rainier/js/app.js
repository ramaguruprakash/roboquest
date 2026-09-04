"use strict";

// The quest runner: names, the map, one scene at a time, oranges and belts,
// read-aloud, and Dronacharya. Scenes themselves live in scenes/*.js and the
// story in story.js — this file never knows what a particular puzzle is.

(() => {
  const NAMES_KEY = "rainier-names";
  const PROGRESS_KEY = "rainier-progress";
  const VOICE_KEY = "rainier-voice";
  const LAST_KEY = "rainier-last";
  const STORY_SEEN_KEY = "rainier-story-seen";
  const CUB_NAME = "Bramble";
  const AVATARS = ["🤸‍♀️", "🥋", "⛸️", "🛴", "🧗‍♀️", "🦸‍♀️"];

  const $ = (id) => document.getElementById(id);
  const els = {
    names: $("namesScreen"), heroName: $("heroName"), rabbitName: $("rabbitName"), avatarPick: $("avatarPick"), namesGo: $("namesGo"),
    story: $("storyScreen"), storyPic: $("storyPic"), storyText: $("storyText"), storyDots: $("storyDots"),
    storySpeak: $("storySpeak"), storyBack: $("storyBack"), storyNext: $("storyNext"), storyBtn: $("storyBtn"),
    map: $("mapScreen"), mapAreas: $("mapAreas"), mapHero: $("mapHero"), mapTitle: $("mapTitle"), mapSub: $("mapSub"),
    scene: $("sceneScreen"), areaTag: $("areaTag"), sceneTitle: $("sceneTitle"),
    companionEmoji: $("companionEmoji"), companionText: $("companionText"), sayAgain: $("sayAgain"),
    taskText: $("taskText"), taskSpeak: $("taskSpeak"),
    stage: $("stage"), nextBtn: $("nextBtn"), mapBtn: $("mapBtn"), backBtn: $("backBtn"),
    guruBtn: $("guruBtn"), hintBtn: $("hintBtn"), hintBox: $("hintBox"), hintNudge: $("hintNudge"), hintText: $("hintText"),
    hintAskGuru: $("hintAskGuru"), hintReveal: $("hintReveal"),
    overlay: $("areaOverlay"), overlayTitle: $("overlayTitle"), overlayClue: $("overlayClue"), overlayBelt: $("overlayBelt"), overlayGo: $("overlayGo"),
    oranges: $("orangeCount"), belt: $("beltBadge"), voiceBtn: $("voiceBtn"), resetBtn: $("resetBtn"), logoText: $("logoText"),
    confetti: $("confetti"),
  };

  // ---------- Names, progress, voice ----------

  let names = load(NAMES_KEY, null);
  let progress = load(PROGRESS_KEY, { done: [], oranges: 0 });
  const done = new Set(progress.done);
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function saveProgress() {
    progress.done = [...done];
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }
  function voiceOn() {
    try { return localStorage.getItem(VOICE_KEY) !== "off"; } catch { return true; }
  }
  function setVoice(on) {
    try { localStorage.setItem(VOICE_KEY, on ? "on" : "off"); } catch { /* fine */ }
    els.voiceBtn.textContent = on ? "🔊" : "🔇";
    if (!on) Guru.speech.stop();
  }
  // force: the kid explicitly asked to hear it (tap a word, tap the parrot), so ignore the toggle.
  function speak(text, force) {
    if ((!voiceOn() && !force) || !Guru.speech.canSpeak) return;
    Guru.speech.speak(text, { rate: 0.92 });
  }

  // {hero}, {rabbit}, {cub} and any per-miss variables.
  function fill(text, vars = {}) {
    const all = { hero: names?.hero || "Hero", rabbit: names?.rabbit || "Biscuit", cub: CUB_NAME, ...vars };
    return String(text).replace(/\{(\w+)\}/g, (m, k) => (all[k] !== undefined ? all[k] : m));
  }
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- Areas and unlocking ----------

  const scenesOf = (areaId) => SCENES.filter((s) => s.area === areaId);
  const areaDone = (area) => { const s = scenesOf(area.id); return s.length > 0 && s.every((x) => done.has(x.id)); };
  function areaUnlocked(i) {
    if (i === 0) return true;
    return areaDone(AREAS[i - 1]);
  }
  function sceneUnlocked(scene) {
    const ai = AREAS.findIndex((a) => a.id === scene.area);
    if (!areaUnlocked(ai)) return false;
    if (done.has(scene.id)) return true;
    const list = scenesOf(scene.area);
    const idx = list.findIndex((s) => s.id === scene.id);
    return list.slice(0, idx).every((s) => done.has(s.id));
  }
  function currentBelt() {
    let belt = "white";
    for (const a of AREAS) if (areaDone(a)) belt = a.belt;
    return belt;
  }
  function beltEmoji(belt) {
    return { white: "⬜", yellow: "🟨", orange: "🟧", green: "🟩", blue: "🟦", purple: "🟪" }[belt] || "⬜";
  }
  function renderTop() {
    els.oranges.textContent = progress.oranges;
    const b = currentBelt();
    els.belt.textContent = `${beltEmoji(b)} ${b} belt`;
    els.logoText.textContent = names ? `${names.hero}'s Quest` : "Rainier Rescue";
  }

  // ---------- Names screen ----------

  function showNames() {
    els.story.hidden = true;
    els.names.hidden = false;
    els.map.hidden = true;
    els.scene.hidden = true;
    els.avatarPick.innerHTML = "";
    let picked = names?.avatar || AVATARS[0];
    for (const a of AVATARS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "avatar-opt" + (a === picked ? " picked" : "");
      b.textContent = a;
      b.addEventListener("click", () => {
        picked = a;
        els.avatarPick.querySelectorAll(".avatar-opt").forEach((x) => x.classList.toggle("picked", x.textContent === a));
      });
      els.avatarPick.appendChild(b);
    }
    els.heroName.value = names?.hero || "";
    els.rabbitName.value = names?.rabbit || "";
    els.namesGo.onclick = () => {
      names = {
        hero: els.heroName.value.trim().slice(0, 16) || "Hero",
        rabbit: els.rabbitName.value.trim().slice(0, 16) || "Biscuit",
        avatar: picked,
      };
      localStorage.setItem(NAMES_KEY, JSON.stringify(names));
      renderTop();
      if (!localStorage.getItem(STORY_SEEN_KEY)) showStory();
      else showMap();
    };
    els.heroName.focus();
  }

  // ---------- The opening story ----------

  let page = 0;
  function showStory() {
    Guru.close();
    els.names.hidden = true;
    els.map.hidden = true;
    els.scene.hidden = true;
    els.overlay.hidden = true;
    els.story.hidden = false;
    page = 0;
    renderPage();
  }
  function renderPage() {
    const p = STORY_PAGES[page];
    const text = fill(p.text);
    els.storyPic.textContent = p.pic;
    els.storyText.textContent = text;
    els.storyDots.innerHTML = STORY_PAGES.map((_, i) => `<span class="dot${i === page ? " on" : ""}"></span>`).join("");
    els.storyBack.hidden = page === 0;
    els.storyNext.textContent = page === STORY_PAGES.length - 1 ? "Follow the paw prints! 🐾" : "Next ▸";
    els.storyPic.classList.remove("pop");
    void els.storyPic.offsetWidth;
    els.storyPic.classList.add("pop");
    speak(text);
  }
  function storyNext() {
    if (page < STORY_PAGES.length - 1) { page++; renderPage(); return; }
    localStorage.setItem(STORY_SEEN_KEY, "yes");
    showMap();
  }

  // ---------- The map ----------

  function showMap() {
    Guru.close();
    els.story.hidden = true;
    els.names.hidden = true;
    els.scene.hidden = true;
    els.overlay.hidden = true;
    els.map.hidden = false;
    els.mapHero.textContent = names.avatar;
    els.mapTitle.textContent = fill("{hero} and the missing {rabbit}");
    // Story so far: the last thing that happened, so tomorrow picks up the thread.
    const lastDone = SCENES.filter((s) => done.has(s.id)).pop();
    els.mapSub.textContent = lastDone
      ? fill(`Last time: ${lastDone.after}`)
      : fill("A bear cub took {rabbit} up the mountain. Follow the paw prints!");
    els.mapAreas.innerHTML = "";
    AREAS.forEach((area, i) => {
      const unlocked = areaUnlocked(i);
      const list = scenesOf(area.id);
      const card = document.createElement("section");
      card.className = "area" + (unlocked ? "" : " locked") + (areaDone(area) ? " done" : "");
      card.innerHTML =
        `<div class="area-head">
           <span class="area-emoji">${area.emoji}</span>
           <div class="area-title"><h2>${area.title}</h2><p>${fill(area.blurb)}</p></div>
           <span class="area-belt" title="${area.belt} belt">${beltEmoji(area.belt)}</span>
         </div>
         <div class="prints"></div>`;
      const prints = card.querySelector(".prints");
      if (!list.length) {
        prints.innerHTML = `<p class="prints-soon">${unlocked ? "The trail continues soon…" : "🔒"}</p>`;
      }
      list.forEach((scene, j) => {
        const ok = sceneUnlocked(scene);
        const b = document.createElement("button");
        b.className = "print" + (done.has(scene.id) ? " done" : "") + (ok && !done.has(scene.id) ? " next" : "") + (ok ? "" : " locked");
        b.disabled = !ok;
        b.innerHTML = `<span class="print-paw">${done.has(scene.id) ? "🐾" : ok ? "👣" : "·"}</span><span class="print-label">${j + 1}. ${fill(scene.title)}</span>`;
        if (ok) b.addEventListener("click", () => openScene(scene.id));
        prints.appendChild(b);
      });
      els.mapAreas.appendChild(card);
    });
    renderTop();
  }

  // ---------- One scene ----------

  let current = null;   // { scene, area, mechanic, attempts, lastWrong, solvedNow }

  function companionSay(text) {
    els.companionText.textContent = text;
    speak(text);
  }

  function openScene(id) {
    const scene = SCENES.find((s) => s.id === id);
    if (!scene) return;
    const area = AREAS.find((a) => a.id === scene.area);
    localStorage.setItem(LAST_KEY, id);
    els.map.hidden = true;
    els.story.hidden = true;
    els.overlay.hidden = true;
    els.scene.hidden = false;
    els.nextBtn.hidden = true;
    resetHint();

    els.areaTag.textContent = `${area.emoji} ${area.title}`;
    els.sceneTitle.textContent = fill(scene.title);
    els.companionEmoji.textContent = area.companion.emoji;
    els.taskText.textContent = fill(scene.task);
    els.stage.innerHTML = "";

    current = { scene, area, attempts: 0, lastWrong: "", solvedNow: false, mechanic: null };
    const api = {
      names: { hero: names.hero, rabbit: names.rabbit, cub: CUB_NAME, avatar: names.avatar },
      fill, shuffle, wait, speak,
      solved: () => onSolved(),
      wrong: (vars) => onWrong(vars),
      cheer: (text) => companionSay(fill(text)),
    };
    const type = window.SCENE_TYPES[scene.type];
    current.mechanic = type.mount(scene, els.stage, api);

    const intro = fill(scene.before);
    els.companionText.textContent = intro;
    speak(intro + " " + fill(scene.task));

    Guru.setLevel("quest:" + scene.id, guruContext);
  }

  function onWrong(vars) {
    if (!current || current.solvedNow) return;
    current.attempts++;
    const msg = fill(current.scene.wrong, vars || {});
    current.lastWrong = msg;
    companionSay(msg);
    els.companionText.parentElement.classList.add("nudge");
    setTimeout(() => els.companionText.parentElement.classList.remove("nudge"), 400);
  }

  function onSolved() {
    if (!current || current.solvedNow) return;
    current.solvedNow = true;
    const { scene, area } = current;
    const first = !done.has(scene.id);
    if (first) {
      done.add(scene.id);
      progress.oranges += scene.reward || 1;
      saveProgress();
    }
    renderTop();
    companionSay(fill(scene.after) + (first ? ` You earned ${scene.reward || 1} 🍊!` : ""));
    burst();
    els.nextBtn.hidden = false;
    els.nextBtn.textContent = areaDone(area) && isLastInArea(scene) ? "See what you found →" : "Next →";
    els.nextBtn.focus();
  }
  function isLastInArea(scene) {
    const list = scenesOf(scene.area);
    return list[list.length - 1].id === scene.id;
  }

  function next() {
    if (!current) return showMap();
    const { scene, area } = current;
    const list = scenesOf(area.id);
    const idx = list.findIndex((s) => s.id === scene.id);
    const rest = list.slice(idx + 1).find((s) => !done.has(s.id));
    if (rest) return openScene(rest.id);
    if (areaDone(area) && isLastInArea(scene)) return showAreaDone(area);
    showMap();
  }

  function showAreaDone(area) {
    Guru.close();
    els.overlay.hidden = false;
    els.overlayTitle.textContent = `${area.emoji} ${area.title} — done!`;
    els.overlayClue.textContent = fill(area.clue);
    els.overlayBelt.textContent = `${beltEmoji(area.belt)} ${area.belt} belt earned!`;
    speak(fill(area.clue) + ` You earned your ${area.belt} belt!`);
    burst();
  }

  function burst() {
    els.confetti.innerHTML = "";
    const bits = ["🍊", "⭐", "🌼", "🐾", "💛"];
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("span");
      s.textContent = bits[i % bits.length];
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 0.3 + "s";
      s.style.fontSize = 18 + Math.random() * 18 + "px";
      els.confetti.appendChild(s);
    }
    els.confetti.hidden = false;
    setTimeout(() => { els.confetti.hidden = true; }, 1800);
  }

  // ---------- Hints and the guru ----------

  function resetHint() {
    els.hintBox.hidden = true;
    els.hintNudge.hidden = false;
    els.hintText.hidden = true;
  }
  function revealHint() {
    els.hintBox.hidden = false;
    els.hintNudge.hidden = true;
    els.hintText.hidden = false;
    const h = fill(current.scene.hint);
    els.hintText.textContent = "💡 " + h;
    speak(h);
  }

  // Everything Dronacharya needs about this exact moment (fresh each call).
  function guruContext() {
    const { scene, area, mechanic, attempts, lastWrong, solvedNow } = current;
    const m = mechanic || {};
    return {
      kind: "quest",
      level: {
        title: fill(scene.title), area: area.title, mechanic: scene.type, skill: scene.skills.join(" + "),
        story: fill(scene.before), task: fill(scene.task), hint: fill(scene.hint),
        solution: m.solution ? m.solution() : "", details: m.details ? m.details() : "",
        attempts, completed: done.has(scene.id) && !solvedNow,
      },
      state: m.state ? m.state() : "",
      report: solvedNow ? "SOLVED — she just got it!" : attempts === 0 ? "no wrong taps yet" : `${attempts} wrong tap(s); the last miss got this reply: "${lastWrong}"`,
    };
  }

  Guru.init({
    subtitle: "your quest guru",
    avatar: "../img/guru.svg",
    storagePrefix: "rainier-guru-",
    signinPlaceholder: "your name",
    stuckQuestion: "I'm stuck. Can you help me?",
    chips: { quest: ["🤔 I'm stuck", "🔍 What should I look at?", "🎯 Am I close?"] },
    chipQuestions: { "🤔 I'm stuck": "I'm stuck. Can you help me?", "🔍 What should I look at?": "What should I look at?" },
    greeting: (ctx, kid) => `Namaste${kid ? ", " + kid : ""}! 🙏 I'm Dronacharya. I don't give answers, I give clues. What's tricky?`,
    builders: { quest: (ctx) => ctx },
  });

  // ---------- Events ----------

  els.nextBtn.addEventListener("click", next);
  els.backBtn.addEventListener("click", showMap);
  els.mapBtn.addEventListener("click", showMap);
  els.storyBtn.addEventListener("click", showStory);
  els.storyNext.addEventListener("click", storyNext);
  els.storyBack.addEventListener("click", () => { if (page > 0) { page--; renderPage(); } });
  els.storySpeak.addEventListener("click", () => speak(els.storyText.textContent, true));
  els.overlayGo.addEventListener("click", showMap);
  els.sayAgain.addEventListener("click", () => speak(els.companionText.textContent));
  els.taskSpeak.addEventListener("click", () => speak(els.taskText.textContent));
  els.voiceBtn.addEventListener("click", () => setVoice(!voiceOn()));
  els.guruBtn.addEventListener("click", () => Guru.open());
  els.hintBtn.addEventListener("click", () => { els.hintBox.hidden = !els.hintBox.hidden; });
  els.hintAskGuru.addEventListener("click", () => { els.hintBox.hidden = true; Guru.open("I'm stuck. Can you help me?"); });
  els.hintReveal.addEventListener("click", revealHint);
  Guru.onHint(() => { Guru.close(); revealHint(); });
  $("namesEdit").addEventListener("click", showNames);
  els.resetBtn.addEventListener("click", () => {
    if (!confirm(fill("Start the whole quest over? All paw prints, oranges and belts will be erased."))) return;
    done.clear();
    progress = { done: [], oranges: 0 };
    saveProgress();
    Guru.resetChats();
    localStorage.removeItem(LAST_KEY);
    localStorage.removeItem(STORY_SEEN_KEY);
    showStory();
  });

  // ---------- Start ----------

  setVoice(voiceOn());
  if (!Guru.speech.canSpeak) els.voiceBtn.hidden = true;
  if (!names) showNames();
  else if (!localStorage.getItem(STORY_SEEN_KEY)) { renderTop(); showStory(); }
  else { renderTop(); showMap(); }
})();
