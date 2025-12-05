// frontend/src/components/AbilityEffectLayer.jsx
import React from "react";

export default function AbilityEffectLayer({ effects, onEffectDone }) {
  if (!effects || effects.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {effects.map((fx) => {
        let positionClass = "";

        // 🧍 PLAYER
        if (fx.target === "player" || fx.target === "player_shield") {
          positionClass =
            "left-[23%] top-[34%] -translate-x-1/2 -translate-y-1/2";
        }
        // 🎯 ENEMY SINGLE
        else if (fx.target === "enemy") {
          positionClass =
            "left-[56%] top-[35%] -translate-x-1/2 -translate-y-1/2";
        }
        // 💫 STUN
        else if (fx.target === "enemy_stun") {
          positionClass =
            "left-[80%] top-[20%] -translate-x-1/2 -translate-y-1/2";
        }
        // 🌪 AOE
        else if (fx.target === "enemy_aoe") {
          positionClass =
            "left-[80%] top-[36%] -translate-x-1/2 -translate-y-1/2";
        }
        // 🔶 CENTER
        else {
          positionClass =
            "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
        }

        const style = {};
        if (fx.width) style.width = fx.width;
        if (fx.height) style.height = fx.height;

        return (
          <video
            key={fx.id}
            src={fx.src}
            className={`absolute ${positionClass}`}
            style={style}
            autoPlay
            muted
            playsInline
            onEnded={() => onEffectDone?.(fx.id)}
            onError={() => onEffectDone?.(fx.id)}
          />
        );
      })}
    </div>
  );
}
