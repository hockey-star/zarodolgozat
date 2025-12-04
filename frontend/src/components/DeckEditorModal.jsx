// frontend/src/components/DeckEditorModal.jsx
import React, { useMemo, useState, useEffect } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";
import {
  getClassKeyFromId,
  getAbilitiesForClass,
  ABILITIES_BY_ID,
  buildDefaultDeckForClass,
} from "../data/abilities.js";


// ugyanaz a helper
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

export default function DeckEditorModal({ onClose }) {
  const { player, setPlayer } = usePlayer() || {};

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

  const [tempDeck, setTempDeck] = useState(
    Array.isArray(player?.deck) ? [...player.deck] : []
  );

  useEffect(() => {
    if (Array.isArray(player?.deck)) {
      setTempDeck([...player.deck]);
    }
  }, [player?.deck]);

  const MAX_DECK_SIZE = 30;
  const MIN_DECK_SIZE = 10;

  function handleAddToDeck(abilityId) {
    if (tempDeck.length >= MAX_DECK_SIZE) return;
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

  function handleSave() {
    if (!setPlayer) {
      onClose?.();
      return;
    }

    if (tempDeck.length < MIN_DECK_SIZE) {
      alert(`A paklinak legalább ${MIN_DECK_SIZE} kártyát kell tartalmaznia.`);
      return;
    }

    setPlayer((prev) => ({
      ...prev,
      deck: [...tempDeck],
    }));

    onClose?.();
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

  if (!player) {
    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-6 rounded-xl text-white">
          Nincs betöltött játékos.
          <div className="text-right mt-4">
            <button
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
              onClick={onClose}
            >
              Bezárás
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-10 z-40">
      <div className="bg-gray-900 p-6 rounded-2xl shadow-xl w-5/6 h-5/6 overflow-hidden text-white flex flex-col">
        {/* Fejléc */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Spellbook / Deck – {classKey.toUpperCase()}
          </h2>
          <div className="text-sm text-gray-300">
            Deck mérete: {tempDeck.length} / {MAX_DECK_SIZE}
          </div>
        </div>

        {/* Két oszlop: elérhető skillek + pakli */}
        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* ELÉRHETŐ KÉPESSÉGEK (POOL) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="font-semibold mb-2">Elérhető képességek</div>
            <div className="flex-1 overflow-auto border border-gray-700 rounded-lg p-2 bg-black/40">
              <div className="grid grid-cols-4 gap-3">
                {abilityPool.map((ab) => {
                  const imgSrc = resolveCardImageFromAbility(ab);
                  return (
                    <button
                      key={ab.id}
                      className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/70 hover:bg-gray-700 transition flex flex-col text-xs"
                      onClick={() => handleAddToDeck(ab.id)}
                      title="Kattintás: hozzáadás a paklihoz"
                    >
                      <img
                        src={imgSrc}
                        alt={ab.name}
                        className="w-full h-20 object-cover"
                      />
                      <div className="p-1 text-center">
                        <div className="font-semibold text-[11px]">
                          {ab.name}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase">
                          {ab.type} • {ab.rarity}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* JELENLEGI DECK */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="font-semibold mb-2">Jelenlegi pakli</div>
            <div className="flex-1 overflow-auto border border-gray-700 rounded-lg p-2 bg-black/40">
              {uniqueDeckIds.length === 0 ? (
                <div className="text-sm text-gray-400">
                  A pakli üres. Kattints bal oldalt egy képességre, hogy
                  hozzáadd.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {uniqueDeckIds.map((id) => {
                    const ab = ABILITIES_BY_ID[id];
                    if (!ab) return null;
                    const count = deckCounts[id] || 0;
                    const imgSrc = resolveCardImageFromAbility(ab);

                    return (
                      <button
                        key={id}
                        className="relative border border-gray-700 rounded-lg overflow-hidden bg-gray-800/70 hover:bg-red-700/70 transition flex flex-col text-xs"
                        onClick={() => handleRemoveOneFromDeck(id)}
                        title="Kattintás: egy példány eltávolítása a pakliból"
                      >
                        <img
                          src={imgSrc}
                          alt={ab.name}
                          className="w-full h-20 object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-black/80 text-[10px] px-1 py-[1px] rounded">
                          x{count}
                        </div>
                        <div className="p-1 text-center">
                          <div className="font-semibold text-[11px]">
                            {ab.name}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase">
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

        {/* LÁBLÉC GOMBOK */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-xs text-gray-400">
            Tipp: bal oldalt kattintva hozzáadsz, jobb oldalt kattintva
            eltávolítasz a pakliból (1 példányt).
          </div>
          <div className="space-x-2">
            <button
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
              onClick={onClose}
            >
              Mégse
            </button>
            <button
              className="px-4 py-2 bg-emerald-600 rounded hover:bg-emerald-500"
              onClick={handleSave}
            >
              Mentés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
