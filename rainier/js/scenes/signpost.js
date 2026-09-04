"use strict";

// Signpost: read a few signs, tap the right one.
//   signs: [{ text, icon?, correct? }]   exactly one is correct; icon is a picture on the sign
// The task is read aloud; the signs are NOT — reading them is the puzzle.
// After a miss the companion reads the tapped sign aloud, so a wrong tap still teaches.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.signpost = {
  mount(scene, stage, api) {
    const tapped = [];
    stage.innerHTML = `<div class="signpost"><div class="signpost-pole"></div><div class="signs"></div></div>`;
    const signs = stage.querySelector(".signs");
    const order = api.shuffle(scene.signs.map((s, i) => i));
    for (const i of order) {
      const s = scene.signs[i];
      const b = document.createElement("button");
      b.className = "sign";
      b.innerHTML = (s.icon ? `<span class="sign-icon">${s.icon}</span>` : "") + `<span class="sign-text">${api.fill(s.text)}</span>`;
      b.addEventListener("click", () => {
        if (b.disabled) return;
        tapped.push(api.fill(s.text));
        if (s.correct) {
          b.classList.add("right");
          signs.querySelectorAll(".sign").forEach((x) => { x.disabled = true; });
          api.solved();
        } else {
          b.classList.add("shake");
          setTimeout(() => b.classList.remove("shake"), 500);
          api.wrong({ tapped: api.fill(s.text) });
        }
      });
      signs.appendChild(b);
    }
    return {
      state: () => tapped.length ? `signs tapped so far, in order: ${tapped.map((t) => `"${t}"`).join(", ")}` : "no sign tapped yet",
      solution: () => `the sign that says "${api.fill(scene.signs.find((s) => s.correct).text)}"`,
      details: () => `signs on screen: ${scene.signs.map((s) => `"${api.fill(s.text)}"`).join(", ")}`,
    };
  },
};
