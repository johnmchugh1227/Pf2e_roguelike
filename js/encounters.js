// Encounter generation: room layouts, enemy specs, creature scaling and XP budgets.
function eighthRoom(){return run.room===8}
function ninthRoom(){return run.room===9}
function tenthRoom(){return run.room===10}
function seventhRoom(){return run.room===7}
function sixthRoom(){return run.room===6}
function thirdRoom(){return run.room===3}
function fourthRoom(){return run.room===4}
function fifthRoom(){return run.room===5}
function level(){return run.adv5?5:run.adv4?4:run.general?3:run.advancement?2:1}
function secondRoom(){return run.room===2}
function guardFight(){return secondRoom()||thirdRoom()||fifthRoom()}
function foeMax(){return fifthRoom()?36:fourthRoom()?28:thirdRoom()?30:secondRoom()?22:18}
function foeAC(){return fifthRoom()?19:fourthRoom()?17:thirdRoom()?17:15}
function layout(){return (tenthRoom()?tenthRooms:ninthRoom()?ninthRooms:eighthRoom()?eighthRooms:seventhRoom()?seventhRooms:sixthRoom()?sixthRooms:fifthRoom()?fifthRooms:fourthRoom()?fourthRooms:thirdRoom()?thirdRooms:secondRoom()?guardRooms:rooms)[run.floor]}
function baseFoeName(){return fifthRoom()?'Dungeon captain':fourthRoom()?'Veteran marksman':thirdRoom()?'Vault sentinel':secondRoom()?'Gate guard':'Archer'}
function baseEnemySpecs(){const map=layout().rows.join('');return tenthRoom()?[{name:['Sepulcher Warden','Drowned Warden','Iron Warlord'][run.floor],pos:map.indexOf('A'),max:100,ac:24,attack:15,init:12,fort:13,guard:true,boss:true}]:ninthRoom()?[{name:'Elite archer',pos:map.indexOf('A'),max:30,ac:21,attack:12,init:10,fort:9,guard:false},{name:'Vanguard',pos:map.indexOf('B'),max:38,ac:22,attack:13,init:9,fort:11,guard:true},{name:'Retainer',pos:map.indexOf('C'),max:26,ac:20,attack:11,init:8,fort:8,guard:false}]:eighthRoom()?[{name:'Reliquary defender',pos:map.indexOf('A'),max:37,ac:21,attack:12,init:9,fort:10,guard:true},{name:'Sentinel',pos:map.indexOf('B'),max:33,ac:20,attack:11,init:8,fort:10,guard:true}]:seventhRoom()?[{name:'Elite skirmisher',pos:map.indexOf('A'),max:32,ac:20,attack:11,init:9,fort:9,guard:false},{name:'Iron guard',pos:map.indexOf('B'),max:36,ac:21,attack:12,init:8,fort:10,guard:true}]:sixthRoom()?
 [{name:'Lookout archer',pos:map.indexOf('A'),max:22,ac:17,attack:8,init:7,fort:6,guard:false},{name:'Barricade guard',pos:map.indexOf('B'),max:28,ac:18,attack:9,init:6,fort:8,guard:true}]:
 [{name:baseFoeName(),pos:map.indexOf('A'),max:foeMax(),ac:foeAC(),attack:fifthRoom()?10:fourthRoom()?9:thirdRoom()?8:6,init:fifthRoom()?9:fourthRoom()?8:6,fort:fifthRoom()?9:fourthRoom()?7:thirdRoom()?7:5,guard:guardFight()}]}
function monsterize(e,type,name){const m=monsterTypes[type];return {...e,...m,type,name,undead:!!m.undead,mindless:!!m.mindless,resist:m.resist||{},weak:m.weak||{},slow:m.slow||0,noReaction:!!m.noReaction,reach:m.reach??(e.guard?2:1),meleeOnly:!!m.meleeOnly,web:!!m.web,formation:!!m.formation,reflex:Math.max(0,e.fort-1+(m.reflexShift||0)),fort:e.fort+(m.fortShift||0),will:Math.max(0,e.fort-2),perception:e.init}}
function cryptMonster(e,type){
 const guard=!['necromancer'].includes(type)&&(type!=='skeleton'||e.guard),m=monsterize({...e,guard},type,type==='skeleton'?(guard?'Skeletal guard':'Skeleton archer'):type==='zombie'?'Crypt zombie':type==='cryptWarden'?'Sepulcher Warden':monsterTypes[type].label);
 if(type==='skeleton')m.max=Math.max(8,e.max-3);
 if(type==='zombie'){m.max=e.max+4;m.ac=e.ac-2}
 if(type==='ghoul'){m.max=Math.max(10,e.max-3);m.ac=e.ac-1}
 if(type==='ghost'){m.max=Math.max(12,e.max-5);m.ac=e.ac-1}
 if(type==='wight')m.max=Math.max(14,e.max-2);
 if(type==='skeletalChampion')m.max=Math.max(14,e.max-3);
 if(type==='skeletalGiant'){m.max=e.max+6;m.ac=e.ac-2}
 if(type==='necromancer'){m.max=Math.max(12,e.max-6);m.ac=e.ac-1;m.attack=e.attack-1}
 return m}
