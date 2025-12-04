// frontend/src/components/StatModal.jsx
import React, { useState } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";
import Cim from "../Cim.jsx";

function xpToNextLevel(level) {
  if (level <= 1) return 30;
  return 30 + (level - 1) * 20;
}

export default function StatModal({ onClose }) {
  const { player, setPlayer } = usePlayer() || {};

  if (!player) return null;

  const [saving, setSaving] = useState(false);

  const unspent = player.unspentStatPoints ?? 0;

  async function handlePlus(stat) {
    if (unspent <= 0) return;

    let updated = { ...player };

    if (stat === "strength") updated.strength += 1;
    if (stat === "intellect") updated.intellect += 1;
    if (stat === "defense") updated.defense += 1;
    if (stat === "hp") {
      updated.max_hp += 5;
      updated.hp = updated.max_hp; // Full heal a stat növelésnél
    }

    updated.unspentStatPoints -= 1;

    // FRONTEND: update local
    setPlayer(updated);

    // BACKEND: save to DB
    setSaving(true);
    await fetch(`http://localhost:3000/api/players/${player.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setSaving(false);
  }

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-xl w-1/2 text-white">
        <h2 className="text-xl font-bold mb-4 text-center">Stat Fejlesztés</h2>

        <div className="mb-2 text-center">
          Szint: {player.level} — XP: {player.xp} / {xpToNextLevel(player.level)}
        </div>

        <div className="mb-6 text-center text-green-400">
          Elosztható pontok: {unspent}
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <StatRow
            label="Erő (STR)"
            value={player.strength}
            onPlus={() => handlePlus("strength")}
            disabled={unspent <= 0 || saving}
          />
          <StatRow
            label="Intelligencia (INT)"
            value={player.intellect}
            onPlus={() => handlePlus("intellect")}
            disabled={unspent <= 0 || saving}
          />
          <StatRow
            label="Védelem (DEF)"
            value={player.defense}
            onPlus={() => handlePlus("defense")}
            disabled={unspent <= 0 || saving}
          />
          <StatRow
            label="Életerő (Max HP +5)"
            value={player.max_hp}
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
