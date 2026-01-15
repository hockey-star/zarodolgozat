// frontend/src/components/StatModal.jsx
import React, { useMemo, useState } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";

function xpToNextLevel(level) {
  if (level <= 1) return 30;
  return 30 + (level - 1) * 20;
}

function formatWithBonus(finalValue, bonus) {
  const b = Number(bonus) || 0;
  if (!b) return `${finalValue}`;
  return `${finalValue} (+${b})`;
}

export default function StatModal({ onClose }) {
  const { player, setPlayer, effectiveStats, itemBonuses, refreshFullStats } = usePlayer() || {};
  const [saving, setSaving] = useState(false);

  if (!player) return null;

  const unspent = player.unspentStatPoints ?? 0;

  // ✅ itt is a final statokat mutatjuk (és zárójelben a bónuszt)
  const view = useMemo(() => {
    const finalStr = effectiveStats?.strength ?? (player.strength ?? 0);
    const finalInt = effectiveStats?.intellect ?? (player.intellect ?? 0);
    const finalDef = effectiveStats?.defense ?? (player.defense ?? 0);
    const finalHp = effectiveStats?.hp ?? (player.hp ?? 0);
    const finalMaxHp = effectiveStats?.max_hp ?? (player.max_hp ?? 0);

    return {
      strText: formatWithBonus(finalStr, itemBonuses?.strength ?? 0),
      intText: formatWithBonus(finalInt, itemBonuses?.intellect ?? 0),
      defText: formatWithBonus(finalDef, itemBonuses?.defense ?? 0),
      hpText: `${finalHp} / ${finalMaxHp}${(itemBonuses?.hp ?? 0) ? ` (+${itemBonuses.hp})` : ""}`,
      maxHpFinal: finalMaxHp,
    };
  }, [effectiveStats, player, itemBonuses]);

  async function handlePlus(stat) {
    if (unspent <= 0 || saving) return;

    // ⚠️ FONTOS: a DB-ben a BASE statot növeljük!
    const updated = { ...player };

    if (stat === "strength") updated.strength = (updated.strength ?? 0) + 1;
    if (stat === "intellect") updated.intellect = (updated.intellect ?? 0) + 1;
    if (stat === "defense") updated.defense = (updated.defense ?? 0) + 1;
   if (stat === "hp") {
  const bonusHp = Number(itemBonuses?.hp) || 0;

  // final max_hp (amit a UI mutat)
  const finalMaxHp = effectiveStats?.max_hp ?? player.max_hp ?? 0;

  // ✅ BASE max_hp = final - item bonus
  const baseMaxHp = Math.max(0, finalMaxHp - bonusHp);

  const newBaseMaxHp = baseMaxHp + 5;

  updated.max_hp = newBaseMaxHp;

  // ha akarsz "full heal"-t statoláskor, akkor base-re healelj:
  updated.hp = newBaseMaxHp; 
  // (ha nem akarsz heal-t, akkor inkább:)
  // updated.hp = Math.min(updated.hp ?? 0, newBaseMaxHp);
}

    updated.unspentStatPoints = (updated.unspentStatPoints ?? 0) - 1;

    // local
    setPlayer(updated);

    // db save
    try {
      setSaving(true);
      const res = await fetch(`http://localhost:3000/api/players/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Stat save failed");

      // ✅ statok újraszámolása (base + item)
      await refreshFullStats(player.id);
    } catch (e) {
      console.error(e);
      alert("Nem sikerült menteni a statokat.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-xl w-1/2 text-white">
        <h2 className="text-xl font-bold mb-4 text-center">Stat Fejlesztés</h2>

        <div className="mb-2 text-center">
          Szint: {player.level} — XP: {player.xp} / {xpToNextLevel(player.level)}
        </div>

        <div className="mb-3 text-center text-cyan-200 font-mono">
          HP: {view.hpText}
        </div>

        <div className="mb-6 text-center text-green-400">
          Elosztható pontok: {unspent}
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <StatRow
            label="Erő (STR)"
            value={view.strText}
            onPlus={() => handlePlus("strength")}
            disabled={unspent <= 0 || saving}
          />
          <StatRow
            label="Intelligencia (INT)"
            value={view.intText}
            onPlus={() => handlePlus("intellect")}
            disabled={unspent <= 0 || saving}
          />
          <StatRow
            label="Védelem (DEF)"
            value={view.defText}
            onPlus={() => handlePlus("defense")}
            disabled={unspent <= 0 || saving}
          />
          <StatRow
            label="Életerő (Max HP +5)"
            value={`${view.maxHpFinal}`}
            onPlus={() => handlePlus("hp")}
            disabled={unspent <= 0 || saving}
          />
        </div>

        <div className="mt-6 text-center">
          <button
            className="px-6 py-2 bg-red-700 rounded-xl hover:bg-red-600"
            onClick={onClose}
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, onPlus, disabled }) {
  return (
    <div className="bg-black/40 border border-gray-700 rounded p-3">
      <div className="mb-2 font-semibold">{label}</div>
      <div className="mb-3 text-xl">{value}</div>
      <button
        onClick={onPlus}
        disabled={disabled}
        className={`px-3 py-1 rounded ${
          disabled
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-emerald-700 hover:bg-emerald-600"
        }`}
      >
        +
      </button>
    </div>
  );
}
