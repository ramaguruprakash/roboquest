"use strict";

// Pattern: a repeating row with holes. Work out the rule, fill the holes.
//   sequence: ["🐾", "🐾", "🍯", "🐾", "🐾", "🍯", "🐾", null, null, "🐾"]  (null = hole)
//   answers:  what goes in each hole, in order
//   tiles:    the choices, including the answers and a decoy or two
// Tap a hole to select it (the first empty one is selected by default), then tap a
// tile. Tap a filled hole to empty it. Checked when every hole is filled.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.pattern = {
  mount(scene, stage, api) {
    const holes = scene.sequence.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
    const filled = {};
    let selected = holes[0];
    const tries = [];
    stage.innerHTML = `<div class="pattern-wrap"><div class="pattern-row"></div><div class="pattern-tiles"></div></div>`;
    const row = stage.querySelector(".pattern-row");
    const tilesEl = stage.querySelector(".pattern-tiles");
    const cells = scene.sequence.map((v, i) => {
      const c = document.createElement(v === null ? "button" : "span");
      c.className = "pat-cell" + (v === null ? " hole" : "");
      if (v !== null) c.textContent = v;
      else c.addEventListener("click", () => { if (filled[i] !== undefined) delete filled[i]; selected = i; render(); });
      row.appendChild(c);
      return c;
    });
    for (const t of scene.tiles) {
      const b = document.createElement("button");
      b.className = "pat-tile";
      b.textContent = t;
      b.addEventListener("click", () => {
        if (selected === undefined || b.disabled) return;
        filled[selected] = t;
        const nextEmpty = holes.find((h) => filled[h] === undefined);
        selected = nextEmpty;
        render();
        if (nextEmpty === undefined) check();
      });
      tilesEl.appendChild(b);
    }
    function render() {
      holes.forEach((h) => {
        cells[h].textContent = filled[h] || "?";
        cells[h].classList.toggle("selected", h === selected);
        cells[h].classList.toggle("filled", filled[h] !== undefined);
      });
    }
    function check() {
      const got = holes.map((h) => filled[h]);
      if (got.every((v, k) => v === scene.answers[k])) {
        holes.forEach((h) => { cells[h].classList.add("right"); cells[h].disabled = true; });
        tilesEl.querySelectorAll("button").forEach((b) => { b.disabled = true; });
        api.solved();
      } else {
        tries.push(got.join(" "));
        holes.forEach((h, k) => { if (got[k] !== scene.answers[k]) { cells[h].classList.add("shake"); setTimeout(() => cells[h].classList.remove("shake"), 500); } });
        api.wrong({ tapped: got.join(" ") });
        setTimeout(() => { holes.forEach((h, k) => { if (got[k] !== scene.answers[k]) delete filled[h]; }); selected = holes.find((h) => filled[h] === undefined); render(); }, 700);
      }
    }
    render();
    return {
      state: () => `holes filled so far: ${holes.map((h) => filled[h] || "?").join(" ")}${tries.length ? `; earlier tries: ${tries.join(" | ")}` : ""}`,
      solution: () => scene.answers.join(" then "),
      details: () => `the row: ${scene.sequence.map((v) => v === null ? "?" : v).join(" ")}; tiles: ${scene.tiles.join(" ")}`,
    };
  },
};
