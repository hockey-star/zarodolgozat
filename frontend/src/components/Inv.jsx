import React from "react";

export default function InvModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div style={{
          width: "800px",
          height: "800px",
          background: "black"}}>
        <button
          onClick={onClose} >
          X
        </button>
        <h2 className="text-center mb-2 text-sm">TÁRGYAID</h2>

        <div className="flex justify-between flex-1">
          
          <div
          style={{
          width: "800px",
          height: "800px",
          backgroundSize: "cover",
          backgroundImage: `url(./src/assets/pics/Inv.jpg)`,
          alignContent: "center"
          }}>

          </div>
        </div>
      </div>
    </div>
  );
}