-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Jan 28. 10:09
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
  `upgrade_level` int(11) DEFAULT 0,
  `is_equipped` tinyint(1) DEFAULT 0,
  `equip_slot` tinyint(4) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- A tábla adatainak kiíratása `birtokol`
--

INSERT INTO `birtokol` (`id`, `player_id`, `item_id`, `quantity`, `upgrade_level`, `is_equipped`, `equip_slot`) VALUES
(10, 19, 4, 1, 0, 0, 1),
(11, 19, 3, 1, 0, 0, 1),
(16, 19, 5, 1, 6, 0, 1),
(18, 19, 6, 1, 0, 0, 1),
(27, 24, 3, 1, 0, 0, 1),
(28, 24, 4, 1, 0, 0, 1),
(29, 24, 5, 1, 0, 1, 1),
(30, 24, 6, 1, 0, 0, 1),
(32, 25, 3, 1, 0, 0, 1),
(33, 25, 4, 1, 0, 0, 1),
(34, 24, 15, 1, 0, 0, 1),
(35, 24, 11, 1, 0, 0, 1),
(36, 24, 7, 1, 0, 1, 1),
(39, 24, 28, 1, 0, 0, 1),
(40, 24, 25, 1, 0, 0, 1),
(41, 26, 8, 1, 0, 1, 1),
(42, 26, 5, 1, 0, 0, 1),
(43, 26, 4, 1, 0, 0, 1),
(45, 26, 13, 1, 0, 0, 1),
(46, 26, 14, 1, 0, 0, 1),
(48, 26, 12, 1, 0, 0, 1),
(49, 26, 15, 1, 0, 0, 1),
(51, 26, 16, 1, 0, 0, 1),
(52, 26, 17, 1, 0, 0, 1),
(54, 26, 18, 1, 0, 0, 1),
(55, 26, 9, 1, 0, 0, 1),
(56, 26, 10, 1, 0, 0, 1),
(57, 26, 19, 1, 0, 0, 1),
(58, 26, 11, 1, 0, 0, 1),
(59, 26, 20, 1, 0, 0, 1),
(60, 26, 29, 1, 0, 0, 1),
(61, 26, 28, 1, 0, 0, 1),
(62, 26, 27, 1, 0, 0, 1),
(63, 26, 26, 1, 0, 0, 1),
(65, 26, 25, 1, 0, 0, 1),
(67, 26, 24, 1, 0, 0, 1),
(68, 26, 22, 1, 0, 0, 1),
(69, 26, 30, 1, 0, 0, 1),
(70, 27, 3, 1, 31, 0, 1),
(71, 27, 8, 1, 30, 0, 1),
(72, 27, 9, 1, 0, 0, 1),
(73, 27, 14, 1, 29, 0, 1),
(75, 27, 28, 1, 30, 0, 1),
(76, 27, 26, 1, 20, 0, 1),
(77, 28, 8, 1, 0, 0, 1),
(78, 28, 9, 1, 1, 0, 1),
(79, 28, 14, 1, 0, 1, 1),
(80, 28, 28, 1, 0, 1, 1),
(81, 28, 30, 1, 0, 1, 1),
(82, 29, 9, 1, 2, 1, 1),
(83, 29, 14, 1, 28, 1, 1),
(84, 31, 8, 1, 5, 1, 1),
(85, 31, 14, 1, 1, 1, 1),
(86, 31, 28, 1, 0, 1, 1),
(87, 31, 31, 1, 0, 1, 1),
(88, 32, 5, 1, 29, 1, 1),
(89, 32, 27, 1, 0, 0, 2),
(90, 32, 26, 1, 40, 1, 1),
(91, 32, 28, 1, 0, 0, 1),
(92, 32, 29, 1, 0, 1, 2),
(93, 32, 8, 1, 0, 0, 1),
(94, 32, 16, 1, 0, 0, 1),
(95, 30, 9, 1, 2, 1, 1),
(97, 30, 26, 1, 0, 1, 1),
(98, 30, 28, 1, 0, 1, 2),
(99, 30, 16, 1, 0, 1, 1);

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
(6, 'Gyógyital', 'potion', 0, 0, 0, 0, 0, 'common', 0, 0, 0, 20, 0),
(7, 'Fa Kard', 'weapon', 2, 4, 0, 0, 0, 'common', 1, 0, 0, 0, 5),
(8, 'Acél Kard', 'weapon', 5, 8, 0, 0, 0, 'uncommon', 3, 0, 0, 0, 15),
(9, 'Hosszú Kard', 'weapon', 6, 10, 0, 0, 0, 'rare', 4, 0, 0, 0, 25),
(10, 'Mágikus Kard', 'weapon', 4, 7, 2, 0, 0, 'rare', 2, 2, 0, 0, 30),
(11, 'Tőr', 'weapon', 3, 6, 0, 0, 0, 'common', 2, 0, 0, 0, 8),
(12, 'Bőr Páncél', 'armor', 0, 0, 0, 2, 0, 'common', 0, 0, 2, 0, 10),
(13, 'Láncing', 'armor', 0, 0, 0, 4, 0, 'uncommon', 0, 0, 4, 0, 20),
(14, 'Acél Páncél', 'armor', 0, 0, 0, 6, 0, 'rare', 0, 0, 6, 0, 35),
(15, 'Mágikus Köpeny', 'armor', 0, 0, 3, 2, 0, 'rare', 0, 3, 2, 0, 40),
(16, 'Ősi Páncél', 'armor', 0, 0, 1, 8, 20, 'epic', 0, 1, 8, 20, 80),
(17, 'Kis Gyógyital', 'potion', 0, 0, 0, 0, 20, 'common', 0, 0, 0, 20, 10),
(18, 'Közepes Gyógyital', 'potion', 0, 0, 0, 0, 50, 'uncommon', 0, 0, 0, 50, 25),
(19, 'Nagy Gyógyital', 'potion', 0, 0, 0, 0, 100, 'rare', 0, 0, 0, 100, 50),
(20, 'Mana Ital', 'potion', 0, 0, 30, 0, 0, 'uncommon', 0, 30, 0, 0, 30),
(21, 'Erő Ital', 'potion', 0, 0, 0, 0, 0, 'uncommon', 5, 0, 0, 0, 30),
(22, 'Varázskönyv', 'weapon', 2, 5, 5, 0, 0, 'rare', 0, 5, 0, 0, 45),
(23, 'Ősi Bot', 'weapon', 4, 9, 6, 0, 0, 'epic', 0, 6, 0, 0, 70),
(24, 'Nomád Harci Vért', 'armor', 0, 0, 0, 5, 0, 'uncommon', 0, 0, 5, 0, 25),
(25, 'Mágikus Pajzs', 'armor', 0, 0, 3, 7, 0, 'epic', 0, 3, 7, 0, 60),
(26, 'Gyűrű az Erőhöz', 'accessory', 0, 0, 0, 0, 0, 'rare', 4, 0, 0, 0, 40),
(27, 'Gyűrű az Intelligenciához', 'accessory', 0, 0, 4, 0, 0, 'rare', 0, 4, 0, 0, 40),
(28, 'Élet Amulett', 'accessory', 0, 0, 0, 0, 50, 'rare', 0, 0, 0, 50, 45),
(29, 'Ősi Amulett', 'accessory', 0, 0, 3, 3, 30, 'epic', 2, 3, 3, 30, 90),
(30, 'Legendás Kard', 'weapon', 10, 15, 3, 0, 0, 'legendary', 6, 3, 0, 0, 150),
(31, 'Jakab Kalapja', 'helmet', 0, 0, 0, 0, 0, 'legendary', 99, 99, 99, 99, 1);

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
(24, 'Hunor', 'ceges@gamil.kum', 'fgh', 8, 1, 10000, 9895, 40, 40, 3, 2, 2, '2025-12-05 08:22:15', 0),
(25, 'asd', 'asd@gmail.com', 'asd', 7, 51, 33, 10020, 120, 120, 0, 20, 1, '2025-12-09 09:10:58', 0),
(26, 'warror', 'gma@gmao.com', '123', 6, 1, 0, 84068, 50, 50, 5, 0, 3, '2026-01-12 11:35:48', 0),
(27, 'warror123', 'gasdma@gmadsasdo.com', '$2b$10$zEwOIrFQrGbmnil1TnbbY.CaP1/fX1iiqKk4LteVUE579jGAEZOX6', 6, 15, 79, 492854, 8000, 8000, 30, 0, 3, '2026-01-13 11:01:21', 3),
(28, 'uasdusau123', 'sadmdsa@gmail.com', '$2b$10$9WKKSjgITWTK3HOL0s4XgOh/Ub3CCAJHRpFqmdyVmFbzbvGz31BCy', 6, 9, 39, 971, 425, 425, 21, 0, 3, '2026-01-14 11:42:06', 150),
(29, 'asdasdasd123', 'asdasdasd123@gmail.com', '$2b$10$L8aUYJI/3O7OP/zlGtRg9uYf2ffpZ5t61R4Q2oMCgZLfYkBOMzTRa', 6, 1, 0, 500, 230, 230, 36, 0, 3, '2026-01-15 10:20:07', 83),
(30, 'plsmukodj', 'asdsad@gmaic.com', '$2b$10$9SrbZq7CO/CotscAaPDRhe.vK0yFl89h2Ya6nSts67vO2AK8a/Hfu', 6, 5, 108, 55, 80, 80, 11, 0, 3, '2026-01-15 12:23:20', 0),
(31, 'tesztelgetek', 'legelek@gmail.com', '$2b$10$rfMu9XbaZpbWVNnzJdHGfudlwsnfrCT1zhlwX/HZ2SRR9LD8Vz4jC', 6, 23, 161, 2130, 1799, 1799, 16, 0, 3, '2026-01-16 09:15:23', 33),
(32, 'tesztelgetek123', '123@gmads.com', '$2b$10$ZwHWxClvUUtJnUuMzWm6VuVkBFBFF2VJp5Ua9I9eWdkfKVAv7NUcW', 6, 21, 315, 264039, 13230, 14930, 56, 16, 22, '2026-01-22 12:13:01', 198);

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
(131, 24, 1, 2, 'in_progress'),
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
(146, 25, 10, 0, 'locked'),
(147, 26, 1, 2, 'in_progress'),
(148, 26, 2, 0, 'locked'),
(149, 26, 3, 0, 'locked'),
(150, 26, 4, 0, 'locked'),
(151, 26, 5, 0, 'locked'),
(154, 26, 9, 0, 'locked'),
(155, 27, 1, 3, 'completed'),
(156, 27, 2, 0, 'locked'),
(157, 27, 3, 0, 'locked'),
(158, 27, 4, 0, 'locked'),
(159, 27, 5, 0, 'locked'),
(162, 27, 9, 0, 'locked'),
(163, 28, 1, 3, 'claimed'),
(164, 28, 2, 7, 'claimed'),
(165, 28, 3, 3, 'completed'),
(166, 28, 4, 0, 'locked'),
(167, 28, 5, 0, 'locked'),
(170, 28, 9, 0, 'locked'),
(171, 29, 1, 0, 'in_progress'),
(172, 29, 2, 0, 'locked'),
(173, 29, 3, 0, 'locked'),
(174, 29, 4, 0, 'locked'),
(175, 29, 5, 0, 'locked'),
(178, 29, 9, 0, 'locked'),
(179, 30, 1, 0, 'in_progress'),
(180, 30, 2, 0, 'locked'),
(181, 30, 3, 0, 'locked'),
(182, 30, 4, 0, 'locked'),
(183, 30, 5, 0, 'locked'),
(186, 30, 9, 0, 'locked'),
(187, 31, 1, 0, 'in_progress'),
(188, 31, 2, 0, 'locked'),
(189, 31, 3, 0, 'locked'),
(190, 31, 4, 0, 'locked'),
(191, 31, 5, 0, 'locked'),
(194, 31, 9, 0, 'locked'),
(195, 32, 1, 0, 'in_progress'),
(196, 32, 2, 0, 'locked'),
(197, 32, 3, 0, 'locked'),
(198, 32, 4, 0, 'locked'),
(199, 32, 5, 0, 'locked'),
(202, 32, 9, 0, 'locked');

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
  ADD UNIQUE KEY `uq_player_item` (`player_id`,`item_id`),
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT a táblához `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT a táblához `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT a táblához `paths`
--
ALTER TABLE `paths`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `players`
--
ALTER TABLE `players`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT a táblához `player_quests`
--
ALTER TABLE `player_quests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=203;

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
