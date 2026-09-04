"use strict";

// Equation: use every number tile to build true sums.
//   tiles:     [6, 9, 15, 7, 8, 15]
//   sentences: 2        rows of  [ ] + [ ] = [ ]
// Tap a slot (the first empty one is selected), then a tile. Tap a filled slot to
// empty it. When every slot is full the rows are checked; false rows wobble.
// A number sentence is a claim you can test — and there are several true ones.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.equation = {
  mount(scene, stage, api) {
    const rows = scene.sentences || 2;
    const slots = []; // { row, pos, tileIndex }
    let selected = 0;
    const tries = [];
    stage.innerHTML = `<div class="eq-wrap"><div class="eq-rows"></div><div class="eq-tiles"></div></div>`;
    const rowsEl = stage.querySelector(".eq-rows");
    const tilesEl = stage.querySelector(".eq-tiles");
    for (let r = 0; r < rows; r++) {
      const row = document.createElement("div");
      row.className = "eq-row";
      for (let p = 0; p < 3; p++) {
        const s = document.createElement("button");
        s.className = "eq-slot";
        const k = slots.length;
        slots.push({ row: r, pos: p, tileIndex: undefined, el: s });
        s.addEventListener("click", () => { if (slots[k].tileIndex !== undefined) { byIndex[slots[k].tileIndex].disabled = false; slots[k].tileIndex = undefined; } selected = k; render(); });
        row.appendChild(s);
        if (p === 0) { const op = document.createElement("span"); op.className = "eq-op"; op.textContent = "+"; row.appendChild(op); }
        if (p === 1) { const op = document.createElement("span"); op.className = "eq-op"; op.textContent = "="; row.appendChild(op); }
      }
      rowsEl.appendChild(row);
    }
    const byIndex = [];
    api.shuffle(scene.tiles.map((t, i) => i)).forEach((i) => {
      const b = document.createElement("button");
      b.className = "eq-tile";
      b.textContent = scene.tiles[i];
      b.addEventListener("click", () => {
        if (b.disabled || selected === undefined) return;
        slots[selected].tileIndex = i;
        b.disabled = true;
        const next = slots.findIndex((s) => s.tileIndex === undefined);
        selected = next === -1 ? undefined : next;
        render();
        if (next === -1) check();
      });
      tilesEl.appendChild(b);
      byIndex[i] = b;
    });
    function render() {
      slots.forEach((s, k) => {
        s.el.textContent = s.tileIndex === undefined ? "" : scene.tiles[s.tileIndex];
        s.el.classList.toggle("selected", k === selected);
        s.el.classList.toggle("filled", s.tileIndex !== undefined);
      });
    }
    function rowValues(r) { return slots.filter((s) => s.row === r).map((s) => scene.tiles[s.tileIndex]); }
    function check() {
      const bad = [];
      for (let r = 0; r < rows; r++) { const [a, b, c] = rowValues(r); if (a + b !== c) bad.push(r); }
      tries.push(Array.from({ length: rows }, (_, r) => rowValues(r).join(" + ").replace(/ \+ (\d+)$/, " = $1")).join(" ; "));
      if (!bad.length) {
        slots.forEach((s) => { s.el.classList.add("right"); s.el.disabled = true; });
        api.solved();
        return;
      }
      const first = bad[0];
      const [a, b, c] = rowValues(first);
      slots.filter((s) => bad.includes(s.row)).forEach((s) => { s.el.classList.add("shake"); setTimeout(() => s.el.classList.remove("shake"), 500); });
      api.wrong({ tapped: `${a} + ${b} = ${c}` });
      setTimeout(() => {
        slots.filter((s) => bad.includes(s.row)).forEach((s) => { byIndex[s.tileIndex].disabled = false; s.tileIndex = undefined; });
        selected = slots.findIndex((s) => s.tileIndex === undefined);
        render();
      }, 700);
    }
    render();
    return {
      state: () => `rows right now: ${Array.from({ length: rows }, (_, r) => slots.filter((s) => s.row === r).map((s) => s.tileIndex === undefined ? "_" : scene.tiles[s.tileIndex]).join(" + ").replace(/ \+ ([^+]+)$/, " = $1")).join(" ; ")}${tries.length ? `; earlier tries: ${tries.join(" | ")}` : ""}`,
      solution: () => { const s = solve(); return s ? s.map((t) => `${t[0]} + ${t[1]} = ${t[2]}`).join(" and ") : "?"; },
      details: () => `number tiles: ${scene.tiles.join(", ")}; ${rows} empty sums of the shape _ + _ = _; every tile must be used`,
    };
    function solve() {
      const n = scene.tiles.length, used = new Array(n).fill(false), out = [];
      function rec(r) {
        if (r === rows) return true;
        for (let i = 0; i < n; i++) if (!used[i]) for (let j = 0; j < n; j++) if (!used[j] && j !== i) for (let k = 0; k < n; k++) if (!used[k] && k !== i && k !== j) {
          if (scene.tiles[i] + scene.tiles[j] === scene.tiles[k]) {
            used[i] = used[j] = used[k] = true; out.push([scene.tiles[i], scene.tiles[j], scene.tiles[k]]);
            if (rec(r + 1)) return true;
            used[i] = used[j] = used[k] = false; out.pop();
          }
        }
        return false;
      }
      return rec(0) ? out : null;
    }
  },
};
