// frontend/src/App.jsx
import React, { useState } from "react";
import { PlayerProvider, usePlayer } from "./context/PlayerContext.jsx";

import LoginScreen from "./components/LoginScreen.jsx";
import ClassSelect from "./components/ClassSelect.jsx";
import Trailer from "./components/Trailer.jsx";
import Hub from "./components/Hub.jsx";
import AdventureHandler from "./components/AdventureHandler.jsx";
import PathChoice from "./components/PathChoice.jsx";
import CombatView from "./components/CombatView.jsx";
import RestCampfire from "./components/RestCampfire.jsx";

import {
  defaultEnemies,
  bossEnemies,
} from "./components/enemyData.js";

const FINAL_BOSS_LEVEL = 16;

function AppInner() {
  const [screen, setScreen] = useState("login");
  const [combatPath, setCombatPath] = useState(null);
  const [level, setLevel] = useState(1);
  const [combatFinished, setCombatFinished] = useState(false);
  const [pathRerollKey, setPathRerollKey] = useState(0); // rest után új PathChoice RNG
  const { setPlayer } = usePlayer();

  // 🔹 LOGIN FLOW
  async function handleLogin(username) {
    try {
      const res = await fetch(
        `http://localhost:3000/api/user/${encodeURIComponent(username)}`
      );
      const data = await res.json();
      if (!data.exists) return alert("User nem található (backend)");

      setPlayer(data.user);

      if (data.user.class_id) setScreen("hub");
      else setScreen("class");
    } catch (e) {
      console.error("handleLogin error:", e);
      alert("Szerver hiba (get user)");
    }
  }

  function goto(next) {
    setScreen(next);
  }

  // 🔹 PathChoice → REST / FIGHT / ELITE / MYSTERY
  function handleStartPath(path) {
    // path: { type: "fight" | "elite" | "mystery" | "rest" }

    // 😴 REST – kitérés, NEM lépteti a levelt
    if (path.type === "rest") {
      setPlayer((prev) => {
        if (!prev) return prev;
        const maxHp = prev.max_hp ?? prev.hp ?? 100;
        const currentHp = prev.hp ?? maxHp;
        const healAmount = Math.floor(maxHp * 0.4); // kb 40% heal
        const newHp = Math.min(maxHp, currentHp + healAmount);

        // opcionális: kis instant info
        alert(`😴 Pihenés: +${healAmount} HP (most ${newHp}/${maxHp})`);

        return {
          ...prev,
          hp: newHp,
        };
      });

      // átmegyünk a tábortűz képernyőre
      setCombatPath(null);
      setScreen("restCampfire");
      return;
    }

    // minden más: combat path
    setCombatPath(path);
    setScreen("combat");
    setCombatFinished(false);
  }

  /**
   * CombatView → onEnd(playerHP, victory)
   */
  function handleCombatEnd(playerHP, victory) {
    if (combatFinished) return;
    setCombatFinished(true);

    // ELBUKTÁL → vissza hub + full heal
    if (!victory) {
      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              hp: prev.max_hp ?? prev.hp,
            }
          : prev
      );

      alert("☠️ Elbuktál! Vissza a hubba.");
      setScreen("hub");
      setLevel(1);
      setCombatPath(null);
      return;
    }

    // ha még NEM final boss volt
    if (level < FINAL_BOSS_LEVEL) {
      setTimeout(() => {
        setLevel((prev) => prev + 1); // 🔥 csak COMBAT után lépünk előre!
        setScreen("pathChoice");
        setCombatPath(null);
      }, 300);
    } else {
      // FINAL BOSS legyőzve
      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              hp: prev.max_hp ?? prev.hp,
            }
          : prev
      );

      alert("🏆 Gratulálok, legyőzted a végső bosst!");
      setScreen("hub");
      setLevel(1);
      setCombatPath(null);
    }
  }

  const isFinalBoss = level === FINAL_BOSS_LEVEL;

  // 🔹 REST CAMPFIRE -> vissza az ösvényre (ugyanaz a szint, új random opciók)
  function handleRestBackToPath() {
    setPathRerollKey((prev) => prev + 1); // új RNG PathChoice-ban
    setScreen("pathChoice");
  }

  // 🔹 REST CAMPFIRE -> hazamész
  function handleRestGoHub() {
    setLevel(1);
    setCombatPath(null);
    setScreen("hub");
  }

  return (
    <>
      {screen === "login" && <LoginScreen onLogin={handleLogin} />}

      {screen === "class" && <ClassSelect onNext={() => goto("trailer")} />}

      {screen === "trailer" && <Trailer onEnd={() => goto("hub")} />}

      {screen === "hub" && (
        <Hub
          onGoCombat={() => setScreen("pathChoice")}
        />
      )}

      {screen === "adventure" && (
        <AdventureHandler onAdventureComplete={() => setScreen("pathChoice")} />
      )}

      {screen === "pathChoice" && (
        <PathChoice
          level={level}
          rerollKey={pathRerollKey}
          onChoose={handleStartPath}
        />
      )}

      {screen === "restCampfire" && (
        <RestCampfire
          level={level}
          onBackToPath={handleRestBackToPath}
          onGoHub={handleRestGoHub}
        />
      )}

      {screen === "combat" && combatPath && (
        <CombatView
          level={level}
          enemies={isFinalBoss ? bossEnemies : defaultEnemies}
          boss={isFinalBoss}
          background={`./src/assets/backgrounds/3.jpg`}
          pathType={combatPath.type}
          onEnd={handleCombatEnd}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <div className="min-h-screen bg-black text-gray-100">
        <div className="max-w-5xl mx-auto">
          <AppInner />
        </div>
      </div>
    </PlayerProvider>
  );
}
