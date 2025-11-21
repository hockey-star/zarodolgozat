// frontend/src/components/CombatView.jsx
import React, { useEffect, useState, useMemo } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";
import { getRandomEnemy } from "./enemyData";
import EnemyFrame from "./EnemyFrame";
import HPPopup from "./HPPopup";
import {
  getClassKeyFromId,
  ABILITIES_BY_ID,
  buildDefaultDeckForClass,
} from "../data/abilities.js";

// XP görbe (marad a mostani)
function xpToNextLevel(level) {
  if (level <= 1) return 30;
  return 30 + (level - 1) * 20;
}

// háttérválasztás
function resolveBackground(background, pathType) {
  if (background) return background;

  if (pathType === "mystery") return "/backgrounds/2.jpg";
  if (pathType === "elite") return "/backgrounds/1.jpg";
  return "/backgrounds/3.jpg";
}

// class sprite-ok: csak sprite + név, deck már abilities.js-ben
const CLASS_CONFIG = {
  6: {
    key: "warrior",
    displayName: "Harcos",
    sprite: "/ui/player/player.png",
  },
  7: {
    key: "mage",
    displayName: "Varázsló",
    sprite: "/ui/player/varazslo.png",
  },
  8: {
    key: "archer",
    displayName: "Íjász",
    sprite: "/ui/player/ijasz.png",
  },
};

const DEFAULT_CLASS_CONFIG = {
  key: "warrior",
  displayName: "Harcos",
  sprite: "/ui/player/player.png",
};

