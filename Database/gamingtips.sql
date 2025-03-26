-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Mar 18, 2025 at 07:38 PM
-- Server version: 9.2.0
-- PHP Version: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `database`
--

-- --------------------------------------------------------

--
-- Table structure for table `forum`
--

CREATE TABLE `forum` (
  `post_id` int NOT NULL,
  `forum_title` varchar(255) NOT NULL,
  `user_id` int NOT NULL,
  `forum_tags` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `content` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `forum`
--

INSERT INTO `forum` (`post_id`, `forum_title`, `user_id`, `forum_tags`, `created_at`, `content`) VALUES
(1, '🎮 General Gaming Discussion', 1, 'fps, reaction-time, opinions', '2025-03-01 10:00:00', 'How do you improve your reaction time in FPS games?'),
(2, '🕹️ RPG Strategies & Builds', 2, 'rpg, builds', '2025-03-02 14:30:00', 'What is the best starting class in Elden Ring?'),
(3, '⚔️ Multiplayer & Co-op Tips', 1, 'multiplayer, teamwork', '2025-03-03 09:15:00', 'How do you carry a team in League of Legends?'),
(4, '🔫 FPS Tactics & Strategies', 2, 'strategy, fps', '2025-03-04 16:45:00', 'Best loadouts for Call of Duty Warzone?'),
(5, '🥊 Controversial gaming opinion', 1, 'gaming, opinions', '2025-03-05 11:20:00', 'What’s your most controversial gaming opinion?'),
(6, '🏎️ Drift cars in Forza H5', 2, 'racing, cars', '2025-03-06 08:50:00', 'Best drift car for u guys?'),
(7, '🏹 Open world maps', 1, 'open-world, exploration', '2025-03-07 18:30:00', 'Best open-world map of all time');

-- --------------------------------------------------------

--
-- Table structure for table `forum_comments`
--

CREATE TABLE `forum_comments` (
  `comment_id` int NOT NULL,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `forum_comments`
--

INSERT INTO `forum_comments` (`comment_id`, `post_id`, `user_id`, `content`, `created_at`) VALUES
(1, 1, 1, 'Practice in aim trainers like Aim Lab.', '2025-03-02 10:15:00'),
(2, 1, 2, 'Adjust your mouse DPI and sensitivity settings.', '2025-03-03 12:30:00'),
(3, 2, 1, 'It depends on your playstyle, Vagabond is good for beginners.', '2025-03-04 14:45:00'),
(4, 2, 2, 'Astrologer is great if you like magic.', '2025-03-05 17:00:00'),
(5, 3, 1, 'Focus on objectives, not just kills.', '2025-03-06 09:25:00'),
(6, 3, 2, 'Warding and vision control is key!', '2025-03-07 11:40:00'),
(7, 4, 1, 'M4A1 and MP5 are a great combo.', '2025-03-08 13:10:00'),
(8, 4, 2, 'Use Ghost and High Alert perks.', '2025-03-09 15:20:00'),
(9, 5, 1, 'Difficulty settings should be standard in all games.', '2025-03-10 18:30:00'),
(10, 5, 2, 'Live-service games are ruining single-player experiences.', '2025-03-11 20:15:00'),
(11, 6, 1, 'Mazda RX-7 for me.', '2025-03-12 10:45:00'),
(12, 6, 2, 'Nissan 240SX has perfect balance for drifting.', '2025-03-13 12:00:00'),
(13, 7, 1, 'RDR2’s is hundred percent my fav.', '2025-03-14 15:30:00'),
(14, 7, 2, 'BOTW easily for me.', '2025-03-15 17:45:00'),
(15, 7, 1, 'GTA might be the one for me.', '2025-03-16 19:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `guides`
--

CREATE TABLE `guides` (
  `guide_id` int NOT NULL,
  `user_id` int NOT NULL,
  `guide_title` varchar(255) NOT NULL,
  `guide_content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `brief_desc` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `guides`
--

INSERT INTO `guides` (`guide_id`, `user_id`, `guide_title`, `guide_content`, `created_at`, `brief_desc`) VALUES
(1, 1, 'How to Improve Your FPS in Games', 'In this guide, we will explore various methods to improve your FPS in games, ensuring smoother performance, especially for competitive gaming.\r\n  \r\nAdjust Graphics Settings: Lowering graphical settings can significantly boost FPS.\r\nUpdate Your Drivers: Keep your graphics drivers up to date.\r\nOverclock Your GPU: If comfortable, overclocking can improve performance.\r\nUse FPS Cap: Capping FPS stabilizes performance and prevents power consumption.', '2025-03-16 10:00:00', 'FPS optimization tips for smoother gameplay. Click to read more.'),
(2, 2, 'Best RPG Builds for Beginners', 'RPGs can be overwhelming, so here are the best beginner-friendly builds:\r\n  \r\nWarrior Build: Focuses on physical combat with heavy armor.\r\nMage Build: Uses ranged attacks and spells, focusing on intelligence.\r\nHybrid Build: A mix of strength and magic for flexibility in combat.', '2025-03-10 14:30:00', 'Explore some of the most beginner-friendly RPG builds. Click to read more.'),
(3, 1, 'Essential Mods for Skyrim', 'Mods can drastically change Skyrim’s experience. Here are some must-have mods:\r\n  \r\nSkyrim Script Extender (SKSE): Allows deeper mod interaction.\r\nUnofficial Skyrim Patch: Fixes hundreds of bugs.\r\nRealVision ENB: Enhances Skyrim’s graphics for a stunning look.', '2025-03-05 09:15:00', 'Discover the must-have mods that enhance your Skyrim experience. Click to read more.'),
(4, 2, 'How to Get the Best Performance in Racing Games', 'Racing games need smooth performance. Here are some tips:\r\n  \r\nUse a Racing Wheel: Provides better control for a realistic experience.\r\nAdjust In-Game Settings: Lower graphics settings to enhance frame rate.', '2025-03-18 16:45:00', 'Enhance your racing game experience with these performance tips. Click to read more.'),
(5, 1, 'Top 5 Beginner-Friendly RPGs', 'Here are the best RPGs for beginners:\r\n  \r\nThe Witcher 3: Rich story and accessible gameplay.\r\nSkyrim: Immersive world-building with flexible combat.\r\nDivinity: Original Sin 2: A turn-based RPG with great co-op.', '2025-03-22 11:20:00', 'Discover the best RPGs for beginners. Click to read more.'),
(6, 2, 'Top 5 Mods for GTA V', 'Transform your GTA V experience with these must-have mods:\r\n  \r\nLSPDFR Mod: Lets you play as a police officer.\r\nOpenIV: A tool for deep game file customization.\r\nRealistic Driving V: Enhances car physics for realism.', '2025-03-20 08:50:00', 'Transform your GTA V experience with these must-have mods. Click to read more.');

-- --------------------------------------------------------

--
-- Table structure for table `pages`
--

CREATE TABLE `pages` (
  `page_id` int NOT NULL,
  `page_title` varchar(255) NOT NULL,
  `Created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `pages`
--

INSERT INTO `pages` (`page_id`, `page_title`, `Created_at`) VALUES
(1, 'Home', '2025-03-10 14:30:00'),
(2, 'forum', '2025-03-10 14:30:00'),
(3, 'user', '2025-03-10 14:30:00'),
(4, 'about us', '2025-03-10 14:30:00'),
(5, 'guides', '2025-03-10 14:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `page_content`
--

CREATE TABLE `page_content` (
  `content_id` int NOT NULL,
  `page_id` int NOT NULL,
  `role_id` int NOT NULL,
  `content_text` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `page_content`
--

INSERT INTO `page_content` (`content_id`, `page_id`, `role_id`, `content_text`) VALUES
(1, 1, 1, 'Game sharing tips and tricks'),
(2, 2, 1, 'Forums'),
(3, 3, 1, 'User Profile'),
(4, 4, 1, 'About us'),
(5, 5, 1, 'Guides');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int NOT NULL,
  `role_names` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_names`) VALUES
(1, 'Admin'),
(2, 'User');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `role_id`, `created_at`) VALUES
(1, 'Gamer123', 'gamer123@example.com', 'hashedpassword', 2, '2025-03-17 15:23:55'),
(2, 'Admin1', 'admin1@example.com', 'hashedpassword', 1, '2025-03-17 15:23:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `forum`
--
ALTER TABLE `forum`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `forum_comments`
--
ALTER TABLE `forum_comments`
  ADD PRIMARY KEY (`comment_id`),
  ADD KEY `forum_id` (`post_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `guides`
--
ALTER TABLE `guides`
  ADD PRIMARY KEY (`guide_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `pages`
--
ALTER TABLE `pages`
  ADD PRIMARY KEY (`page_id`);

--
-- Indexes for table `page_content`
--
ALTER TABLE `page_content`
  ADD PRIMARY KEY (`content_id`),
  ADD KEY `page_id` (`page_id`),
  ADD KEY `user_id` (`role_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `forum`
--
ALTER TABLE `forum`
  MODIFY `post_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `forum_comments`
--
ALTER TABLE `forum_comments`
  MODIFY `comment_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `guides`
--
ALTER TABLE `guides`
  MODIFY `guide_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `pages`
--
ALTER TABLE `pages`
  MODIFY `page_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `page_content`
--
ALTER TABLE `page_content`
  MODIFY `content_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `forum`
--
ALTER TABLE `forum`
  ADD CONSTRAINT `forum_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `forum_comments`
--
ALTER TABLE `forum_comments`
  ADD CONSTRAINT `forum_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `forum` (`post_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `forum_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `guides`
--
ALTER TABLE `guides`
  ADD CONSTRAINT `guides_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `page_content`
--
ALTER TABLE `page_content`
  ADD CONSTRAINT `page_content_ibfk_1` FOREIGN KEY (`page_id`) REFERENCES `pages` (`page_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `page_content_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
