// frontend/src/components/ClassSelect.jsx
import React, { useState, useRef, useEffect } from "react";
import { DEFAULT_CLASSES } from "../data/classes.js";
import { usePlayer } from "../context/PlayerContext.jsx";
import "./ClassSelect.css";
import Cim from "../Cim.jsx";


export default function ClassSelect({ onNext }) {
  const { player, setPlayer } = usePlayer();
  const [classData, setClassData] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
  async function loadClasses() {
    try {
      const res = await fetch(Cim.Cim+`/api/classes`);
      const data = await res.json();
      setClassData(data);
    } catch (err) {
      console.error("Nem sikerült betölteni a kasztokat:", err);
    }
  }
  loadClasses();
}, []);

  // VIDEÓK forrásai
  const videoSources = [
    "/src/assets/classok/classharcos.mp4",
    "/src/assets/classok/classvarazslo.mp4",
    "/src/assets/classok/classtavolsagi.mp4",
  ];

  const videoRefs = useRef([]);

  // ha kasztot kattintanak
  function handleSelect(id, index) {
    setSelected(id);

    // többi videó megállítása
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

  // kaszt mentése backendre
  async function create() {
    if (!selected) return alert("Válassz egy hőst!");
    if (!player || !player.username) {
      return alert("Hiba: nem vagy bejelentkezve.");
    }

    try {
      const res = await fetch(Cim.Cim+`/api/set-class`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: player.username, classId: selected }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("set-class failed:", data);
        return alert(data.error || "Nem sikerült menteni a kasztot!");
      }

      setPlayer({ ...player, class_id: selected });
      onNext(); // mehet trailer
    } catch (e) {
      console.error("set-class error:", e);
      alert("Szerver hiba történt!");
    }
  }

  return (
    <div className="path-choice-bg">

      {/* Fekete overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Cím */}
      <h2 className="absolute top-5 left-1/2 -translate-x-1/2 text-4xl font-bold text-white select-none pixelosvenyvalaszt">
        Válassz egy hőst
      </h2>

      {/* Három kaszt zóna */}
      <div className="absolute inset-0 flex">
        {classData.map((cls, index) => (

          <div
            key={cls.id}
            onClick={() => handleSelect(cls.id, index)}
            className={`relative w-1/3 h-full cursor-pointer overflow-hidden transition-all duration-500
              ${selected === cls.id ? "brightness-110" : "hover:brightness-90"}`}
          >

            {/* VIDEÓ */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={videoSources[index]}
              preload="auto"
              muted
              className="ClassHatter absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay ha nem kiválasztott */}
            <div
              className={`absolute inset-0 transition-colors duration-300 ${
                selected === cls.id ? "bg-black/0" : "bg-black/30"
              }`}
            ></div>

            {/* Kaszt neve */}
            <span
              className={`classname absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                text-3xl select-none pixelfont transition-all duration-300
                ${selected === cls.id ? "text-red-400 scale-110" : "text-white"}`}
            >
              {cls.name}
            </span>

            {/* Statok (most placeholder, mert DB adja majd) */}
            <div className="classStats">
  <div>HP: {cls.base_hp}</div>
  <div>
    STR: {cls.base_strength} • INT: {cls.base_intellect} • AGI: {cls.base_dexterity}
  </div>
</div>

          </div>
        ))}
      </div>

      {/* Létrehozás gomb */}
      {selected && (
        <button onClick={create} className="buttonClass createButton">
          Létrehozás
        </button>
      )}
    </div>
  );
}
