"use strict";

// Cards: "Berry Berry", the mountain's version of Piggy Piggy.
// Each round the cub plays a food card. The kid holds three cards; exactly one
// shares the cub's colour. Tap it to steal. A wrong tap hands the cub a token.
// First to `target` wins; if the cub gets there first it's "best of three" and
// the round restarts with no penalty. No clock. The kid sets the pace.
//
//   target       tokens to win (8 in the classic)
//   tokenValue   1, or an array like [1, 2, 3] to draw a value each round
//   pick         [1, 2, 3]: after a match the kid CHOOSES the token value, and the
//                pile must land exactly on target — past it does not count. Planning.

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
    const pickMode = Array.isArray(scene.pick);
    let kid = 0, cub = 0, round = 0, misses = 0, overshoots = 0;
    let cubCard = null, hand = [], value = 1;

    stage.innerHTML =
      `<div class="duel">
         <div class="duel-side cub"><div class="duel-name">${api.names.cub} 🐻</div><div class="duel-tokens" id="cubTokens"></div><div class="duel-play" id="cubPlay"></div></div>
         <div class="duel-mid"><div class="duel-value" id="duelValue"></div><div class="duel-goal">${pickMode ? "exactly " : "first to "}${scene.target}</div><div class="token-pick" id="tokenPick" hidden></div></div>
         <div class="duel-side kid"><div class="duel-name">${api.names.avatar} ${api.names.hero}</div><div class="duel-tokens" id="kidTokens"></div><div class="duel-hand" id="hand"></div></div>
       </div>`;
    const q = (id) => stage.querySelector("#" + id);

    function tokens(el, n, who) {
      el.innerHTML = "";
      for (let i = 0; i < Math.min(n, 12); i++) {
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
      hand = api.shuffle([{ ...cubCard }, ...others]);
      q("cubPlay").innerHTML = card(cubCard);
      q("duelValue").textContent = !pickMode && value > 1 ? `worth ${value}` : "";
      q("tokenPick").hidden = true;
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
    async function cubTakes(v) {
      cub += v;
      tokens(q("cubTokens"), cub, "cub");
      if (cub >= scene.target) {
        await api.wait(900);
        api.cheer(`"Best of three!" says ${api.names.cub}. Start again!`);
        kid = 0; cub = 0;
      }
    }
    async function play(f, b) {
      q("hand").querySelectorAll("button").forEach((x) => { x.disabled = true; });
      if (f.color !== cubCard.color) {
        misses++;
        b.classList.add("shake");
        api.wrong({ cubColor: cubCard.color, tapped: f.color });
        await cubTakes(pickMode ? scene.pick[Math.floor(Math.random() * scene.pick.length)] : value);
        await api.wait(800);
        deal();
        return;
      }
      b.classList.add("right");
      if (!pickMode) {
        kid += value;
        tokens(q("kidTokens"), kid, "kid");
        if (kid >= scene.target) { api.solved(); return; }
        api.cheer(["Steal!", "Got one!", "Matched!", "Yes!"][round % 4]);
        await api.wait(800);
        deal();
        return;
      }
      // Pick mode: matched — now choose how much to take. Exactly the target wins; past it does not count.
      const pick = q("tokenPick");
      pick.hidden = false;
      pick.innerHTML = `<span class="token-pick-label">Matched! You have ${kid}. Take how many?</span><div class="token-pick-row"></div>`;
      const row = pick.querySelector(".token-pick-row");
      for (const v of scene.pick) {
        const t = document.createElement("button");
        t.className = "token-btn";
        t.textContent = v;
        t.addEventListener("click", async () => {
          row.querySelectorAll("button").forEach((x) => { x.disabled = true; });
          if (kid + v > scene.target) {
            overshoots++;
            api.cheer(`${kid} and ${v} makes ${kid + v}. Too many! Past ${scene.target}. Pick a smaller one.`);
            await api.wait(400);
            row.querySelectorAll("button").forEach((x) => { x.disabled = false; });
            return;
          }
          kid += v;
          tokens(q("kidTokens"), kid, "kid");
          if (kid === scene.target) { pick.hidden = true; api.solved(); return; }
          api.cheer(`${kid - v} and ${v} makes ${kid}.`);
          await api.wait(900);
          deal();
        });
        row.appendChild(t);
      }
    }
    deal();
    return {
      state: () => `round ${round}; ${api.names.hero} has ${kid} token(s), the cub has ${cub}; ${misses} wrong colour(s)${pickMode ? `, ${overshoots} pick(s) that went past ${scene.target}` : ""}; the cub's card right now is ${cubCard.color} ${cubCard.food}; the kid's hand: ${hand.map((f) => f.color).join(", ")}`,
      solution: () => pickMode
        ? `each round tap the card with the cub's colour, then pick a token so the pile lands exactly on ${scene.target} (e.g. from 8 take 2, not 3)`
        : `each round tap the card whose colour matches the cub's card; reach ${scene.target} tokens`,
      details: () => `a card duel: the cub plays one coloured food card, the kid holds three cards and one has the same colour${pickMode ? `; after a match she chooses a token worth ${scene.pick.join(", ")} and must reach exactly ${scene.target}` : Array.isArray(scene.tokenValue) ? "; tokens are worth 1, 2 or 3" : ""}`,
    };
  },
};
