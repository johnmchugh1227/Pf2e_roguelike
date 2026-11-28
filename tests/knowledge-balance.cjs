// Knowledge-limited pilot policy. Run: node tests/knowledge-balance.cjs [index.html] [count] [environment] [seed] [party]
// Uses observed damage and identified lore, not raw hidden resistances/saves in action ranking. Other heuristic decisions retain normal baseline shortcuts.
const fs=require('node:fs');
function knowledgePolicy(sim){
 const change=(a,b)=>{if(sim.split(a).length!==2)throw Error('Policy patch mismatch: '+a);sim=sim.replace(a,()=>b)};
 change("function simulate(seed,policy,env=0){", `function intelAdjust(e,t){if(loreRank(e))return (e.weak?.[t]||0)-(e.resist?.[t]||0);return run.observedDamage?.[loreKey(e)]?.[t]||0}
 function intelSave(e,k){const base=(e.creatureLevel??level())+5;return loreRank(e)>=2?base-(weakestSaves(e).includes({fort:'Fortitude',reflex:'Reflex',will:'Will'}[k])?2:-1):base}
 const originalDamageEnemy=damageEnemy;
 damageEnemy=function(s,n,type=null,area=false,blockable=true){const e=target(s),before=s.log.length,dealt=originalDamageEnemy(s,n,type,area,blockable);if(type&&n>0){const messages=s.log.slice(0,s.log.length-before),weak=messages.some(m=>m.includes(e.name+' weakness')),res=messages.some(m=>m.includes(e.name+' resists'));run.observedDamage??={};const obs=run.observedDamage[loreKey(e)]??={};if(weak||res)obs[type]=(weak?(e.weak?.[type]||0):0)-(res?Math.min(n,e.resist?.[type]||0):0);if(run.intelMetrics&&s.active<3&&run.picks[s.active]!=='mastermind'&&run.mmLore?.[loreKey(e)]&&weak)run.intelMetrics.allyWeaknessTriggers++;}return dealt};
 function simulate(seed,policy,env=0){`);
 change("run.battle=newRoom();kit(run.battle);","run.battle=newRoom();kit(run.battle);run.intelMetrics={attempts:0,successfulStudies:0,newTypes:0,saveReveals:0,restudies:0,allyWeaknessTriggers:0,allyWeaponSwitches:0};result.intel=run.intelMetrics;run.mmLore={};");
 change("-(e.resist?.[w.type]||0)+(e.weak?.[w.type]||0)","+intelAdjust(e,w.type)");
 change("saveModifier(s,{side:'enemy',i:j,pos:e.pos},c.save,p)","intelSave(e,c.save)");
 change("-(e.resist?.[c.type]||0)+(e.weak?.[c.type]||0)","+intelAdjust(e,c.type)");
 change("if(id==='mastermind'&&best&&!off(s,i)&&!s.attacks&&a>=2&&canRecallMonster(s))return recallMonster(s);",`if(best&&!s.attacks&&a>=2&&canRecallMonster(s)&&((id==='mastermind'&&(!loreRank(best.e)||!off(s,i))&&best.e.hp>8)||(id!=='mastermind'&&!loreRank(best.e)&&best.e.hp>=30&&monsterRecallSkill(i,best.e).mod>=level()+3))){const e=best.e,prior=loreRank(e),repeat=!!e.recallTried?.[i];if(id==='mastermind'){result.intel.attempts++;if(repeat)result.intel.restudies++}recallMonster(s);if(id==='mastermind'&&e.known[i]>0){result.intel.successfulStudies++;if(!prior){result.intel.newTypes++;run.mmLore[loreKey(e)]=true}if(prior<2&&loreRank(e)>=2)result.intel.saveReveals++}return}`);
 change("(target(s).areaWeak||target(s).hp>20)","((loreRank(target(s))&&target(s).areaWeak)||target(s).hp>20)");
 change("if(['thief','mastermind'].includes(id)){\n  const g=gear(i), score=w=>","if(true){\n  const g=gear(i), score=w=>");
 change("(best.e.weak?.[w.type]||0)-(best.e.resist?.[w.type]||0)","intelAdjust(best.e,w.type)");
 change("if(a>=2&&highest-score(weaponFor(i))>=2)return equipLoot(s,i,'weapon',choice,true)","if(a>=2&&highest-score(weaponFor(i))>=2){if(id!=='mastermind'&&run.mmLore[loreKey(best.e)])result.intel.allyWeaponSwitches++;return equipLoot(s,i,'weapon',choice,true)}");
 return sim;
}
function execute(html,rawHarness,n,env,start,party){
 const raw=rawHarness.match(/const sim=("(?:[^"\\]|\\.)*");/s);
 if(!raw)throw Error('Cannot locate baseline policy');
 const sim=knowledgePolicy(JSON.parse(raw[1])),js=require('./lib/source.cjs')(process.argv[2]||'index.html'),app={innerHTML:'',addEventListener(){}};
 const cases='return Array.from({length:'+n+'},(_,j)=>simulate('+start+'+j,0,'+env+'));';
 const rows=new Function('backupTest','fixedParty','quickBuild','document','localStorage','crypto',js+sim+'\n'+cases)(false,party,false,{getElementById:()=>app},{getItem:()=>null,setItem(){}},{getRandomValues:a=>{a[0]=42;return a}});
 return {runs:rows.length,clears:rows.filter(r=>r.clear===10).length,downs:rows.reduce((n,r)=>n+r.downs,0),potions:rows.reduce((n,r)=>n+r.potions,0),intel:Object.fromEntries(Object.keys(rows[0].intel).map(k=>[k,rows.reduce((n,r)=>n+r.intel[k],0)])),rows:rows.map(r=>({seed:r.seed,clear:r.clear,downs:r.downs,potions:r.potions,intel:r.intel}))}
}
const args=process.argv.slice(2);const n=Number(args[1]||2),env=Number(args[2]||0),seed=Number(args[3]||1),party=(args[4]||'shield,harmful,mastermind').split(',');if(!Number.isSafeInteger(n)||n<1||n>1000||!Number.isSafeInteger(env)||env<0||env>2||!Number.isSafeInteger(seed)||seed<0||party.length!==3)throw Error('Invalid arguments');console.log(JSON.stringify(execute(fs.readFileSync(args[0]||'index.html','utf8'),fs.readFileSync('tests/balance.cjs','utf8'),n,env,seed,party),null,2));
