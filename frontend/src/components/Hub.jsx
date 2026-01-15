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
  const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max);
  const [playerPos, setPlayerPos] = useState({ x: 40, y: 75 });
  const [isMoving, setIsMoving] = useState(false);

  const [showShop, setShowShop] = useState(false);
  const [showBlacksmith, setShowBlacksmith] = useState(false);
  const [showInv, setShowInv] = useState(false);
  const [showQuestBoard, setShowQuestBoard] = useState(false);
  const [isAdventuring, setIsAdventuring] = useState(false);
  const hubRef = useRef(null);
  /** ZOOM STATE */
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  const timeoutRef = useRef(null);

  const SPEED = 20; // % / másodperc

  /** BETÖLTÉSKORI ZOOM */
  useEffect(() => {
    setZoom(1);
    setTimeout(() => setZoom(1), 100);
  }, []);

  /** KAMERA ZOOM EGY PONTRA */
  const zoomTo = (xPercent, yPercent, zoomLevel = 1) => {
  if (!hubRef.current) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const worldW = hubRef.current.offsetWidth;
  const worldH = hubRef.current.offsetHeight;

  const targetX = (xPercent / 100) * worldW;
  const targetY = (yPercent / 100) * worldH;

  const centerX = vw / 2;
  const centerY = vh / 2;

  let offsetX = (centerX - targetX * zoomLevel) / zoomLevel;
  let offsetY = (centerY - targetY * zoomLevel) / zoomLevel;

  // 🔒 CLAMP – EZ OLDJA MEG A CSÍKOSODÁST
  const maxX = 0;
  const maxY = 0;

  const minX = vw - worldW * zoomLevel;
  const minY = vh - worldH * zoomLevel;

  offsetX = clamp(offsetX, minX / zoomLevel, maxX);
  offsetY = clamp(offsetY, minY / zoomLevel, maxY);

  setZoom(zoomLevel);
  setOffset({ x: offsetX, y: offsetY });
};

  const resetZoom = () => {
  setZoom(1);
  setOffset({ x: 0, y: 0 });
};

  /** MOZGÁS + MODAL */
  const moveTo = (x, y, type) => {
    setIsZooming(true);
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
          ref={hubRef} className={`hub-camera transition-transform duration-[1200ms] ease-in-out ${
    isZooming ? "hub-zooming" : ""
  }`}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
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
          style={{ right: "20%", bottom: "10%", width: "330px", height: "270px" }}
          onClick={() => moveTo(65, 80, "quest")}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
        </div>

        <div
          className="absolute cursor-pointer group"
          style={{ right: "5%", bottom: "10%", width: "280px", height: "250px" }}
          onClick={() => moveTo(85, 85, "shop")}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
        </div>

        <div
          className="absolute cursor-pointer group"
          style={{ right: "20%", bottom: "35%", width: "330px", height: "270px" }}
          onClick={() => moveTo(60, 80, "inv")}
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
