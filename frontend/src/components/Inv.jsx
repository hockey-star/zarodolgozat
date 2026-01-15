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
  { key: "weapon", label: "Weapon" },
  { key: "armor", label: "Chest" },
  { key: "helmet", label: "Head" },
  { key: "accessory", label: "Accessory" },
  { key: "accessory", label: "Accessory" },
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
                  <div className="invEquipmentText">
                    Equipment
                  </div>

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
                           "h-20 rounded-lg border",
                          "flex flex-col justify-center px-3 text-left",
                          "bg-neutral-900/50 hover:bg-neutral-900",
                          equipped ? ui.border : "border-neutral-700",
                        ].join(" ")}
                        title={equipped ? "Kattints a részletekhez" : "Üres slot"}
                      >
                        <div className="invEquipedItemType">
                          {slot.label}
                        </div>
                        <div className="invEquipedItemName">
                          {equipped ? equipped.name : "Üres"}
                        </div>
                        <div className="invEquipedItemRarity">
                          {equipped ? equipped.rarity : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="col-span-6 flex flex-col min-h-0">
                  <div className="invCharacterText">
                    {player.username}
                  </div>
                  <div className="invCharacterImg mt-3 flex-1 min-h-0 flex items-center justify-center">
                    <div className="text-neutral-600">(placeholder)</div>
                  </div>
                </div>

                <div className="col-span-4 flex flex-col gap-4 min-h-0">
                  <div className="invStatsBorder p-4 ">
                    <div className="invStatsText">
                      Stats
                    </div>

                    <div className="invStats space-y-2">
                      {stats.map((s) => (
                        <div
                          key={s.label}
                          className="invStatsDiv flex justify-between border-neutral-800 pb-1"
                        >
                          <span className="invStatName">{s.label}</span>
                          <span className="invStatNumber">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="invInvBorder p-4 flex-1 min-h-0 flex flex-col">
                    <div className="invInvText">
                      Inventory
                    </div>

                    <div className="invItemsBorder overflow-y-auto">
                      <div className="invInvGridItems grid grid-cols-3 gap-4">
                        {inventoryItems.length === 0 && (
                          <div className="invInvGridItemsNull text-neutral-500 col-span-4 text-center mt-10">
                            Az inventory üres
                          </div>
                        )}

                        {inventoryItems.map((item) => {
                            const isSelected = selectedItem?.item_id === item.item_id;
                            const ui = rarityUi(item.rarity);
                          return (
                            <button
                              key={item.item_id}
                              onClick={() => setSelectedItem(item)}
                              className={[
                                "h-20 border text-left px-3",
                                "bg-neutral-900/40 hover:bg-neutral-900",
                                item.is_equipped
                                  ? "border-rose-950"
                                  : "border-neutral-700",
                                isSelected ? "ring-2 ring-yellow-400" : "",
                              ].join(" ")}
                              title="Kattints a részletekhez"
                            key={item.item_id}
                                  onClick={() => setSelectedItem(item)}
                                  className={[
                                    "h-20 rounded-lg border text-left px-3",
                                    "bg-neutral-900/40 hover:bg-neutral-900",
                                    // rarity border (alap)
                                    ui.border,
                                    // equipped: maradhat zöld, vagy ha akarod rarity-vel is mehet (lásd lent)
                                    item.is_equipped ? "border-emerald-600" : "",
                                    // selected ring rarity alapján
                                    isSelected ? `ring-2 ${ui.ring}` : "",
                                  ].join(" ")}
                                  title="Kattints a részletekhez"
                            >
                              <div className=" truncate">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-neutral-400 uppercase"> {/*RARITY ALAPJÁN SZÍN*/}
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
                          <div className="invInvSelectedText">
                            Selected
                          </div>
                          <div className="invInvSelectedItem">{selectedItem.name}</div>
                          <div className="invInvSelectedItemInfo">
                            {selectedItem.type} • {selectedItem.rarity}
                            {selectedItem.upgrade_level > 0
                              ? ` • +${selectedItem.upgrade_level}`
                              : ""}
                          </div>
                        </div>

                        <div className="invInvSelectedItemStat space-y-1">
                          {formatBonusLine("Strength", selectedItem.bonus_strength)}
                          {formatBonusLine("Intellect", selectedItem.bonus_intellect)}
                          {formatBonusLine("Defense", selectedItem.bonus_defense)}
                          {formatBonusLine("HP", selectedItem.bonus_hp)}
                        </div>

                        <div className="flex gap-2">
                          {!selectedItem.is_equipped ? (
                            <button
                              className="invInvEquipBtn flex-1 py-2"
                              onClick={() => equipItem(selectedItem.item_id)}
                            >
                              Felvétel
                            </button>
                          ) : (
                            <button
                              className="invInvUnEquipBtn flex-1 py-2"
                              onClick={() => unequipItem(selectedItem.item_id)}
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
                      <div className="invInvValassz text-center">
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

      {/* FEJLÉC */}
      <div className="w-full max-w-[1200px] flex justify-between items-center mb-2 px-2">
        <h2 className="text-xl font-bold">
          Spellbook / Deck – {classKey?.toUpperCase()}
        </h2>
        <div className="text-sm text-gray-200">
          Deck mérete: {tempDeck.length} / {MAX_DECK_SIZE}
        </div>
      </div>

      {/* SPELLBOOK KÉP */}
      <div
        className="relative w-[68vw] max-w-[1000px] aspect-[870/704] flex items-center justify-center"
      >
        <img
          src={spellbookImg}
          alt="Spellbook"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        />

        {/* TARTALOM */}
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
          {/* BAL OLDAL – ABILITIES */}
          <div className="flex-1 pointer-events-auto">
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
                      className="relative aspect-[3/4] rounded-md overflow-hidden hover:brightness-110"
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

          {/* JOBB OLDAL – DECK */}
          <div className="flex-1 pointer-events-auto">
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
                    const count = deckCounts[id];
                    const imgSrc = resolveCardImageFromAbility(ab);

                    return (
                      <button
                        key={id}
                        onClick={() => handleRemoveOneFromDeck(id)}
                        className="relative aspect-[3/4] rounded-md overflow-hidden hover:brightness-110"
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

      {/* ALSÓ GOMBOK */}
      <div className="mt-4 w-full max-w-[1200px] flex justify-between items-center px-2">
        <div className="text-xs text-gray-200">
          Tipp: bal oldalt hozzáadsz, jobb oldalt eltávolítasz.
        </div>

        <div className="space-x-2">
          <button
            className="px-4 py-2 bg-gray-800 rounded"
            onClick={() => setShowDeckEditor(false)}
          >
            Mégse
          </button>
          <button
            className="px-4 py-2 bg-emerald-600 rounded"
            onClick={handleSaveDeck}
          >
            Mentés
          </button>
        </div>
      </div>

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
