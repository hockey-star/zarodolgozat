// frontend/src/components/BlacksmithModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./KovacsModal.css";

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Kezeli mindkét elnevezést:
// bonus_defense / defense_bonus stb.
function getBonus(item, key) {
  const a = num(item?.[`bonus_${key}`], null);
  if (a !== null) return a;
  const b = num(item?.[`${key}_bonus`], null);
  if (b !== null) return b;
  return 0;
}

function getDmg(item) {
  return {
    min: num(item?.min_dmg, 0),
    max: num(item?.max_dmg, 0),
  };
}

// 🔧 Upgrade preview (ez CSAK UI preview, a backend intézi a valódi stat mentést)
function previewUpgraded(item) {
  if (!item) return null;

  const lvl = num(item.upgrade_level, 0);
  const nextLvl = lvl + 1;

  const { min, max } = getDmg(item);

  const bonusStr = getBonus(item, "strength");
  const bonusInt = getBonus(item, "intellect");
  const bonusDef = getBonus(item, "defense");
  const bonusHp = getBonus(item, "hp");

  // ==========================================
  //                 SCALING 
  // ==========================================
  // Megjegyzés: nextLvl-t használunk, hogy a +1 upgrade "látszódjon".
  const dmgAdd = 2 * nextLvl;        // weapon dmg növekedés
  const defAdd = 0.3 * nextLvl;      // armor def növekedés
  const hpAdd  = 5 * nextLvl;        // armor hp növekedés

  // ✅ ÚJ: STR/INT is nő MINDEN itemen
  const strAdd = 0.5* nextLvl;
  const intAdd = 0.5 * nextLvl;

  const type = (item.type || "").toLowerCase();

  const out = {
    name: item.name,
    upgrade_level: nextLvl,

    // dmg
    min_dmg: min,
    max_dmg: max,

    // statok
    bonus_strength: bonusStr,
    bonus_intellect: bonusInt,
    bonus_defense: bonusDef,
    bonus_hp: bonusHp,
  };

  // Weapon: dmg + STR/INT is
  if (type === "weapon") {
    out.min_dmg = min + dmgAdd;
    out.max_dmg = max + dmgAdd;

    out.bonus_strength = bonusStr + strAdd;
    out.bonus_intellect = bonusInt + intAdd;

   
    // out.bonus_defense = bonusDef + defAdd * 0.25;
    // out.bonus_hp = bonusHp + hpAdd * 0.25;
    return out;
  }

  // Armor/Helmet/Accessory/egyéb: DEF/HP + STR/INT is
  out.bonus_defense = bonusDef + defAdd;
  out.bonus_hp = bonusHp + hpAdd;

  out.bonus_strength = bonusStr + strAdd;
  out.bonus_intellect = bonusInt + intAdd;

  return out;
}

