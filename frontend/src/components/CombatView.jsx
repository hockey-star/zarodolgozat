// frontend/src/components/CombatView.jsx
import React, { useEffect, useState, useMemo } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";
import { getRandomEnemy } from "./enemyData";
import EnemyFrame from "./EnemyFrame";
import HPPopup from "./HPPopup";
import combatIntroVideo from "../assets/transitions/combat-intro.webm";


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
  const [defending, setDefending] = useState(false); // lehet szám is (körök)

  // Deck / kéz / discard
  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [hand, setHand] = useState([]);

  // animációk
  const [hpPopups, setHPPopups] = useState([]);
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [playerHealed, setPlayerHealed] = useState(false);
  const [enemyDamaged, setEnemyDamaged] = useState(false);

  //effectek
   const [abilityEffects, setAbilityEffects] = useState([]);

  function spawnAbilityEffect({ src, target = "center", width, height }) {
    const id = Date.now() + Math.random();
    setAbilityEffects((prev) => [
      ...prev,
      { id, src, target, width, height },
    ]);
  }

  // 🔥 ÚJ: átmeneti buffok / negatív hatások
  const [playerDamageBuff, setPlayerDamageBuff] = useState(null); // {multiplier, remainingAttacks}
  const [enemyPoison, setEnemyPoison] = useState(null); // {damagePerTurn, remainingTurns}
  const [enemyBurn, setEnemyBurn] = useState(null); // {damagePerTurn, remainingTurns}
  const [enemyStun, setEnemyStun] = useState(0); // ❄️ hány enemy-kört hagy ki
  const [enemyVulnerability, setEnemyVulnerability] = useState(null); // 🔮 {multiplier, remainingTurns}
  const [enemyBleed, setEnemyBleed] = useState(null); // 🩸 {percent, remainingTurns}

  // transition flag


  // log + jutalom
  const [log, setLog] = useState([]);
  const [lastRewards, setLastRewards] = useState(null);

  const bg = useMemo(
    () => resolveBackground(background, pathType),
    [background, pathType]
  );

  // minden új harcnál induljon a transition

  // rarity style
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
        // 🔥 plusz meta a skillekhez
        hits: ab.hits || 1,
        poison: ab.poison || null,
        damageBuff: ab.damageBuff || null,
        burn: ab.burn || null,
        drain: ab.drain || false,
        stunTurns: ab.stunTurns || 0,
        defenseTurns: ab.defenseTurns || 0,
        vulnerabilityDebuff: ab.vulnerabilityDebuff || null,
        bleed: ab.bleed || null, // 🩸 Slash bleed
        executeBelowPercent: ab.executeBelowPercent || null, // ☠️ Crushing Blow
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

        // 🔥 CLASS QUEST BOSS – ha boss fight van
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
  }, [level, boss, pathType, enemies, player, classKey]);

  // KÁRTYA KIJÁTSZÁSA – CLASS ALAPÚ SKÁLÁZÁS + BLEED + EXECUTE
  function playCard(card) {
    if (battleOver || turn !== "player" || !enemy) return;

    setHand((prev) => prev.filter((c) => c !== card));
    setDiscardPile((p) => [...p, card]);

    const playerStrength = player?.strength ?? 0;
    const playerIntellect = player?.intellect ?? 0;
    const playerDefense = player?.defense ?? 0;

    const playerAgi = playerStrength; // amíg nincs külön AGI

    if (card.type === "attack") {
      let baseMin = card.dmg?.[0] ?? 4;
      let baseMax = card.dmg?.[1] ?? 8;
            // 🔮 Arcane Missiles
      if (card.abilityId === "mage_arcane_missiles") {
        spawnAbilityEffect({
          src: arcaneMissilesFx,
          target: "enemy",
          width: "300px",
          height: "300px",
        });
      }
      if (card.abilityId === "mage_ice_lance") {
      spawnAbilityEffect({
        src: icelance,
        target: "enemy",
        width: "420px",
        height: "420px",
      });
}

      // 🔥 Fireball
      if (card.abilityId === "mage_fireball") {
        spawnAbilityEffect({
          src: fireballFx,
          target: "enemy",
          width: "500px",
          height: "500px",
        });
      }
      // 🔮 Arcane Surge – sima enemy debuff
  if (card.abilityId === "mage_arcane_surge") {
    spawnAbilityEffect({
      src: arcaneSurgeFx,
      target: "enemy_aoe",
      width: "500px",
      height: "500px",
    });
  }

  // ❄️ Frost Nova – nagy kör az enemy körül
  if (card.abilityId === "mage_frost_nova") {
    spawnAbilityEffect({
      src: frostNovaFx,
      target: "enemy_aoe",
      width: "520px",
      height: "520px",
    });
  }

  // ⚡ Lightning Bolt – single target villám az enemyre
  if (card.abilityId === "mage_lightning_bolt") {
    spawnAbilityEffect({
      src: lightningBoltFx,
      target: "enemy",
      width: "450px",
      height: "450px",
    });
  }

  // ⚡ Chain Lightning – villám az enemyen (a videó maga lehet „chain”)
  if (card.abilityId === "mage_chain_lightning") {
    spawnAbilityEffect({
      src: chainLightningFx,
      target: "enemy",
      width: "500px",
      height: "500px",
    });
  }


  // 🧛 Drain Life – középen „pettyegő” drain effekt player–enemy között
  if (card.abilityId === "mage_drain_life") {
    spawnAbilityEffect({
      src: drainLifeFx,
      target: "enemy",
      width: "1200px",
      height: "400px",
    });
  }

  
      if (classKey === "warrior") {
        const bonus = Math.floor(playerStrength * 0.35);
        baseMin += bonus;
        baseMax += bonus;
      } else if (classKey === "mage") {
        const bonus = Math.floor(playerIntellect * 0.5);
        baseMin += bonus;
        baseMax += bonus;
      } else if (classKey === "archer") {
        const bonus = Math.floor(playerAgi * 0.3);
        baseMin += bonus;
        baseMax += bonus;
      }

      if (baseMin < 1) baseMin = 1;
      if (baseMax < baseMin) baseMax = baseMin;

      const hits = card.hits || 1;
      const dmgRolls = [];

      for (let i = 0; i < hits; i++) {
        const roll =
          Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
        dmgRolls.push(roll);
      }

      // Íjász crit – per hit
      if (classKey === "archer") {
        const critChance = Math.min(50, playerAgi * 1.5);
        for (let i = 0; i < dmgRolls.length; i++) {
          if (Math.random() * 100 < critChance) {
            dmgRolls[i] = Math.floor(dmgRolls[i] * 2.0);
            pushLog("💥 Kritikus találat!");
          }
        }
      }

      // ✅ Alap sebzés lista
      let finalRolls = [...dmgRolls];

      // ☠️ CRUSHING BLOW – EXECUTE (HP% alatt duplázza a sebzést)
      if (card.executeBelowPercent) {
        const hpPercent = enemy?.maxHp
          ? Math.floor((enemyHP / enemy.maxHp) * 100)
          : 100;
        if (hpPercent <= card.executeBelowPercent) {
          finalRolls = finalRolls.map((d) => d * 2);
          pushLog("☠️ Crushing Blow – kivégzés!");
        }
      }

      // Rallying Shout / dmg buff – 1 támadásra
      if (playerDamageBuff && playerDamageBuff.multiplier) {
        finalRolls = finalRolls.map((d) =>
          Math.floor(d * playerDamageBuff.multiplier)
        );
        pushLog("🩸 A Rallying Shout erősíti a támadásod!");

        const remaining =
          (playerDamageBuff.remainingAttacks ?? 1) - 1;
        if (remaining <= 0) {
          setPlayerDamageBuff(null);
        } else {
          setPlayerDamageBuff((prev) =>
            prev
              ? { ...prev, remainingAttacks: remaining }
              : null
          );
        }
      }

      // 🔮 Enemy vulnerability (Arcane Surge) – extra szorzó minden sebzésre
      if (enemyVulnerability && enemyVulnerability.multiplier) {
        finalRolls = finalRolls.map((d) =>
          Math.floor(d * enemyVulnerability.multiplier)
        );
        pushLog(
          `🔮 A korábbi Arcane Surge miatt ${enemy.name} több sebzést szenved el!`
        );
      }

      // 🔥 Sebzés alkalmazása enemy-re KÉSLELTETVE (multi-hit + drain támogatás)
      finalRolls.forEach((dmg, index) => {
        setTimeout(() => {
          // Enemy sebzés
          setEnemyHP((prev) => {
            const newHP = Math.max(0, prev - dmg);
            addHPPopup(-dmg, "enemy", "74%", "120px");
            pushLog(`${card.name} → ${enemy.name} kap ${dmg} sebzést.`);
            return newHP;
          });

          // 🔥 Drain Life – heal tick is
          if (card.drain && card.heal) {
            setPlayerHP((prev) => {
              const newHP = Math.min(prev + card.heal, maxHPFromPlayer);
              addHPPopup(+card.heal, "player", "24%", "120px");
              pushLog(`🧛 Drain Life gyógyít: +${card.heal} HP.`);
              return newHP;
            });
          }
        }, index * 220);
      });

      // Poison Arrow – méreg DoT beállítása
      if (card.poison && card.poison.damagePerTurn > 0 && card.poison.turns > 0) {
        const dpt = card.poison.damagePerTurn;
        const turns = card.poison.turns;
        setEnemyPoison({
          damagePerTurn: dpt,
          remainingTurns: turns,
        });
        pushLog(
          `☠️ ${enemy.name} megmérgezve: ${dpt} sebzés ${turns} körön át.`
        );
      }

      // 🩸 Slash – BLEED DoT stack
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

          return {
            percent: nextPercent,
            remainingTurns: card.bleed.turns, // frissíti a durációt
          };
        });

        pushLog(
          `🩸 Vérzés! ${enemy.name} minden körben sebződik a Slash miatt.`
        );
      }

      // 🔥 Fireball burn – égés DoT
      if (card.burn && card.burn.percent && card.burn.turns) {
        const totalHit = finalRolls.reduce((a, b) => a + b, 0);
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

      // ❄️ Frost Nova – stun
       if (card.stunTurns && card.stunTurns > 0) {
        // 🔥 stun effekt
        spawnAbilityEffect({
          src: stunFx,
          target: "enemy_stun",
          width: "330px",
          height: "330px",
        });

        setEnemyStun((prev) => prev + card.stunTurns);
        pushLog(
          `❄️ ${enemy.name} elkábult, kihagyja a következő körét!`
        );
      }
      // 🔮 Arcane Surge – enemy vulnerability debuff
      if (card.vulnerabilityDebuff && card.vulnerabilityDebuff.multiplier) {
        const mult = card.vulnerabilityDebuff.multiplier ?? 1.15;
        const turns = card.vulnerabilityDebuff.turns ?? 3;
        setEnemyVulnerability({
          multiplier: mult,
          remainingTurns: turns,
        });
        pushLog(
          `🔮 ${enemy.name} sebezhetővé válik: +${Math.round(
            (mult - 1) * 100
          )}% sebzést kap ${turns} körig!`
        );
      }
    }
    
    
    
