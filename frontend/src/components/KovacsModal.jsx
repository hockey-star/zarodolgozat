import React, { useState, useEffect } from "react";
import Cim from "../Cim.jsx";

export default function BlacksmithModal({ onClose }) {
  const [playerData, setPlayerData] = useState(null);
  const [playerItems, setPlayerItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem("sk_current_user_id");

  // Player alapadatok
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch(Cim.Cim+`/api/players/${userId}`).then(r => r.json()),
      fetch(Cim.Cim+`/api/player/${userId}/items`).then(r => r.json())
    ])
      .then(([playerRes, itemsRes]) => {
        setPlayerData(playerRes);
        setPlayerItems(itemsRes || []);
        if (itemsRes && itemsRes.length > 0) setSelectedItem(itemsRes[0]);
      })
      .catch(e => {
        console.error("Hiba a fetchnél:", e);
        setError("Hiba a szerverrel való kapcsolatban.");
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshItems = async () => {
    if (!userId) return;
    try {
      const res = await fetch(Cim.Cim+`/api/player/${userId}/items`);
      const items = await res.json();
      setPlayerItems(items || []);
      if (items && items.length > 0) {
        const found = items.find(i => selectedItem && i.item_id === selectedItem.item_id) || items[0];
        setSelectedItem(found);
      } else {
        setSelectedItem(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const upgradeItem = async () => {
    if (!selectedItem || busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(Cim.Cim+`/api/blacksmith/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: Number(userId),
          itemId: selectedItem.item_id
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sikertelen kérés.");
      } else if (!data.success) {
        setError(data.message || "A fejlesztés nem sikerült.");
      } else {
        // siker — frissítjük a játékos XP-t és a tárgylistát
        const playerRes = await fetch(Cim.Cim+`/api/players/${userId}`).then(r => r.json());
        setPlayerData(playerRes);
        await refreshItems();
      }
    } catch (e) {
      console.error(e);
      setError("Hálózati hiba.");
    } finally {
      setBusy(false);
    }
  };

  // Loading / modal mindig jelenik, csak a tartalom mutat mást
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-[80%] h-[70%] flex flex-col shadow-xl p-6 text-white">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-red-400">✕</button>

        {loading ? (
          <div className="m-auto text-center">Betöltés...</div>
        ) : (
          <>
            <div className="text-center mb-4 text-sm bg-black/40 py-2 rounded">
              Fejlesztésre fordítható XP: <span className="text-green-400">{playerData?.xp ?? "-"}</span>
            </div>

            <div className="mb-4 text-center">
              {playerItems.length === 0 ? (
                <div className="text-sm">Nincs tovább fejleszthető tárgyad.</div>
              ) : (
                <select
                  className="bg-gray-800 px-3 py-2 rounded border border-gray-600"
                  value={selectedItem?.item_id ?? ""}
                  onChange={(e) =>
                    setSelectedItem(playerItems.find((i) => i.item_id == e.target.value))
                  }
                >
                  {playerItems.map((item) => (
                    <option key={item.item_id} value={item.item_id}>
                      {item.name} +{item.upgrade_level ?? 0}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

            <div className="flex justify-between flex-1">
              <div className="w-1/3 bg-black/40 rounded p-4 border border-gray-700">
                <h2 className="text-center mb-2 text-sm">Jelenlegi tárgy</h2>
                {selectedItem ? (
                  <>
                    <p>{selectedItem.name} +{selectedItem.upgrade_level}</p>
                    <p>DMG: {selectedItem.min_dmg} - {selectedItem.max_dmg}</p>
                    <p>Védelem: {selectedItem.defense_bonus}</p>
                    <p>HP: {selectedItem.hp_bonus}</p>
                  </>
                ) : <p>—</p>}
              </div>

              <div className="w-1/3 flex flex-col items-center justify-center text-center">
                <p className="text-gray-400 text-3xl">→</p>
                <p className="text-sm mt-2">
                  Fejlesztés költsége: {selectedItem ? ((selectedItem.upgrade_level + 1) * 250) : "-"} XP
                </p>
                <button
                  className="bg-blue-700 px-4 py-2 rounded mt-3 hover:bg-blue-600 disabled:opacity-50"
                  onClick={upgradeItem}
                  disabled={!selectedItem || busy}
                >
                  {busy ? "Feldolgozás..." : "Fejlesztés"}
                </button>
              </div>

              <div className="w-1/3 bg-black/40 rounded p-4 border border-gray-700">
                <h2 className="text-center mb-2 text-sm">Fejlesztett tárgy</h2>
                {selectedItem ? (
                  <>
                    <p>{selectedItem.name} +{selectedItem.upgrade_level + 1}</p>
                    <p>DMG: {selectedItem.min_dmg + 2} - {selectedItem.max_dmg + 2}</p>
                    <p>Védelem: {selectedItem.defense_bonus + 2}</p>
                    <p>HP: {selectedItem.hp_bonus + 10}</p>
                  </>
                ) : <p>—</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
