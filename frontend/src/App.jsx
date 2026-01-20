// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
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

import LoadingScreen from "./components/LoadingScreen.jsx";
import EventView from "./components/EventView.jsx";
import wizardBg from "./assets/pics/EVENT_WIZARD_PLACEHOLDER.png";

import { defaultEnemies, bossEnemies } from "./components/enemyData.js";

const FINAL_BOSS_LEVEL = 16;


// ===== INTRO-ONLY EVENT CONFIG =====
const EVENT_CHANCE = 0.35; // teszt: mindig (később állítható)

const EVENT_POOL = [
  {
    id: "wizard",
    title: "Vándor varázsló",
    story:
      "Az út porában egy köpenyes varázsló lép eléd. Egy fiolát tart feléd.\n\n„Erőt ad… vagy elátkoz.”",
    background: wizardBg,
    choices: [
      {
        label: "Megiszom",
        resolve: () => {
          if (Math.random() < 0.7) return { dmgMult: 1.1, pathsLeft: 3 };
          return { poisonTurns: 2, pathsLeft: 5 };
        },
      },
      { label: "Elutasítom", resolve: () => null },
    ],
  },
];

// Lightweight WEBM preload + warmup (NO blob, less GC stutter)
function preloadWebm(urls, { max = 6 } = {}) {
  const list = (urls || []).filter(Boolean).slice(0, max);

  // 1) hint browser to preload
  for (const url of list) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = url;
    document.head.appendChild(link);
  }

  // 2) warm up decoder a bit, when browser is idle
  const run = async () => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.style.position = "fixed";
    v.style.left = "-99999px";
    v.style.width = "1px";
    v.style.height = "1px";
    document.body.appendChild(v);

    for (const url of list) {
      try {
        v.src = url;
        v.load();

        await new Promise((resolve) => {
          const on = () => {
            v.removeEventListener("loadedmetadata", on);
            v.removeEventListener("error", on);
            resolve();
          };
          v.addEventListener("loadedmetadata", on);
          v.addEventListener("error", on);
        });

        const p = v.play();
        if (p?.catch) await p.catch(() => {});
        v.pause();
        v.currentTime = 0;
      } catch {
        // ignore
      }
    }

    // cleanup warmup element
    try {
      v.removeAttribute("src");
      v.load();
      document.body.removeChild(v);
    } catch {
      // ignore
    }
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 1500 });
  } else {
    setTimeout(run, 300);
  }
}

