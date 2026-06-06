-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 06, 2026 at 03:37 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `skillpath`
--

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `cover_letter` text DEFAULT NULL,
  `status` enum('pending','reviewed','accepted','rejected') DEFAULT 'pending',
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`id`, `user_id`, `job_id`, `cover_letter`, `status`, `applied_at`) VALUES
(1, 3, 1, 'I would love to join Acme Tech as a frontend developer.', 'pending', '2026-04-28 01:50:13'),
(2, 8, 5, NULL, 'pending', '2026-05-25 21:42:33'),
(3, 9, 8, NULL, 'pending', '2026-05-25 22:40:34'),
(4, 9, 12, NULL, 'pending', '2026-05-25 22:41:52'),
(6, 8, 10, NULL, 'rejected', '2026-05-26 00:54:00'),
(7, 13, 7, NULL, 'pending', '2026-06-02 15:49:55');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` int(11) NOT NULL,
  `title` varchar(180) NOT NULL,
  `company` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(120) DEFAULT NULL,
  `industry` varchar(120) DEFAULT NULL,
  `job_type` enum('full-time','part-time','contract','internship','remote') DEFAULT 'full-time',
  `salary_min` int(11) DEFAULT NULL,
  `salary_max` int(11) DEFAULT NULL,
  `posted_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `title`, `company`, `description`, `location`, `industry`, `job_type`, `salary_min`, `salary_max`, `posted_by`, `created_at`) VALUES
(1, 'Frontend Developer', 'Acme Tech', 'Build modern web apps with React.', 'Pristina', 'Information Technology', 'full-time', 800, 1500, NULL, '2026-04-28 01:47:32'),
(2, 'Full-Stack Engineer', 'NovaSoft', 'Work on Node.js + React product.', 'Remote', 'Information Technology', 'remote', 1200, 2200, NULL, '2026-04-28 01:47:32'),
(3, 'UI/UX Designer', 'PixelHouse', 'Design beautiful user interfaces.', 'Tirana', 'Design', 'full-time', 700, 1400, NULL, '2026-04-28 01:47:32'),
(4, 'Registered Nurse', 'City Hospital', 'Provide patient care in the cardiology unit.', 'Berlin', 'Healthcare', 'full-time', 1800, 2600, NULL, '2026-04-28 01:47:32'),
(5, 'Primary School Teacher', 'Greenwood School', 'Teach English to children aged 7-10.', 'Pristina', 'Education', 'full-time', 600, 900, NULL, '2026-04-28 01:47:32'),
(6, 'Sales Representative', 'AutoMax', 'Sell cars and provide great customer service.', 'Tirana', 'Sales', 'full-time', 500, 1200, NULL, '2026-04-28 01:47:32'),
(7, 'Restaurant Cook', 'Bella Cucina', 'Prepare Italian dishes in a busy kitchen.', 'Pristina', 'Hospitality', 'full-time', 450, 800, NULL, '2026-04-28 01:47:32'),
(8, 'Truck Driver', 'TransLogistics', 'Long-haul delivery across Europe. CE license.', 'Skopje', 'Logistics', 'full-time', 900, 1600, NULL, '2026-04-28 01:47:32'),
(9, 'Junior Accountant', 'FinPro', 'Bookkeeping, invoices, monthly reports.', 'Tirana', 'Finance', 'full-time', 600, 1000, NULL, '2026-04-28 01:47:32'),
(10, 'Marketing Specialist', 'BrightMedia', 'Run digital campaigns and SEO.', 'Remote', 'Marketing', 'remote', 700, 1500, NULL, '2026-04-28 01:47:32'),
(11, 'Electrician', 'BuildRight', 'Install and maintain electrical systems.', 'Pristina', 'Construction', 'full-time', 700, 1300, NULL, '2026-04-28 01:47:32'),
(12, 'Photographer', 'Studio Lume', 'Wedding and event photography.', 'Tirana', 'Media', 'contract', 500, 1500, NULL, '2026-04-28 01:47:32'),
(13, 'Director', 'Gray Media Group', 'Gray Media Group is a multimedia company headquartered in Atlanta, Georgia. The Director will oversee media production operations, coordinate creative teams, manage project timelines, and ensure high-quality content delivery across digital and broadcast platforms.', 'Atlanta, Georgia', 'Entertainment, Media and Motion Picture', 'part-time', 80000, 120000, 10, '2026-05-26 02:21:22'),
(16, 'ffffffff', 'gggggggggg', 'hhhhhhhhhhh', 'iiiiiiii', 'jjjjjj', 'full-time', 2147483647, 2147483647, 10, '2026-05-26 08:57:54');

-- --------------------------------------------------------

--
-- Table structure for table `job_skills`
--

