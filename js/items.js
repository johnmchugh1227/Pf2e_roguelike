// Loot, equipment, weapon transfer, Quick Draw, supplies, potions and between-room recovery.
function gear(i){return run.gear?.[i]||{weapons:[],weapon:null,charms:[],charm:null}}
function ensureLoot(){run.gear??=Array.from({length:3},()=>({weapons:[],weapon:null,charms:[],charm:null}));run.supplies??={};for(const k of Object.keys(lootItems).filter(k=>lootItems[k].kind==='supply'&&k!=='minor'))run.supplies[k]??=0;run.lootSeen??={}}
function weaponFor(i){const id=run.picks[i],w=lootItems[gear(i).weapon];return w||{name:starterWeapons[id][0],type:starterWeapons[id][1],die:profiles[id][3]}}
// All distinct acquired trinkets are active; same-stat bonuses and resistances use the highest value.
function charmBonus(i,k){const g=gear(i);return Math.max(0,...Array.from(new Set([...(g.charms||[]),g.charm].filter(Boolean)),id=>Number(lootItems[id]?.[k])||0))}
function weaponType(id){return weaponFor(run.picks.indexOf(id)).type}
function lootEligible(key,i){const m=lootItems[key],g=gear(i);return m.kind==='weapon'?m.ids.includes(run.picks[i])&&!g.weapons.includes(key):m.kind==='charm'?(!m.ids||m.ids.includes(run.picks[i]))&&!g.charms.includes(key):false}
function lootChoices(s){if(s.lootOffers)return s.lootOffers;ensureLoot();const room=run.room||1,rank=level(),pool=Object.keys(lootItems).filter(k=>{const m=lootItems[k];return m.min<=rank&&(!m.crypt||run.floor===0)&&(m.kind==='supply'||run.picks.some((_,i)=>lootEligible(k,i)))});
 const result=[],seen=run.lootSeen;
 const choose=p=>{if(!p.length)return;const oldest=Math.min(...p.map(k=>seen[k]??-1));result.push(seedPick(p.filter(k=>(seen[k]??-1)===oldest),room,91+result.length))};
 choose(pool.filter(k=>lootItems[k].kind!=='supply'));
 while(result.length<3){let p=pool.filter(k=>!result.includes(k)&&(lootItems[k].kind!=='supply'||!result.some(j=>lootItems[j].kind==='supply')));if(!p.length)p=pool.filter(k=>!result.includes(k));if(!p.length)break;const oldest=Math.min(...p.map(k=>seen[k]??-1)),fresh=p.filter(k=>(seen[k]??-1)===oldest),different=fresh.filter(k=>!result.some(j=>lootItems[j].kind===lootItems[k].kind));choose(different.length?different:fresh)}
 return s.lootOffers=result}
function rememberLoot(s){ensureLoot();for(const k of lootChoices(s))run.lootSeen[k]=run.room||1}
function claimLoot(s,key,i=-1){if(s.reward||!won(s)||!s.hp.some(Boolean))return false;ensureLoot();if(key!==null&&!lootChoices(s).includes(key))return false;
 const m=lootItems[key];if(m&&m.kind!=='supply'&&(!Number.isInteger(i)||i<0||i>=3||!lootEligible(key,i)))return false;
 rememberLoot(s);s.reward=true;awardPotions(s,guaranteedPotions(),'checkpoint');repairShields(s);clearAfflictions(s);s.lootTaken=key;
 if(m){if(m.kind==='weapon'||m.kind==='charm'){const g=gear(i);g[m.kind==='weapon'?'weapons':'charms'].push(key);g[m.kind]=key;note(s,name(run.picks[i])+(m.kind==='charm'?' acquires '+m.name+' · all trinkets active':' equips '+m.name+' · previous weapons retained'))}
 else if(key==='minor')awardPotions(s,2,'cache');else run.supplies[key]+=(m.qty??(key==='antidote'?2:1));note(s,'Loot claimed · '+m.name)}
 return true}
