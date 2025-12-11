// frontend/src/components/LoadingScreen.jsx
import React, { useEffect, useState } from "react";
import "./LoadingScreen.css";
import loadingBg from "../assets/backgrounds/loadingscreen.jpg";

// TYPEWRITER HOOK – megbízható slice verzió
function useTypewriter(text, speed = 35) {
  const [displayed, setDisplayed] = React.useState("");
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!text) {
      setDisplayed("");
      setDone(false);
      return;
    }

    let i = 0;
    let cancelled = false;
    setDisplayed("");
    setDone(false);

    const timer = setInterval(() => {
      if (cancelled) return;

      setDisplayed(text.slice(0, i + 1));
      i++;

      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [text, speed]);

  return { displayed, done };
}

export default function LoadingScreen({ onDone }) {
  const [tips, setTips] = useState([]);
  const [currentTip, setCurrentTip] = useState("");
  const [loadingTime, setLoadingTime] = useState(10); //TIMER ÁLLÍTÁSA

  //TIPP BETÖLTÉSE
  useEffect(() => {
    fetch("http://localhost:3000/api/tips")
      .then((res) => res.json())
      .then((data) => {
        const loadedTips = data.tips || [];
        setTips(loadedTips);

        if (loadedTips.length > 0) {
          const random = Math.floor(Math.random() * loadedTips.length);
          setCurrentTip(loadedTips[random]);
        }
      })
      .catch((err) => console.error("Tippek hiba:", err));
  }, []);

  // Typewriter a tippre
  const typedTip = useTypewriter(currentTip, 25);

  // Tipp kattintás → új random tipp
  function refreshTip() {
    if (tips.length === 0) return;
    const random = Math.floor(Math.random() * tips.length);
    setCurrentTip(tips[random]);
  }

  // Automatikus tip váltás 10 másodpercenként
  useEffect(() => {
    if (tips.length === 0) return;
    const interval = setInterval(() => {
      refreshTip();
    }, 10000); // 10 másodperc

    return () => clearInterval(interval);
  }, [tips]);

  // Countdown logika
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDone && onDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div
      className="loading-bg"
      style={{ backgroundImage: `url(${loadingBg})` }}
    >
      {/* CÍM */}
      <h1 class="jt --debug">
  <span class="jt__row">
    <span class="jt__text">Utazás folyamatban</span>
  </span>
  <span class="jt__row jt__row--sibling" aria-hidden="true">
    <span class="jt__text">Utazás folyamatban</span>
  </span>
  <span class="jt__row jt__row--sibling" aria-hidden="true">
    <span class="jt__text">Utazás folyamatban</span>
  </span>
  <span class="jt__row jt__row--sibling" aria-hidden="true">
    <span class="jt__text">Utazás folyamatban</span>
  </span>
</h1>

      {/* COUNTDOWN */}
      <span className="countdown-number">
        <span key={loadingTime}>{loadingTime}</span>
      </span>

      {/* TIPPEK */}
      <div
        className="loading-tip"
        onClick={refreshTip}
        title="Kattints új tippért!"
      >
        {typedTip.displayed || "Tipp betöltése..."}
      </div>
    </div>
  );
}
