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

const BASE_UI_SCALE = 0.8;

const MANA_UI = {
  wrapperStyle: {
    top: "610px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "420px",
  },
};

const PET_UI = {
  wrapperStyle: {
    left: "20px",
    top: "700px",
  },
};

const PET_SIZE = 300;

const ARCANE_CHOICES = [
  {
    id: "arcane_30pct",
    name: "Arcane Burst",
    desc: "50% DMG",
    kind: "damage_percent",
    percent: 0.5,
    img: "",
  },
  {
    id: "arcane_full_heal",
    name: "Arcane Restore",
    desc: "100% HEAL",
    kind: "full_heal",
    img: "",
  },
  {
    id: "arcane_big_dmg",
    name: "Arcane Cataclysm",
    desc: "VERY STRONG DMG",
    kind: "big_damage",
    img: "",
  },
];

function xpToNextLevel(level) {
  if (level <= 1) return 30;
  return 30 + (level - 1) * 20;
}

function resolveBackground(background, pathType) {
  if (background) return background;

  if (pathType === "mystery") return "/backgrounds/2.jpg";
  if (pathType === "elite") return "/backgrounds/1.jpg";
  return "/backgrounds/3.jpg";
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

const CLASS_CONFIG = {
  6: { key: "warrior", displayName: "Harcos", sprite: "/ui/player/player.png" },
  7: { key: "mage", displayName: "Varázsló", sprite: "/ui/player/varazslo.png" },
  8: { key: "archer", displayName: "Íjász", sprite: "/ui/player/ijasz.png" },
};

const DEFAULT_CLASS_CONFIG = {
  key: "warrior",
  displayName: "Harcos",
  sprite: "/ui/player/player.png",
};

const CLASS_BOSS_MAP = {
  warrior: "Mountain King",
  mage: "Arcane Abomination",
  archer: "Forest Spirit Beast",
};

// ===== WARRIOR HELPERS =====
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function getWarriorRage01(currentHP, maxHP) {
  if (!maxHP || maxHP <= 0) return 0;
  const hpRatio = clamp01(currentHP / maxHP);
  return 1 - hpRatio;
}

const WARRIOR_RAGE = {
  OUT_MAX_BONUS: 0.35,
  IN_MAX_BONUS: 0.25,
  VIS_START_RAGE: 0.25,
  VIS_MAX_OPACITY: 0.95,
  VIS_MAX_BLUR: 16,
  VIS_RING_PX: 10,
};

function warriorDamageOutMult(rage01) {
  return 1 + rage01 * WARRIOR_RAGE.OUT_MAX_BONUS;
}
function warriorDamageInMult(rage01) {
  return 1 + rage01 * WARRIOR_RAGE.IN_MAX_BONUS;
}

// ===== ARCHER PET CFG =====
const PET_CFG = {
  HP_RATIO: 0.5,
  BITE_CHANCE: 1,
  BITE_BASE_MIN: 2,
  BITE_BASE_MAX: 5,
  BITE_LEVEL_BONUS: 0.35,
  GUARD_CHANCE: 0.1,
  GUARD_REDUCE_MULT: 0.65,
};

function enemyImage(name) {
  if (!name) return "";
  return `/ui/enemies/${name.toLowerCase().replace(/ /g, "-")}.png`;
}

/* =========================================================
   ✅ SMART DRAW (STABIL KÉZ + SLOT CSERE ENEMY TURN UTÁN)
   - Player kijátszik: csak play anim, NEM húz azonnal
   - Enemy kör vége: pending slot(ok) feltöltése draw animmal
   ========================================================= */

const SMART_DRAW = {
  HAND_SIZE: 4,
  RECENT_BLOCK: 6,
  MAX_SAME_IN_HAND: 2,
  PLAY_ANIM_MS: 320, // css cardPlay-hoz igazítsd (ha akarod)
  DRAW_ANIM_MS: 320, // css cardDraw-hoz igazítsd
};

/* =========================================================
   ✅ SMART BIAS – KASZTONKÉNTI HÚZÁSI PREFERENCIÁK
   ========================================================= */

const SMART_BIAS = {
  warrior: {
    HEAL_THRESHOLD: 0.65,
    PANIC_HP: 0.35,
    DEFEND_AFTER_TURNS: 3,

    PANIC_DEFENSIVE_CHANCE: 0.7,
    PANIC_STUN_CHANCE: 0.3,

    MAX_HEAL_IN_HAND: 1,
    MAX_HEAL_IN_HAND_LOWHP: 2,
    LOWHP_FOR_2HEAL: 0.3,
  },

  mage: {
    HEAL_THRESHOLD: 0.72,
    PANIC_HP: 0.45,
    DEFEND_AFTER_TURNS: 3,

    PANIC_DEFENSIVE_CHANCE: 0.55,
    PANIC_STUN_CHANCE: 0.25,

    MAX_HEAL_IN_HAND: 1,
    MAX_HEAL_IN_HAND_LOWHP: 2,
    LOWHP_FOR_2HEAL: 0.3,
  },

  archer: {
    HEAL_THRESHOLD: 0.70,
    PANIC_HP: 0.40,
    DEFEND_AFTER_TURNS: 3,

    PANIC_DEFENSIVE_CHANCE: 0.60,
    PANIC_STUN_CHANCE: 0.40,

    MAX_HEAL_IN_HAND: 1,
    MAX_HEAL_IN_HAND_LOWHP: 2,
    LOWHP_FOR_2HEAL: 0.3,
  },
};

function getBias(classKey) {
  return SMART_BIAS[classKey] || SMART_BIAS.warrior;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildCombatPoolFromPlayer(player, classKey) {
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
      evasionTurns: ab.evasionTurns || 0,
      vulnerabilityDebuff: ab.vulnerabilityDebuff || null,
      bleed: ab.bleed || null,
      bleedStacks: ab.bleedStacks || 1,
      executeBelowPercent: ab.executeBelowPercent || null,

      // pet
      petTauntTurns: ab.petTauntTurns || 0,
      petHeal: ab.petHeal || 0,
      petBiteBonus: ab.petBiteBonus || 0,
    });
  });

  return cards;
}

function hasType(pool, type) {
  return pool.some((c) => c.type === type);
}

function countByAbilityId(cards) {
  const m = new Map();
  for (const c of cards) {
    if (!c) continue;
    if (c._played) continue;
    m.set(c.abilityId, (m.get(c.abilityId) || 0) + 1);
  }
  return m;
}

