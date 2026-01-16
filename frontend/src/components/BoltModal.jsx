import React, { useEffect, useState } from "react";

export default function ShopModal({ onClose }) {
  const [playerData, setPlayerData] = useState(null);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem("sk_current_user_id");

  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:3000/api/players/${userId}`)
      .then(r => r.json())
      .then(setPlayerData);
  }, [userId]);

  useEffect(() => {
    fetch("http://localhost:3000/api/items")
      .then(r => r.json())
      .then(setItems);
  }, []);

  const buy = async (itemId) => {
    setBusy(true);
    try {
      const res = await fetch("http://localhost:3000/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: Number(userId), itemId })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Sikertelen vásárlás");
      } else {
        const refreshed = await fetch(
          `http://localhost:3000/api/players/${userId}`
        ).then(r => r.json());
        setPlayerData(refreshed);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div
        className="relative w-[90%] h-[90%] rounded overflow-hidden"
        style={{
          backgroundImage: `url("./src/assets/pics/BOLT.gif")`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* Bezárás */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-xl z-20"
        >
          X
        </button>

        {/* ===== STATS (felső sáv) ===== */}
        <div className="absolute top-4 left-4 bg-black/60 text-white p-4 rounded w-64 z-20">
          <div className="font-bold">SZINT: {playerData?.level ?? "-"}</div>
          <div>XP: {playerData?.xp ?? "-"}</div>
          <div>ARANY: {playerData?.gold ?? "-"}</div>
        </div>

       

        {/* ===== ALSÓ ITEM SÁV ===== */}
        <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-black/70 p-4 z-20">
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-9 gap-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bg-black/60 border border-yellow-700 p-2 text-xs text-white flex flex-col justify-between hover:bg-black/80 transition"
                >
                  <div className="text-center font-medium truncate">
                    {item.name}
                  </div>

                  <div className="text-center text-gray-300">
                    {item.min_dmg}-{item.max_dmg}
                  </div>

                  <button
                    onClick={() => buy(item.id)}
                    disabled={busy}
                    className="mt-1 border border-yellow-600 py-1 hover:bg-yellow-800/40 disabled:opacity-50"
                  >
                    {item.prize}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hiba */}
        {error && (
          <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 bg-red-900/80 text-white px-4 py-2 rounded z-20">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
