"use strict";

// Segments: an orange with `total` segments. Two ways to play:
//
// Eat (tutorial):  total, eat
//   Tap `eat` segments to eat them, then tap how many are left.
//
// Share (construct):  total, share
//   `share` plates. Tap a plate to move one segment from the orange onto it;
//   tap the plate's ↩︎ button to put one back. Win when the orange is empty and
//   every plate holds the same. Fair sharing is division before anyone names it.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.segments = {
  mount(scene, stage, api) {
    if (scene.share) return mountShare(scene, stage, api);
    return mountEat(scene, stage, api);
  },
};

function mountEat(scene, stage, api) {
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
}

function mountShare(scene, stage, api) {
  const each = scene.total / scene.share;
  const WHO = ["🐿️", "🐰", "🦔", "🐦"];
  const plates = Array.from({ length: scene.share }, () => 0);
  let left = scene.total;
  const tries = [];
  stage.innerHTML =
    `<div class="seg-wrap">
       <div class="seg-row">
         <div class="seg-orange small" style="--n:${scene.total}"></div>
         <div class="plates"></div>
       </div>
       <p class="seg-status"></p>
       <p class="seg-hint">Tap a plate to give it a segment. Tap ↩︎ to take one back.</p>
     </div>`;
  const orange = stage.querySelector(".seg-orange");
  const platesEl = stage.querySelector(".plates");
  const status = stage.querySelector(".seg-status");
  const segEls = [];
  for (let i = 0; i < scene.total; i++) {
    const s = document.createElement("span");
    s.className = "seg";
    s.style.setProperty("--i", i);
    orange.appendChild(s);
    segEls.push(s);
  }
  const plateEls = plates.map((_, p) => {
    const el = document.createElement("button");
    el.className = "plate";
    el.innerHTML = `<span class="plate-who">${WHO[p % WHO.length]}</span><div class="plate-segs"></div><span class="plate-n">0</span>`;
    el.addEventListener("click", () => give(p, +1));
    const wrap = document.createElement("div");
    wrap.className = "plate-wrap";
    const back = document.createElement("button");
    back.className = "plate-back";
    back.title = "Take one back";
    back.textContent = "↩︎";
    back.addEventListener("click", () => give(p, -1));
    wrap.appendChild(el);
    wrap.appendChild(back);
    platesEl.appendChild(wrap);
    return el;
  });

  function render() {
    segEls.forEach((s, i) => s.classList.toggle("eaten", i >= left));
    plateEls.forEach((el, p) => {
      el.querySelector(".plate-segs").innerHTML = "<span class='plate-seg'></span>".repeat(plates[p]);
      el.querySelector(".plate-n").textContent = plates[p];
      el.classList.toggle("equal", left === 0 && plates.every((n) => n === plates[0]));
    });
    status.textContent = left > 0 ? `${left} segment${left === 1 ? "" : "s"} left on the orange.` : "The orange is empty. Are the plates the same?";
  }
  function give(p, d) {
    if (d > 0 && left === 0) return;
    if (d < 0 && plates[p] === 0) return;
    plates[p] += d;
    left -= d;
    render();
    if (left === 0) {
      if (plates.every((n) => n === each)) {
        plateEls.forEach((el) => { el.disabled = true; });
        platesEl.querySelectorAll(".plate-back").forEach((b) => { b.disabled = true; });
        api.solved();
      } else {
        tries.push(plates.join(", "));
        api.wrong({ plates: plates.join(", ") });
      }
    }
  }
  render();
  return {
    state: () => `plates hold ${plates.join(", ")}; ${left} left on the orange${tries.length ? `; earlier full splits: ${tries.join(" | ")}` : ""}`,
    solution: () => `${each} on each of the ${scene.share} plates (${scene.total} shared by ${scene.share})`,
    details: () => `an orange with ${scene.total} segments and ${scene.share} plates; tapping a plate moves one segment onto it`,
  };
}
