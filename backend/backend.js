// backend.js
const express = require("express");
const app = express();
const port = 3000;
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;



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

app.post("/api/inventory/equip", (req, res) => {
  const { playerId, ownedId, slotKey } = req.body;

  if (!playerId || !ownedId) {
    return res.status(400).json({ error: "Hiányzó adat" });
  }

  // 0) owned item + type ellenőrzés
  pool.query(
    `
    SELECT b.id, b.player_id, b.item_id, i.type
    FROM birtokol b
    JOIN items i ON i.id = b.item_id
    WHERE b.id = ? AND b.player_id = ?
    `,
    [ownedId, playerId],
    (err, rows) => {
      if (err) {
        console.error("Equip select error:", err);
        return res.status(500).json({ error: "DB hiba" });
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Nincs ilyen owned item" });
      }

      const itemType = (rows[0].type || "").toLowerCase();

      // accessory slot meghatározás
      let equipSlot = 1;
      if (itemType === "accessory") {
        equipSlot = slotKey === "accessory2" ? 2 : 1; // default accessory1
      } else {
        equipSlot = 1; // weapon/armor/helmet fix
      }

      // 1) ugyanazon slot kikapcsolása
      if (itemType === "accessory") {
        // csak a kiválasztott accessory slotot ürítjük
        pool.query(
          `
          UPDATE birtokol b
          JOIN items i ON i.id = b.item_id
          SET b.is_equipped = 0
          WHERE b.player_id = ?
            AND LOWER(i.type) = 'accessory'
            AND b.equip_slot = ?
          `,
          [playerId, equipSlot],
          (err2) => {
            if (err2) {
              console.error("Equip clear accessory slot error:", err2);
              return res.status(500).json({ error: "Equip hiba" });
            }

            // 2) ezt az 1 sort equipeljük + slotot beállítjuk
            pool.query(
              `
              UPDATE birtokol
              SET is_equipped = 1, equip_slot = ?
              WHERE id = ? AND player_id = ?
              `,
              [equipSlot, ownedId, playerId],
              (err3) => {
                if (err3) {
                  console.error("Equip set accessory error:", err3);
                  return res.status(500).json({ error: "Equip hiba" });
                }
                return res.json({ success: true, message: "Item aktiválva" });
              }
            );
          }
        );
      } else {
        // weapon / armor / helmet: típusslotot ürítjük
        pool.query(
          `
          UPDATE birtokol b
          JOIN items i ON i.id = b.item_id
          SET b.is_equipped = 0, b.equip_slot = 1
          WHERE b.player_id = ?
            AND LOWER(i.type) = ?
          `,
          [playerId, itemType],
          (err2) => {
            if (err2) {
              console.error("Equip clear type error:", err2);
              return res.status(500).json({ error: "Equip hiba" });
            }

            // 2) ezt az 1 sort equipeljük
            pool.query(
              `
              UPDATE birtokol
              SET is_equipped = 1, equip_slot = 1
              WHERE id = ? AND player_id = ?
              `,
              [ownedId, playerId],
              (err3) => {
                if (err3) {
                  console.error("Equip set error:", err3);
                  return res.status(500).json({ error: "Equip hiba" });
                }
                return res.json({ success: true, message: "Item aktiválva" });
              }
            );
          }
        );
      }
    }
  );
});

app.post("/api/inventory/unequip", (req, res) => {
  const { playerId, ownedId } = req.body;

  if (!playerId || !ownedId) {
    return res.status(400).json({ error: "Hiányzó adat" });
  }

  pool.query(
    `
    UPDATE birtokol
    SET is_equipped = 0
    WHERE id = ? AND player_id = ?
    `,
    [ownedId, playerId],
    (err) => {
      if (err) {
        console.error("Unequip error:", err);
        return res.status(500).json({ error: "Unequip hiba" });
      }
      res.json({ success: true });
    }
  );
});

