// Rendering and input: board, panels, combat feedback, render(), event handlers and boot. Must load last.
function alphaAdvancement(lv){
 const a=lv===2?run.advancement:lv===3?run.general:lv===4?run.adv4:run.adv5,i=a.hero,id=run.picks[i],p=profile(id),boost=lv===5,choice=boost?a.boosts[i]:a.choices[i],names={2:'Class feat',3:'General feat',4:'Class feat',5:'Attribute boosts'},tab={2:'advhero',3:'genhero',4:'fourhero',5:'fivehero'}[lv],confirm={2:'finishadv',3:'genfinish',4:'fourfinish',5:'fivefinish'}[lv],browse=lv===2?'allfeats':'fourall';
 const choiceName=j=>boost?a.boosts[j].length+'/4 boosts':lv===2?featPools[run.picks[j]][a.choices[j]]?.[0]:lv===3?generalPool[a.choices[j]]?.[0]:a.choices[j];
 const complete=j=>boost?a.boosts[j].length===4:!!choiceName(j),n=run.picks.filter((_,j)=>complete(j)).length;
 const pendingTough=lv===3&&!a.done&&generalFeat(i)==='Toughness'?lv:0,hp=p[0]+pendingTough+(boost&&!a.done?lv*attrDelta(i,2,true):0),ac=p[1]+(boost&&!a.done&&acDex(id)?attrDelta(i,1,true):0),atk=p[2]+(boost&&!a.done?attrDelta(i,atkAttr(id),true):0),stats=[['Max HP',hp],['AC',ac],['Strike','+'+atk],['Speed',speed(i)*5+' ft'],['Initiative','+'+initiativeBonus(i)]];
 if(['healing','harmful'].includes(id))stats.push(['Spell DC',divineDC(i)+(boost&&!a.done?attrDelta(i,4,true):0)]);
 let h='<section class="alpha-advance" data-advance-hero="'+i+'"><div class="adv-eyebrow">Level '+lv+' · '+names[lv]+'</div><h2>Party reached level '+lv+'!</h2>'+fundamentalPanel(lv)+'<p>Review your choices before confirming the party advancement.</p><div class="adv-progress">'+run.picks.map((x,j)=>'<button class="'+(complete(j)?'complete':'')+'" data-'+tab+'="'+j+'" aria-pressed="'+(i===j)+'">'+spriteImage(x,'portrait')+'<span><strong>'+name(x)+'</strong><small>'+(complete(j)?'✓ ':'')+(choiceName(j)||'Choose feat')+'</small></span></button>').join('')+'</div><div class="adv-body"><aside class="adv-summary"><div class="adv-portrait">'+spriteImage(id,'portrait')+'<div><div class="adv-eyebrow">Hero '+(i+1)+' / 3</div><h3>'+name(id)+'</h3><small>Level '+lv+' · Preview</small></div></div><div class="adv-stats">'+stats.map(([k,v])=>'<div class="adv-stat"><small>'+k+'</small><b>'+v+'</b></div>').join('')+'</div><p class="adv-note">Current equipment: '+weaponFor(i).name+'. '+(lv===4?'Already learned: '+(feat(i)||'None')+' · '+(generalFeat(i)||'None')+'. ':lv===5?'Automatic HP and proficiency increases are included; selected boosts preview applicable increases. ':lv===3?'General feat benefits previewed; previous class feat retained. ':'Routine HP and proficiency gains are automatic. ')+'Stats are unbuffed previews, before combat conditions.</p></aside><section class="adv-options"><div class="adv-choices-top"><h3>'+(boost?'Attribute boosts':lv===3?'General feats':a.all?'All available feats':'Suggested feats')+'</h3>';
 if(boost){h+='</div><p>Choose four distinct attributes. +4 or higher receives a partial boost.</p><div class="adv-boosts">'+attributes.map((attr,j)=>{const yes=choice.includes(j),partial=yes&&baseAttrs[id][j]>=4;return '<button class="adv-boost" data-boost="'+j+'" aria-pressed="'+yes+'" '+(!yes&&choice.length>=4?'disabled':'')+'><strong>'+attr+'</strong>+'+baseAttrs[id][j]+' → +'+attrValue(i,j,true)+'<small>'+(partial?'Partial boost (1/2)':yes?'✓ Selected':'Select boost')+'</small></button>'}).join('')+'</div>'}
 else{const pool=lv===2?featPools[id].map((f,j)=>({n:f[0],l:f[1],d:f[2],v:j})):lv===3?generalPool.map((f,j)=>({n:f[0],l:3,d:f[1],v:j})):pool4(i).map(f=>({n:f[0],l:f[1],d:f[2],v:f[0]})).sort((x,y)=>Number(liveFeats.has(y.n))-Number(liveFeats.has(x.n))),shown=lv===3||a.all?pool:pool.slice(0,3),action=lv===2?'feat':lv===3?'genfeat':'fourfeat';if(lv!==3&&pool.length>3)h+='<button data-'+browse+'="1">'+(a.all?'Suggested feats':'Browse all '+pool.length)+'</button>';h+='</div><p>Choose one feat for this hero.</p><div class="adv-cards">'+shown.map(f=>{const live=lv===3||liveFeats.has(f.n),yes=choice===f.v;return '<button class="adv-feat" data-'+action+'="'+f.v+'" aria-pressed="'+yes+'"><span class="adv-tag'+(live?'':' pending')+'">'+(lv===3?'GENERAL FEAT':'FEAT LEVEL '+f.l)+' · '+(live?'PLAYABLE':'EFFECT PENDING')+'</span><strong>'+f.n+'</strong><span class="adv-desc">'+f.d+'</span><span class="adv-choice">'+(yes?'✓ Selected':'Select feat ›')+'</span></button>'}).join('')+'</div>'}
 return h+'</section></div><div class="adv-footer"><div><b>'+n+' / 3 heroes ready</b><br>'+(n===3?'Review your choices, then confirm.':'Finish each hero to continue.')+'</div><button data-'+confirm+'="1" '+(n!==3?'disabled':'')+'>Confirm level '+lv+'</button></div><p class="legend">Prototype progression uses implemented features only. Pending feat effects are labeled. Gear and earlier choices are retained.</p></section>';
}
function heroCard(id){const [gear,feature,turn,next]=heroes[id];return '<article class="card">'+spriteImage(id,'draft-portrait')+'<h3>'+name(id)+'</h3><p>'+gear.split(" · ")[1]+'</p><p><b>'+feature+'</b></p><details><summary>Inspect hero</summary><p>'+turn+'</p>'+(triggers[id]?'<p>'+triggers[id]+'</p>':'')+'<p>'+next+'</p></details><footer><button data-pick="'+id+'">Recruit '+name(id)+'</button></footer></article>'}
// Presentation-only capture around a UI action. Observe actual HP, not nominal damage rolls.
let feedbackCapture=null;
function feedbackHP(s){return {heroes:(s.hp||[]).slice(),enemies:(s.enemies||[]).map(e=>e.hp)}}
function feedbackStart(s){feedbackCapture={battle:s,before:s?feedbackHP(s):null,lines:[],changes:{},ward:0,enemyTurns:0,enabled:!s||(!s.reward&&!won(s))}}
function feedbackObserve(s,msg){
 const f=feedbackCapture;if(!f||!s)return;
 if(f.battle!==s){f.battle=s;f.before={heroes:s.telemetryEntry?.hp?.slice()||s.hp.slice(),enemies:s.telemetryEntry?.enemies?.map(e=>e.hp)||s.enemies.map(e=>e.hp)};f.lines=[];f.changes={};f.ward=0;f.enemyTurns=0;f.enabled=true}
 if(!f.enabled)return;
 const now=feedbackHP(s);
 for(const kind of ['heroes','enemies'])now[kind].forEach((hp,i)=>{const old=f.before?.[kind]?.[i];if(!Number.isFinite(old)||!Number.isFinite(hp)||hp===old)return;const key=(kind==='heroes'?'h':'e')+i,c=f.changes[key]??={lost:0,gained:0};if(hp<old)c.lost+=old-hp;else c.gained+=hp-old});
 f.before=now;
 if(msg){f.lines.push(msg);if(s.enemies.some(e=>msg===e.name+' turn'))f.enemyTurns++;const ward=msg.match(/^Wardstones absorb (\d+) damage$/);if(ward)f.ward+=Number(ward[1])}
}
function feedbackFinish(s){
 const f=feedbackCapture;if(!f)return;feedbackObserve(s);feedbackCapture=null;
 if(!s||!f.enabled||f.battle!==s||(!f.lines.length&&!Object.keys(f.changes).length))return;
 s.feedback={lines:f.lines.slice(-80),omitted:Math.max(0,f.lines.length-80),changes:f.changes,ward:f.ward,enemyTurns:f.enemyTurns};
}
function feedbackEscape(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function feedbackAmounts(c){return (c?.lost?'<span class="feedback-loss">−'+c.lost+' HP</span>':'')+(c?.gained?'<span class="feedback-gain">+'+c.gained+' HP</span>':'')}
function feedbackToken(s,ei,idx){const key=ei>=0?'e'+ei:idx>=0?'h'+idx:null,c=key&&s.feedback?.changes?.[key];return c?'<span class="feedback-token">'+feedbackAmounts(c)+'</span>':''}
function feedbackPanel(s){const f=s.feedback;if(!f)return '';const ward=f.ward?'<div class="feedback-ward"><b>Wardstones absorbed '+f.ward+' damage!</b> Disable or destroy the active stones to stop their protection.</div>':'';
 const changes=Object.entries(f.changes||{}).map(([k,c])=>{const i=Number(k.slice(1)),label=k[0]==='h'?name(run.picks[i]):s.enemies[i]?.name;return label?'<div class="feedback-actor"><b>'+feedbackEscape(label)+'</b>'+feedbackAmounts(c)+'</div>':''}).join('');
 const notable=f.lines.filter(x=>/→|\bturn$|\b(?:Strides|Steps|Flies|miss|immune|resists|weakness|prevents|prevented|restores|restored|heals|defeated|summons|summoned|prepares|unleashes|paralyzed|poison|frightened|Shield|Taunt|wardstone|wardstones|drained|takes|grabs|webbed|raises)\b/i.test(x));
 const shown=(notable.length?notable:f.lines).slice(0,6),remaining=f.lines.length-shown.length;
 return '<section class="combat-feedback" id="latest-action" tabindex="-1" aria-label="Recent combat events"><div class="feedback-heading"><b>'+(f.enemyTurns?'Enemy actions · '+f.enemyTurns+' turn'+(f.enemyTurns===1?'':'s'):'Latest action')+'</b><small>Until your next resolved action</small></div>'+ward+(changes?'<div class="feedback-actors">'+changes+'</div>':'')+'<div class="feedback-events">'+shown.map(x=>'<div>'+feedbackEscape(x)+'</div>').join('')+'</div>'+(remaining>0||f.omitted?'<details><summary>All recent events ('+(f.lines.length+f.omitted)+')</summary>'+(f.omitted?'<p>Earlier events are in the combat log.</p>':'')+f.lines.map(x=>'<p>'+feedbackEscape(x)+'</p>').join('')+'</details>':'')+'</section>';
}
function enemyGlyph(e,j){return e.boss?'W':['A','B','C','D','E'][j]||'F'}
let preview=null;
function combatLog(s,limit){const entries=s.log.slice(0,limit);return '<details open data-disclosure="combat-log"><summary>Combat log</summary>'+entries.map(msg=>'<p>'+msg+'</p>').join('')+'</details>'}
function hpInfo(s,i){const max=heroMax(s,i),hp=Math.max(0,Math.min(max,s.hp[i])),missing=max-hp;return {hp,max,missing,pct:100*hp/max}}
function hpLabel(s,i){const {hp,max,missing}=hpInfo(s,i);return hp+'/'+max+' HP · '+(missing?missing+' missing':'Full health')}
function partyPanel(s,combat=false){
 const cards=run.picks.map((id,i)=>{const {hp,max,missing,pct}=hpInfo(s,i),active=combat&&s.active===i&&hp>0,state=hp===0?'Downed':active?'Active turn':missing?missing+' HP missing':'Full health';
 return '<div class="party-member'+(active?' active':'')+(!hp?' down':'')+'" aria-label="'+name(id)+' · '+hpLabel(s,i)+(active?' · Active turn':'')+'"><div class="party-name"><span class="party-number">'+(i+1)+'</span>'+spriteImage(id,'portrait')+'<span>'+name(id)+'</span></div><div class="party-hp"><strong>'+hp+'/'+max+'</strong><small>HP</small></div><div class="hp-track" role="progressbar" aria-label="'+name(id)+' health" aria-valuemin="0" aria-valuemax="'+max+'" aria-valuenow="'+hp+'"><div class="hp-fill'+(pct<=25?' critical':pct<=50?' wounded':'')+'" style="width:'+pct+'%"></div></div><div class="party-detail">'+state+(active&&missing?' · '+missing+' missing':'')+(combat&&hp?' · Reaction '+(s.ready[i]?'ready':'spent'):'')+(s.prone[i]?' · Prone':'')+(combat&&s.enemies.some(e=>hiddenAgainst(s,e,i))?' · Hidden from '+s.enemies.filter(e=>hiddenAgainst(s,e,i)).map(e=>e.name).join(', '):'')+(s.hampering?.[i]?' · Hampering Stance'+(s.prone[i]?' (suppressed)':''):'')+(focusWardActive(s,s.focusWards?.[i])?' · Lay on Hands +2 AC':'')+(s.drained[i]?' · Drained '+s.drained[i]:'')+(s.stiff[i]?' · Partial paralysis '+s.stiff[i]:'')+(s.venom[i]?' · '+venomProfiles[s.venom[i].kind].label+' stage '+s.venom[i].stage+' (DC '+s.venom[i].dc+')':'')+Object.entries(s.persistent[i]).map(([k,v])=>' · Persistent '+k+' 1d'+v.die).join('')+(s.webbed[i]?' · Webbed (Escape '+s.webbed[i].dc+')':'')+(s.grabbed[i]?' · Grabbed (Escape '+s.grabbed[i].dc+')':'')+(holdEnemy(s,i)?' · Grabbing '+holdEnemy(s,i).name:'')+(combat&&flankedHero(s,i)?' · Flanked':'')+(s.enemies.some(e=>e.hp>0&&e.feintBackfire?.[i])?' · Feint backfired':'')+'</div>'+'<div class="party-detail">'+weaponFor(i).name+' · <b>'+weaponStats(i).formula+'</b>'+(s.antidote[i]?' · Antidote':'')+(s.tonics[i].haste?' · Quickstep':'')+(s.tonics[i].warding?' · Warded':'')+'</div>'+(hasShield(id)?'<div class="party-detail">Shield '+s.shields[i]+'/20 · '+shieldStatus(s,i)+'</div>':'')+'</div>'}).join('');
 return '<section aria-label="Party health"><div class="party-status">'+cards+'</div><p class="party-meta">Potions: '+s.potions+run.picks.map((id,i)=>['healing','harmful'].includes(id)?' · '+name(id)+': '+s.font[i]+' font casts':focusMax(i)?' · '+name(id)+': '+s.focus[i]+'/'+focusMax(i)+' focus':'').join('')+'</p></section>';
}
function defensePanel(s){
 const i=s.active,id=run.picks[i];if(!hasShield(id))return '';let h='<div class="actions">';
 h+='<button data-blocktoggle="'+i+'" aria-pressed="'+run.blockEnabled[i]+'">Auto Shield Block: '+(run.blockEnabled[i]?'ON':'OFF')+'</button>';
 if(hasFeat(i,'Aggressive Block'))h+='<button data-aggressivetoggle="'+i+'" aria-pressed="'+run.aggressiveEnabled[i]+'">Auto Aggressive Block: '+(run.aggressiveEnabled[i]?'ON':'OFF')+'</button>';
 if(['justice','liberation'].includes(id)){h+='<button data-causetoggle="'+i+'" aria-pressed="'+run.causeEnabled[i]+'">Auto '+(id==='justice'?'Retributive Strike':'Liberating Step')+': '+(run.causeEnabled[i]?'ON':'OFF')+'</button>';if(hasFeat(i,'Divine Grace'))h+='<button data-gracetoggle="'+i+'" aria-pressed="'+run.graceEnabled[i]+'">Auto Divine Grace: '+(run.graceEnabled[i]?'ON':'OFF')+'</button>'}
 if(id==='bodyguard')h+='<button data-intercepttoggle="'+i+'" aria-pressed="'+run.interceptEnabled[i]+'">Auto Intercept: '+(run.interceptEnabled[i]?'ON':'OFF')+'</button>';
 return h+'</div><p class="legend">Reactions share one use per turn cycle. Shield Block prevents up to '+(5+charmBonus(i,'shield'))+' physical damage; excess damages both the shield and hero. Broken shields cannot be raised. Claim loot to restore shields between rooms.'+(id==='bodyguard'?' Intercept protects allies within 10 ft (15 ft against your taunted enemy); auto-interception avoids lethal redirects when the ally would survive.':'')+'</p>'}
function healingEstimate(s,i){const missing=hpInfo(s,i).missing,lo=9*fontRank(),hi=(spellDie(s.active)+8)*fontRank();return 'Restore '+Math.min(lo,missing)+(Math.min(lo,missing)===Math.min(hi,missing)?'':'–'+Math.min(hi,missing))+' HP'+(missing<hi?' (capped at missing HP)':'')}
function skillButtons(s){const options=skills(s);return '<div class="heal-actions">'+options.map(([key,label])=>key.startsWith('heal')?'<button data-skill="'+key+'">'+label+'<small>'+hpLabel(s,Number(key[4]))+' · '+healingEstimate(s,Number(key[4]))+'</small></button>':'<button data-skill="'+key+'">'+label+'</button>').join('')+'</div>'}
function field(){const s=run.battle,r=layout(),win=won(s);
 let h='<header><h1 tabindex="-1">'+r.title+'</h1><small>Room '+(run.room||1)+' of 10 · Level '+level()+'</small></header>';
 kit(s);s.potions??=s.reward?guaranteedPotions():0;
 h+=encounterHeader(s)+partyPanel(s,!win&&s.hp.some(h=>h>0))+feedbackPanel(s);
 if(!s.hp.some(h=>h>0))return h+'<h2>Party defeated</h2><button data-retry="1">Retry encounter</button> <button data-reset="new">New draft</button>'+combatLog(s);if(win){
 h+='<h2>Encounter cleared</h2>'+(s.reward?alphaImage('treasure-chest-opened','objective-icon'):'');
 if(s.reward)h+=recoveryPanel(s);
 if(!s.reward)h+=lootPanel(s);
 else if(secondRoom()){
 if(!run.advancement)h+='<h3>Two rooms cleared</h3><p>Room rewards collected. Your party has earned level 2.</p><button data-levelup="1">Level up party</button>';
 else if(!run.advancement.done)h+=advancementPanel();
 else h+='<h3>Party advanced · Level 2</h3><ul>'+run.picks.map((id,i)=>'<li>'+name(id)+' · '+featPools[id][run.advancement.choices[i]][0]+'</li>').join('')+'</ul>'+runePanel();
 }
 else if(thirdRoom())h+='<h3>Three rooms cleared · Level 2</h3><button data-fourth="1">Enter room 4 · '+fourthRooms[run.floor].title+'</button>';
 else if(fourthRoom()){
 if(!run.general)h+='<h3>Four rooms cleared · Level 3 earned</h3><button data-genstart="1">Level up party</button>';
 else if(!run.general.done)h+=generalPanel();
 else h+='<h3>Party advanced · Level 3</h3><ul>'+run.picks.map((id,i)=>'<li>'+name(id)+' · '+generalFeat(i)+'</li>').join('')+'</ul><button data-fifth="1">Enter room 5 · '+fifthRooms[run.floor].title+'</button>';
 }
 else if(fifthRoom())h+='<h3>Five rooms cleared · Level 3</h3><button data-sixth="1">Enter room 6 · '+sixthRooms[run.floor].title+'</button>';
 else if(sixthRoom()){
 if(!run.adv4)h+='<h3>Six rooms cleared · Level 4 earned</h3><button data-fourstart="1">Level up party</button>';
 else if(!run.adv4.done)h+=panel4();
 else h+='<h3>Party advanced · Level 4</h3><ul>'+run.picks.map((id,i)=>'<li>'+name(id)+' · '+allFeats(i).join(' + ')+'</li>').join('')+'</ul>'+fundamentalPanel(4)+'<button data-seventh="1">Enter room 7 · '+seventhRooms[run.floor].title+'</button>';
  }else if(seventhRoom())h+='<h3>Seven rooms cleared · Level 4</h3><button data-eighth="1">Enter room 8 · '+eighthRooms[run.floor].title+'</button>';
 else if(eighthRoom()){
 if(!run.adv5)h+='<h3>Eight rooms cleared · Level 5 earned</h3><button data-fivestart="1">Level up party</button>';
 else if(!run.adv5.done)h+=panel5();
 else h+='<h3>Party advanced · Level 5</h3>'+strikingPanel();
 }else if(ninthRoom())h+='<h3>Nine rooms cleared · Floor boss awaits</h3><button data-tenth="1">Enter room 10 · '+tenthRooms[run.floor].title+'</button>';
 else if(tenthRoom())h+='<h2>Floor 1 complete!</h2><p>You cleared all ten encounters in '+floors[run.floor][0]+' at level 5. The next floor is not yet implemented.</p><ul>'+run.picks.map((id,i)=>'<li>'+name(id)+' · '+allFeats(i).join(' + ')+' · '+generalFeat(i)+'</li>').join('')+'</ul><button data-reset="same">Replay seed</button> <button data-reset="new">New draft</button>';
 else h+='<button data-next="1">Enter room 2 · '+guardRooms[run.floor].title+'</button>';
 return h+supplyPanel(s)+(s.reward?weaponTransferPanel(s)+equipmentPanel(s):'')+combatLog(s);
 }
 if(!tenthRoom())h+='<p>Defeat '+s.enemies.filter(e=>e.hp>0).map(e=>e.name).join(' and ')+'. Select a target to inspect its abilities.</p>';
 kit(s);retarget(s);const inspection=enemyPanel(s)+(s.hazardTarget>=0&&s.hazards[s.hazardTarget]?.active?'':monsterDetails(s))+hazardPanel(s);h+=bossWarning(s)+areaWarnings(s)+'<div class="combat-panels"><div class="combat-board" id="battle-board" tabindex="-1" role="region" aria-label="Battle board">';const charge=chargeActive(s),chargeDest=charge?chargeOptions(s):new Map(),aim=areaPlan(s),areaView=areaPreview(s,aim),aimCells=new Set(areaView.cells),aimChoices=new Set(aim?areaChoices(s,aim):[]),force=activeForce(s),tumble=activeTumble(s),tumbleDest=tumble?tumbleOptions(s):new Map(),forceDest=force?forceOptions(s,force.kind):new Map(),opts=force||tumble||aim||charge?new Map():moves(),here=s.pos[s.active],selected=opts.get(preview);
 h+='<nav class="board-nav" aria-label="Battle navigation"><a href="#target-inspection">Inspect target</a>'+(s.feedback?'<a href="#latest-action">Latest action</a>':'')+'<button type="button" data-readtiles="1" aria-pressed="false" aria-controls="tile-readout">Read tiles</button></nav><p id="tile-readout" class="tile-readout" aria-live="polite" hidden></p><p class="turn"><b>'+name(run.picks[s.active])+'</b> · '+s.actions+(s.actions===1?' action':' actions')+' · Round '+s.round+' · '+foeName()+' '+target(s).hp+'/'+target(s).max+' HP'+(target(s).frightened?' · Frightened '+target(s).frightened:'')+'</p><div class="mapscroll"><div class="map '+mapTheme()+'">';
 for(let i=0;i<45;i++){let t=tile(i),idx=s.pos.indexOf(i),ei=enemyAt(i),z=hazardAt(s,i),[x,y]=xy(i),label=ei>=0?s.enemies[ei].name:idx>=0?name(run.picks[idx]):({c:r.low,"#":r.wall,A:foeName()}[t]||"floor");
 const warned=dangerSquare(s,i),glowing=hazardGlow(s,i);
 h+='<button data-square="'+i+'" aria-label="'+String.fromCharCode(65+x)+(y+1)+' '+label+(i===warStandardSquare&&s.enemies.some(e=>e.warStandard==='raised')?' · War standard':'')+(s.enemies.some(e=>e.hp>0&&e.bossIntent?.kind==='volley'&&e.bossIntent.cells.includes(i))?' · Volley danger':warned?' · Incoming attack':glowing?' · Hazard warning':'')+(z?' · '+hazardDisplay(z):'')+(hamperingAt(s,i)?' · Guardian difficult terrain (enemies)':'')+((s.flooded||[]).includes(i)?' · Floodwater difficult terrain':'')+(droppedWeapons(s,i).length?' · Dropped '+droppedWeapons(s,i).map(enemyWeapon).join(', '):'')+'" class="sq t'+(t==='#'?'wall':t==='.'?'floor':t)+(x===8?' edge':'')+(idx>=0?' pawn':'')+(i===here?' current':'')+(opts.has(i)?' available':'')+(chargeDest.has(i)?' charge-dest':'')+(charge&&s.chargePlan.dest===i?' charge-chosen':'')+(aimCells.has(i)?' area-hit':'')+(aimChoices.has(i)?' area-aim':'')+(aim?.center===i?' area-center':'')+(forceDest.has(i)?' force-dest':'')+(tumbleDest.has(i)?' tumble-dest':'')+(tumble?.dest===i?' tumble-chosen':'')+(force?.dest===i?' force-chosen':'')+(opts.has(i)&&flankPartners(s,s.active,target(s),i).length?' flank-dest':'')+(ei>=0&&s.enemies[ei].size>1?' large-enemy':'')+(ei>=0&&flankPartners(s,s.active,s.enemies[ei]).length?' flank-target':'')+(idx>=0&&flankedHero(s,idx)?' flank-risk':'')+(z?' hazard-'+(hazardKnown(z)?z.kind:'unknown'):'')+(hamperingAt(s,i)&&rawTile(i)==='.'?' hampered':'')+((s.flooded||[]).includes(i)?' drowned-flood':'')+(droppedWeapons(s,i).length?' dropped-weapon':'')+(warned||glowing?' danger':'')+(i===preview||(ei>=0&&ei===s.target&&s.hazardTarget<0)||(z&&s.hazards[s.hazardTarget]===z)?' selected':'')+'" '+(chargeDest.has(i)?'data-chargecell="'+i+'"':aimChoices.has(i)?'data-areacell="'+i+'"':tumbleDest.has(i)?'data-tumblecell="'+i+'"':forceDest.has(i)?'data-forcecell="'+i+'"':ei>=0?'data-target="'+ei+'"':z?'data-hazardcell="'+i+'"':opts.has(i)?'data-cell="'+i+'"':'disabled')+'>'+(warned||glowing?'<span class="danger-marker" aria-hidden="true">!</span>':'')+terrainCell(s,i,ei,idx,z,(ei>=0?enemyGlyph(s.enemies[ei],ei):idx>=0?idx+1:z?(hazardKnown(z)?hazardTypes[z.kind].glyph:'?'):droppedWeapons(s,i).length?'⚔':({c:'▰','#':'▦',A:fifthRoom()?'C':fourthRoom()?'M':thirdRoom()?'S':secondRoom()?'G':'A'}[t]||(x===8?'›':''))))+(ei>=0&&i!==footprint(s.enemies[ei]).at(-1)?'':feedbackToken(s,ei,idx))+'</button>'}
 h+='</div></div><p class="legend">▰ cover &nbsp; ▦ wall &nbsp; '+s.enemies.map((e,j)=>enemyGlyph(e,j)+' '+e.name).join(' · ')+' &nbsp; › east · numbered tokens match party cards · green outline: flank · orange dashed: flanked hero'+(s.hampering.some(Boolean)?' · blue lower edge: Hampering Stance':'')+'</p>';
 h+=forcePanel(s)+tumblePanel(s)+areaPanel(s,aim,areaView)+chargePanel(s,chargeDest);h+='<p aria-live="polite">'+(charge?'Blue squares are legal Sudden Charge destinations.':aim?'Gold squares are aiming options; orange fill shows affected area.':tumble?'Cyan squares are legal Tumble Through destinations.':force?'Purple squares are legal forced-movement destinations.':selected?'Destination · '+(selected.cost*5)+' ft · '+sight(preview)+(hideCover(s,target(s),s.active,preview)>=2?' · Hide available after moving':'')+flankPreview(s,preview)+hazardPreview(s,selected)+(mobilitySafe(s,selected)?' · Mobility: no movement reactions':threatenedPath(s,selected).length?' · Reactive Strike risk: '+threatenedPath(s,selected).map(e=>e.name).join(', '):''):'Current square · '+sight(here)+flankPreview(s,here)+'. Tap a lit square to preview a Stride.')+'</p><div class="actions">'+(selected?'<button data-stride="1">'+iconArt('stride')+' Stride here · 1 action'+(mobilitySafe(s,selected)?' · Mobility':threatenedPath(s,selected).length?' · reaction risk':'')+'</button>':'')+(stepOK(s,preview)?'<button data-step="1">'+iconArt('step')+' Step here · 1 action · no reactions</button>':'')+(s.grabbed[s.active]?'<button data-grabescape="1" '+(s.webEscapeBlocked===s.active?'disabled':'')+'>Escape Grab · DC '+s.grabbed[s.active].dc+' · 1 action</button>':'')+(s.webbed[s.active]?'<button data-webescape="1" '+(s.webEscapeBlocked===s.active?'disabled':'')+'>Escape web · DC '+s.webbed[s.active].dc+' · 1 action</button>':'')+(s.prone[s.active]?'<button data-stand="1">Stand · 1 action'+(s.enemies.some(e=>canReactAt(e,s.pos[s.active]))?' · reaction risk':'')+'</button>':'')+(holdEnemy(s,s.active)?'<button data-release="1">Release grapple · free</button>':'')+'<button data-end="1">'+iconArt('end-turn')+' End turn</button></div>';
 const id=run.picks[s.active],mod=profile(id)[2]-penalty(s.attacks,id==='thief')-(s.prone[s.active]?2:0),can=reachOK(s),shield=hasShield(id);
 h+='<div class="actions"><button data-strike="1" '+(can?'':'disabled')+'>'+iconArt('strike')+' Strike '+foeName().toLowerCase()+' · '+weaponFor(s.active).type+' ('+(mod>=0?'+':'')+mod+')</button>'+(shield?'<button data-raise="1" '+(s.raised[s.active]||!shieldUsable(s,s.active)?'disabled':'')+'>' +iconArt('raise-shield')+(shieldUsable(s,s.active)?'Raise Shield · +2 AC':'Shield '+shieldStatus(s,s.active))+'</button>':'')+'</div><p>'+(!can?'Move into weapon reach and line of effect.':'Target AC '+targetAC(s,s.active)+(flank(s,s.active)?' · Flanking (−2 AC)':''))+'</p>'+skillButtons(s)+(['healing','harmful'].includes(id)?'<p>Rank '+fontRank()+' font casts left: '+s.font[s.active]+'</p>':'')+('<p class="legend">'+({shield:'Reactive Strike triggers automatically when the archer fires in reach.',reach:'Reactive Strike triggers automatically when the archer fires in reach.',justice:'Automatic reaction: protect an ally in your aura and retaliate if the archer is in reach.',liberation:'Automatic reaction: protect an ally in your aura and Step them away if space permits.',thief:'Feint or flank with a melee ally to make the archer off-guard and enable Sneak Attack.',mastermind:'Study the enemy to reveal party-wide defenses and weakest saves, and enable personal ranged Sneak Attack.',bodyguard:'Taunt draws enemy attention. Attacks excluding you take −1 and make the enemy off-guard.',harmful:isUndead(target(s))?'This enemy is undead. Harm cannot damage it.':'Harm targets the living enemy within 30 ft.',healing:'Heal a wounded ally within 30 ft, or use Heal offensively against undead.'}[id]).replaceAll('archer',foeName().toLowerCase()).replace('gate guard fires','gate guard throws a javelin')+'</p>')+(s.potions>0&&s.hp[s.active]<heroMax(s,s.active)?'<button data-drink="1">Drink healing potion · '+potionFormula()+' · 1 action ('+s.potions+' left · '+hpInfo(s,s.active).missing+' HP missing)</button>':'')+defensePanel(s)+featButtons(s,selected)+'</div><aside class="combat-inspect" id="target-inspection" tabindex="-1" aria-label="Target inspection"><a class="inspect-return" href="#battle-board">Back to board</a>'+inspection+equipmentPanel(s,true)+combatLog(s,8)+'</aside></div>';return h}
function battleClick(d){if(!run.battle||d.reset)return false;const s=run.battle;
 if(!s.hp.some(h=>h>0)){if(d.retry){run.battle=newRoom();enemyTurn()}return true}if(won(s)){kit(s);s.potions??=s.reward?guaranteedPotions():0;
 if(d.lootpreview!==undefined&&!s.reward){if(lootChoices(s).includes(d.lootpreview))s.lootPreview=d.lootpreview}
 else if(d.claim&&!s.reward){claimLoot(s,null)}
 else if(d.loot!==undefined&&!s.reward){claimLoot(s,d.loot,Number(d.recipient))}
 else if(d.recoverymedic!==undefined&&recoveryOpen(s)&&!recoveryState(s).used){const i=Number(d.recoverymedic);if(eligibleMedic(s,i))recoveryState(s).medic=i}
 else if(d.treatwounds!==undefined){treatWounds(s,recoveryMedic(s),Number(d.treatwounds))}
 else if(d.basicrecovery!==undefined){basicTreatment(s,Number(d.basicrecovery))}
 else if(d.repairshield!==undefined){repairRecovery(s,Number(d.repairshield))}
 else if(d.refocus!==undefined){refocus(s,Number(d.refocus))}
 else if(d.layhealer!==undefined&&d.laytarget!==undefined){layHands(s,Number(d.layhealer),Number(d.laytarget),false)}
 else if(d.sanctuary){sanctuary(s,d.sanctuary)}
 else if(d.transferweapon!==undefined){transferWeapon(s,Number(d.transferfrom),Number(d.transferto),d.transferweapon)}
 else if(d.equip){equipLoot(s,Number(d.recipient),d.equip,d.equipkey==='starter'?null:d.equipkey)}
 else if(d.supply){useSupply(s,Number(d.recipient),d.supply,false)}
 else if(d.levelup)startAdvancement(s);
 else if(run.advancement&&!run.advancement.done&&d.advhero!==undefined){const i=Number(d.advhero);if(Number.isInteger(i)&&i>=0&&i<3){run.advancement.hero=i;run.advancement.all=false}}
 else if(run.advancement&&!run.advancement.done&&d.allfeats)run.advancement.all=!run.advancement.all;
 else if(run.advancement&&!run.advancement.done&&d.feat!==undefined)chooseFeat(run.advancement,run.advancement.hero,Number(d.feat));
 else if(run.advancement&&d.finishadv)finishAdvancement(run.advancement);
 else if(secondRoom()&&run.advancement?.done&&d.rechoose){run.advancement.done=false;run.advancement.hero=0;run.advancement.all=false}
 else if(secondRoom()&&run.advancement?.done&&d.third){run.entry={hp:s.hp.slice(),font:s.font.slice(),focus:s.focus.slice(),potions:s.potions,shields:s.shields.slice()};run.room=3;preview=null;run.battle=newRoom();enemyTurn()}
 else if(thirdRoom()&&s.reward&&d.fourth)enterFollowing(s,4);
 else if(fourthRoom()&&d.genstart)startGeneral(s);
 else if(fourthRoom()&&run.general&&!run.general.done&&d.genhero!==undefined){const i=Number(d.genhero);if(Number.isInteger(i)&&i>=0&&i<3)run.general.hero=i}
 else if(fourthRoom()&&run.general&&!run.general.done&&d.genfeat!==undefined)chooseGeneral(s,run.general.hero,Number(d.genfeat));
 else if(fourthRoom()&&d.genfinish)finishGeneral(s);
 else if(fourthRoom()&&run.general?.done&&d.fifth&&s.reward)enterFollowing(s,5);
 else if(fifthRoom()&&s.reward&&d.sixth)enterFollowing(s,6);
 else if(sixthRoom()&&d.fourstart)start4(s);
 else if(sixthRoom()&&run.adv4&&!run.adv4.done&&d.fourhero!==undefined){const i=Number(d.fourhero);if(Number.isInteger(i)&&i>=0&&i<3){run.adv4.hero=i;run.adv4.all=false}}
 else if(sixthRoom()&&run.adv4&&!run.adv4.done&&d.fourall)run.adv4.all=!run.adv4.all;
 else if(sixthRoom()&&run.adv4&&!run.adv4.done&&d.fourfeat)choose4(run.adv4.hero,d.fourfeat);
 else if(sixthRoom()&&d.fourfinish)finish4();
 else if(sixthRoom()&&run.adv4?.done&&s.reward&&d.seventh)enterFollowing(s,7);
 else if(seventhRoom()&&s.reward&&d.eighth)enterFollowing(s,8);
 else if(eighthRoom()&&d.fivestart)start5(s);
 else if(eighthRoom()&&run.adv5&&!run.adv5.done&&d.fivehero!==undefined){const i=Number(d.fivehero);if(Number.isInteger(i)&&i>=0&&i<3)run.adv5.hero=i}
 else if(eighthRoom()&&run.adv5&&!run.adv5.done&&d.boost!==undefined)boost5(run.adv5.hero,Number(d.boost));
 else if(eighthRoom()&&d.fivefinish)finish5(s);
 else if(eighthRoom()&&run.adv5?.done&&s.reward&&d.ninth)enterFollowing(s,9);
 else if(ninthRoom()&&s.reward&&d.tenth)enterFollowing(s,10);
 else if(d.potion!==undefined)drink(s,Number(d.potion));
 else if(d.next&&s.reward&&(run.room||1)===1){run.entry={hp:s.hp.slice(),font:s.font.slice(),focus:s.focus.slice(),potions:s.potions,shields:s.shields.slice()};run.room=2;preview=null;run.battle=newRoom();enemyTurn()}return true}
 kit(s);if(d.quickdraw){quickDraw(s,s.active,d.quickdraw==='starter'?null:d.quickdraw);return true}if(d.chargecancel){s.chargePlan=null;return true}if(d.chargecell!==undefined){selectCharge(s,Number(d.chargecell));return true}if(d.chargeconfirm){resolveCharge(s);return true}if(d.recallmonster){recallMonster(s);return true}if(d.strikehazard!==undefined){strikeHazard(s,Number(d.strikehazard));return true}if(d.areacancel){s.areaPlan=null;return true}if(d.areacell!==undefined){selectArea(s,Number(d.areacell));return true}if(d.areaconfirm){confirmArea(s);return true}if(d.tumblecancel){s.tumblePlan=null;preview=null;return true}if(d.tumblecell!==undefined){selectTumble(s,Number(d.tumblecell));return true}if(d.tumbleconfirm){resolveTumble(s);return true}if(d.forcecancel){s.forcePlan=null;preview=null;return true}if(d.forcecell!==undefined){selectForce(s,Number(d.forcecell));return true}if(d.forceconfirm){resolveForce(s);return true}if(d.equip){equipLoot(s,Number(d.recipient),d.equip,d.equipkey==='starter'?null:d.equipkey,true);return true}if(d.supply){useSupply(s,Number(d.recipient),d.supply,true);return true}if(d.hazardtarget!==undefined){const j=Number(d.hazardtarget);if(s.hazards[j]?.active){s.hazardTarget=j;s.forcePlan=null;s.tumblePlan=null;s.areaPlan=null;s.chargePlan=null;preview=null}return true}if(d.hazardcell!==undefined){const pos=Number(d.hazardcell),j=s.hazards.findIndex(z=>z.active&&z.pos===pos);if(j>=0){s.hazardTarget=j;s.forcePlan=null;s.tumblePlan=null;s.areaPlan=null;s.chargePlan=null;preview=moves().has(pos)?pos:null}return true}if(d.recallhazard!==undefined){recallHazard(s,Number(d.recallhazard));return true}if(d.disablehazard!==undefined){disableHazard(s,Number(d.disablehazard));return true}if(d.grabescape){escapeGrab(s);return true}if(d.webescape){if(s.webEscapeBlocked!==s.active)escapeWeb(s);return true}if(d.stand){standHero(s);return true}if(d.release){const e=holdEnemy(s,s.active);if(e)releaseGrab(e,s,'released');return true}if(d.aggressivetoggle!==undefined){const i=Number(d.aggressivetoggle);if(i===s.active&&hasFeat(i,'Aggressive Block'))run.aggressiveEnabled[i]=!run.aggressiveEnabled[i];return true}if(d.causetoggle!==undefined){const i=Number(d.causetoggle);if(i===s.active&&['justice','liberation'].includes(run.picks[i]))run.causeEnabled[i]=!run.causeEnabled[i];return true}if(d.gracetoggle!==undefined){const i=Number(d.gracetoggle);if(i===s.active&&hasFeat(i,'Divine Grace'))run.graceEnabled[i]=!run.graceEnabled[i];return true}if(d.blocktoggle!==undefined){const i=Number(d.blocktoggle);if(i===s.active&&hasShield(run.picks[i]))run.blockEnabled[i]=!run.blockEnabled[i];return true}if(d.intercepttoggle!==undefined){const i=Number(d.intercepttoggle);if(i===s.active&&run.picks[i]==='bodyguard')run.interceptEnabled[i]=!run.interceptEnabled[i];return true}if(d.target!==undefined){const i=Number(d.target);if(Number.isInteger(i)&&s.enemies[i]?.hp>0){s.target=i;s.hazardTarget=-1;s.forcePlan=null;s.tumblePlan=null;s.areaPlan=null;s.chargePlan=null;preview=null}return true}if(d.special){useFeat(s,d.special);return true}if(d.drink){if(drink(s,s.active))payAction();return true}if(d.skill){useSkill(s,d.skill);return true}if(d.strike&&reachOK(s)){swing(s,s.active);payAction();return true}
 if(d.raise&&!s.raised[s.active]&&shieldUsable(s,s.active)){s.raised[s.active]=true;payAction();return true}
 if(d.cell!==undefined){let i=Number(d.cell);if(moves().has(i)){preview=i;s.hazardTarget=-1;s.forcePlan=null;s.tumblePlan=null;s.areaPlan=null}}
 else if(d.step&&stepOK(s,preview)){const i=s.active,from=s.pos[i];revealHero(s,i);s.pos[i]=preview;enterHazards(s,'hero',i,from);kit(s);note(s,name(run.picks[i])+' Steps without provoking movement reactions.');flankNote(s,s.active);payAction()}
 else if(d.stride){const m=moves().get(preview);if(m){heroStride(s,m);payAction()}}
 else if(d.lowerstandard){
  const e=s.enemies.find(foe=>foe.warStandard);
  if(canLowerStandard(s,e)){
   e.warStandard='lowered';
   if(e.bossIntent?.kind==='volley')cancelBossIntent(s,e,'war standard lowered');
   note(s,name(run.picks[s.active])+' lowers the war standard. Volleys end for this fight.');
   payAction();
  }
 }
 else if(d.end){preview=null;advance();enemyTurn()}return true}
function bestiaryPanel(){return '<details><summary>General bestiary · '+generalBestiary.filter(x=>x.playable).length+' of '+generalBestiary.length+' playable</summary><ul>'+generalBestiary.map(x=>'<li><b>'+x.name+'</b> · '+x.role+' · '+x.ability+(x.playable?'':' (planned)')+'</li>').join('')+'</ul><p class="legend">Environment pools are planned separately; current floor choices use the original three environments. Seeded general slots preserve room difficulty and boss milestones.</p></details>'+(run.floor===0?'<details><summary>Crypt bestiary · 9 themed types</summary><ul>'+environmentBestiary.crypt.map(id=>'<li><b>'+monsterTypes[id].label+'</b> · '+monsterTypes[id].info+'</li>').join('')+'</ul><p class="legend">Budgeted themed encounters vary in size and creature levels. General creatures appear in rooms 4, 6 and 9; potential reinforcements are reserved in the budget.</p></details>':'')}
function render(){if(run.battle){const s=run.battle;app.innerHTML=field()+((!s.hp.some(Boolean)||tenthRoom()&&won(s))?journalPanel():'');return}const n=run.picks.length;let heading,body;if(n<3){heading='Choose hero '+(n+1)+' of 3';body=dealDraft(run.seed)[n].map(heroCard).join('')}else if(run.floor===null){heading='Choose the first floor';body=floors.map(([title,desc],i)=>'<article class="card"><h3>'+title+'</h3><p>'+desc+'</p><footer><button data-floor="'+i+'">Choose '+title+'</button></footer></article>').join('')}else{heading=floors[run.floor][0];body='<article class="card"><h3>Expedition assembled</h3><p>Your party and starting environment are selected.</p><button data-enter="1">Enter room 1</button></article>'}
app.innerHTML='<header><h1>Expedition draft</h1><small>'+BUILD_ID+' &middot; Seed '+run.seed+'</small></header><b>Party</b><ul>'+Array.from({length:3},(_,i)=>'<li>'+(run.picks[i]?name(run.picks[i]):'Open slot')+'</li>').join('')+'</ul><h2 id="stage" tabindex="-1">'+heading+'</h2><section class="grid">'+body+'</section>'+bestiaryPanel()+journalPanel()+(run.floor!==null?'<div class="actions"><button data-reset="same">Replay seed</button><button data-reset="new">New draft</button></div>':'')}
function readBoardSquare(square){
 const board=square.closest('.combat-board');
 const old=board.querySelector('.sq[aria-current="true"]');
 if(old){old.removeAttribute('aria-current');old.tabIndex=-1}
 square.setAttribute('aria-current','true');
 square.tabIndex=0;
 board.querySelector('#tile-readout').textContent=square.getAttribute('aria-label');
}
function toggleTileReading(toggle){
 const board=toggle.closest('.combat-board'),reading=toggle.getAttribute('aria-pressed')==='false';
 toggle.setAttribute('aria-pressed',String(reading));
 toggle.textContent=reading?'Finish reading tiles':'Read tiles';
 const readout=board.querySelector('#tile-readout');
 readout.hidden=!reading;
 for(const square of board.querySelectorAll('.sq')){
  if(reading){
   if(square.disabled)square.dataset.readOnlyTile='1';
   square.disabled=false;
   square.tabIndex=-1;
  }else{
   square.disabled=square.hasAttribute('data-read-only-tile');
   square.removeAttribute('data-read-only-tile');
   square.removeAttribute('tabindex');
   square.removeAttribute('aria-current');
  }
 }
 if(reading){
  const current=board.querySelector('.sq.current');
  readBoardSquare(current);
  readout.textContent+=' · Tap a tile or use the arrow keys to inspect.';
  if(toggle.matches(':focus-visible'))current.focus();
 }
}
app.addEventListener('keydown',e=>{
 if(e.key==='Escape'){
  const toggle=app.querySelector('[data-readtiles][aria-pressed="true"]');
  if(toggle){e.preventDefault();toggleTileReading(toggle);toggle.focus()}
  return;
 }
 const square=e.target.closest?.('.sq[aria-current="true"]');
 if(!square)return;
 const i=Number(square.dataset.square),x=i%9;
 const steps={ArrowLeft:x>0?-1:0,ArrowRight:x<8?1:0,ArrowUp:i>=9?-9:0,ArrowDown:i<36?9:0};
 if(!Object.hasOwn(steps,e.key))return;
 e.preventDefault();
 const next=square.closest('.map').querySelector('[data-square="'+(i+steps[e.key])+'"]');
 readBoardSquare(next);
 next.focus();
});
function renderAfterBattleAction(button){
 // Preserve keyboard position and equipment disclosure state across view replacement.
 const disclosures=new Map(Array.from(app.querySelectorAll?.('details[data-disclosure]')||[],
  panel=>[panel.dataset.disclosure,panel.open]));
 const focused=button===document.activeElement;
 const oldHero=button.closest?.('.alpha-advance')?.dataset?.advanceHero;
 const section=button.closest?.('details[data-disclosure]')?.dataset?.disclosure;
 render();
 const panels=Array.from(app.querySelectorAll?.('details[data-disclosure]')||[]);
 for(const panel of panels)if(disclosures.has(panel.dataset.disclosure))panel.open=disclosures.get(panel.dataset.disclosure);
 if(!focused)return;
 const advancement=app.querySelector('.alpha-advance');
 if(oldHero!==undefined&&advancement&&oldHero!==advancement.dataset.advanceHero){
  advancement.querySelector('.adv-progress [aria-pressed="true"]').focus();
  return;
 }
 const keys=Object.keys(button.dataset);
 const same=Array.from(app.querySelectorAll('button:not(:disabled)')).find(candidate=>
  keys.length&&keys.every(key=>candidate.dataset[key]===button.dataset[key])&&!candidate.closest('details:not([open])'));
 if(same){same.focus({preventScroll:true});return}
 let panel=panels.find(element=>element.dataset.disclosure===section);
 while(panel?.parentElement.closest('details:not([open])'))panel=panel.parentElement.closest('details:not([open])');
 const summary=panel?.querySelector(':scope > summary');
 const next=summary||app.querySelector('.alpha-advance [aria-pressed="true"]')||app.querySelector('.reward-offer')||
  app.querySelector('#battle-board')||app.querySelector('header h1');
 next?.focus();
}
app.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.readtiles){toggleTileReading(b);return}
 if(b.dataset.square!==undefined&&b.closest('.combat-board')?.querySelector('[data-readtiles]')?.getAttribute('aria-pressed')==='true'){
  readBoardSquare(b);return
 }
 if(b.dataset.historyexport){journalShowExport();return}if(run.battle){journalRecord();if(b.dataset.retry&&!run.battle.hp.some(Boolean))journalEnsure(true).retries++}feedbackStart(run.battle);if(battleClick(b.dataset)){feedbackFinish(run.battle);persist();renderAfterBattleAction(b);return}if(b.dataset.enter&&run.floor!==null){run.battle=newRoom();journalEnsure(false);enemyTurn();feedbackFinish(run.battle);preview=null;persist();render();return}feedbackCapture=null;const n=run.picks.length;if(n<3&&dealDraft(run.seed)[n].includes(b.dataset.pick))run.picks.push(b.dataset.pick);else if(n===3&&run.floor===null&&['0','1','2'].includes(b.dataset.floor))run.floor=Number(b.dataset.floor);else if(run.floor!==null&&b.dataset.reset)run=b.dataset.reset==='same'?fresh(run.seed,run.encounterVersion??1):fresh(randomSeed());else return;persist();render();document.getElementById('stage')?.focus()});
journalMemory=journalRead();
if(run.battle&&!run.battle.order){run.battle=newRoom();journalEnsure(true);enemyTurn();persist()}else if(run.battle){journalEnsure(true);kit(run.battle);if(run.battle.active>=3)enemyTurn();persist()}
render();
