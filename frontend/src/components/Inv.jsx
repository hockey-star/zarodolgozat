// frontend/src/components/Inv.jsx
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

// DB alapján: items.type = weapon | armor | potion | accessory
// Head/helmet típus most nincs, de előkészítjük:
const EQUIP_SLOTS = [
  { key: "weapon", label: "Weapon" },
  { key: "armor", label: "Chest" },
  { key: "helmet", label: "Head" }, // ha később items.type = 'helmet' lesz
  { key: "accessory", label: "Trinket" },
];

function mapItemTypeToSlot(type) {
  const t = (type || "").toLowerCase();
  if (t === "weapon") return "weapon";
  if (t === "armor") return "armor";
  if (t === "accessory") return "accessory";
  if (t === "helmet" || t === "head") return "helmet";
  return null; // pl potion -> null
}

function formatBonusLine(label, value) {
  if (!value || value <= 0) return null;
  return <div>{label}: +{value}</div>;
}

export default function Inv({ onClose }) {
  const { player, setPlayer } = usePlayer();

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
        setInventoryItems(data);
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
      .then(() => {
  setInventoryItems((prev) => {
    // az újonnan equipelt item típusa → slot
    const newItem = prev.find((p) => p.item_id === itemId);
    const newSlot = newItem ? mapItemTypeToSlot(newItem.type) : null;

    return prev.map((it) => {
      const itSlot = mapItemTypeToSlot(it.type);

      // potion soha nem kerül slotba
      if (!itSlot || it.type === "potion") return it;

      // ha ugyanabba a slotba tartozik:
      if (itSlot === newSlot) {
        return {
          ...it,
          is_equipped: it.item_id === itemId,
        };
      }

      return it;
    });
  });

  // UI szinkron a jobb oldali panelhez
  setSelectedItem((prev) =>
    prev && prev.item_id === itemId
      ? { ...prev, is_equipped: true }
      : prev
  );
})
      .catch((err) => {
        console.error(err);
        alert("Hiba az equip során");
      });
  }

  function unequipItem(itemId) {
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
      .then(() => {
        setInventoryItems((prev) =>
          prev.map((it) =>
            it.item_id === itemId ? { ...it, is_equipped: false } : it
          )
        );

        // ✅ UI azonnali frissítés a jobb oldali panelhez
        setSelectedItem((prev) =>
          prev && prev.item_id === itemId
            ? { ...prev, is_equipped: false }
            : prev
        );
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

    setPlayer((prev) => ({
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
      if (it.type === "potion") continue; // potion ne kerüljön slotba

      map[slot] = it; // 1 db / slot
    }
    return map;
  }, [inventoryItems]);

  /* ==============================
     STATOK (playerből)
     ============================== */
  const stats = useMemo(() => {
    if (!player) return [];
    return [
      { label: "Level", value: player.level ?? 1 },
      { label: "HP", value: `${player.hp ?? 0} / ${player.max_hp ?? 0}` },
      { label: "Strength", value: player.strength ?? 0 },
      { label: "Intellect", value: player.intellect ?? 0 },
      { label: "Defense", value: player.defense ?? 0 },
      { label: "Gold", value: player.gold ?? 0 },
    ];
  }, [player]);

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

        {/* STAT MODAL */}
        {showStats && <StatModal onClose={() => setShowStats(false)} />}

        {/* ==============================
            INVENTORY MODAL (Character Screen)
           ============================== */}
        {showInventory && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-10 z-40">
            <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl shadow-xl w-4/5 h-4/5 text-white relative p-6">
              {/* CLOSE */}
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

              {/* LAYOUT GRID */}
              <div className="h-full grid grid-cols-12 gap-6 min-h-0">
                {/* LEFT: EQUIP SLOTS */}
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

                {/* CENTER: CHARACTER PLACEHOLDER */}
                <div className="col-span-6 flex flex-col min-h-0">
                  <div className="text-xs tracking-widest text-neutral-400 uppercase">
                    Character
                  </div>
                  <div className="mt-3 flex-1 min-h-0 rounded-2xl border border-neutral-800 bg-neutral-950/50 flex items-center justify-center">
                    <div className="text-neutral-600 text-sm">(placeholder)</div>
                  </div>
                </div>

                {/* RIGHT: STATS + INVENTORY GRID + ITEM INFO */}
                {/* ✅ fontos: min-h-0 + flex-1 blokkok */}
                <div className="col-span-4 flex flex-col gap-4 min-h-0">
                  {/* STATS (fix magasság) */}
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

                  {/* INVENTORY GRID (SCROLL) */}
                  {/* ✅ EZ biztosan scrolloz: flex-1 + min-h-0 + belső overflow-y-auto + explicit max-h */}
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4 flex-1 min-h-0 flex flex-col">
                    <div className="text-xs tracking-widest text-neutral-400 uppercase mb-3 shrink-0">
                      Inventory
                    </div>

                    {/* ✅ EZ a görgethető rész */}
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                      <div className="grid grid-cols-4 gap-3">
                        {inventoryItems.length === 0 && (
                          <div className="text-neutral-500 col-span-4 text-center mt-10">
                            Az inventory üres
                          </div>
                        )}

                        {inventoryItems.map((item) => {
                          const isSelected =
                            selectedItem?.item_id === item.item_id;

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

                  {/* ITEM INFO + ACTIONS (fix magasság) */}
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4 shrink-0">
                    {selectedItem ? (
                      <div className="flex flex-col gap-3">
                        <div>
                          <div className="text-xs tracking-widest text-neutral-400 uppercase">
                            Selected
                          </div>
                          <div className="text-lg font-bold">
                            {selectedItem.name}
                          </div>
                          <div className="text-[11px] text-neutral-400 uppercase">
                            {selectedItem.type} • {selectedItem.rarity}
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

        {/*------------------------------------------------------------------------------------------------------------------------------------------------------*/}
        {/* SPELLBOOK / DECK MODAL */}
        {showDeckEditor && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40">
            <div className="relative text-white flex flex-col items-center">
              <div className="w-full max-w-[1200px] flex justify-between items-center mb-2 px-2">
                <h2 className="text-xl font-bold drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]">
                  Spellbook / Deck – {classKey.toUpperCase()}
                </h2>

                <div className="text-sm text-gray-200 drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]">
                  Deck mérete: {tempDeck.length} / {MAX_DECK_SIZE}
                </div>
              </div>

              <div className="text-xs text-gray-200 mb-3 drop-shadow-[0_0_6px_rgba(0,0,0,0.8)] max-w-[1200px] px-2">
                Limit:
                <span className="text-gray-50"> common</span> max 4,
                <span className="text-gray-50"> rare</span> max 3,
                <span className="text-gray-50"> epic</span> max 2,
                <span className="text-gray-50"> legendary</span> max 1 / képesség.
              </div>

              <div
                className="
                  relative
                  w-[68vw]
                  max-w-[1000px]
                  aspect-[870/704]
                  flex
                  items-center
                  justify-center
                "
              >
                <img
                  src={spellbookImg}
                  alt="Spellbook"
                  className="
                    absolute inset-0
                    w-full h-full
                    object-contain
                    pointer-events-none
                    select-none
                    drop-shadow-[0_0_25px_rgba(0,0,0,0.9)]
                  "
                />

                <div
                  className="absolute flex pointer-events-none"
                  style={{
                    width: "78%",
                    height: "52%",
                    top: "37%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    gap: "3rem",
                  }}
                >
                  <div
                    className="flex-1 pointer-events-auto"
                    style={{ paddingRight: "0.25rem" }}
                  >
                    <div className="font-semibold mb-1 text-sm text-yellow-100">
                      Elérhető képességek
                    </div>

                    <div className="h-full overflow-y-auto pr-1 pixel-scroll">
                      <div className="grid grid-cols-3 gap-2">
                        {abilityPool.map((ab) => {
                          const imgSrc = resolveCardImageFromAbility(ab);
                          return (
                            <button
                              key={ab.id}
                              onClick={() => handleAddToDeck(ab.id)}
                              className="
                                relative
                                aspect-[3/4]
                                rounded-md
                                overflow-hidden
                                shadow-md
                                hover:brightness-110
                                transition
                              "
                            >
                              <img
                                src={imgSrc}
                                alt={ab.name}
                                className="absolute inset-0 w-full h-full object-cover"
                              />

                              <div className="absolute bottom-0 w-full bg-black/75 px-1 py-[3px]">
                                <div className="text-[9px] font-semibold text-center">
                                  {ab.name}
                                </div>
                                <div className="text-[8px] text-amber-200 uppercase text-center">
                                  {ab.type} • {ab.rarity}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex-1 pointer-events-auto"
                    style={{ paddingLeft: "5.25rem" }}
                  >
                    <div className="font-semibold mb-1 text-sm text-yellow-100">
                      Jelenlegi pakli
                    </div>

                    <div className="h-full overflow-y-auto pr-1 pixel-scroll">
                      {uniqueDeckIds.length === 0 ? (
                        <div className="text-sm text-amber-100/80">
                          A pakli üres. Kattints bal oldalt egy képességre.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {uniqueDeckIds.map((id) => {
                            const ab = ABILITIES_BY_ID[id];
                            if (!ab) return null;
                            const count = deckCounts[id] || 0;
                            const imgSrc = resolveCardImageFromAbility(ab);

                            return (
                              <button
                                key={id}
                                onClick={() => handleRemoveOneFromDeck(id)}
                                className="
                                  relative
                                  aspect-[3/4]
                                  rounded-md
                                  overflow-hidden
                                  shadow-md
                                  hover:brightness-110
                                  transition
                                "
                              >
                                <img
                                  src={imgSrc}
                                  alt={ab.name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />

                                <div className="absolute top-1 left-1 bg-black/80 text-[8px] px-1 rounded">
                                  x{count}
                                </div>

                                <div className="absolute bottom-0 w-full bg-black/75 px-1 py-[3px]">
                                  <div className="text-[9px] font-semibold text-center">
                                    {ab.name}
                                  </div>
                                  <div className="text-[8px] text-amber-200 uppercase text-center">
                                    {ab.type} • {ab.rarity}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 w-full max-w-[1200px] flex justify-between items-center px-2">
                <div className="text-xs text-gray-200">
                  Tipp: bal oldalt kattintva hozzáadsz, jobb oldalt eltávolítasz.
                </div>

                <div className="space-x-2">
                  <button
                    className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700"
                    onClick={() => setShowDeckEditor(false)}
                  >
                    Mégse
                  </button>

                  <button
                    className="px-4 py-2 bg-emerald-600 rounded hover:bg-emerald-500"
                    onClick={handleSaveDeck}
                  >
                    Mentés
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/*------------------------------------------------------------------------------------------------------------------------------------------------------*/}

        {/* HOTSPOTOK A HÁZBAN */}
        <div className="flex justify-between flex-1">
          <div style={{ width: "80%", height: "80%" }}>
            {/* AJTÓ / KIJÁRAT */}
            <div
              className={`absolute cursor-pointer group ${
                anyModalOpen ? "pointer-events-none" : ""
              }`}
              style={{ left: "5%", bottom: "5%", width: "325px", height: "600px" }}
              onClick={onClose}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
            </div>

            {/* DECK SZEKRÉNY – SPELLBOOK */}
            <div
              className={`absolute cursor-pointer group ${
                anyModalOpen ? "pointer-events-none" : ""
              }`}
              style={{ left: "45%", bottom: "30%", width: "180px", height: "250px" }}
              onClick={() => setShowDeckEditor(true)}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
            </div>

            {/* LÁDA / INVENTORY */}
            <div
              className={`absolute cursor-pointer group ${
                anyModalOpen ? "pointer-events-none" : ""
              }`}
              style={{ left: "25%", bottom: "18%", width: "400px", height: "300px" }}
              onClick={() => setShowInventory(true)}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
            </div>

            {/* ÁGY → STAT MODAL */}
            <div
              className={`absolute cursor-pointer group ${
                anyModalOpen ? "pointer-events-none" : ""
              }`}
              style={{ right: "10%", bottom: "5%", width: "650px", height: "350px" }}
              onClick={() => setShowStats(true)}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
            </div>

            {/* BEÁLLÍTÁSOK (placeholder) */}
            <div
              className={`absolute cursor-pointer group ${
                anyModalOpen ? "pointer-events-none" : ""
              }`}
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
