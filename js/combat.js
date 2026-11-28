// Core combat rules: dice, enemies, hazards, strikes, degrees of success, conditions, reactions, movement and line of sight.
function roll(s,faces){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return 1+Math.floor(s.rng/4294967296*faces)}
function enemySquare(){return target().pos}
function note(s,msg){s.log.unshift(msg);journalNote(s,msg);feedbackObserve(s,msg)}
function initEnemies(s){if(!Array.isArray(s.enemies)){s.enemies=enemySpecs().map(e=>({...e,hp:e.max,known:[0,0,0],taunt:-1,frightened:0,exposed:false,studied:false}));if(!sixthRoom()&&Number.isFinite(s.foe)){Object.assign(s.enemies[0],{hp:s.foe,known:s.known||[0,0,0],taunt:s.taunt??-1,frightened:s.frightened||0,exposed:!!s.exposed,studied:!!s.studied})}s.target=0}
 if(tenthRoom()&&run.floor===2){const e=s.enemies.find(foe=>foe.boss&&foe.name==='Iron Warlord');if(e)e.warStandard??='raised'}
 return s.enemies}
function target(s=run.battle){const es=initEnemies(s);return es[s.target]||es[0]}
function foeName(){return target().name}
function won(s){return initEnemies(s).every(e=>e.hp===0)}
function retarget(s){if(target(s).hp<=0){const i=initEnemies(s).findIndex(e=>e.hp>0);if(i>=0)s.target=i}}
function damageEnemy(s,n,type=null,area=false,blockable=true,source=-1,reaction=false){const e=target(s),before=e.hp;if(n>0&&e.dormant)awakenMimic(s,e);if(n>0&&blockable&&!area&&['piercing','slashing','bludgeoning'].includes(type)&&e.shieldRaised&&e.shieldHP>6&&e.reaction!==false){const reduced=Math.max(0,n-3);e.reaction=false;e.shieldHP=Math.max(0,e.shieldHP-reduced);note(s,e.name+' Shield Block · prevented '+Math.min(n,3)+' · shield '+e.shieldHP+'/12');n=reduced;if(e.shieldHP<=6){e.shieldRaised=false;note(s,e.name+' shield breaks')}}if(n>0&&type){const resist=e.resist?.[type]||0,weak=e.weak?.[type]||0;if(resist)note(s,e.name+' resists '+Math.min(n,resist)+' '+type+' damage');if(weak)note(s,e.name+' weakness · +'+weak+' '+type+' damage');n=Math.max(0,n-resist)+weak}if(n>0&&area&&e.areaWeak){n+=e.areaWeak;note(s,e.name+' area weakness · +'+e.areaWeak+' damage')}if(n>0&&e.bossScript==='sepulcher'){const ward=Math.min(n,wardenWard(s,e));if(ward){n-=ward;bossLog(s,'ward_absorb',{amount:ward,source});note(s,'Wardstones absorb '+ward+' damage')}}e.hp=Math.max(0,e.hp-n);if(e.bossScript&&e.hp>0)updateBossPhase(s,e);if(before>0&&!e.hp){note(s,e.name+' defeated.');for(const i of heldByEnemy(s,e))releaseHeroGrab(s,i,'captor defeated')}const dealt=before-e.hp;if(source>=0&&source<3){countMetric(s,source,'damage',dealt);if(reaction)countMetric(s,source,'reactionDamage',dealt)}else metrics(s).unattributedDamage+=dealt;return dealt}
function footprint(e,at=e.pos){const size=e.size||1,[x,y]=xy(at);if(!Number.isInteger(at)||at<0||at>=45||x+size>9||y+size>5)return [];const cells=[];for(let dy=0;dy<size;dy++)for(let dx=0;dx<size;dx++)cells.push((y+dy)*9+x+dx);return cells}
function enemyDistance(e,p,at=e.pos){return Math.min(...footprint(e,at).map(q=>dist(q,p)))}
function enemyLOS(e,p,at=e.pos){return footprint(e,at).some(q=>clear(q,p))}
function enemyInReach(e,p,r=enemyReach(e),at=e.pos){return footprint(e,at).some(q=>inReach(q,p,r)&&clear(q,p))}
function enemyAdjacent(a,b){return footprint(a).some(p=>enemyInReach(b,p,1))}
function enemyAt(i,s=run.battle){return initEnemies(s).findIndex(e=>e.hp>0&&footprint(e).includes(i))}
function makeHazards(s){if(run.floor!==0)return [];const room=run.room||1,plan=cryptHazardPlans[room]||[];
 const occupied=new Set([...s.pos,...s.enemies.flatMap(e=>footprint(e))]),out=[];
 if(room===10&&s.enemies.some(e=>e.bossScript==='sepulcher'))return [13,31].map(pos=>({kind:'wardstone',pos,active:false,dormant:true,identified:true,dc:20,die:6,hp:12}));
 for(let j=0;j<plan.length;j++){const kind=plan[j],choices=Array.from({length:45},(_,p)=>p).filter(p=>rawTile(p)==='.'&&p%9>=2&&p%9<=6&&!occupied.has(p)&&!out.some(z=>z.pos===p)&&(!['altar','rune'].includes(kind)||p%9>=3));if(!choices.length)continue;out.push({kind,pos:seedPick(choices,room,70+j),active:true,dc:13+Math.ceil(room/2),die:room>=7?6:4})}return out}
function hazardAt(s,p){return s.hazards?.find(z=>z.active&&z.pos===p)}
function hamperingAt(s,p){return [0,1,2].some(i=>s.hampering?.[i]&&s.hp[i]>0&&!s.prone?.[i]&&dist(s.pos[i],p)===1&&clear(s.pos[i],p))}
function hamperingCost(s,e,p){return e&&!e.flying&&!e.incorporeal&&footprint(e,p).some(q=>hamperingAt(s,q))?1:0}
function terrainExtra(s,p,mover=null){if(mover?.flying||mover?.incorporeal)return 0;return Math.max((mover?footprint(mover,p):[p]).some(q=>hazardAt(s,q)?.kind==='bones')?1:0,hamperingCost(s,mover,p),!mover||mover.bossScript!=='drowned'?(s.flooded||[]).includes(p)?1:0:0)}
function enterHampering(s){const i=s.active;if(i<0||i>=3||!s.hp[i]||s.actions<1||!hasFeat(i,'Hampering Stance')||s.hampering[i]||s.prone[i])return false;s.hampering[i]=true;note(s,name(run.picks[i])+' enters Hampering Stance · adjacent ground difficult for enemies');payAction();return true}
function hazardLabel(z){return hazardTypes[z.kind].name}
function hazardDamage(s,z,side,i){const e=side==='enemy'?s.enemies[i]:null;if(side==='hero'?!s.hp[i]:!e?.hp)return 0;
 const type=z.kind==='plate'?'piercing':'void';if(type==='void'&&e&&isUndead(e))return 0;
 const kind=z.kind==='plate'?'reflex':'will',pos=e?e.pos:s.pos[i],mod=saveModifier(s,{side,i,pos},kind,z.pos)+(side==='hero'?divineGrace(s,i,kind,z.pos,z.kind!=='plate'):0),d=roll(s,20),deg=outcome(d,mod,z.dc),base=roll(s,z.die)+(z.kind==='altar'?2:0),n=basicDamage(base,deg);
 z.identified=true;note(s,hazardLabel(z)+' → '+(e?e.name:name(run.picks[i]))+' · '+kind+' '+(d+mod)+' vs DC '+z.dc+' · '+['critical failure','failure','success','critical success'][deg]+' · '+n+' '+type);
 if(!n)return 0;if(!e)return directDamage(s,i,n,type);
 const original=s.target;s.target=i;const dealt=damageEnemy(s,n,type,z.kind==='altar',false);s.target=original;return dealt}
function enterHazards(s,side,i,from){const e=side==='enemy'?s.enemies[i]:null;if(e&&(e.flying||e.incorporeal))return;
 const old=new Set(e?footprint(e,from):[from]),cells=e?footprint(e):[s.pos[i]];
 for(const z of s.hazards||[])if(z.active&&z.kind==='plate'&&cells.includes(z.pos)&&!old.has(z.pos)){z.active=false;z.identified=true;note(s, hazardLabel(z)+' springs and is spent');hazardDamage(s,z,side,i)}}
function endHazards(s,side,i){const cells=side==='hero'?[s.pos[i]]:footprint(s.enemies[i]);for(const z of s.hazards||[])if(z.active&&z.kind==='rune'&&cells.includes(z.pos))hazardDamage(s,z,side,i)}
function pulseHazards(s){if(s.round%2!==0)return;for(const z of s.hazards||[])if(z.active&&z.kind==='altar'){note(s,hazardDisplay(z)+' pulses at the end of round '+s.round);for(let i=0;i<3;i++)if(s.hp[i]>0&&dist(z.pos,s.pos[i])<=2&&clear(z.pos,s.pos[i]))hazardDamage(s,z,'hero',i);s.enemies.forEach((e,i)=>{if(e.hp>0&&!isUndead(e)&&footprint(e).some(p=>dist(z.pos,p)<=2&&clear(z.pos,p)))hazardDamage(s,z,'enemy',i)})}}
function hazardSkill(i,z){const id=run.picks[i],k=z.kind==='wardstone'&&['thief','mastermind'].includes(id)?'thievery':hazardTypes[z.kind].skill,trained=k==='thievery'?['thief','mastermind'].includes(id):['healing','harmful','justice','liberation'].includes(id);return {mod:attrValue(i,k==='thievery'?1:4)+(trained?level()+2:0)+charmBonus(i,k)+(z.insight?2:0),trained,k}}
function canDisable(s,z){const i=s.active;return z?.active&&hazardKnown(z)&&hazardTypes[z.kind].skill&&s.hp[i]>0&&s.actions>=2&&dist(s.pos[i],z.pos)<=1&&clear(s.pos[i],z.pos)&&hazardSkill(i,z).trained}
function disableHazard(s,j){const z=s.hazards[j],i=s.active;if(!canDisable(s,z))return false;const {mod,k}=hazardSkill(i,z),d=roll(s,20),deg=outcome(d,mod,z.dc);
 note(s,name(run.picks[i])+' Disable '+hazardLabel(z)+' · '+k+' '+(d+mod)+' vs DC '+z.dc+' · '+['critical failure','failure','success','critical success'][deg]);
 if(deg>=2){z.active=false;z.disabled=true;note(s,hazardLabel(z)+' disabled');if(z.kind==='wardstone')bossLog(s,'wardstone_disabled',{hero:i,pos:z.pos})}else if(deg===0){if(z.kind==='plate')z.active=false;hazardDamage(s,z,'hero',i)}s.actions--;payAction();return true}
