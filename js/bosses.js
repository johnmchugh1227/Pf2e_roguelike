// Boss mechanics: Sepulcher Warden, Drowned Warden and Iron Warlord intents, phases and telegraphs.
function updateDrownedPhase(s,e){
 const next=e.hp<=e.max*.35?3:e.hp<=e.max*.7?2:1;
 for(let p=(e.bossPhase||1)+1;p<=next;p++){
 e.bossPhase=p;bossLog(s,'phase',{phase:p,hp:e.hp});
 const cells=Array.from({length:45},(_,i)=>i).filter(i=>rawTile(i)==='.'&&i%9>=2&&i%9<=6&&(Math.floor(i/9)===0||Math.floor(i/9)===4||(p===3&&Math.floor(i/9)===2&&i%9>=4)));
 s.flooded=cells;bossLog(s,'flood',{phase:p,cells:cells.slice()});note(s,e.name+' · Phase '+p+' — '+drownedPhases[p]+' · '+cells.length+' flooded squares (difficult terrain for heroes). Dry lanes remain.');
 }
}
function prepareDrownedIntent(s,e){
 const phase=e.bossPhase||1,count=e.drownedWarnings||0;let kind=phase===1?(count%2?'undertow':'tidal'):phase===2?(count%2?'grasp':'undertow'):'deluge';
 const live=s.pos.filter((p,i)=>s.hp[i]>0),valid=p=>rawTile(p)==='.';
 let center=e.pos,cells;
 if(kind==='tidal')cells=bossCells(e.pos,3,true);
 if(kind==='undertow'){center=live.slice().sort((p,q)=>dist(e.pos,p)-dist(e.pos,q)||p-q)[0]??e.pos;cells=bossCells(center,2).filter(valid)}
 if(kind==='grasp'){const wet=live.filter(p=>(s.flooded||[]).includes(p));if(wet.length){center=wet[0];cells=bossCells(center,1).filter(p=>(s.flooded||[]).includes(p))}else{kind='undertow';center=live[0]??e.pos;cells=bossCells(center,2).filter(valid)}}
 if(kind==='deluge'){const bands=[0,1,2].map(y=>Array.from({length:45},(_,i)=>i).filter(i=>valid(i)&&Math.floor(i/9)>=y&&Math.floor(i/9)<=y+2));cells=bands.sort((a,b)=>live.filter(p=>b.includes(p)).length-live.filter(p=>a.includes(p)).length)[0];center=e.pos}
 cells=cells.filter(valid);e.drownedWarnings=count+1;e.bossIntent={kind,center,cells,origin:e.pos,turn:e.turns};e.charging=true;bossLog(s,'warning',{kind,phase,cells:cells.slice()});note(s,e.name+' prepares '+drownedAttacks[kind].name+' · marked squares resolve on its next turn');
}
function drownedPush(s,e,i,direction,count,origin){
 let steps=0;
 for(let k=0;k<count&&s.hp[i]>0;k++){const from=s.pos[i],[x,y]=xy(from),[a,b]=xy(origin);
 const dx=Math.sign(x-a)*direction,dy=Math.sign(y-b)*direction;const choices=[[dx,dy],[dx,0],[0,dy]].filter(([u,v])=>u||v);
 const dest=choices.map(([u,v])=>[x+u,y+v]).filter(([X,Y])=>X>=0&&X<9&&Y>=0&&Y<5).map(([X,Y])=>Y*9+X).find(p=>rawTile(p)==='.'&&!s.pos.includes(p)&&!s.enemies.some(q=>q.hp>0&&footprint(q).includes(p))&&(direction>0?dist(origin,p)>dist(origin,from):dist(origin,p)<dist(origin,from))&&clear(from,p));
 if(dest===undefined)break;
 if(s.grabbed[i])releaseHeroGrab(s,i,'grab broken by current');const held=holdEnemy(s,i);if(held)releaseGrab(held,s,'grapple broken by current');if(s.webbed[i])s.webbed[i]=null;revealHero(s,i);s.pos[i]=dest;enterHazards(s,'hero',i,from);steps++;
 }
 if(steps){note(s,name(run.picks[i])+' forced '+steps*5+' ft by current · no movement reactions');bossLog(s,'forced_move',{hero:i,steps,direction})}return steps
}
function resolveDrownedIntent(s,e){
 const mark=e.bossIntent,a=drownedAttacks[mark.kind],included=[0,1,2].filter(i=>s.hp[i]>0&&mark.cells.includes(s.pos[i])),pen=included.length?tauntPenalty(s,e,included):0;
 let base=a.flat;for(let k=0;k<a.dice;k++)base+=roll(s,a.die);
 e.charging=false;e.bossIntent=null;bossLog(s,'resolved',{kind:mark.kind,targets:included.slice(),base});note(s,e.name+' unleashes '+a.name+' · '+included.length+' heroes in marked area');
 for(const i of included){if(!e.hp||!s.hp[i])continue;const old=s.hp[i],dc=a.dc-pen,save=a.save,mod=saveModifier(s,{side:'hero',i,pos:s.pos[i]},save,mark.center)+divineGrace(s,i,save,mark.center,true),d=roll(s,20),degree=outcome(d,mod,dc),n=basicDamage(base,degree);note(s,name(run.picks[i])+' '+save+' save · '+(d+mod)+' vs DC '+dc+' · '+n+' bludgeoning');defend(s,i,n,'bludgeoning',true);
 if(degree<2&&s.hp[i]>0){if(a.push)drownedPush(s,e,i,a.push,degree===0?2:1,mark.origin);if(a.grasp&&(s.flooded||[]).includes(s.pos[i])&&!s.webbed[i]){s.webbed[i]={dc,source:'Drowned Grasp'};note(s,name(run.picks[i])+' immobilized by Drowned Grasp · Escape DC '+dc);onRestraint(s,i,e);bossLog(s,'grasp',{hero:i,dc})}}
 bossLog(s,'hero_hit',{kind:mark.kind,hero:i,hpLost:Math.max(0,old-s.hp[i])});
 }return true
}
function bossLog(s,event,detail={}){(s.bossEvents??=[]).push({event,round:s.round,...detail})}
function wardenWard(s,e){return e.bossScript==='sepulcher'&&e.bossPhase===2?2*(s.hazards||[]).filter(z=>z.kind==='wardstone'&&z.active).length:0}
function updateBossPhase(s,e){
 if(e.bossScript==='drowned')return updateDrownedPhase(s,e);
 const next=e.hp<=e.max*.3?3:e.hp<=e.max*.7?2:1;if(next<=(e.bossPhase||1))return;
 for(let p=(e.bossPhase||1)+1;p<=next;p++){e.bossPhase=p;bossLog(s,'phase',{phase:p,hp:e.hp});note(s,e.name+' · Phase '+p+' — '+bossPhases[p]);
 if(p===2){for(const z of s.hazards||[])if(z.kind==='wardstone'&&z.dormant){z.active=true;z.dormant=false}note(s,'Two wardstones awaken. Each absorbs 2 damage from every hit on the Warden. Disable or destroy them!')}
 if(p===3){for(const z of s.hazards||[])if(z.kind==='wardstone'){z.active=false;z.dormant=false}note(s,'The wardstones go dark. The Warden prepares devastating Final Vigil attacks.')}
 }}
