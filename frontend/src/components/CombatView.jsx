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

  const defaultEnemies = ["Bandita", "Farkas", "Csontváz", "Goblin", "Kígyó", "Szellem"];
  const bossEnemies = ["Vérfarkas Úr", "Ősi Lény", "A Sötétség Lovagja"];

  // 🔹 Ellenfél kiválasztása
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
  }, [level, boss, enemies]);

  function pushLog(msg) {
    setLog(prev => [...prev, msg]);
  }

  // 🔹 Támadás
  function attack() {
    if (battleOver || turn !== "player") return;
    const dmg = Math.floor(Math.random() * 6) + 3;
    pushLog(`🗡️ Megütötted a ${enemy.name}-t (${dmg} dmg)`);

    // először frissítjük az HP-t, hogy animáció fusson
    setEnemyHP(prev => {
      const newHP = Math.max(0, prev - dmg);
      if (newHP === 0) {
        pushLog(`🏆 Legyőzted a ${enemy.name}-t!`);
        setTimeout(() => setBattleOver(true), 500); // delay battleOver
      } else {
        setTurn("enemy");
      }
      return newHP;
    });
  }

  // 🔹 Védekezés
  function defend() {
    if (battleOver || turn !== "player") return;
    pushLog("🛡️ Védekező állást vettél fel.");
    setDefending(true);
    setTurn("enemy");
  }

  // 🔹 Ital
  function usePotion() {
    if (battleOver || turn !== "player") return;
    const heal = 100;
    setPlayerHP(prev => Math.min(prev + heal, initialPlayerHP));
    pushLog(`💉 Italt használtál (+${heal} HP)`);
    setTurn("enemy");
  }

  // 🔹 Enemy AI
  useEffect(() => {
    if (!enemy || battleOver || turn !== "enemy") return;

    const t = setTimeout(() => {
      const action = Math.random() < 0.85 ? "attack" : "wait";

      if (action === "wait") {
        pushLog(`👹 A ${enemy.name} kivár...`);
        setTurn("player");
        return;
      }

      const raw = Math.floor(Math.random() * (enemy.dmg[1] - enemy.dmg[0] + 1)) + enemy.dmg[0];
      const dmg = defending ? Math.floor(raw / 2) : raw;

      pushLog(`💥 A ${enemy.name} megtámadott (${dmg} dmg)`);
      setPlayerHP(prev => {
        const newHP = Math.max(0, prev - dmg);
        if (newHP === 0) {
          pushLog("☠️ Meghaltál!");
          setTimeout(() => setBattleOver(true), 500);
        }
        return newHP;
      });

      setDefending(false);
      setTurn("player");
    }, boss ? 1500 : 900);

    return () => clearTimeout(t);
  }, [turn, enemy, defending, battleOver, boss]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      {/* 🔸 Háttér */}
      {background && (
        <img
          src={background}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: "pixelated" }}
          alt="combat bg"
        />
      )}

      {/* 🔸 Boss overlay */}
      {boss && <div className="absolute inset-0 bg-red-900/20 animate-pulse"></div>}

      {/* 🔸 Tartalom */}
      <div className={`relative z-10 w-full max-w-2xl p-6 rounded-lg shadow-xl transition-all duration-500 ${boss ? "bg-black/70 backdrop-blur-sm border border-red-800" : "bg-black/50"}`}>
        <h2 className="text-3xl font-bold mb-4 text-center">⚔️ Harc: {enemy?.name || "?"}</h2>

        {/* HP sávok */}
        <div className="flex justify-between mb-4">
          <div>
            <div>🧍‍♂️ Játékos HP: {playerHP}</div>
            <div className="bg-gray-700 h-2 w-40 mt-2 rounded overflow-hidden">
              <div className="bg-green-500 h-2 rounded transition-all duration-500" style={{ width: `${(playerHP / initialPlayerHP) * 100}%` }} />
            </div>
          </div>
          <div>
            <div>👹 {enemy?.name} HP: {enemyHP}</div>
            <div className="bg-gray-700 h-2 w-40 mt-2 rounded overflow-hidden">
              <div className="bg-red-500 h-2 rounded transition-all duration-500" style={{ width: `${(enemyHP / (enemy?.hp || 1)) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Napló */}
        <div className="text-left bg-black/40 p-3 rounded h-44 overflow-y-auto mb-4 font-mono text-sm">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>

        {/* Akciók */}
        {!battleOver && turn === "player" && (
          <div className="flex gap-3 justify-center">
            <button onClick={attack} className="px-4 py-2 bg-red-700 rounded-lg hover:bg-red-600">🗡️ Támadás</button>
            <button onClick={defend} className="px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-600">🛡️ Védekezés</button>
            <button onClick={usePotion} className="px-4 py-2 bg-green-700 rounded-lg hover:bg-green-600">💉 Ital</button>
          </div>
        )}

        {/* Csata vége */}
        {battleOver && (
          <div className="mt-4 text-center">
            <div className="mb-2">{playerHP <= 0 ? "☠️ Elbuktál!" : "🏆 Győzelem!"}</div>
            <button onClick={() => onEnd(playerHP, enemyHP === 0)} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
              Folytatás
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
