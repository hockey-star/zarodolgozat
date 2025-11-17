import React, { useEffect, useState } from "react";
import attackImg from "../assets/class-abilities/attack.png";
import shieldImg from "../assets/class-abilities/shield-wall.png";
import healImg from "../assets/class-abilities/hp-pot.png";
import fireballImg from "../assets/class-abilities/fireball.png";
import "./CombatView.css"; // ide kerül a glow keyframe

export default function CombatView({
  level = 1,
  boss = false,
  background = "/backgrounds/3.jpg",
  enemies = [],
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

  // 🔹 Kártyák rarity-vel
  const cardTemplates = [
    { card: { name: "Kardcsapás", type: "attack", dmg: [5, 10], image: attackImg, rarity: "common" }, count: 10 },
    { card: { name: "Pajzsfal", type: "defend", image: shieldImg, rarity: "rare" }, count: 5 },
    { card: { name: "Gyógyital", type: "heal", heal: 25, image: healImg, rarity: "epic" }, count: 3 },
    { card: { name: "Tűzgolyó", type: "attack", dmg: [8, 14], image: fireballImg, rarity: "epic" }, count: 2 },
  ];

  function generateDeck() {
    const deck = [];
    cardTemplates.forEach(t => {
      for (let i = 0; i < t.count; i++) deck.push({ ...t.card });
    });
    return deck;
  }

  const [deck, setDeck] = useState(generateDeck());
  const [discardPile, setDiscardPile] = useState([]);
  const [hand, setHand] = useState([]);

  const defaultEnemies = ["Bandita", "Farkas", "Csontváz", "Goblin", "Kígyó", "Szellem"];
  const bossEnemies = ["Vérfarkas Úr", "Ősi Lény", "A Sötétség Lovagja"];

  const rarityBorders = {
    common: "border-gray-600",
    rare: "border-blue-500",
    epic: "border-purple-500",
    legendary: "border-yellow-500",
  };

  const glowColors = {
    common: "rgba(107,114,128,0.7)", // gray
    rare: "rgba(59,130,246,0.7)",    // blue
    epic: "rgba(139,92,246,0.7)",    // purple
    legendary: "rgba(234,179,8,0.7)", // yellow
  };

  function pushLog(msg) {
    setLog(prev => [...prev, msg]);
  }

  function drawInitialHand(handSize = 4) {
    const newDeck = [...deck];
    const newHand = [];
    for (let i = 0; i < handSize; i++) {
      if (newDeck.length === 0) break;
      const idx = Math.floor(Math.random() * newDeck.length);
      newHand.push(newDeck.splice(idx, 1)[0]);
    }
    setDeck(newDeck);
    setHand(newHand);
  }

  useEffect(() => {
    const name = boss
      ? bossEnemies[Math.floor(Math.random() * bossEnemies.length)]
      : (enemies.length ? enemies[Math.floor(Math.random() * enemies.length)] : defaultEnemies[Math.floor(Math.random() * defaultEnemies.length)]);

    const e = boss
      ? { name, hp: 120 + level * 12, dmg: [10 + level, 18 + level] }
      : { name, hp: 30 + level * 4, dmg: [4 + Math.floor(level/2), 7 + Math.floor(level/2)] };

    setEnemy(e);
    setEnemyHP(e.hp);
    setLog([`👹 Megjelent egy ${e.name}!`]);
    setTurn("player");
    setBattleOver(false);
    setDefending(false);

    const newDeck = generateDeck();
    setDeck(newDeck);
    setDiscardPile([]);
    drawInitialHand();
  }, [level, boss, enemies]);

  function playCard(card) {
    if (battleOver || turn !== "player") return;
    setHand(prev => prev.filter(c => c !== card));

    if (card.type === "attack") {
      const dmg = Math.floor(Math.random() * (card.dmg[1]-card.dmg[0]+1)) + card.dmg[0];
      pushLog(`${card.name} → ${enemy.name} kap ${dmg} sebzést.`);
      setEnemyHP(prev => Math.max(0, prev-dmg));
      if (enemyHP - dmg <= 0) setBattleOver(true);
    }

    if (card.type === "defend") {
      setDefending(true);
      pushLog("🛡️ Védekezés aktiválva.");
    }

    if (card.type === "heal") {
      const heal = card.heal || 20;
      setPlayerHP(prev => Math.min(prev + heal, initialPlayerHP));
      pushLog(`💉 Gyógyítás: +${heal} HP`);
    }

    setDeck(prevDeck => {
      let newDeck = [...prevDeck];
      setHand(prevHand => {
        let updatedHand = prevHand.filter(c => c !== card);
        while(updatedHand.length < 4) {
          if (newDeck.length === 0 && discardPile.length) {
            newDeck = [...discardPile];
            setDiscardPile([]);
          }
          if (newDeck.length === 0) break;
          const idx = Math.floor(Math.random() * newDeck.length);
          updatedHand.push(newDeck.splice(idx,1)[0]);
        }
        return updatedHand;
      });
      return newDeck;
    });

    setDiscardPile(prev => [...prev, card]);
    setTurn("enemy");
  }

  useEffect(() => {
    if(!enemy || battleOver || turn !== "enemy") return;
    const t = setTimeout(() => {
      const dmg = Math.floor(Math.random() * (enemy.dmg[1]-enemy.dmg[0]+1)) + enemy.dmg[0];
      const final = defending ? Math.floor(dmg/2) : dmg;
      pushLog(`💥 ${enemy.name} megtámad (${final} dmg)`);
      setPlayerHP(prev => {
        const newHP = Math.max(0, prev - final);
        if(newHP===0) setTimeout(()=>setBattleOver(true),700);
        return newHP;
      });
      setDefending(false);
      setTurn("player");
    }, boss ? 1500 : 900);
    return ()=>clearTimeout(t);
  }, [turn, enemy, defending, battleOver, boss]);

  return (
    <div className="relative w-full min-h-screen">
      {/* Háttér */}
      <div className="fixed inset-0 w-full h-full z-0">
        <img src={background} alt="combat bg" className="w-full h-full object-cover"/>
      </div>

      {/* UI */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white">
        {/* HP barok */}
        <div className="w-full max-w-3xl flex justify-between mb-6 px-4">
          <div>
            <div>🧍‍♂️ Játékos HP: {playerHP}</div>
            <div className="bg-gray-700 h-2 w-40 mt-2 rounded overflow-hidden">
              <div className="bg-green-500 h-2 transition-all duration-500" style={{width:`${(playerHP/initialPlayerHP)*100}%`}} />
            </div>
          </div>
          <div className="text-right">
            <div>👹 {enemy?.name} HP: {enemyHP}</div>
            <div className="bg-gray-700 h-2 w-40 mt-2 rounded overflow-hidden">
              <div className="bg-red-500 h-2 transition-all duration-500" style={{width:`${(enemyHP/(enemy?.hp||1))*100}%`}}/>
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="relative w-full max-w-3xl h-40 mb-4 overflow-y-auto font-mono text-sm">
          <div className="absolute inset-0 bg-black/40 rounded"></div>
          <div className="relative z-10 p-3">{log.map((l,i)=><div key={i}>{l}</div>)}</div>
        </div>

        {/* Kártyák */}
        {!battleOver && turn==="player" && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-50">
            {hand.map((card,i)=>{
              const glow = glowColors[card.rarity] || "rgba(107,114,128,0.7)";
              return (
                <button
                  key={i}
                  onClick={()=>playCard(card)}
                  style={{"--glow-color": glow}}
                  className={`relative w-36 h-52 rounded-xl overflow-hidden border ${rarityBorders[card.rarity] || "border-gray-600"} transform transition-all duration-300 card-hover-glow`}
                >
                  <img src={card.image} alt={card.name} className="absolute inset-0 w-full h-full object-cover"/>
                  <div className="absolute bottom-0 w-full bg-black/60 text-white text-center p-1 text-sm">
                    <div className="font-bold">{card.name}</div>
                    {card.type==="attack" && <div>Sebzés: {card.dmg[0]}–{card.dmg[1]}</div>}
                    {card.type==="defend" && <div>Védekezés</div>}
                    {card.type==="heal" && <div>Gyógyítás: {card.heal}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Battle over */}
        {battleOver && (
          <div className="mt-6 text-center z-10">
            <div className="mb-3 text-2xl">{playerHP<=0?"☠️ Elbuktál!":"🏆 Győzelem!"}</div>
            <button
              onClick={()=>onEnd(playerHP, enemyHP===0)}
              className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
            >Folytatás</button>
          </div>
        )}
      </div>
    </div>
  );
}
