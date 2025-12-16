// frontend/src/components/PathChoice.jsx
import React, { useState, useEffect } from "react";
import "./PathChoice.css";

import fightIcon from "../assets/icons/fight.png";
import eliteIcon from "../assets/icons/elite.jpg";
import mysteryIcon from "../assets/icons/mystery.png";
import bg1 from "../assets/backgrounds/1.jpg";

export default function PathChoice({ onChoose, level = 1 }) {
  const [hoverTooltip, setHoverTooltip] = useState(null);

  // ✅ TELJES ESEMÉNY POOL
  const EVENTS = ["fight", "elite", "rest", "mystery"];

  // ✅ opciók STATE-ben (stabil, nem re-rollol random render miatt)
  const [leftOption, setLeftOption] = useState("fight");
  const [rightOption, setRightOption] = useState("mystery");

  // ✅ csak akkor randomol újra, amikor a level változik
  useEffect(() => {
    const shuffled = [...EVENTS].sort(() => Math.random() - 0.5);
    setLeftOption(shuffled[0]);
    setRightOption(shuffled[1]);
    setHoverTooltip(null);
  }, [level]);

  // ✅ Ikonok
  const icons = {
    fight: fightIcon,
    elite: eliteIcon,
    mystery: mysteryIcon,
    rest: mysteryIcon, // ⚠️ ideiglenes
  };

  // ✅ Tooltip szövegek
  const tooltipText = {
    fight: "Érzed, hogy harc közeleg...",
    elite: "Valami nagy és erős közeleg az ösvényen!",
    mystery: "A rejtélyes ösvény titokkal teli...",
    rest: "Biztonságos pihenőhely. Itt gyógyulhatsz.",
  };

  function handleClick(type) {
    onChoose({ type }); // ✅ App.jsx kompatibilis
  }

  return (
    <div className="path-choice-bg">
      {/* ===== ALAP BLUROS FEKETE-FEHÉR HÁTTÉR ===== */}
      <div className="path-bg base" style={{ backgroundImage: `url(${bg1})` }} />

      {/* ===== BAL OLDAL ÉLES OVERLAY ===== */}
      <div
        className={`path-bg left ${hoverTooltip === leftOption ? "active" : ""}`}
        style={{ backgroundImage: `url(${bg1})` }}
      />

      {/* ===== JOBB OLDAL ÉLES OVERLAY ===== */}
      <div
        className={`path-bg right ${hoverTooltip === rightOption ? "active" : ""}`}
        style={{ backgroundImage: `url(${bg1})` }}
      />

      {/* ===== FELIRAT ===== */}
      <h2 className="pixelosvenyvalaszt path-title">
        {level === 16
          ? "A végső csata közeleg..."
          : `Válassz egy ösvényt (${level}/16)`}
      </h2>

      {/* ===== KATTINTHATÓ TERÜLETEK ===== */}
      <div className="path-choice-sides">
        {/* BAL */}
        <div
          className="side"
          onClick={() => handleClick(leftOption)}
          onMouseEnter={() => setHoverTooltip(leftOption)}
          onMouseLeave={() => setHoverTooltip(null)}
        >
          <img src={icons[leftOption]} alt={leftOption} className="icon" />

          {hoverTooltip === leftOption && (
            <div className="tooltip">{tooltipText[leftOption]}</div>
          )}
        </div>

        {/* JOBB */}
        <div
          className="side"
          onClick={() => handleClick(rightOption)}
          onMouseEnter={() => setHoverTooltip(rightOption)}
          onMouseLeave={() => setHoverTooltip(null)}
        >
          <img src={icons[rightOption]} alt={rightOption} className="icon" />

          {hoverTooltip === rightOption && (
            <div className="tooltip">{tooltipText[rightOption]}</div>
          )}
        </div>
      </div>
    </div>
  );
}

