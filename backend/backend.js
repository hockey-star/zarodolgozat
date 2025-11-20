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


app.listen(port, () => {
  console.log(`Backend fut a ${port} porton`);
});