function hazardPreview(s,m){const zs=(s.hazards||[]).filter(z=>z.active&&m.path.includes(z.pos));return zs.length?' · Terrain: '+zs.map(z=>hazardDisplay(z)+(!hazardKnown(z)?' (unidentified risk)':z.kind==='plate'?' (triggers on entry)':z.kind==='rune'?' (end-turn damage)':'')).join(', '):''}
function hazardRisk(s,e,m){const cells=new Set(m.path.flatMap(p=>footprint(e,p))),last=footprint(e,m.path.at(-1));return (s.hazards||[]).reduce((n,z)=>n+(z.active&&cells.has(z.pos)&&z.kind==='plate'&&!e.flying&&!e.incorporeal?3:0)+(z.active&&z.kind==='rune'&&!isUndead(e)&&last.includes(z.pos)?2:0)+(z.active&&z.kind==='altar'&&!isUndead(e)&&s.round%2===0&&last.some(p=>dist(z.pos,p)<=2&&clear(z.pos,p))?2:0),0)}
function hazardKnown(z){return z.kind==='bones'||!!z.identified}
function hazardClue(z){return {bones:'Bone pile',plate:'Suspicious stone tile',rune:'Unfamiliar floor markings',altar:'Glowing stone altar',wardstone:'Dormant wardstone'}[z.kind]}
function hazardDisplay(z){return hazardKnown(z)?hazardLabel(z):hazardClue(z)}
function recallHazardSkill(i,z){const id=run.picks[i],mechanical=z.kind==='plate',skill=mechanical?'crafting':'religion';if(id==='mastermind')return mastermindLore(i,'Hazard Lore');const trained=mechanical?['thief','mastermind'].includes(id):['healing','harmful','justice','liberation'].includes(id);return {skill,mod:attrValue(i,mechanical?3:4)+(trained?level()+2:0)+charmBonus(i,skill)}}
function canRecallHazard(s,z){const i=s.active;return !!(z?.active&&!hazardKnown(z)&&i>=0&&i<3&&s.hp[i]>0&&s.actions>=1&&!z.recallTried?.[i]&&dist(s.pos[i],z.pos)<=6&&clear(s.pos[i],z.pos))}
function recallHazard(s,j){const z=s.hazards[j],i=s.active;if(!canRecallHazard(s,z))return false;const {mod,skill}=recallHazardSkill(i,z),d=roll(s,20),degree=outcome(d,mod,z.dc);z.recallTried??=[false,false,false];z.recallTried[i]=true;countMetric(s,i,'hazardRecallAttempts');if(degree>=2)countMetric(s,i,'hazardIdentified');
 note(s,name(run.picks[i])+' Recall Knowledge · '+hazardClue(z)+' · '+skill+' '+(d+mod)+' vs DC '+z.dc+' · '+['critical failure','failure','success','critical success'][degree]);
 if(degree>=2){z.identified=true;note(s,'Identified '+hazardLabel(z)+' · '+hazardTypes[z.kind].info);if(degree===3){z.insight=true;note(s,'Critical success · party gains +2 circumstance bonus to disable this hazard.')}}else note(s,'No reliable information. Another hero may investigate.');
 payAction();return true}
function hazardPanel(s){const zs=s.hazards||[];if(!zs.length)return '';const j=s.hazardTarget,z=zs[j],selected=z&&z.active;
 return '<div class="hazard-panel"><b>Terrain & hazards</b><div class="actions">'+zs.map((z,k)=>{const p=xy(z.pos);return '<button data-hazardtarget="'+k+'" aria-pressed="'+(j===k)+'" '+(!z.active?'disabled':'')+'>'+hazardDisplay(z)+' · '+String.fromCharCode(65+p[0])+(p[1]+1)+(!z.active?(z.destroyed?' · Destroyed':z.disabled?' · Disabled':z.dormant?' · Dormant':' · Spent'):'')+'</button>'}).join('')+'</div>'+(!selected?'<p class="legend">Select a hazard to inspect or Recall Knowledge.</p>':hazardInspection(s,z,j))+'</div>'}
function hazardStructure(z){const m=hazardStructures[z.kind];if(!m)return null;return {ac:m.ac+(z.kind==='bones'?0:Math.max(0,z.dc-15)),max:m.hp+(z.kind==='altar'?Math.max(0,z.dc-15)*2:0),hardness:m.hardness}}
function hazardHP(z){return z.hp??hazardStructure(z)?.max??0}
function hazardAttackMod(s,i){return profile(run.picks[i])[2]-(s.prone[i]?2:0)-penalty(s.attacks,run.picks[i]==='thief')}
function canStrikeHazard(s,z){const i=s.active;return !!(z?.active&&hazardStructure(z)&&i>=0&&i<3&&s.hp[i]>0&&s.actions>0&&!won(s)&&clear(s.pos[i],z.pos)&&(run.picks[i]==='mastermind'?dist(s.pos[i],z.pos)<=6:dist(s.pos[i],z.pos)<=heroReach(i)))}
function strikeHazard(s,j){const z=s.hazards[j],i=s.active;if(!canStrikeHazard(s,z))return false;
 const m=hazardStructure(z),pf=profile(run.picks[i]),mod=hazardAttackMod(s,i),d=roll(s,20),degree=outcome(d,mod,m.ac);
 s.attacks++;let n=0;if(degree>=2){n=run.picks[i]==='mastermind'?0:3+attrDelta(i,atkAttr(run.picks[i]));for(let k=0;k<weaponDice(i);k++)n+=roll(s,pf[3]);n=Math.max(0,n-m.hardness)}
 note(s,name(run.picks[i])+' strikes '+hazardDisplay(z)+' · '+(d+mod)+' vs AC '+m.ac+' · '+['critical miss','miss','hit','critical hit (object immune to extra critical damage)'][degree]+' · '+n+' damage after Hardness '+m.hardness);
 if(degree>=2){z.hp=Math.max(0,hazardHP(z)-n);if(!z.hp){z.active=false;z.destroyed=true;z.identified=true;note(s,hazardLabel(z)+' destroyed · no further effects');if(z.kind==='wardstone')bossLog(s,'wardstone_destroyed',{hero:i,pos:z.pos});s.hazardTarget=-1}}
 payAction();return true}
function hazardStructurePanel(s,z,j){const m=hazardStructure(z);if(!m)return '<p class="legend">Incorporeal magical marking: cannot be destroyed by weapon Strikes.</p>';
 return '<p class="legend">Destructible object'+(hazardKnown(z)?' · AC '+m.ac+' · HP '+hazardHP(z)+'/'+m.max+' · Hardness '+m.hardness:' · Identify to learn defenses')+' · No precision or extra critical damage.</p>'+
 (canStrikeHazard(s,z)?'<button data-strikehazard="'+j+'">Strike hazard · '+(hazardAttackMod(s,s.active)>=0?'+':'')+hazardAttackMod(s,s.active)+' · 1 action</button>':'<p class="legend">Move within weapon reach and line of effect to Strike.</p>')}
function hazardInspection(s,z,j){const m=hazardTypes[z.kind],known=hazardKnown(z),skill=known&&m.skill?hazardSkill(s.active,z):null,r=recallHazardSkill(s.active,z);
 return '<p class="legend"><b>'+hazardDisplay(z)+'</b> · '+(known?m.info:'Unidentified. Recall Knowledge to learn its trigger, effects and countermeasures.')+(known&&m.skill?' · Disable DC '+z.dc:'')+(known&&z.insight?' · Critical insight: +2 to disable':'')+(z.kind==='altar'?' · '+(s.round%2===0?'Energy building this round!':'Quiet for now'):'')+'</p>'+
 (canRecallHazard(s,z)?'<button data-recallhazard="'+j+'">'+iconArt('recall-knowledge')+' Recall Knowledge · '+r.skill+' '+(r.mod>=0?'+':'')+r.mod+' · 1 action</button>':!known?'<p class="legend">'+(z.recallTried?.[s.active]?'This hero has already attempted identification.':'Move within 30 feet and line of effect to investigate.')+'</p>':'')+
 (canDisable(s,z)?'<button data-disablehazard="'+j+'">Disable '+m.name+' · '+skill.k+' '+(skill.mod>=0?'+':'')+skill.mod+' · 2 actions</button>':known&&m.skill?'<p class="legend">Requires an adjacent trained hero and 2 actions ('+(z.kind==='wardstone'?'Religion or Thievery':m.skill)+').</p>':'')+
 hazardStructurePanel(s,z,j)+'<p class="legend">Your enemy target is retained. Tap an enemy to return to its details.</p>'}
function hazardGlow(s,p){return (s.hazards||[]).some(z=>z.active&&z.kind==='altar'&&s.round%2===0&&dist(z.pos,p)<=2&&clear(z.pos,p))}
function rawTile(i){if(!Number.isInteger(i)||i<0||i>=45)return '#';const [x,y]=xy(i),t=layout().rows[y][x];return ['A','B','C'].includes(t)?'.':t}
function fitsEnemy(s,e,at,transit=false){const cells=footprint(e,at);return cells.length===(e.size||1)**2&&cells.every(p=>(rawTile(p)==='.'||(transit&&((e.flying&&rawTile(p)==='c')||(e.incorporeal&&['#','c'].includes(rawTile(p))))))&&!s.pos.includes(p)&&!s.enemies.some(x=>x!==e&&x.hp>0&&footprint(x).includes(p)))}
function applyTaunt(s,i){const e=target(s);for(const x of s.enemies)if(x.taunt===i)x.taunt=-1;e.taunt=i;note(s,name(run.picks[i])+' taunts '+e.name+' until the Guardian’s next turn. Hostile attacks and area DCs excluding the Guardian suffer −1 and expose the enemy.')}
function tauntPenalty(s,e,targets){if(e.taunt<0||!s.hp[e.taunt]||targets.includes(e.taunt))return 0;e.exposed=true;e.ignoredTaunt=e.taunt;note(s,e.name+' ignores Taunt · −1 attack/DC · off-guard');return 1}
function reactiveEnemy(e){return !(e.bossScript&&e.bossIntent)&&!e.noReaction&&!!(e.reactive||e.boss||(e.formation&&e.guard||['Iron guard','Vanguard','Reliquary defender'].includes(e.name)))}
function enemyWeapon(e){if(e.weapon!==undefined)return e.weapon;const names={archer:'bow',shieldbearer:'sword',spearman:'spear',assassin:'dagger',ogre:'greataxe',skeletalChampion:'sword',skeletalGiant:'maul',cryptWarden:'greatsword'};
 if(e.type==='skeleton'||e.type==='hobgoblin')return e.guard?'sword':'bow';if(e.type)return names[e.type]||null;return e.boss?'greatsword':e.guard?'weapon':'bow'}
function weaponDropped(e){return Number.isInteger(e.weaponGround)}
function enemyMelee(e){return weaponDropped(e)||e.guard}
function enemyMeleeOnly(e){return weaponDropped(e)||e.meleeOnly}
function enemyKites(e){return !weaponDropped(e)&&e.rangedKite}
function weaponAttackPenalty(e){return enemyWeapon(e)&&(weaponDropped(e)||e.looseGrip)?2:0}
function enemyStrikeDie(e,d){return weaponDropped(e)?4:d}
function enemyStrikeFlat(e,n){return weaponDropped(e)?1:n}
function enemyReach(e){return weaponDropped(e)?1:e.reach??(e.guard?2:1)}
function disarmBonus(e){return e.looseGrip?2:0}
function canDisarm(s,e=target(s)){const i=s.active,id=run.picks[i];return i>=0&&i<3&&s.hp[i]>0&&s.actions>0&&!!enemyWeapon(e)&&e.hp>0&&!weaponDropped(e)&&!e.noManeuver&&(e.size||1)<=2&&['shield','reach','justice','liberation','bodyguard','thief'].includes(id)&&!holdEnemy(s,i)&&enemyInReach(e,s.pos[i],forceReach(i))}
function resolveDisarm(s,e,i,degree){const w=enemyWeapon(e);if(degree===3){e.weaponGround=e.pos;e.looseGrip=false;note(s,e.name+' drops its '+w+' · unarmed until recovered');if(e.charging&&e.bossIntent?.kind!=='volley'&&!(e.warden&&e.bossTurns%4===3)){e.charging=false;note(s,e.name+' loses its weapon sweep')}}
 else if(degree===2){e.looseGrip=true;note(s,e.name+' loose grip · −2 weapon attacks, +2 follow-up Disarm until regripped')}
 else if(degree===0){s.disarmOffGuard[i]=true;note(s,name(run.picks[i])+' loses balance · off-guard until next turn')}}
