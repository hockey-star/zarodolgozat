// frontend/src/components/QuestBoardModal.jsx
import React, { useEffect, useState } from "react";
import QuestDetailsModal from "./QuestDetailsModal.jsx";
import questBoardImg from "../assets/pics/QUESTBOARD.png"; // <-- EZ A HELYES ÚT

export default function QuestBoardModal({ playerId, playerClassId, onClose }) {
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ESC zárás
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // BAL OLDALI 5 QUEST
  const NORMAL_POS = [
    { top: "25%", left: "20%" },
    { top: "37%", left: "20%" },
    { top: "49%", left: "20%" },
    { top: "61%", left: "20%" },
    { top: "73%", left: "20%" },
  ];

  // JOBB OLDAL – 1 CLASS QUEST
  const CLASS_POS = { top: "50%", left: "68%" };

  // QUESTEK BETÖLTÉSE
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`http://localhost:3000/api/quests/${playerId}`);
        const data = await res.json();

        const filtered = data.filter(
          (q) => q.class_required === null || q.class_required == playerClassId
        );

        setQuests(filtered);
      } catch (err) {
        console.error(err);
        setErrorMsg("Nem sikerült betölteni a küldetéseket.");
      }
      setLoading(false);
    }
    load();
  }, [playerId, playerClassId]);

  function statusColor(q) {
    if (q.status === "completed") return "text-green-300";
    if (q.status === "in_progress") return "text-yellow-200";
    if (q.status === "locked") return "text-gray-400 opacity-70";
    return "text-white";
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
      <div
        className="relative rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.9)] overflow-hidden"
        style={{
          width: "60%",
          height: "60%",
          backgroundImage: `url(${questBoardImg})`, // <-- Itt tölt be helyesen
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        {/* X gomb */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-white text-2xl hover:text-red-400 font-bold z-50"
        >
          ✕
        </button>

        {/* QUEST FELIRATOK */}
        <div className="absolute inset-0 pointer-events-auto">
          {!loading &&
            quests.map((q, index) => {
              const pos =
                q.class_required === null ? NORMAL_POS[index] : CLASS_POS;

              return (
                <button
                  key={q.quest_id}
                  onClick={() => setSelectedQuest(q)}
                  className={`absolute text-md font-bold font-serif cursor-pointer hover:scale-110 transition ${statusColor(
                    q
                  )}`}
                  style={{
                    top: pos.top,
                    left: pos.left,
                    textShadow: "2px 2px 4px black",
                  }}
                >
                  ► {q.title}
                </button>
              );
            })}
        </div>

        {/* ERROR MSG */}
        {errorMsg && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-yellow-200 text-xs bg-black/60 px-3 py-1 rounded">
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
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}
