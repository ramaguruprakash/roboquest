"use strict";

// RoboQuest app: level flow, world rendering, animation, progress.

(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    tocBtn: $("tocBtn"),
    bookBtn: $("bookBtn"),
    starTally: $("starTally"),
    tocOverlay: $("tocOverlay"),
    tocBody: $("tocBody"),
    tocClose: $("tocClose"),
    bookScreen: $("bookScreen"),
    bookBody: $("bookBody"),
    bookBack: $("bookBack"),
    conceptBadge: $("conceptBadge"),
    levelTitle: $("levelTitle"),
    intro: $("intro"),
    rules: $("rules"),
    hintBox: $("hintBox"),
    hintText: $("hintText"),
    commandList: $("commandList"),
    checksNote: $("checksNote"),
    board: $("board"),
    worldTabs: $("worldTabs"),
    grid: $("grid"),
    robot: $("robot"),
    dirArrow: $("dirArrow"),
    gemCount: $("gemCount"),
    packBar: $("packBar"),
    packGems: $("packGems"),
    speech: $("speech"),
    speechText: $("speechText"),
    editor: $("editor"),
    lineInfo: $("lineInfo"),
    runBtn: $("runBtn"),
    resetBtn: $("resetBtn"),
    speed: $("speed"),
    winOverlay: $("winOverlay"),
    winSub: $("winSub"),
    confetti: $("confetti"),
    nextBtn: $("nextBtn"),
    replayBtn: $("replayBtn"),
    resetProgressBtn: $("resetProgressBtn"),
    homeScreen: $("homeScreen"),
    homeBtn: $("homeBtn"),
    startBtn: $("startBtn"),
    demoCode: $("demoCode"),
    demoStrip: $("demoStrip"),
  };

  const PROGRESS_KEY = "roboquest-progress";
  const LAST_LEVEL_KEY = "roboquest-last-level";
  const CODE_KEY = (id) => "roboquest-code-" + id;

  let current = 0; // level index
  let animTimer = null;
  let nextWorldTimer = null; // pause between worlds in a multi-world run
  let viewWorld = 0; // which of the level's worlds the board shows
  let worldStatus = []; // per world: "pending" | "running" | "pass" | "fail"
  let completed = loadProgress();

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]");
      // Drop ids of levels that no longer exist (the ladder evolves between visits).
      return new Set(saved.filter((id) => LEVELS.some((lv) => lv.id === id)));
    } catch {
      return new Set();
    }
  }
  function saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completed]));
  }
  // The main quest is the non-practice levels; side quests (practice: true) sit off-path.
  function mainLevels() {
    return LEVELS.filter((lv) => !lv.practice);
  }

  // Arenas are independent quests: each one unlocks from its own first level,
  // counts its own stars, and numbers its own levels.
  function arenaOf(lv) {
    return (chapterOf(lv.id) || {}).arena || 1;
  }
  function arenaMains(n) {
    return mainLevels().filter((lv) => arenaOf(lv) === n);
  }

  // Every level is open — kids explore freely; stars still track what's done.
  function isUnlocked() {
    return true;
  }

  // Where "Next level" goes: main quest skips side quests; a side quest chains
  // through its own pack, then ends (-1 = no next; the overlay hides the button).
  function nextIndex(idx) {
    const lv = LEVELS[idx];
    const ch = chapterOf(lv.id);
    for (let i = idx + 1; i < LEVELS.length; i++) {
      if (!lv.practice && !LEVELS[i].practice) return i;
      if (lv.practice && LEVELS[i].practice && chapterOf(LEVELS[i].id) === ch) return i;
    }
    return -1;
  }

  // ---------- Table of contents & handbook ----------

  // The tally shows the CURRENT level's arena — each arena counts its own stars.
  function updateStarTally() {
    const n = arenaOf(level());
    const mains = arenaMains(n);
    const mainDone = mains.filter((l) => completed.has(l.id)).length;
    const questDone = LEVELS.filter((l) => l.practice && arenaOf(l) === n && completed.has(l.id)).length;
    els.starTally.textContent =
      `Arena ${n} · ⭐ ${mainDone} / ${mains.length}` + (questDone ? ` · 🌟 ${questDone}` : "");
  }

  function chapterOf(levelId) {
    return CHAPTERS.find((c) => levelId.startsWith(c.prefix + "-"));
  }

  function tocRow(i, label, doneMark) {
    const lv = LEVELS[i];
    const done = completed.has(lv.id);
    const unlocked = isUnlocked(i);
    const row = document.createElement("button");
    row.className = "toc-level" + (lv.practice ? " practice" : "");
    if (done) row.classList.add("done");
    if (i === current) row.classList.add("current");
    row.disabled = !unlocked;
    row.innerHTML =
      `<span class="toc-mark">${done ? doneMark : unlocked ? "▶" : "🔒"}</span>` +
      (label ? `<span class="toc-num">${label}</span> ` : "") +
      ESC(lv.title);
    row.title = unlocked
      ? lv.title
      : lv.practice
        ? "Finish this chapter's levels to open its side quests!"
        : "Finish the level before this one to unlock!";
    row.addEventListener("click", () => {
      els.tocOverlay.hidden = true;
      loadLevel(i);
    });
    return row;
  }

  function renderToc() {
    els.tocBody.innerHTML = "";
    for (const arena of ARENAS) {
      const chapters = CHAPTERS.filter((c) => (c.arena || 1) === arena.n);
      if (!chapters.length) continue;
      const mains = arenaMains(arena.n);
      const done = mains.filter((l) => completed.has(l.id)).length;
      const head = document.createElement("div");
      head.className = "toc-arena";
      head.innerHTML =
        `<h2>🏟️ ${ESC(arena.title)} <span class="toc-progress">⭐ ${done} / ${mains.length}</span></h2>` +
        `<p class="toc-blurb">${ESC(arena.blurb)}</p>`;
      els.tocBody.appendChild(head);
      renderTocChapters(chapters);
    }
    // Robo's Web Studio lives below the arenas — a different place, not "Arena 4".
    if (typeof WebStudio !== "undefined") {
      els.tocBody.appendChild(WebStudio.tocSection(() => { els.tocOverlay.hidden = true; }));
    }
  }

  function renderTocChapters(chapters) {
    for (const chapter of chapters) {
      const idxs = LEVELS.map((lv, i) => i).filter((i) => chapterOf(LEVELS[i].id) === chapter);
      if (!idxs.length) continue;
      const mainIdxs = idxs.filter((i) => !LEVELS[i].practice);
      const questIdxs = idxs.filter((i) => LEVELS[i].practice);
      const doneCount = mainIdxs.filter((i) => completed.has(LEVELS[i].id)).length;
      const questDone = questIdxs.filter((i) => completed.has(LEVELS[i].id)).length;

      const section = document.createElement("section");
      section.className = "toc-chapter";
      section.innerHTML =
        `<h3>${chapter.emoji} ${ESC(chapter.title)} ` +
        `<span class="toc-progress">${doneCount} / ${mainIdxs.length}` +
        (questIdxs.length ? ` · 🌟 ${questDone} / ${questIdxs.length}` : "") +
        `</span></h3>` +
        `<p class="toc-blurb">${ESC(chapter.blurb)}</p>`;

      const list = document.createElement("div");
      list.className = "toc-levels";
      for (const i of mainIdxs) {
        const lv = LEVELS[i];
        list.appendChild(tocRow(i, `${arenaMains(arenaOf(lv)).indexOf(lv) + 1}.`, "⭐"));
      }
      if (questIdxs.length) {
        const label = document.createElement("p");
        label.className = "toc-quest-label";
        label.textContent = "🌟 Side quests — just for fun!";
        list.appendChild(label);
        for (const i of questIdxs) list.appendChild(tocRow(i, "", "🌟"));
      }
      section.appendChild(list);
      els.tocBody.appendChild(section);
    }
  }

  // ---------- Robo's Spellbook ----------
  // A full-page handbook. Each page runs its example through the REAL interpreter
  // in a tiny demo world and animates the steps with the active code line lit up.

  const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SPELL_ROT = { N: -90, E: 0, S: 90, W: 180 };
  let spellDemos = []; // { root, grid, code, world, example, frames, i, timer }
  let spellObserver = null;

  function commandLearned(cmd) {
    return LEVELS.some((lv, i) => (lv.newCommands || []).includes(cmd) && isUnlocked(i));
  }
  function commandChapter(cmd) {
    const lv = LEVELS.find((l) => (l.newCommands || []).includes(cmd));
    return lv ? chapterOf(lv.id) : null;
  }

  function spellFrameHTML(w, f) {
    const wallSet = new Set((w.walls || []).map(([x, y]) => x + "," + y));
    const targetMap = new Map((w.target || []).map(([x, y, ch]) => [x + "," + y, ch || "⭐"]));
    const gemColors = new Map((w.gems || []).map((g) => [g[0] + "," + g[1], g[2] || "plain"]));
    const deliveryMap = new Map((w.deliveries || []).map(([x, y, c]) => [x + "," + y, c || null]));
    const gemSet = new Set(f.gems);
    const droppedMap = new Map(f.dropped);
    const placedMap = new Map(f.placed || []);
    let html = "";
    for (let y = 0; y < w.rows; y++) {
      for (let x = 0; x < w.cols; x++) {
        const key = x + "," + y;
        let inner = "";
        if (wallSet.has(key)) inner = "🧱";
        else if (placedMap.has(key)) inner = `<span class="stamp">${GEM_ICON[placedMap.get(key)]}</span>`;
        else if (droppedMap.has(key)) inner = `<span class="stamp">${ESC(droppedMap.get(key))}</span>`;
        else if (gemSet.has(key)) inner = GEM_ICON[gemColors.get(key) || "plain"];
        else if (w.goal && w.goal.x === x && w.goal.y === y) inner = "🏁";
        else if (targetMap.has(key)) inner = `<span class="ghost stamp">${ESC(targetMap.get(key))}</span>`;
        else if (deliveryMap.has(key)) inner = `<span class="ghost stamp">${deliveryMap.get(key) ? GEM_ICON[deliveryMap.get(key)] : "📦"}</span>`;
        if (f.x === x && f.y === y) {
          inner = `🤖<span class="spell-dir" style="transform: rotate(${SPELL_ROT[f.dir]}deg)">➤</span>`;
        }
        html += `<div class="spell-cell">${inner}</div>`;
      }
    }
    return html;
  }

  function spellCodeHTML(example, activeLine) {
    return example
      .split("\n")
      .map((l, i) => `<span class="demo-line${i + 1 === activeLine ? " active" : ""}">${ESC(l) || " "}</span>`)
      .join("");
  }

  function drawSpellFrame(d) {
    const f = d.frames[Math.min(d.i, d.frames.length - 1)];
    d.grid.innerHTML = spellFrameHTML(d.world, f);
    d.code.innerHTML = spellCodeHTML(d.example, f.lineNo || null);
  }

  function startSpellDemo(d) {
    if (d.timer || REDUCED_MOTION) return;
    d.timer = setInterval(() => {
      d.i = (d.i + 1) % (d.frames.length + 2); // 2 extra beats to admire the finish
      drawSpellFrame(d);
    }, 700);
  }
  function stopSpellDemo(d) {
    if (d.timer) {
      clearInterval(d.timer);
      d.timer = null;
    }
  }

  function renderBook() {
    hideBookDemos();
    els.bookBody.innerHTML = "";
    spellObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const d = spellDemos.find((d) => d.root === e.target);
          if (d) e.isIntersecting ? startSpellDemo(d) : stopSpellDemo(d);
        }
      },
      { root: els.bookScreen, threshold: 0.25 }
    );

    for (const page of HANDBOOK) {
      const sec = document.createElement("section");
      const learned = !page.cmd || commandLearned(page.cmd);
      sec.className = "home-card spell-page" + (learned ? "" : " locked");

      if (!learned) {
        const ch = commandChapter(page.cmd);
        sec.innerHTML =
          `<h3><code>${ESC(page.syntax)}</code></h3>` +
          `<p class="spell-tease">✨ A spell you haven't learned yet — it appears in the ` +
          `<b>${ESC(ch ? ch.title : "?")}</b> chapter. Keep playing!</p>`;
        els.bookBody.appendChild(sec);
        continue;
      }

      sec.innerHTML =
        `<h3><code>${ESC(page.syntax)}</code></h3>` +
        `<p>${ESC(page.explain)}</p>`;

      if (page.demo) {
        const w = page.demo;
        const demoBox = document.createElement("div");
        demoBox.className = "spell-demo";
        demoBox.innerHTML =
          `<pre class="book-example spell-code"></pre>` +
          `<div class="spell-grid" style="grid-template-columns: repeat(${w.cols}, var(--spell-cell))"></div>`;
        sec.appendChild(demoBox);

        const initial = {
          x: w.robot.x, y: w.robot.y, dir: w.robot.dir,
          gems: (w.gems || []).map((g) => g[0] + "," + g[1]),
          dropped: [], placed: [], pack: [], lineNo: null,
        };
        const result = Robo.run(Robo.parse(page.example), w);
        const d = {
          root: demoBox,
          grid: demoBox.querySelector(".spell-grid"),
          code: demoBox.querySelector(".spell-code"),
          world: w,
          example: page.example,
          frames: [initial, ...result.steps],
          i: 0,
          timer: null,
        };
        // Reduced motion: show the finished picture instead of animating.
        if (REDUCED_MOTION) d.i = d.frames.length - 1;
        drawSpellFrame(d);
        spellDemos.push(d);
        spellObserver.observe(demoBox);
      }

      const note = document.createElement("p");
      note.className = "book-note";
      note.textContent = "↳ " + page.exampleNote;
      sec.appendChild(note);
      els.bookBody.appendChild(sec);
    }
  }

  function hideBookDemos() {
    for (const d of spellDemos) stopSpellDemo(d);
    spellDemos = [];
    if (spellObserver) {
      spellObserver.disconnect();
      spellObserver = null;
    }
  }

  function showBook() {
    renderBook(); // rebuilt each open — unlock states change as the kid plays
    els.bookScreen.hidden = false;
    els.bookScreen.scrollTop = 0;
  }
  function hideBook() {
    els.bookScreen.hidden = true;
    hideBookDemos();
    els.bookBody.innerHTML = "";
  }

  // ---------- World rendering ----------

  const ARROW_ROT = { N: -90, E: 0, S: 90, W: 180 };
  // Arrow badge sits at the edge of the robot's tile, pointing the way Robo faces.
  const ARROW_POS = {
    N: "top: -2px; left: 50%; margin-left: -0.5em;",
    E: "top: 50%; right: -2px; margin-top: -0.6em;",
    S: "bottom: -2px; left: 50%; margin-left: -0.5em;",
    W: "top: 50%; left: -2px; margin-top: -0.6em;",
  };

  function level() {
    return LEVELS[current];
  }

  // A level has one world, or several (`worlds`) that ONE program must beat in turn.
  function worldsOf(lv) {
    return lv.worlds || [lv.world];
  }
  function world() {
    return worldsOf(level())[viewWorld];
  }
  function worldName(i) {
    return `${level().worldLabel || "World"} ${i + 1}`;
  }

  function renderWorldTabs() {
    const ws = worldsOf(level());
    els.worldTabs.hidden = ws.length < 2;
    els.worldTabs.innerHTML = "";
    if (ws.length < 2) return;
    const MARKS = { pending: "○", running: "▶", pass: "✓", fail: "✗" };
    ws.forEach((w, i) => {
      const tab = document.createElement("button");
      const status = worldStatus[i] || "pending";
      tab.className = "world-tab " + status;
      if (i === viewWorld) tab.classList.add("active");
      tab.innerHTML = `<span class="tab-mark">${MARKS[status]}</span> ${ESC(worldName(i))}`;
      tab.title = "Peek at " + worldName(i);
      tab.addEventListener("click", () => {
        if (animTimer || nextWorldTimer) return; // no switching mid-run
        viewWorld = i;
        renderWorldTabs();
        renderInitialWorld();
      });
      els.worldTabs.appendChild(tab);
    });
  }

  function cellSize() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cell"));
  }

  // Gems can be colored: [x, y, "red"]. Plain gems are 💎.
  const GEM_ICON = { plain: "💎", red: "🔴", blue: "🔵", green: "🟢", yellow: "🟡" };

  function renderGrid(gems, dropped, placed) {
    const w = world();
    const wallSet = new Set((w.walls || []).map(([x, y]) => x + "," + y));
    // Target cells are [x, y] (a star) or [x, y, char] (stamp that character).
    const targetMap = new Map((w.target || []).map(([x, y, ch]) => [x + "," + y, ch || "⭐"]));
    const gemColors = new Map((w.gems || []).map((g) => [g[0] + "," + g[1], g[2] || "plain"]));
    // Delivery squares want a gem: [x, y] (any gem) or [x, y, "red"] (that color).
    const deliveryMap = new Map((w.deliveries || []).map(([x, y, c]) => [x + "," + y, c || null]));
    const gemSet = new Set(gems);
    const droppedMap = new Map(dropped || []);
    const placedMap = new Map(placed || []);
    els.grid.style.gridTemplateColumns = `repeat(${w.cols}, var(--cell))`;
    els.grid.innerHTML = "";
    for (let y = 0; y < w.rows; y++) {
      for (let x = 0; x < w.cols; x++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.title = `column ${x}, row ${y}`; // hover aid for goto's coordinates
        const key = x + "," + y;
        if (wallSet.has(key)) {
          cell.classList.add("wall");
          cell.textContent = "🧱";
        } else if (placedMap.has(key)) {
          const color = placedMap.get(key);
          const want = deliveryMap.get(key);
          const good = deliveryMap.has(key) && (!want || want === color);
          cell.classList.add(good ? "dropped" : "misplaced");
          cell.innerHTML = `<span class="stamp">${GEM_ICON[color]}</span>`;
        } else if (droppedMap.has(key)) {
          const ch = droppedMap.get(key);
          cell.classList.add(targetMap.get(key) === ch ? "dropped" : "misplaced");
          cell.innerHTML = `<span class="stamp">${ESC(ch)}</span>`;
        } else if (gemSet.has(key)) {
          cell.textContent = GEM_ICON[gemColors.get(key) || "plain"];
        } else if (w.goal && w.goal.x === x && w.goal.y === y) {
          cell.classList.add("goal");
          cell.textContent = "🏁";
        } else if (targetMap.has(key)) {
          cell.classList.add("target");
          cell.innerHTML = `<span class="ghost stamp">${ESC(targetMap.get(key))}</span>`;
        } else if (deliveryMap.has(key)) {
          const want = deliveryMap.get(key);
          cell.classList.add("target");
          cell.innerHTML = `<span class="ghost stamp">${want ? GEM_ICON[want] : ESC(level().deliverEmoji || "📦")}</span>`;
        }
        els.grid.appendChild(cell);
      }
    }
  }

  function placeRobot(x, y, dir) {
    const size = cellSize() + 3; // cell + grid gap
    els.robot.style.transform = `translate(${x * size}px, ${y * size}px)`;
    els.dirArrow.style.cssText = ARROW_POS[dir] + `transform: rotate(${ARROW_ROT[dir]}deg);`;
  }

  function renderStatus(gemsLeft, totalGems, droppedCount, placedCount) {
    const w = world();
    const parts = [];
    if (totalGems > 0) parts.push(`💎 ${totalGems - gemsLeft} / ${totalGems} gems`);
    if (w.target) {
      const allStars = w.target.every((t) => !t[2] || t[2] === "⭐");
      parts.push(`${allStars ? "⭐" : "🖋️"} ${droppedCount} / ${w.target.length} ${allStars ? "stars placed" : "squares stamped"}`);
    }
    if (w.deliveries) {
      parts.push(`${level().deliverEmoji || "📦"} ${placedCount || 0} / ${w.deliveries.length} delivered`);
    }
    els.gemCount.textContent = parts.join("   ");
  }

  // The backpack strip under the board — the kid literally watches the array grow.
  function renderPack(pack) {
    els.packBar.hidden = !level().showPack;
    if (els.packBar.hidden) return;
    els.packGems.innerHTML = pack.length
      ? pack.map((c) => `<span class="pack-gem">${GEM_ICON[c]}</span>`).join("")
      : `<span class="pack-empty">empty</span>`;
  }

  function renderInitialWorld() {
    const w = world();
    const gems = (w.gems || []).map(([x, y]) => x + "," + y);
    renderGrid(gems, [], []);
    els.robot.className = "robot";
    placeRobot(w.robot.x, w.robot.y, w.robot.dir);
    renderStatus(gems.length, gems.length, 0, 0);
    renderPack([]);
  }

  // ---------- Speech bubble ----------

  function say(text, mood) {
    els.speech.className = "speech" + (mood ? " " + mood : "");
    els.speechText.innerHTML = text;
  }

  const ESC = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // ---------- Level loading ----------

  function cumulativeCommands(idx) {
    const seen = [];
    for (let i = 0; i <= idx; i++) {
      for (const c of LEVELS[i].newCommands || []) {
        if (!seen.includes(c)) seen.push(c);
      }
    }
    return seen;
  }

  function renderCommandRef() {
    const cmds = cumulativeCommands(current);
    const fresh = new Set(level().newCommands || []);
    els.commandList.innerHTML = "";
    for (const c of cmds) {
      const doc = COMMAND_DOCS[c];
      const dt = document.createElement("dt");
      dt.textContent = doc.syntax;
      if (fresh.has(c)) dt.classList.add("new-word");
      const dd = document.createElement("dd");
      dd.textContent = doc.desc;
      els.commandList.appendChild(dt);
      els.commandList.appendChild(dd);
    }
    // Show the conditions cheat-sheet once "if" is known; backpack checks join in arena 3.
    els.checksNote.innerHTML = cmds.includes("if")
      ? CHECKS_NOTE + (arenaOf(level()) >= 3 ? "<br>" + PACK_CHECKS_NOTE : "")
      : "";
  }

  function renderRules() {
    const lv = level();
    const parts = [];
    if (lv.maxLines) parts.push(`<span class="rule">📏 Use at most <b>${lv.maxLines}</b> lines</span>`);
    for (const kw of lv.mustUse || []) parts.push(`<span class="rule">✏️ Must use <b>${ESC(kw)}</b></span>`);
    els.rules.innerHTML = parts.length ? "Level rules: " + parts.join("") : "";
  }

  function loadLevel(idx) {
    stopAnimation();
    current = idx;
    const lv = level();
    localStorage.setItem(LAST_LEVEL_KEY, lv.id);
    els.conceptBadge.textContent = `${lv.conceptEmoji} ${lv.concept}`;
    els.levelTitle.textContent = lv.practice
      ? `🌟 ${lv.title}`
      : `${arenaMains(arenaOf(lv)).indexOf(lv) + 1}. ${lv.title}`;
    els.intro.innerHTML = lv.intro;
    els.hintText.textContent = lv.hint;
    els.hintBox.open = false;
    renderRules();
    renderCommandRef();
    els.editor.value = localStorage.getItem(CODE_KEY(lv.id)) || "";
    updateLineInfo();
    viewWorld = 0;
    worldStatus = worldsOf(lv).map(() => "pending");
    renderWorldTabs();
    renderInitialWorld();
    updateStarTally();
    els.winOverlay.hidden = true;
    say(idx === 0
      ? "Hi, I'm Robo! Type instructions on the right, then press <b>▶ Run</b>."
      : "Ready when you are! Press <b>▶ Run</b> to try your program.");
    els.editor.focus();
  }

  // ---------- Line counting ----------

  function updateLineInfo() {
    const n = Robo.countCodeLines(els.editor.value);
    const max = level().maxLines;
    els.lineInfo.textContent = max ? `${n} / ${max} lines` : `${n} line${n === 1 ? "" : "s"}`;
    els.lineInfo.classList.toggle("over", !!max && n > max);
  }

  // ---------- Running ----------

  function stopAnimation() {
    if (animTimer) {
      clearInterval(animTimer);
      animTimer = null;
    }
    if (nextWorldTimer) {
      clearTimeout(nextWorldTimer);
      nextWorldTimer = null;
    }
    els.runBtn.disabled = false;
  }

  function run() {
    stopAnimation();
    const lv = level();
    const code = els.editor.value;

    if (!code.trim()) {
      say("My program is empty! Type some instructions first. 📝", "sad");
      return;
    }

    // Level rules first — clear teaching signals, checked before running.
    const lineCount = Robo.countCodeLines(code);
    if (lv.maxLines && lineCount > lv.maxLines) {
      say(`This level allows at most <b>${lv.maxLines}</b> lines and you have <b>${lineCount}</b>. A loop can shrink your program!`, "sad");
      return;
    }
    for (const kw of lv.mustUse || []) {
      if (!new RegExp("\\b" + kw + "\\b").test(code)) {
        say(`This level's rule: your program must use <code>${ESC(kw)}</code>. Give it a try!`, "sad");
        return;
      }
    }

    let program;
    try {
      program = Robo.parse(code);
    } catch (e) {
      if (!e.friendly) throw e;
      say(`${ESC(e.message)}<br><small>(line ${e.lineNo})</small>`, "sad");
      return;
    }

    worldStatus = worldsOf(lv).map(() => "pending");
    runWorld(program, 0);
  }

  // Run the program on world i, animate it, then judge — and move on to world i+1.
  function runWorld(program, i) {
    viewWorld = i;
    worldStatus[i] = "running";
    renderWorldTabs();
    const result = Robo.run(program, world());
    animate(result, () => afterWorld(program, result));
  }

  function afterWorld(program, result) {
    const lv = level();
    const ws = worldsOf(lv);
    const multi = ws.length > 1;
    const verdict = judge(result, world());

    if (!verdict.ok) {
      worldStatus[viewWorld] = "fail";
      renderWorldTabs();
      const prefix = multi && viewWorld > 0
        ? `That worked in ${ESC(worldName(viewWorld - 1))}… but here in ${ESC(worldName(viewWorld))}: `
        : "";
      const reminder = multi && viewWorld === 0
        ? ` <br><small>Remember — one program must work in ALL ${ws.length} of them!</small>`
        : "";
      say(prefix + verdict.msg + reminder, "sad");
      return;
    }

    worldStatus[viewWorld] = "pass";
    renderWorldTabs();
    if (multi && viewWorld < ws.length - 1) {
      say(`${ESC(worldName(viewWorld))} — done! ✓ Same program, next one… 🏃`);
      nextWorldTimer = setTimeout(() => {
        nextWorldTimer = null;
        runWorld(program, viewWorld + 1);
      }, 900);
      return;
    }
    win();
  }

  function animate(result, onDone) {
    const totalGems = (world().gems || []).length;
    renderInitialWorld();
    say("Here I go! 🏃");
    els.runBtn.disabled = true;

    const frames = result.steps;
    let i = 0;
    const tick = () => {
      if (i >= frames.length) {
        stopAnimation();
        onDone();
        return;
      }
      const f = frames[i++];
      placeRobot(f.x, f.y, f.dir);
      if (f.action === "pickup" || f.action === "drop" || f.action === "dropgem") {
        renderGrid(f.gems, f.dropped, f.placed);
        renderStatus(f.gems.length, totalGems, f.dropped.length, f.placed.length);
        renderPack(f.pack);
      } else if (f.action === "crash") {
        els.robot.classList.add("crash");
      } else if (f.action === "goto") {
        els.robot.classList.remove("hop");
        void els.robot.offsetWidth; // restart the animation for back-to-back hops
        els.robot.classList.add("hop");
      } else if (f.action === "set" && f.say) {
        say(`📦 Remembering: <code>${ESC(f.say)}</code>`);
      }
    };
    // Show the starting position for a beat, then step.
    animTimer = setInterval(tick, Number(els.speed.value));
  }

  // Did the program beat this world? Returns { ok, msg } — msg explains the miss.
  function judge(result, w) {
    const fin = result.final;

    if (result.error) {
      return { ok: false, msg: `${ESC(result.error.message)}<br><small>(line ${result.error.lineNo})</small>` };
    }

    const atGoal = !w.goal || (fin.x === w.goal.x && fin.y === w.goal.y);
    const allGems = fin.gems.length === 0;
    const target = w.target;
    let misplaced = 0, wrong = 0, missing = 0;
    if (target) {
      const targetMap = new Map(target.map(([x, y, ch]) => [x + "," + y, ch || "⭐"]));
      const droppedMap = new Map(fin.dropped);
      misplaced = [...droppedMap.keys()].filter((k) => !targetMap.has(k)).length;
      wrong = [...droppedMap].filter(([k, ch]) => targetMap.has(k) && targetMap.get(k) !== ch).length;
      missing = [...targetMap.keys()].filter((k) => !droppedMap.has(k)).length;
    }

    if (target && misplaced > 0) {
      return { ok: false, msg: `Hmm — ${misplaced} stamp${misplaced === 1 ? " is" : "s are"} outside the picture. Stamps only go on the dotted squares!` };
    }
    if (target && wrong > 0) {
      return { ok: false, msg: `So close — ${wrong} square${wrong === 1 ? " has" : "s have"} the wrong stamp. The faded hints show what goes where!` };
    }
    if (target && missing > 0) {
      return { ok: false, msg: `Looking good, but the picture isn't finished — ${missing} dotted square${missing === 1 ? "" : "s"} still need${missing === 1 ? "s" : ""} a stamp. ✨` };
    }
    // Levels can override the miss messages with a playful nudge (trick levels do).
    const lv = level();
    const failMsg = lv.failMsg || {};
    // Deliveries: every marked square needs a gem of the right color — and
    // gems set down anywhere else are litter.
    if (w.deliveries) {
      const emoji = lv.deliverEmoji || "📦";
      const deliveryMap = new Map(w.deliveries.map(([x, y, c]) => [x + "," + y, c || null]));
      const placedMap = new Map(fin.placed);
      const litter = [...placedMap.keys()].filter((k) => !deliveryMap.has(k)).length;
      const wrongColor = [...deliveryMap].filter(([k, c]) => placedMap.has(k) && c && placedMap.get(k) !== c).length;
      const waiting = [...deliveryMap.keys()].filter((k) => !placedMap.has(k)).length;
      if (litter > 0) {
        return { ok: false, msg: failMsg.deliver || `I set ${litter === 1 ? "a gem" : litter + " gems"} down where nobody needs ${litter === 1 ? "it" : "them"}! Gems only go on the ${emoji} squares.` };
      }
      if (wrongColor > 0) {
        return { ok: false, msg: failMsg.deliver || `${wrongColor} spot${wrongColor === 1 ? " got" : "s got"} the wrong color gem! Remember: the LAST gem in is the FIRST one out. 🔄` };
      }
      if (waiting > 0) {
        return { ok: false, msg: failMsg.deliver || `${waiting} ${emoji} square${waiting === 1 ? " is" : "s are"} still waiting for a gem!` };
      }
    }
    if (lv.requirePack != null && fin.pack.length !== lv.requirePack) {
      return { ok: false, msg: failMsg.pack || `My backpack holds ${fin.pack.length} gem${fin.pack.length === 1 ? "" : "s"} — this level needs exactly ${lv.requirePack}. 🎒` };
    }
    if (!atGoal) {
      return { ok: false, msg: failMsg.goal || "The program finished, but I'm not on the flag 🏁 yet. Almost there — try again!" };
    }
    if (!allGems && !lv.gemsOptional) {
      return { ok: false, msg: failMsg.gems || `I made it to the flag, but ${fin.gems.length} gem${fin.gems.length === 1 ? " is" : "s are"} still out there! 💎 Grab them all.` };
    }
    return { ok: true };
  }

  function win() {
    const lv = level();
    els.robot.classList.add("celebrate");
    say(worldsOf(lv).length > 1
      ? "ONE program — and it worked in every single one! You're a great programmer! 🎉"
      : "I did it! You're a great programmer! 🎉", "happy");
    const firstTime = !completed.has(lv.id);
    completed.add(lv.id);
    saveProgress();
    updateStarTally();

    const mains = mainLevels();
    const isFinale = lv.id === mains[mains.length - 1].id;
    const arenaN = (chapterOf(lv.id) || {}).arena || 1;
    const arenaMains = mains.filter((l) => ((chapterOf(l.id) || {}).arena || 1) === arenaN);
    const isArenaFinale = !lv.practice && lv.id === arenaMains[arenaMains.length - 1].id;
    els.winSub.textContent = isFinale
      ? "You conquered EVERY arena. You're officially a legendary coder! 🏆🐉"
      : isArenaFinale
        ? `ARENA ${arenaN} COMPLETE! 🏟️ A whole new arena of puzzles just opened…`
        : lv.practice
        ? (firstTime ? "Side quest complete! Extra adventures make extra-good coders. 🌟" : "Solved it again — nice!")
        : firstTime
          ? `You taught Robo about ${lv.concept.toLowerCase()}!`
          : "Solved it again — nice!";
    els.nextBtn.hidden = nextIndex(current) === -1;
    spawnConfetti();
    els.winOverlay.hidden = false;
    els.nextBtn.focus();
  }

  function spawnConfetti() {
    const pieces = ["🎉", "⭐", "💎", "🎈", "✨"];
    els.confetti.innerHTML = "";
    for (let k = 0; k < 14; k++) {
      const s = document.createElement("span");
      s.textContent = pieces[k % pieces.length];
      s.style.left = (k / 14) * 100 + "%";
      s.style.animationDelay = (k * 0.13) % 1.6 + "s";
      els.confetti.appendChild(s);
    }
  }

  // ---------- Home screen ----------

  const HOME_SEEN_KEY = "roboquest-seen-home";
  const DEMO_PROGRAM = ["move", "move", "pickup", "move", "move"];
  // Robo walks a 5-cell strip: gem on cell 2, flag on cell 4.
  const DEMO_FRAMES = [
    { line: -1, pos: 0, gem: true },
    { line: 0, pos: 1, gem: true },
    { line: 1, pos: 2, gem: true },
    { line: 2, pos: 2, gem: false },
    { line: 3, pos: 3, gem: false },
    { line: 4, pos: 4, gem: false },
  ];
  let demoTimer = null;
  let demoIdx = 0;

  function renderDemoFrame(f) {
    els.demoCode.innerHTML = DEMO_PROGRAM
      .map((l, i) => `<span class="demo-line${i === f.line ? " active" : ""}">${l}</span>`)
      .join("");
    els.demoStrip.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      const cell = document.createElement("div");
      cell.className = "demo-cell";
      if (i === f.pos) cell.textContent = "🤖";
      else if (i === 2 && f.gem) cell.textContent = "💎";
      else if (i === 4) cell.textContent = "🏁";
      els.demoStrip.appendChild(cell);
    }
  }

  function showHome() {
    els.homeScreen.hidden = false;
    demoIdx = 0;
    renderDemoFrame(DEMO_FRAMES[0]);
    if (demoTimer) clearInterval(demoTimer);
    demoTimer = setInterval(() => {
      demoIdx = (demoIdx + 1) % (DEMO_FRAMES.length + 2); // 2 extra beats to admire the finish
      renderDemoFrame(DEMO_FRAMES[Math.min(demoIdx, DEMO_FRAMES.length - 1)]);
    }, 900);
  }

  function hideHome() {
    els.homeScreen.hidden = true;
    if (demoTimer) {
      clearInterval(demoTimer);
      demoTimer = null;
    }
    localStorage.setItem(HOME_SEEN_KEY, "yes");
  }

  els.homeBtn.addEventListener("click", showHome);
  els.startBtn.addEventListener("click", () => {
    hideHome();
    els.editor.focus();
  });

  // ---------- Events ----------

  els.runBtn.addEventListener("click", run);
  els.resetBtn.addEventListener("click", () => {
    stopAnimation();
    worldStatus = worldsOf(level()).map(() => "pending");
    renderWorldTabs();
    renderInitialWorld();
    say("Back to the start. Ready!");
  });

  els.editor.addEventListener("input", () => {
    localStorage.setItem(CODE_KEY(level().id), els.editor.value);
    updateLineInfo();
  });
  els.editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end, value } = els.editor;
      els.editor.value = value.slice(0, s) + "  " + value.slice(end);
      els.editor.selectionStart = els.editor.selectionEnd = s + 2;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    }
  });

  els.nextBtn.addEventListener("click", () => {
    els.winOverlay.hidden = true;
    const next = nextIndex(current);
    if (next !== -1) loadLevel(next);
  });
  els.replayBtn.addEventListener("click", () => {
    els.winOverlay.hidden = true;
    viewWorld = 0;
    worldStatus = worldsOf(level()).map(() => "pending");
    renderWorldTabs();
    renderInitialWorld();
    say("Back to the start. Ready!");
  });

  els.tocBtn.addEventListener("click", () => {
    renderToc();
    els.tocOverlay.hidden = false;
  });
  els.tocClose.addEventListener("click", () => { els.tocOverlay.hidden = true; });
  els.bookBtn.addEventListener("click", showBook);
  els.bookBack.addEventListener("click", hideBook);
  els.tocOverlay.addEventListener("click", (e) => {
    if (e.target === els.tocOverlay) els.tocOverlay.hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      els.tocOverlay.hidden = true;
      if (!els.bookScreen.hidden) hideBook();
    }
  });

  els.resetProgressBtn.addEventListener("click", () => {
    if (!confirm("Erase all stars and saved programs, and start from level 1?")) return;
    completed = new Set();
    saveProgress();
    for (const lv of LEVELS) localStorage.removeItem(CODE_KEY(lv.id));
    if (typeof WebStudio !== "undefined") WebStudio.resetProgress();
    loadLevel(0);
  });

  // ---------- Start ----------

  // Resume where the kid left off — and if that level is already beaten,
  // roll forward to the next one. Fall back to the first unfinished main level.
  let start = -1;
  const lastIdx = LEVELS.findIndex((l) => l.id === localStorage.getItem(LAST_LEVEL_KEY));
  if (lastIdx !== -1) {
    start = lastIdx;
    if (completed.has(LEVELS[lastIdx].id)) {
      const nx = nextIndex(lastIdx);
      if (nx !== -1 && !completed.has(LEVELS[nx].id)) start = nx;
    }
  }
  if (start === -1) {
    start = 0;
    for (let i = 0; i < LEVELS.length; i++) {
      if (LEVELS[i].practice) continue;
      if (!completed.has(LEVELS[i].id)) {
        start = i;
        break;
      }
    }
  }
  loadLevel(start);

  // First visit: open with the story of what coding is.
  if (!localStorage.getItem(HOME_SEEN_KEY)) showHome();
})();