function placeLarge(es,slot,m,fallback){if(!(m.size>1)){es[slot]=m;return}
 const occupied=new Set([9,18,27,...es.filter((_,i)=>i!==slot).flatMap(e=>footprint(e))]),anchors=Array.from({length:45},(_,i)=>i).filter(i=>{const cells=footprint(m,i);return cells.length===m.size*m.size&&cells.every(p=>rawTile(p)==='.'&&!occupied.has(p))}).sort((a,b)=>dist(a,m.pos)-dist(b,m.pos)||a-b);
 if(!anchors.length){es[slot]=fallback;return}m.pos=anchors[0];es[slot]=m}
function creatureXP(lv,party=level()){return creatureXPTable[lv-party]??Infinity}
function creatureBase(lv,pos,guard=true){return {pos,max:Math.max(5,16+8*lv),ac:15+Math.floor(1.2*lv)+(lv>=2?1:0),attack:6+Math.floor(1.4*lv)+(lv>=2?1:0),init:5+Math.floor(1.1*lv),fort:4+Math.floor(1.3*lv),guard}}
function summonAllowance(party){return creatureXP(Math.max(-1,party-4),party)}
function budgetCreature(id,party,variant=0){
 const type=id==='skeletonArcher'?'skeleton':id,standard=Math.max(-1,party+(monsterRelative[id]??-1)),lv=standard+variant;
 if(lv<-1||!Number.isFinite(creatureXP(lv,party)))return null;
 let m;if(type==='cryptWarden'){m=cryptMonster({...baseEnemySpecs()[0],max:155,attack:17},type)}else{
 const base=creatureBase(standard,0,id!=='skeletonArcher');m=generalBestiary.some(x=>x.id===type)?generalMonster(base,type):cryptMonster(base,type);
 // Keep standard monster identity, then apply simplified Weak/Elite adjustments.
 m.flat=(m.flat??(m.guard?2:0))+Math.floor(Math.max(0,standard)/3);
 if(variant){const hpDelta=standard<=1?5:standard<=4?10:15;
 for(const stat of ['ac','attack','init','fort','reflex','will','perception'])m[stat]=(m[stat]??0)+2*variant;
 m.max=Math.max(5,m.max+hpDelta*variant);m.flat=Math.max(0,m.flat+2*variant);m.name=(variant>0?'Elite ':'Weak ')+m.name}
 }
 m.creatureLevel=lv;m.variant=variant>0?'Elite':variant<0?'Weak':'Standard';m.xp=creatureXP(lv,party);m.summonXP=m.summons?summonAllowance(party)*m.summons:0;return m
}
function encounterSpawn(es,room){const occupied=new Set([9,18,27]),map=layout().rows.join(''),preferred=['A','B','C'].map(k=>map.indexOf(k)),fallback=[15,24,33];
 const order=es.map((e,i)=>i).sort((a,b)=>(es[b].size||1)-(es[a].size||1)||a-b);
 for(const i of order){const e=es[i],anchor=preferred[i]>=0?preferred[i]:fallback[i],cells=Array.from({length:45},(_,p)=>p).filter(p=>{const fs=footprint(e,p);return p%9>=4&&fs.length===(e.size||1)**2&&fs.every(q=>rawTile(q)==='.'&&!occupied.has(q))}).sort((a,b)=>dist(a,anchor)-dist(b,anchor)||a-b);
 if(!cells.length)return null;e.pos=cells[0];for(const p of footprint(e))occupied.add(p)}
 return es}
