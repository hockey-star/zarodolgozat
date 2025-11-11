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
1. PLAYERS tábla

Tárolja a játékos alapadatait.

id              INT / UUID          Egyedi azonosító
username        VARCHAR(50)         Játékos neve
class           VARCHAR(20)         Karakterosztály (pl. Harcos, Íjász)
password        varchar(255)        Játékos jelszava
email           varchar(255)        Játékos emailje
level           INT                 Aktuális szint
xp              INT                 Tapasztalati pont
gold            INT                 Arany mennyisége
hp              INT                 Aktuális HP
max_hp          INT                 Maximális HP
created_at      DATETIME            Létrehozás dátuma




2. INVENTORY tábla

A játékos tárgyait tartalmazza.

id              INT / UUID          Egyedi azonosító
item_name       VARCHAR(50)         Tárgy neve
item_type       VARCHAR(20)         Tárgy típusa (pl. weapon, potion)
quantity        INT                 Darabszám





+1. birtokol
Kinek milyen tárgya van

birtokol_id             INT
birtokol_player         INT   idegen kulcs
birtokol_inv            INT   idegen kulcs



3. LEVELS tábla

A játék szintjeinek statikus adatai.

id              INT                 Szint azonosító
name            VARCHAR(30)         Szint neve
background_path VARCHAR(100)        Háttér elérési útja
enemy_pool      TEXT / JSON         Lehetséges ellenségek listája



4. ACHIEVEMENTS tábla

A játékban elérhető teljesítmények.

id              INT / UUID          Egyedi azonosító
title           VARCHAR(50)         Achievement neve
description     TEXT                Rövid leírás


5. STATISTICS tábla

A játékos teljesítményének nyomon követése.

id                  INT / UUID          Egyedi azonosító
player_id           INT (FK)            Hivatkozás a players.id-re
enemies_defeated    INT                 Legyőzött ellenségek száma
bosses_defeated     INT                 Legyőzött bossok száma
battles_played      INT                 Összes csata
battles_won         INT                 Megnyert csaták
total_damage        INT                 Összes okozott sebzés
total_damage_taken  INT                 Összes kapott sebzés



KAPCSOLATOK

players-birtokol (1)
 inventory-birtokol (N)
 statistics-players (1:1)
 achievements (N)
 levels (1:N)
