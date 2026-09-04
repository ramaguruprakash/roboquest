"use strict";

// Memory: leaves hide numbers. Flip two; if they add up to `sum`, they stay.
//   values: [1, 9, 2, 8, 3, 7, 4, 6, 5, 5]   every value must have a partner
//   sum:    10
// Working memory plus number bonds: she has to remember where the 3 was when she
// finds the 7. A miss flips both back after a moment.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.memory = {
  mount(scene, stage, api) {
    const order = api.shuffle(scene.values.map((v, i) => i));
    const found = new Set();
    let open = [];
    let busy = false, flips = 0, misses = 0;
    stage.innerHTML = `<div class="memory"><div class="leaves"></div><p class="memory-status"></p></div>`;
    const leavesEl = stage.querySelector(".leaves");
    const status = stage.querySelector(".memory-status");
    const leaves = {};
    for (const i of order) {
      const b = document.createElement("button");
      b.className = "leaf";
      b.innerHTML = `<span class="leaf-front">🍃</span><span class="leaf-back">${scene.values[i]}</span>`;
      b.addEventListener("click", () => flip(i));
      leavesEl.appendChild(b);
      leaves[i] = b;
    }
    const pairsTotal = scene.values.length / 2;
    function render() {
      status.textContent = `${found.size / 2} of ${pairsTotal} pairs found.`;
    }
    async function flip(i) {
      if (busy || found.has(i) || open.includes(i)) return;
      flips++;
      leaves[i].classList.add("open");
      open.push(i);
      if (open.length < 2) return;
      busy = true;
      const [a, b] = open;
      const s = scene.values[a] + scene.values[b];
      await api.wait(650);
      if (s === scene.sum) {
        found.add(a); found.add(b);
        leaves[a].classList.add("found"); leaves[b].classList.add("found");
        api.cheer(`${scene.values[a]} and ${scene.values[b]} make ${scene.sum}!`);
        render();
        if (found.size === scene.values.length) { api.solved(); return; }
      } else {
        misses++;
        api.wrong({ a: scene.values[a], b: scene.values[b], total: s });
        await api.wait(700);
        leaves[a].classList.remove("open"); leaves[b].classList.remove("open");
      }
      open = [];
      busy = false;
    }
    render();
    return {
      state: () => `${found.size / 2} of ${pairsTotal} pairs found, ${flips} flips, ${misses} misses; open right now: ${open.map((i) => scene.values[i]).join(", ") || "none"}`,
      solution: () => `pairs that make ${scene.sum}: ${pairsList().join(", ")}`,
      details: () => `${scene.values.length} leaves hiding the numbers ${scene.values.slice().sort((x, y) => x - y).join(", ")}; two flipped leaves stay if they add up to ${scene.sum}`,
    };
    function pairsList() {
      const used = new Set(), out = [];
      scene.values.forEach((v, i) => {
        if (used.has(i)) return;
        const j = scene.values.findIndex((w, k) => k !== i && !used.has(k) && v + w === scene.sum);
        if (j >= 0) { used.add(i); used.add(j); out.push(`${v}+${scene.values[j]}`); }
      });
      return out;
    }
  },
};