export default function CombatView({
  level = 1,
  boss = false,
  enemies = [],
  background,
  pathType = "fight",
  onEnd,
}) {
  const { player, setPlayer } = usePlayer() || {};

  const initialHPFromPlayer = player?.hp ?? 100;
  const maxHPFromPlayer = player?.max_hp ?? initialHPFromPlayer;

  const [playerHP, setPlayerHP] = useState(initialHPFromPlayer);

  useEffect(() => {
    if (player?.hp != null) {
      setPlayerHP(player.hp);
    }
  }, [player?.hp]);

  // ----- CLASS CONFIG -----
  const classConfig = useMemo(() => {
    if (!player?.class_id) return DEFAULT_CLASS_CONFIG;
    return CLASS_CONFIG[player.class_id] || DEFAULT_CLASS_CONFIG;
  }, [player?.class_id]);

  const classKey = useMemo(
    () => getClassKeyFromId(player?.class_id),
    [player?.class_id]
  );

  // ----- ENEMY / HARCI ÁLLAPOT -----
  const [enemy, setEnemy] = useState(null);
  const [enemyHP, setEnemyHP] = useState(0);
  const [turn, setTurn] = useState("player");
  const [battleOver, setBattleOver] = useState(false);
  const [defending, setDefending] = useState(false);

  // Deck / kéz / discard
  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [hand, setHand] = useState([]);

  // animációk
  const [hpPopups, setHPPopups] = useState([]);
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [playerHealed, setPlayerHealed] = useState(false);
  const [enemyDamaged, setEnemyDamaged] = useState(false);

  // log + jutalom
  const [log, setLog] = useState([]);
  const [lastRewards, setLastRewards] = useState(null);

  const bg = useMemo(
    () => resolveBackground(background, pathType),
    [background, pathType]
  );

  // rarity style ugyanaz
  const rarityStyle = {
    common: {
      border: "border-gray-600",
      glow: "hover:shadow-[0_0_20px_6px_rgba(156,163,175,0.8)]",
    },
    rare: {
      border: "border-blue-500",
      glow: "hover:shadow-[0_0_25px_8px_rgba(59,130,246,0.9)]",
    },
    epic: {
      border: "border-purple-500",
      glow: "hover:shadow-[0_0_30px_10px_rgba(168,85,247,1)]",
    },
    legendary: {
      border: "border-yellow-500",
      glow: "hover:shadow-[0_0_35px_12px_rgba(234,179,8,1)]",
    },
  };

  function pushLog(msg) {
    setLog((prev) => [...prev, msg]);
  }

  function enemyImage(name) {
    if (!name) return "";
    return `/ui/enemies/${name.toLowerCase().replace(/ /g, "-")}.png`;
  }

  // HP popup
  function addHPPopup(value, target, x, y) {
    const id = Date.now() + Math.random();
    setHPPopups((prev) => [...prev, { id, value, target, x, y }]);

    if (value < 0) {
      if (target === "player") {
        setPlayerDamaged(true);
        setTimeout(() => setPlayerDamaged(false), 300);
      } else {
        setEnemyDamaged(true);
        setTimeout(() => setEnemyDamaged(false), 300);
      }
    } else {
      if (target === "player") {
        setPlayerHealed(true);
        setTimeout(() => setPlayerHealed(false), 400);
      }
    }
  }

  // ----- PLAYER DECK INITIALIZÁLÁSA, ha még nincs -----
  useEffect(() => {
    if (!player || !setPlayer) return;

    // ha már létezik deck a playerben, nem csinálunk semmit
    if (Array.isArray(player.deck) && player.deck.length > 0) return;

    // különben generálunk egy alap paklit a kaszt függvényében
    const baseDeck = buildDefaultDeckForClass(classKey);

    setPlayer((prev) => ({
      ...prev,
      deck: baseDeck,
    }));
  }, [player, setPlayer, classKey]);

  /**
   * player.deck (ID lista) -> konkrét kártya példányok combatra
   * Minden ID-ból egy kártya objektum:
   * { name, type, dmg, heal, image, rarity }
   */
  function buildCombatDeckFromPlayer() {
    const deckIds =
      Array.isArray(player?.deck) && player.deck.length > 0
        ? player.deck
        : buildDefaultDeckForClass(classKey);

    const cards = [];
    deckIds.forEach((id) => {
      const ab = ABILITIES_BY_ID[id];
      if (!ab) return;

      cards.push({
        abilityId: ab.id,
        name: ab.name,
        type: ab.type,
        dmg: ab.dmg ?? null,
        heal: ab.heal ?? null,
        image: ab.image,
        rarity: ab.rarity || "common",
      });
    });

    return cards;
  }

  // lap húzás
  function drawInitialHand(deckInit) {
    const handInit = [];
    const deckCopy = [...deckInit];
    while (handInit.length < 4 && deckCopy.length > 0) {
      const idx = Math.floor(Math.random() * deckCopy.length);
      handInit.push(deckCopy.splice(idx, 1)[0]);
    }
    return { hand: handInit, deck: deckCopy };
  }

  function redrawHand() {
    setHand((prevHand) => {
      let newHand = [...prevHand];
      let newDeck = [...deck];
      let newDiscard = [...discardPile];

      while (newHand.length < 4) {
        if (newDeck.length === 0) {
          if (newDiscard.length === 0) break;
          newDeck = [...newDiscard];
          newDiscard = [];
        }
        const idx = Math.floor(Math.random() * newDeck.length);
        newHand.push(newDeck.splice(idx, 1)[0]);
      }

      setDeck(newDeck);
      setDiscardPile(newDiscard);
      return newHand;
    });
  }
// ENEMY + DECK INIT
useEffect(() => {
  if (!player) return;

  const isElite = !boss && pathType === "elite";
  const allowedNames = Array.isArray(enemies) ? enemies : [];

  const enemyData = getRandomEnemy({
    level,
    boss,
    elite: isElite,
    allowedNames,
  });

  const e = {
    name: enemyData.name,
    maxHp: enemyData.maxHp,
    dmg: [enemyData.minDmg, enemyData.maxDmg],
    rewards: {
      goldMin: enemyData.goldRewardMin,
      goldMax: enemyData.goldRewardMax,
      xpMin: enemyData.xpRewardMin,
      xpMax: enemyData.xpRewardMax,
    },
    role: enemyData.role,
  };

  setEnemy(e);
  setEnemyHP(e.maxHp);
  setBattleOver(false);
  setTurn("player");
  setDefending(false);
  setLog([`⚔️ A ${e.name} kihívott téged!`]);
  setHPPopups([]);
  setPlayerDamaged(false);
  setEnemyDamaged(false);
  setPlayerHealed(false);
  setLastRewards(null);

  // player deckből combat deck építése
  const combatDeck = buildCombatDeckFromPlayer();
  const { hand: initialHand, deck: remainingDeck } =
    drawInitialHand(combatDeck);
  setDeck(remainingDeck);
  setDiscardPile([]);
  setHand(initialHand);
}, [level, boss, pathType, enemies, player, classKey]);

  // KÁRTYA KIJÁTSZÁSA – CLASS ALAPÚ SKÁLÁZÁS
  function playCard(card) {
    if (battleOver || turn !== "player" || !enemy) return;

    setHand((prev) => prev.filter((c) => c !== card));
    setDiscardPile((p) => [...p, card]);

    const playerStrength = player?.strength ?? 0;
    const playerIntellect = player?.intellect ?? 0;
    const playerDefense = player?.defense ?? 0;

    // Amíg nincs külön AGI, az íjász használja a STR-t, mint "agi"
    const playerAgi = playerStrength;

    if (card.type === "attack") {
      let baseMin = card.dmg?.[0] ?? 4;
      let baseMax = card.dmg?.[1] ?? 8;

      // Kaszt alapú dmg bonus
      if (classKey === "warrior") {
        const bonus = Math.floor(playerStrength * 0.2);
        baseMin += bonus;
        baseMax += bonus;
      } else if (classKey === "mage") {
        const bonus = Math.floor(playerIntellect * 0.3);
        baseMin += bonus;
        baseMax += bonus;
      } else if (classKey === "archer") {
        const bonus = Math.floor(playerAgi * 0.3);
        baseMin += bonus;
        baseMax += bonus;
      }

      if (baseMin < 1) baseMin = 1;
      if (baseMax < baseMin) baseMax = baseMin;

      let dmg =
        Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;

      // Íjász: crit esély (C verzió)
      if (classKey === "archer") {
        const critChance = Math.min(50, playerAgi * 1.5); // max 50%
        if (Math.random() * 100 < critChance) {
          dmg = Math.floor(dmg * 2.0);
          pushLog("💥 Kritikus találat!");
        }
      }

      setEnemyHP((prev) => {
        const newHP = Math.max(0, prev - dmg);
        addHPPopup(-dmg, "enemy", "74%", "120px");
        pushLog(`${card.name} → ${enemy.name} kap ${dmg} sebzést.`);
        return newHP;
      });
    }

    if (card.type === "defend") {
      setDefending(true);
      pushLog("🛡️ Védekezés aktiválva – a következő ütés felezve.");
    }

    if (card.type === "heal") {
      let healAmount = card.heal || 20;

      // Heal scaling
      if (classKey === "mage") {
        healAmount += Math.floor(playerIntellect * 0.25);
      } else if (classKey === "warrior") {
        healAmount += Math.floor(playerStrength * 0.3);
      } else if (classKey === "archer") {
        healAmount += Math.floor(playerAgi * 0.5);
      }

      setPlayerHP((prev) => {
        const newHP = Math.min(prev + healAmount, maxHPFromPlayer);
        addHPPopup(+healAmount, "player", "24%", "120px");
        pushLog(
          `✨ ${card.name}: +${healAmount} HP (most ${newHP}/${maxHPFromPlayer})`
        );
        return newHP;
      });
    }

    setTurn("enemy");
    redrawHand();
  }

  // GYŐZELEM / VERESÉG CHECK
  useEffect(() => {
    if (!enemy) return;
    if (playerHP <= 0 || enemyHP <= 0) {
      setBattleOver(true);
    }
  }, [playerHP, enemyHP, enemy]);

  // ENEMY KÖR
  useEffect(() => {
    if (!enemy || battleOver || turn !== "enemy") return;

    const t = setTimeout(() => {
      const [minDmg, maxDmg] = enemy.dmg;
      let dmg =
        Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;

      if (defending) {
        dmg = Math.floor(dmg / 2);
      }

      const playerDefense = player?.defense ?? 0;
      const final = Math.max(0, dmg - Math.floor(playerDefense / 2));

      setPlayerHP((prev) => {
        const newHP = Math.max(0, prev - final);
        addHPPopup(-final, "player", "24%", "120px");
        return newHP;
      });

      pushLog(`💥 ${enemy.name} támad (${final} sebzés).`);

      setDefending(false);
      setTurn("player");
    }, boss ? 1400 : 900);

    return () => clearTimeout(t);
  }, [turn, enemy, defending, battleOver, boss, player]);

  // REWARD
  function rollRewards() {
    if (!enemy || !enemy.rewards) {
      return { xpGain: 0, goldGain: 0 };
    }

    const { goldMin, goldMax, xpMin, xpMax } = enemy.rewards;
    const goldGain =
      Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin;
    const xpGain =
      Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin;

    return { xpGain, goldGain };
  }

 function handleContinue() {
  const victory = enemyHP <= 0 && playerHP > 0;

  if (!victory) {
    if (onEnd) onEnd(playerHP, false);
    return;
  }

  if (!player || !setPlayer) {
    if (onEnd) onEnd(playerHP, true);
    return;
  }

  const { xpGain, goldGain } = rollRewards();

  const oldLevel = player.level ?? 1;
  let newXP = (player.xp ?? 0) + xpGain;
  let newLevel = oldLevel;
  let levelsGained = 0;

  while (newXP >= xpToNextLevel(newLevel)) {
    newXP -= xpToNextLevel(newLevel);
    newLevel += 1;
    levelsGained += 1;
  }

  const addedStatPoints = levelsGained * 3;

  setLastRewards({
    xpGain,
    goldGain,
    levelsGained,
    addedStatPoints,
  });

  pushLog(`🏆 Győzelem! +${goldGain} arany, +${xpGain} XP.`);

  setPlayer((prev) => ({
    ...prev,
    level: newLevel,
    xp: newXP,
    gold: (prev.gold ?? 0) + goldGain,
    hp: playerHP,
    max_hp: prev.max_hp,
    unspentStatPoints:
      (prev.unspentStatPoints ?? 0) + addedStatPoints,
  }));

 

  if (onEnd) onEnd(playerHP, true);
}

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Nincs betöltött játékos. Jelentkezz be újra.
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen text-white">
      {/* BACKGROUND */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <img
          src={bg}
          alt="bg"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* PLAYER + ENEMY FRAMEEK */}
      <div className="pt-12 flex justify-around w-full max-w-6xl mx-auto z-10 relative">
        {/* PLAYER */}
        <EnemyFrame
          name={player.username || "Player"}
          hp={playerHP}
          maxHP={maxHPFromPlayer}
          image={classConfig.sprite}
          damaged={playerDamaged}
          healed={playerHealed}
        />

        {/* ENEMY */}
        <EnemyFrame
          name={enemy?.name}
          hp={enemyHP}
          maxHP={enemy?.maxHp}
          image={enemyImage(enemy?.name)}
          damaged={enemyDamaged}
        />

        {/* POPUP-ok */}
        {hpPopups.map((p) => (
          <HPPopup
            key={p.id}
            value={p.value}
            x={p.x}
            y={p.y}
            onDone={() =>
              setHPPopups((prev) => prev.filter((pp) => pp.id !== p.id))
            }
          />
        ))}
      </div>

      {/* COMBAT LOG */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[1%] w-3/4 max-w-2xl bg-black/50 rounded p-4 h-48 overflow-y-auto font-mono text-sm z-10">
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      {/* KÁRTYÁK */}
      {!battleOver && turn === "player" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-50">
          {hand.map((card, i) => {
            const rs = rarityStyle[card.rarity] ?? rarityStyle.common;
            return (
              <button
                key={i}
                onClick={() => playCard(card)}
                className={`relative w-36 h-52 rounded-xl overflow-hidden
                border-4 ${rs.border}
                transform transition-all duration-200 hover:scale-110
                ${rs.glow}`}
              >
                <img
                  src={card.image}
                  alt={card.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-0 w-full bg-black/70 text-center p-1 text-sm">
                  <div className="font-bold">{card.name}</div>
                  {card.type === "attack" && (
                    <div>
                      Damage: {card.dmg?.[0] ?? "?"}–{card.dmg?.[1] ?? "?"}
                    </div>
                  )}
                  {card.type === "defend" && <div>Defense</div>}
                  {card.type === "heal" && <div>Heal: {card.heal}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* END BATTLE */}
      {battleOver && (
        <div className="text-center mt-6 z-50 relative">
          <div className="text-4xl mb-4">
            {playerHP <= 0 ? "☠️ Defeat..." : "🏆 Victory!"}
          </div>

          {lastRewards && (
            <div className="mb-2 text-sm text-gray-200">
              Jutalom: +{lastRewards.goldGain} arany, +
              {lastRewards.xpGain} XP
              {lastRewards.levelsGained > 0 &&
                ` • +${lastRewards.levelsGained} szint, +${lastRewards.addedStatPoints} stat pont (ágyban kiosztható)`}
            </div>
          )}

          <button
            onClick={handleContinue}
            className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-lg"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
