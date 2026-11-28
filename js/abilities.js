// Class and spell abilities: forced movement, maneuvers, cantrips, focus, skills, Recall Knowledge, areas, summons and charges.
// Forced movement uses anchor paths for whole footprints, without voluntary-movement reactions or terrain costs.
function forceReach(i){return run.picks[i]==='reach'?2:1}
function forceStep(s,e,from,dx,dy){const [x,y]=xy(from),X=x+dx,Y=y+dy;if(X<0||X>=9||Y<0||Y>=5)return null;const p=Y*9+X;
 if(!fitsEnemy(s,e,p))return null;
 if(dx&&dy&&(!fitsEnemy(s,e,y*9+X)||!fitsEnemy(s,e,Y*9+x)))return null;return p}
function forceOptions(s,k,e=target(s),i=s.active){
 if(!['shove','reposition'].includes(k)||i<0||i>=3||!s.hp[i]||s.actions<1||!e.hp||e.noManeuver||(e.size||1)>2||!enemyInReach(e,s.pos[i],forceReach(i)))return new Map();
 const [hx,hy]=xy(s.pos[i]),[ex,ey]=xy(e.pos),size=e.size||1,nearX=Math.max(ex,Math.min(ex+size-1,hx)),nearY=Math.max(ey,Math.min(ey+size-1,hy));
 const away=[Math.sign(nearX-hx),Math.sign(nearY-hy)],dirs=k==='shove'?[away]:[-1,0,1].flatMap(dx=>[-1,0,1].map(dy=>[dx,dy])).filter(([dx,dy])=>dx||dy),out=new Map();
 const valid=p=>k==='shove'||enemyInReach(e,s.pos[i],forceReach(i),p);
 for(const [dx,dy] of dirs){const p=forceStep(s,e,e.pos,dx,dy);if(p===null||!valid(p))continue;out.set(p,[p]);
 for(const [u,v] of dirs){const q=forceStep(s,e,p,u,v);if(q===null||q===e.pos||!valid(q)||out.has(q))continue;
 if(dx&&dy&&u&&v)continue;out.set(q,[p,q])}}
 return out}
function forcedEnemyMove(s,e,path){const idx=s.enemies.indexOf(e);let steps=0;if(idx<0||!e.hp)return steps;
 for(const p of path){if(!e.hp)break;const from=e.pos,[x,y]=xy(from),[X,Y]=xy(p);if(Math.max(Math.abs(X-x),Math.abs(Y-y))!==1||forceStep(s,e,from,X-x,Y-y)!==p)break;
 if(e.grabbedBy>=0)releaseGrab(e,s,'grapple broken by forced movement');
 e.pos=p;pruneHidden(s);steps++;for(const i of heldByEnemy(s,e))if(!enemyInReach(e,s.pos[i],1))releaseHeroGrab(s,i,'grab broken by forced movement');
 enterHazards(s,'enemy',idx,from)}
 kit(s);return steps}
function repositionBacklash(s,e,i){const from=s.pos[i],[x,y]=xy(from),opts=[];
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;const X=x+dx,Y=y+dy;if(X<0||X>=9||Y<0||Y>=5)continue;const p=Y*9+X;if(!open(p)||s.pos.includes(p)||!enemyInReach(e,p,enemyReach(e)))continue;
 if(dx&&dy&&(!open(y*9+X)||!open(Y*9+x)))continue;opts.push(p)}
 const danger=p=>hazardAt(s,p)?.kind==='plate'?3:hazardAt(s,p)?.kind==='rune'?2:hazardGlow(s,p)?1:0;
 opts.sort((a,b)=>danger(b)-danger(a)||a-b);if(!opts.length){note(s,e.name+' cannot reposition the hero: no legal square');return}
 revealHero(s,i);s.pos[i]=opts[0];note(s,e.name+' reverses Reposition · '+name(run.picks[i])+' moved 5 ft');enterHazards(s,'hero',i,from);kit(s)}
function activeForce(s){const p=s.forcePlan;if(!p||p.actor!==s.active||p.target!==s.target||s.actions<1||!s.hp[s.active])return null;return p}
function startForce(s,k){if(!canManeuver(s,k))return false;s.chargePlan=null;s.areaPlan=null;s.tumblePlan=null;s.forcePlan={kind:k,actor:s.active,target:s.target,dest:null};s.hazardTarget=-1;preview=null;return true}
function selectForce(s,p){const plan=activeForce(s);if(!plan||!forceOptions(s,plan.kind).has(p))return false;plan.dest=p;return true}
function resolveForce(s){const plan=activeForce(s);if(!plan)return false;const i=s.active,e=target(s),k=plan.kind,path=forceOptions(s,k).get(plan.dest);if(!path||!canManeuver(s,k))return false;
 s.forcePlan=null;const mod=skillMod(i,k)-penalty(s.attacks++),dc=skillDC(e,k),d=roll(s,20),deg=outcome(d,mod,dc);
 note(s,name(run.picks[i])+' '+(k==='shove'?'Shove':'Reposition')+' → '+e.name+' · d20 '+d+' + ('+mod+') vs DC '+dc+' · '+['critical failure','failure','success','critical success'][deg]);
 if(deg>=2){const steps=forcedEnemyMove(s,e,path.slice(0,deg===3?2:1));note(s,e.name+' forced '+steps*5+' ft'+(e.hp?'':' · defeated'));if(e.hp)flankNote(s,i)}
 else if(deg===0){if(k==='shove'){s.prone[i]=true;note(s,name(run.picks[i])+' falls Prone')}else repositionBacklash(s,e,i)}
 payAction();return true}
function forcePanel(s){const p=activeForce(s);if(!p)return '';const path=forceOptions(s,p.kind).get(p.dest),label=p.kind==='shove'?'Shove':'Reposition',e=target(s);
 const coords=q=>String.fromCharCode(65+xy(q)[0])+(xy(q)[1]+1),hazards=path?[...new Set(path.flatMap(q=>footprint(e,q)).map(q=>hazardAt(s,q)).filter(Boolean))].map(hazardDisplay):[];
 return '<section class="card"><b>'+label+' · '+e.name+'</b><p>Tap a purple destination. Success moves up to 5 ft; critical success up to 10 ft along the selected path. Forced movement ignores difficult terrain costs and does not provoke movement reactions.</p>'+
 (path?'<p>Success: '+coords(path[0])+' · Critical success: '+coords(path.at(-1))+(hazards.length?' · Path hazards: '+hazards.join(', '):'')+'</p><button data-forceconfirm="1">Roll Athletics · 1 action</button>':'<p>Choose a destination first.</p>')+'<button data-forcecancel="1">Cancel</button></section>'}