function droppedWeapons(s,p){return s.enemies.filter(e=>e.hp>0&&e.weaponGround===p)}
function recoverWeapon(s,e){if(!e.hp||e.restrained||(!e.looseGrip&&!weaponDropped(e)))return false;
 const dropped=weaponDropped(e),p=e.weaponGround;if(dropped&&(!(footprint(e).includes(p)||enemyInReach(e,p,1))||s.pos.includes(p)))return false;
 const w=enemyWeapon(e);note(s,e.name+' spends an action to '+(dropped?'retrieve its ':'regrip its ')+w+' · manipulate');
 const original=s.target;s.target=s.enemies.indexOf(e);let disrupted=false;
 for(let i=0;i<3&&e.hp>0;i++){if(!s.hp[i]||!s.ready[i]||!['shield','reach'].includes(run.picks[i])||!enemyInReach(e,s.pos[i],heroReach(i)))continue;s.ready[i]=false;note(s,name(run.picks[i])+' Reactive Strike on weapon Interact');swing(s,i,true);if(s.lastDegree===3)disrupted=true}
 s.target=original;if(!e.hp)return true;if(disrupted){note(s,e.name+' weapon Interact disrupted');return true}
 e.looseGrip=false;delete e.weaponGround;note(s,e.name+' has its '+w+' ready');return true}
function enemyPanel(s){return '<div class="actions">'+initEnemies(s).map((e,i)=>'<button data-target="'+i+'" aria-pressed="'+(s.target===i)+'" '+(e.hp?'':'disabled')+'>'+e.name+(Number.isInteger(e.creatureLevel)?' · Lv '+e.creatureLevel:'')+' · '+e.hp+'/'+e.max+' HP'+(e.frightened?' · Frightened '+e.frightened:'')+(e.prone?' · Prone':'')+(focusWardActive(s,e.focusACPenalty)?' · Lay on Hands −2 AC':'')+(e.takingCover?' · Taking Cover':'')+persistentSummary(e)+(weaponDropped(e)?' · Unarmed (weapon at '+String.fromCharCode(65+xy(e.weaponGround)[0])+(xy(e.weaponGround)[1]+1)+')':e.looseGrip?' · Loose grip (−2 weapon attacks)':'')+(e.slow?' · Slowed '+e.slow:'')+(e.stunned?' · Stunned '+e.stunned:'')+(e.size>1?' · Large '+e.size+'×'+e.size:'')+(e.flying?' · Flying':'')+(e.dormant?' · Dormant':'')+(heldByEnemy(s,e).length?' · Holding '+heldByEnemy(s,e).map(i=>name(run.picks[i])).join(', '):'')+(e.shieldHP!==undefined?' · Shield '+e.shieldHP+'/12'+(e.shieldRaised?' raised':e.shieldHP<=6?' broken':''):'')+(e.summons!==undefined?' · Raise dead '+e.summons+' left':'')+(e.healCasts!==undefined?' · Heal '+e.healCasts+' left':'')+(e.areaCasts!==undefined?' · Fire burst '+e.areaCasts+' left':'')+(e.areaMark!=null?' · Preparing blast':'')+(formationBonus(s,e)?' · Formation +1':'')+(e.grabbedBy>=0?' · '+(e.restrained?'Restrained':'Grabbed')+' by '+name(run.picks[e.grabbedBy]):'')+(e.taunt>=0?' · Taunted by '+name(run.picks[e.taunt]):'')+(e.exposed?' · Off-guard':'')+(e.blockOffGuard?.some(Boolean)?' · Aggressive Block: off-guard':'')+(e.tumbled?.some(Boolean)?' · Tumble Behind: off-guard to '+e.tumbled.map((v,i)=>v?name(run.picks[i]):'').filter(Boolean).join(', '):'')+(e.hidden?.some((_,t)=>hiddenAgainst(s,e,t))?' · Hidden attacker: '+run.picks.map((id,t)=>hiddenAgainst(s,e,t)?name(id):null).filter(Boolean).join(', '):'')+(e.openings?.some((_,t)=>openingMark(s,e,t))?' · Opening for '+run.picks.map((id,t)=>openingMark(s,e,t)?name(id):null).filter(Boolean).join(', '):'')+(e.feints?.some(Boolean)?' · Feinted: '+e.feints.map((x,j)=>x?name(run.picks[j])+(x.single?' (next strike)':' (through next turn)'):'').filter(Boolean).join(', '):'')+(e.feintBackfire?.some(Boolean)?' · Sees through '+e.feintBackfire.map((x,j)=>x?name(run.picks[j]):'').filter(Boolean).join(', '):'')+(reactiveEnemy(e)?' · Reactive Strike '+(e.reaction===false?'spent':'ready'):'')+'</button>').join('')+'</div>'}
function newRoom(){const s={pos:[9,18,27],rng:((tenthRoom()?0xa24baed5:ninthRoom()?0x94d049bb:eighthRoom()?0x9e3779b1:seventhRoom()?0xd3a2646c:sixthRoom()?0x165667b1:fifthRoom()?0xc2b2ae35:fourthRoom()?0x27d4eb2f:thirdRoom()?0x85ebca6b:secondRoom()?0x9e3779b9:0)^run.seed^Math.imul(run.floor+1,2654435761))>>>0,actions:3,parity:0,round:1,arrived:[],reward:false,hp:run.picks.map(id=>profiles[id][0]),raised:[false,false,false],log:[],attacks:0,cursor:0};
 if((run.room||1)>1){s.hp=run.entry.hp.slice();s.font=run.entry.font.slice();s.focus=run.entry.focus?.slice()??run.picks.map((_,i)=>focusMax(i));s.potions=run.entry.potions;s.shields=run.entry.shields?.slice()}else s.potions=0;
 initEnemies(s);s.hazards=makeHazards(s);s.encounter=encounterInfo(s);const initiative=Array.from({length:3+s.enemies.length},(_,i)=>i).map(i=>({i,total:roll(s,20)+(i>=3?s.enemies[i-3].init:initiativeBonus(i))})).sort((a,b)=>b.total-a.total||b.i-a.i);
 s.telemetryEntry={hp:s.hp.slice(),font:s.font?.slice()??[4,4,4],focus:s.focus?.slice()??run.picks.map((_,i)=>focusMax(i)),shields:s.shields?.slice()??run.picks.map(id=>hasShield(id)?20:null),potions:s.potions,supplies:{...run.supplies},enemies:s.enemies.map(e=>({type:e.type||e.name,name:e.name,hp:e.hp,maxHP:e.max,level:e.creatureLevel??null}))};s.order=initiative.map(e=>e.i);while(s.order[s.cursor]<3&&!s.hp[s.order[s.cursor]])s.cursor++;s.active=s.order[s.cursor];note(s,'Initiative: '+initiative.map(e=>(e.i>=3?s.enemies[e.i-3].name:name(run.picks[e.i]))+' '+e.total).join(' → '));return s}
function outcome(d,bonus,ac){let degree=d+bonus>=ac+10?3:d+bonus>=ac?2:d+bonus<=ac-10?0:1;return Math.min(3,Math.max(0,degree+(d===20?1:d===1?-1:0)))}
function strikeRoll(s,title,bonus,ac,die,flat,sneak=false,defender=-1,melee=false,dice=1){
 if(defender>=0&&hiddenAgainst(s,target(s),defender)){const flatCheck=roll(s,20);note(s,target(s).name+' targets hidden '+name(run.picks[defender])+' · flat check '+flatCheck+' vs DC 11');if(flatCheck<11){s.lastDegree=1;s.lastStrikeD20=null;countMetric(s,defender,'hiddenAttacksAvoided');return 0}}
 const d=roll(s,20);let deg=outcome(d,bonus,ac);
 if(defender>=0&&s.ready[defender]&&deg>=2){
 const f=hasFeat(defender,'Nimble Dodge')?'Nimble Dodge':hasFeat(defender,'Reactive Shield')?'Reactive Shield':null,cover=coverAt(s.pos[defender],defender);
 if(f==='Nimble Dodge'||(f==='Reactive Shield'&&melee&&!s.raised[defender]&&shieldUsable(s,defender))){
 const upgraded=profile(run.picks[defender])[1]+Math.max(2,cover)-(heroOffGuard(s,defender,melee)?2:0);
 if(f==='Reactive Shield'||outcome(d,bonus,upgraded)<deg){s.ready[defender]=false;if(f==='Reactive Shield')s.raised[defender]=true;ac=upgraded;deg=outcome(d,bonus,ac);note(s,name(run.picks[defender])+' · '+f+' reaction');}
 }}
 s.lastDegree=deg;s.lastStrikeD20=d;
 let weapon=0,precision=0;const victim=defender<0?target(s):null;if(sneak&&victim?.precisionImmune){sneak=false;note(s,victim.name+' ignores precision damage')}if(deg>=2){weapon=flat;for(let j=0;j<dice;j++)weapon+=roll(s,die);if(sneak)for(let j=0;j<sneakDice();j++)precision+=roll(s,6)}const multiplier=deg===3&&!victim?.critImmune?2:1;if(deg===3&&victim?.critImmune)note(s,victim.name+' ignores critical damage multiplier');const damage=(weapon+precision)*multiplier;
 note(s,title+' · d20 '+d+' + ('+bonus+') vs AC '+ac+' · '+['critical miss','miss','hit','critical hit'][deg]+(damage?' · '+damage+' damage'+(precision?' ('+(weapon*multiplier)+' weapon + '+(precision*multiplier)+' Sneak Attack)':''):''));return damage}
