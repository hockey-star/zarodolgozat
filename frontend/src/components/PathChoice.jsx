// frontend/src/components/PathChoice.jsx
import React, { useState, useMemo } from "react";
import "./PathChoice.css";

import fightIcon from "../assets/icons/fight.png";
import eliteIcon from "../assets/icons/elite.jpg";
import mysteryIcon from "../assets/icons/mystery.png";
import bg1 from "../assets/backgrounds/1.jpg";

export default function PathChoice({ onChoose, level = 1 }) {
  const [hoverTooltip, setHoverTooltip] = useState(null);

  // ✅ TELJES ESEMÉNY POOL
  const EVENTS = ["fight", "elite", "rest", "mystery"];

  // ✅ Véletlenszerűen kiválasztunk 2 KÜLÖNBÖZŐ-t
  const [leftOption, rightOption] = useMemo(() => {
    const shuffled = [...EVENTS].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }, [level]); // ⬅️ szintlépéskor újrarandomol

  // ✅ Ikonok (rest ideiglenesen mystery)
  const icons = {
    fight: fightIcon,
    elite: eliteIcon,
    mystery: mysteryIcon,
    rest: mysteryIcon, // ⚠️ ideiglenes
  };

  // ✅ Tooltip szövegek
  const tooltipText = {
    fight: "Érzed, hogy itt egy normál ellenfél vár rád...",
    elite: "Valami nagy és erős közeleg az ösvényen!",
    mystery: "A rejtélyes ösvény titokkal teli...",
    rest: "Biztonságos pihenőhely. Itt gyógyulhatsz.",
  };

  function handleClick(type) {
    onChoose({ type }); // ✅ App.jsx kompatibilis
  }

  return (
    <div
      className="path-choice-bg absolute inset-0 flex items-center justify-center"
      style={{
        backgroundImage: `url(${bg1})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>

      {/* ✅ FELIRAT – FINAL BOSS 16 */}
      <h2 className="absolute top-5 left-1/2 -translate-x-1/2 text-4xl font-bold text-white z-10 select-none pixelosvenyvalaszt">
        {level === 16
          ? "A végső csata közeleg..."
          : `Válassz egy ösvényt (${level}/16)` }
      </h2>

      <div className="absolute inset-0 flex">
        {/* ✅ BAL OLDAL */}
        <div
          className="w-1/2 h-full relative flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors duration-200"
          onClick={() => handleClick(leftOption)}
          onMouseEnter={() => setHoverTooltip(leftOption)}
          onMouseLeave={() => setHoverTooltip(null)}
        >
          <img
            src={icons[leftOption]}
            alt={leftOption}
            className="w-32 h-32"
          />

          {hoverTooltip === leftOption && (
            <div className="tooltip">
              {tooltipText[leftOption]}
            </div>
          )}
        </div>

        {/* ✅ JOBB OLDAL */}
        <div
          className="w-1/2 h-full relative flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors duration-200"
          onClick={() => handleClick(rightOption)}
          onMouseEnter={() => setHoverTooltip(rightOption)}
          onMouseLeave={() => setHoverTooltip(null)}
        >
          <img
            src={icons[rightOption]}
            alt={rightOption}
            className="w-32 h-32"
          />

          {hoverTooltip === rightOption && (
            <div className="tooltip">
              {tooltipText[rightOption]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
