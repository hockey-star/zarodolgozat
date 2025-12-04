// frontend/src/components/QuestBoardModal.jsx
import React, { useEffect, useState } from "react";
import QuestDetailsModal from "./QuestDetailsModal.jsx";

export default function QuestBoardModal({ playerId, playerClassId, onClose }) {
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // BAL OLDALI 5 QUEST
  const NORMAL_POS = [
    { top: "25%", left: "20%" },
    { top: "37%", left: "20%" },
    { top: "49%", left: "20%" },
    { top: "61%", left: "20%" },
    { top: "73%", left: "20%" },
  ];

  // JOBB OLDALI CLASS QUEST
  const CLASS_POS = { top: "50%", left: "68%" };

  async function loadQuests() {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:3000/api/quests/${playerId}`
      );
      const data = await res.json();

      // normál + saját class quest
      const filtered = data.filter(
        (q) => q.class_required === null || q.class_required === playerClassId
      );

      setQuests(filtered);
      setErrorMsg("");
    } catch (err) {
      console.error(err);
      setErrorMsg("Nem sikerült betölteni a küldetéseket.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!playerId) return;
    loadQuests();
  }, [playerId, playerClassId]);

  function statusColor(q) {
    if (q.status === "completed") return "text-green-300";
    if (q.status === "in_progress") return "text-yellow-200";
    if (q.status === "locked") return "text-gray-400 opacity-60";
    if (q.status === "claimed") return "text-blue-300";
    return "text-white";
  }

  // ESC bezárás (ha még nincs)
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        className="relative rounded-xl shadow-2xl overflow-hidden"
        style={{
          width: "70%",
          height: "70%",
        }}
      >
        {/* Questboard kép */}
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: 'url("./src/assets/pics/QUESTBOARD.png")',
          }}
        />

        {/* X gomb */}
        <button
          onClick={onClose}
          className="absolute top-3 right-5 text-white text-2xl font-bold drop-shadow-lg hover:text-red-400"
        >
          ✕
        </button>

        {/* QUEST MARKEREK */}
        <div className="absolute inset-0 pointer-events-none">
          {!loading &&
            quests.map((q, idx) => {
              const pos =
                q.class_required === null ? NORMAL_POS[idx] : CLASS_POS;

              if (!pos) return null;

              return (
                <button
                  key={q.quest_id}
                  onClick={() => setSelectedQuest(q)}
                  className={`absolute text-lg font-bold cursor-pointer font-serif hover:scale-110 transition ${statusColor(
                    q
                  )}`}
                  style={{
                    top: pos.top,
                    left: pos.left,
                    textShadow: "2px 2px 4px black",
                    pointerEvents: "auto",
                  }}
                >
                  ► {q.title}
                </button>
              );
            })}
        </div>

        {/* ERROR */}
        {errorMsg && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-yellow-200 text-sm bg-black/60 px-4 py-2 rounded">
            {errorMsg}
          </div>
        )}

        {/* QUEST MODAL */}
        {selectedQuest && (
          <QuestDetailsModal
            quest={selectedQuest}
            playerId={playerId}
            onClose={() => setSelectedQuest(null)}
            onClaimSuccess={() => {
              setSelectedQuest(null);
              loadQuests(); // 🔥 újratöltjük a quest listát, nem reload
            }}
          />
        )}
      </div>
    </div>
  );
}
