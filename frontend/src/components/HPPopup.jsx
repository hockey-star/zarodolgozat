import React, { useEffect, useState } from "react";
import "./HPPopup.css";

export default function HPPopup({ value, x, y, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 800); // 0.8s animáció
    return () => clearTimeout(t);
  }, []);

  return visible ? (
    <div
      className={`hp-popup ${value < 0 ? "damage" : "heal"}`}
      style={{ left: x, top: y }}
    >
      {value > 0 ? `+${value}` : value}
    </div>
  ) : null;
}