function canTransferWeapon(s,from,to,key){
 if(!s||!won(s)||!s.reward||!s.hp.some(Boolean)||![from,to].every(i=>Number.isInteger(i)&&i>=0&&i<3)||from===to)return false;
 const m=lootItems[key];return !!(m?.kind==='weapon'&&gear(from).weapons.includes(key)&&m.ids.includes(run.picks[to])&&!gear(to).weapons.includes(key));
}
function transferWeapon(s,from,to,key){
 if(!canTransferWeapon(s,from,to,key))return false;
 const source=gear(from),dest=gear(to),equipped=source.weapon===key;
 source.weapons=source.weapons.filter(k=>k!==key);if(equipped)source.weapon=null;
 dest.weapons.push(key);
 note(s,name(run.picks[from])+' transfers '+lootItems[key].name+' to '+name(run.picks[to])+' · added to backup weapons'+(equipped?' · '+name(run.picks[from])+' equips starter weapon':''));
 return true;
}
function weaponTransferPanel(s){
 if(!won(s)||!s.reward||!s.hp.some(Boolean))return '';
 const rows=run.picks.flatMap((id,i)=>gear(i).weapons.map(key=>({id,i,key,eligible:[0,1,2].filter(j=>canTransferWeapon(s,i,j,key))}))).filter(x=>x.eligible.length);
 return '<section class="card weapon-transfer"><h3>Redistribute party weapons</h3><p class="legend">Free between encounters. Transfer a looted weapon to a compatible hero as a backup, then equip it if desired. The original owner returns to their starter weapon if necessary. Fundamental upgrades apply to all heroes; item effects move with the weapon.</p>'+(rows.length?rows.map(({id,i,key,eligible})=>'<div class="transfer-row"><div class="transfer-item">'+equipmentArt(lootItems[key])+'<div><b>'+lootItems[key].name+'</b><small>'+name(id)+' · '+(gear(i).weapon===key?'Equipped':'Backup')+'</small></div></div><div class="actions">'+eligible.map(j=>'<button data-transferweapon="'+key+'" data-transferfrom="'+i+'" data-transferto="'+j+'">'+spriteImage(run.picks[j],'portrait')+'<span>Give to '+name(run.picks[j])+'</span></button>').join('')+'</div></div>').join(''):'<p>No transferable weapons yet. Starter weapons stay with their heroes, and class compatibility still applies.</p>')+'</section>';
}
function equipLoot(s,i,kind,key,combat=false){ensureLoot();if(!Number.isInteger(i)||i<0||i>=3||kind!=='weapon')return false;
 const g=gear(i),allowed=kind==='weapon'?g.weapons:g.charms;if(key!==null&&!allowed.includes(key)||g[kind]===key)return false;
 if(combat&&(kind!=='weapon'||i!==s.active||!s.hp[i]||s.actions<1||won(s)))return false;
 if(!combat&&(!won(s)||!s.reward))return false;
 g[kind]=key;note(s,name(run.picks[i])+' equips '+(key?lootItems[key].name:kind==='weapon'?weaponFor(i).name:'no accessory'));
 if(combat)payAction();return true}
function canQuickDraw(s,i,key){
 if(i!==s.active||i<0||i>=3||!s.hp[i]||s.actions<1||!hasFeat(i,'Quick Draw')||!reachOK(s))return false;
 const g=gear(i);
 return key!==g.weapon&&(key===null||g.weapons.includes(key))
}
function quickDraw(s,i,key){
 if(!canQuickDraw(s,i,key))return false;
 gear(i).weapon=key;
 note(s,name(run.picks[i])+' uses Quick Draw · '+weaponFor(i).name);
 swing(s,i);payAction();return true
}
function quickDrawPanel(s,i){
 const g=gear(i);
 if(!hasFeat(i,'Quick Draw')||!g.weapons.length)return '';
 return '<details><summary>Quick Draw · switch and Strike · 1 action</summary>'+[null,...g.weapons].filter(k=>k!==g.weapon).map(k=>
  '<button data-quickdraw="'+(k||'starter')+'" '+(canQuickDraw(s,i,k)?'':'disabled')+'>Draw '+(k?lootItems[k].name:starterWeapons[run.picks[i]][0])+' and Strike '+target(s).name+'</button>').join('')+'</details>'
}
function supplyUsable(s,i,key,combat){if(!Number.isInteger(i)||i<0||i>=3||!s.hp[i]||lootItems[key]?.kind!=='supply'||key==='minor'||!(run.supplies[key]>0))return false;
 if(combat&&(i!==s.active||s.actions<1||won(s)))return false;if(!combat&&(!won(s)||!s.reward||!['lesser','elixir'].includes(key)))return false;
 if(lootItems[key].bomb)return combat&&target(s).hp>0&&bombImpact(s,i,target(s))!==undefined;
 if(lootItems[key].area){const a=areaSpells[lootItems[key].area];return combat&&s.actions>=a.actions&&Array.from({length:45},(_,p)=>p).some(p=>validAreaOrigin(s.pos[i],p,a))}
 if(key==='lesser'||key==='elixir')return s.hp[i]<heroMax(s,i);
 if(key==='antidote')return !s.antidote[i];if(key==='haste'||key==='warding')return !s.tonics[i][key];
 if(key==='salve')return !!s.persistent[i].bleed;if(key==='salts')return !!s.stiff[i];if(key==='restoration')return s.drained[i]>0;return false}