// Selected-observer Hide adaptation. Actual terrain cover, not intervening creatures.
// Hidden persists through the next turn if unused, and is lost on movement or other actions.
function stealthMod(i){return attrValue(i,1)+(['thief','mastermind'].includes(run.picks[i])?level()+(level()>=3?4:2):0)}
function hideCover(s,e,i,pos=s.pos[i]){if(!e?.hp||!s.hp[i]||!enemyLOS(e,pos))return 0;const views=footprint(e).map(p=>sight(pos,i,p)).filter(v=>v!=='Line blocked');return views.length&&views.every(v=>v.startsWith('Cover'))?2:0}
function hiddenAgainst(s,e,i){const mark=e?.hidden?.[i];return !!(mark&&s.hp[i]>0&&s.pos[i]===mark.pos&&s.heroTurns?.[i]<=mark.turn+1&&hideCover(s,e,i)>=2)}
function revealHero(s,i){for(const e of s.enemies||[])if(e.hidden)e.hidden[i]=null}
function pruneHidden(s){for(const e of s.enemies||[])if(e.hidden)for(let i=0;i<3;i++)if(e.hidden[i]&&!hiddenAgainst(s,e,i))e.hidden[i]=null}
function canHide(s){const i=s.active,e=target(s);return i>=0&&i<3&&s.actions>=1&&s.hp[i]>0&&!won(s)&&hideCover(s,e,i)>=2&&!hiddenAgainst(s,e,i)}
function hideHero(s){if(!canHide(s))return false;const i=s.active,e=target(s),bonus=stealthMod(i)+hideCover(s,e,i),dc=10+(e.perception??e.init),d=roll(s,20),degree=outcome(d,bonus,dc);countMetric(s,i,'hideAttempts');revealHero(s,i);
 note(s,name(run.picks[i])+' Hide → '+e.name+' · Stealth '+(d+bonus)+' vs Perception DC '+dc+' · '+['critical failure','failure','success','critical success'][degree]);
 if(degree>=2){e.hidden??=[null,null,null];e.hidden[i]={pos:s.pos[i],turn:s.heroTurns[i]};countMetric(s,i,'hideSuccesses');note(s,e.name+' loses sight of '+name(run.picks[i])+' · off-guard to next attack; DC 11 flat check to target while hidden')}
 payAction(true);return true}
function coverFrom(origin,i,who,heroAttack=false){const view=sight(i,who,origin,heroAttack);return view==='Line blocked'?Infinity:view.startsWith('Cover')?2:view.startsWith('Lesser')?1:0}
function coverAt(i,who,heroAttack=false){return Math.min(...footprint(target()).map(p=>coverFrom(p,i,who,heroAttack)))}
function reachOK(s,extra=0){const e=target(s),i=s.active,id=run.picks[i];return e.hp>0&&(id==='mastermind'?enemyLOS(e,s.pos[i]):enemyInReach(e,s.pos[i],heroReach(i)+extra))}
function penalty(n,agile=false){return Math.min(2,n)*(agile?4:5)}
function advance(){const s=run.battle;s.forcePlan=null;s.tumblePlan=null;s.areaPlan=null;s.chargePlan=null;kit(s);if(won(s)||!s.hp.some(h=>h>0))return;if(s.active<3&&s.hp[s.active]>0){endHazards(s,'hero',s.active);endAfflictions(s,s.active);s.stiff[s.active]=0;s.paralysisDC[s.active]=0;}else if(s.active>=3&&s.enemies[s.active-3]?.hp>0){const e=s.enemies[s.active-3];endHazards(s,'enemy',s.active-3);endEnemyPersistent(s,e)}if(won(s)||!s.hp.some(Boolean))return;if(!s.hp.some(Boolean))return;if(s.active<3)expireFeint(s,s.active);if(s.active<3)for(const e of s.enemies)if(e.grabbedBy===s.active&&s.heroTurns[s.active]>=e.grabExpires)releaseGrab(e,s,'grapple expires');
 do{s.cursor=(s.cursor+1)%s.order.length;if(!s.cursor){pulseHazards(s);s.round++;if(won(s)||!s.hp.some(Boolean))return}s.active=s.order[s.cursor]}while(s.active<3?!s.hp[s.active]:!s.enemies[s.active-3].hp);
 s.actions=3;s.attacks=0;s.webEscapeBlocked=-1;s.parity=0;s.flourish=false;if(s.active<3){s.hazardTarget=-1;s.disarmOffGuard[s.active]=false;s.heroTurns[s.active]++;pruneHidden(s);s.actions=Math.max(1,3-(s.stiff[s.active]||0));s.raised[s.active]=false;s.ready[s.active]=true;for(const e of s.enemies){e.known[s.active]=Math.max(0,e.known[s.active]-1);if(e.blockOffGuard)e.blockOffGuard[s.active]=false;if(e.taunt===s.active)e.taunt=-1}}preview=null;retarget(s)}
function kit(s){ensureLoot();initFocus(s);s.hampering??=[false,false,false];s.paralysisDC??=[0,0,0];run.causeEnabled??=[true,true,true];run.graceEnabled??=[true,true,true];s.tonics??=[{},{},{}];s.disarmOffGuard??=[false,false,false];s.antidote??=[false,false,false];s.hazards??=[];s.hazardTarget??=-1;s.drained??=[0,0,0];s.stiff??=[0,0,0];s.grabbed??=[null,null,null];s.venom??=[null,null,null];s.persistent??=[{},{},{}];s.webbed??=[null,null,null];s.prone??=[false,false,false];s.heroTurns??=[0,0,0];s.font??=[4,4,4];s.ready??=[true,true,true];s.shields??=run.picks.map(id=>hasShield(id)?20:null);run.blockEnabled??=[true,true,true];run.aggressiveEnabled??=[true,true,true];run.interceptEnabled??=[true,true,true];for(let i=0;i<3;i++)if(!shieldUsable(s,i))s.raised[i]=false;initEnemies(s);for(let i=0;i<3;i++){const g=s.grabbed[i],e=g&&s.enemies[g.source];if(g&&(!s.hp[i]||!e?.hp||e.restrained||!enemyInReach(e,s.pos[i],1)))releaseHeroGrab(s,i,'grip released')}for(const e of s.enemies)if(e.grabbedBy>=0&&(!s.hp[e.grabbedBy]||s.pos[e.grabbedBy]!==e.grabOrigin||!e.hp))releaseGrab(e,s,'grip released')}
function heroMax(s,i){return Math.max(1,profile(run.picks[i])[0]-level()*(s.drained?.[i]||0))}
function fortitudeMod(i){const id=run.picks[i],expert=['shield','reach','bodyguard','harmful','justice','liberation'].includes(id);return level()+(expert?4:2)+attrValue(i,2)+saveItemBonus(i,'fort')-(run.battle?.drained?.[i]||0)}
function medicineTrained(i){return ['healing','harmful'].includes(run.picks[i])}
function medicineMod(i){return (medicineTrained(i)?level()+2:0)+attrValue(i,4)+charmBonus(i,'medicine')}
function ghoulParalysis(s,i,e){const dc=10+e.attack-2,d=roll(s,20),mod=fortitudeMod(i),degree=outcome(d,mod,dc);note(s,e.name+' paralysis save · '+(d+mod)+' vs DC '+dc);if(degree<2){s.stiff[i]=Math.max(s.stiff[i],degree===0?2:1);s.paralysisDC[i]=Math.max(s.paralysisDC[i]||0,dc);note(s,name(run.picks[i])+' partially paralyzed · next turn loses '+s.stiff[i]+' action'+(s.stiff[i]===2?'s and cannot move':''));onRestraint(s,i,e)}}
function drainLife(s,i,e){if(!e.hp||!s.hp[i])return;const heal=Math.min(2,e.max-e.hp);e.hp+=heal;if(heal)note(s,e.name+' Drain Life restores '+heal+' HP');
 const dc=10+e.attack-2,d=roll(s,20),mod=fortitudeMod(i),degree=outcome(d,mod,dc);note(s,name(run.picks[i])+' Drain Life save · '+(d+mod)+' vs DC '+dc);if(degree>=2||s.drained[i]>=2)return;
 const increase=Math.min(2-s.drained[i],degree===0?2:1);s.drained[i]+=increase;s.hp[i]=Math.max(0,Math.min(heroMax(s,i),s.hp[i]-level()*increase));note(s,name(run.picks[i])+' Drained '+s.drained[i]+' · max HP '+heroMax(s,i));if(!s.hp[i])note(s,name(run.picks[i])+' is down.')}
function directDamage(s,i,n,type){const before=s.hp[i],baseType=type.replace(/^persistent /,'').startsWith('poison')?'poison':type.replace(/^persistent /,'');const resist=Math.max(charmBonus(i,baseType),s.tonics?.[i]?.warding&&['fire','void'].includes(baseType)?3:0);if(resist&&n>0){note(s,name(run.picks[i])+' resists '+Math.min(resist,n)+' '+type+' damage');n=Math.max(0,n-resist)}s.hp[i]=Math.max(0,before-n);countMetric(s,i,'damageTaken',before-s.hp[i]);if(before>0&&!s.hp[i])countMetric(s,i,'knockouts');note(s,name(run.picks[i])+' takes '+(before-s.hp[i])+' '+type+' damage');if(before>0&&!s.hp[i])note(s,name(run.picks[i])+' is down.');return before-s.hp[i]}
function venomDamage(s,i){const v=s.venom[i];if(v&&s.hp[i]>0)directDamage(s,i,roll(s,venomProfiles[v.kind].dice[v.stage-1]),'poison (stage '+v.stage+')')}
function inflictVenom(s,i,e){
 if(!e.venom||!s.hp[i])return false;const dc=Math.max(12,10+e.attack-2),mod=fortitudeMod(i)+(s.antidote[i]?Math.max(0,2-saveItemBonus(i,'fort')):0),d=roll(s,20),deg=outcome(d,mod,dc);
 note(s,venomProfiles[e.venom].label+' · '+name(run.picks[i])+' Fortitude '+(d+mod)+' vs DC '+dc+' · '+['critical failure','failure','success','critical success'][deg]);
 if(deg>=2)return false;
 const old=s.venom[i];if(old){old.stage=Math.min(3,old.stage+(deg===0?2:1));if(dc>old.dc){old.dc=dc;old.kind=e.venom}note(s,name(run.picks[i])+' poison worsens to stage '+old.stage);return true}
 s.venom[i]={kind:e.venom,dc,stage:deg===0?2:1,ticks:0,treated:false,saveBonus:0};venomDamage(s,i);return true}
// Shared condition representation, damage rolls and DC 15 flat recovery for both sides.
function persistentAverage(p){return (p.dice??1)*(p.die+1)/2+(p.flat||0)}
function persistentText(p){return p.dice===0?String(p.flat||0):(p.dice??1)+'d'+p.die+(p.flat?'+'+p.flat:'')}
function persistentRoll(s,p){let n=p.flat||0;for(let j=0;j<(p.dice??1);j++)n+=roll(s,p.die);return n}
function applyPersistent(s,bag,label,type,die,flat=0,dice=1){const p={die,flat,dice,dc:15};if(bag[type]&&persistentAverage(bag[type])>=persistentAverage(p))return false;
 bag[type]=p;note(s,label+' gains persistent '+type+' '+persistentText(p));return true}
function addPersistent(s,i,type,die,flat=0){return applyPersistent(s,s.persistent[i],name(run.picks[i]),type,die,flat)}
function persistentImmune(e,type){return !!(e.persistentImmune?.includes(type)||((type==='bleed'||type==='poison')&&isUndead(e))||(type==='bleed'&&e.type==='ooze'))}
function addEnemyPersistent(s,e,type,die,flat=0,dice=1,source=-1){if(!e.hp)return false;if(persistentImmune(e,type)){note(s,e.name+' immune to persistent '+type);return false}
 const applied=applyPersistent(s,e.persistent??={},e.name,type,die,flat,dice);if(applied)e.persistent[type].source=source;return applied}
