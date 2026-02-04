// GameController.jsx
import React, { useState } from "react";
import PathChoice from "./PathChoice";
import CombatView from "./CombatView";
import RestCampfire from "./RestCampfire";

const MAX_HP = 120;
const MAX_WAVES = 16;

export default function GameController() {
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [level, setLevel] = useState(1); // nálad ez a wave (1..16)
  const [view, setView] = useState("path"); // "path" | "combat" | "rest"
  const [pendingCombatProps, setPendingCombatProps] = useState(null); // { level, boss }
  const [message, setMessage] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [combatProps, setCombatProps] = useState(null);

  // Quest battle indítása:
function startQuestBattle(quest) {
  // itt eldöntöd melyik enemy legyen
  // class quest esetén:
  const bossNameByClass = {
    6: "Mountain King",
    7: "Arcane Abomination",
    8: "Forest Spirit Beast",
  };

  const enemyName =
    quest.class_required ? bossNameByClass[Number(quest.class_required)] : "Bandit"; // példa

  setCombatProps({
    level: quest.recommended_level ?? 1,   // vagy player.level
    boss: true,
    enemies: [enemyName],
    pathType: "quest",
    wave: 1,
    maxWaves: 1,
  });

  setView("combat");
}

  function goHubWithFullHeal() {
    setPlayerHP(MAX_HP);
    setPendingCombatProps(null);
    setView("path");     // ha van külön hub view: setView("hub")
    setLevel(1);         // új run 1-ről
    setMessage("Visszatértél a hubba. Teljesen felgyógyultál.");
    setTimeout(() => setMessage(null), 1800);
  }

  // Called by CombatView when a fight ends:
  // newHP - maradt HP (vagy fullMax run-endnél), victory - boolean (enemy dead)
  function handleBattleEnd(newHP, victory) {
    setPlayerHP(newHP);
    setPendingCombatProps(null);

    // defeat -> hub heal
    if (!victory) {
      setMessage("Legyőztek... vissza a hubba.");
      setTimeout(() => setMessage(null), 1800);
      goHubWithFullHeal();
      return;
    }

    // 16. wave victory -> hub heal
    if (level >= MAX_WAVES) {
      setMessage("Győzelem! Visszatérés a hubba.");
      setTimeout(() => setMessage(null), 1800);
      goHubWithFullHeal();
      return;
    }

    // nem run end -> következő wave + path
    setLevel((prev) => prev + 1);
    setView("path");
    setMessage("Győzelem! Tovább a következő szintre.");
    setTimeout(() => setMessage(null), 1400);
  }

  function handlePathChoose(payload) {
    setMessage(null);

    // PathChoice nálad objektumot küld: { type }
    const choice = typeof payload === "string" ? payload : payload?.type;
    if (!choice) return;

    if (choice === "fight") {
      setPendingCombatProps({ level, boss: false });
      setView("combat");
      return;
    }

    if (choice === "elite") {
      setPendingCombatProps({ level, boss: true });
      setView("combat");
      return;
    }

    if (choice === "rest") {
      setView("rest");
      return;
    }

    if (choice === "mystery") {
      const r = Math.random();

      if (r < 0.3333) {
        setMessage("Rejtély: veszély! Harc következik!");
        setPendingCombatProps({ level, boss: false });
        setTimeout(() => setView("combat"), 800);
        return;
      } else if (r < 0.6666) {
        const healAmount = Math.floor(10 + Math.random() * 20);
        const newHP = Math.min(MAX_HP, playerHP + healAmount);
        setPlayerHP(newHP);
        setMessage(`Találtál egy gyógyforrást: +${healAmount} HP (most ${newHP}/${MAX_HP})`);
        setTimeout(() => setMessage(null), 2200);
        return;
      } else {
        const lootItems = ["Bronz érem", "Gyógyital", "Véletlenszerű relikvia"];
        const item = lootItems[Math.floor(Math.random() * lootItems.length)];
        setInventory((prev) => [...prev, item]);
        setMessage(`Szerencse: találtál egy tárgyat: ${item}`);
        setTimeout(() => setMessage(null), 2200);
        return;
      }
    }
  }

  return (
    <div className="min-h-screen w-full relative">
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

      {view === "path" && <PathChoice onChoose={handlePathChoose} level={level} />}

      {view === "rest" && (
        <RestCampfire
          level={level}
          onBackToPath={() => setView("path")} // ✅ ugyanarra a wave-re
          onGoHub={goHubWithFullHeal}          // ✅ hub + full heal
        />
      )}
      {view === "hub" && <Hub onStartQuestBattle={startQuestBattle} />}

      {view === "combat" && combatProps && (
      <CombatView
        level={combatProps.level}
        boss={combatProps.boss}
        enemies={combatProps.enemies}
        pathType={combatProps.pathType}
        wave={combatProps.wave}
        maxWaves={combatProps.maxWaves}
        onEnd={() => {
          // quest battle után vissza hubba
          setView("hub");
          setCombatProps(null);
        }}
      />
    )}

      {view === "combat" && pendingCombatProps && (
        <CombatView
          // ✅ FONTOS: Date.now() NINCS! különben folyton remount = reset
          level={pendingCombatProps.level}
          boss={pendingCombatProps.boss}
          wave={level}
          playerHP={playerHP}
          maxWaves={MAX_WAVES}
          onEnd={(newHP, victory) => handleBattleEnd(newHP, victory)}
        />
      )}
    </div>
  );
}
