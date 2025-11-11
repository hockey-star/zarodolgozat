import React, { useState, useEffect } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";
import "./LoginScreen.css";

export default function LoginScreen({ onNext }) {
  const [username, setUsername] = useState("");
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

  function handle() {
    if (showAlert) return;

    // --- Üres mezők ellenőrzése ---
    if (!username.trim() || !password.trim()) {
      showTempAlert("Adj meg egy nevet és egy jelszót!");
      return;
    }

    if (isRegistering) {
      // --- Jelszó megerősítés ellenőrzése ---
      if (password !== confirmPassword) {
        showTempAlert("A jelszavak nem egyeznek!");
        return;
      }

      // --- TODO: Backend regisztrációs hívás ---
      // fetch("/api/register", { method: "POST", body: JSON.stringify({ username, password }) })
      //   .then(...)
      //   .catch(...);

      localStorage.setItem("sk_current_user", username);
      showTempAlert("Sikeres regisztráció!");
      setTimeout(() => {
        setIsRegistering(false);
        setPassword("");
        setConfirmPassword("");
      }, 1000);
    } else {
      // --- TODO: Backend bejelentkezési hívás ---
      // fetch("/api/login", { method: "POST", body: JSON.stringify({ username, password }) })
      //   .then(...)
      //   .catch(...);

      localStorage.setItem("sk_current_user", username);
      onNext();
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
  }, [username, password, confirmPassword, showAlert, isRegistering]);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden font-poppins">
      {/* Felső hibaüzenet banner */}
      <div
        className={`alertBanner ${
          showAlert ? (hiding ? "slideUp" : "slideDown") : "hidden"
        }`}
      >
        {alertMessage}
      </div>

      {/* Háttérvideó */}
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

      {/* Login / Regisztráció doboz */}
      <div className="loginBox relative z-10 w-11/12 sm:w-2/3 md:w-1/3 p-8 text-white shadow-2xl backdrop-blur-sm text-center">
        <h2 className="bejelentkezes">
          {isRegistering ? "Regisztráció" : "Bejelentkezés"}
        </h2>
        <p className="parancs">
          {isRegistering
            ? "*Hozz létre egy új fiókot*"
            : "*Adj meg egy felhasználónevet és jelszavat a belépéshez*"}
        </p>

        {/* Felhasználónév */}
        <input
          type="text"
          placeholder="Felhasználónév"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="felhasznalonev bg-red-950 w-full p-3 mb-5 text-yellow-100 text-center placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-red-700"
        />

        {/* Jelszó */}
        <input
          type="password"
          placeholder="Jelszó"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="jelszo bg-red-950 w-full p-3 mb-5 text-yellow-100 text-center placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-red-700"
        />

        {/* Jelszó megerősítés (csak regisztrációkor) */}
        {isRegistering && (
          <input
            type="password"
            placeholder="Jelszó megerősítése"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="jelszo bg-red-950 w-full p-3 mb-5 text-yellow-100 text-center placeholder-yellow-100 focus:outline-none focus:ring-2 focus:ring-red-700"
          />
        )}

        {/* Gomb */}
        <button onClick={handle} className="button">
          {isRegistering ? "REGISZTRÁCIÓ" : "TOVÁBB"}
        </button>

        {/* Regisztráció / Bejelentkezés váltás */}
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

      {/* Logók alul */}
      <div className="logoDiv">
        <div className="logoContainer">
          <div>
            <a className="logoItem" href="https://www.youtube.com" target="_blank">
              <img
                className="logo"
                src="./src/assets/socialmedia/YT.png"
                alt="youtube"
              />
              <p className="socialMediaNames">YouTube</p>
            </a>
          </div>
          <div>
            <a className="logoItem" href="https://www.x.com" target="_blank">
              <img
                className="logo"
                src="./src/assets/socialmedia/X.png"
                alt="x"
              />
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
