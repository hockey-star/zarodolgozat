// frontend/src/components/CombatView.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";
import { getRandomEnemy } from "./enemyData";
import "./CombatView.css";
import EnemyFrame from "./EnemyFrame";
import HPPopup from "./HPPopup";
import AbilityEffectLayer from "./AbilityEffectLayer";

//tutorial
import CombatTutorialSpotlight from "./CombatTutorialSpotlight.jsx";

// ===== MAGE FX =====
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

// ===== WARRIOR FX =====
import warriorSlashFx from "../assets/effects/warrior_slash.webm";
import warriorCleaveFx from "../assets/effects/warrior_cleave.webm";
import warriorBattleCryFx from "../assets/effects/warrior_battle_cry.webm";
import warriorMortalStrikeFx from "../assets/effects/warrior_mortal_strike.webm";
import warriorWhirlwindFx from "../assets/effects/warrior_whirlwind.webm";
import warriorCrushingBlowFx from "../assets/effects/warrior_crushing_blow.webm";
import warriorParryFx from "../assets/effects/warrior_parry.webm";
import warriorShieldWallFx from "../assets/effects/warrior_shield_wall.webm";
import warriorLastStandFx from "../assets/effects/warrior_last_stand.webm";

// ✅ ÚJ: WARRIOR ENRAGE / AURA FX IMPORT
import warriorAura1 from "../assets/effects/warrior_aura_1.webm";
import warriorAura2 from "../assets/effects/warrior_aura_2.webm";
import warriorAura3 from "../assets/effects/warrior_aura_3.webm";

import {
  getClassKeyFromId,
  ABILITIES_BY_ID,
  buildDefaultDeckForClass,
} from "../data/abilities.js";

const BASE_UI_SCALE = 0.8;

const PET_UI = {
  wrapperStyle: {
    left: "20px",
    top: "700px",
  },
  buttonOffset: {
    bottom: "-70px",   // ⬅️ gomb lejjebb / feljebb
    left: "50%",       // vízszintes közép
    translateX: "-50%",
  },
};

const PET_SIZE = 300;
const ARCANE_CHOICES = [
  {
    id: "arcane_burst",
    name: "Arcane Burst",
    desc: "30% enemy maxHP",
    kind: "damage_percent",
    percent: 0.18,
    manaCost: 5,
    img: "/cards/common/spell_arcane_arcanepotency.jpg",
  },
  {
    id: "arcane_restore",
    name: "Arcane Restore",
    desc: "100% HEAL",
    kind: "full_heal",
    manaCost: 8,
    img: "/cards/common/spell_arcane_manatap.jpg",
  },
  {
    id: "arcane_cataclysm",
    name: "Arcane Cataclysm",
    desc: "VERY STRONG DMG",
    kind: "big_damage",
    manaCost: "ALL", // ✅ ez legyen ALL
    img: "/cards/common/ability_mage_firestarter.jpg",
  },
];

function xpToNextLevel(level) {
  if (level <= 1) return 30;
  return 30 + (level - 1) * 20;
}

function getMitigatedDamage(rawDamage, defense) {
  const def = Math.max(0, Number(defense) || 0);


  const reduction = Math.min(0.5, def / (def + 100));

  const reduced = Math.round(rawDamage * (1 - reduction));
  return Math.max(1, reduced);
}

function resolveBackground(background, pathType) {
  if (background) return background;
  if (pathType === "mystery") return "/backgrounds/2.jpg";
  if (pathType === "elite") return "/backgrounds/1.jpg";
  return "/backgrounds/3.jpg";
}

function resolveCardImageFromAbility(ab) {
  if (!ab) return "";
  if (typeof ab.image === "string" && ab.image.startsWith("/cards/")) return ab.image;
  if (ab.id && ab.rarity) return `/cards/${ab.rarity}/${ab.id}.png`;
  return "";
}

function getCardStaminaCost(card) {
  if (!card) return 99;

  // basic/common attack ingyenes
  if (card.type === "attack" && card.rarity === "common") return 0;

  // heal
  if (card.type === "heal") {
    if ((card.heal ?? 0) >= 30) return 3;
    return 2;
  }

  // defend / stun / evade / taunt
  if (
    card.type === "defend" ||
    (card.stunTurns ?? 0) > 0 ||
    (card.evasionTurns ?? 0) > 0 ||
    (card.petTauntTurns ?? 0) > 0
  ) {
    return 2;
  }

  // rarity fallback
  if (card.rarity === "epic") return 2;
  if (card.rarity === "rare") return 1;

  return 1;
}

const CLASS_CONFIG = {
  6: { key: "warrior", displayName: "Harcos", sprite: "/ui/player/player.png" },
  7: { key: "mage", displayName: "Varázsló", sprite: "/ui/player/varazslo.png" },
  8: { key: "archer", displayName: "Íjász", sprite: "/ui/player/ijasz.png" },
};

const DEFAULT_CLASS_CONFIG = { key: "warrior", displayName: "Harcos", sprite: "/ui/player/player.png" };

