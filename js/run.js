// Expedition state: seeded run creation, hero draft, save/load and persistence.
function dealDraft(seed, cards = roster) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new RangeError("Expected an unsigned 32-bit seed");
  if (cards.length < 9 || new Set(cards.map(card => card[1])).size !== cards.length)
    throw new RangeError("Draft needs at least nine distinct hero IDs");
  let state = seed;
  function index(size) {
    const limit = 0x100000000 - 0x100000000 % size;
    let sample;
    do {
      state = (state + 0x9e3779b9) >>> 0;
      sample = Math.imul(state ^ (state >>> 16), 0x21f0aaad);
      sample = Math.imul(sample ^ (sample >>> 15), 0x735a2d97);
      sample = (sample ^ (sample >>> 15)) >>> 0;
    } while (sample >= limit);
    return sample % size;
  }
  const remaining = new Map();
  for (const [group, id] of cards) {
    if (!remaining.has(group)) remaining.set(group, []);
    remaining.get(group).push(id);
  }
  const offers = [];
  for (let i = 0; i < 9; i++) {
    const groups = [...remaining.keys()];
    const group = groups[index(groups.length)];
    const variants = remaining.get(group);
    const [hero] = variants.splice(index(variants.length), 1);
    if (!variants.length) remaining.delete(group);
    offers.push(hero);
  }
  return [offers.slice(0, 3), offers.slice(3, 6), offers.slice(6)];
}
const app=document.getElementById("app");
const key="pf2e-crawl-draft-v1";
function fresh(seed,encounterVersion=2){return {seed,picks:[],floor:null,encounterVersion}}
function randomSeed(){return crypto.getRandomValues(new Uint32Array(1))[0]}
function loadRun(){try{const s=JSON.parse(localStorage.getItem(key));const hands=dealDraft(s.seed);if(Array.isArray(s.picks)&&s.picks.length<=3&&s.picks.every((id,i)=>hands[i].includes(id))&&(s.floor===null||(s.picks.length===3&&Number.isInteger(s.floor)&&floors[s.floor])))return s}catch{}return fresh(randomSeed())}
let run=loadRun();
function persist(){journalRecord();try{localStorage.setItem(key,JSON.stringify(run))}catch{journalWarning="Active save could not be written. Export any finished reports."}}
function name(id){return heroes[id][0].split(" · ")[0]}
