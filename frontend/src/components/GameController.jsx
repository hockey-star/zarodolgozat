import React, { useState } from "react";
import CombatView from "./CombatView";

export default function GameController() {
  const [playerHP, setPlayerHP] = useState(120);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [inCombat, setInCombat] = useState(true); // kezdés

  function handleBattleEnd(newHP, victory) {
    setPlayerHP(newHP); // megmarad az aktuális HP
    setInCombat(false);

    if (victory) setCurrentLevel(prev => prev + 1);
  }

  return (
    <div>
      {inCombat ? (
        <CombatView
          level={currentLevel}
          boss={false}
          playerHP={playerHP}      // aktuális HP átadása
          onEnd={handleBattleEnd}  // battle vége callback
        />
      ) : (
        <div className="text-center mt-12">
          <h2 className="text-2xl mb-4">Válassz ösvényt a következő körre</h2>
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
            onClick={() => setInCombat(true)}
          >
            Új harc
          </button>
          <div className="mt-4">Jelenlegi HP: {playerHP}</div>
        </div>
      )}
    </div>
  );
}