function useSupply(s,i,key,combat){ensureLoot();if(!supplyUsable(s,i,key,combat))return false;
 if(lootItems[key].bomb||lootItems[key].area)return startArea(s,i,key);
 let detail='';if(key==='lesser'||key==='elixir'){const n=Math.min(heroMax(s,i)-s.hp[i],key==='lesser'?roll(s,8)+roll(s,8)+5+level():roll(s,6)+2+level());s.hp[i]+=n;countMetric(s,i,'consumableHealing',n);metrics(s).partyHealing+=n;detail=n+' HP restored'}
 else if(key==='antidote'){s.antidote[i]=true;detail='+2 to poison saves this encounter'}
 else if(key==='haste'||key==='warding'){s.tonics[i][key]=true;detail=key==='haste'?'+5 ft Speed this encounter':'resistance 3 fire and void this encounter'}
 else if(key==='salve'){delete s.persistent[i].bleed;detail='persistent bleed ends'}
 else if(key==='salts'){s.stiff[i]=0;detail='partial paralysis ends'}
 else if(key==='restoration'){s.drained[i]--;detail='Drained reduced to '+s.drained[i]}
 note(s,name(run.picks[i])+' uses '+lootItems[key].name+' · '+detail);run.supplies[key]--;countMetric(s,i,'consumables');if(combat)payAction();return true}
function supplyButtons(s,i,combat){return Object.keys(run.supplies||{}).filter(k=>supplyUsable(s,i,k,combat)).map(k=>'<button data-supply="'+k+'" data-recipient="'+i+'">'+lootItems[k].name+(lootItems[k].bomb?' → '+target(s).name:'')+' ('+run.supplies[k]+' left)'+(combat?(lootItems[k].area?' · 2 actions · aim':' · 1 action'+(lootItems[k].bomb?' · aim':'')):'')+'</button>').join('')}
function lootPanel(s){
 const base=guaranteedPotions(),offers=lootChoices(s),key=offers.includes(s.lootPreview)?s.lootPreview:null,m=key?lootItems[key]:null;
 const kindLabel=k=>k==='charm'?'Trinket':k==='weapon'?'Weapon':'Supplies';
 let h='<section class="reward-step">'+alphaImage('treasure-chest-closed','objective-icon')+'<div class="reward-steps"><span>01 · Inspect reward</span><span>02 · Assign & claim</span></div><h3>Choose one reward</h3><p>Guaranteed: '+(base?'1 healing potion · '+potionFormula()+' and ':'')+'field shield repairs. Select one bonus reward.</p><div class="grid">'+offers.map(k=>{const x=lootItems[k];return '<button class="reward-offer" data-lootpreview="'+k+'" aria-pressed="'+(k===key)+'">'+equipmentArt(x)+'<span class="item-kind">'+kindLabel(x.kind)+'</span><strong>'+x.name+'</strong><span class="item-detail">'+x.desc+'</span></button>'}).join('')+'</div>';
 if(m){h+='<div class="reward-step"><h3>'+m.name+'</h3><p>'+m.desc+'</p>';if(m.kind==='supply')h+='<p class="reward-context">Shared party supplies. No hero assignment required.</p><button data-loot="'+key+'">Claim supplies</button>';else{h+='<p class="reward-context">'+(m.kind==='weapon'?'Compare each eligible hero’s normal Strike before claiming. Average and range exclude conditional effects, Sneak Attack, critical hits and enemy defenses. Fundamental upgrades apply to all heroes. Equipping the reward retains the old weapon as a backup.':'Adds a permanent active trinket. Same-stat bonuses use the highest value.')+'</p><div class="reward-recipients">'+run.picks.map((id,i)=>{const eligible=lootEligible(key,i),w=weaponFor(i),g=gear(i);return '<button class="reward-recipient" data-loot="'+key+'" data-recipient="'+i+'" '+(eligible?'':'disabled')+'>'+spriteImage(id,'portrait')+'<strong>'+name(id)+'</strong>'+(m.kind==='weapon'?(eligible?weaponComparison(i,m):'<small>Equipped: '+w.name+'</small>'):'<small>'+g.charms.length+' active trinket'+(g.charms.length===1?'':'s')+'</small>')+'<span class="grant-label">'+(eligible?(m.kind==='weapon'?'Equip & claim':'Assign & claim'):'Not eligible')+'</span></button>'}).join('')+'</div>'}h+='</div>'}else h+='<p class="legend">Tap a reward to inspect it and choose who receives it. Nothing is claimed until you confirm.</p>';
 return h+'<div class="actions"><button data-claim="1">Take guaranteed supplies only</button></div></section>'}