function tickPersistent(s,bag,label,alive,damage){for(const [type,p] of Object.entries(bag||{})){if(!alive())break;damage(type,persistentRoll(s,p));if(!alive())break;if(!bag[type])continue;const d=roll(s,20);note(s,label+' persistent '+type+' recovery · '+d+' vs '+(p.dc??15));if(d>=(p.dc??15)){delete bag[type];note(s,label+' persistent '+type+' ends')}}}
function endEnemyPersistent(s,e){if(!e.hp||!Object.keys(e.persistent||{}).length)return;const selected=s.target,idx=s.enemies.indexOf(e);if(idx<0)return;s.target=idx;
 tickPersistent(s,e.persistent,e.name,()=>e.hp>0,(type,n)=>{if(persistentImmune(e,type)){delete e.persistent[type];return}note(s,e.name+' takes persistent '+type+' · '+n+' before resistance/weakness');damageEnemy(s,n,type,false,false,e.persistent[type]?.source??-1)});
 s.target=selected;retarget(s)}
function persistentSummary(e){return Object.entries(e.persistent||{}).map(([type,p])=>' · Persistent '+type+' '+persistentText(p)).join('')}
function endAfflictions(s,i){
 const v=s.venom[i];if(v&&s.hp[i]>0){v.ticks++;const d=roll(s,20),mod=fortitudeMod(i)+(s.antidote[i]?Math.max(0,2-saveItemBonus(i,'fort')):0)+(v.saveBonus||0),deg=outcome(d,mod,v.dc);v.treated=false;v.saveBonus=0;
 v.stage=Math.max(0,Math.min(3,v.stage+[2,1,-1,-2][deg]));
 note(s,name(run.picks[i])+' poison save · '+(d+mod)+' vs DC '+v.dc+' · stage '+v.stage);
 if(v.stage===0){s.venom[i]=null;note(s,name(run.picks[i])+' recovers from venom')}else{venomDamage(s,i);if(v.ticks>=venomProfiles[v.kind].maxTicks){s.venom[i]=null;note(s,name(run.picks[i])+' venom duration ends')}}
 }
 tickPersistent(s,s.persistent[i],name(run.picks[i]),()=>s.hp[i]>0,(type,n)=>directDamage(s,i,n,'persistent '+type))
}
function treatPoison(s,t){const i=s.active,v=s.venom[t];if(!v||v.treated||!['healing','harmful'].includes(run.picks[i])||!s.hp[t]||dist(s.pos[i],s.pos[t])>1)return false;
 const d=roll(s,20),mod=medicineMod(i),deg=outcome(d,mod,v.dc);v.treated=true;v.saveBonus=[-2,0,2,4][deg];note(s,name(run.picks[i])+' Treat Poison → '+name(run.picks[t])+' · '+(d+mod)+' vs DC '+v.dc+' · next Fortitude save '+(v.saveBonus>=0?'+':'')+v.saveBonus);payAction();return true}
function aidPersistent(s,t){const i=s.active,types=Object.keys(s.persistent[t]||{});if(s.actions<2||!types.length||!s.hp[t]||dist(s.pos[i],s.pos[t])>1)return false;
 const type=types[0],d=roll(s,20);note(s,name(run.picks[i])+' assists '+name(run.picks[t])+' against persistent '+type+' · flat check '+d+' vs 10');if(d>=10)delete s.persistent[t][type];s.actions--;payAction();return true}
function clearAfflictions(s){for(let i=0;i<3;i++){if(s.venom[i]||Object.keys(s.persistent[i]).length||s.drained[i]||s.stiff[i])note(s,name(run.picks[i])+' room-end recovery clears lingering damage effects');s.venom[i]=null;s.persistent[i]={};s.drained[i]=0;s.stiff[i]=0}}
function heldByEnemy(s,e){return [0,1,2].filter(i=>s.grabbed?.[i]?.source===s.enemies.indexOf(e)&&s.hp[i]>0)}
function releaseHeroGrab(s,i,reason){if(!s.grabbed?.[i])return;s.grabbed[i]=null;note(s,name(run.picks[i])+' · '+reason)}
function grabHero(s,e,i){if(!e.hp||!s.hp[i]||s.grabbed[i]||heldByEnemy(s,e).length||!enemyInReach(e,s.pos[i],1))return false;
 s.grabbed[i]={source:s.enemies.indexOf(e),dc:Math.max(13,10+e.attack),expires:(e.turns||0)+1};note(s,e.name+' uses '+(e.type==='mimic'?'adhesive ':'')+'Grab · '+name(run.picks[i])+' immobilized and off-guard · Escape DC '+s.grabbed[i].dc);onRestraint(s,i,e);return true}
function escapeGrab(s){const i=s.active,g=s.grabbed[i];if(!g||s.webEscapeBlocked===i)return false;const mod=escapeModifier(i)-penalty(s.attacks++),d=roll(s,20),deg=outcome(d,mod,g.dc);note(s,name(run.picks[i])+' Escape grab · '+(d+mod)+' vs DC '+g.dc);if(deg>=2)releaseHeroGrab(s,i,'escapes Grab');else if(deg===0)s.webEscapeBlocked=i;payAction();return true}
function awakenMimic(s,e){if(!e.dormant)return;e.dormant=false;note(s,e.name+' reveals itself!')}
function hasShield(id){return ['shield','harmful','justice','liberation','bodyguard'].includes(id)}
function shieldUsable(s,i){return hasShield(run.picks[i])&&(s.shields?.[i]??20)>10}
function shieldStatus(s,i){const hp=s.shields[i];return hp===0?'Destroyed':hp<=10?'Broken':s.raised[i]?'Raised':'Ready'}
function guardianResistance(i){return run.picks[i]==='bodyguard'?1+Math.floor(level()/2):0}
// Aggressive Block is an additional effect of Shield Block, not a second reaction.
function aggressiveBlock(s,i,e){if(!e?.hp||!hasFeat(i,'Aggressive Block')||run.aggressiveEnabled?.[i]===false||(e.size||1)>1||e.noManeuver||!enemyInReach(e,s.pos[i],1))return false;
 const [x,y]=xy(s.pos[i]),[X,Y]=xy(e.pos),dx=Math.sign(X-x),dy=Math.sign(Y-y),p=forceStep(s,e,e.pos,dx,dy);
 const legal=p!==null&&terrainExtra(s,p,e)===0;
 // Tactical foes weigh staying in reach against being vulnerable to the party.
 // Mindless foes accept displacement; tactical foes accept off-guard if moving loses reach.
 const losesReach=legal&&!enemyInReach(e,s.pos[i],enemyReach(e),p);
 const hazard=legal&&hazardAt(s,p)?.kind==='plate';
 if(legal&&!hazard&&(!enemyTactical(e)||!losesReach)){note(s,name(run.picks[i])+' Aggressive Block · '+e.name+' chooses a 5-ft push');if(forcedEnemyMove(s,e,[p]))return true}
 e.blockOffGuard??=[false,false,false];e.blockOffGuard[i]=true;note(s,name(run.picks[i])+' Aggressive Block · '+e.name+' off-guard until Fighter’s next turn');return true}
function shieldBlock(s,i,n){
 if(n<=0||!s.ready[i]||!s.raised[i]||!shieldUsable(s,i)||!run.blockEnabled[i])return n;
 s.ready[i]=false;const hardness=5+charmBonus(i,'shield'),reduced=Math.max(0,n-hardness);s.shields[i]=Math.max(0,s.shields[i]-reduced);
 note(s,name(run.picks[i])+' Shield Block · prevented '+Math.min(n,hardness)+' damage · shield '+s.shields[i]+'/20 HP');aggressiveBlock(s,i,target(s));
 if(!shieldUsable(s,i)){s.raised[i]=false;note(s,name(run.picks[i])+' shield '+(s.shields[i]===0?'destroyed':'broken')+'!')}
 return reduced}
function hurtHero(s,i,n){const before=s.hp[i],resistance=Math.max(guardianResistance(i),charmBonus(i,'physical')),actual=Math.max(0,n-resistance);
 if(resistance&&n>0)note(s,name(run.picks[i])+' armor resists '+Math.min(n,resistance)+' physical damage');
 s.hp[i]=Math.max(0,s.hp[i]-actual);countMetric(s,i,'damageTaken',before-s.hp[i]);if(before>0&&!s.hp[i])countMetric(s,i,'knockouts');if(actual)note(s,name(run.picks[i])+' takes '+actual+' HP damage');if(!s.hp[i])note(s,name(run.picks[i])+' is down.');return {i,damage:before-s.hp[i]}}
function interceptDestination(s,g,t,e){
 const from=s.pos[g],to=s.pos[t],taunted=e.taunt===g,limit=taunted?3:2;
 if(dist(from,to)>limit)return null;if(dist(from,to)===1&&clear(from,to))return {pos:from,path:[],stride:false};
 if(s.stiff?.[g]===2||s.webbed?.[g]||s.grabbed?.[g]||s.prone?.[g])return null;
 const adj=[...paths(from,taunted?speed(g):1,0,true)].filter(([p,m])=>dist(p,to)===1&&clear(p,to)&&!m.path.some(k=>hazardAt(s,k)?.kind==='plate')&&(m.cost>1||!terrainExtra(s,p)));
 adj.sort((a,b)=>a[1].cost-b[1].cost||a[0]-b[0]);if(!adj.length)return null;return {pos:adj[0][0],path:adj[0][1].path,stride:adj[0][1].cost>1}
}
function tryIntercept(s,t,n){
 const e=target(s);for(let g=0;g<3;g++){if(g===t||run.picks[g]!=='bodyguard'||!s.hp[g]||!s.ready[g]||!run.interceptEnabled[g])continue;
 const m=interceptDestination(s,g,t,e);if(!m)continue;
 if(Math.max(0,n-Math.max(guardianResistance(g),charmBonus(g,'physical')))>=s.hp[g]&&Math.max(0,n-Math.max(guardianResistance(t),charmBonus(t,'physical')))<s.hp[t]){note(s,'Guardian conserves Intercept Attack to avoid being downed.');continue}
 s.ready[g]=false;if(m.path.length)revealHero(s,g);for(const p of m.path){const from=s.pos[g];s.pos[g]=p;enterHazards(s,'hero',g,from)}kit(s);note(s,name(run.picks[g])+' Intercept Attack · '+(m.stride?'Strides':'Steps or holds position')+' to protect '+name(run.picks[t])+' · redirects '+n+' damage');return hurtHero(s,g,n)}
 return false
}
function restoreShield(s,i,full=false){if(!hasShield(run.picks[i]))return 0;const before=s.shields[i]??20;s.shields[i]=full?20:Math.min(20,Math.max(11,before+8));s.raised[i]=false;const repaired=s.shields[i]-before;countMetric(s,i,'shieldHPRepaired',repaired);if(repaired>0)note(s,name(run.picks[i])+(full?' shield fully repaired':' shield field repair')+' · '+s.shields[i]+'/20 HP');return repaired}
function repairShields(s){for(let i=0;i<3;i++)if(hasShield(run.picks[i]))restoreShield(s,i)}
function canRepairRecovery(s,i){return recoveryOpen(s)&&!recoveryState(s).used&&Number.isInteger(i)&&i>=0&&i<3&&s.hp[i]>0&&hasShield(run.picks[i])&&s.shields[i]<20}
function repairRecovery(s,i){if(!canRepairRecovery(s,i))return false;const r=recoveryState(s);r.used=true;restoreShield(s,i,true);countMetric(s,i,'repairActions');r.result=name(run.picks[i])+' repairs shield to 20 HP';note(s,r.result);return true}
function dist(p,q){let [x,y]=xy(p),[a,b]=xy(q),dx=Math.abs(x-a),dy=Math.abs(y-b);return Math.max(dx,dy)+Math.floor(Math.min(dx,dy)/2)}
function clear(p,q){return sight(q,-1,p)!=='Line blocked'}
// One-square combatants: the center-to-center line must cross opposite sides or corners.
function inReach(a,b,r){const [x,y]=xy(a),[u,v]=xy(b);return a!==b&&(r<=2?Math.max(Math.abs(x-u),Math.abs(y-v))<=r:dist(a,b)<=r)}
function oppositeAcross(a,b,t,size=1){
 if(a===b||a===t||b===t)return false;
 const [cx,cy]=xy(t),[ax,ay]=xy(a),[bx,by]=xy(b),x=ax-cx-(size-1)/2,y=ay-cy-(size-1)/2,dx=bx-ax,dy=by-ay,eps=1e-8,half=size/2;
 function crosses(p,q,dp,dq){if(!dp)return false;const l=(-half-p)/dp,r=(half-p)/dp;if(l<0||l>1||r<0||r>1)return false;
 const u=q+dq*l,v=q+dq*r;
 return (Math.abs(u)<half-eps&&Math.abs(v)<half-eps)||(Math.abs(Math.abs(u)-half)<eps&&Math.abs(u+v)<eps)}
 return crosses(x,y,dx,dy)||crosses(y,x,dy,dx)}
