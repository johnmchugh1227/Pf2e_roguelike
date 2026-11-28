// Run: node tests/iron-warlord.cjs [index.html]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(process.argv[2] || 'index.html', 'utf8');
const game = require('./lib/source.cjs')(process.argv[2]||'index.html');
const storage = new Map();
let assertions = 0;

function boot() {
  const app = { innerHTML: '', addEventListener() {} };
  const context = vm.createContext({
    check(condition, message) {
      assert.ok(condition, message);
      assertions++;
    },
    document: { getElementById: () => app },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    crypto: { getRandomValues: array => { array[0] = 34; return array; } },
  });
  vm.runInContext(game, context);
  return (fn, ...args) => vm.runInContext('(' + fn.toString() + ')', context)(...args);
}

function startHall() {
  run = fresh(34);
  run.floor = 2;
  run.room = 10;
  run.picks = dealDraft(34).map(hand => hand[0]);
  run.advancement = { done: true, choices: [0, 0, 0] };
  run.general = { done: true, choices: [0, 0, 0] };
  run.adv4 = { done: true, choices: run.picks.map((_, i) => pool4(i)[0][0]) };
  run.adv5 = { done: true, boosts: [[1, 2, 3, 4], [0, 1, 2, 4], [1, 2, 3, 4]] };
  run.entry = { hp: run.picks.map(id => profile(id)[0]), font: [0, 0, 0],
    focus: [0, 1, 0], potions: 4, shields: [null, 20, null] };
  const s = run.battle = newRoom();
  kit(s);
  s.order = [3, 0, 1, 2];
  s.cursor = 1;
  s.active = 0;
  s.target = 0;
  s.actions = 3;
  return s;
}

let evaluate = boot();
evaluate(startHall);
evaluate(() => {
  const s = run.battle, e = target(s);
  check(e.name === 'Iron Warlord' && e.warStandard === 'raised', 'standard starts raised');
  check(field().includes(alphaArt['war-standard']), 'standard art renders in the hall');
  const oldHP = e.hp;
  damageEnemy(s, 1, null, false, false, 0);
  check(e.hp === oldHP - 1, 'raised standard leaves the boss vulnerable');
  s.pos = [9, 12, 13]; // A2 has rack cover, D2 is exposed, E2 is behind G2.
  s.active = 3;
  s.cursor = 0;
  enemyTurn();
  const mark = e.bossIntent;
  check(e.bossTurns === 1 && mark?.kind === 'volley' && mark.origin === 26 && mark.rank === 1, 'first boss turn marks row 2 from I3');
  check(bossWarning(s).toLowerCase().includes('volley'), 'visible volley warning');
  check(mark.cells.includes(9) && mark.cells.includes(12) && !mark.cells.includes(13), 'rack and exposed tiles threatened, pillar shadow safe');
  check(Array.from({ length: 45 }, (_, p) => p).every(p => dangerSquare(s, p) === mark.cells.includes(p)), 'board warnings match saved volley');
  s.pos[1] = 18;
  e.pos = 36;
  persist();
});

evaluate = boot();
evaluate(() => {
  const s = run.battle, e = target(s), mark = e.bossIntent;
  check(e.charging && mark.rank === 1 && mark.cells.includes(12) && !mark.cells.includes(18), 'reload and displacement preserve warned squares');
  const attacks = [], original = strikeRoll, before = s.hp.slice();
  strikeRoll = (...args) => { attacks.push({ ac: args[3], defender: args[7], melee: args[8] }); return original(...args); };
  bossSweep(s, e);
  strikeRoll = original;
  check(attacks.length === 1 && attacks[0].defender === 0 && !attacks[0].melee, 'one ranged Strike, only against A2');
  check(attacks[0].ac === heroAC(s, 0, 2, false), 'rack grants +2 AC from the fixed firing origin');
  check(s.hp[1] === before[1] && s.hp[2] === before[2], 'sidestepping and pillar shadow both avoid shots');
  check(!e.bossIntent && !e.charging, 'volley warning ends on resolution');
  e.bossTurns = 2;
  s.active = 3;
  s.cursor = 0;
  enemyTurn();
  check(e.bossTurns === 3 && e.charging && !e.bossIntent, 'third boss turn signals close sweep');
  check(reactiveEnemy(e), 'charged sweep preserves movement reaction');
  s.active = 3;
  s.cursor = 0;
  enemyTurn();
  check(e.bossTurns === 4 && !e.charging, 'fourth boss turn releases sweep');
});

for (let actor = 0; actor < 3; actor++) {
  evaluate(startHall);
  evaluate(() => {
    const s = run.battle, e = target(s);
    e.bossTurns = 1;
    prepareWarlordAttack(s, e);
    battleClick({ lowerstandard: '1' });
    check(e.warStandard === 'raised' && s.actions === 3, 'out-of-range action rejected');
  });
  // Preserve legal character selection while giving each class a turn at H3.
  evaluate(actor => {
    const s = run.battle, e = target(s);
    s.active = actor;
    s.pos[actor] = 25;
    check(field().includes('data-lowerstandard'), 'adjacent hero sees Lower Standard');
    battleClick({ lowerstandard: '1' });
    check(s.actions === 2 && e.warStandard === 'lowered' && !e.charging && !e.bossIntent, 'one action lowers standard and cancels volley');
    battleClick({ lowerstandard: '1' });
    check(s.actions === 2, 'duplicate Lower Standard is free of side effects');
    persist();
  }, actor);
  evaluate = boot();
  evaluate(() => {
    const s = run.battle, e = target(s);
    check(e.warStandard === 'lowered', 'lowered standard persists across a fresh page');
    e.bossTurns = 5;
    prepareWarlordAttack(s, e);
    check(e.charging && !e.bossIntent, 'future volley becomes a close sweep');
  });
}

evaluate(startHall);
evaluate(() => {
  const s = run.battle, e = target(s);
  delete e.warStandard;
  delete e.bossIntent;
  e.bossTurns = 1;
  e.charging = true;
  persist();
});
evaluate = boot();
evaluate(() => {
  const s = run.battle, e = target(s);
  check(e.warStandard === 'raised' && e.charging && !e.bossIntent, 'legacy save retains its pending close sweep');
  bossSweep(s, e);
  check(!e.charging, 'legacy sweep resolves normally');
});

console.log({ assertions });