function equipmentPanel(s,combat=false){const indices=combat?[s.active]:[0,1,2],count=run.supplies||{},out=indices.map(i=>{const g=gear(i),w=weaponFor(i),nameOf=k=>lootItems[k].name;return '<div class="card"><b>'+name(run.picks[i])+'</b><p>'+w.name+' · Strike +'+weaponStats(i).attack+' · '+fundamentalLabel()+'</p>'+weaponStatsMarkup(i,w)+'<p>'+(weaponStats(i).role?weaponStats(i).role+' · ':'')+(weaponStats(i).sneak?weaponStats(i).sneak:'')+(g.charms.length?' · '+g.charms.length+' active trinket'+(g.charms.length===1?'':'s'):'')+'</p>'+((g.weapons.length)?'<details data-disclosure="weapons-'+i+'"><summary>'+ (combat?'Switch weapon · 1 action':'Equip weapon · free')+'</summary>'+[null,...g.weapons].map(k=>'<button data-equip="weapon" data-equipkey="'+(k||'starter')+'" data-recipient="'+i+'" '+(g.weapon===k?'disabled':'')+'>'+(k?nameOf(k):starterWeapons[run.picks[i]][0])+' · '+weaponStats(i,k?lootItems[k]:{name:starterWeapons[run.picks[i]][0],type:starterWeapons[run.picks[i]][1],die:profiles[run.picks[i]][3]}).formula+'</button>').join('')+'</details>':'')+(g.charms.length?'<details data-disclosure="trinkets-'+i+'"><summary>Active trinkets · '+g.charms.length+'</summary><p class="legend">All acquired trinkets are active. Same-stat item bonuses and resistances use the highest value.</p><ul>'+g.charms.map(k=>'<li><b>'+nameOf(k)+'</b> · '+lootItems[k].desc+'</li>').join('')+'</ul></details>':'')+(combat?quickDrawPanel(s,i):'')+supplyButtons(s,i,combat)+'</div>'}).join('');
 return '<details data-disclosure="equipment-'+(combat?s.active:'party')+'" '+(!combat?'open':'')+'><summary>'+ (combat?'Equipment & consumables':'Party equipment')+'</summary>'+out+'</details>'}
