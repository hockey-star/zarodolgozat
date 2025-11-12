import React, { useEffect, useState } from "react";

export default function CombatView({
  level = 1,
  boss = false,
  background,
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

  // 🔹 Kártya sablonok és darabszám
  const cardTemplates = [
    { card: { name: "🗡️ Kardcsapás", type: "attack", dmg: [5, 10] }, count: 6 },
    { card: { name: "🛡️ Pajzsfal", type: "defend" }, count: 4 },
    { card: { name: "💉 Gyógyital", type: "heal", heal: 25 }, count: 5 },
    { card: { name: "🔥 Tűzgolyó", type: "attack", dmg: [8, 14] }, count: 5 },
  ];

  function generateDeck() {
    const deck = [];
    cardTemplates.forEach(template => {
      for (let i = 0; i < template.count; i++) {
        deck.push({ ...template.card });
      }
    });
    return deck;
  }

  const [deck, setDeck] = useState(generateDeck());
  const [discardPile, setDiscardPile] = useState([]);
  const [hand, setHand] = useState([]);

  const defaultEnemies = ["Bandita", "Farkas", "Csontváz", "Goblin", "Kígyó", "Szellem"];
  const bossEnemies = ["Vérfarkas Úr", "Ősi Lény", "A Sötétség Lovagja"];

  function pushLog(msg) {
    setLog(prev => [...prev, msg]);
  }

  // 🔹 Kezdőkéz húzása (4 lap)
  function drawInitialHand(handSize = 4) {
    const newDeck = [...deck];
    const newHand = [];

    for (let i = 0; i < handSize; i++) {
      if (newDeck.length === 0) break;
      const index = Math.floor(Math.random() * newDeck.length);
      newHand.push(newDeck.splice(index, 1)[0]);
    }

    setDeck(newDeck);
    setHand(newHand);
  }

  // 🔹 Ellenfél kiválasztása és kezdőkéz
  useEffect(() => {
    const name = boss
      ? bossEnemies[Math.floor(Math.random() * bossEnemies.length)]
      : (enemies.length > 0
          ? enemies[Math.floor(Math.random() * enemies.length)]
          : defaultEnemies[Math.floor(Math.random() * defaultEnemies.length)]);

    const e = boss
      ? { name, hp: 120 + level * 12, dmg: [10 + level, 18 + level] }
      : { name, hp: 30 + level * 4, dmg: [4 + Math.floor(level / 2), 7 + Math.floor(level / 2)] };

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

  // 🔹 Kártya kijátszása (fix kézméret)
  function playCard(card) {
    if (battleOver || turn !== "player") return;

    // Kijátszott lap eltávolítása a kézből
    setHand(prevHand => prevHand.filter(c => c !== card));

    // Kártya hatása
    if (card.type === "attack") {
      const dmg = Math.floor(Math.random() * (card.dmg[1] - card.dmg[0] + 1)) + card.dmg[0];
      pushLog(`${card.name} - ${enemy.name} sebződik ${dmg} pontot.`);
      setEnemyHP(prev => Math.max(0, prev - dmg));
      if (enemyHP - dmg <= 0) setBattleOver(true);
    } else if (card.type === "defend") {
      pushLog("🛡️ Védekező állást vettél fel.");
      setDefending(true);
    } else if (card.type === "heal") {
      const heal = card.heal || 20;
      setPlayerHP(prev => Math.min(prev + heal, initialPlayerHP));
      pushLog(`💉 Gyógyítasz ${heal} HP-t.`);
    }

    // Új lap húzása csak annyit, hogy a kéz újra 4 lapos legyen
    setDeck(prevDeck => {
      let newDeck = [...prevDeck];
      let updatedHand = [...hand.filter(c => c !== card)];

      while (updatedHand.length < 4) {
        if (newDeck.length === 0 && discardPile.length > 0) {
          newDeck = [...discardPile];
          setDiscardPile([]);
        }
        if (newDeck.length === 0) break;
        const index = Math.floor(Math.random() * newDeck.length);
        const newCard = newDeck.splice(index, 1)[0];
        updatedHand.push(newCard);
      }

      setHand(updatedHand);
      return newDeck;
    });

    // Kijátszott lap a discard pile-be kerül
    setDiscardPile(prev => [...prev, card]);

    setTurn("enemy");
  }

  // 🔹 Enemy AI
  useEffect(() => {
    if (!enemy || battleOver || turn !== "enemy") return;

    const t = setTimeout(() => {
      const dmg = Math.floor(Math.random() * (enemy.dmg[1] - enemy.dmg[0] + 1)) + enemy.dmg[0];
      const final = defending ? Math.floor(dmg / 2) : dmg;
      pushLog(`💥 A ${enemy.name} megtámadott (${final} dmg)`);
      setPlayerHP(prev => {
        const newHP = Math.max(0, prev - final);
        if (newHP === 0) {
          pushLog("☠️ Meghaltál!");
          setTimeout(() => setBattleOver(true), 700);
        }
        return newHP;
      });

      setDefending(false);
      setTurn("player");
    }, boss ? 1500 : 900);

    return () => clearTimeout(t);
  }, [turn, enemy, defending, battleOver, boss]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white">
      {background && (
        <img
          src={background}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          alt="combat bg"
        />
      )}

      <div className="z-10 w-full max-w-3xl flex justify-between mb-6 px-4">
        <div>
          <div>🧍‍♂️ Játékos HP: {playerHP}</div>
          <div className="bg-gray-700 h-2 w-40 mt-2 rounded overflow-hidden">
            <div
              className="bg-green-500 h-2 transition-all duration-500"
              style={{ width: `${(playerHP / initialPlayerHP) * 100}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <div>👹 {enemy?.name} HP: {enemyHP}</div>
          <div className="bg-gray-700 h-2 w-40 mt-2 rounded overflow-hidden">
            <div
              className="bg-red-500 h-2 transition-all duration-500"
              style={{ width: `${(enemyHP / (enemy?.hp || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="z-10 bg-black/40 p-3 rounded w-full max-w-3xl h-40 overflow-y-auto mb-4 font-mono text-sm">
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      {!battleOver && turn === "player" && (
        <div className="z-10 flex gap-4 justify-center mt-4">
          {hand.map((card, i) => (
            <button
              key={i}
              onClick={() => playCard(card)}
              className="bg-gray-800 border border-gray-600 px-4 py-3 rounded-lg w-40 hover:scale-105 hover:bg-gray-700 transition transform"
            >
              <div className="font-bold">{card.name}</div>
              <div className="text-sm opacity-80">
                {card.type === "attack" && `Sebzés: ${card.dmg[0]}–${card.dmg[1]}`}
                {card.type === "defend" && `Védekezés növelése`}
                {card.type === "heal" && `Gyógyít ${card.heal} HP-t`}
              </div>
            </button>
          ))}
        </div>
      )}

      {battleOver && (
        <div className="mt-6 text-center z-10">
          <div className="mb-3 text-2xl">
            {playerHP <= 0 ? "☠️ Elbuktál!" : "🏆 Győzelem!"}
          </div>
          <button
            onClick={() => onEnd(playerHP, enemyHP === 0)}
            className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            Folytatás
          </button>
        </div>
      )}
    </div>
  );
}
