-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2025. Nov 24. 09:06
-- Kiszolgáló verziója: 10.4.28-MariaDB
-- PHP verzió: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `sk_projekt`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `achievements`
--

CREATE TABLE `achievements` (
  `id` int(11) NOT NULL,
  `title` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- A tábla adatainak kiíratása `achievements`
--

INSERT INTO `achievements` (`id`, `title`, `description`) VALUES
(1, 'Első Győzelem', 'Megnyertél egy csatát.'),
(2, 'Boss Legyőzve', 'Megöltél egy főellenséget.');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `birtokol`
--

CREATE TABLE `birtokol` (
  `id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- A tábla adatainak kiíratása `birtokol`
--

INSERT INTO `birtokol` (`id`, `player_id`, `item_id`, `quantity`) VALUES
(7, 2, 3, 1),
(8, 2, 5, 1),
(9, 2, 6, 3);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `classes`
--

CREATE TABLE `classes` (
  `id` int(11) NOT NULL,
  `name` varchar(20) DEFAULT NULL,
  `base_strength` int(11) DEFAULT NULL,
  `base_dexterity` int(11) NOT NULL,
  `base_intellect` int(11) DEFAULT NULL,
  `base_defense` int(11) DEFAULT NULL,
  `base_hp` int(11) DEFAULT NULL,
  `base_max_hp` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- A tábla adatainak kiíratása `classes`
--

INSERT INTO `classes` (`id`, `name`, `base_strength`, `base_dexterity`, `base_intellect`, `base_defense`, `base_hp`, `base_max_hp`) VALUES
(6, 'Harcos', 5, 2, 0, 3, 50, 50),
(7, 'Varázsló', 0, 0, 5, 1, 30, 30),
(8, 'Íjász', 3, 5, 2, 2, 40, 40);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `type` varchar(20) NOT NULL,
  `min_dmg` int(11) DEFAULT 0,
  `max_dmg` int(11) DEFAULT 0,
  `intellect_bonus` int(11) DEFAULT 0,
  `defense_bonus` int(11) DEFAULT 0,
  `hp_bonus` int(11) DEFAULT 0,
  `rarity` varchar(10) DEFAULT 'common',
  `bonus_strength` int(11) DEFAULT 0,
  `bonus_intellect` int(11) DEFAULT 0,
  `bonus_defense` int(11) DEFAULT 0,
  `bonus_hp` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- A tábla adatainak kiíratása `items`
--

INSERT INTO `items` (`id`, `name`, `type`, `min_dmg`, `max_dmg`, `intellect_bonus`, `defense_bonus`, `hp_bonus`, `rarity`, `bonus_strength`, `bonus_intellect`, `bonus_defense`, `bonus_hp`) VALUES
(3, 'Vas Kard', 'weapon', 3, 5, 0, 0, 0, 'common', 2, 0, 0, 0),
(4, 'Varázspálca', 'weapon', 1, 4, 0, 0, 0, 'rare', 0, 3, 0, 0),
(5, 'Vérteli Páncél', 'armor', 0, 0, 0, 0, 0, 'common', 0, 0, 3, 0),
(6, 'Gyógyital', 'potion', 0, 0, 0, 0, 0, 'common', 0, 0, 0, 20);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `levels`
--

CREATE TABLE `levels` (
  `id` int(11) NOT NULL,
  `name` varchar(30) DEFAULT NULL,
  `background_path` varchar(100) DEFAULT NULL,
  `enemy_pool` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`enemy_pool`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `paths`
--

CREATE TABLE `paths` (
  `id` int(11) NOT NULL,
  `level_id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `event_pool` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`event_pool`)),
  `item_pool` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`item_pool`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `players`
--

CREATE TABLE `players` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT 1,
  `xp` int(11) DEFAULT 0,
  `gold` int(11) DEFAULT 0,
  `hp` int(11) DEFAULT 50,
  `max_hp` int(11) DEFAULT 50,
  `strength` int(11) DEFAULT 5,
  `intellect` int(11) DEFAULT 5,
  `defense` int(11) DEFAULT 2,
  `created_at` datetime DEFAULT current_timestamp(),
  `unspentStatPoints` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- A tábla adatainak kiíratása `players`
--