const CLASS_BOSS_MAP = {
  6: "Mountain King",
  7: "Arcane Abomination",
  8: "Forest Spirit Beast",
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

const WARRIOR_RAGE_CFG = {
  STAGES: {
    LOW: 0.75,     // 75% HP alatt aura1
    MEDIUM: 0.5,   // 50% HP alatt aura2
    HIGH: 0.25,    // 25% HP alatt aura3
  },
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

// ===== ENEMY KITS =====
// ✅ UTILITY FIX: az abilityk run() visszaadhat {consumesTurn:false}-t
const ENEMY_KITS = {
  Ghost: {
    abilities: [
      {
        id: "ghost_phase",
        name: "Phase",
        maxUses: 1,
        shouldUse: ({ enemyHP, enemyMaxHp }) =>
          enemyHP > 0 && enemyMaxHp > 0 && enemyHP / enemyMaxHp <= 0.5,
        run: ({ spawnAbilityEffect, pushLog, setEnemyInvulnTurns }) => {
          spawnAbilityEffect({
            src: manaShieldFx,
            target: "enemy_shield",
            width: "1000px",
            height: "1000px",
          });
          pushLog(`Ghost: Phase – sebezhetetlen 1 körre!`);
          setEnemyInvulnTurns(1);
          return { consumesTurn: false }; // ✅ utility, utána még üthet
        },
      },
    ],
  },

  "Lich Mage": {
    abilities: [
      {
        id: "lich_ice_lance",
        name: "Ice Lance",
        maxUses: 2,
        shouldUse: ({ playerWeakenTurns }) => playerWeakenTurns <= 0 && Math.random() < 0.35,
        run: ({ spawnAbilityEffect, pushLog, setPlayerWeakenTurns }) => {
          spawnAbilityEffect({
            src: icelance,
            target: "player",
            width: "1000px",
            height: "1050px",
          });
          pushLog(`Lich Mage: Ice Lance – Weaken (1 kör).`);
          setPlayerWeakenTurns(1);
          return { consumesTurn: false }; // ✅ utility, utána még üthet
        },
      },
      {
        id: "lich_guard",
        name: "Arcane Ward",
        maxUses: 1,
        shouldUse: ({ enemyHP, enemyMaxHp }) =>
          enemyHP > 0 && enemyMaxHp > 0 && enemyHP / enemyMaxHp <= 0.5,
        run: ({ spawnAbilityEffect, pushLog, setEnemyGuardHits }) => {
          spawnAbilityEffect({
            src: manaShieldFx,
            target: "enemy_shield",
            width: "1000px",
            height: "1000px",
          });
          pushLog(`Lich Mage: Arcane Ward – a következő találat csökkentve!`);
          setEnemyGuardHits(1);
          return { consumesTurn: false }; // ✅ utility, utána még üthet
        },
      },
    ],
  },

  Bandit: {
    abilities: [
      {
        id: "bandit_guard",
        name: "Guard",
        maxUses: 1,
        shouldUse: ({ enemyHP, enemyMaxHp }) =>
          enemyHP > 0 && enemyMaxHp > 0 && enemyHP / enemyMaxHp <= 0.4,
        run: ({ spawnAbilityEffect, pushLog, setEnemyGuardHits }) => {
          spawnAbilityEffect({
            src: manaShieldFx,
            target: "enemy_shield",
            width: "950px",
            height: "950px",
          });
          pushLog(`Bandit: Guard – a következő találat csökkentve!`);
          setEnemyGuardHits(1);
          return { consumesTurn: false }; // ✅ utility, utána még üthet
        },
      },
    ],
  },
};

function enemyImage(name) {
  if (!name) return "";
  return `/ui/enemies/${name.toLowerCase().replace(/ /g, "-")}.png`;
}

/* =========================================================
   ✅ SMART DRAW
   ========================================================= */

const SMART_DRAW = {
  HAND_SIZE: 4,
  RECENT_BLOCK: 6,
  MAX_SAME_IN_HAND: 1,
  PLAY_ANIM_MS: 320,
  DRAW_ANIM_MS: 320,
};

// ===== ENEMY TURN TIMING (állítható delay-ek) =====
// Enemy köre ennyi ms múlva indul a player akció után.
const ENEMY_TURN_DELAY_MS = 850;
// Basic attack VFX “lendítés” (sebzés ennyi ms múlva történik a VFX indítása után).
const ENEMY_BASIC_WINDUP_MS = 420;

const SMART_BIAS = {
  warrior: { HEAL_THRESHOLD: 0.65, PANIC_HP: 0.35, DEFEND_AFTER_TURNS: 3, PANIC_DEFENSIVE_CHANCE: 0.7, PANIC_STUN_CHANCE: 0.3, MAX_HEAL_IN_HAND: 1, MAX_HEAL_IN_HAND_LOWHP: 2, LOWHP_FOR_2HEAL: 0.3 },
  mage: { HEAL_THRESHOLD: 0.72, PANIC_HP: 0.45, DEFEND_AFTER_TURNS: 3, PANIC_DEFENSIVE_CHANCE: 0.55, PANIC_STUN_CHANCE: 0.25, MAX_HEAL_IN_HAND: 1, MAX_HEAL_IN_HAND_LOWHP: 2, LOWHP_FOR_2HEAL: 0.3 },
  archer: { HEAL_THRESHOLD: 0.7, PANIC_HP: 0.5, DEFEND_AFTER_TURNS: 3, PANIC_DEFENSIVE_CHANCE: 0.6, PANIC_STUN_CHANCE: 0.4, MAX_HEAL_IN_HAND: 1, MAX_HEAL_IN_HAND_LOWHP: 2, LOWHP_FOR_2HEAL: 0.3 },
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
  const healChance = isPanic ? 0.55 : healNeed ? 0.35 : 0.0;
  const defensiveChance = isPanic ? bias.PANIC_DEFENSIVE_CHANCE : 0.12;

  if (isPanic && Math.random() < defensiveChance) {
    preferred = "defensive";
  } else if (canHeal && Math.random() < healChance) {
    preferred = "heal";
  } else if (turnsSinceDefend >= bias.DEFEND_AFTER_TURNS && canDef && Math.random() < 0.45) {
    preferred = "defend";
  } else if (canAtk) {
    preferred = "attack";
  }

  const maxHealInHand =
    hpRatio <= bias.LOWHP_FOR_2HEAL ? bias.MAX_HEAL_IN_HAND_LOWHP : bias.MAX_HEAL_IN_HAND;

  if (preferred === "heal") {
    const healCount = handSoFar.filter((c) => c && !c._played && c.type === "heal").length;
    if (healCount >= maxHealInHand) preferred = null;
  }

  if (preferred === "defensive") {
    return (
      pickDefensiveSmart({ pool, handSoFar, recentIds, stunChance: bias.PANIC_STUN_CHANCE }) ||
      pickCardSmart({ pool, wantType: null, handSoFar, recentIds, maxSameInHand: SMART_DRAW.MAX_SAME_IN_HAND })
    );
  }

  return (
    pickCardSmart({ pool, wantType: preferred, handSoFar, recentIds, maxSameInHand: SMART_DRAW.MAX_SAME_IN_HAND }) ||
    pickCardSmart({ pool, wantType: null, handSoFar, recentIds, maxSameInHand: SMART_DRAW.MAX_SAME_IN_HAND })
  );
}

function makeCardInstance(baseCard, anim = null) {
  return { ...baseCard, _instanceId: uid(), _played: false, _anim: anim };
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
   ✅ SIMPLE FADE OVERLAY
   ========================================================= */
function FadeOverlay({ isOpen, onMid, onDone, inMs = 220, holdMs = 120, outMs = 260, maxOpacity = 1 }) {
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

  const opacity = phase === "in" ? maxOpacity : phase === "hold" ? maxOpacity : phase === "out" ? 0 : 0;
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
function TutorialOverlay({ open, step, steps, onNext, onSkip }) {
  if (!open || step <= 0) return null;
  const s = steps?.[step];
  if (!s) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/70" />

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[min(900px,95vw)] bg-[#0b0b0b] border-4 border-black shadow-[0_0_0_2px_#3d0a0a,0_20px_50px_rgba(0,0,0,0.9)] p-6 text-white">
        <div className="text-3xl font-black tracking-widest pixel-text-sharp">{s.title}</div>
        <div className="mt-2 text-xl opacity-90 pixel-text-sharp">{s.text}</div>

        <div className="mt-5 flex gap-3 justify-end">
          <button
            onClick={onSkip}
            className="px-6 py-2 bg-black/40 border-2 border-[#5e0a0a] hover:bg-[#2a0505] pixel-text-sharp text-xl"
          >
            Skip
          </button>
          <button
            onClick={onNext}
            className="px-6 py-2 bg-[#2a0505] border-2 border-[#5e0a0a] hover:bg-[#3d0a0a] pixel-text-sharp text-xl"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}


// Optional prop: `playerHP` can be passed from the parent (e.g. GameController).
// If provided, CombatView will prefer it over sessionStorage when initializing HP,
// and it will also sync it into sessionStorage. This prevents starting every combat
// from an old stored low HP value after you full-heal in the Hub.
export default function CombatView({
  
  level = 1,
  boss = false,
  enemies = [],
  background,
  pathType = "fight",
  onEnd,
  wave = 1,
  maxWaves = 16,
  playerHP: playerHPProp,
   runEffect,
   mode ="run",
  battleId = 0,
}) {
  const {
    player,
    setPlayer,
    mageMana,
    setMageMana,
    derivedStats,
    refreshFullStats,
    gainMageMana,
    spendAllMageMana,
    MAGE_MANA_MAX: CTX_MAGE_MANA_MAX,
  } = usePlayer() || {};

  // hp max elsőnek
  const firstInitRef = useRef(true);

  // ✅ HP persistence guard (sessionStorage)
  const hpHydratedRef = useRef(false);

  // ✅ ANCHOR REF-ek a VFX-hez
  const combatRootRef = useRef(null);
  // ✅ Megakadályozza, hogy reward miatti player-frissítés újrainitálja a wave-et
  const hasInitializedWave = useRef(-1);
  // ✅ runEffect később is megérkezhet (async), ezt külön kezeljük, ne az initBattle-t triggerelje
    // ✅ runEffect alkalmazás guard: nem csak wave alapján, mert lehet ugyanazon a wave-en belül új "utazás"
  // (pl. pihenés/halál után), illetve a runEffect érkezhet async.
  const appliedRunEffectKeyRef = useRef(null);
  const playerAnchorRef = useRef(null);
  const enemyAnchorRef = useRef(null);

  // ✅ VFX tracking + clear all
  function clearAllVfx() {
  setAbilityEffects([]);      // ✅ minden effect törlés (loop is!)
  setActiveAuraId(null);
  setCurrentAuraSrc(null);
}


  // ✅ timeout tracking
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

  const [turn, setTurn] = useState("player");
  const initialHPFromPlayer = derivedStats?.hp ?? player?.hp ?? 100;
  const maxHPFromPlayer = derivedStats?.max_hp ?? player?.max_hp ?? initialHPFromPlayer;
  const [playerHP, setPlayerHP] = useState(initialHPFromPlayer);

  const PLAYER_MAX_STAMINA = 3;
  const [playerStamina, setPlayerStamina] = useState(PLAYER_MAX_STAMINA);

  // =========================
// CLEAN COMBAT TUTORIAL (RESET VERSION)
// =========================
const [tutStep, setTutStep] = useState(0);
const [tutOpen, setTutOpen] = useState(false);

const tutEnemyRef = useRef(null);
const tutLogRef = useRef(null);
const tutHandRef = useRef(null);
const tutExtraRef = useRef(null); // mana vagy pet
const tutPlayerRef = useRef(null);

const tutBlocking = tutOpen && tutStep > 0;


const allowHand = !tutBlocking || tutStep === 3;
const allowExtra = !tutBlocking || tutStep === 4; // mana/pet step

useEffect(() => {
  if (!player?.id) return;
  const key = `combat_tutorial_done_${player.id}`;
  const done = localStorage.getItem(key) === "1";

  // csak akkor nyit, ha még nem volt meg
  if (!done) {
    setTutOpen(true);
    setTutStep(1);
  } else {
    setTutOpen(false);
    setTutStep(0);
  }
}, [player?.id]);

function finishTutorial() {
  if (player?.id)
    localStorage.setItem(`combat_tutorial_done_${player.id}`, "1");

  // overlay fade-out


  setTutOpen(false);
  setTutStep(0);
}

function skipTutorial() {
  finishTutorial();
}

  // ✅ RUN HP PERSIST (sessionStorage) — B-E megoldás
  const hpStoreKey = player?.id ? `adventure_hp_${player.id}` : null;

  function readStoredHP() {
    if (!hpStoreKey) return null;
    const raw = sessionStorage.getItem(hpStoreKey);
    const n = raw == null ? null : Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  // ✅ Persist current HP into sessionStorage (so it survives wave-to-wave remounts)
  useEffect(() => {
    if (!hpStoreKey) return;
    if (!hpHydratedRef.current) return; // don't overwrite before we loaded once
    if (battleOverRef.current) return;

    const clamped = Math.max(0, Math.min(playerHP, maxHPFromPlayer));
    writeStoredHP(clamped);
  }, [playerHP, maxHPFromPlayer, hpStoreKey]);

  function writeStoredHP(hp) {
    if (!hpStoreKey) return;
    sessionStorage.setItem(hpStoreKey, String(hp));
  }

  function clearStoredHP() {
    if (!hpStoreKey) return;
    sessionStorage.removeItem(hpStoreKey);
  }

  // ❌ FONTOS: ezt kivettük, mert battleOver/end állapotban visszahúzta a HP-t derivedStats.hp-ra (ami nálad max HP)
  // useEffect(() => {
  //   if (turn !== "player" && turn !== "enemy") {
  //     const hp = derivedStats?.hp ?? player?.hp;
  //     if (hp != null) setPlayerHP(hp);
  //   }
  // }, [derivedStats?.hp, player?.hp, turn]);

  const classConfig = useMemo(() => {
    if (!player?.class_id) return DEFAULT_CLASS_CONFIG;
    return CLASS_CONFIG[player.class_id] || DEFAULT_CLASS_CONFIG;
  }, [player?.class_id]);

  const classKey = useMemo(() => getClassKeyFromId(player?.class_id), [player?.class_id]);

  const [enemy, setEnemy] = useState(null);
  const [enemyHP, setEnemyHP] = useState(0);
  const [battleOver, setBattleOver] = useState(false);
  const [defending, setDefending] = useState(false);

  const [pendingEnemies, setPendingEnemies] = useState([]); // chain battle queue

  // ✅ battleOver ref
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
    clearAllVfx(); 
    clearAllTimers();
  };

  const [arcanePickerOpen, setArcanePickerOpen] = useState(false);

  const [petHP, setPetHP] = useState(0);
  const [petMaxHP, setPetMaxHP] = useState(0);
  const [petTauntTurns, setPetTauntTurns] = useState(0);

  // ✅ Archer: Pet Taunt cooldown (player körökben)
const PET_TAUNT_COOLDOWN_TURNS = 3;   // ennyi player kör után tölthető újra
const PET_TAUNT_DEFAULT_TURNS = 2;    // maga a taunt ennyi enemy körig tart (nálad most 2)

const [petTauntCd, setPetTauntCd] = useState(0);
const petTauntCdRef = useRef(0);
useEffect(() => { petTauntCdRef.current = petTauntCd; }, [petTauntCd]);

  // ✅ SMART DRAW
  const [combatPool, setCombatPool] = useState([]);
  const [hand, setHand] = useState([null, null, null, null]);
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState([]);
  const [turnsSinceHeal, setTurnsSinceHeal] = useState(0);
  const [turnsSinceDefend, setTurnsSinceDefend] = useState(0);

  const [pendingReplaces, setPendingReplaces] = useState([null, null, null, null]);

  // ✅ refs (stale state ellen)
  const handRef = useRef(hand);
  useEffect(() => { handRef.current = hand; }, [hand]);

  const recentlyRef = useRef(recentlyPlayedIds);
  useEffect(() => { recentlyRef.current = recentlyPlayedIds; }, [recentlyPlayedIds]);

  const turnsHealRef = useRef(turnsSinceHeal);
  useEffect(() => { turnsHealRef.current = turnsSinceHeal; }, [turnsSinceHeal]);

  const turnsDefRef = useRef(turnsSinceDefend);
  useEffect(() => { turnsDefRef.current = turnsSinceDefend; }, [turnsSinceDefend]);

  const playerHPRef = useRef(playerHP);
  useEffect(() => { playerHPRef.current = playerHP; }, [playerHP]);

  const enemyHPRef = useRef(enemyHP);
  useEffect(() => { enemyHPRef.current = enemyHP; }, [enemyHP]);

  const pendingRef = useRef(pendingReplaces);
  useEffect(() => { pendingRef.current = pendingReplaces; }, [pendingReplaces]);

  const [hpPopups, setHPPopups] = useState([]);
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [playerHealed, setPlayerHealed] = useState(false);
  const [enemyDamaged, setEnemyDamaged] = useState(false);

  const [abilityEffects, setAbilityEffects] = useState([]);
  const [activeAuraId, setActiveAuraId] = useState(null);
  const [currentAuraSrc, setCurrentAuraSrc] = useState(null);
  const logEndRef = useRef(null);
  const enemyKillSentRef = useRef(false);


  // ✅ DOM-anchored VFX spawn (targetenként offsettel) + loop + RETURN ID
  function spawnAbilityEffect({ src, target = "center", width, height, loop = false }) {
    const id = Date.now() + Math.random();

    const root = combatRootRef.current;
    const playerEl = playerAnchorRef.current;
    const enemyEl = enemyAnchorRef.current;

    let pos = null;

    if (root) {
      const rootRect = root.getBoundingClientRect();

      const centerOf = (el) => {
        const r = el.getBoundingClientRect();
        return {
          x: r.left + r.width / 2 - rootRect.left,
          y: r.top + r.height / 2 - rootRect.top,
        };
      };

      if (target === "player" || target === "player_shield") {
        if (playerEl) pos = centerOf(playerEl);
      } else if (target.startsWith("enemy")) {
        if (enemyEl) pos = centerOf(enemyEl);
      } else {
        pos = { x: rootRect.width / 2, y: rootRect.height / 2 };
      }

      const OFFSETS = {
        player: { x: 90, y: 110 },
        player_shield: { x: 90, y: 90 },
        enemy: { x: 0, y: 35 },
        enemy_hit: { x: -2, y: 50 },
        enemy_aoe: { x: 360, y: 100 },
        enemy_stun: { x: 350, y: -150 },
        enemy_shield: { x: 350, y: 90 },
      };

      const o = OFFSETS[target] || { x: 0, y: 0 };
      pos = { x: pos.x + o.x, y: pos.y + o.y };
    }

    setAbilityEffects((prev) => [...prev, { id, src, target, width, height, pos, loop }]);

    return id; // ✅ ettől fog működni az aura ID
  }

  const [playerDamageBuff, setPlayerDamageBuff] = useState(null);
  const [enemyPoison, setEnemyPoison] = useState(null);
  const [enemyBurn, setEnemyBurn] = useState(null);
  const [enemyStun, setEnemyStun] = useState(0);
  
  const [enemyVulnerability, setEnemyVulnerability] = useState(null);
  const [enemyBleed, setEnemyBleed] = useState(null);
  const [playerEvasionTurns, setPlayerEvasionTurns] = useState(0);
  const [playerPoison, setPlayerPoison] = useState(null);
  const [enemyStunImmuneTurns, setEnemyStunImmuneTurns] = useState(0);
  const enemyStunImmuneTurnsRef = useRef(0);

const setEnemyStunImmuneTurnsSync = (v) => {
  enemyStunImmuneTurnsRef.current = v;
  setEnemyStunImmuneTurns(v);
};
useEffect(() => {
  enemyStunImmuneTurnsRef.current = enemyStunImmuneTurns;
  debugStun("IMMUNITY STATE CHANGED");
}, [enemyStunImmuneTurns]);

const playerPoisonRef = useRef(null);
useEffect(() => {
  playerPoisonRef.current = playerPoison;
}, [playerPoison]);

  // ===== ENEMY ABILITY STATE =====
  const [enemyGuardHits, setEnemyGuardHits] = useState(0);
  const [enemyInvulnTurns, setEnemyInvulnTurns] = useState(0);
  const [enemyFrenzyTurns, setEnemyFrenzyTurns] = useState(0);
  const [playerWeakenTurns, setPlayerWeakenTurns] = useState(0);



  // ✅ AFFIX: Shielded (spawnkor guardot ad)


  const enemyGuardHitsRef = useRef(0);
  useEffect(() => { enemyGuardHitsRef.current = enemyGuardHits; }, [enemyGuardHits]);

  const enemyInvulnTurnsRef = useRef(0);
  useEffect(() => { enemyInvulnTurnsRef.current = enemyInvulnTurns; }, [enemyInvulnTurns]);

  const enemyFrenzyTurnsRef = useRef(0);
  useEffect(() => { enemyFrenzyTurnsRef.current = enemyFrenzyTurns; }, [enemyFrenzyTurns]);

  const playerWeakenTurnsRef = useRef(0);
  useEffect(() => { playerWeakenTurnsRef.current = playerWeakenTurns; }, [playerWeakenTurns]);


  const setEnemyGuardHitsSync = (v) => { enemyGuardHitsRef.current = v; setEnemyGuardHits(v); };
  const setEnemyInvulnTurnsSync = (v) => { enemyInvulnTurnsRef.current = v; setEnemyInvulnTurns(v); };
  const setEnemyFrenzyTurnsSync = (v) => { enemyFrenzyTurnsRef.current = v; setEnemyFrenzyTurns(v); };
  const setPlayerWeakenTurnsSync = (v) => { playerWeakenTurnsRef.current = v; setPlayerWeakenTurns(v); };

  const enemyUsesRef = useRef({});

  const [log, setLog] = useState([]);
  const [lastRewards, setLastRewards] = useState(null);


function debugStun(label, extra = {}) {
  console.log("[STUN DEBUG]", label, {
    enemyName: enemy?.name,
    turn,
    enemyStun,
    enemyStunImmuneTurns,
    enemyStunRef: enemyStunImmuneTurnsRef.current,
    battleOver: battleOverRef.current,
    ...extra,
  });
}

  const bg = useMemo(() => resolveBackground(background, pathType), [background, pathType]);

  const rarityStyle = {
    common: { border: "border-gray-600", glow: "hover:shadow-[0_0_20px_6px_rgba(156,163,175,0.8)]" },
    rare: { border: "border-blue-500", glow: "hover:shadow-[0_0_25px_8px_rgba(59,130,246,0.9)]" },
    epic: { border: "border-purple-500", glow: "hover:shadow-[0_0_30px_10px_rgba(168,85,247,1)]" },
    legendary: { border: "border-yellow-500", glow: "hover:shadow-[0_0_35px_12px_rgba(234,179,8,1)]" },
  };

// ✅ LOG BATCHING (smooth UI)
const logBufferRef = useRef([]);
const logFlushTimerRef = useRef(null);

function flushLogBuffer() {
  const batch = logBufferRef.current;
  if (!batch.length) return;

  logBufferRef.current = [];

  setLog((prev) => {
    // dupe guard (a batch első elemére a prev végével)
    let next = prev;
    for (const msg of batch) {
      const last = next[next.length - 1];
      if (last !== msg) next = [...next, msg];
    }
    // csak az utolsó N sor maradjon (stabil + gyors)
    return next.slice(-30);
  });
}

function pushLog(msg) {
  // bufferbe rakjuk
  logBufferRef.current.push(msg);

  // egyszer ütemezünk flush-t
  if (!logFlushTimerRef.current) {
    logFlushTimerRef.current = setTimeout(() => {
      logFlushTimerRef.current = null;
      flushLogBuffer();
    }, 180); // 150-250ms jó tartomány, ez smooth-olja
  }
}
function getLogColorClass(msg) {
  if (!msg) return "text-[#d1c7a7]";
  const m = msg.toLowerCase();

  // --- KRITIKUS / KIVÉGZÉS (Arany) ---
  if (m.includes("[crit]") || m.includes("crushing blow") || m.includes("győzelem")) {
    return "text-[#facc15]";
  }

  // --- BERSERKER / RAGE / BATTLE CRY (Lila/Fukszia) ---
  if (m.includes("berserker") || m.includes("rage") || m.includes("battle cry") || m.includes("rage") || m.includes("mortal strike")) {
    return "text-[#d8b4fe]";
  }

  // --- SEBZÉS / HIT / BLEED (Élénkvörös) ---
  if (m.includes("[hit]") || m.includes("sebzés") || m.includes("támad") || m.includes("slash") || m.includes("cleave")) {
    return "text-[#ef4444]";
  }

  // --- MÁGIA / ARCANE / DRAIN (Lila-Kék) ---
  if (m.includes("arcane") || m.includes("drain") || m.includes("mana") || m.includes("missiles")) {
    return "text-[#a78bfa]";
  }

  // --- MÉREG / GYÓGYNÖVÉNYEK (Zöld) ---
  if (m.includes("poison") || m.includes("méreg") || m.includes("herbs") || m.includes("mend")) {
    return "text-[#84cc16]";
  }

  // --- ÉGÉS (Narancs) ---
  if (m.includes("burn") || m.includes("fire") || m.includes("égés") || m.includes("fireball")) {
    return "text-[#f97316]";
  }

  // --- FAGY / STUN / KITÉRÉS (Jégkék) ---
  if (m.includes("ice") || m.includes("fagy") || m.includes("stun") || m.includes("evasion") || m.includes("snare") || m.includes("kábít")) {
    return "text-[#22d3ee]";
  }

  // --- VÉDEKEZÉS / PAJZS (Kék) ---
  if (m.includes("védekezés") || m.includes("shield") || m.includes("parry") || m.includes("ward")) {
    return "text-[#60a5fa]";
  }

  // --- GYÓGYÍTÁS (Smaragd) ---
  if (m.includes("heal") || m.includes("gyógy") || m.includes("restore") || m.includes("rallying")) {
    return "text-[#10b981]";
  }

  // Alapértelmezett pergamen szín
  return "text-[#d1c7a7]";
}


// unmount cleanup (nehogy lógjon timer)
useEffect(() => {
  return () => {
    if (logFlushTimerRef.current) clearTimeout(logFlushTimerRef.current);
    logFlushTimerRef.current = null;
    logBufferRef.current = [];
  };
}, []);

  function canUseEnemyAbility(abilityId, maxUses) {
    const used = enemyUsesRef.current?.[abilityId] || 0;
    return used < (maxUses ?? 0);
  }
  function markEnemyAbilityUsed(abilityId) {
    enemyUsesRef.current[abilityId] = (enemyUsesRef.current[abilityId] || 0) + 1;
  }

  // ✅ UTILITY FIX: tryEnemyAbilityAction visszaadja, hogy fogyaszt-e kört
  function tryEnemyAbilityAction() {
    if (!enemy?.name) return { used: false, consumesTurn: true };

    const kit = ENEMY_KITS[enemy.name];
    if (!kit?.abilities?.length) return { used: false, consumesTurn: true };

    const ctx = {
      enemyHP: enemyHPRef.current,
      enemyMaxHp: enemy?.maxHp,
      playerHP: playerHPRef.current,
      playerMaxHp: maxHPFromPlayer,
      playerWeakenTurns: playerWeakenTurnsRef.current,
    };

    for (const ab of kit.abilities) {
      const okTrigger = ab.shouldUse ? ab.shouldUse(ctx) : false;
      const okUses = canUseEnemyAbility(ab.id, ab.maxUses);

      if (okTrigger && okUses) {
        markEnemyAbilityUsed(ab.id);

        const res = ab.run({
          spawnAbilityEffect,
          pushLog,
          setEnemyInvulnTurns: setEnemyInvulnTurnsSync,
          setEnemyGuardHits: setEnemyGuardHitsSync,
          setEnemyFrenzyTurns: setEnemyFrenzyTurnsSync,
          setPlayerWeakenTurns: setPlayerWeakenTurnsSync,
        });

        const consumesTurn = res?.consumesTurn !== false; // default: true
        return { used: true, consumesTurn };
      }
    }

    return { used: false, consumesTurn: true };
  }

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
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
    } else if (target === "player") {
      setPlayerHealed(true);
      trackTimeout(setTimeout(() => setPlayerHealed(false), 400));
    }
  }

  function enemyVampiricHeal(amountDealt) {
  const vamp = enemy?.affixes?.find(a => a.id === "vampiric");
  if (!vamp) return;
  if (enemyHPRef.current <= 0) return;

  const pct = vamp.healPct ?? 0.3;
  const heal = Math.max(1, Math.floor(amountDealt * pct));
  if (heal <= 0) return;

  setEnemyHP((prev) => {
    const newHP = Math.min(enemy.maxHp, prev + heal);
    addHPPopup(+heal, "enemy");
    pushLog(`${enemy.name} [Vampiric] – +${heal} HP.`);
    return newHP;
  });
}

  useEffect(() => () => clearAllTimers(), []);

  useEffect(() => {
    if (!player || !setPlayer) return;
    if (Array.isArray(player.deck) && player.deck.length > 0) return;
    const baseDeck = buildDefaultDeckForClass(classKey);
    setPlayer((prev) => ({ ...(prev || {}), deck: baseDeck }));
  }, [player, setPlayer, classKey]);

  function resolvePendingReplaces() {
    if (battleOverRef.current) return;

    const pending = pendingRef.current;
    if (!pending || !pending.some(Boolean)) return;

    const hpRatio = maxHPFromPlayer > 0 ? playerHPRef.current / maxHPFromPlayer : 1;

    let workingHand = [...handRef.current];
    let workingRecent = [...recentlyRef.current];

    let nextTurnsHeal = turnsHealRef.current;
    let nextTurnsDef = turnsDefRef.current;

    pending.forEach((justPlayedCard, slotIndex) => {
      if (!justPlayedCard) return;

      const nextRecent = [justPlayedCard.abilityId, ...workingRecent].slice(0, SMART_DRAW.RECENT_BLOCK);

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

      if (nextPicked?.type === "heal") nextTurnsHeal = 0;
      else nextTurnsHeal += 1;

      if (nextPicked?.type === "defend") nextTurnsDef = 0;
      else nextTurnsDef += 1;

      const nextCard = nextPicked ? makeCardInstance(nextPicked, "draw") : null;

      workingHand[slotIndex] = nextCard;
      workingRecent = nextRecent;

      if (nextCard) {
        trackTimeout(
          setTimeout(() => {
            if (battleOverRef.current) return;
            setHand((prev) => {
              const copy = [...prev];
              const c = copy[slotIndex];
              if (c && c._instanceId === nextCard._instanceId) copy[slotIndex] = { ...c, _anim: null };
              return copy;
            });
          }, SMART_DRAW.DRAW_ANIM_MS)
        );
      }
    });

    setHand(workingHand);
    setRecentlyPlayedIds(workingRecent);
    setTurnsSinceHeal(nextTurnsHeal);
    setTurnsSinceDefend(nextTurnsDef);

    handRef.current = workingHand;
    recentlyRef.current = workingRecent;
    turnsHealRef.current = nextTurnsHeal;
    turnsDefRef.current = nextTurnsDef;

    const empty = [null, null, null, null];
    setPendingReplaces(empty);
    pendingRef.current = empty;
  }
function finishEnemyTurnToPlayer({ staminaMode = "normal" } = {}) {
  if (enemyFrenzyTurnsRef.current > 0) {
    const next = Math.max(0, enemyFrenzyTurnsRef.current - 1);
    enemyFrenzyTurnsRef.current = next;
    setEnemyFrenzyTurns(next);
    if (next <= 0) pushLog("[HIT] Frenzy elmúlt.");
  }

  if (enemyStunImmuneTurnsRef.current > 0) {
    const nextImmune = Math.max(0, enemyStunImmuneTurnsRef.current - 1);
    setEnemyStunImmuneTurnsSync(nextImmune);
  }

  resolvePendingReplaces();
  setDefending(false);

  if (classKey === "archer") {
    setPetTauntCd((prev) => Math.max(0, (prev || 0) - 1));
  }

  setPlayerStamina((prev) => {
    if (staminaMode === "normal") {
      return Math.min(PLAYER_MAX_STAMINA, prev + 1);
    }

    if (staminaMode === "stun-skip") {
      return Math.max(1, prev);
    }

    return prev;
  });

  setTurn("player");
}

  useEffect(() => {
    if (!player) return;
    // ✅ Ha ehhez a wave-hez már egyszer lefutott az init, ne induljon újra (pl. XP/gold refresh miatt)
    if (hasInitializedWave.current === wave) return;


    async function initBattle() {
      // megjelöljük, hogy ez a wave inicializálva van
      hasInitializedWave.current = wave;
      clearAllTimers();
      clearAllVfx();
      // ✅ RUN HP: ha van mentett HP (és >0), onnan indulunk, különben max HP
      // (mount/unmount esetén sem resetel maxra)
      if (firstInitRef.current) {
        const propHp = Number.isFinite(Number(playerHPProp)) ? Number(playerHPProp) : null;
        const stored = readStoredHP();

        // Priority: parent-provided HP (e.g. hub full-heal) -> sessionStorage -> maxHP
        const startHpRaw =
          propHp != null && propHp > 0
            ? propHp
            : stored != null && stored > 0
            ? stored
            : maxHPFromPlayer;

        const startHp = Math.max(0, Math.min(startHpRaw, maxHPFromPlayer));

        setPlayerHP(startHp);
        playerHPRef.current = startHp;

        // mark hydrated + sync storage immediately so strict-mode remount can't reset us
        hpHydratedRef.current = true;
        writeStoredHP(startHp);

        firstInitRef.current = false;
      }

      try {
        clearAllTimers();

        const isQuest = mode === "quest";
        let isElite = !boss && pathType === "elite";
        let allowedNames = Array.isArray(enemies) ? enemies : [];


        if (boss && player.id) {
          try {
            const res = await fetch(`https://nodejs202.dszcbaross.edu.hu/api/quests/${player.id}`);
            const data = await res.json();

          const activeClassQuest = data.find(
            (q) => q.status === "in_progress" && q.class_required != null
          );

          if (activeClassQuest) {
            const classId = activeClassQuest.class_required; // 6/7/8
            const bossName = CLASS_BOSS_MAP[classId];        // MAP legyen int kulcsú
            allowedNames = [bossName];
          }
          } catch (err) {
            console.error("Class quest boss check error:", err);
          }
        }


        // ===== CHAIN BATTLE: több enemy egymás után ugyanabban a wave-ben (NEM boss, NEM elite) =====
let enemyCount = 1;

// ✅ CHAIN BATTLE csak run módban
if (!isQuest && !boss && !isElite && pathType === "fight") {
  const roll = Math.random();
  if (roll > 0.80) enemyCount = 3;
  else if (roll > 0.50) enemyCount = 2;
}

// ✅ questnél: ha küldesz több enemy-t, lehet queue (de random ne legyen)
if (isQuest && Array.isArray(enemies) && enemies.length > 1) {
  enemyCount = enemies.length;
}


const generatedEnemies = [];
for (let i = 0; i < enemyCount; i++) {
  const enemyData = getRandomEnemy({ level, boss, elite: isElite, allowedNames });

  generatedEnemies.push({
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
    affixes: enemyData.affixes || [],
    _uniqueId: uid(),
  });
}

const currentEnemy = generatedEnemies[0];
const remainingEnemies = generatedEnemies.slice(1);
setEnemy(currentEnemy);
setEnemyHP(currentEnemy.maxHp);
enemyHPRef.current = currentEnemy.maxHp;

setPendingEnemies(remainingEnemies);

battleOverRef.current = false;
setBattleOver(false);
setTurn("player");
setDefending(false);
setArcanePickerOpen(false);
setPlayerStamina(PLAYER_MAX_STAMINA);

if (remainingEnemies.length > 0) {
  setLog([`${currentEnemy.name} megtámadott! (ERŐSÍTÉS: +${remainingEnemies.length} ellenség közeleg...)`]);
} else {
  setLog([`A ${currentEnemy.name} kihívott téged!`]);
}
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
        setPlayerPoison(null);

        setEnemyGuardHitsSync(0);
        setEnemyInvulnTurnsSync(0);
        setEnemyFrenzyTurnsSync(0);
        setPlayerWeakenTurnsSync(0);
        setEnemyStunImmuneTurnsSync(0);
        debugStun("RESET IMMUNITY IN initBattle", { to: 0 });
        enemyUsesRef.current = {};

            if (classKey === "archer") {
        const max = Math.floor(maxHPFromPlayer * PET_CFG.HP_RATIO);
        setPetMaxHP(max);
        setPetHP(max);
        setPetTauntTurns(0);

        setPetTauntCd(0);
        petTauntCdRef.current = 0;
      } else {
        setPetMaxHP(0);
        setPetHP(0);
        setPetTauntTurns(0);

        setPetTauntCd(0);
        petTauntCdRef.current = 0;
      }

        const pool = buildCombatPoolFromPlayer(player, classKey);
        setCombatPool(pool);

        setRecentlyPlayedIds([]);
        recentlyRef.current = [];

        setTurnsSinceHeal(0);
        turnsHealRef.current = 0;

        setTurnsSinceDefend(0);
        turnsDefRef.current = 0;

        const empty = [null, null, null, null];
        setPendingReplaces(empty);
        pendingRef.current = empty;

        const hpRatio = maxHPFromPlayer > 0 ? playerHPRef.current / maxHPFromPlayer : 1;
        const initialHand = createInitialHand({ pool, hpRatio, recentIds: [], classKey });

        setHand(initialHand);
        trackTimeout(
          setTimeout(() => {
            if (battleOverRef.current) return;
            setHand((prev) => prev.map((c) => (c ? { ...c, _anim: null } : c)));
          }, SMART_DRAW.DRAW_ANIM_MS)
        );
        handRef.current = initialHand;
      } catch (err) {
        console.error("Enemy init error:", err);
      }
    }

    initBattle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, boss, pathType, classKey, wave, player?.id]);

  // ✅ RUN EFFECT: ne az initBattle-t resetelje, hanem külön fusson le akkor is, ha később érkezik meg.
  // Tipikus bug: chain-battle + reward refresh frissíti a player-t, ezért wave guard van,
  // de ettől még a runEffect async módon később bejöhet – ezt itt kapjuk el.
  useEffect(() => {
    if (!player) return;

    // ha még nincs runEffect, várunk (pl. parent async setState)
    if (!runEffect) return;

    // ✅ Guard kulcs: wave + runEffect "aláírás"
    let sig = runEffect?.id ?? runEffect?.key ?? null;
    if (sig == null) {
      try {
        sig = JSON.stringify(runEffect);
      } catch {
        sig = String(runEffect);
      }
    }
    const key = `${wave}:${sig}`;

    if (appliedRunEffectKeyRef.current === key) return;
    appliedRunEffectKeyRef.current = key;

    // --- alkalmazás ---
    if (runEffect?.poisonTurns && runEffect.poisonTurns > 0) {
      setPlayerPoison({
        damagePerTurn: runEffect.poisonDmg ?? 3,
        remainingTurns: runEffect.poisonTurns,
      });
      pushLog(`Utazási event: megmérgeződtél (${runEffect.poisonTurns} kör).`);
    }
  }, [runEffect, wave, player]);

  useEffect(() => {
    if (classKey !== "warrior" || playerHP <= 0 || battleOver) {
      if (activeAuraId) {
        setAbilityEffects(prev => prev.filter(e => e.id !== activeAuraId));
        setActiveAuraId(null);
        setCurrentAuraSrc(null);
      }
      return;
    }

    const hpRatio = playerHP / maxHPFromPlayer;
    let nextAuraSrc = null;

    if (hpRatio <= WARRIOR_RAGE_CFG.STAGES.HIGH) nextAuraSrc = warriorAura3;
    else if (hpRatio <= WARRIOR_RAGE_CFG.STAGES.MEDIUM) nextAuraSrc = warriorAura2;
    else if (hpRatio <= WARRIOR_RAGE_CFG.STAGES.LOW) nextAuraSrc = warriorAura1;

    if (nextAuraSrc !== currentAuraSrc) {
      if (activeAuraId) {
        setAbilityEffects(prev => prev.filter(e => e.id !== activeAuraId));
      }

      if (nextAuraSrc) {
        const newId = spawnAbilityEffect({
          src: nextAuraSrc,
          target: "player",
          width: "1100px",
          height: "1100px",
          loop: true
        });
        setActiveAuraId(newId);
        setCurrentAuraSrc(nextAuraSrc);
      } else {
        setActiveAuraId(null);
        setCurrentAuraSrc(null);
        if (currentAuraSrc) {
          spawnAbilityEffect({ src: healFx, target: "player", width: "700px", height: "700px" });
        }
      }
    }
  }, [playerHP, maxHPFromPlayer, classKey, battleOver]);

  
  

 // ===== ARCANE =====
function castArcane(choice) {
  if (battleOverRef.current) return;
  if (turn !== "player" || !enemy) return;
  if (classKey !== "mage") return;

 const currentMana = Number(mageMana ?? 0);

const requiredMana =
  choice.manaCost === "ALL" ? CTX_MAGE_MANA_MAX : Number(choice.manaCost);

if (!Number.isFinite(requiredMana) || requiredMana <= 0) return;
if (currentMana < requiredMana) return; // ✅ ALL-nál 10 alatt nem engedi

// ✅ levonás: ALL esetén mindent elköltünk
if (choice.manaCost === "ALL") {
  setMageMana(0);
} else {
  setMageMana(Math.max(0, currentMana - requiredMana));
}

  // ✅ picker bezár (NE nyissa ki újra!)
  setArcanePickerOpen(false);

  const playerIntellect = derivedStats?.intellect ?? player?.intellect ?? 0;

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
      pushLog(`${choice.name}: ${dmg} sebzés.`);
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
    setPlayerHP(() => {
      const amount = Math.max(0, maxHPFromPlayer - playerHPRef.current);
      if (amount > 0) addHPPopup(+amount, "player");
      pushLog(`${choice.name}: teljes gyógyítás.`);
      return maxHPFromPlayer;
    });
  }

  if (choice.kind === "big_damage") {
    const base = Math.max(1, Math.floor((enemy?.maxHp ?? 0.5) * 0.5));
    const extra = Math.floor(playerIntellect * 1);
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
      pushLog(`${choice.name}: ${dmg} brutális sebzés!`);
      if (newHP <= 0) endBattle();
      return newHP;
    });
  }

  // ⚠️ Ha nem akarsz "cast után mana visszatöltést", ezt vedd ki:
  // gainMageMana(1);

  trackTimeout(setTimeout(() => setTurn("enemy"), SMART_DRAW.PLAY_ANIM_MS));
}

function castPetTaunt() {
  if (battleOverRef.current) return;
  if (turn !== "player" || !enemy) return;
  if (classKey !== "archer") return;

  // pet kell hozzá
  if (petHP <= 0 || petMaxHP <= 0) return;

  // cooldown gate
  if (petTauntCdRef.current > 0) return;

  const cost = 1;
  if (playerStamina < cost) {
    pushLog("Nincs elég stamina a Pet Taunthoz!");
    return;
  }

  setPlayerStamina((prev) => Math.max(0, prev - cost));

  // taunt
  const turns = PET_TAUNT_DEFAULT_TURNS;
  setPetTauntTurns((prev) => Math.max(prev, turns));

  // cooldown indul
  setPetTauntCd(PET_TAUNT_COOLDOWN_TURNS);
  petTauntCdRef.current = PET_TAUNT_COOLDOWN_TURNS;

  // opcionális VFX + log
  spawnAbilityEffect({
    src: warriorShieldWallFx,
    target: "player_shield",
    width: "1150px",
    height: "1000px",
  });
  pushLog(`Pet Taunt aktiválva (${turns} kör). Cooldown: ${PET_TAUNT_COOLDOWN_TURNS}.`);

  // ugyanúgy elfogyasztja a kört, mint egy lap
  setTurn("enemy");
}

function passTurn() {
  if (battleOverRef.current) return;
  if (turn !== "player" || !enemy) return;

  setPlayerStamina((prev) => Math.min(PLAYER_MAX_STAMINA, prev + 1));
  pushLog("Passzoltál. +1 stamina.");
  setTurn("enemy");
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

    const bite = Math.max(1, Math.floor(Math.random() * (max - min + 1)) + min + (extraBonus || 0));

    setEnemyHP((prev) => {
      const newHP = Math.max(0, prev - bite);
      addHPPopup(-bite, "enemy", false, "pet-hit");
      pushLog(`Pet Bite: ${bite} sebzés!`);
      if (newHP <= 0) endBattle();
      return newHP;
    });
  }

  // ===== PLAY CARD =====
 function playCardAt(slotIndex) {
  if (tutBlocking && tutStep !== 4) return; 
  const card = handRef.current?.[slotIndex];
  if (!card) return;
  if (card._played) return;

  if (battleOverRef.current) return;
  if (turn !== "player" || !enemy) return;

  const cost = getCardStaminaCost(card);
  if (playerStamina < cost) {
    pushLog(`Nincs elég stamina! (${cost} kell)`);
    return;
  }

  setPlayerStamina((prev) => Math.max(0, prev - cost));

  setHand((prev) => {
    const copy = [...prev];
    const c = copy[slotIndex];
    if (!c) return prev;
    copy[slotIndex] = { ...c, _played: true };
    return copy;
  });

  applyCardEffects(card);

  setPendingReplaces((prev) => {
    const copy = [...prev];
    copy[slotIndex] = card;
    return copy;
  });

  setTurn("enemy");
}

  function applyCardEffects(card) {
    if (battleOverRef.current) return;

    const playerStrength = derivedStats?.strength ?? player?.strength ?? 0;
    const playerIntellect = derivedStats?.intellect ?? player?.intellect ?? 0;
    const playerDefenseNow = derivedStats?.defense ?? player?.defense ?? 0;
    const playerLevel = player?.level ?? 1;
    const playerAgi = playerStrength;

    if (card.type === "attack") {
      let blockedByPhase = false;
      if (enemyInvulnTurnsRef.current > 0 && enemyHPRef.current > 0) {
        pushLog(`${enemy.name} Phase-ben van – a támadás lepattan!`);
        setEnemyInvulnTurnsSync(0);
        blockedByPhase = true;
      }

      if (!blockedByPhase) {
        let baseMin = card.dmg?.[0] ?? 4;
        let baseMax = card.dmg?.[1] ?? 8;

        // ===== MAGE VFX =====
        if (card.abilityId === "mage_arcane_missiles") {
          spawnAbilityEffect({ src: arcaneMissilesFx, target: "enemy_hit", width: "1000px", height: "1000px" });
        }
        if (card.abilityId === "mage_ice_lance") {
          spawnAbilityEffect({ src: icelance, target: "enemy_hit", width: "1000px", height: "1050px" });
        }
        if (card.abilityId === "mage_fireball") {
          spawnAbilityEffect({ src: fireballFx, target: "enemy_hit", width: "1000px", height: "1000px" });
        }
        if (card.abilityId === "mage_arcane_surge") {
          spawnAbilityEffect({ src: arcaneSurgeFx, target: "enemy_aoe", width: "1200px", height: "1200px" });
        }
        if (card.abilityId === "mage_frost_nova") {
          spawnAbilityEffect({ src: frostNovaFx, target: "enemy_aoe", width: "1000px", height: "1000px" });
        }
        if (card.abilityId === "mage_lightning_bolt") {
          spawnAbilityEffect({ src: lightningBoltFx, target: "enemy_hit", width: "1050px", height: "1050px" });
        }
        if (card.abilityId === "mage_chain_lightning") {
          spawnAbilityEffect({ src: chainLightningFx, target: "enemy_aoe", width: "1000px", height: "1000px" });
        }
        if (card.abilityId === "mage_drain_life") {
          spawnAbilityEffect({ src: drainLifeFx, target: "enemy_hit", width: "1600px", height: "700px" });
        }

        // ===== WARRIOR VFX =====
        if (card.abilityId === "warrior_slash") {
          spawnAbilityEffect({ src: warriorSlashFx, target: "enemy_hit", width: "1000px", height: "1000px" });
        }
        if (card.abilityId === "warrior_cleave") {
          spawnAbilityEffect({ src: warriorCleaveFx, target: "enemy_hit", width: "1100px", height: "1100px" });
        }
        if (card.abilityId === "warrior_battle_cry") {
          spawnAbilityEffect({ src: warriorBattleCryFx, target: "enemy_aoe", width: "1200px", height: "1200px" });
        }
        if (card.abilityId === "warrior_mortal_strike") {
          spawnAbilityEffect({ src: warriorMortalStrikeFx, target: "enemy_hit", width: "1100px", height: "1100px" });
        }
        if (card.abilityId === "warrior_whirlwind") {
          spawnAbilityEffect({ src: warriorWhirlwindFx, target: "enemy_hit", width: "1200px", height: "1200px" });
        }
        if (card.abilityId === "warrior_crushing_blow") {
          spawnAbilityEffect({ src: warriorCrushingBlowFx, target: "enemy_hit", width: "1200px", height: "1200px" });
        }

        // scaling
        if (classKey === "warrior") {
          const bonus = Math.floor(playerStrength * 0.2) + Math.floor(playerLevel * 0.1);
          baseMin += bonus; baseMax += bonus;
        } else if (classKey === "mage") {
          const bonus = Math.floor(playerIntellect * 0.18) + Math.floor(playerLevel * 0.15);
          baseMin += bonus; baseMax += bonus;
        } else if (classKey === "archer") {
          const bonus = Math.floor(playerAgi * 0.35) + Math.floor(playerLevel * 0.25);
          baseMin += bonus; baseMax += bonus;
        }

        if (baseMin < 1) baseMin = 1;
        if (baseMax < baseMin) baseMax = baseMin;

        // crit
        let critChance = 0;
        let critMultiplier = 1;

        if (classKey === "warrior") { critChance = Math.min(60, 15 + playerStrength * 0.95 + playerLevel * 1.0); critMultiplier = 1.5; }
        else if (classKey === "mage") { critChance = Math.min(65, 12 + playerIntellect * 0.7 + playerLevel * 0.8); critMultiplier = 1.5; }
        else if (classKey === "archer") { critChance = Math.min(70, 18 + playerAgi * 0.9 + playerLevel * 1.2); critMultiplier = 1.75; }

        const hits = card.hits || 1;
        const dmgRolls = [];

        for (let i = 0; i < hits; i++) {
          let roll = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
          let isCrit = false;
          if (Math.random() * 100 < critChance) { isCrit = true; roll = Math.floor(roll * critMultiplier); }
          dmgRolls.push({ amount: roll, isCrit });
        }

        let finalRolls = dmgRolls.map((r) => ({ ...r }));

        if (playerWeakenTurnsRef.current > 0) {
          const WEAKEN_MULT = 0.75;
          finalRolls = finalRolls.map((r) => ({ ...r, amount: Math.max(1, Math.floor(r.amount * WEAKEN_MULT)) }));
          pushLog("Weaken: csökkentett sebzés!");
        }

        if (classKey === "warrior") {
          const rage01 = getWarriorRage01(playerHPRef.current, maxHPFromPlayer);
          const outMult = warriorDamageOutMult(rage01);
          if (outMult > 1.001) {
            finalRolls = finalRolls.map((r) => ({ ...r, amount: Math.floor(r.amount * outMult) }));
            pushLog(`Berserker Rage: +${Math.round((outMult - 1) * 100)}% sebzés (${playerHPRef.current}/${maxHPFromPlayer} HP).`);
          }
        }

        if (card.executeBelowPercent && enemy?.maxHp) {
          const hpPercent = Math.floor((enemyHPRef.current / enemy.maxHp) * 100);
          if (hpPercent <= card.executeBelowPercent) {
            finalRolls = finalRolls.map((r) => ({ ...r, amount: r.amount * 2 }));
            pushLog("Crushing Blow – kivégzés!");
          }
        }

        if (playerDamageBuff && playerDamageBuff.multiplier) {
          finalRolls = finalRolls.map((r) => ({ ...r, amount: Math.floor(r.amount * playerDamageBuff.multiplier) }));
          pushLog("A Rallying Shout erősíti a támadásod!");
          const remaining = (playerDamageBuff.remainingAttacks ?? 1) - 1;
          if (remaining <= 0) setPlayerDamageBuff(null);
          else setPlayerDamageBuff((prev) => (prev ? { ...prev, remainingAttacks: remaining } : null));
        }

        if (enemyVulnerability && enemyVulnerability.multiplier) {
          finalRolls = finalRolls.map((r) => ({ ...r, amount: Math.floor(r.amount * enemyVulnerability.multiplier) }));
          pushLog(`A korábbi Arcane Surge miatt ${enemy.name} több sebzést szenved el!`);
        }

        const runDmgMult = runEffect?.dmgMult ?? 1.0;
        if (runDmgMult !== 1.0) {
          finalRolls = finalRolls.map((r) => ({
            ...r,
            amount: Math.max(1, Math.floor(r.amount * runDmgMult)),
          }));
          // csak 1 log, nem hit-enként
          pushLog(`Utazási hatás: +${Math.round((runDmgMult - 1) * 100)}% sebzés`);
        }

        finalRolls.forEach((roll, index) => {
          trackTimeout(
            setTimeout(() => {
              if (battleOverRef.current) return;

              let dmg = roll.amount;

              if (enemyGuardHitsRef.current > 0) {
                const GUARD_MULT = 0.7;
                dmg = Math.max(1, Math.floor(dmg * GUARD_MULT));
                const nextHits = Math.max(0, enemyGuardHitsRef.current - 1);
                setEnemyGuardHitsSync(nextHits);
                pushLog(`${enemy.name} Guard: csökkentett találat!`);
              }

              setEnemyHP((prev) => {
                const newHP = Math.max(0, prev - dmg);
                addHPPopup(-dmg, "enemy", roll.isCrit);
                pushLog(`${card.name} → ${enemy.name} kap ${dmg} sebzést${roll.isCrit ? " (KRITIKUS!)" : ""}.`);
                if (newHP <= 0) endBattle();
                return newHP;
              });

              if (card.drain && card.heal) {
                setPlayerHP((prev) => {
                  const newHP = Math.min(prev + card.heal, maxHPFromPlayer);
                  addHPPopup(+card.heal, "player");
                  pushLog(`Drain Life gyógyít: +${card.heal} HP.`);
                  return newHP;
                });
              }
            }, index * 220)
          );
        });

        if (card.poison && card.poison.damagePerTurn > 0 && card.poison.turns > 0) {
          setEnemyPoison({ damagePerTurn: card.poison.damagePerTurn, remainingTurns: card.poison.turns });
          pushLog(`${enemy.name} megmérgezve: ${card.poison.damagePerTurn} sebzés ${card.poison.turns} körön át.`);
        }

        if (card.bleed) {
          const stacks = Math.max(1, card.bleedStacks || 1);
          for (let s = 0; s < stacks; s++) {
            setEnemyBleed((prev) => {
              if (!prev) return { percent: card.bleed.basePercent, remainingTurns: card.bleed.turns };
              const nextPercent = Math.min(card.bleed.maxPercent, prev.percent + card.bleed.bonusPerStack);
              return { percent: nextPercent, remainingTurns: card.bleed.turns };
            });
          }
          pushLog(`Vérzés! (${stacks} stack) ${enemy.name} minden körben sebződik.`);
        }

        if (card.burn && card.burn.percent && card.burn.turns) {
          const totalHit = finalRolls.reduce((a, b) => a + b.amount, 0);
          const burnPerTurn = Math.max(1, Math.floor((totalHit * card.burn.percent) / 100));
          setEnemyBurn({ damagePerTurn: burnPerTurn, remainingTurns: card.burn.turns });
          pushLog(`${enemy.name} égni kezd: ${burnPerTurn} sebzés ${card.burn.turns} körön át.`);
        }

       if (card.stunTurns && card.stunTurns > 0) {
      debugStun("ATTACK STUN TRY", {
        cardName: card.name,
        stunTurnsFromCard: card.stunTurns,
      });

      if (enemyStunImmuneTurnsRef.current > 0) {
        debugStun("ATTACK STUN BLOCKED BY IMMUNITY", {
          cardName: card.name,
        });

        pushLog(`${enemy.name} még ${enemyStunImmuneTurnsRef.current} körig nem stunolható!`);
      } else {
        debugStun("ATTACK STUN APPLIED", {
          cardName: card.name,
          stunTurnsFromCard: card.stunTurns,
        });

        spawnAbilityEffect({
          src: stunFx,
          target: "enemy_stun",
          width: "500px",
          height: "500px",
        });
        setEnemyStun(card.stunTurns);
        pushLog(`${enemy.name} elkábult, kihagyja a következő körét!`);
      }
}
        if (card.vulnerabilityDebuff && card.vulnerabilityDebuff.multiplier) {
          const mult = card.vulnerabilityDebuff.multiplier ?? 1.15;
          const turns = card.vulnerabilityDebuff.turns ?? 3;
          setEnemyVulnerability({ multiplier: mult, remainingTurns: turns });
          pushLog(`${enemy.name} sebezhetővé válik: +${Math.round((mult - 1) * 100)}% sebzést kap ${turns} körig!`);
        }
      }
    }

    if (card.type === "defend") {
      if (card.abilityId === "mage_mana_shield") {
        spawnAbilityEffect({ src: manaShieldFx, target: "player_shield", width: "1150px", height: "1000px" });
      }

      // ✅ Warrior defend VFX-ek
      if (card.abilityId === "warrior_shield_wall") {
        spawnAbilityEffect({ src: warriorShieldWallFx, target: "player_shield", width: "1150px", height: "1000px" });
      }
      if (card.abilityId === "warrior_parry") {
        spawnAbilityEffect({ src: warriorParryFx, target: "player", width: "1200px", height: "1200px" });
      }

      if (card.evasionTurns && card.evasionTurns > 0) {
        setPlayerEvasionTurns((prev) => Math.max(prev, card.evasionTurns));
        pushLog(`${card.name}: kitérés ${card.evasionTurns} körig!`);
      }

      if (card.defenseTurns && card.defenseTurns > 1) {
        setDefending(card.defenseTurns);
        pushLog(`${card.name}: védekezés aktiválva ${card.defenseTurns} körre!`);
      } else {
        setDefending(1);
        pushLog("Védekezés aktiválva – a következő ütés csökkentve.");
      }

   if (card.stunTurns && card.stunTurns > 0) {
  debugStun("DEFEND STUN TRY", {
    cardName: card.name,
    stunTurnsFromCard: card.stunTurns,
  });

  if (enemyStunImmuneTurnsRef.current > 0) {
    debugStun("DEFEND STUN BLOCKED BY IMMUNITY", {
      cardName: card.name,
    });

    pushLog(`${enemy.name} még ${enemyStunImmuneTurnsRef.current} körig nem stunolható!`);
  } else {
    debugStun("DEFEND STUN APPLIED", {
      cardName: card.name,
      stunTurnsFromCard: card.stunTurns,
    });

    spawnAbilityEffect({
      src: stunFx,
      target: "enemy_stun",
      width: "1000px",
      height: "1500px",
    });
    setEnemyStun(card.stunTurns);
    pushLog(`Parry! ${enemy.name} elkábul, kihagyja a körét!`);
  }
}

      if (classKey === "archer" && card.petTauntTurns && petHP > 0) {
        setPetTauntTurns((prev) => Math.max(prev, card.petTauntTurns));
        pushLog(`Pet Taunt: a mob a petet üti (${card.petTauntTurns} kör).`);
      }
    }

    if (card.type === "heal") {
      // alap heal VFX
      spawnAbilityEffect({ src: healFx, target: "player", width: "1000px", height: "1000px" });

      // ✅ Warrior heal VFX-ek (ha külön akarsz)
      if (card.abilityId === "warrior_rallying_shout") {
        spawnAbilityEffect({ src: healFx, target: "player", width: "1100px", height: "1100px" });
      }
      if (card.abilityId === "warrior_last_stand") {
        spawnAbilityEffect({ src: warriorLastStandFx, target: "player", width: "1200px", height: "1200px" });
      }

      let healAmount = card.heal || 20;
      if (classKey === "mage") healAmount += Math.floor(playerIntellect * 0.7);
      else if (classKey === "warrior") healAmount += Math.floor(playerStrength * 0.6);
      else if (classKey === "archer") healAmount += Math.floor(playerAgi * 0.5);

      setPlayerHP((prev) => {
        const newHP = Math.min(prev + healAmount, maxHPFromPlayer);
        addHPPopup(+healAmount, "player");
        pushLog(`${card.name}: +${healAmount} `);
        return newHP;
      });

      if (card.damageBuff && card.damageBuff.multiplier) {
        const mult = card.damageBuff.multiplier ?? 1.5;
        const turns = card.damageBuff.turns ?? 1;
        setPlayerDamageBuff({ multiplier: mult, remainingAttacks: turns });
        pushLog(`${card.name}: a következő ${turns} támadásod +${Math.round((mult - 1) * 100)}% sebzést okoz!`);
      }

      if (classKey === "archer" && card.petHeal && petHP > 0) {
        const amount = Math.max(1, card.petHeal);
        setPetHP((prev) => {
          const newHP = Math.min(petMaxHP, prev + amount);
          addHPPopup(+amount, "pet");
          pushLog(`Mend Pet: +${amount} HP (Pet: ${newHP}/${petMaxHP})`);
          return newHP;
        });
      }
    }

    if (classKey === "mage") {
      setMageMana((prev) => Math.min(CTX_MAGE_MANA_MAX, prev + 1));
    }

    if (classKey === "archer") {
      tryPetBite(card.petBiteBonus || 0);
    }

    if (playerWeakenTurnsRef.current > 0) {
      const next = Math.max(0, playerWeakenTurnsRef.current - 1);
      setPlayerWeakenTurnsSync(next);
      if (next <= 0) pushLog("Weaken elmúlt.");
    }
  }

useEffect(() => {
  // ✅ új enemy -> új kill engedélyezése
  enemyKillSentRef.current = false;
}, [enemy]);

useEffect(() => {
  if (!enemy) return;

  const shielded = enemy.affixes?.find(a => a.id === "shielded");
  if (!shielded) return;

  const hits = shielded.guardHits ?? 1;

  setEnemyGuardHitsSync(hits);
  pushLog(`${enemy.name} [Shielded] – Guard aktív (${hits} találat).`);
}, [enemy]);


useEffect(() => {
  if (!enemy) return;

  const victory = enemyHP <= 0 && playerHP > 0;
  if (!victory) return;

  if (enemyKillSentRef.current) return;
  enemyKillSentRef.current = true;

  let cancelled = false;

  (async () => {
    try {
      await questEnemyDefeatedEvent();
      if (!cancelled) endBattle();
    } catch (e) {
      console.error(e);
      if (!cancelled) endBattle(); // opcionális: akkor is lépj tovább
    }
  })();

  return () => {
    cancelled = true;
  };
}, [enemyHP, playerHP, enemy]);

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

    setLastRewards({ xpGain, goldGain, levelsGained, addedStatPoints, newXP, newLevel });
    pushLog(`Győzelem! +${goldGain} arany, +${xpGain} XP.`);
  }, [enemy, enemyHP, playerHP, player, lastRewards]);

  useEffect(() => {
    if (!enemy || battleOver || turn !== "enemy") return;

    const baseDelay = ENEMY_TURN_DELAY_MS + (boss ? 300 : 0);

    const t = setTimeout(() => {
      if (battleOverRef.current) return;

// ===== PLAYER DoT (Plague Aura + playerPoison tick) =====
const plague = enemy?.affixes?.find(a => a.id === "plague_aura");

// amit ténylegesen ebben a tickben használunk
let poisonNow = playerPoisonRef.current;

// ha Plague Aura van és nincs aktív poison, tedd fel (és ebben a tickben is használd)
if (plague?.poison && playerHPRef.current > 0) {
  const dmg = plague.poison.damagePerTurn ?? 3;
  const turns = plague.poison.turns ?? 3;

  const shouldApply = !poisonNow || (poisonNow.remainingTurns ?? 0) <= 0;

  if (shouldApply) {
    const next = { damagePerTurn: dmg, remainingTurns: turns };

    setPlayerPoison(next);
    playerPoisonRef.current = next; // ✅ azonnali sync
    poisonNow = next;

    pushLog(`${enemy.name} [Plague Aura] – megmérgez (${turns} kör).`);
  }
}

// tick
if (poisonNow && playerHPRef.current > 0) {
  const pDmg = poisonNow.damagePerTurn ?? 0;

  setPlayerHP((prev) => {
    const newHP = Math.max(0, prev - pDmg);
    if (pDmg > 0) {
      addHPPopup(-pDmg, "player");
      pushLog(`Méreg sebzés: ${pDmg} (Te – ${newHP} HP).`);
    }
    if (newHP <= 0) endBattle();
    return newHP;
  });

  const remaining = (poisonNow.remainingTurns ?? 1) - 1;
  const nextPoison = remaining <= 0 ? null : { ...poisonNow, remainingTurns: remaining };

  setPlayerPoison(nextPoison);
  playerPoisonRef.current = nextPoison; // ✅ sync
}

  if (enemyBurn && enemyHPRef.current > 0) {
  const burnDmg = enemyBurn.damagePerTurn ?? 0;

  setEnemyHP((prev) => {
    const newHP = Math.max(0, prev - burnDmg);
    if (burnDmg > 0) {
      addHPPopup(-burnDmg, "enemy");
      pushLog(`Égés sebzés: ${burnDmg} (${enemy.name} – ${newHP} HP).`);
    }
    if (newHP <= 0) { endBattle(); }
    return newHP;
  });

  setEnemyBurn((prev) => {
    if (!prev) return null;
    const remaining = (prev.remainingTurns ?? 1) - 1;
    return remaining <= 0 ? null : { ...prev, remainingTurns: remaining };
  });
}

      if (enemyPoison && enemyHP > 0) {
        const poisonDmg = enemyPoison.damagePerTurn ?? 0;
        const newHP = Math.max(0, enemyHP - poisonDmg);

        if (poisonDmg > 0) {
          setEnemyHP(newHP);
          addHPPopup(-poisonDmg, "enemy");
          pushLog(`Méreg sebzés: ${poisonDmg} (${enemy.name} – ${newHP} HP).`);
        }

        const remaining = (enemyPoison.remainingTurns ?? 1) - 1;
        if (remaining <= 0 || newHP <= 0) setEnemyPoison(null);
        else setEnemyPoison((prev) => (prev ? { ...prev, remainingTurns: remaining } : null));

        if (newHP <= 0) { endBattle(); return; }
      }

      if (enemyBleed && enemyHP > 0) {
        const bleedDmg = Math.max(1, Math.floor((enemy.maxHp * enemyBleed.percent) / 100));
        const newHP = Math.max(0, enemyHP - bleedDmg);

        setEnemyHP(newHP);
        addHPPopup(-bleedDmg, "enemy");
        pushLog(`Vérzés: ${bleedDmg} sebzés (${enemyBleed.percent}%).`);

        const remaining = (enemyBleed.remainingTurns ?? 1) - 1;
        if (remaining <= 0 || newHP <= 0) setEnemyBleed(null);
        else setEnemyBleed((prev) => (prev ? { ...prev, remainingTurns: remaining } : null));

        if (newHP <= 0) { endBattle(); return; }
      }

      // ===== Stun / evasion =====
        if (enemyStun > 0 && enemyHP > 0) {
      debugStun("ENEMY TURN SKIPPED BY STUN - BEFORE");

      pushLog(`${enemy.name} elkábulva marad, kihagyja a körét!`);
      setEnemyStun((prev) => Math.max(0, prev - 1));

      if (enemyStunImmuneTurnsRef.current <= 0) {
        debugStun("SETTING IMMUNITY TO 3 AFTER STUN SKIP");
        setEnemyStunImmuneTurnsSync(3);
      }

      if (enemyVulnerability && enemyVulnerability.remainingTurns != null) {
        const remaining = enemyVulnerability.remainingTurns - 1;
        if (remaining <= 0) {
          setEnemyVulnerability(null);
          pushLog("Az Arcane Surge hatása elmúlt.");
        } else {
          setEnemyVulnerability((prev) =>
            prev ? { ...prev, remainingTurns: remaining } : null
          );
        }
      }

      debugStun("ENEMY TURN SKIPPED BY STUN - BEFORE FINISH");
      finishEnemyTurnToPlayer({ staminaMode: "stun-skip" });
      return;
    }
      if (playerEvasionTurns > 0 && enemyHP > 0) {
      pushLog(`Kitértél! ${enemy.name} mellé üt.`);
      setPlayerEvasionTurns((prev) => Math.max(0, prev - 1));
      finishEnemyTurnToPlayer();
      return;
    }

      // ✅ UTILITY FIX: ha ability használt, de nem fogyaszt kört, akkor folytatódik és jön a basic attack
      const abRes = tryEnemyAbilityAction();
      if (abRes.used && abRes.consumesTurn) {
        finishEnemyTurnToPlayer();
        return;
      }

      // ===== BASIC ATTACK (VFX + állítható delay) =====
      spawnAbilityEffect({ src: warriorSlashFx, target: "player", width: "1000px", height: "1000px" });

      trackTimeout(setTimeout(() => {
        if (battleOverRef.current) return;

        const playerDefenseNow = derivedStats?.defense ?? player?.defense ?? 0;

        const [minDmg, maxDmg] = enemy.dmg;
        let dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;

       if (defending && defending > 0) {
      dmg = Math.floor(dmg * 0.7);
      setDefending((prev) => Math.max(0, (prev || 1) - 1));
    }

        let final = getMitigatedDamage(dmg, playerDefenseNow);


        if (classKey === "warrior") {
          const rage01 = getWarriorRage01(playerHPRef.current, maxHPFromPlayer);
          final = Math.floor(final * warriorDamageInMult(rage01));
        }

        const petAliveNow = classKey === "archer" && petHP > 0;
        const taunting = petAliveNow && petTauntTurns > 0;

        if (classKey === "archer" && petAliveNow && !taunting) {
          if (Math.random() < PET_CFG.GUARD_CHANCE) {
            final = Math.floor(final * PET_CFG.GUARD_REDUCE_MULT);
            pushLog("Pet Guard! A pet tompította az ütést.");
          }
        }

        if (classKey === "archer" && taunting) {
          setPetHP((prev) => {
            const newHP = Math.max(0, prev - final);
            addHPPopup(-final, "pet");
             enemyVampiricHeal(final);
            pushLog(`${enemy.name} a petet üti (${final} sebzés). (Pet: ${newHP}/${petMaxHP})`);
            return newHP;
          });
          setPetTauntTurns((prev) => Math.max(0, prev - 1));
        } else {
          setPlayerHP((prev) => {
            const newHP = Math.max(0, prev - final);
            addHPPopup(-final, "player");
            pushLog(`${enemy.name} támad (${final} sebzés).`);

            enemyVampiricHeal(final);

            if (newHP <= 0) endBattle();
            return newHP;
          });
        }

        if (enemyVulnerability && enemyVulnerability.remainingTurns != null) {
          const remaining = enemyVulnerability.remainingTurns - 1;
          if (remaining <= 0) { 
            setEnemyVulnerability(null); 
            pushLog("Az Arcane Surge hatása elmúlt."); 
          } else {
            setEnemyVulnerability((prev) =>
              prev ? { ...prev, remainingTurns: remaining } : null
            );
          }
        }
        
        finishEnemyTurnToPlayer();
      }, ENEMY_BASIC_WINDUP_MS));

      return;
    }, baseDelay);

    return () => clearTimeout(t);
  }, [
    turn, enemy, defending, battleOver, boss,
    enemyHP, enemyPoison, enemyBurn, enemyBleed, enemyStun, enemyVulnerability,
    maxHPFromPlayer, classKey, petHP, petMaxHP, petTauntTurns, playerEvasionTurns,
  ]);

  function rollRewards() {
    if (!enemy || !enemy.rewards) return { xpGain: 0, goldGain: 50 };
    const { goldMin, goldMax, xpMin, xpMax } = enemy.rewards;
    const goldGain = Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin;
    const xpGain = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin;
    return { xpGain, goldGain };
  }


  async function questBattleWonEvent() {
  if (!player?.id) return;
  try {
    await fetch("https://nodejs202.dszcbaross.edu.hu/api/quests/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: player.id,
        event: "battle_won",
      }),
    });
  } catch (e) {
    console.error("Battle won quest event error:", e);
  }
}

