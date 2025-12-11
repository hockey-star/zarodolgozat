-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2025. Dec 11. 13:32
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
  `quantity` int(11) DEFAULT 1,
  `upgrade_level` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- A tábla adatainak kiíratása `birtokol`
--

INSERT INTO `birtokol` (`id`, `player_id`, `item_id`, `quantity`, `upgrade_level`) VALUES
(10, 19, 4, 1, 0),
(11, 19, 3, 1, 0),
(12, 19, 3, 1, 0),
(13, 19, 3, 1, 0),
(14, 19, 4, 1, 0),
(15, 19, 4, 1, 0),
(16, 19, 5, 1, 6),
(17, 19, 5, 1, 0),
(18, 19, 6, 1, 0),
(19, 19, 6, 1, 0),
(20, 19, 5, 1, 0),
(21, 19, 5, 1, 0),
(22, 19, 3, 1, 0),
(23, 19, 3, 1, 0),
(24, 19, 5, 1, 0),
(25, 19, 4, 1, 0),
(26, 19, 3, 1, 0),
(27, 24, 3, 1, 0),
(28, 24, 4, 1, 0),
(29, 24, 5, 1, 0),
(30, 24, 6, 1, 0),
(31, 24, 3, 1, 0),
(32, 25, 3, 1, 0),
(33, 25, 4, 1, 0);

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
  `bonus_hp` int(11) DEFAULT 0,
  `prize` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- A tábla adatainak kiíratása `items`
--

INSERT INTO `items` (`id`, `name`, `type`, `min_dmg`, `max_dmg`, `intellect_bonus`, `defense_bonus`, `hp_bonus`, `rarity`, `bonus_strength`, `bonus_intellect`, `bonus_defense`, `bonus_hp`, `prize`) VALUES
(3, 'Vas Kard', 'weapon', 3, 5, 0, 0, 0, 'common', 2, 0, 0, 0, 0),
(4, 'Varázspálca', 'weapon', 1, 4, 0, 0, 0, 'rare', 0, 3, 0, 0, 0),
(5, 'Vérteli Páncél', 'armor', 0, 0, 0, 0, 0, 'common', 0, 0, 3, 0, 0),
(6, 'Gyógyital', 'potion', 0, 0, 0, 0, 0, 'common', 0, 0, 0, 20, 0);

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
(18, 'tesztfasz123', 'teszt@gmail.com', '123', 7, 8, 219, 817, 700, 700, 100, 118, 2, '2025-11-24 11:20:25', 0),
(19, 'teszt321', '321@gg.com', '123', 6, 100, 94765, 100030, 50, 50, 5, 0, 3, '2025-11-24 14:13:14', 0),
(20, 'teszt123123', 'mgm@gmail.com', '123', 7, 7, 41, 262, 100, 100, 5, 13, 2, '2025-12-02 10:38:22', 0),
(21, 'puszi123', 'pusz@gmail.com', '123', 6, 5, 97, 194, 100, 100, 7, 5, 2, '2025-12-02 12:57:16', 0),
(22, '123123', 'asdqw@gmail.com', '123', 8, 1, 0, 100, 40, 40, 3, 2, 2, '2025-12-02 13:45:37', 0),
(23, 'alesz123', 'alesz@gmail.com', '123', 6, 1, 0, 100, 50, 50, 5, 0, 3, '2025-12-02 13:49:54', 0),
(24, 'Hunor', 'ceges@gamil.kum', 'fgh', 8, 1, 0, 100, 40, 40, 3, 2, 2, '2025-12-05 08:22:15', 0),
(25, 'asd', 'asd@gmail.com', 'asd', 7, 51, 33, 10020, 120, 120, 0, 20, 1, '2025-12-09 09:10:58', 0);

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

--
-- A tábla adatainak kiíratása `player_quests`
--

