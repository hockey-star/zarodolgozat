import React from "react";
import "./EnemyFrame.css";

export default function EnemyFrame({ id, name, hp, maxHP, image }) {
  return (
    <div className="enemy-frame" id={id}>
      <img src="/ui/frame.png" alt="frame" className="frame" />
      <img src={image} alt={name} className="character" />
      <div className="name">{name}</div>
      <div className="hp-bar-bg">
        <div className="hp-bar-fill" style={{ width: `${(hp / maxHP) * 100}%` }}></div>
      </div>
      <div className="hp-text">{hp} / {maxHP}</div>
    </div>
  );
}
