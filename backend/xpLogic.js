// backend/xpLogic.js

function xpToNextLevel(level) {
  if (level <= 1) return 30;
  return 30 + (level - 1) * 20;   // ugyanaz mint frontenden
}

function applyXpGain(oldLevel, oldXp, xpGain) {
  let level = oldLevel ?? 1;
  let xp = (oldXp ?? 0) + (xpGain ?? 0);
  let levelsGained = 0;

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    levelsGained += 1;
  }

  const addedStatPoints = levelsGained * 3;

  return { level, xp, levelsGained, addedStatPoints };
}

module.exports = {
  xpToNextLevel,
  applyXpGain,
};
