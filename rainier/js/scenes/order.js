"use strict";

// Order: put picture cards in the order they happened.
//   cards: [{ icon, text }] in the CORRECT order; shown shuffled
// The kid taps the card that comes next; it slides into the next slot.
// A wrong card wobbles and stays on the table.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.order = {
  mount(scene, stage, api) {
    let next = 0;
    let misses = 0;
    stage.innerHTML = `<div class="order-wrap"><div class="order-slots"></div><div class="order-table"></div></div>`;
    const slots = stage.querySelector(".order-slots");
    const table = stage.querySelector(".order-table");
    scene.cards.forEach((_, i) => {
      const s = document.createElement("div");
      s.className = "order-slot";
      s.innerHTML = `<span class="order-slot-n">${i + 1}</span>`;
      slots.appendChild(s);
    });
    let shuffled = api.shuffle(scene.cards.map((c, i) => i));
    // Never start already in order — that would be no puzzle.
    if (shuffled.every((v, i) => v === i)) shuffled = shuffled.slice(1).concat(shuffled[0]);
    const els = [];
    for (const i of shuffled) {
      const c = scene.cards[i];
      const b = document.createElement("button");
      b.className = "order-card";
      b.innerHTML = `<span class="order-card-icon">${c.icon}</span><span class="order-card-text">${api.fill(c.text)}</span>`;
      b.addEventListener("click", () => tap(i, b));
      table.appendChild(b);
      els[i] = b;
    }
    function tap(i, b) {
      if (b.disabled) return;
      if (i === next) {
        b.disabled = true;
        b.classList.add("placed");
        const slot = slots.children[next];
        slot.innerHTML = "";
        slot.appendChild(b);
        slot.classList.add("filled");
        next++;
        if (next === scene.cards.length) api.solved();
      } else {
        misses++;
        b.classList.add("shake");
        setTimeout(() => b.classList.remove("shake"), 500);
        api.wrong({ tapped: api.fill(scene.cards[i].text), position: next + 1 });
      }
    }
    return {
      state: () => `${next} of ${scene.cards.length} cards placed in order so far (${misses} wrong tap(s)); placed: ${scene.cards.slice(0, next).map((c) => `"${api.fill(c.text)}"`).join(", ") || "none"}`,
      solution: () => scene.cards.map((c, i) => `${i + 1}. ${api.fill(c.text)}`).join("; "),
      details: () => `picture cards: ${scene.cards.map((c) => `${c.icon} "${api.fill(c.text)}"`).join(", ")}`,
    };
  },
};
