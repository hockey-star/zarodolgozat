import React from "react";
import "./PathChoice.css";
import bg1 from '../assets/backgrounds/1.jpg';

export default function PathChoice({ onChoose, level = 1, background }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden flex items-center justify-center"
      style={{
        backgroundImage: `url(${bg1})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Sötét overlay */}
      <div className=""></div>

      {/* Felirat a tetején */}
      <h2 className="absolute top-5 left-1/2 -translate-x-1/2 text-4xl font-bold text-white z-10 select-none pixelosvenyvalaszt">
        {level === 11 ? "A végső csata közeleg..." : `Válassz egy ösvényt (${level}/11)`}
      </h2>

      {/* Két nagy “gomb” */}
      <div className="absolute inset-0 flex">
        {/* Bal oldal */}
        <div
          onClick={() => onChoose("left")}
          className="w-1/2 h-full cursor-pointer relative hover:bg-white/20 transition-colors duration-200"
        >
          <span className="absolute bottom-10 left-1/2 -translate-x-1/2 text-3xl font-bold text-white select-none pixelfont">
            Bal
          </span>
        </div>

        {/* Jobb oldal */}
        <div
          onClick={() => onChoose("right")}
          className="w-1/2 h-full cursor-pointer relative hover:bg-white/20 transition-colors duration-200"
        >
          <span className="absolute bottom-10 left-1/2 -translate-x-1/2 text-3xl font-bold text-white select-none pixelfont">
            Jobb
          </span>
        </div>
      </div>
    </div>
  );
}
