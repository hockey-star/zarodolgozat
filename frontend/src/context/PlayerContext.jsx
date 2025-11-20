// frontend/src/context/PlayerContext.jsx
import React, { createContext, useContext, useState } from "react";

const PlayerContext = createContext(null);
export function usePlayer() {
  return useContext(PlayerContext);
}

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(null);

  return <PlayerContext.Provider value={{ player, setPlayer }}>{children}</PlayerContext.Provider>;
}
