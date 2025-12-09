// backend.js
const express = require("express");
const app = express();
const port = 3000;
const mysql = require("mysql");
const cors = require("cors");

app.use(express.json());
app.use(cors());

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "sk_projekt",
});
// ---------------- XP LOGIKA (SZINTLÉPÉSHEZ) ----------------

function xpToNextLevel(level) {
  if (level <= 1) return 30;
  return 30 + (level - 1) * 20; // ugyanaz mint frontenden
}

function applyXpGain(oldLevel, oldXp, xpGain) {
  let level = oldLevel ?? 1;
  let xp = (oldXp ?? 0) + (xpGain ?? 0);
  let levelsGained = 0;

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    levelsGained += 1;
  }

  const addedStatPoints = levelsGained * 3;

  return { level, xp, levelsGained, addedStatPoints };
}
/* ---------------------------
   REGISTER
   --------------------------- */
app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Hiányzó adatok!" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Érvénytelen email!" });
  }

  pool.query(
    "SELECT id FROM players WHERE username = ? OR email = ?",
    [username, email],
    (err, results) => {
      if (err) {
        console.error("DB select error (register):", err);
        return res.status(500).json({ error: "DB hiba" });
      }
      if (results.length > 0) {
        return res
          .status(400)
          .json({ error: "Felhasználónév vagy email foglalt" });
      }

      pool.query(
        "INSERT INTO players (username, email, password_hash) VALUES (?, ?, ?)",
        [username, email, password],
        (insErr, insRes) => {
          if (insErr) {
            console.error("DB insert error (register):", insErr);
            return res.status(500).json({ error: "DB hiba (insert)" });
          }

          const newPlayerId = insRes.insertId;

          // 🔥 KÜLDETÉSEK LÉTREHOZÁSA AZ ÚJ JÁTÉKOSNAK
          // CSAK az 5 alap, class_required IS NULL quest
          pool.query(
            `
            INSERT INTO player_quests (player_id, quest_id, progress, status)
            SELECT ?, qm.id, 0,
              CASE 
                WHEN qm.id = 1 THEN 'in_progress'  -- első quest azonnal aktív
                ELSE 'locked'
              END
            FROM quests_master qm
            WHERE qm.class_required IS NULL
            `,
            [newPlayerId],
            (questErr) => {
              if (questErr) console.error("Quest init error:", questErr);
              // nem dobunk hibát, ha a quest init elhasal
            }
          );

          return res.json({
            message: "Sikeres regisztráció",
            userId: newPlayerId,
            username,
          });
        }
      );
    }
  );
});

/* ---------------------------
   LOGIN
   --------------------------- */
app.post("/api/login", (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password)
    return res.status(400).json({ error: "Adj meg minden mezőt!" });

  pool.query(
    "SELECT * FROM players WHERE (username = ? OR email = ?) AND password_hash = ?",
    [identifier, identifier, password],
    (err, results) => {
      if (err) {
        console.error("DB login error:", err);
        return res.status(500).json({ error: "DB hiba" });
      }
      if (results.length === 0)
        return res
          .status(401)
          .json({ error: "Hibás felhasználónév/email vagy jelszó" });

      return res.json({ message: "Sikeres bejelentkezés", user: results[0] });
    }
  );
});

/* ---------------------------
   GET USER (by username)
   --------------------------- */
app.get("/api/user/:username", (req, res) => {
  const username = req.params.username;
  pool.query(
    "SELECT * FROM players WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("DB get user error:", err);
        return res.status(500).json({ error: "DB hiba" });
      }
      if (results.length === 0) return res.json({ exists: false });
      return res.json({ exists: true, user: results[0] });
    }
  );
});

/* ---------------------------
   SET CLASS (kaszt + class quest hozzárendelés)
   --------------------------- */
