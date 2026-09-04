"use strict";

// Cards: "Berry Berry", the mountain's version of Piggy Piggy.
// Each round the cub plays a food card. The kid holds three cards; exactly one
// shares the cub's colour. Tap it to steal a berry token. A wrong tap hands the
// cub a token. First to `target` wins; if the cub gets there first it's
// "best of three" and the round restarts with no penalty.
//   target       tokens to win (8 in the classic)
//   tokenValue   1, or an array like [1, 2, 3] to draw a value each round
// No clock. The kid sets the pace.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.cards = {
  mount(scene, stage, api) {
    const FOODS = [
      { food: "🍊", color: "orange", css: "#ff9f43" },
      { food: "🫐", color: "blue", css: "#4d7cff" },
      { food: "🍓", color: "red", css: "#ff5e5e" },
      { food: "🍯", color: "yellow", css: "#ffd23f" },
      { food: "🥦", color: "green", css: "#3ac569" },
      { food: "🍇", color: "purple", css: "#a66bff" },
    ];
    let kid = 0, cub = 0, round = 0, misses = 0;
    let cubCard = null, hand = [], value = 1;

    stage.innerHTML =
      `<div class="duel">
         <div class="duel-side cub"><div class="duel-name">${api.names.cub} 🐻</div><div class="duel-tokens" id="cubTokens"></div><div class="duel-play" id="cubPlay"></div></div>
         <div class="duel-mid"><div class="duel-value" id="duelValue"></div><div class="duel-goal">first to ${scene.target}</div></div>
         <div class="duel-side kid"><div class="duel-name">${api.names.avatar} ${api.names.hero}</div><div class="duel-tokens" id="kidTokens"></div><div class="duel-hand" id="hand"></div></div>
       </div>`;
    const q = (id) => stage.querySelector("#" + id);

    function tokens(el, n, who) {
      el.innerHTML = "";
      for (let i = 0; i < n; i++) {
        const t = document.createElement("span");
        t.className = "token " + who;
        t.textContent = "🫐";
        el.appendChild(t);
      }
      const count = document.createElement("b");
      count.className = "token-count";
      count.textContent = n;
      el.appendChild(count);
    }
    function card(f) {
      return `<span class="duel-card" style="--c:${f.css}"><span class="duel-food">${f.food}</span><span class="duel-color">${f.color}</span></span>`;
    }
    function deal() {
      round++;
      value = Array.isArray(scene.tokenValue) ? scene.tokenValue[Math.floor(Math.random() * scene.tokenValue.length)] : (scene.tokenValue || 1);
      cubCard = FOODS[Math.floor(Math.random() * FOODS.length)];
      const others = api.shuffle(FOODS.filter((f) => f.color !== cubCard.color)).slice(0, 2);
      // The matching card shows the same colour but may be a different food — colour is the rule.
      const match = { ...cubCard, food: cubCard.food };
      hand = api.shuffle([match, ...others]);
      q("cubPlay").innerHTML = card(cubCard);
      q("duelValue").textContent = value > 1 ? `worth ${value}` : "";
      const h = q("hand");
      h.innerHTML = "";
      hand.forEach((f) => {
        const b = document.createElement("button");
        b.className = "duel-hand-card";
        b.innerHTML = card(f);
        b.addEventListener("click", () => play(f, b));
        h.appendChild(b);
      });
      tokens(q("kidTokens"), kid, "kid");
      tokens(q("cubTokens"), cub, "cub");
    }
    async function play(f, b) {
      q("hand").querySelectorAll("button").forEach((x) => { x.disabled = true; });
      if (f.color === cubCard.color) {
        b.classList.add("right");
        kid += value;
        tokens(q("kidTokens"), kid, "kid");
        if (kid >= scene.target) { api.solved(); return; }
        api.cheer(["Steal!", "Got one!", "Matched!", "Yes!"][round % 4]);
      } else {
        misses++;
        b.classList.add("shake");
        cub += value;
        tokens(q("cubTokens"), cub, "cub");
        api.wrong({ cubColor: cubCard.color, tapped: f.color });
        if (cub >= scene.target) {
          await api.wait(900);
          api.cheer(`"Best of three!" says ${api.names.cub}. Start again!`);
          kid = 0; cub = 0;
        }
      }
      await api.wait(800);
      deal();
    }
    deal();
    return {
      state: () => `round ${round}; ${api.names.hero} has ${kid} token(s), the cub has ${cub}; ${misses} wrong colour(s) so far; the cub's card right now is ${cubCard.color} ${cubCard.food}; the kid's hand: ${hand.map((f) => f.color).join(", ")}`,
      solution: () => `each round tap the card whose colour matches the cub's card; reach ${scene.target} tokens`,
      details: () => `a card duel: the cub plays one coloured food card, the kid holds three cards and one has the same colour${Array.isArray(scene.tokenValue) ? "; tokens are worth 1, 2 or 3" : ""}`,
    };
  },
};
