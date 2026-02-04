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

import "./App.css";

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
  const [questCombat, setQuestCombat] = useState(null);
  const [combatMode, setCombatMode] = useState("run"); // "run" | "quest"
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

  const { player, setPlayer } = usePlayer();


  const introLoadingLockRef = React.useRef(false);

  function startQuestBattle({ bossName, levelOverride } = {}) {
  setQuestCombat({
    level: levelOverride ?? level,
    enemies: [bossName],
    boss: true,
  });

  function handleQuestCombatEnd(playerHP, victory) {
  setQuestCombat(null);
  setCombatPath(null);

  // ha akarod: vissza hubba (questboardot user megnyitja)
  setScreen("hub");
}

  setCombatPath({ type: "quest" }); // csak hogy a screen==="combat" feltétel átmenjen
  setCombatFinished(false);
  setScreen("combat");
  setShowTransition(true); // ha nem kell intro questnél, ezt vedd ki
}

  // Preload only a few frequently used WEBMs (transition + top vfx)
  useEffect(() => {
    preloadWebm([combatIntroVideo], { max: 6 });
  }, []);

  function goto(next) {
    setScreen(next);
  }

function handleGoAdventure() {
  // mindig induljon az utazás
  setRunEffect(null);
  setActiveEvent(null);

  setIntroTravelDone(false);  // hogy a handleLoadingDone biztos lefusson
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

  //TÖRÉS CONST
  const [lampasBroken, setLampasBroken] = useState(false);
const [impact, setImpact] = useState(false);


useEffect(() => {
  if (!deathScreenOpen) return;

  setLampasBroken(false);
  setImpact(false);

  const timer = setTimeout(() => {
    setImpact(true);        // 💥 csak a lámpásnál
    setLampasBroken(true);

    setTimeout(() => setImpact(false), 70); // ~1 frame
  }, 1200);

  return () => clearTimeout(timer);
}, [deathScreenOpen]);



  return (
    <>
      {screen === "login" && <LoginScreen onLogin={handleLogin} />}

      {screen === "class" && <ClassSelect onNext={() => goto("trailer")} />}

      {screen === "trailer" && <Trailer onEnd={() => goto("hub")} />}

{screen === "hub" && (
  <Hub
    onGoAdventure={handleGoAdventure}
    onStartQuestBattle={(payload) => {
      setQuestCombat(payload);
      setCombatPath({ type: "quest" });     // hogy CombatView tudja: quest
      setCombatFinished(false);
      setShowTransition(true);
      setScreen("combat");
    }}
  />
)}

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
{screen === "combat" && (combatPath || questCombat) && (
  <CombatView
    level={level}
    enemies={questCombat?.enemies ?? (isFinalBoss ? bossEnemies : defaultEnemies)}
    boss={questCombat?.boss ?? isFinalBoss}
    background={`/backgrounds/3.jpg`}
    pathType={questCombat ? "quest" : combatPath.type}
    mode={questCombat ? "quest" : "run"}   // 👈 EZ A MODE
onEnd={async (result) => {
  // 🩸 HP frissítés (maradhat)
  if (result?.hpAfter != null) {
    setPlayer((prev) => (prev ? { ...prev, hp: result.hpAfter } : prev));
  }

  // 🧭 QUEST BATTLE ÁG
  if (result?.mode === "quest") {
    if (result.victory) {
      // csak akkor complete, ha van questId
      if (questCombat?.questId && player?.id) {
        await fetch("http://localhost:3000/api/quests/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: player.id,
            questId: questCombat.questId,
          }),
        });
      }

      setQuestCombat(null);
      setScreen("hub");
      return;
    }

    // ❌ QUEST DEFEAT → DEATH SCREEN
    setQuestCombat(null);
    setCombatPath(null);
    setDeathScreenOpen(true);   // ✅ EZ A LÉNYEG
    return;                     // ✅ ne menjen tovább
  }

  // ⚔️ NORMAL RUN COMBAT
  handleCombatEnd(result.hpAfter, result.victory);
}}

  />
)}
{/* DEATH SCREEN */}
{/* A lampasBroken állapot vezérli a sötétséget és a szöveg átalakulását is */}
{deathScreenOpen && (
  <div className={`deathScreen Halal ${lampasBroken ? "is-dark" : ""}`}>
    <div className="pixelGrain"></div>

    {/* A text mostantól dinamikusan változik a lampasBroken alapján */}
    <div className={`deathTitle ${lampasBroken ? "is-active" : ""}`}>
      ELBUKTÁL
    </div>

    <div className="lampasContainer">
      <div className="lampasSwingWrapper">
        
        {/* FÉNYEK: Csak akkor látszanak, ha NEM törött */}
        <div className="lampasAura auraBack" />
        <div className="lampasFloorLight" />

        {/* IMPACT: Töréskor villan a lámpáson */}
        {lampasBroken && <div className="lampasImpactOverlay" />}

        <img
          src={lampasBroken ? "/lampas/lampasTort.png" : "/lampas/lampas.png"}
          className={`lampas ${lampasBroken ? "broken-shake" : ""}`}
          alt="Lámpás"
        />
      </div>
    </div>

    <button
      className="VisszaAHubbaButton"
      onClick={() => {
        setDeathScreenOpen(false);
        setIntroTravelDone(false);
        setLoadingMode(null);
        setScreen("hub");
        setLevel(1);
        setCombatPath(null);
      }}
    >
      Vissza a hubba
    </button>
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
