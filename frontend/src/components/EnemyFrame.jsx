import React from "react";
import "./EnemyFrame.css"; // külön CSS fájl

export default function EnemyFrame({ name, hp, maxHP, image }) {
  return (
    <div className="enemy-frame">
      {/* Frame */}
      <img src="/ui/frame.png" alt="frame" className="frame" />
      {/* Karakter */}
      <img src={image} alt={name} className="character" />
      {/* Név */}
      <div className="name">{name}</div>
      {/* HP bar */}
      <div className="hp-bar-bg">
        <div className="hp-bar-fill" style={{ width: `${(hp / maxHP) * 100}%` }}></div>
      </div>
      {/* HP text */}
      <div className="hp-text">{hp} / {maxHP}</div>
    </div>
  );
}
