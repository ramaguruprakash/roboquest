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
    bookOverlay: $("bookOverlay"),
    bookBody: $("bookBody"),
    bookClose: $("bookClose"),
    conceptBadge: $("conceptBadge"),
    levelTitle: $("levelTitle"),
    intro: $("intro"),
    rules: $("rules"),
    hintBox: $("hintBox"),
    hintText: $("hintText"),
    commandList: $("commandList"),
    checksNote: $("checksNote"),
    board: $("board"),
    grid: $("grid"),
    robot: $("robot"),
    dirArrow: $("dirArrow"),
    gemCount: $("gemCount"),
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
  const CODE_KEY = (id) => "roboquest-code-" + id;

  let current = 0; // level index
  let animTimer = null;
  let completed = loadProgress();

  function loadProgress() {
    try {
      return new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }
  function saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completed]));
  }
  function isUnlocked(idx) {
    return idx === 0 || completed.has(LEVELS[idx - 1].id);
  }

  // ---------- Table of contents & handbook ----------

  function updateStarTally() {
    els.starTally.textContent = `⭐ ${completed.size} / ${LEVELS.length}`;
  }

  function chapterOf(levelId) {
    return CHAPTERS.find((c) => levelId.startsWith(c.prefix + "-"));
  }

  function renderToc() {
    els.tocBody.innerHTML = "";
    for (const chapter of CHAPTERS) {
      const idxs = LEVELS.map((lv, i) => i).filter((i) => chapterOf(LEVELS[i].id) === chapter);
      if (!idxs.length) continue;
      const doneCount = idxs.filter((i) => completed.has(LEVELS[i].id)).length;

      const section = document.createElement("section");
      section.className = "toc-chapter";
      section.innerHTML =
        `<h3>${chapter.emoji} ${ESC(chapter.title)} ` +
        `<span class="toc-progress">${doneCount} / ${idxs.length}</span></h3>` +
        `<p class="toc-blurb">${ESC(chapter.blurb)}</p>`;

      const list = document.createElement("div");
      list.className = "toc-levels";
      for (const i of idxs) {
        const lv = LEVELS[i];
        const done = completed.has(lv.id);
        const unlocked = isUnlocked(i);
        const row = document.createElement("button");
        row.className = "toc-level";
        if (done) row.classList.add("done");
        if (i === current) row.classList.add("current");
        row.disabled = !unlocked;
        row.innerHTML =
          `<span class="toc-mark">${done ? "⭐" : unlocked ? "▶" : "🔒"}</span>` +
          `<span class="toc-num">${i + 1}.</span> ${ESC(lv.title)}`;
        row.title = unlocked ? lv.title : "Finish the level before this one to unlock!";
        row.addEventListener("click", () => {
          els.tocOverlay.hidden = true;
          loadLevel(i);
        });
        list.appendChild(row);
      }
      section.appendChild(list);
      els.tocBody.appendChild(section);
    }
  }

  function renderBook() {
    els.bookBody.innerHTML = "";
    for (const page of HANDBOOK) {
      const sec = document.createElement("section");
      sec.className = "book-page";
      sec.innerHTML =
        `<h3><code>${ESC(page.syntax)}</code></h3>` +
        `<p>${ESC(page.explain)}</p>` +
        `<pre class="book-example">${ESC(page.example)}</pre>` +
        `<p class="book-note">↳ ${ESC(page.exampleNote)}</p>`;
      els.bookBody.appendChild(sec);
    }
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

  function cellSize() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cell"));
  }

  function renderGrid(gems, dropped) {
    const w = level().world;
    const wallSet = new Set((w.walls || []).map(([x, y]) => x + "," + y));
    const targetSet = new Set((w.target || []).map(([x, y]) => x + "," + y));
    const gemSet = new Set(gems);
    const droppedSet = new Set(dropped || []);
    els.grid.style.gridTemplateColumns = `repeat(${w.cols}, var(--cell))`;
    els.grid.innerHTML = "";
    for (let y = 0; y < w.rows; y++) {
      for (let x = 0; x < w.cols; x++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        const key = x + "," + y;
        if (wallSet.has(key)) {
          cell.classList.add("wall");
          cell.textContent = "🧱";
        } else if (droppedSet.has(key)) {
          cell.classList.add(targetSet.has(key) ? "dropped" : "misplaced");
          cell.textContent = "⭐";
        } else if (gemSet.has(key)) {
          cell.textContent = "💎";
        } else if (w.goal && w.goal.x === x && w.goal.y === y) {
          cell.classList.add("goal");
          cell.textContent = "🏁";
        } else if (targetSet.has(key)) {
          cell.classList.add("target");
          cell.innerHTML = '<span class="ghost">⭐</span>';
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

  function renderStatus(gemsLeft, totalGems, droppedCount) {
    const w = level().world;
    const parts = [];
    if (totalGems > 0) parts.push(`💎 ${totalGems - gemsLeft} / ${totalGems} gems`);
    if (w.target) parts.push(`⭐ ${droppedCount} / ${w.target.length} stars placed`);
    els.gemCount.textContent = parts.join("   ");
  }

  function renderInitialWorld() {
    const w = level().world;
    const gems = (w.gems || []).map(([x, y]) => x + "," + y);
    renderGrid(gems, []);
    els.robot.className = "robot";
    placeRobot(w.robot.x, w.robot.y, w.robot.dir);
    renderStatus(gems.length, gems.length, 0);
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
    // Show the conditions cheat-sheet once "if" is known
    els.checksNote.innerHTML = cmds.includes("if") ? CHECKS_NOTE : "";
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
    els.conceptBadge.textContent = `${lv.conceptEmoji} ${lv.concept}`;
    els.levelTitle.textContent = `${idx + 1}. ${lv.title}`;
    els.intro.innerHTML = lv.intro;
    els.hintText.textContent = lv.hint;
    els.hintBox.open = false;
    renderRules();
    renderCommandRef();
    els.editor.value = localStorage.getItem(CODE_KEY(lv.id)) || "";
    updateLineInfo();
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

    const result = Robo.run(program, lv.world);
    animate(result);
  }

  function animate(result) {
    const lv = level();
    const totalGems = (lv.world.gems || []).length;
    renderInitialWorld();
    say("Here I go! 🏃");
    els.runBtn.disabled = true;

    const frames = result.steps;
    let i = 0;
    const tick = () => {
      if (i >= frames.length) {
        stopAnimation();
        finish(result, totalGems);
        return;
      }
      const f = frames[i++];
      placeRobot(f.x, f.y, f.dir);
      if (f.action === "pickup" || f.action === "drop") {
        renderGrid(f.gems, f.dropped);
        renderStatus(f.gems.length, totalGems, f.dropped.length);
      } else if (f.action === "crash") {
        els.robot.classList.add("crash");
      } else if (f.action === "set" && f.say) {
        say(`📦 Remembering: <code>${ESC(f.say)}</code>`);
      }
    };
    // Show the starting position for a beat, then step.
    animTimer = setInterval(tick, Number(els.speed.value));
  }

  function finish(result, totalGems) {
    const lv = level();
    const fin = result.final;

    if (result.error) {
      say(`${ESC(result.error.message)}<br><small>(line ${result.error.lineNo})</small>`, "sad");
      return;
    }

    const atGoal = !lv.world.goal || (fin.x === lv.world.goal.x && fin.y === lv.world.goal.y);
    const allGems = fin.gems.length === 0;
    const target = lv.world.target;
    let pictureOk = true, misplaced = 0, missing = 0;
    if (target) {
      const targetSet = new Set(target.map(([x, y]) => x + "," + y));
      const droppedSet = new Set(fin.dropped);
      misplaced = fin.dropped.filter((k) => !targetSet.has(k)).length;
      missing = target.filter(([x, y]) => !droppedSet.has(x + "," + y)).length;
      pictureOk = misplaced === 0 && missing === 0;
    }

    if (atGoal && allGems && pictureOk) {
      win(totalGems);
    } else if (target && misplaced > 0) {
      say(`Hmm — ${misplaced} star${misplaced === 1 ? " is" : "s are"} outside the picture. Stars only go on the dotted squares!`, "sad");
    } else if (target && missing > 0) {
      say(`Looking good, but the picture isn't finished — ${missing} dotted square${missing === 1 ? "" : "s"} still need${missing === 1 ? "s" : ""} a star. ⭐`, "sad");
    } else if (!atGoal) {
      say("The program finished, but I'm not on the flag 🏁 yet. Almost there — try again!", "sad");
    } else {
      say(`I made it to the flag, but ${fin.gems.length} gem${fin.gems.length === 1 ? " is" : "s are"} still out there! 💎 Grab them all.`, "sad");
    }
  }

  function win(totalGems) {
    const lv = level();
    els.robot.classList.add("celebrate");
    say("I did it! You're a great programmer! 🎉", "happy");
    const firstTime = !completed.has(lv.id);
    completed.add(lv.id);
    saveProgress();
    updateStarTally();

    const isLast = current === LEVELS.length - 1;
    els.winSub.textContent = isLast
      ? "You finished EVERY level. You're officially a coder! 🏆"
      : firstTime
        ? `You taught Robo about ${lv.concept.toLowerCase()}!`
        : "Solved it again — nice!";
    els.nextBtn.hidden = isLast;
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
    if (current < LEVELS.length - 1) loadLevel(current + 1);
  });
  els.replayBtn.addEventListener("click", () => {
    els.winOverlay.hidden = true;
    renderInitialWorld();
    say("Back to the start. Ready!");
  });

  els.tocBtn.addEventListener("click", () => {
    renderToc();
    els.tocOverlay.hidden = false;
  });
  els.tocClose.addEventListener("click", () => { els.tocOverlay.hidden = true; });
  els.bookBtn.addEventListener("click", () => {
    if (!els.bookBody.childElementCount) renderBook();
    els.bookOverlay.hidden = false;
  });
  els.bookClose.addEventListener("click", () => { els.bookOverlay.hidden = true; });
  for (const overlay of [els.tocOverlay, els.bookOverlay]) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.hidden = true;
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      els.tocOverlay.hidden = true;
      els.bookOverlay.hidden = true;
    }
  });

  els.resetProgressBtn.addEventListener("click", () => {
    if (!confirm("Erase all stars and saved programs, and start from level 1?")) return;
    completed = new Set();
    saveProgress();
    for (const lv of LEVELS) localStorage.removeItem(CODE_KEY(lv.id));
    loadLevel(0);
  });

  // ---------- Start ----------

  // Resume at the first unfinished unlocked level.
  let start = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (isUnlocked(i) && !completed.has(LEVELS[i].id)) {
      start = i;
      break;
    }
    if (completed.has(LEVELS[i].id)) start = i;
  }
  loadLevel(start);

  // First visit: open with the story of what coding is.
  if (!localStorage.getItem(HOME_SEEN_KEY)) showHome();
})();
