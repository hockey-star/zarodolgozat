// frontend/src/data/abilities.js

import attackImg from "../assets/class-abilities/attack.png";
import shieldImg from "../assets/class-abilities/shield-wall.png";
import healImg from "../assets/class-abilities/hp-pot.png";
import fireballImg from "../assets/class-abilities/fireball.png";

/**
 * Melyik class_id melyik "kulcs"?
 * DB-d alapján:
 *  6 = Harcos
 *  7 = Varázsló
 *  8 = Íjász
 */
export function getClassKeyFromId(classId) {
  if (classId === 6) return "warrior";
  if (classId === 7) return "mage";
  if (classId === 8) return "archer";
  // fallback
  return "warrior";
}

/**
 * Ability struktúra:
 *  - id: egyedi azonosító (string)
 *  - classKey: "warrior" | "mage" | "archer"
 *  - name: megjelenített név
 *  - type: "attack" | "defend" | "heal"
 *  - dmg: [min,max] ha attack
 *  - heal: szám, ha heal
 *  - image: importált ikon (attackImg / healImg / shieldImg / fireballImg)
 *  - rarity: "common" | "rare" | "epic" | "legendary"
 *  - defaultCopies: hány példány legyen az alap pakliban
 */

/* -------------------- HARCOS (WARRIOR) -------------------- */

export const WARRIOR_ABILITIES = [
  {
    id: "warrior_slash",
    classKey: "warrior",
    name: "Slash",
    type: "attack",
    dmg: [6, 11],
    heal: 0,
    image: attackImg,
    rarity: "common",
    defaultCopies: 8,
  },
  {
    id: "warrior_mortal_strike",
    classKey: "warrior",
    name: "Mortal Strike",
    type: "attack",
    dmg: [9, 15],
    heal: 0,
    image: attackImg,
    rarity: "epic",
    defaultCopies: 3,
  },
  {
    id: "warrior_shield_wall",
    classKey: "warrior",
    name: "Shield Wall",
    type: "defend",
    dmg: null,
    heal: 0,
    image: shieldImg,
    rarity: "rare",
    defaultCopies: 5,
  },
  {
    id: "warrior_battle_cry",
    classKey: "warrior",
    name: "Battle Cry",
    type: "heal",
    dmg: null,
    heal: 20,
    image: healImg,
    rarity: "epic",
    defaultCopies: 2,
  },

  // --- extra warrior skillek (már elérhetőek a poolban, default deckben még nincsenek) ---

  {
    id: "warrior_cleave",
    classKey: "warrior",
    name: "Cleave",
    type: "attack",
    dmg: [7, 12],
    heal: 0,
    image: attackImg,
    rarity: "rare",
    defaultCopies: 0,
  },
  {
    id: "warrior_whirlwind",
    classKey: "warrior",
    name: "Whirlwind",
    type: "attack",
    dmg: [5, 14],
    heal: 0,
    image: attackImg,
    rarity: "epic",
    defaultCopies: 0,
  },
  {
    id: "warrior_parry",
    classKey: "warrior",
    name: "Parry",
    type: "defend",
    dmg: null,
    heal: 5,
    image: shieldImg,
    rarity: "rare",
    defaultCopies: 0,
  },
  {
    id: "warrior_last_stand",
    classKey: "warrior",
    name: "Last Stand",
    type: "heal",
    dmg: null,
    heal: 30,
    image: healImg,
    rarity: "epic",
    defaultCopies: 0,
  },
  {
    id: "warrior_crushing_blow",
    classKey: "warrior",
    name: "Crushing Blow",
    type: "attack",
    dmg: [11, 18],
    heal: 0,
    image: attackImg,
    rarity: "legendary",
    defaultCopies: 0,
  },
  {
    id: "warrior_rallying_shout",
    classKey: "warrior",
    name: "Rallying Shout",
    type: "heal",
    dmg: null,
    heal: 15,
    image: healImg,
    rarity: "rare",
    defaultCopies: 0,
  },
];

/* -------------------- VARÁZSLÓ (MAGE) -------------------- */

