// frontend/src/components/AbilityEffectLayer.jsx
import React from "react";

export default function AbilityEffectLayer({ effects, onEffectDone }) {
  if (!effects || effects.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 5000 }} // combat fölött
    >
      {effects.map((fx) => {
        // POZÍCIÓ
       


let positionClass = "";

if (fx.target === "player") {
  positionClass =
    "left-[37%] top-[40%] -translate-x-1/2 -translate-y-1/2";
} else if (fx.target === "player_shield") {
  // Mana Shield – kicsit lejjebb / nagyobb kör a player körül
  positionClass =
    "left-[37%] top-[35%] -translate-x-1/2 -translate-y-1/2";
} else if (fx.target === "enemy") {
  positionClass =
    "left-[1080px] top-[350px] -translate-x-1/2 -translate-y-1/2";
} else if (fx.target === "enemy_stun") {
  positionClass =
    "left-[1220px] top-[290px] -translate-x-1/2 -translate-y-1/2";
} else if (fx.target === "enemy_aoe") {
  // nagy kör az enemy körül (Frost Nova, Arcane Surge)
  positionClass =
    "left-[1220px] top-[340px] -translate-x-1/2 -translate-y-1/2";
} else {
  positionClass =
    "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
}


        return (
          <video
            key={fx.id}
            src={fx.src}
            className={`absolute ${positionClass}`}
            style={{
              width: fx.width || "220px",
              height: fx.height || "220px",
            }}
            muted
            autoPlay
            playsInline
            onEnded={() => onEffectDone?.(fx.id)}
            onError={() => onEffectDone?.(fx.id)}
          />
        );
      })}
    </div>
  );
}
