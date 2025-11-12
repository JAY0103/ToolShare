CREATE DATABASE  IF NOT EXISTS `project` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `project`;
-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: project
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `image_url` varchar(255) DEFAULT NULL,
  `faculty_id` int NOT NULL,
  `owner_id` int NOT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `faculty_id` (`faculty_id`),
  KEY `owner_id` (`owner_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`faculty_id`),
  CONSTRAINT `items_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `items_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (3,'Computer_Test','test description for test computer','https://www.pngmart.com/files/7/Desktop-Computer-PNG-Image.png',1,1,'Test_Serial123',1),(4,'CANON T5 EOS Rebel Camera','Canon EOS Rebel T7 DSLR Camera with 18-55mm Lens\n\nKey Features:\n\n24.1MP APS-C CMOS Sensor\nDIGIC 4+ Image Processor\n3.0\" 920k-Dot LCD Monitor\nFull HD 1080/30p Video Recording\n9-Point AF with Center Cross-Type Point\nISO 100-6400, Up to 3 fps Shooting\nBuilt-In Wi-Fi with NFC\nScene Intelligent Auto Mode\nCreative Filters and Creative Auto Modes\nEF-S 18-55mm f/3.5-5.6 IS II Lens','https://www.bhphotovideo.com/images/images2000x2000/canon_9126b003_eos_a_rebel_t5_dslr_1030209.jpg',1,1,'Camer_Serial_67',1),(5,'ZOMEI VT666 Tripod','Color: Black, Material: Mg-Al Alloy, Sections: 3.\nMax. height: 155cm.Min height: 155cm,Folded length: 76cm.\nMax. leg diameter: 27mm.Ball head bowl size: 60mm\nItem weight: 3250g / 7.1Lb,Tripod Max. load: 15kg\nItem size: 76 * 12 * 12cm / 30 * 4.7 * 4.7in,Package size: 81 * 16 * 16cm / 31.8 * 6.3 * 6.3in,Package weight: 4090g / 9Lb','https://www.zomei.com/u_file/1903/products/21/7f7798dc37.jpg',1,1,'Tripod_serial_test12333114ytr',1);
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-12 12:34:02