async function questEnemyDefeatedEvent() {
  if (!player?.id) return;

  try {
    const isBossDefeated = enemy?.role === "boss"; // ez biztosabb, mint a boss flag
    await fetch("https://nodejs202.dszcbaross.edu.hu/api/quests/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: player.id,
        event: "enemy_defeated",
        isBoss: isBossDefeated,
      }),
    });
  } catch (e) {
    console.error("Quest event error:", e);
  }
}

function emitEnd({ victory, hpAfter, rewards, enemyRole }) {
  onEnd?.({
    victory,
    hpAfter,
    rewards: rewards ?? { xp: 0, gold: 0 },
    enemyRole: enemyRole ?? enemy?.role ?? null,
    mode, // <- "quest" vagy "run" amit propként kapsz
  });
}

async function handleContinue() {
  const isQuest = mode === "quest";
  const victory = enemyHPRef.current <= 0 && playerHPRef.current > 0;
  const hasMoreEnemies = (pendingEnemies?.length ?? 0) > 0;
  const isLastWave = wave >= maxWaves;

  const fullMax = derivedStats?.max_hp ?? maxHPFromPlayer ?? player?.max_hp ?? 0;
  let finalReward = { xpGain: 0, goldGain: 0 };

 async function awardReward({ hpAfterBattle } = {}) {
  if (!victory || !player?.id) return { xpGain: 0, goldGain: 0 };

  const { xpGain, goldGain  } = rollRewards();
  

  try {
    await fetch("https://nodejs202.dszcbaross.edu.hu/api/combat/reward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: player.id,
        xpGain,
        goldGain,
        ...(hpAfterBattle != null ? { hpAfterBattle } : {}),
      }),
    });

    try { await refreshFullStats?.(player.id); } catch {}
  } catch (err) {
    console.error("Reward save failed", err);
  }

  return { xpGain, goldGain };
}
  


  // =========================================================
  // DEFEAT -> Run End (Hub full heal)
  // =========================================================
  if (!victory) {
    clearStoredHP();
    clearAllVfx();

    setPlayerHP(fullMax);
    playerHPRef.current = fullMax;

    if (player?.id && setPlayer) {
      setPlayer((prev) => ({ ...(prev || {}), hp: fullMax }));
    }

   onEnd?.({
  victory: false,
  hpAfter: fullMax,
  rewards: null,
  enemyRole: enemy?.role ?? null,
  mode,
});
    return;
  }

  // =========================================================
  // ✅ CHAIN BATTLE: van még enemy a sorban -> reward + következő betöltése, maradunk CombatView-ban
  // =========================================================
  if (hasMoreEnemies) {
    await awardReward();

    // minden futó időzítő/VFX leáll
    clearAllTimers();
    clearAllVfx();

    // battleOver UI flag reset
    battleOverRef.current = false;
    setBattleOver(false);

    // alap UI reset
    setArcanePickerOpen(false);
    setDefending(false);
    setTurn("player");
    setPlayerStamina((prev) => Math.min(PLAYER_MAX_STAMINA, prev + 1));
    setLastRewards(null);
    

    // következő enemy betöltése
    const nextEnemy = pendingEnemies[0];
    const rest = pendingEnemies.slice(1);
    setPendingEnemies(rest);

    setEnemy(nextEnemy);
    setEnemyHP(nextEnemy.maxHp);
    enemyHPRef.current = nextEnemy.maxHp;

    // enemy-specifikus állapotok hard reset
    setEnemyPoison(null);
    setEnemyBurn(null);
    setEnemyStun(0);
    setEnemyVulnerability(null);
    setEnemyBleed(null);
    setEnemyGuardHitsSync(0);
    setEnemyInvulnTurnsSync(0);
    setEnemyFrenzyTurnsSync(0);
    setEnemyStunImmuneTurnsSync(0);
    debugStun("RESET IMMUNITY IN initBattle", { to: 0 });
    enemyUsesRef.current = {};

    setHPPopups([]);
    setEnemyDamaged(false);
    setPlayerDamaged(false);
    setPlayerHealed(false);

    // ha volt pending replace (pl. kijátszott lap helye), pótoljuk
    try {
      resolvePendingReplaces();
    } catch (e) {
      console.error(e);
    }

    setLog((prev) => [
      ...prev,
      `${enemy?.name || "Ellenség"} legyőzve...`,
      `! Új ellenfél lép a helyére: ${nextEnemy.name} !`,
    ]);

    // Fade/UI unlock
    setFadeOpen(false);
    continueLockRef.current = false;

    return; // 🔴 nem hívunk onEnd-et, folytatjuk a harcot
  }

  // =========================================================
  // ✅ WAVE COMPLETE (nem run vége): reward + vissza Path-ra, HP marad, storage marad
  // =========================================================
