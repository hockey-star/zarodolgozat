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

// --- REGISZTRÁCIÓ (javított, duplikáció-ellenőrzéssel) ---
app.post("/api/register", (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    console.log("REGISTER request body:", req.body);

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Minden mezőt ki kell tölteni!" });
    }

    // email validálás
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Érvénytelen email cím!" });
    }

    pool.query(
      "SELECT username, email FROM players WHERE username = ? OR email = ?",
      [username, email],
      (err, results) => {
        if (err) {
          console.error("DB error on SELECT players:", err);
          return res.status(500).json({ error: "Adatbázis hiba (select)" });
        }

        console.log("SELECT results:", results);

        if (results && results.length > 0) {
          const usernameTaken = results.some((r) => r.username === username);
          const emailTaken = results.some((r) => r.email === email);

          if (usernameTaken && emailTaken) {
            return res.status(400).json({ error: "Ez a felhasználónév és email is foglalt." });
          } else if (usernameTaken) {
            return res.status(400).json({ error: "Ez a felhasználónév már létezik!" });
          } else if (emailTaken) {
            return res.status(400).json({ error: "Ezzel az email címmel már regisztráltak!" });
          }
        }

        pool.query(
          "INSERT INTO players (username, email, password_hash) VALUES (?, ?, ?)",
          [username, email, password],
          (insertErr, insertResult) => {
            if (insertErr) {
              console.error("DB error on INSERT players:", insertErr);
              if (insertErr.code === "ER_DUP_ENTRY") {
                return res.status(400).json({ error: "Duplikált felhasználónév vagy email (insert)." });
              }
              return res.status(500).json({ error: "Adatbázis hiba (insert)" });
            }

            console.log(`Új játékos regisztrált: ${username} (${email}), insertId: ${insertResult.insertId}`);
            return res.json({ message: "Sikeres regisztráció!" });
          }
        );
      }
    );
  } catch (ex) {
    console.error("Unexpected error in /api/register:", ex);
    return res.status(500).json({ error: "Szerverhiba" });
  }
});

// --- BEJELENTKEZÉS ---
app.post("/api/login", (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password)
    return res.status(400).json({ error: "Adj meg minden mezőt!" });

  pool.query(
    "SELECT * FROM players WHERE (username = ? OR email = ?) AND password_hash = ?",
    [identifier, identifier, password],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Adatbázis hiba" });
      if (results.length === 0)
        return res.status(401).json({ error: "Hibás felhasználónév/email vagy jelszó" });

      console.log(`Bejelentkezett: ${results[0].username}`);
      res.json({ message: "Sikeres bejelentkezés", user: results[0] });
    }
  );
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
