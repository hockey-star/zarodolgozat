// frontend/src/App.jsx
import React, { useState } from "react";
import { PlayerProvider, usePlayer } from "./context/PlayerContext.jsx";

import LoginScreen from "./components/LoginScreen.jsx";
import ClassSelect from "./components/ClassSelect.jsx";
import Trailer from "./components/Trailer.jsx";
import Hub from "./components/Hub.jsx";

function AppInner() {
  const [screen, setScreen] = useState("login");
  const { setPlayer } = usePlayer();

  // called by LoginScreen after successful login/register
  async function handleLogin(username) {
    try {
      const res = await fetch(`http://localhost:3000/api/user/${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!data.exists) return alert("User nem található (backend)");

      setPlayer(data.user);

      if (data.user.class_id) setScreen("hub");
      else setScreen("class");
    } catch (e) {
      console.error("handleLogin error:", e);
      alert("Szerver hiba (get user)");
    }
  }

  function goto(next) {
    setScreen(next);
  }

  return (
    <>
      {screen === "login" && <LoginScreen onLogin={handleLogin} />}
      {screen === "class" && <ClassSelect onNext={() => goto("trailer")} />}
      {screen === "trailer" && <Trailer onEnd={() => goto("hub")} />}
      {screen === "hub" && <Hub />}
    </>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <div className="min-h-screen bg-black text-gray-100">
        <div className="max-w-5xl mx-auto">
          <AppInner />
        </div>
      </div>
    </PlayerProvider>
  );
}
