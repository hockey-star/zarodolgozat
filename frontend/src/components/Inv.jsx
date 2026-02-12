
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
import "./Inv.css";
/* ==============================
   HELPERS
   ============================== */
const CLASS_CONFIG = {
  6: { key: "warrior", displayName: "Harcos", sprite: "/ui/player/warriorsquare.png" },
  7: { key: "mage", displayName: "Varázsló", sprite: "/ui/player/magesquare.png" },
  8: { key: "archer", displayName: "Íjász", sprite: "/ui/player/archersquare.png" },
};
const RARITY_UI = {
  common:    { border: "border-gray-500",    ring: "ring-gray-400",    text: "text-gray-300" },
  uncommon:  { border: "border-green-500",   ring: "ring-green-400",   text: "text-green-300" },
  rare:      { border: "border-blue-500",    ring: "ring-blue-400",    text: "text-blue-300" },
  epic:      { border: "border-purple-500",  ring: "ring-purple-400",  text: "text-purple-300" },
  legendary: { border: "border-yellow-500",  ring: "ring-yellow-400",  text: "text-yellow-300" },
};
function rarityUi(rarity) {
  const key = (rarity || "common").toLowerCase();
  return RARITY_UI[key] || RARITY_UI.common;
}
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
  { key: "weapon", label: "Fegyver" },
  { key: "armor", label: "Mellvért" },
  { key: "helmet", label: "Sisak" },
  { key: "accessory1", label: "Kiegészítő 1" },
  { key: "accessory2", label: "Kiegészítő 2" },
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
  const [closing, setClosing] = useState(false);
  

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
     EQUIP / UNEQUIP  (owned_id alapú!)
     ============================== */
