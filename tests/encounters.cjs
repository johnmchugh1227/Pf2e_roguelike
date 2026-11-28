// Run: node tests/encounters.cjs [index.html]
const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync(process.argv[2] || 'index.html', 'utf8');
const game = require('./lib/source.cjs')(process.argv[2]||'index.html');

function inspectEncounters() {
  // Seed 5 reached three successive lone spiders in a build 2 Warrens run.
  for (const legacy of [true,false]) {
    run = fresh(5);
    run.floor = 1;
    run.picks = dealDraft(5).map(hand => hand[0]);
    if (legacy) delete run.encounterVersion;
    run.room = 4;
    run.advancement = {done:true, choices:[0,0,0]};
    run.entry = {hp:run.picks.map(id => profile(id)[0]), font:[0,0,0], potions:3};
    const battle = run.battle = newRoom();
    kit(battle);
    const expected = legacy ? 'Giant spider' : 'Archer';
    assert.equal(battle.enemies[0].name, expected);
    battle.enemies[0].hp--;
    persist();
    run = loadRun();
    assert.deepEqual(run.battle.enemies, battle.enemies);
    assert.equal(newRoom().enemies[0].name, expected, 'retry regenerates the saved lineup');
    run.battle.hp.fill(0);
    journalRecord();
    assert.equal(journalMemory.at(-1).encounterVersion, legacy ? 1 : 2);
    run.battle = null;
    app.click({target:{closest:()=>({dataset:{reset:'same'}})}});
    assert.equal(run.seed, 5);
    assert.equal(run.encounterVersion, legacy ? 1 : 2, 'Replay seed preserves encounter version');
  }
  const namesByRoom = [];
  const verifiedBoards = new Set();
  const repeatCounts = [];
  let starts = 0;
  for (let floor = 0; floor < 3; floor++) {
    let legacyRepeats = 0, currentRepeats = 0;
    const lineups = Array.from({length: 10}, () => new Set());
    for (let seed = 1; seed <= 128; seed++) {
      run = fresh(seed);
      run.floor = floor;
      run.picks = dealDraft(seed).map(hand => hand[0]);
      let previous, previousLegacy;
      for (let room = 1; room <= 10; room++) {
        run.room = room;
        if (room === 3) run.advancement = {done:true, choices:[0,0,0]};
        if (room === 5) run.general = {done:true, choices:[0,0,0]};
        if (room === 7) run.adv4 = {done:true, choices:run.picks.map((_,i) => pool4(i)[0][0])};
        if (room === 9) run.adv5 = {done:true, boosts:[[0,1,2,4],[0,1,2,4],[0,1,2,4]]};
        run.entry = {hp:run.picks.map(id => profile(id)[0]), font:[4,4,4], potions:4};
        const battle = run.battle = newRoom();
        kit(battle);
        starts++;
        const label = 'seed ' + seed + ', floor ' + floor + ', room ' + room;
        const signature = battle.enemies.map(e => e.name).sort().join(' + ');
        run.encounterVersion = 1;
        const original = enemySpecs().map(e => e.name).sort().join(' + ');
        run.encounterVersion = 2;
        if (signature === previous) currentRepeats++;
        if (original === previousLegacy) legacyRepeats++;
        const comparable = (floor === 1 && [2,4].includes(room)) || (floor === 2 && [4,5,8].includes(room));
        if (comparable) {
          assert.notEqual(signature, previous, label + ': repeated lineup');
        }
        if (!comparable || original !== previous) {
          assert.equal(signature, original, label + ': nonconflicting original draw changed');
        }
        previousLegacy = original;
        previous = signature;
        lineups[room-1].add(signature);
        assert.ok(battle.enemies.length, label + ': empty encounter');
        const occupied = new Set(battle.pos);
        for (const pos of battle.pos) assert.equal(rawTile(pos), '.', label + ': hero spawn ' + pos);
        for (const enemy of battle.enemies) {
          const cells = footprint(enemy);
          assert.equal(cells.length, (enemy.size || 1) ** 2, label + ': incomplete footprint');
          for (const cell of cells) {
            assert.equal(rawTile(cell), '.', label + ': blocked spawn at ' + cell);
            assert.ok(!occupied.has(cell), label + ': overlapping spawn at ' + cell);
            occupied.add(cell);
          }
        }
        const board = floor + ':' + room + ':' + battle.enemies.map(e => footprint(e).join(',')).join('/');
        if (!verifiedBoards.has(board)) {
          // Let heroes pass through allies. Enemy footprints and impassable corners still block movement.
          const approaches = new Set(battle.pos);
          for (const start of battle.pos) {
            for (const pos of paths(start, 60, 0, true).keys()) approaches.add(pos);
          }
          for (const enemy of battle.enemies) {
            assert.ok([...approaches].some(pos => enemyInReach(enemy,pos,1)), label + ': no melee approach to ' + enemy.name);
          }
          verifiedBoards.add(board);
        }
      }
    }
    namesByRoom.push(lineups.map(group => group.size));
    repeatCounts.push({legacyRepeats,currentRepeats});
  }
  return {starts, distinctSpawnBoards: verifiedBoards.size, distinctNameLineupsPerRoom: namesByRoom, repeatCounts};
}

const storage = new Map();
const appStub = {innerHTML:'', addEventListener(type,fn){ this[type]=fn; }, focus(){}};
const evaluate = new Function('document','localStorage','crypto','assert',
  game + '\nreturn (' + inspectEncounters.toString() + ')();');
console.log(evaluate({getElementById:() => appStub},{getItem:k => storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},
  {getRandomValues:array => { array[0] = 34; return array; }},assert));
