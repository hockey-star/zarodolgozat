// frontend/src/data/abilities.js

// Kaszt ID -> kulcs
export function getClassKeyFromId(classId) {
  if (classId === 6) return "warrior";
  if (classId === 7) return "mage";
  if (classId === 8) return "archer";
  return "warrior";
}

/**
 * FONTOS:
 *  MINDEN image = string path a public mappába:
 *    /cards/common/...
 *    /cards/rare/...
 *    /cards/epic/...
 *    /cards/legendary/...
 *
 *  NINCS import a ../assets/class-abilities-ből!
 */

export const ALL_ABILITIES = [
  // =====================
  // WARRIOR – COMMON
  // =====================
  {
    id: "warrior_slash",
  classKey: "warrior",
  name: "Slash",
  type: "attack",
  dmg: [5, 9],
  heal: null,
  rarity: "common",
  image: "/cards/common/warrior_slash.png",

  bleed: {
    basePercent: 10,   // ✅ első stack: 10%
    bonusPerStack: 5, // ✅ minden új Slash +5%
    maxPercent: 35,   // ✅ plafon
    turns: 2,         // ✅ ennyi körig tart egy stack
  },
  },

  // =====================
  // MAGE – COMMON
  // =====================
  {
    id: "mage_arcane_missiles",
    classKey: "mage",
    name: "Arcane Missiles",
    type: "attack",
    // 3 kis ütés – multi-hit
    dmg: [2, 4],
    heal: null,
    rarity: "common",
    image: "/cards/common/mage_arcane_missiles.png",
    hits: 3, // 🔥 3 találat
  },
  {
    id: "mage_ice_lance",
    classKey: "mage",
    name: "Ice Lance",
    type: "attack",
    dmg: [3, 7],
    heal: null,
    rarity: "common",
    image: "/cards/common/mage_ice_lance.png",
  },

  // =====================
  // ARCHER – COMMON
  // =====================
  {
    id: "archer_quick_shot",
    classKey: "archer",
    name: "Quick Shot",
    type: "attack",
    dmg: [4, 8],
    heal: null,
    rarity: "common",
    image: "/cards/common/archer_quick_shot.png",
  },

  // =====================
  // WARRIOR – RARE
  // =====================
  {
     id: "warrior_parry",
  classKey: "warrior",
  name: "Parry",
  type: "defend",
  dmg: null,
  heal: null,
  rarity: "rare",
  image: "/cards/rare/warrior_parry.png",

  stunTurns: 2, // ✅ ÚJ: enemy kihagy 1 kört
  },
  {
    id: "warrior_cleave",
    classKey: "warrior",
    name: "Cleave",
    type: "attack",
    dmg: [7, 12],
    heal: null,
    rarity: "rare",
    image: "/cards/rare/warrior_cleave.png",
  },
  {
    id: "warrior_rallying_shout",
    classKey: "warrior",
    name: "Rallying Shout",
    type: "heal",
    dmg: null,
    heal: 18,
    rarity: "rare",
    image: "/cards/rare/warrior_rallying_shout.png",
    // 🔥 ÚJ: sebzés buff a következő támadásokra
    damageBuff: {
      multiplier: 1.5, // +50% dmg
      turns: 1, // 1 támadásra
    },
  },
  {
      id: "warrior_shield_wall",
  classKey: "warrior",
  name: "Shield Wall",
  type: "defend",
  dmg: null,
  heal: null,
  rarity: "rare",
  image: "/cards/rare/warrior_shield_wall.png",

  defenseTurns: 2, // ✅ ÚJ
  },

  // =====================
  // MAGE – RARE
  // =====================
  {
   
  id: "mage_arcane_surge",
  classKey: "mage",
  name: "Arcane Surge",
  type: "attack",
  dmg: [8, 13],
  heal: null,
  rarity: "rare",
  image: "/cards/rare/mage_arcane_surge.png",
  // 🔮 enemy vulnerability debuff – +15% sebzést kap
  vulnerabilityDebuff: {
    multiplier: 1.15, // +15% dmg
    turns: 1,         // 3 körig tart
  },
},
  
  {
     id: "mage_frost_nova",
  classKey: "mage",
  name: "Frost Nova",
  type: "attack",
  dmg: [6, 10],
  heal: null,
  rarity: "rare",
  image: "/cards/rare/mage_frost_nova.png",
  // ❄️ stun – 1 enemy kört kihagy
  stunTurns: 1,
  },
  {
    id: "mage_mana_shield",
    classKey: "mage",
    name: "Mana Shield",
    type: "defend",
    dmg: null,
    heal: null,
    rarity: "rare",
    image: "/cards/rare/mage_mana_shield.png",
  },

  // =====================
  // ARCHER – RARE
  // =====================
  {
    id: "archer_aimed_shot",
    classKey: "archer",
    name: "Aimed Shot",
    type: "attack",
    dmg: [7, 12],
    heal: null,
    rarity: "rare",
    image: "/cards/rare/archer_aimed_shot.png",
  },
  {
    id: "archer_evasion",
    classKey: "archer",
    name: "Evasion",
    type: "defend",
    dmg: null,
    heal: null,
    rarity: "rare",
    image: "/cards/rare/archer_evasion.png",
  },
  {
    id: "archer_poison_arrow",
    classKey: "archer",
    name: "Poison Arrow",
    type: "attack",
    // kisebb instant dmg, mert kap DoT-ot
    dmg: [3, 5],
    heal: null,
    rarity: "rare",
    image: "/cards/rare/archer_poison_arrow.png",
    // 🔥 ÚJ: méregsebzés
    poison: {
      damagePerTurn: 3,
      turns: 3,
    },
  },
  {
    id: "archer_snare_trap",
    classKey: "archer",
    name: "Snare Trap",
    type: "defend",
    dmg: null,
    heal: null,
    rarity: "rare",
    image: "/cards/rare/archer_snare_trap.png",
  },

  // =====================
  // WARRIOR – EPIC
  // =====================
  {
    id: "warrior_battle_cry",
    classKey: "warrior",
    name: "Battle Cry",
    type: "attack",
    dmg: [10, 16],
    heal: null,
    rarity: "epic",
    image: "/cards/epic/warrior_battle_cry.png",
  },
  {
    id: "warrior_last_stand",
    classKey: "warrior",
    name: "Last Stand",
    type: "heal",
    dmg: null,
    heal: 30,
    rarity: "epic",
    image: "/cards/epic/warrior_last_stand.png",
  },
  {
   id: "warrior_mortal_strike",
  classKey: "warrior",
  name: "Mortal Strike",
  type: "attack",
  dmg: [14, 20],
  heal: null,
  rarity: "epic",
  image: "/cards/epic/warrior_mortal_strike.png",

  vulnerabilityDebuff: {
    multiplier: 1.25, // ✅ +25% dmg-et kap
    turns: 2,
  },
  },
  {
    id: "warrior_whirlwind",
  classKey: "warrior",
  name: "Whirlwind",
  type: "attack",
  dmg: [8, 14],
  heal: null,
  rarity: "epic",
  image: "/cards/epic/warrior_whirlwind.png",

  hits: 3, // ✅ körkörös multi-hit érzés
  },

  // =====================
  // MAGE – EPIC
  // =====================
  {
    id: "mage_drain_life",
  classKey: "mage",
  name: "Drain Life",
  type: "attack",
  dmg: [4, 6],      // kisebb hit, mert 3x tickel
  heal: 4,         // heal is tickel
  rarity: "epic",
  image: "/cards/epic/mage_drain_life.png",
  hits: 3,         // 🔥 3 tick
  drain: true,     // 🔥 jelzi hogy ez drain jellegű
  },
  {
     id: "mage_fireball",
  classKey: "mage",
  name: "Fireball",
  type: "attack",
  dmg: [12, 18],
  heal: null,
  rarity: "epic",
  image: "/cards/epic/mage_fireball.png",
  burn: {
    percent: 10,   // 🔥 a direkt sebzés 10%-a körönként
    turns: 2,      // 🔥 3 körig ég
  },
  },
  {
    id: "mage_heal_spell",
    classKey: "mage",
    name: "Heal",
    type: "heal",
    dmg: null,
    heal: 25,
    rarity: "epic",
    image: "/cards/epic/mage_heal_spell.png",
  },
  {
    id: "mage_lightning_bolt",
    classKey: "mage",
    name: "Lightning Bolt",
    type: "attack",
    dmg: [11, 17],
    heal: null,
    rarity: "epic",
    image: "/cards/epic/mage_lightning_bolt.png",
  },

  // =====================
  // ARCHER – EPIC
  // =====================
  {
    id: "archer_camouflage",
    classKey: "archer",
    name: "Camouflage",
    type: "defend",
    dmg: null,
    heal: null,
    rarity: "epic",
    image: "/cards/epic/archer_camouflage.png",
  },
  {
    id: "archer_healing_herbs",
    classKey: "archer",
    name: "Healing Herbs",
    type: "heal",
    dmg: null,
    heal: 22,
    rarity: "epic",
    image: "/cards/epic/archer_healing_herbs.png",
  },
  {
    id: "archer_multi_shot",
    classKey: "archer",
    name: "Multi Shot",
    type: "attack",
    dmg: [10, 16],
    heal: null,
    rarity: "epic",
    image: "/cards/epic/archer_multi_shot.png",
  },
  {
    id: "archer_piercing_volley",
    classKey: "archer",
    name: "Piercing Volley",
    type: "attack",
    dmg: [9, 15],
    heal: null,
    rarity: "epic",
    image: "/cards/epic/archer_piercing_volley.png",
  },

  // =====================
  // LEGENDARY
  // =====================
  {
     id: "warrior_crushing_blow",
  classKey: "warrior",
  name: "Crushing Blow",
  type: "attack",
  dmg: [20, 28],
  heal: null,
  rarity: "legendary",
  image: "/cards/legendary/warrior_crushing_blow.png",

  executeBelowPercent: 30, // ✅ kivégző mechanika
  },
  {
     id: "mage_chain_lightning",
  classKey: "mage",
  name: "Chain Lightning",
  type: "attack",
  dmg: [3, 12],   // kisebb, mert többször csap
  heal: null,
  rarity: "legendary",
  image: "/cards/legendary/mage_chain_lightning.png",
  hits: 3,        // 🔥 4 villámcsapás egymás után
  },
  {
    id: "archer_rapid_fire",
    classKey: "archer",
    name: "Rapid Fire",
    type: "attack",
    dmg: [16, 24],
    heal: null,
    rarity: "legendary",
    image: "/cards/legendary/archer_rapid_fire.png",
  },
];

