"use strict";

// Program: put instruction cards in order, press Go, watch the boat run them.
// This is RoboQuest's real interpreter driving a grid with no typing: each card
// becomes one line of Robo (move / turn left / turn right / pickup).
//   map:      ["S.f.#.", ".#.#..", "....#.", "#.f..F", "..#..."]
//             S start (facing east), f fish to catch, # rock, F flag
//   maxCards: the program may not be longer than this
//   cards:    which cards are on offer, from move, left, right, pickup
//   solution: a card list that wins (the harness runs it)
//   clues:    optional note on paper with the rules
// Win: the boat ends on the flag with every fish caught. A rock is a Bonk.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.program = {
  CARD: {
    move: { icon: "⬆️", label: "go", code: "move" },
    left: { icon: "↰", label: "turn left", code: "turn left" },
    right: { icon: "↱", label: "turn right", code: "turn right" },
    pickup: { icon: "🎣", label: "catch", code: "pickup" },
  },
  worldFrom(map) {
    const world = { cols: map[0].length, rows: map.length, robot: null, goal: null, gems: [], walls: [] };
    map.forEach((row, y) => [...row].forEach((c, x) => {
      if (c === "S") world.robot = { x, y, dir: "E" };
      if (c === "F") world.goal = { x, y };
      if (c === "f") world.gems.push([x, y]);
      if (c === "#") world.walls.push([x, y]);
    }));
    return world;
  },
  mount(scene, stage, api) {
    const T = window.SCENE_TYPES.program;
    const world = T.worldFrom(scene.map);
    const cards = scene.cards || ["move", "left", "right", "pickup"];
    let program = [];
    let busy = false;
    const runs = [];
    const ARROW = { N: "⬆️", E: "➡️", S: "⬇️", W: "⬅️" };

    stage.innerHTML =
      `<div class="prog-wrap">
         <div class="prog-grid" style="--w:${world.cols};--h:${world.rows}"></div>
         <div class="prog-strip"><div class="prog-slots"></div><span class="prog-count"></span></div>
         <div class="prog-palette"></div>
         <div class="prog-controls">
           <button class="reset-btn prog-clear">Clear</button>
           <button class="run-btn prog-go" disabled>Go! 🛶</button>
         </div>
       </div>`;
    if (scene.clues) stage.querySelector(".prog-wrap").prepend(api.paper(scene.clues));
    const grid = stage.querySelector(".prog-grid");
    const slotsEl = stage.querySelector(".prog-slots");
    const countEl = stage.querySelector(".prog-count");
    const palette = stage.querySelector(".prog-palette");
    const go = stage.querySelector(".prog-go");
    const cells = {};
    for (let y = 0; y < world.rows; y++) for (let x = 0; x < world.cols; x++) {
      const c = scene.map[y][x];
      const el = document.createElement("div");
      el.className = "prog-cell" + (c === "#" ? " rock" : "");
      el.innerHTML = `<span class="cell-bg">${c === "#" ? "🪨" : c === "f" ? "🐟" : c === "F" ? "🏁" : ""}</span><span class="cell-boat"></span>`;
      grid.appendChild(el);
      cells[x + "," + y] = el;
    }
    for (const k of cards) {
      const b = document.createElement("button");
      b.className = "prog-card";
      b.innerHTML = `<span class="prog-card-icon">${T.CARD[k].icon}</span><span class="prog-card-label">${T.CARD[k].label}</span>`;
      b.addEventListener("click", () => { if (!busy && program.length < scene.maxCards) { program.push(k); renderProgram(); } });
      palette.appendChild(b);
    }
    stage.querySelector(".prog-clear").addEventListener("click", () => { if (!busy) { program = []; renderProgram(); drawState(world.robot.x, world.robot.y, world.robot.dir, new Set(world.gems.map((g) => g.join(",")))); } });

    function renderProgram() {
      slotsEl.innerHTML = "";
      program.forEach((k, i) => {
        const s = document.createElement("button");
        s.className = "prog-slot";
        s.innerHTML = `<small>${i + 1}</small>${T.CARD[k].icon}`;
        s.title = "Take this card out";
        s.addEventListener("click", () => { if (!busy) { program.splice(i, 1); renderProgram(); } });
        slotsEl.appendChild(s);
      });
      countEl.textContent = `${program.length} of ${scene.maxCards} cards`;
      go.disabled = busy || program.length === 0;
      palette.querySelectorAll("button").forEach((b) => { b.disabled = busy || program.length >= scene.maxCards; });
    }
    function drawState(x, y, dir, gems, crash) {
      Object.entries(cells).forEach(([k, el]) => {
        el.querySelector(".cell-boat").textContent = "";
        el.classList.remove("crash");
        const [cx, cy] = k.split(",").map(Number);
        if (scene.map[cy][cx] === "f") el.querySelector(".cell-bg").textContent = gems.has(k) ? "🐟" : "";
      });
      const el = cells[x + "," + y];
      if (el) { el.querySelector(".cell-boat").textContent = crash ? "💥" : `🛶${ARROW[dir]}`; if (crash) el.classList.add("crash"); }
    }
    drawState(world.robot.x, world.robot.y, world.robot.dir, new Set(world.gems.map((g) => g.join(","))));

    go.addEventListener("click", async () => {
      if (go.disabled) return;
      busy = true; renderProgram();
      const code = program.map((k) => T.CARD[k].code).join("\n");
      const result = Robo.run(Robo.parse(code), world);
      const slots = slotsEl.querySelectorAll(".prog-slot");
      for (const step of result.steps) {
        await api.wait(380);
        slots.forEach((s, i) => s.classList.toggle("running", i === step.lineNo - 1));
        drawState(step.x, step.y, step.dir, new Set(step.gems), step.action === "crash");
      }
      slots.forEach((s) => s.classList.remove("running"));
      let reason = "";
      const f = result.final;
      if (result.error) reason = `Bonk! Card ${result.error.lineNo} hit a rock.`;
      else if (f.gems.length && (f.x !== world.goal.x || f.y !== world.goal.y)) reason = `${f.gems.length} fish left, and no flag.`;
      else if (f.gems.length) reason = `You reached the flag, but ${f.gems.length} fish got away.`;
      else if (f.x !== world.goal.x || f.y !== world.goal.y) reason = "All fish caught! But the boat is not on the flag.";
      runs.push(`${program.map((k) => T.CARD[k].label).join(", ")} → ${reason || "WIN"}`);
      if (!reason) { cells[world.goal.x + "," + world.goal.y].classList.add("right"); api.solved(); return; }
      api.wrong({ reason });
      await api.wait(600);
      busy = false; renderProgram();
    });
    renderProgram();

    return {
      state: () => `program right now: ${program.map((k) => T.CARD[k].label).join(", ") || "empty"} (${program.length} cards)${runs.length ? `; runs so far: ${runs.join(" | ")}` : ""}`,
      solution: () => `${scene.solution.length} cards: ${scene.solution.map((k) => T.CARD[k].label).join(", ")}`,
      details: () => `a ${world.cols} by ${world.rows} river: ${scene.map.join(" / ")} (S boat start facing east, f fish, # rock, F flag); cards: go, turn left, turn right, catch; at most ${scene.maxCards} cards${scene.clues ? `; the note says: "${api.fill(scene.clues)}"` : ""}`,
    };
  },
};
