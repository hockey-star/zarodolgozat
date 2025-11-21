// frontend/src/components/CombatView.jsx
import React, { useEffect, useState, useMemo } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";
import { getRandomEnemy } from "./enemyData";
import EnemyFrame from "./EnemyFrame";
import HPPopup from "./HPPopup";

import attackImg from "../assets/class-abilities/attack.png";
import shieldImg from "../assets/class-abilities/shield-wall.png";
import healImg from "../assets/class-abilities/hp-pot.png";
import fireballImg from "../assets/class-abilities/fireball.png";

// ----------------- XP GÖRBE -----------------
function xpToNextLevel(level) {
  if (level <= 1) return 30;
  return 30 + (level - 1) * 20;
}

// ----------------- HÁTTÉR VÁLASZTÁS -----------------
function resolveBackground(background, pathType) {
  if (background) return background;

  if (pathType === "mystery") return "/backgrounds/2.jpg";
  if (pathType === "elite") return "/backgrounds/1.jpg";
  return "/backgrounds/3.jpg";
}

// ----------------- CLASS CONFIG -----------------
// class_id-k a DB-ben: 6 = Harcos, 7 = Varázsló, 8 = Íjász
// Sprite-ok: /public/ui/player/player.png, /varazslo.png, /ijasz.png
const CLASS_CONFIG = {
  6: {
    key: "warrior",
    displayName: "Harcos",
    sprite: "/ui/player/player.png",
    deckTemplates: [
      {
        card: {
          name: "Slash",
          type: "attack",
          dmg: [6, 11],
          image: attackImg,
          rarity: "common",
        },
        count: 8,
      },
      {
        card: {
          name: "Mortal Strike",
          type: "attack",
          dmg: [9, 15],
          image: attackImg,
          rarity: "epic",
        },
        count: 3,
      },
      {
        card: {
          name: "Shield Wall",
          type: "defend",
          image: shieldImg,
          rarity: "rare",
        },
        count: 5,
      },
      {
        card: {
          name: "Battle Cry",
          type: "heal",
          heal: 20,
          image: healImg,
          rarity: "epic",
        },
        count: 2,
      },
    ],
  },
  7: {
    key: "mage",
    displayName: "Varázsló",
    sprite: "/ui/player/varazslo.png",
    deckTemplates: [
      {
        card: {
          name: "Fireball",
          type: "attack",
          dmg: [8, 14],
          image: fireballImg,
          rarity: "epic",
        },
        count: 5,
      },
      {
        card: {
          name: "Arcane Missles",
          type: "attack",
          dmg: [5, 11],
          image: fireballImg,
          rarity: "common",
        },
        count: 6,
      },
      {
        card: {
          name: "Mana Shield",
          type: "defend",
          image: shieldImg,
          rarity: "rare",
        },
        count: 4,
      },
      {
        card: {
          name: "Heal Spell",
          type: "heal",
          heal: 22,
          image: healImg,
          rarity: "epic",
        },
        count: 2,
      },
    ],
  },
  8: {
    key: "archer",
    displayName: "Íjász",
    sprite: "/ui/player/ijasz.png",
    deckTemplates: [
      {
        card: {
          name: "Quick Shot",
          type: "attack",
          dmg: [5, 10],
          image: attackImg,
          rarity: "common",
        },
        count: 8,
      },
      {
        card: {
          name: "Aimed Shot",
          type: "attack",
          dmg: [7, 13],
          image: attackImg,
          rarity: "rare",
        },
        count: 4,
      },
      {
        card: {
          name: "Evasion",
          type: "defend",
          image: shieldImg,
          rarity: "rare",
        },
        count: 4,
      },
      {
        card: {
          name: "Healing Herbs",
          type: "heal",
          heal: 18,
          image: healImg,
          rarity: "epic",
        },
        count: 2,
      },
    ],
  },
};

