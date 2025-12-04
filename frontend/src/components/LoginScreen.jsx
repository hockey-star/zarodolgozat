// frontend/src/components/LoginScreen.jsx
import React, { useState, useEffect } from "react";
import "./LoginScreen.css";
import { usePlayer } from "../context/PlayerContext.jsx";
import Cim from "../Cim.jsx";

export default function LoginScreen({ onLogin }) {
  const { setPlayer } = usePlayer();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    document.body.style.margin = "0";
    return () => (document.body.style.margin = "0");
  }, []);

  function showTempAlert(message) {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => {
      setHiding(true);
      setTimeout(() => {
        setShowAlert(false);
        setHiding(false);
      }, 400);
    }, 2500);
  }

  async function handle() {
    if (!username.trim() && !email.trim()) {
      showTempAlert("Adj meg egy felhasználónevet vagy email címet!");
      return;
    }
    if (!password.trim()) {
      showTempAlert("Adj meg egy jelszót!");
      return;
    }

    try {
      if (isRegistering) {
        if (!email.trim()) {
          showTempAlert("Adj meg egy email címet!");
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showTempAlert("Érvénytelen email formátum!");
          return;
        }
        if (password !== confirmPassword) {
          showTempAlert("A jelszavak nem egyeznek!");
          return;
        }

        const regRes = await fetch(`http://localhost:3000/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          showTempAlert(regData.error || "Sikertelen regisztráció!");
          return;
        }

        const loginRes = await fetch(`http://localhost:3000/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: username, password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          showTempAlert(
            loginData.error || "Regisztráltál, de a bejelentkezés nem sikerült."
          );
          return;
        }

        setPlayer(loginData.user);
        localStorage.setItem("sk_current_user", loginData.user.username);
        localStorage.setItem("sk_current_user_id", loginData.user.id);
        onLogin(loginData.user.username);
        return;
      } else {
        const loginRes = await fetch(`http://localhost:3000/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: username || email, password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          showTempAlert(loginData.error || "Hibás bejelentkezési adatok!");
          return;
        }

        setPlayer(loginData.user);
        localStorage.setItem("sk_current_user", loginData.user.username);
        localStorage.setItem("sk_current_user_id", loginData.user.id);
        onLogin(loginData.user.username);
      }
    } catch (e) {
      console.error("Login error:", e);
      showTempAlert("Szerver hiba történt!");
    }
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Enter" && document.activeElement.tagName === "INPUT") handle();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [username, email, password, confirmPassword, isRegistering]);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden font-poppins">
      <div
        className={`alertBanner ${
          showAlert ? (hiding ? "slideUp" : "slideDown") : "hidden"
        }`}
      >
        {alertMessage}
      </div>

      <video
        autoPlay
        loop
        muted
        playsInline
        className="-z-10 absolute top-0 left-0 w-full h-full object-cover object-center"
      >
        <source src="/src/assets/videos/1.mp4" type="video/mp4" />
      </video>

      <div className="loginBox relative z-10 w-11/12 sm:w-2/3 md:w-1/3 p-8 text-white shadow-2xl backdrop-blur-sm text-center">
        <h2 className="bejelentkezes">
          {isRegistering ? "Regisztráció" : "Bejelentkezés"}
        </h2>
        <p className="parancs">
          {isRegistering
            ? "*Hozz létre egy új fiókot*"
            : "*Adj meg egy felhasználónevet és jelszavat a belépéshez*"}
        </p>

        <input
          type="text"
          placeholder="Felhasználónév"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="felhasznalonev bg-red-950 w-full p-3 mb-5 text-yellow-100 text-center placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-red-700"
        />

        {isRegistering && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="email bg-red-950 w-full p-3 mb-5 text-yellow-100 text-center placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-red-700"
          />
        )}

        <input
          type="password"
          placeholder="Jelszó"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="jelszo bg-red-950 w-full p-3 mb-5 text-yellow-100 text-center placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-red-700"
        />

        {isRegistering && (
          <input
            type="password"
            placeholder="Jelszó megerősítése"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="jelszo bg-red-950 w-full p-3 mb-5 text-yellow-100 text-center placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-red-700"
          />
        )}

        <button onClick={handle} className="button">
          {isRegistering ? "REGISZTRÁCIÓ" : "TOVÁBB"}
        </button>

        <p className="regisztracioText">
          {isRegistering ? (
            <>
              <span className="regText">Van már fiókod?</span>{" "}
              <span
                className="regisztracioLink"
                onClick={() => setIsRegistering(false)}
              >
                Jelentkezz be
              </span>
            </>
          ) : (
            <>
              <span className="regText">Nincs még fiókod?</span>{" "}
              <span
                className="regisztracioLink"
                onClick={() => setIsRegistering(true)}
              >
                Regisztrálj
              </span>
            </>
          )}
        </p>
      </div>

      <div className="logoDiv">
        <div className="logoContainer">
          <div>
            <a
              className="logoItem"
              href="https://www.youtube.com"
              target="_blank"
            >
              <img
                className="logo"
                src="./src/assets/socialmedia/YT.png"
                alt="youtube"
              />
              <p className="socialMediaNames">YouTube</p>
            </a>
          </div>
          <div>
            <a
              className="logoItem"
              href="https://www.x.com"
              target="_blank"
            >
              <img className="logo" src="./src/assets/socialmedia/X.png" alt="x" />
              <p className="socialMediaNames">X</p>
            </a>
          </div>
          <div>
            <a
              className="logoItem"
              href="https://www.discord.com"
              target="_blank"
            >
              <img
                className="logo"
                src="./src/assets/socialmedia/DC.png"
                alt="discord"
              />
              <p className="socialMediaNames">Discord</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
