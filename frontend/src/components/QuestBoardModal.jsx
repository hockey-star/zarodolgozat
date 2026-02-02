// frontend/src/components/QuestBoardModal.jsx
import React, { useEffect, useState, useCallback } from "react";
import QuestDetailsModal from "./QuestDetailsModal.jsx";

export default function QuestBoardModal({ playerId, playerClassId, onClose }) {
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const NORMAL_POS = [
    { top: "25%", left: "20%" },
    { top: "37%", left: "20%" },
    { top: "49%", left: "20%" },
    { top: "61%", left: "20%" },
    { top: "73%", left: "20%" },
  ];

  const CLASS_POS = { top: "50%", left: "68%" };

  const loadQuests = useCallback(async () => {
    if (!playerId) return;

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/quests/${playerId}`);
      const data = await res.json();

      const filtered = (data || []).filter(
        (q) => q.class_required === null || q.class_required === playerClassId
      );

      setQuests(filtered);

      // ✅ frissítjük a nyitott questet is
      setSelectedQuest((prev) => {
        if (!prev) return null;
        return filtered.find((x) => x.quest_id === prev.quest_id) || prev;
      });

      setErrorMsg("");
    } catch (err) {
      console.error(err);
      setErrorMsg("Nem sikerült betölteni a küldetéseket.");
    } finally {
      setLoading(false);
    }
  }, [playerId, playerClassId]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  function statusColor(q) {
    if (q.status === "completed") return "text-green-300";
    if (q.status === "in_progress") return "text-yellow-200";
    if (q.status === "locked") return "text-gray-400 opacity-60";
    if (q.status === "claimed") return "text-blue-300";
    return "text-white";
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="relative rounded-xl shadow-2xl overflow-hidden" style={{ width: "70%", height: "70%" }}>
        {/* ✅ háttér csak dísz, ne kattintható */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: 'url("./src/assets/pics/QUESTBOARD.png")' }}
        />

        <button
          onClick={onClose}
          className="absolute top-3 right-5 z-30 text-white text-2xl font-bold drop-shadow-lg hover:text-red-400"
        >
          ✕
        </button>

        <div className="absolute inset-0 z-20">
          {!loading &&
            quests.map((q, idx) => {
              const pos = q.class_required === null ? NORMAL_POS[idx] : CLASS_POS;
              if (!pos) return null;

              return (
                <button
                  key={q.pq_id ?? `${q.player_id}-${q.quest_id}`}
                  onClick={() => setSelectedQuest(q)}
                  className={`absolute z-20 text-lg font-bold cursor-pointer font-serif hover:scale-110 transition ${statusColor(q)}`}
                  style={{ top: pos.top, left: pos.left, textShadow: "2px 2px 4px black" }}
                >
                  ► {q.title}
                </button>
              );
            })}
        </div>

        {errorMsg && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 text-yellow-200 text-sm bg-black/60 px-4 py-2 rounded">
            {errorMsg}
          </div>
        )}

        {selectedQuest && (
          <QuestDetailsModal
            quest={selectedQuest}
            playerId={playerId}
            onClose={() => setSelectedQuest(null)}
            onClaimSuccess={() => {
              setSelectedQuest(null);
              loadQuests();
            }}
          />
        )}
      </div>
    </div>
  );
}