function canManeuver(s,k){const i=s.active,id=run.picks[i],e=target(s),d=enemyDistance(e,s.pos[i]);
 if(e.hp<=0)return false;if(k==='disarm')return canDisarm(s,e);if(['shove','reposition'].includes(k))return forceOptions(s,k,e,i).size>0;if(e.mindless&&['feint','demoralize'].includes(k))return false;
 if(k==='feint')return id!=='mastermind'&&enemyInReach(e,s.pos[i],id==='reach'?2:1);
 if(k==='demoralize')return !e.demoralized?.includes(i)&&d<=6&&enemyLOS(e,s.pos[i]);
 if(k==='trip')return !e.noTrip&&!e.noManeuver&&!e.prone&&(freeHand(id)||id==='reach')&&enemyInReach(e,s.pos[i],id==='reach'?2:1)&&!holdEnemy(s,i);
 if(k==='grapple')return !e.noManeuver&&freeHand(id)&&d===1&&enemyLOS(e,s.pos[i])&&(!holdEnemy(s,i)||holdEnemy(s,i)===e)&&(!(e.grabbedBy>=0)||e.grabbedBy===i);
 return false}
function maneuver(s,k){const i=s.active,e=target(s);if(!canManeuver(s,k))return false;if(['shove','reposition'].includes(k))return startForce(s,k);
 const attack=['trip','grapple','disarm'].includes(k),mod=skillMod(i,k)+(k==='disarm'?disarmBonus(e):0)-(attack?penalty(s.attacks++):0),dc=skillDC(e,k),d=roll(s,20),deg=outcome(d,mod,dc);
 note(s,name(run.picks[i])+' '+k+' → '+e.name+' · d20 '+d+' + ('+mod+') vs DC '+dc+' · '+['critical failure','failure','success','critical success'][deg]);
 if(k==='disarm')resolveDisarm(s,e,i,deg);
 if(k==='feint'){applyFeint(s,e,i,deg)}
 if(k==='demoralize'){(e.demoralized??=[]).push(i);if(deg>=2){e.frightened=Math.max(e.frightened||0,deg===3?2:1);note(s,e.name+' frightened '+e.frightened)}}
 if(k==='trip'){if(deg>=2){e.prone=true;note(s,e.name+' falls Prone');if(deg===3)damageEnemy(s,roll(s,6),'bludgeoning',false,true,i)}else if(deg===0){s.prone[i]=true;note(s,name(run.picks[i])+' falls Prone')}}
 if(k==='grapple'){if(deg>=2){e.grabbedBy=i;e.grabOrigin=s.pos[i];e.grabExpires=s.heroTurns[i]+1;e.restrained=deg===3;note(s,e.name+(e.restrained?' Restrained':' Grabbed'))}else{if(e.grabbedBy===i)releaseGrab(e,s,'grip lost');if(deg===0){s.prone[i]=true;note(s,name(run.picks[i])+' falls Prone on critical Grapple failure')}}}
 payAction();return true}
function enemyEscape(s,e,attacks){const g=e.grabbedBy,mod=e.attack-penalty(attacks)-enemyAttackPenalty(e),dc=10+skillMod(g,'grapple'),d=roll(s,20),deg=outcome(d,mod,dc);note(s,e.name+' Escape · '+(d+mod)+' vs DC '+dc+' · '+['critical failure','failure','success','critical success'][deg]);if(deg>=2)releaseGrab(e,s,'escapes');return deg}
function enemyStand(s,e){e.prone=false;note(s,e.name+' spends an action to Stand');for(let i=0;i<3&&e.hp>0;i++){const id=run.picks[i];if(s.hp[i]&&s.ready[i]&&['shield','reach'].includes(id)&&enemyInReach(e,s.pos[i],id==='reach'?2:1)){s.ready[i]=false;note(s,name(id)+' Reactive Strike on Standing '+e.name);swing(s,i,true)}}}
function standHero(s){const i=s.active,save=s.target;if(!s.prone[i])return false;for(let j=0;j<s.enemies.length&&s.hp[i]>0;j++){const e=s.enemies[j];if(!canReactAt(e,s.pos[i]))continue;s.target=j;e.reaction=false;const pen=tauntPenalty(s,e,[i]);note(s,e.name+' Reactive Strike on Standing '+name(run.picks[i]));defend(s,i,strikeRoll(s,e.name+' reaction',e.attack-pen-enemyAttackPenalty(e)-weaponAttackPenalty(e),heroAC(s,i,coverAt(s.pos[i],i),true),enemyStrikeDie(e,e.boss?10:8),enemyStrikeFlat(e,e.boss?4:2),false,i,true))}
 s.target=save;s.prone[i]=false;note(s,name(run.picks[i])+' Stands');payAction();return true}
function cantripRank(){return Math.ceil(level()/2)}
function divineDC(i){return 10+level()+2+attrValue(i,4)}
function cantripEligible(s,k,i=s.active){const a=divineCantrips[k],e=target(s);return !!(a&&i>=0&&i<3&&['healing','harmful'].includes(run.picks[i])&&s.hp[i]>0&&s.actions>=2&&e.hp>0&&(!a.expanded||hasFeat(i,'Cantrip Expansion'))&&(!a.undead||isUndead(e))&&!(a.type==='mental'&&e.mindless)&&enemyDistance(e,s.pos[i])<=a.range&&enemyLOS(e,s.pos[i]))}
function cantripOptions(s){return Object.keys(divineCantrips).filter(k=>cantripEligible(s,k)).map(k=>{const a=divineCantrips[k],i=s.active;return ['cantrip:'+k,a.name+' · '+a.dice(cantripRank())+'d'+a.die+' '+a.type+' · '+(a.attack?'spell attack '+(divineDC(i)-10-penalty(s.attacks)>=0?'+':'')+(divineDC(i)-10-penalty(s.attacks)): 'basic '+a.save+' DC '+divineDC(i))+' · 2 actions · at will']})}
function castCantrip(s,k){if(!cantripEligible(s,k))return false;const a=divineCantrips[k],i=s.active,e=target(s),rank=cantripRank(),dice=a.dice(rank);let n=0,degree;
 if(a.attack){n=strikeRoll(s,name(run.picks[i])+' casts '+a.name+' → '+e.name,divineDC(i)-10-penalty(s.attacks++)-(s.prone[i]?2:0),targetAC(s,i),a.die,0,false,-1,false,dice);degree=s.lastDegree;consumeFeint(e,i)}
 else{const mod=saveModifier(s,{side:'enemy',i:s.target,pos:e.pos},a.save,s.pos[i]),d=roll(s,20);degree=outcome(d,mod,divineDC(i));let rolled=0;for(let j=0;j<dice;j++)rolled+=roll(s,a.die);n=basicDamage(rolled,degree);note(s,a.name+' → '+e.name+' · '+a.save+' '+(d+mod)+' vs DC '+divineDC(i)+' · '+['critical failure','failure','success','critical success'][degree]+' · '+n+' '+a.type+' damage')}
 damageEnemy(s,n,a.type,false,false,i);
 if(e.hp>0&&k==='needles'&&degree===3)addEnemyPersistent(s,e,'bleed',1,rank,0,i);
 if(e.hp>0&&k==='daze'&&degree===0){e.stunned=Math.max(e.stunned||0,1);note(s,e.name+' · Stunned 1 (loses an action next turn)')}
 s.actions--;payAction();return true}
