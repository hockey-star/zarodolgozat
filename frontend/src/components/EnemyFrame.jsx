import React, { useMemo } from "react";
import "./EnemyFrame.css";

const AFFIX_UI = {
  shielded: { label: "Shielded", color: "#60a5fa" },     // kék
  vampiric: { label: "Vampiric", color: "#a855f7" },     // lila
  plague_aura: { label: "Plague", color: "#84cc16" },    // zöld
  frenzied: { label: "Frenzied", color: "#ef4444" },     // piros
};

// melyik legyen “domináns” szín, ha több van:
const AFFIX_PRIORITY = ["shielded", "vampiric", "plague_aura", "frenzied"];

function pickPrimaryAffix(affixes = []) {
  const ids = affixes.map(a => a?.id).filter(Boolean);
  for (const id of AFFIX_PRIORITY) {
    if (ids.includes(id)) return id;
  }
  return ids[0] || null;
}

export default function EnemyFrame({
  name,
  hp,
  maxHP,
  image,
  damaged = false,
  healed = false,
  affixes = [],
}) {
  const ui = useMemo(() => {
    const primary = pickPrimaryAffix(affixes);
    const primaryUi = primary ? AFFIX_UI[primary] : null;

    const tags = (affixes || [])
      .map(a => AFFIX_UI[a.id]?.label || a.name || a.id)
      .filter(Boolean);

    return {
      primaryColor: primaryUi?.color || "transparent",
      tags,
      hasAffixes: tags.length > 0,
    };
  }, [affixes]);

  return (
    <div
      className={`enemy-frame ${ui.hasAffixes ? "affixed" : ""}`}
      style={{ "--affixColor": ui.primaryColor }}
    >
      {/* Frame */}
      <img src="/ui/frame.png" alt="frame" className="frame" />

      {/* ✅ Affix strip a név fölött */}
      {ui.hasAffixes && (
        <div className="affix-strip">
          {ui.tags.map((t) => (
            <span key={t} className="affix-tag">
              {t}
            </span>
          ))}
        </div>
      )}

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
        <div className="hp-bar-fill" style={{ width: `${(hp / maxHP) * 100}%` }} />
      </div>

      <div className="hp-text">
        {hp} / {maxHP}
      </div>
    </div>
  );
}