// One shared ten-minute activity per cleared room. A separate sanctuary choice is available after rooms 5 and 9.
function recoveryState(s){return s.recovery??={used:false,medic:null,rest:null}}
function recoveryOpen(s){return won(s)&&s.reward&&s.hp.some(Boolean)&&!tenthRoom()}
function eligibleMedic(s,i){return Number.isInteger(i)&&i>=0&&i<3&&s.hp[i]>0&&medicineTrained(i)}
function recoveryMedic(s){const r=recoveryState(s),ids=[0,1,2].filter(i=>eligibleMedic(s,i)).sort((a,b)=>medicineMod(b)-medicineMod(a)||a-b);return ids.includes(r.medic)?r.medic:ids[0]??-1}
function recoverHP(s,i,n){const before=s.hp[i];s.hp[i]=Math.min(heroMax(s,i),Math.max(0,before+n));return s.hp[i]-before}
function treatWounds(s,i,t){if(!recoveryOpen(s)||recoveryState(s).used||!eligibleMedic(s,i)||!Number.isInteger(t)||t<0||t>2||s.hp[t]>=heroMax(s,t))return false;
 const r=recoveryState(s);r.used=true;r.medic=i;const d=roll(s,20),mod=medicineMod(i),degree=outcome(d,mod,15);let result=0;
 if(degree===3){for(let j=0;j<4;j++)result+=roll(s,8)}else if(degree===2){result=roll(s,8)+roll(s,8)}else if(degree===0){result=-roll(s,8)}
 if(result<0&&s.hp[t]>0&&s.hp.filter(Boolean).length===1)result=Math.max(result,1-s.hp[t]);
 const change=recoverHP(s,t,result);countMetric(s,i,'healing',change);r.result=name(run.picks[i])+' Treat Wounds → '+name(run.picks[t])+' · '+(d+mod)+' vs DC 15 · '+['critical failure','failure','success','critical success'][degree]+' · '+(change>=0?'+':'')+change+' HP';note(s,r.result);return true}
function basicTreatment(s,t){if(!recoveryOpen(s)||recoveryState(s).used||!Number.isInteger(t)||t<0||t>2||s.hp[t]>=heroMax(s,t))return false;
 const r=recoveryState(s);r.used=true;const n=recoverHP(s,t,level()+2);metrics(s).partyHealing+=n;r.result='Basic treatment → '+name(run.picks[t])+' · '+n+' HP restored';note(s,r.result);return true}
function sanctuaryRoom(){return (run.room||1)===5||ninthRoom()}
function sanctuary(s,choice){if(!recoveryOpen(s)||!sanctuaryRoom()||recoveryState(s).rest||!['rest','resupply'].includes(choice))return false;
 const r=recoveryState(s);r.rest=choice;
 if(choice==='rest'){for(let i=0;i<3;i++)if(hasShield(run.picks[i]))restoreShield(s,i,true);const changes=run.picks.map((id,i)=>s.hp[i]>0?recoverHP(s,i,Math.ceil(heroMax(s,i)/4)):0);metrics(s).partyHealing+=changes.reduce((a,b)=>a+b,0);note(s,'Sanctuary rest · '+changes.map((n,i)=>name(run.picks[i])+' +'+n+' HP').join(' · '))}
 else{awardPotions(s,2,'sanctuary');note(s,'Sanctuary resupply · two healing potions');for(let i=0;i<3;i++)if(s.hp[i]>0&&['healing','harmful'].includes(run.picks[i])&&s.font[i]<4){s.font[i]++;countMetric(s,i,'fontRecovered');note(s,name(run.picks[i])+' recovers one divine font cast from the sanctuary blessing')}}
 return true}
