// frontend/src/components/AbilityEffectLayer.jsx
import React from "react";

export default function AbilityEffectLayer({ effects, onEffectDone }) {
  if (!effects || effects.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {effects.map((fx) => {
        const style = {};
        if (fx.width) style.width = fx.width;
        if (fx.height) style.height = fx.height;

        // ✅ loop esetén NEM törlünk onEnded-re
        const handleEnded = () => {
          if (fx.loop) return;
          onEffectDone?.(fx.id);
        };

        const handleError = () => {
          // hibánál mindenképp törlünk
          onEffectDone?.(fx.id);
        };

        // ✅ 1) PX pozíció
        if (fx.pos && typeof fx.pos.x === "number" && typeof fx.pos.y === "number") {
          return (
            <video
              key={fx.id}
              src={fx.src}
              className="absolute"
              style={{
                left: `${fx.pos.x}px`,
                top: `${fx.pos.y}px`,
                transform: "translate(-50%, -50%)",
                ...style,
              }}
              autoPlay
              muted
              playsInline
              loop={!!fx.loop}
              onEnded={handleEnded}
              onError={handleError}
            />
          );
        }

        // ✅ 2) fallback % target
        let positionClass = "";

        if (fx.target === "player" || fx.target === "player_shield") {
          positionClass = "left-[23%] top-[34%] -translate-x-1/2 -translate-y-1/2";
        } else if (fx.target === "enemy" || fx.target === "enemy_hit") {
          positionClass = "left-[56%] top-[35%] -translate-x-1/2 -translate-y-1/2";
        } else if (fx.target === "enemy_stun") {
          positionClass = "left-[80%] top-[20%] -translate-x-1/2 -translate-y-1/2";
        } else if (fx.target === "enemy_aoe") {
          positionClass = "left-[80%] top-[36%] -translate-x-1/2 -translate-y-1/2";
        } else if (fx.target === "enemy_shield") {
          positionClass = "left-[56%] top-[35%] -translate-x-1/2 -translate-y-1/2";
        } else {
          positionClass = "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
        }

        return (
          <video
            key={fx.id}
            src={fx.src}
            className={`absolute ${positionClass}`}
            style={style}
            autoPlay
            muted
            playsInline
            loop={!!fx.loop}
            onEnded={handleEnded}
            onError={handleError}
          />
        );
      })}
    </div>
  );
}
