// Character advancement: feats, attributes, fundamental runes, weapon statistics and level-up panels.
function feat(i){const f=run.advancement?.choices?.[i];return run.advancement?.done&&Number.isInteger(f)?featPools[run.picks[i]][f]?.[0]:null}
function pool4(i){return [...(additions4[run.picks[i]]||[]),...featPools[run.picks[i]]].filter(([title])=>title!==feat(i))}
function feat4(i){return run.adv4?.done?run.adv4.choices[i]:null}
function allFeats(i){return [feat(i),feat4(i)].filter(Boolean)}
function hasFeat(i,n){return allFeats(i).includes(n)}
function start4(s){if(!sixthRoom()||!won(s)||!s.reward||run.adv4||!run.general?.done)return false;
 run.adv4={choices:[null,null,null],hero:0,all:false,done:false};
 s.hp=s.hp.map((hp,i)=>hp>0?hp+growth[run.picks[i]]+(generalFeat(i)==='Toughness'?1:0):0);note(s,'Party reached level 4 · HP, proficiency and Toughness increased.');return true}
function choose4(i,n){const a=run.adv4;if(!a||a.done||!Number.isInteger(i)||i<0||i>2||!pool4(i).some(([title])=>title===n))return false;
 a.choices[i]=n;const next=a.choices.indexOf(null);if(next>=0)a.hero=next;a.all=false;return true}
function finish4(){const a=run.adv4;if(!a||a.done||!a.choices.every((n,i)=>pool4(i).some(([title])=>title===n)))return false;a.done=true;return true}
function panel4(){return alphaAdvancement(4)}
function generalFeat(i){const f=run.general?.choices?.[i];return Number.isInteger(f)?generalPool[f]?.[0]:null}
function speed(i){return (generalFeat(i)==='Fleet'?6:5)+Math.max(charmBonus(i,'speed'),run.battle?.tonics?.[i]?.haste?1:0)}
function initiativeBonus(i){return 4+level()-1+Math.max(generalFeat(i)==='Incredible Initiative'?2:0,charmBonus(i,'initiative'))}
function attrDelta(i,a,preview=false){const id=run.picks[i];return (run.adv5?.done||preview)&&run.adv5?.boosts[i]?.includes(a)&&baseAttrs[id][a]<4?1:0}
function attrValue(i,a,preview=false){return baseAttrs[run.picks[i]][a]+attrDelta(i,a,preview)}
function atkAttr(id){return ['thief','mastermind'].includes(id)?1:0}
function acDex(id){return ['thief','mastermind','healing'].includes(id)}
function weaponExpert(id){return ['shield','reach','thief','mastermind','justice','liberation','bodyguard','harmful'].includes(id)}
function profile(id){const [hp,ac,attack,die]=profiles[id],bonus=level()-1,i=run.picks.indexOf(id),con=attrDelta(i,2),dex=acDex(id)?attrDelta(i,1):0,expert=level()>=5&&weaponExpert(id)?2:0;
 return [hp+bonus*growth[id]+(run.general?.done&&generalFeat(i)==='Toughness'?level():0)+level()*con,ac+bonus+dex+fundamentalRunes().armor,attack+bonus+expert+attrDelta(i,atkAttr(id))+fundamentalRunes().potency,weaponFor(i).die]}
function start5(s){if(!eighthRoom()||!won(s)||!s.reward||run.adv5||!run.adv4?.done)return false;run.adv5={boosts:[[],[],[]],hero:0,done:false};
 s.hp=s.hp.map((hp,i)=>hp>0?hp+growth[run.picks[i]]+(generalFeat(i)==='Toughness'?1:0):0);note(s,'Party reached level 5 · HP, proficiency, spell rank and class damage scaling increased.');return true}
