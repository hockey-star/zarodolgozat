// GameController.jsx
import React, { useState } from "react";
import PathChoice from "./PathChoice";
import CombatView from "./CombatView";

/*
  Fő vezérlő:
  - playerHP állapotot tart fenn és továbbadja a CombatView-nek
  - kezeli a PathChoice választását (fight / elite / mystery)
  - a mystery esetén kisorsol: fight / heal / loot (~33% mindegy)
*/

const MAX_HP = 120;

export default function GameController() {
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [level, setLevel] = useState(1);
  const [view, setView] = useState("path"); // "path" | "combat"
  const [pendingCombatProps, setPendingCombatProps] = useState(null); // { level, boss }
  const [message, setMessage] = useState(null);
  const [inventory, setInventory] = useState([]);

  // Called by CombatView when a fight ends:
  // newHP - maradt HP, victory - boolean (enemy dead)
  function handleBattleEnd(newHP, victory) {
    setPlayerHP(newHP);
    setPendingCombatProps(null);
    setView("path");

    if (victory) {
      setLevel(prev => prev + 1);
      setMessage("Győzelem! Tovább a következő szintre.");
      setTimeout(() => setMessage(null), 1800);
    } else {
      setMessage("Legyőztek... vége a játéknak.");
      // itt további game-over logika jöhet
    }
  }

  // PathChoice visszahívása
  function handlePathChoose(choice) {
    setMessage(null);

    if (choice === "fight") {
      setPendingCombatProps({ level, boss: false });
      setView("combat");
      return;
    }

    if (choice === "elite") {
      // elite = erősebb prune: boss true
      setPendingCombatProps({ level, boss: true });
      setView("combat");
      return;
    }

    if (choice === "mystery") {
      // Mystery: 3 lehetséges eredmény ~33% each
      const r = Math.random();
      if (r < 0.3333) {
        // mystery -> fight
        setMessage("Rejtély: veszély! Harc következik!");
        setPendingCombatProps({ level, boss: false });
        setTimeout(() => setView("combat"), 800);
        return;
      } else if (r < 0.6666) {
        // mystery -> heal
        const healAmount = Math.floor(10 + Math.random() * 20); // 10..29 HP
        const newHP = Math.min(MAX_HP, playerHP + healAmount);
        setPlayerHP(newHP);
        setMessage(`Találtál egy gyógyforrást: +${healAmount} HP (most ${newHP}/${MAX_HP})`);
        setTimeout(() => setMessage(null), 2200);
        return;
      } else {
        // mystery -> loot
        // egyszerű loot példa — később lehet bővíteni
        const lootItems = ["Bronz érem", "Gyógyital", "Véletlenszerű relikvia"];
        const item = lootItems[Math.floor(Math.random() * lootItems.length)];
        setInventory(prev => [...prev, item]);
        setMessage(`Szerencse: találtál egy tárgyat: ${item}`);
        setTimeout(() => setMessage(null), 2200);
        return;
      }
    }
  }

  return (
    <div className="min-h-screen w-full relative">
      {/* felső állapot / üzenet */}
      <div className="p-4 flex items-center justify-between max-w-6xl mx-auto">
        <div>
          <strong>Szint:</strong> {level}
        </div>
        <div>
          <strong>HP:</strong> {playerHP} / {MAX_HP}
        </div>
        <div>
          <strong>Inventory:</strong> {inventory.length > 0 ? inventory.join(", ") : "üres"}
        </div>
      </div>

      {message && (
        <div className="max-w-4xl mx-auto text-center bg-black/60 text-white rounded p-3 mb-4">
          {message}
        </div>
      )}

      {view === "path" && (
        <PathChoice onChoose={handlePathChoose} level={level} />
      )}

      {view === "combat" && pendingCombatProps && (
        <CombatView
          key={`${level}-${pendingCombatProps.boss ? "boss" : "fight"}-${Date.now()}`}
          level={pendingCombatProps.level}
          boss={pendingCombatProps.boss}
          playerHP={playerHP}
          onEnd={(newHP, victory) => handleBattleEnd(newHP, victory)}
        />
      )}
    </div>
  );
}