INSERT INTO `player_quests` (`id`, `player_id`, `quest_id`, `progress`, `status`) VALUES
(85, 18, 1, 3, 'claimed'),
(86, 18, 2, 7, 'claimed'),
(87, 18, 3, 3, 'claimed'),
(88, 18, 4, 1, 'claimed'),
(89, 18, 5, 5, 'claimed'),
(92, 18, 10, 0, 'locked'),
(93, 19, 1, 3, 'claimed'),
(94, 19, 2, 0, 'in_progress'),
(95, 19, 3, 0, 'locked'),
(96, 19, 4, 0, 'locked'),
(97, 19, 5, 0, 'locked'),
(98, 19, 9, 0, 'locked'),
(99, 20, 1, 3, 'completed'),
(100, 20, 2, 0, 'locked'),
(101, 20, 3, 0, 'locked'),
(102, 20, 4, 0, 'locked'),
(103, 20, 5, 0, 'locked'),
(106, 20, 10, 0, 'locked'),
(107, 21, 1, 3, 'completed'),
(108, 21, 2, 0, 'locked'),
(109, 21, 3, 0, 'locked'),
(110, 21, 4, 0, 'locked'),
(111, 21, 5, 0, 'locked'),
(114, 21, 9, 0, 'locked'),
(115, 22, 1, 1, 'in_progress'),
(116, 22, 2, 0, 'locked'),
(117, 22, 3, 0, 'locked'),
(118, 22, 4, 0, 'locked'),
(119, 22, 5, 0, 'locked'),
(122, 22, 11, 0, 'locked'),
(123, 23, 1, 2, 'in_progress'),
(124, 23, 2, 0, 'locked'),
(125, 23, 3, 0, 'locked'),
(126, 23, 4, 0, 'locked'),
(127, 23, 5, 0, 'locked'),
(130, 23, 9, 0, 'locked'),
(131, 24, 1, 1, 'in_progress'),
(132, 24, 2, 0, 'locked'),
(133, 24, 3, 0, 'locked'),
(134, 24, 4, 0, 'locked'),
(135, 24, 5, 0, 'locked'),
(138, 24, 11, 0, 'locked'),
(139, 25, 1, 3, 'completed'),
(140, 25, 2, 0, 'locked'),
(141, 25, 3, 0, 'locked'),
(142, 25, 4, 0, 'locked'),
(143, 25, 5, 0, 'locked'),
(146, 25, 10, 0, 'locked');

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
(1, 'Első vér', 'Ölj meg 3 ellenséget.', 'kill', 3, 15, 30, NULL),
(2, 'Kezdő vadász', 'Ölj meg 7 ellenséget.', 'kill', 7, 30, 50, NULL),
(3, 'Apró győzelmek', 'Nyerj meg 3 csatát.', 'custom', 3, 40, 60, NULL),
(4, 'Első találkozás a boss-szal', 'Győzz le egy bosst.', 'boss', 1, 80, 120, NULL),
(5, 'Tapasztalt harcos', 'Nyerj meg 5 csatát.', 'custom', 5, 100, 150, NULL),
(9, 'Trial of the Mountain King', 'Végezd el a Harcosok próbáját és győzd le a Mountain King-et.', 'boss', 1, 300, 400, 'warrior'),
(10, 'Rite of the Arcane Lord', 'A mágusok végső tesztje: győzd le az Arcane Abomination-t.', 'boss', 1, 300, 400, 'mage'),
(11, 'Hunt of the Forest Spirit', 'Az íjászok nagyvadja: öld meg a Forest Spirit Beast-et.', 'boss', 1, 300, 400, 'archer');

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

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `tips`
--

CREATE TABLE `tips` (
  `id` int(11) NOT NULL,
  `text` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- A tábla adatainak kiíratása `tips`
--

INSERT INTO `tips` (`id`, `text`) VALUES
(1, 'Minden út veszélyt rejt, készülj fel!'),
(2, 'A nyugalom néha többet ér, mint a kard.'),
(3, 'A kíváncsiság gyakran bajba sodor.'),
(4, 'Figyeld az ellenfél ritmusát, abból tanulsz.'),
(5, 'A pihenés legalább olyan fontos, mint a harc.'),
(6, 'Mindig ellenőrizd a felszerelésed harc előtt.'),
(7, 'Használj különböző képességeket a legjobb kombináció érdekében.'),
(8, 'Figyelj a környezetre – egyes helyszínek előnyt adnak.'),
(9, 'Ne hagyd ki a mellékküldetéseket, sok hasznos tárgyat adnak.'),
(10, 'A pihenőknél mindig gyógyítsd a csapatod.'),
(11, 'Olvass tippeket a városokban található NPC-ktől.'),
(12, 'Kísérletezz a fegyverek és varázslatok kombinációjával.'),
(13, 'Ments gyakran, így elkerülheted a bosszantó visszatöltéseket.'),
(14, 'Használj elemi gyengeségeket a hatékonyabb harc érdekében.'),
(15, 'Nézd meg a térképet, hogy ne tévedj el.'),
(16, 'Gyűjts mindent, ami mozdítható – később jól jöhet.'),
(17, 'Figyeld a karakterek állapotát – a fáradtság hátráltat.'),
(18, 'Használj gyors utazást, hogy időt spórolj.'),
(19, 'Olvasd el a quest leírásokat, gyakran adnak titkos tippeket.'),
(20, 'Próbálj ki minden lehetőséget a párbeszédekben – rejtett jutalom lehet.');

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
-- A tábla indexei `tips`
--
ALTER TABLE `tips`
  ADD PRIMARY KEY (`id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT a táblához `player_quests`
--
ALTER TABLE `player_quests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=147;

--
-- AUTO_INCREMENT a táblához `quests_master`
--
ALTER TABLE `quests_master`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT a táblához `statistics`
--
ALTER TABLE `statistics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `tips`
--
ALTER TABLE `tips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

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