if (!isLastWave) {
  await questBattleWonEvent();
  const reward = await awardReward({ hpAfterBattle: playerHPRef.current });
  clearAllVfx();

  emitEnd({
    victory: true,
    hpAfter: playerHPRef.current,
    rewards: { xp: reward.xpGain, gold: reward.goldGain },
  });
  return;
}

  // =========================================================
  // ✅ RUN END (utolsó wave victory): reward + quest + HUB + FULL HEAL
  // =========================================================
  clearStoredHP();
  clearAllVfx();

  await questBattleWonEvent();

  // Backend reward (FULL HP mentés, mert hubba megyünk)
  if (player?.id) {
    const { xpGain, goldGain } = rollRewards();
    finalReward = { xpGain, goldGain };

    try {
      const res = await fetch("https://nodejs202.dszcbaross.edu.hu/api/combat/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.id,
          xpGain,
          goldGain,
          hpAfterBattle: fullMax,
        }),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        setPlayer?.((prev) => ({ ...(prev || {}), ...(data.player || {}), hp: fullMax }));
        try {
          await refreshFullStats?.(player.id);
        } catch {}
      } else {
        console.error("combat/reward failed", data);
      }
    } catch (err) {
      console.error("combat/reward fetch error:", err);
    }

  }

  // HUB-ba megyünk full HP-val
  setPlayerHP(fullMax);
  playerHPRef.current = fullMax;
  