function focusSpells(i){return focusRegistry[run.picks[i]]||[]}
function focusMax(i){return Math.min(3,focusSpells(i).length)}
function initFocus(s){s.focus??=run.picks.map((_,i)=>focusMax(i));s.focus=run.picks.map((_,i)=>Math.max(0,Math.min(focusMax(i),Number.isFinite(s.focus[i])?s.focus[i]:focusMax(i))));s.focusWards??=[null,null,null]}
function focusRank(){return Math.ceil(level()/2)}
function focusDC(i){return 10+level()+2+attrValue(i,5)}
function focusWard(s){return {round:s.round,cursor:s.cursor}}
function focusWardActive(s,w){return !!w&&(s.round===w.round||(s.round===w.round+1&&s.cursor<w.cursor))}
function focusReady(s,i,combat=true){return Number.isInteger(i)&&i>=0&&i<3&&s.hp[i]>0&&s.focus?.[i]>0&&(combat?s.active===i&&s.actions>=1&&!won(s):recoveryOpen(s))}
function canLayHands(s,i,t,combat=true){return focusReady(s,i,combat)&&focusSpells(i).includes('layhands')&&Number.isInteger(t)&&t>=0&&t<3&&(!combat||dist(s.pos[i],s.pos[t])<=1&&clear(s.pos[i],s.pos[t]))&&(s.hp[t]<heroMax(s,t)||(combat&&t!==i&&s.hp[t]>0&&!focusWardActive(s,s.focusWards[t])))}
function mercyCondition(s,t){return s.grabbed[t]?'grab':s.stiff[t]?'paralysis':null}
function canMercy(s,i,t){return focusReady(s,i)&&hasFeat(i,'Mercy of Grace')&&s.actions>=2&&s.hp[t]>0&&!!mercyCondition(s,t)&&dist(s.pos[i],s.pos[t])<=1&&clear(s.pos[i],s.pos[t])}
function layHands(s,i,t,combat=true,mercy=false){initFocus(s);if(mercy?!canMercy(s,i,t):!canLayHands(s,i,t,combat))return false;s.focus[i]--;const healed=recoverHP(s,t,6*focusRank());countMetric(s,i,'healing',healed);countMetric(s,i,'focusSpent');note(s,name(run.picks[i])+' Lay on Hands → '+name(run.picks[t])+' · '+healed+' HP restored · '+s.focus[i]+'/'+focusMax(i)+' focus');
 if(combat&&t!==i&&s.hp[t]>0){s.focusWards[t]=focusWard(s);note(s,name(run.picks[t])+' gains +2 status AC for one round')}
 if(mercy){const kind=mercyCondition(s,t),dc=kind==='grab'?s.grabbed[t].dc:s.paralysisDC[t]||15+level(),mod=focusDC(i)-10,d=roll(s,20),deg=outcome(d,mod,dc);note(s,'Mercy of Grace · '+kind+' counteract check · '+(d+mod)+' vs DC '+dc+' · '+['critical failure','failure','success','critical success'][deg]);if(deg>=2){if(kind==='grab')releaseHeroGrab(s,t,'freed by Mercy');else{s.stiff[t]=0;s.paralysisDC[t]=0;note(s,name(run.picks[t])+' paralysis cleared')}}s.actions--}
 if(combat)payAction();return true}
function canLayHandsEnemy(s,i=s.active){return focusReady(s,i)&&focusSpells(i).includes('layhands')&&target(s).hp>0&&isUndead(target(s))&&enemyInReach(target(s),s.pos[i],1)&&enemyLOS(target(s),s.pos[i])}
function layHandsEnemy(s){const i=s.active,e=target(s);if(!canLayHandsEnemy(s,i))return false;s.focus[i]--;countMetric(s,i,'focusSpent');const d=roll(s,20),mod=saveModifier(s,{side:'enemy',i:s.target,pos:e.pos},'fort',s.pos[i]),deg=outcome(d,mod,focusDC(i));let n=0;for(let j=0;j<focusRank();j++)n+=roll(s,6);const dmg=basicDamage(n,deg);note(s,name(run.picks[i])+' Lay on Hands → '+e.name+' · Fortitude '+(d+mod)+' vs DC '+focusDC(i)+' · '+dmg+' vitality');damageEnemy(s,dmg,'vitality',false,false,i);
 if(e.hp&&deg<2){e.focusACPenalty=focusWard(s);note(s,e.name+' takes −2 status AC for one round')}
 payAction();return true}
function focusOptions(s){const i=s.active,opts=[];for(let t=0;t<3;t++)if(canLayHands(s,i,t))opts.push(['layhands:'+t,'Lay on Hands · '+name(run.picks[t])+' · '+Math.min(6*focusRank(),heroMax(s,t)-s.hp[t])+' HP'+(t!==i?' +2 AC':'')+' · 1 action / 1 focus']);for(let t=0;t<3;t++)if(canMercy(s,i,t))opts.push(['mercy:'+t,'Mercy of Grace · '+name(run.picks[t])+' · heal + attempt to remove '+mercyCondition(s,t)+' · 2 actions / 1 focus']);if(canLayHandsEnemy(s,i))opts.push(['layhands:enemy','Lay on Hands · '+target(s).name+' · '+focusRank()+'d6 vitality · basic Fort DC '+focusDC(i)+' · 1 action / 1 focus']);return opts}
function canRefocus(s,i){return recoveryOpen(s)&&!recoveryState(s).used&&Number.isInteger(i)&&i>=0&&i<3&&s.hp[i]>0&&focusMax(i)>0&&s.focus[i]<focusMax(i)}
function refocus(s,i){initFocus(s);if(!canRefocus(s,i))return false;s.focus[i]++;countMetric(s,i,'focusRecovered');const r=recoveryState(s);r.used=true;r.result=name(run.picks[i])+' Refocus · '+s.focus[i]+'/'+focusMax(i)+' focus points';note(s,r.result);return true}
function focusRecoveryPanel(s){const heroes=[0,1,2].filter(i=>focusMax(i)>0&&s.hp[i]>0);if(!heroes.length)return '';return '<h3>Focus magic</h3><p>Spend stored focus to heal without using the shared activity. Refocus restores one point and uses the shared activity.</p>'+heroes.map(i=>'<p><b>'+name(run.picks[i])+'</b> · '+s.focus[i]+'/'+focusMax(i)+' focus</p><div class="actions">'+(canRefocus(s,i)?'<button data-refocus="'+i+'">Refocus · restore 1 point</button>':'')+[0,1,2].filter(t=>canLayHands(s,i,t,false)).map(t=>'<button data-layhealer="'+i+'" data-laytarget="'+t+'">Lay on Hands → '+name(run.picks[t])+' · '+Math.min(6*focusRank(),heroMax(s,t)-s.hp[t])+' HP</button>').join('')+'</div>').join('')}
function skills(s){kit(s);const i=s.active,id=run.picks[i],p=s.pos[i],list=[];
 if(canHide(s))list.push(['hide','Hide · Stealth +'+(stealthMod(i)+hideCover(s,target(s),i))+' · 1 action']);
 if(id==='mastermind')for(let t=0;t<3;t++)if(canDirectOpening(s,t))list.push(['opening:'+t,'Direct Opening → '+name(run.picks[t])+' · +1 next weapon Strike · 1 action']);
 if(tumbleOptions(s).size)list.push(['tumble','Tumble Through · Acrobatics '+(acrobaticsMod(i)>=0?'+':'')+acrobaticsMod(i)+' · 1 action']);
 for(const k of ['trip','grapple','shove','reposition','disarm','demoralize','feint'])if(canManeuver(s,k)){const mod=skillMod(i,k)+(k==='disarm'?disarmBonus(target(s)):0)-(['trip','grapple','shove','reposition','disarm'].includes(k)?penalty(s.attacks):0);list.push([k,k[0].toUpperCase()+k.slice(1)+' · '+(mod>=0?'+':'')+mod+' vs DC '+skillDC(target(s),k)+' · 1 action'])}
 for(let t=0;t<3;t++){if(s.hp[t]<=0||dist(p,s.pos[t])>1)continue;if(['healing','harmful'].includes(id)&&s.venom[t]&&!s.venom[t].treated)list.push(['treat'+t,'Treat Poison: '+name(run.picks[t])+' · 1 action']);if(s.actions>=2&&Object.keys(s.persistent[t]).length)list.push(['aidpersist'+t,'Assist recovery: '+name(run.picks[t])+' · 2 actions'])}
 
 list.push(...cantripOptions(s),...focusOptions(s));
 if(id==='bodyguard'&&target(s).taunt!==i&&enemyDistance(target(s),p)<=6&&enemyLOS(target(s),p))list.push(['taunt','Taunt · 1 action']);
 if(s.actions>=2&&s.font[i]>0){
 if(id==='healing')for(let j=0;j<3;j++)if(s.pos[j]>=0&&s.hp[j]<heroMax(s,j)&&dist(p,s.pos[j])<=6&&clear(p,s.pos[j]))list.push(['heal'+j,'Heal '+name(run.picks[j])+' · 2 actions']);
 if(((id==='healing'&&isUndead(target(s)))||(id==='harmful'&&!isUndead(target(s))))&&enemyDistance(target(s),p)<=6&&enemyLOS(target(s),p))list.push(['spell',(id==='healing'?'Damage undead with Heal':'Harm '+foeName().toLowerCase())+' · 2 actions'])}
 return list}
