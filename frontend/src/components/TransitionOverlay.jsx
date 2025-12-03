// frontend/src/components/TransitionOverlay.jsx
import React, { useEffect, useRef, useState } from "react";

export default function TransitionOverlay({
  src,
  onEnd,

  // IDŐZÍTÉSEK (ms)
  videoDelay = 200,   // mikor induljon a videó

  // VIZUÁLIS PARAMÉTEREK
  darkOpacity = 1.0,  // full fekete takarás

  // ANIM SEBESSÉGEK
  darkFadeOut = 600   // kifényesedés ideje
}) {
  const videoRef = useRef(null);

  // 🔥 INDULÁSKOR MÁR FEKETE LEGYEN
  const [showVideo, setShowVideo] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  // videó időzítés
  useEffect(() => {
    const videoTimer = setTimeout(() => setShowVideo(true), videoDelay);

    return () => {
      clearTimeout(videoTimer);
    };
  }, [videoDelay]);

  // videó indítása
  useEffect(() => {
    if (!showVideo) return;
    const v = videoRef.current;
    if (!v) return;

    v.currentTime = 0;
    v.play().catch((err) => {
      console.error("Transition video play error:", err);
      handleVideoEnd();
    });
  }, [showVideo]);

  function handleVideoEnd() {
    setFadingOut(true);
    setTimeout(() => {
      onEnd?.();
    }, darkFadeOut);
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      {/* 🔥 TAKARÓ FEKETE RÉTEG – MÁR AZ ELSŐ FRAME-BEN OTT VAN */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `rgba(0,0,0,${darkOpacity})`,
          transition: `opacity ${darkFadeOut}ms ease`,
          opacity: fadingOut ? 0 : 1,   // végén halványodik csak el
        }}
      />

      {/* VIDEÓ – csak késleltetve indul, de a fekete már takar */}
      {showVideo && src && (
        <video
          ref={videoRef}
          src={src}
          className="absolute inset-0 w-screen h-screen object-cover"
          muted
          autoPlay
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoEnd}
        />
      )}
    </div>
  );
}