emitEnd({
  victory: true,
  hpAfter: fullMax,
  rewards: { xp: finalReward.xpGain, gold: finalReward.goldGain },
});
}


  const [fadeOpen, setFadeOpen] = useState(false);
  const continueLockRef = useRef(false);

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Nincs betöltött játékos. Jelentkezz be újra.
      </div>
    );
  }

  const warriorRage01 = classKey === "warrior" ? getWarriorRage01(playerHP, maxHPFromPlayer) : 0;
  const visRage = clamp01((warriorRage01 - WARRIOR_RAGE.VIS_START_RAGE) / (1 - WARRIOR_RAGE.VIS_START_RAGE));
  const auraOpacity = visRage * WARRIOR_RAGE.VIS_MAX_OPACITY;
  const auraBlur = Math.floor(visRage * WARRIOR_RAGE.VIS_MAX_BLUR);
  const ringPx = Math.max(0, Math.floor(visRage * WARRIOR_RAGE.VIS_RING_PX));

  const warriorFrameStyle =
    classKey === "warrior"
      ? {
         
          transition: "box-shadow 120ms linear, outline 120ms linear",
        }
      : undefined;

  const petAlive = classKey === "archer" && petMaxHP > 0 && petHP > 0;


  const AFFIX_LABELS = {
  vampiric: "Vampiric",
  frenzied: "Frenzied",
  shielded: "Shielded",
  plague_aura: "Plague Aura",
};

