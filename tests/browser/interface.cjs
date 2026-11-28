// Run: node tests/browser/interface.cjs [index.html]. Set CHROME_PATH to use a different Chromium executable.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function auditPage() {
  const failures = [];
  const check = (value, message) => { if (!value) failures.push(message); };
  const find = selector => document.querySelector(selector);
  const fits = area => check(document.documentElement.scrollWidth <= innerWidth, area + ' overflows page');
  function click(selector) {
    const el = find(selector);
    if (!el || el.disabled) throw Error('Missing enabled ' + selector);
    el.focus();
    el.click();
  }
  function battle(floor, room) {
    run = fresh(34);
    run.picks = ['shield','healing','mastermind'];
    run.floor = floor;
    run.room = room;
    if (room === 10) {
      run.advancement = {done:true,choices:[0,0,0]};
      run.general = {done:true,choices:[0,0,0]};
      run.adv4 = {done:true,choices:run.picks.map((_,i)=>pool4(i)[0][0])};
      run.adv5 = {done:true,boosts:[[0,1,2,4],[0,1,2,4],[1,2,3,4]]};
    }
    run.entry = {hp:run.picks.map(id=>profile(id)[0]),font:[0,4,0],focus:[0,0,0],potions:3};
    const s = run.battle = newRoom();
    kit(s);
    s.active = 0;
    s.actions = 3;
    return s;
  }
  try {
    for (const floor of [0,1,2]) {
      const s = battle(floor,10), e = target(s);
      if (floor === 2) {
        e.bossTurns = 1;
        s.pos[0] = 25;
        prepareWarlordAttack(s,e);
      } else {
        prepareBossIntent(s,e);
      }
      feedbackStart(s);
      s.hp[0] -= 3;
      note(s,'Shield Fighter takes 3 damage');
      feedbackFinish(s);
      render();
      fits('combat ' + floor);
      check(find('.turn').textContent.includes('3 actions'), 'turn actions');
      check(find('.combat-feedback').textContent.includes('3 HP'), 'damage recap');
      const cells = [...document.querySelectorAll('.map .sq')];
      check(cells.length === 45, '45 cells');
      check(e.bossIntent.cells.every(p=>/danger|incoming attack/i.test(cells[p].getAttribute('aria-label'))),
        'unlabeled warning on floor '+floor);
      const marked = cells[e.bossIntent.cells[0]];
      check(marked.querySelector('.danger-marker')?.textContent === '!', 'missing visible warning marker');
      for (const link of document.querySelectorAll('.board-nav a')) {
        check(document.getElementById(link.hash.slice(1)), 'broken board navigation link');
      }
      check(find('.board-nav a[href="#target-inspection"]') && find('.board-nav a[href="#latest-action"]'), 'board navigation');
      if (floor === 2) {
        const before = JSON.stringify(run);
        const disabled = cells.map(c=>c.disabled);
        click('[data-readtiles]');
        check(cells.every(c=>!c.disabled), 'tile reader cannot reach every square');
        const wall = find('.sq.twall');
        wall.focus();
        wall.click();
        check(find('#tile-readout').textContent === wall.getAttribute('aria-label'), 'wall inspection');
        wall.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
        check(Number(document.activeElement.dataset.square) === Number(wall.dataset.square)+1, 'arrow inspection');
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
        check(document.activeElement === find('[data-readtiles]') && find('#tile-readout').hidden, 'Escape returns to board controls');
        check(cells.every((c,i)=>c.disabled === disabled[i]) && JSON.stringify(run) === before, 'tile inspection changes combat');
        click('[data-lowerstandard]');
        check(s.actions === 2 && e.warStandard === 'lowered', 'lower standard');
      }
    }
    const s = battle(2,2);
    s.enemies.forEach(e=>e.hp=0);
    render();
    const offer = lootChoices(s).find(k=>lootItems[k].kind !== 'supply');
    const before = [s.rng,s.actions,s.potions].join();
    click('[data-lootpreview="'+offer+'"]');
    fits('reward preview');
    check(s.lootPreview === offer && !s.reward && before === [s.rng,s.actions,s.potions].join(), 'reward preview commits');
    check(document.activeElement.dataset.lootpreview === offer, 'reward preview loses focus');
    const recipients = [...document.querySelectorAll('.reward-recipient')].map(el=>el.getBoundingClientRect());
    check(recipients.length === 3, 'three reward recipients');
    if (innerWidth <= 640) check(recipients[1].top >= recipients[0].bottom, 'phone reward comparisons overlap');
    click('[data-loot]:not([disabled])');
    check(s.reward, 'reward claim');
    gear(0).weapons = ['coldmace'];
    render();
    const equip = '[data-equipkey="coldmace"][data-recipient="0"]';
    for (let el = find(equip); el; el = el.parentElement) if (el.tagName === 'DETAILS') el.open = true;
    click(equip);
    check(gear(0).weapon === 'coldmace', 'equip owned weapon');
    check(!find(equip).closest('details:not([open])'), 'equipping closes weapon choices');
    check(document.activeElement === find(equip).closest('details').querySelector('summary'), 'equipped choice loses focus');
    fits('equipment');
    click('[data-levelup]');
    click('[data-advhero="1"]');
    check(run.advancement.hero === 1, 'advancement hero tab');
    check(document.activeElement.dataset.advhero === '1', 'advancement loses focus');
    click('[data-feat]');
    check(run.advancement.choices[1] === 0, 'feat choice');
    check(document.activeElement === find('.adv-progress [aria-pressed="true"]'), 'auto-advance loses hero focus');
    click('[data-advhero="1"]');
    check(find('[data-feat][aria-pressed="true"]'), 'selected feat marked on return');
    fits('advancement');
  } catch (error) { failures.push(error.stack); }
  parent.postMessage({width:innerWidth,height:innerHeight,failures}, '*');
}

