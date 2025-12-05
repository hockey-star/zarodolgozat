// frontend/src/components/Hub.jsx
import React, { useState, useEffect, useRef } from "react";
import CharacterPanel from "./CharacterPanel.jsx";
import ShopModal from "./BoltModal.jsx";
import BlacksmithModal from "./KovacsModal.jsx";
import InvModal from "./Inv.jsx";
import QuestBoardModal from "./QuestBoardModal.jsx";
import { usePlayer } from "../context/PlayerContext.jsx";
import toltocsik from "../assets/icons/toltocsik.png";
import "./Hub.css";

export default function Hub({ onGoCombat }) {
  const { player, setPlayer } = usePlayer();
  const [adventureTimer, setAdventureTimer] = useState(0);
  const [isAdventuring, setIsAdventuring] = useState(false);

  const [showShop, setShowShop] = useState(false);
  const [showBlacksmith, setShowBlacksmith] = useState(false);
  const [showInv, setShowInv] = useState(false);
  const [showQuestBoard, setShowQuestBoard] = useState(false);

  const [playerPos, setPlayerPos] = useState({ x: 40, y: 75 });
  const [isMoving, setIsMoving] = useState(false);
  const [language, setLanguage] = useState("hu");

  const [currentTarget, setCurrentTarget] = useState(null);
  const targetRef = useRef(null);

  useEffect(() => {
    targetRef.current = currentTarget;
  }, [currentTarget]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, []);

  // Kaland indítása
  const startAdventure = () => {
    if (isAdventuring) return;
    setIsAdventuring(true);
    setAdventureTimer(5);

    const interval = setInterval(() => {
      setAdventureTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsAdventuring(false);

          onGoCombat && onGoCombat();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const openModal = (type) => {
    if (type === "shop") setShowShop(true);
    if (type === "blacksmith") setShowBlacksmith(true);
    if (type === "adventure") startAdventure();
    if (type === "inv") setShowInv(true);
    if (type === "quest") setShowQuestBoard(true);
  };

  const CLASS_STRING = {
  6: "warrior",
  7: "mage",
  8: "archer",
};
  // Játékos mozgatása
  const moveTo = (x, y, type) => {
    if (Math.abs(playerPos.x - x) < 1 && Math.abs(playerPos.y - y) < 1) {
      openModal(type);
      return;
    }

    setCurrentTarget(type);
    targetRef.current = type;
    setIsMoving(true);
    setPlayerPos({ x, y });

    setTimeout(() => {
      setIsMoving(false);
      if (targetRef.current === type) openModal(type);
    }, 2000);
  };

  const handleClose = (setFn) => {
    setFn(false);
    setCurrentTarget(null);
    targetRef.current = null;
  };

  // Harcból visszatérés – full heal
  function handleCombatEnd(finalHP, victory) {
    console.log("Combat ended. Victory:", victory, "HP:", finalHP);

    if (!setPlayer) return;

    setPlayer((prev) =>
      prev
        ? {
            ...prev,
            hp: prev.max_hp,
          }
        : prev
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center text-white overflow-hidden"
      style={{
        backgroundImage: `url("./src/assets/pics/HUB.jpg")`,
        backgroundSize: "cover",
      }}
    >
      {/* Nyelvváltó */}
      <div className="absolute top-4 left-4 flex gap-2">
        <div
          onClick={() => setLanguage("hu")}
          className={`cursor-pointer px-2 py-1 rounded text-xs font-semibold ${
            language === "hu" ? "bg-yellow-600" : "bg-black/50 hover:bg-black/70"
          }`}
        >
          🇭🇺 HU
        </div>
        <div
          onClick={() => setLanguage("en")}
          className={`cursor-pointer px-2 py-1 rounded text-xs font-semibold ${
            language === "en" ? "bg-yellow-600" : "bg-black/50 hover:bg-black/70"
          }`}
        >
          🇬🇧 EN
        </div>
      </div>

      {/* Kaland */}
      <div
        className="absolute cursor-pointer group"
        style={{
          left: "38%",
          bottom: "15%",
          width: "440px",
          height: "500px",
        }}
        onClick={() => moveTo(50, 80, "adventure")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
      </div>

      {/* Kovács */}
      <div
        className="absolute cursor-pointer group"
        style={{
          left: "5%",
          bottom: "10%",
          width: "600px",
          height: "350px",
        }}
        onClick={() => moveTo(30, 85, "blacksmith")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
      </div>

      {/* Bolt */}
      <div
        className="absolute cursor-pointer group"
        style={{
          right: "20%",
          bottom: "10%",
          width: "330px",
          height: "450px",
        }}
        onClick={() => moveTo(65, 80, "shop")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
      </div>

      {/* Inventory / Deck */}
      <div
        className="absolute cursor-pointer group"
        style={{
          right: "5%",
          bottom: "10%",
          width: "280px",
          height: "250px",
        }}
        onClick={() => moveTo(85, 85, "inv")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
      </div>

      {/* Quest Board interakciós zóna */}
      <div
        className="absolute cursor-pointer group"
        style={{
          right: "40%",
          top: "10%",
          width: "320px",
          height: "220px",
        }}
        onClick={() => moveTo(50, 80, "quest")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
      </div>
        
      {/* Játékos sprite */}
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

      {/* MODÁLOK */}
      {showShop && <ShopModal onClose={() => handleClose(setShowShop)} />}
      {showBlacksmith && (
        <BlacksmithModal onClose={() => handleClose(setShowBlacksmith)} />
      )}
      
      {showInv && <InvModal onClose={() => handleClose(setShowInv)} />}
      {showQuestBoard && player && (
  <QuestBoardModal
    playerId={player.id}
    playerClassId={CLASS_STRING[player.class_id]} // <-- STRING!
    onClose={() => handleClose(setShowQuestBoard)}
  />
)}

      {/* Utazás számláló */}
      {isAdventuring && (
        <div className="absolute bottom-[32%] left-0 right-0 text-center">
          <div className="inline-block bg-black/70 px-4 py-2 rounded shadow-lg">
            {language === "hu"
              ? `Utazás... (${adventureTimer})`
              : `Travelling... (${adventureTimer})`}
          </div>
        </div>
      )}
      {/* TÖLTŐCSÍK – csak akkor látszik, ha épp kalandozik */}
{isAdventuring && (
  <div className="loaderBox">

    {/* KERET (PNG) */}
    <img src={toltocsik} className="loaderFrame" alt="loading frame" />

    {/* A PIROS KITÖLTŐ CSÍK */}
    <div className="loaderFill" />
  </div>
)}







    </div>
    
  );
}