app.get("/api/inventory/:playerId", (req, res) => {
  const playerId = req.params.playerId;

  pool.query(
    `
    SELECT 
      b.id AS owned_id,
      b.item_id,
      b.quantity,
      b.is_equipped,
      b.upgrade_level,
      b.equip_slot,          -- ✅

      i.name,
      i.type,
      i.rarity,
      i.prize,
      i.bonus_strength,
      i.bonus_intellect,
      i.bonus_defense,
      i.bonus_hp
    FROM birtokol b
    JOIN items i ON i.id = b.item_id
    WHERE b.player_id = ?
    `,
    [playerId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Inventory hiba" });
      res.json(rows);
    }
  );
});


app.get("/api/player/:id/full-stats", (req, res) => {
  const playerId = req.params.id;

  // Upgrade képlet: baseBonus * (1 + upgrade_level)
  // upgrade 0 => 1x, upgrade 1 => 2x, upgrade 2 => 3x
  pool.query(
    `
    SELECT 
      p.id,
      p.username,
      p.class_id,
      p.level,
      p.xp,
      p.gold,

      p.strength,
      p.intellect,
      p.defense,
      p.hp,
      p.max_hp,
      p.unspentStatPoints,

      IFNULL(SUM(i.bonus_strength + CASE WHEN i.bonus_strength > 0 THEN b.upgrade_level * 1 ELSE 0 END),0) AS item_str,
      IFNULL(SUM(i.bonus_intellect + CASE WHEN i.bonus_intellect > 0 THEN b.upgrade_level * 1 ELSE 0 END),0) AS item_int,
      IFNULL(SUM(i.bonus_defense + CASE WHEN LOWER(i.type) IN ('armor','helmet','accessory') THEN b.upgrade_level * 2 ELSE 0 END),0) AS item_def,
      IFNULL(SUM(i.bonus_hp + CASE WHEN LOWER(i.type) IN ('armor','helmet','accessory') THEN b.upgrade_level * 10 ELSE 0 END),0) AS item_hp

    FROM players p
    LEFT JOIN birtokol b 
      ON b.player_id = p.id AND b.is_equipped = 1
    LEFT JOIN items i 
      ON i.id = b.item_id
    WHERE p.id = ?
    GROUP BY p.id
    `,
    [playerId],
    (err, rows) => {
      if (err || rows.length === 0) {
        console.error("full-stats error:", err);
        return res.status(500).json({ error: "Stat lekérés hiba" });
      }

      const r = rows[0];

      const base = {
        strength: r.strength ?? 0,
        intellect: r.intellect ?? 0,
        defense: r.defense ?? 0,
        hp: r.hp ?? 0,
        max_hp: r.max_hp ?? 0,
      };

            const bonus = {
        strength: Number(r.item_str) || 0,
        intellect: Number(r.item_int) || 0,
        defense: Number(r.item_def) || 0,
        hp: Number(r.item_hp) || 0,
      };

const final = {
  strength: base.strength + bonus.strength,
  intellect: base.intellect + bonus.intellect,
  defense: base.defense + bonus.defense,
  max_hp: base.max_hp + bonus.hp,
};

      // HP clamp: ne legyen több mint max_hp
      final.hp = Math.min(final.hp, final.max_hp);

      return res.json({
          player: {
            id: r.id,
            username: r.username,
            class_id: r.class_id,
            level: r.level,
            xp: r.xp,
            gold: r.gold,
            unspentStatPoints: r.unspentStatPoints ?? 0,

            // ✅ BASE statok kerüljenek a playerbe
            strength: base.strength,
            intellect: base.intellect,
            defense: base.defense,
            hp: base.hp,
            max_hp: base.max_hp,
          },
          base,
          bonus,
          final,
                });
    }
  );
});

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

      // 🔐 JELSZÓ HASH
      bcrypt.hash(password, SALT_ROUNDS, (hashErr, hash) => {
        if (hashErr) {
          console.error("Bcrypt hash error:", hashErr);
          return res.status(500).json({ error: "Jelszó hash hiba" });
        }

        pool.query(
          "INSERT INTO players (username, email, password_hash) VALUES (?, ?, ?)",
          [username, email, hash],
          (insErr, insRes) => {
            if (insErr) {
              console.error("DB insert error (register):", insErr);
              return res.status(500).json({ error: "DB hiba (insert)" });
            }

            const newPlayerId = insRes.insertId;

            // 🔥 KÜLDETÉSEK LÉTREHOZÁSA AZ ÚJ JÁTÉKOSNAK
            pool.query(
              `
              INSERT INTO player_quests (player_id, quest_id, progress, status)
              SELECT ?, qm.id, 0,
                CASE 
                  WHEN qm.id = 1 THEN 'in_progress'
                  ELSE 'locked'
                END
              FROM quests_master qm
              WHERE qm.class_required IS NULL
              `,
              [newPlayerId],
              (questErr) => {
                if (questErr) {
                  console.error("Quest init error:", questErr);
                }
              }
            );

            return res.json({
              message: "Sikeres regisztráció",
              userId: newPlayerId,
              username,
            });
          }
        );
      });
    }
  );
});


