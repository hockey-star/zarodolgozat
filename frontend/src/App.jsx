import React, { useState } from "react";
import LoginScreen from "./components/LoginScreen.jsx";
import ClassSelect from "./components/ClassSelect.jsx";
import Hub from "./components/Hub.jsx";
import AdventureHandler from "./components/AdventureHandler.jsx";
import PathChoice from "./components/PathChoice.jsx";
import CombatView from "./components/CombatView.jsx";
import { PlayerProvider } from "./context/PlayerContext.jsx";

export default function App() {
  const [screen, setScreen] = useState("login");
  const [combatPath, setCombatPath] = useState(null);
  const [level, setLevel] = useState(1);
  const [combatFinished, setCombatFinished] = useState(false); // ✅ új védelem

  function handleStartCombat(path) {
    setCombatPath(path);
    setScreen("combat");
    setCombatFinished(false); // reset, mielőtt új harc indul
  }

  function handleCombatEnd(playerHP, victory) {
    // ha már lefutott egyszer, ne fusson mégegyszer
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
      }, 300); // kis delay, hogy ne ütközzön render
    } else {
      alert("🏆 Gratulálok, legyőzted a boss-t!");
      setScreen("hub");
      setLevel(1);
    }
  }
  

  return (
    <PlayerProvider>
      <div className="min-h-screen bg-black text-gray-100">
        <div className="max-w-5xl mx-auto">
          {screen === "login" && <LoginScreen onNext={() => setScreen("class")} />}

          {screen === "class" && <ClassSelect onNext={() => setScreen("hub")} />}

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
        </div>
      </div>
    </PlayerProvider>
  );
}
