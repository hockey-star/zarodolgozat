import React, { useState, useEffect } from "react";
import CharacterPanel from "./CharacterPanel.jsx";
import ShopModal from "./BoltModal.jsx";
import BlacksmithModal from "./KovacsModal.jsx";
import InvModal from "./Inv.jsx";

export default function Hub({ onGoCombat }) {
  const [adventureTimer, setAdventureTimer] = useState(0);
  const [isAdventuring, setIsAdventuring] = useState(false);

  const [showShop, setShowShop] = useState(false);
  const [showBlacksmith, setShowBlacksmith] = useState(false);

  const [playerPos, setPlayerPos] = useState({ x: 50, y: 75 });
  const [isMoving, setIsMoving] = useState(false);

   const [showInv, setShowInv] = useState(false);

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

  const moveTo = (x, y, type) => {
    if (Math.abs(playerPos.x - x) < 1 && Math.abs(playerPos.y - y) < 1) {
      if (type === "shop") setShowShop(true);
      if (type === "blacksmith") setShowBlacksmith(true);
      if (type === "adventure") startAdventure();
      
      return;
    }

    setIsMoving(true);
    setPlayerPos({ x, y });

    setTimeout(() => {
      setIsMoving(false);
      if (type === "shop") setShowShop(true);
      if (type === "blacksmith") setShowBlacksmith(true);
      if (type === "adventure") startAdventure();
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center text-white overflow-hidden"
      style={{
        backgroundImage: `url("./src/assets/pics/HUB.jpg")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* BAL OLDAL */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 text-sm select-none">
        <img src= {"./src/assets/pics/TESZTprof.jpg"} style={{
          width: "350px",
          height: "350px",
          backgroundSize: "cover"
          }}/>

        <div style={{
          width: "350px",
          height: "25px",
          background: "red", 
          opacity: "50%"}}></div>

          <div style={{
          width: "150px",
          height: "150px",
          backgroundImage: `url(./src/assets/pics/LVL.png)`,
          backgroundSize: "cover",
          alignContent: "center", 
          opacity: "75%",
          color: "black",
          fontSize: "88px",
          textAlign: "center"}}>25</div>

          <div style={{
          width: "150px",
          height: "25px",
          color: "black",
          background: "gold",
          fontSize: "25px",
          opacity: "50%",
          textAlign: "center"}}>XP</div>

          
        <div className="arany">Arany</div>

        {/*INV*/}
        <img src= {"./src/assets/pics/bakpakk.png"} style={{
          width: "200px",
          height: "250px",
          backgroundSize: "cover",
          alignContent: "center"
          }}
          className="cursor-pointer group"
          onClick={() => setShowInv(true)}/>


      </div>

      {/* JOBB OLDAL */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 text-sm select-none items-end">
        
      </div>

      {/* KALAND HELY */}
      <div
        className="absolute cursor-pointer group"
        style={{
          left: "39%",
          bottom: "45%",
          width: "20%",
          height: "55%",
        }}
        onClick={() => moveTo(50, 10, "adventure")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
      </div>

      {/* KOVÁCS */}
      <div
        className="absolute cursor-pointer group"
        style={{
          left: "18%",
          bottom: "18%",
          width: "15%",
          height: "35%",
        }}
        onClick={() => moveTo(30, 60, "blacksmith")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
      </div>

      {/* BOLT */}
      <div
        className="absolute cursor-pointer group"
        style={{
          right: "16%",
          bottom: "20%",
          width: "14%",
          height: "34%",
        }}
        onClick={() => moveTo(70, 58, "shop")}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
      </div>

      {/* PLAYER */}
      <img
        src="./src/assets/pics/TESZT.PNG"
        alt="player"
        className={`absolute transition-all duration-[1500ms] ease-in-out ${isMoving ? "brightness-125" : ""}`}
        style={{
          left: `${playerPos.x}%`,
          top: `${playerPos.y}%`,
          transform: "translate(-50%, -50%)",
          width: "4%",
          imageRendering: "pixelated",
        }}
      />

      {/* MODÁLOK */}
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}
      {showBlacksmith && <BlacksmithModal onClose={() => setShowBlacksmith(false)} />}
      {showInv && <InvModal onClose={() => setShowInv(false)} />}

      {/* KALAND ÉRTESÍTÉS */}
      {isAdventuring && (
        <div className="absolute bottom-[32%] left-0 right-0 text-center">
          <div className="inline-block bg-black-700 px-4 py-2 rounded shadow-lg">
            Utazás folyamatban... ({adventureTimer})
          </div>
        </div>
      )}
    </div>
  );
}