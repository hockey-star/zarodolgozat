// frontend/src/components/Trailer.jsx
import React, { useEffect, useRef } from "react";
import "./Trailer.css";

export default function Trailer({ onEnd }) {
  const ref = useRef();

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => {});
    v.onended = () => onEnd();
    return () => {
      if (v) v.onended = null;
    };
  }, [onEnd]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video ref={ref} src="/src/assets/videos/trailer.mp4" className="w-full h-full object-cover" />
      <button onClick={() => onEnd()} className="skip absolute bottom-10 right-10  px-6 py-3 ">Skip</button>
    </div>
  );
}
