"use strict";

// Boards: a karate chop scene. A stack of `total` logs blocks the path; the kid
// chops `chop` of them by tapping (HI-YA!), then taps how many still stand.
//   total   logs to start with
//   chop    how many to chop
// Same two-step shape as the orange: the chopping is counting, the number is subtraction.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.boards = {
  mount(scene, stage, api) {
    const answer = scene.total - scene.chop;
    let chopped = 0;
    const guesses = [];
    stage.innerHTML =
      `<div class="boards-wrap">
         <div class="boards-hero">${api.names.avatar}</div>
         <div class="boards"></div>
         <p class="boards-status"></p>
         <div class="boards-choices" hidden></div>
       </div>`;
    const stack = stage.querySelector(".boards");
    const status = stage.querySelector(".boards-status");
    const choices = stage.querySelector(".boards-choices");
    for (let i = 0; i < scene.total; i++) {
      const b = document.createElement("button");
      b.className = "board";
      b.setAttribute("aria-label", "log");
      b.innerHTML = `<span class="board-log">🪵</span><span class="board-hiya">HI-YA!</span>`;
      b.addEventListener("click", () => {
        if (b.disabled || chopped >= scene.chop) return;
        b.disabled = true;
        b.classList.add("chopped");
        chopped++;
        status.textContent = chopped < scene.chop ? `HI-YA! ${chopped} chopped. Chop ${scene.chop - chopped} more.` : "Phew! How many logs still stand?";
        if (chopped === scene.chop) showChoices();
      });
      stack.appendChild(b);
    }
    status.textContent = `Tap ${scene.chop} logs to chop them!`;

    function showChoices() {
      choices.hidden = false;
      const opts = api.shuffle([answer, answer - 1, answer + 1, scene.chop].filter((v, i, a) => v >= 0 && a.indexOf(v) === i));
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
            api.wrong({ guess: n, standing: answer });
          }
        });
        choices.appendChild(b);
      }
    }
    return {
      state: () => `${chopped} of ${scene.chop} logs chopped${guesses.length ? `; numbers tapped: ${guesses.join(", ")}` : ""}`,
      solution: () => `${answer} (${scene.total} logs take away ${scene.chop})`,
      details: () => `a stack of ${scene.total} logs; the kid chops ${scene.chop} by tapping, then picks a number card`,
    };
  },
};
