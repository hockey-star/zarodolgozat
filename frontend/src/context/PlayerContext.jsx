// frontend/src/context/PlayerContext.jsx
import { createContext, useContext, useState } from "react";

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(null);

  // XP kalkuláció (könnyen állítható)
  function xpForLevel(level) {
    return 100 * level;
  }

  function addXP(amount) {
    setPlayer((prev) => {
      if (!prev) return prev;

      let xp = prev.xp + amount;
      let level = prev.level;
      let statPoints = prev.statPoints ?? 0;
      let xpNeeded = xpForLevel(level);

      // Szintlépés ciklus (ha sok XP jön egyszerre)
      while (xp >= xpNeeded) {
        xp -= xpNeeded;
        level += 1;
        statPoints += 3;
        xpNeeded = xpForLevel(level);
      }

      return {
        ...prev,
        xp,
        level,
        statPoints,
      };
    });
  }

  function addGold(amount) {
    setPlayer((prev) =>
      !prev ? prev : { ...prev, gold: prev.gold + amount }
    );
  }

  // Stat növelés (STR / INT / DEF / HP)
function increaseStat(stat) {
  setPlayer((prev) => {
    if (!prev) return prev;
    if ((prev.unspentStatPoints || 0) <= 0) return prev;

    let update = {};

    if (stat === "strength") update.strength = prev.strength + 1;
    if (stat === "intellect") update.intellect = prev.intellect + 1;
    if (stat === "defense") update.defense = prev.defense + 1;

    if (stat === "hp") {
      update.max_hp = prev.max_hp + 5;
      update.hp = prev.max_hp + 5; // full heal
    }

    return {
      ...prev,
      ...update,
      unspentStatPoints: prev.unspentStatPoints - 1,
    };
  });
}
  return (
    <PlayerContext.Provider
      value={{
        player,
        setPlayer,
        addXP,
        addGold,
        increaseStat,
        xpForLevel,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
