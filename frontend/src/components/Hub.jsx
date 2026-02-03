// frontend/src/components/Hub.jsx
import React, { useState, useRef } from "react";
import ShopModal from "./BoltModal.jsx";
import BlacksmithModal from "./KovacsModal.jsx";
import InvModal from "./Inv.jsx";
import QuestBoardModal from "./QuestBoardModal.jsx";
import { usePlayer } from "../context/PlayerContext.jsx";
import "./Hub.css";

export default function Hub({ onGoAdventure }) {
  const { player } = usePlayer();
  const timeoutRef = useRef(null);

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 40, y: 75 });
  const [isMoving, setIsMoving] = useState(false);

  const [showShop, setShowShop] = useState(false);
  const [showBlacksmith, setShowBlacksmith] = useState(false);
  const [showInv, setShowInv] = useState(false);
  const [showQuestBoard, setShowQuestBoard] = useState(false);
  const isAnyModalOpen = showShop || showBlacksmith || showInv || showQuestBoard;

  /** 🎥 CAMERA STATES */
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  const SPEED = 20;

  /** 🎯 KAMERA BELEZOOM - Most már használja a koordinátákat! */
  const zoomTo = (xPercent, yPercent, zoomLevel = 2) => {
  setIsFadingOut(true); // Elindul a 0.6s-os transition

  setTimeout(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const newOffsetX = (windowWidth / 2) - (windowWidth * (xPercent / 100) * zoomLevel);
    const newOffsetY = (windowHeight / 2) - (windowHeight * (yPercent / 100) * zoomLevel);

    setZoom(zoomLevel);
    setOffset({ x: newOffsetX, y: newOffsetY });
    setIsZooming(true);
  }, 400); // Sötétedés közben váltunk kamerát
};

  /** 🔄 RESET ZOOM */
  const resetZoom = () => {
  // Amikor ideérünk, az isFadingOut már true (a handleClose-ból)
  setTimeout(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setIsZooming(false);

    // Várunk egy kicsit a sötétben, majd kivilágosítunk
    setTimeout(() => {
      setIsFadingOut(false); // Elindul a 0.6s-os kivilágosodás
    }, 100);
  }, 400); 
};

  /** 🚶 MOZGÁS ÉS ESEMÉNY INDÍTÁS */
  const moveTo = (x, y, type) => {
    // 1. Kamera elindítása a cél felé
    zoomTo(x, y);

    const dx = x - playerPos.x;
    const dy = y - playerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = (distance / SPEED) * 300;

    setIsMoving(true);
    setPlayerPos({ x, y });

    clearTimeout(timeoutRef.current);

    // 2. Megvárjuk, amíg a sötétítés teljes lesz (0.6s), és csak akkor nyitjuk a modalt
    timeoutRef.current = setTimeout(() => {
      openModal(type);
    }, 600);

    setTimeout(() => {
      setIsMoving(false);
    }, duration);
  };

  const openModal = (type) => {
    if (type === "shop") setShowShop(true);
    if (type === "blacksmith") setShowBlacksmith(true);
    if (type === "inv") setShowInv(true);
    if (type === "quest") setShowQuestBoard(true);
    
    if (type === "adventure") {
      resetZoom();
      if (onGoAdventure) onGoAdventure();
    }
  };

  /** ❌ MODAL BEZÁRÁS */
  const handleClose = (setter) => {
  // 1. Megtartjuk/beállítjuk a sötétséget
  setIsFadingOut(true); 
  // 2. Bezárjuk a modalt
  setter(false);
  // 3. Zoom reset
  resetZoom();
};

  const CLASS_STRING = { 6: "warrior", 7: "mage", 8: "archer" };

  return (
    <div className="hub-root">
      {/* OVERLAY: Ez felel a sötétítésért */}
      <div 
      className={`hub-overlay ${isFadingOut || isAnyModalOpen ? "is-dark" : ""}`}
    />

      <div className="camera">
        <div
          className={`world ${isZooming ? "hub-zooming" : ""}`}
          style={{ 
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transition: isFadingOut ? "transform 0.5s ease-in-out" : "none" 
          }}
        >
          <img src="./src/assets/pics/HUB.png" alt="hub" className="hub-image" />

          {/* HOTZONE-OK */}
          <div className="hotzone keret" style={{ left: "38%", bottom: "17%", width: "440px", height: "500px" }} onClick={() => moveTo(50, 80, "adventure")} />
          <div className="hotzone keret" style={{ left: "5%", bottom: "12%", width: "600px", height: "350px" }} onClick={() => moveTo(30, 85, "blacksmith")} />
          <div className="hotzone keret" style={{ right: "20%", bottom: "12%", width: "330px", height: "270px" }} onClick={() => moveTo(65, 80, "quest")} />
          <div className="hotzone keret" style={{ right: "5%", bottom: "12%", width: "280px", height: "250px" }} onClick={() => moveTo(85, 85, "shop")} />
          <div className="hotzone keret" style={{ right: "20%", bottom: "37%", width: "330px", height: "270px" }} onClick={() => moveTo(60, 80, "inv")} />

          {/* 🧍 PLAYER */}
          <img
            src="./src/assets/pics/TESZT.PNG"
            alt="player"
            className={`player ${isMoving ? "moving" : ""}`}
            style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
          />
        </div>
      </div>

      {/* MODALOK */}
      {showShop && <ShopModal onClose={() => handleClose(setShowShop)} />}
      {showBlacksmith && <BlacksmithModal onClose={() => handleClose(setShowBlacksmith)} />}
      {showInv && <InvModal onClose={() => handleClose(setShowInv)} />}
      {showQuestBoard && player && (
        <QuestBoardModal
          playerId={player.id}
          playerClassId={CLASS_STRING[player.class_id]}
          onClose={() => handleClose(setShowQuestBoard)}
        />
      )}
    </div>
  );
}