const tutSteps = useMemo(() => {
  const steps = [
    null,
    { title: "ELLENSÉG", text: "Itt látod az enemy HP-t és az affixeket.", ref: tutEnemyRef },
    { title: "COMBAT LOG", text: "Itt látod mi történt.", ref: tutLogRef },
    { title: "KÁRTYÁK", text: "Kattints egy lapra. 1 lap = 1 kör, utána az enemy jön.", ref: tutHandRef },
  ];

  if (classKey === "mage") {
    steps.push({ title: "MANA", text: "Minden kártya után +1 mana. 5-től nyithatod a Mana Képességeket.", ref: tutExtraRef });
  } else if (classKey === "archer") {
    steps.push({ title: "PET TAUNT", text: "A Taunt-tal a pet kapja a hiteket pár körig. Utána cooldown.", ref: tutExtraRef });
  } else {
steps.push({
  title: "PASSZÍV",
  text: "Warrior: minél kevesebb HP-d van, annál nagyobbat ütsz (és többet is kapsz).",
  ref: tutPlayerRef, // ✅
});
  }

  return steps;
}, [classKey]);

return (
   <div className="combat-root fixed inset-0 text-white overflow-hidden">
      {/* 1. GLOBÁLIS PIXEL STÍLUSOK (Hogy ne legyen elmosódva) */}
      <style>
        {`
          .pixel-text-sharp {
            font-family: 'Jersey 10', sans-serif;
            -webkit-font-smoothing: none;
            -moz-osx-font-smoothing: grayscale;
            font-smooth: never;
            text-rendering: optimizeSpeed;
            image-rendering: pixelated;
          }
          .dark-log-scroll::-webkit-scrollbar { width: 6px; }
          .dark-log-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
          .dark-log-scroll::-webkit-scrollbar-thumb { background: #3d0a0a; border: 1px solid #000; }
          
          /* Kártya animációk */
          .card-anim-draw { animation: cardDraw 0.4s ease-out; }
          .card-anim-play { animation: cardPlay 0.5s forwards; }
          @keyframes cardDraw {
            from { transform: translateY(200px) scale(0.5); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          @keyframes cardPlay {
            to { transform: translateY(-300px) scale(1.2); opacity: 0; }
          }
        `}
      </style>

      {/* HÁTTÉR */}
      <div className="absolute inset-0 -z-10">
        <img src={bg} alt="bg" className="w-full h-full object-cover" />
      </div>
      

      {/* ÚJ ELLENSÉG OVERLAY (V2 STÍLUS) */}
      {battleOver && pendingEnemies.length > 0 && playerHP > 0 && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-[999] bg-black/75 backdrop-blur-sm xv2-container">
          <div className="xv2-bar w-full mb-6" />
          <div className="flex flex-col items-center scale-125">
            <h2 className="xv2-title-main text-8xl italic tracking-tighter">ÚJ ELLENSÉG</h2>
            <h2 className="xv2-title-sub text-6xl italic tracking-widest mb-10">KÖZELEDIK...</h2>
            <div className="text-red-400 text-2xl mb-12 animate-pulse font-mono">
              MARADÉK ELLENSÉGEK: {pendingEnemies.length}
            </div>
            <button
              onClick={() => {
                if (continueLockRef.current) return;
                continueLockRef.current = true;
                setFadeOpen(true);
              }}
              className="skip"
            >
              HARC ⚔️
            </button>
          </div>
          <div className="xv2-bar w-full mt-6" />
        </div>
      )}

      {/* JÁTÉKTÉR (SKÁLÁZOTT) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={combatRootRef}
          className="relative"
          style={{
            width: "1650px",
            height: "1050px",
            transform: `scale(${uiScale * BASE_UI_SCALE})`,
            transformOrigin: "center center",
          }}
        >
{/* MAGE MANA UI - Ez marad a jól működő verzió */}
{classKey === "mage" && enemy && !battleOver && (
  <div ref={tutExtraRef}
 className="absolute bottom-44 left-24 z-40 flex flex-col items-start scale-110 origin-bottom-left pointer-events-none">
    <div className="flex justify-between items-end mb-2 px-1 w-72">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-black text-cyan-400 tracking-[0.2em] drop-shadow-md">
          Mana
        </span>
        <div className="h-[2px] w-12 bg-cyan-500/50 mt-0.5" />
      </div>
      <span className="text-sm font-mono text-white bg-slate-950/80 px-3 py-0.5 border-l-2 border-cyan-500 shadow-xl">
        {mageMana} <span className="text-cyan-700 text-xs">/</span> {CTX_MAGE_MANA_MAX}
      </span>
    </div>

    <div className="h-8 w-72 bg-slate-950 border-2 border-slate-800 p-1 shadow-[0_0_30px_rgba(0,0,0,0.6)] relative overflow-hidden">
      <div
        className="h-full bg-cyan-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(6,182,212,0.5)]"
        style={{ width: `${(mageMana / CTX_MAGE_MANA_MAX) * 100}%` }}
      />
    </div>

    {turn === "player" && !arcanePickerOpen && (
      <button
        onClick={(e) => {
          e.preventDefault();

          // ✅ min cost gate: Burst = 5
          const currentMana = Number(mageMana ?? 0);
          const canOpen = currentMana >= 5;
          if (!canOpen) return;

          setArcanePickerOpen(true);
        }}
        className={[
          "mt-6 flex items-center gap-4 group pointer-events-auto active:scale-95 transition-transform",
          Number(mageMana ?? 0) >= 5 ? "cursor-pointer" : "cursor-not-allowed opacity-60",
        ].join(" ")}
      >
        <div className="relative">
          <div className="w-10 h-10 bg-cyan-500 rotate-45 animate-ping absolute opacity-20" />
          <div className="w-10 h-10 bg-cyan-600 border-2 border-white rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.6)] group-hover:bg-cyan-400 transition-colors">
            <span className="-rotate-45 text-white text-xl font-black italic">!</span>
          </div>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-white font-black text-xs uppercase tracking-widest group-hover:text-cyan-400">
            Mana Képességek
          </span>
          <span className="text-cyan-600 font-bold text-[9px] uppercase animate-pulse text-shadow">
            Click to release
          </span>
        </div>
      </button>
    )}
  </div>
)}


