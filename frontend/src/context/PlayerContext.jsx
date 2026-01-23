// frontend/src/context/PlayerContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

const PlayerContext = createContext(null);

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(null);

  // ✅ item bónuszok külön (zárójeles + kijelzéshez)
  const [itemBonuses, setItemBonuses] = useState({
    strength: 0,
    intellect: 0,
    defense: 0,
    hp: 0,
  });

  // ✅ final statok (base + item) – CombatView / StatModal használja
const [derivedStats, setDerivedStats] = useState(null);

  // ===== Mage mana (CombatView használja) =====
  const MAGE_MANA_MAX = 6;
  const [mageMana, setMageMana] = useState(0);

  const gainMageMana = useCallback((amount = 1) => {
    setMageMana((prev) => Math.min(MAGE_MANA_MAX, (prev || 0) + amount));
  }, []);

  const spendAllMageMana = useCallback(() => {
    setMageMana(0);
  }, []);

  // ✅ effectiveStats: ha derived még nincs, fallback a player base-re
 const effectiveStats = useMemo(() => {
  if (!player) return null;

  if (!derivedStats) {
    return {
      strength: safeNum(player.strength, 0),
      intellect: safeNum(player.intellect, 0),
      defense: safeNum(player.defense, 0),
      hp: safeNum(player.hp, 0),
      max_hp: safeNum(player.max_hp, 0),
    };
  }

  return {
    strength: safeNum(derivedStats.strength, safeNum(player.strength, 0)),
    intellect: safeNum(derivedStats.intellect, safeNum(player.intellect, 0)),
    defense: safeNum(derivedStats.defense, safeNum(player.defense, 0)),
    hp: safeNum(derivedStats.hp, safeNum(player.hp, 0)),
    max_hp: safeNum(derivedStats.max_hp, safeNum(player.max_hp, 0)),
  };
}, [player, derivedStats]);


  // ✅ FULL STATS FRISSÍTÉS BACKENDRŐL
  // Backend válasz: { playerMeta, base, bonus, final }
// frontend/src/context/PlayerContext.jsx
const refreshFullStats = useCallback(async (playerId) => {
  if (!playerId) return;

  const res = await fetch(`http://localhost:3000/api/player/${playerId}/full-stats`);
  if (!res.ok) throw new Error("full-stats fetch error");
  const data = await res.json();

  const final = data?.final ?? {};
  const bonus = data?.bonus ?? {};

  setDerivedStats({
    strength: Number(final?.strength ?? 0),
    intellect: Number(final?.intellect ?? 0),
    defense: Number(final?.defense ?? 0),
    hp: Number(final?.hp ?? 0),
    max_hp: Number(final?.max_hp ?? 0),
  });

  setItemBonuses({
    strength: Number(bonus?.strength ?? 0) || 0,
    intellect: Number(bonus?.intellect ?? 0) || 0,
    defense: Number(bonus?.defense ?? 0) || 0,
    hp: Number(bonus?.hp ?? 0) || 0,
  });
}, []);

  // ✅ amikor player.id megvan, kérjük le a full-stats-ot
  useEffect(() => {
    if (!player?.id) return;
    refreshFullStats(player.id).catch((e) => console.error(e));
  }, [player?.id, refreshFullStats]);

  const value = useMemo(
    () => ({
      player,
      setPlayer,

      // statok
      itemBonuses,
      derivedStats,
      effectiveStats,
      refreshFullStats,

      // mana (CombatView)
      mageMana,
      setMageMana,
      gainMageMana,
      spendAllMageMana,
      MAGE_MANA_MAX,
    }),
    [
      player,
      itemBonuses,
      derivedStats,
      effectiveStats,
      refreshFullStats,
      mageMana,
      gainMageMana,
      spendAllMageMana,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
