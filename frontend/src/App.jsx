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

import TransitionOverlay from "./components/TransitionOverlay.jsx";
import combatIntroVideo from "./assets/transitions/combat-intro.webm";

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
  const [pathRerollKey, setPathRerollKey] = useState(0);
  const [showTransition, setShowTransition] = useState(false);

  const { setPlayer } = usePlayer();

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

  function handleStartPath(path) {
    if (path.type === "rest") {
      setPlayer((prev) => {
        if (!prev) return prev;
        const maxHp = prev.max_hp ?? prev.hp ?? 100;
        const currentHp = prev.hp ?? maxHp;
        const healAmount = Math.floor(maxHp * 0.4);
        const newHp = Math.min(maxHp, currentHp + healAmount);

        return {
          ...prev,
          hp: newHp,
        };
      });

      setCombatPath(null);
      setScreen("restCampfire");
      return;
    }

    setCombatPath(path);
    setCombatFinished(false);
    setScreen("combat");
    setShowTransition(true);
  }

  function handleCombatEnd(playerHP, victory) {
    if (combatFinished) return;
    setCombatFinished(true);

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

    if (level < FINAL_BOSS_LEVEL) {
      setTimeout(() => {
        setLevel((prev) => prev + 1);
        setScreen("pathChoice");
        setCombatPath(null);
      }, 300);
    } else {
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

  function handleRestBackToPath() {
    setPathRerollKey((prev) => prev + 1);
    setScreen("pathChoice");
  }

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
          background={`/backgrounds/3.jpg`}
          pathType={combatPath.type}
          onEnd={handleCombatEnd}
        />
      )}

      {showTransition && (
        <TransitionOverlay
          src={combatIntroVideo}
          onEnd={() => setShowTransition(false)}
          videoDelay={200}
          darkOpacityStart={1.0}
          darkOpacityMid={0.5}
          fadeDuration={600}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <div className="min-h-screen bg-black text-gray-100">
        <AppInner />
      </div>
    </PlayerProvider>
  );
}
