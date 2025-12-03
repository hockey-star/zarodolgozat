// frontend/src/components/TransitionOverlay.jsx
import React, { useEffect, useRef, useState } from "react";

export default function TransitionOverlay({
  src,
  onEnd,

  // mikor induljon a videó (ms)
  videoDelay = 200,

  // SÖTÉTÍTÉS FÁZISOK
  darkOpacityStart = 1.0,  // induláskor: full fekete
  darkOpacityMid = 0.6,    // villám közben: enyhébb sötétítés
  fadeDuration = 600       // kifakulás ideje (ms)
}) {
  const videoRef = useRef(null);

  const [showVideo, setShowVideo] = useState(false);
  const [phase, setPhase] = useState("start"); // "start" | "mid" | "out"

  // időzítés: mikor induljon a videó + mikor lépjünk "mid" fázisba
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowVideo(true);
      setPhase("mid"); // ekkor lesz sötétségből kicsit világosabb
    }, videoDelay);

    return () => clearTimeout(timer);
  }, [videoDelay]);

  // videó indítása, amikor láthatóvá vált
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
    setPhase("out");        // indul a kifakulás
    setTimeout(() => {
      onEnd?.();
    }, fadeDuration);
  }

  // AKTUÁLIS OPACITY a fázis alapján
  const currentOpacity =
    phase === "start"
      ? darkOpacityStart
      : phase === "mid"
      ? darkOpacityMid
      : 0;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      {/* VIDEÓ – alul */}
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

      {/* FEKETE RÉGÉ – FELÜL, KIS ÁTLÁTSZÓSÁGGAL */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "black",
          opacity: currentOpacity,
          transition: `opacity ${fadeDuration}ms ease`,
        }}
      />
    </div>
  );
}
