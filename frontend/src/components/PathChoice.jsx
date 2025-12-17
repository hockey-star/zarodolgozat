// frontend/src/components/PathChoice.jsx
import React, { useState, useEffect } from "react";
import "./PathChoice.css";

import fightIcon from "../assets/icons/fight.png";
import eliteIcon from "../assets/icons/elite.jpg";
import mysteryIcon from "../assets/icons/mystery.png";
import bg1 from "../assets/backgrounds/1.jpg";

export default function PathChoice({ onChoose, level = 1 }) {
  const [hoverTooltip, setHoverTooltip] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);

  const EVENTS = ["fight", "elite", "rest", "mystery"];
  const [leftOption, setLeftOption] = useState("fight");
  const [rightOption, setRightOption] = useState("mystery");

  useEffect(() => {
    const shuffled = [...EVENTS].sort(() => Math.random() - 0.5);
    setLeftOption(shuffled[0]);
    setRightOption(shuffled[1]);
    setHoverTooltip(null);
  }, [level]);

  const icons = {
    fight: fightIcon,
    elite: eliteIcon,
    mystery: mysteryIcon,
    rest: mysteryIcon,
  };

  const tooltipText = {
    fight: "Érzed, hogy harc közeleg...",
    elite: "Valami nagy és erős közeleg az ösvényen!",
    mystery: "A rejtélyes ösvény titokkal teli...",
    rest: "Biztonságos pihenőhely. Itt gyógyulhatsz.",
  };

  function handleClick(type) {
    onChoose({ type });
  }

  const introWords = ["VÁLASSZ", "EGY", "ÖSVÉNYT"];

  useEffect(() => {
    if (!showIntro) return;
    if (currentWordIdx >= introWords.length) {
      setTimeout(() => setShowIntro(false), 100);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentWordIdx((idx) => idx + 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [currentWordIdx, showIntro]);

  return (
    <div className="path-choice-bg">
      {showIntro ? (
        <div className="intro-container robot-scale">
          {introWords.map((word, idx) => (
            <span
              key={idx}
              className={`intro-word intro-word-${idx}`}
              style={{ display: currentWordIdx === idx ? "inline" : "none" }}
            >
              {word}
            </span>
          ))}
        </div>
      ) : (
        <>
          <div className="path-bg base" style={{ backgroundImage: `url(${bg1})` }} />

          <div
            className={`path-bg left ${hoverTooltip === leftOption ? "active" : ""}`}
            style={{ backgroundImage: `url(${bg1})` }}
          />
          <div
            className={`path-bg right ${hoverTooltip === rightOption ? "active" : ""}`}
            style={{ backgroundImage: `url(${bg1})` }}
          />

          <h2 className="pixelosvenyvalaszt path-title fade-in">
            {`${level}/16`}
          </h2>

          <div className="path-choice-sides fade-in">
            {/* BAL */}
            <div
              className="side"
              onClick={() => handleClick(leftOption)}
              onMouseEnter={() => setHoverTooltip(leftOption)}
              onMouseLeave={() => setHoverTooltip(null)}
            >
              <img src={icons[leftOption]} alt={leftOption} className="icon" />

              {hoverTooltip === leftOption && (
  <div className="tooltip-wrapper">
    <div className="tooltip">{tooltipText[leftOption]}</div>
  </div>
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
  <div className="tooltip-wrapper">
    <div className="tooltip">{tooltipText[rightOption]}</div>
  </div>
)}

            </div>
          </div>
        </>
      )}
    </div>
  );
}
