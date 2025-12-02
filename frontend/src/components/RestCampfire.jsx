// frontend/src/components/RestCampfire.jsx
import React from "react";
import campfireVideo from "../assets/backgrounds/campfire.mp4"; // ⬅️ ha nálad más, ezt módosítsd

export default function RestCampfire({ onBackToPath, onGoHub, level }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center text-white">
      {/* Háttér videó */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={campfireVideo}
        autoPlay
        loop
        muted
      />

      {/* Sötét overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Szöveg + gombok */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <h2 className="text-3xl md:text-4xl font-bold drop-shadow-lg text-center">
          Pihenő a tábortűznél
        </h2>
        <p className="text-sm md:text-base text-gray-200 max-w-md text-center">
          A rövid pihenő után eldöntheted, visszamész-e tovább harcolni,
          vagy hazatérsz a hubba, hogy újra felkészülj az útra.
        </p>

        <div className="flex flex-col md:flex-row gap-4 mt-2">
          <button
            onClick={onBackToPath}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm md:text-base font-semibold shadow-lg shadow-black/40"
          >
            🔥 Vissza az ösvényre (Szint {level})
          </button>

          <button
            onClick={onGoHub}
            className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm md:text-base font-semibold shadow-lg shadow-black/40"
          >
            🏠 Hazamész a hubba
          </button>
        </div>
      </div>
    </div>
  );
}
