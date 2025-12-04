import React, { useState, useEffect } from "react";
import Cim from "../Cim.jsx";

export default function ShopModal({ onClose }) {
  const [playerData, setPlayerData] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const userId = localStorage.getItem("sk_current_user_id");

  // player adat lekérés
  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:3000/api/players/${userId}`)
      .then((res) => res.json())
      .then((data) => setPlayerData(data))
      .catch((err) => console.error("Hiba a player fetch-nél:", err));
  }, []);

  // items lekérés
  useEffect(() => {
    fetch(`http://localhost:3000/api/items`)
      .then(res => res.json())
      .then(items => setItems(items))
      .catch(e => console.error("Hiba items fetch-nél:", e));
  }, []);

  const buy = async (itemId) => {
    if (!userId) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:3000/api/shop/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: Number(userId), itemId })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sikertelen vásárlás.");
      } else if (!data.success) {
        setError(data.message || "A vásárlás nem sikerült.");
      } else {
        // frissítjük a player adatait (gold) és opcionálisan a birtokolt tárgyakat
        const p = await fetch(`http://localhost:3000/api/players/${userId}`).then(r => r.json());
        setPlayerData(p);
      }
    } catch (e) {
      console.error(e);
      setError("Hálózati hiba.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-[90%] h-[80%] flex shadow-xl p-6 text-white">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-red-400">X</button>

        <div className="flex flex-col w-2/3 pr-4">
          <div className="flex justify-between bg-black/40 p-2 rounded mb-4 text-sm">
            <div>Szint: {playerData?.level ?? "-"}</div>
            <div>XP: {playerData?.xp ?? "-"}</div>
            <div>Arany: {playerData?.gold ?? "-"}</div>
          </div>

          {error && <div className="text-red-400 mb-2">{error}</div>}

          <div className="overflow-y-auto flex-1 bg-black/40 rounded p-3 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-6">Nincsenek elérhető tárgyak.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex justify-between items-center border border-gray-700 bg-gray-800/60 p-3 rounded hover:bg-gray-700 transition">
                  <div>
                    <div className="font-medium">{item.name} {item.rarity ? `(${item.rarity})` : ""}</div>
                    <div className="text-xs text-gray-300">DMG: {item.min_dmg} - {item.max_dmg}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm">{item.price ?? "-"} ♢</div>
                    <button
                      className="bg-green-700 px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                      onClick={() => buy(item.id)}
                      disabled={busy}
                    >
                      {busy ? "Feldolgozás..." : "Vásárlás"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-1/3 bg-black/40 rounded p-4 border-l border-gray-700">
          <h2 className="text-lg mb-3">Tárgy összehasonlítás</h2>
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-gray-400">Jelenlegi</p>
              <p>Vas kard +3</p>
              <p>Támadás: 12</p>
              <p>Védelem: 4</p>
            </div>
            <div>
              <p className="text-gray-400">Új</p>
              <p>Vas kard +5</p>
              <p>Támadás: 16</p>
              <p>Védelem: 6</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
