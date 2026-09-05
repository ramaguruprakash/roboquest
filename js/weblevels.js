"use strict";

// Robo's Web Studio — Season 1: HTML.
// A separate wing of RoboQuest: the kid writes real HTML in an editor and a
// live preview updates as they type. No grid, no interpreter — the browser IS
// the interpreter here.
//
// Each level:
//   starter   — body HTML pre-loaded in the editor (never a blank file!)
//   solution  — reference body HTML; rendered in the "make it like this" pane
//   checks    — forgiving DOM checks, run against the PREVIEW's document:
//               { find, min?, max?, textMin?, srcPattern?, label, miss }
//               · find: CSS selector
//               · matches are filtered by textMin (min chars of text) and
//                 srcPattern (RegExp the src attribute must match) if given
//               · then the count must be ≥ min (default 1) and ≤ max (if set)
//               · label: shown in the finale checklist · miss: Robo's nudge
// Checks assert the SPIRIT of the task, never exact markup — any page that
// honestly does the thing passes.

const WEB_META = {
  title: "Robo's Web Studio",
  emoji: "🖥️",
  blurb: "Season 1: Robo got a job building web pages — and you're the boss! Real HTML, live on screen.",
};

// Images shipped with the game for the gallery levels.
const WEB_IMAGES = ["img/robo.svg", "img/gem.svg", "img/flag.svg"];
const WEB_SRC_OK = /img\/(robo|gem|flag)\.svg$/;

