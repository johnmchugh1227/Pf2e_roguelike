// Enemy turns, movement and target selection.
function enemyTurn(){const s=run.battle;kit(s);const saved=s.target;
 while(s.active>=3&&!won(s)&&s.hp.some(h=>h>0)){
 s.target=s.active-3;const e=target(s);e.exposed=false;e.ignoredTaunt=-1;e.reaction=true;e.shieldRaised=false;e.takingCover=false;e.assassinFeint=-1;e.turns=(e.turns||0)+1;note(s,e.name+' turn');if(e.dormant){if(s.pos.some((p,i)=>s.hp[i]>0&&enemyInReach(e,p,1)))awakenMimic(s,e);else{note(s,e.name+' waits in ambush');advance();continue}}
 let actions=3-Math.max(e.slow||0,e.stunned||0),attackCount=0,escapeBlocked=false;if(e.stunned){note(s,e.name+' loses '+e.stunned+' action from Stunned');e.stunned=0}
 if(actions>0&&e.grabbedBy>=0&&e.hp>0){const deg=enemyEscape(s,e,attackCount++);actions--;escapeBlocked=deg===0}
 if(e.prone&&!(e.grabbedBy>=0)&&e.hp>0&&actions>0){enemyStand(s,e);actions--}
 let triedWeapon=false;if(actions>0&&recoverWeapon(s,e)){actions--;triedWeapon=true}
 if(actions>=2&&e.hp>0&&!e.restrained&&enemyTactical(e)&&weaponDropped(e)&&!triedWeapon&&enemyMove(s,e,false,'weapon')){actions--;if(actions>0&&recoverWeapon(s,e)){actions--;triedWeapon=true}}
 const releasingArea=e.areaMark!=null;if(releasingArea){const center=e.areaMark;e.areaMark=null;if(actions>=2&&!e.restrained&&e.hp>0){if(resolveArea(s,'enemy',s.active-3,center,areaSpells.fireBurst,10+e.attack-1)){e.areaCasts--;actions-=2}}else note(s,e.name+' loses concentration on the marked blast.');}
 if(e.boss&&e.charging&&actions>=2&&!e.restrained&&e.hp>0&&(e.bossIntent?.kind==='volley'||e.bossScript||!weaponDropped(e)||(e.warden&&e.bossTurns%4===3))){bossSweep(s,e);actions-=2}
 else {if(e.boss&&e.charging&&e.hp>0){if(e.bossScript||e.bossIntent)cancelBossIntent(s,e,'insufficient actions or restrained');else{e.charging=false;note(s,e.name+' cannot complete its charged attack this turn.')}}
 if(actions>0&&e.hp>0&&e.grabbedBy>=0&&!escapeBlocked){enemyEscape(s,e,attackCount++);actions--}
 if(actions>0&&e.hp>0&&!e.restrained&&e.web&&!e.prone){const t=webTarget(s,e);if(t!==undefined){spinWeb(s,e,t);actions--;attackCount++}}
 if(actions>=2&&e.hp>0&&!e.restrained&&summonSkeleton(s,e))actions-=2;
 if(actions>=2&&e.hp>0&&!e.restrained&&healMonster(s,e))actions-=2;
 if(!releasingArea&&actions>=2&&e.hp>0&&!e.restrained&&e.areaCasts>0&&!e.swarm){actions-=enemyAreaAction(s,e,actions)}
 if(actions>0&&e.hp>0&&!e.restrained&&e.areaMark==null&&enemyMove(s,e))actions--;
 if(actions>=2&&e.hp>0&&!e.restrained&&e.areaMark==null&&chooseEnemyTarget(s,e,attackCount)===undefined&&enemyMove(s,e))actions--;
 if(e.swarm&&e.hp>0)actions-=enemyAreaAction(s,e,actions);
 if(actions>=2&&e.hp>0&&!e.restrained&&!weaponDropped(e)&&e.sweep&&attackCount===0&&giantSweep(s,e)){actions-=2;attackCount+=2}
 if(actions>0&&e.hp>0&&!e.restrained&&e.shieldHP>6){e.shieldRaised=true;actions--;note(s,e.name+' Raises Shield · +2 AC')}
 if(actions>=2&&e.hp>0&&!e.restrained&&e.assassin){const t=chooseEnemyTarget(s,e,attackCount);if(t!==undefined&&!heroOffGuard(s,t,true)){monsterFeint(s,e,t);actions--}}
 for(let strikes=0;actions>0&&strikes<(e.boss||e.flying?1:2)&&e.hp>0&&!e.restrained&&!e.swarm;strikes++){
 let t=chooseEnemyTarget(s,e,attackCount);if(t===undefined&&actions>=2&&e.areaMark==null&&enemyMove(s,e)){actions--;t=chooseEnemyTarget(s,e,attackCount)}if(t===undefined){note(s,e.name+' has no legal Strike target.');break}const shot=attackCount++;actions--;
 const melee=enemyMelee(e)&&enemyInReach(e,s.pos[t]),cover=coverAt(s.pos[t],t),ac=heroAC(s,t,cover,melee);
 for(let i=0;!melee&&i<3&&e.hp>0;i++){const id=run.picks[i];if(['shield','reach'].includes(id)&&s.hp[i]&&s.ready[i]&&enemyInReach(e,s.pos[i],id==='reach'?2:1)){s.ready[i]=false;swing(s,i,true)}}if(!e.hp)break;
 const taunted=tauntPenalty(s,e,[t]);if(e.taunt===t)note(s,e.name+' focuses on the taunting '+name(run.picks[t]));if(melee&&enemyFlank(s,t,e))note(s,e.name+' flanks '+name(run.picks[t])+' · off-guard');
 const pack=melee?packDamage(s,e,t):0,precision=e.assassin&&melee&&heroOffGuard(s,t,true)?2:0;
 const n=strikeRoll(s,e.name+(weaponDropped(e)?' · unarmed':e.damageType==='void'?' · void':e.web||e.type==='centipede'?' · fangs':e.type==='zombie'?' · slam':e.type==='wolf'?' · bite':e.type==='rat'?' · bite':e.guard?(melee?' · melee':' · javelin'):'')+(pack?' · Pack Attack':'')+(precision?' · precision':'')+' → '+name(run.picks[t]),e.attack-penalty(shot,!!e.agile)-(taunted?1:0)-enemyAttackPenalty(e)-weaponAttackPenalty(e),ac,enemyStrikeDie(e,e.die??(melee?8:6)),enemyStrikeFlat(e,e.flat??(melee?2:0))+pack+precision,false,t,melee);
 if(e.assassinFeint===t)e.assassinFeint=-1;
 const oldHP=s.hp[t],critical=s.lastDegree===3,injury=defend(s,t,n,e.damageType||'physical');if(melee&&injury?.damage>0&&s.hp[injury.i]>0){if(e.paralysis)ghoulParalysis(s,injury.i,e);if(e.drainLife)drainLife(s,injury.i,e);if(e.venom)inflictVenom(s,injury.i,e);if(e.bleedCrit&&critical)addPersistent(s,injury.i,'bleed',e.bleedCrit)}
 if(e.hp>0&&e.adhesive&&melee&&injury?.damage>0&&actions>0&&grabHero(s,e,injury.i))actions--;
 if(e.hp>0&&e.knockdown&&melee&&n>0&&s.hp[t]>0&&s.hp[t]<oldHP&&actions>0&&!s.prone[t]&&enemyInReach(e,s.pos[t],1)){actions--;s.prone[t]=true;note(s,e.name+' spends an action to Knockdown '+name(run.picks[t]))}
 }if(actions>0&&e.hp>0&&!e.restrained&&e.areaMark==null){if(e.flying&&enemyMove(s,e,true))actions--;else if(!triedWeapon&&recoverWeapon(s,e)){actions--;triedWeapon=true}else if(enemyKites(e)&&aiThreats(s,e).length&&enemyMove(s,e))actions--;else if(enemyTakeCover(s,e))actions--;else if(chooseEnemyTarget(s,e,attackCount)===undefined&&enemyMove(s,e))actions--}}
 for(const i of heldByEnemy(s,e))if(s.grabbed[i].expires<=e.turns)releaseHeroGrab(s,i,'Grab expires');e.assassinFeint=-1;if(e.boss&&e.hp>0&&!e.restrained){e.bossTurns=(e.bossTurns||0)+1;if(e.bossScript){if(!e.bossIntent&&e.bossTurns%2===1)prepareBossIntent(s,e)}else if(e.warStandard&&e.bossTurns%2===1)prepareWarlordAttack(s,e);else if(e.bossTurns%2===1){e.charging=true;note(s,e.name+' prepares '+(e.warden&&e.bossTurns%4===3?'Grave Pulse':'a sweeping strike')+'. Move out of the threatened area!')}}if(e.frightened)e.frightened--;if(won(s)||!s.hp.some(h=>h>0))break;advance();
 }s.target=saved;retarget(s)}
