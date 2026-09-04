"use strict";

// Segments: an orange with `total` segments. Eat `eat` of them by tapping,
// then tap the number card that says how many are left.
//   total   segments to start with (10 is the classic)
//   eat     how many to eat
// Two steps: the eating is the counting practice; the number is the subtraction.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.segments = {
  mount(scene, stage, api) {
    const answer = scene.total - scene.eat;
    let eaten = 0;
    const guesses = [];
    stage.innerHTML =
      `<div class="seg-wrap">
         <div class="seg-orange" style="--n:${scene.total}"></div>
         <p class="seg-status"></p>
         <div class="seg-choices" hidden></div>
       </div>`;
    const orange = stage.querySelector(".seg-orange");
    const status = stage.querySelector(".seg-status");
    const choices = stage.querySelector(".seg-choices");
    for (let i = 0; i < scene.total; i++) {
      const b = document.createElement("button");
      b.className = "seg";
      b.style.setProperty("--i", i);
      b.setAttribute("aria-label", "orange segment");
      b.addEventListener("click", () => {
        if (b.disabled || eaten >= scene.eat) return;
        b.disabled = true;
        b.classList.add("eaten");
        eaten++;
        status.textContent = eaten < scene.eat ? `Nom! ${eaten} eaten. Eat ${scene.eat - eaten} more.` : "Yum. Now, how many are left?";
        if (eaten === scene.eat) showChoices();
      });
      orange.appendChild(b);
    }
    status.textContent = `Tap ${scene.eat} segments to eat them.`;

    function showChoices() {
      choices.hidden = false;
      const opts = api.shuffle([answer, answer - 1, answer + 1, scene.eat].filter((v, i, a) => v >= 0 && a.indexOf(v) === i));
      for (const n of opts) {
        const b = document.createElement("button");
        b.className = "num-card";
        b.textContent = n;
        b.addEventListener("click", () => {
          if (b.disabled) return;
          guesses.push(n);
          if (n === answer) {
            b.classList.add("right");
            choices.querySelectorAll("button").forEach((x) => { x.disabled = true; });
            api.solved();
          } else {
            b.classList.add("shake");
            setTimeout(() => b.classList.remove("shake"), 500);
            api.wrong({ guess: n });
          }
        });
        choices.appendChild(b);
      }
    }
    return {
      state: () => `${eaten} of ${scene.eat} segments eaten${guesses.length ? `; numbers tapped: ${guesses.join(", ")}` : ""}`,
      solution: () => `${answer} (${scene.total} take away ${scene.eat})`,
      details: () => `an orange with ${scene.total} segments; the kid eats ${scene.eat} by tapping, then picks a number card`,
    };
  },
};
