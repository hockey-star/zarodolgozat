import React, { useState, useEffect } from "react";
import "./PathChoice.css";

import fightIcon from "../assets/icons/fight.png";
import eliteIcon from "../assets/icons/elite.jpg";
import mysteryIcon from "../assets/icons/mystery.png";
import bg1 from "../assets/backgrounds/1.jpg";

export default function PathChoice({ onChoose, level = 1 }) {
  const [hoveredOption, setHoveredOption] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);

  const EVENTS = ["fight", "elite", "rest", "mystery"];
  const [leftOption, setLeftOption] = useState("fight");
  const [rightOption, setRightOption] = useState("mystery");

  const icons = {
    fight: fightIcon,
    elite: eliteIcon,
    mystery: mysteryIcon,
    rest: mysteryIcon,
  };

  const tooltipText = {
    fight: "Harccal teli ösvény",
    elite: "Veszélyes erejű ellenfél",
    mystery: "Ismeretlen esemény",
    rest: "Megnyugvás és gyógyulás",
  };

  useEffect(() => {
    const shuffled = [...EVENTS].sort(() => Math.random() - 0.5);
    setLeftOption(shuffled[0]);
    setRightOption(shuffled[1]);
  }, [level]);

  // Jumpscare intro logika - pont 400ms, hogy a 0.15s villanás után legyen sötét szünet
  const introWords = ["VÁLASSZ", "EGY", "ÖSVÉNYT"];

  useEffect(() => {
    if (!showIntro) return;
    if (currentWordIdx >= introWords.length) {
      setTimeout(() => setShowIntro(false), 150);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentWordIdx((idx) => idx + 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [currentWordIdx, showIntro]);

  if (showIntro) {
    return (
      <div className="intro-container"> 
        {introWords.map((word, idx) => (
          currentWordIdx === idx && (
            <span
              key={idx}
              className={`intro-word intro-word-${idx}`}
            >
              {word}
            </span>
          )
        ))}
      </div>
    );
  }

  return (
    <div className="path-choice-root">
      <div className="path-bg base" style={{ backgroundImage: `url(${bg1})` }} />
      
      <div 
        className={`path-bg left ${hoveredOption === leftOption ? "active" : ""}`} 
        style={{ backgroundImage: `url(${bg1})` }} 
      />
      <div 
        className={`path-bg right ${hoveredOption === rightOption ? "active" : ""}`} 
        style={{ backgroundImage: `url(${bg1})` }} 
      />

      <h2 className="path-level-title pixelosvenyvalaszt">{level}/16</h2>

      <div className="path-sides-container">
        <div 
          className="path-side"
          onMouseEnter={() => setHoveredOption(leftOption)}
          onMouseLeave={() => setHoveredOption(null)}
          onClick={() => onChoose({ type: leftOption })}
        >
          <img src={icons[leftOption]} alt="icon" className="path-icon" />
          {hoveredOption === leftOption && (
            <div className="path-tooltip-wrapper">
              <div className="path-tooltip">{tooltipText[leftOption]}</div>
            </div>
          )}
        </div>

        <div 
          className="path-side"
          onMouseEnter={() => setHoveredOption(rightOption)}
          onMouseLeave={() => setHoveredOption(null)}
          onClick={() => onChoose({ type: rightOption })}
        >
          <img src={icons[rightOption]} alt="icon" className="path-icon" />
          {hoveredOption === rightOption && (
            <div className="path-tooltip-wrapper">
              <div className="path-tooltip">{tooltipText[rightOption]}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}