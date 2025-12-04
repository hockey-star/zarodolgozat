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
        return res.status(400).json({ error: "Felhasználónév vagy email foglalt" });
      }

      pool.query(
        "INSERT INTO players (username, email, password_hash) VALUES (?, ?, ?)",
        [username, email, password],
        (insErr, insRes) => {
          if (insErr) {
            console.error("DB insert error (register):", insErr);
            return res.status(500).json({ error: "DB hiba (insert)" });
          }
          return res.json({ message: "Sikeres regisztráció", userId: insRes.insertId, username });
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
  if (!identifier || !password) return res.status(400).json({ error: "Adj meg minden mezőt!" });

  pool.query(
    "SELECT * FROM players WHERE (username = ? OR email = ?) AND password_hash = ?",
    [identifier, identifier, password],
    (err, results) => {
      if (err) {
        console.error("DB login error:", err);
        return res.status(500).json({ error: "DB hiba" });
      }
      if (results.length === 0) return res.status(401).json({ error: "Hibás felhasználónév/email vagy jelszó" });

      return res.json({ message: "Sikeres bejelentkezés", user: results[0] });
    }
  );
});

/* ---------------------------
   GET USER (by username)
   returns full player row
   --------------------------- */
app.get("/api/user/:username", (req, res) => {
  const username = req.params.username;
  pool.query("SELECT * FROM players WHERE username = ?", [username], (err, results) => {
    if (err) {
      console.error("DB get user error:", err);
      return res.status(500).json({ error: "DB hiba" });
    }
    if (results.length === 0) return res.json({ exists: false });
    return res.json({ exists: true, user: results[0] });
  });
});

/* ---------------------------
   SET CLASS (reads from classes table, writes to players)
   Body: { username, classId }
   --------------------------- */
app.post("/api/set-class", (req, res) => {
  const { username, classId } = req.body || {};
  if (!username || !classId) return res.status(400).json({ error: "Hiányzó adatok (username,classId)" });

  // classId must be numeric in your DB (6,7,8)
  pool.query("SELECT * FROM classes WHERE id = ?", [classId], (err, classRes) => {
    if (err) {
      console.error("DB error SELECT classes:", err);
      return res.status(500).json({ error: "DB hiba (class select)" });
    }
    if (classRes.length === 0) {
      return res.status(400).json({ error: "Érvénytelen kaszt ID" });
    }

    const cls = classRes[0];
    // cls fields: base_strength, base_dexterity, base_intellect, base_defense, base_hp, base_max_hp

    pool.query(
      `UPDATE players SET 
        class_id = ?,
        strength = ?,
        intellect = ?,
        defense = ?,
        hp = ?,
        max_hp = ?,
        level = 1,
        xp = 0,
        gold = 100
      WHERE username = ?`,
      [
        classId,
        cls.base_strength || 0,
        cls.base_intellect || 0,
        cls.base_defense || 0,
        cls.base_hp || 50,
        cls.base_max_hp || cls.base_hp || 50,
        username,
      ],
      (updErr, updRes) => {
        if (updErr) {
          console.error("DB error UPDATE players (set-class):", updErr);
          return res.status(500).json({ error: "DB hiba class mentéskor" });
        }
        return res.json({ message: "Kaszt beállítva" });
      }
    );
  });
});

app.get("/api/players/:id", (req, res) => {
  const { id } = req.params;

  pool.query(
    "SELECT id, username, level, xp, gold FROM players WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Adatbázis hiba" });
      if (result.length === 0)
        return res.status(404).json({ error: "Nincs ilyen felhasználó" });

      res.json(result[0]);
    }
  );
});

// --- KASZTOK LEKÉRÉSE A DB-BŐL ---
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
   UPDATE PLAYER (statok + hp + max_hp + xp + gold)
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

{/*Vesz*/}

app.post("/api/shop/buy", (req, res) => {
    const { playerId, itemId } = req.body;

    // 1. Játékos lekérdezése
    pool.query("SELECT gold FROM players WHERE id = ?", [playerId], (err, players) => {
        if (err) return res.status(500).json({ error: "DB hiba" });
        if (players.length === 0) return res.status(404).json({ error: "Nincs ilyen játékos" });

        const gold = players[0].gold;

        // 2. Tárgy lekérdezése
        pool.query("SELECT price FROM items WHERE id = ?", [itemId], (err, itemRes) => {
            if (err) return res.status(500).json({ error: "DB hiba" });
            if (itemRes.length === 0) return res.status(404).json({ error: "Tárgy nem található" });

            const price = itemRes[0].price;

            // 3. Ellenőrzés
            if (gold < price) {
                return res.status(400).json({ error: "Nincs elég arany" });
            }

            // 4. Arany levonás
            pool.query(
                "UPDATE players SET gold = gold - ? WHERE id = ?",
                [price, playerId],
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


{/*fejleszt*/}

app.post("/api/blacksmith/upgrade", (req, res) => {
    const { playerId, itemId } = req.body;

    // 1. játékos xp
    pool.query("SELECT xp FROM players WHERE id = ?", [playerId], (err, playerRes) => {
        if (err) return res.status(500).json({ error: "DB hiba" });

        const playerXP = playerRes[0].xp;

        // 2. tárgy adatok a birtokolbol
        pool.query(
            "SELECT * FROM birtokol WHERE player_id = ? AND item_id = ?",
            [playerId, itemId],
            (err, itemRes) => {
                if (err) return res.status(500).json({ error: "DB hiba" });
                if (itemRes.length === 0) return res.status(400).json({ error: "Nincs ilyen tárgyad" });

                const item = itemRes[0];
                const cost = (item.upgrade_level + 1) * 200;

                if (playerXP < cost)
                    return res.status(400).json({ error: "Nincs elég XP" });

                // 3. XP levonás
                pool.query("UPDATE players SET xp = xp - ? WHERE id = ?", [cost, playerId]);

                // 4. Upgrade level növelése
                pool.query(
                    "UPDATE birtokol SET upgrade_level = upgrade_level + 1 WHERE id = ?",
                    [item.id]
                );

                res.json({
  message: "Sikeres fejlesztés",
  newUpgradeLevel: item.upgrade_level + 1
});
            }
        );
    });
});

app.get("/api/items", (req, res) => {
  pool.query("SELECT * FROM items", (err, items) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(items);
  });
});

app.get("/api/player/:id/items", (req, res) => {
  pool.query(
    `SELECT pi.*, i.name, i.type, i.min_dmg, i.max_dmg, 
            i.intellect_bonus, i.defense_bonus, i.hp_bonus, i.rarity
     FROM birtokol pi
     JOIN items i ON i.id = pi.item_id
     WHERE pi.player_id = ?`,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(results);
    }
  );
});


app.listen(port, () => {
  console.log(`Backend fut a ${port} porton`);
});
