// frontend/src/components/RunView.jsx
import React, { useState } from "react";
import PathChoice from "./PathChoice";
import CombatView from "./CombatView";
import TransitionOverlay from "./TransitionOverlay";

import combatIntroVideo from "../assets/transitions/combat-intro.webm";

export default function RunView() {
  const [screen, setScreen] = useState("path"); // "path" | "combat"
  const [level, setLevel] = useState(1);

  const [currentPath, setCurrentPath] = useState(null);
  const [showTransition, setShowTransition] = useState(false);

  // PathChoice → katt
  function handlePathChoose(choice) {
    // pl. choice = { type: "fight" | "elite" | "rest" | "mystery" }
    setCurrentPath(choice);
    setScreen("combat");        // AZONNAL áttesszük combatra
    setShowTransition(true);    // és ráhúzzuk a transition overlayt
  }

  // Transition vége
  function handleTransitionEnd() {
    setShowTransition(false);
  }

  // Combat vége
  function handleCombatEnd(playerHP, victory) {
    if (victory) {
      setLevel((prev) => Math.min(prev + 1, 16));
    }
    setScreen("path");
    setCurrentPath(null);
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Alap view (PathChoice vagy Combat) */}
      <div className="relative z-10">
        {screen === "path" && (
          <PathChoice onChoose={handlePathChoose} level={level} />
        )}

        {screen === "combat" && (
          <CombatView
            level={level}
            pathType={currentPath?.type || "fight"}
            boss={currentPath?.type === "elite"} // példa: elite-ből boss-flag
            onEnd={handleCombatEnd}
          />
        )}
      </div>

      {/* Transition overlay – PathChoice clicktől indul */}
      {showTransition && (
        <TransitionOverlay
          src={combatIntroVideo}
          onEnd={handleTransitionEnd}
          darkDelay={0}
          darkFadeIn={250}
          darkFadeOut={800}
          darkOpacity={0.7}
          videoDelay={250}
        />
      )}
    </div>
  );
}