function AppInner() {
  // screens:
  // login | class | trailer | hub | loading | event | pathChoice | combat | restCampfire | adventure
  const [screen, setScreen] = useState("login");

  const [combatPath, setCombatPath] = useState(null);
  const [level, setLevel] = useState(1);
  const [combatFinished, setCombatFinished] = useState(false);
  const [pathRerollKey, setPathRerollKey] = useState(0);
  const [showTransition, setShowTransition] = useState(false);

  // Intro-only travel + event
  const [introTravelDone, setIntroTravelDone] = useState(false); // ✅ csak egyszer
  const [loadingMode, setLoadingMode] = useState(null); // "intro" | null
  const [activeEvent, setActiveEvent] = useState(null);

  // Run effects (ha később CombatView kezeli)
  const [runEffect, setRunEffect] = useState(null);

  const [deathScreenOpen, setDeathScreenOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  const { setPlayer } = usePlayer();


  const introLoadingLockRef = React.useRef(false);

  // Preload only a few frequently used WEBMs (transition + top vfx)
  useEffect(() => {
    preloadWebm([combatIntroVideo], { max: 6 });
  }, []);

  function goto(next) {
    setScreen(next);
  }

function handleGoAdventure() {
  if (introTravelDone) {
    // már volt az intro loading → mehet PathChoice
    setScreen("pathChoice");
    return;
  }

  // ha még nem volt intro loading
  setLoadingMode("intro");
  setScreen("loading");
}
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

  function startCombatWithPath(path) {
    setCombatPath(path);
    setCombatFinished(false);
    setScreen("combat");
    setShowTransition(true);
  }

  function handleStartPath(path) {
    // REST ág változatlan
    if (path.type === "rest") {
      setPlayer((prev) => {
        if (!prev) return prev;
        const maxHp = prev.max_hp ?? prev.hp ?? 100;
        const currentHp = prev.hp ?? maxHp;
        const healAmount = Math.floor(maxHp * 0.4);
        const newHp = Math.min(maxHp, currentHp + healAmount);
        return { ...prev, hp: newHp };
      });

      setCombatPath(null);
      setScreen("restCampfire");
      return;
    }

    // ✅ PathChoice után NINCS loading/event — azonnal combat
    startCombatWithPath(path);
  }
  
const handleLoadingDone = React.useCallback(() => {
  // Ha már lefutott, VAGY épp nincs loading módban (védőháló)
  if (loadingMode !== "intro" || introTravelDone) return;

  setLoadingMode(null);
  setIntroTravelDone(true); // Ez az állapotváltozás megakadályozza a jövőbeli futást

  const chance = Number(EVENT_CHANCE);
  const roll = Math.random();
  const shouldEvent = chance >= 1 || roll < chance;

  if (shouldEvent) {
    // Itt a random eventet állítjuk be
    const ev = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    setActiveEvent(ev);
    setScreen("event");
  } else {
    setScreen("pathChoice");
  }
}, [loadingMode, introTravelDone]);

  function handleEventChoose(choice) {
    const effect = choice.resolve();
    if (effect) setRunEffect(effect);

    setActiveEvent(null);

    // ✅ event után PathChoice jön (mert még nem választottál ösvényt)
    setScreen("pathChoice");
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

      setDeathScreenOpen(true);
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

      {screen === "hub" && <Hub onGoAdventure={handleGoAdventure} />}

      {screen === "loading" && <LoadingScreen onDone={handleLoadingDone} />}

      {screen === "event" && activeEvent && (
        <EventView event={activeEvent} onChoose={handleEventChoose} />
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
          // runEffect={runEffect} // ha a CombatView támogatja
          onEnd={handleCombatEnd}
        />
      )}

      {/* DEATH SCREEN (solid black, blocks everything) */}
      {deathScreenOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
          <div className="w-[420px] rounded-2xl bg-zinc-900 p-8 text-center shadow-2xl border border-zinc-700">
            <div className="text-4xl font-extrabold text-red-600 mb-4">
              ☠️ ELBUKTÁL
            </div>

            <div className="text-zinc-300 mb-8">
              A harc véget ért. Visszatérsz a hubba, és a HP-d feltöltődik.
            </div>

            <button
              onMouseDown={() => setPressed(true)}
              onMouseUp={() => setPressed(false)}
              onMouseLeave={() => setPressed(false)}
              onClick={() => {
                setPressed(false);
                setDeathScreenOpen(false);
                setScreen("hub");
                setLevel(1);
                setCombatPath(null);
              }}
              style={{
                color: "#fef9c2",
                backgroundColor: "#460809",
                padding: "15px 40px",
                margin: "10px",
                textAlign: "center",
                fontSize: "20px",
                fontFamily: '"Jersey 10", sans-serif',
                border: 0,
                cursor: "pointer",
                transform: pressed ? "translateY(5px)" : "translateY(0px)",
                boxShadow: pressed
                  ? `
                      0px 5px black,
                      0px -5px black,
                      5px 0px black,
                      -5px 0px black,
                      inset 0px 5px #00000038
                    `
                  : `
                      0px 5px black,
                      0px -5px black,
                      5px 0px black,
                      -5px 0px black,
                      0px 10px #00000038,
                      5px 5px #00000038,
                      -5px 5px #00000038,
                      inset 0px 5px #ffffff36
                    `,
              }}
            >
              Vissza a hubba
            </button>
          </div>
        </div>
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