function useSkill(s,k){if(!skills(s).some(([key])=>key===k))return;const i=s.active;
 if(k==='hide'){hideHero(s);return}if(k.startsWith('opening:')){directOpening(s,Number(k.slice(8)));return}if(k.startsWith('mercy:')){layHands(s,i,Number(k.slice(6)),true,true);return}if(k.startsWith('layhands:')){const t=k.slice(9);if(t==='enemy')layHandsEnemy(s);else layHands(s,i,Number(t));return}if(k.startsWith('cantrip:')){castCantrip(s,k.slice(8));return}if(k==='tumble'){startTumble(s);return}if(k.startsWith('treat')){treatPoison(s,Number(k.slice(5)));return}if(k.startsWith('aidpersist')){aidPersistent(s,Number(k.slice(10)));return}
 if(['trip','grapple','shove','reposition','disarm','demoralize','feint'].includes(k)){maneuver(s,k);return}
 if(k==='study'){recallMonster(s);return}
 else if(k==='taunt'){applyTaunt(s,i)}
 else {if(k==='spell'){const d=roll(s,20),bonus=target(s).fort+formationBonus(s,target(s))-(target(s).frightened||0),deg=outcome(d,bonus,spellDC()),n=Math.floor(fontRoll(s,i)*[2,1,.5,0][deg]);const dealt=damageEnemy(s,n,run.picks[i]==='healing'?'vitality':'void',false,true,i);if(dealt>0&&hasFeat(i,'Sap Life')&&!isUndead(target(s))){const heal=Math.min(fontRank(),heroMax(s,i)-s.hp[i]);s.hp[i]+=heal;countMetric(s,i,'healing',heal);note(s,'Sap Life · '+heal+' HP restored')}note(s,foeName()+' Fortitude '+(d+bonus)+' vs DC '+spellDC()+' · '+n+' spell damage ('+fontRank()+'d'+spellDie(i)+')')}
 else {const t=Number(k[4]),n=Math.min(heroMax(s,t)-s.hp[t],fontRoll(s,i)+8*fontRank());s.hp[t]+=n;countMetric(s,i,'healing',n);note(s,'Heal restores '+n+' HP to '+name(run.picks[t]));if(hasFeat(i,'Communal Healing')){const other=[0,1,2].filter(j=>j!==t&&s.hp[j]>0&&s.hp[j]<heroMax(s,j)&&dist(s.pos[i],s.pos[j])<=6&&clear(s.pos[i],s.pos[j])).sort((a,b)=>(heroMax(s,b)-s.hp[b])-(heroMax(s,a)-s.hp[a]))[0];if(other!==undefined){const heal=Math.min(fontRank(),heroMax(s,other)-s.hp[other]);s.hp[other]+=heal;countMetric(s,i,'healing',heal);note(s,'Communal Healing · '+name(run.picks[other])+' restores '+heal+' HP')}}}s.font[i]--;countMetric(s,i,'fontSpent');s.actions--}payAction()}
// Shared expedition lore; Mastermind's off-guard is a separate, per-creature combat benefit.
function loreKey(e){return e.type||e.name}
function loreRank(e){return Math.max(run.monsterLore?.[loreKey(e)]||0,e.loreRank||0)}
function mastermindLore(i,skill){
 return {skill,mod:attrValue(i,3)+level()+(level()>=3?4:2)+Math.max(charmBonus(i,'arcana'),charmBonus(i,'society'),charmBonus(i,'nature'),charmBonus(i,'religion'),charmBonus(i,'crafting'))}
}
function monsterRecallSkill(i,e){const id=run.picks[i],type=e.type,undead=isUndead(e);
 if(id==='mastermind')return mastermindLore(i,'Creature Lore');
 const skill=undead||['acolyte'].includes(type)?'religion':['rat','ratSwarm','wolf','bat','spider','centipede'].includes(type)?'nature':['ooze','mimic','battlemage','necromancer'].includes(type)?'arcana':'society';
 const trained=id==='mastermind'||(skill==='religion'&&['healing','harmful','justice','liberation'].includes(id))||(skill==='society'&&['thief','bodyguard'].includes(id));
 return {skill,mod:attrValue(i,['religion','nature'].includes(skill)?4:3)+(trained?level()+2:0)+charmBonus(i,skill)}}