export const MAGE_ABILITIES = [
  {
    id: "mage_fireball",
    classKey: "mage",
    name: "Fireball",
    type: "attack",
    dmg: [8, 14],
    heal: 0,
    image: fireballImg,
    rarity: "epic",
    defaultCopies: 5,
  },
  {
    id: "mage_arcane_missiles",
    classKey: "mage",
    name: "Arcane Missiles",
    type: "attack",
    dmg: [5, 11],
    heal: 0,
    image: fireballImg,
    rarity: "common",
    defaultCopies: 6,
  },
  {
    id: "mage_mana_shield",
    classKey: "mage",
    name: "Mana Shield",
    type: "defend",
    dmg: null,
    heal: 0,
    image: shieldImg,
    rarity: "rare",
    defaultCopies: 4,
  },
  {
    id: "mage_heal_spell",
    classKey: "mage",
    name: "Heal Spell",
    type: "heal",
    dmg: null,
    heal: 22,
    image: healImg,
    rarity: "epic",
    defaultCopies: 2,
  },

  // --- extra mage skillek ---

  {
    id: "mage_frost_nova",
    classKey: "mage",
    name: "Frost Nova",
    type: "attack",
    dmg: [6, 10],
    heal: 0,
    image: fireballImg,
    rarity: "rare",
    defaultCopies: 0,
  },
  {
    id: "mage_lightning_bolt",
    classKey: "mage",
    name: "Lightning Bolt",
    type: "attack",
    dmg: [9, 16],
    heal: 0,
    image: fireballImg,
    rarity: "epic",
    defaultCopies: 0,
  },
  {
    id: "mage_arcane_surge",
    classKey: "mage",
    name: "Arcane Surge",
    type: "heal",
    dmg: null,
    heal: 15,
    image: healImg,
    rarity: "rare",
    defaultCopies: 0,
  },
  {
    id: "mage_ice_lance",
    classKey: "mage",
    name: "Ice Lance",
    type: "attack",
    dmg: [7, 12],
    heal: 0,
    image: fireballImg,
    rarity: "common",
    defaultCopies: 0,
  },
  {
    id: "mage_chain_lightning",
    classKey: "mage",
    name: "Chain Lightning",
    type: "attack",
    dmg: [10, 17],
    heal: 0,
    image: fireballImg,
    rarity: "legendary",
    defaultCopies: 0,
  },
  {
    id: "mage_drain_life",
    classKey: "mage",
    name: "Drain Life",
    type: "heal",
    dmg: [5, 18],
    heal: 18,
    image: healImg,
    rarity: "epic",
    defaultCopies: 0,
  },
];

/* -------------------- ÍJÁSZ (ARCHER) -------------------- */

export const ARCHER_ABILITIES = [
  {
    id: "archer_quick_shot",
    classKey: "archer",
    name: "Quick Shot",
    type: "attack",
    dmg: [5, 10],
    heal: 0,
    image: attackImg,
    rarity: "common",
    defaultCopies: 8,
  },
  {
    id: "archer_aimed_shot",
    classKey: "archer",
    name: "Aimed Shot",
    type: "attack",
    dmg: [7, 13],
    heal: 0,
    image: attackImg,
    rarity: "rare",
    defaultCopies: 4,
  },
  {
    id: "archer_evasion",
    classKey: "archer",
    name: "Evasion",
    type: "defend",
    dmg: null,
    heal: 0,
    image: shieldImg,
    rarity: "rare",
    defaultCopies: 4,
  },
  {
    id: "archer_healing_herbs",
    classKey: "archer",
    name: "Healing Herbs",
    type: "heal",
    dmg: null,
    heal: 18,
    image: healImg,
    rarity: "epic",
    defaultCopies: 2,
  },

  // --- extra archer skillek ---

  {
    id: "archer_poison_arrow",
    classKey: "archer",
    name: "Poison Arrow",
    type: "attack",
    dmg: [6, 11],
    heal: 0,
    image: attackImg,
    rarity: "rare",
    defaultCopies: 0,
  },
  {
    id: "archer_multi_shot",
    classKey: "archer",
    name: "Multi Shot",
    type: "attack",
    dmg: [5, 12],
    heal: 0,
    image: attackImg,
    rarity: "epic",
    defaultCopies: 0,
  },
  {
    id: "archer_snare_trap",
    classKey: "archer",
    name: "Snare Trap",
    type: "defend",
    dmg: null,
    heal: 0,
    image: shieldImg,
    rarity: "rare",
    defaultCopies: 0,
  },
  {
    id: "archer_piercing_volley",
    classKey: "archer",
    name: "Piercing Volley",
    type: "attack",
    dmg: [9, 15],
    heal: 0,
    image: attackImg,
    rarity: "epic",
    defaultCopies: 0,
  },
  {
    id: "archer_camouflage",
    classKey: "archer",
    name: "Camouflage",
    type: "defend",
    dmg: null,
    heal: 0,
    image: shieldImg,
    rarity: "epic",
    defaultCopies: 0,
  },
  {
    id: "archer_rapid_fire",
    classKey: "archer",
    name: "Rapid Fire",
    type: "attack",
    dmg: [6, 13],
    heal: 0,
    image: attackImg,
    rarity: "legendary",
    defaultCopies: 0,
  },
];

// Összefogó map classKey alapján
export const ABILITIES_BY_CLASS = {
  warrior: WARRIOR_ABILITIES,
  mage: MAGE_ABILITIES,
  archer: ARCHER_ABILITIES,
};

/**
 * Gyors lookup map: ability id -> ability objektum
 */
export const ABILITIES_BY_ID = (() => {
  const map = {};
  Object.values(ABILITIES_BY_CLASS).forEach((arr) => {
    arr.forEach((ab) => {
      map[ab.id] = ab;
    });
  });
  return map;
})();

/**
 * Visszaadja az adott kaszt ability listáját.
 */
export function getAbilitiesForClass(classKey) {
  return ABILITIES_BY_CLASS[classKey] || ABILITIES_BY_CLASS["warrior"];
}

/**
 * Generál egy alap decket az adott kaszt számára:
 * - az ability-k defaultCopies száma szerint
 * - sima tömböt ad vissza ability ID-kből (ismétlődhetnek)
 */
export function buildDefaultDeckForClass(classKey) {
  const pool = getAbilitiesForClass(classKey);
  const deck = [];
  pool.forEach((ab) => {
    const copies = ab.defaultCopies ?? 0;
    for (let i = 0; i < copies; i++) {
      deck.push(ab.id);
    }
  });
  return deck;
}
