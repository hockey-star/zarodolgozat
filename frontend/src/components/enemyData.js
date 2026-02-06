// enemyData.js

// Ezeket a listákat te használtad – meghagyom:
export const defaultEnemies = [
  "Bandit",
  "Lich Mage",
  "Ghoul",
  "Death Knight",
  "Ghost",
];

export const bossEnemies = [
  "Demon Lord",
  "Ancient Dragon",
  "Lich King",
];

export const CLASS_BOSS_MAP = {
  6: "Mountain King",          // warrior
  7: "Arcane Abomination",     // mage
  8: "Forest Spirit Beast",    // archer
};

const AFFIX_POOL = [
  { id: "vampiric", name: "Vampiric", healBase: 0.30, healPerLevel: 0.015, healCap: 0.65 },
  { id: "frenzied", name: "Frenzied", dmgMult: 1.30 },
  { id: "shielded", name: "Shielded", guardHits: 5 },
  { id: "plague_aura", name: "Plague Aura", poison: { damagePerTurn: 5, turns: 5 } },
];


function materializeAffix(a, level) {
  if (a.id !== "vampiric") return { ...a };

  const base = a.healBase ?? 0.3;
  const per = a.healPerLevel ?? 0.01;
  const cap = a.healCap ?? 0.6;

  const pct = Math.min(cap, base + Math.max(0, level - 1) * per);

  return {
    ...a,
    healPct: Number(pct.toFixed(3)), // szép + stabil
  };
}


function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function rollAffixes({ level, boss, elite }) {
  if (boss) return [];
  if (!elite) return [];

  const count = level >= 12 ? 2 : 1;

  const chosen = [];
  const used = new Set();

  while (chosen.length < count) {
    const a = pickRandom(AFFIX_POOL);
    if (used.has(a.id)) continue;
    used.add(a.id);
    chosen.push(materializeAffix(a, level));
  }
  return chosen;
}

// Lokális enemy sablonok – NEM DB-sek, csak frontendhez.
const ENEMY_TEMPLATES = [
  // ---- Normál ellenfelek ----
  {
    name: "Bandit",
    role: "normal",
    baseHp: 60,
    hpPerLevel: 5,
    baseMinDmg: 5,
    baseMaxDmg: 9,
    dmgPerLevel: 1,
    goldRewardMin: 8,
    goldRewardMax: 14,
    xpRewardMin: 20,
    xpRewardMax: 25,
  },
  {
    name: "Lich Mage",
    role: "normal",
    baseHp: 40,
    hpPerLevel: 4,
    baseMinDmg: 6,
    baseMaxDmg: 11,
    dmgPerLevel: 1,
    goldRewardMin: 9,
    goldRewardMax: 15,
    xpRewardMin: 26,
    xpRewardMax: 30,
  },
  {
    name: "Ghoul",
    role: "normal",
    baseHp: 70,
    hpPerLevel: 5,
    baseMinDmg: 5,
    baseMaxDmg: 10,
    dmgPerLevel: 1,
    goldRewardMin: 8,
    goldRewardMax: 16,
    xpRewardMin: 32,
    xpRewardMax: 37,
  },
  {
    name: "Death Knight",
    role: "normal",
    baseHp: 80,
    hpPerLevel: 6,
    baseMinDmg: 6,
    baseMaxDmg: 12,
    dmgPerLevel: 2,
    goldRewardMin: 10,
    goldRewardMax: 18,
    xpRewardMin: 30,
    xpRewardMax: 35,
  },
  {
    name: "Ghost",
    role: "normal",
    baseHp: 50,
    hpPerLevel: 4,
    baseMinDmg: 4,
    baseMaxDmg: 8,
    dmgPerLevel: 1,
    goldRewardMin: 7,
    goldRewardMax: 13,
    xpRewardMin: 30,
    xpRewardMax: 35,
  },

  // ---- Boss-ok ----
  {
    name: "Demon Lord",
    role: "boss",
    baseHp: 180,
    hpPerLevel: 8,
    baseMinDmg: 7,
    baseMaxDmg: 12,
    dmgPerLevel: 2,
    goldRewardMin: 70,
    goldRewardMax: 110,
    xpRewardMin: 90,
    xpRewardMax: 130,
  },
  {
    name: "Ancient Dragon",
    role: "boss",
    baseHp: 200,
    hpPerLevel: 9,
    baseMinDmg: 6,
    baseMaxDmg: 11,
    dmgPerLevel: 2,
    goldRewardMin: 80,
    goldRewardMax: 120,
    xpRewardMin: 1000,
    xpRewardMax: 1500,
  },
  {
    name: "Lich King",
    role: "boss",
    baseHp: 170,
    hpPerLevel: 8,
    baseMinDmg: 6,
    baseMaxDmg: 12,
    dmgPerLevel: 2,
    goldRewardMin: 85,
    goldRewardMax: 125,
    xpRewardMin: 1100,
    xpRewardMax: 1600,
  },
  {
    name: "Mountain King",
    role: "boss",
    baseHp: 2000,
    hpPerLevel: 10,
    baseMinDmg: 55,
    baseMaxDmg: 70,
    dmgPerLevel: 2,
    goldRewardMin: 120,
    goldRewardMax: 180,
    xpRewardMin: 1500,
    xpRewardMax: 2000,
  },
  {
    name: "Arcane Abomination",
    role: "boss",
    baseHp: 1700,
    hpPerLevel: 12,
    baseMinDmg: 40,
    baseMaxDmg: 50,
    dmgPerLevel: 3,
    goldRewardMin: 140,
    goldRewardMax: 200,
    xpRewardMin: 1000,
    xpRewardMax: 1300,
  },
  {
    name: "Forest Spirit Beast",
    role: "boss",
    baseHp: 1550,
    hpPerLevel: 11,
    baseMinDmg: 30,
    baseMaxDmg: 35,
    dmgPerLevel: 2,
    goldRewardMin: 130,
    goldRewardMax: 190,
    xpRewardMin: 1000,
    xpRewardMax: 1500,
  },
];
// helper: sablon keresése név alapján (most nem nagyon kell, de marad)
function findTemplate(name) {
  if (!name) return null;
  return (
    ENEMY_TEMPLATES.find(
      (e) => e.name.toLowerCase() === name.toLowerCase()
    ) || null
  );
}