function monsterRecallDC(e){const lv=e.creatureLevel??level();return [13,14,15,16,18,19,20,22,23,24,26,27,28,30,31,32,34,35,36,38,39,40][Math.max(0,Math.min(21,lv+1))]}
function mastermindRestudy(s,e,i){const study=e.mastermindStudy?.[i];return run.picks[i]==='mastermind'&&!!study&&!study.criticalFailure&&study.turn!==s.heroTurns[i]&&!(e.known[i]>0)}
// Once per Mastermind turn, a selected ally's next weapon Strike against this enemy receives +1.
function openingMark(s,e,t){const m=e.openings?.[t];return m&&s.hp[m.source]>0&&s.heroTurns[m.source]===m.turn?m:null}
function canDirectOpening(s,t,e=target(s)){const i=s.active;return run.picks[i]==='mastermind'&&s.hp[i]>0&&s.actions>=1&&Number.isInteger(t)&&t>=0&&t<3&&i!==t&&s.hp[t]>0&&e.hp>0&&s.directedTurn!==s.heroTurns[i]&&enemyDistance(e,s.pos[i])<=6&&enemyLOS(e,s.pos[i])&&dist(s.pos[i],s.pos[t])<=6&&clear(s.pos[i],s.pos[t])&&!openingMark(s,e,t)}
function directOpening(s,t){const i=s.active,e=target(s);if(!canDirectOpening(s,t,e))return false;e.openings??=[null,null,null];e.openings[t]={source:i,turn:s.heroTurns[i]};s.directedTurn=s.heroTurns[i];countMetric(s,i,'directedOpenings');note(s,name(run.picks[i])+' directs an opening → '+name(run.picks[t])+' vs '+e.name+' · +1 to next weapon Strike before your next turn');payAction();return true}
function consumeOpening(s,e,i){const m=openingMark(s,e,i);if(!m)return null;e.openings[i]=null;countMetric(s,m.source,'openingStrikes');note(s,name(run.picks[i])+' exploits Mastermind opening · +1 circumstance to Strike');return m}
function canRecallMonster(s,e=target(s)){const i=s.active;return i>=0&&i<3&&s.hp[i]>0&&s.actions>=1&&e.hp>0&&(!e.recallTried?.[i]||mastermindRestudy(s,e,i))&&enemyDistance(e,s.pos[i])<=6&&enemyLOS(e,s.pos[i])&&(loreRank(e)<2||run.picks[i]==='mastermind')}
function monsterTraits(e){const out=[],fmt=o=>Object.entries(o||{}).map(([k,v])=>k+' '+v).join(', ');if(fmt(e.resist))out.push('Resistance: '+fmt(e.resist));if(fmt(e.weak))out.push('Weakness: '+fmt(e.weak));if(e.areaWeak)out.push('Area weakness '+e.areaWeak);const immune=[];if(isUndead(e))immune.push('bleed, poison, void (undead)');else if(e.type==='ooze')immune.push('bleed');if(e.mindless)immune.push('mental effects');if(e.precisionImmune)immune.push('precision');if(e.critImmune)immune.push('extra critical damage');if(e.noManeuver)immune.push('physical maneuvers');else if(e.noTrip)immune.push('Trip');if(immune.length)out.push('Immunities: '+immune.join(', '));return out.join(' · ')||'No special resistances or weaknesses recorded'}
function weakestSaves(e){const pairs=[['Fortitude',e.fort],['Reflex',e.reflex??Math.max(2,e.fort-1)],['Will',e.will??Math.max(2,e.fort-2)]],low=Math.min(...pairs.map(x=>x[1]));return pairs.filter(x=>x[1]===low).map(x=>x[0]).join(' / ')}
function recallMonster(s){const e=target(s),i=s.active;if(!canRecallMonster(s,e))return false;const {skill,mod}=monsterRecallSkill(i,e),mm=run.picks[i]==='mastermind',repeat=!!e.recallTried?.[i],dc=monsterRecallDC(e)+(mm&&repeat?2:0),d=roll(s,20),deg=outcome(d,mod,dc);
 if(mm){e.mastermindStudy??=[null,null,null];e.mastermindStudy[i]={success:deg>=2,criticalFailure:deg===0,turn:s.heroTurns[i]}}
 e.recallTried??=[false,false,false];e.recallTried[i]=true;note(s,name(run.picks[i])+' Recall Knowledge · '+e.name+' · '+skill+' '+(d+mod)+' vs DC '+dc+' · '+['critical failure','failure','success','critical success'][deg]);
 if(repeat)countMetric(s,i,'restudies');if(deg>=2){const prior=loreRank(e);if(!prior)countMetric(s,i,'newLoreTypes');if(prior<2&&(deg===3||mm))countMetric(s,i,'weakestSavesRevealed');run.monsterLore??={};run.monsterLore[loreKey(e)]=Math.max(prior,deg===3||mm?2:1);note(s,'Shared knowledge · '+(monsterTypes[e.type]?.info||'Combatant identified')+' · '+monsterTraits(e));if(deg===3||mm)note(s,(deg===3?'Critical insight':'Mastermind analysis')+' · weakest save: '+weakestSaves(e));if(run.picks[i]==='mastermind'){e.known[i]=Math.max(e.known[i]||0,deg===3?10:1);note(s,'Mastermind · '+e.name+' off-guard to you '+(deg===3?'for up to 10 turns':'until your next turn'))}}
 else note(s,mm?(deg===0?'Critical study failure. Further Recall Knowledge on this creature is blocked, but Direct Opening remains available.':'No reliable information. Study again next turn (+2 DC), or Direct Opening for an ally.'):'No reliable information. Another hero may investigate.');
 payAction();return true}
