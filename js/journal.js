// Local run journal and human-playtest telemetry. Never sends data over the network.
// Local, versioned human-playtest telemetry. Never sends data over the network.
const journalKey='pf2e-crawl-history-v1',journalBuild='alpha-fundamentals-12',journalLimit=25,journalBudget=2000000;
let journalMemory=[],journalWarning='',journalExportOpen=false;
const metricKeys=['damage','reactionDamage','healing','damageTaken','knockouts','strikes','criticalHits','sneakHits','damagePrevented','redirected','recallAttempts','recallSuccesses','recallCriticals','newLoreTypes','weakestSavesRevealed','restudies','directedOpenings','openingStrikes','openingImprovedOutcomes','hideAttempts','hideSuccesses','hiddenStrikes','hiddenAttacksAvoided','liberationSteps','liberationEscapes','hazardRecallAttempts','hazardIdentified','hazardsDisabled','maneuverSuccesses','taunts','potions','potionHealing','consumableHealing','shieldHPRepaired','repairActions','fontSpent','fontRecovered','focusSpent','focusRecovered','consumables'];
function metrics(s){s.metrics??={heroes:run.picks.map(id=>({id,...Object.fromEntries(metricKeys.map(k=>[k,0]))})),unattributedDamage:0,partyHealing:0};for(const h of s.metrics.heroes)for(const k of metricKeys)h[k]??=0;return s.metrics}
function countMetric(s,i,k,n=1){if(!Number.isFinite(n)||n<=0)return;const m=metrics(s).heroes[i];if(m&&Object.hasOwn(m,k))m[k]+=n}
function journalNote(s,msg){
 const i=run.picks.findIndex(id=>msg.startsWith(name(id)+' ')),suffix=i>=0?msg.slice(name(run.picks[i]).length+1):msg;
 const amount=r=>Number(suffix.match(r)?.[1]||0),success=/ · (?:critical success|success)(?: ·|$)/.test(suffix);
 if(i>=0){
  if(suffix.startsWith('Recall Knowledge ·')&&!/ · (Hazard Lore|crafting) /.test(suffix)&&!['Suspicious stone tile','Unfamiliar floor markings','Glowing stone altar'].some(x=>suffix.startsWith('Recall Knowledge · '+x+' ·'))){countMetric(s,i,'recallAttempts');if(success)countMetric(s,i,'recallSuccesses');if(/ · critical success$/.test(suffix))countMetric(s,i,'recallCriticals')}
  if(suffix.startsWith('Disable ')&&success)countMetric(s,i,'hazardsDisabled');
  if(/^(trip|grapple|disarm|demoralize|feint|shove|reposition) →/.test(suffix)&&success)countMetric(s,i,'maneuverSuccesses');
  if(/^Shield Block · prevented /.test(suffix))countMetric(s,i,'damagePrevented',amount(/prevented (\d+)/));
  if(/^(Retributive Strike|Liberating Step) · prevents /.test(suffix))countMetric(s,i,'damagePrevented',amount(/prevents (\d+)/));
  if(suffix.startsWith('Intercept Attack ·'))countMetric(s,i,'redirected',amount(/redirects (\d+)/));
  if(/^taunts\b/i.test(suffix))countMetric(s,i,'taunts');
 }
}
function journalRead(){try{const v=JSON.parse(localStorage.getItem(journalKey));if(Array.isArray(v))return v.filter(r=>r&&r.schema===1&&typeof r.id==='string')}catch{}return []}
function journalWrite(records){journalMemory=records.slice(-journalLimit);while(journalMemory.length>1&&JSON.stringify(journalMemory).length>journalBudget)journalMemory.shift();try{localStorage.setItem(journalKey,JSON.stringify(journalMemory));journalWarning='';return true}catch{journalWarning='Device storage is unavailable or full. Export this report before closing the game.';return false}}
function journalEnsure(partial=false){
 if(!run.battle)return null;
 if(!run.journal){const nonce=Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');run.journal={id:Date.now()+'-'+nonce,build:journalBuild,startedAt:new Date().toISOString(),partial:!!partial,retries:0,rooms:[]}}
 if(run.journal.build!==journalBuild){run.journal.partial=true;run.journal.build=journalBuild}return run.journal
}
function journalSnapshot(s){
 const j=run.journal,m=metrics(s);
 return {room:run.room||1,attempt:j.retries,level:level(),result:s.hp.some(Boolean)?'clear':'defeat',rounds:s.round,encounter:layout().title,encounterBudget:s.encounter??null,entry:s.telemetryEntry??null,
 enemies:s.enemies.map(e=>({type:e.type||e.name,name:e.name,hp:e.hp,maxHP:e.max,level:e.creatureLevel??null,summoned:!!e.summoned})),
 heroes:run.picks.map((id,i)=>({id,name:name(id),hp:s.hp[i],maxHP:heroMax(s,i),shieldHP:s.shields?.[i]??null,font:s.font?.[i]??null,focus:s.focus?.[i]??null,feats:allFeats(i).filter(Boolean),generalFeat:generalFeat(i)||null,weapon:weaponFor(i).name,gear:{...gear(i),weapons:[...gear(i).weapons],charms:[...gear(i).charms],activeTrinkets:[...gear(i).charms]},metrics:{...m.heroes[i]}})),
 unattributedDamage:m.unattributedDamage,partyHealing:m.partyHealing,potionAwards:{...s.potionAwards},potionsRemaining:s.potions??0,supplies:{...run.supplies},loot:s.lootTaken??null,lootOffers:s.lootOffers??null,recovery:s.recovery?JSON.parse(JSON.stringify(s.recovery)):null,
 bossEvents:(s.bossEvents||[]).slice(),hazards:(s.hazards||[]).map(z=>({kind:z.kind,pos:z.pos,hp:z.hp??null,identified:hazardKnown(z),disabled:!!z.disabled,destroyed:!!z.destroyed,active:!!z.active})),log:s.log.slice().reverse()}
}
function journalTotals(rooms){const heroes=run.picks.map(id=>({id,...Object.fromEntries(metricKeys.map(k=>[k,0]))}));for(const r of rooms)r.heroes.forEach((h,i)=>{for(const k of metricKeys)heroes[i][k]+=h.metrics[k]||0});return {heroes,rounds:rooms.reduce((a,r)=>a+r.rounds,0),unattributedDamage:rooms.reduce((a,r)=>a+r.unattributedDamage,0),partyHealing:rooms.reduce((a,r)=>a+r.partyHealing,0),potionsEarned:rooms.reduce((n,r)=>n+Object.values(r.potionAwards||{}).reduce((a,b)=>a+b,0),0)}}
function journalRecord(){
 const s=run.battle;if(!s)return;const j=journalEnsure(true);
 if(!s.enemies||!Array.isArray(s.hp))return;
 const dead=!s.hp.some(Boolean),clear=won(s);if(!dead&&!clear)return;
 kit(s);const snap=journalSnapshot(s),idx=j.rooms.findIndex(r=>r.room===snap.room&&r.attempt===snap.attempt);
 if(idx<0){snap.combatEndHP=snap.heroes.map(h=>h.hp);snap.combatLevel=snap.level;j.rooms.push(snap)}else{snap.combatEndHP=j.rooms[idx].combatEndHP;snap.combatLevel=j.rooms[idx].combatLevel??snap.level;j.rooms[idx]=snap}
 if(!dead&&!tenthRoom())return;
 const outcome=dead?'defeat':'floor_clear',id=j.id+':'+j.retries+':'+outcome,prev=journalMemory.find(r=>r.id===id);
 const entry={schema:1,id,runId:j.id,build:j.build,startedAt:j.startedAt,recordedAt:prev?.recordedAt||new Date().toISOString(),partial:j.partial,seed:run.seed,encounterVersion:run.encounterVersion??1,draftOffers:dealDraft(run.seed),environment:floors[run.floor][0],party:run.picks.slice(),outcome,room:run.room||1,retries:j.retries,cleanClear:outcome==='floor_clear'&&!j.retries&&!j.partial&&new Set(j.rooms.filter(r=>r.result==='clear').map(r=>r.room)).size===10,roomsCleared:new Set(j.rooms.filter(r=>r.result==='clear').map(r=>r.room)).size,rooms:JSON.parse(JSON.stringify(j.rooms)),totals:journalTotals(j.rooms),lore:{...run.monsterLore}};
 const records=journalMemory.filter(r=>r.id!==id);records.push(entry);journalWrite(records);
}
function journalReport(r){
 const total=k=>r.totals.heroes.reduce((n,h)=>n+(h[k]||0),0),fmt=x=>Number(x)||0;
 return '<p>'+r.roomsCleared+'/10 rooms cleared · '+r.totals.rounds+' rounds · '+r.retries+' retries'+(r.partial?' · partial history':'')+'</p><p class="legend">Seed '+r.seed+' · '+r.build+' · '+(r.recordedAt||'').slice(0,10)+'</p><div style="overflow:auto"><table style="width:100%;text-align:left"><thead><tr><th>Hero</th><th>Damage</th><th>Heal</th><th>Prevent</th><th>Downs</th></tr></thead><tbody>'+r.totals.heroes.map(h=>'<tr><td>'+name(h.id)+'</td><td>'+fmt(h.damage)+'</td><td>'+fmt(h.healing)+'</td><td>'+fmt(h.damagePrevented)+'</td><td>'+fmt(h.knockouts)+'</td></tr>').join('')+'</tbody></table></div>'+
 '<p>Potions used '+total('potions')+' · Earned '+(r.totals.potionsEarned??'not recorded')+' · Remaining '+(r.rooms.at(-1)?.potionsRemaining??'—')+' · Potion healing '+total('potionHealing')+' HP · Font casts '+total('fontSpent')+' · Focus spent '+total('focusSpent')+' · Other consumables '+total('consumables')+'</p><p>New enemy types identified '+total('newLoreTypes')+' · Successful Hides '+total('hideSuccesses')+' · Hidden Strikes '+total('hiddenStrikes')+' · Directed openings '+total('directedOpenings')+' · Successful studies '+total('recallSuccesses')+' · Hazards disabled '+total('hazardsDisabled')+' · Successful maneuvers '+total('maneuverSuccesses')+'</p>'+
 '<p class="legend">Damage is actual enemy HP removed, including reactions and attributed persistent damage. Unattributed sources: '+fmt(r.totals.unattributedDamage)+'. Recovery not credited to a hero: '+fmt(r.totals.partyHealing)+' HP. Redirected damage is separate from prevented damage.</p>'+
 '<details><summary>Room-by-room results</summary>'+r.rooms.map(x=>'<p>Room '+x.room+' · '+x.encounter+' · '+x.result+' · '+x.rounds+' rounds · HP at combat end '+(x.combatEndHP||[]).join('/')+'</p>').join('')+'</details>';
}
function journalPanel(){
 const n=journalMemory.length,latest=journalMemory.at(-1),current=latest&&run.journal?.id===latest.runId;
 return '<section class="hazard-panel">'+(current?'<h3>Expedition report</h3>'+journalReport(latest):'')+'<details '+(current||journalExportOpen?'open':'')+'><summary>Playtest history · '+n+' saved result'+(n===1?'':'s')+'</summary><p class="legend">Saved on this device only. Up to '+journalLimit+' recent results, subject to storage size. Defeats and later clears are linked by run ID. Export regularly.</p>'+
 (n?journalMemory.slice().reverse().map(r=>'<details><summary>'+r.environment+' · '+(r.outcome==='floor_clear'?'Clear':'Defeat in room '+r.room)+' · '+r.retries+' retries'+(r.partial?' · partial':'')+'</summary>'+journalReport(r)+'</details>').join(''):'<p>No finished runs yet.</p>')+
 (journalWarning?'<p>'+journalWarning+'</p>':'')+'<button data-historyexport="1" '+(!n?'disabled':'')+'>Export playtest JSON</button>'+
 (journalExportOpen&&n?'<p class="legend">Download the JSON or select and copy the text below.</p><textarea id="history-json" readonly rows="6" style="width:100%"></textarea>':'')+'</details></section>'
}
function journalShowExport(){journalExportOpen=true;render();const el=document.getElementById('history-json');if(el){const data=JSON.stringify({schema:1,records:journalMemory},null,2);el.value=data;try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download='pf2e-playtest-history.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}catch{}el.focus();el.select()}}