function equipItem(ownedId, slotKey) {
  if (!player?.id || !ownedId) return;
  fetch("http://localhost:3000/api/inventory/equip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerId: player.id,
      ownedId,
      slotKey, // "accessory1" | "accessory2" | undefined
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Equip failed");
      return res.json();
    })
    .then(async () => {
      setInventoryItems((prev) => {
        const chosen = prev.find((p) => p.owned_id === ownedId);
        const chosenType = (chosen?.type || "").toLowerCase();
        // accessory slot kiválasztás
        const slotNum =
          chosenType === "accessory"
            ? (slotKey === "accessory2" ? 2 : 1)
            : 1;
        return prev.map((it) => {
          const itType = (it.type || "").toLowerCase();
          if (itType === "potion") return it;
          // ✅ ACCESSORY: csak az adott slotot cseréljük
        if (itType === "accessory") {
        // ✅ Ha NEM accessoryt equipelsz, NE nyúlj az accessorykhoz
        if (chosenType !== "accessory") return it;

        const itSlotNum = Number(it.equip_slot) || 1;

        // csak a cél slotot kezeljük
        if (itSlotNum !== slotNum && it.owned_id !== ownedId) return it;

        if (it.owned_id === ownedId) {
          return { ...it, is_equipped: 1, equip_slot: slotNum };
        }

        if (itSlotNum === slotNum) {
          return { ...it, is_equipped: 0 };
        }

            return it;
          }
          // ✅ WEAPON / ARMOR / HELMET: típuson belül 1 lehet
          if (itType === chosenType) {
            return {
              ...it,
              is_equipped: it.owned_id === ownedId ? 1 : 0,
              equip_slot: 1,
            };
          }
          return it;
        });
      });
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

function handleClose() {
  setClosing(true);

  setTimeout(() => {
    onClose?.();
  }, 300);
}

function unequipItem(ownedId) {
  if (!player?.id || !ownedId) return;
  fetch("http://localhost:3000/api/inventory/unequip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerId: player.id,
      ownedId,
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Unequip failed");
      return res.json();
    })
    .then(async () => {
      setInventoryItems((prev) =>
        prev.map((it) =>
          it.owned_id === ownedId
            ? { ...it, is_equipped: 0 } // equip_slot maradhat, jó ha emlékszik
            : it
        )
      );
      setSelectedItem((prev) =>
        prev && prev.owned_id === ownedId
          ? { ...prev, is_equipped: 0 }
          : prev
      );
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
    accessory1: null,
    accessory2: null,
  };
  for (const it of inventoryItems) {
    if (!it.is_equipped) continue;
    const type = (it.type || "").toLowerCase();
    if (type === "potion") continue;
    if (type === "accessory") {
      const slotNum = Number(it.equip_slot) || 1;
      map[slotNum === 2 ? "accessory2" : "accessory1"] = it;
      continue;
    }
    const slot = mapItemTypeToSlot(type); // weapon/armor/helmet
    if (!slot) continue;
    map[slot] = it;
  }
  return map;
}, [inventoryItems]);
  /* ==============================
     STATOK (FINAL + zárójeles bonus)
     ============================== */
  const stats = useMemo(() => {
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
    const finalStr = effectiveStats?.strength ?? (player.strength ?? 0);
    const finalInt = effectiveStats?.intellect ?? (player.intellect ?? 0);
    const finalDef = effectiveStats?.defense ?? (player.defense ?? 0);
    const finalHp = effectiveStats?.hp ?? (player.hp ?? 0);
    const finalMaxHp = effectiveStats?.max_hp ?? (player.max_hp ?? 0);
    const hpBonus = itemBonuses?.hp ?? 0;
    const hpText = `${finalHp} / ${finalMaxHp}`;
    return [
      { label: "Szint", value: player.level ?? 1 },
      { label: "Életerő", value: hpBonus ? `${hpText} (+${hpBonus})` : hpText },
      { label: "Erő", value: formatWithBonus(finalStr, itemBonuses?.strength ?? 0) },
      { label: "Intelligencia", value: formatWithBonus(finalInt, itemBonuses?.intellect ?? 0) },
      { label: "Védelem", value: formatWithBonus(finalDef, itemBonuses?.defense ?? 0) },
      { label: "Arany", value: player.gold ?? 0 },
    ];
  }, [player, effectiveStats, itemBonuses]);
  /* ==============================
     RENDER
     ============================== */

     
  return (
  <>
    <div className="house-modal-overlay fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className={`house-modal-container ${closing ? "closing" : ""}`}
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
        {/* INVENTORY */}
        {showInventory && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-10 z-40">
            <div className="invMinden w-4/5 h-4/5 p-6">
              <button
                className="invBezaras text-center"
                onClick={() => {
                  setShowInventory(false);
                  setSelectedItem(null);
                }}
                title="Bezárás"
              >
                X
              </button>
              <div className="h-full grid grid-cols-12 gap-6 min-h-0">
                <div className="col-span-2 flex flex-col gap-3 min-h-0">
                  <div className="invEquipmentText">Felszerelés</div>
                  {EQUIP_SLOTS.map((slot) => {
                    const equipped = equippedBySlot[slot.key];
                    const ui = equipped ? rarityUi(equipped.rarity) : rarityUi("common");
                    return (
                      <button
                        key={slot.key}
                        onClick={() => {
                          if (equipped) setSelectedItem(equipped);
                        }}
                        className={[
                          "h-20",
                          "invEquipedItems flex flex-col justify-center px-3 text-left",
                          equipped ? "invEquipedItemsEquipped" : "invEquipedItemsUnEquipped",
                          equipped ? ui.border : "border-neutral-700",
                        ].join(" ")}
                        title={equipped ? "Kattints a részletekhez" : "Üres slot"}
                      >
                        <div className="invEquipedItemType">{slot.label}</div>

                        <div className="invEquipedItemName">
                          {equipped ? equipped.name : "Üres"}
                        </div>

                        <div
                          className={[
                            "invEquipedItemRarity uppercase text-[10px]",
                            equipped ? `rarity-${equipped.rarity.toLowerCase()}` : "",
                          ].join(" ")}
                        >
                          {equipped ? equipped.rarity : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="col-span-6 flex flex-col min-h-0">
                  <div className="invCharacterText">{player.username}</div>
                  <div className="invCharacterImg mt-3 flex-1 min-h-0 flex items-center justify-center overflow-hidden">
                    {player.class_id && CLASS_CONFIG[player.class_id] ? (
                      <img
                        src={CLASS_CONFIG[player.class_id].sprite}
                        alt={CLASS_CONFIG[player.class_id].displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">(Nincs kép)</div>
                    )}
                  </div>
                </div>
                <div className="col-span-4 flex flex-col gap-4 min-h-0">
                  <div className="invStatsBorder p-4 ">
                    <div className="invStatsText">Stats</div>
                    <div className="invStats space-y-2">
                      {stats.map((s) => (
                        <div
                          key={s.label}
                          className="invStatsDiv flex justify-between pb-1"
                        >
                          <span className="invStatName">{s.label}</span>
                          <span className="invStatNumber">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="invInvBorder p-4 flex-1 min-h-0 flex flex-col">
                    <div className="invInvText">Inventory</div>
                    <div className="invItemsBorder overflow-y-auto">
                      <div className="invInvGridItems grid grid-cols-3 gap-4">
                        {inventoryItems.length === 0 && (
                          <div className="invInvGridItemsNull text-neutral-500 col-span-4 text-center mt-10">
                            Az inventory üres
                          </div>
                        )}
                        {inventoryItems.map((item) => {
                          const isSelected = selectedItem?.owned_id === item.owned_id;
                          const ui = rarityUi(item.rarity);
                          return (
                            <button
                              key={item.owned_id} // ✅
                              onClick={() => setSelectedItem(item)}
                              className={[
                                "h-20 text-left px-3",
                                "invInvItemGrids hover:bg-neutral-900",
                                item.is_equipped ? "border-rose-950" : "border-neutral-700",
                                isSelected ? "ring-2 ring-yellow-400" : "",
                              ].join(" ")}
                              title="Kattints a részletekhez"
                            >
                              <div className="truncate">{item.name}</div>

                              <div
                                className={[
                                  "text-[10px] uppercase",
                                  `rarity-${item.rarity?.toLowerCase() || "common"}`,
                                ].join(" ")}
                              >
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
                  <div className="invInvSelectedBorder p-4">
                    {selectedItem ? (
                      <div className="flex flex-col gap-3">
                        <div>
                          <div className="invInvSelectedText">Selected</div>
                          <div className="invInvSelectedItem">{selectedItem.name}</div>
                          <div className="invInvSelectedItemInfo">
                            {selectedItem.type} • {selectedItem.rarity}
                            {selectedItem.upgrade_level > 0
                              ? ` • +${selectedItem.upgrade_level}`
                              : ""}
                          </div>
                        </div>
                        <div className="invInvSelectedItemStat space-y-1">
                          {formatBonusLine("Erő", selectedItem.bonus_strength)}
                          {formatBonusLine("intelligencia", selectedItem.bonus_intellect)}
                          {formatBonusLine("Védelem", selectedItem.bonus_defense)}
                          {formatBonusLine("Életerő", selectedItem.bonus_hp)}
                        </div>
<div className="flex gap-2">
  {!selectedItem.is_equipped ? (
    (selectedItem.type || "").toLowerCase() === "accessory" ? (
      <>
        <button
          className="invInvEquipBtn flex-1 py-2"
          onClick={() => equipItem(selectedItem.owned_id, "accessory1")}
        >
          Felvétel (1)
        </button>
        <button
          className="invInvEquipBtn flex-1 py-2"
          onClick={() => equipItem(selectedItem.owned_id, "accessory2")}
        >
          Felvétel (2)
        </button>
      </>
    ) : (
      <button
        className="invInvEquipBtn flex-1 py-2"
        onClick={() => equipItem(selectedItem.owned_id)}
      >
        Felvétel
      </button>
    )
  ) : (
    <button
      className="invInvUnEquipBtn flex-1 py-2"
      onClick={() => unequipItem(selectedItem.owned_id)}
    >
      Levétel
    </button>
  )}
  <button
    className="invInvItemClear px-4 py-2"
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
                      <div className="invInvValassz text-center">Válassz ki egy tárgyat</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
{/* SPELLBOOK / DECK MODAL */}
{showDeckEditor && (
  <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-sm">
    <style>
      {`
        .book-text { font-family: 'Jersey 10', sans-serif; }
        .pixel-scroll::-webkit-scrollbar { width: 4px; }
        .pixel-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .pixel-scroll::-webkit-scrollbar-thumb { background: #8a704a; border: 1px solid #000; }
        /* Rarity-alapú stílusok a pici kártyákhoz */
        .rarity-common { border-color: #9ca3af; box-shadow: inset 0 0 5px rgba(156, 163, 175, 0.3); }
        .rarity-rare { border-color: #3b82f6; box-shadow: inset 0 0 5px rgba(59, 130, 246, 0.3); }
        .rarity-epic { border-color: #a855f7; box-shadow: inset 0 0 5px rgba(168, 85, 247, 0.3); }
        .rarity-legendary { border-color: #eab308; box-shadow: inset 0 0 8px rgba(234, 179, 8, 0.4); }
        .card-inner-label {
          background: rgba(0,0,0,0.85);
          border-top: 1px solid currentColor;
        }
      `}
    </style>
    <div className="relative text-white flex flex-col items-center w-full max-w-[1000px]">
      {/* HEADER */}
      <div className="w-full max-w-[850px] flex justify-between items-end mb-2 px-6 book-text">
        <h2 className="text-4xl tracking-tight text-amber-50 drop-shadow-md uppercase">
          {classKey} Deck
        </h2>
        <div className="text-xl text-red-500">
          Capacity: <span className={tempDeck.length > MAX_DECK_SIZE ? 'text-red-500' : 'text-white'}>
            {tempDeck.length} / {MAX_DECK_SIZE}
          </span>
        </div>
      </div>
      {/* BOOK CONTAINER */}
      <div className="relative w-[75vw] max-w-[900px] aspect-[870/620] flex items-center justify-center">
        <img
          src={spellbookImg}
          alt="Spellbook"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none brightness-110 sepia-[0.1]"
        />
        <div
          className="absolute flex"
          style={{
            width: "76%",
            height: "58%",
            top: "46%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            gap: "8%",
          }}
        >
          {/* BAL OLDAL: ELÉRHETŐ */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="book-text text-xl text-[#2a2218] border-b border-[#2a2218]/30 mb-3 font-bold uppercase text-center">
              Elérhető képességek
            </div>
            <div className="flex-1 overflow-y-auto pr-1 pixel-scroll pointer-events-auto">
              <div className="grid grid-cols-3 gap-2">
                {abilityPool.map((ab) => {
                  const rarityClass = `rarity-${ab.rarity?.toLowerCase() || 'common'}`;
                  const colorClass = 
                    ab.rarity === 'rare' ? 'text-blue-400' : 
                    ab.rarity === 'epic' ? 'text-purple-400' : 
                    ab.rarity === 'legendary' ? 'text-yellow-400' : 'text-gray-300';
                  return (
                    <button
                      key={ab.id}
                      onClick={() => handleAddToDeck(ab.id)}
                      className={`relative aspect-[3/4] rounded-sm overflow-hidden border-2 transition-transform hover:scale-105 active:scale-95 ${rarityClass}`}
                    >
                      <img src={resolveCardImageFromAbility(ab)} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute bottom-0 w-full card-inner-label p-0.5 text-center">
                        <div className={`book-text text-[9px] leading-tight truncate px-1 ${colorClass}`}>
                          {ab.name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {/* JOBB OLDAL: PAKLI */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="book-text text-xl text-[#2a2218] border-b border-[#2a2218]/30 mb-3 font-bold uppercase text-center">
              Aktív Deck
            </div>
            <div className="flex-1 overflow-y-auto pr-1 pixel-scroll pointer-events-auto">
              {uniqueDeckIds.length === 0 ? (
                <div className="h-full flex items-center justify-center opacity-40">
                  <div className="book-text text-lg text-[#2a2218] italic underline decoration-dotted">Empty Deck</div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {uniqueDeckIds.map((id) => {
                    const ab = ABILITIES_BY_ID[id];
                    if (!ab) return null;
                    const count = deckCounts[id];
                    const rarityClass = `rarity-${ab.rarity?.toLowerCase() || 'common'}`;
                    const colorClass = 
                      ab.rarity === 'rare' ? 'text-blue-400' : 
                      ab.rarity === 'epic' ? 'text-purple-400' : 
                      ab.rarity === 'legendary' ? 'text-yellow-400' : 'text-gray-300';
                    return (
                      <button
                        key={id}
                        onClick={() => handleRemoveOneFromDeck(id)}
                        className={`relative aspect-[3/4] rounded-sm overflow-hidden border-2 transition-transform hover:scale-105 active:scale-95 ${rarityClass}`}
                      >
                        <img src={resolveCardImageFromAbility(ab)} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute top-0 right-0 bg-black/90 border-b border-l border-white/20 text-white px-1 z-10 book-text text-[10px]">
                          x{count}
                        </div>
                        <div className="absolute bottom-0 w-full card-inner-label p-0.5 text-center">
                          <div className={`book-text text-[9px] leading-tight truncate px-1 ${colorClass}`}>
                            {ab.name}
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
      {/* CONTROLS */}
      <div className="mt-4 flex gap-6 book-text">
        <button
          className="px-6 py-2 invInvEquipBtn"
          onClick={() => setShowDeckEditor(false)}
        >
          MÉGSE
        </button>
        <button
          className="invInvEquipBtn px-10 py-2 "
          onClick={handleSaveDeck}
        >
          DECK MENTÉS
        </button>
      </div>
    </div>
  </div>
)}
        {/* HOTSPOTOK A HÁZBAN */}
        <div className="flex justify-between flex-1">
          <div style={{ width: "80%", height: "80%" }}>
            <div
  className={`hotzone absolute cursor-pointer group ${anyModalOpen ? "pointer-events-none" : ""}`}
  style={{ left: "5%", bottom: "5%", width: "325px", height: "600px" }}
  onClick={handleClose}
>
  <span className="zone-label">Kilépés a házból</span>

  
</div>
            <div
  className={`hotzone absolute cursor-pointer group ${anyModalOpen ? "pointer-events-none" : ""}`}
  style={{ left: "43%", bottom: "30%", width: "195px", height: "250px" }}
  onClick={() => setShowDeckEditor(true)}
>
  <span className="zone-label">Varázskönyv</span>

  
</div>

            <div
  className={`hotzone absolute cursor-pointer group ${anyModalOpen ? "pointer-events-none" : ""}`}
  style={{ left: "25%", bottom: "18%", width: "400px", height: "300px" }}
  onClick={() => setShowInventory(true)}
>
  <span className="zone-label">Leltár</span>

 
</div>

            <div
  className={`hotzone absolute cursor-pointer group ${anyModalOpen ? "pointer-events-none" : ""}`}
  style={{ right: "10%", bottom: "5%", width: "650px", height: "350px" }}
  onClick={() => setShowStats(true)}
>
  <span className="zone-label">Statisztikák</span>

  
</div>

          </div>
        </div>
      </div>
    </div>
    </>
  );
}