function pickRandomFrom(list) {
  if (!list || list.length === 0) return null;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

function pickCardSmart({ pool, wantType, handSoFar, recentIds, maxSameInHand }) {
  const counts = countByAbilityId(handSoFar);
  const canTake = (c) => {
    if (wantType && c.type !== wantType) return false;
    const cnt = counts.get(c.abilityId) || 0;
    if (cnt >= maxSameInHand) return false;
    return true;
  };

  const eligible = pool.filter(canTake);
  if (eligible.length === 0) return null;

  const notRecent = eligible.filter((c) => !recentIds.includes(c.abilityId));
  if (notRecent.length > 0) return pickRandomFrom(notRecent);

  return pickRandomFrom(eligible);
}

function isStunCard(c) {
  return (c?.stunTurns || 0) > 0;
}

function isDefensiveCard(c) {
  return (
    c?.type === "defend" ||
    (c?.evasionTurns || 0) > 0 ||
    (c?.petTauntTurns || 0) > 0 ||
    c?.abilityId === "mage_mana_shield" ||
    isStunCard(c)
  );
}

function pickDefensiveSmart({ pool, handSoFar, recentIds, stunChance = 0 }) {
  const defensivePool = pool.filter(isDefensiveCard);
  if (!defensivePool.length) return null;

  const stunPool = defensivePool.filter(isStunCard);
  const preferStun =
    stunPool.length > 0 && Math.random() < Math.max(0, Math.min(1, stunChance));

  const chosenPool = preferStun ? stunPool : defensivePool;

  return pickCardSmart({
    pool: chosenPool,
    wantType: null,
    handSoFar,
    recentIds,
    maxSameInHand: SMART_DRAW.MAX_SAME_IN_HAND,
  });
}

function drawSmartOne({
  pool,
  hpRatio,
  turnsSinceHeal,
  turnsSinceDefend,
  recentIds,
  handSoFar,
  classKey,
}) {
  const bias = getBias(classKey);

  const canHeal = hasType(pool, "heal");
  const canDef = hasType(pool, "defend");
  const canAtk = hasType(pool, "attack");

  const isPanic = hpRatio <= bias.PANIC_HP;

  let preferred = null;

  const healNeed = hpRatio <= bias.HEAL_THRESHOLD;
const healChance = isPanic
  ? 0.55                 // pánikban azért legyen több heal
  : healNeed
  ? 0.35                 // low hp-n csak eséllyel heal
  : 0.0;

const defensiveChance = isPanic ? bias.PANIC_DEFENSIVE_CHANCE : 0.12; // alatta is kis esély

if (isPanic && Math.random() < defensiveChance) {
  preferred = "defensive";
} else if (canHeal && Math.random() < healChance) {
  preferred = "heal";
} else if (turnsSinceDefend >= bias.DEFEND_AFTER_TURNS && canDef && Math.random() < 0.45) {
  preferred = "defend";
} else if (canAtk) {
  preferred = "attack";
}

  // Heal limit a kézben
  const maxHealInHand =
    hpRatio <= bias.LOWHP_FOR_2HEAL
      ? bias.MAX_HEAL_IN_HAND_LOWHP
      : bias.MAX_HEAL_IN_HAND;

  if (preferred === "heal") {
    const healCount = handSoFar.filter(
      (c) => c && !c._played && c.type === "heal"
    ).length;

    if (healCount >= maxHealInHand) preferred = null;
  }

  // Defensive -> stun eséllyel
  if (preferred === "defensive") {
    return (
      pickDefensiveSmart({
        pool,
        handSoFar,
        recentIds,
        stunChance: bias.PANIC_STUN_CHANCE,
      }) ||
      pickCardSmart({
        pool,
        wantType: null,
        handSoFar,
        recentIds,
        maxSameInHand: SMART_DRAW.MAX_SAME_IN_HAND,
      })
    );
  }

  return (
    pickCardSmart({
      pool,
      wantType: preferred,
      handSoFar,
      recentIds,
      maxSameInHand: SMART_DRAW.MAX_SAME_IN_HAND,
    }) ||
    pickCardSmart({
      pool,
      wantType: null,
      handSoFar,
      recentIds,
      maxSameInHand: SMART_DRAW.MAX_SAME_IN_HAND,
    })
  );
}

function makeCardInstance(baseCard, anim = null) {
  return {
    ...baseCard,
    _instanceId: uid(),
    _played: false,
    _anim: anim, // "draw" | null
  };
}

function createInitialHand({ pool, hpRatio, recentIds, classKey }) {
  const hand = Array.from({ length: SMART_DRAW.HAND_SIZE }, () => null);
  let turnsSinceHeal = 0;
  let turnsSinceDefend = 0;

  for (let i = 0; i < SMART_DRAW.HAND_SIZE; i++) {
    const picked = drawSmartOne({
      pool,
      hpRatio,
      turnsSinceHeal,
      turnsSinceDefend,
      recentIds,
      handSoFar: hand.filter(Boolean),
      classKey,
    });

    if (picked) {
      hand[i] = makeCardInstance(picked, "draw");
      if (picked.type === "heal") turnsSinceHeal = 0;
      else turnsSinceHeal += 1;

      if (picked.type === "defend") turnsSinceDefend = 0;
      else turnsSinceDefend += 1;
    }
  }

  return hand;
}

/* =========================================================
   ✅ SIMPLE FADE OVERLAY (videó nélkül)
   ========================================================= */
function FadeOverlay({
  isOpen,
  onMid,
  onDone,
  inMs = 220,
  holdMs = 120,
  outMs = 260,
  maxOpacity = 1,
}) {
  const [phase, setPhase] = useState("idle"); // idle | in | hold | out

  useEffect(() => {
    if (!isOpen) return;

    setPhase("in");

    const t1 = setTimeout(() => setPhase("hold"), inMs);
    const t2 = setTimeout(() => {
      onMid?.();
      setPhase("out");
    }, inMs + holdMs);
    const t3 = setTimeout(() => {
      onDone?.();
      setPhase("idle");
    }, inMs + holdMs + outMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, inMs, holdMs, outMs, onMid, onDone]);

  if (!isOpen && phase === "idle") return null;

  const opacity =
    phase === "in"
      ? maxOpacity
      : phase === "hold"
      ? maxOpacity
      : phase === "out"
      ? 0
      : 0;

  const duration = phase === "in" ? inMs : phase === "out" ? outMs : 0;

  return (
    <div
      className="fixed inset-0"
      style={{
        zIndex: 9999,
        background: "black",
        opacity,
        transition: duration ? `opacity ${duration}ms ease` : "none",
        pointerEvents: "none",
      }}
    />
  );
}

/* ========================================================= */

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

  // ✅ timeout tracking (villanás / stale timeout ellen)
  const timersRef = useRef([]);
  const trackTimeout = (id) => {
    timersRef.current.push(id);
    return id;
  };
  const clearAllTimers = () => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  };

  const [uiScale, setUiScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleW = vw / 1650;
      const scaleH = vh / 1050;
      setUiScale(Math.min(scaleW, scaleH));
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const initialHPFromPlayer = player?.hp ?? 100;
  const maxHPFromPlayer = player?.max_hp ?? initialHPFromPlayer;
  const [playerHP, setPlayerHP] = useState(initialHPFromPlayer);

  useEffect(() => {
    if (player?.hp != null) setPlayerHP(player.hp);
  }, [player?.hp]);

  const classConfig = useMemo(() => {
    if (!player?.class_id) return DEFAULT_CLASS_CONFIG;
    return CLASS_CONFIG[player.class_id] || DEFAULT_CLASS_CONFIG;
  }, [player?.class_id]);

  const classKey = useMemo(
    () => getClassKeyFromId(player?.class_id),
    [player?.class_id]
  );

  const [enemy, setEnemy] = useState(null);
  const [enemyHP, setEnemyHP] = useState(0);
  const [turn, setTurn] = useState("player");
  const [battleOver, setBattleOver] = useState(false);
  const [defending, setDefending] = useState(false);

  // ✅ battleOver ref (stale timeoutok ellen)
  const battleOverRef = useRef(false);
  useEffect(() => {
    battleOverRef.current = battleOver;
  }, [battleOver]);

  const endBattle = () => {
    if (battleOverRef.current) return;
    battleOverRef.current = true;
    setBattleOver(true);
    setArcanePickerOpen(false);
    setTurn("end");
    clearAllTimers();
  };

  const [arcanePickerOpen, setArcanePickerOpen] = useState(false);

  const [petHP, setPetHP] = useState(0);
  const [petMaxHP, setPetMaxHP] = useState(0);
  const [petTauntTurns, setPetTauntTurns] = useState(0);

  // ✅ SMART DRAW STATE
  const [combatPool, setCombatPool] = useState([]);
  const [hand, setHand] = useState([null, null, null, null]);
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState([]);
  const [turnsSinceHeal, setTurnsSinceHeal] = useState(0);
  const [turnsSinceDefend, setTurnsSinceDefend] = useState(0);

  // ✅ pending replace: melyik slotba kell majd húzni enemy turn után
  const [pendingReplaces, setPendingReplaces] = useState([
    null,
    null,
    null,
    null,
  ]);

  // ✅ refs: enemy turnben NINCS stale state
  const handRef = useRef(hand);
  useEffect(() => {
    handRef.current = hand;
  }, [hand]);

  const recentlyRef = useRef(recentlyPlayedIds);
  useEffect(() => {
    recentlyRef.current = recentlyPlayedIds;
  }, [recentlyPlayedIds]);

  const turnsHealRef = useRef(turnsSinceHeal);
  useEffect(() => {
    turnsHealRef.current = turnsSinceHeal;
  }, [turnsSinceHeal]);

  const turnsDefRef = useRef(turnsSinceDefend);
  useEffect(() => {
    turnsDefRef.current = turnsSinceDefend;
  }, [turnsSinceDefend]);

  const playerHPRef = useRef(playerHP);
  useEffect(() => {
    playerHPRef.current = playerHP;
  }, [playerHP]);

  const pendingRef = useRef(pendingReplaces);
  useEffect(() => {
    pendingRef.current = pendingReplaces;
  }, [pendingReplaces]);

  const [hpPopups, setHPPopups] = useState([]);
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [playerHealed, setPlayerHealed] = useState(false);
  const [enemyDamaged, setEnemyDamaged] = useState(false);

  const [abilityEffects, setAbilityEffects] = useState([]);
  const logEndRef = useRef(null);

  function spawnAbilityEffect({ src, target = "center", width, height }) {
    const id = Date.now() + Math.random();
    setAbilityEffects((prev) => [...prev, { id, src, target, width, height }]);
  }

  const [playerDamageBuff, setPlayerDamageBuff] = useState(null);
  const [enemyPoison, setEnemyPoison] = useState(null);
  const [enemyBurn, setEnemyBurn] = useState(null);
  const [enemyStun, setEnemyStun] = useState(0);
  const [enemyVulnerability, setEnemyVulnerability] = useState(null);
  const [enemyBleed, setEnemyBleed] = useState(null);
  const [playerEvasionTurns, setPlayerEvasionTurns] = useState(0);

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
    if (logEndRef.current)
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  function addHPPopup(value, target, isCrit = false, variant = "default") {
    const id = Date.now() + Math.random();
    setHPPopups((prev) => [...prev, { id, value, target, isCrit, variant }]);

    if (value < 0) {
      if (target === "player") {
        setPlayerDamaged(true);
        trackTimeout(setTimeout(() => setPlayerDamaged(false), 300));
      } else if (target === "enemy") {
        setEnemyDamaged(true);
        trackTimeout(setTimeout(() => setEnemyDamaged(false), 300));
      }
    } else {
      if (target === "player") {
        setPlayerHealed(true);
        trackTimeout(setTimeout(() => setPlayerHealed(false), 400));
      }
    }
  }

  // ✅ unmount cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // deck init a playerben
  useEffect(() => {
    if (!player || !setPlayer) return;
    if (Array.isArray(player.deck) && player.deck.length > 0) return;
    const baseDeck = buildDefaultDeckForClass(classKey);
    setPlayer((prev) => ({ ...prev, deck: baseDeck }));
  }, [player, setPlayer, classKey]);

  // ✅ pending húzás "motor" – enemy turn végén fut
  function resolvePendingReplaces() {
    if (battleOverRef.current) return;

    const pending = pendingRef.current;
    if (!pending || !pending.some(Boolean)) return;

    const hpRatio =
      maxHPFromPlayer > 0 ? playerHPRef.current / maxHPFromPlayer : 1;

    // lokális "working" state, hogy ne legyen 4 külön setState káosz
    let workingHand = [...handRef.current];
    let workingRecent = [...recentlyRef.current];

    let nextTurnsHeal = turnsHealRef.current;
    let nextTurnsDef = turnsDefRef.current;

    pending.forEach((justPlayedCard, slotIndex) => {
      if (!justPlayedCard) return;

      const nextRecent = [justPlayedCard.abilityId, ...workingRecent].slice(
        0,
        SMART_DRAW.RECENT_BLOCK
      );

      const handWithoutPlayed = workingHand
        .map((c, i) => (i === slotIndex ? null : c))
        .filter(Boolean);

      const nextPicked = drawSmartOne({
        pool: combatPool,
        hpRatio,
        turnsSinceHeal: nextTurnsHeal,
        turnsSinceDefend: nextTurnsDef,
        recentIds: nextRecent,
        handSoFar: handWithoutPlayed,
        classKey,
      });

      // turnsSince (lokálisan)
      if (nextPicked?.type === "heal") nextTurnsHeal = 0;
      else nextTurnsHeal += 1;

      if (nextPicked?.type === "defend") nextTurnsDef = 0;
      else nextTurnsDef += 1;

      const nextCard = nextPicked ? makeCardInstance(nextPicked, "draw") : null;

      workingHand[slotIndex] = nextCard;
      workingRecent = nextRecent;

      // draw anim levétele (a konkrét sloton)
      if (nextCard) {
        trackTimeout(
          setTimeout(() => {
            if (battleOverRef.current) return;
            setHand((prev) => {
              const copy = [...prev];
              const c = copy[slotIndex];
              if (c && c._instanceId === nextCard._instanceId) {
                copy[slotIndex] = { ...c, _anim: null };
              }
              return copy;
            });
          }, SMART_DRAW.DRAW_ANIM_MS)
        );
      }
    });

    // ✅ egyszer frissítünk mindent
    setHand(workingHand);
    setRecentlyPlayedIds(workingRecent);
    setTurnsSinceHeal(nextTurnsHeal);
    setTurnsSinceDefend(nextTurnsDef);

    // refeket is frissítjük azonnal (ne várjuk meg a useEffect-et)
    handRef.current = workingHand;
    recentlyRef.current = workingRecent;
    turnsHealRef.current = nextTurnsHeal;
    turnsDefRef.current = nextTurnsDef;

    // ✅ pending ürítés
    const empty = [null, null, null, null];
    setPendingReplaces(empty);
    pendingRef.current = empty;
  }

  // ✅ enemy turn vége -> húz + visszaadja a player kört
  function finishEnemyTurnToPlayer() {
    resolvePendingReplaces();
    setDefending(false);
    setTurn("player");
  }

  // init battle
  useEffect(() => {
    if (!player) return;

    async function initBattle() {
      try {
        clearAllTimers();

        let isElite = !boss && pathType === "elite";
        let allowedNames = Array.isArray(enemies) ? enemies : [];

        // class quest boss override
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
              const bossName = CLASS_BOSS_MAP[classKey];
              if (bossName) {
                allowedNames = [bossName];
                pushLog(
                  `🔥 Class quest boss közeleg: ${bossName} (kaszt: ${classKey})`
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

        battleOverRef.current = false;
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
        setPlayerEvasionTurns(0);

        // pet init
        if (classKey === "archer") {
          const max = Math.floor(maxHPFromPlayer * PET_CFG.HP_RATIO);
          setPetMaxHP(max);
          setPetHP(max);
          setPetTauntTurns(0);
        } else {
          setPetMaxHP(0);
          setPetHP(0);
          setPetTauntTurns(0);
        }

        // smart draw init
        const pool = buildCombatPoolFromPlayer(player, classKey);
        setCombatPool(pool);

        setRecentlyPlayedIds([]);
        recentlyRef.current = [];

        setTurnsSinceHeal(0);
        turnsHealRef.current = 0;

        setTurnsSinceDefend(0);
        turnsDefRef.current = 0;

        // pending reset
        const empty = [null, null, null, null];
        setPendingReplaces(empty);
        pendingRef.current = empty;

        const hpRatio =
          maxHPFromPlayer > 0 ? playerHPRef.current / maxHPFromPlayer : 1;

        const initialHand = createInitialHand({
          pool,
          hpRatio,
          recentIds: [],
          classKey,
        });

        setHand(initialHand);
        // ✅ initial draw anim levétele MINDEN lapról
        trackTimeout(
          setTimeout(() => {
            if (battleOverRef.current) return;
            setHand((prev) =>
              prev.map((c) => (c ? { ...c, _anim: null } : c))
            );
          }, SMART_DRAW.DRAW_ANIM_MS)
        );
        handRef.current = initialHand;
      } catch (err) {
        console.error("Enemy init error:", err);
      }
    }

    initBattle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, boss, pathType, enemies, player, classKey, maxHPFromPlayer]);

  // ===== ARCANE =====
  function castArcane(choice) {
    if (battleOverRef.current) return;
    if (turn !== "player" || !enemy) return;
    if (classKey !== "mage") return;
    if (mageMana < CTX_MAGE_MANA_MAX) return;

    setArcanePickerOpen(false);
    spendAllMageMana();

    const playerIntellect = player?.intellect ?? 0;

    if (choice.kind === "damage_percent") {
      const dmg = Math.max(1, Math.floor((enemy?.maxHp ?? 1) * choice.percent));
      spawnAbilityEffect({
        src: arcaneSurgeFx,
        target: "enemy_aoe",
        width: "1200px",
        height: "1200px",
      });
      setEnemyHP((prev) => {
        const newHP = Math.max(0, prev - dmg);
        addHPPopup(-dmg, "enemy");
        pushLog(`🔮 ${choice.name}: ${dmg} sebzés.`);
        if (newHP <= 0) endBattle();
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
        if (amount > 0) addHPPopup(+amount, "player");
        pushLog(`✨ ${choice.name}: teljes gyógyítás.`);
        return maxHPFromPlayer;
      });
    }

    if (choice.kind === "big_damage") {
      const base = Math.max(1, Math.floor((enemy?.maxHp ?? 1) * 1.0));
      const extra = Math.floor(playerIntellect * 2.25);
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
        if (newHP <= 0) endBattle();
        return newHP;
      });
    }

    gainMageMana(1);

    // arcane után is enemy turn jön
    trackTimeout(setTimeout(() => setTurn("enemy"), SMART_DRAW.PLAY_ANIM_MS));
  }

  // ===== PET BITE =====
  function tryPetBite(extraBonus = 0) {
    if (classKey !== "archer") return;
    if (!enemy || battleOverRef.current) return;
    if (petHP <= 0) return;
    if (Math.random() > PET_CFG.BITE_CHANCE) return;

    const lvl = player?.level ?? 1;
    const min = Math.floor(PET_CFG.BITE_BASE_MIN + lvl * PET_CFG.BITE_LEVEL_BONUS);
    const max = Math.floor(PET_CFG.BITE_BASE_MAX + lvl * PET_CFG.BITE_LEVEL_BONUS);

    const bite = Math.max(
      1,
      Math.floor(Math.random() * (max - min + 1)) + min + (extraBonus || 0)
    );

    setEnemyHP((prev) => {
      const newHP = Math.max(0, prev - bite);
      addHPPopup(-bite, "enemy", false, "pet-hit");
      pushLog(`🐺 Pet Bite: ${bite} sebzés!`);
      if (newHP <= 0) endBattle();
      return newHP;
    });
  }

  // ===== PLAY CARD (slot index-szel) =====
  function playCardAt(slotIndex) {
    const card = handRef.current?.[slotIndex];
    if (!card) return;
    if (card._played) return;

    if (battleOverRef.current) return;
    if (turn !== "player" || !enemy) return;

    // ✅ megjelöljük played-re (csak ez animál)
    setHand((prev) => {
      const copy = [...prev];
      const c = copy[slotIndex];
      if (!c) return prev;
      copy[slotIndex] = { ...c, _played: true };
      return copy;
    });

    applyCardEffects(card);

    // ✅ pending-be eltesszük, hogy ENEMY TURN VÉGÉN húzzuk vissza
    setPendingReplaces((prev) => {
      const copy = [...prev];
      copy[slotIndex] = card;
      return copy;
    });

    // ✅ enemy turn jön
    setTurn("enemy");
  }

  function applyCardEffects(card) {
    if (battleOverRef.current) return;

    const playerStrength = player?.strength ?? 0;
    const playerIntellect = player?.intellect ?? 0;
    const playerLevel = player?.level ?? 1;
    const playerAgi = playerStrength; // nálad ideiglenes

    // ===== ATTACK =====
    if (card.type === "attack") {
      let baseMin = card.dmg?.[0] ?? 4;
      let baseMax = card.dmg?.[1] ?? 8;

      // VFX
      if (card.abilityId === "mage_arcane_missiles") {
        spawnAbilityEffect({ src: arcaneMissilesFx, target: "enemy", width: "1000px", height: "1000px" });
      }
      if (card.abilityId === "mage_ice_lance") {
        spawnAbilityEffect({ src: icelance, target: "enemy", width: "1000px", height: "1050px" });
      }
      if (card.abilityId === "mage_fireball") {
        spawnAbilityEffect({ src: fireballFx, target: "enemy", width: "1000px", height: "1000px" });
      }
      if (card.abilityId === "mage_arcane_surge") {
        spawnAbilityEffect({ src: arcaneSurgeFx, target: "enemy_aoe", width: "1200px", height: "1200px" });
      }
      if (card.abilityId === "mage_frost_nova") {
        spawnAbilityEffect({ src: frostNovaFx, target: "enemy_aoe", width: "1000px", height: "1000px" });
      }
      if (card.abilityId === "mage_lightning_bolt") {
        spawnAbilityEffect({ src: lightningBoltFx, target: "enemy", width: "1050px", height: "1050px" });
      }
      if (card.abilityId === "mage_chain_lightning") {
        spawnAbilityEffect({ src: chainLightningFx, target: "enemy", width: "1000px", height: "1000px" });
      }
      if (card.abilityId === "mage_drain_life") {
        spawnAbilityEffect({ src: drainLifeFx, target: "enemy", width: "1600px", height: "700px" });
      }

      // kaszt scaling
      if (classKey === "warrior") {
        const bonus = Math.floor(playerStrength * 0.35) + Math.floor(playerLevel * 0.3);
        baseMin += bonus;
        baseMax += bonus;
      } else if (classKey === "mage") {
        const bonus = Math.floor(playerIntellect * 0.25) + Math.floor(playerLevel * 0.25);
        baseMin += bonus;
        baseMax += bonus;
      } else if (classKey === "archer") {
        const bonus = Math.floor(playerAgi * 0.3) + Math.floor(playerLevel * 0.35);
        baseMin += bonus;
        baseMax += bonus;
      }

      if (baseMin < 1) baseMin = 1;
      if (baseMax < baseMin) baseMax = baseMin;

      // crit
      let critChance = 0;
      let critMultiplier = 1;

      if (classKey === "warrior") {
        critChance = Math.min(60, 15 + playerStrength * 0.8 + playerLevel * 1.0);
        critMultiplier = 2.25;
      } else if (classKey === "mage") {
        critChance = Math.min(65, 12 + playerIntellect * 0.7 + playerLevel * 0.8);
        critMultiplier = 1.5;
      } else if (classKey === "archer") {
        critChance = Math.min(70, 18 + playerAgi * 0.9 + playerLevel * 1.2);
        critMultiplier = 1.75;
      }

      const hits = card.hits || 1;
      const dmgRolls = [];

      for (let i = 0; i < hits; i++) {
        let roll = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;

        let isCrit = false;
        if (Math.random() * 100 < critChance) {
          isCrit = true;
          roll = Math.floor(roll * critMultiplier);
        }
        dmgRolls.push({ amount: roll, isCrit });
      }

      let finalRolls = dmgRolls.map((r) => ({ ...r }));

      // warrior rage out
      if (classKey === "warrior") {
        const rage01 = getWarriorRage01(playerHPRef.current, maxHPFromPlayer);
        const outMult = warriorDamageOutMult(rage01);
        if (outMult > 1.001) {
          finalRolls = finalRolls.map((r) => ({
            ...r,
            amount: Math.floor(r.amount * outMult),
          }));
          pushLog(
            `🩸 Berserker Rage: +${Math.round((outMult - 1) * 100)}% sebzés (${playerHPRef.current}/${maxHPFromPlayer} HP).`
          );
        }
      }

      // execute
      if (card.executeBelowPercent && enemy?.maxHp) {
        const hpPercent = Math.floor((enemyHP / enemy.maxHp) * 100);
        if (hpPercent <= card.executeBelowPercent) {
          finalRolls = finalRolls.map((r) => ({ ...r, amount: r.amount * 2 }));
          pushLog("☠️ Crushing Blow – kivégzés!");
        }
      }

      // dmg buff
      if (playerDamageBuff && playerDamageBuff.multiplier) {
        finalRolls = finalRolls.map((r) => ({
          ...r,
          amount: Math.floor(r.amount * playerDamageBuff.multiplier),
        }));
        pushLog("🩸 A Rallying Shout erősíti a támadásod!");

        const remaining = (playerDamageBuff.remainingAttacks ?? 1) - 1;
        if (remaining <= 0) setPlayerDamageBuff(null);
        else {
          setPlayerDamageBuff((prev) =>
            prev ? { ...prev, remainingAttacks: remaining } : null
          );
        }
      }

      // vulnerability
      if (enemyVulnerability && enemyVulnerability.multiplier) {
        finalRolls = finalRolls.map((r) => ({
          ...r,
          amount: Math.floor(r.amount * enemyVulnerability.multiplier),
        }));
        pushLog(`🔮 A korábbi Arcane Surge miatt ${enemy.name} több sebzést szenved el!`);
      }

      // apply hits (delay)
      finalRolls.forEach((roll, index) => {
        trackTimeout(
          setTimeout(() => {
            if (battleOverRef.current) return;
            const dmg = roll.amount;

            setEnemyHP((prev) => {
              const newHP = Math.max(0, prev - dmg);
              addHPPopup(-dmg, "enemy", roll.isCrit);
              pushLog(
                `${card.name} → ${enemy.name} kap ${dmg} sebzést${roll.isCrit ? " (KRITIKUS!)" : ""}.`
              );
              if (newHP <= 0) endBattle();
              return newHP;
            });

            // drain
            if (card.drain && card.heal) {
              setPlayerHP((prev) => {
                const newHP = Math.min(prev + card.heal, maxHPFromPlayer);
                addHPPopup(+card.heal, "player");
                pushLog(`🧛 Drain Life gyógyít: +${card.heal} HP.`);
                return newHP;
              });
            }
          }, index * 220)
        );
      });

      // poison
      if (card.poison && card.poison.damagePerTurn > 0 && card.poison.turns > 0) {
        setEnemyPoison({
          damagePerTurn: card.poison.damagePerTurn,
          remainingTurns: card.poison.turns,
        });
        pushLog(
          `☠️ ${enemy.name} megmérgezve: ${card.poison.damagePerTurn} sebzés ${card.poison.turns} körön át.`
        );
      }

      // bleed
      if (card.bleed) {
        const stacks = Math.max(1, card.bleedStacks || 1);
        for (let s = 0; s < stacks; s++) {
          setEnemyBleed((prev) => {
            if (!prev)
              return {
                percent: card.bleed.basePercent,
                remainingTurns: card.bleed.turns,
              };
            const nextPercent = Math.min(
              card.bleed.maxPercent,
              prev.percent + card.bleed.bonusPerStack
            );
            return { percent: nextPercent, remainingTurns: card.bleed.turns };
          });
        }
        pushLog(`🩸 Vérzés! (${stacks} stack) ${enemy.name} minden körben sebződik.`);
      }

      // burn
      if (card.burn && card.burn.percent && card.burn.turns) {
        const totalHit = finalRolls.reduce((a, b) => a + b.amount, 0);
        const burnPerTurn = Math.max(1, Math.floor((totalHit * card.burn.percent) / 100));
        setEnemyBurn({ damagePerTurn: burnPerTurn, remainingTurns: card.burn.turns });
        pushLog(`🔥 ${enemy.name} égni kezd: ${burnPerTurn} sebzés ${card.burn.turns} körön át.`);
      }

      // stun
      if (card.stunTurns && card.stunTurns > 0) {
        spawnAbilityEffect({ src: stunFx, target: "enemy_stun", width: "500px", height: "500px" });
        setEnemyStun((prev) => prev + card.stunTurns);
        pushLog(`❄️ ${enemy.name} elkábult, kihagyja a következő körét!`);
      }

      // vulnerability debuff
      if (card.vulnerabilityDebuff && card.vulnerabilityDebuff.multiplier) {
        const mult = card.vulnerabilityDebuff.multiplier ?? 1.15;
        const turns = card.vulnerabilityDebuff.turns ?? 3;
        setEnemyVulnerability({ multiplier: mult, remainingTurns: turns });
        pushLog(
          `🔮 ${enemy.name} sebezhetővé válik: +${Math.round((mult - 1) * 100)}% sebzést kap ${turns} körig!`
        );
      }
    }

    // ===== DEFEND =====
    if (card.type === "defend") {
      if (card.abilityId === "mage_mana_shield") {
        spawnAbilityEffect({
          src: manaShieldFx,
          target: "player_shield",
          width: "1150px",
          height: "1000px",
        });
      }

      if (card.evasionTurns && card.evasionTurns > 0) {
        setPlayerEvasionTurns((prev) => Math.max(prev, card.evasionTurns));
        pushLog(`💨 ${card.name}: kitérés ${card.evasionTurns} körig!`);
      }

      if (card.defenseTurns && card.defenseTurns > 1) {
        setDefending(card.defenseTurns);
        pushLog(`🛡️ ${card.name}: védekezés aktiválva ${card.defenseTurns} körre!`);
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

      if (classKey === "archer" && card.petTauntTurns && petHP > 0) {
        setPetTauntTurns((prev) => Math.max(prev, card.petTauntTurns));
        pushLog(`🐺 Pet Taunt: a mob a petet üti (${card.petTauntTurns} kör).`);
      }
    }

    // ===== HEAL =====
    if (card.type === "heal") {
      spawnAbilityEffect({ src: healFx, target: "player", width: "1000px", height: "1000px" });

      let healAmount = card.heal || 20;
      if (classKey === "mage") healAmount += Math.floor(playerIntellect * 0.25);
      else if (classKey === "warrior") healAmount += Math.floor(playerStrength * 0.3);
      else if (classKey === "archer") healAmount += Math.floor(playerAgi * 0.5);

      setPlayerHP((prev) => {
        const newHP = Math.min(prev + healAmount, maxHPFromPlayer);
        addHPPopup(+healAmount, "player");
        pushLog(`✨ ${card.name}: +${healAmount} HP (most ${newHP}/${maxHPFromPlayer})`);
        return newHP;
      });

      if (card.damageBuff && card.damageBuff.multiplier) {
        const mult = card.damageBuff.multiplier ?? 1.5;
        const turns = card.damageBuff.turns ?? 1;
        setPlayerDamageBuff({ multiplier: mult, remainingAttacks: turns });
        pushLog(
          `📣 ${card.name}: a következő ${turns} támadásod +${Math.round((mult - 1) * 100)}% sebzést okoz!`
        );
      }

      if (classKey === "archer" && card.petHeal && petHP > 0) {
        const amount = Math.max(1, card.petHeal);
        setPetHP((prev) => {
          const newHP = Math.min(petMaxHP, prev + amount);
          addHPPopup(+amount, "pet");
          pushLog(`🐺 Mend Pet: +${amount} HP (Pet: ${newHP}/${petMaxHP})`);
          return newHP;
        });
      }
    }

    // mage mana build
    if (classKey === "mage") {
      setMageMana((prev) => Math.min(CTX_MAGE_MANA_MAX, prev + 1));
    }

    // pet bite
    if (classKey === "archer") {
      tryPetBite(card.petBiteBonus || 0);
    }
  }

  // battle over watcher (biztos)
  useEffect(() => {
    if (!enemy) return;
    if (playerHP <= 0 || enemyHP <= 0) {
      endBattle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerHP, enemyHP, enemy]);

  // reward preview
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

  // enemy turn
  useEffect(() => {
    if (!enemy || battleOver || turn !== "enemy") return;

    const t = setTimeout(() => {
      if (battleOverRef.current) return;

      // --- DOT-ok ---
      if (enemyBurn && enemyHP > 0) {
        const burnDmg = enemyBurn.damagePerTurn ?? 0;
        const newHP = Math.max(0, enemyHP - burnDmg);

        if (burnDmg > 0) {
          setEnemyHP(newHP);
          addHPPopup(-burnDmg, "enemy");
          pushLog(`🔥 Égés sebzés: ${burnDmg} (${enemy.name} – ${newHP} HP).`);
        }

        const remaining = (enemyBurn.remainingTurns ?? 1) - 1;
        if (remaining <= 0 || newHP <= 0) setEnemyBurn(null);
        else setEnemyBurn((prev) => (prev ? { ...prev, remainingTurns: remaining } : null));

        if (newHP <= 0) {
          endBattle();
          return;
        }
      }

      if (enemyPoison && enemyHP > 0) {
        const poisonDmg = enemyPoison.damagePerTurn ?? 0;
        const newHP = Math.max(0, enemyHP - poisonDmg);

        if (poisonDmg > 0) {
          setEnemyHP(newHP);
          addHPPopup(-poisonDmg, "enemy");
          pushLog(`☠️ Méreg sebzés: ${poisonDmg} (${enemy.name} – ${newHP} HP).`);
        }

        const remaining = (enemyPoison.remainingTurns ?? 1) - 1;
        if (remaining <= 0 || newHP <= 0) setEnemyPoison(null);
        else setEnemyPoison((prev) => (prev ? { ...prev, remainingTurns: remaining } : null));

        if (newHP <= 0) {
          endBattle();
          return;
        }
      }

      if (enemyBleed && enemyHP > 0) {
        const bleedDmg = Math.max(1, Math.floor((enemy.maxHp * enemyBleed.percent) / 100));
        const newHP = Math.max(0, enemyHP - bleedDmg);

        setEnemyHP(newHP);
        addHPPopup(-bleedDmg, "enemy");
        pushLog(`🩸 Vérzés: ${bleedDmg} sebzés (${enemyBleed.percent}%).`);

        const remaining = (enemyBleed.remainingTurns ?? 1) - 1;
        if (remaining <= 0 || newHP <= 0) setEnemyBleed(null);
        else setEnemyBleed((prev) => (prev ? { ...prev, remainingTurns: remaining } : null));

        if (newHP <= 0) {
          endBattle();
          return;
        }
      }

      // stun -> enemy kihagyja -> player visszakapja a kört + húzás
      if (enemyStun > 0 && enemyHP > 0) {
        pushLog(`❄️ ${enemy.name} elkábulva marad, kihagyja a körét!`);
        setEnemyStun((prev) => Math.max(0, prev - 1));

        // vulnerability tick
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

        finishEnemyTurnToPlayer();
        return;
      }

      // evasion -> enemy mellé üt -> player vissza + húzás
      if (playerEvasionTurns > 0 && enemyHP > 0) {
        pushLog(`💨 Kitértél! ${enemy.name} mellé üt.`);
        setPlayerEvasionTurns((prev) => Math.max(0, prev - 1));
        finishEnemyTurnToPlayer();
        return;
      }

      // base dmg
      const [minDmg, maxDmg] = enemy.dmg;
      let dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;

      if (defending && defending > 0) {
        dmg = Math.floor(dmg / 2);
        setDefending((prev) => Math.max(0, (prev || 1) - 1));
      }

      const finalBase = Math.max(0, dmg - Math.floor((player?.defense ?? 0) / 2));
      let final = finalBase;

      if (classKey === "warrior") {
        const rage01 = getWarriorRage01(playerHPRef.current, maxHPFromPlayer);
        final = Math.floor(final * warriorDamageInMult(rage01));
      }

      const petAliveNow = classKey === "archer" && petHP > 0;
      const taunting = petAliveNow && petTauntTurns > 0;

      if (classKey === "archer" && petAliveNow && !taunting) {
        if (Math.random() < PET_CFG.GUARD_CHANCE) {
          final = Math.floor(final * PET_CFG.GUARD_REDUCE_MULT);
          pushLog("🛡️🐺 Pet Guard! A pet tompította az ütést.");
        }
      }

      if (classKey === "archer" && taunting) {
        setPetHP((prev) => {
          const newHP = Math.max(0, prev - final);
          addHPPopup(-final, "pet");
          pushLog(`💥 ${enemy.name} a petet üti (${final} sebzés). (Pet: ${newHP}/${petMaxHP})`);
          return newHP;
        });
        setPetTauntTurns((prev) => Math.max(0, prev - 1));
      } else {
        setPlayerHP((prev) => {
          const newHP = Math.max(0, prev - final);
          addHPPopup(-final, "player");
          return newHP;
        });
        pushLog(`💥 ${enemy.name} támad (${final} sebzés).`);
      }

      // vulnerability tick
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

      // ha player meghalt
      if (playerHPRef.current - final <= 0) {
        endBattle();
        return;
      }

      // ✅ enemy kör vége -> pending húzás + player turn
      finishEnemyTurnToPlayer();
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
    maxHPFromPlayer,
    classKey,
    petHP,
    petMaxHP,
    petTauntTurns,
    playerEvasionTurns,
  ]);

  function rollRewards() {
    if (!enemy || !enemy.rewards) return { xpGain: 0, goldGain: 0 };
    const { goldMin, goldMax, xpMin, xpMax } = enemy.rewards;
    const goldGain = Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin;
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

    setLastRewards({ xpGain, goldGain, levelsGained, addedStatPoints });
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

  // ✅ Fade continue (PathChoice-hoz nem nyúlunk)
  const [fadeOpen, setFadeOpen] = useState(false);
  const continueLockRef = useRef(false);

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Nincs betöltött játékos. Jelentkezz be újra.
      </div>
    );
  }

  const warriorRage01 =
    classKey === "warrior" ? getWarriorRage01(playerHP, maxHPFromPlayer) : 0;

  const visRage = clamp01(
    (warriorRage01 - WARRIOR_RAGE.VIS_START_RAGE) /
      (1 - WARRIOR_RAGE.VIS_START_RAGE)
  );

  const auraOpacity = visRage * WARRIOR_RAGE.VIS_MAX_OPACITY;
  const auraBlur = Math.floor(visRage * WARRIOR_RAGE.VIS_MAX_BLUR);
  const ringPx = Math.max(0, Math.floor(visRage * WARRIOR_RAGE.VIS_RING_PX));

  const warriorFrameStyle =
    classKey === "warrior"
      ? {
          boxShadow: `0 0 ${auraBlur}px rgba(239,68,68,${auraOpacity})`,
          outline:
            ringPx > 0
              ? `${ringPx}px solid rgba(239,68,68,${auraOpacity})`
              : "none",
          outlineOffset: ringPx > 0 ? "2px" : "0px",
          borderRadius: "12px",
          transition: "box-shadow 120ms linear, outline 120ms linear",
        }
      : undefined;

  const petAlive = classKey === "archer" && petMaxHP > 0 && petHP > 0;

  return (
    <div className="fixed inset-0 text-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={bg} alt="bg" className="w-full h-full object-cover" />
      </div>

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
          {/* MANA */}
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

          {/* ARCANE PICKER */}
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

          {/* PET FRAME BIG */}
          {classKey === "archer" && petMaxHP > 0 && (
            <div
              className="absolute z-[80] pointer-events-none"
              style={{ ...PET_UI.wrapperStyle, width: `${PET_SIZE}px` }}
            >
              <div className="relative" style={{ width: `${PET_SIZE}px` }}>
                {hpPopups
                  .filter((p) => p.target === "pet")
                  .map((p) => (
                    <HPPopup
                      key={p.id}
                      value={p.value}
                      isCrit={p.isCrit}
                      variant="pet"
                      onDone={() =>
                        setHPPopups((prev) =>
                          prev.filter((pp) => pp.id !== p.id)
                        )
                      }
                    />
                  ))}

                <div
                  className="rounded-xl bg-black/50"
                  style={{
                    width: `${PET_SIZE}px`,
                    height: `${PET_SIZE}px`,
                    overflow: "hidden", 
                    opacity: petHP <= 0 ? 0.45 : 1,
                    boxShadow: "0 0 14px rgba(0,0,0,0.7)",
                  }}
                >
                  <img
                    src="/ui/player/pet.png"
                    alt="pet"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div
                  className="relative mt-2 rounded-full overflow-hidden"
                  style={{
                    height: "14px",
                    width: `${PET_SIZE}px`,
                    background: "rgba(0,0,0,0.6)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${petMaxHP > 0 ? (petHP / petMaxHP) * 100 : 0}%`,
                      background: "red",
                      transition: "width 200ms",
                    }}
                  />

                  <div
                    className="absolute inset-0 flex items-center justify-center font-mono text-xs"
                    style={{
                      color: "white",
                      textShadow: "1px 1px 3px rgba(0,0,0,0.9)",
                      pointerEvents: "none",
                    }}
                  >
                    {petHP}/{petMaxHP}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PLAYER */}
          <div className="absolute top-24 left-[20%] -translate-x-1/2 z-10">
            <div
              className="relative inline-block rounded-xl overflow-hidden"
              style={warriorFrameStyle}
            >
              <EnemyFrame
                name={player.username || "Player"}
                hp={playerHP}
                maxHP={maxHPFromPlayer}
                image={classConfig.sprite}
                damaged={playerDamaged}
                healed={playerHealed}
              />

              {hpPopups
                .filter((p) => p.target === "player")
                .map((p) => (
                  <HPPopup
                    key={p.id}
                    value={p.value}
                    isCrit={p.isCrit}
                    variant={p.variant || "default"}
                    onDone={() =>
                      setHPPopups((prev) =>
                        prev.filter((pp) => pp.id !== p.id)
                      )
                    }
                  />
                ))}

              {/* kis pet badge */}
              {classKey === "archer" && petMaxHP > 0 && (
                <div className="absolute -right-28 bottom-2 w-24" style={{ zIndex: 20 }}>
                  <div className="relative rounded-lg overflow-hidden border border-black/50 bg-black/40">
                    <img
                      src={"/ui/player/player.png"}
                      alt="pet"
                      className="w-full h-16 object-cover opacity-95"
                    />

                    <div className="px-1 pb-1">
                      <div className="text-[10px] text-gray-100 font-mono">
                        Pet {petHP}/{petMaxHP}
                        {petTauntTurns > 0 ? ` • TAUNT ${petTauntTurns}` : ""}
                      </div>
                      <div className="h-2 w-full bg-black/60 rounded overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-200"
                          style={{
                            width: `${petMaxHP > 0 ? (petHP / petMaxHP) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {!petAlive && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px]">
                        DEAD
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ENEMY */}
          <div className="absolute top-24 left-[80%] -translate-x-1/2 z-10">
            <div className="relative">
              <EnemyFrame
                name={enemy?.name}
                hp={enemyHP}
                maxHP={enemy?.maxHp}
                image={enemyImage(enemy?.name)}
                damaged={enemyDamaged}
              />

              {hpPopups
                .filter((p) => p.target === "enemy")
                .map((p) => (
                  <HPPopup
                    key={p.id}
                    value={p.value}
                    isCrit={p.isCrit}
                    variant={p.variant || "default"}
                    onDone={() =>
                      setHPPopups((prev) =>
                        prev.filter((pp) => pp.id !== p.id)
                      )
                    }
                  />
                ))}
            </div>
          </div>

          {/* LOG */}
          <div className="absolute top-[62%] left-1/2 -translate-x-1/2 w-3/4 max-w-2xl bg-black/50 rounded p-4 h-48 overflow-y-auto font-mono text-sm z-10">
            {log.map((l, i) => (
              <div key={i} className="mb-1">
                {l}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* KÁRTYÁK (mindig látszik, enemy turn alatt csak disabled) */}
          {!battleOver && (
            <div
              className="absolute left-1/2 -translate-x-1/2 flex gap-4 z-50"
              style={{ bottom: "-80px" }}
            >
              {hand.map((card, slotIndex) => {
                if (!card) {
                  return (
                    <div
                      key={`empty-${slotIndex}`}
                      className="w-40 h-60 rounded-xl border-4 border-gray-700 bg-black/30"
                    />
                  );
                }

                const rs = rarityStyle[card.rarity] ?? rarityStyle.common;
                const imgSrc = card.image;

                // ✅ anim class: play / draw
                const animClass =
                  card._played
                    ? "card-anim-play"
                    : card._anim === "draw"
                    ? "card-anim-draw"
                    : "";

                // ✅ hover csak player turnben, és csak ha nem animál
                const allowHoverScale = turn === "player" && !card._played;
                return (
                  <button
                    key={card._instanceId}
                    onClick={() => playCardAt(slotIndex)}
                    disabled={turn !== "player" || card._played}
                    className={[
                    "relative w-40 h-60 rounded-xl overflow-hidden border-4",
                    rs.border,
                    rs.glow,
                    "transform transition-transform duration-200",
                    allowHoverScale ? "hover:scale-125" : "",
                    card._played ? "pointer-events-none opacity-90" : (turn !== "player" ? "opacity-90" : ""),
                    animClass,
                  ].join(" ")}
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
                          {card.petHeal ? ` • PetHeal ${card.petHeal}` : ""}
                        </div>
                      )}

                      {card.petTauntTurns ? (
                        <div className="text-[11px] text-emerald-200">
                          Pet Taunt: {card.petTauntTurns} turn
                        </div>
                      ) : null}

                      {card.evasionTurns ? (
                        <div className="text-[11px] text-cyan-200">
                          Evasion: {card.evasionTurns} turn
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* END */}
          {battleOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
              <div className="text-4xl mb-4">
                {playerHP <= 0 ? "☠️ Defeat..." : "🏆 Victory!"}
              </div>

              {lastRewards && (
                <div className="mb-2 text-sm text-gray-200">
                  Jutalom: +{lastRewards.goldGain} arany, +{lastRewards.xpGain} XP
                  {lastRewards.levelsGained > 0 &&
                    ` • +${lastRewards.levelsGained} szint, +${lastRewards.addedStatPoints} stat pont`}
                </div>
              )}

              <button
                onClick={() => {
                  if (continueLockRef.current) return;
                  continueLockRef.current = true;
                  setFadeOpen(true);
                }}
                className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-lg"
              >
                Continue
              </button>
            </div>
          )}

          <AbilityEffectLayer
            effects={abilityEffects}
            onEffectDone={(id) =>
              setAbilityEffects((prev) => prev.filter((fx) => fx.id !== id))
            }
          />
        </div>
      </div>

      {/* ✅ sima fade a Continue előtt */}
      <FadeOverlay
        isOpen={fadeOpen}
        onMid={() => {
          handleContinue();
        }}
        onDone={() => {
          setFadeOpen(false);
          continueLockRef.current = false;
        }}
        inMs={240}
        holdMs={140}
        outMs={280}
        maxOpacity={1}
      />
    </div>
  );
}
