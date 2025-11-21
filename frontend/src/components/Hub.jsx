import React, { useState, useEffect, useRef } from "react";
import CharacterPanel from "./CharacterPanel.jsx";
import ShopModal from "./BoltModal.jsx";
import BlacksmithModal from "./KovacsModal.jsx";
import InvModal from "./Inv.jsx";

export default function Hub({ onGoCombat }) {
  const [adventureTimer, setAdventureTimer] = useState(0);
  const [isAdventuring, setIsAdventuring] = useState(false);

  const [showShop, setShowShop] = useState(false);
  const [showBlacksmith, setShowBlacksmith] = useState(false);
  const [showInv, setShowInv] = useState(false);

  const [playerPos, setPlayerPos] = useState({ x: 40, y: 75 });
  const [isMoving, setIsMoving] = useState(false);
  const [language, setLanguage] = useState("hu");

  // 🔹 ÚJ: a jelenlegi célpont és referencia
  const [currentTarget, setCurrentTarget] = useState(null);
  const targetRef = useRef(null);

  useEffect(() => {
    targetRef.current = currentTarget;
  }, [currentTarget]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.documentElement.style.margin = "0";
    document.body.style.padding = "0";
    document.documentElement.style.padding = "0";

    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, []);

  const startAdventure = () => {
    if (isAdventuring) return;
    setIsAdventuring(true);
    setAdventureTimer(5);

    const interval = setInterval(() => {
      setAdventureTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsAdventuring(false);
          onGoCombat();
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
    if (type === "settings") alert("Beállítások — ide jön majd a modal");
  };

  // 🔧 JAVÍTOTT MOVE LOGIKA
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
      if (targetRef.current === type) {
        openModal(type);
      }
    }, 2000);
  };

  // 🔹 MODÁL BEZÁRÁS
  const handleClose = (setFn) => {
    setFn(false);
    setCurrentTarget(null);
    targetRef.current = null;
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center text-white overflow-hidden"
      style={{
        backgroundImage: `url("./src/assets/pics/HUB.jpg")`,
        backgroundSize: "cover",
      }}
    >
      {/* 🔤 NYELVVÁLTÓ */}
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

      {/* KALAND */}
      <div
        className="absolute cursor-pointer group"
        style={{
          left: "50%",
          bottom: "40%",
          width: "400px",
          height: "460px",
          
        }}
        onClick={() => moveTo(60, 50, "adventure")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition">
         
        </div>
      </div>

      {/* KOVÁCS */}
      <div
        className="absolute cursor-pointer group"
        style={{
          left: "15%",
          bottom: "30%",
          width: "470px",
          height: "400px",
          
        }}
        onClick={() => moveTo(35, 65, "blacksmith")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition">
         
        </div>
      </div>

      {/* BOLT */}
      <div
        className="absolute cursor-pointer group"
        style={{
          right: "15%",
          bottom: "7%",
          width: "600px",
          height: "350px",
          
        }}
        onClick={() => moveTo(50, 85, "shop")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition">
         
        </div>
      </div>

      {/* INV */}
      <div
        className="absolute cursor-pointer group"
        style={{
          left: "0%",
          bottom: "4%",
          width: "600px",
          height: "200px",
          
        }}
        onClick={() => moveTo(33, 85, "inv")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition">
          
        </div>
      </div>

      {/* BEÁLLÍTÁSOK
      <div
        className="absolute cursor-pointer group"
        style={{
          left: "35%",
          bottom: "5%",
          width: "150px",
          height: "150px",
          backgroundColor: "red",
        }}
        onClick={() => moveTo(30, 80, "settings")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition">
          {language === "hu" ? "BEÁLL." : "SETTINGS"}
        </div>
      </div> */}

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
          width: "4%",
          imageRendering: "pixelated",
          
        }}
      />

      {/* MODÁLOK */}
      {showShop && <ShopModal onClose={() => handleClose(setShowShop)} />}
      {showBlacksmith && (
        <BlacksmithModal onClose={() => handleClose(setShowBlacksmith)} />
      )}
      {showInv && <InvModal onClose={() => handleClose(setShowInv)} />}

      {/* KALAND ÉRTESÍTÉS */}
      {isAdventuring && (
        <div className="absolute bottom-[32%] left-0 right-0 text-center">
          <div className="inline-block bg-black/70 px-4 py-2 rounded shadow-lg">
            {language === "hu"
              ? `Utazás folyamatban... (${adventureTimer})`
              : `Travelling... (${adventureTimer})`}
          </div>
        </div>
      )}
    </div>
  );
}
