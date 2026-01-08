import React, { useEffect, useRef, useState } from "react";

export default function TransitionOverlay({
  src,
  onEnd,
  videoDelay = 200,
  darkOpacityStart = 1.0,
  darkOpacityMid = 0.6,
  fadeDuration = 600,
}) {
  const videoRef = useRef(null);
  const [phase, setPhase] = useState("start"); // "start" | "mid" | "out"
  const endTimerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("mid");
      if (videoRef.current) {
        videoRef.current.play().catch((err) => {
          console.error("Transition video play error:", err);
          handleVideoEnd();
        });
      }
    }, videoDelay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoDelay]);

  function handleVideoEnd() {
    setPhase("out");
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    endTimerRef.current = setTimeout(() => {
      onEnd?.();
    }, fadeDuration);
  }

  useEffect(() => {
    return () => {
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, []);

  const getOverlayOpacity = () => {
    if (phase === "start") return darkOpacityStart;
    if (phase === "mid") return darkOpacityMid;
    return 0;
  };

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      <video
        ref={videoRef}
        src={src}
        preload="auto"
        className={`absolute inset-0 w-screen h-screen object-cover transition-opacity duration-300 ${
          phase === "start" ? "opacity-0" : "opacity-100"
        }`}
        muted
        playsInline
        onEnded={handleVideoEnd}
        onError={handleVideoEnd}
      />

      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "black",
          opacity: getOverlayOpacity(),
          transition: `opacity ${fadeDuration}ms ease`,
        }}
      />
    </div>
  );
}
