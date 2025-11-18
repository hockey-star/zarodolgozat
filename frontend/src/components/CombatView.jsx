import React, { useEffect, useState } from "react";
import { defaultEnemies, bossEnemies } from "./enemyData";
import EnemyFrame from "./EnemyFrame";
import HPPopup from "./HPPopup";

import attackImg from "../assets/class-abilities/attack.png";
import shieldImg from "../assets/class-abilities/shield-wall.png";
import healImg from "../assets/class-abilities/hp-pot.png";
import fireballImg from "../assets/class-abilities/fireball.png";

export default function CombatView({
  level = 1,
  boss = false,
  background = "/backgrounds/3.jpg",
  playerHP: initialPlayerHP = 120,
  onEnd,
}) {
  const [log, setLog] = useState([]);
  const [playerHP, setPlayerHP] = useState(initialPlayerHP);
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

  const rarityStyle = {
    common: { border: "border-gray-600", glow: "hover:shadow-[0_0_20px_6px_rgba(156,163,175,0.8)]" },
    rare: { border: "border-blue-500", glow: "hover:shadow-[0_0_25px_8px_rgba(59,130,246,0.9)]" },
    epic: { border: "border-purple-500", glow: "hover:shadow-[0_0_30px_10px_rgba(168,85,247,1)]" },
    legendary: { border: "border-yellow-500", glow: "hover:shadow-[0_0_35px_12px_rgba(234,179,8,1)]" },
  };

  const cardTemplates = [
    { card: { name: "Slash", type: "attack", dmg: [5, 10], image: attackImg, rarity: "common" }, count: 10 },
    { card: { name: "Shield Wall", type: "defend", image: shieldImg, rarity: "rare" }, count: 5 },
    { card: { name: "Healing Potion", type: "heal", heal: 25, image: healImg, rarity: "epic" }, count: 3 },
    { card: { name: "Fireball", type: "attack", dmg: [8, 14], image: fireballImg, rarity: "epic" }, count: 2 },
  ];

  function generateDeck() {
    const deck = [];
    cardTemplates.forEach(t => {
      for (let i = 0; i < t.count; i++) deck.push({ ...t.card });
    });
    return deck;
  }

  function pushLog(msg) {
    setLog(prev => [...prev, msg]);
  }

  function enemyImage(name) {
    if (!name) return "";
    return `/ui/enemies/${name.toLowerCase().replace(/ /g, "-")}.png`;
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
    setHand(prevHand => {
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

  // INITIALIZE ENEMY + DECK
  useEffect(() => {
    const name = boss
      ? bossEnemies[Math.floor(Math.random() * bossEnemies.length)]
      : defaultEnemies[Math.floor(Math.random() * defaultEnemies.length)];

    const e = boss
      ? { name, hp: 120 + level * 12, dmg: [10 + level, 18 + level] }
      : { name, hp: 30 + level * 4, dmg: [4 + Math.floor(level / 2), 7 + Math.floor(level / 2)] };

    setEnemy(e);
    setEnemyHP(e.hp);

    setLog([`⚔️ A ${e.name} challenged you!`]);
    setBattleOver(false);
    setTurn("player");
    setDefending(false);

    const newDeck = generateDeck();
    const { hand: initialHand, deck: remainingDeck } = drawInitialHand(newDeck);
    setDeck(remainingDeck);
    setDiscardPile([]);
    setHand(initialHand);
  }, [level, boss]);


  // POPUP + damage/heal flash
  function addHPPopup(value, target, x, y) {
    const id = Date.now() + Math.random();
    setHPPopups(prev => [...prev, { id, value, target, x, y }]);

    if (value < 0) {
      // DAMAGE
      if (target === "player") {
        setPlayerDamaged(true);
        setTimeout(() => setPlayerDamaged(false), 300);
      } else {
        setEnemyDamaged(true);
        setTimeout(() => setEnemyDamaged(false), 300);
      }
    } else {
      // HEAL
      if (target === "player") {
        setPlayerHealed(true);
        setTimeout(() => setPlayerHealed(false), 400);
      }
    }
  }

  // PLAY CARD
  function playCard(card) {
    if (battleOver || turn !== "player") return;

    setHand(prev => prev.filter(c => c !== card));
    setDiscardPile(p => [...p, card]);

    if (card.type === "attack") {
      const dmg = Math.floor(Math.random() * (card.dmg[1] - card.dmg[0] + 1)) + card.dmg[0];
      setEnemyHP(prev => {
        const newHP = Math.max(0, prev - dmg);
        addHPPopup(-dmg, "enemy", "74%", "120px");
        pushLog(`${card.name} → ${enemy.name} takes ${dmg} damage.`);
        return newHP;
      });
    }

    if (card.type === "defend") {
      setDefending(true);
      pushLog("🛡️ Defense activated!");
    }

    if (card.type === "heal") {
      const heal = card.heal || 20;
      setPlayerHP(prev => {
        const newHP = Math.min(prev + heal, initialPlayerHP);
        addHPPopup(+heal, "player", "24%", "120px");
        pushLog(`✨ Healing: +${heal} HP`);
        return newHP;
      });
    }

    setTurn("enemy");
    redrawHand();
  }

  // **CHECK FOR DEFEAT OR VICTORY CLEANLY**
  useEffect(() => {
    if (!enemy) return;
    if (playerHP <= 0 || enemyHP <= 0) {
      setBattleOver(true);
    }
  }, [playerHP, enemyHP]);


  // **ENEMY TURN**
  useEffect(() => {
    if (!enemy || battleOver || turn !== "enemy") return;

    const t = setTimeout(() => {
      const dmg = Math.floor(Math.random() * (enemy.dmg[1] - enemy.dmg[0] + 1)) + enemy.dmg[0];
      const final = defending ? Math.floor(dmg / 2) : dmg;

      setPlayerHP(prev => {
        const newHP = Math.max(0, prev - final);
        addHPPopup(-final, "player", "24%", "120px");
        return newHP;
      });

      pushLog(`💥 ${enemy.name} attacks (${final} dmg)`);

      setDefending(false);
      setTurn("player");
    }, boss ? 1400 : 900);

    return () => clearTimeout(t);
  }, [turn, enemy, defending, battleOver, boss]);


  return (
    <div className="relative w-full min-h-screen text-white">
      {/* BACKGROUND */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <img src={background} alt="bg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      {/* PLAYER + ENEMY */}
      <div className="pt-12 flex justify-around w-full max-w-6xl mx-auto z-10 relative">
        
        {/* PLAYER */}
        <EnemyFrame
          name="Player"
          hp={playerHP}
          maxHP={initialPlayerHP}
          image="/ui/player/player.png"
          damaged={playerDamaged}
          healed={playerHealed}
        />

        {/* ENEMY */}
        <EnemyFrame
          name={enemy?.name}
          hp={enemyHP}
          maxHP={enemy?.hp}
          image={enemyImage(enemy?.name)}
          damaged={enemyDamaged}
        />

        {/* POPUPS */}
        {hpPopups.map(p => (
          <HPPopup key={p.id} value={p.value} x={p.x} y={p.y}
            onDone={() => setHPPopups(prev => prev.filter(pp => pp.id !== p.id))}
          />
        ))}
      </div>

      {/* COMBAT LOG */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[1%] w-3/4 max-w-2xl bg-black/50 rounded p-4 h-48 overflow-y-auto font-mono text-sm z-10">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      {/* CARDS */}
      {!battleOver && turn === "player" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-50">
          {hand.map((card, i) => {
            const rs = rarityStyle[card.rarity] ?? rarityStyle.common;
            return (
              <button key={i} onClick={() => playCard(card)}
                className={`relative w-36 h-52 rounded-xl overflow-hidden
                border-4 ${rs.border}
                transform transition-all duration-200 hover:scale-110
                ${rs.glow}`}>
                <img src={card.image} alt={card.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute bottom-0 w-full bg-black/70 text-center p-1 text-sm">
                  <div className="font-bold">{card.name}</div>
                  {card.type === "attack" && <div>Damage: {card.dmg[0]}–{card.dmg[1]}</div>}
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
          <div className="text-4xl mb-4">{playerHP <= 0 ? "☠️ Defeat..." : "🏆 Victory!"}</div>
          <button onClick={() => onEnd(playerHP, enemyHP === 0)}
            className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-lg">
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