// Read-only tactical advice; never reveals unidentified defenses or grants numerical bonuses.
function knownDamageLabel(e,type){
 if((type==='void'||type==='poison'||type==='bleed')&&isUndead(e)||type==='mental'&&e.mindless||type==='bleed'&&e.type==='ooze')return 'immune';
 const weak=e.weak?.[type]||0,resist=e.resist?.[type]||0;
 return [weak?'weakness '+weak:'',resist?'resistance '+resist:''].filter(Boolean).join(', ')||'no recorded resistance or weakness';
}
function knowledgeAdvice(s,e){
 if(!loreRank(e))return '';
 const lines=[];
 for(let i=0;i<3;i++){
  if(!s.hp[i])continue;
  const w=weaponFor(i),here=knownDamageLabel(e,w.type);
  const options=[{name:starterWeapons[run.picks[i]][0],type:starterWeapons[run.picks[i]][1],key:null},...gear(i).weapons.map(k=>({...lootItems[k],key:k})).filter(x=>x.type)].filter(x=>x.key!==gear(i).weapon);
  const better=options.find(x=>here.includes('resistance')&&(e.resist?.[x.type]||0)<(e.resist?.[w.type]||0)||here==='immune'&&knownDamageLabel(e,x.type)!=='immune'||(e.weak?.[x.type]||0)>(e.weak?.[w.type]||0));
  lines.push(name(run.picks[i])+' · '+w.name+': '+here+(better?' · alternative '+better.name+' ('+better.type+'; '+knownDamageLabel(e,better.type)+')':''));
  if(['healing','harmful'].includes(run.picks[i]))lines.push('Divine Lance: '+knownDamageLabel(e,'spirit')+(isUndead(e)?' · Vitality Lash: '+knownDamageLabel(e,'vitality'):''));
 }
 if(loreRank(e)>=2){const low=weakestSaves(e);lines.push('Lowest save: '+low+' · '+[low.includes('Fortitude')&&!e.noManeuver?'consider Grapple or Shove':'',low.includes('Reflex')&&!e.noTrip&&!e.noManeuver?'consider Trip':'',low.includes('Will')&&!e.mindless?'consider Demoralize or Will-based spells':''].filter(Boolean).join('; '));}
 return '<div class="legend"><b>Party tactical notes</b>'+lines.map(l=>'<p>'+l+'</p>').join('')+'</div>';
}
function monsterDetails(s){const e=target(s),m=monsterTypes[e.type],g=generalBestiary.find(x=>x.id===e.type),rank=loreRank(e),r=monsterRecallSkill(s.active,e);
 return '<section class="card"><b>'+e.name+(m?' · '+(g?'General · '+g.role:m.label):'')+'</b><p class="legend">'+(enemyWeapon(e)?'Attack weapon: '+enemyWeapon(e):'No held attack weapon')+(e.formation?' · Formation '+(formationBonus(s,e)?'active':'inactive'):'')+'</p>'+
 (rank?'<p>'+ (m?.info||'Combatant identified')+'</p><p class="legend">'+monsterTraits(e)+(rank>=2?' · Weakest save: '+weakestSaves(e):'')+'</p>':'<p class="legend">Abilities and defenses unidentified. Recall Knowledge to share tactical information with the party.</p>')+
 knowledgeAdvice(s,e)+(hiddenAgainst(s,e,s.active)?'<p class="legend">Hidden: next attack catches this target off-guard. Moving or another action reveals you.</p>':canHide(s)?'<p class="legend">Terrain cover available: Hide under skill actions to attempt Stealth.</p>':'')+
 (canRecallMonster(s,e)?'<button data-recallmonster="1">'+iconArt('recall-knowledge')+(e.recallTried?.[s.active]?'Study again (+2 DC)':'Recall Knowledge')+' · '+r.skill+' '+(r.mod>=0?'+':'')+r.mod+' · 1 action</button>':e.recallTried?.[s.active]?'<p class="legend">'+(run.picks[s.active]==='mastermind'&&e.mastermindStudy?.[s.active]?(e.mastermindStudy[s.active].criticalFailure?'Critical failure: cannot study this creature again. Direct Opening remains available.':'Study again next turn when personal off-guard expires (+2 DC).'):'This hero already investigated this creature.')+'</p>':'')+'</section>'}
function healMonster(s,e){if(!(e.healCasts>0))return false;
 const allies=s.enemies.filter(x=>x.hp>0&&!isUndead(x)&&x.hp<=x.max*.65&&dist(e.pos,x.pos)<=6&&clear(e.pos,x.pos)).sort((a,b)=>(b.max-b.hp)-(a.max-a.hp));
 if(!allies.length)return false;const x=allies[0],n=Math.min(x.max-x.hp,roll(s,8)+level()*2);x.hp+=n;e.healCasts--;note(s,e.name+' Heal → '+x.name+' · restores '+n+' HP · '+e.healCasts+' casts left');return true}
function monsterFeint(s,e,t){const d=roll(s,20),dc=10+level()+2+attrValue(t,4),mod=e.attack-2-(e.frightened||0),deg=outcome(d,mod,dc);if(deg>=2)e.assassinFeint=t;note(s,e.name+' Feint → '+name(run.picks[t])+' · '+(d+mod)+' vs Perception DC '+dc+' · '+(deg>=2?'off-guard':'failed'));return deg>=2}
function packDamage(s,e,t){return e.pack&&s.enemies.some(x=>x!==e&&enemyThreatens(x,x.pos,s.pos[t]))?2:0}
function directionalArea(a){return a.shape==='cone'||a.shape==='line'}
function validAreaOrigin(source,center,a){if(!Number.isInteger(center)||center<0||center>=45)return false;
 if(a.shape==='emanation')return center===source;
 if(directionalArea(a)){const [x,y]=xy(source),[X,Y]=xy(center);return center!==source&&Math.max(Math.abs(X-x),Math.abs(Y-y))===1&&rawTile(center)!=='#'&&clear(source,center)}
 return rawTile(center)!=='#'&&dist(source,center)<=a.range&&clear(source,center)}
function areaOrigin(source,center,a){return a.shape==='emanation'||directionalArea(a)?source:center}
function inAreaRadius(i,origin,r){return i===origin||dist(i,origin)<=r}
function areaCells(source,center,a){if(!validAreaOrigin(source,center,a))return [];const origin=areaOrigin(source,center,a),[x,y]=xy(source),[X,Y]=xy(center),dx=X-x,dy=Y-y;
 return Array.from({length:45},(_,i)=>i).filter(i=>{if(rawTile(i)==='#'||!inAreaRadius(i,origin,a.radius)||!clear(origin,i))return false;if(!directionalArea(a))return true;if(i===source)return false;const [u,v]=xy(i),dot=(u-x)*dx+(v-y)*dy,cross=(u-x)*dy-(v-y)*dx;return dot>0&&(a.shape==='line'?cross===0:Math.abs(cross)<=dot)})}
function areaTargets(s,side,index,center,a){const source=side==='hero'?s.pos[index]:s.enemies[index].pos,cells=new Set(areaCells(source,center,a)),out=[];
 for(let i=0;i<3;i++)if(s.hp[i]>0&&cells.has(s.pos[i])&&(a.friendlyFire||side!=='hero')&&!(side==='hero'&&i===index&&a.shape==='emanation'))out.push({side:'hero',i,pos:s.pos[i]});
 s.enemies.forEach((e,i)=>{if(e.hp>0&&footprint(e).some(p=>cells.has(p))&&(a.friendlyFire||side!=='enemy')&&!(side==='enemy'&&i===index&&a.shape==='emanation'))out.push({side:'enemy',i,pos:footprint(e).filter(p=>cells.has(p)).sort((p,q)=>dist(p,areaOrigin(source,center,a))-dist(q,areaOrigin(source,center,a))||p-q)[0]})});return out}
function saveModifier(s,t,kind,origin){if(t.side==='hero'){if(kind==='fort')return fortitudeMod(t.i);const id=run.picks[t.i],expert=kind==='reflex'?['thief','mastermind','shield','reach'].includes(id):['justice','liberation','healing','harmful'].includes(id),attr=kind==='reflex'?1:4;
 return level()+(expert?4:2)+attrValue(t.i,attr)+saveItemBonus(t.i,kind)+(kind==='reflex'&&sight(t.pos,t.i,origin).startsWith('Cover')?2:0)}
 const e=s.enemies[t.i];return (kind==='reflex'?(e.reflex??e.fort-1):kind==='fort'?e.fort:(e.will??e.fort-2))+formationBonus(s,e)-(e.frightened||0)+(kind==='reflex'&&sight(t.pos,-1,origin).startsWith('Cover')?2:0)}