function encounterThreat(xp){return xp<=30?'Trivial':xp<=40?'Low':xp<=60?'Moderate':xp<=90?'Severe':xp<120?'Severe+': 'Extreme'}
function cryptEncounter(){
 const room=run.room||1,party=level(),budget=cryptRoomBudgets[room-1],hazards=(cryptHazardPlans[room]||[]).reduce((n,k)=>n+hazardXP[k],0),groups=[];
 for(const [r,recipe] of cryptRecipes[room].entries()){
 const [title,...slots]=recipe,ids=slots.map((id,i)=>id==='general'?seedPick(room<6?['rat','ratSwarm','spider','bat']:['ratSwarm','spider','bat','mimic','ooze'],room,111+r*3+i):id),choices=[];
 function build(index,list,xp){
 if(index===ids.length){if(xp+hazards>budget)return;const es=encounterSpawn(list.map(e=>({...e})),room);if(es)choices.push({es,xp:xp+hazards});return}
 for(const variant of ids[index]==='cryptWarden'?[0]:[-1,0,1]){const m=budgetCreature(ids[index],party,variant);if(m&&xp+m.xp+m.summonXP+hazards<=budget)build(index+1,[...list,m],xp+m.xp+m.summonXP)}
 }
 build(0,[],0);if(choices.length)groups.push({title,choices,best:Math.max(...choices.map(c=>c.xp))});
 }
 if(!groups.length)throw Error('No legal Crypt encounter for room '+room);
 const best=Math.max(...groups.map(g=>g.best)),eligible=groups.filter(g=>g.best>=best-10),group=seedPick(eligible,room,17),choice=seedPick(group.choices.filter(c=>c.xp>=group.best-5),room,18);
 for(const e of choice.es)e.encounterName=group.title;
 return choice.es
}
function encounterInfo(s){if(!s.enemies?.length||s.enemies.some(e=>!Number.isFinite(e.xp)))return null;
 const creatures=s.enemies.reduce((n,e)=>n+e.xp,0),reserve=s.enemies.reduce((n,e)=>n+(e.summonXP||0),0),hazards=(s.hazards||[]).reduce((n,z)=>n+(hazardXP[z.kind]||0),0);
 return {title:s.enemies[0].encounterName,party:level(),creatures,reserve,hazards,total:creatures+reserve+hazards,budget:cryptRoomBudgets[(run.room||1)-1],threat:encounterThreat(creatures+reserve+hazards)}}
function encounterHeader(s){const m=s.encounter;if(!m)return '';return '<p class="legend"><b>'+m.title+'</b> · '+m.threat+' threat · '+m.total+'/'+m.budget+' planned XP ('+m.creatures+' creatures'+(m.hazards?' + '+m.hazards+' hazards':'')+(m.reserve?' + '+m.reserve+' potential summons':'')+')</p>'}
function themedEnemySpecs(){
 const es=baseEnemySpecs(),room=run.room||1;
 if(run.floor===0)return cryptEncounter();
 if(room===10&&run.floor===1)return es.map(e=>({...e,max:145,attack:17,creatureLevel:level()+2,xp:80,encounterName:'The Drowned Warden',bossScript:'drowned',bossPhase:1,info:'Rising floodwater slows heroes. Avoid marked currents and waves; Escape Drowned Grasp.',undead:false,reach:2,meleeOnly:true,reactive:true,die:10,flat:3}));
 if(room===10)return es.map(e=>({...e,undead:false,warStandard:'raised'}));
 if(run.floor===1)return es.map((e,i)=>[3,5,7,8,9].includes(room)&&i===0?{...monsterize(e,'spider',room>=7?'Tunnel webspinner':'Giant spider'),guard:true,reach:1,max:Math.max(12,e.max-2)}:e);
 if(run.floor===2&&room>=6)return es.map(e=>monsterize(e,'hobgoblin',e.guard?'Hobgoblin soldier':'Hobgoblin archer'));
 return es}
