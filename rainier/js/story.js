"use strict";

// The story of Rainier Rescue: rescue a Flemish Giant rabbit on Mt Rainier.
//
// Everything a scene needs is data here — the runner (app.js) and the puzzle
// modules (scenes/*.js) never hard-code a level. Text may use {hero}, {rabbit}
// and {cub}; the runner fills in the names the kid chose.
//
// A scene:
//   id        unique, prefixed by its area id
//   area      which area it belongs to (areas unlock in order; scenes too)
//   type      which puzzle module renders it (see scenes/)
//   title     short name shown on the map and in the guru
//   before    what the companion says when the scene opens (read aloud)
//   task      the one-line instruction (read aloud, also shown)
//   after     what the companion says when it is solved
//   wrong     what the companion says on a miss (funny, never harsh)
//   hint      the direct hint behind the 💡 button
//   skills    ["reading"], ["maths"] or both — the test harness checks each area mixes them
//   reward    oranges earned
//   ...       type-specific fields, documented in each scenes/*.js

const BELTS = ["white", "yellow", "orange", "green", "blue", "purple"];

const AREAS = [
  {
    id: "meadow", title: "Sunrise Meadow", emoji: "🌼", belt: "yellow",
    blurb: "Where the trail begins.",
    companion: { name: "Pip", emoji: "🐿️", kind: "marmot" },
    clue: "A tuft of grey fur is caught on the fence, and a little paw print points into the trees. {rabbit} went this way!",
  },
  {
    id: "forest", title: "Whispering Forest", emoji: "🌲", belt: "orange",
    blurb: "Tall trees, bear notes, and a parrot who talks too much.",
    companion: { name: "Pip", emoji: "🐿️", kind: "marmot" },
    clue: "A half-eaten carrot lies on the path. The cub's prints head towards the sound of water.",
  },
  {
    id: "river", title: "Paradise River", emoji: "🏞️", belt: "green",
    blurb: "Stepping stones, a bridge toll, and salmon that jump in fives.",
    companion: { name: "Pip", emoji: "🐿️", kind: "marmot" },
    clue: "Rabbit prints in the mud, and they're heading up onto the ice.",
  },
  {
    id: "glacier", title: "The Glacier", emoji: "🧊", belt: "blue",
    blurb: "Skates on! Slide, plan, and collect.",
    companion: { name: "Pip", emoji: "🐿️", kind: "marmot" },
    clue: "{rabbit}'s scarf is tied to a pole, pointing at the summit.",
  },
  {
    id: "summit", title: "The Summit", emoji: "🏔️", belt: "purple",
    blurb: "Everything you know, all at once.",
    companion: { name: "Pip", emoji: "🐿️", kind: "marmot" },
    clue: "You found {rabbit}! And a very sorry bear cub with a picnic basket.",
  },
];

