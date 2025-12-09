// frontend/src/components/QuestDetailsModal.jsx
import React, { useState } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";

export default function QuestDetailsModal({
  quest,
  onClose,
  onClaimSuccess,
  playerId,
}) {
  const [msg, setMsg] = useState("");
  const { setPlayer } = usePlayer();   // ⬅⬅⬅ EZ HIÁNYZOTT

  async function handleClaim() {
    setMsg("");

    try {
      const res = await fetch("http://localhost:3000/api/quests/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: playerId,
          questId: quest.quest_id,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setMsg(data.error || "Nem sikerült claimelni.");
        return;
      }

      setMsg("✅ Jutalom átvéve!");

      // 🔄 játékos újratöltése a szerverről
      try {
        const fresh = await fetch(
          `http://localhost:3000/api/players/${playerId}`
        ).then((r) => r.json());

        // ⚠ csak azt írjuk felül, amit biztosan visszakapunk
        setPlayer((prev) =>
          !prev
            ? prev
            : {
                ...prev,
                xp: fresh.xp,
                level: fresh.level,
                gold: fresh.gold,
                // ha majd a backendben visszaküldöd:
                // unspentStatPoints: fresh.unspentStatPoints ?? prev.unspentStatPoints,
              }
        );
      } catch (e) {
        console.error("Player refresh error:", e);
      }

      if (onClaimSuccess) onClaimSuccess(quest.quest_id);
    } catch (err) {
      console.error("Claim error:", err);
      setMsg("Hiba történt a claim során.");
    }
  }

  const canClaim = quest.status === "completed";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#3a2615] text-yellow-200 border border-yellow-700 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.9)] p-6 w-[420px] font-serif relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-yellow-300 hover:text-red-400 text-lg"
        >
          ✕
        </button>

        <h2 className="text-2xl text-center mb-3 text-amber-300">
          {quest.title}
        </h2>

        <div className="text-xs text-yellow-300/80 mb-1">Leírás:</div>
        <p className="text-sm mb-3 text-yellow-100">
          {quest.description}
        </p>

        <div className="text-xs text-yellow-300/80 mb-1">Cél:</div>
        <div className="text-sm mb-3">
          {quest.task_type === "kill" && "Ölj meg ellenfeleket."}
          {quest.task_type === "boss" && "Győzz le egy főellenséget."}
          {quest.task_type === "custom" &&
            "Teljesítsd a speciális feltételt."}
        </div>

        <div className="text-xs mb-3">
          Haladás: {quest.progress}/{quest.target_amount}
        </div>

        <div className="mb-4 text-sm">
          <div className="text-xs text-yellow-300/80 mb-1">
            Jutalom:
          </div>
          <div className="flex flex-col">
            <span className="text-green-300">+{quest.reward_xp} XP</span>
            <span className="text-yellow-300">
              +{quest.reward_gold} arany
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs"
          >
            Bezárás
          </button>

          {quest.status === "locked" && (
            <span className="text-xs text-gray-300">🔒 Még zárolva</span>
          )}

          {quest.status === "in_progress" && (
            <span className="text-xs text-amber-200">
              ⏳ Folyamatban – harcolj tovább!
            </span>
          )}

          {quest.status === "claimed" && (
            <span className="text-xs text-blue-300">
              🏁 Már átvetted
            </span>
          )}

          {canClaim && (
            <button
              onClick={handleClaim}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-xs text-black"
            >
              Jutalom átvétele
            </button>
          )}
        </div>

        {msg && (
          <div className="mt-3 text-center text-xs text-amber-200">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