if (card.type === "defend") {
  // 🛡️ Mage – Mana Shield (villogó pajzs a player körül)
  if (card.abilityId === "mage_mana_shield") {
    spawnAbilityEffect({
      src: manaShieldFx,
      target: "player_shield",
      width: "550px",
      height: "550px",
    });
  }

  // ✅ Shield Wall – több körös védekezés
  if (card.defenseTurns && card.defenseTurns > 1) {
    setDefending(card.defenseTurns);
    pushLog(
      `🛡️ ${card.name}: védekezés aktiválva ${card.defenseTurns} körre!`
    );
  } else {
    setDefending(1);
    pushLog("🛡️ Védekezés aktiválva – a következő ütés felezve.");
  }

  // ✅ Parry / stun-os defend skillek
  if (card.stunTurns && card.stunTurns > 0) {
    spawnAbilityEffect({
      src: stunFx,
      target: "enemy_stun",
      width: "220px",
      height: "220px",
    });

    setEnemyStun((prev) => prev + card.stunTurns);
    pushLog(`⚔️ Parry! ${enemy.name} elkábul, kihagyja a körét!`);
  }
}
if (card.type === "heal") {
      // 🔥 BÁRMELY KASZT HEAL KÁRTYÁJA → UGYANAZ A HEAL VFX A PLAYEREN
      spawnAbilityEffect({
        src: healFx,
        target: "player",
        width: "450px",
        height: "450px",
      });

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
        addHPPopup(+healAmount, "player", "24%", "120px");
        pushLog(
          `✨ ${card.name}: +${healAmount} HP (most ${newHP}/${maxHPFromPlayer})`
        );
        return newHP;
      });

      // Rallying Shout – sebzés buff a következő támadásra
      if (card.damageBuff && card.damageBuff.multiplier) {
        const mult = card.damageBuff.multiplier ?? 1.5;
        const turns = card.damageBuff.turns ?? 1;
        setPlayerDamageBuff({
          multiplier: mult,
          remainingAttacks: turns,
        });
        pushLog(
          `📣 ${card.name}: a következő ${turns} támadásod +${Math.round(
            (mult - 1) * 100
          )}% sebzést okoz!`
        );
      }
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

  // ENEMY KÖR – burn, poison, bleed, stun, attack
  useEffect(() => {
    if (!enemy || battleOver || turn !== "enemy") return;

    const t = setTimeout(() => {
      // 🔥 Égés tick (Fireball burn)
      if (enemyBurn && enemyHP > 0) {
        const burnDmg = enemyBurn.damagePerTurn ?? 0;
        const newHP = Math.max(0, enemyHP - burnDmg);

        if (burnDmg > 0) {
          setEnemyHP(newHP);
          addHPPopup(-burnDmg, "enemy", "74%", "120px");
          pushLog(
            `🔥 Égés sebzés: ${burnDmg} (${enemy.name} – ${newHP} HP).`
          );
        }

        const remaining = (enemyBurn.remainingTurns ?? 1) - 1;
        if (remaining <= 0 || newHP <= 0) {
          setEnemyBurn(null);
        } else {
          setEnemyBurn((prev) =>
            prev
              ? { ...prev, remainingTurns: remaining }
              : null
          );
        }

        if (newHP <= 0) {
          setDefending(false);
          setTurn("player");
          return;
        }
      }

      // 🔥 Méreg tick enemy-n, mielőtt támadna
      if (enemyPoison && enemyHP > 0) {
        const poisonDmg = enemyPoison.damagePerTurn ?? 0;
        const newHP = Math.max(0, enemyHP - poisonDmg);

        if (poisonDmg > 0) {
          setEnemyHP(newHP);
          addHPPopup(-poisonDmg, "enemy", "74%", "120px");
          pushLog(
            `☠️ Méreg sebzés: ${poisonDmg} (${enemy.name} – ${newHP} HP).`
          );
        }

        const remaining = (enemyPoison.remainingTurns ?? 1) - 1;
        if (remaining <= 0 || newHP <= 0) {
          setEnemyPoison(null);
        } else {
          setEnemyPoison((prev) =>
            prev
              ? { ...prev, remainingTurns: remaining }
              : null
          );
        }

        // Ha a méreg megölte az enemy-t, ne támadjon
        if (newHP <= 0) {
          setDefending(false);
          setTurn("player");
          return;
        }
      }

      // 🩸 BLEED tick enemy-n
      if (enemyBleed && enemyHP > 0) {
        const bleedDmg = Math.max(
          1,
          Math.floor((enemy.maxHp * enemyBleed.percent) / 100)
        );
        const newHP = Math.max(0, enemyHP - bleedDmg);

        setEnemyHP(newHP);
        addHPPopup(-bleedDmg, "enemy", "74%", "120px");
        pushLog(
          `🩸 Vérzés: ${bleedDmg} sebzés (${enemyBleed.percent}%).`
        );

        const remaining = (enemyBleed.remainingTurns ?? 1) - 1;
        if (remaining <= 0 || newHP <= 0) {
          setEnemyBleed(null);
        } else {
          setEnemyBleed((prev) =>
            prev
              ? { ...prev, remainingTurns: remaining }
              : null
          );
        }

        if (newHP <= 0) {
          setDefending(false);
          setTurn("player");
          return;
        }
      }

      // ❄️ STUN – ha van, enemy kihagyja a körét
      if (enemyStun > 0 && enemyHP > 0) {
        pushLog(`❄️ ${enemy.name} elkábulva marad, kihagyja a körét!`);
        setEnemyStun((prev) => Math.max(0, prev - 1));
        setDefending(false);
        setTurn("player");

        // vulnerability debuff időzítése: enemy kör végén csökken
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

      // ha nem stunolt, akkor támad
      const [minDmg, maxDmg] = enemy.dmg;
      let dmg =
        Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;

      if (defending && defending > 0) {
        dmg = Math.floor(dmg / 2);
        setDefending((prev) => Math.max(0, (prev || 1) - 1)); // körök csökkentése
      }

      const playerDefense = player?.defense ?? 0;
      const final = Math.max(0, dmg - Math.floor(playerDefense / 2));

      setPlayerHP((prev) => {
        const newHP = Math.max(0, prev - final);
        addHPPopup(-final, "player", "24%", "120px");
        return newHP;
      });

      pushLog(`💥 ${enemy.name} támad (${final} sebzés).`);

      // enemy vulnerability körök csökkentése
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
  ]);

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

    // 🔥 QUEST PROGRESS – BACKEND HÍVÁSOK 🔥
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

      {/* KÁRTYÁK – transition alatt NINCSENEK */}
      {!battleOver && turn === "player" &&(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-50">
          {hand.map((card, i) => {
            const rs = rarityStyle[card.rarity] ?? rarityStyle.common;
            const imgSrc = card.image;
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
      
      {/* INTRO TRANSITION VIDEO – WEBM ÁTLÁTSZÓVAL */}
          {/* ABILITY VIDEÓ EFFECT OVERLAY */}
      <AbilityEffectLayer
        effects={abilityEffects}
        onEffectDone={(id) =>
          setAbilityEffects((prev) => prev.filter((fx) => fx.id !== id))
        }
      />
    </div>
  );
}
  