const WEB_LEVELS = [
  {
    id: "web-1",
    title: "Hello, Internet!",
    emoji: "🏷️",
    newTags: ["<h1>headline</h1>"],
    intro:
      "Welcome to my <b>Web Studio</b>! 🖥️ No more grid — this is a REAL web page, " +
      "and it changes <b>live while you type</b>. Try it!<br><br>" +
      "Web pages are built from <b>tags</b> — little labels that wrap words and transform them. " +
      "<code>&lt;h1&gt;Hello!&lt;/h1&gt;</code> turns \"Hello!\" into a giant headline. " +
      "Every tag has an opener <code>&lt;h1&gt;</code> and a closer <code>&lt;/h1&gt;</code> — " +
      "a hug around your words. 🤗 Give my page a big headline!<br><br>" +
      "<small>(The grey <code>&lt;!-- notes --&gt;</code> are just notes — the page ignores them.)</small>",
    hint: "On the empty line, type:  <h1>Hello!</h1>  — any words you like between the tags!",
    starter:
      "<!-- Type your big headline on the next line: -->\n\n<p>Robo's very first web page!</p>\n",
    solution: "<h1>Hello!</h1>\n<p>Robo's very first web page!</p>\n",
    checks: [
      {
        find: "h1", textMin: 1, label: "A big <h1> headline",
        miss: "I don't see a big headline yet! Wrap some words in <h1> and </h1> — and watch the preview.",
      },
    ],
  },
  {
    id: "web-2",
    title: "Big News, Small News",
    emoji: "🏷️",
    newTags: ["<p>paragraph</p>"],
    intro:
      "Every page needs regular words too! The <code>&lt;p&gt;</code> tag makes a " +
      "<b>paragraph</b> — normal-sized text for saying things. " +
      "The Robo News page has its headline… now write the news story under it! 📰 " +
      "Add at least <b>two</b> paragraphs — each one gets its own <code>&lt;p&gt;</code> hug.",
    hint: "Under the headline, add lines like:  <p>Today Robo learned HTML.</p>  — two of them!",
    starter:
      "<h1>📰 Robo News</h1>\n<!-- Write two paragraphs of news below: -->\n\n",
    solution:
      "<h1>📰 Robo News</h1>\n<p>Today Robo learned to build web pages.</p>\n<p>All the gems are safe in the backpack.</p>\n",
    checks: [
      { find: "h1", textMin: 1, label: "The headline", miss: "The headline vanished! Keep the <h1> at the top." },
      {
        find: "p", textMin: 3, min: 2, label: "Two <p> paragraphs",
        miss: "The news needs at least TWO paragraphs — each one wrapped in <p> and </p>.",
      },
    ],
  },
  {
    id: "web-3",
    title: "The Broken Tag",
    emoji: "😈",
    newTags: [],
    intro:
      "Uh oh. An intern robot wrote this page and… LOOK at it. Everything is GIANT! 😱 " +
      "One single character is missing, and the headline is swallowing the whole page. " +
      "Remember: every tag needs its <b>closing partner</b>. " +
      "Find the poor unclosed tag and set the page free!",
    hint: "The first line opens an <h1>… but where is its </h1>? Add the closer right after the headline words.",
    starter:
      "<h1>Welcome to Robo's Page\n<p>Robo is a very good robot.</p>\n<p>It can even build websites now!</p>\n",
    solution:
      "<h1>Welcome to Robo's Page</h1>\n<p>Robo is a very good robot.</p>\n<p>It can even build websites now!</p>\n",
    checks: [
      { find: "h1", textMin: 1, label: "A headline", miss: "Keep the <h1> headline — it just needs fixing, not deleting!" },
      {
        find: "h1 p", max: 0, min: 0, label: "…that hugs ONLY the headline words",
        miss: "The headline is still swallowing the paragraphs! Close it with </h1> right after its own words.",
      },
      { find: "p", textMin: 3, min: 2, label: "Two normal-sized paragraphs", miss: "I need both paragraphs back, normal-sized." },
    ],
  },
  {
    id: "web-4",
    title: "The Emoji Zoo",
    emoji: "🦁",
    newTags: ["<h2>smaller headline</h2>"],
    intro:
      "Robo is opening a ZOO! 🦁🐧🐉 <code>&lt;h2&gt;</code> makes a <b>smaller</b> headline — " +
      "perfect for signs above each animal. One exhibit is built already. " +
      "Add <b>two more animals</b>: each needs an <code>&lt;h2&gt;</code> sign and a " +
      "<code>&lt;p&gt;</code> telling visitors about it. Any animals you like!",
    hint: "Copy the lion's pattern twice: an <h2>The …</h2> line, then a <p>…</p> line. Emojis welcome!",
    starter:
      "<h1>🎪 Robo's Emoji Zoo</h1>\n<h2>The Lion</h2>\n<p>🦁 Roars very loudly. Likes naps.</p>\n<!-- Add two more exhibits below: -->\n\n",
    solution:
      "<h1>🎪 Robo's Emoji Zoo</h1>\n<h2>The Lion</h2>\n<p>🦁 Roars very loudly. Likes naps.</p>\n" +
      "<h2>The Penguin</h2>\n<p>🐧 Waddles everywhere. Eats fish.</p>\n" +
      "<h2>The Dragon</h2>\n<p>🐉 Very friendly. Do not feed gems.</p>\n",
    checks: [
      { find: "h1", textMin: 1, label: "The zoo's big sign", miss: "The zoo lost its big <h1> sign!" },
      { find: "h2", textMin: 1, min: 3, label: "Three <h2> animal signs", miss: "I count fewer than 3 animal signs — each animal needs an <h2>." },
      { find: "p", textMin: 3, min: 3, label: "Three animal descriptions", miss: "Every animal needs a <p> telling visitors about it — I need 3 in total." },
    ],
  },
  {
    id: "web-5",
    title: "Top 3 Snacks",
    emoji: "🍕",
    newTags: ["<ul> … </ul>", "<li>list item</li>"],
    intro:
      "A LIST of things, in order… wait. 🤔 That's the <b>backpack</b> again! " +
      "In HTML, a list is <code>&lt;ul&gt;</code> (the backpack) holding " +
      "<code>&lt;li&gt;</code> items (the gems) — and the page draws a dot for each one. " +
      "One snack is in the list already. Add <b>two more</b> of YOUR favorite snacks — " +
      "each <code>&lt;li&gt;</code> goes <i>inside</i> the <code>&lt;ul&gt;</code> hug!",
    hint: "Add lines like  <li>🍪 Cookies</li>  ABOVE the </ul> line — that's what \"inside the list\" means.",
    starter:
      "<h1>My Top 3 Snacks</h1>\n<ul>\n  <li>🍕 Pizza</li>\n  <!-- your two snacks go here: -->\n\n</ul>\n",
    solution:
      "<h1>My Top 3 Snacks</h1>\n<ul>\n  <li>🍕 Pizza</li>\n  <li>🍪 Cookies</li>\n  <li>🥭 Mango</li>\n</ul>\n",
    checks: [
      { find: "ul", label: "A <ul> list", miss: "The <ul> list is gone! I need the list to hold the snacks." },
      {
        find: "ul li", textMin: 1, min: 3, label: "Three <li> snacks inside it",
        miss: "The list needs 3 snacks — each one an <li>…</li> INSIDE the <ul> … </ul> hug.",
      },
    ],
  },
  {
    id: "web-6",
    title: "The Robot Gallery",
    emoji: "🖼️",
    newTags: ['<img src="img/robo.svg">'],
    intro:
      "Time to hang some ART! 🖼️ The <code>&lt;img&gt;</code> tag shows a picture — " +
      "and it's a new SHAPE of tag: no closing partner, but a <b>setting inside it</b> " +
      "called <code>src</code> that says WHICH picture: " +
      "<code>&lt;img src=\"img/robo.svg\"&gt;</code>.<br><br>" +
      "The studio owns three pictures: <code>img/robo.svg</code> 🤖, " +
      "<code>img/gem.svg</code> 💎 and <code>img/flag.svg</code> 🏁. " +
      "Hang <b>two</b> of them in the gallery — spell the names exactly!",
    hint: "Two lines like:  <img src=\"img/robo.svg\">  — pick any two pictures. Watch the quotes!",
    starter:
      "<h1>🖼️ The Robot Gallery</h1>\n<p>Our masterpieces:</p>\n<!-- Hang two pictures below: -->\n\n",
    solution:
      "<h1>🖼️ The Robot Gallery</h1>\n<p>Our masterpieces:</p>\n<img src=\"img/robo.svg\">\n<img src=\"img/gem.svg\">\n",
    checks: [
      { find: "img", min: 2, label: "Two <img> pictures", miss: "The gallery needs two <img> tags — two picture frames on the wall!" },
      {
        find: "img", srcPattern: WEB_SRC_OK, min: 2, label: "…showing real studio pictures",
        miss: "A picture frame is empty — check the src spelling! The studio has: img/robo.svg, img/gem.svg, img/flag.svg.",
      },
    ],
  },
  {
    id: "web-7",
    title: "Button It Up",
    emoji: "🔘",
    newTags: ["<button>Click!</button>"],
    intro:
      "Web pages aren't just for reading — you can TOUCH them! " +
      "<code>&lt;button&gt;Feed Robo&lt;/button&gt;</code> makes a real, clickable button. " +
      "Build Robo's control panel with <b>two buttons</b> — then click them in the preview " +
      "and feel them squish! 🔘 (They don't do anything yet… teaching them tricks is a " +
      "whole future adventure. 😉)",
    hint: "Two lines like:  <button>Feed Robo</button>  and  <button>Pat Robo</button>",
    starter:
      "<h1>🎛️ Robo's Control Panel</h1>\n<p>Press gently:</p>\n<!-- Add two buttons below: -->\n\n",
    solution:
      "<h1>🎛️ Robo's Control Panel</h1>\n<p>Press gently:</p>\n<button>🍔 Feed Robo</button>\n<button>🤗 Pat Robo</button>\n",
    checks: [
      {
        find: "button", textMin: 1, min: 2, label: "Two <button>s with words on them",
        miss: "The control panel needs TWO buttons, each with words on it: <button>like this</button>",
      },
    ],
  },
  {
    id: "web-8",
    title: "The Party Invitation",
    emoji: "🎉",
    newTags: [],
    intro:
      "Robo is throwing a party and YOU'RE making the invitation! 🎉 " +
      "Everything you've learned, on one page: the headline is done — " +
      "follow the notes to add the host's picture, a list of <b>three</b> party details " +
      "(when? where? bring what?), and a goodbye paragraph. Make it fancy! ✨",
    hint:
      "One <img src=\"img/robo.svg\">, one <ul> with three <li> details inside, and one <p> at the end. " +
      "The notes show you exactly where each piece goes.",
    starter:
      "<h1>🎉 You're Invited!</h1>\n<!-- 1. a picture of the host (img/robo.svg): -->\n\n" +
      "<!-- 2. a list of 3 party details: -->\n\n<!-- 3. a goodbye paragraph: -->\n\n",
    solution:
      "<h1>🎉 You're Invited!</h1>\n<img src=\"img/robo.svg\">\n<ul>\n  <li>📅 Saturday at 3 o'clock</li>\n" +
      "  <li>📍 The Web Studio</li>\n  <li>🎁 Bring a gem</li>\n</ul>\n<p>See you there! 🤖</p>\n",
    checks: [
      { find: "h1", textMin: 1, label: "The invitation headline", miss: "Keep the big <h1> at the top — it's the invitation's title!" },
      { find: "img", srcPattern: WEB_SRC_OK, label: "A picture of the host", miss: "I need a picture of the host! <img src=\"img/robo.svg\"> — spell it exactly." },
      { find: "ul li", textMin: 1, min: 3, label: "Three party details in a list", miss: "The guests need details! A <ul> with three <li> items inside." },
      { find: "p", textMin: 2, label: "A goodbye paragraph", miss: "Finish with a friendly <p> goodbye at the bottom!" },
    ],
  },
  {
    id: "web-9",
    title: "Your Very Own Page",
    emoji: "🏆",
    newTags: [],
    checklist: true,
    intro:
      "This is it — the page that is <b>YOURS</b>. 🧑‍💻 No target to copy this time: " +
      "make a page about anything you love — you, your pet, a game, dinosaurs, ANYTHING. " +
      "The checklist below ticks itself as you build. When every box is green, " +
      "show me — and I'll make it official. 🏆",
    hint:
      "Start with <h1>All About Me</h1>, then just keep adding pieces: paragraphs, a list, " +
      "a picture, buttons. There is no wrong page — it's yours!",
    starter: "<!-- This page is YOURS. Build anything you like! -->\n\n",
    solution:
      "<h1>🌟 All About Me</h1>\n<p>Hi! I built this page all by myself.</p>\n" +
      "<img src=\"img/flag.svg\">\n<h2>Things I love</h2>\n<ul>\n  <li>🤖 Robots</li>\n  <li>💎 Gems</li>\n  <li>🍕 Pizza</li>\n</ul>\n" +
      "<button>👍 High five!</button>\n",
    checks: [
      { find: "h1", textMin: 1, label: "A big headline", miss: "Every great page starts with a big <h1> headline!" },
      { find: "p, li", textMin: 2, min: 3, label: "At least 3 paragraphs or list items", miss: "Tell me more! At least 3 pieces of writing — <p> paragraphs or <li> list items." },
      { find: "img", srcPattern: WEB_SRC_OK, label: "A picture", miss: "Hang a picture! <img src=\"img/robo.svg\"> (or gem, or flag)." },
      { find: "button", textMin: 1, label: "A button to press", miss: "Add a <button> — every cool page has something to press!" },
    ],
  },
];

