import React, { useState, useRef } from "react";
import { DEFAULT_CLASSES } from "../data/classes.js";
import { usePlayer } from "../context/PlayerContext.jsx";
import "./ClassSelect.css";

export default function ClassSelect({ onNext }) {
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState(localStorage.getItem("sk_current_user") || "");
  const { createCharacter } = usePlayer() || {};

  const videoSources = [
    "./src/assets/classok/classharcos.mp4",
    "./src/assets/classok/classvarazslo.mp4",
    "./src/assets/classok/classtavolsagi.mp4",
  ];

  const videoRefs = useRef([]);

  function handleSelect(id, index) {
    setSelected(id);

    videoRefs.current.forEach((v, i) => {
      if (v && i !== index) {
        v.pause();
        v.currentTime = 0;
      }
    });

    const vid = videoRefs.current[index];
    if (vid) {
      vid.play();
      vid.onended = () => {
        vid.pause();
      };
    }
  }

  function create() {
    if (!name.trim()) return alert("Adj meg egy karakternevet!");
    if (!selected) return alert("Válassz egy hőst!");
    createCharacter(name.trim(), selected);
    onNext();
  }

  return (
    <div className="path-choice-bg">

      {/* Sötét overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Cím */}
      <h2 className="absolute top-5 left-1/2 -translate-x-1/2 text-4xl font-bold text-white select-none pixelosvenyvalaszt">
        Válassz egy hőst
      </h2>

      {/* Név input */}
      <div className="characterNameInputContainer ">
  <input
  type="text"
  placeholder="Karakter neve"
  value={name}
  onChange={(e) => setName(e.target.value)}
  className="characterNameInput"
 />


</div>


      {/* Három kasztzóna */}
      <div className="absolute inset-0 flex">
        {DEFAULT_CLASSES.slice(0, 3).map((cls, index) => (
          <div
            key={cls.id}
            onClick={() => handleSelect(cls.id, index)}
            className={`relative w-1/3 h-full cursor-pointer overflow-hidden transition-all duration-500
              ${selected === cls.id ? "brightness-110" : "hover:brightness-90"}`}
          >
            {/* 🎬 Videó kitölti a teljes zónát */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={videoSources[index]}
              preload="auto"
              className="ClassHatter absolute inset-0 w-full h-full object-cover"
              muted
            />

            {/* Fekete áttetsző réteg ha nincs kiválasztva */}
            <div
              className={`absolute inset-0 transition-colors duration-300 ${
                selected === cls.id ? "bg-black/0" : "bg-black/30"
              }`}
            ></div>

            {/* Kaszt neve középen */}
            <span
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                text-3xl font-bold select-none pixelfont transition-all duration-300
                ${selected === cls.id ? "text-red-400 scale-110" : "text-white"}`}
            >
              {cls.name}
            </span>

            {/* Statok mindig alul középen */}
            <div className="classStats">
              <div>HP: {cls.base.hp}</div>
              <div>STR: {cls.base.str} • INT: {cls.base.int} • AGI: {cls.base.agi}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Létrehozás gomb */}
      {selected && (
        <button
          onClick={create}
          className="buttonClass createButton"
        >
          Létrehozás
        </button>
      )}
    </div>
  );
}
