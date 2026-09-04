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

// The opening, told before the map: one picture and a few short words per page.
// Read aloud, tap to turn. Short sentences, common words — a 7-year-old reads along.
const STORY_PAGES = [
  { pic: "🐰", text: "This is {rabbit}. {rabbit} is a giant rabbit. {rabbit} lives with {hero}." },
  { pic: "🏠", text: "This is their home. Sunrise Meadow. Very near Mount Rainier." },
  { pic: "🌅", text: "One morning, the rabbit house is open. {rabbit} is gone!" },
  { pic: "🐾", text: "Look. Paw prints! Big ones. And little ones." },
  { pic: "🐿️", text: "This is Pip. Pip saw it all. \"A bear cub took {rabbit}! They went up the mountain!\"" },
  { pic: "🛴", text: "{hero} grabs her scooter. \"I'm coming, {rabbit}!\"" },
  { pic: "🏔️", text: "{hero}, please rescue {rabbit}! Solve all the puzzles. Climb the mountain!" },
];

const AREAS = [
  {
    id: "meadow", title: "Sunrise Meadow", emoji: "🌼", belt: "yellow",
    blurb: "Where the trail begins.",
    companion: { name: "Pip", emoji: "🐿️", kind: "marmot" },
    clue: "Look! Grey fur on the fence. And little paw prints. They go into the trees. {rabbit} went this way!",
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
    id: "meadow-1", area: "meadow", type: "signpost", title: "The three signs",
    skills: ["reading"], reward: 1,
    before: "The paw prints go to the fence. Three signs! Pip says: \"They went to the trees.\"",
    task: "Tap the sign that says trees.",
    signs: [
      { text: "To the pond" },
      { text: "To the trees", correct: true },
      { text: "To the barn" },
    ],
    wrong: "That one says {tapped}. Find the word trees. T, R, ee!",
    after: "Yes! Down the path we go. Oh! A big log is in the way.",
    hint: "Trees starts with T and R. Which sign starts with T, R?",
  },
  {
    id: "meadow-2", area: "meadow", type: "beam", title: "The log",
    skills: ["maths"], reward: 2,
    before: "A log! It is like a balance beam. Flowers grow on it. Pip says: \"Jump to flower 12. Use 3 jumps. Only 3!\"",
    task: "Pick 3 jumps. Land on flower 12.",
    start: 0, length: 14, target: 12, count: 3, jumps: [2, 3, 5],
    wrong: "You landed on {landed}. Not 12! Change a jump. Try again.",
    after: "12! Perfect landing. Pip claps. Past the log is a bag. Your bag!",
    hint: "Try a big jump first. 5 and 5 make 10. What jump gets to 12?",
  },
  {
    id: "meadow-3", area: "meadow", type: "fill", title: "The bag",
    skills: ["reading", "maths"], reward: 2,
    before: "Your bag! And a list from Pip. Pip loves lists.",
    task: "Read the list. Pack the bag.",
    clues: "Pack 12 snacks. Use 3 cards. Only 3!",
    container: "🎒",
    target: 12, exactCards: 3, showTarget: false,
    choices: [
      { n: 2, icon: "🍊", label: "2 oranges" },
      { n: 3, icon: "🥕", label: "3 carrots" },
      { n: 4, icon: "🍎", label: "4 apples" },
      { n: 5, icon: "🍇", label: "5 grapes" },
      { n: 6, icon: "🍌", label: "6 bananas" },
      { n: 7, icon: "🍪", label: "7 cookies" },
    ],
    wrong: "That makes {total} with {count} cards. Read the list again. Try other cards!",
    after: "12 snacks! Zip! Pip says: \"Look, a gate. It is locked.\"",
    hint: "Pick 3 cards. Add them up. Do they make 12? If not, swap one.",
  },
  {
    id: "meadow-4", area: "meadow", type: "order", title: "The gate",
    skills: ["reading"], reward: 2,
    before: "A big gate. Four pictures hang on it. And a sign with a riddle.",
    task: "Read the sign. Tap the pictures in the right order.",
    clues: "Sun first. Moon last. The bird comes right after the sun.",
    cards: [
      { icon: "☀️", text: "sun" },
      { icon: "🐦", text: "bird" },
      { icon: "🌳", text: "tree" },
      { icon: "🌙", text: "moon" },
    ],
    wrong: "Not that one. Read the sign again. What comes first?",
    after: "Click! The gate opens. Pip sniffs. \"I smell oranges!\"",
    hint: "The sign says sun first. Then the bird. The moon is last. So the tree is third.",
  },
  {
    id: "meadow-5", area: "meadow", type: "segments", title: "The orange tree",
    skills: ["maths"], reward: 2,
    before: "An orange tree! Pip peels a big orange. 12 segments! Pip has two friends. Three hungry animals!",
    task: "Share the 12 segments. Put the same on each plate.",
    total: 12, share: 3,
    wrong: "Look at the plates: {plates}. Not the same! Move some.",
    after: "4, 4 and 4. Fair! Everyone is happy. Then, rustle rustle. What is that?",
    hint: "Put one on each plate. Then one more on each plate. Keep going until the orange is empty.",
  },
  {
    id: "meadow-6", area: "meadow", type: "cards", title: "Berry Berry!",
    skills: ["maths"], reward: 3,
    before: "A bear cub! \"I am {cub}. Play Berry Berry with me! Then I will tell you a secret.\"",
    task: "Match the colour of {cub}'s card. Then pick a token: 1, 2 or 3. Reach exactly 10!",
    target: 10, pick: [1, 2, 3],
    wrong: "\"Ha! Wrong colour!\" {cub} grabs a token. Look at his card again.",
    after: "You win! {cub} laughs. \"I took {rabbit} into the forest. Come find us!\"",
    hint: "Match the colour first. Then add. Which token gets you closer to 10? Do not go past 10!",
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

if (typeof module !== "undefined") module.exports = { BELTS, AREAS, SCENES, STORY_PAGES };
