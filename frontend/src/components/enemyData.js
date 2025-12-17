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

// Lokális enemy sablonok – NEM DB-sek, csak frontendhez.
const ENEMY_TEMPLATES = [
  // ---- Normál ellenfelek ----
  {
    name: "Bandit",
    role: "normal",
    baseHp: 35,
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
    baseHp: 32,
    hpPerLevel: 4,
    baseMinDmg: 6,
    baseMaxDmg: 11,
    dmgPerLevel: 1,
    goldRewardMin: 9,
    goldRewardMax: 15,
    xpRewardMin: 20,
    xpRewardMax: 25,
  },
  {
    name: "Ghoul",
    role: "normal",
    baseHp: 40,
    hpPerLevel: 5,
    baseMinDmg: 5,
    baseMaxDmg: 10,
    dmgPerLevel: 1,
    goldRewardMin: 8,
    goldRewardMax: 16,
    xpRewardMin: 20,
    xpRewardMax: 25,
  },
  {
    name: "Death Knight",
    role: "normal",
    baseHp: 45,
    hpPerLevel: 6,
    baseMinDmg: 6,
    baseMaxDmg: 12,
    dmgPerLevel: 2,
    goldRewardMin: 10,
    goldRewardMax: 18,
    xpRewardMin: 20,
    xpRewardMax: 25,
  },
  {
    name: "Ghost",
    role: "normal",
    baseHp: 30,
    hpPerLevel: 4,
    baseMinDmg: 4,
    baseMaxDmg: 8,
    dmgPerLevel: 1,
    goldRewardMin: 7,
    goldRewardMax: 13,
    xpRewardMin: 20,
    xpRewardMax: 25,
  },

  // ---- Boss-ok ----
  {
    name: "Demon Lord",
    role: "boss",
    baseHp: 130,
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
    baseHp: 150,
    hpPerLevel: 9,
    baseMinDmg: 6,
    baseMaxDmg: 11,
    dmgPerLevel: 2,
    goldRewardMin: 80,
    goldRewardMax: 120,
    xpRewardMin: 100,
    xpRewardMax: 150,
  },
  {
    name: "Lich King",
    role: "boss",
    baseHp: 120,
    hpPerLevel: 8,
    baseMinDmg: 6,
    baseMaxDmg: 12,
    dmgPerLevel: 2,
    goldRewardMin: 85,
    goldRewardMax: 125,
    xpRewardMin: 110,
    xpRewardMax: 160,
  },
  {
    name: "Mountain King",
    role: "boss",
    baseHp: 200,
    hpPerLevel: 10,
    baseMinDmg: 15,
    baseMaxDmg: 25,
    dmgPerLevel: 2,
    goldRewardMin: 120,
    goldRewardMax: 180,
    xpRewardMin: 150,
    xpRewardMax: 200,
  },
  {
    name: "Arcane Abomination",
    role: "boss",
    baseHp: 150,
    hpPerLevel: 12,
    baseMinDmg: 18,
    baseMaxDmg: 28,
    dmgPerLevel: 3,
    goldRewardMin: 140,
    goldRewardMax: 200,
    xpRewardMin: 170,
    xpRewardMax: 230,
  },
  {
    name: "Forest Spirit Beast",
    role: "boss",
    baseHp: 180,
    hpPerLevel: 11,
    baseMinDmg: 14,
    baseMaxDmg: 23,
    dmgPerLevel: 2,
    goldRewardMin: 130,
    goldRewardMax: 190,
    xpRewardMin: 160,
    xpRewardMax: 210,
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

  return {
    name: base.name,
    role: boss ? "boss" : elite ? "elite" : "normal",
    level,
    maxHp,
    minDmg,
    maxDmg,
    goldRewardMin: base.goldRewardMin,
    goldRewardMax: base.goldRewardMax,
    xpRewardMin: base.xpRewardMin,
    xpRewardMax: base.xpRewardMax,
  };
}