function bossCells(center,radius,excludeCenter=false){return Array.from({length:45},(_,p)=>p).filter(p=>rawTile(p)!=='#'&&dist(center,p)<=radius&&(!excludeCenter||p!==center)&&clear(center,p))}
function prepareBossIntent(s,e){
 if(e.bossScript==='drowned')return prepareDrownedIntent(s,e);
 const phase=e.bossPhase||1,kind=phase===1?'sweep':phase===2?'pulse':'judgment',a=bossAttacks[kind];
 let center=e.pos;if(kind==='judgment'){const candidates=s.pos.filter((p,i)=>s.hp[i]>0&&enemyLOS(e,p)&&enemyDistance(e,p)<=8);if(candidates.length)center=candidates.sort((p,q)=>s.pos.filter((x,i)=>s.hp[i]>0&&bossCells(q,a.radius).includes(x)).length-s.pos.filter((x,i)=>s.hp[i]>0&&bossCells(p,a.radius).includes(x)).length||p-q)[0]}
 const cells=bossCells(center,a.radius,kind==='sweep');e.bossIntent={kind,center,cells,origin:e.pos,turn:e.turns};e.charging=true;bossLog(s,'warning',{kind,phase,cells:cells.slice()});note(s,e.name+' prepares '+a.name+' · marked squares resolve on its next turn');
}
function cancelBossIntent(s,e,reason){if(e.bossIntent)bossLog(s,'interrupted',{kind:e.bossIntent.kind,reason});e.bossIntent=null;e.charging=false;note(s,e.name+' cannot complete its charged attack: '+reason)}
function resolveBossIntent(s,e){
 const mark=e.bossIntent;if(!mark)return false;if(e.bossScript==='drowned')return resolveDrownedIntent(s,e);const a=bossAttacks[mark.kind];
 if(mark.kind==='sweep'&&(e.pos!==mark.origin||weaponDropped(e))){cancelBossIntent(s,e,'displaced or disarmed');return false}
 const included=[0,1,2].filter(i=>s.hp[i]>0&&mark.cells.includes(s.pos[i])),pen=included.length?tauntPenalty(s,e,included):0;let base=a.flat||0;
 if(a.save)for(let k=0;k<a.dice;k++)base+=roll(s,a.die);
 e.charging=false;e.bossIntent=null;bossLog(s,'resolved',{kind:mark.kind,targets:included.slice(),base:a.save?base:null});note(s,e.name+' unleashes '+a.name+' · '+included.length+' hero'+(included.length===1?'':'es')+' in marked area');
 for(const i of included){if(!e.hp||!s.hp[i])continue;const old=s.hp[i];if(a.save){const dc=a.dc-pen,mod=saveModifier(s,{side:'hero',i,pos:s.pos[i]},a.save,mark.center)+divineGrace(s,i,a.save,mark.center,true),d=roll(s,20),degree=outcome(d,mod,dc),n=basicDamage(base,degree);note(s,name(run.picks[i])+' '+a.save+' save · '+(d+mod)+' vs DC '+dc+' · '+n+' void');defend(s,i,n,'void',true)}
 else defend(s,i,strikeRoll(s,e.name+' sweep → '+name(run.picks[i]),e.attack-pen-enemyAttackPenalty(e)-weaponAttackPenalty(e),heroAC(s,i,coverAt(s.pos[i],i),true),10,4,false,i,true));
 bossLog(s,'hero_hit',{kind:mark.kind,hero:i,hpLost:Math.max(0,old-s.hp[i])})}return true
}
 // I3