function heroReach(i){return run.picks[i]==='mastermind'?0:run.picks[i]==='reach'?2:1}
function heroThreatens(s,i,pos,t){return s.hp[i]>0&&heroReach(i)>0&&inReach(pos,t,heroReach(i))&&clear(pos,t)}
function flankPartners(s,i,e=target(s),pos=s.pos[i]){
 if(!e.hp||!s.hp[i]||!heroReach(i)||!enemyInReach(e,pos,heroReach(i)))return [];
 return [0,1,2].filter(j=>j!==i&&s.hp[j]>0&&heroReach(j)>0&&enemyInReach(e,s.pos[j],heroReach(j))&&oppositeAcross(pos,s.pos[j],e.pos,e.size||1))}
function flank(s,i){return flankPartners(s,i).length>0}
function enemyThreatens(e,pos,t){return e.hp>0&&!e.noThreat&&enemyMelee(e)&&!e.restrained&&enemyInReach(e,t,enemyReach(e),pos)}
function enemyFlank(s,i,e=target(s),pos=e.pos,heroPos=s.pos[i]){
 return enemyThreatens(e,pos,heroPos)&&s.enemies.some(other=>other!==e&&enemyThreatens(other,other.pos,heroPos)&&footprint(e,pos).some(a=>footprint(other).some(b=>oppositeAcross(a,b,heroPos))))}
function flankedHero(s,i,pos=s.pos[i]){return s.hp[i]>0&&s.enemies.some(e=>enemyFlank(s,i,e,e.pos,pos))}
function flankPreview(s,pos){const partners=flankPartners(s,s.active,target(s),pos),risk=flankedHero(s,s.active,pos);
 return (partners.length?' · Flanking with '+partners.map(i=>name(run.picks[i])).join(', ')+' (target off-guard)':'')+(risk?' · Warning: enemies flank this square':'')}
function flankNote(s,i){const es=s.enemies.filter(e=>flankPartners(s,i,e).length);if(es.length)note(s,name(run.picks[i])+' flanks '+es.map(e=>e.name).join(', '))}
function off(s,i){return hiddenAgainst(s,target(s),i)|| !!target(s).tumbled?.[i]||(run.picks[i]!=='mastermind'&&!!target(s).feints?.[i])||target(s).prone||target(s).grabbedBy>=0||target(s).known[i]>0||target(s).exposed||target(s).blockOffGuard?.some(Boolean)||flank(s,i)||(hasFeat(i,'Dread Striker')&&target(s).frightened>0)}
function heroOffGuard(s,i,melee){return !!(s.disarmOffGuard?.[i]||s.stiff?.[i]>0||s.venom?.[i]?.stage===3||s.grabbed?.[i]||s.prone?.[i]||feintBackfire(s,i,melee)||(melee&&(enemyFlank(s,i)||target(s).assassinFeint===i)))}
function heroAC(s,i,cover,melee=false){return profile(run.picks[i])[1]+Math.max(cover,s.raised[i]?2:0)+(focusWardActive(s,s.focusWards?.[i])?2:0)-(heroOffGuard(s,i,melee)?2:0)}
function enemyAttackPenalty(e){return (e.frightened||0)+(e.prone?2:0)}
function feintBackfire(s,i,melee){return melee&&!!target(s).feintBackfire?.[i]}
function applyFeint(s,e,i,degree){
 e.feints??=[null,null,null];e.feintBackfire??=[null,null,null];
 if(degree===3){e.feints[i]={single:false,expires:s.heroTurns[i]+1};note(s,e.name+' is off-guard against '+name(run.picks[i])+' melee attacks through their next turn')}
 else if(degree===2){if(!e.feints[i]||e.feints[i].single)e.feints[i]={single:true,expires:s.heroTurns[i]};note(s,e.name+' is off-guard against '+name(run.picks[i])+' next melee attack this turn')}
 else if(degree===0){e.feintBackfire[i]={expires:s.heroTurns[i]+1};note(s,'Feint backfires · '+name(run.picks[i])+' is off-guard against '+e.name+' melee attacks through next turn')}
}
function consumeFeint(e,i){if(e.tumbled?.[i])e.tumbled[i]=false;if(run.picks[i]!=='mastermind'&&e.feints?.[i]?.single)e.feints[i]=null}
function expireFeint(s,i){for(const e of s.enemies){if(e.tumbled?.[i])e.tumbled[i]=false;if(e.feints?.[i]&&s.heroTurns[i]>=e.feints[i].expires)e.feints[i]=null;if(e.feintBackfire?.[i]&&s.heroTurns[i]>=e.feintBackfire[i].expires)e.feintBackfire[i]=null}}
function targetAC(s,i){const e=target(s),cover=coverAt(s.pos[i],i,true),greater=e.takingCover&&cover===2&&run.picks[i]==='mastermind'?4:cover;return e.ac+enemyShieldBonus(e)+formationBonus(s,e)+greater-(off(s,i)?2:0)-Math.max(e.frightened||0,focusWardActive(s,e.focusACPenalty)?2:0)}
function weaponFlatBonus(s,i,e,reaction=false){const w=weaponFor(i);return (reaction?(w.react||0):0)+(e.hp<=e.max/2?(w.wounded||0):0)+(w.flanked&&flank(s,i)?w.flanked:0)}
function weaponRider(s,i,e,degree){const w=weaponFor(i);if(!e.hp||degree<2)return 0;let dealt=0;
 if(w.rider&&!(w.vs==='undead'&&!isUndead(e))){const n=w.amount*(degree===3&&!e.critImmune?2:1);note(s,w.name+' · '+n+' '+w.rider+' damage');dealt=damageEnemy(s,n,w.rider,false,false,i)}
 const p=w.persistentHit;if(e.hp&&p&&(!p.critOnly||degree===3)){const dice=!p.critOnly&&degree===3&&!e.critImmune?2:1;addEnemyPersistent(s,e,p.type,p.die,0,dice,i)}
 return dealt}
function bombImpact(s,i,e){return footprint(e).filter(p=>dist(s.pos[i],p)<=4&&clear(s.pos[i],p)).sort((p,q)=>dist(s.pos[i],p)-dist(s.pos[i],q)||p-q)[0]}
function bombCells(s,i,e){const p=bombImpact(s,i,e);if(p===undefined)return [];return areaCells(p,p,{shape:'emanation',radius:1})}
function splashTargets(s,i,e){const cells=new Set(bombCells(s,i,e)),ts=[];for(let j=0;j<3;j++)if(s.hp[j]>0&&cells.has(s.pos[j]))ts.push({side:'hero',i:j,pos:s.pos[j]});s.enemies.forEach((x,j)=>{if(x.hp>0&&footprint(x).some(p=>cells.has(p)))ts.push({side:'enemy',i:j,pos:x.pos})});return ts}
function throwBomb(s,i,key){const m=lootItems[key],b=m.bomb,e=target(s),original=s.target,ts=splashTargets(s,i,e),mod=level()+2+attrValue(i,1)-(s.prone[i]?2:0)-penalty(s.attacks++);
 const n=strikeRoll(s,name(run.picks[i])+' throws '+m.name+' → '+e.name,mod,targetAC(s,i),b.die,0),degree=s.lastDegree;
 if(degree>0){const splash=b.splash||0;note(s,m.name+' · '+splash+' splash '+b.type+' (including allies; no save)');
 for(const t of ts){if(t.side==='hero'){if(s.hp[t.i]>0)directDamage(s,t.i,splash,b.type)}else{s.target=t.i;const victim=s.enemies[t.i];if(victim.hp>0){damageEnemy(s,splash+(t.i===original?n:0),b.type,true,false,i);if(t.i===original&&degree>=2&&victim.hp)addEnemyPersistent(s,victim,b.type,b.persistentDie,0,degree===3&&!victim.critImmune?2:1,i)}}}}
 s.target=original;retarget(s);run.supplies[key]--;countMetric(s,i,'consumables');payAction();return true}
function areaSupplyDC(i){return 10+level()+2+Math.max(attrValue(i,3),attrValue(i,4),attrValue(i,5))}
function areaPlan(s){const p=s.areaPlan;if(!p||p.actor!==s.active||!supplyUsable(s,p.actor,p.key,true))return null;if(lootItems[p.key].bomb&&p.target!==s.target)return null;return p}
function areaChoices(s,p){const a=areaSpells[lootItems[p.key].area];return a?Array.from({length:45},(_,i)=>i).filter(i=>validAreaOrigin(s.pos[p.actor],i,a)):[]}
function startArea(s,i,key){if(!supplyUsable(s,i,key,true))return false;s.chargePlan=null;s.forcePlan=null;s.tumblePlan=null;s.hazardTarget=-1;preview=null;s.areaPlan={actor:i,key,center:null,target:s.target};return true}
function areaPreview(s,p){if(!p)return {cells:[],targets:[]};const m=lootItems[p.key],i=p.actor;if(m.bomb)return {cells:bombCells(s,i,target(s)),targets:splashTargets(s,i,target(s))};const a=areaSpells[m.area];return {cells:areaCells(s.pos[i],p.center,a),targets:areaTargets(s,'hero',i,p.center,a)}}
function selectArea(s,pos){const p=areaPlan(s);if(!p||!areaChoices(s,p).includes(pos))return false;p.center=pos;return true}
function confirmArea(s){const p=areaPlan(s);if(!p)return false;const m=lootItems[p.key],i=p.actor;if(m.bomb){s.areaPlan=null;return throwBomb(s,i,p.key)}
 const a=areaSpells[m.area];if(!validAreaOrigin(s.pos[i],p.center,a))return false;s.areaPlan=null;if(!resolveArea(s,'hero',i,p.center,a,areaSupplyDC(i)))return false;run.supplies[p.key]--;countMetric(s,p.actor,'consumables');s.actions-=a.actions-1;payAction();return true}
