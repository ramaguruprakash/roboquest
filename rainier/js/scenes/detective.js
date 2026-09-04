"use strict";

// Detective: several clues on a note, several suspects. Exactly one fits every clue.
//   clues:    the note text (shown on paper, tap a word to hear it)
//   rules:    [{ tag, has, say }] what each clue means: suspect must have / not have the tag;
//             `say` is the short reminder used when she taps a suspect that breaks it
//   suspects: [{ icon, label, tags: [] }]
//   answer:   index of the suspect that fits all rules
// Deduction: hold two or three facts at once and eliminate. A wrong tap says which clue it breaks.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.detective = {
  mount(scene, stage, api) {
    const tapped = [];
    stage.innerHTML = `<div class="detective"><div class="suspects"></div></div>`;
    const wrap = stage.querySelector(".detective");
    wrap.prepend(api.paper(scene.clues));
    const list = wrap.querySelector(".suspects");
    const order = api.shuffle(scene.suspects.map((s, i) => i));
    for (const i of order) {
      const s = scene.suspects[i];
      const b = document.createElement("button");
      b.className = "suspect";
      b.innerHTML = `<span class="suspect-icon">${s.icon}</span><span class="suspect-label">${api.fill(s.label)}</span>`;
      b.addEventListener("click", () => {
        if (b.disabled) return;
        tapped.push(api.fill(s.label));
        if (i === scene.answer) {
          b.classList.add("right");
          list.querySelectorAll("button").forEach((x) => { x.disabled = true; });
          api.solved();
          return;
        }
        const broken = scene.rules.find((r) => s.tags.includes(r.tag) !== r.has);
        b.classList.add("shake", "out");
        setTimeout(() => b.classList.remove("shake"), 500);
        api.wrong({ tapped: api.fill(s.label), clue: broken ? api.fill(broken.say) : "" });
      });
      list.appendChild(b);
    }
    return {
      state: () => tapped.length ? `suspects tapped so far: ${tapped.join(", ")}` : "nothing tapped yet",
      solution: () => api.fill(scene.suspects[scene.answer].label),
      details: () => `the note says: "${api.fill(scene.clues)}"; the choices: ${scene.suspects.map((s) => `${api.fill(s.label)} (${s.tags.join(", ") || "plain"})`).join("; ")}`,
    };
  },
};