CREATE TABLE `job_skills` (
  `job_id` int(11) NOT NULL,
  `skill_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_skills`
--

INSERT INTO `job_skills` (`job_id`, `skill_id`) VALUES
(1, 1),
(1, 2),
(1, 8),
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(3, 6),
(3, 7),
(3, 8),
(4, 8),
(4, 14),
(4, 15),
(4, 18),
(5, 8),
(5, 16),
(5, 17),
(6, 8),
(6, 10),
(6, 11),
(7, 8),
(7, 22),
(8, 8),
(8, 23),
(9, 8),
(9, 12),
(9, 13),
(10, 8),
(10, 17),
(10, 19),
(10, 20),
(11, 8),
(11, 25),
(12, 6),
(12, 8),
(12, 21),
(16, 29);

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `skills`
--

INSERT INTO `skills` (`id`, `name`) VALUES
(12, 'Accounting'),
(8, 'Communication'),
(22, 'Cooking'),
(10, 'Customer Service'),
(23, 'Driving'),
(25, 'Electrical Wiring'),
(17, 'English'),
(13, 'Excel'),
(29, 'fffffff'),
(7, 'Figma'),
(15, 'First Aid'),
(30, 'funny'),
(18, 'German'),
(1, 'JavaScript'),
(19, 'Marketing'),
(3, 'Node.js'),
(14, 'Patient Care'),
(21, 'Photography'),
(9, 'Project Management'),
(5, 'Python'),
(27, 'Python Machine Learning Deep Learning TensorFlow PyTorch Data Analysis Docker AWS System Design Recommendation Systems'),
(2, 'React'),
(28, 'rkmfk;ernw'),
(11, 'Sales'),
(20, 'SEO'),
(4, 'SQL'),
(16, 'Teaching'),
(6, 'UI Design'),
(26, 'video'),
(24, 'Welding');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(180) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `location` varchar(120) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `location`, `bio`, `created_at`) VALUES
(1, 'Admin', 'admin@skillpath.com', '$2b$10$ippKQ5Dq.gRexkOkU4zDpuGP8DJwuJ1ZJEHkxxQCL.h40mLW133cu', 'admin', 'Pristina', 'Platform admin', '2026-04-28 01:50:13'),
(2, 'Anna Smith', 'anna@example.com', '$2b$10$HCRPlRXL.uIgpY5AQSPaDe9fKdpY3mbH59bjeR2az0OB82sooXO7y', 'user', 'Pristina', 'Designer with 3 years of experience.', '2026-04-28 01:50:13'),
(3, 'Ben Doe', 'ben@example.com', '$2b$10$HCRPlRXL.uIgpY5AQSPaDe9fKdpY3mbH59bjeR2az0OB82sooXO7y', 'user', 'Tirana', 'Full-stack developer.', '2026-04-28 01:50:13'),
(4, 'Clara Rossi', 'clara@example.com', '$2b$10$HCRPlRXL.uIgpY5AQSPaDe9fKdpY3mbH59bjeR2az0OB82sooXO7y', 'user', 'Berlin', 'Nurse looking for new role.', '2026-04-28 01:50:13'),
(5, 'Krahjeta', 'krahjetaj@gmail.com', '$2b$10$5EzoIpzMls2BGmf9ztuvre72hBIDT05GPETzUWNttnms7CeTzo04e', 'user', 'Pristina', NULL, '2026-04-28 01:53:13'),
(6, 'jeta', 'jetaj@gmail.com', '$2b$10$XmjgQVjpO/YkWZzP3Q4w0uMiozqI6rd.mWOo0D2uI1IPwJ4pU81Pm', 'user', 'Pristina', NULL, '2026-05-12 16:05:19'),
(7, 'user', 'user1@gmail.com', '$2b$10$kQnU3nl/iG.UXxHtBZecL.e2Dv.W7Rh.MoIbb3YClTqgcsknWt53e', 'user', NULL, NULL, '2026-05-19 16:07:48'),
(8, 'user2', 'user2@gmail.com', '$2b$10$enehV2nOnESseVjuohKEqOBYPtVZfQVc86JRbtCaC0rr36UzwoFFC', 'user', NULL, NULL, '2026-05-19 16:11:38'),
(9, 'User3', 'user3@gmail.com', '$2b$10$aDkuHBKNRBod9OAW24ps3.Dok7Hm1wykHb7XckImXFNgIr2VICJpC', 'user', NULL, NULL, '2026-05-25 22:35:53'),
(10, 'Keja', 'keja@gmail.com', '$2b$10$mW9oK5xnnGXfsua1UymapuP2lcfmkq9W0G54FHELt5qDum4OdSS3K', 'admin', NULL, NULL, '2026-05-26 02:07:54'),
(11, 'User5', 'User5@gmail.com', '$2b$10$wyzSsBnJA4eowO.Ym7v6JO9CoV92DyUHMhJmoOQAJdXwCuAf7/ZzW', 'user', NULL, NULL, '2026-05-26 17:43:00'),
(12, 'User6', 'user6@gmail.com', '$2b$10$eS2jawoN1q4yB5X2pzr3buoN3zESzy5o9S71AfxuIjIilvuDjVbrO', 'user', NULL, NULL, '2026-05-26 20:23:15'),
(13, 'test', 'test@gmail.com', '$2b$10$/Rz0Am9mus2UVY1RT0J1zOfAfdk39XUO5o.iSjNmEo1cNlipXtHcu', 'user', NULL, NULL, '2026-06-02 15:47:38');