function areaPanel(s,p,view){if(!p)return '';const m=lootItems[p.key],a=areaSpells[m.area],ts=view.targets,labels=side=>ts.filter(t=>t.side===side).map(t=>side==='hero'?name(run.picks[t.i]):s.enemies[t.i].name).join(', ')||'None';
 return '<section class="card"><b>'+m.name+'</b><p>'+(a?(directionalArea(a)?'Choose an adjacent direction.':'Choose a burst center.')+' · '+a.actions+' actions · basic '+a.save+' DC '+areaSupplyDC(p.actor):'Throw at '+target(s).name+' · 1 action · 1 splash on hit or miss, none on critical miss.')+'</p>'+
 (view.cells.length?'<p>Enemies in area: '+labels('enemy')+'<br>Allies in area: '+labels('hero')+(ts.some(t=>t.side==='hero')?' · FRIENDLY FIRE':'')+'</p><button data-areaconfirm="1">Confirm '+(a?'activation':'throw')+'</button>':'<p>Choose a highlighted aiming square.</p>')+'<button data-areacancel="1">Cancel</button></section>'}
function swing(s,i,reaction=false,extraDie=false){const id=run.picks[i],pf=profile(id),bonus=pf[2]-(s.prone?.[i]?2:0)-(reaction?0:penalty(s.attacks++,id==='thief')),sneak=['thief','mastermind'].includes(id)&&off(s,i);
 countMetric(s,i,'strikes');const e=target(s),hidden=hiddenAgainst(s,e,i),opening=consumeOpening(s,e,i),damage=strikeRoll(s,name(id)+(reaction?' reaction':'')+' → '+foeName()+(sneak?' · Sneak Attack':''),bonus+(opening?1:0),targetAC(s,i),pf[3],strikeBaseFlat(i)+weaponFlatBonus(s,i,e,reaction),sneak,-1,false,weaponDice(i));
 if(opening&&s.lastDegree>outcome(s.lastStrikeD20,bonus,targetAC(s,i)))countMetric(s,opening.source,'openingImprovedOutcomes');if(hidden)countMetric(s,i,'hiddenStrikes');revealHero(s,i);
 let extra=0;if(extraDie&&damage>0){extra=roll(s,pf[3])*(s.lastDegree===3&&!e.critImmune?2:1);note(s,'Proud Nail · '+extra+' extra weapon damage')}
 if(s.lastDegree===3)countMetric(s,i,'criticalHits');if(sneak&&!e.precisionImmune&&s.lastDegree>=2)countMetric(s,i,'sneakHits');consumeFeint(e,i);const dealt=damageEnemy(s,damage+extra,weaponType(id),false,true,i,reaction)+weaponRider(s,i,e,s.lastDegree);if(dealt>0&&s.lastDegree===3&&e.hp>0&&hasFeat(i,'Brutal Beating')){if(e.mindless)note(s,e.name+' is immune to Brutal Beating fear');else{e.frightened=Math.max(e.frightened,1);note(s,'Brutal Beating · '+e.name+' frightened 1')}}}
function championReady(s,i,t,e){return i!==t&&s.hp[i]>0&&s.ready[i]&&run.causeEnabled?.[i]!==false&&['justice','liberation'].includes(run.picks[i])&&enemyDistance(e,s.pos[i])<=3&&dist(s.pos[i],s.pos[t])<=3&&enemyLOS(e,s.pos[i])&&clear(s.pos[i],s.pos[t])}
function reactionSteps(s,i,ignoreTerrain=false){if(!s.hp[i]||s.stiff[i]===2||s.webbed[i]||s.grabbed[i]||s.prone[i])return [];const from=s.pos[i],[x,y]=xy(from);
 return Array.from({length:45},(_,p)=>p).filter(p=>open(p)&&!s.pos.includes(p)&&dist(from,p)===1&&(!terrainExtra(s,p)||ignoreTerrain)&&hazardAt(s,p)?.kind!=='plate'&&clear(from,p)&&(()=>{const [X,Y]=xy(p);return x===X||y===Y||open(y*9+X)&&open(Y*9+x)})())}
function reactionStep(s,i,p,label){const from=s.pos[i];revealHero(s,i);s.pos[i]=p;enterHazards(s,'hero',i,from);kit(s);note(s,name(run.picks[i])+' '+label+' · no movement reactions')}
function escapeModifier(i){return Math.max(skillMod(i,'grapple')-charmBonus(i,'athletics'),attrValue(i,1)+level()+2)+Math.max(charmBonus(i,'athletics'),charmBonus(i,'escape'))}
function liberationEscape(s,t,e){const g=s.grabbed[t],w=s.webbed[t],stiff=s.stiff[t];if(!g&&!w&&!stiff)return false;const kind=g?'Grab':w?'web':'partial paralysis',dc=g?.dc??w?.dc??(s.paralysisDC[t]||Math.max(13,10+e.attack-2)),mod=g||w?escapeModifier(t):fortitudeMod(t),d=roll(s,20),deg=outcome(d,mod,dc);
 note(s,'Liberating Step · '+name(run.picks[t])+' free '+(g||w?'Escape':'Fortitude save')+' against '+kind+' · '+(d+mod)+' vs DC '+dc+' · '+['critical failure','failure','success','critical success'][deg]);
 if(deg>=2){if(g)releaseHeroGrab(s,t,'freed by Liberation');else if(w)s.webbed[t]=null;else{s.stiff[t]=0;s.paralysisDC[t]=0}return true}return false}
function liberatingStep(s,i,t,e){if(liberationEscape(s,t,e))countMetric(s,i,'liberationEscapes');const from=s.pos[t],ignore=hasFeat(i,'Unimpeded Step'),steps=reactionSteps(s,t,ignore).filter(p=>enemyDistance(e,p)>enemyDistance(e,from)).sort((a,b)=>enemyDistance(e,b)-enemyDistance(e,a)||(hazardAt(s,a)?.kind==='rune'?1:0)-(hazardAt(s,b)?.kind==='rune'?1:0)||a-b);
 if(steps.length){countMetric(s,i,'liberationSteps');reactionStep(s,t,steps[0],'Steps away with Liberation'+(ignore?' (Unimpeded Step)':''))}}
function onRestraint(s,t,e){if(!s.hp[t])return false;for(let i=0;i<3;i++)if(run.picks[i]==='liberation'&&championReady(s,i,t,e)){s.ready[i]=false;note(s,name(run.picks[i])+' Liberating Step · ally restrained');liberatingStep(s,i,t,e);return true}return false}
function divineGrace(s,i,kind,origin,magical){if(!magical||!s.hp[i]||!s.ready[i]||run.graceEnabled?.[i]===false||!hasFeat(i,'Divine Grace'))return 0;
 const cover=kind==='reflex'&&sight(s.pos[i],i,origin).startsWith('Cover')?2:0;if(cover>=2)return 0;s.ready[i]=false;note(s,name(run.picks[i])+' Divine Grace · +2 circumstance '+kind+' save');return 2}
function defend(s,t,n,type='physical',area=false){if(!n)return {i:t,damage:0};kit(s);const physical=['physical','piercing','slashing','bludgeoning'].includes(type);const intercepted=physical&&!area?tryIntercept(s,t,n):null;if(intercepted)return intercepted;
 const e=target(s);
 for(let i=0;i<3;i++){const id=run.picks[i];if(!championReady(s,i,t,e))continue;
 const resist=2+level(),prevented=Math.min(n,resist);n=Math.max(0,n-resist);s.ready[i]=false;note(s,name(id)+' '+(id==='justice'?'Retributive Strike':'Liberating Step')+' · prevents '+prevented+' damage (resistance '+resist+')');
 if(id==='justice'){
 if(hasFeat(i,'Nimble Reprisal')&&!enemyInReach(e,s.pos[i],heroReach(i))&&enemyDistance(e,s.pos[i])<=heroReach(i)+1){const steps=reactionSteps(s,i).filter(p=>enemyInReach(e,p,heroReach(i)));if(steps.length)reactionStep(s,i,steps[0],'Steps into reach with Nimble Reprisal')}
 if(e.hp>0&&enemyInReach(e,s.pos[i],heroReach(i)))swing(s,i,true)
 }else liberatingStep(s,i,t,e);
 break}if(physical)return hurtHero(s,t,area?n:shieldBlock(s,t,n));const damage=directDamage(s,t,n,type);return {i:t,damage}}
function releaseGrab(e,s,why){if(!(e.grabbedBy>=0))return;e.grabbedBy=-1;e.restrained=false;note(s,e.name+' · '+why)}
function holdEnemy(s,i){return s.enemies.find(e=>e.hp>0&&e.grabbedBy===i)}
function skillMod(i,k){const id=run.picks[i],a=['feint','demoralize'].includes(k)?5:0,trained=k==='feint'?['thief','mastermind','justice','liberation'].includes(id):k==='demoralize'?['shield','reach','justice','liberation','bodyguard','harmful','thief'].includes(id):['shield','reach','justice','liberation','bodyguard','thief','harmful'].includes(id);return attrValue(i,a)+(trained?level()+2:0)+(k==='feint'?charmBonus(i,'deception'):k==='demoralize'?charmBonus(i,'intimidation'):charmBonus(i,'athletics'))}
function skillDC(e,k){return 10+(k==='feint'?(e.perception??e.init):['trip','disarm'].includes(k)?(e.reflex??Math.max(2,e.fort-1)):['grapple','shove','reposition'].includes(k)?e.fort:(e.will??Math.max(2,e.fort-2)))+(k==='feint'?0:formationBonus(run.battle,e))-(e.frightened||0)}
function freeHand(id){return ['thief','mastermind','healing'].includes(id)}
function payAction(preserveHide=false){const s=run.battle;if(!preserveHide&&s.active<3)revealHero(s,s.active);s.forcePlan=null;s.tumblePlan=null;s.areaPlan=null;s.chargePlan=null;preview=null;s.actions--;retarget(s);if((!s.actions||!s.hp[s.active])&&!won(s)&&s.hp.some(h=>h>0)){advance();enemyTurn()}}
const xy=i=>[i%9,Math.floor(i/9)];
function tile(i){if(enemyAt(i)>=0)return 'A';return rawTile(i)}
function open(i){return tile(i)==='.'}
function sight(i,who=run.battle.active,origin=enemySquare(),heroAttack=false){
 const rows=layout().rows;const [a,b]=xy(origin),[x,y]=xy(i);let bonus=0;
 for(let j=0;j<45;j++){const t=tile(j),ally=run.battle.pos.some((pos,index)=>pos===j&&index!==who&&!(heroAttack&&hasFeat(index,'Phalanx Formation')))&&j!==i;const ei=enemyAt(j),foe=ei>=0&&ei!==enemyAt(origin)&&ei!==enemyAt(i)&&j!==origin&&j!==i;if(t!== '#'&&t!=='c'&&!ally&&!foe)continue;
 const [u,v]=xy(j);let enter=0,exit=1;
 for(const [start,delta,center] of [[a,x-a,u],[b,y-b,v]]){
 if(!delta){if(Math.abs(start-center)>=0.5)exit=-1;continue}
 const near=(center-.5-start)/delta,far=(center+.5-start)/delta;
 enter=Math.max(enter,Math.min(near,far));exit=Math.min(exit,Math.max(near,far))}
 if(exit-enter>1e-8){if(t==='#')return 'Line blocked';bonus=Math.max(bonus,t==='c'?2:1)}}
 return ['Exposed','Lesser cover · +1 AC','Cover · +2 AC'][bonus]}
