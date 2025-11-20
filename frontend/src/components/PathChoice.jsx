import React, { useState, useMemo } from "react";
import "./PathChoice.css";
import fightIcon from "../assets/icons/fight.png";
import eliteIcon from "../assets/icons/elite.jpg";
import mysteryIcon from "../assets/icons/mystery.png";
import bg1 from "../assets/backgrounds/1.jpg";

export default function PathChoice({ onChoose, level = 1 }) {
  const [hoverTooltip, setHoverTooltip] = useState(null);

  // Randomizálás: bal oldalon fight vagy elite
  const leftOption = useMemo(() => (Math.random() < 0.5 ? "fight" : "elite"), []);

  const icons = {
    fight: fightIcon,
    elite: eliteIcon,
    mystery: mysteryIcon
  };

  const tooltipText = {
    fight: "Érzed, hogy itt egy normál ellenfél vár rád...",
    elite: "Valami nagy és erős közeleg az ösvényen!",
    mystery: "A rejtélyes ösvény titokkal teli: harc, gyógyulás, vagy zsákmány várhat."
  };

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

      <h2 className="absolute top-5 left-1/2 -translate-x-1/2 text-4xl font-bold text-white z-10 select-none pixelosvenyvalaszt">
        {level === 11
          ? "A végső csata közeleg..."
          : `Válassz egy ösvényt (${level}/11)` }
      </h2>

      <div className="absolute inset-0 flex">
        {/* Bal oldal */}
        <div
          className="w-1/2 h-full relative flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors duration-200"
          onClick={() => onChoose(leftOption)}
          onMouseEnter={() => setHoverTooltip(leftOption)}
          onMouseLeave={() => setHoverTooltip(null)}
        >
          <img src={icons[leftOption]} alt={leftOption} className="w-32 h-32" />
          {hoverTooltip === leftOption && (
            <div className="tooltip">{tooltipText[leftOption]}</div>
          )}
        </div>

        {/* Jobb oldal */}
        <div
          className="w-1/2 h-full relative flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors duration-200"
          onClick={() => onChoose("mystery")}
          onMouseEnter={() => setHoverTooltip("mystery")}
          onMouseLeave={() => setHoverTooltip(null)}
        >
          <img src={mysteryIcon} alt="Mystery" className="w-32 h-32" />
          {hoverTooltip === "mystery" && (
            <div className="tooltip">{tooltipText.mystery}</div>
          )}
        </div>
      </div>
    </div>
  );
}
