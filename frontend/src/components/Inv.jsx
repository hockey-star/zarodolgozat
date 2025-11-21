import React, { useState } from "react";

export default function InvModal({ onClose }) {
  const [showInventory, setShowInventory] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        style={{
          width: "1920px",
          height: "1088px",
          background: "black",
          backgroundImage: `url("./src/assets/pics/HAZ.jpg")`,
          position: "relative",
        }}
      >
        <h2 className="text-center mb-2 text-sm text-white">OTTHON</h2>

        {/* INVENTORY MODAL */}
        {showInventory && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-10">
            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl w-3/4 h-3/4 overflow-auto text-white">
              <h2 className="text-xl font-bold mb-6 text-center">TÁRGYAK</h2>

              {/* GRID: 4 columns */}
              <div className="grid grid-cols-4 gap-6">
                {Array(4).fill("").map((title, colIndex) => (
                  <div key={colIndex}>
                    {/* Column title */}
                    
                    {/* Items grid: 3 per row, 5 rows */}
                    <div className="grid grid-cols-3 gap-3">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-full h-20 bg-gray-700 border border-gray-600 hover:bg-gray-600 transition cursor-pointer"
                        ></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-6">
                <button
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-xl"
                  onClick={() => setShowInventory(false)}
                >
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between flex-1">
          <div
            style={{
              width: "80%",
              height: "80%",
            }}
          >
            {/* AJTÓ */}
            <div
              className={`absolute cursor-pointer group ${showInventory ? "pointer-events-none" : ""}`}
              style={{ left: "5%", bottom: "5%", width: "325px", height: "600px" }}
              onClick={onClose}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition text-white">TESZT</div>
            </div>

            {/* DECK */}
            <div
              className={`absolute cursor-pointer group ${showInventory ? "pointer-events-none" : ""}`}
              style={{ left: "45%", bottom: "30%", width: "180px", height: "250px" }}
              onClick={onClose}
            >
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition text-white">TESZT</div>
            </div>


            {/* LÁDA */}
            <div
              className={`absolute cursor-pointer group ${showInventory ? "pointer-events-none" : ""}`}
              style={{ left: "25%", bottom: "18%", width: "400px", height: "300px", color: "black" }}
              onClick={() => setShowInventory(true)}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition text-white">TESZT</div>
            </div>

            {/* BEÁLLÍTÁSOK */}
            <div
              className={`absolute cursor-pointer group ${showInventory ? "pointer-events-none" : ""}`}
              style={{ right: "10%", top: "5%", width: "150px", height: "150px", color: "black" }}
              onClick={onClose}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition text-white">Beall</div>
            </div>

            {/* ÁGY */}
            <div
              className={`absolute cursor-pointer group ${showInventory ? "pointer-events-none" : ""}`}
              style={{ right: "10%", bottom: "5%", width: "650px", height: "350px", color: "black" }}
              onClick={onClose}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition text-white">TESZT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
