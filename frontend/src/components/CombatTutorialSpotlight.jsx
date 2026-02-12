import React, { useEffect, useMemo, useRef, useState } from "react";
import "./TutorialOverlay.css";

export default function CombatTutorialSpotlight({
  targetRef,
  text,
  onSkip,
  onNext,
  showNext = true,
}) {
  const [rect, setRect] = useState(null);
  const [tipPos, setTipPos] = useState({ left: 0, top: 0 });
  const tipRef = useRef(null);

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      const el = targetRef?.current;
      if (!el) {
        setRect(null);
      } else {
        const r = el.getBoundingClientRect();
        const pad = 10;
        setRect({
          left: Math.max(0, r.left - pad),
          top: Math.max(0, r.top - pad),
          width: Math.max(0, r.width + pad * 2),
          height: Math.max(0, r.height + pad * 2),
          radius: 14,
        });
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [targetRef]);

  useEffect(() => {
    if (!rect) return;

    const margin = 12;
    const gap = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const tip = tipRef.current;
    const tipW = tip?.offsetWidth ?? 380;
    const tipH = tip?.offsetHeight ?? 150;

    let left = rect.left + rect.width / 2 - tipW / 2;
    let top = rect.top + rect.height + gap;

    if (top + tipH + margin > vh) top = rect.top - gap - tipH;

    left = Math.max(margin, Math.min(left, vw - tipW - margin));
    top = Math.max(margin, Math.min(top, vh - tipH - margin));

    setTipPos({ left, top });
  }, [rect, text]);

  const holeStyle = useMemo(() => {
    if (!rect) return {};
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      borderRadius: rect.radius,
    };
  }, [rect]);

  const panels = useMemo(() => {
    if (!rect) return null;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const left = rect.left;
    const top = rect.top;
    const right = rect.left + rect.width;
    const bottom = rect.top + rect.height;

    return {
      top:    { left: 0, top: 0, width: vw, height: top },
      bottom: { left: 0, top: bottom, width: vw, height: Math.max(0, vh - bottom) },
      left:   { left: 0, top: top, width: left, height: rect.height },
      right:  { left: right, top: top, width: Math.max(0, vw - right), height: rect.height },
    };
  }, [rect]);

  if (!rect || !panels) return null;

  return (
    <div className="tut-root" aria-live="polite">
      {/* 4 panel: sötétít + desat, A LYUK SZABAD */}
      <div className="tut-panel" style={panels.top} />
      <div className="tut-panel" style={panels.bottom} />
      <div className="tut-panel" style={panels.left} />
      <div className="tut-panel" style={panels.right} />

      {/* csak a keret/glow */}
      <div className="tut-outline" style={holeStyle} />

      <div
        ref={tipRef}
        className="tut-tooltip"
        style={{ left: tipPos.left, top: tipPos.top, transform: "none" }}
      >
        <div className="tut-text">{text}</div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
          {showNext && (
            <button className="tut-next" onClick={onNext}>
              Next
            </button>
          )}
          <button className="tut-skip" onClick={onSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