INSERT INTO `players` (`id`, `username`, `email`, `password_hash`, `class_id`, `level`, `xp`, `gold`, `hp`, `max_hp`, `strength`, `intellect`, `defense`, `created_at`, `unspentStatPoints`) VALUES
(2, 'TesztJátékos', 'teszt@pelda.com', 'hashedpassword123', 6, 1, 0, 100, 50, 50, 5, 0, 3, '2025-11-11 10:47:22', 0),
(3, 'asd', 'asd@gmail.com', 'asd', 7, NULL, NULL, 100, NULL, NULL, NULL, NULL, NULL, '2025-11-13 09:51:41', 0),
(4, 'asd2', 'asd2@gmail.com', 'asd', NULL, 1, 0, 0, 50, 50, 5, 5, 2, '2025-11-13 12:20:40', 0),
(5, 'tesztteszt', 'teszt@teszt.com', 'asd', NULL, 1, 0, 0, 50, 50, 5, 5, 2, '2025-11-17 11:35:24', 0),
(6, 'jozsitestmage', 'hunormeg@alexot.hu', '123', 7, 1, 0, 100, 30, 30, 0, 5, 1, '2025-11-20 12:23:41', 0),
(7, 'TesztPlayer', 'teszt@example.com', 'teszt123', NULL, 1, 1000, 0, 50, 50, 5, 5, 2, '2025-11-20 12:40:32', 0),
(8, 'asd342', 'asd435@gmail.com', '123', 6, 1, 0, 100, 50, 50, 5, 0, 3, '2025-11-21 08:43:49', 0),
(9, 'teszt123', 'tesztelek@gmail.com', '123', 6, 11, 67, 157, 200, 245, 26, 0, 3, '2025-11-21 10:16:21', 0),
(10, 'teszt321', 'teszt321@gmail.com', '123', 7, 2, 2, 22, 60, 60, 5, 6, 2, '2025-11-21 13:56:08', 0);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `player_quests`
--

CREATE TABLE `player_quests` (
  `id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `quest_id` int(11) NOT NULL,
  `progress` int(11) DEFAULT 0,
  `status` enum('locked','in_progress','completed','claimed') DEFAULT 'locked'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `quests_master`
--

CREATE TABLE `quests_master` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `task_type` enum('kill','boss','collect','travel','custom') NOT NULL,
  `target_amount` int(11) DEFAULT 1,
  `reward_xp` int(11) DEFAULT 0,
  `reward_gold` int(11) DEFAULT 0,
  `class_required` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- A tábla adatainak kiíratása `quests_master`
--

INSERT INTO `quests_master` (`id`, `title`, `description`, `task_type`, `target_amount`, `reward_xp`, `reward_gold`, `class_required`) VALUES
(1, 'Ölj meg 5 ellenséget', 'Kezdő vadászat', 'kill', 5, 20, 50, NULL),
(2, 'Győzd le az első bosst', 'A sötét erdő mélyén...', 'boss', 1, 100, 200, NULL),
(3, 'Szerezz meg egy varázskövet', 'Csak mágusoknak!', 'collect', 1, 40, 70, 'mage');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `statistics`
--

CREATE TABLE `statistics` (
  `id` int(11) NOT NULL,
  `player_id` int(11) DEFAULT NULL,
  `enemies_defeated` int(11) DEFAULT 0,
  `bosses_defeated` int(11) DEFAULT 0,
  `battles_played` int(11) DEFAULT 0,
  `battles_won` int(11) DEFAULT 0,
  `total_damage` int(11) DEFAULT 0,
  `total_damage_taken` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- A tábla adatainak kiíratása `statistics`
--

INSERT INTO `statistics` (`id`, `player_id`, `enemies_defeated`, `bosses_defeated`, `battles_played`, `battles_won`, `total_damage`, `total_damage_taken`) VALUES
(2, 2, 10, 2, 15, 12, 500, 300);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `achievements`
--
ALTER TABLE `achievements`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `birtokol`
--
ALTER TABLE `birtokol`
  ADD PRIMARY KEY (`id`),
  ADD KEY `player_id` (`player_id`),
  ADD KEY `item_id` (`item_id`);

--
-- A tábla indexei `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- A tábla indexei `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `levels`
--
ALTER TABLE `levels`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `paths`
--
ALTER TABLE `paths`
  ADD PRIMARY KEY (`id`),
  ADD KEY `level_id` (`level_id`);

--
-- A tábla indexei `players`
--
ALTER TABLE `players`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_player_class` (`class_id`);

--
-- A tábla indexei `player_quests`
--
ALTER TABLE `player_quests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `player_id` (`player_id`),
  ADD KEY `quest_id` (`quest_id`);

--
-- A tábla indexei `quests_master`
--
ALTER TABLE `quests_master`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `statistics`
--
ALTER TABLE `statistics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `player_id` (`player_id`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `achievements`
--
ALTER TABLE `achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `birtokol`
--
ALTER TABLE `birtokol`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT a táblához `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT a táblához `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT a táblához `paths`
--
ALTER TABLE `paths`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `players`
--
ALTER TABLE `players`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT a táblához `player_quests`
--
ALTER TABLE `player_quests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `quests_master`
--
ALTER TABLE `quests_master`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `statistics`
--
ALTER TABLE `statistics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `birtokol`
--
ALTER TABLE `birtokol`
  ADD CONSTRAINT `birtokol_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `birtokol_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `paths`
--
ALTER TABLE `paths`
  ADD CONSTRAINT `paths_ibfk_1` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `players`
--
ALTER TABLE `players`
  ADD CONSTRAINT `fk_player_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Megkötések a táblához `player_quests`
--
ALTER TABLE `player_quests`
  ADD CONSTRAINT `player_quests_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `player_quests_ibfk_2` FOREIGN KEY (`quest_id`) REFERENCES `quests_master` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `statistics`
--
ALTER TABLE `statistics`
  ADD CONSTRAINT `statistics_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