// ha valamiért nincs class_id, vagy más érték, ide esik vissza
const DEFAULT_CLASS_CONFIG = {
  key: "warrior",
  displayName: "Harcos",
  sprite: "/ui/player/player.png",
  deckTemplates: [
    {
      card: {
        name: "Slash",
        type: "attack",
        dmg: [5, 10],
        image: attackImg,
        rarity: "common",
      },
      count: 10,
    },
    {
      card: {
        name: "Shield Wall",
        type: "defend",
        image: shieldImg,
        rarity: "rare",
      },
      count: 5,
    },
    {
      card: {
        name: "Healing Potion",
        type: "heal",
        heal: 25,
        image: healImg,
        rarity: "epic",
      },
      count: 3,
    },
    {
      card: {
        name: "Fireball",
        type: "attack",
        dmg: [8, 14],
        image: fireballImg,
        rarity: "epic",
      },
      count: 2,
    },
  ],
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

  // -------- CLASS CONFIG ÉS DECK A PLAYER KASZTJA ALAPJÁN --------
  const classConfig = useMemo(() => {
    const id = player?.class_id;
    if (!id) return DEFAULT_CLASS_CONFIG;
    return CLASS_CONFIG[id] || DEFAULT_CLASS_CONFIG;
  }, [player?.class_id]);

  const cardTemplates = useMemo(() => classConfig.deckTemplates, [classConfig]);

  // ---------- ENEMY / HARCI ÁLLAPOT ----------
  const [enemy, setEnemy] = useState(null);
  const [enemyHP, setEnemyHP] = useState(0);
  const [turn, setTurn] = useState("player");
  const [battleOver, setBattleOver] = useState(false);
  const [defending, setDefending] = useState(false);

  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [hand, setHand] = useState([]);

  const [hpPopups, setHPPopups] = useState([]);
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [playerHealed, setPlayerHealed] = useState(false);
  const [enemyDamaged, setEnemyDamaged] = useState(false);

  const [log, setLog] = useState([]);
  const [lastRewards, setLastRewards] = useState(null);

  const bg = useMemo(() => resolveBackground(background, pathType), [background, pathType]);

  // ---------- RARITY STYLE ----------
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

  function generateDeck() {
    const d = [];
    cardTemplates.forEach((t) => {
      for (let i = 0; i < t.count; i++) {
        d.push({ ...t.card });
      }
    });
    return d;
  }

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

  function pushLog(msg) {
    setLog((prev) => [...prev, msg]);
  }

  function enemyImage(name) {
    if (!name) return "";
    return `/ui/enemies/${name.toLowerCase().replace(/ /g, "-")}.png`;
  }

  // ---------- HP POPUP + FLASH ----------
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

  // ---------- ENEMY + DECK INIT ----------
  useEffect(() => {
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

    const newDeck = generateDeck();
    const { hand: initialHand, deck: remainingDeck } = drawInitialHand(newDeck);
    setDeck(remainingDeck);
    setDiscardPile([]);
    setHand(initialHand);
  }, [level, boss, pathType, enemies, cardTemplates]);

  // ---------- KÁRTYA KIJÁTSZÁSA ----------
  function playCard(card) {
    if (battleOver || turn !== "player" || !enemy) return;

    setHand((prev) => prev.filter((c) => c !== card));
    setDiscardPile((p) => [...p, card]);

    const playerStrength = player?.strength ?? 0;
    const playerIntellect = player?.intellect ?? 0;
    const attackBonus = Math.floor((playerStrength + playerIntellect) / 3);

    if (card.type === "attack") {
      const baseMin = (card.dmg?.[0] ?? 4) + attackBonus;
      const baseMax = (card.dmg?.[1] ?? 8) + attackBonus;
      const dmg = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;

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
      const healAmount = card.heal || 20;
      setPlayerHP((prev) => {
        const newHP = Math.min(prev + healAmount, maxHPFromPlayer);
        addHPPopup(+healAmount, "player", "24%", "120px");
        pushLog(`✨ ${card.name}: +${healAmount} HP (most ${newHP}/${maxHPFromPlayer})`);
        return newHP;
      });
    }

    setTurn("enemy");
    redrawHand();
  }

  // ---------- GYŐZELEM / VERESÉG CHECK ----------
  useEffect(() => {
    if (!enemy) return;
    if (playerHP <= 0 || enemyHP <= 0) {
      setBattleOver(true);
    }
  }, [playerHP, enemyHP, enemy]);

  // ---------- ENEMY KÖR ----------
  useEffect(() => {
    if (!enemy || battleOver || turn !== "enemy") return;

    const t = setTimeout(() => {
      const [minDmg, maxDmg] = enemy.dmg;
      let dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;

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

  // ---------- JUTALOM ----------
  function rollRewards() {
    if (!enemy || !enemy.rewards) {
      return { xpGain: 0, goldGain: 0 };
    }

    const { goldMin, goldMax, xpMin, xpMax } = enemy.rewards;
    const goldGain = Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin;
    const xpGain = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin;

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
    if (levelsGained > 0) {
      pushLog(
        `⬆ Szintlépés: +${levelsGained} szint, +${addedStatPoints} stat pont (Hub-ban kiosztható).`
      );
    }

    setPlayer((prev) => ({
      ...prev,
      level: newLevel,
      xp: newXP,
      gold: (prev.gold ?? 0) + goldGain,
      hp: playerHP,
      max_hp: prev.max_hp ?? maxHPFromPlayer,
      unspentStatPoints: (prev.unspentStatPoints ?? 0) + addedStatPoints,
    }));

    // TODO: ide mehet majd backend update (pl. /api/update-player)

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

      {/* END BATTLE (Victory / Defeat UI) */}
      {battleOver && (
        <div className="text-center mt-6 z-50 relative">
          <div className="text-4xl mb-4">
            {playerHP <= 0 ? "☠️ Defeat..." : "🏆 Victory!"}
          </div>

          {lastRewards && (
            <div className="mb-2 text-sm text-gray-200">
              Jutalom: +{lastRewards.goldGain} arany, +{lastRewards.xpGain} XP
              {lastRewards.levelsGained > 0 &&
                ` • +${lastRewards.levelsGained} szint, +${lastRewards.addedStatPoints} stat pont (Hub-ban kiosztható)`}
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
