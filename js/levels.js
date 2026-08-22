"use strict";

// Level data for RoboQuest. Each level teaches ONE new idea.
// World coordinates: x = column (0 = left), y = row (0 = top).
// Directions: N, E, S, W.
// Win = Robo stands on the flag 🏁 AND every gem 💎 is picked up.

// Chapters group levels in the table of contents, matched by level id prefix.
const CHAPTERS = [
  { prefix: "seq",   title: "Instructions",  emoji: "👣", blurb: "Robo does exactly what you say, one line at a time." },
  { prefix: "loop",  title: "Loops",         emoji: "🔁", blurb: "Say it once, do it many times." },
  { prefix: "if",    title: "If / Else",     emoji: "🔍", blurb: "Let Robo check and decide by itself." },
  { prefix: "while", title: "While Loops",   emoji: "🌀", blurb: "Keep going until something changes." },
  { prefix: "fn",    title: "Functions",     emoji: "🎓", blurb: "Teach Robo brand-new words." },
  { prefix: "draw",  title: "Art with Code", emoji: "🎨", blurb: "Programs that draw pictures!" },
];

// Handbook pages: every command with a kid-voice explanation and a worked example.
// `cmd` ties the page to the level that introduces it (for unlock-aware display).
// `demo` is a tiny world — the spellbook runs `example` in it with the REAL
// interpreter and animates the steps, so demos can never lie about the language.
const HANDBOOK = [
  {
    name: "move",
    cmd: "move",
    syntax: "move",
    explain:
      "Robo walks 1 square in the direction it's facing. Add a number to walk further: \"move 3\" walks 3 squares. Careful — if a wall is in the way, Robo bonks into it and the program stops!",
    example: "move\nmove 3",
    exampleNote: "Robo walks 1 square, then 3 more. 4 squares in total.",
    demo: { cols: 6, rows: 1, robot: { x: 0, y: 0, dir: "E" } },
  },
  {
    name: "turn",
    cmd: "turn",
    syntax: "turn left · turn right",
    explain:
      "Robo spins in place a quarter turn — it doesn't move to a new square. The little arrow on Robo always shows which way it's facing. Two turns the same way = facing backwards!",
    example: "move\nturn right\nmove",
    exampleNote: "Walk, turn, walk — Robo goes around a corner.",
    demo: { cols: 3, rows: 2, robot: { x: 0, y: 0, dir: "E" } },
  },
  {
    name: "pickup",
    cmd: "pickup",
    syntax: "pickup",
    explain:
      "Grabs the gem 💎 on the square Robo is standing on. If there's no gem there, Robo gets confused and the program stops — so make sure you're on a gem (or check first with \"if gem here:\").",
    example: "move\npickup",
    exampleNote: "Walk onto the gem's square, then grab it.",
    demo: { cols: 3, rows: 1, robot: { x: 0, y: 0, dir: "E" }, gems: [[1, 0]] },
  },
  {
    name: "drop",
    cmd: "drop",
    syntax: "drop · drop A",
    explain:
      "Robo stamps the square it's standing on. Plain \"drop\" stamps a star ⭐. Give it a character to stamp that instead: \"drop A\" stamps an A, \"drop =\" stamps =. Only one stamp fits per square — stamping the same spot twice stops the program. In art levels, match the faded hints exactly (and stamp nowhere else!) to finish the picture.",
    example: "drop\nmove\ndrop A",
    exampleNote: "A star, then the letter A on the next square.",
    demo: { cols: 3, rows: 1, robot: { x: 0, y: 0, dir: "E" } },
  },
  {
    name: "goto",
    cmd: "goto",
    syntax: "goto 4 2",
    explain:
      "The art studio's magic crane! It lifts Robo up and sets it down at column 4, row 2 — count squares from 0, starting at the top-left corner. Columns go left-to-right, rows go top-to-bottom. Perfect for jumping to the next part of your drawing. (No cranes in the caves — in adventure levels Robo has to walk!)",
    example: "drop\ngoto 4 2\ndrop",
    exampleNote: "A star at the start, then the crane carries Robo to column 4, row 2 for the next one.",
    demo: { cols: 6, rows: 3, robot: { x: 0, y: 0, dir: "E" }, target: [[0, 0], [4, 2]] },
  },
  {
    name: "repeat",
    cmd: "repeat",
    syntax: "repeat 4:",
    explain:
      "Does the lines under it 4 times (or any number you pick). The lines that get repeated must be pushed in by 2 spaces — that's how Robo knows which lines belong to the loop. Loops can even go inside other loops!",
    example: "repeat 4:\n  move\n  pickup",
    exampleNote: "Move-and-grab, four times in a row — 2 lines instead of 8!",
    demo: { cols: 5, rows: 1, robot: { x: 0, y: 0, dir: "E" }, gems: [[1, 0], [2, 0], [3, 0], [4, 0]] },
  },
  {
    name: "if / else",
    cmd: "if",
    syntax: "if gem here:",
    explain:
      "Robo checks something, and only does the lines under it if it's true. Add \"else:\" right below for what to do otherwise. This is how Robo makes decisions on its own!",
    example: "repeat 4:\n  if wall ahead:\n    turn right\n  else:\n    move",
    exampleNote: "At a wall Robo turns; otherwise it walks. Four decisions, all made by Robo!",
    demo: { cols: 3, rows: 3, robot: { x: 0, y: 0, dir: "E" } },
  },
  {
    name: "while",
    cmd: "while",
    syntax: "while not wall ahead:",
    explain:
      "Like repeat, but instead of counting, Robo keeps doing the lines as long as the check is true. Perfect when you don't know how many times — \"walk until you hit the wall\" works in any size room!",
    example: "while not wall ahead:\n  move",
    exampleNote: "Robo walks any distance and stops right before the wall.",
    demo: { cols: 6, rows: 1, robot: { x: 0, y: 0, dir: "E" } },
  },
  {
    name: "define",
    cmd: "define",
    syntax: "define dance:",
    explain:
      "Teaches Robo a brand-new word! Put the moves under it (pushed in 2 spaces). Nothing happens yet when Robo learns it — but then you can write the new word on its own line, as many times as you like.",
    example: "define dance:\n  turn left\n  turn right\ndance\ndance",
    exampleNote: "Robo learns \"dance\", then dances twice.",
    demo: { cols: 3, rows: 1, robot: { x: 1, y: 0, dir: "N" } },
  },
  {
    name: "Robo's checks",
    cmd: "if",
    syntax: "gem here · wall ahead · clear ahead · at goal",
    explain:
      "These go after \"if\" and \"while\". Robo can check: is there a gem on my square? Is there a wall (or the edge of the world) right in front of me? Is the way ahead clear? Am I standing on the flag? Put \"not\" in front of any check to flip it.",
    example: "while not at goal:\n  if clear ahead:\n    move\n  else:\n    turn left",
    exampleNote: "Keep going toward the flag, turning whenever the way is blocked.",
    demo: { cols: 3, rows: 2, robot: { x: 0, y: 0, dir: "E" }, walls: [[2, 0]], goal: { x: 2, y: 1 } },
  },
];