function seedPick(pool,room,slot){let n=(run.seed^Math.imul(room,0x9e3779b9)^Math.imul(run.floor+1,0x85ebca6b)^Math.imul(slot+1,0xc2b2ae35))>>>0;n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return pool[((n^(n>>>16))>>>0)%pool.length]}
function generalMonster(e,id){const m=monsterTypes[id],melee=['rat','ratSwarm','ooze','wolf','spider','centipede','shieldbearer','spearman','assassin','bat','mimic','ogre'].includes(id),name=m.label;
 const p=monsterize({...e,guard:melee},id,name);p.guard=melee;p.undead=false;
 if(id==='rat')Object.assign(p,{max:Math.max(8,e.max-6),ac:e.ac-1});
 if(id==='bat')Object.assign(p,{max:Math.max(10,e.max-4),ac:e.ac+1});
 if(id==='mimic')Object.assign(p,{max:e.max+3,ac:e.ac-1});
 if(id==='ogre')Object.assign(p,{max:e.max+8,ac:e.ac-2});
 if(id==='ooze')Object.assign(p,{max:e.max+6,ac:e.ac-3});
 if(id==='ratSwarm')Object.assign(p,{max:Math.max(10,e.max-5),ac:e.ac-1});
 if(id==='battlemage')Object.assign(p,{max:Math.max(10,e.max-6),attack:e.attack-1,ac:e.ac-1});
 if(id==='centipede')Object.assign(p,{max:Math.max(10,e.max-5),ac:e.ac-1});
 if(id==='wolf')Object.assign(p,{max:Math.max(12,e.max-3)});
 if(id==='shieldbearer')Object.assign(p,{max:Math.max(12,e.max-3),shieldHP:12});
 if(id==='acolyte')Object.assign(p,{max:Math.max(10,e.max-5),attack:e.attack-1});
 if(id==='assassin')Object.assign(p,{max:Math.max(10,e.max-4)});
 return p}
// Preserve level bands, spawn counts and boss milestones; one general slot in selected encounters.
// First-floor balance pass: creature durability and offense, not dynamic party scaling. Legacy rooms use their intended room tier until budgeted bestiaries replace them.
function tuneEncounterCreature(e){const lv=e.creatureLevel??(e.boss?level()+2:level()),late=Math.max(0,lv-1),legacy=e.creatureLevel===undefined;const factor=1+Math.min(.28,late*.065)+(legacy?Math.min(.15,Math.max(0,level()-1)*.04):0);e.max=Math.ceil(e.max*factor);if(lv>=2)e.attack+=1;if(lv>=4)e.flat=(e.flat??(e.guard?2:0))+1;if(legacy&&lv>=4)e.attack+=1;return e}
function generalEncounterPick(room,slots){
 const slot=slots[room];
 const pool=room<=2?['rat','archer','wolf']:room<=5?['rat','spider','centipede','wolf','archer','shieldbearer','spearman','ooze','ratSwarm','bat','mimic']:['wolf','spider','centipede','archer','shieldbearer','spearman','assassin','acolyte','ooze','ratSwarm','battlemage','bat','mimic','ogre'];
 const original=seedPick(pool,room,slot);
 if(run.encounterVersion!==2)return original;
 // Compare only rooms whose other slots have identical roles. Resolve earlier
 // picks from the seed so a retry or a reload needs no encounter history.
 let avoid;
 if(run.floor===1&&room===4)avoid='spider'; // Fixed lone spiders in rooms 3 and 5.
 if((run.floor===1&&room===2)||(run.floor===2&&[4,5,8].includes(room))){
  avoid=generalEncounterPick(room-1,slots);
 }
 return original===avoid?seedPick(pool.filter(id=>id!==avoid),room,slot):original;
}
function untunedEnemySpecs(){const es=themedEnemySpecs(),room=run.room||1;if(room===10||run.floor===0)return es;
 const slots=run.floor===1?warrensGeneralSlots:watchfortGeneralSlots;
 const slot=slots[room];if(slot===undefined||!es[slot])return es;
 const id=generalEncounterPick(room,slots),m=generalMonster(baseEnemySpecs()[slot],id);if(m.size>1){const occupied=new Set([9,18,27,...es.filter((_,i)=>i!==slot).flatMap(e=>footprint(e))]);const anchors=Array.from({length:45},(_,i)=>i).filter(i=>{const cells=footprint(m,i);return cells.length===m.size*m.size&&cells.every(p=>rawTile(p)==='.'&&!occupied.has(p))}).sort((a,b)=>dist(a,m.pos)-dist(b,m.pos)||a-b);if(!anchors.length){es[slot]=generalMonster(baseEnemySpecs()[slot],'spearman');return es}m.pos=anchors[0]}es[slot]=m;return es}
function enemySpecs(){return untunedEnemySpecs().map(tuneEncounterCreature)}
function isUndead(e){return e.undead??(run.floor===0)}
function enemyShieldBonus(e){return e.shieldRaised&&e.shieldHP>6?2:0}
function formationBonus(s,e){return e.formation&&s.enemies.filter(x=>x!==e&&x.hp>0&&enemyAdjacent(x,e)).length>=2?1:0}
