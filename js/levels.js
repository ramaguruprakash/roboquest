"use strict";

// Level data for RoboQuest. Each level teaches ONE new idea.
// World coordinates: x = column (0 = left), y = row (0 = top).
// Directions: N, E, S, W.
// Win = Robo stands on the flag 🏁 AND every gem 💎 is picked up.

// Chapters group levels in the table of contents, matched by level id prefix.
const CHAPTERS = [
  { prefix: "seq",   title: "Instructions",  emoji: "👣", blurb: "Robo does exactly what you say, one line at a time." },
  { prefix: "loop",  title: "Loops",         emoji: "🔁", blurb: "Say it once, do it many times." },
  { prefix: "var",   title: "Variables",     emoji: "📦", blurb: "Boxes with names that remember numbers." },
  { prefix: "if",    title: "If / Else",     emoji: "🔍", blurb: "Let Robo check and decide by itself." },
  { prefix: "while", title: "While Loops",   emoji: "🌀", blurb: "Keep going until something changes." },
  { prefix: "fn",    title: "Functions",     emoji: "🎓", blurb: "Teach Robo brand-new words." },
  { prefix: "draw",  title: "Art with Code", emoji: "🎨", blurb: "Programs that draw pictures!" },
];

// Handbook pages: every command with a kid-voice explanation and a worked example.
const HANDBOOK = [
  {
    name: "move",
    syntax: "move",
    explain:
      "Robo walks 1 square in the direction it's facing. Add a number to walk further: \"move 3\" walks 3 squares. Careful — if a wall is in the way, Robo bonks into it and the program stops!",
    example: "move\nmove 3",
    exampleNote: "Robo walks 1 square, then 3 more. 4 squares in total.",
  },
  {
    name: "turn",
    syntax: "turn left · turn right",
    explain:
      "Robo spins in place a quarter turn — it doesn't move to a new square. The little arrow on Robo always shows which way it's facing. Two turns the same way = facing backwards!",
    example: "move\nturn right\nmove",
    exampleNote: "Walk, turn, walk — Robo goes around a corner.",
  },
  {
    name: "pickup",
    syntax: "pickup",
    explain:
      "Grabs the gem 💎 on the square Robo is standing on. If there's no gem there, Robo gets confused and the program stops — so make sure you're on a gem (or check first with \"if gem here:\").",
    example: "move\npickup",
    exampleNote: "Walk onto the gem's square, then grab it.",
  },
  {
    name: "drop",
    syntax: "drop",
    explain:
      "Robo drops a star ⭐ on the square it's standing on. Only one star fits per square — dropping a second one on the same spot stops the program. In art levels, fill every dotted square (and no others!) to finish the picture.",
    example: "drop\nmove\ndrop",
    exampleNote: "Two stars, side by side.",
  },
  {
    name: "repeat",
    syntax: "repeat 4:",
    explain:
      "Does the lines under it 4 times (or any number you pick). The lines that get repeated must be pushed in by 2 spaces — that's how Robo knows which lines belong to the loop. Loops can even go inside other loops!",
    example: "repeat 4:\n  move\n  pickup",
    exampleNote: "Move-and-grab, four times in a row — 2 lines instead of 8!",
  },
  {
    name: "set",
    syntax: "set steps = 5",
    explain:
      "Makes a variable — a box with a name that remembers a number. Use the name anywhere a number goes. Math works too, with +, - and *. Change the number in one place, and everywhere that uses it changes!",
    example: "set steps = 5\nrepeat steps:\n  move\nset steps = steps + 1",
    exampleNote: "Robo walks 5 squares; then the box counts up to 6.",
  },
  {
    name: "if / else",
    syntax: "if gem here:",
    explain:
      "Robo checks something, and only does the lines under it if it's true. Add \"else:\" right below for what to do otherwise. This is how Robo makes decisions on its own!",
    example: "if wall ahead:\n  turn right\nelse:\n  move",
    exampleNote: "At a wall, Robo turns; otherwise it keeps walking.",
  },
  {
    name: "while",
    syntax: "while not wall ahead:",
    explain:
      "Like repeat, but instead of counting, Robo keeps doing the lines as long as the check is true. Perfect when you don't know how many times — \"walk until you hit the wall\" works in any size room!",
    example: "while not wall ahead:\n  move",
    exampleNote: "Robo walks any distance and stops right before the wall.",
  },
  {
    name: "define",
    syntax: "define dance:",
    explain:
      "Teaches Robo a brand-new word! Put the moves under it (pushed in 2 spaces). Nothing happens yet when Robo learns it — but then you can write the new word on its own line, as many times as you like.",
    example: "define dance:\n  turn left\n  turn right\ndance\ndance",
    exampleNote: "Robo learns \"dance\", then dances twice.",
  },
  {
    name: "Robo's checks",
    syntax: "gem here · wall ahead · clear ahead · at goal",
    explain:
      "These go after \"if\" and \"while\". Robo can check: is there a gem on my square? Is there a wall (or the edge of the world) right in front of me? Is the way ahead clear? Am I standing on the flag? Put \"not\" in front of any check to flip it.",
    example: "while not at goal:\n  if clear ahead:\n    move\n  else:\n    turn left",
    exampleNote: "Keep going toward the flag, turning whenever the way is blocked.",
  },
];

