-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 01, 2026 at 04:51 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `phpmyadmin`
--
CREATE DATABASE IF NOT EXISTS `phpmyadmin` DEFAULT CHARACTER SET utf8 COLLATE utf8_bin;
USE `phpmyadmin`;

-- --------------------------------------------------------

--
-- Table structure for table `pma__bookmark`
--

CREATE TABLE `pma__bookmark` (
  `id` int(10) UNSIGNED NOT NULL,
  `dbase` varchar(255) NOT NULL DEFAULT '',
  `user` varchar(255) NOT NULL DEFAULT '',
  `label` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `query` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Bookmarks';

-- --------------------------------------------------------

--
-- Table structure for table `pma__central_columns`
--

CREATE TABLE `pma__central_columns` (
  `db_name` varchar(64) NOT NULL,
  `col_name` varchar(64) NOT NULL,
  `col_type` varchar(64) NOT NULL,
  `col_length` text DEFAULT NULL,
  `col_collation` varchar(64) NOT NULL,
  `col_isNull` tinyint(1) NOT NULL,
  `col_extra` varchar(255) DEFAULT '',
  `col_default` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Central list of columns';

-- --------------------------------------------------------

--
-- Table structure for table `pma__column_info`
--

CREATE TABLE `pma__column_info` (
  `id` int(5) UNSIGNED NOT NULL,
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `column_name` varchar(64) NOT NULL DEFAULT '',
  `comment` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `mimetype` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `transformation` varchar(255) NOT NULL DEFAULT '',
  `transformation_options` varchar(255) NOT NULL DEFAULT '',
  `input_transformation` varchar(255) NOT NULL DEFAULT '',
  `input_transformation_options` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Column information for phpMyAdmin';

-- --------------------------------------------------------

--
-- Table structure for table `pma__designer_settings`
--

CREATE TABLE `pma__designer_settings` (
  `username` varchar(64) NOT NULL,
  `settings_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Settings related to Designer';

-- --------------------------------------------------------

--
-- Table structure for table `pma__export_templates`
--

CREATE TABLE `pma__export_templates` (
  `id` int(5) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL,
  `export_type` varchar(10) NOT NULL,
  `template_name` varchar(64) NOT NULL,
  `template_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Saved export templates';

-- --------------------------------------------------------

--
-- Table structure for table `pma__favorite`
--

CREATE TABLE `pma__favorite` (
  `username` varchar(64) NOT NULL,
  `tables` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Favorite tables';

-- --------------------------------------------------------

--
-- Table structure for table `pma__history`
--

CREATE TABLE `pma__history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL DEFAULT '',
  `db` varchar(64) NOT NULL DEFAULT '',
  `table` varchar(64) NOT NULL DEFAULT '',
  `timevalue` timestamp NOT NULL DEFAULT current_timestamp(),
  `sqlquery` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='SQL history for phpMyAdmin';

-- --------------------------------------------------------

--
-- Table structure for table `pma__navigationhiding`
--

CREATE TABLE `pma__navigationhiding` (
  `username` varchar(64) NOT NULL,
  `item_name` varchar(64) NOT NULL,
  `item_type` varchar(64) NOT NULL,
  `db_name` varchar(64) NOT NULL,
  `table_name` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Hidden items of navigation tree';

-- --------------------------------------------------------

--
-- Table structure for table `pma__pdf_pages`
--

CREATE TABLE `pma__pdf_pages` (
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `page_nr` int(10) UNSIGNED NOT NULL,
  `page_descr` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='PDF relation pages for phpMyAdmin';

-- --------------------------------------------------------

--
-- Table structure for table `pma__recent`
--

CREATE TABLE `pma__recent` (
  `username` varchar(64) NOT NULL,
  `tables` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Recently accessed tables';

--
-- Dumping data for table `pma__recent`
--

INSERT INTO `pma__recent` (`username`, `tables`) VALUES
('root', '[{\"db\":\"project\",\"table\":\"borrowrequests\"},{\"db\":\"project\",\"table\":\"request_groups\"},{\"db\":\"project\",\"table\":\"categories\"},{\"db\":\"project\",\"table\":\"notifications\"},{\"db\":\"project\",\"table\":\"users\"},{\"db\":\"project\",\"table\":\"items\"}]');

-- --------------------------------------------------------

--
-- Table structure for table `pma__relation`
--

CREATE TABLE `pma__relation` (
  `master_db` varchar(64) NOT NULL DEFAULT '',
  `master_table` varchar(64) NOT NULL DEFAULT '',
  `master_field` varchar(64) NOT NULL DEFAULT '',
  `foreign_db` varchar(64) NOT NULL DEFAULT '',
  `foreign_table` varchar(64) NOT NULL DEFAULT '',
  `foreign_field` varchar(64) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Relation table';

-- --------------------------------------------------------

--
-- Table structure for table `pma__savedsearches`
--

CREATE TABLE `pma__savedsearches` (
  `id` int(5) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL DEFAULT '',
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `search_name` varchar(64) NOT NULL DEFAULT '',
  `search_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Saved searches';

-- --------------------------------------------------------

--
-- Table structure for table `pma__table_coords`
--

CREATE TABLE `pma__table_coords` (
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `pdf_page_number` int(11) NOT NULL DEFAULT 0,
  `x` float UNSIGNED NOT NULL DEFAULT 0,
  `y` float UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Table coordinates for phpMyAdmin PDF output';

-- --------------------------------------------------------

--
-- Table structure for table `pma__table_info`
--

CREATE TABLE `pma__table_info` (
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `display_field` varchar(64) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Table information for phpMyAdmin';

-- --------------------------------------------------------

--
-- Table structure for table `pma__table_uiprefs`
--

CREATE TABLE `pma__table_uiprefs` (
  `username` varchar(64) NOT NULL,
  `db_name` varchar(64) NOT NULL,
  `table_name` varchar(64) NOT NULL,
  `prefs` text NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Tables'' UI preferences';

-- --------------------------------------------------------

--
-- Table structure for table `pma__tracking`
--

CREATE TABLE `pma__tracking` (
  `db_name` varchar(64) NOT NULL,
  `table_name` varchar(64) NOT NULL,
  `version` int(10) UNSIGNED NOT NULL,
  `date_created` datetime NOT NULL,
  `date_updated` datetime NOT NULL,
  `schema_snapshot` text NOT NULL,
  `schema_sql` text DEFAULT NULL,
  `data_sql` longtext DEFAULT NULL,
  `tracking` set('UPDATE','REPLACE','INSERT','DELETE','TRUNCATE','CREATE DATABASE','ALTER DATABASE','DROP DATABASE','CREATE TABLE','ALTER TABLE','RENAME TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE VIEW','ALTER VIEW','DROP VIEW') DEFAULT NULL,
  `tracking_active` int(1) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Database changes tracking for phpMyAdmin';

-- --------------------------------------------------------

--
-- Table structure for table `pma__userconfig`
--

CREATE TABLE `pma__userconfig` (
  `username` varchar(64) NOT NULL,
  `timevalue` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `config_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='User preferences storage for phpMyAdmin';

--
-- Dumping data for table `pma__userconfig`
--

INSERT INTO `pma__userconfig` (`username`, `timevalue`, `config_data`) VALUES
('root', '2026-03-01 15:50:14', '{\"Console\\/Mode\":\"collapse\",\"NavigationWidth\":0}');

-- --------------------------------------------------------

--
-- Table structure for table `pma__usergroups`
--

CREATE TABLE `pma__usergroups` (
  `usergroup` varchar(64) NOT NULL,
  `tab` varchar(64) NOT NULL,
  `allowed` enum('Y','N') NOT NULL DEFAULT 'N'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='User groups with configured menu items';

-- --------------------------------------------------------

--
-- Table structure for table `pma__users`
--

CREATE TABLE `pma__users` (
  `username` varchar(64) NOT NULL,
  `usergroup` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Users and their assignments to user groups';

--
-- Indexes for dumped tables
--

--
-- Indexes for table `pma__bookmark`
--
ALTER TABLE `pma__bookmark`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pma__central_columns`
--
ALTER TABLE `pma__central_columns`
  ADD PRIMARY KEY (`db_name`,`col_name`);

--
-- Indexes for table `pma__column_info`
--
ALTER TABLE `pma__column_info`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `db_name` (`db_name`,`table_name`,`column_name`);

--
-- Indexes for table `pma__designer_settings`
--
ALTER TABLE `pma__designer_settings`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `pma__export_templates`
--
ALTER TABLE `pma__export_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `u_user_type_template` (`username`,`export_type`,`template_name`);

--
-- Indexes for table `pma__favorite`
--
ALTER TABLE `pma__favorite`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `pma__history`
--
ALTER TABLE `pma__history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `username` (`username`,`db`,`table`,`timevalue`);

--
-- Indexes for table `pma__navigationhiding`
--
ALTER TABLE `pma__navigationhiding`
  ADD PRIMARY KEY (`username`,`item_name`,`item_type`,`db_name`,`table_name`);

--
-- Indexes for table `pma__pdf_pages`
--
ALTER TABLE `pma__pdf_pages`
  ADD PRIMARY KEY (`page_nr`),
  ADD KEY `db_name` (`db_name`);

--
-- Indexes for table `pma__recent`
--
ALTER TABLE `pma__recent`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `pma__relation`
--
ALTER TABLE `pma__relation`
  ADD PRIMARY KEY (`master_db`,`master_table`,`master_field`),
  ADD KEY `foreign_field` (`foreign_db`,`foreign_table`);

--
-- Indexes for table `pma__savedsearches`
--
ALTER TABLE `pma__savedsearches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `u_savedsearches_username_dbname` (`username`,`db_name`,`search_name`);

--
-- Indexes for table `pma__table_coords`
--
ALTER TABLE `pma__table_coords`
  ADD PRIMARY KEY (`db_name`,`table_name`,`pdf_page_number`);

--
-- Indexes for table `pma__table_info`
--
ALTER TABLE `pma__table_info`
  ADD PRIMARY KEY (`db_name`,`table_name`);

--
-- Indexes for table `pma__table_uiprefs`
--
ALTER TABLE `pma__table_uiprefs`
  ADD PRIMARY KEY (`username`,`db_name`,`table_name`);

--
-- Indexes for table `pma__tracking`
--
ALTER TABLE `pma__tracking`
  ADD PRIMARY KEY (`db_name`,`table_name`,`version`);

--
-- Indexes for table `pma__userconfig`
--
ALTER TABLE `pma__userconfig`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `pma__usergroups`
--
ALTER TABLE `pma__usergroups`
  ADD PRIMARY KEY (`usergroup`,`tab`,`allowed`);

--
-- Indexes for table `pma__users`
--
ALTER TABLE `pma__users`
  ADD PRIMARY KEY (`username`,`usergroup`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `pma__bookmark`
--
ALTER TABLE `pma__bookmark`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pma__column_info`
--
ALTER TABLE `pma__column_info`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pma__export_templates`
--
ALTER TABLE `pma__export_templates`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pma__history`
--
ALTER TABLE `pma__history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pma__pdf_pages`
--
ALTER TABLE `pma__pdf_pages`
  MODIFY `page_nr` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pma__savedsearches`
--
ALTER TABLE `pma__savedsearches`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- Database: `project`
--
CREATE DATABASE IF NOT EXISTS `project` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `project`;

-- --------------------------------------------------------

--
-- Table structure for table `borrowrequests`
--

CREATE TABLE `borrowrequests` (
  `request_id` int(11) NOT NULL,
  `borrower_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `requested_start` datetime NOT NULL,
  `requested_end` datetime NOT NULL,
  `reason` text NOT NULL,
  `status` enum('Pending','Approved','Rejected','CheckedOut','Returned','Overdue','Cancelled') DEFAULT 'Pending',
  `rejectionReason` text DEFAULT NULL,
  `checked_out_at` datetime DEFAULT NULL,
  `returned_at` datetime DEFAULT NULL,
  `request_group_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `borrowrequests`
--

INSERT INTO `borrowrequests` (`request_id`, `borrower_id`, `item_id`, `requested_start`, `requested_end`, `reason`, `status`, `rejectionReason`, `checked_out_at`, `returned_at`, `request_group_id`) VALUES
(1, 3, 3, '2026-02-10 17:45:00', '2026-02-12 17:45:00', 'test', 'Approved', NULL, NULL, NULL, NULL),
(2, 1, 3, '2026-02-06 17:46:00', '2026-02-09 17:46:00', 'test', 'Rejected', 'test', NULL, NULL, NULL),
(3, 1, 4, '2026-02-11 08:15:00', '2026-02-13 09:15:00', 'test', 'Pending', 'test', NULL, NULL, NULL),
(4, 1, 4, '2026-02-12 12:00:00', '2026-02-14 12:00:00', 'for test preparation', 'Rejected', 'not available', NULL, NULL, 1),
(5, 1, 3, '2026-02-18 13:00:00', '2026-02-19 14:00:00', 'for test preparation', 'Pending', NULL, '2026-02-12 18:10:39', '2026-02-12 18:10:55', 1),
(6, 1, 5, '2026-02-18 18:08:00', '2026-02-27 18:08:00', 'for test', 'Overdue', NULL, '2026-02-27 15:12:58', '2026-02-27 15:13:01', 2),
(7, 1, 3, '2026-02-25 18:08:00', '2026-02-26 18:08:00', 'for test', 'Rejected', 'test', NULL, NULL, 3),
(8, 1, 4, '2026-02-22 08:30:00', '2026-02-23 09:30:00', 'test', 'Overdue', NULL, '2026-02-26 17:32:17', NULL, 4),
(9, 1, 5, '2026-02-13 14:18:00', '2026-02-14 14:18:00', 'test', 'Returned', NULL, '2026-02-13 14:20:09', '2026-02-13 14:20:12', 5),
(10, 1, 3, '2026-02-15 14:18:00', '2026-02-16 14:18:00', 'test', 'Rejected', 'not available', NULL, NULL, 5),
(11, 1, 4, '2026-03-02 15:20:00', '2026-03-04 15:20:00', 'test', 'Rejected', 'test', NULL, NULL, 6),
(12, 1, 3, '2026-03-10 15:20:00', '2026-03-17 15:21:00', 'test', 'Returned', NULL, '2026-02-13 15:25:25', '2026-02-13 15:25:32', 6),
(13, 1, 5, '2026-03-05 15:15:00', '2026-03-06 18:15:00', 'for lab', 'Returned', NULL, '2026-02-26 13:13:27', '2026-02-27 15:12:55', 9),
(14, 1, 5, '2026-03-13 13:49:00', '2026-03-14 13:49:00', 'test', '', NULL, NULL, NULL, 10),
(15, 1, 3, '2026-03-04 17:00:00', '2026-03-06 17:00:00', 'assignment work', '', NULL, NULL, NULL, 11),
(16, 1, 14, '2026-02-27 08:00:00', '2026-02-28 11:00:00', 'for home work', 'Pending', NULL, NULL, NULL, 12),
(17, 1, 4, '2026-02-27 08:00:00', '2026-03-02 09:00:00', 'for home work', 'Returned', NULL, '2026-02-27 14:07:29', '2026-02-27 14:07:36', 12),
(18, 1, 17, '2026-02-27 14:12:00', '2026-02-28 14:12:00', 'for homework', 'Rejected', NULL, NULL, NULL, 13),
(19, 1, 16, '2026-03-01 14:12:00', '2026-03-02 14:12:00', 'for homework', 'Cancelled', NULL, NULL, NULL, 13),
(20, 1, 12, '2026-02-27 16:15:00', '2026-03-03 16:15:00', 'for the project', 'Pending', NULL, NULL, NULL, 14),
(21, 1, 4, '2026-03-03 16:00:00', '2026-03-05 09:00:00', 'for my class work', 'Rejected', NULL, NULL, NULL, 15),
(22, 1, 3, '2026-02-27 16:30:00', '2026-03-02 16:30:00', 'for class work', 'Approved', NULL, NULL, NULL, 18),
(23, 1, 5, '2026-03-03 13:30:00', '2026-03-06 17:30:00', 'for assignment', 'Approved', NULL, NULL, NULL, 19);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `name`, `description`) VALUES
(1, 'Digital Cameras', 'DLSR'),
(2, 'Computer', 'Laptops'),
(3, 'Camera Cart', 'Camera Cart'),
(4, 'Bulk Items', 'HDMI Cables');

-- --------------------------------------------------------

--
-- Table structure for table `conditionimages`
--

CREATE TABLE `conditionimages` (
  `image_id` int(11) NOT NULL,
  `borrow_request_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `image_type` enum('Before','After') NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `faculties`
--

CREATE TABLE `faculties` (
  `faculty_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faculties`
--

INSERT INTO `faculties` (`faculty_id`, `name`, `description`) VALUES
(1, 'Film', 'Faculty of Film');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `item_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `faculty_id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`item_id`, `name`, `description`, `image_url`, `faculty_id`, `owner_id`, `serial_number`, `category_id`) VALUES
(3, 'Asus Laptop', 'Laptop', '/uploads/1770334752097-OIP.jpeg', 1, 3, '12345689', 2),
(4, 'Nikon DLSR Camera', 'DLSR Camera', '/uploads/1770414894433-nikon_d500_dslr_camera.jpg', 1, 3, '125689436', 1),
(5, 'Camera', 'Test ', '/uploads/1770415661969-Canon-EOS-2000D.jpg', 1, 3, '1234567665', 1),
(7, 'Tripod Stand', 'Tripod Stand for Camera', '/uploads/1772165480538-0929c9074cd1f857034b9efe.jpg', 1, 5, '12345678', 1),
(8, 'Mini Tripods', 'mini Tripod', '/uploads/1772165545625-e3a466414e26317abf8d929a.jpg', 1, 5, NULL, 1),
(9, 'Tripod Camera', 'Tripod Camera', '/uploads/1772165634223-ea2e70e223937a6d017f4649.jpg', 1, 5, NULL, 1),
(10, 'Canon Lens', 'Macro Lens', '/uploads/1772166776698-d00ba8345b0423c933e66617.jpeg', 1, 5, NULL, 1),
(11, 'Canon DSLR', 'DSLR', '/uploads/1772166923495-58753a83f1f4327087be0ebe.webp', 1, 5, NULL, 1),
(12, 'Nikon D850 Camera', 'Camera', '/uploads/1772167033848-ee579a289cbe9662dc686b7f.jpg', 1, 5, NULL, 1),
(13, 'Film Strip', 'Strip using for filming', '/uploads/1772167335373-0344fc5fd1eadcaad85149b0.jpeg', 1, 5, NULL, 4),
(14, 'HDMI Cable', 'HDMI to HDMI cable', '/uploads/1772167392918-06502e71396e29d6669bd9cc.jpg', 1, 5, NULL, 4),
(15, 'HDMI to DP Cable', 'HDMI to Display Port Cable', '/uploads/1772167498514-4d8124b064eef9a4f3c29854.webp', 1, 5, NULL, 4),
(16, 'HDMI to VGA Cable', 'HDMI to VGA Cable', '/uploads/1772167569197-eaa961d5ac3b475f8aaa7fb9.jpg', 1, 5, NULL, 4),
(17, 'Film Board', 'Film Board', '/uploads/1772167828714-4c66e7469760313aec912660.jpg', 1, 3, NULL, 4),
(18, 'Ring-Light', 'Ring Light', '/uploads/1772168011734-c31c70a19766a9f4d7c4e067.webp', 1, 3, NULL, 4);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(120) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','danger') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 3, 'New borrow request', 'John John requested \"Asus Laptop\".', 'warning', 1, '2026-02-05 17:45:50'),
(2, 3, 'Request approved', 'Your request for \"Asus Laptop\" was approved.', 'success', 1, '2026-02-05 17:46:27'),
(3, 3, 'New borrow request', 'Jay Patel requested \"Asus Laptop\".', 'warning', 1, '2026-02-05 17:47:19'),
(4, 1, 'Request rejected', 'Your request for \"Asus Laptop\" was rejected. Note: test', 'danger', 1, '2026-02-05 17:48:21'),
(5, 3, 'New borrow request', 'Jay Patel requested \"Nikon DLSR Camera\".', 'warning', 1, '2026-02-06 16:10:06'),
(6, 1, 'Request rejected', 'Your request for \"Nikon DLSR Camera\" was rejected. Note: test', 'danger', 1, '2026-02-06 16:11:25'),
(7, 3, 'New cart request', 'Jay Patel requested 2 item(s): Nikon DLSR Camera, Asus Laptop', 'warning', 1, '2026-02-12 11:59:55'),
(8, 1, 'Request rejected', 'Your request for \"Nikon DLSR Camera\" was rejected. Note: not available', 'danger', 1, '2026-02-12 12:02:18'),
(9, 1, 'Request approved', 'Your request for \"Asus Laptop\" was approved.', 'success', 1, '2026-02-12 12:02:21'),
(10, 3, 'New cart request', 'Jay Patel requested 1 item(s): Camera', 'warning', 1, '2026-02-12 18:08:55'),
(11, 3, 'New cart request', 'Jay Patel requested 1 item(s): Asus Laptop', 'warning', 1, '2026-02-12 18:09:25'),
(12, 1, 'Item checked out', 'Your booking for \"Asus Laptop\" has been checked out.', 'info', 1, '2026-02-12 18:10:39'),
(13, 1, 'Item returned', 'Your booking for \"Asus Laptop\" has been marked returned.', 'success', 1, '2026-02-12 18:10:55'),
(14, 1, 'Request approved', 'Your request for \"Camera\" was approved.', 'success', 1, '2026-02-12 18:11:06'),
(15, 1, 'Request rejected', 'Your request for \"Asus Laptop\" was rejected. Note: test', 'danger', 1, '2026-02-12 18:11:26'),
(16, 3, 'New cart request', 'Jay Patel requested 1 item(s): Nikon DLSR Camera', 'warning', 1, '2026-02-12 18:22:47'),
(17, 3, 'New cart request', 'Jay Patel requested 2 item(s): Camera, Asus Laptop', 'warning', 1, '2026-02-13 14:18:55'),
(18, 1, 'Request rejected', 'Your request for \"Asus Laptop\" was rejected. Note: not available', 'danger', 1, '2026-02-13 14:19:58'),
(19, 1, 'Request approved', 'Your request for \"Camera\" was approved.', 'success', 1, '2026-02-13 14:20:00'),
(20, 1, 'Item checked out', 'Your booking for \"Camera\" has been checked out.', 'info', 1, '2026-02-13 14:20:09'),
(21, 1, 'Item returned', 'Your booking for \"Camera\" has been marked returned.', 'success', 1, '2026-02-13 14:20:12'),
(22, 3, 'New cart request', 'Jay Patel requested 2 item(s): Nikon DLSR Camera, Asus Laptop', 'warning', 1, '2026-02-13 15:23:05'),
(23, 1, 'Request rejected', 'Your request for \"Nikon DLSR Camera\" was rejected. Note: test', 'danger', 1, '2026-02-13 15:24:40'),
(24, 1, 'Request approved', 'Your request for \"Asus Laptop\" was approved.', 'success', 1, '2026-02-13 15:24:56'),
(25, 1, 'Item checked out', 'Your booking for \"Asus Laptop\" has been checked out.', 'info', 1, '2026-02-13 15:25:25'),
(26, 1, 'Item returned', 'Your booking for \"Asus Laptop\" has been marked returned.', 'success', 1, '2026-02-13 15:25:32'),
(27, 1, 'Request approved', 'Your request for \"Nikon DLSR Camera\" was approved.', 'success', 1, '2026-02-24 10:38:32'),
(28, 3, 'New basket request', 'Jay Patel requested 1 item(s): Camera', 'warning', 1, '2026-02-26 13:11:14'),
(29, 1, 'Request approved', 'Your request for \"Camera\" was approved.', 'success', 1, '2026-02-26 13:13:07'),
(30, 1, 'Item checked out', 'Your booking for \"Camera\" has been checked out.', 'info', 1, '2026-02-26 13:13:27'),
(31, 3, 'New basket request', 'Jay Patel requested 1 item(s): Camera', 'warning', 1, '2026-02-26 13:49:19'),
(32, 3, 'Request cancelled', 'A student cancelled their request for \"Camera\".', '', 1, '2026-02-26 13:58:59'),
(33, 1, 'Request cancelled', 'You cancelled your request for \"Camera\".', '', 1, '2026-02-26 13:58:59'),
(34, 3, 'New basket request', 'Jay Patel requested 1 item(s): Asus Laptop', '', 1, '2026-02-26 15:42:27'),
(35, 3, 'Request cancelled', 'A student cancelled their request for \"Asus Laptop\".', '', 1, '2026-02-26 15:42:32'),
(36, 1, 'Request cancelled', 'You cancelled your request for \"Asus Laptop\".', '', 1, '2026-02-26 15:42:32'),
(37, 1, 'Item checked out', 'Your booking for \"Nikon DLSR Camera\" has been checked out.', '', 1, '2026-02-26 17:32:17'),
(38, 5, 'New basket request', 'Jay Patel requested 1 item(s): HDMI Cable', '', 1, '2026-02-26 22:55:37'),
(39, 3, 'New basket request', 'Jay Patel requested 1 item(s): Nikon DLSR Camera', '', 1, '2026-02-26 22:55:37'),
(40, 1, 'Request approved', 'Your request for \"Nikon DLSR Camera\" was approved.', '', 1, '2026-02-27 06:51:46'),
(41, 1, 'Item checked out', 'Your booking for \"Nikon DLSR Camera\" has been checked out.', '', 1, '2026-02-27 14:07:29'),
(42, 1, 'Item returned', 'Your booking for \"Nikon DLSR Camera\" has been marked returned.', '', 1, '2026-02-27 14:07:36'),
(43, 3, 'New basket request', 'Jay Patel requested 1 item(s): Film Board', '', 1, '2026-02-27 14:12:39'),
(44, 5, 'New basket request', 'Jay Patel requested 1 item(s): HDMI to VGA Cable', '', 0, '2026-02-27 14:12:39'),
(45, 1, 'Request rejected', 'Your request for \"Film Board\" was rejected.', '', 1, '2026-02-27 15:10:47'),
(46, 1, 'Item returned', 'Your booking for \"Camera\" has been marked returned.', '', 1, '2026-02-27 15:12:55'),
(47, 1, 'Item checked out', 'Your booking for \"Camera\" has been checked out.', '', 1, '2026-02-27 15:12:58'),
(48, 1, 'Item returned', 'Your booking for \"Camera\" has been marked returned.', '', 1, '2026-02-27 15:13:01'),
(49, 5, 'New basket request', 'Jay Patel requested 1 item(s): Nikon D850 Camera', '', 0, '2026-02-27 15:16:33'),
(50, 3, 'New basket request', 'Jay Patel requested 1 item(s): Nikon DLSR Camera', '', 1, '2026-02-27 15:17:56'),
(51, 5, 'Request cancelled', 'A student cancelled their request for \"HDMI to VGA Cable\".', '', 0, '2026-02-27 15:18:59'),
(52, 1, 'Request cancelled', 'You cancelled your request for \"HDMI to VGA Cable\".', '', 1, '2026-02-27 15:18:59'),
(53, 1, 'Request rejected', 'Your request for \"Nikon DLSR Camera\" was rejected.', '', 1, '2026-02-27 15:21:01'),
(54, 3, 'New basket request', 'Jay Patel requested 1 item(s): Asus Laptop', '', 1, '2026-02-27 15:22:35'),
(55, 1, 'Request approved', 'Your request for \"Asus Laptop\" was approved.', '', 1, '2026-02-27 15:24:22'),
(56, 3, 'New basket request', 'Jay Patel requested 1 item(s): Camera', '', 1, '2026-02-27 15:25:31'),
(57, 1, 'Request approved', 'Your request for \"Camera\" was approved.', '', 1, '2026-02-27 15:53:15');

-- --------------------------------------------------------

--
-- Table structure for table `request_groups`
--

CREATE TABLE `request_groups` (
  `group_id` int(11) NOT NULL,
  `borrower_id` int(11) NOT NULL,
  `requested_start` datetime DEFAULT NULL,
  `requested_end` datetime DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `request_groups`
--

INSERT INTO `request_groups` (`group_id`, `borrower_id`, `requested_start`, `requested_end`, `reason`, `created_at`) VALUES
(1, 1, NULL, NULL, 'for test preparation', '2026-02-12 11:59:55'),
(2, 1, NULL, NULL, 'for test', '2026-02-12 18:08:55'),
(3, 1, NULL, NULL, 'for test', '2026-02-12 18:09:25'),
(4, 1, NULL, NULL, 'test', '2026-02-12 18:22:47'),
(5, 1, NULL, NULL, 'test', '2026-02-13 14:18:55'),
(6, 1, NULL, NULL, 'test', '2026-02-13 15:23:04'),
(7, 1, NULL, NULL, 'i need fo my class asssignment.', '2026-02-26 13:09:33'),
(8, 1, NULL, NULL, 'for home work', '2026-02-26 13:10:33'),
(9, 1, NULL, NULL, 'for lab', '2026-02-26 13:11:14'),
(10, 1, NULL, NULL, 'test', '2026-02-26 13:49:19'),
(11, 1, NULL, NULL, 'assignment work', '2026-02-26 15:42:27'),
(12, 1, NULL, NULL, 'for home work', '2026-02-26 22:55:37'),
(13, 1, NULL, NULL, 'for homework', '2026-02-27 14:12:39'),
(14, 1, NULL, NULL, 'for the project', '2026-02-27 15:16:33'),
(15, 1, NULL, NULL, 'for my class work', '2026-02-27 15:17:56'),
(16, 1, NULL, NULL, 'for my class work', '2026-02-27 15:18:10'),
(17, 1, NULL, NULL, 'for my class work', '2026-02-27 15:18:23'),
(18, 1, NULL, NULL, 'for class work', '2026-02-27 15:22:35'),
(19, 1, NULL, NULL, 'for assignment', '2026-02-27 15:25:31');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `user_type` enum('Student','Faculty','Admin') NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `email`, `password`, `user_type`, `username`, `first_name`, `last_name`, `student_id`) VALUES
(1, 'abc@gmail.com', '$2b$10$7DEMnTCFZoDQkfqcpEiN5ew.3Xg7RGWBNP9h05CTq2Wi4ITubvECa', 'Student', 'jay01', 'Jay', 'Patel', 12345678),
(2, 'faculty@gmail.com', '$2b$10$ziKAYd0znCTnw31xFw1YEuFXegLK326a4BlbbFdPNZyh522IGaywu', 'Student', 'joe01', 'joe', 'joe', 569876115),
(3, 'john@gmail.com', '$2b$10$HnGnb4HjMKvYjbx1pxl3YOEtwoDEze6dzWIO6sjkkFT4342q3Ctau', 'Faculty', 'john01', 'John', 'John', 156897545),
(4, 'admin@gmail.com', '$2b$10$qru7buoXIObgSbgUYgPKTeeOLnrfB.bIpQNR87qMyp5MQrLPWfjDu', 'Admin', 'admin01', 'Isaac', 'Kydd', 234567891),
(5, 'jeet@gmail.com', '$2b$10$JPc1MMoylWxFpDHMeb4j2Oa/otx6Y68gTOPlPmY5DOvQ5/LZpPDxS', 'Faculty', 'jeet01', 'Jeet', 'Patel', 168923665);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `borrowrequests`
--
ALTER TABLE `borrowrequests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `borrower_id` (`borrower_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `idx_borrowrequests_status_end` (`status`,`requested_end`),
  ADD KEY `idx_borrowrequests_group` (`request_group_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `conditionimages`
--
ALTER TABLE `conditionimages`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `borrow_request_id` (`borrow_request_id`);

--
-- Indexes for table `faculties`
--
ALTER TABLE `faculties`
  ADD PRIMARY KEY (`faculty_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `faculty_id` (`faculty_id`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `is_read` (`is_read`),
  ADD KEY `created_at` (`created_at`);

--
-- Indexes for table `request_groups`
--
ALTER TABLE `request_groups`
  ADD PRIMARY KEY (`group_id`),
  ADD KEY `borrower_id` (`borrower_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `borrowrequests`
--
ALTER TABLE `borrowrequests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `conditionimages`
--
ALTER TABLE `conditionimages`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `faculties`
--
ALTER TABLE `faculties`
  MODIFY `faculty_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `request_groups`
--
ALTER TABLE `request_groups`
  MODIFY `group_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `borrowrequests`
--
ALTER TABLE `borrowrequests`
  ADD CONSTRAINT `borrowrequests_ibfk_1` FOREIGN KEY (`borrower_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `borrowrequests_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`),
  ADD CONSTRAINT `fk_borrowrequests_group` FOREIGN KEY (`request_group_id`) REFERENCES `request_groups` (`group_id`) ON DELETE SET NULL;

--
-- Constraints for table `conditionimages`
--
ALTER TABLE `conditionimages`
  ADD CONSTRAINT `conditionimages_ibfk_1` FOREIGN KEY (`borrow_request_id`) REFERENCES `borrowrequests` (`request_id`);

--
-- Constraints for table `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `fk_items_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`),
  ADD CONSTRAINT `items_ibfk_1` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`faculty_id`),
  ADD CONSTRAINT `items_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `items_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `request_groups`
--
ALTER TABLE `request_groups`
  ADD CONSTRAINT `request_groups_ibfk_1` FOREIGN KEY (`borrower_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
--
-- Database: `test`
--
CREATE DATABASE IF NOT EXISTS `test` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `test`;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

