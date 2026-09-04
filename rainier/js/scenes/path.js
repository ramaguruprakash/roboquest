"use strict";

// Path: draw a route on a small grid, then watch the hero walk it.
//   grid:   ["S....", ".aa..", "...##", "#a..X"]   S start, X goal, # tree, a acorn
//   steps:  the route must be exactly this many steps
//   clues:  optional note on paper with the rules (read, don't listen)
// Tap a square next to the end of the route to extend it; tap the last square
// to undo; Clear starts over. Go is enabled when the route reaches X. The hero
// walks it; the scene checks the step count and the acorns picked up.
// Spatial planning under constraints: the same thinking as a Robo program, with no typing.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.path = {
  mount(scene, stage, api) {
    const rows = scene.grid, H = rows.length, W = rows[0].length;
    let S, X; const acorns = new Set();
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === "S") S = [x, y]; if (c === "X") X = [x, y]; if (c === "a") acorns.add(x + "," + y); }));
    let route = [S];
    let busy = false;
    const tries = [];
    stage.innerHTML =
      `<div class="path-wrap">
         <div class="path-grid" style="--w:${W};--h:${H}"></div>
         <div class="path-controls">
           <span class="path-count"></span>
           <button class="reset-btn path-clear">Clear</button>
           <button class="run-btn path-go" disabled>Go! 🤸</button>
         </div>
       </div>`;
    if (scene.clues) stage.querySelector(".path-wrap").prepend(api.paper(scene.clues));
    const grid = stage.querySelector(".path-grid");
    const count = stage.querySelector(".path-count");
    const go = stage.querySelector(".path-go");
    const cells = {};
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = rows[y][x];
      const el = document.createElement("button");
      el.className = "path-cell" + (c === "#" ? " tree" : "");
      el.innerHTML = `<span class="cell-bg">${c === "#" ? "🌲" : c === "a" ? "🌰" : c === "X" ? "❌" : ""}</span><span class="cell-hero"></span>`;
      el.disabled = c === "#";
      el.addEventListener("click", () => tapCell(x, y));
      grid.appendChild(el);
      cells[x + "," + y] = el;
    }
    const key = (p) => p[0] + "," + p[1];
    const last = () => route[route.length - 1];
    const adjacent = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;

    function render() {
      Object.values(cells).forEach((el) => { el.classList.remove("on", "head", "next"); el.querySelector(".cell-hero").textContent = ""; });
      route.forEach((p, i) => { cells[key(p)].classList.add("on"); if (i === route.length - 1) cells[key(p)].classList.add("head"); });
      cells[key(route[0])].querySelector(".cell-hero").textContent = api.names.avatar;
      const L = last();
      if (!busy) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = [L[0] + dx, L[1] + dy];
        if (n[0] < 0 || n[1] < 0 || n[0] >= W || n[1] >= H) continue;
        if (rows[n[1]][n[0]] === "#" || route.some((p) => key(p) === key(n))) continue;
        cells[key(n)].classList.add("next");
      }
      count.textContent = `${route.length - 1} step${route.length - 1 === 1 ? "" : "s"}`;
      go.disabled = busy || key(L) !== key(X);
    }
    function tapCell(x, y) {
      if (busy) return;
      const p = [x, y];
      if (route.length > 1 && key(p) === key(last())) { route.pop(); render(); return; }
      if (route.some((q) => key(q) === key(p))) return;
      if (!adjacent(p, last())) return;
      if (key(last()) === key(X)) return; // already at the goal
      route.push(p);
      render();
    }
    stage.querySelector(".path-clear").addEventListener("click", () => { if (!busy) { route = [S]; render(); } });
    go.addEventListener("click", async () => {
      if (go.disabled) return;
      busy = true; render();
      let got = 0;
      for (let i = 1; i < route.length; i++) {
        await api.wait(260);
        cells[key(route[i - 1])].querySelector(".cell-hero").textContent = "";
        cells[key(route[i])].querySelector(".cell-hero").textContent = api.names.avatar;
        if (acorns.has(key(route[i]))) { got++; cells[key(route[i])].classList.add("picked"); }
      }
      const steps = route.length - 1;
      tries.push(`${steps} steps, ${got} of ${acorns.size} acorns`);
      if (steps === scene.steps && got === acorns.size) {
        cells[key(X)].classList.add("right");
        api.solved();
        return;
      }
      api.wrong({ steps, acorns: got, total: acorns.size });
      await api.wait(900);
      Object.values(cells).forEach((el) => el.classList.remove("picked"));
      busy = false; render();
    });
    render();
    return {
      state: () => `route so far: ${route.length - 1} steps, ends at column ${last()[0]}, row ${last()[1]}${key(last()) === key(X) ? " (at the X)" : ""}, passes ${route.filter((p) => acorns.has(key(p))).length} acorn(s)${tries.length ? `; earlier runs: ${tries.join(" | ")}` : ""}`,
      solution: () => `a route of exactly ${scene.steps} steps from the top-left to the X that steps on all ${acorns.size} acorns and avoids the trees`,
      details: () => `a ${W} by ${H} grid: ${rows.join(" / ")} (S start, X goal, # tree, a acorn)${scene.clues ? `; the note says: "${api.fill(scene.clues)}"` : ""}`,
    };
  },
};
