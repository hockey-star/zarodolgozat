import React, { useEffect, useState } from "react";
import "./BoltModal.css";

export default function ShopModal({ onClose }) {
  const [isClosing, setIsClosing] = useState(false); // Új állapot a záráshoz
  const [playerData, setPlayerData] = useState(null);
  const [shopItems, setShopItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [mode, setMode] = useState("buy");
  const [activeCategory, setActiveCategory] = useState("weapon");
  const [fullStats, setFullStats] = useState(null);

  const userId = localStorage.getItem("sk_current_user_id");

  // Animált bezárás kezelő
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(); // Csak az animáció (300ms) után hívjuk meg a szülő bezáró függvényét
    }, 300); 
  };

// --- RUN HP (sessionStorage) + FULL STATS (final hp) összevetés ---
const itemsToShow =
    mode === "buy"
      ? shopItems.filter(i => i.type === activeCategory)
      : inventoryItems.filter(i => i.type === activeCategory);

  const finalHp = fullStats?.final?.hp ?? null;
  const finalMaxHp = fullStats?.final?.max_hp ?? null;
  const hpKey = userId ? `adventure_hp_${userId}` : null;
  const readRunHp = () => {
    if (!hpKey) return null;
    const raw = sessionStorage.getItem(hpKey);
    return raw == null ? null : Number(raw);
  };
  const runHp = readRunHp();
  const currentHp = runHp ?? finalHp;
  const maxHp = finalMaxHp;
  const isFull = currentHp != null && maxHp != null && currentHp >= maxHp;
  const HEAL_COST = 100;

  const CATEGORIES = [
    { type: "weapon", icon: "⚔️" },
    { type: "helmet", icon: "👑" },
    { type: "armor", icon: "🛡️" },
    { type: "accessory", icon: "💍" },
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

  fetch(`http://localhost:3000/api/player/${userId}/full-stats`)
    .then(r => r.json())
    .then(setFullStats);

  fetch(`http://localhost:3000/api/inventory/${userId}`)
    .then(r => r.json())
    .then(setInventoryItems);
}, [userId]);
useEffect(() => {
  const classId = fullStats?.player?.class_id;
  if (!userId || !classId) return;

  fetch(`http://localhost:3000/api/items?classId=${classId}`)
    .then(r => r.json())
    .then(setShopItems);
}, [userId, fullStats?.player?.class_id]);

const refreshAll = async () => {
  const stats = await fetch(`http://localhost:3000/api/player/${userId}/full-stats`).then(r => r.json());
  setFullStats(stats);

  const inv = await fetch(`http://localhost:3000/api/inventory/${userId}`).then(r => r.json());
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

const clearRunHpCache = () => {
  // ✅ biztosra megyünk: mindent törlünk ami HP-run cache lehet
  Object.keys(sessionStorage)
    .filter((k) => k.toLowerCase().includes("hp"))
    .forEach((k) => sessionStorage.removeItem(k));
};

const healForGold = async () => {
  if (!userId) return;
  if (maxHp == null || currentHp == null) {
    setError("Még tölt a stat (full-stats).");
    return;
  }
  if (isFull) {
    setError("Full HP-n vagy.");
    return;
  }

  setBusy(true);
  try {
    const res = await fetch("http://localhost:3000/api/shop/heal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: Number(userId) }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.error || "Heal sikertelen");
      return;
    }

    // ✅ EZ A LÉNYEG: a combat innen olvas
    sessionStorage.setItem(hpKey, String(maxHp));

    // opcionális: UI frissítés
    await refreshAll();
  } finally {
    setBusy(false);
  }
};
console.log("HEAL AFTER setItem", {
  hpKey,
  storedNow: sessionStorage.getItem(hpKey),
  maxHp,
});


const heal = async () => {
  setBusy(true);
  try {
    const res = await fetch("http://localhost:3000/api/shop/heal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: Number(userId) }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setError(data.error || "Sikertelen gyógyítás");
      setShowError(true);
      return;
    }

    // ✅ EZ A LÉNYEG – run HP cache törlés
    sessionStorage.removeItem(`adventure_hp_${userId}`);

    // opcionális, de jó: bolt UI frissítése
    await refreshAll();
  } finally {
    setBusy(false);
  }
};

 
  return (
    <div className={`modal-overlay ${isClosing ? "fade-out" : "fade-in"}`}>
      <div
        className={`shopBorder relative w-[90%] h-[90%] overflow-hidden modal-content ${
          isClosing ? "scale-down" : "scale-up"
        }`}
        style={{
          backgroundImage: `url("./src/assets/pics/BOLT.gif")`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* Kilépés - handleClose hívása az onClose helyett */}
        <button
          onClick={handleClose}
          className="kilepes absolute top-4 right-4 text-white z-30"
        >
          X
        </button>

       {/* STATS */}
        <div className="Stats space-y-2 absolute/60 p-4 w-64 z-20">
          <div className="StatsStatsName flex justify-between">
            SZINT: <span className="StatsStats">{fullStats?.player?.level ?? "-"}</span>
          </div>
          <div className="StatsStatsName flex justify-between">
            XP: <span className="StatsStats">{fullStats?.player?.xp ?? "-"}</span>
          </div>
          <div className="StatsStatsName flex justify-between">
            ARANY: <span className="StatsStats">{fullStats?.player?.gold ?? "-"}</span>
          </div>
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
<div className="mt-3 space-y-2">
  <div className="text-white">
    HP: <b>{currentHp ?? "-"}</b> / <b>{maxHp ?? "-"}</b>
  </div>

  <button
    onClick={healForGold}
    disabled={busy || isFull}
    className="px-4 py-2 bg-green-700 rounded disabled:opacity-50"
  >
    Gyógyítás ({HEAL_COST} gold)
  </button>
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


       <div className={`shopAlert ${showError ? "shopAlert-show" : "shopAlert-hide"}`}>
          {error}
        </div>
      </div>
    </div>
  );
}