function boost5(i,a){const v=run.adv5;if(!v||v.done||!Number.isInteger(i)||i<0||i>2||!Number.isInteger(a)||a<0||a>=6)return false;const arr=v.boosts[i];if(arr.includes(a))arr.splice(arr.indexOf(a),1);else if(arr.length<4)arr.push(a);else return false;return true}
function finish5(s){const v=run.adv5;if(!v||v.done||!v.boosts.every(b=>b.length===4&&new Set(b).size===4&&b.every(a=>Number.isInteger(a)&&a>=0&&a<6)))return false;v.done=true;s.hp=s.hp.map((hp,i)=>hp>0?Math.min(profile(run.picks[i])[0],hp+5*attrDelta(i,2)):0);return true}
function panel5(){return alphaAdvancement(5)}
function strikingPanel(){return fundamentalPanel(5)+'<p class="legend">'+fundamentalLabel()+'</p><div class="actions"><button data-ninth="1">Enter room 9 · '+ninthRooms[run.floor].title+'</button></div>'}
// Level-based fundamental runes; legacy assignment flags do not modify them.
function fundamentalRunes(lv=level()){return {potency:lv>=16?3:lv>=10?2:lv>=2?1:0,dice:lv>=19?4:lv>=12?3:lv>=4?2:1,armor:lv>=18?3:lv>=11?2:lv>=5?1:0,resilient:lv>=20?3:lv>=14?2:lv>=8?1:0}}
function weaponDice(i){return fundamentalRunes().dice}
function saveItemBonus(i,kind){return Math.max(fundamentalRunes().resilient,charmBonus(i,kind))}
function fundamentalLabel(lv=level()){const f=fundamentalRunes(lv);return 'Weapon +'+f.potency+' · '+f.dice+' damage '+(f.dice===1?'die':'dice')+' · Armor +'+f.armor+' AC · Resilient +'+f.resilient+' saves'}
function fundamentalPanel(lv){const f=fundamentalRunes(lv),prev=fundamentalRunes(lv-1),gains=[];if(f.potency>prev.potency)gains.push('+'+f.potency+' weapon potency (item bonus to Strikes)');if(f.dice>prev.dice)gains.push(f.dice+' weapon damage dice (striking)');if(f.armor>prev.armor)gains.push('+'+f.armor+' armor AC');if(f.resilient>prev.resilient)gains.push('+'+f.resilient+' saving throws (item bonus)');return gains.length?'<section class="card"><b>Guaranteed party equipment upgrades</b><p>'+gains.join(' · ')+'</p><p class="legend">Every hero receives these automatically, including starter and backup weapons. Property effects stay with items.</p></section>':''}
// Match the actual normal Strike, including the prototype's fixed base damage modifier.
function strikeBaseFlat(i){return run.picks[i]==='mastermind'?0:3+attrDelta(i,atkAttr(run.picks[i]))}
function weaponStats(i,w=weaponFor(i)){
 const dice=weaponDice(i),flat=strikeBaseFlat(i),effects=[];
 if(w.rider)effects.push('+'+w.amount+' '+w.rider+(w.vs==='undead'?' vs undead':' on hit'));
 if(w.react)effects.push('+'+w.react+' reaction Strike damage');
 if(w.wounded)effects.push('+'+w.wounded+' damage vs foes at half HP or less');
 if(w.flanked)effects.push('+'+w.flanked+' damage while flanking');
 if(w.persistentHit){const p=w.persistentHit;effects.push('1d'+p.die+' persistent '+p.type+(p.critOnly?' on critical hit':' on hit; doubled dice on crit'))}
 const id=run.picks[i];return {name:w.name,formula:dice+'d'+w.die+(flat>0?'+'+flat:flat<0?String(flat):'')+' '+w.type,avg:dice*(w.die+1)/2+flat,min:dice+flat,max:dice*w.die+flat,effects,attack:profile(id)[2],role:id==='reach'?'10-ft reach · Trip':id==='thief'?'Agile · finesse':id==='mastermind'?'Ranged shortbow':'',sneak:['thief','mastermind'].includes(id)?sneakDice()+'d6 Sneak Attack when eligible':''};
}
function weaponStatsMarkup(i,w=weaponFor(i)){
 const q=weaponStats(i,w);return '<span class="weapon-stat-line"><b>'+q.formula+'</b> · avg '+q.avg+' · '+q.min+'–'+q.max+'</span><span class="weapon-effect-line">'+(q.effects.length?q.effects.join(' · '):'No additional weapon effects')+'</span>';
}
function weaponComparison(i,w){
 const current=weaponStats(i),next=weaponStats(i,w),delta=next.avg-current.avg,change=delta===0?'Same base damage':(delta>0?'+':'')+delta+' average base damage';
 return '<span class="weapon-comparison"><span class="weapon-compare-block"><small>Equipped</small><strong>'+current.name+'</strong>'+weaponStatsMarkup(i)+'</span><span class="weapon-compare-block"><small>Reward</small><strong>'+next.name+'</strong>'+weaponStatsMarkup(i,w)+'</span><span class="weapon-delta '+(delta>0?'increase':delta<0?'decrease':'')+'">'+change+'</span><span class="weapon-context">Strike +'+next.attack+(next.role?' · '+next.role:'')+(next.sneak?' · '+next.sneak:'')+'</span></span>';
}
function sneakDice(){return level()>=5?2:1}
function startGeneral(s){if(!fourthRoom()||!won(s)||!s.reward||run.general||!run.advancement?.done)return false;
 run.general={choices:[null,null,null],hero:0,done:false};s.hp=s.hp.map((hp,i)=>hp>0?hp+growth[run.picks[i]]:0);note(s,'Party reached level 3 · proficiency and maximum HP increased.');return true}
