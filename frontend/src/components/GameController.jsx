import React, { useState } from "react";
import PathChoice from "./PathChoice.jsx";
import CombatView from "./CombatView.jsx";
import { usePlayer } from "../context/PlayerContext.jsx";

// 🔹 Szintek és háttérképek (ezeket tedd be a /public/backgrounds mappába)
const LEVELS = [
  { id: 1, bg: "/backgrounds/level1.jpg", enemies: ["Erdő Goblin", "Bandita"] },
  { id: 2, bg: "/backgrounds/level2.jpg", enemies: ["Kósza Farkas", "Vadász"] },
  { id: 3, bg: "/backgrounds/level3.jpg", enemies: ["Kísértet", "Óriás Patkány"] },
  { id: 4, bg: "/backgrounds/level4.jpg", enemies: ["Druid", "Mocsári Szörny"] },
  { id: 5, bg: "/backgrounds/level5.jpg", enemies: ["Bandita Főhadnagy", "Őr"] },
  { id: 6, bg: "/backgrounds/level6.jpg", enemies: ["Néma Árny", "Dögvész"] },
  { id: 7, bg: "/backgrounds/level7.jpg", enemies: ["Vadember", "Sötét Lurkó"] },
  { id: 8, bg: "/backgrounds/level8.jpg", enemies: ["Rablók", "Ördögi Kutya"] },
  { id: 9, bg: "/backgrounds/level9.jpg", enemies: ["Fekete Lovag", "Óriás Bogár"] },
  { id: 10, bg: "/backgrounds/level10.jpg", enemies: ["Falkavezér", "Romboló"] },
  // 🔹 Boss szint
  { id: 11, bg: "/backgrounds/boss.jpg", enemies: ["Ősi Démon"], boss: true },
];

export default function GameController() {
  const { player } = usePlayer(); // ✅ fix: nem kell `?.()`
  const playerTemplate = player || { username: "Hős", base: { hp: 50, str: 5 } };

  const [levelIndex, setLevelIndex] = useState(0);
  const [view, setView] = useState("path"); // "path" | "combat" | "end"
  const [playerHP, setPlayerHP] = useState(playerTemplate.base.hp || 50);
  const [playerDead, setPlayerDead] = useState(false);

  const currentLevel = LEVELS[levelIndex];

  // 🔹 Útválasztás kezelése
  function handlePathChoose() {
    setView("combat");
  }

  // 🔹 Csata vége callback
  function handleBattleEnd(newPlayerHP, won) {
    setPlayerHP(newPlayerHP);

    if (!won || newPlayerHP <= 0) {
      setPlayerDead(true);
      setView("end");
      return;
    }

    if (levelIndex + 1 >= LEVELS.length) {
      // végigment a kampányon
      setPlayerDead(false);
      setView("end");
      return;
    }

    // tovább a következő szintre
    setLevelIndex((prev) => prev + 1);
    setView("path");
  }

  function restart() {
    setLevelIndex(0);
    setPlayerHP(playerTemplate.base.hp || 50);
    setPlayerDead(false);
    setView("path");
  }

  // 🔹 Game Over / Győzelem képernyő
  if (view === "end") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white text-center p-6">
        <h1 className="text-4xl font-bold mb-4">
          {playerDead ? "☠️ Meghaltál!" : "🏆 Győzelem!"}
        </h1>
        <p className="mb-6">
          Szinted: {levelIndex + 1} / {LEVELS.length}
        </p>
        <button
          className="px-6 py-3 bg-red-700 rounded-lg hover:bg-red-600 transition"
          onClick={restart}
        >
          Újrakezdés
        </button>
      </div>
    );
  }


if (view === "combat") {
console.log("View:", view);
console.log("Level index:", levelIndex);
console.log("Current BG:", currentLevel.bg);

}
  
  // 🔹 Fő logika
  return (
    <>
      {view === "path" && (
        <PathChoice
          key={`path-${levelIndex}`}
          onChoose={handlePathChoose}
          level={levelIndex + 1}
          background={currentLevel.bg}
        />
        
      )}
      

      {view === "combat" && (
        <CombatView
          key={`${levelIndex}-${Date.now()}`} // reset local state
          level={levelIndex + 1}
          enemies={currentLevel.enemies}
          boss={!!currentLevel.boss}
          background={currentLevel.bg}
          playerHP={playerHP}
          onEnd={handleBattleEnd}
        />
      )}
    </>
    
  );

}