export default function BlacksmithModal({ onClose }) {
  const [playerData, setPlayerData] = useState(null);
  const [playerItems, setPlayerItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem("sk_current_user_id");

  async function fetchPlayer() {
    const r = await fetch(`https://nodejs202.dszcbaross.edu.hu/api/players/${userId}`);
    if (!r.ok) throw new Error("player fetch failed");
    return r.json();
  }

  async function fetchItems() {
    const r = await fetch(`https://nodejs202.dszcbaross.edu.hu/api/player/${userId}/items`);
    if (!r.ok) throw new Error("items fetch failed");
    return r.json();
  }

  const refreshSeq = React.useRef(0);

  const handleClose = () => {
    setIsClosing(true);
    // Megvárjuk, amíg a CSS animáció lefut (300ms)
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const refreshAll = async () => {
    if (!userId) return;
    const seq = ++refreshSeq.current;

    const [p, items] = await Promise.all([fetchPlayer(), fetchItems()]);
    if (seq !== refreshSeq.current) return; // elavult válasz

    setPlayerData(p);
    setPlayerItems(items || []);
    setSelectedItem((prev) => {
      if (items?.length) {
        return (
          items.find(
            (i) => prev && Number(i.owned_id) === Number(prev.owned_id)
          ) || items[0]
        );
      }
      return null;
    });
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refreshAll()
      .catch((e) => {
        console.error(e);
        setError("Hiba a szerverrel való kapcsolatban.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const currentGold = num(playerData?.gold, 0);
  const upgradeCost = selectedItem
    ? (num(selectedItem.upgrade_level, 0) + 1) * 50
    : null;
  const notEnoughGold =
    selectedItem && upgradeCost != null && currentGold < upgradeCost;

  const upgradedPreview = useMemo(
    () => previewUpgraded(selectedItem),
    [selectedItem]
  );

  const upgradeItem = async () => {
    if (!selectedItem || busy) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`https://nodejs202.dszcbaross.edu.hu/api/blacksmith/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: Number(userId),
          ownedId: selectedItem.owned_id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        setError(data?.error || data?.message || "A fejlesztés nem sikerült.");
      } else {
        await refreshAll();
      }
    } catch (e) {
      console.error(e);
      setError("Hálózati hiba.");
    } finally {
      setBusy(false);
    }
  };

  const cur = selectedItem
    ? {
        name: selectedItem.name,
        lvl: num(selectedItem.upgrade_level, 0),
        dmg: getDmg(selectedItem),
        str: getBonus(selectedItem, "strength"),
        int: getBonus(selectedItem, "intellect"),
        def: getBonus(selectedItem, "defense"),
        hp: getBonus(selectedItem, "hp"),
      }
    : null;

  const nxt = upgradedPreview
    ? {
        name: upgradedPreview.name,
        lvl: num(upgradedPreview.upgrade_level, 0),
        dmg: {
          min: num(upgradedPreview.min_dmg, 0),
          max: num(upgradedPreview.max_dmg, 0),
        },
        str: num(upgradedPreview.bonus_strength, 0),
        int: num(upgradedPreview.bonus_intellect, 0),
        def: num(upgradedPreview.bonus_defense, 0),
        hp: num(upgradedPreview.bonus_hp, 0),
      }
    : null;

  return (
    <div className={`fixed inset-0 bg-black/70 flex justify-center z-50 kovacs-overlay ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div
        className={`kovacs relative w-[85%] h-[85%] flex-col p-6 ${isClosing ? "closing" : ""}`}
        style={{
          backgroundImage: "url('/images/KOVACS.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <button onClick={handleClose} className="kilepes absolute top-3 right-3 text-center">
          X
        </button>

        {loading ? (
          <div className="m-auto text-center">Betöltés...</div>
        ) : (
          <>
            <div className="info text-center ">
              Fejlesztésre fordítható arany:{" "}
              <span className="arany text-yellow-300">{currentGold}</span>
            </div>

            {error && (
              <div className="text-center mt-2 text-red-300 text-sm">{error}</div>
            )}

            <div className="mb-4 text-center">
              {playerItems.length === 0 ? (
                <div className="nincstargy mt-1">Nincs tovább fejleszthető tárgyad.</div>
              ) : (
                <select
                  className="itemSelect px-3 py-2"
                  value={selectedItem?.owned_id ?? ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedItem(
                      playerItems.find((i) => Number(i.owned_id) === id)
                    );
                  }}
                >
                  {playerItems.map((item) => (
                    <option key={item.owned_id} value={item.owned_id}>
                      {item.name} +{num(item.upgrade_level, 0)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-between flex-1">
              {/* Current */}
              <div className="jelenlegiBorder w-[18%]">
                <h2 className="jelenlegi text-center mb-2">Jelenlegi tárgy</h2>
                <div className="jelenlegiStat text-center space-y-1">
                  {cur ? (
                    <>
                      <p>
                        {cur.name} +{cur.lvl}
                      </p>

                      {/* dmg kiírás csak ha van */}
                      {(cur.dmg.min || cur.dmg.max) ? (
                        <p>DMG: {cur.dmg.min}–{cur.dmg.max}</p>
                      ) : null}

                      <p>STR: +{cur.str}</p>
                      <p>INT: +{cur.int}</p>
                      <p>DEF: +{cur.def}</p>
                      <p>HP: +{cur.hp}</p>
                    </>
                  ) : (
                    <p>—</p>
                  )}
                </div>
              </div>

              {/* Center */}
              <div className="w-1/3 flex flex-col items-center justify-center text-center">
                <p className="fejlesztesiKoltseg">
                  Fejlesztés költsége:{" "}
                  {selectedItem ? (
                    <span>
                      <b className="arany text-yellow-300">{upgradeCost}</b> arany
                    </span>
                  ) : (
                    "-"
                  )}
                </p>

                {notEnoughGold && (
                  <p className="nincseleg mt-1">Nincs elég aranyod a fejlesztéshez.</p>
                )}

                <button
                  className="fejlesztes"
                  onClick={upgradeItem}
                  disabled={!selectedItem || busy || notEnoughGold}
                >
                  {busy ? "Feldolgozás..." : "Fejlesztés"}
                </button>
              </div>

              {/* Preview */}
              <div className="fejlesztettBorder w-[18%]">
                <h2 className="fejlesztett text-center mb-2">Fejlesztett tárgy</h2>
                <div className="fejlesztettStat text-center space-y-1">
                  {nxt ? (
                    <>
                      <p>
                        {nxt.name} +{nxt.lvl}
                      </p>

                      {(nxt.dmg.min || nxt.dmg.max) ? (
                        <p>DMG: {nxt.dmg.min}–{nxt.dmg.max}</p>
                      ) : null}

                      <p>STR: +{nxt.str}</p>
                      <p>INT: +{nxt.int}</p>
                      <p>DEF: +{nxt.def}</p>
                      <p>HP: +{nxt.hp}</p>
                    </>
                  ) : (
                    <p>—</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