function chooseGeneral(s,i,f){const a=run.general;if(!a||a.done||!Number.isInteger(i)||i<0||i>2||!Number.isInteger(f)||!generalPool[f])return false;
 a.choices[i]=f;const next=a.choices.indexOf(null);if(next>=0)a.hero=next;return true}
function finishGeneral(s){const a=run.general;if(!a||a.done||!a.choices.every(f=>Number.isInteger(f)&&!!generalPool[f]))return false;a.done=true;s.hp=s.hp.map((hp,i)=>hp>0&&generalFeat(i)==='Toughness'?Math.min(profile(run.picks[i])[0],hp+level()):hp);return true}
function generalPanel(){return alphaAdvancement(3)}
function enterFollowing(s,room){run.entry={hp:s.hp.slice(),font:s.font.slice(),focus:s.focus.slice(),potions:s.potions,shields:s.shields.slice()};run.room=room;preview=null;run.battle=newRoom();enemyTurn()}
function fontRank(){return level()>=5?3:level()>=3?2:1}
function fontRoll(s,i){let n=0;for(let j=0;j<fontRank();j++)n+=roll(s,spellDie(i));return n}
function spellDie(i){return (hasFeat(i,'Healing Hands')||hasFeat(i,'Harming Hands'))?10:8}
function spellDC(){return 16+level()+attrDelta(run.battle.active,4)}
function runePanel(){return '<button data-rechoose="1">Review level 2 feat choices</button>'+fundamentalPanel(2)+'<div class="actions"><button data-third="1">Enter room 3 · '+thirdRooms[run.floor].title+'</button></div>'}
function startAdvancement(s){if(!secondRoom()||!won(s)||!s.reward||run.advancement)return false;
 run.advancement={level:2,choices:[null,null,null],done:false,hero:0,all:false};
 s.hp=s.hp.map((hp,i)=>hp>0?hp+growth[run.picks[i]]:0);note(s,'Party reached level 2. Maximum HP, AC and Strike modifiers increased.');return true}
function chooseFeat(a,i,f){if(a.done||!Number.isInteger(i)||i<0||i>2||!Number.isInteger(f)||!featPools[run.picks[i]][f])return false;
 a.choices[i]=f;const next=a.choices.indexOf(null);if(next>=0)a.hero=next;a.all=false;return true}
function finishAdvancement(a){if(a.done||!a.choices.every((f,i)=>Number.isInteger(f)&&!!featPools[run.picks[i]][f]))return false;a.done=true;return true}
function advancementPanel(){return alphaAdvancement(2)}
