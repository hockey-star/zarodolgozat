import React, { useState, useEffect } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";
import "./LoginScreen.css";

export default function LoginScreen({ onNext }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const { player } = usePlayer() || {};
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [hiding, setHiding] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.documentElement.style.margin = "0";
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
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
    if (showAlert) return;

    if (!username.trim() && !email.trim()) {
      showTempAlert("Adj meg egy felhasználónevet vagy email címet!");
      return;
    }
    if (!password.trim()) {
      showTempAlert("Adj meg egy jelszót!");
      return;
    }

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

      try {
        const res = await fetch("http://localhost:3000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          showTempAlert(data.error || "Sikertelen regisztráció!");
          return;
        }

        showTempAlert("Sikeres regisztráció!");
        setTimeout(() => {
          setIsRegistering(false);
          setPassword("");
          setConfirmPassword("");
        }, 1000);
      } catch {
        showTempAlert("Szerver hiba történt!");
      }
    } else {
      try {
        const res = await fetch("http://localhost:3000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: username || email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          showTempAlert(data.error || "Hibás bejelentkezési adatok!");
          return;
        }

        localStorage.setItem("sk_current_user", data.user.username);
        onNext();
      } catch {
        showTempAlert("Szerver hiba történt!");
      }
    }
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && document.activeElement.tagName === "INPUT") {
        handle();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [username, email, password, confirmPassword, showAlert, isRegistering]);

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
        Your browser does not support the video tag.
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
            <a className="logoItem" href="https://www.youtube.com" target="_blank">
              <img className="logo" src="./src/assets/socialmedia/YT.png" alt="youtube" />
              <p className="socialMediaNames">YouTube</p>
            </a>
          </div>
          <div>
            <a className="logoItem" href="https://www.x.com" target="_blank">
              <img className="logo" src="./src/assets/socialmedia/X.png" alt="x" />
              <p className="socialMediaNames">X</p>
            </a>
          </div>
          <div>
            <a className="logoItem" href="https://www.discord.com" target="_blank">
              <img className="logo" src="./src/assets/socialmedia/DC.png" alt="discord" />
              <p className="socialMediaNames">Discord</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
