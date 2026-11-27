const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(process.argv[2] || 'index.html', 'utf8');
const game = html.split('<script>')[1].split('</script>')[0];
const app = { innerHTML: '', addEventListener() {} };

function checkHero(id, weapon, later) {
  run = fresh(34);
  run.floor = 1;
  run.picks = [id, 'shield', 'healing'];
  const choice = featPools[id].findIndex(([title]) => title === 'Quick Draw');
  assert.ok(choice >= 0 && liveFeats.has('Quick Draw'));
  run.advancement = {done: true, choices: [later ? 0 : choice, 0, 0]};
  if (later) run.adv4 = {done: true, choices: ['Quick Draw', null, null]};
  const s = run.battle = newRoom();
  kit(s);
  s.active = 0;
  s.actions = 3;
  s.attacks = 1;
  const e = target(s);
  const square = Array.from({length:45}, (_,p)=>p).find(p=>open(p) && enemyInReach(e,p,1));
  assert.ok(Number.isInteger(square));
  s.pos[0] = square;
  e.known[0] = 1;
  const g = gear(0);
  g.weapons = [weapon];
  assert.equal(canQuickDraw(s,0,null),false);
  assert.equal(canQuickDraw(s,0,'unowned'),false);
  assert.equal(canQuickDraw(s,1,weapon),false);
  assert.ok(equipmentPanel(s,true).includes('data-quickdraw="'+weapon+'"'));
  const saved = JSON.stringify(run);
  battleClick({quickdraw:weapon});
  assert.equal(s.actions,2);
  assert.equal(s.attacks,2);
  assert.equal(g.weapon,weapon);
  assert.ok(s.log.some(m=>m.includes('Quick Draw')));
  const expectedHP = e.hp, expectedRng = s.rng;
  run = JSON.parse(saved);
  gear(0).weapon = weapon;
  swing(run.battle,0);
  payAction();
  assert.equal(target(run.battle).hp,expectedHP);
  assert.equal(run.battle.rng,expectedRng);
  assert.ok(canQuickDraw(run.battle,0,null));
  battleClick({quickdraw:'starter'});
  assert.equal(gear(0).weapon,null);
  assert.equal(run.battle.actions,1);
  run.adv4 = null;
  run.advancement.done = false;
  assert.equal(quickDraw(run.battle,0,weapon),false);
}
vm.runInNewContext(game + '\n' + checkHero.toString() +
  "\ncheckHero('thief','sap',false); checkHero('mastermind','bluntbow',true);", {
  assert, document:{getElementById:()=>app},localStorage:{getItem:()=>null,setItem(){}},
  crypto:{getRandomValues:a=>{a[0]=42;return a}}
});
console.log('Quick Draw passed for Thief and Mastermind.');
