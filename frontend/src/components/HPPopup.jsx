// frontend/src/components/HPPopup.jsx
import React, { useEffect, useState } from "react";
import "./HPPopup.css";

export default function HPPopup({ value, isCrit = false, variant = "default", onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 800);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  const cls =
    value < 0
      ? isCrit
        ? `hp-popup damage crit ${variant}`
        : `hp-popup damage ${variant}`
      : `hp-popup heal ${variant}`;

  return <div className={cls}>{value > 0 ? `+${value}` : value}</div>;
}