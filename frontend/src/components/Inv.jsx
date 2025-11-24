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
import StatModal from "./StatModal.jsx";

// UGYANAZ a helper, mint CombatView-ben
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

export default function Inv({ onClose }) {
  const [showInventory, setShowInventory] = useState(false);
  const [showDeckEditor, setShowDeckEditor] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const { player, setPlayer } = usePlayer();

  const anyModalOpen = showInventory || showDeckEditor || showStats;

  const classKey = useMemo(
    () => getClassKeyFromId(player?.class_id),
    [player?.class_id]
  );

  const abilityPool = useMemo(
    () => getAbilitiesForClass(classKey),
    [classKey]
  );

  useEffect(() => {
    if (!player || !setPlayer) return;
    if (Array.isArray(player.deck) && player.deck.length > 0) return;

    const baseDeck = buildDefaultDeckForClass(classKey);

    setPlayer((prev) => ({
      ...prev,
      deck: baseDeck,
    }));
  }, [player, setPlayer, classKey]);

  const [tempDeck, setTempDeck] = useState(player?.deck || []);

  useEffect(() => {
    if (Array.isArray(player?.deck)) {
      setTempDeck([...player.deck]);
    }
  }, [player?.deck]);

  const MAX_DECK_SIZE = 30;
  const MIN_DECK_SIZE = 10;

  const MAX_PER_RARITY = {
    common: 4,
    rare: 3,
    epic: 2,
    legendary: 1,
  };

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

    if (currentCount >= limit) {
      return;
    }

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

  const uniqueDeckIds = useMemo(
    () => Object.keys(deckCounts),
    [deckCounts]
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        style={{
          width: "1920px",
          height: "1088px",
          background: "black",
          backgroundImage: `url("./src/assets/pics/HAZ.jpg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <h2 className="text-center mb-2 text-sm text-white">OTTHON</h2>

        {/* STAT MODAL (ÁGY) */}
        {showStats && <StatModal onClose={() => setShowStats(false)} />}

        {/* INVENTORY MODAL (LÁDA) */}
        {showInventory && (
          <div className="absolute inset-0 bg-black/80 flex items-center justifycenter p-10 z-40">
            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl w-3/4 h-3/4 overflow-auto text-white">
              <h2 className="text-xl font-bold mb-6 text-center">TÁRGYAK</h2>

              <div className="grid grid-cols-4 gap-6">
                {Array(4)
                  .fill("")
                  .map((_, colIndex) => (
                    <div key={colIndex}>
                      <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: 15 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-full h-20 bg-gray-700 border border-gray-600 hover:bg-gray-600 transition cursor-pointer"
                          ></div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="text-center mt-6">
                <button
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-xl"
                  onClick={() => setShowInventory(false)}
                >
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SPELLBOOK / DECK MODAL */}
        {showDeckEditor && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-10 z-40">
            <div className="relative bg-transparent w-5/6 h-5/6 text-white flex flex-col">
              {/* Fejléc + infó */}
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]">
                  Spellbook / Deck – {classKey.toUpperCase()}
                </h2>
                <div className="text-sm text-gray-200 drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]">
                  Deck mérete: {tempDeck.length} / {MAX_DECK_SIZE}
                </div>
              </div>

              <div className="text-xs text-gray-200 mb-2 drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]">
                Limit: <span className="text-gray-50">common</span> max 4,{" "}
                <span className="text-gray-50">rare</span> max 3,{" "}
                <span className="text-gray-50">epic</span> max 2,{" "}
                <span className="text-gray-50">legendary</span> max 1 / képesség.
              </div>

              {/* KÖNYV + LAYOUT */}
              <div className="relative flex-1 flex items-center justify-center">
                <img
                    src={spellbookImg}
                    alt="Spellbook"
                    className="w-[85%] h-auto pointer-events-none select-none drop-shadow-[0_0_25px_rgba(0,0,0,0.9)]"
                  />

                {/* Lapokra osztott tartalom */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "45%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "40%",
                  }}
                >
                  <div className="flex gap-10 w-full max-w-4xl mx-auto">
                    {/* BAL LAP – Elérhető képességek */}
                    <div className="flex-1 pointer-events-auto">
                      <div className="font-semibold mb-2 text-sm text-yellow-100 drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]">
                        Elérhető képességek
                      </div>
                      <div className="h-[360px] overflow-auto pr-1">
                        <div className="grid grid-cols-2 gap-3">
                          {abilityPool.map((ab) => {
                            const imgSrc = resolveCardImageFromAbility(ab);
                            return (
                              <button
                                key={ab.id}
                                className="border border-amber-800/70 bg-amber-950/70 rounded-lg overflow-hidden hover:bg-amber-900/80 transition flex flex-col text-[11px]"
                                onClick={() => handleAddToDeck(ab.id)}
                                title="Kattintás: hozzáadás a paklihoz"
                              >
                                <img
                                  src={imgSrc}
                                  alt={ab.name}
                                  className="w-full h-16 object-cover"
                                />
                                <div className="p-1 text-center">
                                  <div className="font-semibold">{ab.name}</div>
                                  <div className="text-[10px] text-amber-200 uppercase">
                                    {ab.type} • {ab.rarity}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* JOBB LAP – Jelenlegi pakli */}
                    <div className="flex-1 pointer-events-auto">
                      <div className="font-semibold mb-2 text-sm text-yellow-100 drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]">
                        Jelenlegi pakli
                      </div>
                      <div className="h-[360px] overflow-auto pr-1">
                        {uniqueDeckIds.length === 0 ? (
                          <div className="text-sm text-amber-100/80">
                            A pakli üres. Kattints bal oldalt egy képességre, hogy
                            hozzáadd.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {uniqueDeckIds.map((id) => {
                              const ab = ABILITIES_BY_ID[id];
                              if (!ab) return null;
                              const count = deckCounts[id] || 0;
                              const imgSrc = resolveCardImageFromAbility(ab);

                              return (
                                <button
                                  key={id}
                                  className="relative border border-amber-800/70 bg-amber-950/80 rounded-lg overflow-hidden hover:bg-red-900/80 transition flex flex-col text-[11px]"
                                  onClick={() => handleRemoveOneFromDeck(id)}
                                  title="Kattintás: egy példány eltávolítása a pakliból"
                                >
                                  <img
                                    src={imgSrc}
                                    alt={ab.name}
                                    className="w-full h-16 object-cover"
                                  />
                                  <div className="absolute top-1 left-1 bg-black/80 text-[10px] px-1 py-[1px] rounded">
                                    x{count}
                                  </div>
                                  <div className="p-1 text-center">
                                    <div className="font-semibold">
                                      {ab.name}
                                    </div>
                                    <div className="text-[10px] text-amber-200 uppercase">
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
              </div>

              {/* GOMBOK */}
              <div className="mt-3 flex justify-between items-center">
                <div className="text-xs text-gray-200 drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]">
                  Tipp: bal oldalt kattintva hozzáadsz, jobb oldalt kattintva
                  eltávolítasz a pakliból (1 példányt).
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

        {/* HOTSPOTOK A HÁZBAN */}
        <div className="flex justify-between flex-1">
          <div
            style={{
              width: "80%",
              height: "80%",
            }}
          >
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
              style={{
                left: "45%",
                bottom: "30%",
                width: "180px",
                height: "250px",
              }}
              onClick={() => setShowDeckEditor(true)}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
            </div>

            {/* LÁDA / INVENTORY */}
            <div
              className={`absolute cursor-pointer group ${
                anyModalOpen ? "pointer-events-none" : ""
              }`}
              style={{
                left: "25%",
                bottom: "18%",
                width: "400px",
                height: "300px",
              }}
              onClick={() => setShowInventory(true)}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
            </div>

            {/* BEÁLLÍTÁSOK (placeholder) */}
            <div
              className={`absolute cursor-pointer group ${
                anyModalOpen ? "pointer-events-none" : ""
              }`}
              style={{
                right: "10%",
                top: "5%",
                width: "150px",
                height: "150px",
              }}
              onClick={onClose}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition">
                Beall
              </div>
            </div>

            {/* ÁGY → STAT MODAL */}
            <div
              className={`absolute cursor-pointer group ${
                anyModalOpen ? "pointer-events-none" : ""
              }`}
              style={{
                right: "10%",
                bottom: "5%",
                width: "650px",
                height: "350px",
              }}
              onClick={() => setShowStats(true)}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