// Gyors lookup
export const ABILITIES_BY_ID = ALL_ABILITIES.reduce((acc, ab) => {
  acc[ab.id] = ab;
  return acc;
}, {});

// Kasztonkénti lista (Inv / Deck editor)
export function getAbilitiesForClass(classKey) {
  return ALL_ABILITIES.filter((ab) => ab.classKey === classKey);
}

// Alap pakli kasztonként
export function buildDefaultDeckForClass(classKey) {
  if (classKey === "warrior") {
    return [
      "warrior_slash",
      "warrior_slash",
      "warrior_slash",
      "warrior_parry",
      "warrior_parry",
      "warrior_cleave",
      "warrior_rallying_shout",
      "warrior_shield_wall",
      "warrior_battle_cry",
      "warrior_mortal_strike",
    ];
  }

  if (classKey === "mage") {
    return [
      "mage_arcane_missiles",
      "mage_arcane_missiles",
      "mage_ice_lance",
      "mage_ice_lance",
      "mage_arcane_surge",
      "mage_frost_nova",
      "mage_mana_shield",
      "mage_fireball",
      "mage_heal_spell",
      "mage_lightning_bolt",
    ];
  }

  if (classKey === "archer") {
    return [
      "archer_quick_shot",
      "archer_quick_shot",
      "archer_aimed_shot",
      "archer_poison_arrow",
      "archer_evasion",
      "archer_snare_trap",
      "archer_multi_shot",
      "archer_piercing_volley",
      "archer_camouflage",
      "archer_healing_herbs",
    ];
  }

  // fallback
  return ["warrior_slash", "warrior_slash", "warrior_parry", "warrior_cleave"];
}