-- --------------------------------------------------------

--
-- Table structure for table `user_job_interactions`
--

CREATE TABLE `user_job_interactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `interaction_type` enum('view','save','apply') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_job_interactions`
--

INSERT INTO `user_job_interactions` (`id`, `user_id`, `job_id`, `interaction_type`, `created_at`) VALUES
(1, 9, 8, 'view', '2026-05-26 15:07:07'),
(3, 8, 10, 'view', '2026-05-26 01:03:41'),
(5, 8, 10, 'apply', '2026-05-26 00:54:00'),
(11, 9, 8, 'save', '2026-05-26 01:38:05'),
(22, 10, 2, 'view', '2026-05-26 02:09:12'),
(24, 10, 13, 'view', '2026-05-26 09:03:56'),
(50, 10, 1, 'view', '2026-05-26 08:54:01'),
(58, 10, 16, 'view', '2026-05-26 15:03:18'),
(82, 13, 7, 'view', '2026-06-06 01:27:34'),
(84, 13, 7, 'save', '2026-06-06 01:27:38'),
(87, 13, 7, 'apply', '2026-06-02 15:49:55'),
(92, 13, 6, 'view', '2026-06-06 01:27:46');

-- --------------------------------------------------------

--
-- Table structure for table `user_skills`
--

CREATE TABLE `user_skills` (
  `user_id` int(11) NOT NULL,
  `skill_id` int(11) NOT NULL,
  `level` enum('beginner','intermediate','advanced','expert') DEFAULT 'intermediate'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_skills`
--

INSERT INTO `user_skills` (`user_id`, `skill_id`, `level`) VALUES
(2, 6, 'advanced'),
(2, 7, 'expert'),
(2, 8, 'advanced'),
(3, 1, 'expert'),
(3, 2, 'advanced'),
(3, 3, 'advanced'),
(3, 4, 'intermediate'),
(4, 8, 'advanced'),
(4, 14, 'expert'),
(4, 15, 'advanced'),
(5, 8, 'intermediate'),
(5, 17, 'expert'),
(5, 22, 'advanced'),
(5, 23, 'advanced'),
(6, 12, 'advanced'),
(6, 17, 'expert'),
(7, 8, 'intermediate'),
(7, 22, 'intermediate'),
(8, 12, 'advanced'),
(8, 17, 'expert'),
(9, 10, 'advanced'),
(9, 21, 'expert'),
(9, 23, 'expert'),
(9, 25, 'intermediate'),
(12, 12, 'intermediate'),
(13, 9, 'advanced'),
(13, 10, 'expert'),
(13, 22, 'expert');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_user_job` (`user_id`,`job_id`),
  ADD KEY `job_id` (`job_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `posted_by` (`posted_by`),
  ADD KEY `idx_industry` (`industry`),
  ADD KEY `idx_location` (`location`);

--
-- Indexes for table `job_skills`
--
ALTER TABLE `job_skills`
  ADD PRIMARY KEY (`job_id`,`skill_id`),
  ADD KEY `skill_id` (`skill_id`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_job_interactions`
--
ALTER TABLE `user_job_interactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_interaction` (`user_id`,`job_id`,`interaction_type`),
  ADD KEY `job_id` (`job_id`);

--
-- Indexes for table `user_skills`
--
ALTER TABLE `user_skills`
  ADD PRIMARY KEY (`user_id`,`skill_id`),
  ADD KEY `skill_id` (`skill_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `user_job_interactions`
--
ALTER TABLE `user_job_interactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `jobs`
--
ALTER TABLE `jobs`
  ADD CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `job_skills`
--
ALTER TABLE `job_skills`
  ADD CONSTRAINT `job_skills_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `job_skills_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_job_interactions`
--
ALTER TABLE `user_job_interactions`
  ADD CONSTRAINT `user_job_interactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_job_interactions_ibfk_2` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_skills`
--
ALTER TABLE `user_skills`
  ADD CONSTRAINT `user_skills_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_skills_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
