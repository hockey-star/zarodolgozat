// frontend/src/components/HPPopup.jsx
import React, { useEffect, useState } from "react";
import "./HPPopup.css";

export default function HPPopup({ value, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 800); // 0.8s animáció
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      className={`hp-popup ${value < 0 ? "damage" : "heal"}`}
    >
      {value > 0 ? `+${value}` : value}
    </div>
  );
}