const SCENES = [
  // ---------------- Area 1: Sunrise Meadow ----------------
  {
    id: "meadow-1", area: "meadow", type: "signpost", title: "The open hutch",
    skills: ["reading"], reward: 1,
    before: "Oh no! The hutch door is wide open. Big rabbit paws and little bear paws go off together across the grass. Pip the marmot squeaks: \"I saw them! They went towards the tall trees!\"",
    task: "Read the signs. Tap the one that points to the trees.",
    signs: [
      { text: "To the pond" },
      { text: "To the trees", correct: true },
      { text: "To the barn" },
    ],
    wrong: "Hmm, that sign says \"{tapped}\". Pip said the TREES. Read them again slowly!",
    after: "That's the one! {hero} hops on her scooter and zooms down the trail.",
    hint: "Look for the word that starts with T-R. Trees!",
  },
  {
    id: "meadow-2", area: "meadow", type: "beam", title: "The wildflower log",
    skills: ["maths"], reward: 1,
    before: "A long log lies across the wildflower path, just like a balance beam at gymnastics! {hero} climbs on. Pip counts the flowers along it: 0, 1, 2, 3…",
    task: "Hop 5, then hop 3. Where will {hero} land? Tap that flower.",
    start: 0, hops: [5, 3], length: 10,
    wrong: "Wobble! {hero} actually landed on {landed}. Count the hops again: 5 first, then 3 more.",
    after: "Perfect landing! {hero} does a little curtsy on the log. 🤸",
    hint: "Start at 0. Count 5 flowers: 1, 2, 3, 4, 5. Now count 3 more from there.",
  },
  {
    id: "meadow-3", area: "meadow", type: "fill", title: "Packing the bag",
    skills: ["reading", "maths"], reward: 2,
    before: "Pip drags out {hero}'s backpack. \"You can't climb a mountain on an empty tummy! Here's the list.\"",
    task: "Take 4 oranges, 2 carrots and 3 apples. Put them in the bag.",
    container: "🎒",
    showTarget: false,
    target: 9,
    choices: [
      { n: 4, icon: "🍊", label: "4 oranges", need: true },
      { n: 5, icon: "🍇", label: "5 grapes" },
      { n: 2, icon: "🥕", label: "2 carrots", need: true },
      { n: 1, icon: "🍌", label: "1 banana" },
      { n: 3, icon: "🍎", label: "3 apples", need: true },
    ],
    wrong: "Pip peeks in the bag. \"That's not what the list says!\" Read the list once more. Tap a card in the bag to take it out.",
    after: "Nine snacks packed, and the bag zips shut. Pip sneaks one grape anyway.",
    hint: "The list names three things: oranges, carrots and apples. Only those three cards go in the bag.",
  },
  {
    id: "meadow-4", area: "meadow", type: "order", title: "Pip's story",
    skills: ["reading"], reward: 1,
    before: "A gate blocks the trail. Pip says: \"I'll tell the gate what happened this morning, but my pictures are all mixed up!\"",
    task: "Tap the pictures in the order they happened.",
    cards: [
      { icon: "🐰", text: "{rabbit} sleeps in the hutch" },
      { icon: "🐻", text: "A bear cub opens the door" },
      { icon: "🐾", text: "Two sets of tracks go to the trees" },
      { icon: "🛴", text: "{hero} grabs her scooter" },
    ],
    wrong: "Not yet! Which thing happened FIRST? Read the words on each picture.",
    after: "The gate creaks open. \"Good story,\" it rumbles.",
    hint: "First the rabbit is asleep. Then someone opens the door. Then there are tracks. Then {hero} follows.",
  },
  {
    id: "meadow-5", area: "meadow", type: "segments", title: "Peeling the orange",
    skills: ["maths"], reward: 1,
    before: "{hero}'s tummy rumbles. Pip peels a big orange: ten juicy segments in a circle!",
    task: "Eat 4 segments. Then tap how many are left for later.",
    total: 10, eat: 4,
    wrong: "Nom nom… let's count the segments that are still there. Tap them one by one!",
    after: "Six saved for later. {hero} wipes her sticky fingers on the grass.",
    hint: "Ten segments, four are gone. Count the ones still on the peel.",
  },
  {
    id: "meadow-6", area: "meadow", type: "cards", title: "Berry Berry!",
    skills: ["maths"], reward: 2,
    before: "Rustle rustle! A bear cub tumbles out of the bushes. \"I'm {cub}! Play Berry Berry with me and I'll tell you where I went!\"",
    task: "Match the colour of {cub}'s card to steal a berry token. First to 8 tokens wins!",
    target: 8, tokenValue: 1,
    wrong: "\"Ha! Wrong colour!\" {cub} grabs a token. Look at his card's colour again.",
    after: "\"You win!\" {cub} rolls over laughing. \"I went into the forest. Follow me if you can!\"",
    hint: "Look at the colour of the cub's card. Tap the card in your hand with the same colour.",
  },
  // ---------------- Area 2: Whispering Forest ----------------
  {
    id: "forest-1", area: "forest", type: "signpost", title: "The fork",
    skills: ["reading"], reward: 1,
    before: "The trail splits three ways under the big trees. A note is nailed to a trunk in wobbly bear handwriting: \"I went the way with the TALLEST trees.\"",
    task: "Read the note. Look at each trail. Tap the trail with the tallest trees.",
    signs: [
      { icon: "🌱🌱🌱", text: "Sunny Trail" },
      { icon: "🌲🌲🌲", text: "Fern Trail", correct: true },
      { icon: "🌳🌿🌳", text: "Moss Trail" },
    ],
    wrong: "Hmm, {tapped}? Look at the pictures. Which trail has the TALLEST trees?",
    after: "Up the Fern Trail, where the trees touch the sky. Pip has to tip his head all the way back.",
    hint: "The note says tallest. Compare the tree pictures on the three signs. Which trees are the tallest?",
  },
  {
    id: "forest-2", area: "forest", type: "fill", title: "Feeding the bears",
    skills: ["reading", "maths"], reward: 2,
    before: "A big mama bear sits right in the middle of the path. \"Nobody passes on an empty stomach,\" she yawns. \"Here's what my family eats for lunch.\"",
    task: "We eat 6 fish, 5 berries, 4 nuts and 2 honeycombs. Fill the basket.",
    container: "🧺",
    showTarget: false,
    target: 17,
    choices: [
      { n: 6, icon: "🐟", label: "6 fish", need: true },
      { n: 3, icon: "🍄", label: "3 mushrooms" },
      { n: 5, icon: "🫐", label: "5 berries", need: true },
      { n: 4, icon: "🌰", label: "4 nuts", need: true },
      { n: 1, icon: "🥕", label: "1 carrot" },
      { n: 2, icon: "🍯", label: "2 honeycombs", need: true },
    ],
    wrong: "Mama bear sniffs the basket. \"That's not our lunch!\" Read her list again. Tap a card in the basket to take it out.",
    after: "Seventeen snacks! The bears munch happily and mama bear waves a paw up the trail.",
    hint: "The list has four foods: fish, berries, nuts and honeycombs. Only those four cards go in.",
  },
  {
    id: "forest-3", area: "forest", type: "boards", title: "Chop the logs",
    skills: ["maths"], reward: 1,
    before: "A pile of fallen logs blocks the whole path. {hero} bows, just like at karate class, and lifts her hand. HI-YA!",
    task: "There are 12 logs. Chop 5 of them. Then tap how many still stand.",
    total: 12, chop: 5,
    wrong: "Hi-ya… hmm! Count the logs that are still whole. Point at each one and count!",
    after: "Seven logs left, and a gap just big enough for a hero. Pip scampers through first.",
    hint: "Twelve logs, five are chopped. Count the whole ones that are left.",
  },
  {
    id: "forest-4", area: "forest", type: "listen", title: "The parrot in the pines",
    skills: ["reading"], reward: 1,
    before: "A bright parrot swoops down. \"I saw the bear cub!\" it squawks. \"He hid something. I'll SAY where, and you find the word on a tree!\"",
    task: "Tap the parrot to hear the word. Then tap the tree with that word.",
    words: ["river", "honey", "nest", "cave", "bridge"],
    answer: "honey", picture: "🍯",
    wrong: "The parrot ruffles its feathers. \"Listen again!\" Tap the parrot, then find the word that matches.",
    after: "Honey! Under the honey tree there's a scrap of paper with the cub's paw print on it.",
    hint: "The parrot says a word that starts with H. Which tree sign starts with H?",
  },
  {
    id: "forest-5", area: "forest", type: "note", title: "The cub's note",
    skills: ["reading", "maths"], reward: 2,
    before: "The paper is a note from {cub}, in sticky honey letters. Rocks are scattered all over the clearing, each with a number painted on it.",
    task: "Read the note. Then tap the rock it tells you about.",
    note: "I hid a snack under the rock with 3 more than 8. Yum! From {cub}",
    objects: [
      { icon: "🪨", n: 9 },
      { icon: "🪨", n: 10 },
      { icon: "🪨", n: 11 },
      { icon: "🪨", n: 12 },
      { icon: "🪨", n: 14 },
      { icon: "🪨", n: 5 },
    ],
    answer: 2,
    wrong: "Nothing under {tapped}. Read the note again: 3 MORE than 8. Count up from 8 on your fingers!",
    after: "A carrot! Half-eaten, with big rabbit teeth marks. {rabbit} was here!",
    hint: "Start at 8 and count 3 more: 9, 10, 11. Which rock has that number?",
  },
  {
    id: "forest-6", area: "forest", type: "cards", title: "Berry Berry, round two",
    skills: ["maths"], reward: 2,
    before: "\"Found you!\" {cub} pops out from behind a stump. \"New rule: some berry tokens are worth 2 or 3! Add up your pile as you go.\"",
    task: "Match the colour of {cub}'s card. Tokens are worth 1, 2 or 3 this time. First to 8 wins!",
    target: 8, tokenValue: [1, 2, 3],
    wrong: "\"Ha! Wrong colour!\" {cub} snatches the token. Look at his card's colour again.",
    after: "\"You're too good!\" {cub} tumbles off towards the sound of rushing water.",
    hint: "Look only at the colour of the cub's card. Tap the card in your hand with the same colour.",
  },
];

if (typeof module !== "undefined") module.exports = { BELTS, AREAS, SCENES };