function prepareWarlordAttack(s,e){
 e.charging=true;
 if(e.warStandard==='raised'&&e.bossTurns%4===1){
  const counts=[0,0,0,0,0];
  for(let i=0;i<s.pos.length;i++){
   if(s.hp[i]>0&&clear(warStandardSquare,s.pos[i])&&!hiddenAgainst(s,e,i))counts[xy(s.pos[i])[1]]++;
  }
  const most=Math.max(...counts);
  if(most){
   const rank=counts.indexOf(most),cells=[];
   for(let p=rank*9;p<rank*9+9;p++)if(rawTile(p)==='.'&&clear(warStandardSquare,p))cells.push(p);
   e.bossIntent={kind:'volley',rank,origin:warStandardSquare,cells};
   bossLog(s,'warning',{kind:'volley',rank,cells:cells.slice()});
   note(s,'The war standard signals a volley from I3 into row '+(rank+1)+' on the Warlord’s next turn.');
   return;
  }
 }
 note(s,e.name+' prepares a sweeping strike. Move out of the threatened area!');
}
function resolveWarlordVolley(s,e){
 const mark=e.bossIntent;
 const targets=[0,1,2].filter(i=>s.hp[i]>0&&mark.cells.includes(s.pos[i]));
 const penalty=targets.length?tauntPenalty(s,e,targets):0;
 e.bossIntent=null;
 e.charging=false;
 bossLog(s,'resolved',{kind:'volley',targets:targets.slice()});
 note(s,'Volley from I3 · row '+(mark.rank+1)+' · '+targets.length+' heroes in the marked squares.');
 for(const i of targets){
  if(!e.hp||!s.hp[i]||!mark.cells.includes(s.pos[i]))continue;
  const cover=coverFrom(mark.origin,s.pos[i],i);
  const ac=heroAC(s,i,cover);
  const damage=strikeRoll(s,'Volley from I3 → '+name(run.picks[i]),e.attack-penalty-enemyAttackPenalty(e),ac,10,4,false,i);
  defend(s,i,damage,'piercing');
 }
}
function canLowerStandard(s,e){
 return e?.warStandard==='raised'&&e.hp>0&&s.actions>0&&s.active<3&&s.hp[s.active]>0&&dist(s.pos[s.active],warStandardSquare)<=1;
}
function warStandardPanel(s,e){
 let warning='';
 if(e.bossIntent?.kind==='volley'){
  warning='<p role="status"><strong>Volley from I3 · row '+(e.bossIntent.rank+1)+'</strong><br>Red squares come under fire on the Warlord’s next turn. Leave the row or lower the standard. Pillars block shots. Weapon racks give +2 AC against shots crossing them.</p>';
 }else if(e.charging){
  warning='<p role="status"><strong>Close sweep</strong> · Red squares are in reach on the Warlord’s next turn. Step to avoid a movement reaction.</p>';
 }
 const state=e.warStandard==='raised'?'Raised at I3. Any hero within one square can spend one action to end all volleys.':'Lowered. The Warlord can still sweep.';
 const button=e.warStandard==='raised'?'<button data-lowerstandard="1" '+(canLowerStandard(s,e)?'':'disabled')+'>Lower standard · 1 action</button>':'';
 return '<section class="card"><b>War standard</b><p>'+state+'</p>'+warning+button+'</section>';
}
function bossSweep(s,e){if(e.bossIntent?.kind==='volley')return resolveWarlordVolley(s,e);if(e.bossScript&&e.bossIntent)return resolveBossIntent(s,e);
 if(e.warden&&e.bossTurns%4===3){resolveArea(s,'enemy',s.enemies.indexOf(e),e.pos,areaSpells.gravePulse,10+e.attack-2);e.charging=false;return}
 note(s,e.name+' unleashes the marked sweep!');const included=[0,1,2].filter(i=>s.hp[i]>0&&dist(s.pos[i],e.pos)<=2&&enemyLOS(e,s.pos[i]));const pen=included.length?tauntPenalty(s,e,included):0;
 for(let i=0;i<3&&e.hp>0;i++){if(s.hp[i]<=0||dist(s.pos[i],e.pos)>2||!clear(s.pos[i],e.pos))continue;
 const ac=heroAC(s,i,coverAt(s.pos[i],i),true);
 defend(s,i,strikeRoll(s,e.name+' sweep → '+name(run.picks[i]),e.attack-pen-enemyAttackPenalty(e)-weaponAttackPenalty(e),ac,10,4,false,i,true));
 }e.charging=false
}
function bossWarning(s){const warlord=s.enemies.find(e=>e.warStandard&&e.hp>0);if(warlord)return warStandardPanel(s,warlord);const dw=s.enemies.find(e=>e.bossScript==='drowned'&&e.hp>0);if(dw)return '<section class="card"><b>Phase '+dw.bossPhase+' · '+drownedPhases[dw.bossPhase]+'</b><p class="legend">'+dw.hp+'/'+dw.max+' HP · Phase II at 70%, Phase III at 35%. Blue water squares cost +1 movement; dry routes remain open.</p>'+(dw.bossIntent?'<p role="status" style="color:#ffb7a3"><b>Warning: '+drownedAttacks[dw.bossIntent.kind].name+'!</b> '+drownedAttacks[dw.bossIntent.kind].hint+' Red squares resolve next Warden turn. Reactive Strike is disabled while preparing.</p>':'')+'</section>';const scripted=s.enemies.find(e=>e.bossScript==='sepulcher'&&e.hp>0);if(scripted){const e=scripted,m=e.bossIntent,ward=wardenWard(s,e);return '<section class="card"><b>Phase '+e.bossPhase+' · '+bossPhases[e.bossPhase]+'</b><p class="legend">'+e.hp+'/'+e.max+' HP · Phase II at 70%, Phase III at 30%.'+'</p>'+(ward?'<div class="feedback-ward"><b>WARD ACTIVE · '+ward+' damage absorbed per damaging hit</b><br>Target a wardstone to disable or destroy it.</div>':'')+(m?'<p role="status" style="color:#ffb7a3"><b>Warning: '+bossAttacks[m.kind].name+'!</b> Fixed red squares resolve on the Warden’s next turn. Move out or interrupt it. The Warden cannot use Reactive Strike while preparing this attack.</p>':'')+'</section>'}const e=s.enemies.find(e=>e.boss&&e.hp>0&&e.charging);return e?'<p role="status" style="color:#ffb7a3"><b>Warning: '+(e.warden&&e.bossTurns%4===3?'Grave Pulse!':'sweeping strike!')+'</b> Red-marked squares are threatened on its next turn.</p>':''}
function dangerSquare(s,i){return s.enemies.some(e=>e.hp>0&&((e.boss&&e.charging&&(e.bossScript||e.bossIntent?!!e.bossIntent?.cells.includes(i):e.warden&&e.bossTurns%4===3?areaCells(e.pos,e.pos,areaSpells.gravePulse).includes(i):dist(e.pos,i)<=2&&i!==e.pos&&clear(e.pos,i)))||(e.areaMark!==undefined&&e.areaMark!==null&&areaCells(e.pos,e.areaMark,areaSpells.fireBurst).includes(i))))}
function webTarget(s,e){return [0,1,2].filter(i=>s.hp[i]>0&&!s.webbed[i]&&dist(s.pos[i],e.pos)<=6&&clear(e.pos,s.pos[i])&&!inReach(e.pos,s.pos[i],1)).sort((a,b)=>(e.taunt===b?1:0)-(e.taunt===a?1:0)||dist(e.pos,s.pos[a])-dist(e.pos,s.pos[b]))[0]}
function spinWeb(s,e,t){
 const pen=tauntPenalty(s,e,[t]);
 // A zero-damage ranged Strike uses the existing degree and defensive reaction rules.
 for(let i=0;i<3&&e.hp>0;i++){if(['shield','reach'].includes(run.picks[i])&&s.hp[i]&&s.ready[i]&&heroThreatens(s,i,s.pos[i],e.pos)){s.ready[i]=false;note(s,name(run.picks[i])+' reacts to web attack');swing(s,i,true)}}
 if(!e.hp)return;
 strikeRoll(s,e.name+' Web → '+name(run.picks[t]),e.attack-pen-enemyAttackPenalty(e),heroAC(s,t,coverAt(s.pos[t],t)),1,-1,false,t,false);
 if(s.lastDegree>=2){s.webbed[t]={dc:Math.max(13,10+e.attack-2),source:e.name};note(s,name(run.picks[t])+' immobilized by web · Escape DC '+s.webbed[t].dc);onRestraint(s,t,e)}
}
function escapeWeb(s){const i=s.active,w=s.webbed[i];if(!w)return false;const mod=escapeModifier(i)-penalty(s.attacks++),d=roll(s,20),deg=outcome(d,mod,w.dc);note(s,name(run.picks[i])+' Escape web · '+(d+mod)+' vs DC '+w.dc+' · '+['critical failure','failure','success','critical success'][deg]);if(deg>=2)s.webbed[i]=null;else if(deg===0)s.webEscapeBlocked=i;payAction();return true}