const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/chromium', '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
const chrome = candidates.find(p=>p && fs.existsSync(p));
if (!chrome) throw Error('Set CHROME_PATH to a local Chromium browser.');
const gamePath = path.resolve(process.argv[2] || 'index.html');
// The copied page keeps loading css/ and js/ from the game's own folder.
const source = fs.readFileSync(gamePath,'utf8').replace('<meta charset="utf-8">',m=>m+'<base href="'+pathToFileURL(path.dirname(gamePath)+path.sep).href+'">');
const dir = fs.mkdtempSync(path.join(os.tmpdir(),'pf2e-interface-'));
const sizes = [[320,568],[390,844],[640,900],[641,900],[844,390],[768,1024],[1024,768],[1280,900]];
try {
  fs.writeFileSync(path.join(dir,'game.html'),source.replace('</html>',()=>'<script>('+auditPage.toString()+')()</script></html>'));
  const frames = sizes.map(([w,h])=>'<iframe width="'+w+'" height="'+h+'" src="game.html"></iframe>').join('');
  const host = path.join(dir,'audit.html');
  fs.writeFileSync(host,'<script>const results=[];onmessage=e=>{results.push(e.data);document.title=encodeURIComponent(JSON.stringify(results))}</script>'+frames);
  const result = spawnSync(chrome,['--headless=new','--disable-gpu','--no-first-run','--disable-background-networking',
    '--allow-file-access-from-files','--hide-scrollbars','--user-data-dir='+path.join(dir,'profile'),
    '--dump-dom','--virtual-time-budget=3000',pathToFileURL(host).href],{windowsHide:true,encoding:'utf8',timeout:45000});
  if (result.error || result.status !== 0) throw result.error || Error(result.stderr);
  const title = result.stdout.match(/<title>(.*?)<\/title>/);
  if (!title) throw Error('Chrome returned no viewport results. ' + result.stderr);
  const rows = JSON.parse(decodeURIComponent(title[1]));
  for (const [width,height] of sizes) {
    const row = rows.find(r=>r.width === width && r.height === height);
    if (!row) throw Error('Missing viewport '+width+'x'+height);
    const problems = [...new Set(row.failures)];
    console.log(width+'x'+height, problems.length ? problems.join('; ') : 'passed');
    if (problems.length) process.exitCode = 1;
  }
} finally {
  fs.rmSync(dir,{recursive:true,force:true,maxRetries:4,retryDelay:150});
}
