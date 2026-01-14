import React, { useState, useMemo, useEffect } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";
import {
  getClassKeyFromId,
  getAbilitiesForClass,
  ABILITIES_BY_ID,
  buildDefaultDeckForClass,
} from "../data/abilities.js";
import spellbookImg from "../assets/pics/spellbook.png";
import HAZImg from "../assets/pics/HAZ.jpg";
import StatModal from "./StatModal.jsx";

/* ==============================
   HELPERS
   ============================== */
function resolveCardImageFromAbility(ab) {
  if (!ab) return "";
  if (typeof ab.image === "string" && ab.image.startsWith("/cards/")) {
    return ab.image;
  }
  if (ab.id && ab.rarity) {
    return `/cards/${ab.rarity}/${ab.id}.png`;
  }
  return "";
}

const EQUIP_SLOTS = [
  { key: "weapon", label: "Weapon" },
  { key: "armor", label: "Chest" },
  { key: "helmet", label: "Head" },
  { key: "accessory", label: "Trinket" },
];

function mapItemTypeToSlot(type) {
  const t = (type || "").toLowerCase();
  if (t === "weapon") return "weapon";
  if (t === "armor") return "armor";
  if (t === "accessory") return "accessory";
  if (t === "helmet" || t === "head") return "helmet";
  return null;
}

function formatBonusLine(label, value) {
  if (!value || Number(value) <= 0) return null;
  return <div>{label}: +{value}</div>;
}

function formatWithBonus(finalValue, bonus) {
  const b = Number(bonus) || 0;
  if (!b) return `${finalValue}`;
  return `${finalValue} (+${b})`;
}

