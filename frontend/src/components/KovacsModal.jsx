import React from "react";

export default function BlacksmithModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-[80%] h-[70%] flex flex-col shadow-xl p-6 text-white">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-400"
        >
          ✕
        </button>

        {/* XP infó */}
        <div className="text-center mb-4 text-sm bg-black/40 py-2 rounded">
          Fejlesztésre fordítható XP: <span className="text-green-400">1240</span>
        </div>

        <div className="flex justify-between flex-1">
          {/* Bal: jelenlegi tárgy */}
          <div className="w-1/3 bg-black/40 rounded p-4 border border-gray-700">
            <h2 className="text-center mb-2 text-sm">Jelenlegi tárgy</h2>
            <p>Vas mellvért +2</p>
            <p>Támadás: +0</p>
            <p>Védelem: +10</p>
          </div>

          {/* Közép: statisztika */}
          <div className="w-1/3 flex flex-col items-center justify-center text-center">
            <p className="text-gray-400">→</p>
            <p className="text-sm mt-2">Fejlesztés költsége: 250 XP</p>
            <button className="bg-blue-700 px-4 py-2 rounded mt-3 hover:bg-blue-600">
              Fejlesztés
            </button>
          </div>

          {/* Jobb: fejlesztett tárgy */}
          <div className="w-1/3 bg-black/40 rounded p-4 border border-gray-700">
            <h2 className="text-center mb-2 text-sm">Fejlesztett tárgy</h2>
            <p>Vas mellvért +3</p>
            <p>Támadás: +0</p>
            <p>Védelem: +13</p>
          </div>
        </div>
      </div>
    </div>
  );
}