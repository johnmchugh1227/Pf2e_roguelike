const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(process.argv[2] || 'index.html', 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
const app = { innerHTML: '', addEventListener() {} };
const storage = new Map();
let seed = 0;

function checkSprites(assert, source) {
  for (const [, id] of roster) {
    assert.ok(spriteImage(id, 'sprite').includes('data:image/png;base64,'), id);
  }
  for (const [alias, key] of Object.entries(spriteAliases)) {
    assert.ok(spriteAssets[key], alias);
  }
  for (let floor = 0; floor < 3; floor++) {
    for (let seed = 1; seed <= 4; seed++) {
      run = fresh(seed);
      run.floor = floor;
      run.picks = dealDraft(seed).map(options => options[0]);
      const battle = run.battle = newRoom();
      kit(battle);
      battle.active = 0;
      battle.actions = 3;
      const board = field();
      assert.equal((board.match(/class="sq /g) || []).length, 45);
      for (const marker of ['combat-board', 'combat-inspect', 'data-end="1"', 'data-strike="1"', 'sprite hero']) {
        assert.ok(board.includes(marker), marker);
      }
    }
  }

  run = fresh(34);
  run.floor = 2;
  run.picks = dealDraft(34).map(options => options[0]);
  run.battle = newRoom();
  kit(run.battle);
  enterFollowing(run.battle, 6);
  const board = field();
  const roles = new Set();
  for (const [index, enemy] of run.battle.enemies.entries()) {
    if (enemy.type !== 'hobgoblin') continue;
    roles.add(enemy.name);
    assert.equal(spriteKey(enemy), 'hobgoblin');
    const cell = board.match(new RegExp('data-target="' + index + '">([\\s\\S]*?)</button>'));
    assert.ok(cell, enemy.name + ' target cell');
    assert.ok(cell[1].includes('src="data:image/png;base64,' + source + '"'), enemy.name + ' embedded sprite');
    assert.ok(cell[1].includes('token-label foe'), enemy.name + ' token label');
  }
  assert.deepEqual([...roles].sort(), ['Hobgoblin archer', 'Hobgoblin soldier']);
  assert.equal(Object.keys(spriteAssets).length, 35);
}

const source = fs.readFileSync(path.join(__dirname, '../assets/hobgoblin.png')).toString('base64');
new Function('document', 'localStorage', 'crypto', 'assert', 'source',
  script + '\n(' + checkSprites.toString() + ')(assert, source);'
)(
  { getElementById: () => app },
  { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  { getRandomValues: values => { values[0] = ++seed; return values; } },
  assert, source
);
console.log('Sprite checks passed across 12 opening boards and seed 34 Watchfort room 6.');