function paths(start,limit,parity=0,allowAlly=false,mover=null){
 const s=run.battle,best=new Map(),out=new Map(),q=[[start,0,parity,[]]],pass=p=>mover?fitsEnemy(s,mover,p,true):open(p)&&(allowAlly||!s.pos.includes(p));
 while(q.length){q.sort((a,b)=>b[1]-a[1]);const [at,cost,p,path]=q.pop(),key=at+':'+p;
 if(best.has(key))continue;best.set(key,cost);
 if(at!==start&&!s.pos.includes(at)&&(!mover||fitsEnemy(s,mover,at))&&(!out.has(at)||cost<out.get(at).cost))out.set(at,{cost,parity:p,path});
 const [x,y]=xy(at);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
 const X=x+dx,Y=y+dy;if((!dx&&!dy)||X<0||X>=9||Y<0||Y>=5)continue;
 const dest=Y*9+X;if(!pass(dest))continue;
 const diagonal=Boolean(dx&&dy);if(diagonal&&(!pass(y*9+X)||!pass(Y*9+x)))continue;
 const step=(diagonal&&p?2:1)+terrainExtra(s,dest,mover);if(cost+step<=limit)q.push([dest,cost+step,diagonal?1-p:p,[...path,dest]])}}
 return out}
function canMoveHero(s){const i=s.active;return i>=0&&i<3&&s.hp[i]>0&&s.actions>0&&s.stiff?.[i]!==2&&!s.prone?.[i]&&!s.webbed?.[i]&&!s.grabbed?.[i]}
function moves(){const s=run.battle;if(!canMoveHero(s))return new Map();return paths(s.pos[s.active],speed(s.active),s.parity,true)}
function stepOK(s,dest){if(s.stiff?.[s.active]===2||s.prone?.[s.active]||s.webbed?.[s.active]||s.grabbed?.[s.active]||!Number.isInteger(dest)||!open(dest)||s.pos.includes(dest)||dist(s.pos[s.active],dest)!==1||terrainExtra(s,dest)>0)return false;
 const [x,y]=xy(s.pos[s.active]),[a,b]=xy(dest);return x===a||y===b||(open(y*9+a)&&open(b*9+x))}
function canReactAt(e,pos){return e.hp>0&&!e.restrained&&reactiveEnemy(e)&&e.reaction!==false&&enemyInReach(e,pos)}
function mobilitySafe(s,m){return !!m&&hasFeat(s.active,'Mobility')&&m.cost<=Math.floor(speed(s.active)/2)}
function threatenedPath(s,m){if(!m||mobilitySafe(s,m))return [];return s.enemies.filter(e=>[s.pos[s.active],...m.path.slice(0,-1)].some(pos=>canReactAt(e,pos)))}
function moveReactions(s,i,from,label){for(let j=0;j<s.enemies.length&&s.hp[i]>0;j++){
 const e=s.enemies[j];if(!canReactAt(e,from))continue;s.target=j;e.reaction=false;
 const ac=heroAC(s,i,coverAt(from,i),true),pen=tauntPenalty(s,e,[i]);note(s,e.name+' uses Reactive Strike as '+name(run.picks[i])+' '+label);
 defend(s,i,strikeRoll(s,e.name+' Reactive Strike → '+name(run.picks[i]),e.attack-pen-enemyAttackPenalty(e)-weaponAttackPenalty(e),ac,enemyStrikeDie(e,e.boss?10:8),enemyStrikeFlat(e,e.boss?4:2),false,i,true))}}
function heroStride(s,m){const i=s.active,selected=s.target;if(!m)return false;revealHero(s,i);const safe=mobilitySafe(s,m);let last=s.pos[i],parity=s.parity;
 if(safe)note(s,'Mobility · '+name(run.picks[i])+' Strides without movement reactions');
 for(const next of m.path){const from=s.pos[i];if(!safe)moveReactions(s,i,from,'Strides');
 if(!s.hp[i]||won(s)||s.pos[i]!==from||!open(next))break;
 const [x,y]=xy(from),[X,Y]=xy(next);if(x!==X&&y!==Y)parity=1-parity;
 s.pos[i]=next;enterHazards(s,'hero',i,from);if(!s.pos.some((p,j)=>j!==i&&p===s.pos[i])&&open(s.pos[i]))last=s.pos[i];if(!s.hp[i])break}
 if(s.pos.some((p,j)=>j!==i&&p===s.pos[i])||!open(s.pos[i]))s.pos[i]=last;
 s.target=selected;retarget(s);s.parity=parity;kit(s);if(s.hp[i]>0)flankNote(s,i);return true}
function acrobaticsMod(i){return attrValue(i,1)+(['thief','mastermind'].includes(run.picks[i])?level()+2:0)}
function tumbleDC(e){return skillDC(e,'trip')}
function tumbleOptions(s,e=target(s)){
 const out=new Map();if(!canMoveHero(s)||!e.hp)return out;
 const i=s.active,start=s.pos[i],limit=speed(i),index=s.enemies.indexOf(e),best=new Map(),queue=[[start,0,s.parity||0,0,[]]];
 const pass=p=>rawTile(p)==='.'&&(enemyAt(p)<0||enemyAt(p)===index);
 // phase 0 before enemy, 1 inside footprint, 2 after crossing. Other foes are blocked.
 while(queue.length){queue.sort((a,b)=>b[1]-a[1]);const [at,cost,parity,phase,path]=queue.pop(),key=at+':'+parity+':'+phase;if(best.has(key))continue;best.set(key,cost);
 if(phase===2&&at!==start&&!s.pos.includes(at)&&enemyAt(at)<0&&(!out.has(at)||cost<out.get(at).cost))out.set(at,{path,cost,parity});
 const [x,y]=xy(at);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
 const X=x+dx,Y=y+dy;if((!dx&&!dy)||X<0||X>=9||Y<0||Y>=5)continue;const dest=Y*9+X;if(!pass(dest))continue;
 const diagonal=!!(dx&&dy);if(diagonal&&(!pass(y*9+X)||!pass(Y*9+x)))continue;
 const inside=enemyAt(dest)===index;if(phase===2&&inside)continue;const nextPhase=inside?1:phase===1?2:phase;
 // Enemy space counts as difficult terrain; do not stack with bone piles.
 const step=(diagonal&&parity?2:1)+Math.max(inside?1:0,terrainExtra(s,dest));
 if(cost+step<=limit)queue.push([dest,cost+step,diagonal?1-parity:parity,nextPhase,[...path,dest]])}}
 return out}
function activeTumble(s){const p=s.tumblePlan;return p&&p.actor===s.active&&p.target===s.target&&canMoveHero(s)?p:null}
function startTumble(s){if(!tumbleOptions(s).size)return false;s.chargePlan=null;s.areaPlan=null;s.forcePlan=null;s.tumblePlan={actor:s.active,target:s.target,dest:null};s.hazardTarget=-1;preview=null;return true}
function selectTumble(s,p){const t=activeTumble(s);if(!t||!tumbleOptions(s).has(p))return false;t.dest=p;return true}
function tumblePath(s,m,e){const i=s.active,original=s.target,index=s.enemies.indexOf(e);revealHero(s,i);let last=s.pos[i],inside=false,crossed=false,checked=false,parity=s.parity||0;
 for(const next of m.path){const from=s.pos[i],occupant=enemyAt(next);
 if(rawTile(next)!=='.'||(occupant>=0&&occupant!==index))break;
 moveReactions(s,i,from,'Tumbles Through');
 if(!s.hp[i]||won(s)||s.pos[i]!==from)break;
 const entering=e.hp>0&&enemyAt(next)===index;
 if(entering&&!checked){checked=true;const d=roll(s,20),mod=acrobaticsMod(i),dc=tumbleDC(e),degree=outcome(d,mod,dc);note(s,name(run.picks[i])+' Tumble Through '+e.name+' · '+(d+mod)+' vs Reflex DC '+dc+' · '+['critical failure','failure','success','critical success'][degree]);
 if(degree<2){note(s,'Tumble Through fails · movement stops before enemy space');break}}
 const [x,y]=xy(from),[X,Y]=xy(next);if(x!==X&&y!==Y)parity=1-parity;s.pos[i]=next;
 if(inside&&!entering&&checked)crossed=true;inside=entering;
 enterHazards(s,'hero',i,from);
 if(!s.pos.some((p,j)=>j!==i&&p===s.pos[i])&&open(s.pos[i]))last=s.pos[i];
 if(!s.hp[i])break}
 if(!open(s.pos[i])||s.pos.some((p,j)=>j!==i&&p===s.pos[i]))s.pos[i]=last;
 s.target=original;retarget(s);s.parity=parity;kit(s);
 if(crossed&&s.hp[i]>0&&e.hp>0&&hasFeat(i,'Tumble Behind')){e.tumbled??=[false,false,false];e.tumbled[i]=true;note(s,'Tumble Behind · '+e.name+' off-guard to '+name(run.picks[i])+' next attack this turn')}
 if(s.hp[i]>0)flankNote(s,i);return crossed}
function resolveTumble(s){const p=activeTumble(s),e=target(s),m=p&&tumbleOptions(s,e).get(p.dest);if(!m)return false;s.tumblePlan=null;tumblePath(s,m,e);payAction();return true}
function tumblePanel(s){const p=activeTumble(s);if(!p)return '';const m=tumbleOptions(s).get(p.dest),e=target(s),i=s.active;
 return '<section class="card"><b>Tumble Through · '+e.name+'</b><p>Choose a cyan destination through the selected enemy. Acrobatics '+(acrobaticsMod(i)>=0?'+':'')+acrobaticsMod(i)+' vs Reflex DC '+tumbleDC(e)+'. Enemy squares cost extra movement. Failure stops movement before entering. This is not a Strike and does not add MAP.</p>'+
 (m?'<p>'+m.cost*5+' ft · '+m.path.map(q=>String.fromCharCode(65+xy(q)[0])+(xy(q)[1]+1)).join(' → ')+hazardPreview(s,m)+(s.enemies.some(x=>[s.pos[i],...m.path.slice(0,-1)].some(q=>canReactAt(x,q)))?' · Reactive Strike risk':'')+'</p><button data-tumbleconfirm="1">Roll Acrobatics · 1 action</button>':'<p>Tap a cyan square.</p>')+'<button data-tumblecancel="1">Cancel</button></section>'}
