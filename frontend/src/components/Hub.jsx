// frontend/src/components/Hub.jsx
import React, { useState, useRef, useEffect } from "react";
import ShopModal from "./BoltModal.jsx";
import BlacksmithModal from "./KovacsModal.jsx";
import InvModal from "./Inv.jsx";
import QuestBoardModal from "./QuestBoardModal.jsx";
import BeallitasokModal from "./Beallitasok.jsx";
import { usePlayer } from "../context/PlayerContext.jsx";
import "./Hub.css";
import TutorialOverlay from "./TutorialOverlay.jsx";

export default function Hub({ onGoAdventure, onStartQuestBattle }) {
  const { player } = usePlayer();
  const timeoutRef = useRef(null);
  const unlockRef = useRef(null);

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 40, y: 75 });
  const [isMoving, setIsMoving] = useState(false);
  const [hoveredLocation, setHoveredLocation] = useState("");

  const [showShop, setShowShop] = useState(false);
  const [showBlacksmith, setShowBlacksmith] = useState(false);
  const [showInv, setShowInv] = useState(false);
  const [showQuestBoard, setShowQuestBoard] = useState(false);

  /** ✅ ÚJ: Beállítások modal */
  const [showSettings, setShowSettings] = useState(false);

  const isAnyModalOpen =
    showShop || showBlacksmith || showInv || showQuestBoard || showSettings;

  /** ✅ HAMBURGER MENU (csak UI) */
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /** 🎥 CAMERA STATES */
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  /** ✅ UI LOCK: animáció közben nem engedünk kattot */
  const [uiLock, setUiLock] = useState(false);
  const lock = (ms = 750) => {
    setUiLock(true);
    clearTimeout(unlockRef.current);
    unlockRef.current = setTimeout(() => setUiLock(false), ms);
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(unlockRef.current);
    };
  }, []);

  const SPEED = 20;

  /** 🎯 KAMERA BELEZOOM */
  const zoomTo = (xPercent, yPercent, zoomLevel = 2) => {
    setIsFadingOut(true);

    setTimeout(() => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const newOffsetX =
        windowWidth / 2 - windowWidth * (xPercent / 100) * zoomLevel;
      const newOffsetY =
        windowHeight / 2 - windowHeight * (yPercent / 100) * zoomLevel;

      setZoom(zoomLevel);
      setOffset({ x: newOffsetX, y: newOffsetY });
      setIsZooming(true);
    }, 400);
  };

  /** 🔄 RESET ZOOM */
  const resetZoom = () => {
    setTimeout(() => {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setIsZooming(false);

      setTimeout(() => {
        setIsFadingOut(false);
      }, 120);
    }, 420);
  };

  /** 🚶 MOZGÁS ÉS ESEMÉNY INDÍTÁS */
  const moveTo = (x, y, type) => {
    if (uiLock) return;
    lock(900); // ✅ biztosan végig lockoljuk a zoom+modal nyitást

    clearTimeout(timeoutRef.current);

    zoomTo(x, y);

    const dx = x - playerPos.x;
    const dy = y - playerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = (distance / SPEED) * 300;

    setIsMoving(true);
    setPlayerPos({ x, y });

    timeoutRef.current = setTimeout(() => {
      openModal(type);
      // itt már modal nyit, a lockot majd feloldja a lock timeout
    }, 650);

    setTimeout(() => {
      setIsMoving(false);
    }, duration);
  };

  const openModal = (type) => {
    if (type === "shop") setShowShop(true);
    if (type === "blacksmith") setShowBlacksmith(true);
    if (type === "inv") setShowInv(true);
    if (type === "quest") setShowQuestBoard(true);

    if (type === "adventure") {
      resetZoom();
      onGoAdventure?.();
    }
  };

  /** ❌ MODAL BEZÁRÁS */
  const handleClose = (setter) => {
    if (uiLock) return;
    lock(900); // ✅ bezárás+reset idejére is lock

    setIsFadingOut(true);
    setter(false);
    resetZoom();
  };

  // =========================
  // TUTORIAL (Hub)
  // =========================
  const [tutorialStep, setTutorialStep] = useState(0);

  // refek a hotzoneokra
  const hzAdventureRef = useRef(null);
  const hzBlacksmithRef = useRef(null);
  const hzQuestRef = useRef(null);
  const hzShopRef = useRef(null);
  const hzHomeRef = useRef(null);

  useEffect(() => {
    if (!player?.id) return;
    const done = localStorage.getItem(`hub_tutorial_done_${player.id}`) === "1";
    setTutorialStep(done ? 0 : 1);
  }, [player?.id]);

  const tutorialSteps = {
    1: { ref: hzHomeRef, text: "Kattints az OTTHON-ra (Inventory / Deck / Stats)." },
    2: { ref: hzBlacksmithRef, text: "Kattints a KOVÁCS-ra (fejlesztések)." },
    3: { ref: hzShopRef, text: "Kattints a BOLT-ra (vásárlás)." },
    4: { ref: hzQuestRef, text: "Kattints a KÜLDETÉSEK-re." },
    5: { ref: hzAdventureRef, text: "Kattints az UTAZÁS-ra (kaland indítása)." },
  };

  function finishTutorial() {
    if (player?.id) localStorage.setItem(`hub_tutorial_done_${player.id}`, "1");
    setTutorialStep(0);
  }

  function skipTutorial() {
    finishTutorial();
  }

  const tutActive = tutorialStep > 0 && !isAnyModalOpen && !isMenuOpen;
  const pe = (step) => (tutActive && tutorialStep !== step ? "none" : "auto");

  // ✅ végső pointerEvents: tutorial + lock összevonva
  const peFinal = (step) => (uiLock ? "none" : pe(step));

  return (
    <div className="hub-root">
      {/* ✅ HAMBURGER a jobb felső sarokban */}
      <div className="hub-topbar">
        <button
          className="hub-hamburger"
          aria-label="Menü"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((v) => !v)}
        >
          <span className="hub-hamburger-line" />
          <span className="hub-hamburger-line" />
          <span className="hub-hamburger-line" />
        </button>

        {isMenuOpen && (
          <>
            <div className="hub-menu-backdrop" onClick={() => setIsMenuOpen(false)} />
            <div className="hub-menu-panel">
              <div className="hub-menu-title">Menü</div>

              <button
                className="hub-menu-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowSettings(true);
                }}
              >
                Beállítások
              </button>

              <button
                className="hub-menu-item danger"
                onClick={() => {
                  setIsMenuOpen(false);
                  alert("Kijelentkezés (placeholder)");
                }}
              >
                Kijelentkezés
              </button>
            </div>
          </>
        )}
      </div>

      {hoveredLocation && !isAnyModalOpen && (
        <div className="location-tooltip">{hoveredLocation}</div>
      )}

      <div className={`hub-overlay ${isFadingOut || isAnyModalOpen ? "is-dark" : ""}`} />

      <div className="camera">
        <div
          className={`world ${isZooming ? "hub-zooming" : ""}`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            // ✅ mindig legyen transition, ne ugráljon
            transition: "transform 650ms ease-in-out",
          }}
        >
          <img src="./src/assets/pics/HUB.png" alt="hub" className="hub-image" />

          {/* UTAZÁS */}
          <div
            ref={hzAdventureRef}
            className="hotzone keret"
            style={{
              left: "38%",
              bottom: "17%",
              width: "440px",
              height: "500px",
              pointerEvents: peFinal(5),
            }}
            onClick={() => {
              if (tutActive && tutorialStep === 5) finishTutorial();
              moveTo(50, 80, "adventure");
            }}
          >
            <span className="zone-label">Utazás</span>
          </div>

          {/* KOVÁCS (kicsit feljebb + szélesebb, hogy az alja ne lógjon le) */}
          <div
            ref={hzBlacksmithRef}
            className="hotzone keret"
            style={{
              left: "5%",
              bottom: "13%",   // ✅ 12 -> 13 (picit feljebb)
              width: "620px",  // ✅ 600 -> 620
              height: "360px", // ✅ 350 -> 360 (hogy biztos elkapd)
              pointerEvents: peFinal(2),
            }}
            onClick={() => {
              if (tutActive && tutorialStep === 2) setTutorialStep(3);
              moveTo(30, 85, "blacksmith");
            }}
          >
            <span className="zone-label">Kovács</span>
          </div>

          {/* KÜLDETÉSEK */}
          <div
            ref={hzQuestRef}
            className="hotzone keret"
            style={{
              right: "20%",
              bottom: "12%",
              width: "330px",
              height: "270px",
              pointerEvents: peFinal(4),
            }}
            onClick={() => {
              if (tutActive && tutorialStep === 4) setTutorialStep(5);
              moveTo(65, 80, "quest");
            }}
          >
            <span className="zone-label">Küldetések</span>
          </div>

          {/* BOLT */}
          <div
            ref={hzShopRef}
            className="hotzone keret"
            style={{
              right: "5%",
              bottom: "12%",
              width: "280px",
              height: "250px",
              pointerEvents: peFinal(3),
            }}
            onClick={() => {
              if (tutActive && tutorialStep === 3) setTutorialStep(4);
              moveTo(85, 85, "shop");
            }}
          >
            <span className="zone-label">Bolt</span>
          </div>

          {/* OTTHON (kicsit kisebb, hogy ne legyen “túl nagy kocka”) */}
          <div
            ref={hzHomeRef}
            className="hotzone keret"
            style={{
              right: "20%",
              bottom: "38%",   // ✅ 37 -> 38 (kicsit feljebb)
              width: "300px",  // ✅ 330 -> 300 (kisebb)
              height: "240px", // ✅ 270 -> 240 (kisebb)
              pointerEvents: peFinal(1),
            }}
            onClick={() => {
              moveTo(60, 80, "inv");
            }}
          >
            <span className="zone-label">Otthon</span>
          </div>

          {/* PLAYER */}
          <img
            src="./src/assets/pics/TESZT.PNG"
            alt="player"
            className={`player ${isMoving ? "moving" : ""}`}
            style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
          />
        </div>
      </div>

      {/* MODALOK */}
      {showShop && <ShopModal onClose={() => handleClose(setShowShop)} />}
      {showBlacksmith && <BlacksmithModal onClose={() => handleClose(setShowBlacksmith)} />}

      {/* ✅ Otthon modal: bezáráskor léptetjük tovább a Hub tutorialt (ha step1 volt) */}
      {showInv && (
        <InvModal
          onClose={() => {
            handleClose(setShowInv);

            // ✅ várjuk meg, míg a hub "resetZoom + kivilágosodás" lefut
            if (tutorialStep === 1) {
              setTimeout(() => {
                setTutorialStep(2);
              }, 700);
            }
          }}
        />
      )}

      {showQuestBoard && player && (
        <QuestBoardModal
          playerId={player.id}
          playerClassId={Number(player.class_id)}
          onClose={() => handleClose(setShowQuestBoard)}
          onStartQuestBattle={(payload) => {
            handleClose(setShowQuestBoard);
            onStartQuestBattle?.(payload);
          }}
        />
      )}

      {/* TUTORIAL OVERLAY */}
      {tutActive && tutorialSteps[tutorialStep] && (
        <TutorialOverlay
          targetRef={tutorialSteps[tutorialStep].ref}
          text={tutorialSteps[tutorialStep].text}
          onSkip={skipTutorial}
          showNext={false} 
        />
      )}

      {/* ✅ Beállítások modal */}
      {showSettings && <BeallitasokModal onClose={() => setShowSettings(false)} />}

      {/* =========================
          DEBUG BUTTONS (MINDENKINEK LÁTSZIK) — EZT KÉSŐBB SZEDD KI!
          -> jobb alsó sarok
         ========================= */}
      {player?.id && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 20000,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            style={{
              padding: "10px 14px",
              background: "#111",
              color: "white",
              border: "1px solid #444",
              borderRadius: 10,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
            onClick={() => {
              const key = `hub_tutorial_done_${player.id}`;
              localStorage.removeItem(key);
              setTutorialStep(1);
              console.log("RESET HUB TUTORIAL:", key);
            }}
            title="Teszt: újraindítja a Hub tutorialt"
          >
            RESET HUB TUTORIAL
          </button>

          <button
            style={{
              padding: "10px 14px",
              background: "#111",
              color: "white",
              border: "1px solid #444",
              borderRadius: 10,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
            onClick={() => {
              const key = `house_tutorial_done_${player.id}`;
              localStorage.removeItem(key);
              console.log("RESET HOUSE TUTORIAL:", key);
            }}
            title="Teszt: újraindítja az Otthon tutorialt"
          >
            RESET HOUSE TUTORIAL
            </button>
                      <button
              style={{
                padding: "10px 14px",
                background: "#111",
                color: "white",
                border: "1px solid #444",
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: "monospace",
              }}
              onClick={() => {
                const key = `combat_tutorial_done_${player.id}`;
                localStorage.removeItem(key);
                console.log("RESET COMBAT TUTORIAL:", key);
              }}
              title="Teszt: újraindítja a Combat tutorialt"
            >
              RESET COMBAT TUTORIAL
            </button>

        </div>
      )}
    </div>
  );
}
