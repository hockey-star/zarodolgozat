// frontend/src/components/CombatView.jsx

import React, { useEffect, useState, useMemo, useRef } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";
import { getRandomEnemy } from "./enemyData";
import EnemyFrame from "./EnemyFrame";
import HPPopup from "./HPPopup";

import AbilityEffectLayer from "./AbilityEffectLayer";
import healFx from "../assets/effects/heal_generic.webm";
import arcaneMissilesFx from "../assets/effects/mage_arcane_missiles.webm";
import fireballFx from "../assets/effects/mage_fireball.webm";
import stunFx from "../assets/effects/stun_generic.webm";
import arcaneSurgeFx from "../assets/effects/mage_arcane_surge.webm";
import drainLifeFx from "../assets/effects/mage_drain_life.webm";
import frostNovaFx from "../assets/effects/mage_frost_nova.webm";
import lightningBoltFx from "../assets/effects/mage_lightning_bolt.webm";
import chainLightningFx from "../assets/effects/mage_chain_lightning.webm";
import icelance from "../assets/effects/mage_icelance.webm";
import manaShieldFx from "../assets/effects/mage_mana_shield.webm";
import {
  getClassKeyFromId,
  ABILITIES_BY_ID,
  buildDefaultDeckForClass,
} from "../data/abilities.js";

const BASE_UI_SCALE = 0.8; // itt tudod globálisan összébb venni az UI-t
const MAGE_MANA_MAX = 10; // ⚠️ nálad maradt, de a Context-es MAGE_MANA_MAX-ot használjuk

/**
 * ✅ MANA UI POZÍCIÓ / MÉRET
 * Itt állítgatod, hogy hova kerüljön a mana bar.
 */
const MANA_UI = {
  wrapperStyle: {
    top: "610px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "420px",
  },
};

/**
 * ✅ ARCANE READY - 3 választható képesség
 * Később ide rakod a képeket: img: "/cards/..." vagy bármi.
 */
const ARCANE_CHOICES = [
  {
    id: "arcane_30pct",
    name: "Arcane Burst",
    desc: "30% DMG",
    kind: "damage_percent",
    percent: 0.3,
    img: "", // később
  },
  {
    id: "arcane_full_heal",
    name: "Arcane Restore",
    desc: "100% HEAL",
    kind: "full_heal",
    img: "", // később
  },
  {
    id: "arcane_big_dmg",
    name: "Arcane Cataclysm",
    desc: "VERY STRONG DMG",
    kind: "big_damage",
    img: "", // később
  },
];

// XP görbe
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

// ====== ✅ WARRIOR BERSERKER BALANCE HELPERS ======

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

// 0..1 rage (0 = full HP, 1 = 0 HP)
function getWarriorRage01(currentHP, maxHP) {
  if (!maxHP || maxHP <= 0) return 0;
  const hpRatio = clamp01(currentHP / maxHP);
  return 1 - hpRatio;
}

/**
 * ✅ BALANCE PARAMS
 * Ezeket nyugodtan állítgasd!
 */
const WARRIOR_RAGE = {
  // Damage OUT: full HP = 1.0x, 0 HP-hoz közel = 1.0 + OUT_MAX_BONUS
  OUT_MAX_BONUS: 0.35, // +35% max sebzés (kezdésnek 1v1-re jó)

  // Damage IN: full HP = 1.0x, 0 HP-hoz közel = 1.0 + IN_MAX_BONUS
  IN_MAX_BONUS: 0.25, // +25% több sebzés amit kapsz (risk/reward)

  // UI vörösödés: mikortól legyen érzékelhető (0..1 rage)
  // pl. 0.0 = mindig indul, 0.2 = csak ~80% HP alatt kezd látszani
  VIS_START_RAGE: 0.05,

  // UI vörösödés max erősség (shadow / ring)
  VIS_MAX_OPACITY: 0.75, // 0..1
  VIS_MAX_BLUR: 26, // px
  VIS_RING_PX: 4, // px
};

function warriorDamageOutMult(rage01) {
  return 1 + rage01 * WARRIOR_RAGE.OUT_MAX_BONUS;
}

function warriorDamageInMult(rage01) {
  return 1 + rage01 * WARRIOR_RAGE.IN_MAX_BONUS;
}

// card image helper – /cards/... PATH
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

// class sprite-ok
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

// 🔥 CLASS QUEST BOSSOK NEVE
const CLASS_BOSS_MAP = {
  warrior: "Mountain King",
  mage: "Arcane Abomination",
  archer: "Forest Spirit Beast",
};

