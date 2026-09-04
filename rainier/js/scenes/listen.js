"use strict";

// Listen: the parrot says a word out loud; the kid finds it among words on the trees.
//   words     the words carved on the trees (one is the answer)
//   answer    the spoken word
//   picture   an emoji of the word, shown on the parrot as a second clue
// Tapping the parrot repeats the word. Sight words by ear and eye.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.listen = {
  mount(scene, stage, api) {
    const tapped = [];
    stage.innerHTML =
      `<div class="listen-wrap">
         <button class="parrot" title="Hear the word again">
           <span class="parrot-bird">🦜</span>
           <span class="parrot-pic">${scene.picture || "🔊"}</span>
           <span class="parrot-label">Tap me to hear the word!</span>
         </button>
         <div class="trees"></div>
       </div>`;
    const parrot = stage.querySelector(".parrot");
    const trees = stage.querySelector(".trees");
    const squawk = () => api.speak(scene.answer, true);
    parrot.addEventListener("click", squawk);
    for (const w of api.shuffle(scene.words.slice())) {
      const b = document.createElement("button");
      b.className = "tree-word";
      b.innerHTML = `<span class="tree-top">🌲</span><span class="tree-sign">${w}</span>`;
      b.addEventListener("click", () => {
        if (b.disabled) return;
        tapped.push(w);
        if (w === scene.answer) {
          b.classList.add("right");
          trees.querySelectorAll("button").forEach((x) => { x.disabled = true; });
          api.solved();
        } else {
          b.classList.add("shake");
          setTimeout(() => b.classList.remove("shake"), 500);
          api.wrong({ tapped: w, word: scene.answer });
          api.speak(`That one says ${w}.`, true);
        }
      });
      trees.appendChild(b);
    }
    // Say it once after the intro has had a moment.
    setTimeout(squawk, 4000);
    return {
      state: () => tapped.length ? `words tapped so far: ${tapped.join(", ")}` : "no word tapped yet",
      solution: () => `the tree that says "${scene.answer}"`,
      details: () => `words on the trees: ${scene.words.join(", ")}; the parrot says "${scene.answer}" and shows ${scene.picture || "no picture"}`,
    };
  },
};