function basicDamage(n,degree){return Math.floor(n*[2,1,.5,0][degree])}
function resolveArea(s,side,index,center,a,dc){
 const source=side==='hero'?s.pos[index]:s.enemies[index].pos,targets=areaTargets(s,side,index,center,a);if(!validAreaOrigin(source,center,a))return false;
 if(side==='enemy'&&targets.some(t=>t.side==='hero'))dc-=tauntPenalty(s,s.enemies[index],targets.filter(t=>t.side==='hero').map(t=>t.i));
 const original=s.target,origin=areaOrigin(source,center,a);let base=a.flat||0;for(let j=0;j<a.dice;j++)base+=roll(s,a.die);
 note(s,(side==='hero'?name(run.picks[index]):s.enemies[index].name)+' · '+a.name+' · '+base+' '+a.type+' · basic '+a.save+' DC '+dc);
 // Snapshot targets: reactions or deaths do not remove others from the original area.
 for(const t of targets){if(t.side==='hero'&&!s.hp[t.i])continue;const mod=saveModifier(s,t,a.save,origin)+(t.side==='hero'?divineGrace(s,t.i,a.save,origin,a.type!=='piercing'&&a.type!=='bludgeoning'&&a.type!=='slashing'):0),d=roll(s,20),degree=outcome(d,mod,dc),n=basicDamage(base,degree),label=t.side==='hero'?name(run.picks[t.i]):s.enemies[t.i].name;note(s,label+' '+a.save+' save · '+(d+mod)+' vs '+dc+' · '+['critical failure','failure','success','critical success'][degree]+' · '+n+' '+a.type);
 if(t.side==='hero'){if(n>0&&s.hp[t.i]>0){if(side==='enemy'){s.target=index;defend(s,t.i,n,a.type,true)}else directDamage(s,t.i,n,a.type)}}else{s.target=t.i;damageEnemy(s,n,a.type,true,true,side==='hero'?index:-1)}}
 s.target=original;return true}
function chooseBlast(s,e){const index=s.enemies.indexOf(e),a=areaSpells.fireBurst;let best=null;for(let pos=0;pos<45;pos++){if(!validAreaOrigin(e.pos,pos,a))continue;const ts=areaTargets(s,'enemy',index,pos,a),heroes=ts.filter(t=>t.side==='hero'),allies=ts.filter(t=>t.side==='enemy'),score=heroes.length*3-allies.length*4+(heroes.some(t=>t.i===e.taunt)?.5:0);if(heroes.length&&score>0&&(!best||score>best.score))best={pos,score}}return best?.pos??null}
function areaWarnings(s){return s.enemies.filter(e=>e.hp>0&&e.areaMark!=null).map(e=>'<p role="status" style="color:#ffb7a3"><b>'+e.name+' prepares Fire Burst!</b> Red squares will be hit on its next turn; move out of the marked area.</p>').join('')}
function enemyAreaAction(s,e,actions){if(actions<2||e.restrained||!e.hp)return 0;const index=s.enemies.indexOf(e);
 if(e.swarm){if(areaTargets(s,'enemy',index,e.pos,areaSpells.swarmBites).length){resolveArea(s,'enemy',index,e.pos,areaSpells.swarmBites,10+e.attack-1);return 2}return 0}
 if(e.areaCasts>0&&e.areaMark==null){const pos=chooseBlast(s,e);if(pos!==null){e.areaMark=pos;note(s,e.name+' marks a Fire Burst · danger squares shown');return 2}}return 0}
function summonCells(s,source,range){return Array.from({length:45},(_,i)=>i).filter(i=>rawTile(i)==='.'&&!s.pos.includes(i)&&enemyAt(i,s)<0&&enemyDistance(source,i)<=range&&enemyLOS(source,i)&&hazardAt(s,i)?.kind!=='plate').sort((a,b)=>enemyDistance(source,a)-enemyDistance(source,b)||a-b)}
function summonSkeleton(s,e){if(!(e.summons>0)||s.enemies.length>=5||s.enemies.filter(x=>x.hp>0).length>=3||(e.warden&&e.hp>e.max/2))return false;
 const cells=summonCells(s,e,2);if(!cells.length)return false;
 const lv=Math.max(-1,(s.encounter?.party??level())-4),p=cryptMonster(s.encounter?creatureBase(lv,cells[0],true):{name:'Summoned skeleton',pos:cells[0],max:8+level()*2,ac:13+level(),attack:3+level(),init:3+level(),fort:2+level(),guard:true},'skeleton');if(s.encounter)Object.assign(p,{creatureLevel:lv,variant:'Summoned',xp:creatureXP(lv,s.encounter.party)});
 Object.assign(p,{name:'Summoned skeleton',hp:p.max,known:[0,0,0],taunt:-1,frightened:0,exposed:false,studied:false,reach:1,meleeOnly:true,summoned:true,die:4,flat:1});
 const id=s.enemies.length;s.enemies.push(p);s.order.push(id+3);e.summons--;note(s,e.name+' raises a skeletal minion · joins initiative');return true}
function giantSweep(s,e){const ts=[0,1,2].filter(i=>s.hp[i]>0&&enemyInReach(e,s.pos[i]));if(ts.length<2)return false;const pen=tauntPenalty(s,e,ts);
 for(const i of ts)if(e.hp>0&&s.hp[i]>0)defend(s,i,strikeRoll(s,e.name+' wide sweep → '+name(run.picks[i]),e.attack-pen-enemyAttackPenalty(e)-weaponAttackPenalty(e),heroAC(s,i,coverAt(s.pos[i],i),true),8,1,false,i,true));
 return true}
function swipeOther(s){const e=target(s),from=s.pos[s.active],reach=run.picks[s.active]==='reach'?2:1;if(!reachOK(s))return -1;
 return s.enemies.findIndex(x=>x!==e&&x.hp>0&&enemyAdjacent(x,e)&&enemyInReach(x,from,reach))}
function proudReady(s){const e=target(s);return e.ignoredTaunt===s.active&&e.exposed&&reachOK(s)&&!s.flourish}
// A charge is one activity with two independently legal Stride segments.
// Each segment ends on an empty square; diagonal parity carries across segments.
function canCharge(s){const i=s.active;return i>=0&&i<3&&hasFeat(i,'Sudden Charge')&&canMoveHero(s)&&s.actions>=2&&!s.flourish}
function chargeOptions(s){const out=new Map();if(!canCharge(s))return out;const i=s.active,start=s.pos[i],first=paths(start,speed(i),s.parity,true);
 function add(p,segments){if(p===start)return;const cost=segments.reduce((n,m)=>n+m.cost,0),old=out.get(p);if(!old||cost<old.cost||(cost===old.cost&&segments.length<old.segments.length))out.set(p,{cost,segments,path:segments.flatMap(m=>m.path)})}
 for(const [p,m] of first)add(p,[m]);
 try{for(const [mid,m] of first){s.pos[i]=mid;for(const [p,n] of paths(mid,speed(i),m.parity,true))add(p,[m,n])}}finally{s.pos[i]=start}return out}
