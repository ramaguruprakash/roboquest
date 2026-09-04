"use strict";

// Sortbins: two nets are partly sorted. Work out the rule, finish the sorting.
//   bins:  [{ label, examples: [2, 4, 8] }, { label, examples: [1, 5, 7] }]
//   items: [3, 6, 9, 10, 12, 15]     the ones left to sort
//   rule:  "even" | "odd" | "gt:N" | "lt:N" | "tens"   — bin 0 is where the rule is TRUE
//   icon:  emoji drawn behind each number (default fish)
// Tap a fish, then a net. Inductive reasoning: the rule is never stated up front.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.sortbins = {
  test(rule, n) {
    if (rule === "even") return n % 2 === 0;
    if (rule === "odd") return n % 2 === 1;
    if (rule === "tens") return n % 10 === 0;
    if (rule.startsWith("gt:")) return n > Number(rule.slice(3));
    if (rule.startsWith("lt:")) return n < Number(rule.slice(3));
    return false;
  },
  mount(scene, stage, api) {
    const T = window.SCENE_TYPES.sortbins;
    const icon = scene.icon || "🐟";
    let selected = null;
    let misses = 0;
    const placed = {};
    stage.innerHTML = `<div class="sort-wrap"><div class="bins"></div><div class="sort-pool"></div><p class="seg-hint">Tap a fish. Then tap the net it belongs in.</p></div>`;
    const binsEl = stage.querySelector(".bins");
    const pool = stage.querySelector(".sort-pool");
    const binEls = scene.bins.map((b, bi) => {
      const el = document.createElement("button");
      el.className = "bin";
      el.innerHTML = `<span class="bin-label">${api.fill(b.label)}</span><div class="bin-items">${b.examples.map((n) => `<span class="fish example">${icon}<b>${n}</b></span>`).join("")}</div>`;
      el.addEventListener("click", () => drop(bi));
      binsEl.appendChild(el);
      return el;
    });
    const fishEls = {};
    for (const n of api.shuffle(scene.items.slice())) {
      const f = document.createElement("button");
      f.className = "fish";
      f.innerHTML = `${icon}<b>${n}</b>`;
      f.addEventListener("click", () => { if (!f.disabled) { selected = n; pool.querySelectorAll(".fish").forEach((x) => x.classList.toggle("selected", x === f)); } });
      pool.appendChild(f);
      fishEls[n] = f;
    }
    function drop(bi) {
      if (selected === null) return;
      const n = selected;
      const belongs = T.test(scene.rule, n) ? 0 : 1;
      if (bi === belongs) {
        placed[n] = bi;
        fishEls[n].disabled = true;
        fishEls[n].classList.remove("selected");
        binEls[bi].querySelector(".bin-items").appendChild(fishEls[n]);
        selected = null;
        if (Object.keys(placed).length === scene.items.length) {
          binEls.forEach((b) => { b.disabled = true; b.classList.add("right"); });
          api.solved();
        }
      } else {
        misses++;
        binEls[bi].classList.add("shake");
        setTimeout(() => binEls[bi].classList.remove("shake"), 500);
        api.wrong({ tapped: n, bin: api.fill(scene.bins[bi].label) });
      }
    }
    return {
      state: () => `sorted so far: ${Object.entries(placed).map(([n, b]) => `${n} → ${api.fill(scene.bins[b].label)}`).join(", ") || "none"}; ${misses} wrong net(s); selected: ${selected ?? "nothing"}`,
      solution: () => `${api.fill(scene.bins[0].label)}: ${scene.items.filter((n) => T.test(scene.rule, n)).join(", ")}; ${api.fill(scene.bins[1].label)}: ${scene.items.filter((n) => !T.test(scene.rule, n)).join(", ")} (rule: ${scene.rule})`,
      details: () => `${api.fill(scene.bins[0].label)} already holds ${scene.bins[0].examples.join(", ")}; ${api.fill(scene.bins[1].label)} holds ${scene.bins[1].examples.join(", ")}; fish to sort: ${scene.items.join(", ")}; the rule is never written down`,
    };
  },
};
