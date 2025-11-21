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

function AppInner() {
  const [screen, setScreen] = useState("login");
  const [combatPath, setCombatPath] = useState(null);
  const [level, setLevel] = useState(1);
  const [combatFinished, setCombatFinished] = useState(false); // védelem dupla trigger ellen
  const { setPlayer } = usePlayer();

  // 🔹 LOGIN FLOW
  async function handleLogin(username) {
    try {
      const res = await fetch(`http://localhost:3000/api/user/${encodeURIComponent(username)}`);
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

  // 🔹 KÖZTES NAVIGÁCIÓ
  function goto(next) {
    setScreen(next);
  }

  // 🔹 HARCFLOW
  function handleStartCombat(path) {
    setCombatPath(path);
    setScreen("combat");
    setCombatFinished(false);
  }

  function handleCombatEnd(playerHP, victory) {
    if (combatFinished) return;
    setCombatFinished(true);

    if (!victory) {
      alert("☠️ Elbuktál! Vissza a hubba.");
      setScreen("hub");
      setLevel(1);
      return;
    }

    if (level < 11) {
      setTimeout(() => {
        setLevel((prev) => prev + 1);
        setScreen("pathChoice");
      }, 300);
    } else {
      alert("🏆 Gratulálok, legyőzted a boss-t!");
      setScreen("hub");
      setLevel(1);
    }
  }

  return (
    <>
      {screen === "login" && <LoginScreen onLogin={handleLogin} />}

      {screen === "class" && <ClassSelect onNext={() => goto("trailer")} />}

      {screen === "trailer" && <Trailer onEnd={() => goto("hub")} />}

      {screen === "hub" && (
        <Hub
          onGoAdventure={() => setScreen("adventure")}
          onGoCombat={() => setScreen("pathChoice")}
        />
      )}

      {screen === "adventure" && (
        <AdventureHandler onAdventureComplete={() => setScreen("pathChoice")} />
      )}

      {screen === "pathChoice" && (
        <PathChoice
          level={level}
          onChoose={handleStartCombat}
          background={`./src/assets/backgrounds/3.jpg`}
        />
      )}

      {screen === "combat" && combatPath && (
        <CombatView
          level={level}
          enemies={
            level === 11
              ? ["Vérfarkas Úr", "Ősi Árny"]
              : ["Goblin", "Bandita", "Sötét Harcos"]
          }
          boss={level === 11}
          background={`./src/assets/backgrounds/3.jpg`}
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