/**
 * Random enemy generátor.
 *
 * param:
 *  - level
 *  - boss: ha true → boss poolból választ
 *  - elite: ha true és nem boss → +30% HP & DMG
 *  - allowedNames: ha nem üres, csak ezek közül a nevekből választ
 */
export function getRandomEnemy({
  level = 1,
  boss = false,
  elite = false,
  allowedNames = [],
  
}) {
  let pool = ENEMY_TEMPLATES.slice();

  if (boss) {
    pool = pool.filter((e) => e.role === "boss");
  } else {
    pool = pool.filter((e) => e.role === "normal");
  }

  if (allowedNames && allowedNames.length > 0) {
    pool = pool.filter((e) => allowedNames.includes(e.name));
  }

  if (pool.length === 0) {
    // fallback, hogy ne dőljön el a játék
    pool = boss
      ? ENEMY_TEMPLATES.filter((e) => e.role === "boss")
      : ENEMY_TEMPLATES.filter((e) => e.role === "normal");
  }

  const base = pool[Math.floor(Math.random() * pool.length)];

  const lvlOffset = Math.max(level - 1, 0);

  let maxHp = base.baseHp + base.hpPerLevel * lvlOffset;
  let minDmg = base.baseMinDmg + base.dmgPerLevel * lvlOffset;
  let maxDmg = base.baseMaxDmg + base.dmgPerLevel * lvlOffset;

  if (elite && !boss) {
    // 💀 ELITE BUFF: kb +30% HP & DMG
    maxHp = Math.round(maxHp * 1.3);
    minDmg = Math.round(minDmg * 1.3);
    maxDmg = Math.round(maxDmg * 1.3);
  }

  const steps = Math.max(level - 1, 0);

const hpRate = boss ? 0.04 : elite ? 0.04 : 0.04;   // 4/6/8% HP per level
const dmgRate = boss ? 0.02 : elite ? 0.04 : 0.04;  // 6/7/8% DMG per level

maxHp = Math.round(maxHp * Math.pow(1 + hpRate, steps));
minDmg = Math.round(minDmg * Math.pow(1 + dmgRate, steps));
maxDmg = Math.round(maxDmg * Math.pow(1 + dmgRate, steps));

    // ✅ AFFIX roll (és stat-affix alkalmazás)
  const affixes = rollAffixes({ level, boss, elite });

  // Frenzied -> dmg szorzó
  let finalMin = minDmg;
  let finalMax = maxDmg;

  const frenzy = affixes.find(a => a.id === "frenzied");
  if (frenzy?.dmgMult) {
    finalMin = Math.max(1, Math.round(finalMin * frenzy.dmgMult));
    finalMax = Math.max(finalMin, Math.round(finalMax * frenzy.dmgMult));
  }

  return {
    name: base.name,
    role: boss ? "boss" : elite ? "elite" : "normal",
    level,
    maxHp,
    minDmg: finalMin,
    maxDmg: finalMax,
    goldRewardMin: base.goldRewardMin,
    goldRewardMax: base.goldRewardMax,
    xpRewardMin: base.xpRewardMin,
    xpRewardMax: base.xpRewardMax,


    affixes,
  };
}
