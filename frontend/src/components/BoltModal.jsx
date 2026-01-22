import React, { useEffect, useState } from "react";
import "./BoltModal.css";

export default function ShopModal({ onClose }) {
  const [playerData, setPlayerData] = useState(null);
  const [shopItems, setShopItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [mode, setMode] = useState("buy"); // buy | sell
  const [activeCategory, setActiveCategory] = useState("weapon");

  const userId = localStorage.getItem("sk_current_user_id");

  const CATEGORIES = [
    { type: "weapon", icon: "⚔️" },
    { type: "armor", icon: "🛡️" },
    { type: "accessory", icon: "💍" },
    { type: "potion", icon: "🧪" }
  ];

  useEffect(() => {
  if (!error) return; // nincs error → semmi

  setShowError(true); // animáció indul: felúszik

  const timer = setTimeout(() => {
    setShowError(false); // animáció indul: visszacsúszik
  }, 3000); // mennyi ideig marad látható

  const cleanup = setTimeout(() => {
    setError(null); // végül törlődik
  }, 3350); // kicsit hosszabb, hogy animáció befejeződjön

  return () => {
    clearTimeout(timer);
    clearTimeout(cleanup);
  };
}, [error]);


  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:3000/api/players/${userId}`)
      .then(r => r.json())
      .then(setPlayerData);

    fetch("http://localhost:3000/api/items")
      .then(r => r.json())
      .then(setShopItems);

    fetch(`http://localhost:3000/api/inventory/${userId}`)
      .then(r => r.json())
      .then(setInventoryItems);
  }, [userId]);

  const refreshAll = async () => {
    const player = await fetch(
      `http://localhost:3000/api/players/${userId}`
    ).then(r => r.json());
    setPlayerData(player);

    const inv = await fetch(
      `http://localhost:3000/api/inventory/${userId}`
    ).then(r => r.json());
    setInventoryItems(inv);
  };

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
        setShowError(true);
      }

      else {
        await refreshAll();
      }
    } finally {
      setBusy(false);
    }
  };

  const sell = async (itemId) => {
    setBusy(true);
    try {
      const res = await fetch("http://localhost:3000/api/shop/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: Number(userId), itemId })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Sikertelen eladás");
        setShowError(true);
      }
      else {
        await refreshAll();
      }
    } finally {
      setBusy(false);
    }
  };

  const itemsToShow =
    mode === "buy"
      ? shopItems.filter(i => i.type === activeCategory)
      : inventoryItems.filter(i => i.type === activeCategory);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div
        className="shopBorder relative w-[90%] h-[90%] overflow-hidden"
        style={{
          backgroundImage: `url("./src/assets/pics/BOLT.gif")`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* Kilépés */}
        <button
          onClick={onClose}
          className="kilepes absolute top-4 right-4 text-white z-30"
        >
          X
        </button>

        {/* STATS */}
        <div className="Stats space-y-2 absolute/60 p-4 w-64 z-20">
          <div className="StatsStatsName flex justify-between">SZINT: <span className="StatsStats">{playerData?.level ?? "-"}</span> </div>
          <div className="StatsStatsName flex justify-between">XP: <span className="StatsStats">{playerData?.xp ?? "-"}</span> </div>
          <div className="StatsStatsName flex justify-between">ARANY: <span className="StatsStats">{playerData?.gold ?? "-"}</span> </div>
        </div>

        {/* KATEGÓRIA GOMBOK – BAL */}
        <div className="kategoriakBorder absolute bottom-[30%] left-4 flex gap-3 px-4 py-2 z-20">
          {CATEGORIES.map(cat => (
            <button
              key={cat.type}
              onClick={() => setActiveCategory(cat.type)}
              className={`kategoriakButton ${
                activeCategory === cat.type ? "active" : ""
              }`}
            >
              {cat.icon}
            </button>
          ))}
        </div>


        {/* VESZ / ELAD – JOBB */}
        <div className="veszeladGombDiv gap-3 absolute bottom-[30%] right-4 flex z-20">
          <button
            onClick={() => setMode("buy")}
            className={`veszButton px-6 py-2 ${
              mode === "buy" ? "active" : ""
            }`}
          >
            VESZ
          </button>

          <button
            onClick={() => setMode("sell")}
            className={`eladButton px-6 py-2 ${
              mode === "sell" ? "active" : ""
            }`}
          >
            ELAD
          </button>
        </div>


        {/* ALSÓ ITEM SÁV */}
        <div className="alsoSav absolute bottom-0 left-0 right-0 h-[28%] p-4 z-20">
          <div className="h-full">
            <div className="grid grid-cols-9 gap-3">
              {itemsToShow.map(item => (
                <div
                  key={item.id || item.item_id}
                  className="targyDiv p-2 flex flex-col"
                >
                  {/* ITEM NÉV – RARITY SZÍNEZÉS */}
                  <div
                    className={`targyNev text-center truncate rarity-${item.rarity}`}
                  >
                    {item.name}
                  </div>

                  <div className="text-center text-gray-300">
                    {item.min_dmg
                      ? `${item.min_dmg}-${item.max_dmg}`
                      : "—"}
                  </div>

                  {mode === "buy" ? (
                    <button
                      onClick={() => buy(item.id)}
                      disabled={busy}
                      className="targyBuyButton py-1"
                    >
                      {item.prize}
                    </button>
                  ) : (
                    <button
                      onClick={() => sell(item.item_id)}
                      disabled={busy}
                      className="targySellButton Button py-1"
                    >
                      {Math.floor(item.prize * 0.9)}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>


        <div
          className={`shopAlert ${showError ? "shopAlert-show" : "shopAlert-hide"}`}
        >
          {error}
        </div>



      </div>
    </div>
  );
}