export default function CombatView({
  level = 1,
  boss = false,
  enemies = [],
  background,
  pathType = "fight",
  onEnd,
}) {
  const {
    player,
    setPlayer,
    mageMana,
    setMageMana,
    gainMageMana,
    spendAllMageMana,
    MAGE_MANA_MAX: CTX_MAGE_MANA_MAX,
  } = usePlayer() || {};

  // 1920x1080-as UI skála
  const [uiScale, setUiScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleW = vw / 1650;
      const scaleH = vh / 1050;
      const s = Math.min(scaleW, scaleH);
      setUiScale(s);
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

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
  const [defending, setDefending] = useState(false); // lehet szám is (körök)

  // ✅ Arcane választó overlay
  const [arcanePickerOpen, setArcanePickerOpen] = useState(false);

  const prevTurnRef = useRef(null);
  // Deck / kéz / discard
  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [hand, setHand] = useState([]);

  // animációk
  const [hpPopups, setHPPopups] = useState([]); // {id, value, target, isCrit}
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [playerHealed, setPlayerHealed] = useState(false);
  const [enemyDamaged, setEnemyDamaged] = useState(false);

  // effectek
  const [abilityEffects, setAbilityEffects] = useState([]);
  const logEndRef = useRef(null);

  function spawnAbilityEffect({ src, target = "center", width, height }) {
    const id = Date.now() + Math.random();
    setAbilityEffects((prev) => [...prev, { id, src, target, width, height }]);
  }

  // átmeneti buffok / debuffok
  const [playerDamageBuff, setPlayerDamageBuff] = useState(null);
  const [enemyPoison, setEnemyPoison] = useState(null);
  const [enemyBurn, setEnemyBurn] = useState(null);
  const [enemyStun, setEnemyStun] = useState(0);
  const [enemyVulnerability, setEnemyVulnerability] = useState(null);
  const [enemyBleed, setEnemyBleed] = useState(null);

  // log + jutalom
  const [log, setLog] = useState([]);
  const [lastRewards, setLastRewards] = useState(null);

  const bg = useMemo(
    () => resolveBackground(background, pathType),
    [background, pathType]
  );

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
    setLog((prev) => {
      const last = prev[prev.length - 1];
      if (last === msg) return prev;
      return [...prev, msg];
    });
  }

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [log]);

  function enemyImage(name) {
    if (!name) return "";
    return `/ui/enemies/${name.toLowerCase().replace(/ /g, "-")}.png`;
  }

  // 🔹 HP popup helper – target + crit flag
  function addHPPopup(value, target, isCrit = false) {
    const id = Date.now() + Math.random();
    setHPPopups((prev) => [...prev, { id, value, target, isCrit }]);

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

  // PLAYER DECK INIT, ha nincs
  useEffect(() => {
    if (!player || !setPlayer) return;

    if (Array.isArray(player.deck) && player.deck.length > 0) return;

    const baseDeck = buildDefaultDeckForClass(classKey);

    setPlayer((prev) => ({
      ...prev,
      deck: baseDeck,
    }));
  }, [player, setPlayer, classKey]);

  // player.deck -> combat deck
  function buildCombatDeckFromPlayer() {
    const deckIds =
      Array.isArray(player?.deck) && player.deck.length > 0
        ? player.deck
        : buildDefaultDeckForClass(classKey);

    const cards = [];
    deckIds.forEach((id) => {
      const ab = ABILITIES_BY_ID[id];
      if (!ab) return;

      const img = resolveCardImageFromAbility(ab);

      cards.push({
        abilityId: ab.id,
        name: ab.name,
        type: ab.type,
        dmg: ab.dmg ?? null,
        heal: ab.heal ?? null,
        image: img,
        rarity: ab.rarity || "common",
        hits: ab.hits || 1,
        poison: ab.poison || null,
        damageBuff: ab.damageBuff || null,
        burn: ab.burn || null,
        drain: ab.drain || false,
        stunTurns: ab.stunTurns || 0,
        defenseTurns: ab.defenseTurns || 0,
        vulnerabilityDebuff: ab.vulnerabilityDebuff || null,
        bleed: ab.bleed || null,
        executeBelowPercent: ab.executeBelowPercent || null,
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

  // ENEMY + DECK INIT (+ CLASS QUEST BOSS LOGIKA)
  useEffect(() => {
    if (!player) return;

    async function initBattle() {
      try {
        let isElite = !boss && pathType === "elite";
        let allowedNames = Array.isArray(enemies) ? enemies : [];

        // CLASS QUEST BOSS
        if (boss && player.id) {
          try {
            const res = await fetch(
              `http://localhost:3000/api/quests/${player.id}`
            );
            const data = await res.json();

            const activeClassQuest = Array.isArray(data)
              ? data.find(
                  (q) =>
                    q.status === "in_progress" &&
                    q.class_required !== null &&
                    q.class_required !== ""
                )
              : null;

            if (activeClassQuest) {
              const ck = classKey;
              const bossName = CLASS_BOSS_MAP[ck];
              if (bossName) {
                allowedNames = [bossName];
                pushLog(
                  `🔥 Class quest boss közeleg: ${bossName} (kaszt: ${ck})`
                );
              }
            }
          } catch (err) {
            console.error("Class quest boss check error:", err);
          }
        }

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
        setArcanePickerOpen(false);
        setLog([`⚔️ A ${e.name} kihívott téged!`]);
        setHPPopups([]);
        setPlayerDamaged(false);
        setEnemyDamaged(false);
        setPlayerHealed(false);
        setLastRewards(null);
        setPlayerDamageBuff(null);
        setEnemyPoison(null);
        setEnemyBurn(null);
        setEnemyStun(0);
        setEnemyVulnerability(null);
        setEnemyBleed(null);

        const combatDeck = buildCombatDeckFromPlayer();
        const { hand: initialHand, deck: remainingDeck } =
          drawInitialHand(combatDeck);
        setDeck(remainingDeck);
        setDiscardPile([]);
        setHand(initialHand);
      } catch (err) {
        console.error("Enemy init error:", err);
      }
    }

    initBattle();

    // ✅ NEM reseteljük a manát enemy előtt, maradjon meg
    // setMageMana(0);

    prevTurnRef.current = null;
  }, [level, boss, pathType, enemies, player, classKey]);

  /**
   * ✅ ARCANE FINISHER HASZNÁLATA
   */
  function castArcane(choice) {
    if (battleOver || turn !== "player" || !enemy) return;
    if (classKey !== "mage") return;
    if (mageMana < CTX_MAGE_MANA_MAX) return;

    setArcanePickerOpen(false);

    // költsd el a teljes manát
    spendAllMageMana();

    const playerIntellect = player?.intellect ?? 0;

    if (choice.kind === "damage_percent") {
      const dmg = Math.max(
        1,
        Math.floor((enemy?.maxHp ?? 1) * choice.percent)
      );

      spawnAbilityEffect({
        src: arcaneSurgeFx,
        target: "enemy_aoe",
        width: "1200px",
        height: "1200px",
      });

      setEnemyHP((prev) => {
        const newHP = Math.max(0, prev - dmg);
        addHPPopup(-dmg, "enemy", false);
        pushLog(`🔮 ${choice.name}: ${dmg} sebzés (30%).`);
        return newHP;
      });
    }

    if (choice.kind === "full_heal") {
      spawnAbilityEffect({
        src: healFx,
        target: "player",
        width: "1000px",
        height: "1000px",
      });

      setPlayerHP((prev) => {
        const amount = Math.max(0, maxHPFromPlayer - prev);
        const newHP = maxHPFromPlayer;
        if (amount > 0) addHPPopup(+amount, "player", false);
        pushLog(`✨ ${choice.name}: teljes gyógyítás.`);
        return newHP;
      });
    }

    if (choice.kind === "big_damage") {
      // nagyon erős: enemy maxHP 60% + INT scaling
      const base = Math.max(1, Math.floor((enemy?.maxHp ?? 1) * 0.6));
      const extra = Math.floor(playerIntellect * 1.25);
      const dmg = base + extra;

      spawnAbilityEffect({
        src: arcaneSurgeFx,
        target: "enemy_aoe",
        width: "1400px",
        height: "1400px",
      });

      setEnemyHP((prev) => {
        const newHP = Math.max(0, prev - dmg);
        addHPPopup(-dmg, "enemy", true);
        pushLog(`☄️ ${choice.name}: ${dmg} brutális sebzés!`);
        return newHP;
      });
    }

    // ✅ arcane is buildel manát (1)
    gainMageMana(1);

    // arcane = akció, kör vége
    setTurn("enemy");
    redrawHand();
  }

  // KÁRTYA KIJÁTSZÁSA
  function playCard(card) {
    if (battleOver || turn !== "player" || !enemy) return;

    setHand((prev) => prev.filter((c) => c !== card));
    setDiscardPile((p) => [...p, card]);

    const playerStrength = player?.strength ?? 0;
    const playerIntellect = player?.intellect ?? 0;
    const playerLevel = player?.level ?? 1;
    const playerAgi = playerStrength;

    if (card.type === "attack") {
      let baseMin = card.dmg?.[0] ?? 4;
      let baseMax = card.dmg?.[1] ?? 8;

      // effektek...
      if (card.abilityId === "mage_arcane_missiles") {
        spawnAbilityEffect({
          src: arcaneMissilesFx,
          target: "enemy",
          width: "1000px",
          height: "1000px",
        });
      }
      if (card.abilityId === "mage_ice_lance") {
        spawnAbilityEffect({
          src: icelance,
          target: "enemy",
          width: "1000px",
          height: "1050px",
        });
      }
      if (card.abilityId === "mage_fireball") {
        spawnAbilityEffect({
          src: fireballFx,
          target: "enemy",
          width: "1000px",
          height: "1000px",
        });
      }
      if (card.abilityId === "mage_arcane_surge") {
        spawnAbilityEffect({
          src: arcaneSurgeFx,
          target: "enemy_aoe",
          width: "1200px",
          height: "1200px",
        });
      }
      if (card.abilityId === "mage_frost_nova") {
        spawnAbilityEffect({
          src: frostNovaFx,
          target: "enemy_aoe",
          width: "1000px",
          height: "1000px",
        });
      }
      if (card.abilityId === "mage_lightning_bolt") {
        spawnAbilityEffect({
          src: lightningBoltFx,
          target: "enemy",
          width: "1050px",
          height: "1050px",
        });
      }
      if (card.abilityId === "mage_chain_lightning") {
        spawnAbilityEffect({
          src: chainLightningFx,
          target: "enemy",
          width: "1000px",
          height: "1000px",
        });
      }
      if (card.abilityId === "mage_drain_life") {
        spawnAbilityEffect({
          src: drainLifeFx,
          target: "enemy",
          width: "1600px",
          height: "700px",
        });
      }

      // 🧮 STAT + SZINT alapú sebzés bónusz
      if (classKey === "warrior") {
        const bonus =
          Math.floor(playerStrength * 0.35) + Math.floor(playerLevel * 0.3);
        baseMin += bonus;
        baseMax += bonus;
      } else if (classKey === "mage") {
        const bonus =
          Math.floor(playerIntellect * 0.25) + Math.floor(playerLevel * 0.25);
        baseMin += bonus;
        baseMax += bonus;
      } else if (classKey === "archer") {
        const bonus =
          Math.floor(playerAgi * 0.3) + Math.floor(playerLevel * 0.35);
        baseMin += bonus;
        baseMax += bonus;
      }

      if (baseMin < 1) baseMin = 1;
      if (baseMax < baseMin) baseMax = baseMin;

      // 🎯 CRIT ESÉLY + SZORZÓ
      let critChance = 0;
      let critMultiplier = 1;

      if (classKey === "warrior") {
        critChance = Math.min(
          60,
          15 + playerStrength * 0.8 + playerLevel * 1.0
        );
        critMultiplier = 2.25;
      } else if (classKey === "mage") {
        critChance = Math.min(
          65,
          12 + playerIntellect * 0.7 + playerLevel * 0.8
        );
        critMultiplier = 1.5;
      } else if (classKey === "archer") {
        critChance = Math.min(
          70,
          18 + playerAgi * 0.9 + playerLevel * 1.2
        );
        critMultiplier = 2.5;
      }

      const hits = card.hits || 1;
      const dmgRolls = [];

      for (let i = 0; i < hits; i++) {
        let roll =
          Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;

        let isCrit = false;
        if (Math.random() * 100 < critChance) {
          isCrit = true;
          roll = Math.floor(roll * critMultiplier);
        }

        dmgRolls.push({ amount: roll, isCrit });
      }

      let finalRolls = dmgRolls.map((r) => ({ ...r }));

      // ✅ WARRIOR BERSERKER (BALANCED): kevesebb HP = több sebzés
      if (classKey === "warrior") {
        const rage01 = getWarriorRage01(playerHP, maxHPFromPlayer);
        const outMult = warriorDamageOutMult(rage01);

        if (outMult > 1.001) {
          finalRolls = finalRolls.map((r) => ({
            ...r,
            amount: Math.floor(r.amount * outMult),
          }));
        }
      }

      // 🔮 execute / buffok / vulnerability mind az amount-ra megy
      if (card.executeBelowPercent && enemy?.maxHp) {
        const hpPercent = Math.floor((enemyHP / enemy.maxHp) * 100);
        if (hpPercent <= card.executeBelowPercent) {
          finalRolls = finalRolls.map((r) => ({ ...r, amount: r.amount * 2 }));
          pushLog("☠️ Crushing Blow – kivégzés!");
        }
      }

      if (playerDamageBuff && playerDamageBuff.multiplier) {
        finalRolls = finalRolls.map((r) => ({
          ...r,
          amount: Math.floor(r.amount * playerDamageBuff.multiplier),
        }));
        pushLog("🩸 A Rallying Shout erősíti a támadásod!");

        const remaining = (playerDamageBuff.remainingAttacks ?? 1) - 1;
        if (remaining <= 0) {
          setPlayerDamageBuff(null);
        } else {
          setPlayerDamageBuff((prev) =>
            prev ? { ...prev, remainingAttacks: remaining } : null
          );
        }
      }

      if (enemyVulnerability && enemyVulnerability.multiplier) {
        finalRolls = finalRolls.map((r) => ({
          ...r,
          amount: Math.floor(r.amount * enemyVulnerability.multiplier),
        }));
        pushLog(
          `🔮 A korábbi Arcane Surge miatt ${enemy.name} több sebzést szenved el!`
        );
      }

      // 💥 SEBZÉS ALKALMAZÁSA + CRIT POPUP
      finalRolls.forEach((roll, index) => {
        setTimeout(() => {
          const dmg = roll.amount;

          setEnemyHP((prev) => {
            const newHP = Math.max(0, prev - dmg);
            addHPPopup(-dmg, "enemy", roll.isCrit);

            // csak warrior logolja ki a rage %-ot, de ne spamolja minden hitnél külön:
            if (classKey === "warrior" && index === 0) {
              const rage01 = getWarriorRage01(playerHP, maxHPFromPlayer);
              const outMult = warriorDamageOutMult(rage01);
              if (outMult > 1.01) {
                pushLog(
                  `🩸 Berserker Rage: +${Math.round(
                    (outMult - 1) * 100
                  )}% sebzés (${playerHP}/${maxHPFromPlayer} HP).`
                );
              }
            }

            pushLog(
              `${card.name} → ${enemy.name} kap ${dmg} sebzést${
                roll.isCrit ? " (KRITIKUS!)" : ""
              }.`
            );
            return newHP;
          });

          if (card.drain && card.heal) {
            setPlayerHP((prev) => {
              const newHP = Math.min(prev + card.heal, maxHPFromPlayer);
              addHPPopup(+card.heal, "player");
              pushLog(`🧛 Drain Life gyógyít: +${card.heal} HP.`);
              return newHP;
            });
          }
        }, index * 220);
      });

      if (
        card.poison &&
        card.poison.damagePerTurn > 0 &&
        card.poison.turns > 0
      ) {
        const dpt = card.poison.damagePerTurn;
        const turns = card.poison.turns;
        setEnemyPoison({ damagePerTurn: dpt, remainingTurns: turns });
        pushLog(
          `☠️ ${enemy.name} megmérgezve: ${dpt} sebzés ${turns} körön át.`
        );
      }

      if (card.bleed) {
        setEnemyBleed((prev) => {
          if (!prev) {
            return {
              percent: card.bleed.basePercent,
              remainingTurns: card.bleed.turns,
            };
          }

          const nextPercent = Math.min(
            card.bleed.maxPercent,
            prev.percent + card.bleed.bonusPerStack
          );

          return { percent: nextPercent, remainingTurns: card.bleed.turns };
        });

        pushLog(
          `🩸 Vérzés! ${enemy.name} minden körben sebződik a Slash miatt.`
        );
      }

      if (card.burn && card.burn.percent && card.burn.turns) {
        const totalHit = finalRolls.reduce((a, b) => a + b.amount, 0);
        const burnPerTurn = Math.max(
          1,
          Math.floor((totalHit * card.burn.percent) / 100)
        );

        setEnemyBurn({
          damagePerTurn: burnPerTurn,
          remainingTurns: card.burn.turns,
        });

        pushLog(
          `🔥 ${enemy.name} égni kezd: ${burnPerTurn} sebzés ${card.burn.turns} körön át.`
        );
      }

      if (card.stunTurns && card.stunTurns > 0) {
        spawnAbilityEffect({
          src: stunFx,
          target: "enemy_stun",
          width: "500px",
          height: "500px",
        });

        setEnemyStun((prev) => prev + card.stunTurns);
        pushLog(
          `❄️ ${enemy.name} elkábult, kihagyja a következő körét!`
        );
      }

      if (card.vulnerabilityDebuff && card.vulnerabilityDebuff.multiplier) {
        const mult = card.vulnerabilityDebuff.multiplier ?? 1.15;
        const turns = card.vulnerabilityDebuff.turns ?? 3;
        setEnemyVulnerability({ multiplier: mult, remainingTurns: turns });
        pushLog(
          `🔮 ${enemy.name} sebezhetővé válik: +${Math.round(
            (mult - 1) * 100
          )}% sebzést kap ${turns} körig!`
        );
      }
    }

    if (card.type === "defend") {
      if (card.abilityId === "mage_mana_shield") {
        spawnAbilityEffect({
          src: manaShieldFx,
          target: "player_shield",
          width: "1150px",
          height: "1000px",
        });
      }

      if (card.defenseTurns && card.defenseTurns > 1) {
        setDefending(card.defenseTurns);
        pushLog(
          `🛡️ ${card.name}: védekezés aktiválva ${card.defenseTurns} körre!`
        );
      } else {
        setDefending(1);
        pushLog("🛡️ Védekezés aktiválva – a következő ütés felezve.");
      }

      if (card.stunTurns && card.stunTurns > 0) {
        spawnAbilityEffect({
          src: stunFx,
          target: "enemy_stun",
          width: "1000px",
          height: "1500px",
        });

        setEnemyStun((prev) => prev + card.stunTurns);
        pushLog(`⚔️ Parry! ${enemy.name} elkábul, kihagyja a körét!`);
      }
    }

    if (card.type === "heal") {
      spawnAbilityEffect({
        src: healFx,
        target: "player",
        width: "1000px",
        height: "1000px",
      });

      const playerStrength = player?.strength ?? 0;
      const playerIntellect = player?.intellect ?? 0;
      const playerAgi = playerStrength;

      let healAmount = card.heal || 20;

      if (classKey === "mage") {
        healAmount += Math.floor(playerIntellect * 0.25);
      } else if (classKey === "warrior") {
        healAmount += Math.floor(playerStrength * 0.3);
      } else if (classKey === "archer") {
        healAmount += Math.floor(playerAgi * 0.5);
      }

      setPlayerHP((prev) => {
        const newHP = Math.min(prev + healAmount, maxHPFromPlayer);
        addHPPopup(+healAmount, "player");
        pushLog(
          `✨ ${card.name}: +${healAmount} HP (most ${newHP}/${maxHPFromPlayer})`
        );
        return newHP;
      });

      if (card.damageBuff && card.damageBuff.multiplier) {
        const mult = card.damageBuff.multiplier ?? 1.5;
        const turns = card.damageBuff.turns ?? 1;
        setPlayerDamageBuff({ multiplier: mult, remainingAttacks: turns });
        pushLog(
          `📣 ${card.name}: a következő ${turns} támadásod +${Math.round(
            (mult - 1) * 100
          )}% sebzést okoz!`
        );
      }
    }

    // ✅ MANA BUILD UP MINDEN KÁRTYÁNÁL / KÉPESSÉGNÉL
    if (classKey === "mage") {
      setMageMana((prev) => Math.min(CTX_MAGE_MANA_MAX, prev + 1));
    }

    setTurn("enemy");
    redrawHand();
  }

  // GYŐZELEM / VERESÉG CHECK
  useEffect(() => {
    if (!enemy) return;
    if (playerHP <= 0 || enemyHP <= 0) {
      setBattleOver(true);
      setArcanePickerOpen(false);
    }
  }, [playerHP, enemyHP, enemy]);

  // 🏆 GYŐZELEM UTÁN AZONNAL SZÁMOLJUK A JUTALMAT (csak kijelzéshez)
  useEffect(() => {
    if (!enemy) return;
    if (!player) return;

    const victory = enemyHP <= 0 && playerHP > 0;
    if (!victory) return;
    if (lastRewards) return;

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
      newXP,
      newLevel,
    });

    pushLog(`🏆 Győzelem! +${goldGain} arany, +${xpGain} XP.`);
  }, [enemy, enemyHP, playerHP, player, lastRewards]);

  // ENEMY KÖR
  useEffect(() => {
    if (!enemy || battleOver || turn !== "enemy") return;

    const t = setTimeout(() => {
      if (enemyBurn && enemyHP > 0) {
        const burnDmg = enemyBurn.damagePerTurn ?? 0;
        const newHP = Math.max(0, enemyHP - burnDmg);

        if (burnDmg > 0) {
          setEnemyHP(newHP);
          addHPPopup(-burnDmg, "enemy");
          pushLog(
            `🔥 Égés sebzés: ${burnDmg} (${enemy.name} – ${newHP} HP).`
          );
        }

        const remaining = (enemyBurn.remainingTurns ?? 1) - 1;
        if (remaining <= 0 || newHP <= 0) {
          setEnemyBurn(null);
        } else {
          setEnemyBurn((prev) =>
            prev ? { ...prev, remainingTurns: remaining } : null
          );
        }

        if (newHP <= 0) {
          setDefending(false);
          setTurn("player");
          return;
        }
      }

      if (enemyPoison && enemyHP > 0) {
        const poisonDmg = enemyPoison.damagePerTurn ?? 0;
        const newHP = Math.max(0, enemyHP - poisonDmg);

        if (poisonDmg > 0) {
          setEnemyHP(newHP);
          addHPPopup(-poisonDmg, "enemy");
          pushLog(
            `☠️ Méreg sebzés: ${poisonDmg} (${enemy.name} – ${newHP} HP).`
          );
        }

        const remaining = (enemyPoison.remainingTurns ?? 1) - 1;
        if (remaining <= 0 || newHP <= 0) {
          setEnemyPoison(null);
        } else {
          setEnemyPoison((prev) =>
            prev ? { ...prev, remainingTurns: remaining } : null
          );
        }

        if (newHP <= 0) {
          setDefending(false);
          setTurn("player");
          return;
        }
      }

      if (enemyBleed && enemyHP > 0) {
        const bleedDmg = Math.max(
          1,
          Math.floor((enemy.maxHp * enemyBleed.percent) / 100)
        );
        const newHP = Math.max(0, enemyHP - bleedDmg);

        setEnemyHP(newHP);
        addHPPopup(-bleedDmg, "enemy");
        pushLog(
          `🩸 Vérzés: ${bleedDmg} sebzés (${enemyBleed.percent}%).`
        );

        const remaining = (enemyBleed.remainingTurns ?? 1) - 1;
        if (remaining <= 0 || newHP <= 0) {
          setEnemyBleed(null);
        } else {
          setEnemyBleed((prev) =>
            prev ? { ...prev, remainingTurns: remaining } : null
          );
        }

        if (newHP <= 0) {
          setDefending(false);
          setTurn("player");
          return;
        }
      }

      if (enemyStun > 0 && enemyHP > 0) {
        pushLog(`❄️ ${enemy.name} elkábulva marad, kihagyja a körét!`);
        setEnemyStun((prev) => Math.max(0, prev - 1));
        setDefending(false);
        setTurn("player");

        if (enemyVulnerability && enemyVulnerability.remainingTurns != null) {
          const remaining = enemyVulnerability.remainingTurns - 1;
          if (remaining <= 0) {
            setEnemyVulnerability(null);
            pushLog("🔮 Az Arcane Surge hatása elmúlt.");
          } else {
            setEnemyVulnerability((prev) =>
              prev ? { ...prev, remainingTurns: remaining } : null
            );
          }
        }

        return;
      }

      const [minDmg, maxDmg] = enemy.dmg;
      let dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;

      if (defending && defending > 0) {
        dmg = Math.floor(dmg / 2);
        setDefending((prev) => Math.max(0, (prev || 1) - 1));
      }

      const playerDefense = player?.defense ?? 0;
      let final = Math.max(0, dmg - Math.floor(playerDefense / 2));

      // ✅ WARRIOR BERSERKER (BALANCED): kevesebb HP = több DMG-IN (risk)
      if (classKey === "warrior") {
        const rage01 = getWarriorRage01(playerHP, maxHPFromPlayer);
        const inMult = warriorDamageInMult(rage01);
        final = Math.floor(final * inMult);
      }

      setPlayerHP((prev) => {
        const newHP = Math.max(0, prev - final);
        addHPPopup(-final, "player");
        return newHP;
      });

      pushLog(`💥 ${enemy.name} támad (${final} sebzés).`);

      if (enemyVulnerability && enemyVulnerability.remainingTurns != null) {
        const remaining = enemyVulnerability.remainingTurns - 1;
        if (remaining <= 0) {
          setEnemyVulnerability(null);
          pushLog("🔮 Az Arcane Surge hatása elmúlt.");
        } else {
          setEnemyVulnerability((prev) =>
            prev ? { ...prev, remainingTurns: remaining } : null
          );
        }
      }

      setTurn("player");
    }, boss ? 1400 : 900);

    return () => clearTimeout(t);
  }, [
    turn,
    enemy,
    defending,
    battleOver,
    boss,
    player,
    enemyHP,
    enemyPoison,
    enemyBurn,
    enemyBleed,
    enemyStun,
    enemyVulnerability,
    playerHP,
    maxHPFromPlayer,
    classKey,
  ]);

  function rollRewards() {
    if (!enemy || !enemy.rewards) {
      return { xpGain: 0, goldGain: 0 };
    }

    const { goldMin, goldMax, xpMin, xpMax } = enemy.rewards;
    const goldGain =
      Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin;
    const xpGain = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin;

    return { xpGain, goldGain };
  }

  async function handleContinue() {
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
      unspentStatPoints: (prev.unspentStatPoints ?? 0) + addedStatPoints,
    }));

    try {
      const playerId = player.id;
      const taskType = boss ? "boss" : "kill";

      await fetch("http://localhost:3000/api/quests/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, taskType }),
      });

      await fetch("http://localhost:3000/api/quests/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, taskType: "custom" }),
      });

      await fetch("http://localhost:3000/api/quests/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
    } catch (err) {
      console.error("Quest progress frissítés hiba:", err);
    }

    if (onEnd) onEnd(playerHP, true);
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Nincs betöltött játékos. Jelentkezz be újra.
      </div>
    );
  }

  // ====== ✅ WARRIOR VIZUÁL (FOLYAMATOS VÖRÖSÖDÉS) ======
  const warriorRage01 =
    classKey === "warrior" ? getWarriorRage01(playerHP, maxHPFromPlayer) : 0;

  // indulási küszöb (hogy ne legyen mindig túl piros)
  const visRage = clamp01(
    (warriorRage01 - WARRIOR_RAGE.VIS_START_RAGE) /
      (1 - WARRIOR_RAGE.VIS_START_RAGE)
  );

  const auraOpacity = visRage * WARRIOR_RAGE.VIS_MAX_OPACITY; // 0..max
  const auraBlur = Math.floor(visRage * WARRIOR_RAGE.VIS_MAX_BLUR);
  const ringPx = Math.max(0, Math.floor(visRage * WARRIOR_RAGE.VIS_RING_PX));

  const warriorFrameStyle =
    classKey === "warrior"
      ? {
          // piros “vérköd” + finom külső ragyogás (NINCS pulse)
          boxShadow: `0 0 ${auraBlur}px rgba(239,68,68,${auraOpacity})`,
          outline: ringPx > 0 ? `${ringPx}px solid rgba(239,68,68,${auraOpacity})` : "none",
          outlineOffset: ringPx > 0 ? "2px" : "0px",
          borderRadius: "12px",
          transition: "box-shadow 120ms linear, outline 120ms linear",
        }
      : undefined;

  return (
    <div className="fixed inset-0 text-white overflow-hidden">
      {/* háttér full screen */}
      <div className="absolute inset-0 -z-10">
        <img src={bg} alt="bg" className="w-full h-full object-cover" />
      </div>

      {/* 1920x1080 UI skálázva */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={{
            width: "1650px",
            height: "1050px",
            transform: `scale(${uiScale * BASE_UI_SCALE})`,
            transformOrigin: "center center",
          }}
        >
          {/* ✅ MANA BAR + ARCANE READY */}
          {classKey === "mage" && enemy && !battleOver && (
            <div className="absolute z-40" style={MANA_UI.wrapperStyle}>
              <div className="text-center text-xs font-mono mb-1 text-cyan-200 drop-shadow">
                Mana {mageMana}/{CTX_MAGE_MANA_MAX}
              </div>

              <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden border border-cyan-400/40">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${(mageMana / CTX_MAGE_MANA_MAX) * 100}%` }}
                />
              </div>

              {mageMana >= CTX_MAGE_MANA_MAX && turn === "player" && (
                <div className="flex justify-center mt-2">
                  <button
                    className="px-4 py-2 rounded bg-cyan-500/80 hover:bg-cyan-400 text-black text-sm font-bold"
                    onClick={() => setArcanePickerOpen(true)}
                  >
                    ARCANE READY
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ✅ ARCANE PICKER OVERLAY (3 választás) */}
          {arcanePickerOpen && !battleOver && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/70">
              <div className="flex gap-6">
                {ARCANE_CHOICES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => castArcane(c)}
                    className="relative w-40 h-56 rounded-xl overflow-hidden border-2 border-cyan-400/60 bg-cyan-900/40 hover:scale-105 transition"
                    title={c.desc}
                  >
                    {c.img ? (
                      <img
                        src={c.img}
                        alt={c.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-cyan-200/60 text-xs">
                        (később kép)
                      </div>
                    )}

                    <div className="absolute bottom-0 w-full bg-black/70 p-2 text-center">
                      <div className="font-bold text-sm">{c.name}</div>
                      <div className="text-xs text-gray-200">{c.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                className="absolute top-6 right-6 px-4 py-2 rounded bg-gray-800 hover:bg-gray-700"
                onClick={() => setArcanePickerOpen(false)}
              >
                X
              </button>
            </div>
          )}

          {/* PLAYER FRAME – bal oldalt */}
          <div className="absolute top-24 left-[20%] -translate-x-1/2 z-10">
            <div className="relative">
              <div style={warriorFrameStyle}>
                <EnemyFrame
                  name={player.username || "Player"}
                  hp={playerHP}
                  maxHP={maxHPFromPlayer}
                  image={classConfig.sprite}
                  damaged={playerDamaged}
                  healed={playerHealed}
                />
              </div>

              {/* PLAYER POPUPOK */}
              {hpPopups
                .filter((p) => p.target === "player")
                .map((p) => (
                  <HPPopup
                    key={p.id}
                    value={p.value}
                    isCrit={p.isCrit}
                    onDone={() =>
                      setHPPopups((prev) => prev.filter((pp) => pp.id !== p.id))
                    }
                  />
                ))}
            </div>
          </div>

          {/* ENEMY FRAME – jobb oldalt */}
          <div className="absolute top-24 left-[80%] -translate-x-1/2 z-10">
            <div className="relative">
              <EnemyFrame
                name={enemy?.name}
                hp={enemyHP}
                maxHP={enemy?.maxHp}
                image={enemyImage(enemy?.name)}
                damaged={enemyDamaged}
              />
              {/* ENEMY POPUPOK */}
              {hpPopups
                .filter((p) => p.target === "enemy")
                .map((p) => (
                  <HPPopup
                    key={p.id}
                    value={p.value}
                    isCrit={p.isCrit}
                    onDone={() =>
                      setHPPopups((prev) => prev.filter((pp) => pp.id !== p.id))
                    }
                  />
                ))}
            </div>
          </div>

          {/* ✅ COMBAT LOG – AUTO SCROLL-AL */}
          <div
            className="absolute top-[62%] left-1/2
            -translate-x-1/2
            w-3/4 max-w-2xl
            bg-black/50 rounded p-4
            h-48 overflow-y-auto
            font-mono text-sm z-10"
          >
            {log.map((l, i) => (
              <div key={i} className="mb-1">
                {l}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* KÁRTYÁK */}
          {!battleOver && turn === "player" && (
            <div
              className="absolute left-1/2 -translate-x-1/2 flex gap-4 z-50"
              style={{ bottom: "-80px" }}
            >
              {hand.map((card, i) => {
                const rs = rarityStyle[card.rarity] ?? rarityStyle.common;
                const imgSrc = card.image;

                return (
                  <button
                    key={i}
                    onClick={() => playCard(card)}
                    className={`relative w-40 h-60 rounded-xl overflow-hidden
                      border-4 ${rs.border}
                      transform transition-all duration-200 hover:scale-125
                      ${rs.glow}`}
                  >
                    <img
                      src={imgSrc}
                      alt={card.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 w-full bg-black/70 text-center p-1 text-sm">
                      <div className="font-bold">{card.name}</div>

                      {card.type === "attack" && (
                        <div>
                          Damage: {card.dmg?.[0] ?? "?"}–{card.dmg?.[1] ?? "?"}
                          {card.hits && card.hits > 1 ? ` x${card.hits}` : ""}
                        </div>
                      )}

                      {card.type === "defend" && <div>Defense</div>}

                      {card.type === "heal" && (
                        <div>
                          Heal: {card.heal}
                          {card.damageBuff && " + DMG buff"}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* VÉGEREDMÉNY */}
          {battleOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
              <div className="text-4xl mb-4">
                {playerHP <= 0 ? "☠️ Defeat..." : "🏆 Victory!"}
              </div>

              {lastRewards && (
                <div className="mb-2 text-sm text-gray-200">
                  Jutalom: +{lastRewards.goldGain} arany, +{lastRewards.xpGain} XP
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

          {/* ABILITY VIDEÓ EFFEKTEK */}
          <AbilityEffectLayer
            effects={abilityEffects}
            onEffectDone={(id) =>
              setAbilityEffects((prev) => prev.filter((fx) => fx.id !== id))
            }
          />
        </div>
      </div>
    </div>
  );
}

