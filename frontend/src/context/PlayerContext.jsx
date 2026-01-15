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
  const [derivedStats, setDerivedStats] = useState({
    strength: 0,
    intellect: 0,
    defense: 0,
    hp: 0,
    max_hp: 0,
  });

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

    const baseStr = safeNum(player.strength, 0);
    const baseInt = safeNum(player.intellect, 0);
    const baseDef = safeNum(player.defense, 0);
    const baseHp = safeNum(player.hp, 0);
    const baseMaxHp = safeNum(player.max_hp, 0);

    const hasDerived =
      derivedStats &&
      (typeof derivedStats.strength === "number" ||
        typeof derivedStats.intellect === "number" ||
        typeof derivedStats.defense === "number");

    if (!hasDerived) {
      return {
        strength: baseStr,
        intellect: baseInt,
        defense: baseDef,
        hp: baseHp,
        max_hp: baseMaxHp,
      };
    }

    return {
      strength: safeNum(derivedStats.strength, baseStr),
      intellect: safeNum(derivedStats.intellect, baseInt),
      defense: safeNum(derivedStats.defense, baseDef),
      hp: safeNum(derivedStats.hp, baseHp),
      max_hp: safeNum(derivedStats.max_hp, baseMaxHp),
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

  // ✅ támogatjuk mindkét formátumot:
  // 1) új: { player, base, bonus, final } vagy { playerMeta, base, bonus, final }
  // 2) régi: { strength, intellect, defense, hp, max_hp, bonuses }
  const final = data?.final ?? data ?? {};
  const bonus = data?.bonus ?? data?.bonuses ?? {};

  const finalStr = Number(final?.strength ?? 0);
  const finalInt = Number(final?.intellect ?? 0);
  const finalDef = Number(final?.defense ?? 0);
  const finalHp  = Number(final?.hp ?? 0);
  const finalMaxHp = Number(final?.max_hp ?? 0);

 setDerivedStats({
  strength: finalStr,
  intellect: finalInt,
  defense: finalDef,
  hp: safeNum(player?.hp, 0), // ✅ current HP csak playerből
  max_hp: Number.isFinite(finalMaxHp) ? finalMaxHp : safeNum(player?.max_hp, 0)
});

  // ✅ bonus: ha backend küldi, azt használjuk
  const backendBonuses = {
    strength: Number(bonus?.strength ?? 0) || 0,
    intellect: Number(bonus?.intellect ?? 0) || 0,
    defense: Number(bonus?.defense ?? 0) || 0,
    hp: Number(bonus?.hp ?? 0) || 0,
  };

  setItemBonuses(backendBonuses);

  // ✅ playerben csak HP/max_hp-t szinkronizálunk,
  // és itt prev-ből számoljuk a "fallback" bónuszt ha kellene
  setPlayer((prev) => {
    if (!prev) return prev;

    // ha a backend valamiért nem küldött bonus-t, itt tudnánk számolni prev alapján,
    // de most a backendBonuses-t használjuk.

    return {
      ...prev,
      max_hp: Number.isFinite(finalMaxHp) ? finalMaxHp : prev.max_hp,
     
    };
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
