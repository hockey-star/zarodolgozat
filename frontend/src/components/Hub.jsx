// frontend/src/components/Hub.jsx
import React, { useState, useRef } from "react";
import ShopModal from "./BoltModal.jsx";
import BlacksmithModal from "./KovacsModal.jsx";
import InvModal from "./Inv.jsx";
import QuestBoardModal from "./QuestBoardModal.jsx";
import { usePlayer } from "../context/PlayerContext.jsx";
// TÖRÖLVE: import LoadingScreen from "./LoadingScreen.jsx"; <-- Itt már nem kell!
import "./Hub.css";

export default function Hub({ onGoAdventure }) {
  const { player } = usePlayer();
  const timeoutRef = useRef(null);

  const [playerPos, setPlayerPos] = useState({ x: 40, y: 75 });
  const [isMoving, setIsMoving] = useState(false);

  const [showShop, setShowShop] = useState(false);
  const [showBlacksmith, setShowBlacksmith] = useState(false);
  const [showInv, setShowInv] = useState(false);
  const [showQuestBoard, setShowQuestBoard] = useState(false);
  
  // TÖRÖLVE: const [isAdventuring, setIsAdventuring] = useState(false); <-- Nem kell helyi state

  /** 🎥 CAMERA */
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  const SPEED = 20;

  /** 🎯 KAMERA BELEZOOM */
  const zoomTo = (xPercent, yPercent, zoomLevel = 1.5) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const targetX = (xPercent / 110) * vw;
    const targetY = (yPercent / 130) * vh;

    const centerX = vw / 2;
    const centerY = vh / 2;

    const offsetX = centerX - targetX * zoomLevel;
    const offsetY = centerY - targetY * zoomLevel;

    setIsZooming(true);
    setZoom(zoomLevel);
    setOffset({ x: offsetX, y: offsetY });
  };

  const resetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setIsZooming(false);
  };

  /** 🚶 MOZGÁS */
  const moveTo = (x, y, type) => {
    zoomTo(x, y);

    const dx = x - playerPos.x;
    const dy = y - playerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = (distance / SPEED) * 500;

    setIsMoving(true);
    setPlayerPos({ x, y });

    clearTimeout(timeoutRef.current);

    // ⏱ modal / esemény hamarabb nyílik
    // Kicsit növeltem az időzítést (0.5 -> 0.8), hogy a karakter odaérjen, mielőtt váltunk
    timeoutRef.current = setTimeout(() => {
      openModal(type);
    }, duration * 0.8);

    // mozgás befejezése
    setTimeout(() => {
      setIsMoving(false);
    }, duration);
  };

  const openModal = (type) => {
    if (type === "shop") setShowShop(true);
    if (type === "blacksmith") setShowBlacksmith(true);
    if (type === "inv") setShowInv(true);
    if (type === "quest") setShowQuestBoard(true);
    
    // JAVÍTÁS: Itt történik a varázslat
    if (type === "adventure") {
        // Nem nyitunk helyi loading screen-t!
        // Csak visszaállítjuk a zoomot és szólunk az App-nak.
        resetZoom();
        if (onGoAdventure) {
            onGoAdventure(); 
        }
    }
  };

  const CLASS_STRING = {
    6: "warrior",
    7: "mage",
    8: "archer",
  };

  return (
    <div className="hub-root">
      <div className="camera">
        {/* 🌍 WORLD – EZ MOZOG & ZOOMOL */}
        <div
          className={`world ${isZooming ? "hub-zooming" : ""}`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        >
          {/* 🗺️ HUB */}
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
            style={{
              left: `${playerPos.x}%`,
              top: `${playerPos.y}%`,
            }}
          />
        </div>
      </div>

      {/* MODALOK */}
      {showShop && <ShopModal onClose={() => { setShowShop(false); resetZoom(); }} />}
      {showBlacksmith && <BlacksmithModal onClose={() => { setShowBlacksmith(false); resetZoom(); }} />}
      {showInv && <InvModal onClose={() => { setShowInv(false); resetZoom(); }} />}

      {showQuestBoard && player && (
        <QuestBoardModal
          playerId={player.id}
          playerClassId={CLASS_STRING[player.class_id]}
          onClose={() => { setShowQuestBoard(false); resetZoom(); }}
        />
      )}

      {/* TÖRÖLVE: Itt volt a <LoadingScreen />, most már nincs itt semmi. */}
    </div>
  );
}