const COMMAND_DOCS = {
  move:   { syntax: "move",                  desc: "Walk 1 square forward. \"move 3\" walks 3 squares." },
  turn:   { syntax: "turn left · turn right", desc: "Turn to face a new direction." },
  pickup: { syntax: "pickup",                desc: "Pick up the gem 💎 on Robo's square." },
  drop:   { syntax: "drop",                  desc: "Drop a star ⭐ on Robo's square. One per square!" },
  repeat: { syntax: "repeat 4:",             desc: "Do the indented lines under it 4 times." },
  set:    { syntax: "set steps = 5",         desc: "Make a variable — a name that remembers a number. Use it anywhere a number goes." },
  if:     { syntax: "if gem here:",          desc: "Only do the lines under it when it's true. Add \"else:\" for otherwise." },
  while:  { syntax: "while not wall ahead:", desc: "Keep doing the lines under it as long as it's true." },
  define: { syntax: "define dance:",         desc: "Teach Robo a new word! Later, write \"dance\" on its own line to do it." },
};

const CHECKS_NOTE =
  "Things Robo can check: <b>gem here</b> · <b>wall ahead</b> · <b>clear ahead</b> · <b>at goal</b>. Put <b>not</b> in front to flip it.";

// Helper for drawing levels: a horizontal run of cells from x1 to x2 on row y.
function hrow(x1, x2, y) {
  const cells = [];
  for (let x = x1; x <= x2; x++) cells.push([x, y]);
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

  // ---------- VARIABLES ----------
  {
    id: "var-1",
    title: "The Magic Number",
    concept: "Variables",
    conceptEmoji: "📦",
    newCommands: ["set"],
    intro:
      "A <b>variable</b> is a box with a name that remembers a number. " +
      "Make one with <code>set steps = 7</code> — now you can write <b>steps</b> anywhere a number goes, " +
      "like <code>repeat steps:</code>. Change the number in ONE place and your whole program changes!",
    hint: "3 lines: set steps = 7, then repeat steps:, then an indented move.",
    world: {
      cols: 9, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [], gems: [],
      goal: { x: 7, y: 1 },
    },
    maxLines: 3,
    mustUse: ["set"],
    solution: "set steps = 7\nrepeat steps:\n  move",
  },
  {
    id: "var-2",
    title: "Twin Hallways",
    concept: "Variables",
    conceptEmoji: "📦",
    newCommands: [],
    intro:
      "Both hallways are exactly the <b>same length</b>. That's what variables are best at: " +
      "store the length once, then use it twice. If the maze changed size, you'd only fix one number!",
    hint: "set n = 4 · repeat n: move · turn right · repeat n: move",
    world: {
      cols: 6, rows: 6,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [[0, 2], [1, 2], [2, 2], [1, 4], [2, 4], [2, 5]],
      gems: [],
      goal: { x: 4, y: 4 },
    },
    maxLines: 7,
    mustUse: ["set"],
    solution: "set n = 4\nrepeat n:\n  move\nturn right\nrepeat n:\n  move",
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
    intro:
      "What if you <b>don't know</b> how long the hallway is? " +
      "<b>while</b> keeps going as long as something is true:<br>" +
      "<code>while not wall ahead:<br>&nbsp;&nbsp;move</code><br>" +
      "Robo walks and walks and stops right before the wall — no counting needed!",
    hint: "Just 2 lines: while not wall ahead: … move.",
    world: {
      cols: 12, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [], gems: [],
      goal: { x: 11, y: 1 },
    },
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
    intro:
      "Now put your powers together: a <b>while</b> loop to walk the unknown cave, " +
      "and an <b>if</b> inside it to grab gems only where they sparkle. ✨",
    hint: "while not wall ahead: move, then \"if gem here:\" pickup — the if goes INSIDE the while.",
    world: {
      cols: 10, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[2, 1], [5, 1], [8, 1]],
      goal: { x: 9, y: 1 },
    },
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
    intro:
      "The final challenge! Two long cave tunnels, gems everywhere, and you don't know the lengths. " +
      "Teach Robo one smart trick with <b>define</b>, then use it for both tunnels. " +
      "Use everything you've learned — you've got this! 💪",
    hint: "define walk: (while not wall ahead: move + if gem here: pickup). Then: walk, turn right, walk.",
    world: {
      cols: 7, rows: 6,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [],
      gems: [[2, 0], [5, 0], [6, 2], [6, 4]],
      goal: { x: 6, y: 5 },
    },
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
    intro:
      "A frame around the <b>whole world</b> — and pretend you don't know how big it is! " +
      "Teach Robo to draw one edge with <b>while</b> (keep stamping until the wall), " +
      "then use your new word 4 times. This works on a board of ANY size. 🖼️<br><br>" +
      "Fun fact: this is exactly how a real <b>web page</b> starts — with its outer frame. " +
      "Next level, you design the whole page!",
    hint: "define edge: (while not wall ahead: drop + move). Then repeat 4: edge + turn right.",
    world: {
      cols: 7, rows: 5,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      target: perimeter(7, 5),
    },
    maxLines: 7,
    mustUse: ["define", "while"],
    solution: "define edge:\n  while not wall ahead:\n    drop\n    move\nrepeat 4:\n  edge\n  turn right",
  },
  {
    id: "draw-6",
    title: "The Web Page",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: [],
    intro:
      "The final masterpiece: design a <b>web page</b>! Real web designers start exactly like this — " +
      "a sketch called a <i>wireframe</i>. Your page needs: a <b>header bar</b> across the top, " +
      "a <b>menu</b>, a <b>line of text</b>, and a <b>button</b> in the bottom corner. " +
      "Rows of different lengths, over and over… sounds like a job for a function with a variable! " +
      "You're not just solving a puzzle anymore — you're building. 🧑‍💻",
    hint:
      "Teach Robo two tricks. \"row\": repeat n - 1: (drop, move), then drop, then walk back (turn right twice, " +
      "move n - 1, turn right twice). \"down\": turn right, move 2, turn left. Then: set n = 9, row, down, " +
      "set n = 5, row, down, set n = 7, row, down, move 6, set n = 3, row.",
    world: {
      cols: 9, rows: 7,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      target: [
        ...hrow(0, 8, 0), // header bar
        ...hrow(0, 4, 2), // menu
        ...hrow(0, 6, 4), // a line of text
        ...hrow(6, 8, 6), // the button
      ],
    },
    maxLines: 28,
    mustUse: ["define", "set"],
    solution:
      "define row:\n" +
      "  repeat n - 1:\n" +
      "    drop\n" +
      "    move\n" +
      "  drop\n" +
      "  turn right\n" +
      "  turn right\n" +
      "  move n - 1\n" +
      "  turn right\n" +
      "  turn right\n" +
      "define down:\n" +
      "  turn right\n" +
      "  move 2\n" +
      "  turn left\n" +
      "set n = 9\n" +
      "row\n" +
      "down\n" +
      "set n = 5\n" +
      "row\n" +
      "down\n" +
      "set n = 7\n" +
      "row\n" +
      "down\n" +
      "move 6\n" +
      "set n = 3\n" +
      "row",
  },
];

if (typeof module !== "undefined") module.exports = { LEVELS, COMMAND_DOCS, CHECKS_NOTE, CHAPTERS, HANDBOOK };