{classKey === "archer" && petMaxHP > 0 && (
  <div
    className="absolute z-[80]"
    style={{ ...PET_UI.wrapperStyle, width: `${PET_SIZE}px` }}
  >
    <div className="relative" style={{ width: `${PET_SIZE}px` }}>

      {/* ===== CD / TAUNT INFO (felül) ===== */}
      <div
        className="petBadgeInv absolute -top-12 left-1/2 -translate-x-1/2
                   px-4 py-2 rounded-md whitespace-nowrap text-[22px]"
      >
        CD: <span className="petCdRed">{petTauntCd}</span> • TAUNT: {petTauntTurns}
      </div>

      {/* ===== PET IMAGE ===== */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          width: `${PET_SIZE}px`,
          height: `${PET_SIZE}px`,
          opacity: petHP <= 0 ? 0.45 : 1,
          backgroundColor: "#460809",
          boxShadow:
            "0px 10px black, 0px -10px black, 10px 0px black, -10px 0px black, inset 0px 10px #00000038",
        }}
      >
        <img
          src="/ui/player/pet.png"
          alt="pet"
          className="w-full h-full object-cover"
        />

        {/* opcionális: TAUNT ACTIVE badge a képen */}
        {petTauntTurns > 0 && (
          <div className="absolute top-3 left-3 petBadgeInv px-3 py-1 rounded-md text-[18px]">
            TAUNT ACTIVE
          </div>
        )}
      </div>

      {/* ===== HP BAR ===== */}
      <div
        className="relative mt-2 overflow-hidden"
        style={{
          height: "16px",
          width: `${PET_SIZE}px`,
          backgroundColor: "#290f0f",
          boxShadow:
            "0px 5px black, 0px -5px black, 5px 0px black, -5px 0px black, inset 0px 5px #00000038",
          borderRadius: "999px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${petMaxHP > 0 ? (petHP / petMaxHP) * 100 : 0}%`,
            background: "#b61a1a",
            transition: "width 200ms",
          }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            color: "#fef9c2",
            fontFamily: '"Jersey 10", sans-serif',
            fontSize: "18px",
            letterSpacing: "2px",
            textShadow: "2px 2px 0px #000000",
            pointerEvents: "none",
          }}
        >
          {petHP}/{petMaxHP}
        </div>
      </div>

      {/* ===== PET TAUNT BUTTON (lent, állítható offsettel) ===== */}
      <button
       ref={tutExtraRef}
        onClick={(e) => {
          e.preventDefault();
          castPetTaunt();
        }}
        disabled={turn !== "player" || petHP <= 0 || petTauntCd > 0}
        className={[
          "absolute px-6 py-3 rounded-md",
          turn === "player" && petHP > 0 && petTauntCd === 0
            ? "petTauntBtnInv"
            : "petTauntBtnInvDisabled",
        ].join(" ")}
        style={{
          bottom: PET_UI.buttonOffset.bottom,
          left: PET_UI.buttonOffset.left,
          transform: `translateX(${PET_UI.buttonOffset.translateX})`,
        }}
      >
        PET TAUNT {petTauntCd > 0 ? `(${petTauntCd})` : ""}
      </button>
    </div>
  </div>
)}