export default function Inv({ onClose }) {
  // ✅ effectiveStats-et is kérjük, mert az a "final" stat (base + item)
  const {
    player,
    setPlayer,
    refreshFullStats,
    itemBonuses,
    effectiveStats,
  } = usePlayer() || {};

  /* ==============================
     MODAL STATE
     ============================== */
  const [showInventory, setShowInventory] = useState(false);
  const [showDeckEditor, setShowDeckEditor] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const anyModalOpen = showInventory || showDeckEditor || showStats;

  /* ==============================
     INVENTORY
     ============================== */
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  /* ==============================
     DECK / CLASS
     ============================== */
  const classKey = useMemo(
    () => getClassKeyFromId(player?.class_id),
    [player?.class_id]
  );

  const abilityPool = useMemo(() => getAbilitiesForClass(classKey), [classKey]);

  /* ==============================
     DECK LIMITS
     ============================== */
  const MAX_DECK_SIZE = 30;
  const MIN_DECK_SIZE = 10;
  const MAX_PER_RARITY = {
    common: 4,
    rare: 3,
    epic: 2,
    legendary: 1,
  };

  const [tempDeck, setTempDeck] = useState(player?.deck || []);

  useEffect(() => {
    if (Array.isArray(player?.deck)) {
      setTempDeck([...player.deck]);
    }
  }, [player?.deck]);

  /* ==============================
     ALAP PAKLI
     ============================== */
  useEffect(() => {
    if (!player || !setPlayer) return;
    if (Array.isArray(player.deck) && player.deck.length > 0) return;

    const baseDeck = buildDefaultDeckForClass(classKey);

    setPlayer((prev) => ({
      ...prev,
      deck: baseDeck,
    }));
  }, [player, setPlayer, classKey]);

  /* ==============================
     INVENTORY FETCH
     ============================== */
  useEffect(() => {
    if (!showInventory || !player?.id) return;

    fetch(`http://localhost:3000/api/inventory/${player.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Inventory fetch error");
        return res.json();
      })
      .then((data) => {
        setInventoryItems(Array.isArray(data) ? data : []);
        setSelectedItem(null);
      })
      .catch((err) => {
        console.error(err);
        alert("Nem sikerült betölteni az inventoryt");
      });
  }, [showInventory, player?.id]);

  /* ==============================
     EQUIP / UNEQUIP
     ============================== */
  function equipItem(itemId) {
    if (!player?.id) return;

    fetch("http://localhost:3000/api/inventory/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: player.id,
        itemId,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Equip failed");
        return res.json();
      })
      .then(async () => {
        setInventoryItems((prev) => {
          const newItem = prev.find((p) => p.item_id === itemId);
          const newSlot = newItem ? mapItemTypeToSlot(newItem.type) : null;

          return prev.map((it) => {
            const itSlot = mapItemTypeToSlot(it.type);
            if (!itSlot || it.type === "potion") return it;

            if (itSlot === newSlot) {
              return {
                ...it,
                is_equipped: it.item_id === itemId,
              };
            }
            return it;
          });
        });

        setSelectedItem((prev) =>
          prev && prev.item_id === itemId ? { ...prev, is_equipped: true } : prev
        );

        // ✅ STATOK FRISSÍTÉSE BACKENDRŐL
        try {
          await refreshFullStats?.(player.id);
        } catch (e) {
          console.error(e);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Hiba az equip során");
      });
  }

  function unequipItem(itemId) {
    if (!player?.id) return;

    fetch("http://localhost:3000/api/inventory/unequip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: player.id,
        itemId,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unequip failed");
        return res.json();
      })
      .then(async () => {
        setInventoryItems((prev) =>
          prev.map((it) =>
            it.item_id === itemId ? { ...it, is_equipped: false } : it
          )
        );

        setSelectedItem((prev) =>
          prev && prev.item_id === itemId ? { ...prev, is_equipped: false } : prev
        );

        // ✅ STATOK FRISSÍTÉSE BACKENDRŐL
        try {
          await refreshFullStats?.(player.id);
        } catch (e) {
          console.error(e);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Hiba az unequip során");
      });
  }

  /* ==============================
     DECK HANDLERS
     ============================== */
  function handleAddToDeck(abilityId) {
    if (tempDeck.length >= MAX_DECK_SIZE) return;

    const ab = ABILITIES_BY_ID[abilityId];
    if (!ab) {
      setTempDeck((prev) => [...prev, abilityId]);
      return;
    }

    const currentCount = tempDeck.filter((id) => id === abilityId).length;
    const limit =
      MAX_PER_RARITY[ab.rarity] !== undefined ? MAX_PER_RARITY[ab.rarity] : 4;

    if (currentCount >= limit) return;

    setTempDeck((prev) => [...prev, abilityId]);
  }

  function handleRemoveOneFromDeck(abilityId) {
    setTempDeck((prev) => {
      const idx = prev.indexOf(abilityId);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  }

  function handleSaveDeck() {
    if (tempDeck.length < MIN_DECK_SIZE) {
      alert(`A paklinak legalább ${MIN_DECK_SIZE} kártyát kell tartalmaznia.`);
      return;
    }

    setPlayer?.((prev) => ({
      ...prev,
      deck: [...tempDeck],
    }));

    setShowDeckEditor(false);
  }

  const deckCounts = useMemo(() => {
    const counts = {};
    tempDeck.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [tempDeck]);

  const uniqueDeckIds = useMemo(() => Object.keys(deckCounts), [deckCounts]);

  /* ==============================
     EQUIPPED LOOKUP (UI-hoz)
     ============================== */
  const equippedBySlot = useMemo(() => {
    const map = {
      weapon: null,
      armor: null,
      helmet: null,
      accessory: null,
    };

    for (const it of inventoryItems) {
      if (!it.is_equipped) continue;
      const slot = mapItemTypeToSlot(it.type);
      if (!slot) continue;
      if (it.type === "potion") continue;
      map[slot] = it;
    }
    return map;
  }, [inventoryItems]);

  /* ==============================
     STATOK (FINAL + zárójeles bonus)
     ============================== */
  const stats = useMemo(() => {
    // ha nincs player, ne omoljon össze, de legyen valami
    if (!player) {
      return [
        { label: "Level", value: "-" },
        { label: "HP", value: "-" },
        { label: "Strength", value: "-" },
        { label: "Intellect", value: "-" },
        { label: "Defense", value: "-" },
        { label: "Gold", value: "-" },
      ];
    }

    // ✅ final statok a contextből, fallback a player base-re
    const finalStr = effectiveStats?.strength ?? (player.strength ?? 0);
    const finalInt = effectiveStats?.intellect ?? (player.intellect ?? 0);
    const finalDef = effectiveStats?.defense ?? (player.defense ?? 0);
    const finalHp = effectiveStats?.hp ?? (player.hp ?? 0);
    const finalMaxHp = effectiveStats?.max_hp ?? (player.max_hp ?? 0);

    const hpBonus = itemBonuses?.hp ?? 0;
    const hpText = `${finalHp} / ${finalMaxHp}`;

    return [
      { label: "Level", value: player.level ?? 1 },
      { label: "HP", value: hpBonus ? `${hpText} (+${hpBonus})` : hpText },
      { label: "Strength", value: formatWithBonus(finalStr, itemBonuses?.strength ?? 0) },
      { label: "Intellect", value: formatWithBonus(finalInt, itemBonuses?.intellect ?? 0) },
      { label: "Defense", value: formatWithBonus(finalDef, itemBonuses?.defense ?? 0) },
      { label: "Gold", value: player.gold ?? 0 },
    ];
  }, [player, effectiveStats, itemBonuses]);

  /* ==============================
     RENDER
     ============================== */
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        style={{
          width: "1920px",
          height: "1088px",
          background: "black",
          backgroundImage: `url(${HAZImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <h2 className="text-center mb-2 text-sm text-white">OTTHON</h2>

        {showStats && <StatModal onClose={() => setShowStats(false)} />}

        {showInventory && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-10 z-40">
            <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl shadow-xl w-4/5 h-4/5 text-white relative p-6">
              <button
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center
                           bg-red-600 hover:bg-red-700 text-white rounded-full text-lg font-bold"
                onClick={() => {
                  setShowInventory(false);
                  setSelectedItem(null);
                }}
                title="Bezárás"
              >
                ✕
              </button>

              <div className="h-full grid grid-cols-12 gap-6 min-h-0">
                <div className="col-span-2 flex flex-col gap-3 min-h-0">
                  <div className="text-xs tracking-widest text-neutral-400 uppercase">
                    Equipment
                  </div>

                  {EQUIP_SLOTS.map((slot) => {
                    const equipped = equippedBySlot[slot.key];
                    return (
                      <button
                        key={slot.key}
                        onClick={() => {
                          if (equipped) setSelectedItem(equipped);
                        }}
                        className={[
                          "h-20 rounded-lg border",
                          "flex flex-col justify-center px-3 text-left",
                          "bg-neutral-900/50 hover:bg-neutral-900",
                          equipped ? "border-emerald-600" : "border-neutral-700",
                        ].join(" ")}
                        title={equipped ? "Kattints a részletekhez" : "Üres slot"}
                      >
                        <div className="text-[11px] text-neutral-400">
                          {slot.label}
                        </div>
                        <div className="text-sm font-semibold truncate">
                          {equipped ? equipped.name : "Empty"}
                        </div>
                        <div className="text-[10px] text-neutral-500 uppercase">
                          {equipped ? equipped.rarity : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="col-span-6 flex flex-col min-h-0">
                  <div className="text-xs tracking-widest text-neutral-400 uppercase">
                    Character
                  </div>
                  <div className="mt-3 flex-1 min-h-0 rounded-2xl border border-neutral-800 bg-neutral-950/50 flex items-center justify-center">
                    <div className="text-neutral-600 text-sm">(placeholder)</div>
                  </div>
                </div>

                <div className="col-span-4 flex flex-col gap-4 min-h-0">
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4 shrink-0">
                    <div className="text-xs tracking-widest text-neutral-400 uppercase mb-3">
                      Stats
                    </div>

                    <div className="space-y-2 text-sm">
                      {stats.map((s) => (
                        <div
                          key={s.label}
                          className="flex justify-between border-b border-neutral-800 pb-1"
                        >
                          <span className="text-neutral-300">{s.label}</span>
                          <span className="text-neutral-100">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4 flex-1 min-h-0 flex flex-col">
                    <div className="text-xs tracking-widest text-neutral-400 uppercase mb-3 shrink-0">
                      Inventory
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                      <div className="grid grid-cols-4 gap-3">
                        {inventoryItems.length === 0 && (
                          <div className="text-neutral-500 col-span-4 text-center mt-10">
                            Az inventory üres
                          </div>
                        )}

                        {inventoryItems.map((item) => {
                          const isSelected = selectedItem?.item_id === item.item_id;

                          return (
                            <button
                              key={item.item_id}
                              onClick={() => setSelectedItem(item)}
                              className={[
                                "h-20 rounded-lg border text-left px-3",
                                "bg-neutral-900/40 hover:bg-neutral-900",
                                item.is_equipped
                                  ? "border-emerald-600"
                                  : "border-neutral-700",
                                isSelected ? "ring-2 ring-yellow-400" : "",
                              ].join(" ")}
                              title="Kattints a részletekhez"
                            >
                              <div className="text-sm font-semibold truncate">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-neutral-400 uppercase">
                                {item.type} • {item.rarity}
                              </div>
                              {item.upgrade_level > 0 && (
                                <div className="text-[10px] text-yellow-300 uppercase mt-1">
                                  +{item.upgrade_level}
                                </div>
                              )}
                              {item.is_equipped && (
                                <div className="text-[10px] text-emerald-400 uppercase mt-1">
                                  Equipped
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4 shrink-0">
                    {selectedItem ? (
                      <div className="flex flex-col gap-3">
                        <div>
                          <div className="text-xs tracking-widest text-neutral-400 uppercase">
                            Selected
                          </div>
                          <div className="text-lg font-bold">{selectedItem.name}</div>
                          <div className="text-[11px] text-neutral-400 uppercase">
                            {selectedItem.type} • {selectedItem.rarity}
                            {selectedItem.upgrade_level > 0
                              ? ` • +${selectedItem.upgrade_level}`
                              : ""}
                          </div>
                        </div>

                        <div className="text-sm text-neutral-200 space-y-1">
                          {formatBonusLine("Strength", selectedItem.bonus_strength)}
                          {formatBonusLine("Intellect", selectedItem.bonus_intellect)}
                          {formatBonusLine("Defense", selectedItem.bonus_defense)}
                          {formatBonusLine("HP", selectedItem.bonus_hp)}
                        </div>

                        <div className="flex gap-2">
                          {!selectedItem.is_equipped ? (
                            <button
                              className="flex-1 py-2 rounded bg-emerald-600 hover:bg-emerald-500"
                              onClick={() => equipItem(selectedItem.item_id)}
                            >
                              Equip
                            </button>
                          ) : (
                            <button
                              className="flex-1 py-2 rounded bg-red-600 hover:bg-red-500"
                              onClick={() => unequipItem(selectedItem.item_id)}
                            >
                              Levétel
                            </button>
                          )}

                          <button
                            className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700"
                            onClick={() => setSelectedItem(null)}
                            title="Kijelölés törlése"
                          >
                            X
                          </button>
                        </div>

                        {selectedItem.type === "potion" && (
                          <div className="text-[11px] text-neutral-500">
                            (Potionoknál az equip/unequip logika nálad külön kezelhető.)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-neutral-500">
                        Válassz ki egy tárgyat
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SPELLBOOK / DECK MODAL: placeholder */}
        {showDeckEditor && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40">
            <div className="relative text-white flex flex-col items-center">
              <button
                className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700"
                onClick={() => setShowDeckEditor(false)}
              >
                Bezárás
              </button>
            </div>
          </div>
        )}

        {/* HOTSPOTOK A HÁZBAN */}
        <div className="flex justify-between flex-1">
          <div style={{ width: "80%", height: "80%" }}>
            <div
              className={`absolute cursor-pointer group ${anyModalOpen ? "pointer-events-none" : ""}`}
              style={{ left: "5%", bottom: "5%", width: "325px", height: "600px" }}
              onClick={onClose}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
            </div>

            <div
              className={`absolute cursor-pointer group ${anyModalOpen ? "pointer-events-none" : ""}`}
              style={{ left: "45%", bottom: "30%", width: "180px", height: "250px" }}
              onClick={() => setShowDeckEditor(true)}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
            </div>

            <div
              className={`absolute cursor-pointer group ${anyModalOpen ? "pointer-events-none" : ""}`}
              style={{ left: "25%", bottom: "18%", width: "400px", height: "300px" }}
              onClick={() => setShowInventory(true)}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
            </div>

            <div
              className={`absolute cursor-pointer group ${anyModalOpen ? "pointer-events-none" : ""}`}
              style={{ right: "10%", bottom: "5%", width: "650px", height: "350px" }}
              onClick={() => setShowStats(true)}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
            </div>

            <div
              className={`absolute cursor-pointer group ${anyModalOpen ? "pointer-events-none" : ""}`}
              style={{ right: "10%", top: "5%", width: "150px", height: "150px" }}
              onClick={onClose}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition">
                Beall
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
