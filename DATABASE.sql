-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Maj 27, 2026 at 03:07 PM
-- Wersja serwera: 12.2.2-MariaDB-ubu2404
-- Wersja PHP: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Baza danych: `sf555`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `banned_ips`
--

CREATE TABLE `banned_ips` (
  `id` int(11) NOT NULL,
  `ip` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `chat`
--

CREATE TABLE `chat` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `date` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `game_settings`
--

CREATE TABLE `game_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `setting` varchar(300) NOT NULL,
  `value` varchar(300) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `game_settings`
--

INSERT INTO `game_settings` (`id`, `setting`, `value`) VALUES
(1, 'POTION_DUR', '72'),
(2, 'FILL_EPIC', '50'),
(3, 'FILL', '25'),
(4, 'MUSH_CHANCE', '15'),
(5, 'MUSH_CHANCE_EVENT', '45'),
(6, 'MUSH_DROP_FOUND', '1'),
(7, 'GAMBLER', '33'),
(8, 'ITEMGEN_PMUSH_EPIC', '15'),
(9, 'ITEMGEN_PMUSH_TWOSTATS', '10'),
(10, 'ITEMGEN_PMUSH_LIFEPOT', '15'),
(11, 'GUILD_S_MINLEVEL', '10'),
(12, 'SERVER_RESTART', '1589148000'),
(13, 'FILL_POTION', '10'),
(14, 'QUEST_EXP', '150'),
(15, 'QUEST_GOLD', '600'),
(16, 'EPIC_CHANCE_SHOP', '2'),
(17, 'EPIC_CHANCE_SHOP_EVENT', '8'),
(18, 'WORK_MULTIPLIER', '1'),
(19, 'UNLIMITED_BEERS', '0');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `guilds`
--

CREATE TABLE `guilds` (
  `guild_id` bigint(20) NOT NULL,
  `name` tinytext NOT NULL,
  `description` text NOT NULL,
  `chat` text NOT NULL,
  `leader_id` bigint(20) NOT NULL,
  `honor` bigint(20) NOT NULL DEFAULT 100,
  `silver` bigint(20) NOT NULL DEFAULT 1000,
  `mushroom` bigint(20) NOT NULL DEFAULT 5000,
  `fortress` tinyint(4) NOT NULL DEFAULT 10,
  `treasure` tinyint(4) NOT NULL DEFAULT 0,
  `instructor` tinyint(4) NOT NULL DEFAULT 0,
  `dung` tinyint(4) NOT NULL DEFAULT 0,
  `catapult` smallint(1) NOT NULL DEFAULT 3,
  `portal_act` int(11) NOT NULL DEFAULT 1,
  `portal_monster` int(11) NOT NULL DEFAULT 1,
  `portal_hp` bigint(20) NOT NULL DEFAULT 1003472384,
  `portal_time` varchar(30) NOT NULL DEFAULT '0',
  `coatofarms` varchar(50) DEFAULT '0D1306040E022802060A0BÂ'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `guild_attacks`
--

CREATE TABLE `guild_attacks` (
  `attack_id` bigint(20) NOT NULL,
  `guild_id` bigint(20) NOT NULL,
  `target_id` bigint(20) NOT NULL,
  `initiater_id` bigint(20) NOT NULL,
  `attack_time` bigint(20) NOT NULL,
  `fight` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `guild_attacks_archive`
--

CREATE TABLE `guild_attacks_archive` (
  `attack_id` bigint(20) NOT NULL,
  `guild_id` bigint(20) NOT NULL,
  `target_id` bigint(20) NOT NULL,
  `fight_data` longtext NOT NULL,
  `fight_data_reverse` longtext NOT NULL,
  `success` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `guild_chat`
--

CREATE TABLE `guild_chat` (
  `msg_id` bigint(20) NOT NULL,
  `donator_name` text NOT NULL,
  `guild_id` bigint(20) NOT NULL,
  `time` text NOT NULL,
  `type` int(1) NOT NULL DEFAULT 0,
  `sender_id` bigint(20) NOT NULL,
  `reciver_id` bigint(20) NOT NULL,
  `msg` text NOT NULL,
  `donate_value` bigint(20) NOT NULL DEFAULT 0,
  `donate_type` text NOT NULL,
  `donator_lvl` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `guild_invites`
--

CREATE TABLE `guild_invites` (
  `invite_id` int(20) NOT NULL,
  `guild_id` int(20) NOT NULL,
  `user_id` int(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `item_type` tinyint(4) NOT NULL,
  `item_id` smallint(6) NOT NULL,
  `dmg_min` int(11) NOT NULL,
  `dmg_max` int(11) NOT NULL,
  `atr_type_1` tinyint(4) NOT NULL,
  `atr_type_2` tinyint(4) NOT NULL,
  `atr_type_3` tinyint(4) NOT NULL,
  `atr_val_1` int(11) NOT NULL,
  `atr_val_2` int(11) NOT NULL,
  `atr_val_3` int(11) NOT NULL,
  `gold` int(11) NOT NULL,
  `mush` int(11) NOT NULL,
  `lvl` int(11) NOT NULL DEFAULT 0,
  `slot` tinyint(4) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `toilet` int(11) NOT NULL DEFAULT 0,
  `enchant` varchar(30) NOT NULL DEFAULT '0',
  `enchant_power` varchar(100) NOT NULL DEFAULT '0',
  `upgrade_level` tinyint(4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `items_fidget`
--

CREATE TABLE `items_fidget` (
  `id` int(11) NOT NULL,
  `item_type` tinyint(4) NOT NULL,
  `item_id` smallint(6) NOT NULL,
  `dmg_min` int(11) NOT NULL DEFAULT 0,
  `dmg_max` int(11) NOT NULL DEFAULT 0,
  `atr_type_1` int(11) NOT NULL,
  `atr_type_2` int(11) NOT NULL DEFAULT 0,
  `atr_type_3` int(11) NOT NULL DEFAULT 0,
  `atr_val_1` int(11) NOT NULL,
  `atr_val_2` int(11) NOT NULL DEFAULT 0,
  `atr_val_3` int(11) NOT NULL DEFAULT 0,
  `gold` int(11) NOT NULL DEFAULT 0,
  `mush` int(11) NOT NULL DEFAULT 0,
  `slot` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `enchant` bigint(20) NOT NULL,
  `enchant_power` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `items_shakes`
--

CREATE TABLE `items_shakes` (
  `id` int(11) NOT NULL,
  `item_type` tinyint(4) NOT NULL,
  `item_id` smallint(6) NOT NULL,
  `dmg_min` int(11) NOT NULL DEFAULT 0,
  `dmg_max` int(11) NOT NULL DEFAULT 0,
  `atr_type_1` int(11) NOT NULL,
  `atr_type_2` int(11) NOT NULL DEFAULT 0,
  `atr_type_3` int(11) NOT NULL DEFAULT 0,
  `atr_val_1` int(11) NOT NULL,
  `atr_val_2` int(11) NOT NULL DEFAULT 0,
  `atr_val_3` int(11) NOT NULL DEFAULT 0,
  `gold` int(11) NOT NULL DEFAULT 0,
  `mush` int(11) NOT NULL DEFAULT 0,
  `slot` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `enchant` bigint(20) NOT NULL,
  `enchant_power` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `items_tavern`
--

CREATE TABLE `items_tavern` (
  `id` int(11) NOT NULL,
  `item_type` tinyint(4) NOT NULL,
  `item_id` smallint(6) NOT NULL,
  `dmg_min` int(11) NOT NULL DEFAULT 0,
  `dmg_max` int(11) NOT NULL DEFAULT 0,
  `atr_type_1` int(11) NOT NULL,
  `atr_type_2` int(11) NOT NULL DEFAULT 0,
  `atr_type_3` int(11) NOT NULL DEFAULT 0,
  `atr_val_1` int(11) NOT NULL,
  `atr_val_2` int(11) NOT NULL DEFAULT 0,
  `atr_val_3` int(11) NOT NULL DEFAULT 0,
  `gold` int(11) NOT NULL DEFAULT 0,
  `mush` int(11) NOT NULL DEFAULT 0,
  `quest` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `enchant` bigint(20) NOT NULL,
  `enchant_power` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `messages`
--

CREATE TABLE `messages` (
  `msg_id` bigint(20) NOT NULL,
  `sender_id` bigint(20) NOT NULL,
  `reciver_id` bigint(20) NOT NULL,
  `time` bigint(20) NOT NULL,
  `subject` tinytext NOT NULL,
  `msg` text NOT NULL,
  `read` tinyint(4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `server_config`
--

CREATE TABLE `server_config` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(300) NOT NULL,
  `value` varchar(300) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `server_config`
--

INSERT INTO `server_config` (`id`, `name`, `value`) VALUES
(1, 'SERVER_ID', '1'),
(2, 'HOST', 'localhost/sf555'),
(3, 'LANGUAGE', 'pl'),
(4, 'BACKGROUND', '6'),
(5, 'MAIL', 'admin@mail.com'),
(6, 'SYSTEM_VERSION', '555'),
(7, 'GAME_VERSION', '1.0.0'),
(8, 'EVENT', '5'),
(9, 'EVENT_OCTOBERFEST', '0'),
(10, 'EVENT_DEALER', '0'),
(11, 'SEASON_EPICS', '0');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `tower_helper_items`
--

CREATE TABLE `tower_helper_items` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tower_helper` tinyint(4) NOT NULL,
  `item_type` tinyint(4) NOT NULL,
  `item_id` smallint(6) NOT NULL,
  `dmg_min` int(11) NOT NULL,
  `dmg_max` int(11) NOT NULL,
  `atr_type_1` tinyint(4) NOT NULL,
  `atr_type_2` tinyint(4) NOT NULL,
  `atr_type_3` tinyint(4) NOT NULL,
  `atr_val_1` int(11) NOT NULL,
  `atr_val_2` int(11) NOT NULL,
  `atr_val_3` int(11) NOT NULL,
  `gold` int(11) NOT NULL,
  `mush` int(11) NOT NULL,
  `slot` tinyint(4) NOT NULL,
  `toilet` int(11) NOT NULL DEFAULT 0,
  `enchant` varchar(30) NOT NULL DEFAULT '0',
  `enchant_power` varchar(100) NOT NULL DEFAULT '0',
  `upgrade_level` tinyint(4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `user_data`
--

CREATE TABLE `user_data` (
  `user_id` int(11) NOT NULL,
  `user_name` tinytext NOT NULL,
  `password` tinytext NOT NULL,
  `lvl` int(11) NOT NULL DEFAULT 1,
  `silver` bigint(20) NOT NULL DEFAULT 100,
  `email` tinytext NOT NULL,
  `email_validated` int(1) NOT NULL DEFAULT 1,
  `last_ip` varchar(30) NOT NULL,
  `last_activ` varchar(30) NOT NULL,
  `gchat_last` int(11) NOT NULL DEFAULT 0,
  `gattack_last` int(11) NOT NULL DEFAULT 0,
  `mush_donate` bigint(20) NOT NULL DEFAULT 0,
  `face1` smallint(4) NOT NULL,
  `face2` smallint(4) NOT NULL,
  `face3` smallint(4) NOT NULL,
  `face4` smallint(4) NOT NULL,
  `face5` smallint(4) NOT NULL,
  `face6` smallint(4) NOT NULL,
  `face7` smallint(4) NOT NULL,
  `face8` smallint(4) NOT NULL,
  `face9` smallint(4) NOT NULL,
  `face10` smallint(4) NOT NULL,
  `golden_frame` smallint(4) NOT NULL DEFAULT 0,
  `mushroom` int(11) NOT NULL DEFAULT 5000,
  `ssid` tinytext CHARACTER SET utf8mb4 COLLATE utf8mb4_czech_ci NOT NULL,
  `reg_date` bigint(20) NOT NULL,
  `enabled` enum('yes','no') CHARACTER SET utf8mb4 COLLATE utf8mb4_czech_ci NOT NULL DEFAULT 'yes',
  `warned` enum('yes','no') DEFAULT 'no',
  `class` tinyint(4) NOT NULL,
  `race` tinyint(4) NOT NULL,
  `gender` tinyint(4) NOT NULL,
  `thirst` smallint(6) NOT NULL DEFAULT 6000,
  `attr_str` int(11) NOT NULL DEFAULT 10,
  `attr_agi` int(11) NOT NULL DEFAULT 10,
  `attr_int` int(11) NOT NULL DEFAULT 10,
  `attr_wit` int(11) NOT NULL DEFAULT 10,
  `attr_luck` int(11) NOT NULL DEFAULT 10,
  `honor` int(11) NOT NULL DEFAULT 100,
  `dungeon_1` tinyint(4) NOT NULL DEFAULT 0,
  `dungeon_2` tinyint(4) NOT NULL DEFAULT 0,
  `dungeon_3` tinyint(4) NOT NULL DEFAULT 0,
  `dungeon_4` tinyint(4) NOT NULL DEFAULT 0,
  `dungeon_5` tinyint(4) NOT NULL DEFAULT 0,
  `dungeon_6` tinyint(4) NOT NULL DEFAULT 0,
  `dungeon_7` tinyint(4) NOT NULL DEFAULT 0,
  `dungeon_8` tinyint(4) NOT NULL DEFAULT 0,
  `dungeon_9` tinyint(4) NOT NULL DEFAULT 0,
  `dungeon_10` tinyint(4) NOT NULL DEFAULT 0,
  `dungeon_11` tinyint(4) NOT NULL DEFAULT 0,
  `dungeon_12` tinyint(4) NOT NULL DEFAULT 0,
  `dungeon_13` tinyint(4) NOT NULL DEFAULT 0,
  `tower_level` tinyint(4) NOT NULL DEFAULT 1,
  `copycat_lvl` varchar(11) NOT NULL DEFAULT '150:150:150',
  `copycat_str` varchar(100) NOT NULL DEFAULT '2056:887:884',
  `copycat_dex` varchar(100) NOT NULL DEFAULT '884:861:1543',
  `copycat_int` varchar(100) NOT NULL DEFAULT '861:1546:862',
  `copycat_wit` varchar(100) NOT NULL DEFAULT '1417:1417:1418',
  `copycat_luck` varchar(100) NOT NULL DEFAULT '1118:1118:1121',
  `guild_id` smallint(6) DEFAULT 0,
  `g_silverspent` bigint(20) NOT NULL,
  `g_mushroomspent` bigint(20) NOT NULL,
  `guild_rank` tinyint(4) NOT NULL DEFAULT 0,
  `guild_attack` tinyint(4) NOT NULL DEFAULT 0,
  `guild_defend` tinyint(4) NOT NULL DEFAULT 0,
  `guild_portal` varchar(30) NOT NULL DEFAULT '0',
  `mount` tinyint(4) NOT NULL DEFAULT 0,
  `mount_dur` bigint(20) NOT NULL DEFAULT 0,
  `user_desc` text NOT NULL,
  `medal_gladiator` int(11) NOT NULL DEFAULT 0,
  `medal_adventurer` int(11) NOT NULL DEFAULT 0,
  `medal_employment` int(11) NOT NULL DEFAULT 0,
  `medal_commerce` int(11) NOT NULL DEFAULT 0,
  `medal_bravery` int(11) NOT NULL DEFAULT 0,
  `medal_friendship` int(11) NOT NULL DEFAULT 0,
  `status` tinyint(4) NOT NULL DEFAULT 0,
  `status_end` int(11) NOT NULL DEFAULT 0,
  `status_extra` tinyint(4) NOT NULL DEFAULT 0,
  `quest_red_1` int(11) NOT NULL DEFAULT 0,
  `quest_red_2` int(11) NOT NULL DEFAULT 0,
  `quest_red_3` int(11) NOT NULL DEFAULT 0,
  `quest_gold_1` int(11) NOT NULL,
  `quest_location_1` tinyint(4) DEFAULT NULL,
  `quest_location_2` tinyint(4) NOT NULL,
  `quest_location_3` tinyint(4) NOT NULL,
  `quest_exp_1` int(11) NOT NULL,
  `quest_dur_1` int(11) NOT NULL DEFAULT 2,
  `quest_gold_2` int(11) NOT NULL,
  `quest_exp_2` int(11) NOT NULL,
  `quest_dur_2` int(11) NOT NULL DEFAULT 2,
  `quest_gold_3` int(11) NOT NULL,
  `quest_exp_3` int(11) NOT NULL,
  `quest_dur_3` int(11) NOT NULL DEFAULT 2,
  `exp` bigint(20) NOT NULL DEFAULT 0,
  `dungeon_time` bigint(20) NOT NULL DEFAULT 0,
  `arena_time` bigint(20) NOT NULL DEFAULT 0,
  `beers` int(5) NOT NULL DEFAULT 0,
  `quest_reroll_time` bigint(20) NOT NULL DEFAULT 0,
  `shop_reroll_time` bigint(20) NOT NULL DEFAULT 0,
  `toilet_time` bigint(20) NOT NULL DEFAULT 0,
  `toilet` tinyint(1) NOT NULL DEFAULT 0,
  `toilet_full` tinyint(1) NOT NULL DEFAULT 0,
  `fill_level` int(11) NOT NULL DEFAULT 0,
  `fill_level_next` int(11) NOT NULL DEFAULT 150,
  `aura` tinyint(3) NOT NULL DEFAULT 1,
  `potion_id1` int(11) NOT NULL,
  `potion_id2` int(11) NOT NULL,
  `potion_id3` int(11) NOT NULL,
  `potion_value1` int(11) NOT NULL,
  `potion_value2` int(11) NOT NULL,
  `potion_value3` int(11) NOT NULL,
  `potion_time1` bigint(20) NOT NULL,
  `potion_time2` bigint(20) NOT NULL,
  `potion_time3` bigint(20) NOT NULL,
  `magic_mirror` varchar(13) NOT NULL DEFAULT '0000000000000',
  `album` int(11) NOT NULL DEFAULT -1,
  `album_data` text NOT NULL,
  `portal_act` int(1) NOT NULL DEFAULT 1,
  `portal_monster` int(2) NOT NULL DEFAULT 1,
  `portal_hp` bigint(20) NOT NULL DEFAULT 35938800,
  `portal_time` varchar(4) NOT NULL DEFAULT '',
  `portal_regen_time` int(11) NOT NULL DEFAULT 0,
  `treasure` int(11) NOT NULL DEFAULT 0,
  `bonus` int(11) NOT NULL DEFAULT 0,
  `group` tinyint(4) NOT NULL DEFAULT 1,
  `color` tinyint(4) NOT NULL DEFAULT 0,
  `voucher_date` bigint(20) NOT NULL,
  `chat_ban_until` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `user_fights`
--

CREATE TABLE `user_fights` (
  `fight_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `target_id` int(11) NOT NULL,
  `success` text NOT NULL,
  `honor` int(11) NOT NULL,
  `fight_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `vouchers`
--

CREATE TABLE `vouchers` (
  `id` int(11) NOT NULL,
  `type` enum('mushroom','silver') NOT NULL,
  `amount` int(11) NOT NULL,
  `used` int(11) NOT NULL,
  `code` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `witch`
--

CREATE TABLE `witch` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `donation_type` tinyint(4) NOT NULL DEFAULT 1,
  `item_amount` bigint(20) NOT NULL DEFAULT 0,
  `item_max_amount` bigint(20) NOT NULL DEFAULT 1000,
  `work` tinyint(4) NOT NULL DEFAULT 0,
  `scroll_1` int(11) NOT NULL,
  `scroll_2` int(11) NOT NULL,
  `scroll_3` int(11) NOT NULL,
  `scroll_4` int(11) NOT NULL,
  `scroll_5` int(11) NOT NULL,
  `scroll_6` int(11) NOT NULL,
  `scroll_7` int(11) NOT NULL,
  `scroll_8` int(11) NOT NULL,
  `scroll_9` int(11) NOT NULL,
  `scrolls` int(11) NOT NULL DEFAULT 1,
  `time` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `witch`
--

INSERT INTO `witch` (`id`, `donation_type`, `item_amount`, `item_max_amount`, `work`, `scroll_1`, `scroll_2`, `scroll_3`, `scroll_4`, `scroll_5`, `scroll_6`, `scroll_7`, `scroll_8`, `scroll_9`, `scrolls`, `time`) VALUES
(1, 1, 0, 100, 0, 51, 11, 71, 31, 81, 91, 101, 61, 41, 0, 1779919200);

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `banned_ips`
--
ALTER TABLE `banned_ips`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_ip_unique` (`ip`);

--
-- Indeksy dla tabeli `chat`
--
ALTER TABLE `chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indeksy dla tabeli `game_settings`
--
ALTER TABLE `game_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_game_settings_setting` (`setting`);

--
-- Indeksy dla tabeli `guilds`
--
ALTER TABLE `guilds`
  ADD PRIMARY KEY (`guild_id`);

--
-- Indeksy dla tabeli `guild_attacks`
--
ALTER TABLE `guild_attacks`
  ADD PRIMARY KEY (`attack_id`);

--
-- Indeksy dla tabeli `guild_attacks_archive`
--
ALTER TABLE `guild_attacks_archive`
  ADD PRIMARY KEY (`attack_id`);

--
-- Indeksy dla tabeli `guild_chat`
--
ALTER TABLE `guild_chat`
  ADD PRIMARY KEY (`msg_id`);

--
-- Indeksy dla tabeli `guild_invites`
--
ALTER TABLE `guild_invites`
  ADD PRIMARY KEY (`invite_id`);

--
-- Indeksy dla tabeli `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `items_fidget`
--
ALTER TABLE `items_fidget`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `items_shakes`
--
ALTER TABLE `items_shakes`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `items_tavern`
--
ALTER TABLE `items_tavern`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`msg_id`);

--
-- Indeksy dla tabeli `server_config`
--
ALTER TABLE `server_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_server_config_name` (`name`);

--
-- Indeksy dla tabeli `tower_helper_items`
--
ALTER TABLE `tower_helper_items`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `user_data`
--
ALTER TABLE `user_data`
  ADD PRIMARY KEY (`user_id`);

--
-- Indeksy dla tabeli `user_fights`
--
ALTER TABLE `user_fights`
  ADD PRIMARY KEY (`fight_id`);

--
-- Indeksy dla tabeli `vouchers`
--
ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `witch`
--
ALTER TABLE `witch`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`),
  ADD KEY `id_2` (`id`);

--
-- AUTO_INCREMENT dla zrzuconych tabel
--

--
-- AUTO_INCREMENT dla tabeli `banned_ips`
--
ALTER TABLE `banned_ips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `chat`
--
ALTER TABLE `chat`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `game_settings`
--
ALTER TABLE `game_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=571;

--
-- AUTO_INCREMENT dla tabeli `guilds`
--
ALTER TABLE `guilds`
  MODIFY `guild_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `guild_attacks`
--
ALTER TABLE `guild_attacks`
  MODIFY `attack_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `guild_chat`
--
ALTER TABLE `guild_chat`
  MODIFY `msg_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `guild_invites`
--
ALTER TABLE `guild_invites`
  MODIFY `invite_id` int(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `items_fidget`
--
ALTER TABLE `items_fidget`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `items_shakes`
--
ALTER TABLE `items_shakes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `items_tavern`
--
ALTER TABLE `items_tavern`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `messages`
--
ALTER TABLE `messages`
  MODIFY `msg_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `server_config`
--
ALTER TABLE `server_config`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=292;

--
-- AUTO_INCREMENT dla tabeli `tower_helper_items`
--
ALTER TABLE `tower_helper_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `user_data`
--
ALTER TABLE `user_data`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `user_fights`
--
ALTER TABLE `user_fights`
  MODIFY `fight_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `vouchers`
--
ALTER TABLE `vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
