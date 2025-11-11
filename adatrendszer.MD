# Sápadt Királyság Rendszer terve:

## 1. Bevezetés
A játék egy sötét elborúlt világban játszódik 2d dark fantasy stílusban, a játékosnak külömböző pályákat kell sikeresen végrehajtania, ami után egy megprobáltató végső fő gonoszt kell legyőznie

## 2. Architektúra
Adatbázis: Mysql, phpmyadmin
Backend: express.js
Frontend: jsx,javascript,react,tailwind,css

## 3.Fő komponensek:

App.jsx:
A fő vezérlő, amely irányítja, melyik képernyő (login, class select, hub, path choice, combat) jelenjen meg.

PlayerContext.jsx:
Globális állapotkezelő. Tartalmazza a játékos adatait (név, osztály, HP, statok stb.), hogy az több komponens között is elérhető legyen.

Hub.jsx:
A fő központ, ahonnan a játékos választhat: kaland, harc, fejlesztés stb.

PathChoice.jsx:
Véletlenszerű háttérrel és ösvényválasztással indítja el a következő harcot.
Input: level, onChoose().
Output: a választott irány (bal/jobb), amit a GameController vagy App átad a harc logikának.

CombatView.jsx:
A harcrendszer megvalósítása.
Funkciók: támadás, védekezés, ital használat, log, HP sávok, AI támadások, győzelem/vereség kezelése.
Input: level, boss, background, playerHP, onEnd() callback.
Output: új HP érték + győzelem/vereség visszajelzés.

GameController.jsx (vagy AdventureHandler.jsx):
Összeköti a PathChoice és CombatView logikát, kezeli a szintek közötti váltást és a háttérképek hozzárendelését.


## 4.Adatszerkezetek

LEVELS tömb:

[
  { id: 1, bg: "/backgrounds/level1.jpg", enemies: ["Goblin", "Bandita"] },
  { id: 11, bg: "/backgrounds/boss.jpg", enemies: ["Ősi Démon"], boss: true },
]


Player objektum (PlayerContext):

{
  username: "Hős",
  base: { hp: 50, str: 5 },
  inventory: ["Potion", "Sword"],
  gold: 0
}


Enemy objektum (CombatView generálja):

{ name: "Bandita", hp: 45, dmg: [4, 8] }

Folyamatdiagram / Játék logika
Login → ClassSelect → Hub → PathChoice → CombatView → Victory / Defeat → Next Level / Hub


## 5. Adatb. terv
még folyamatban van a tervezés

