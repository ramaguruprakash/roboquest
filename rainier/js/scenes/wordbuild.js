"use strict";

// Wordbuild: read a riddle, work out the word, spell it from letter tiles.
//   riddle:  the clue text (on paper; tap a word to hear it)
//   word:    the answer, lowercase
//   letters: tiles on the table, must include every letter of the word (plus a few decoys)
//   picture: optional emoji that appears after two misses, as a second clue
// Tap letters in order; the next slot fills. A wrong letter wobbles. Tap the
// last filled slot to take it back. The parrot repeats the riddle aloud.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.wordbuild = {
  mount(scene, stage, api) {
    const word = scene.word.toLowerCase();
    let built = [];   // indices into letters
    let misses = 0;
    stage.innerHTML =
      `<div class="wordbuild">
         <div class="word-slots"></div>
         <div class="letter-tiles"></div>
         <div class="word-pic" hidden></div>
       </div>`;
    const wrap = stage.querySelector(".wordbuild");
    wrap.prepend(api.paper(scene.riddle));
    const slots = wrap.querySelector(".word-slots");
    const tiles = wrap.querySelector(".letter-tiles");
    const pic = wrap.querySelector(".word-pic");
    const tileEls = api.shuffle(scene.letters.map((l, i) => i)).map((i) => {
      const b = document.createElement("button");
      b.className = "letter";
      b.textContent = scene.letters[i];
      b.addEventListener("click", () => tap(i, b));
      tiles.appendChild(b);
      return { i, b };
    });
    function renderSlots() {
      slots.innerHTML = "";
      for (let k = 0; k < word.length; k++) {
        const s = document.createElement("button");
        s.className = "word-slot" + (built[k] !== undefined ? " filled" : "");
        s.textContent = built[k] !== undefined ? scene.letters[built[k]] : "";
        s.disabled = k !== built.length - 1;
        s.title = k === built.length - 1 ? "Take this letter back" : "";
        s.addEventListener("click", () => { if (k === built.length - 1) { const idx = built.pop(); tileEls.find((t) => t.i === idx).b.disabled = false; renderSlots(); } });
        slots.appendChild(s);
      }
    }
    function tap(i, b) {
      if (b.disabled || built.length >= word.length) return;
      const want = word[built.length];
      if (scene.letters[i].toLowerCase() === want) {
        built.push(i);
        b.disabled = true;
        renderSlots();
        api.speak(scene.letters[i], true);
        if (built.length === word.length) {
          slots.querySelectorAll(".word-slot").forEach((s) => { s.classList.add("right"); s.disabled = true; });
          tileEls.forEach((t) => { t.b.disabled = true; });
          api.speak(word, true);
          api.solved();
        }
      } else {
        misses++;
        b.classList.add("shake");
        setTimeout(() => b.classList.remove("shake"), 500);
        if (misses >= 2 && scene.picture) { pic.hidden = false; pic.textContent = scene.picture; }
        api.wrong({ letter: scene.letters[i], position: built.length + 1 });
      }
    }
    renderSlots();
    return {
      state: () => `spelled so far: "${built.map((i) => scene.letters[i]).join("")}" of ${word.length} letters; ${misses} wrong letter(s)${misses >= 2 && scene.picture ? "; the picture clue is showing" : ""}`,
      solution: () => word,
      details: () => `the riddle says: "${api.fill(scene.riddle)}"; letter tiles: ${scene.letters.join(" ")}`,
    };
  },
};