function aiStep(s,e,m){return enemyTactical(e)&&!e.flying&&!e.incorporeal&&m.cost===1&&m.path.length===1&&terrainExtra(s,m.path[0],e)===0&&fitsEnemy(s,e,m.path[0])}
function weaponInReach(s,e,at=e.pos){return weaponDropped(e)&&!s.pos.includes(e.weaponGround)&&(footprint(e,at).includes(e.weaponGround)||enemyInReach(e,e.weaponGround,1,at))}
function enemyTakeCover(s,e){if(!enemyTactical(e)||e.prone||e.restrained||e.takingCover||!enemyKites(e))return false;
 if(![0,1,2].some(i=>s.hp[i]>0&&run.picks[i]==='mastermind'&&aiCover(s,e,i)===2))return false;e.takingCover=true;note(s,e.name+' Takes Cover · +4 AC from standard cover');return true}
function enemyMove(s,e,retreat=false,goal='fight'){
 if(e.prone||e.grabbedBy>=0||e.dormant||heldByEnemy(s,e).length)return false;const heroes=[0,1,2].filter(i=>s.hp[i]>0);if(!heroes.length)return false;
 if(goal==='weapon'&&(!weaponDropped(e)||s.pos.includes(e.weaponGround)||weaponInReach(s,e)))return false;
 const options=paths(e.pos,e.move||4,0,false,e),smart=enemyTactical(e);let best=null;
 function rating(pos,i){const d=enemyDistance(e,s.pos[i],pos),visible=enemyLOS(e,s.pos[i],pos),melee=enemyInReach(e,s.pos[i],enemyReach(e),pos);
 return (visible?0:12)+(melee?0:Math.max(0,d-enemyReach(e))*3+2)+(e.taunt===i?-5:0)-(smart&&enemyFlank(s,i,e,pos)?3:0)-(smart&&melee&&e.pack&&s.enemies.some(x=>x!==e&&enemyThreatens(x,x.pos,s.pos[i]))?1.5:0)}
 if(goal==='fight'&&!retreat&&!enemyMelee(e)&&!enemyKites(e)&&heroes.some(i=>enemyLOS(e,s.pos[i])))return false;
 const score=pos=>{if(goal==='weapon')return weaponInReach(s,e,pos)?0:4+enemyDistance(e,e.weaponGround,pos)*3;
 if(retreat)return -Math.min(...heroes.map(i=>enemyDistance(e,s.pos[i],pos)));
 if(enemyKites(e)){const near=Math.min(...heroes.map(i=>enemyDistance(e,s.pos[i],pos))),visible=heroes.some(i=>enemyLOS(e,s.pos[i],pos)),threat=heroes.filter(i=>['shield','reach'].includes(run.picks[i])&&enemyInReach(e,s.pos[i],heroReach(i),pos)).length;
 const cover=smart?heroes.reduce((n,i)=>{const c=aiCover(s,e,i,pos);return n+(Number.isFinite(c)?c:0)},0)/heroes.length:0;
 return (visible?0:12)+Math.max(0,3-near)*3+Math.max(0,near-6)*.5+(smart?threat*2-cover*.6:0)}
 return Math.min(...heroes.map(i=>enemyMelee(e)?rating(pos,i):(enemyLOS(e,s.pos[i],pos)?0:12)+enemyDistance(e,s.pos[i],pos)*.2+(e.taunt===i?-1:0)))};
 const base=score(e.pos);
 for(const [dest,m] of options){const step=aiStep(s,e,m),risk=step?0:aiThreats(s,e,[e.pos,...m.path.slice(0,-1)]).length;
 const value=score(dest)+risk*(smart?3:1)+hazardRisk(s,e,m)+m.cost*.05;if(value>=base)continue;if(!best||value<best.value||(value===best.value&&m.cost<best.m.cost))best={m,value,step}}
 if(!best)return false;
 const selected=s.target;let lastLegal=e.pos;e.takingCover=false;
 for(const next of best.m.path){const from=e.pos;
 if(!best.step)for(const i of heroes){const id=run.picks[i];if(e.hp>0&&s.hp[i]>0&&s.ready[i]&&['shield','reach'].includes(id)&&enemyInReach(e,s.pos[i],heroReach(i),from)){s.ready[i]=false;note(s,name(id)+' uses Reactive Strike on moving '+e.name);swing(s,i,true)}}
 if(!e.hp||!fitsEnemy(s,e,next,true))break;e.pos=next;pruneHidden(s);enterHazards(s,'enemy',s.enemies.indexOf(e),from);if(fitsEnemy(s,e,e.pos))lastLegal=e.pos}
 if(e.hp&&!fitsEnemy(s,e,e.pos))e.pos=lastLegal;s.target=selected;note(s,e.name+(best.step?' Steps':e.flying?' Flies':' Strides')+(goal==='weapon'?' toward its dropped weapon.':retreat?' away after attacking.':' toward a better position.')+(best.step?' · avoids movement reactions':''));if(smart&&heroes.some(i=>enemyFlank(s,i,e)))note(s,e.name+' establishes a flank.');return true}
