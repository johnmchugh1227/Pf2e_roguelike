// Static game content: heroes, rooms, feats, bestiary, encounter budgets, loot, hazards, spells and boss tables.
// draft.mjs — stable card IDs in display order
const roster = [
  ["fighter", "shield"], ["fighter", "reach"],
  ["rogue", "thief"], ["rogue", "mastermind"],
  ["cleric", "healing"], ["cleric", "harmful"],
  ["champion", "justice"], ["champion", "liberation"],
  ["guardian", "bodyguard"]
];
const rows=[["Shield Fighter · longsword, steel shield","Shield Block and Reactive Strike","Stride to a doorway, Strike an enemy in reach, Raise a Shield. Save the reaction for the more dangerous trigger.","Level 2 Fighter feat. Consider Aggressive Block."],["Reach Fighter · guisarme","Reactive Strike with reach","Stride to 10 feet, Trip using the guisarme, Step to cover the route past an ally. Watch for a foe Standing.","Level 2 Fighter feat. Consider Sudden Charge if still available."],["Thief Rogue · shortsword, leather armor","Dexterity to melee damage with the shortsword and Sneak Attack","Stride around a foe into a flank, Strike, then Step toward cover.","Level 2 Rogue feat and skill choices."],["Mastermind Rogue · shortbow, arrows","Intelligence-based Creature Lore reveals defenses and weakest saves; successful study makes the target off-guard to you. Direct Opening gives an ally +1 to their next weapon Strike, no check.","Recall Knowledge, Direct Opening for an ally, or Strike with the bow. Failed studies can be retried next turn unless critically failed.","Level 2 Rogue feat and skill choices."],["Healing Cloistered Cleric · religious symbol, staff","Healing font and at-will divine cantrips","When an ally is hurt, Stride into line of effect and cast two-action Heal within 30 feet.","Level 2 Cleric feat. Consider Healing Hands."],["Harmful Warpriest · mace, shield, medium armor","Harmful font, divine cantrips and martial training","Against a living foe within 30 feet, cast two-action Harm and Raise a Shield.","Level 2 Cleric feat. Consider Harming Hands."],["Justice Champion · longsword, shield","Retributive Strike and Lay on Hands","Stride alongside the Rogue, Strike a foe within reach, Raise a Shield. Position so the ally and foe remain in your aura.","Level 2 Champion feat, then a blessing at level 3."],["Liberation Champion · spear, shield","Liberating Step and Lay on Hands","Stride toward the archer you are protecting, Strike a nearby foe, Raise a Shield. A triggered reaction can let the archer Step clear.","Level 2 Champion feat, then a blessing at level 3."],["Guardian · warhammer, shield, medium armor","Taunt and Intercept Attack","Stride beside the most exposed ally, Taunt an enemy within 30 feet, Raise a Shield.","Level 2 Guardian feat."]];
const heroes=Object.fromEntries(roster.map(([,id],i)=>[id,rows[i]]));
const triggers={shield:"Shield Block: with your shield raised, block incoming physical damage from an attack. Reactive Strike competes for that same reaction.",reach:"Reactive Strike: a foe within reach uses a triggering move or manipulate action, makes a ranged attack, or leaves a square during a move action.",justice:"Retributive Strike: an enemy damages your ally while both are in your aura. Reduce the damage and retaliate if the enemy is within reach.",liberation:"Liberating Step: an enemy damages, grabs, or restrains your ally while both are in your aura. The ally can Step if able.",bodyguard:"Intercept Attack: stay beside an ally so you can take the triggering physical damage for them."};
const floors=[["Burial Crypt","Stone coffins break sightlines. Skeleton archers defend the gallery."],["Flooded Warrens","Narrow crossings bring melee heroes together. Water divides the approaches."],["Ruined Watchfort","Long firing lanes reward ranged attacks. Broken walls shelter an advance."]];
const rooms=[
 {title:"The Coffin Gallery",low:"sarcophagus",wall:"pillar",rows:[".........","..c..#...","...c...A.","..#..c...","........."]},
 {title:"The Sluice Crossing",low:"timber barricade",wall:"sluice gate",rows:["....#....","..c....A.","....#....","..c...c..","....#...."]},
 {title:"The Western Rampart",low:"parapet",wall:"watchtower wall",rows:["...##....",".....c.A.","..c......","...##.c..","........."]}
];
const guardRooms=[
 {title:"The Burial Chamber",low:"offering stone",wall:"crypt wall",rows:["....#....","..c.#..c.","......A..","..c.#....","....#...."]},
 {title:"The Floodgate",low:"sandbags",wall:"floodgate pier",rows:[".........","...c.#...","......A..","...c.#...","........."]},
 {title:"The East Gate",low:"barricade",wall:"gatehouse wall",rows:["......#..","..c......","....#.A..","..c......","......#.."]}
];
const thirdRooms=[
 {title:"The Ossuary Vault",low:"bone chest",wall:"stone pier",rows:[".........","...c.#...","......A..","...c.#...","........."]},
 {title:"The Smuggler's Cache",low:"crate",wall:"support column",rows:[".........","....#....","..c....A.","....#..c.","........."]},
 {title:"The Armory",low:"weapon rack",wall:"stone wall",rows:[".........","..c.#....","......A..","..c.#....","........."]}
];
const fourthRooms=[
 {title:"The Bone Chapel",low:"stone pew",wall:"pillar",rows:[".........","..c...#..","....c..A.","..#...c..","........."]},
 {title:"The Drowned Dock",low:"cargo crate",wall:"bulkhead",rows:[".........","...#..c..","..c....A.","...#..c..","........."]},
 {title:"The Signal Tower",low:"parapet",wall:"tower wall",rows:[".........","..c.#....",".......A.","..c.#....","........."]}
];
const fifthRooms=[
 {title:"The Catacomb Gate",low:"stone coffin",wall:"crypt pier",rows:[".........","....#..c.","......A..","..c.#....","........."]},
 {title:"The Pump Chamber",low:"valve housing",wall:"pump support",rows:[".........","...c.#...","......A..","...#..c..","........."]},
 {title:"The Commander’s Hall",low:"weapon rack",wall:"stone partition",rows:[".........","..c..#...","......A..","..c..#...","........."]}
];
const sixthRooms=[
 {title:"The Crypt Guardpost",low:"stone coffin",wall:"pillar",rows:[".........","..c...A..","....B....","..#...c..","........."]},
 {title:"The Customs Post",low:"crate",wall:"bulkhead",rows:[".........","..c....A.","....B....","..c.#....","........."]},
 {title:"The Barracks",low:"barricade",wall:"stone pier",rows:[".........","..#....A.","....B....","..c...#..","........."]}
];
const seventhRooms=[
 {title:"The Sepulcher Approach",low:"sarcophagus",wall:"pillar",rows:[".........","..c...A..","......B..","..#..c...","........."]},
 {title:"The Reservoir Gate",low:"crate",wall:"sluice pier",rows:[".........","..c....A.",".......B.","..c.#....","........."]},
 {title:"The Inner Keep",low:"barricade",wall:"stone pier",rows:[".........","..#....A.",".......B.","..c...#..","........."]}
];
const eighthRooms=[
 {title:"The Reliquary",low:"stone chest",wall:"pillar",rows:[".........","..c...A..","....#....","..c...B..","........."]},
 {title:"The Sunken Treasury",low:"crate",wall:"sluice pier",rows:[".........","..c....A.","....#....","..c...B..","........."]},
 {title:"The War Room",low:"table",wall:"stone pier",rows:[".........","..c...A..","....#....","..c...B..","........."]}
];
const ninthRooms=[
 {title:"The Tomb Antechamber",low:"coffin",wall:"pillar",rows:[".........","..c...A..",".....B...","..c....C.","........."]},
 {title:"The Flooded Sanctum",low:"crate",wall:"pier",rows:[".........","..c....A.",".....B...","..c...C..","........."]},
 {title:"The Royal Approach",low:"barricade",wall:"pillar",rows:[".........","..c...A..",".....B...","..c...C..","........."]}
];
const tenthRooms=[
 {title:"The Sepulcher Throne",low:"sarcophagus",wall:"pillar",rows:[".........","..c...#..","......A..","..c...#..","........."]},
 {title:"The Drowned Throne",low:"crate",wall:"sluice pier",rows:[".........","..c...#..","......A..","..c...#..","........."]},
 {title:"The Warlord's Hall",low:"weapon rack",wall:"pillar",rows:[".........","..c...#..","......A..","..c...#..","........."]}
];
// Level-one prototype profiles: maximum HP, AC, Strike modifier, weapon die.
const profiles={shield:[20,18,9,8],reach:[20,17,9,10],thief:[17,17,7,6],mastermind:[17,17,7,6],healing:[16,15,5,4],harmful:[18,17,7,6],justice:[21,18,7,8],liberation:[21,18,7,6],bodyguard:[23,18,7,8]};
const growth={shield:12,reach:12,thief:10,mastermind:10,healing:10,harmful:10,justice:12,liberation:12,bodyguard:15};
const featPools={
 shield:[['Reactive Shield',1,'Raise your shield as a reaction to a melee Strike.'],['Intimidating Strike',2,'A two-action Strike that can frighten a target.'],['Sudden Charge',1,'Two actions (flourish): move up to twice Speed, then Strike if within reach.'],['Aggressive Block',2,'After Shield Block against an adjacent Medium or smaller enemy, it chooses a 5-ft push or off-guard until your next turn.']],
 reach:[['Lunge',2,'Extend your melee reach for a Strike.'],['Intimidating Strike',2,'A two-action Strike that can frighten a target.'],['Sudden Charge',1,'Two actions (flourish): move up to twice Speed, then Strike if within reach.']],
 thief:[['Nimble Dodge',1,'Use a reaction for +2 circumstance AC against an attack.'],['Tumble Behind',1,'Make a foe off-guard to your next attack by successfully Tumbling Through.'],['Mobility',2,'Move at half Speed without triggering reactions.'],['Quick Draw',2,'Draw a weapon and Strike with it in one action.']],
 mastermind:[['Nimble Dodge',1,'Use a reaction for +2 circumstance AC against an attack.'],['Mobility',2,'Move at half Speed without triggering reactions.'],['Quick Draw',2,'Draw a weapon and Strike with it in one action.'],['Tumble Behind',1,'Make a foe off-guard to your next attack by successfully Tumbling Through.']],
 healing:[['Healing Hands',1,'Roll d10s instead of d8s for Heal.'],['Reach Spell',1,'Spend an extra action to extend a spell’s range.'],['Cantrip Expansion',2,'Learn Needle Darts and Daze in addition to your two starting cantrips.']],
 harmful:[['Harming Hands',1,'Roll d10s instead of d8s for Harm.'],['Reach Spell',1,'Spend an extra action to extend a spell’s range.'],['Cantrip Expansion',2,'Learn Needle Darts and Daze in addition to your two starting cantrips.']],
 justice:[['Defensive Advance',1,'Raise your shield, advance and Strike.'],['Nimble Reprisal',1,'Extend the options for your Retributive Strike reaction.'],['Divine Grace',2,'React before a magical save for +2 circumstance bonus.']],
 liberation:[['Defensive Advance',1,'Raise your shield, advance and Strike.'],['Divine Grace',2,'React before a magical save for +2 circumstance bonus.'],['Unimpeded Step',1,'Your Liberating Step allows allies to Step into difficult terrain.']],
 bodyguard:[['Hampering Stance',2,'One action: adjacent squares become difficult terrain for grounded enemies until the encounter ends.'],['Reactive Shield',1,'Raise your shield as a reaction when hit in melee.'],['Phalanx Formation',2,'You no longer grant enemies lesser cover against allied attacks.']]
};
const liveFeats=new Set(['Quick Draw','Sudden Charge','Aggressive Block','Divine Grace','Unimpeded Step','Mercy of Grace','Hampering Stance','Cantrip Expansion','Tumble Behind','Mobility','Swipe','Dread Striker','Brutal Beating','Communal Healing','Sap Life','Nimble Reprisal','Shielding Taunt','Proud Nail','Reactive Shield','Intimidating Strike','Lunge','Nimble Dodge','Healing Hands','Harming Hands','Defensive Advance','Phalanx Formation']);
const additions4={
 shield:[['Swipe',4,'One two-action attack against two adjacent enemies within reach.']],
 reach:[['Swipe',4,'One two-action attack against two adjacent enemies within reach.']],
 thief:[['Dread Striker',4,'Frightened enemies are off-guard to your attacks.'],['Brutal Beating',2,'A damaging critical Strike inflicts frightened 1.']],
 mastermind:[['Dread Striker',4,'Frightened enemies are off-guard to your attacks.'],['Brutal Beating',2,'A damaging critical Strike inflicts frightened 1.']],
 healing:[['Communal Healing',2,'A single-target Heal also restores HP equal to its rank to another ally in range; prototype automatically picks the most injured eligible ally.']],
 harmful:[['Sap Life',2,'Damaging a living enemy with Harm restores HP equal to its spell rank.']],
 justice:[['Mercy of Grace',4,'Two-action Lay on Hands also attempts to remove Grab or partial paralysis.'],['Aura of Courage',4,'Reduce fear on nearby allies. Pending: party frightened conditions.']],
 liberation:[['Mercy of Grace',4,'Two-action Lay on Hands also attempts to remove Grab or partial paralysis.'],['Aura of Courage',4,'Reduce fear on nearby allies. Pending: party frightened conditions.']],
 bodyguard:[['Proud Nail',4,'Strike a taunted enemy that ignored you, with an extra weapon damage die.'],['Shielding Taunt',2,'Raise Shield and Taunt in one action (flourish).']]
};
const generalPool=[['Toughness','Increase maximum HP by your level. Recovery-check benefits await the dying-condition system.'],['Fleet','Increase Stride distance by 5 feet.'],['Incredible Initiative','Gain a +2 circumstance bonus to initiative.']];
const attributes=['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'];
// Prototype inferred starting modifiers; full character ancestry/attribute generation is future work.
const baseAttrs={shield:[4,1,2,0,1,1],reach:[4,2,2,0,1,0],thief:[1,4,2,0,1,1],mastermind:[0,4,1,3,1,0],healing:[0,2,1,0,4,2],harmful:[3,1,2,0,3,0],justice:[4,0,2,0,1,2],liberation:[4,0,2,0,1,2],bodyguard:[4,1,3,0,0,1]};
// Original encounter profiles are retained as the balance baseline. Monster templates are adaptations, not copied stat blocks.
const generalBestiary=[
 ['rat','Giant Rat','Fodder','Fast, agile bites; critical bite causes bleeding',true],
 ['ratSwarm','Rat Swarm','Swarm','Swarming bites, physical resistance and area weakness',true],
 ['spider','Giant Spider','Controller','Webs and staged venom',true],
 ['bat','Giant Bat','Skirmisher','Flying over low cover and hit-and-run bites',true],
 ['wolf','Wolf','Flanker','Pack attacks and knockdown',true],
 ['centipede','Giant Centipede','Disabler','Staged venom; severe poison makes targets off-guard',true],
 ['ooze','Ooze','Tank','Critical hit and precision immunity',true],
 ['mimic','Mimic','Ambusher','Dormant ambush and adhesive Grab',true],
 ['ogre','Ogre','Bruiser','2×2 footprint, reach and heavy attacks',true],
 ['archer','Archer','Ranged','Maintains distance',true],
 ['shieldbearer','Shieldbearer','Defender','Raise Shield and Shield Block',true],
 ['spearman','Spearman','Defender','Reach and Reactive Strike',true],
 ['assassin','Assassin','Skirmisher','Feint and precision damage',true],
 ['battlemage','Battlemage','Artillery','Telegraphed fire bursts; friendly fire',true],
 ['acolyte','Acolyte','Support','Limited ally healing',true]
].map(([id,name,role,ability,playable])=>({id,name,role,ability,playable}));
const environmentBestiary={
 crypt:['skeleton','zombie','ghoul','ghost','wight','skeletalChampion','skeletalGiant','necromancer','cryptWarden'],
 hell:['imp','devil','hellHound','nightmare','erinyes'],
 seaside:['seaDevil','giantCrab','reefclaw','grindylow','seaHag'],
 swamp:['boggard','crocodile','troll','giantLeech','hag'],
 goblinStronghold:['goblinWarrior','goblinPyro','warChanter','goblinDog','bugbear','hobgoblin'],
 ruins:['gargoyle','animatedStatue','elemental','ancientGuardian'],
 artificer:['homunculus','clockworkSoldier','animatedWeapon','construct','alchemist'],
 dungeon:['bandit','mercenary','kobold'],
 frozenCaverns:['iceElemental','yeti','frostDrake'],
 fungalDepths:['myceloid','fungusLeshy'],
 enchantedForest:['fey','arboreal','animatedPlant'],
 volcanicForge:['magmaElemental','fireGiant','flameDrake'],
 aberrantDepths:['gibberingMouther','fleshwarp','intellectDevourer'],
 desertTomb:['mummy','giantScorpion','sphinx'],
 draconicLair:['drake','dragonCultist','dragon'],
 shadowRealm:['shadow','wraith','nightwalker']
};
const monsterTypes={
 ghoul:{label:'Ghoul',info:'Agile claws. Injured heroes make a Fortitude save or lose one action next turn; critical failure costs two and prevents movement that turn.',undead:true,paralysis:true,reach:1,meleeOnly:true,move:5,agile:true,die:6,flat:1,reflexShift:2},
 wight:{label:'Wight',info:'Drain Life: damaging claws restore 2 HP to the wight; failed Fortitude saves inflict room-local Drained, reducing max HP and Fortitude.',undead:true,drainLife:true,reach:1,meleeOnly:true,die:8,flat:1,fortShift:1},
 ghost:{label:'Ghost',info:'Incorporeal movement through cover and walls (must finish in open space). Resists physical damage 3; immune to Trip and Grapple. Touch deals void damage.',undead:true,incorporeal:true,noManeuver:true,resist:{piercing:3,slashing:3,bludgeoning:3},reach:1,meleeOnly:true,move:5,die:6,flat:1,damageType:'void',reflexShift:1},
 skeletalChampion:{label:'Skeletal champion',info:'Armored skeleton: resists piercing/slashing 3; Raise Shield, Shield Block and Reactive Strike.',undead:true,resist:{piercing:3,slashing:3},reach:1,meleeOnly:true,shieldHP:12,reactive:true,die:8,flat:2},
 skeletalGiant:{label:'Skeletal giant',info:'Large 2×2 skeleton, 10-foot reach, powerful sweeps and Reactive Strike; resists piercing/slashing 3.',undead:true,mindless:true,resist:{piercing:3,slashing:3},size:2,reach:2,meleeOnly:true,reactive:true,move:3,die:10,flat:2,fortShift:2,reflexShift:-2,sweep:true},
 necromancer:{label:'Necromancer',info:'Living spellcaster. Once per encounter raises a skeletal minion; casts ranged void bolts.',summons:1,rangedKite:true,damageType:'void',die:6,flat:1},
 cryptWarden:{label:'Crypt Warden',info:'Three phases: marked weapon sweeps; wardstones awaken at 70% HP (each reduces incoming damage by 2); one skeletal summon below half HP; at 30% HP wardstones extinguish and the Warden marks a devastating ground burst. Destroy or disable wardstones and leave red danger squares.',undead:true,boss:true,reactive:true,reach:2,summons:1,warden:true,bossScript:'sepulcher',bossPhase:1,die:10,flat:3},
 bat:{label:'Giant bat',info:'Flies over low cover, bites and retreats with remaining actions. Flight is two-dimensional.',flying:true,move:7,reach:1,meleeOnly:true,die:6,flat:1,reflexShift:2},
 mimic:{label:'Mimic',info:'Dormant until injured or approached. A damaging attack can be followed by adhesive Grab; Escape or defeat the mimic.',dormant:true,adhesive:true,reach:1,meleeOnly:true,move:2,die:8,flat:2,fortShift:2},
 ogre:{label:'Ogre',info:'Large 2×2 creature; 10-foot reach from its footprint. Heavy axe attacks and Reactive Strike. Requires open space.',size:2,reach:2,meleeOnly:true,reactive:true,move:4,die:12,flat:3,reflexShift:-2,fortShift:2},
 ratSwarm:{label:'Rat swarm',info:'Swarming bites: nearby heroes attempt basic Reflex saves. Physical resistance 3, area weakness 3, precision immunity; cannot be tripped or grabbed. One-square prototype.',swarm:true,noThreat:true,noManeuver:true,precisionImmune:true,resist:{piercing:3,slashing:3,bludgeoning:3},areaWeak:3,reach:1,meleeOnly:true,move:4,reflexShift:2},
 ooze:{label:'Ooze',info:'Immune to critical damage and precision damage; mindless, cannot be tripped. Slow movement, low AC, high HP.',mindless:true,critImmune:true,precisionImmune:true,noTrip:true,reach:1,meleeOnly:true,move:2,die:8,flat:2,reflexShift:-3,fortShift:2},
 battlemage:{label:'Battlemage',info:'Marks a fire burst for the next turn. Basic Reflex save; fire affects allies and enemies in the zone. Two casts per encounter.',areaCasts:2,rangedKite:true,die:4,flat:1},
 rat:{label:'Giant rat',info:'Fast movement; agile bites. A critical bite causes persistent bleed 1d4.',bleedCrit:4,reach:1,meleeOnly:true,move:6,agile:true,die:4,flat:2,reflexShift:2},
 wolf:{label:'Wolf',info:'Pack Attack adds 2 damage while an ally threatens the victim. A successful bite can spend an action to knock the victim prone.',reach:1,meleeOnly:true,move:6,pack:true,knockdown:true,die:6,flat:2,reflexShift:1},
 archer:{label:'Archer',info:'Maintains distance from melee threats; ranged attacks provoke nearby fighters.',rangedKite:true,die:6,flat:1},
 shieldbearer:{label:'Shieldbearer',info:'Raises a shield (+2 AC) and blocks physical damage using Hardness 3 and shield durability.',reach:1,meleeOnly:true,shield:12,die:6,flat:2},
 spearman:{label:'Spearman',info:'10-foot reach and Reactive Strike; controls approaches.',reach:2,reactive:true,die:8,flat:2},
 assassin:{label:'Assassin',info:'Feints against a nearby hero, then adds precision damage on an off-guard melee hit.',reach:1,meleeOnly:true,assassin:true,agile:true,die:6,flat:2,reflexShift:2},
 acolyte:{label:'Acolyte',info:'Has two limited healing casts. Prioritize this enemy before it restores its wounded allies.',healCasts:2,die:4,flat:0},
 skeleton:{label:'Skeleton',info:'Resists piercing/slashing 3; immune to mental effects. Bludgeoning bypasses resistance.',undead:true,mindless:true,resist:{piercing:3,slashing:3},reflexShift:2,fortShift:-1},
 zombie:{label:'Zombie',info:'Slowed 1; weak to slashing 3 and vitality 3; no reactions; immune to mental effects. Can Grab after a slam.',adhesive:true,undead:true,mindless:true,slow:1,noReaction:true,weak:{slashing:3,vitality:3},reach:1,meleeOnly:true,reflexShift:-3,fortShift:1},
 centipede:{label:'Giant centipede',info:'Venom on damaging bites; Fortitude saves determine stages. Stage 3 makes the victim off-guard.',venom:'centipede',reach:1,meleeOnly:true,move:5,die:6,flat:1,agile:true,reflexShift:2},
 spider:{label:'Giant spider',info:'Webs immobilize heroes until Escape. Damaging fangs inject venom.',venom:'spider',web:true,reach:1,meleeOnly:true,reflexShift:2},
 hobgoblin:{label:'Hobgoblin',info:'Formation: +1 AC and saves while adjacent to two allies.',formation:true}
};
// Three-hero PF2e creature XP math. Hazard and reinforcement allowances are roguelike tuning, not awarded XP.
const creatureXPTable={ '-4':10,'-3':15,'-2':20,'-1':30,'0':40,'1':60,'2':80,'3':120,'4':160 };
const threatBudgets={Trivial:30,Low:40,Moderate:60,Severe:90,Extreme:120};
const cryptRoomBudgets=[30,40,40,60,60,60,75,90,90,100];
const cryptHazardPlans={3:['bones','bones'],4:['plate'],5:['rune'],6:['bones','plate'],7:['rune','bones'],8:['altar'],9:['plate','rune'],10:['wardstone','wardstone']};
const hazardXP={bones:0,plate:5,rune:5,altar:10,wardstone:5};
const cryptRecipes={
 1:[['The Restless Dead','skeleton'],['Unearthed','zombie'],['Brittle bones','skeleton','skeleton']],
 2:[['The Burial Guard','skeleton','zombie'],['Corpse in the Dark','zombie'],['Crossfire','skeleton','skeletonArcher']],
 3:[['Ossuary Stalker','ghoul'],['Bones and Teeth','ghoul','skeleton'],['Bone Patrol','skeleton','skeletonArcher']],
 4:[['Vermin in the Chapel','general'],['Defiled Chapel','general','skeleton'],['Crawling Tomb','zombie','general']],
 5:[['Champion of the Gate','skeletalChampion'],['Spectral Sentinel','ghost'],['Life Thief','wight'],['Guardians of the Dead','skeletalChampion','skeleton']],
 6:[['Unquiet Patrol','skeleton','general'],['Grave Robbers','general','ghoul'],['The Dead and the Damned','zombie','general','skeletonArcher'],['Guardpost Defender','general','skeletalChampion']],
 7:[['Unholy Ritual','necromancer','zombie'],['Hungry Dead','ghoul','wight'],['Haunted Approach','ghost','skeletalChampion'],['Ravenous Pack','ghoul','ghoul','skeleton']],
 8:[['The Ossuary Guardian','skeletalGiant'],['Giant and Sentry','skeletalGiant','skeleton'],['Haunted Reliquary','ghost','ghoul'],['The Deathwatch','wight','skeletalChampion','skeleton']],
 9:[['Last Rites','necromancer','skeletalChampion','general'],['The Grave Guard','wight','skeletalGiant','general'],['Spectral Court','ghost','skeletalChampion','general'],['Crypt Vanguard','skeletalChampion','general']],
 10:[['The Sepulcher Warden','cryptWarden']]
};
const monsterRelative={rat:-2,bat:-2,ratSwarm:-1,spider:-1,mimic:0,ooze:0,skeleton:-1,skeletonArcher:-1,zombie:-1,ghoul:0,ghost:0,wight:0,skeletalChampion:0,skeletalGiant:1,necromancer:0,cryptWarden:2};
const warrensGeneralSlots={1:0,2:0,4:0,6:1,8:1,9:2};
const watchfortGeneralSlots={1:0,3:0,4:0,5:0,7:0,8:1,9:2};
const starterWeapons={shield:['Longsword','slashing'],reach:['Guisarme','slashing'],thief:['Shortsword','piercing'],mastermind:['Shortbow','piercing'],healing:['Staff','bludgeoning'],harmful:['Mace','bludgeoning'],justice:['Longsword','slashing'],liberation:['Spear','piercing'],bodyguard:['Warhammer','bludgeoning']};
// Prototype item catalog: weapon families retain the hero's attack style, reach and feat compatibility.
const lootItems={
 flamefan:{name:'Flame fan talisman',kind:'supply',min:1,qty:1,area:'flameCone',desc:'One use · 2 actions · 15-ft cone · 2d6 fire, basic Reflex save. Hits allies too.'},
 stormrod:{name:'Storm rod talisman',kind:'supply',min:2,qty:1,area:'stormLine',desc:'One use · 2 actions · 30-ft line · 2d6 electricity, basic Reflex save. Hits allies too.'},
 burststone:{name:'Burststone talisman',kind:'supply',min:2,qty:1,area:'heroBurst',desc:'One use · 2 actions · 10-ft burst within 30 ft · 2d6 force, basic Reflex save. Hits allies too.'},

 bloodletter:{name:'Bloodletter sword',kind:'weapon',type:'slashing',die:8,ids:['shield','justice','liberation','bodyguard','harmful'],min:2,persistentHit:{type:'bleed',die:4,critOnly:true},desc:'d8 slashing; critical hit inflicts 1d4 persistent bleed.'},
 acidpole:{name:'Corrosive poleaxe',kind:'weapon',type:'slashing',die:10,ids:['reach'],min:3,persistentHit:{type:'acid',die:4,critOnly:true},desc:'d10 slashing, reach and Trip; critical hit inflicts 1d4 persistent acid.'},
 serrated:{name:'Serrated dagger',kind:'weapon',type:'piercing',die:6,ids:['thief'],min:2,persistentHit:{type:'bleed',die:4,critOnly:true},desc:'d6 agile finesse piercing; critical hit inflicts 1d4 persistent bleed.'},
 venomneedle:{name:'Venom needle',kind:'weapon',type:'piercing',die:4,ids:['thief'],min:3,persistentHit:{type:'poison',die:4},desc:'d4 agile finesse piercing; hit inflicts 1d4 persistent poison (double dice on critical hit).'},
 firebow:{name:'Cinderstring bow',kind:'weapon',type:'piercing',die:6,ids:['mastermind'],min:2,persistentHit:{type:'fire',die:4,critOnly:true},desc:'d6 piercing; critical hit inflicts 1d4 persistent fire.'},
 cinderstaff:{name:'Cinderwood staff',kind:'weapon',type:'bludgeoning',die:6,ids:['healing'],min:2,persistentHit:{type:'fire',die:4,critOnly:true},desc:'d6 bludgeoning; critical hit inflicts 1d4 persistent fire.'},
 fireflask:{name:'Alchemist’s fire flask',kind:'supply',min:1,qty:1,bomb:{type:'fire',die:6,persistentDie:4,splash:1},desc:'One throw: ranged Strike, 20-ft range; 1d6 fire plus 1d4 persistent fire on hit. 1 splash damage to target and creatures within 5 ft, even on failure (not critical failure).'},
 acidflask:{name:'Acid flask',kind:'supply',min:1,qty:1,bomb:{type:'acid',die:6,persistentDie:4,splash:1},desc:'One throw: ranged Strike, 20-ft range; 1d6 acid plus 1d4 persistent acid on hit. 1 splash damage to target and creatures within 5 ft, even on failure (not critical failure).'},

 ...Object.fromEntries([
 ['sunblade','Dawnsteel sword','slashing',8,'martial',3,{crypt:true,rider:'vitality',amount:2,vs:'undead'},'+2 vitality damage against undead'],
 ['coldmace','Frostbound mace','bludgeoning',8,'martial',2,{rider:'cold',amount:1},'+1 cold damage on hit'],
 ['emberaxe','Ember axe','slashing',8,'martial',2,{rider:'fire',amount:1},'+1 fire damage on hit'],
 ['shockpick','Storm pick','piercing',6,'martial',2,{rider:'electricity',amount:2},'+2 electricity damage on hit'],
 ['sentinel','Sentinel flail','bludgeoning',8,'martial',1,{react:2},'+2 damage on reaction Strikes'],
 ['executioner','Executioner axe','slashing',8,'martial',3,{wounded:2},'+2 damage against foes at half HP or less'],
 ['gravestone','Gravestone maul','bludgeoning',10,'reach',3,{crypt:true,react:2},'reach and Trip; +2 damage on reaction Strikes'],
 ['emberpole','Ember glaive','slashing',10,'reach',2,{rider:'fire',amount:1},'reach and Trip; +1 fire damage on hit'],
 ['thornpole','Thorn pike','piercing',10,'reach',2,{wounded:2},'reach and Trip; +2 damage against foes at half HP or less'],
 ['ghostdagger','Ghostlight dagger','piercing',6,'thief',2,{crypt:true,rider:'vitality',amount:2,vs:'undead'},'+2 vitality damage against undead'],
 ['emberknife','Cinder knife','slashing',6,'thief',2,{rider:'fire',amount:1},'+1 fire damage on hit'],
 ['duelingknife','Dueling dagger','piercing',6,'thief',1,{flanked:2},'+2 damage while flanking'],
 ['sunbow','Dawnstring bow','piercing',6,'mastermind',2,{crypt:true,rider:'vitality',amount:2,vs:'undead'},'+2 vitality damage against undead'],
 ['stormbow','Stormstring bow','piercing',6,'mastermind',2,{rider:'electricity',amount:1},'+1 electricity damage on hit'],
 ['huntingbow','Hunter shortbow','piercing',6,'mastermind',1,{wounded:2},'+2 damage against foes at half HP or less'],
 ['froststaff','Frostwood staff','bludgeoning',6,'healing',2,{rider:'cold',amount:1},'+1 cold damage on hit'],
 ['sunstaff','Consecrated staff','bludgeoning',6,'healing',2,{crypt:true,rider:'vitality',amount:2,vs:'undead'},'+2 vitality damage against undead'],
 ['ironstaff','Pilgrim staff','bludgeoning',6,'healing',1,{wounded:2},'+2 damage against foes at half HP or less']
 ].map(([key,name,type,die,role,min,effect,desc])=>[key,{name,kind:'weapon',type,die,ids:role==='martial'?['shield','justice','liberation','bodyguard','harmful']:[role],min,...effect,desc:'d'+die+' '+type+'; '+desc+'.'}])),
 ...Object.fromEntries([
 ['quickboots','Wayfarer boots',2,{speed:1},'+5 feet Speed (item bonus)'],
 ['catseye','Cat-eye brooch',1,{reflex:1},'+1 Reflex saves'],
 ['watchring','Watchman ring',1,{initiative:1},'+1 initiative'],
 ['climbers','Climber gloves',1,{athletics:1},'+1 Trip and Grapple checks'],
 ['slick','Slippery sash',1,{escape:1},'+1 Escape checks'],
 ['ironband','Iron band',3,{physical:1},'Resistance 1 to physical attacks; highest resistance applies'],
 ['fireward','Emberward ring',1,{fire:2},'Resistance 2 to fire'],
 ['coldward','Frostward ring',1,{cold:2},'Resistance 2 to cold'],
 ['toxinward','Viper fang pendant',1,{poison:1},'Resistance 1 to poison damage'],
 ['leechward','Bloodstone seal',1,{bleed:2},'Resistance 2 to persistent bleed'],
 ['wardensigil','Warden sigil',3,{crypt:true,void:3,will:1},'Resistance 3 to void; +1 Will'],
 ['exorcist','Exorcist medal',2,{crypt:true,religion:2,void:1},'+2 Religion; resistance 1 to void'],
 ['surgeon','Surgeon satchel',2,{medicine:2},'+2 Medicine'],
 ['burglar','Locksmith gloves',2,{thievery:2},'+2 Thievery'],
 ['surveyor','Surveyor lens',2,{crafting:2,initiative:1},'+2 Crafting; +1 initiative'],
 ['bulwark','Bulwark badge',2,{shield:1,ids:['shield','justice','liberation','bodyguard','harmful']},'+1 Shield Block hardness'],
 ['pilgrim','Pilgrim talisman',1,{medicine:1,will:1},'+1 Medicine and Will saves'],
 ['acrobat','Acrobat anklet',2,{reflex:1,escape:1},'+1 Reflex and Escape'],
 ['spellward','Spellward prism',3,{fire:2,void:2},'Resistance 2 to fire and void'],
 ['brawler','Brawler belt',2,{athletics:1,intimidation:1},'+1 Athletics and Intimidation'],
 ['survivor','Survivor clasp',3,{fort:1,reflex:1},'+1 Fortitude and Reflex saves']
 ].map(([key,name,min,effect,desc])=>[key,{name,kind:'charm',min,...effect,desc:desc+'.'}])),
 ...Object.fromEntries([
 ['haste','Quickstep elixir',1,1,'+5 ft Speed for the encounter; does not stack with boots'],
 ['salve','Clotting salve',1,2,'End persistent bleed on the user'],
 ['salts','Revitalizing salts',1,2,'Clear partial paralysis; lost actions are not refunded'],
 ['restoration','Restorative tonic',2,1,'Reduce Drained by 1; does not restore lost HP'],
 ['elixir','Elixir of life',1,2,'Restore 1d6+2+party level HP per dose'],
 ['warding','Warding draught',2,1,'Resistance 3 to fire and void for the encounter; highest resistance applies']
 ].map(([key,name,min,qty,desc])=>[key,{name,kind:'supply',min,qty,desc:qty+' dose'+(qty===1?'':'s')+'; '+desc+'.'}])),

 hammer:{name:'Iron warhammer',kind:'weapon',type:'bludgeoning',die:8,ids:['shield','justice','liberation','bodyguard','harmful'],min:1,desc:'One-handed bludgeoning weapon, d8.'},
 sword:{name:'Steel longsword',kind:'weapon',type:'slashing',die:8,ids:['shield','justice','liberation','bodyguard','harmful'],min:1,desc:'One-handed slashing weapon, d8.'},
 polehammer:{name:'Ossuary polehammer',kind:'weapon',type:'bludgeoning',die:8,ids:['reach'],min:1,crypt:true,desc:'Bludgeoning, d8; retains reach and Trip in this prototype.'},
 poleaxe:{name:'Steel halberd',kind:'weapon',type:'piercing',die:10,ids:['reach'],min:1,desc:'Piercing, d10; retains reach and Trip in this prototype.'},
 sap:{name:'Weighted sap',kind:'weapon',type:'bludgeoning',die:6,ids:['thief'],min:1,desc:'Agile finesse bludgeoning, d6; nonlethal rules not modeled.'},
 sickle:{name:'Curved blade',kind:'weapon',type:'slashing',die:6,ids:['thief'],min:1,desc:'Agile finesse slashing, d6.'},
 bluntbow:{name:'Blunt-arrow shortbow',kind:'weapon',type:'bludgeoning',die:6,ids:['mastermind'],min:1,desc:'Shortbow fitted with blunt arrows; d6 bludgeoning.'},
 staff:{name:'Ironshod staff',kind:'weapon',type:'bludgeoning',die:6,ids:['healing'],min:1,desc:'Improved staff, d6 bludgeoning.'},
 gravecharm:{name:'Graveward amulet',kind:'charm',min:2,crypt:true,void:2,desc:'Resistance 2 to void damage.'},
 holybeads:{name:'Reliquary beads',kind:'charm',min:1,crypt:true,religion:1,medicine:1,desc:'+1 item bonus to Religion and Medicine checks.'},
 ward:{name:'Mindward pendant',kind:'charm',min:1,will:1,desc:'+1 item bonus to Will saves.'},
 sturdy:{name:'Stouthearted charm',kind:'charm',min:2,fort:1,desc:'+1 item bonus to Fortitude saves.'},
 tools:{name:'Fine tool kit',kind:'charm',min:1,thievery:1,crafting:1,desc:'+1 item bonus to Thievery and Crafting checks.'},
 duelist:{name:'Duelist insignia',kind:'charm',min:2,deception:1,intimidation:1,desc:'+1 item bonus to Deception and Intimidation checks.'},
 minor:{name:'Healing cache',kind:'supply',min:1,desc:'Two additional scaling healing potions (1d8 + twice party level each).'},
 lesser:{name:'Lesser healing potion',kind:'supply',min:3,desc:'One potent potion restores 2d8+5+party level HP.'},
 antidote:{name:'Antidote',kind:'supply',min:1,desc:'Two doses; each grants +2 item bonus against poison for the encounter.'}
};
const hazardTypes={
 bones:{name:'Bone pile',glyph:'≈',skill:null,info:'Difficult terrain: entering costs 5 extra feet; cannot Step into it.'},
 plate:{name:'Pressure plate',glyph:'!',skill:'thievery',info:'One-use trap: entering triggers piercing damage, basic Reflex save. Can affect either side.'},
 rune:{name:'Cursed rune',glyph:'◇',skill:'religion',info:'Living creatures ending a turn here attempt a basic Will save against void damage. Undead are unaffected.'},
 altar:{name:'Necrotic altar',glyph:'✦',skill:'religion',info:'Pulses at the end of even rounds: basic Will save against void damage within 10 feet. Undead are unaffected.'},
 wardstone:{name:'Sepulcher wardstone',glyph:'✧',skill:'religion',info:'Each active wardstone reduces all incoming damage to the Warden by 2. Destroy with weapon Strikes or disable with Religion or Thievery. Critical disable failure releases a small void backlash.'}
};
const hazardStructures={bones:{ac:10,hp:5,hardness:0},plate:{ac:14,hp:12,hardness:3},altar:{ac:15,hp:22,hardness:5},wardstone:{ac:12,hp:12,hardness:1}};
// Room-local prototype afflictions; saves and damage never use the physical reaction pipeline.
const venomProfiles={spider:{label:'Spider venom',dice:[4,6,6],maxTicks:3},centipede:{label:'Centipede venom',dice:[4,6,8],maxTicks:4}};
// Shared at-will divine spell catalogue. Rank is based on level, not font uses.
const divineCantrips={
 lance:{name:'Divine Lance',type:'spirit',range:6,attack:true,die:4,dice:r=>r+1},
 lash:{name:'Vitality Lash',type:'vitality',range:6,save:'fort',die:6,dice:r=>r+1,undead:true},
 needles:{name:'Needle Darts',type:'piercing',range:12,attack:true,die:4,dice:r=>r+2,expanded:true},
 daze:{name:'Daze',type:'mental',range:12,save:'will',die:6,dice:r=>1+Math.floor((r-1)/2),expanded:true}
};
// Focus is a persistent per-hero pool, separate from font, spells and party consumables.
// New focus spells/classes extend this registry; cap is three points per hero.
const focusRegistry={justice:['layhands'],liberation:['layhands']};
// Reusable scripted boss intent: immutable warning cells, next-turn resolution,
// health phases without hard HP gates, and explicit interruption rules.
// Drowned Warden: fixed warnings, bounded flooding, and save-driven forced movement.
const drownedPhases={1:'The Undertow',2:'Rising Waters',3:'The Deluge'};
const drownedAttacks={
 tidal:{name:'Tidal Sweep',hint:'Reflex save; failure pushes you away.',save:'reflex',dice:2,die:6,flat:2,dc:22,push:1},
 undertow:{name:'Undertow',hint:'Fortitude save; failure pulls you toward the Warden.',save:'fort',dice:2,die:6,flat:0,dc:22,push:-1},
 grasp:{name:'Drowned Grasp',hint:'Fortitude save; failure immobilizes until Escape.',save:'fort',dice:2,die:6,flat:2,dc:23,grasp:true},
 deluge:{name:'Deluge',hint:'Reflex save; failure pushes you away.',save:'reflex',dice:3,die:6,flat:2,dc:24,push:1}
};
const bossPhases={1:'The Eternal Guardian',2:'Awaken the Crypt',3:'Final Vigil'};
const bossAttacks={
 sweep:{name:'Sepulcher Sweep',radius:2,save:null,type:'physical'},
 pulse:{name:'Grave Pulse',radius:3,save:'will',type:'void',dice:2,die:6,flat:2,dc:23},
 judgment:{name:'Tombfall',radius:2,save:'reflex',type:'void',dice:3,die:6,flat:2,dc:24}
};
const warStandardSquare=26;
// Shared area targeting and resolution. Casters on either side use the same API.
const areaSpells={
 flameCone:{name:'Flame Cone',shape:'cone',radius:3,actions:2,save:'reflex',type:'fire',dice:2,die:6,flat:0,friendlyFire:true},
 stormLine:{name:'Storm Line',shape:'line',radius:6,actions:2,save:'reflex',type:'electricity',dice:2,die:6,flat:0,friendlyFire:true},
 heroBurst:{name:'Force Burst',shape:'burst',radius:2,range:6,actions:2,save:'reflex',type:'force',dice:2,die:6,flat:0,friendlyFire:true},

 gravePulse:{name:'Grave Pulse',shape:'emanation',radius:3,range:0,actions:2,save:'will',type:'void',dice:2,die:6,flat:2,friendlyFire:false},
 fireBurst:{name:'Fire Burst',shape:'burst',radius:1,range:6,actions:2,save:'reflex',type:'fire',dice:2,die:6,flat:0,friendlyFire:true},
 swarmBites:{name:'Swarming Bites',shape:'emanation',radius:1,range:0,actions:2,save:'reflex',type:'piercing',dice:1,die:6,flat:1,friendlyFire:false}
};