app.post("/api/set-class", (req, res) => {
  const { username, classId } = req.body || {};
  if (!username || !classId)
    return res.status(400).json({ error: "Hiányzó adatok (username,classId)" });

  // class_id → class quest *ID* (quests_master.id)
  const CLASS_QUEST_MAP = {
    6: 9, // warrior (Harcos) -> Trial of the Mountain King
    7: 10, // mage (Varázsló) -> Rite of the Arcane Lord
    8: 11, // archer (Íjász) -> Hunt of the Forest Spirit
  };

  // 1) Játékos lekérése
  pool.query(
    "SELECT * FROM players WHERE username = ?",
    [username],
    (selErr, playerRes) => {
      if (selErr) {
        console.error("DB error SELECT players:", selErr);
        return res.status(500).json({ error: "DB hiba (player lekérés)" });
      }

      if (playerRes.length === 0)
        return res.status(404).json({ error: "Nincs ilyen játékos" });

      const player = playerRes[0];

      // 2) Kaszt lekérése
      pool.query(
        "SELECT * FROM classes WHERE id = ?",
        [classId],
        (err, classRes) => {
          if (err) {
            console.error("DB error SELECT classes:", err);
            return res.status(500).json({ error: "DB hiba (class select)" });
          }
          if (classRes.length === 0) {
            return res.status(400).json({ error: "Érvénytelen kaszt ID" });
          }

          const cls = classRes[0];

          // 3) Statok frissítése
          pool.query(
            `
              UPDATE players SET 
                class_id = ?,
                strength = ?,
                intellect = ?,
                defense = ?,
                hp = ?,
                max_hp = ?,
                level = 1,
                xp = 0,
                gold = 100
              WHERE id = ?
            `,
            [
              classId,
              cls.base_strength || 0,
              cls.base_intellect || 0,
              cls.base_defense || 0,
              cls.base_hp || 50,
              cls.base_max_hp || cls.base_hp || 50,
              player.id,
            ],
            (updErr) => {
              if (updErr) {
                console.error("DB error UPDATE players (set-class):", updErr);
                return res
                  .status(500)
                  .json({ error: "DB hiba class mentéskor" });
              }

              // 4) CLASS QUEST HOZZÁADÁSA (locked)
              const classQuestId = CLASS_QUEST_MAP[classId];

              if (!classQuestId) {
                return res.json({
                  message:
                    "Kaszt beállítva (ehhez a kaszthoz nincs class quest).",
                });
              }

              pool.query(
                "SELECT * FROM player_quests WHERE player_id = ? AND quest_id = ?",
                [player.id, classQuestId],
                (cqErr, cqRes) => {
                  if (cqErr) {
                    console.error("Class quest select error:", cqErr);
                    return res.json({
                      message:
                        "Kaszt beállítva, de a class quest ellenőrzés hibás.",
                    });
                  }

                  if (cqRes.length === 0) {
                    pool.query(
                      "INSERT INTO player_quests (player_id, quest_id, progress, status) VALUES (?, ?, 0, 'locked')",
                      [player.id, classQuestId],
                      (insErr) => {
                        if (insErr)
                          console.error(
                            "Class quest insert error:",
                            insErr
                          );
                      }
                    );
                  }

                  return res.json({
                    message: "Kaszt beállítva, class quest hozzárendelve!",
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

/* ---------------------------
   GET PLAYER BY ID (mini)
   --------------------------- */
app.get("/api/players/:id", (req, res) => {
  const { id } = req.params;

  pool.query(
    "SELECT id, username, level, xp, gold, class_id FROM players WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Adatbázis hiba" });
      if (result.length === 0)
        return res.status(404).json({ error: "Nincs ilyen felhasználó" });

      res.json(result[0]);
    }
  );
});

/* ---------------------------
   GET CLASSES
   --------------------------- */
app.get("/api/classes", (req, res) => {
  pool.query("SELECT * FROM classes", (err, results) => {
    if (err) {
      console.error("DB error on GET /classes:", err);
      return res.status(500).json({ error: "Adatbázis hiba" });
    }
    res.json(results);
  });
});

/* ---------------------------
   UPDATE PLAYER
   --------------------------- */
app.put("/api/players/:id", (req, res) => {
  const { id } = req.params;

  const {
    strength,
    intellect,
    defense,
    hp,
    max_hp,
    xp,
    level,
    gold,
    unspentStatPoints,
  } = req.body || {};

  pool.query(
    `
      UPDATE players SET
        strength = ?,
        intellect = ?,
        defense = ?,
        hp = ?,
        max_hp = ?,
        xp = ?,
        level = ?,
        gold = ?,
        unspentStatPoints = ?
      WHERE id = ?
    `,
    [
      strength ?? 0,
      intellect ?? 0,
      defense ?? 0,
      hp ?? 50,
      max_hp ?? 50,
      xp ?? 0,
      level ?? 1,
      gold ?? 0,
      unspentStatPoints ?? 0,
      id,
    ],
    (err) => {
      if (err) {
        console.error("DB UPDATE ERROR:", err);
        return res.status(500).json({ error: "Stat mentési hiba" });
      }

      return res.json({ message: "Stat sikeresen mentve!" });
    }
  );
});

/* ---------------------------
   COMBAT REWARD (XP + GOLD + LEVEL)
   --------------------------- */

app.post("/api/combat/reward", (req, res) => {
  const { playerId, xpGain, goldGain, hpAfterBattle } = req.body || {};

  if (!playerId) {
    return res.status(400).json({ error: "playerId hiányzik" });
  }

  // 1) Játékos lekérdezése
  pool.query(
    "SELECT id, level, xp, gold, hp, max_hp, unspentStatPoints FROM players WHERE id = ?",
    [playerId],
    (err, results) => {
      if (err) {
        console.error("DB error (combat reward - select player):", err);
        return res.status(500).json({ error: "DB hiba" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Nincs ilyen játékos" });
      }

      const player = results[0];
      const gainXp = xpGain || 0;
      const gainGold = goldGain || 0;

      // 2) XP → LEVEL logika
      const {
        level: newLevel,
        xp: newXp,
        levelsGained,
        addedStatPoints,
      } = applyXpGain(player.level, player.xp, gainXp);

      const newGold = (player.gold || 0) + gainGold;

      // HP mentése (ha küldöd a frontról)
      const newHpRaw =
        typeof hpAfterBattle === "number" ? hpAfterBattle : player.hp;
      const newHp = Math.min(newHpRaw, player.max_hp);

      // 3) UPDATE players
      pool.query(
        `
        UPDATE players
        SET level = ?, xp = ?, gold = ?, hp = ?, unspentStatPoints = unspentStatPoints + ?
        WHERE id = ?
        `,
        [newLevel, newXp, newGold, newHp, addedStatPoints, player.id],
        (updErr) => {
          if (updErr) {
            console.error("DB error (combat reward - update player):", updErr);
            return res.status(500).json({ error: "DB hiba updatekor" });
          }

          // 4) Friss player vissza
          pool.query(
            `
            SELECT id, username, class_id, level, xp, gold, hp, max_hp, strength, intellect, defense, unspentStatPoints
            FROM players
            WHERE id = ?
            `,
            [player.id],
            (sel2Err, updatedRows) => {
              if (sel2Err) {
                console.error("DB error (combat reward - reselect):", sel2Err);
                return res.status(500).json({ error: "DB hiba reselectkor" });
              }

              const updatedPlayer = updatedRows[0];

              return res.json({
                success: true,
                rewards: {
                  xpGain: gainXp,
                  goldGain: gainGold,
                  levelsGained,
                  addedStatPoints,
                },
                player: updatedPlayer,
              });
            }
          );
        }
      );
    }
  );
});

{/*Vesz*/}



app.post("/api/shop/buy", (req, res) => {
    const { playerId, itemId } = req.body;

    // 1. Játékos lekérdezése
    pool.query("SELECT gold FROM players WHERE id = ?", [playerId], (err, players) => {
        if (err) return res.status(500).json({ error: "DB hiba" });
        if (players.length === 0) return res.status(404).json({ error: "Nincs ilyen játékos" });

        const gold = players[0].gold;

        // 2. Tárgy lekérdezése
        pool.query("SELECT prize FROM items WHERE id = ?", [itemId], (err, itemRes) => {
            if (err) return res.status(500).json({ error: "DB hiba" });
            if (itemRes.length === 0) return res.status(404).json({ error: "Tárgy nem található" });

            const prize = itemRes[0].prize;

            // 3. Ellenőrzés
            if (gold < prize) {
                return res.status(400).json({ error: "Nincs elég arany" });
            }

            // 4. Arany levonás
            pool.query(
                "UPDATE players SET gold = gold - ? WHERE id = ?",
                [prize, playerId],
                err => {
                    if (err) return res.status(500).json({ error: "DB hiba arany levonásakor" });
                    
                    // 5. Item hozzáadás
                    pool.query(
                        `INSERT INTO birtokol (player_id, item_id, quantity)
                         VALUES (?, ?, 1)
                         ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
                        [playerId, itemId],
                        err => {
                            if (err) return res.status(500).json({ error: "DB hiba tárgy hozzáadásakor" });

                            return res.json({ success: true, message: "Sikeres vásárlás" });
                        }
                    );
                }
            );
        });
    });
});


{/* fejleszt – GOLD alapú, nem XP */}
app.post("/api/blacksmith/upgrade", (req, res) => {
  const { playerId, itemId } = req.body;
  if (!playerId || !itemId) {
    return res
      .status(400)
      .json({ success: false, error: "Hiányzó paraméter" });
  }

  // költség-multiplikátor: összhangban a frontenddel (250)
  const MULT = 250;

  pool.getConnection((err, conn) => {
    if (err) {
      console.error("Conn error:", err);
      return res
        .status(500)
        .json({ success: false, error: "DB connection error" });
    }

    conn.beginTransaction(async (err) => {
      if (err) {
        conn.release();
        console.error("TX begin error:", err);
        return res
          .status(500)
          .json({ success: false, error: "DB transaction error" });
      }

      try {
        // 1) játékos GOLD lekérése (lockolva)
        const [playerRows] = await new Promise((resolve, reject) =>
          conn.query(
            "SELECT gold FROM players WHERE id = ? FOR UPDATE",
            [playerId],
            (e, r) => (e ? reject(e) : resolve([r]))
          )
        );
        if (!playerRows || playerRows.length === 0)
          throw { status: 400, message: "Nincs ilyen játékos" };
        const playerGold = playerRows[0].gold;

        // 2) birtokol sor lockolva
        const [itemRows] = await new Promise((resolve, reject) =>
          conn.query(
            "SELECT * FROM birtokol WHERE player_id = ? AND item_id = ? FOR UPDATE",
            [playerId, itemId],
            (e, r) => (e ? reject(e) : resolve([r]))
          )
        );
        if (!itemRows || itemRows.length === 0)
          throw { status: 400, message: "Nincs ilyen tárgyad" };
        const item = itemRows[0];

        const cost = (item.upgrade_level + 1) * MULT;

        // 3) elég gold?
        if (playerGold < cost)
          throw { status: 400, message: "Nincs elég arany" };

        // 4) levonjuk az aranyat
        await new Promise((resolve, reject) =>
          conn.query(
            "UPDATE players SET gold = gold - ? WHERE id = ?",
            [cost, playerId],
            (e, r) => (e ? reject(e) : resolve(r))
          )
        );

        // 5) növeljük az upgrade_level-t
        const whereClause = item.id
          ? "WHERE id = ?"
          : "WHERE player_id = ? AND item_id = ?";
        const whereParams = item.id ? [item.id] : [playerId, itemId];

        await new Promise((resolve, reject) =>
          conn.query(
            `UPDATE birtokol SET upgrade_level = upgrade_level + 1 ${whereClause}`,
            whereParams,
            (e, r) => (e ? reject(e) : resolve(r))
          )
        );

        // 6) új upgrade szint + maradék GOLD vissza
        const [newItemRows] = await new Promise((resolve, reject) =>
          conn.query(
            "SELECT upgrade_level FROM birtokol WHERE player_id = ? AND item_id = ?",
            [playerId, itemId],
            (e, r) => (e ? reject(e) : resolve([r]))
          )
        );
        const newUpgradeLevel =
          newItemRows && newItemRows[0]
            ? newItemRows[0].upgrade_level
            : item.upgrade_level + 1;

        const [newPlayerRows] = await new Promise((resolve, reject) =>
          conn.query(
            "SELECT gold FROM players WHERE id = ?",
            [playerId],
            (e, r) => (e ? reject(e) : resolve([r]))
          )
        );
        const newGold =
          newPlayerRows && newPlayerRows[0]
            ? newPlayerRows[0].gold
            : playerGold - cost;

        await new Promise((resolve, reject) =>
          conn.commit((err2) => (err2 ? reject(err2) : resolve()))
        );

        conn.release();
        return res.json({
          success: true,
          message: "Sikeres fejlesztés",
          newUpgradeLevel,
          newGold,
        });
      } catch (e) {
        conn.rollback(() => conn.release());
        console.error("Upgrade error:", e);
        if (e && e.status)
          return res
            .status(e.status)
            .json({ success: false, error: e.message });
        return res.status(500).json({
          success: false,
          error: "Szerverhiba a fejlesztés közben",
        });
      }
    }); // beginTransaction
  }); // getConnection
});

app.get("/api/items", (req, res) => {
  pool.query("SELECT * FROM items", (err, items) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(items);
  });
});

app.get("/api/player/:id/items", (req, res) => {
  const playerId = req.params.id;
  pool.query(
    `SELECT pi.*, i.name, i.type, i.min_dmg, i.max_dmg, 
            i.intellect_bonus, i.defense_bonus, i.hp_bonus, i.rarity
     FROM birtokol pi
     JOIN items i ON i.id = pi.item_id
     WHERE pi.player_id = ?`,
    [playerId],
    (err, results) => {
      if (err) {
        console.error("DB error in /api/player/:id/items", err);
        return res.status(500).json({ error: "DB error" });
      }
      // visszaküldjük az eredményt a kliensnek
      res.json(results);
    }
  );
});


// Játékos összes questje
app.get("/api/quests/:playerId", (req, res) => {
  const playerId = req.params.playerId;

  pool.query(
    `
    SELECT pq.*, qm.title, qm.description, qm.task_type, 
           qm.target_amount, qm.reward_xp, qm.reward_gold, qm.class_required
    FROM player_quests pq
    JOIN quests_master qm ON pq.quest_id = qm.id
    WHERE pq.player_id = ?
    `,
    [playerId],
    (err, results) => {
      if (err)
        return res.status(500).json({ error: "DB hiba quest lekéréskor" });
      res.json(results);
    }
  );
});

// progress növelése (kill/boss/custom)
app.post("/api/quests/progress", (req, res) => {
  const { playerId, taskType } = req.body;

  pool.query(
    `
    UPDATE player_quests pq
    JOIN quests_master qm ON pq.quest_id = qm.id
    SET pq.progress = pq.progress + 1
    WHERE pq.player_id = ?
      AND qm.task_type = ?
      AND pq.status = 'in_progress'
    `,
    [playerId, taskType],
    (err) => {
      if (err) return res.status(500).json({ error: "Progress update error" });
      res.json({ message: "Progress updated" });
    }
  );
});

// QUEST CHECK + CLASS QUEST UNLOCK
app.post("/api/quests/check", (req, res) => {
  const { playerId } = req.body;

  // 1) ami elérte a target_amount-ot, azt 'completed'-re tesszük
  pool.query(
    `
    UPDATE player_quests pq
    JOIN quests_master qm ON pq.quest_id = qm.id
    SET pq.status = 'completed'
    WHERE pq.player_id = ?
      AND pq.progress >= qm.target_amount
      AND pq.status = 'in_progress'
    `,
    [playerId],
    (err) => {
      if (err)
        return res.status(500).json({ error: "Quest check failed (update)" });

      // 2) megnézzük, hogy az ALAP (class_required IS NULL) questek közül legalább 5 completed-e
      pool.query(
        `
        SELECT COUNT(*) AS completedCount
        FROM player_quests pq
        JOIN quests_master qm ON pq.quest_id = qm.id
        WHERE pq.player_id = ?
          AND pq.status = 'completed'
          AND qm.class_required IS NULL
        `,
        [playerId],
        (err2, rows) => {
          if (err2) {
            console.error("Quest check count error:", err2);
            return res.json({
              message: "Quest updated (class quest unlock check failed)",
            });
          }

          const completedCount = rows[0]?.completedCount || 0;

          if (completedCount < 5) {
            // még nincs meg az 5 alap quest
            return res.json({ message: "Quest updated" });
          }

          // 3) ha megvan az 5 alap quest → feloldjuk a class questet (class_required = player.class_id)
          pool.query(
            `
            UPDATE player_quests pq
            JOIN quests_master qm ON pq.quest_id = qm.id
            JOIN players p ON p.id = pq.player_id
            SET pq.status = 'in_progress'
            WHERE pq.player_id = ?
              AND pq.status = 'locked'
              AND qm.class_required = p.class_id
            `,
            [playerId],
            (err3) => {
              if (err3) {
                console.error("Class quest unlock error:", err3);
                return res.json({
                  message:
                    "Quest updated, de a class quest feloldása közben hiba történt.",
                });
              }

              return res.json({
                message: "Quest updated, class quest feloldva ha jogosult volt.",
              });
            }
          );
        }
      );
    }
  );
});

// reward claim + következő quest + class quest unlock
app.post("/api/quests/claim", (req, res) => {
  const { playerId, questId } = req.body;

  if (!playerId || !questId) {
    return res.status(400).json({ error: "Hiányzó playerId vagy questId" });
  }

  console.log(">>> CLAIM request:", { playerId, questId });

  // 1. reward + player alapadat egyben
  pool.query(
    `
    SELECT 
      qm.reward_xp, 
      qm.reward_gold,
      p.level AS player_level,
      p.xp    AS player_xp,
      p.unspentStatPoints
    FROM quests_master qm
    JOIN player_quests pq ON pq.quest_id = qm.id
    JOIN players p        ON p.id = pq.player_id
    WHERE pq.player_id = ? 
      AND qm.id = ? 
      AND pq.status = 'completed'
    `,
    [playerId, questId],
    (err, results) => {
      if (err) {
        console.error("Claim select error:", err);
        return res.status(500).json({ error: "DB hiba claimnél" });
      }
      if (results.length === 0) {
        console.warn("Claim: nincs completed quest ilyen paramokkal");
        return res.status(400).json({ error: "Nem claimelhető" });
      }

      const row = results[0];
      const reward_xp = row.reward_xp || 0;
      const reward_gold = row.reward_gold || 0;

      let level = row.player_level ?? 1;
      let xp    = row.player_xp   ?? 0;
      let unspent = row.unspentStatPoints ?? 0;

      // 🔥 2. XP hozzáadása + szintlépés kiszámítása BACKENDEN
      xp += reward_xp;
      let levelsGained = 0;

      while (xp >= xpToNextLevel(level)) {
        xp -= xpToNextLevel(level);
        level += 1;
        levelsGained += 1;
      }

      const addedStatPoints = levelsGained * 3;

      // 3. player frissítése: xp, level, gold, statpontok
      pool.query(
        `
        UPDATE players
        SET 
          xp = ?, 
          level = ?, 
          gold = gold + ?, 
          unspentStatPoints = unspentStatPoints + ?
        WHERE id = ?
        `,
        [xp, level, reward_gold, addedStatPoints, playerId],
        (err2) => {
          if (err2) {
            console.error("XP/Gold update error:", err2);
            return res.status(500).json({ error: "XP/Gold update error" });
          }

          // 4. quest státusz "claimed"
          pool.query(
            `
            UPDATE player_quests
            SET status = 'claimed'
            WHERE player_id = ? AND quest_id = ?
            `,
            [playerId, questId],
            (err3) => {
              if (err3) {
                console.error("Claim status update error:", err3);
                return res
                  .status(500)
                  .json({ error: "Claim status update error" });
              }

              console.log(">>> CLAIM: quest státusz -> claimed");

              // 5. Következő ALAP quest aktiválása (class_required IS NULL)
              pool.query(
                `
                SELECT qm.id
                FROM player_quests pq
                JOIN quests_master qm ON pq.quest_id = qm.id
                WHERE pq.player_id = ?
                  AND qm.class_required IS NULL
                  AND pq.status = 'locked'
                ORDER BY qm.id ASC
                LIMIT 1
                `,
                [playerId],
                (nextErr, nextRows) => {
                  if (nextErr) {
                    console.error("Next quest select error:", nextErr);
                  }

                  const activateNextQuest = (cb) => {
                    if (!nextRows || nextRows.length === 0) {
                      console.log(
                        ">>> CLAIM: nincs következő locked alap quest"
                      );
                      return cb();
                    }

                    const nextQuestId = nextRows[0].id;
                    console.log(
                      ">>> CLAIM: következő alap quest aktiválása:",
                      nextQuestId
                    );

                    pool.query(
                      `
                      UPDATE player_quests
                      SET status = 'in_progress'
                      WHERE player_id = ? AND quest_id = ?
                      `,
                      [playerId, nextQuestId],
                      (actErr) => {
                        if (actErr) {
                          console.error(
                            "Next quest activate error:",
                            actErr
                          );
                        } else {
                          console.log(
                            ">>> CLAIM: alap quest in_progress lett:",
                            nextQuestId
                          );
                        }
                        cb();
                      }
                    );
                  };

                  // 6. Class quest feloldás logika (marad, ahogy volt)
                  activateNextQuest(() => {
                    pool.query(
                      `
                      SELECT COUNT(*) AS claimedCount
                      FROM player_quests pq
                      JOIN quests_master qm ON pq.quest_id = qm.id
                      WHERE pq.player_id = ?
                        AND qm.class_required IS NULL
                        AND pq.status = 'claimed'
                      `,
                      [playerId],
                      (cntErr, cntRows) => {
                        if (cntErr) {
                          console.error(
                            "Class quest count error:",
                            cntErr
                          );
                          return res.json({
                            message:
                              "Küldetés claimelve (class quest ellenőrzés hibás).",
                          });
                        }

                        const claimedCount =
                          cntRows[0]?.claimedCount || 0;
                        console.log(
                          ">>> CLAIM: alap claimed quest count =",
                          claimedCount
                        );

                        if (claimedCount < 5) {
                          return res.json({
                            message: "Küldetés claimelve!",
                            level,
                            xp,
                            levelsGained,
                            addedStatPoints,
                            reward_gold,
                            reward_xp,
                          });
                        }

                        // mind az 5 alap quest claimed → class quest unlock
                        pool.query(
                          `
                          UPDATE player_quests pq
                          JOIN quests_master qm ON pq.quest_id = qm.id
                          JOIN players p ON p.id = pq.player_id
                          SET pq.status = 'in_progress'
                          WHERE pq.player_id = ?
                            AND pq.status = 'locked'
                            AND qm.class_required = p.class_id
                          `,
                          [playerId],
                          (unlockErr) => {
                            if (unlockErr) {
                              console.error(
                                "Class quest unlock error:",
                                unlockErr
                              );
                              return res.json({
                                message:
                                  "Küldetés claimelve, de a class quest feloldása közben hiba történt.",
                                level,
                                xp,
                                levelsGained,
                                addedStatPoints,
                                reward_gold,
                                reward_xp,
                              });
                            }

                            console.log(
                              ">>> CLAIM: class quest feloldva (in_progress)"
                            );

                            return res.json({
                              message:
                                "Küldetés claimelve, következő quest / class quest frissítve!",
                              level,
                              xp,
                              levelsGained,
                              addedStatPoints,
                              reward_gold,
                              reward_xp,
                            });
                          }
                        );
                      }
                    );
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});
app.listen(port, () => {
  console.log(`Backend fut a ${port} porton`);
});
