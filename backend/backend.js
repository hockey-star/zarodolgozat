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

// KÜLDETÉSEK LÉTREHOZÁSA AZ ÚJ JÁTÉKOSNAK
pool.query(
  `
  INSERT INTO player_quests (player_id, quest_id, status)
  SELECT ?, qm.id,
    CASE 
      WHEN qm.class_required IS NULL THEN 
        CASE WHEN qm.id = 1 THEN 'in_progress' ELSE 'locked' END
      ELSE 'locked'
    END
  FROM quests_master qm
  `,
  [insRes.insertId],
  (questErr) => {
    if (questErr) console.error("Quest init error:", questErr);
  }
);

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
      if (err) return res.status(500).json({ error: "DB hiba quest lekéréskor" });
      res.json(results);
    }
  );
});

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

app.post("/api/quests/check", (req, res) => {
  const { playerId } = req.body;

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
      if (err) return res.status(500).json({ error: "Quest check failed" });
      res.json({ message: "Quest updated if completed" });
    }
  );
});

app.post("/api/quests/claim", (req, res) => {
  const { playerId, questId } = req.body;

  // 1. Step: lekérdezzük a jutalmat
  pool.query(
    `
    SELECT qm.reward_xp, qm.reward_gold 
    FROM quests_master qm
    JOIN player_quests pq ON pq.quest_id = qm.id
    WHERE pq.player_id = ? AND qm.id = ? AND pq.status = 'completed'
    `,
    [playerId, questId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB hiba claimnél" });
      if (results.length === 0) return res.status(400).json({ error: "Nem claimelhető" });

      const { reward_xp, reward_gold } = results[0];

      // 2. Step: reward hozzáadása playerhez
      pool.query(
        `
        UPDATE players
        SET xp = xp + ?, gold = gold + ?
        WHERE id = ?
        `,
        [reward_xp, reward_gold, playerId],
        (err) => {
          if (err) return res.status(500).json({ error: "XP/Gold update error" });

          // 3. Step: quest státusz "claimed"
          pool.query(
            `
            UPDATE player_quests
            SET status = 'claimed'
            WHERE player_id = ? AND quest_id = ?
            `,
            [playerId, questId],
            (err) => {
              if (err) return res.status(500).json({ error: "Claim status update error" });
              res.json({ message: "Küldetés claimelve!" });
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