// Tactical enemies evaluate expected attack value; mindless and instinctive creatures choose nearby victims.
function enemyTactical(e){return !e.mindless&&!e.swarm&&!['rat','bat','centipede','spider','ooze','mimic'].includes(e.type)}
function aiCover(s,e,i,pos=e.pos){return Math.min(...footprint(e,pos).map(p=>{const view=sight(s.pos[i],i,p);return view==='Line blocked'?Infinity:view.startsWith('Cover')?2:view.startsWith('Lesser')?1:0}))}
function aiThreats(s,e,path=[e.pos]){return [0,1,2].filter(i=>s.hp[i]>0&&s.ready[i]&&['shield','reach'].includes(run.picks[i])&&path.some(p=>enemyInReach(e,s.pos[i],heroReach(i),p)))}
function aiAttackValue(s,e,i,shot=0){
 const cover=aiCover(s,e,i),melee=enemyMelee(e)&&enemyInReach(e,s.pos[i]);if(!Number.isFinite(cover)||(enemyMeleeOnly(e)&&!melee))return -Infinity;
 const ac=heroAC(s,i,cover,melee),taunted=e.taunt>=0&&s.hp[e.taunt]>0&&e.taunt!==i,mod=e.attack-penalty(shot,!!e.agile)-enemyAttackPenalty(e)-weaponAttackPenalty(e)-(taunted?1:0);
 const die=enemyStrikeDie(e,e.die??(melee?8:6)),flat=enemyStrikeFlat(e,e.flat??(melee?2:0))+(melee?packDamage(s,e,i):0)+(e.assassin&&melee&&heroOffGuard(s,i,true)?2:0);
 const base=(die+1)/2+flat,physical=!e.damageType||['physical','piercing','slashing','bludgeoning'].includes(e.damageType);let expected=0,finish=0;
 for(let d=1;d<=20;d++){const degree=outcome(d,mod,ac);if(degree>=2){const damage=base*(degree===3?2:1);expected+=Math.min(damage,s.hp[i])/20;if(damage>=s.hp[i])finish+=1/20}}
 const guardian=physical?[0,1,2].find(g=>g!==i&&run.picks[g]==='bodyguard'&&s.hp[g]>0&&s.ready[g]&&run.interceptEnabled[g]&&interceptDestination(s,g,i,e)):undefined;
 const redirect=guardian!==undefined&&s.hp[guardian]>base-Math.max(guardianResistance(guardian),charmBonus(guardian,'physical'))?Math.min(expected*.4,2.5):0;
 return expected+finish*3+(e.taunt===i?3.5:0)-(taunted?1.5:0)-redirect-(melee?0:aiThreats(s,e).length*2)
}
function chooseEnemyTarget(s,e,shot=0){
 const targets=[0,1,2].filter(i=>s.hp[i]>0&&Number.isFinite(aiCover(s,e,i))&&(!enemyMeleeOnly(e)||enemyInReach(e,s.pos[i])));
 if(!enemyTactical(e))return targets.sort((a,b)=>(enemyDistance(e,s.pos[a])-(e.taunt===a?4:0))-(enemyDistance(e,s.pos[b])-(e.taunt===b?4:0))||a-b)[0];
 return targets.map(i=>({i,v:aiAttackValue(s,e,i,shot)})).sort((a,b)=>b.v-a.v||a.i-b.i)[0]?.i
}