/* ---------------------------
   LOGIN
   --------------------------- */
app.post("/api/login", (req, res) => {
  const { identifier, password } = req.body || {};

  if (!identifier || !password) {
    return res.status(400).json({ error: "Adj meg minden mezőt!" });
  }

  pool.query(
    "SELECT * FROM players WHERE username = ? OR email = ?",
    [identifier, identifier],
    (err, results) => {
      if (err) {
        console.error("DB login error:", err);
        return res.status(500).json({ error: "DB hiba" });
      }

      if (results.length === 0) {
        return res
          .status(401)
          .json({ error: "Hibás felhasználónév/email vagy jelszó" });
      }

      const user = results[0];

      bcrypt.compare(password, user.password_hash, (bcryptErr, isMatch) => {
        if (bcryptErr) {
          console.error("Bcrypt compare error:", bcryptErr);
          return res.status(500).json({ error: "Jelszó ellenőrzési hiba" });
        }

        if (!isMatch) {
          return res
            .status(401)
            .json({ error: "Hibás felhasználónév/email vagy jelszó" });
        }

        // ⚠️ JELSZÓT SOHA NEM KÜLDÜNK VISSZA
        delete user.password_hash;

        return res.json({
          message: "Sikeres bejelentkezés",
          user,
        });
      });
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

  pool.query(
    "SELECT gold FROM players WHERE id = ?",
    [playerId],
    (err, players) => {
      if (err) return res.status(500).json({ error: "DB hiba" });
      if (players.length === 0)
        return res.status(404).json({ error: "Nincs ilyen játékos" });

      pool.query(
        "SELECT prize, type FROM items WHERE id = ?",
        [itemId],
        (err, itemRes) => {
          if (err) return res.status(500).json({ error: "DB hiba" });
          if (itemRes.length === 0)
            return res.status(404).json({ error: "Item nem található" });

          const { prize, type } = itemRes[0];
          if (players[0].gold < prize)
            return res.status(400).json({ error: "Nincs elég arany" });

          // 🔒 CHECK: már van-e ilyen item
          pool.query(
            "SELECT id FROM birtokol WHERE player_id = ? AND item_id = ?",
            [playerId, itemId],
            (err, owned) => {
              if (err) return res.status(500).json({ error: "DB hiba" });

              if (owned.length > 0) {
                return res.status(400).json({ error: "Ez a tárgy már megvan" });
              }


              pool.query(
                "UPDATE players SET gold = gold - ? WHERE id = ?",
                [prize, playerId],
                err => {
                  if (err) return res.status(500).json({ error: "Arany hiba" });

                  pool.query(
                    `
                    INSERT INTO birtokol (player_id, item_id, quantity, upgrade_level, is_equipped, equip_slot)
                    VALUES (?, ?, 1, 0, 0, 1)
                    `,
                    [playerId, itemId],
                    err => {
                      if (err) return res.status(500).json({ error: "Inventory hiba" });
                      res.json({ success: true });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});


{/*Elad*/}

app.post("/api/shop/sell", (req, res) => {
  const { playerId, itemId } = req.body;

  // 1. Ellenőrizzük, hogy birtokolja-e
  pool.query(
    "SELECT * FROM birtokol WHERE player_id = ? AND item_id = ?",
    [playerId, itemId],
    (err, owned) => {
      if (err) return res.status(500).json({ error: "DB hiba" });
      if (owned.length === 0)
        return res.status(400).json({ error: "Nincs ilyen tárgyad" });

      // 2. Item ár lekérdezése
      pool.query(
        "SELECT prize FROM items WHERE id = ?",
        [itemId],
        (err, itemRes) => {
          if (err) return res.status(500).json({ error: "DB hiba" });

          const sellPrice = Math.floor(itemRes[0].prize * 0.9);

          // 3. Item törlése inventoryból
          pool.query(
            "DELETE FROM birtokol WHERE player_id = ? AND item_id = ?",
            [playerId, itemId],
            err => {
              if (err) return res.status(500).json({ error: "DB hiba törléskor" });

              // 4. Gold visszaadása
              pool.query(
                "UPDATE players SET gold = gold + ? WHERE id = ?",
                [sellPrice, playerId],
                err => {
                  if (err)
                    return res.status(500).json({ error: "DB hiba gold frissítéskor" });

                  res.json({ success: true, gold: sellPrice });
                }
              );
            }
          );
        }
      );
    }
  );
});


/* fejleszt – GOLD alapú, nem XP – ownedId alapon */
app.post("/api/blacksmith/upgrade", (req, res) => {
  const { playerId, ownedId } = req.body;

  if (!playerId || !ownedId) {
    return res.status(400).json({ success: false, error: "Hiányzó paraméter" });
  }

  const MULT = 50;

  pool.getConnection((err, conn) => {
    if (err) {
      console.error("Conn error:", err);
      return res.status(500).json({ success: false, error: "DB connection error" });
    }

    conn.beginTransaction(async (err) => {
      if (err) {
        conn.release();
        console.error("TX begin error:", err);
        return res.status(500).json({ success: false, error: "DB transaction error" });
      }

      try {
        // 1) játékos GOLD lekérése (lock)
        const [playerRows] = await new Promise((resolve, reject) =>
          conn.query(
            "SELECT gold FROM players WHERE id = ? FOR UPDATE",
            [playerId],
            (e, r) => (e ? reject(e) : resolve([r]))
          )
        );

        if (!playerRows || playerRows.length === 0) {
          throw { status: 400, message: "Nincs ilyen játékos" };
        }
        const playerGold = Number(playerRows[0].gold) || 0;

        // 2) konkrét birtokol sor lekérése ownedId alapján (lock)
        const [ownedRows] = await new Promise((resolve, reject) =>
          conn.query(
            `SELECT b.id, b.player_id, b.item_id, b.upgrade_level
             FROM birtokol b
             WHERE b.id = ? AND b.player_id = ?
             FOR UPDATE`,
            [ownedId, playerId],
            (e, r) => (e ? reject(e) : resolve([r]))
          )
        );

        if (!ownedRows || ownedRows.length === 0) {
          throw { status: 400, message: "Nincs ilyen tárgyad" };
        }

        const owned = ownedRows[0];
        const curLvl = Number(owned.upgrade_level) || 0;

        const cost = (curLvl + 1) * MULT;

        // 3) elég gold?
        if (playerGold < cost) {
          throw { status: 400, message: "Nincs elég arany" };
        }

        // 4) levonjuk az aranyat
        await new Promise((resolve, reject) =>
          conn.query(
            "UPDATE players SET gold = gold - ? WHERE id = ?",
            [cost, playerId],
            (e, r) => (e ? reject(e) : resolve(r))
          )
        );

        // 5) upgrade_level növelése a konkrét owned soron
        await new Promise((resolve, reject) =>
          conn.query(
            "UPDATE birtokol SET upgrade_level = upgrade_level + 1 WHERE id = ? AND player_id = ?",
            [ownedId, playerId],
            (e, r) => (e ? reject(e) : resolve(r))
          )
        );

        // 6) friss adatok vissza
        const [newOwnedRows] = await new Promise((resolve, reject) =>
          conn.query(
            "SELECT upgrade_level FROM birtokol WHERE id = ? AND player_id = ?",
            [ownedId, playerId],
            (e, r) => (e ? reject(e) : resolve([r]))
          )
        );

        const newUpgradeLevel =
          newOwnedRows && newOwnedRows[0]
            ? Number(newOwnedRows[0].upgrade_level) || (curLvl + 1)
            : curLvl + 1;

        const [newPlayerRows] = await new Promise((resolve, reject) =>
          conn.query(
            "SELECT gold FROM players WHERE id = ?",
            [playerId],
            (e, r) => (e ? reject(e) : resolve([r]))
          )
        );

        const newGold =
          newPlayerRows && newPlayerRows[0]
            ? Number(newPlayerRows[0].gold) || (playerGold - cost)
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
        if (e && e.status) {
          return res.status(e.status).json({ success: false, error: e.message });
        }
        return res.status(500).json({
          success: false,
          error: "Szerverhiba a fejlesztés közben",
        });
      }
    });
  });
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
    `
    SELECT 
      b.id AS owned_id,
      b.player_id,
      b.item_id,
      b.quantity,
      b.upgrade_level,
      b.is_equipped,
      b.equip_slot,

      i.name,
      i.type,
      i.min_dmg,
      i.max_dmg,
      i.rarity,
      i.bonus_strength,
      i.bonus_intellect,
      i.bonus_defense,
      i.bonus_hp,
      i.prize
    FROM birtokol b
    JOIN items i ON i.id = b.item_id
    WHERE b.player_id = ?
    `,
    [playerId],
    (err, results) => {
      if (err) {
        console.error("DB error in /api/player/:id/items", err);
        return res.status(500).json({ error: "DB error" });
      }
      res.json(results);
    }
  );
});


// Játékos összes questje
app.get("/api/quests/:playerId", (req, res) => {
  const playerId = req.params.playerId;

  pool.query(
    `
    SELECT 
  pq.id AS pq_id,
  pq.player_id,
  pq.quest_id,
  pq.progress,
  pq.status,

  qm.title,
  qm.description,
  qm.task_type,
  qm.target_amount,
  qm.reward_xp,
  qm.reward_gold,
  qm.class_required,

  p.class_id AS player_class
FROM player_quests pq
JOIN quests_master qm ON pq.quest_id = qm.id
JOIN players p ON p.id = pq.player_id
WHERE pq.player_id = ?
ORDER BY pq.quest_id ASC;
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
    SET 
      pq.progress = pq.progress + 1,
      pq.status = CASE 
        WHEN pq.progress + 1 >= qm.target_amount THEN 'completed'
        ELSE pq.status
      END
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

app.get("/api/quests/debug/:playerId", (req, res) => {
  const { playerId } = req.params;

  pool.query(
    `
    SELECT 
      pq.id AS pq_id,
      pq.player_id,
      pq.quest_id,
      pq.progress,
      pq.status,

      qm.title,
      qm.task_type,
      qm.target_amount,
      qm.class_required,

      p.class_id AS player_class
    FROM player_quests pq
    JOIN quests_master qm ON pq.quest_id = qm.id
    JOIN players p ON p.id = pq.player_id
    WHERE pq.player_id = ?
    ORDER BY pq.quest_id ASC
    `,
    [playerId],
    (err, rows) => {
      if (err) {
        console.error("QUEST DEBUG ERROR:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// ✅ Quest event endpoint: enemy_defeated (kill/boss) + battle_won (custom)
app.post("/api/quests/event", (req, res) => {
  const { playerId, event, isBoss } = req.body;

  if (!playerId || !event) {
    return res.status(400).json({ error: "Hiányzó playerId vagy event" });
  }

  const allowedEvents = ["enemy_defeated", "battle_won"];
  if (!allowedEvents.includes(event)) {
    return res.status(400).json({ error: "Ismeretlen event" });
  }

  // ✅ 1) SELF-HEAL: ha valaha korrupt állapot maradt, ezt javítjuk, hogy ne ragadjon be
  // - completed, de progress < target -> in_progress
  // - in_progress, de progress >= target -> completed
  const selfHealSql = `
    UPDATE player_quests pq
    JOIN quests_master qm ON qm.id = pq.quest_id
    SET pq.status = CASE
      WHEN pq.status = 'completed' AND pq.progress < qm.target_amount THEN 'in_progress'
      WHEN pq.status = 'in_progress' AND pq.progress >= qm.target_amount THEN 'completed'
      ELSE pq.status
    END
    WHERE pq.player_id = ?
      AND pq.status IN ('completed','in_progress')
  `;

  pool.query(selfHealSql, [playerId], (healErr) => {
    if (healErr) {
      console.error("quests/event self-heal error:", healErr);
      return res.status(500).json({ error: "Quest self-heal failed" });
    }

    // ✅ 2) Esemény -> quest task_type mapping
    let taskTypes = [];
    if (event === "enemy_defeated") {
      // enemy kill -> kill questek; boss esetén boss questek is
      taskTypes = isBoss ? ["kill", "boss"] : ["kill"];
    } else if (event === "battle_won") {
      // csata megnyerve -> custom questek
      taskTypes = ["custom"];
    }

    // dinamikus IN placeholder
    const inPlaceholders = taskTypes.map(() => "?").join(",");

    // ✅ 3) Progress növelés: csak in_progress questek
    // - progress max: target_amount (cap)
    // - ha eléri targetet -> completed
    const updateSql = `
      UPDATE player_quests pq
      JOIN quests_master qm ON pq.quest_id = qm.id
      SET
        pq.progress = LEAST(pq.progress + 1, qm.target_amount),
        pq.status = CASE
          WHEN LEAST(pq.progress + 1, qm.target_amount) >= qm.target_amount THEN 'completed'
          ELSE pq.status
        END
      WHERE pq.player_id = ?
        AND pq.status = 'in_progress'
        AND qm.task_type IN (${inPlaceholders})
    `;

    pool.query(updateSql, [playerId, ...taskTypes], (err, result) => {
      if (err) {
        console.error("quests/event update error:", err);
        return res.status(500).json({ error: "Quest event failed" });
      }

      return res.json({
        success: true,
        event,
        appliedTaskTypes: taskTypes,
        affectedRows: result?.affectedRows ?? 0,
      });
    });
  });
});



// reward claim + következő quest + class quest unlock
// reward claim + következő quest + class quest unlock
app.post("/api/quests/claim", (req, res) => {
  const { playerId, questId } = req.body;

  if (!playerId || !questId) {
    return res.status(400).json({ error: "Hiányzó playerId vagy questId" });
  }

  console.log(">>> CLAIM request:", { playerId, questId });

  // 1) reward + player alapadatok
  pool.query(
    `
    SELECT 
      qm.reward_xp, 
      qm.reward_gold,
      qm.target_amount,
      pq.progress,
      pq.status,
      p.level AS player_level,
      p.xp    AS player_xp,
      p.unspentStatPoints
    FROM quests_master qm
    JOIN player_quests pq ON pq.quest_id = qm.id
    JOIN players p        ON p.id = pq.player_id
    WHERE pq.player_id = ? 
      AND qm.id = ?
    `,
    [playerId, questId],
    (err, results) => {
      if (err) {
        console.error("DB hiba claimnél:", err);
        return res.status(500).json({ error: "DB hiba claimnél" });
      }
      if (!results || results.length === 0) {
        return res.status(404).json({ error: "Nincs ilyen quest" });
      }

      const row = results[0];

      // ✅ dupla védelem: status és progress is stimmeljen
      if (
        row.status !== "completed" ||
        Number(row.progress) < Number(row.target_amount)
      ) {
        return res.status(400).json({ error: "A küldetés még nincs kész." });
      }

      const reward_xp = row.reward_xp || 0;
      const reward_gold = row.reward_gold || 0;

      let level = row.player_level ?? 1;
      let xp = row.player_xp ?? 0;
      let unspent = row.unspentStatPoints ?? 0;

      // 2) XP hozzáadása + szintlépés
      xp += reward_xp;
      let levelsGained = 0;

      while (xp >= xpToNextLevel(level)) {
        xp -= xpToNextLevel(level);
        level += 1;
        levelsGained += 1;
      }

      const addedStatPoints = levelsGained * 3;

      // 3) player frissítése: xp, level, gold, statpontok
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

          // 4) aktuális quest: claimed + progress targetre (páncél)
          pool.query(
            `
            UPDATE player_quests pq
            JOIN quests_master qm ON qm.id = pq.quest_id
            SET 
              pq.status = 'claimed',
              pq.progress = qm.target_amount
            WHERE pq.player_id = ? 
              AND pq.quest_id = ?
            `,
            [playerId, questId],
            (err3) => {
              if (err3) {
                console.error("Claim status update error:", err3);
                return res.status(500).json({ error: "Claim status update error" });
              }

              console.log(">>> CLAIM: quest státusz -> claimed");

              // 5) Következő ALAP quest kiválasztása (class_required IS NULL)
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
                    // még ettől függetlenül claim sikeres
                  }

                  const nextQuestId = nextRows?.[0]?.id;

                  const activateNextQuest = (cb) => {
                    if (!nextQuestId) {
                      console.log(">>> CLAIM: nincs következő locked alap quest");
                      return cb();
                    }

                    console.log(">>> CLAIM: következő alap quest aktiválása:", nextQuestId);

                    // ✅ ITT VOLT A BUG: claimedre állítottad. HELYES: in_progress + progress=0
                    pool.query(
                      `
                      UPDATE player_quests
                      SET status = 'in_progress', progress = 0
                      WHERE player_id = ? AND quest_id = ? AND status = 'locked'
                      `,
                      [playerId, nextQuestId],
                      (actErr) => {
                        if (actErr) {
                          console.error("Next quest activate error:", actErr);
                        } else {
                          console.log(">>> CLAIM: alap quest in_progress lett:", nextQuestId);
                        }
                        cb();
                      }
                    );
                  };

                  // 6) Class quest feloldás logika (marad)
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
                          console.error("Class quest count error:", cntErr);
                          return res.json({
                            message: "Küldetés claimelve (class quest ellenőrzés hibás).",
                            level,
                            xp,
                            levelsGained,
                            addedStatPoints,
                            reward_gold,
                            reward_xp,
                          });
                        }

                        const claimedCount = cntRows[0]?.claimedCount || 0;
                        console.log(">>> CLAIM: alap claimed quest count =", claimedCount);

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

                        // mind az 5 alap quest claimed -> class quest unlock
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
                              console.error("Class quest unlock error:", unlockErr);
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

                            console.log(">>> CLAIM: class quest feloldva (in_progress)");

                            return res.json({
                              message:
                                "Küldetés claimelve, következő quest / class quest frissítve!",
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


// Végpont a tippek RAKTÁBAN történõ véletlenszerû lekéréséhez
app.get("/api/tips", (req, res) => {
  pool.query("SELECT text FROM tips ORDER BY RAND()", (err, rows) => {
    if (err) {
      console.error("Hiba a tippek lekérésekor:", err);
      return res.status(500).json({ error: "Hiba a tippek lekérésekor" });
    }

    res.json({ tips: rows.map(r => r.text) });
  });
});




app.listen(port, () => {
  console.log(`Backend fut a ${port} porton`);
});