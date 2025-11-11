import React, { useState, useEffect } from 'react';

export default function AdventureHandler({ onProceed, onCancel }) {
  const [countdown, setCountdown] = useState(5);
  useEffect(()=>{
    const id = setInterval(()=>{
      setCountdown(c=>{
        if(c<=1){ clearInterval(id); onProceed(); return 0; }
        return c-1;
      });
    }, 1000);
    return ()=> clearInterval(id);
  },[]);

  return (
    <div className="flex flex-col items-center justify-center h-80 bg-gray-900 p-6 rounded">
      <h3 className="text-xl font-bold mb-3">Elindulsz a kalandra...</h3>
      <p className="text-gray-400 mb-4">Készülj fel, hamarosan választhatsz ösvényt.</p>
      <div className="text-4xl font-mono mb-4">{countdown}s</div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="px-4 py-2 bg-gray-700 rounded">Mégse</button>
      </div>
    </div>
  );
}