function recoveryPanel(s){if(!recoveryOpen(s))return '';const r=recoveryState(s),i=recoveryMedic(s),patients=[0,1,2].filter(t=>s.hp[t]<heroMax(s,t)),medics=[0,1,2].filter(j=>eligibleMedic(s,j));
 let out='<section class="card recovery"><h3>Between-room recovery</h3><p>One shared recovery activity before the next room. '+(r.used?'Activity spent.':'Activity available.')+'</p>';
 if(r.used)out+='<p>'+r.result+'</p>';else if(!patients.length)out+='<p>Everyone is at full HP. No treatment needed.</p>';else{
 if(i>=0){const mod=medicineMod(i);out+='<p><b>Treat Wounds</b> · Medicine '+(mod>=0?'+':'')+mod+' vs DC 15 · success 2d8, critical success 4d8, critical failure 1d8 damage.</p>';
 if(medics.length>1)out+='<div class="actions">'+medics.map(j=>'<button data-recoverymedic="'+j+'" aria-pressed="'+(i===j)+'">'+name(run.picks[j])+' · '+medicineMod(j)+'</button>').join('')+'</div>';
 out+='<div class="actions">'+patients.map(t=>'<button data-treatwounds="'+t+'">Treat '+name(run.picks[t])+' · '+hpLabel(s,t)+'</button>').join('')+'</div>'}
 out+='<p><b>Basic treatment</b> · guaranteed '+(level()+2)+' HP, no roll or training. Uses the same activity.</p><div class="actions">'+patients.map(t=>'<button data-basicrecovery="'+t+'">Bandage '+name(run.picks[t])+'</button>').join('')+'</div>'}
 const damagedShields=[0,1,2].filter(i=>canRepairRecovery(s,i));if(damagedShields.length)out+='<h3>Repair equipment</h3><p>Use the shared activity to fully repair one shield.</p><div class="actions">'+damagedShields.map(i=>'<button data-repairshield="'+i+'">Repair '+name(run.picks[i])+' shield · '+s.shields[i]+' → 20 HP</button>').join('')+'</div>';
 out+=focusRecoveryPanel(s);
 if(sanctuaryRoom()){out+=alphaImage('sanctuary-shrine','objective-icon')+'<h3>Sanctuary</h3><p>'+ (r.rest?'Used: '+(r.rest==='rest'?'Rest':'Resupply'):'Choose one additional recovery benefit.')+'</p>';if(!r.rest)out+='<div class="actions"><button data-sanctuary="rest">Rest · living heroes recover 25% max HP + full shield repairs</button><button data-sanctuary="resupply">Resupply · 2 potions'+(run.picks.some(id=>['healing','harmful'].includes(id))?' + 1 font cast per living cleric (max 4)':'')+'</button></div>'}
 return out+'<p class="legend">Treat Wounds and basic treatment can revive downed heroes. Sanctuary rest does not. Unused recovery does not carry forward.</p></section>'}
function supplyPanel(s){
 const rows=run.picks.map((id,i)=>'<li>'+name(id)+(fundamentalRunes().potency?' · +'+fundamentalRunes().potency+' weapon · '+weaponDice(i)+' dice':'')+' · '+hpLabel(s,i)+(['healing','harmful'].includes(id)?' · '+s.font[i]+' rank '+fontRank()+' font casts':'')+(s.potions>0&&s.hp[i]<heroMax(s,i)? ' <button data-potion="'+i+'">Give potion · '+potionFormula()+'</button>':'')+'</li>').join('');
 return '<h3>Party supplies</h3><p>Healing potions · '+s.potions+' · '+potionFormula()+(Object.keys(run.supplies||{}).filter(k=>run.supplies[k]>0).map(k=>' · '+lootItems[k].name+': '+run.supplies[k]).join(''))+'</p><ul>'+rows+'</ul>';
}
// Expedition healing scales with the party, not a fixed tabletop item level.
function guaranteedPotions(){return [1,2,3,5,7,9].includes(run.room||1)?1:0}
function potionAverage(){return 4.5+2*level()}
function potionFormula(){return '1d8+'+(2*level())+' HP'}
function awardPotions(s,n,source){if(n<=0)return;s.potions=(s.potions||0)+n;s.potionAwards??={checkpoint:0,cache:0,sanctuary:0};s.potionAwards[source]=(s.potionAwards[source]||0)+n;note(s,'Healing potions gained · '+source+' · +'+n)}
function drink(s,i){
 if(!Number.isInteger(i)||i<0||i>2||!s.potions||s.hp[i]>=heroMax(s,i))return false;
 const n=Math.min(roll(s,8)+2*level(),heroMax(s,i)-s.hp[i]);s.hp[i]+=n;s.potions--;countMetric(s,i,'potions');countMetric(s,i,'potionHealing',n);metrics(s).partyHealing+=n;note(s,name(run.picks[i])+' recovers '+n+' HP from a healing potion ('+potionFormula()+').');return true;
}
