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

// 🔧 Upgrade scaling (ezt állítsd ha máshogy akarod):
// - Weapon: dmg nő
// - Armor/Helmet/Accessory: def/hp/int/str nő
function previewUpgraded(item) {
  if (!item) return null;

  const lvl = num(item.upgrade_level, 0);
  const nextLvl = lvl + 1;

  const { min, max } = getDmg(item);

  const bonusStr = getBonus(item, "strength");
  const bonusInt = getBonus(item, "intellect");
  const bonusDef = getBonus(item, "defense");
  const bonusHp  = getBonus(item, "hp");

  // Példa scaling:
  // dmg: +2 per level
  // def: +2 per level
  // hp : +10 per level
  // int/str: +1 per level
  const dmgAdd = 2 * nextLvl;
  const defAdd = 0.5 * nextLvl;
  const hpAdd  = 5 * nextLvl;
  const statAdd = 1 * nextLvl;

  // Típus alapján kicsit más:
  const type = (item.type || "").toLowerCase();

  const out = {
    name: item.name,
    upgrade_level: nextLvl,
    min_dmg: min,
    max_dmg: max,
    bonus_strength: bonusStr,
    bonus_intellect: bonusInt,
    bonus_defense: bonusDef,
    bonus_hp: bonusHp,
  };

  if (type === "weapon") {
    out.min_dmg = min + dmgAdd;
    out.max_dmg = max + dmgAdd;
  } else {
    out.bonus_defense = bonusDef + defAdd;
    out.bonus_hp = bonusHp + hpAdd;

    // ha van STR/INT bónusz tárgyon:
    if (bonusStr > 0) out.bonus_strength = bonusStr + statAdd;
    if (bonusInt > 0) out.bonus_intellect = bonusInt + statAdd;
  }

  return out;
}

export default function BlacksmithModal({ onClose }) {
  const [playerData, setPlayerData] = useState(null);
  const [playerItems, setPlayerItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem("sk_current_user_id");

  async function fetchPlayer() {
    const r = await fetch(`http://localhost:3000/api/players/${userId}`);
    if (!r.ok) throw new Error("player fetch failed");
    return r.json();
  }

  async function fetchItems() {
    const r = await fetch(`http://localhost:3000/api/player/${userId}/items`);
    if (!r.ok) throw new Error("items fetch failed");
    return r.json();
  }

  const refreshAll = async () => {
    if (!userId) return;
    const [p, items] = await Promise.all([fetchPlayer(), fetchItems()]);
    setPlayerData(p);
    setPlayerItems(items || []);

    if (items && items.length > 0) {
      const keep =
        items.find((i) => selectedItem && i.item_id === selectedItem.item_id) ||
        items[0];
      setSelectedItem(keep);
    } else {
      setSelectedItem(null);
    }
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
  const upgradeCost = selectedItem ? (num(selectedItem.upgrade_level, 0) + 1) * 50 : null;
  const notEnoughGold = selectedItem && upgradeCost != null && currentGold < upgradeCost;

  const upgradedPreview = useMemo(() => previewUpgraded(selectedItem), [selectedItem]);

  const upgradeItem = async () => {
    if (!selectedItem || busy) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:3000/api/blacksmith/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: Number(userId),
          itemId: selectedItem.item_id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        setError(data?.error || data?.message || "A fejlesztés nem sikerült.");
      } else {
        // ✅ siker: frissítünk mindent
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
        dmg: { min: num(upgradedPreview.min_dmg, 0), max: num(upgradedPreview.max_dmg, 0) },
        str: num(upgradedPreview.bonus_strength, 0),
        int: num(upgradedPreview.bonus_intellect, 0),
        def: num(upgradedPreview.bonus_defense, 0),
        hp: num(upgradedPreview.bonus_hp, 0),
      }
    : null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center z-50">
      <div
        className="kovacs relative w-[85%] h-[85%] flex-col shadow-xl p-6 text-white"
        style={{
          backgroundImage: "url('./src/assets/pics/KOVACS.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <button
          onClick={onClose}
          className="kilepes absolute top-3 right-3 text-center"
        >
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

            <div className="mb-4 text-center">
              {playerItems.length === 0 ? (
                <div className="nincstargy mt-1">Nincs tovább fejleszthető tárgyad.</div>
              ) : (
                <select
                  className="itemSelect px-3 py-2"
                  value={selectedItem?.item_id ?? ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedItem(playerItems.find((i) => Number(i.item_id) === id));
                  }}
                >
                  {playerItems.map((item) => (
                    <option key={item.item_id} value={item.item_id}>
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
                      {cur.str ? <p>STR: +{cur.str}</p> : null}
                      {cur.int ? <p>INT: +{cur.int}</p> : null}
                      {cur.def ? <p>DEF: +{cur.def}</p> : null}
                      {cur.hp ? <p>HP: +{cur.hp}</p> : null}
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
                    <span className={notEnoughGold ? "" : ""}>
                      <b className="arany text-yellow-300">{upgradeCost}</b> arany
                    </span>
                  ) : (
                    "-"
                  )}
                </p>

                {notEnoughGold && (
                  <p className="nincseleg mt-1">
                    Nincs elég aranyod a fejlesztéshez.
                  </p>
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
                      <p className="">
                        {nxt.name} +{nxt.lvl}
                      </p>
                      {nxt.str ? <p>STR: +{nxt.str}</p> : null}
                      {nxt.int ? <p>INT: +{nxt.int}</p> : null}
                      {nxt.def ? <p>DEF: +{nxt.def}</p> : null}
                      {nxt.hp ? <p>HP: +{nxt.hp}</p> : null}
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
