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
    blurb: "Tall trees, a big bear, and a parrot who talks a lot.",
    companion: { name: "Pip", emoji: "🐿️", kind: "marmot" },
    clue: "A half-eaten carrot! And cub prints. They go to the water.",
  },
  {
    id: "river", title: "Paradise River", emoji: "🏞️", belt: "green",
    blurb: "Nets, boats, a toll, and a maze of rocks.",
    companion: { name: "Pip", emoji: "🐿️", kind: "marmot" },
    clue: "Rabbit prints in the mud! They go up. Onto the ice.",
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
    id: "forest-1", area: "forest", type: "detective", title: "Four paths",
    skills: ["reading"], reward: 2,
    before: "The forest! Four paths go in. Which one? Pip finds a note. It is from {cub}.",
    task: "Read the note. Tap the path the cub took.",
    clues: "I did not go by the water. My path has tall trees. My path has no flowers.",
    rules: [
      { tag: "water", has: false, say: "The note says: not by the water." },
      { tag: "tall", has: true, say: "The note says: tall trees." },
      { tag: "flowers", has: false, say: "The note says: no flowers." },
    ],
    suspects: [
      { icon: "🌲🌲💧", label: "the stream path", tags: ["tall", "water"] },
      { icon: "🌲🌲🌸", label: "the flower path", tags: ["tall", "flowers"] },
      { icon: "🌲🌲🍄", label: "the mushroom path", tags: ["tall"] },
      { icon: "🌿🌿🌿", label: "the fern path", tags: [] },
    ],
    answer: 2,
    wrong: "Not {tapped}. {clue} Look again.",
    after: "The mushroom path! Pip runs ahead. Then stops. A big bear!",
    hint: "Cross out the path with water. Cross out the path with flowers. Cross out the short plants. One is left.",
  },
  {
    id: "forest-2", area: "forest", type: "scale", title: "Mama bear's scale",
    skills: ["maths"], reward: 2,
    before: "Mama bear sits on the path. \"My scale is broken. Fix it. Then you may pass.\"",
    task: "Put all the rocks on the scale. Make both sides the same.",
    rocks: [1, 2, 3, 4, 5, 7],
    wrong: "Tilt! Left is {left}. Right is {right}. Move a rock.",
    after: "Balanced! Mama bear yawns. \"Go on. Mind the parrot. It talks a lot.\"",
    hint: "All the rocks make 22. So each side needs 11. Which rocks make 11?",
  },
  {
    id: "forest-3", area: "forest", type: "wordbuild", title: "The parrot's riddle",
    skills: ["reading"], reward: 2,
    before: "A parrot! \"I know where the cub went. Solve my riddle first!\"",
    task: "Read the riddle. Spell the answer with the letters.",
    riddle: "I am sweet. Bees make me. Bears love me. What am I?",
    word: "honey", letters: ["h", "o", "n", "e", "y", "m", "t"], picture: "🍯",
    wrong: "Not {letter}. Say the word slowly. What sound comes next?",
    after: "Honey! \"Yes!\" squawks the parrot. \"The cub went to the honey tree!\"",
    hint: "Bees make it. It is sticky and yellow. It starts with H.",
  },
  {
    id: "forest-4", area: "forest", type: "pattern", title: "Sticky prints",
    skills: ["maths"], reward: 2,
    before: "The honey tree! Sticky paw prints lead away. They make a pattern.",
    task: "Look at the pattern. Fill the empty spots.",
    sequence: ["🐾", "🐾", "🍯", "🐾", "🐾", "🍯", "🐾", null, null, "🐾", "🐾", null],
    answers: ["🐾", "🍯", "🍯"],
    tiles: ["🐾", "🍯", "🌰"],
    wrong: "Hmm. Say the pattern out loud. Paw, paw, honey. Paw, paw, honey…",
    after: "Paw, paw, honey! The prints go into the thick trees.",
    hint: "The pattern repeats: paw, paw, honey. What comes after two paws?",
  },
  {
    id: "forest-5", area: "forest", type: "path", title: "The thick trees",
    skills: ["reading", "maths"], reward: 3,
    before: "Thick trees. Acorns on the ground. And one more note from {cub}.",
    task: "Read the note. Tap squares to make a path. Then press Go.",
    clues: "Come to the X. Pick up all 3 acorns. Use 9 steps. No more, no less!",
    grid: ["S....", ".aa..", "...##", "#a..X"],
    steps: 9,
    wrong: "Steps: {steps}. Acorns: {acorns}. The note says 9 steps and 3 acorns. Try a new path.",
    after: "9 steps, 3 acorns! Through the trees. Rustle! Who is that?",
    hint: "Go down first to get the acorn at the bottom. Then across. Count each step.",
  },
  {
    id: "forest-6", area: "forest", type: "memory", title: "Berry Berry, forest rules",
    skills: ["maths"], reward: 3,
    before: "{cub} again! \"Forest rules! Leaves hide numbers. Find two that make 10.\"",
    task: "Flip two leaves. If they make 10, they stay. Find all 5 pairs.",
    values: [1, 9, 2, 8, 3, 7, 4, 6, 5, 5], sum: 10,
    wrong: "{a} and {b} make {total}. Not 10. Remember where they are!",
    after: "All five pairs! {cub} grins. \"We went to the river. Race you!\"",
    hint: "Which pairs make 10? 1 and 9. 2 and 8. 3 and 7. 4 and 6. 5 and 5. Now remember the leaves.",
  },
  // ---------------- Area 3: Paradise River ----------------
  {
    id: "river-1", area: "river", type: "sortbins", title: "The otter's nets",
    skills: ["maths"], reward: 2,
    before: "The river! An otter sits by two nets. \"Help me sort my fish. I started. You finish!\"",
    task: "Look at the fish in each net. Find the rule. Sort the rest.",
    bins: [
      { label: "Net one", examples: [2, 4, 8] },
      { label: "Net two", examples: [1, 5, 7] },
    ],
    items: [3, 6, 9, 10, 12, 15],
    rule: "even",
    wrong: "The otter shakes his head. Fish {tapped} does not go in {bin}. Look at the numbers in each net.",
    after: "All sorted! \"Pairs in one net. Odd ones out in the other,\" says the otter. \"Now, boats!\"",
    hint: "Net one has 2, 4, 8. Each can split into two equal piles. Net two has 1, 5, 7. They cannot.",
  },
  {
    id: "river-2", area: "river", type: "logicgrid", title: "Three boats",
    skills: ["reading"], reward: 2,
    before: "Three boats. Three friends want to cross. But who sits where? Pip finds a note.",
    task: "Read the note. Put each friend in the right boat.",
    clues: "The frog is not in the red boat. The otter is in the blue boat. The beaver sits next to the frog.",
    people: [
      { name: "otter", icon: "🦦" },
      { name: "frog", icon: "🐸" },
      { name: "beaver", icon: "🦫" },
    ],
    places: [
      { name: "red boat", icon: "🛶", color: "#ff5e5e" },
      { name: "green boat", icon: "🛶", color: "#3ac569" },
      { name: "blue boat", icon: "🛶", color: "#4d7cff" },
    ],
    rules: [
      { who: "frog", not: "red boat", say: "The note says: the frog is not in the red boat." },
      { who: "otter", is: "blue boat", say: "The note says: the otter is in the blue boat." },
      { next: ["beaver", "frog"], say: "The note says: the beaver sits next to the frog." },
    ],
    wrong: "Not yet. {clue} Try again.",
    after: "Everyone is in! The boats float over. Now, a bridge. With a toll.",
    hint: "Start with the otter. The note says blue. Then the frog: not red. Where can the frog go?",
  },
  {
    id: "river-3", area: "river", type: "tens", title: "The bridge toll",
    skills: ["reading", "maths"], reward: 3,
    before: "A bridge! An otter and a beaver hold out their paws. \"Pay us! Both of us!\"",
    task: "Read the tags. Pay both at once. Your paws can hold only 10 things.",
    prices: [{ who: "🦦 otter", n: 23 }, { who: "🦫 beaver", n: 14 }],
    limit: 10,
    wrong: "You paid {total} with {items} things. It must be 37. And 10 things or less.",
    after: "37! Three bags and 7 pebbles. The bridge is yours.",
    hint: "23 and 14. Bags first: 2 bags and 1 bag. Then pebbles: 3 and 4.",
  },
  {
    id: "river-4", area: "river", type: "equation", title: "Salmon sums",
    skills: ["maths"], reward: 2,
    before: "A waterfall! Salmon jump up in groups. A wise old salmon says: \"Make two true sums. Use every tile.\"",
    task: "Use all the tiles. Make two sums that are true.",
    tiles: [6, 9, 15, 7, 8, 15], sentences: 2,
    wrong: "{tapped} is not true. Check each sum. Which two tiles make 15?",
    after: "Two true sums! The salmon bows. \"Up the river is a maze of rocks. Take a boat.\"",
    hint: "Which two tiles make 15? Try 6 and 9. Then 7 and 8.",
  },
  {
    id: "river-5", area: "river", type: "program", title: "The rock maze",
    skills: ["reading", "maths"], reward: 4,
    before: "A boat! But rocks are all over. Pip finds a note on the paddle.",
    task: "Read the note. Put cards in order. Press Go. Watch the boat!",
    clues: "Catch both fish. Reach the flag. Use 12 cards or less.",
    map: ["S.f.#.", ".#.#..", "....#.", "#.f..F", "..#..."],
    maxCards: 12,
    cards: ["move", "left", "right", "pickup"],
    solution: ["move", "move", "pickup", "right", "move", "move", "move", "pickup", "left", "move", "move", "move"],
    wrong: "{reason} Fix your cards. Press Go again.",
    after: "Both fish and the flag! What a captain. Teddy waits on the bank.",
    hint: "One part at a time. First reach the fish. Catch it. Then turn right and go down.",
  },
  {
    id: "river-6", area: "river", type: "guess", title: "Berry Berry, river rules",
    skills: ["maths"], reward: 4,
    before: "{cub}! \"River rules! I hid a number from 1 to 20. Ask me 5 questions. Then guess!\"",
    task: "Ask smart questions. Find {cub}'s number.",
    min: 1, max: 20, questions: 5,
    wrong: "\"Nope!\" {cub} giggles. It is not {guess}. Ask more questions.",
    after: "\"You got it!\" {cub} jumps. \"{rabbit} went up onto the ice. Brrr!\"",
    hint: "Ask: is it bigger than 10? Then bigger than 15, or bigger than 5. Each answer cuts the numbers in half.",
  },
];

if (typeof module !== "undefined") module.exports = { BELTS, AREAS, SCENES, STORY_PAGES };
