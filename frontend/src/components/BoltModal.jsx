import React from "react";

export default function ShopModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-[90%] h-[80%] flex shadow-xl p-6 text-white">
        {/* Bezárás */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-400"
        >
          X
        </button>

        {/* Bal oldal: felső karakteradatok */}
        <div className="flex flex-col w-2/3 pr-4">
          <div className="flex justify-between bg-black/40 p-2 rounded mb-4 text-sm">
            <div>Szint: 12</div>
            <div>XP: 1345</div>
            <div>Arany: 560</div>
          </div>

          {/* Görgethető bolt lista */}
          <div className="overflow-y-auto flex-1 bg-black/40 rounded p-3 space-y-3">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center border border-gray-700 bg-gray-800/60 p-3 rounded hover:bg-gray-700 transition"
              >
                <span>Vas kard +{i}</span>
                <button className="bg-green-700 px-3 py-1 rounded hover:bg-green-600">
                  Vásárlás
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Jobb oldal: összehasonlítás */}
        <div className="w-1/3 bg-black/40 rounded p-4 border-l border-gray-700">
          <h2 className="text-lg mb-3">Tárgy összehasonlítás</h2>
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-gray-400">Jelenlegi</p>
              <p>Vas kard +3</p>
              <p>Támadás: 12</p>
              <p>Védelem: 4</p>
            </div>
            <div>
              <p className="text-gray-400">Új</p>
              <p>Vas kard +5</p>
              <p>Támadás: 16</p>
              <p>Védelem: 6</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}