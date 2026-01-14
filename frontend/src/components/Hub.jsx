import React, { useState, useRef, useEffect } from "react";
import ShopModal from "./BoltModal.jsx";
import BlacksmithModal from "./KovacsModal.jsx";
import InvModal from "./Inv.jsx";
import QuestBoardModal from "./QuestBoardModal.jsx";
import { usePlayer } from "../context/PlayerContext.jsx";
import LoadingScreen from "./LoadingScreen.jsx";
import "./Hub.css";

export default function Hub({ onGoAdventure }) {
  const { player } = usePlayer();

  const [playerPos, setPlayerPos] = useState({ x: 40, y: 75 });
  const [isMoving, setIsMoving] = useState(false);

  const [showShop, setShowShop] = useState(false);
  const [showBlacksmith, setShowBlacksmith] = useState(false);
  const [showInv, setShowInv] = useState(false);
  const [showQuestBoard, setShowQuestBoard] = useState(false);
  const [isAdventuring, setIsAdventuring] = useState(false);

  /** ZOOM STATE */
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const timeoutRef = useRef(null);

  const SPEED = 20; // % / másodperc

  /** BETÖLTÉSKORI ZOOM */
  useEffect(() => {
    setZoom(1.5);
    setTimeout(() => setZoom(1), 100);
  }, []);

  /** KAMERA ZOOM EGY PONTRA */
  const zoomTo = (xPercent, yPercent, zoomLevel = 1.6) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // cél pozíció pixelben
  const targetX = (xPercent / 100) * vw;
  const targetY = (yPercent / 100) * vh;

  // viewport közepe
  const centerX = vw / 2;
  const centerY = vh / 2;

  // eltolás számítása (scale kompenzációval!)
  const x = (centerX - targetX) / zoomLevel;
  const y = (centerY - targetY) / zoomLevel;

  setZoom(zoomLevel);
  setOffset({ x, y });
};

  const resetZoom = () => {
  setZoom(1);
  setOffset({ x: 0, y: 0 });
};

  /** MOZGÁS + MODAL */
  const moveTo = (x, y, type) => {
    zoomTo(x, y);

    const dx = x - playerPos.x;
    const dy = y - playerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = (distance / SPEED) * 1000;

    setIsMoving(true);
    setPlayerPos({ x, y });

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsMoving(false);
      openModal(type);
    }, duration);
  };

  const openModal = (type) => {
    if (type === "shop") setShowShop(true);
    if (type === "blacksmith") setShowBlacksmith(true);
    if (type === "inv") setShowInv(true);
    if (type === "quest") setShowQuestBoard(true);
    if (type === "adventure") setIsAdventuring(true);
  };

  const CLASS_STRING = {
    6: "warrior",
    7: "mage",
    8: "archer",
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      {/* ZOOMOLHATÓ HUB */}
      <div
         className={`w-full h-full transition-transform duration-[1200ms] ease-in-out ${
    isMoving ? "hub-motion" : ""
  }`}
        style={{
          transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
          transformOrigin: "center center",
          backgroundImage: `url("./src/assets/pics/HUB.png")`,
          backgroundSize: "cover",
        }}
      >
        {/* INTERAKCIÓS ZÓNÁK */}
        <div
          className="absolute cursor-pointer group"
          style={{ left: "38%", bottom: "15%", width: "440px", height: "500px" }}
          onClick={() => moveTo(50, 80, "adventure")}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
        </div>

        <div
          className="absolute cursor-pointer group"
          style={{ left: "5%", bottom: "10%", width: "600px", height: "350px" }}
          onClick={() => moveTo(30, 85, "blacksmith")}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
        </div>

        <div
          className="absolute cursor-pointer group"
          style={{ right: "20%", bottom: "10%", width: "330px", height: "450px" }}
          onClick={() => moveTo(65, 80, "shop")}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
        </div>

        <div
          className="absolute cursor-pointer group"
          style={{ right: "5%", bottom: "10%", width: "280px", height: "250px" }}
          onClick={() => moveTo(85, 85, "inv")}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
        </div>

        <div
          className="absolute cursor-pointer group"
          style={{ right: "40%", top: "10%", width: "320px", height: "220px" }}
          onClick={() => moveTo(50, 80, "quest")}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
        </div>

        {/* PLAYER */}
        <img
          src="./src/assets/pics/TESZT.PNG"
          alt="player"
          className={`absolute transition-all duration-[2000ms] ease-in-out ${
            isMoving ? "brightness-125" : ""
          }`}
          style={{
            left: `${playerPos.x}%`,
            top: `${playerPos.y}%`,
            transform: "translate(-50%, -50%)",
            width: "5%",
          }}
        />
      </div>

      {/* MODALOK */}
      {showShop && (
        <ShopModal
          onClose={() => {
            setShowShop(false);
            resetZoom();
          }}
        />
      )}

      {showBlacksmith && (
        <BlacksmithModal
          onClose={() => {
            setShowBlacksmith(false);
            resetZoom();
          }}
        />
      )}

      {showInv && (
        <InvModal
          onClose={() => {
            setShowInv(false);
            resetZoom();
          }}
        />
      )}

      {showQuestBoard && player && (
        <QuestBoardModal
          playerId={player.id}
          playerClassId={CLASS_STRING[player.class_id]}
          onClose={() => {
            setShowQuestBoard(false);
            resetZoom();
          }}
        />
      )}

      {/* LOADING */}
      {isAdventuring && (
        <LoadingScreen
          onDone={() => {
            setIsAdventuring(false);
            resetZoom();
            onGoAdventure && onGoAdventure();
          }}
        />
      )}
    </div>
  );
}
