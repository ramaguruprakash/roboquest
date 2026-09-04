"use strict";

// Scale: put every rock on a balance so both sides weigh the same.
//   rocks: [1, 2, 3, 4, 5, 7]  (their total must be even; several splits should work)
// Tap a rock on the ground to put it on the left pan; tap it again to move it to
// the right pan; tap once more to take it off. The beam tilts live toward the
// heavier side, so every move gives feedback. Partition: equality by construction.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.scale = {
  mount(scene, stage, api) {
    const side = scene.rocks.map(() => 0); // 0 ground, 1 left, 2 right
    const tries = [];
    stage.innerHTML =
      `<div class="scale-wrap">
         <div class="scale">
           <div class="pan left"><div class="pan-rocks"></div><div class="pan-total">0</div></div>
           <div class="scale-beam"></div>
           <div class="pan right"><div class="pan-rocks"></div><div class="pan-total">0</div></div>
           <div class="scale-post"></div>
         </div>
         <p class="scale-status"></p>
         <div class="ground-rocks"></div>
         <p class="seg-hint">Tap a rock: ground → left pan → right pan → ground.</p>
       </div>`;
    const beam = stage.querySelector(".scale-beam");
    const pans = [null, stage.querySelector(".pan.left"), stage.querySelector(".pan.right")];
    const ground = stage.querySelector(".ground-rocks");
    const status = stage.querySelector(".scale-status");
    const rockEls = scene.rocks.map((w, i) => {
      const b = document.createElement("button");
      b.className = "rock";
      b.innerHTML = `<span class="rock-icon">🪨</span><span class="rock-n">${w}</span>`;
      b.addEventListener("click", () => { if (!b.disabled) { side[i] = (side[i] + 1) % 3; render(); } });
      return b;
    });
    const total = (s) => scene.rocks.reduce((a, w, i) => a + (side[i] === s ? w : 0), 0);

    function render() {
      ground.innerHTML = "";
      pans[1].querySelector(".pan-rocks").innerHTML = "";
      pans[2].querySelector(".pan-rocks").innerHTML = "";
      rockEls.forEach((el, i) => (side[i] === 0 ? ground : pans[side[i]].querySelector(".pan-rocks")).appendChild(el));
      const L = total(1), R = total(2);
      pans[1].querySelector(".pan-total").textContent = L;
      pans[2].querySelector(".pan-total").textContent = R;
      const tilt = Math.max(-14, Math.min(14, (R - L) * 2.5));
      beam.style.transform = `rotate(${tilt}deg)`;
      pans[1].style.transform = `translateY(${-tilt * 2}px)`;
      pans[2].style.transform = `translateY(${tilt * 2}px)`;
      const onGround = side.filter((s) => s === 0).length;
      if (onGround) status.textContent = `${onGround} rock${onGround === 1 ? "" : "s"} still on the ground.`;
      else if (L === R) status.textContent = "Balanced!";
      else status.textContent = L > R ? `Left is heavier. ${L} and ${R}.` : `Right is heavier. ${L} and ${R}.`;
      if (!onGround) {
        if (L === R) {
          stage.querySelector(".scale").classList.add("balanced");
          rockEls.forEach((el) => { el.disabled = true; });
          api.solved();
        } else {
          tries.push(`${L} vs ${R}`);
          api.wrong({ left: L, right: R });
        }
      }
    }
    render();
    return {
      state: () => `left pan ${total(1)}, right pan ${total(2)}, on the ground: ${scene.rocks.filter((w, i) => side[i] === 0).join(", ") || "none"}${tries.length ? `; full tries: ${tries.join(" | ")}` : ""}`,
      solution: () => { const s = firstSplit(); return `each side ${s.sum}, e.g. left ${s.left.join("+")} and right ${s.right.join("+")}`; },
      details: () => `a balance scale and rocks weighing ${scene.rocks.join(", ")}; all rocks must go on and both sides must be equal`,
    };
    function firstSplit() {
      const r = scene.rocks, n = r.length, half = r.reduce((a, b) => a + b, 0) / 2;
      for (let mask = 1; mask < (1 << n) - 1; mask++) {
        const left = r.filter((_, i) => mask & (1 << i));
        if (left.reduce((a, b) => a + b, 0) === half) return { sum: half, left, right: r.filter((_, i) => !(mask & (1 << i))) };
      }
      return { sum: half, left: [], right: [] };
    }
  },
};