{/* ARCANE PICKER MODAL - A Visszatérő Fan Design */}
{arcanePickerOpen && !battleOver && (
  <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center">
    {/* Sötétített háttér - Kattintásra bezár */}
    <div
      className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm cursor-pointer"
      onClick={() => setArcanePickerOpen(false)}
    />

    <div className="relative z-10 flex flex-col items-center w-full max-w-6xl">
      {/* KÁRTYÁK LEGYEZŐJE */}
      <div className="flex justify-center items-end h-[450px] w-full mb-4 px-20">
        {ARCANE_CHOICES.map((c, idx) => {
          const midIndex = Math.floor(ARCANE_CHOICES.length / 2);
          const rotation = (idx - midIndex) * 10;
          const translateY = Math.abs(idx - midIndex) * 20;

         const currentMana = Number(mageMana ?? 0);

          const requiredMana =
            c.manaCost === "ALL" ? CTX_MAGE_MANA_MAX : Number(c.manaCost);

          const canCast =
            Number.isFinite(requiredMana) && requiredMana > 0 && currentMana >= requiredMana;
          return (
            <button
              key={c.id}
              disabled={!canCast}
              onClick={(e) => {
                e.stopPropagation();
                if (!canCast) return; // ✅ nincs elég mana → ne sül el UI-ból se
                castArcane(c);
                setArcanePickerOpen(false);
              }}
              style={{
                /* transform-gpu és backface-visibility: segít a homályosodás ellen */
                transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className={[
                "group relative w-56 h-80 -ml-20 first:ml-0 transition-all duration-300 ease-out origin-bottom transform-gpu",
                canCast
                  ? "hover:z-50 hover:-translate-y-32 hover:scale-105 active:scale-95"
                  : "opacity-50 cursor-not-allowed",
              ].join(" ")}
            >
              {/* Kártya Visuals - Pixel-perfect renderelés kényszerítése */}
              <div className="relative h-full w-full bg-[#080d16] border-2 border-cyan-500/60 rounded-xl overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/5">
                {/* Kép terület */}
                <div className="h-40 bg-slate-900 border-b border-cyan-900/50 relative overflow-hidden">
                  {c.img ? (
                    <img
                      src={c.img}
                      alt={c.name}
                      className={[
                        "w-full h-full object-cover pixelated transition-opacity",
                        canCast ? "opacity-80 group-hover:opacity-100" : "opacity-60",
                      ].join(" ")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 border-2 border-cyan-500/20 rotate-45 animate-pulse" />
                    </div>
                  )}
                  {/* Belső ragyogás a kártya tetején */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                </div>

                {/* Szöveg terület */}
                <div className="p-4 flex-grow bg-slate-950 flex flex-col justify-center">
                  <h4 className="font-bold text-cyan-400 text-sm uppercase tracking-tighter mb-1 group-hover:text-white transition-colors flex items-center gap-2">
                    <span>{c.name}</span>

                    {/* Mana cost badge */}
                    <span className="text-xs text-cyan-100 font-black tracking-widest">
                      {c.manaCost === "ALL" ? "10" : String(c.manaCost)}
                    </span>
                  </h4>

                  <p className="text-[10px] text-slate-400 leading-tight italic">{c.desc}</p>

                  {!canCast && (
                    <p className="mt-2 text-[10px] text-red-400/80 italic">Nincs elég mana</p>
                  )}
                </div>

                {/* Hover border glow */}
                <div
                  className={[
                    "absolute inset-0 border-2 border-cyan-400 transition-opacity pointer-events-none",
                    canCast ? "opacity-0 group-hover:opacity-100" : "opacity-0",
                  ].join(" ")}
                />
              </div>

              {/* Külső Aura hover esetén */}
              <div
                className={[
                  "absolute -inset-4 bg-cyan-500/20 blur-2xl transition-opacity -z-10",
                  canCast ? "opacity-0 group-hover:opacity-100" : "opacity-0",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>

      {/* MÉGSE GOMB */}
      <button
        className="px-10 py-3 bg-red-950/20 border-2 border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white font-mono text-xs tracking-[0.3em] transition-all rounded-md uppercase shadow-lg z-20"
        onClick={() => setArcanePickerOpen(false)}
      >
        Vissza
      </button>
    </div>
  </div>
)}



          {/* ARCHER PET BIG FRAME */}
          {classKey === "archer" && petMaxHP > 0 && (
            <div className="absolute z-[80] pointer-events-none" style={{ ...PET_UI.wrapperStyle, width: `${PET_SIZE}px` }}>
              <div className="relative" style={{ width: `${PET_SIZE}px` }}>
                {hpPopups.filter((p) => p.target === "pet").map((p) => (
                  <HPPopup key={p.id} value={p.value} isCrit={p.isCrit} variant="pet" onDone={() => setHPPopups((prev) => prev.filter((pp) => pp.id !== p.id))} />
                ))}
                <div className="rounded-xl bg-black/50" style={{ width: `${PET_SIZE}px`, height: `${PET_SIZE}px`, overflow: "hidden", opacity: petHP <= 0 ? 0.45 : 1, boxShadow: "0 0 14px rgba(0,0,0,0.7)" }}>
                  <img src="/ui/player/pet.png" alt="pet" className="w-full h-full object-cover" />
                </div>
                <div className="relative mt-2 rounded-full overflow-hidden" style={{ height: "14px", width: `${PET_SIZE}px`, background: "rgba(0,0,0,0.6)" }}>
                  <div style={{ height: "100%", width: `${petMaxHP > 0 ? (petHP / petMaxHP) * 100 : 0}%`, background: "red", transition: "width 200ms" }} />
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs" style={{ color: "white", textShadow: "1px 1px 3px rgba(0,0,0,0.9)", pointerEvents: "none" }}>
                    {petHP}/{petMaxHP}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PLAYER FRAME */}
          <div   ref={(el) => {
            playerAnchorRef.current = el;
            tutPlayerRef.current = el; // ✅ tutorial ide tud spotlightolni
          }} className="absolute top-24 left-[20%] -translate-x-1/2 z-10 transition-all duration-500 ease-in-out">
            <div className="relative inline-block rounded-xl overflow-hidden" style={typeof warriorFrameStyle !== 'undefined' ? warriorFrameStyle : {}}>
              {activeAuraId && (
                <div className="absolute z-[60] whitespace-nowrap pointer-events-none" style={{ top: "-30px", left: "0" }}>
                  <span className="text-red-500 font-black text-2xl italic animate-pulse" style={{ textShadow: '2px 2px 0px #000, 0 0 10px rgba(255,0,0,0.8)' }}>💢 ENRAGED</span>
                </div>
              )}
              <EnemyFrame name={player.username || "Player"} hp={playerHP} maxHP={maxHPFromPlayer} image={classConfig.sprite} damaged={playerDamaged} healed={playerHealed} />
              
              {hpPopups.filter((p) => p.target === "player").map((p) => (
                <HPPopup key={p.id} value={p.value} isCrit={p.isCrit} variant={p.variant || "default"} onDone={() => setHPPopups((prev) => prev.filter((pp) => pp.id !== p.id))} />
              ))}

              {/* ARCHER MINI PET BAR */}
              {classKey === "archer" && petMaxHP > 0 && (
                <div className="absolute -right-28 bottom-2 w-24" style={{ zIndex: 20 }}>
                  <div className="relative rounded-lg overflow-hidden border border-black/50 bg-black/40">
                    <img src={"/ui/player/player.png"} alt="pet" className="w-full h-16 object-cover opacity-95" />
                    <div className="px-1 pb-1">
                      <div className="text-[10px] text-gray-100 font-mono">Pet {petHP}/{petMaxHP} {petTauntTurns > 0 ? ` • TAUNT ${petTauntTurns}` : ""}</div>
                      <div className="h-2 w-full bg-black/60 rounded overflow-hidden border border-white/10">
                        <div className="h-full bg-emerald-400 transition-all duration-200" style={{ width: `${petMaxHP > 0 ? (petHP / petMaxHP) * 100 : 0}%` }} />
                      </div>
                    </div>
                    {petHP <= 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px]">DEAD</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

                
          {/* ENEMY FRAME */}
          <div ref={tutEnemyRef}>
          <div
            ref={(el) => {
              enemyAnchorRef.current = el;
              tutEnemyRef.current = el;
            }}
            className="absolute top-24 left-[80%] -translate-x-1/2 z-10"
          >
            <div className="relative">
              <EnemyFrame name={enemy?.name} hp={enemyHP} maxHP={enemy?.maxHp} image={enemyImage(enemy?.name)} damaged={enemyDamaged}   affixes={enemy?.affixes || []} />

              
              {hpPopups.filter((p) => p.target === "enemy").map((p) => (
                <HPPopup key={p.id} value={p.value} isCrit={p.isCrit} variant={p.variant || "default"} onDone={() => setHPPopups((prev) => prev.filter((pp) => pp.id !== p.id))} />
              ))}
            </div>
          </div>
          </div>

          {/* ============================================================ */}
          {/* ✅ DARK FANTASY PIXEL COMBAT LOG (A TELJES ÚJ RÉSZ) */}
          {/* ============================================================ */}
          
          <div
            ref={tutLogRef}
            className="absolute top-[62%] left-1/2 -translate-x-1/2
              w-3/4 max-w-2xl h-52
              bg-[#080808] 
              pixel-text-sharp
              z-10
              border-4 border-black
              shadow-[0_0_0_2px_#3d0a0a,0_20px_50px_rgba(0,0,0,0.9)]
              flex flex-col overflow-hidden"
          >
            {/* FEJLÉC: UTOLSÓ ÜZENET */}
            <div className={`px-4 py-3 text-3xl uppercase tracking-widest border-b-4 border-black bg-[#120707] min-h-[64px] flex items-center ${getLogColorClass(log[log.length - 1] || "")}`}>
              {log.length > 0 && <span className="mr-3 text-[#5e0a0a] animate-pulse text-4xl select-none">†</span>}
              <span className="drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                {log.length > 0 ? log[log.length - 1] : "THE RITUAL BEGINS..."}
              </span>
            </div>

            {/* GÖRGETHETŐ LISTA */}
            <div className="flex-1 px-4 py-2 overflow-y-auto dark-log-scroll space-y-1">
              {log.slice(0, -1).map((l, i) => (
                <div key={i} className={`flex items-start gap-2 text-xl opacity-60 hover:opacity-100 transition-opacity duration-300 ${getLogColorClass(l)}`}>
                  <span className="text-[#3d0a0a] mt-1 select-none text-sm">»</span>
                  <span className="drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">{l}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#4d0a0a]/30 to-transparent" />
          </div>

          {/* KÁRTYÁK (HAND) */}
          {!battleOver && (
            <div ref={tutHandRef} className="absolute left-1/2 -translate-x-1/2 flex gap-4 z-50" style={{ bottom: "-80px", pointerEvents: allowHand ? "auto" : "none" }}>
              {!battleOver && turn === "player" && (
       
                    <button
            onClick={passTurn}
            className="absolute left-1/2 -translate-x-1/2 z-[80] px-8 py-3 rounded-lg border-2 border-gray-700 bg-black/80 hover:bg-black text-white pixel-text-sharp"
            style={{ bottom: "240px", marginLeft: "500px" }}
          >
            PASS TURN
          </button>
        )}
              {!battleOver && (
            <div
              className="absolute left-1/2 -translate-x-1/2 z-70 px-4 py-2 rounded-lg border-2 border-gray-700 bg-black/70 text-xl pixel-text-sharp"
              style={{ bottom: "500px" }}
            >
              Stamina: {playerStamina}/{PLAYER_MAX_STAMINA}
            </div>
          )}
              {hand.map((card, slotIndex) => {
                if (!card) return <div key={`empty-${slotIndex}`} className="w-40 h-60 rounded-xl border-4 border-gray-700 bg-black/30" />;
                const rs = rarityStyle[card.rarity] ?? rarityStyle.common;
                const animClass = card._played ? "card-anim-play" : card._anim === "draw" ? "card-anim-draw" : "";
                return (
                  <button
                    key={card._instanceId}
                    onClick={() => playCardAt(slotIndex)}
                    disabled={turn !== "player" || card._played}
                    className={`relative w-40 h-60 rounded-xl overflow-hidden border-4 ${rs.border} ${rs.glow} transform transition-transform duration-200 ${turn === "player" && !card._played ? "hover:scale-125" : ""} ${animClass}`}
                    style={{ pointerEvents: allowHand ? "auto" : "none" }}
                  >
                    <img src={card.image} alt={card.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute bottom-0 w-full bg-black/70 text-center p-1 text-sm pixel-text-sharp">
                      <div className="text-lg">{card.name}</div>
                      {card.type === "attack" && <div className="text-xs">Dmg: {card.dmg?.[0]}–{card.dmg?.[1]} {card.hits > 1 ? `x${card.hits}` : ""}</div>}
                      {card.type === "heal" && <div className="text-xs">Heal: {card.heal} {card.petHeal ? `(Pet:${card.petHeal})` : ""}</div>}
                      {card.petTauntTurns > 0 && <div className="text-[10px] text-emerald-300 tracking-tighter">Taunt: {card.petTauntTurns} kör</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* CSATA VÉGE (GYŐZELEM / VERESÉG) */}
          {battleOver && pendingEnemies.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
              <div className="text-6xl mb-6 pixel-text-sharp drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">
                {playerHP <= 0 ? "DEFEAT..." : "VICTORY!"}
              </div>
              <button
                onClick={() => {
                  if (continueLockRef.current) return;
                  continueLockRef.current = true;
                  setFadeOpen(true);
                }}
                className="px-10 py-4 rounded-lg bg-[#2a0505] border-2 border-[#5e0a0a] hover:bg-[#3d0a0a] transition text-2xl pixel-text-sharp"
              >
                CONTINUE
              </button>
            </div>
          )}

          <AbilityEffectLayer
            effects={abilityEffects}
            onEffectDone={(id) => {
              setAbilityEffects((prev) => {
                const eff = prev.find((e) => e.id === id);
                if (eff && eff.loop) return prev;
                return prev.filter((e) => e.id !== id);
              });
            }}
          />
        </div>
      </div>
      
{tutOpen && tutSteps?.[tutStep]?.ref && (
  <CombatTutorialSpotlight
    targetRef={tutSteps[tutStep].ref}
    text={`${tutSteps[tutStep].title}: ${tutSteps[tutStep].text}`}
    onSkip={skipTutorial}
    onNext={() => {
      const last = tutSteps.length - 1;
      if (tutStep >= last) finishTutorial();
      else setTutStep((s) => s + 1);
    }}
    showNext={true}
  />
)}


      <FadeOverlay
        isOpen={fadeOpen}
        onMid={() => handleContinue()}
        onDone={() => {
          setFadeOpen(false);
          continueLockRef.current = false;
        }}
        inMs={240} holdMs={140} outMs={280} maxOpacity={1}
      />
    </div>
  );
}
//aaa