const COMMAND_DOCS = {
  move:   { syntax: "move",                  desc: "Walk 1 square forward. \"move 3\" walks 3 squares." },
  turn:   { syntax: "turn left · turn right", desc: "Turn to face a new direction." },
  pickup: { syntax: "pickup",                desc: "Pick up the gem 💎 on Robo's square." },
  drop:   { syntax: "drop · drop A",         desc: "Stamp Robo's square: a star ⭐, or any character — \"drop A\" stamps an A. One per square!" },
  goto:   { syntax: "goto 4 2",              desc: "The studio crane lifts Robo to column 4, row 2 — count from 0, top-left! Art levels only." },
  repeat: { syntax: "repeat 4:",             desc: "Do the indented lines under it 4 times." },
  if:     { syntax: "if gem here:",          desc: "Only do the lines under it when it's true. Add \"else:\" for otherwise." },
  while:  { syntax: "while not wall ahead:", desc: "Keep doing the lines under it as long as it's true." },
  define: { syntax: "define dance:",         desc: "Teach Robo a new word! Later, write \"dance\" on its own line to do it." },
};

const CHECKS_NOTE =
  "Things Robo can check: <b>gem here</b> · <b>wall ahead</b> · <b>clear ahead</b> · <b>at goal</b>. Put <b>not</b> in front to flip it.";

