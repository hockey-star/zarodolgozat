import React, { useState, useRef } from "react";
import PathChoice from "./PathChoice";
import CombatView from "./CombatView";
import EventView from "./EventView";
import TransitionOverlay from "./TransitionOverlay";
import LoadingScreen from "./LoadingScreen";

import wizardBg from "../assets/pics/EVENT_WIZARD_PLACEHOLDER.png";
import combatIntroVideo from "../assets/transitions/combat-intro.webm";

const EVENT_CHANCE = 1.0; // TESZTHEZ 100% esély
const EVENT_POOL = [
  {
    id: "wizard",
    title: "Vándor varázsló",
    story:
      "Az út porában egy köpenyes varázsló lép eléd. Egy fiolát tart feléd.\n\n„Erőt ad… vagy elátkoz.”",
    background: wizardBg,
    choices: [
      {
        label: "Megiszom",
        resolve: () => {
          if (Math.random() < 0.7) return { dmgMult: 1.5, pathsLeft: 3 };
          return { poisonTurns: 3, pathsLeft: 5 };
        },
      },
      { label: "Elutasítom", resolve: () => null },
    ],
  },
];

export default function RunView() {
  const [screen, setScreen] = useState("path"); // path | loading | event | combat
  const [level, setLevel] = useState(1);
  const [activeEvent, setActiveEvent] = useState(null);
  const [runEffect, setRunEffect] = useState(null);
  const [pendingPath, setPendingPath] = useState(null);

  const loadingLockRef = useRef(false); // ✅ egyszeri hívás biztosítás
  const [showTransition, setShowTransition] = useState(false);

  function handlePathChoose(choice) {
    setPendingPath(choice);
    setScreen("loading");
    loadingLockRef.current = false; // reset lock minden új pathnál
  }

  function handleEventChoice(choice) {
    const effect = choice.resolve();
    if (effect) setRunEffect(effect);

    setActiveEvent(null);
    startCombat();
  }

  function startCombat() {
    setScreen("combat");
    setShowTransition(true);
  }

  function handleCombatEnd(victory) {
    if (victory) {
      setLevel((l) => l + 1);
    } else {
      setRunEffect(null);
    }

    setScreen("path"); // vissza path választáshoz
  }

 function handleLoadingDone() {
  // 1. Azonnali kilépés, ha már folyamatban van vagy nincs mit betölteni
  if (!pendingPath || loadingLockRef.current) return;
  
  // 2. Azonnali lockolás és állapot ürítés (még a logika előtt!)
  loadingLockRef.current = true;
  setPendingPath(null); 

  const chance = Number(EVENT_CHANCE);
  const roll = Math.random();
  const shouldEvent = chance >= 1 || roll < chance;

  console.log("[RunView] Loading done", { roll, chance, shouldEvent });

  if (shouldEvent) {
    const ev = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    setActiveEvent(ev);
    setScreen("event");
  } else {
    startCombat();
  }
}

  return (
    <div className="relative min-h-screen bg-black">
      {screen === "path" && (
        <PathChoice level={level} onChoose={handlePathChoose} />
      )}

      {screen === "loading" && (
        <LoadingScreen onDone={handleLoadingDone} />
      )}

      {screen === "event" && activeEvent && (
        <EventView event={activeEvent} onChoose={handleEventChoice} />
      )}

      {screen === "combat" && (
        <>
          <CombatView
            level={level}
            runEffect={runEffect}
            onEnd={handleCombatEnd}
          />
          <TransitionOverlay
            src={combatIntroVideo}
            onEnd={() => setShowTransition(false)}
          />
        </>
      )}
    </div>
  );
}
