import React from "react";
import "./EnemyFrame.css";

export default function EnemyFrame({ 
  name, 
  hp, 
  maxHP, 
  image, 
  damaged = false, 
  healed = false 
}) {
  return (
    <div className="enemy-frame">
      {/* Frame */}
      <img src="/ui/frame.png" alt="frame" className="frame" />

      {/* Character */}
      <img
        src={image}
        alt={name}
        className={`character ${damaged ? "damage" : ""} ${healed ? "heal" : ""}`}
      />

      {/* Name */}
      <div className="name">{name}</div>

      {/* HP BAR */}
      <div className="hp-bar-bg">
        <div className="hp-bar-fill" style={{ width: `${(hp / maxHP) * 100}%` }}></div>
      </div>

      <div className="hp-text">{hp} / {maxHP}</div>
    </div>
  );
}