function chargeActive(s){return !!(s.chargePlan&&s.chargePlan.actor===s.active&&s.chargePlan.target===s.target&&canCharge(s))}
function startCharge(s){if(!canCharge(s))return false;s.areaPlan=null;s.tumblePlan=null;s.forcePlan=null;s.hazardTarget=-1;preview=null;s.chargePlan={actor:s.active,target:s.target,dest:null};return true}
function selectCharge(s,p){if(!chargeActive(s)||!chargeOptions(s).has(p))return false;s.chargePlan.dest=p;return true}
function resolveCharge(s){if(!chargeActive(s))return false;const i=s.active,p=s.chargePlan,route=chargeOptions(s).get(p.dest);if(!route)return false;const intended=s.enemies[p.target];s.chargePlan=null;s.flourish=true;
 note(s,name(run.picks[i])+' Sudden Charge · '+route.cost*5+' ft · '+route.segments.length+' Stride'+(route.segments.length===1?'':'s'));
 for(const m of route.segments){if(!canMoveHero(s)||won(s))break;heroStride(s,m);if(s.pos[i]!==m.path.at(-1))break}
 if(s.hp[i]>0&&!won(s)&&intended.hp>0&&enemyInReach(intended,s.pos[i],heroReach(i))){s.target=p.target;swing(s,i)}else note(s,'Sudden Charge · no Strike against selected target');
 s.actions--;payAction();return true}
function chargePanel(s,opts){if(!chargeActive(s))return '';const p=s.chargePlan,m=opts.get(p.dest),i=s.active,e=target(s),inRange=m&&enemyInReach(e,p.dest,heroReach(i)),risk=m?s.enemies.filter(e=>[s.pos[i],...m.path.slice(0,-1)].some(q=>canReactAt(e,q))):[];
 return '<section class="card"><b>Sudden Charge · 2 actions · flourish</b><p>Choose a highlighted destination up to two Strides away. Strike the selected enemy if within reach afterward.</p>'+(m?'<p>'+m.cost*5+' ft · '+m.segments.length+' Stride(s) · '+(inRange?'Strike '+e.name:'No Strike at destination')+(risk.length?' · Reactive Strike risk: '+risk.map(e=>e.name).join(', '):'')+hazardPreview(s,m)+'</p><button data-chargeconfirm="1">Confirm charge</button>':'')+'<button data-chargecancel="1">Cancel</button></section>'}
function featButtons(s,selected){const i=s.active,fs=allFeats(i);if(!fs.length)return '';
 let h='<p>Selected feats: '+fs.map(f=>f+(liveFeats.has(f)?'':' (pending)')).join(' · ')+'</p>';
 if(hasFeat(i,'Sudden Charge'))h+='<button data-special="charge" '+(canCharge(s)?'':'disabled')+'>Sudden Charge · 2 actions</button>';
 if(hasFeat(i,'Hampering Stance'))h+='<button data-special="hampering" '+(s.hampering[i]||s.prone[i]||s.actions<1?'disabled':'')+'>'+(s.hampering[i]?'Hampering Stance active':'Hampering Stance · 1 action')+'</button>';
 if(hasFeat(i,'Lunge'))h+='<button data-special="lunge" '+(reachOK(s,1)?'':'disabled')+'>Lunge · 1 action</button>';
 if(hasFeat(i,'Intimidating Strike'))h+='<button data-special="fear" '+(s.actions>=2&&reachOK(s)?'':'disabled')+'>Intimidating Strike · 2 actions</button>';
 if(hasFeat(i,'Defensive Advance'))h+='<button data-special="advance" '+(s.actions>=2&&selected&&!s.flourish?'':'disabled')+'>Defensive Advance to selected square · 2 actions</button>';
 if(hasFeat(i,'Swipe'))h+='<button data-special="swipe" '+(s.actions>=2&&!s.flourish&&swipeOther(s)>=0?'':'disabled')+'>Swipe · 2 actions</button>';
 if(hasFeat(i,'Shielding Taunt'))h+='<button data-special="shieldtaunt" '+(!s.flourish&&enemyDistance(target(s),s.pos[i])<=6&&enemyLOS(target(s),s.pos[i])?'':'disabled')+'>Shielding Taunt · 1 action</button>';
 if(hasFeat(i,'Proud Nail'))h+='<button data-special="proud" '+(proudReady(s)?'':'disabled')+'>Proud Nail · 1 action</button>';
 return h}
function useFeat(s,k){const i=s.active;if(k==='charge')return startCharge(s);if(k==='hampering')return enterHampering(s);
 if(k==='lunge'&&hasFeat(i,'Lunge')&&reachOK(s,1)){note(s,'Lunge');swing(s,i);payAction();return true}
 if(k==='fear'&&hasFeat(i,'Intimidating Strike')&&s.actions>=2&&reachOK(s)){const e=target(s),before=e.hp;swing(s,i);if(e.hp<before&&e.hp>0){if(e.mindless)note(s,e.name+' is immune to Intimidating Strike fear');else{e.frightened=Math.max(e.frightened||0,s.lastDegree===3?2:1);note(s,e.name+' · Intimidating Strike · frightened '+e.frightened)}}s.actions--;payAction();return true}
 if(k==='advance'&&hasFeat(i,'Defensive Advance')&&s.actions>=2&&!s.flourish){const m=moves().get(preview);if(!m)return false;s.flourish=true;if(shieldUsable(s,i))s.raised[i]=true;heroStride(s,m);note(s,'Defensive Advance · '+(shieldUsable(s,i)?'shield raised, ':'shield unusable, ')+'Stride');if(s.hp[i]>0&&!won(s)&&reachOK(s))swing(s,i);s.actions--;payAction();return true}
 if(k==='shieldtaunt'&&hasFeat(i,'Shielding Taunt')&&!s.flourish&&enemyDistance(target(s),s.pos[i])<=6&&enemyLOS(target(s),s.pos[i])){s.flourish=true;if(shieldUsable(s,i))s.raised[i]=true;applyTaunt(s,i);note(s,'Shielding Taunt · '+(shieldUsable(s,i)?'shield raised':'shield unusable'));payAction();return true}
 if(k==='proud'&&hasFeat(i,'Proud Nail')&&proudReady(s)){s.flourish=true;swing(s,i,false,true);payAction();return true}
 if(k==='swipe'&&hasFeat(i,'Swipe')&&s.actions>=2&&!s.flourish){const other=swipeOther(s);if(other<0)return false;const original=s.target,id=run.picks[i],pf=profile(id),bonus=pf[2]-penalty(s.attacks),d=roll(s,20);let base=3+attrDelta(i,atkAttr(id));for(let j=0;j<weaponDice(i);j++)base+=roll(s,pf[3]);s.flourish=true;
 for(const j of [original,other]){s.target=j;const ac=targetAC(s,i),opening=consumeOpening(s,target(s),i),effectiveBonus=bonus+(opening?1:0),deg=outcome(d,effectiveBonus,ac),damage=deg>=2?(base+weaponFlatBonus(s,i,target(s)))*(deg===3&&!target(s).critImmune?2:1):0;if(opening&&deg>outcome(d,bonus,ac))countMetric(s,opening.source,'openingImprovedOutcomes');note(s,'Swipe → '+foeName()+' · d20 '+d+' + ('+effectiveBonus+') vs AC '+ac+' · '+['critical miss','miss','hit','critical hit'][deg]+' · '+damage+' damage');consumeFeint(target(s),i);damageEnemy(s,damage,weaponType(id),false,true,i);weaponRider(s,i,target(s),deg);revealHero(s,i)}
 s.target=original;s.attacks+=2;s.actions--;payAction();return true}
 return false}