// Robo's Tag Book — the Web Studio's handbook. One page per tag the studio
// teaches, then three "sneak peek" pages that open the door to CSS and
// JavaScript. Every page shows its example rendered LIVE next to the code —
// the browser is the demo. `scripts: true` lets the demo iframe run JS.
const WEB_HANDBOOK = [
  {
    name: "h1",
    syntax: "<h1>Big headline</h1>",
    explain:
      "The biggest, boldest words on the page — the title! Every tag is a hug: an opener <h1> in front, " +
      "a closer </h1> behind, and your words in the middle. The little slash / is what makes a tag a closer. " +
      "Most pages have just ONE h1, right at the top.",
    example: "<h1>Hello, Internet!</h1>",
    exampleNote: "Plain words go in… a giant headline comes out.",
  },
  {
    name: "p",
    syntax: "<p>A paragraph of words.</p>",
    explain:
      "p is for paragraph — normal-sized text for telling your story. Each <p> gets its own line " +
      "with a little breathing space above and below. Long story? Use lots of paragraphs, one hug each.",
    example: "<p>Robo is a very good robot.</p>\n<p>Today it learned HTML!</p>",
    exampleNote: "Two hugs, two paragraphs, each on its own line.",
  },
  {
    name: "h2",
    syntax: "<h2>Smaller headline</h2>",
    explain:
      "A smaller headline for the parts INSIDE your page — like signs above each animal in a zoo. " +
      "The number is the size: h1 is the biggest, h2 a bit smaller, and it goes all the way down to h6 (tiny!). " +
      "One h1 for the title, then as many h2s as you have parts.",
    example: "<h1>🎪 Robo's Zoo</h1>\n<h2>The Lion</h2>\n<p>🦁 Roars. Likes naps.</p>\n<h2>The Penguin</h2>\n<p>🐧 Waddles. Eats fish.</p>",
    exampleNote: "One big sign for the zoo, a smaller sign for each animal.",
  },
  {
    name: "ul / li",
    syntax: "<ul> <li>item</li> </ul>",
    explain:
      "A list! <ul> is the backpack and each <li> is a thing inside it — the page draws a dot for every item. " +
      "The <li> hugs go INSIDE the <ul> hug (that's why we push them in with 2 spaces, just like a repeat loop). " +
      "Fun fact: ul means \"unordered list\". Swap it for <ol> and the dots become 1, 2, 3!",
    example: "<p>Top snacks:</p>\n<ul>\n  <li>🍕 Pizza</li>\n  <li>🍪 Cookies</li>\n  <li>🥭 Mango</li>\n</ul>",
    exampleNote: "Three items in the backpack, three dots on the page.",
  },
  {
    name: "img",
    syntax: '<img src="img/robo.svg">',
    explain:
      "A picture! This tag is a different SHAPE: it has no closer, because there are no words to hug. " +
      "Instead it carries a setting inside it — src (short for \"source\") — that says WHICH picture to show. " +
      "The picture's name goes between the quotes, spelled exactly. A wrong letter = an empty frame.",
    example: '<p>Meet the team:</p>\n<img src="img/robo.svg">\n<img src="img/gem.svg">',
    exampleNote: "Two img tags, two pictures. No closers needed.",
  },
  {
    name: "button",
    syntax: "<button>Click me!</button>",
    explain:
      "A real button you can press! The words you hug are what's written on it. " +
      "Try clicking the one in the demo — it squishes. It doesn't DO anything yet, though… " +
      "buttons need JavaScript to learn tricks. Sneak peek at the bottom of this book! 😉",
    example: "<p>Robo's control panel:</p>\n<button>🍔 Feed Robo</button>\n<button>🤗 Pat Robo</button>",
    exampleNote: "Press them! They squish, but nothing happens — yet.",
  },
  {
    name: "notes",
    syntax: "<!-- a note to yourself -->",
    explain:
      "A secret note that the page IGNORES. Anything between <!-- and --> is invisible to visitors — " +
      "it's just for you (or whoever reads your code next) to remember what goes where. " +
      "The studio's starter pages use notes to show you where to type.",
    example: "<!-- The headline goes first: -->\n<h1>My Page</h1>\n<!-- TODO: add a picture of my cat -->\n<p>Coming soon!</p>",
    exampleNote: "Four lines of code, but only two things show up. The notes stay hidden.",
  },
  {
    name: "CSS paint",
    peek: "CSS",
    syntax: '<p style="color: hotpink">…</p>',
    explain:
      "HTML says WHAT is on the page. A second language, CSS, says how it LOOKS. " +
      "The quickest taste: add style=\"…\" inside any opener and write a rule like color: hotpink " +
      "or font-size: 40px. Each rule is a setting name, a colon, and the value. " +
      "Separate rules with semicolons. Try colors like gold, tomato, skyblue, limegreen!",
    example: '<h1 style="color: tomato">Loud headline</h1>\n<p style="color: hotpink; font-size: 26px">Big pink words!</p>\n<p style="background: gold; padding: 10px">A sunny box.</p>',
    exampleNote: "Same tags as before — CSS repaints them.",
  },
  {
    name: "CSS rules",
    peek: "CSS",
    syntax: "<style> p { color: purple; } </style>",
    explain:
      "Painting every tag one by one is slow. A <style> hug holds RULES for the whole page: " +
      "p { color: purple; } means \"ALL paragraphs, be purple\" — like a repeat loop for looks. " +
      "The word in front (p, h1, li, button…) picks the tags; the curly braces { } hold the rules for them. " +
      "Change one rule, and every matching tag changes at once.",
    example: "<style>\n  h1 { color: limegreen; }\n  li { color: purple; font-size: 22px; }\n</style>\n<h1>Rules rule!</h1>\n<ul>\n  <li>Every item…</li>\n  <li>…is purple…</li>\n  <li>…from one rule.</li>\n</ul>",
    exampleNote: "Two rules in the style hug, and the whole list obeys.",
  },
  {
    name: "JavaScript",
    peek: "JavaScript",
    syntax: '<button onclick="…">',
    explain:
      "The third language, JavaScript, makes pages DO things — it's the closest cousin of Robo's language. " +
      "Give a button an onclick=\"…\" setting, and the code inside runs every time it's clicked. " +
      "this means \"the button that was clicked\", and this.textContent is the words written on it — " +
      "so this.textContent = 'Beep!' rewrites the button, live. That's a real program running in your page!",
    example: "<h1>Poke the robot</h1>\n<button onclick=\"this.textContent = 'Beep! 🤖'\">🤖 Poke me</button>\n<button onclick=\"this.textContent = 'Zzz… 😴'\">🤖 Say goodnight</button>",
    exampleNote: "Click a button — the code inside onclick changes its words. Buttons with tricks!",
    scripts: true,
  },
];

if (typeof module !== "undefined") module.exports = { WEB_LEVELS, WEB_META, WEB_IMAGES, WEB_SRC_OK, WEB_HANDBOOK };