// Helper for drawing levels: a horizontal run of cells from x1 to x2 on row y.
// Optional ch: the character to stamp there (default: a star).
function hrow(x1, x2, y, ch) {
  const cells = [];
  for (let x = x1; x <= x2; x++) cells.push(ch ? [x, y, ch] : [x, y]);
  return cells;
}

// Helper for drawing levels: all border cells of a cols × rows grid.
function perimeter(cols, rows) {
  const cells = [];
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) cells.push([x, y]);
    }
  }
  return cells;
}

const LEVELS = [
  // ---------- SEQUENCING ----------
  {
    id: "seq-1",
    title: "First Steps",
    concept: "Instructions",
    conceptEmoji: "👣",
    newCommands: ["move"],
    intro:
      "Meet <b>Robo</b> 🤖! Robo only does exactly what your program says, one line at a time. " +
      "Write <b>move</b> on its own line to make Robo walk one square forward. " +
      "Get Robo to the flag 🏁!",
    hint: "Robo is 3 squares away from the flag. How many times should you write \"move\"?",
    world: {
      cols: 5, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [], gems: [],
      goal: { x: 3, y: 1 },
    },
    solution: "move\nmove\nmove",
  },
  {
    id: "seq-2",
    title: "Turn the Corner",
    concept: "Instructions",
    conceptEmoji: "👣",
    newCommands: ["turn"],
    intro:
      "Robo can't walk sideways — it has to <b>turn</b> first! " +
      "Use <b>turn right</b> or <b>turn left</b> to change the way Robo is facing. " +
      "The little arrow on Robo shows which way it's looking.",
    hint: "Walk to the corner first, then turn right, then keep walking.",
    world: {
      cols: 4, rows: 3,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      goal: { x: 3, y: 2 },
    },
    solution: "move\nmove\nmove\nturn right\nmove\nmove",
  },
  {
    id: "seq-3",
    title: "Treasure Trail",
    concept: "Instructions",
    conceptEmoji: "👣",
    newCommands: ["pickup"],
    intro:
      "Gems! 💎 Robo must pick up <b>every</b> gem before reaching the flag. " +
      "Walk onto a gem's square, then write <b>pickup</b> to grab it.",
    hint: "move onto the first gem, pickup, keep going to the next gem, pickup, then walk to the flag.",
    world: {
      cols: 6, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[1, 1], [3, 1]],
      goal: { x: 4, y: 1 },
    },
    solution: "move\npickup\nmove\nmove\npickup\nmove",
  },

  // ---------- LOOPS ----------
  {
    id: "loop-1",
    title: "The Long Road",
    concept: "Loops",
    conceptEmoji: "🔁",
    newCommands: ["repeat"],
    intro:
      "That flag is 9 squares away. You <b>could</b> write it the hard way…" +
      "<div class='code-compare'>" +
      "<div class='code-col bad'><span class='code-label'>😫 the hard way</span>" +
      "<code>move<br>move<br>move<br>move<br>move<br>move<br>move<br>move<br>move</code></div>" +
      "<div class='code-col good'><span class='code-label'>😎 the loop way</span>" +
      "<code>repeat 9:<br>&nbsp;&nbsp;move</code></div>" +
      "</div>" +
      "Both do exactly the same thing — but the loop is 2 lines instead of 9! " +
      "The lines you push in with <b>2 spaces</b> are the ones that get repeated. " +
      "Now imagine the flag was <b>100</b> squares away… 😅",
    hint: "You only need 2 lines: a \"repeat 9:\" line, and a \"move\" line pushed in with 2 spaces.",
    world: {
      cols: 10, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [], gems: [],
      goal: { x: 9, y: 1 },
    },
    maxLines: 2,
    solution: "repeat 9:\n  move",
  },
  {
    id: "loop-2",
    title: "The Staircase",
    concept: "Loops",
    conceptEmoji: "🔁",
    newCommands: [],
    intro:
      "Loops can repeat <b>more than one line</b>. Every line pushed in under <b>repeat</b> " +
      "happens each time around. This staircase repeats the same little climb 3 times — " +
      "figure out the pattern for ONE stair, then loop it!",
    hint: "One stair is: move, turn left, move, turn right. Put those 4 lines inside a repeat 3:",
    world: {
      cols: 5, rows: 4,
      robot: { x: 0, y: 3, dir: "E" },
      walls: [
        [2, 3], [3, 3], [4, 3], [3, 2], [4, 2], [4, 1],
        [0, 2], [0, 1], [1, 1], [0, 0], [1, 0], [2, 0], [4, 0],
      ],
      gems: [],
      goal: { x: 3, y: 0 },
    },
    maxLines: 6,
    solution: "repeat 3:\n  move\n  turn left\n  move\n  turn right",
  },
  {
    id: "loop-3",
    title: "Gem Gobbler",
    concept: "Loops",
    conceptEmoji: "🔁",
    newCommands: [],
    intro:
      "A whole row of gems! Each step is the same: walk forward, grab the gem. " +
      "When you spot a pattern that happens over and over — that's a loop waiting to happen.",
    hint: "Each time around the loop: move, then pickup. How many gems are there?",
    world: {
      cols: 8, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1]],
      goal: { x: 6, y: 1 },
    },
    maxLines: 4,
    solution: "repeat 6:\n  move\n  pickup",
  },

  // ---------- LOOPS: SIDE QUESTS (optional practice) ----------
  {
    id: "loop-p1",
    title: "The Mirror Cave",
    concept: "Side quest",
    conceptEmoji: "🌟",
    practice: true,
    newCommands: [],
    intro:
      "Robo wandered into the <b>Mirror Cave</b>, where everything is flipped! 🪞 " +
      "A staircase again — but this one goes down the <i>other</i> way. " +
      "Can your loop turn <b>left</b> where it used to turn right?",
    hint: "Just like the staircase — but flipped: repeat 4: move, turn left, move, turn right.",
    world: {
      cols: 5, rows: 5,
      robot: { x: 4, y: 0, dir: "W" },
      walls: [], gems: [],
      goal: { x: 0, y: 4 },
    },
    maxLines: 6,
    mustUse: ["repeat"],
    solution: "repeat 4:\n  move\n  turn left\n  move\n  turn right",
  },
  {
    id: "loop-p2",
    title: "The Sneaky Squirrel",
    concept: "Side quest",
    conceptEmoji: "🌟",
    practice: true,
    newCommands: [],
    intro:
      "A sneaky squirrel 🐿️ buried a gem every <b>3 squares</b> down the path — " +
      "and scampered off! Only 3 lines allowed, so make every line count. " +
      "Psst: <code>move 3</code> is one line…",
    hint: "One trip = walk 3, dig up a gem. Four gems, four trips: repeat 4: move 3, pickup.",
    world: {
      cols: 13, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[3, 1], [6, 1], [9, 1], [12, 1]],
      goal: { x: 12, y: 1 },
    },
    maxLines: 3,
    mustUse: ["repeat"],
    solution: "repeat 4:\n  move 3\n  pickup",
  },
  {
    id: "loop-p3",
    title: "Apple Picking",
    concept: "Side quest",
    conceptEmoji: "🌟",
    practice: true,
    newCommands: [],
    intro:
      "Harvest day! 🍎 Three tall trees, one shiny apple at the top of each. " +
      "For every tree it's the same dance: climb up, grab the apple, climb back down, " +
      "walk to the next tree. One loop can pick the whole orchard!",
    hint:
      "Each time around: move 3 (climb), pickup, turn right twice (face down), move 3, " +
      "then turn left, move 2, turn left to face the next tree.",
    world: {
      cols: 7, rows: 4,
      robot: { x: 0, y: 3, dir: "N" },
      walls: [],
      gems: [[0, 0], [2, 0], [4, 0]],
      goal: { x: 6, y: 3 },
    },
    maxLines: 9,
    mustUse: ["repeat"],
    solution:
      "repeat 3:\n  move 3\n  pickup\n  turn right\n  turn right\n  move 3\n  turn left\n  move 2\n  turn left",
  },

  // ---------- IF / ELSE ----------
  {
    id: "if-1",
    title: "Gem Detective",
    concept: "If",
    conceptEmoji: "🔍",
    newCommands: ["if"],
    intro:
      "Some squares have gems, some don't — and <b>pickup</b> on an empty square makes Robo grumpy! " +
      "With <b>if</b>, Robo checks first:<br><code>if gem here:<br>&nbsp;&nbsp;pickup</code><br>" +
      "The pickup only happens when there really is a gem. " + CHECKS_NOTE,
    hint: "Loop 6 times. Each time: move, then \"if gem here:\" with pickup indented under it.",
    world: {
      cols: 8, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[2, 1], [4, 1], [5, 1]],
      goal: { x: 6, y: 1 },
    },
    maxLines: 5,
    mustUse: ["if"],
    solution: "repeat 6:\n  move\n  if gem here:\n    pickup",
  },
  {
    id: "if-2",
    title: "Around the Island",
    concept: "If / Else",
    conceptEmoji: "🔍",
    newCommands: [],
    intro:
      "<b>else:</b> means \"otherwise\". Robo can make a decision every single step:<br>" +
      "<code>if wall ahead:<br>&nbsp;&nbsp;turn right<br>else:<br>&nbsp;&nbsp;move</code><br>" +
      "One tiny rule, repeated — and Robo finds its own way around the island!",
    hint: "repeat 12 times: if wall ahead, turn right — else, move. Robo bounces around the edge all by itself!",
    world: {
      cols: 5, rows: 4,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [[1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2]],
      gems: [],
      goal: { x: 1, y: 3 },
    },
    maxLines: 6,
    mustUse: ["if", "else"],
    solution: "repeat 12:\n  if wall ahead:\n    turn right\n  else:\n    move",
  },

  // ---------- WHILE ----------
  {
    id: "while-1",
    title: "How Far Is Far?",
    concept: "While loops",
    conceptEmoji: "🌀",
    newCommands: ["while"],
    worldLabel: "Hallway",
    intro:
      "Robo must cross <b>three hallways</b> — and they're all different lengths! " +
      "Click the tabs above the board to peek. 👀 " +
      "Write <b>ONE</b> program that works in every hallway — counting squares won't save you this time. " +
      "New power: <b>while</b> keeps going as long as something is true:<br>" +
      "<code>while not wall ahead:<br>&nbsp;&nbsp;move</code><br>" +
      "Robo walks and walks and stops right before the wall — no counting needed!",
    hint: "Just 2 lines: while not wall ahead: … move. The same 2 lines cross ANY hallway.",
    worlds: [
      { cols: 5,  rows: 3, robot: { x: 0, y: 1, dir: "E" }, walls: [], gems: [], goal: { x: 4,  y: 1 } },
      { cols: 9,  rows: 3, robot: { x: 0, y: 1, dir: "E" }, walls: [], gems: [], goal: { x: 8,  y: 1 } },
      { cols: 12, rows: 3, robot: { x: 0, y: 1, dir: "E" }, walls: [], gems: [], goal: { x: 11, y: 1 } },
    ],
    maxLines: 2,
    mustUse: ["while"],
    solution: "while not wall ahead:\n  move",
  },
  {
    id: "while-2",
    title: "The Gem Cave",
    concept: "While loops",
    conceptEmoji: "🌀",
    newCommands: [],
    worldLabel: "Cave",
    intro:
      "Two caves this time — different lengths, gems hiding in different spots. " +
      "One program must clear them <b>both</b>! Put your powers together: a <b>while</b> loop " +
      "to walk the cave, and an <b>if</b> inside it to grab gems only where they sparkle. ✨",
    hint: "while not wall ahead: move, then \"if gem here:\" pickup — the if goes INSIDE the while.",
    worlds: [
      {
        cols: 8, rows: 3,
        robot: { x: 0, y: 1, dir: "E" },
        walls: [],
        gems: [[2, 1], [6, 1]],
        goal: { x: 7, y: 1 },
      },
      {
        cols: 11, rows: 3,
        robot: { x: 0, y: 1, dir: "E" },
        walls: [],
        gems: [[1, 1], [4, 1], [8, 1]],
        goal: { x: 10, y: 1 },
      },
    ],
    maxLines: 4,
    mustUse: ["while", "if"],
    solution: "while not wall ahead:\n  move\n  if gem here:\n    pickup",
  },

  // ---------- FUNCTIONS ----------
  {
    id: "fn-1",
    title: "Teach Robo a Trick",
    concept: "Functions",
    conceptEmoji: "🎓",
    newCommands: ["define"],
    intro:
      "You can teach Robo <b>new words</b>! " +
      "<code>define side:</code> with lines under it makes a brand-new command called <b>side</b>. " +
      "Write <b>side</b> anywhere and Robo does the whole trick. " +
      "Walk the square, grab the corner gems, and come back home!",
    hint: "define side: (repeat 3: move, then pickup). Then do: repeat 3: side + turn right. Then repeat 3: move to get home.",
    world: {
      cols: 4, rows: 4,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [],
      gems: [[3, 0], [3, 3], [0, 3]],
      goal: { x: 0, y: 0 },
    },
    maxLines: 10,
    mustUse: ["define"],
    solution:
      "define side:\n  repeat 3:\n    move\n  pickup\nrepeat 3:\n  side\n  turn right\nrepeat 3:\n  move",
  },
  {
    id: "fn-2",
    title: "The Grand Cave",
    concept: "Everything!",
    conceptEmoji: "🏆",
    newCommands: [],
    worldLabel: "Cave",
    intro:
      "The final challenge! Two whole cave systems, each with two long tunnels and gems everywhere — " +
      "and the tunnels are all different lengths. Teach Robo one smart trick with <b>define</b>, " +
      "then use it for both tunnels — and win in <b>both caves</b> with one program. " +
      "Use everything you've learned — you've got this! 💪",
    hint: "define walk: (while not wall ahead: move + if gem here: pickup). Then: walk, turn right, walk.",
    worlds: [
      {
        cols: 7, rows: 6,
        robot: { x: 0, y: 0, dir: "E" },
        walls: [],
        gems: [[2, 0], [5, 0], [6, 2], [6, 4]],
        goal: { x: 6, y: 5 },
      },
      {
        cols: 9, rows: 4,
        robot: { x: 0, y: 0, dir: "E" },
        walls: [],
        gems: [[3, 0], [7, 0], [8, 2]],
        goal: { x: 8, y: 3 },
      },
    ],
    maxLines: 8,
    mustUse: ["define", "while"],
    solution:
      "define walk:\n  while not wall ahead:\n    move\n    if gem here:\n      pickup\nwalk\nturn right\nwalk",
  },

  // ---------- ART WITH CODE ----------
  {
    id: "draw-1",
    title: "Star Stamp",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: ["drop"],
    intro:
      "New power: <b>drop</b> puts a star ⭐ on Robo's square! " +
      "Art levels work differently: there's no flag. The dotted squares show the picture — " +
      "fill <b>every</b> dotted square with a star (and none anywhere else!) to win. " +
      "Start simple: a line of 3 stars.",
    hint: "Drop a star where you stand, walk one square, drop again… drop, move, drop, move, drop.",
    world: {
      cols: 5, rows: 3,
      robot: { x: 1, y: 1, dir: "E" },
      walls: [], gems: [],
      target: [[1, 1], [2, 1], [3, 1]],
    },
    solution: "drop\nmove\ndrop\nmove\ndrop",
  },
  {
    id: "draw-2",
    title: "The Long Line",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: [],
    intro:
      "An 8-star line — way too long to stamp by hand! " +
      "Spot the pattern: <b>drop</b>, then <b>move</b>, over and over. That's a loop!",
    hint: "repeat 8: with drop and move inside. Drop FIRST, then move — or Robo walks past the first square!",
    world: {
      cols: 10, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [], gems: [],
      target: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1]],
    },
    maxLines: 3,
    solution: "repeat 8:\n  drop\n  move",
  },
  {
    id: "draw-3",
    title: "Dotted Line",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: [],
    intro:
      "A dotted line: star, gap, star, gap… ✨ " +
      "The pattern repeats every <b>two</b> squares now. What goes inside the loop this time?",
    hint: "Each time around: drop, move, move (two moves = skip a square). Five stars means repeat 5.",
    world: {
      cols: 11, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [], gems: [],
      target: [[0, 1], [2, 1], [4, 1], [6, 1], [8, 1]],
    },
    maxLines: 4,
    solution: "repeat 5:\n  drop\n  move\n  move",
  },
  {
    id: "draw-4",
    title: "The Square",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: [],
    intro:
      "Draw the whole square outline! Here's the trick: a square is one side drawn <b>4 times</b> " +
      "with a turn after each. And one side is drop + move done 4 times. " +
      "A loop <b>inside</b> a loop — you're ready for it. 🤯",
    hint: "repeat 4: → inside it, repeat 4: (drop, move) → then turn right. The corners work themselves out!",
    world: {
      cols: 5, rows: 5,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      target: perimeter(5, 5),
    },
    maxLines: 6,
    mustUse: ["repeat"],
    solution: "repeat 4:\n  repeat 4:\n    drop\n    move\n  turn right",
  },
  {
    id: "draw-5",
    title: "The Grand Frame",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: [],
    worldLabel: "Board",
    intro:
      "Frame <b>two boards</b> — a small one and a big one — with the <b>same program</b>! " +
      "Teach Robo to draw one edge with <b>while</b> (keep stamping until the wall), " +
      "then use your new word 4 times. Watch your code frame a board of ANY size. 🖼️<br><br>" +
      "Fun fact: this is exactly how a real <b>web page</b> starts — with its outer frame. " +
      "In the final level, you design the whole page!",
    hint: "define edge: (while not wall ahead: drop + move). Then repeat 4: edge + turn right.",
    worlds: [
      {
        cols: 5, rows: 4,
        robot: { x: 0, y: 0, dir: "E" },
        walls: [], gems: [],
        target: perimeter(5, 4),
      },
      {
        cols: 8, rows: 6,
        robot: { x: 0, y: 0, dir: "E" },
        walls: [], gems: [],
        target: perimeter(8, 6),
      },
    ],
    maxLines: 7,
    mustUse: ["define", "while"],
    solution: "define edge:\n  while not wall ahead:\n    drop\n    move\nrepeat 4:\n  edge\n  turn right",
  },
  {
    id: "draw-6",
    title: "The Magic Crane",
    concept: "Coordinates",
    conceptEmoji: "🏗️",
    newCommands: ["goto"],
    intro:
      "The art studio has a <b>magic crane</b>! <code>goto 6 0</code> lifts Robo and sets it down " +
      "at <b>column 6, row 0</b> — count squares from <b>0</b>, starting at the top-left corner. " +
      "Columns go left-to-right ➡️, rows go top-to-bottom ⬇️. " +
      "No more long walks between drawings! Stamp a star on all <b>four corners</b> of the board.",
    hint:
      "Robo already starts on the first corner — drop! Then: goto 6 0, drop, goto 6 4, drop, goto 0 4, drop. " +
      "Column first, then row — and remember, counting starts at 0!",
    world: {
      cols: 7, rows: 5,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      target: [[0, 0], [6, 0], [6, 4], [0, 4]],
    },
    maxLines: 8,
    mustUse: ["goto"],
    solution: "drop\ngoto 6 0\ndrop\ngoto 6 4\ndrop\ngoto 0 4\ndrop",
  },
  {
    id: "draw-7",
    title: "Polka Dots",
    concept: "Coordinates",
    conceptEmoji: "🏗️",
    newCommands: [],
    intro:
      "A wallpaper of polka dots — three dotted rows, and the middle one is <b>shifted over</b>! " +
      "Here's the pro move: teach Robo to draw ONE dotted row with <b>define</b>, " +
      "then use the <b>crane</b> to jump to the start of each row. " +
      "Draw once, stamp everywhere. That's how real patterns are made!",
    hint:
      "define dotrow: (repeat 2: drop, move, move — then one last drop). " +
      "Robo starts at the first row, so: dotrow, goto 1 2, dotrow, goto 0 4, dotrow.",
    world: {
      cols: 7, rows: 5,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      target: [
        [0, 0], [2, 0], [4, 0],
        [1, 2], [3, 2], [5, 2],
        [0, 4], [2, 4], [4, 4],
      ],
    },
    maxLines: 12,
    mustUse: ["define", "goto"],
    solution:
      "define dotrow:\n" +
      "  repeat 2:\n" +
      "    drop\n" +
      "    move\n" +
      "    move\n" +
      "  drop\n" +
      "dotrow\n" +
      "goto 1 2\n" +
      "dotrow\n" +
      "goto 0 4\n" +
      "dotrow",
  },
  {
    id: "draw-8",
    title: "The Web Page",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: [],
    intro:
      "The final masterpiece: design a <b>web page</b>! Real web designers start exactly like this — " +
      "a sketch called a <i>wireframe</i>. One last trick: <b>drop</b> can stamp any character — " +
      "<code>drop =</code> stamps a <b>=</b>, <code>drop [</code> stamps a <b>[</b>. " +
      "Your page needs a <b>header</b>, a <b>menu</b>, a <b>line of text</b> — and <b>two buttons</b> " +
      "that look exactly the same. Draw a button twice? Never! Teach Robo <i>once</i>, " +
      "then let the crane carry it between them. " +
      "You're not just solving a puzzle anymore — you're building. 🧑‍💻",
    hint:
      "Teach Robo \"button\": drop [, move, drop +, move, drop ]. Each bar is a loop of (drop =, move) " +
      "plus one last drop =. Use goto 0 2, goto 0 4, goto 0 6 to jump between the bars — " +
      "and finish with: button, goto 6 6, button.",
    world: {
      cols: 9, rows: 7,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      target: [
        ...hrow(0, 8, 0, "="), // header bar
        ...hrow(0, 4, 2, "="), // menu
        ...hrow(0, 6, 4, "="), // a line of text
        [0, 6, "["], [1, 6, "+"], [2, 6, "]"], // left button
        [6, 6, "["], [7, 6, "+"], [8, 6, "]"], // right button
      ],
    },
    maxLines: 26,
    mustUse: ["define", "goto"],
    solution:
      "define button:\n" +
      "  drop [\n" +
      "  move\n" +
      "  drop +\n" +
      "  move\n" +
      "  drop ]\n" +
      "repeat 8:\n" +
      "  drop =\n" +
      "  move\n" +
      "drop =\n" +
      "goto 0 2\n" +
      "repeat 4:\n" +
      "  drop =\n" +
      "  move\n" +
      "drop =\n" +
      "goto 0 4\n" +
      "repeat 6:\n" +
      "  drop =\n" +
      "  move\n" +
      "drop =\n" +
      "goto 0 6\n" +
      "button\n" +
      "goto 6 6\n" +
      "button",
  },
];

if (typeof module !== "undefined") module.exports = { LEVELS, COMMAND_DOCS, CHECKS_NOTE, CHAPTERS, HANDBOOK };
