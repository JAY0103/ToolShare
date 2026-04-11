/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: project
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `borrowrequests`
--

DROP TABLE IF EXISTS `borrowrequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `borrowrequests` (
  `request_id` int(11) NOT NULL AUTO_INCREMENT,
  `borrower_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `requested_start` datetime NOT NULL,
  `requested_end` datetime NOT NULL,
  `reason` text NOT NULL,
  `status` enum('Pending','Approved','Rejected','CheckedOut','Returned','Overdue','Cancelled') DEFAULT 'Pending',
  `rejectionReason` text DEFAULT NULL,
  `checked_out_at` datetime DEFAULT NULL,
  `returned_at` datetime DEFAULT NULL,
  `request_group_id` int(11) DEFAULT NULL,
  `handledByUserID` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  KEY `borrower_id` (`borrower_id`),
  KEY `item_id` (`item_id`),
  KEY `idx_borrowrequests_status_end` (`status`,`requested_end`),
  KEY `idx_borrowrequests_group` (`request_group_id`),
  KEY `fk_handledByUser` (`handledByUserID`),
  CONSTRAINT `borrowrequests_ibfk_1` FOREIGN KEY (`borrower_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `borrowrequests_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`),
  CONSTRAINT `fk_borrowrequests_group` FOREIGN KEY (`request_group_id`) REFERENCES `request_groups` (`group_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_handledByUser` FOREIGN KEY (`handledByUserID`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrowrequests`
--

LOCK TABLES `borrowrequests` WRITE;
/*!40000 ALTER TABLE `borrowrequests` DISABLE KEYS */;
INSERT INTO `borrowrequests` VALUES
(1,3,3,'2026-02-10 17:45:00','2026-02-12 17:45:00','test','Approved',NULL,NULL,NULL,NULL,NULL,NULL),
(2,1,3,'2026-02-06 17:46:00','2026-02-09 17:46:00','test','Rejected','test',NULL,NULL,NULL,NULL,NULL),
(3,1,4,'2026-02-11 08:15:00','2026-02-13 09:15:00','test','Pending','test',NULL,NULL,NULL,NULL,NULL),
(4,1,4,'2026-02-12 12:00:00','2026-02-14 12:00:00','for test preparation','Rejected','not available',NULL,NULL,1,NULL,NULL),
(5,1,3,'2026-02-18 13:00:00','2026-02-19 14:00:00','for test preparation','Pending',NULL,'2026-02-12 18:10:39','2026-02-12 18:10:55',1,NULL,NULL),
(6,1,5,'2026-02-18 18:08:00','2026-02-27 18:08:00','for test','Overdue',NULL,'2026-02-27 15:12:58','2026-02-27 15:13:01',2,NULL,NULL),
(7,1,3,'2026-02-25 18:08:00','2026-02-26 18:08:00','for test','Rejected','test',NULL,NULL,3,NULL,NULL),
(8,1,4,'2026-02-22 08:30:00','2026-02-23 09:30:00','test','Overdue',NULL,'2026-02-26 17:32:17',NULL,4,NULL,NULL),
(9,1,5,'2026-02-13 14:18:00','2026-02-14 14:18:00','test','Returned',NULL,'2026-02-13 14:20:09','2026-02-13 14:20:12',5,NULL,NULL),
(10,1,3,'2026-02-15 14:18:00','2026-02-16 14:18:00','test','Rejected','not available',NULL,NULL,5,NULL,NULL),
(11,1,4,'2026-03-02 15:20:00','2026-03-04 15:20:00','test','Rejected','test',NULL,NULL,6,NULL,NULL),
(12,1,3,'2026-03-10 15:20:00','2026-03-17 15:21:00','test','Returned',NULL,'2026-02-13 15:25:25','2026-02-13 15:25:32',6,NULL,NULL),
(13,1,5,'2026-03-05 15:15:00','2026-03-06 18:15:00','for lab','Returned',NULL,'2026-02-26 13:13:27','2026-02-27 15:12:55',9,NULL,NULL),
(14,1,5,'2026-03-13 13:49:00','2026-03-14 13:49:00','test','',NULL,NULL,NULL,10,NULL,NULL),
(15,1,3,'2026-03-04 17:00:00','2026-03-06 17:00:00','assignment work','',NULL,NULL,NULL,11,NULL,NULL),
(16,1,14,'2026-02-27 08:00:00','2026-02-28 11:00:00','for home work','Pending',NULL,NULL,NULL,12,NULL,NULL),
(17,1,4,'2026-02-27 08:00:00','2026-03-02 09:00:00','for home work','Returned',NULL,'2026-02-27 14:07:29','2026-02-27 14:07:36',12,NULL,NULL),
(18,1,17,'2026-02-27 14:12:00','2026-02-28 14:12:00','for homework','Rejected',NULL,NULL,NULL,13,NULL,NULL),
(19,1,16,'2026-03-01 14:12:00','2026-03-02 14:12:00','for homework','Cancelled',NULL,NULL,NULL,13,NULL,NULL),
(20,1,12,'2026-02-27 16:15:00','2026-03-03 16:15:00','for the project','Cancelled',NULL,NULL,NULL,14,NULL,NULL),
(21,1,4,'2026-03-03 16:00:00','2026-03-05 09:00:00','for my class work','Rejected',NULL,NULL,NULL,15,NULL,NULL),
(22,1,3,'2026-02-27 16:30:00','2026-03-02 16:30:00','for class work','Approved',NULL,NULL,NULL,18,NULL,NULL),
(23,1,5,'2026-03-03 13:30:00','2026-03-06 17:30:00','for assignment','Overdue',NULL,'2026-03-13 21:00:50',NULL,19,NULL,NULL),
(24,6,18,'2026-03-03 17:37:00','2026-03-04 17:37:00','For filming a video with good lighting and connecting to my monitor that only uses VGA','Pending',NULL,NULL,NULL,20,NULL,NULL),
(25,6,17,'2026-03-03 17:37:00','2026-03-04 17:37:00','For filming a video with good lighting and connecting to my monitor that only uses VGA','Overdue',NULL,'2026-03-13 21:01:02',NULL,20,NULL,NULL),
(26,6,16,'2026-03-03 17:37:00','2026-03-04 17:37:00','For filming a video with good lighting and connecting to my monitor that only uses VGA','Pending',NULL,NULL,NULL,20,NULL,NULL),
(27,6,18,'2026-03-03 17:37:00','2026-03-04 17:37:00','For filming a video with good lighting and connecting to my monitor that only uses VGA','Cancelled',NULL,NULL,NULL,21,NULL,NULL),
(28,6,17,'2026-03-03 17:37:00','2026-03-04 17:37:00','For filming a video with good lighting and connecting to my monitor that only uses VGA','Cancelled',NULL,NULL,NULL,21,NULL,NULL),
(29,6,16,'2026-03-03 17:37:00','2026-03-04 17:37:00','For filming a video with good lighting and connecting to my monitor that only uses VGA','Cancelled',NULL,NULL,NULL,21,NULL,NULL),
(30,6,18,'2026-03-19 11:15:00','2026-03-20 11:15:00','I need to have good lighting for a film','Returned',NULL,'2026-03-13 17:34:19','2026-03-13 17:34:21',22,NULL,NULL),
(31,6,17,'2026-03-19 11:15:00','2026-03-20 11:15:00','I need to have good lighting for a film','Returned',NULL,'2026-03-13 17:31:50','2026-03-13 17:31:52',22,NULL,NULL),
(32,6,10,'2026-03-17 11:57:00','2026-03-18 11:57:00','Need supplies to film and edit a short film for Film 101','Returned',NULL,'2026-03-13 17:53:56','2026-03-13 17:53:59',23,NULL,NULL),
(33,6,7,'2026-03-17 11:57:00','2026-03-18 11:57:00','Need supplies to film and edit a short film for Film 101','Returned',NULL,'2026-03-13 17:52:55','2026-03-13 17:52:57',23,NULL,NULL),
(34,6,3,'2026-03-17 11:57:00','2026-03-18 11:57:00','Need supplies to film and edit a short film for Film 101','Rejected','rejected due to film students taking priority at the moment',NULL,NULL,23,NULL,NULL),
(35,6,8,'2026-03-11 10:58:00','2026-03-12 10:58:00','Need for tripod competition','Cancelled',NULL,NULL,NULL,24,NULL,NULL),
(36,6,9,'2026-03-10 10:58:00','2026-03-11 10:58:00','Need for tripod competition','Cancelled',NULL,NULL,NULL,24,NULL,NULL),
(37,1,10,'2026-03-17 11:25:00','2026-03-19 11:25:00','for home work','Cancelled',NULL,NULL,NULL,25,NULL,NULL),
(38,1,11,'2026-03-11 11:25:00','2026-03-12 11:25:00','for home work','Cancelled',NULL,NULL,NULL,25,NULL,NULL),
(39,1,18,'2026-03-10 11:41:00','2026-03-20 11:41:00','For my home work','Cancelled',NULL,NULL,NULL,26,NULL,NULL),
(40,6,13,'2026-03-19 21:28:00','2026-03-22 21:28:00','need film strip for doing eperiment on light travelling through film','Cancelled',NULL,NULL,NULL,27,NULL,NULL),
(41,6,11,'2026-03-25 21:43:00','2026-03-27 21:43:00','Need camera to take pictures of squirrels for nature class','Cancelled',NULL,NULL,NULL,28,NULL,NULL),
(42,6,16,'2026-03-30 21:55:00','2026-03-31 21:55:00','Need to connect my laptop to a TV','Returned',NULL,'2026-03-26 21:43:19','2026-03-26 21:43:45',29,NULL,NULL),
(43,6,17,'2026-03-30 21:56:00','2026-03-31 21:56:00','Need to do the \"action\" thing for filming a movie','Cancelled',NULL,NULL,NULL,30,NULL,NULL),
(44,1,18,'2026-03-13 10:00:00','2026-03-16 10:04:00','I need it for creating the blog','Cancelled',NULL,NULL,NULL,31,NULL,NULL),
(45,6,3,'2026-03-30 09:35:00','2026-03-31 09:35:00','I need a laptop to play flash game while I pretend to do homework','Returned',NULL,'2026-03-13 17:29:46','2026-03-13 17:29:49',32,NULL,NULL),
(46,1,12,'2026-03-30 11:06:00','2026-03-31 11:06:00','for taking pictures','Cancelled',NULL,NULL,NULL,33,NULL,NULL),
(47,6,10,'2026-03-30 11:48:00','2026-03-31 11:48:00','Need new lens for my camera','Returned',NULL,'2026-03-13 17:50:16','2026-03-13 17:50:18',34,NULL,NULL),
(48,7,16,'2026-03-30 12:40:00','2026-03-31 12:40:00','Need to connect my computer to a projector','Returned',NULL,'2026-03-13 18:41:17','2026-03-13 18:41:21',35,NULL,NULL),
(49,7,14,'2026-04-01 13:05:00','2026-04-02 13:05:00','Need to connect my laptop to a TV','Rejected','Your need for this item is not high enough priority',NULL,NULL,36,NULL,NULL),
(50,7,16,'2026-04-01 13:09:00','2026-04-02 13:09:00','Need to connect laptop to old monitor that only has VGA','Rejected','Your reason is bad. We need this for real problems.',NULL,NULL,37,NULL,NULL),
(51,7,14,'2026-04-03 13:14:00','2026-04-04 13:14:00','Need an HDMI cable for connecting laptop to monitor','Rejected','Rejected, we are low on HDMI cables and this is not high priority',NULL,NULL,38,NULL,NULL),
(52,7,16,'2026-03-16 13:17:00','2026-03-17 13:17:00','I need cables man','Overdue',NULL,'2026-03-26 21:49:57',NULL,39,NULL,NULL),
(53,7,15,'2026-03-16 13:17:00','2026-03-17 13:17:00','I need cables man','Rejected','Your reason is bad',NULL,NULL,39,NULL,NULL),
(54,8,3,'2026-03-13 15:31:00','2026-03-16 14:31:00','for my class project','Rejected','It is broken',NULL,NULL,40,NULL,NULL),
(55,8,4,'2026-03-25 14:31:00','2026-03-26 14:31:00','for my class project','Returned',NULL,'2026-03-13 21:53:31','2026-03-20 19:57:29',40,NULL,NULL),
(56,8,12,'2026-03-14 14:49:00','2026-03-20 20:08:00','Test','Pending',NULL,NULL,NULL,41,NULL,NULL),
(57,7,8,'2026-04-13 14:51:00','2026-04-14 14:52:00','I want stuff','Cancelled',NULL,NULL,NULL,42,NULL,NULL),
(58,7,10,'2026-04-08 14:52:00','2026-04-10 14:52:00','I want stuff','Rejected','We need this for more imporwtant stuff',NULL,NULL,42,NULL,NULL),
(59,1,15,'2026-03-17 14:56:00','2026-03-19 14:56:00','For class','Rejected','Rejected by Admin',NULL,NULL,43,NULL,NULL),
(60,6,17,'2026-03-10 15:02:00','2026-03-14 15:02:00','making a film','Rejected','you suck',NULL,NULL,44,NULL,NULL),
(61,6,3,'2026-03-10 15:02:00','2026-03-14 15:02:00','making a film','Returned',NULL,'2026-03-13 21:11:31','2026-03-13 21:11:37',44,NULL,NULL),
(62,1,12,'2026-03-18 15:09:00','2026-03-20 15:09:00','For my c','Returned',NULL,'2026-03-26 20:16:10','2026-03-26 20:16:14',45,NULL,NULL),
(63,6,13,'2026-03-13 16:13:00','2026-03-14 15:14:00','i need film','Pending',NULL,NULL,NULL,46,NULL,NULL),
(64,11,19,'2026-03-13 15:23:00','2026-03-13 15:24:00','To walk','Approved',NULL,NULL,NULL,47,NULL,NULL),
(65,6,18,'2026-03-20 16:30:00','2026-03-23 13:00:00','I need these items to make a short film for my film class','Approved',NULL,NULL,NULL,48,NULL,NULL),
(66,6,17,'2026-03-20 16:30:00','2026-03-23 13:00:00','I need these items to make a short film for my film class','Approved',NULL,NULL,NULL,48,NULL,NULL),
(67,6,4,'2026-03-20 13:56:00','2026-03-20 16:00:00','Need Camera equipment for movie','Overdue',NULL,'2026-03-20 19:57:14',NULL,49,NULL,NULL),
(68,6,3,'2026-03-20 13:56:00','2026-03-20 16:00:00','Need Camera equipment for movie','Overdue',NULL,'2026-03-20 19:57:55',NULL,49,NULL,NULL),
(69,6,16,'2026-03-20 13:58:00','2026-03-20 16:00:00','Need to connect my laptop to a TV','Cancelled',NULL,NULL,NULL,50,NULL,NULL),
(70,6,17,'2026-03-23 13:59:00','2026-03-24 13:59:00','I need a camera for a personal project','Rejected',NULL,NULL,NULL,51,NULL,NULL),
(71,6,5,'2026-03-23 13:59:00','2026-03-24 13:59:00','I need a camera for a personal project','Overdue',NULL,'2026-03-20 20:00:27',NULL,51,NULL,NULL),
(72,8,19,'2026-03-16 16:00:00','2026-03-18 16:00:00','for my project work','Pending',NULL,NULL,NULL,52,NULL,NULL),
(73,7,17,'2026-03-28 09:56:00','2026-03-30 09:57:00','I need to film','Approved',NULL,NULL,NULL,53,NULL,NULL),
(74,7,11,'2026-03-28 09:56:00','2026-03-30 09:57:00','I need to film','Pending',NULL,NULL,NULL,53,NULL,NULL),
(75,7,19,'2026-03-29 11:43:00','2026-03-30 11:43:00','I need a stick','Cancelled',NULL,NULL,NULL,54,NULL,NULL),
(76,7,26,'2026-03-28 14:06:00','2026-03-29 14:06:00','I need a greenscreen for filming','Approved',NULL,NULL,NULL,60,NULL,NULL),
(77,8,25,'2026-03-30 14:09:00','2026-03-31 14:09:00','this shouldnt work','Approved',NULL,NULL,NULL,61,NULL,NULL),
(78,8,24,'2026-04-01 14:09:00','2026-04-02 14:09:00','this shouldnt work','Cancelled',NULL,NULL,NULL,62,NULL,NULL),
(79,8,17,'2026-04-04 14:10:00','2026-04-05 14:10:00','this shouldnt work','Cancelled',NULL,NULL,NULL,63,NULL,NULL),
(80,12,11,'2026-03-31 19:27:00','2026-04-01 19:27:00','To take photographs','Approved',NULL,NULL,NULL,66,NULL,NULL);
/*!40000 ALTER TABLE `borrowrequests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES
(1,'Digital Cameras','DLSR'),
(2,'Computer','Laptops'),
(3,'Camera Cart','Camera Cart'),
(4,'Bulk Items','HDMI Cables');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conditionimages`
--

DROP TABLE IF EXISTS `conditionimages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `conditionimages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `borrow_request_id` int(11) DEFAULT NULL,
  `image_type` enum('Before','After') DEFAULT 'Before',
  `filename` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `image_url` varchar(255) GENERATED ALWAYS AS (`filename`) STORED,
  `timestamp` timestamp GENERATED ALWAYS AS (`created_at`) STORED,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `conditionimages_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conditionimages`
--

LOCK TABLES `conditionimages` WRITE;
/*!40000 ALTER TABLE `conditionimages` DISABLE KEYS */;
INSERT INTO `conditionimages` VALUES
(1,16,42,'Before','1774561399215-880021daddfa250010ef52cb.png','2026-03-26 21:43:19','1774561399215-880021daddfa250010ef52cb.png','2026-03-26 21:43:19'),
(2,16,42,'After','1774561424614-5c898135e02a1d1e3652d1bc.png','2026-03-26 21:43:45','1774561424614-5c898135e02a1d1e3652d1bc.png','2026-03-26 21:43:45'),
(3,16,52,'Before','1774561796933-0e5b1adad10c0c884583d358.jpg','2026-03-26 21:49:57','1774561796933-0e5b1adad10c0c884583d358.jpg','2026-03-26 21:49:57');
/*!40000 ALTER TABLE `conditionimages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faculties`
--

DROP TABLE IF EXISTS `faculties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculties` (
  `faculty_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `late_policy` text DEFAULT NULL,
  PRIMARY KEY (`faculty_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculties`
--

LOCK TABLES `faculties` WRITE;
/*!40000 ALTER TABLE `faculties` DISABLE KEYS */;
INSERT INTO `faculties` VALUES
(1,'Film','Faculty of Film','I acknowledge that by borrowing this item, I am responsible for paying for its repair or replacement if it becomes damaged or lost due to negligence or improper use');
/*!40000 ALTER TABLE `faculties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_owners`
--

DROP TABLE IF EXISTS `item_owners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_owners` (
  `item_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`item_id`,`user_id`),
  KEY `fk_iup_user` (`user_id`),
  CONSTRAINT `fk_iup_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_iup_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_owners`
--

LOCK TABLES `item_owners` WRITE;
/*!40000 ALTER TABLE `item_owners` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_owners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `faculty_id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `faculty_id` (`faculty_id`),
  KEY `owner_id` (`owner_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `fk_items_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`faculty_id`),
  CONSTRAINT `items_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `items_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES
(3,'Asus Laptop','Laptop','/uploads/1770334752097-OIP.jpeg',1,3,'12345689',2),
(4,'Nikon DLSR Camera','DLSR Camera','/uploads/1770414894433-nikon_d500_dslr_camera.jpg',1,3,'125689436',1),
(5,'Camera','Test','/uploads/1770415661969-Canon-EOS-2000D.jpg',1,3,'1234567665',1),
(7,'Tripod Stand','Tripod Stand for Camera','/uploads/1772165480538-0929c9074cd1f857034b9efe.jpg',1,5,'12345678',1),
(8,'Mini Tripods','mini Tripod','/uploads/1772165545625-e3a466414e26317abf8d929a.jpg',1,5,NULL,1),
(9,'Tripod Camera','Tripod Camera','/uploads/1772165634223-ea2e70e223937a6d017f4649.jpg',1,5,NULL,1),
(10,'Canon Lens','Macro Lens','/uploads/1772166776698-d00ba8345b0423c933e66617.jpeg',1,5,NULL,1),
(11,'Canon DSLR','DSLR','/uploads/1772166923495-58753a83f1f4327087be0ebe.webp',1,5,NULL,1),
(12,'Nikon D850 Camera','Camera','/uploads/1772167033848-ee579a289cbe9662dc686b7f.jpg',1,5,NULL,1),
(13,'Film Strip','Strip using for filming','/uploads/1772167335373-0344fc5fd1eadcaad85149b0.jpeg',1,5,NULL,4),
(14,'HDMI Cable','HDMI to HDMI cable','/uploads/1772167392918-06502e71396e29d6669bd9cc.jpg',1,5,NULL,4),
(15,'HDMI to DP Cable','HDMI to Display Port Cable','/uploads/1772167498514-4d8124b064eef9a4f3c29854.webp',1,5,NULL,4),
(16,'HDMI to VGA Cable','HDMI to VGA Cable','/uploads/1772167569197-eaa961d5ac3b475f8aaa7fb9.jpg',1,5,NULL,4),
(17,'Film Board','Film Board','/uploads/1772167828714-4c66e7469760313aec912660.jpg',1,3,NULL,4),
(18,'Ring-Light','Ring Light','/uploads/1772168011734-c31c70a19766a9f4d7c4e067.webp',1,3,NULL,4),
(19,'Stick','Wood stick','/uploads/1773434632866-1f01ce16a709d6f4afadeaf3.jpg',1,4,'V555|rrr8785285522/??rr3qwertyuiop[;lkjhgfdsaasdfghjkl.,mnbvcxzasdfghjkl;\'.,mnbvc',4),
(24,'Chromebook','Low power computer for school work use','/uploads/1774563176894-61838a5633325b8126d576c6.png',1,5,'1111,2222,3333',2),
(25,'GreenScreen','A greenscreen, commonly used for filming','/uploads/1774634341284-b7e833ebe632f57e2ec89727.webp',1,5,'123',4),
(26,'GreenScreen','A greenscreen, commonly used for filming','/uploads/1774634341388-4a8a825f85e6a83105d23228.webp',1,5,'456',4),
(27,'GreenScreen','A greenscreen, commonly used for filming','/uploads/1774634341464-078d7424d2d0e4219008ee97.webp',1,5,'789',4);
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(120) NOT NULL,
  `message` text NOT NULL,
  `type` enum('request','approved','rejected','cancelled','checkedout','returned','overdue','info') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  KEY `is_read` (`is_read`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=165 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES
(1,3,'New borrow request','John John requested \"Asus Laptop\".','cancelled',1,'2026-02-05 17:45:50'),
(2,3,'Request approved','Your request for \"Asus Laptop\" was approved.','approved',1,'2026-02-05 17:46:27'),
(3,3,'New borrow request','Jay Patel requested \"Asus Laptop\".','cancelled',1,'2026-02-05 17:47:19'),
(4,1,'Request rejected','Your request for \"Asus Laptop\" was rejected. Note: test','rejected',1,'2026-02-05 17:48:21'),
(5,3,'New borrow request','Jay Patel requested \"Nikon DLSR Camera\".','cancelled',1,'2026-02-06 16:10:06'),
(6,1,'Request rejected','Your request for \"Nikon DLSR Camera\" was rejected. Note: test','rejected',1,'2026-02-06 16:11:25'),
(7,3,'New cart request','Jay Patel requested 2 item(s): Nikon DLSR Camera, Asus Laptop','cancelled',1,'2026-02-12 11:59:55'),
(8,1,'Request rejected','Your request for \"Nikon DLSR Camera\" was rejected. Note: not available','rejected',1,'2026-02-12 12:02:18'),
(9,1,'Request approved','Your request for \"Asus Laptop\" was approved.','approved',1,'2026-02-12 12:02:21'),
(10,3,'New cart request','Jay Patel requested 1 item(s): Camera','cancelled',1,'2026-02-12 18:08:55'),
(11,3,'New cart request','Jay Patel requested 1 item(s): Asus Laptop','cancelled',1,'2026-02-12 18:09:25'),
(12,1,'Item checked out','Your booking for \"Asus Laptop\" has been checked out.','info',1,'2026-02-12 18:10:39'),
(13,1,'Item returned','Your booking for \"Asus Laptop\" has been marked returned.','approved',1,'2026-02-12 18:10:55'),
(14,1,'Request approved','Your request for \"Camera\" was approved.','approved',1,'2026-02-12 18:11:06'),
(15,1,'Request rejected','Your request for \"Asus Laptop\" was rejected. Note: test','rejected',1,'2026-02-12 18:11:26'),
(16,3,'New cart request','Jay Patel requested 1 item(s): Nikon DLSR Camera','cancelled',1,'2026-02-12 18:22:47'),
(17,3,'New cart request','Jay Patel requested 2 item(s): Camera, Asus Laptop','cancelled',1,'2026-02-13 14:18:55'),
(18,1,'Request rejected','Your request for \"Asus Laptop\" was rejected. Note: not available','rejected',1,'2026-02-13 14:19:58'),
(19,1,'Request approved','Your request for \"Camera\" was approved.','approved',1,'2026-02-13 14:20:00'),
(20,1,'Item checked out','Your booking for \"Camera\" has been checked out.','info',1,'2026-02-13 14:20:09'),
(21,1,'Item returned','Your booking for \"Camera\" has been marked returned.','approved',1,'2026-02-13 14:20:12'),
(22,3,'New cart request','Jay Patel requested 2 item(s): Nikon DLSR Camera, Asus Laptop','cancelled',1,'2026-02-13 15:23:05'),
(23,1,'Request rejected','Your request for \"Nikon DLSR Camera\" was rejected. Note: test','rejected',1,'2026-02-13 15:24:40'),
(24,1,'Request approved','Your request for \"Asus Laptop\" was approved.','approved',1,'2026-02-13 15:24:56'),
(25,1,'Item checked out','Your booking for \"Asus Laptop\" has been checked out.','info',1,'2026-02-13 15:25:25'),
(26,1,'Item returned','Your booking for \"Asus Laptop\" has been marked returned.','approved',1,'2026-02-13 15:25:32'),
(27,1,'Request approved','Your request for \"Nikon DLSR Camera\" was approved.','approved',1,'2026-02-24 10:38:32'),
(28,3,'New basket request','Jay Patel requested 1 item(s): Camera','cancelled',1,'2026-02-26 13:11:14'),
(29,1,'Request approved','Your request for \"Camera\" was approved.','approved',1,'2026-02-26 13:13:07'),
(30,1,'Item checked out','Your booking for \"Camera\" has been checked out.','info',1,'2026-02-26 13:13:27'),
(31,3,'New basket request','Jay Patel requested 1 item(s): Camera','cancelled',1,'2026-02-26 13:49:19'),
(32,3,'Request cancelled','A student cancelled their request for \"Camera\".','info',1,'2026-02-26 13:58:59'),
(33,1,'Request cancelled','You cancelled your request for \"Camera\".','info',1,'2026-02-26 13:58:59'),
(34,3,'New basket request','Jay Patel requested 1 item(s): Asus Laptop','info',1,'2026-02-26 15:42:27'),
(35,3,'Request cancelled','A student cancelled their request for \"Asus Laptop\".','info',1,'2026-02-26 15:42:32'),
(36,1,'Request cancelled','You cancelled your request for \"Asus Laptop\".','info',1,'2026-02-26 15:42:32'),
(37,1,'Item checked out','Your booking for \"Nikon DLSR Camera\" has been checked out.','info',1,'2026-02-26 17:32:17'),
(38,5,'New basket request','Jay Patel requested 1 item(s): HDMI Cable','info',1,'2026-02-26 22:55:37'),
(39,3,'New basket request','Jay Patel requested 1 item(s): Nikon DLSR Camera','info',1,'2026-02-26 22:55:37'),
(40,1,'Request approved','Your request for \"Nikon DLSR Camera\" was approved.','info',1,'2026-02-27 06:51:46'),
(41,1,'Item checked out','Your booking for \"Nikon DLSR Camera\" has been checked out.','info',1,'2026-02-27 14:07:29'),
(42,1,'Item returned','Your booking for \"Nikon DLSR Camera\" has been marked returned.','info',1,'2026-02-27 14:07:36'),
(43,3,'New basket request','Jay Patel requested 1 item(s): Film Board','info',1,'2026-02-27 14:12:39'),
(44,5,'New basket request','Jay Patel requested 1 item(s): HDMI to VGA Cable','info',1,'2026-02-27 14:12:39'),
(45,1,'Request rejected','Your request for \"Film Board\" was rejected.','info',1,'2026-02-27 15:10:47'),
(46,1,'Item returned','Your booking for \"Camera\" has been marked returned.','info',1,'2026-02-27 15:12:55'),
(47,1,'Item checked out','Your booking for \"Camera\" has been checked out.','info',1,'2026-02-27 15:12:58'),
(48,1,'Item returned','Your booking for \"Camera\" has been marked returned.','info',1,'2026-02-27 15:13:01'),
(49,5,'New basket request','Jay Patel requested 1 item(s): Nikon D850 Camera','info',1,'2026-02-27 15:16:33'),
(50,3,'New basket request','Jay Patel requested 1 item(s): Nikon DLSR Camera','info',1,'2026-02-27 15:17:56'),
(51,5,'Request cancelled','A student cancelled their request for \"HDMI to VGA Cable\".','info',1,'2026-02-27 15:18:59'),
(52,1,'Request cancelled','You cancelled your request for \"HDMI to VGA Cable\".','info',1,'2026-02-27 15:18:59'),
(53,1,'Request rejected','Your request for \"Nikon DLSR Camera\" was rejected.','info',1,'2026-02-27 15:21:01'),
(54,3,'New basket request','Jay Patel requested 1 item(s): Asus Laptop','info',1,'2026-02-27 15:22:35'),
(55,1,'Request approved','Your request for \"Asus Laptop\" was approved.','info',1,'2026-02-27 15:24:22'),
(56,3,'New basket request','Jay Patel requested 1 item(s): Camera','info',1,'2026-02-27 15:25:31'),
(57,1,'Request approved','Your request for \"Camera\" was approved.','info',1,'2026-02-27 15:53:15'),
(58,3,'Request cancelled','A student cancelled their request for \"Film Board\".','cancelled',1,'2026-03-13 04:01:25'),
(59,6,'Request cancelled','You cancelled your request for \"Film Board\".','cancelled',0,'2026-03-13 04:01:25'),
(60,3,'New basket request','Jay Patel requested 1 item(s): Ring-Light','request',1,'2026-03-13 04:04:05'),
(61,3,'Request cancelled','A student cancelled their request for \"Ring-Light\".','cancelled',1,'2026-03-13 04:04:16'),
(62,1,'Request cancelled','You cancelled your request for \"Ring-Light\".','cancelled',1,'2026-03-13 04:04:16'),
(63,3,'New basket request','123123123123 12312312312 requested 1 item(s): Asus Laptop','request',1,'2026-03-13 15:35:31'),
(64,5,'New basket request','Jay Patel requested 1 item(s): Nikon D850 Camera','request',1,'2026-03-13 17:06:48'),
(65,5,'Request cancelled','A student cancelled their request for \"Nikon D850 Camera\".','cancelled',1,'2026-03-13 17:07:00'),
(66,1,'Request cancelled','You cancelled your request for \"Nikon D850 Camera\".','cancelled',1,'2026-03-13 17:07:00'),
(67,6,'Request approved','Your request for \"Asus Laptop\" was approved.','approved',0,'2026-03-13 17:29:38'),
(68,6,'Item checked out','Your booking for \"Asus Laptop\" has been checked out.','checkedout',0,'2026-03-13 17:29:46'),
(69,6,'Item returned','Your booking for \"Asus Laptop\" has been marked returned.','returned',0,'2026-03-13 17:29:49'),
(70,6,'Item checked out','Your booking for \"Film Board\" has been checked out.','checkedout',0,'2026-03-13 17:31:50'),
(71,6,'Item returned','Your booking for \"Film Board\" has been marked returned.','returned',0,'2026-03-13 17:31:52'),
(72,6,'Item checked out','Your booking for \"Ring-Light\" has been checked out.','checkedout',0,'2026-03-13 17:34:19'),
(73,6,'Item returned','Your booking for \"Ring-Light\" has been marked returned.','returned',0,'2026-03-13 17:34:21'),
(74,6,'Request approved','Your request for \"Film Board\" was approved.','approved',0,'2026-03-13 17:45:11'),
(75,5,'New basket request','123123123123 12312312312 requested 1 item(s): Canon Lens','request',1,'2026-03-13 17:48:45'),
(76,6,'Request approved','Your request for \"Canon Lens\" was approved.','approved',0,'2026-03-13 17:50:13'),
(77,6,'Item checked out','Your booking for \"Canon Lens\" has been checked out.','checkedout',0,'2026-03-13 17:50:16'),
(78,6,'Item returned','Your booking for \"Canon Lens\" has been marked returned.','returned',0,'2026-03-13 17:50:18'),
(79,6,'Request approved','Your request for \"Tripod Stand\" was approved.','approved',0,'2026-03-13 17:52:52'),
(80,6,'Item checked out','Your booking for \"Tripod Stand\" has been checked out.','checkedout',0,'2026-03-13 17:52:55'),
(81,6,'Item returned','Your booking for \"Tripod Stand\" has been marked returned.','returned',0,'2026-03-13 17:52:57'),
(82,6,'Request approved','Your request for \"Canon Lens\" was approved.','approved',0,'2026-03-13 17:53:54'),
(83,6,'Item checked out','Your booking for \"Canon Lens\" has been checked out.','checkedout',0,'2026-03-13 17:53:56'),
(84,6,'Item returned','Your booking for \"Canon Lens\" has been marked returned.','returned',0,'2026-03-13 17:53:59'),
(85,5,'New basket request','Isaac Kydd requested 1 item(s): HDMI to VGA Cable','request',1,'2026-03-13 18:40:42'),
(86,7,'Request approved','Your request for \"HDMI to VGA Cable\" was approved.','approved',0,'2026-03-13 18:41:11'),
(87,7,'Item checked out','Your booking for \"HDMI to VGA Cable\" has been checked out.','checkedout',0,'2026-03-13 18:41:17'),
(88,7,'Item returned','Your booking for \"HDMI to VGA Cable\" has been marked returned.','returned',0,'2026-03-13 18:41:21'),
(89,5,'New basket request','Isaac Kydd requested 1 item(s): HDMI Cable','request',1,'2026-03-13 19:05:43'),
(90,7,'Request rejected','Your request for \"HDMI Cable\" was rejected. Note: Your need for this item is not high enough priority','rejected',0,'2026-03-13 19:06:19'),
(91,5,'New basket request','Isaac Kydd requested 1 item(s): HDMI to VGA Cable','request',1,'2026-03-13 19:09:54'),
(92,7,'Request rejected','Your request for \"HDMI to VGA Cable\" was rejected. Note: Your reason is bad. We need this for real problems.','rejected',0,'2026-03-13 19:10:26'),
(93,5,'New basket request','Isaac Kydd requested 1 item(s): HDMI Cable','request',1,'2026-03-13 19:14:34'),
(94,7,'Request rejected','Your request for \"HDMI Cable\" was rejected. Note: Rejected, we are low on HDMI cables and this is not high priority','rejected',0,'2026-03-13 19:15:08'),
(95,5,'New basket request','Isaac Kydd requested 2 item(s): HDMI to VGA Cable, HDMI to DP Cable','request',1,'2026-03-13 19:17:36'),
(96,7,'Request approved','Your request for \"HDMI to VGA Cable\" was approved.','approved',0,'2026-03-13 19:17:54'),
(97,7,'Request rejected','Your request for \"HDMI to DP Cable\" was rejected. Note: Your reason is bad','rejected',0,'2026-03-13 19:18:04'),
(98,3,'New basket request','Jay Patel requested 2 item(s): Asus Laptop, Nikon DLSR Camera','request',1,'2026-03-13 20:31:40'),
(99,5,'New basket request','Jay Patel requested 1 item(s): Nikon D850 Camera','request',1,'2026-03-13 20:49:27'),
(100,8,'Request rejected','Your request for \"Asus Laptop\" was rejected. Note: It is broken','rejected',1,'2026-03-13 20:52:27'),
(101,5,'New basket request','Isaac Kydd requested 2 item(s): Mini Tripods, Canon Lens','request',1,'2026-03-13 20:52:36'),
(102,7,'Request approved','Your request for \"Mini Tripods\" was approved.','approved',0,'2026-03-13 20:53:13'),
(103,7,'Request rejected','Your request for \"Canon Lens\" was rejected. Note: We need this for more imporwtant stuff','rejected',0,'2026-03-13 20:53:57'),
(104,5,'New basket request','Jay Patel requested 1 item(s): HDMI to DP Cable','request',1,'2026-03-13 20:56:24'),
(105,6,'Request approved','Your request for \"HDMI to VGA Cable\" was approved.','approved',0,'2026-03-13 20:57:07'),
(106,1,'Item checked out','Your booking for \"Camera\" has been checked out.','checkedout',1,'2026-03-13 21:00:50'),
(107,6,'Item checked out','Your booking for \"Film Board\" has been checked out.','checkedout',0,'2026-03-13 21:01:02'),
(108,3,'New basket request','123123123123 12312312312 requested 2 item(s): Film Board, Asus Laptop','request',1,'2026-03-13 21:02:51'),
(109,6,'Request rejected','Your request for \"Film Board\" was rejected. Note: you suck','rejected',0,'2026-03-13 21:06:47'),
(110,5,'New basket request','Jay Patel requested 1 item(s): Nikon D850 Camera','request',1,'2026-03-13 21:10:00'),
(111,6,'Request approved','Your request for \"Asus Laptop\" was approved.','approved',0,'2026-03-13 21:11:12'),
(112,6,'Item checked out','Your booking for \"Asus Laptop\" has been checked out.','checkedout',0,'2026-03-13 21:11:31'),
(113,6,'Item returned','Your booking for \"Asus Laptop\" has been marked returned.','returned',0,'2026-03-13 21:11:37'),
(114,5,'New basket request','123123123123 12312312312 requested 1 item(s): Film Strip','request',1,'2026-03-13 21:14:25'),
(115,4,'New basket request','Thomas Persson requested 1 item(s): Stick','request',1,'2026-03-13 21:23:36'),
(116,11,'Request approved','Your request for \"Stick\" was approved.','approved',1,'2026-03-13 21:24:24'),
(117,8,'Request approved','Your request for \"Nikon DLSR Camera\" was approved.','approved',1,'2026-03-13 21:53:11'),
(118,8,'Item checked out','Your booking for \"Nikon DLSR Camera\" has been checked out.','checkedout',1,'2026-03-13 21:53:31'),
(119,3,'New basket request','123123123123 12312312312 requested 2 item(s): Ring-Light, Film Board','request',1,'2026-03-20 19:54:34'),
(120,6,'Request approved','Your request for \"Film Board\" was approved.','approved',0,'2026-03-20 19:55:01'),
(121,6,'Request approved','Your request for \"Ring-Light\" was approved.','approved',0,'2026-03-20 19:55:10'),
(122,3,'New basket request','123123123123 12312312312 requested 2 item(s): Nikon DLSR Camera, Asus Laptop','request',1,'2026-03-20 19:56:24'),
(123,6,'Request approved','Your request for \"Asus Laptop\" was approved.','approved',0,'2026-03-20 19:56:39'),
(124,6,'Request approved','Your request for \"Nikon DLSR Camera\" was approved.','approved',0,'2026-03-20 19:57:08'),
(125,6,'Item checked out','Your booking for \"Nikon DLSR Camera\" has been checked out.','checkedout',0,'2026-03-20 19:57:14'),
(126,8,'Item returned','Your booking for \"Nikon DLSR Camera\" has been marked returned.','returned',1,'2026-03-20 19:57:29'),
(127,6,'Item checked out','Your booking for \"Asus Laptop\" has been checked out.','checkedout',0,'2026-03-20 19:57:55'),
(128,5,'New basket request','123123123123 12312312312 requested 1 item(s): HDMI to VGA Cable','request',1,'2026-03-20 19:59:07'),
(129,3,'New basket request','123123123123 12312312312 requested 2 item(s): Film Board, Camera','request',1,'2026-03-20 20:00:03'),
(130,6,'Request approved','Your request for \"Camera\" was approved.','approved',0,'2026-03-20 20:00:22'),
(131,6,'Item checked out','Your booking for \"Camera\" has been checked out.','checkedout',0,'2026-03-20 20:00:27'),
(132,6,'Request rejected','Your request for \"Film Board\" was rejected.','rejected',0,'2026-03-23 22:35:19'),
(133,1,'Request approved','Your request for \"Nikon D850 Camera\" was approved.','approved',1,'2026-03-23 22:35:21'),
(134,1,'Request approved','Your request for \"Canon Lens\" was approved.','approved',1,'2026-03-23 22:35:54'),
(135,1,'Request rejected','Your request for \"HDMI to DP Cable\" was rejected. Note: Rejected by Admin','rejected',1,'2026-03-23 22:36:05'),
(136,5,'Request cancelled','A student cancelled their request for \"HDMI to VGA Cable\".','cancelled',1,'2026-03-26 19:49:35'),
(137,6,'Request cancelled','You cancelled your request for \"HDMI to VGA Cable\".','cancelled',0,'2026-03-26 19:49:35'),
(138,1,'Item checked out','Your booking for \"Nikon D850 Camera\" has been checked out.','checkedout',1,'2026-03-26 20:16:10'),
(139,1,'Item returned','Your booking for \"Nikon D850 Camera\" has been marked returned.','returned',1,'2026-03-26 20:16:14'),
(140,6,'Item checked out','Your booking for \"HDMI to VGA Cable\" has been checked out.','checkedout',0,'2026-03-26 21:43:19'),
(141,6,'Item returned','Your booking for \"HDMI to VGA Cable\" has been marked returned.','returned',0,'2026-03-26 21:43:45'),
(142,7,'Item checked out','Your booking for \"HDMI to VGA Cable\" has been checked out.','checkedout',0,'2026-03-26 21:49:57'),
(143,4,'New basket request','Jay Patel requested 1 item(s): Stick','request',0,'2026-03-26 22:00:54'),
(144,3,'New basket request','Isaac Kydd requested 1 item(s): Film Board','request',1,'2026-03-27 15:57:08'),
(145,5,'New basket request','Isaac Kydd requested 1 item(s): Canon DSLR','request',1,'2026-03-27 15:57:08'),
(146,4,'New basket request','Isaac Kydd requested 1 item(s): Stick','request',0,'2026-03-27 17:43:27'),
(147,5,'Request cancelled','A student cancelled their request for \"Canon Lens\".','cancelled',1,'2026-03-27 19:58:55'),
(148,1,'Request cancelled','You cancelled your request for \"Canon Lens\".','cancelled',1,'2026-03-27 19:58:55'),
(149,4,'Request cancelled','A student cancelled their request for \"Stick\".','cancelled',0,'2026-03-27 20:06:21'),
(150,7,'Request cancelled','You cancelled your request for \"Stick\".','cancelled',0,'2026-03-27 20:06:21'),
(151,5,'New basket request','Isaac Kydd requested 1 item(s): GreenScreen','request',1,'2026-03-27 20:06:31'),
(152,5,'Request cancelled','A student cancelled their request for \"Mini Tripods\".','cancelled',1,'2026-03-27 20:06:42'),
(153,7,'Request cancelled','You cancelled your request for \"Mini Tripods\".','cancelled',0,'2026-03-27 20:06:42'),
(154,5,'New basket request','Jay Patel requested 1 item(s): GreenScreen','request',1,'2026-03-27 20:09:12'),
(155,5,'New basket request','Jay Patel requested 1 item(s): Chromebook','request',1,'2026-03-27 20:10:02'),
(156,3,'New basket request','Jay Patel requested 1 item(s): Film Board','request',1,'2026-03-27 20:10:51'),
(157,3,'Request cancelled','A student cancelled their request for \"Film Board\".','cancelled',1,'2026-03-27 20:32:25'),
(158,8,'Request cancelled','You cancelled your request for \"Film Board\".','cancelled',1,'2026-03-27 20:32:25'),
(159,5,'Request cancelled','A student cancelled their request for \"Chromebook\".','cancelled',1,'2026-03-27 20:32:28'),
(160,8,'Request cancelled','You cancelled your request for \"Chromebook\".','cancelled',1,'2026-03-27 20:32:28'),
(161,5,'Request cancelled','A student cancelled their request for \"Nikon D850 Camera\".','cancelled',1,'2026-03-28 01:28:43'),
(162,1,'Request cancelled','You cancelled your request for \"Nikon D850 Camera\".','cancelled',1,'2026-03-28 01:28:43'),
(163,5,'New basket request','Mahesh Bhatt requested 1 item(s): Canon DSLR','request',1,'2026-03-28 01:33:00'),
(164,12,'Request approved','Your request for \"Canon DSLR\" was approved.','approved',0,'2026-03-28 01:37:38');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `request_groups`
--

DROP TABLE IF EXISTS `request_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_groups` (
  `group_id` int(11) NOT NULL AUTO_INCREMENT,
  `borrower_id` int(11) NOT NULL,
  `requested_start` datetime DEFAULT NULL,
  `requested_end` datetime DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`group_id`),
  KEY `borrower_id` (`borrower_id`),
  CONSTRAINT `request_groups_ibfk_1` FOREIGN KEY (`borrower_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request_groups`
--

LOCK TABLES `request_groups` WRITE;
/*!40000 ALTER TABLE `request_groups` DISABLE KEYS */;
INSERT INTO `request_groups` VALUES
(1,1,NULL,NULL,'for test preparation','2026-02-12 11:59:55'),
(2,1,NULL,NULL,'for test','2026-02-12 18:08:55'),
(3,1,NULL,NULL,'for test','2026-02-12 18:09:25'),
(4,1,NULL,NULL,'test','2026-02-12 18:22:47'),
(5,1,NULL,NULL,'test','2026-02-13 14:18:55'),
(6,1,NULL,NULL,'test','2026-02-13 15:23:04'),
(7,1,NULL,NULL,'i need fo my class asssignment.','2026-02-26 13:09:33'),
(8,1,NULL,NULL,'for home work','2026-02-26 13:10:33'),
(9,1,NULL,NULL,'for lab','2026-02-26 13:11:14'),
(10,1,NULL,NULL,'test','2026-02-26 13:49:19'),
(11,1,NULL,NULL,'assignment work','2026-02-26 15:42:27'),
(12,1,NULL,NULL,'for home work','2026-02-26 22:55:37'),
(13,1,NULL,NULL,'for homework','2026-02-27 14:12:39'),
(14,1,NULL,NULL,'for the project','2026-02-27 15:16:33'),
(15,1,NULL,NULL,'for my class work','2026-02-27 15:17:56'),
(16,1,NULL,NULL,'for my class work','2026-02-27 15:18:10'),
(17,1,NULL,NULL,'for my class work','2026-02-27 15:18:23'),
(18,1,NULL,NULL,'for class work','2026-02-27 15:22:35'),
(19,1,NULL,NULL,'for assignment','2026-02-27 15:25:31'),
(20,6,NULL,NULL,'For filming a video with good lighting and connecting to my monitor that only uses VGA','2026-03-02 23:38:10'),
(21,6,NULL,NULL,'For filming a video with good lighting and connecting to my monitor that only uses VGA','2026-03-02 23:38:27'),
(22,6,NULL,NULL,'I need to have good lighting for a film','2026-03-03 17:16:11'),
(23,6,NULL,NULL,'Need supplies to film and edit a short film for Film 101','2026-03-06 17:57:18'),
(24,6,NULL,NULL,'Need for tripod competition','2026-03-10 16:58:58'),
(25,1,NULL,NULL,'for home work','2026-03-10 17:25:39'),
(26,1,NULL,NULL,'For my home work','2026-03-10 17:42:01'),
(27,6,NULL,NULL,'need film strip for doing eperiment on light travelling through film','2026-03-13 03:28:25'),
(28,6,NULL,NULL,'Need camera to take pictures of squirrels for nature class','2026-03-13 03:43:44'),
(29,6,NULL,NULL,'Need to connect my laptop to a TV','2026-03-13 03:55:45'),
(30,6,NULL,NULL,'Need to do the \"action\" thing for filming a movie','2026-03-13 03:56:21'),
(31,1,NULL,NULL,'I need it for creating the blog','2026-03-13 04:04:05'),
(32,6,NULL,NULL,'I need a laptop to play flash game while I pretend to do homework','2026-03-13 15:35:31'),
(33,1,NULL,NULL,'for taking pictures','2026-03-13 17:06:48'),
(34,6,NULL,NULL,'Need new lens for my camera','2026-03-13 17:48:45'),
(35,7,NULL,NULL,'Need to connect my computer to a projector','2026-03-13 18:40:42'),
(36,7,NULL,NULL,'Need to connect my laptop to a TV','2026-03-13 19:05:43'),
(37,7,NULL,NULL,'Need to connect laptop to old monitor that only has VGA','2026-03-13 19:09:54'),
(38,7,NULL,NULL,'Need an HDMI cable for connecting laptop to monitor','2026-03-13 19:14:34'),
(39,7,NULL,NULL,'I need cables man','2026-03-13 19:17:36'),
(40,8,NULL,NULL,'for my class project','2026-03-13 20:31:40'),
(41,8,NULL,NULL,'Test','2026-03-13 20:49:27'),
(42,7,NULL,NULL,'I want stuff','2026-03-13 20:52:36'),
(43,1,NULL,NULL,'For class','2026-03-13 20:56:24'),
(44,6,NULL,NULL,'making a film','2026-03-13 21:02:51'),
(45,1,NULL,NULL,'For my c','2026-03-13 21:10:00'),
(46,6,NULL,NULL,'i need film','2026-03-13 21:14:25'),
(47,11,NULL,NULL,'To walk','2026-03-13 21:23:36'),
(48,6,NULL,NULL,'I need these items to make a short film for my film class','2026-03-20 19:54:34'),
(49,6,NULL,NULL,'Need Camera equipment for movie','2026-03-20 19:56:24'),
(50,6,NULL,NULL,'Need to connect my laptop to a TV','2026-03-20 19:59:07'),
(51,6,NULL,NULL,'I need a camera for a personal project','2026-03-20 20:00:03'),
(52,8,NULL,NULL,'for my project work','2026-03-26 22:00:54'),
(53,7,NULL,NULL,'I need to film','2026-03-27 15:57:08'),
(54,7,NULL,NULL,'I need a stick','2026-03-27 17:43:27'),
(55,7,NULL,NULL,'I need a tripod camera','2026-03-27 17:44:06'),
(56,7,NULL,NULL,'I need a tripod camera','2026-03-27 17:44:20'),
(57,7,NULL,NULL,'Filming','2026-03-27 17:44:49'),
(58,1,NULL,NULL,'Need for my computer setup','2026-03-27 20:00:58'),
(59,7,NULL,NULL,'tyhis shouldnt work','2026-03-27 20:06:13'),
(60,7,NULL,NULL,'I need a greenscreen for filming','2026-03-27 20:06:31'),
(61,8,NULL,NULL,'this shouldnt work','2026-03-27 20:09:12'),
(62,8,NULL,NULL,'this shouldnt work','2026-03-27 20:10:02'),
(63,8,NULL,NULL,'this shouldnt work','2026-03-27 20:10:51'),
(64,1,NULL,NULL,'To take photographs','2026-03-28 01:28:23'),
(65,1,NULL,NULL,'To take photographs','2026-03-28 01:29:06'),
(66,12,NULL,NULL,'To take photographs','2026-03-28 01:33:00');
/*!40000 ALTER TABLE `request_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `user_type` enum('Student','Faculty','Admin') NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'abc@gmail.com','$2b$10$7DEMnTCFZoDQkfqcpEiN5ew.3Xg7RGWBNP9h05CTq2Wi4ITubvECa','Student','jay01','Jay','Patel',12345678),
(2,'faculty@gmail.com','$2b$10$ziKAYd0znCTnw31xFw1YEuFXegLK326a4BlbbFdPNZyh522IGaywu','Student','joe01','joe','joe',569876115),
(3,'john@gmail.com','$2b$10$HnGnb4HjMKvYjbx1pxl3YOEtwoDEze6dzWIO6sjkkFT4342q3Ctau','Faculty','john01','John','John',156897545),
(4,'admin@gmail.com','$2b$10$qru7buoXIObgSbgUYgPKTeeOLnrfB.bIpQNR87qMyp5MQrLPWfjDu','Admin','admin01','Isaac','Kydd',234567891),
(5,'jeet@gmail.com','$2b$10$JPc1MMoylWxFpDHMeb4j2Oa/otx6Y68gTOPlPmY5DOvQ5/LZpPDxS','Faculty','jeet01','Jeet','Patel',168923665),
(6,'test@test.com','$2b$10$sM4c6JtIPzmLYUart39HC.hxYIsoykTtN.Br7Ga9sEDzLYiLc.v42','Student','testsetset','123123123123','12312312312',123),
(7,'ikn050@uregina.ca','$2b$10$s9P.mbRwTlu.2KoLzJa3fuo1k0ISfFljj1YxzzIWlhx0ksPxjutEC','Student','ikn050','Isaac','Kydd',300335456),
(8,'jayp012003@gmail.com','$2b$10$7nLX4aTzWpkJLsbV9KVVyOWZc9ERT7G3O2eayy.Kun3UVibTP85IC','Student','jay03','Jay','Patel',200458790),
(9,'ok@ok.ca','$2b$10$dhv3OOMqDOlSFzEu4JtYheVnIdY0pA3lRn/oMdn1TaNa0/ctDyezi','Student','Okkkkay','Ok','Ok',11111111),
(10,'nyutluak@gmail.com','$2b$10$jz3BVIjVrr2e9chHEfSB3u.WZccG0uTU7wPRAhyv/8KwdH3Iuw6iW','Student','Chop','Chop ','Kur',200497265),
(11,'tkp731@uregina.ca','$2b$10$YIjz..zep7RG/q.jXB4yjuVqiemVpSbUtNzvQJc3igc1YGU0M3Zle','Student','Bitboy319','Thomas','Persson',200525550),
(12,'maheshbabu57@gmail.com','$2b$10$dQQMRk2xMz7JyPPjSjRlder3CecvnHvDvmLwXI5h.1RuO3tnxaJBm','Student','Maheshbabu57','Mahesh','Bhatt',338992845),
(13,'krish@gmail.com','$2b$10$NuYlQZZMmLyZlyli/.yVjuixREVaaVKABZTn5YEhCTjfsj0GcWWUm','Student','kp053','Krish','Patel',256894568),
(14,'arth01@gmail.com','$2b$10$cal5Teazvnl1rFSZeWZdTOGJo/4nZRGquplr4YJnw2MT8jAdcB37.','Student','arth01','Arth','Shah',45621389);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-30  2:52:32
