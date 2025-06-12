-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: comunigov
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `achievement_badges`
--

DROP TABLE IF EXISTS `achievement_badges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `achievement_badges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `icon` text NOT NULL,
  `category` text NOT NULL,
  `level` int NOT NULL,
  `criteria` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `achievement_badges_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `achievement_badges`
--

LOCK TABLES `achievement_badges` WRITE;
/*!40000 ALTER TABLE `achievement_badges` DISABLE KEYS */;
/*!40000 ALTER TABLE `achievement_badges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `communication_files`
--

DROP TABLE IF EXISTS `communication_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `communication_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `communication_id` int NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `file_path` text NOT NULL,
  `uploaded_by` int NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `communication_files_communication_id_communications_id_fk` (`communication_id`),
  KEY `communication_files_uploaded_by_users_id_fk` (`uploaded_by`),
  CONSTRAINT `communication_files_communication_id_communications_id_fk` FOREIGN KEY (`communication_id`) REFERENCES `communications` (`id`),
  CONSTRAINT `communication_files_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `communication_files`
--

LOCK TABLES `communication_files` WRITE;
/*!40000 ALTER TABLE `communication_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `communication_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `communication_recipients`
--

DROP TABLE IF EXISTS `communication_recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `communication_recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `communication_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `read` tinyint(1) DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `communication_recipients_communication_id_communications_id_fk` (`communication_id`),
  KEY `communication_recipients_user_id_users_id_fk` (`user_id`),
  KEY `communication_recipients_entity_id_entities_id_fk` (`entity_id`),
  CONSTRAINT `communication_recipients_communication_id_communications_id_fk` FOREIGN KEY (`communication_id`) REFERENCES `communications` (`id`),
  CONSTRAINT `communication_recipients_entity_id_entities_id_fk` FOREIGN KEY (`entity_id`) REFERENCES `entities` (`id`),
  CONSTRAINT `communication_recipients_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `communication_recipients`
--

LOCK TABLES `communication_recipients` WRITE;
/*!40000 ALTER TABLE `communication_recipients` DISABLE KEYS */;
/*!40000 ALTER TABLE `communication_recipients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `communications`
--

DROP TABLE IF EXISTS `communications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `communications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject` text NOT NULL,
  `content` text NOT NULL,
  `communication_channel` enum('email','whatsapp','telegram','system_notification') NOT NULL,
  `sent_by` int NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT (now()),
  `has_attachments` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `communications_sent_by_users_id_fk` (`sent_by`),
  CONSTRAINT `communications_sent_by_users_id_fk` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `communications`
--

LOCK TABLES `communications` WRITE;
/*!40000 ALTER TABLE `communications` DISABLE KEYS */;
/*!40000 ALTER TABLE `communications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entities`
--

DROP TABLE IF EXISTS `entities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `entity_type` enum('secretariat','administrative_unit','external_entity','government_agency','association','council') NOT NULL,
  `head_name` text NOT NULL,
  `head_position` text NOT NULL,
  `head_email` text NOT NULL,
  `address` text,
  `phone` text,
  `website` text,
  `social_media` text,
  `tags` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entities`
--

LOCK TABLES `entities` WRITE;
/*!40000 ALTER TABLE `entities` DISABLE KEYS */;
INSERT INTO `entities` VALUES (1,'entidade 1542','external_entity','Maria Eduarda','Diretora','mariaramos@detran.sc.gov.br',NULL,NULL,NULL,NULL,'[\"tecnologia\", \"desenvolvimento\"]'),(2,'Entidade 2','association','Jeff Loomis','Diretor','loirjunior@detran.sc.gov.br',NULL,NULL,NULL,NULL,'[\"marketing\", \"cultura\", \"esportes\"]');
/*!40000 ALTER TABLE `entities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_attendees`
--

DROP TABLE IF EXISTS `meeting_attendees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_attendees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `meeting_id` int NOT NULL,
  `user_id` int NOT NULL,
  `confirmed` tinyint(1) DEFAULT '0',
  `attended` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `meeting_attendees_meeting_id_user_id_unique` (`meeting_id`,`user_id`),
  KEY `meeting_attendees_user_id_users_id_fk` (`user_id`),
  CONSTRAINT `meeting_attendees_meeting_id_meetings_id_fk` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`),
  CONSTRAINT `meeting_attendees_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_attendees`
--

LOCK TABLES `meeting_attendees` WRITE;
/*!40000 ALTER TABLE `meeting_attendees` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_attendees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_documents`
--

DROP TABLE IF EXISTS `meeting_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `meeting_id` int NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `file_path` text NOT NULL,
  `uploaded_by` int NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `meeting_documents_meeting_id_meetings_id_fk` (`meeting_id`),
  KEY `meeting_documents_uploaded_by_users_id_fk` (`uploaded_by`),
  CONSTRAINT `meeting_documents_meeting_id_meetings_id_fk` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`),
  CONSTRAINT `meeting_documents_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_documents`
--

LOCK TABLES `meeting_documents` WRITE;
/*!40000 ALTER TABLE `meeting_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_reactions`
--

DROP TABLE IF EXISTS `meeting_reactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_reactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `meeting_id` int NOT NULL,
  `user_id` int NOT NULL,
  `emoji_type` enum('thumbs_up','thumbs_down','heart','tada','thinking','smile','cry','clap') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `meeting_reactions_meeting_id_meetings_id_fk` (`meeting_id`),
  KEY `meeting_reactions_user_id_users_id_fk` (`user_id`),
  CONSTRAINT `meeting_reactions_meeting_id_meetings_id_fk` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`),
  CONSTRAINT `meeting_reactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_reactions`
--

LOCK TABLES `meeting_reactions` WRITE;
/*!40000 ALTER TABLE `meeting_reactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_reactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meetings`
--

DROP TABLE IF EXISTS `meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meetings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `agenda` text NOT NULL,
  `date` timestamp NOT NULL,
  `start_time` text NOT NULL,
  `end_time` text NOT NULL,
  `location` text,
  `subject` text,
  `is_registered_subject` tinyint(1) DEFAULT '0',
  `subject_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `meetings_subject_id_subjects_id_fk` (`subject_id`),
  KEY `meetings_created_by_users_id_fk` (`created_by`),
  CONSTRAINT `meetings_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `meetings_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetings`
--

LOCK TABLES `meetings` WRITE;
/*!40000 ALTER TABLE `meetings` DISABLE KEYS */;
/*!40000 ALTER TABLE `meetings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `public_hearing_files`
--

DROP TABLE IF EXISTS `public_hearing_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `public_hearing_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `public_hearing_id` int NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `file_path` text NOT NULL,
  `uploaded_by` int NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `public_hearing_files_public_hearing_id_public_hearings_id_fk` (`public_hearing_id`),
  KEY `public_hearing_files_uploaded_by_users_id_fk` (`uploaded_by`),
  CONSTRAINT `public_hearing_files_public_hearing_id_public_hearings_id_fk` FOREIGN KEY (`public_hearing_id`) REFERENCES `public_hearings` (`id`),
  CONSTRAINT `public_hearing_files_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `public_hearing_files`
--

LOCK TABLES `public_hearing_files` WRITE;
/*!40000 ALTER TABLE `public_hearing_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `public_hearing_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `public_hearings`
--

DROP TABLE IF EXISTS `public_hearings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `public_hearings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `date` timestamp NOT NULL,
  `start_time` text NOT NULL,
  `end_time` text NOT NULL,
  `location` text NOT NULL,
  `public_hearing_status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  `entity_id` int NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `public_hearings_entity_id_entities_id_fk` (`entity_id`),
  KEY `public_hearings_created_by_users_id_fk` (`created_by`),
  CONSTRAINT `public_hearings_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `public_hearings_entity_id_entities_id_fk` FOREIGN KEY (`entity_id`) REFERENCES `entities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `public_hearings`
--

LOCK TABLES `public_hearings` WRITE;
/*!40000 ALTER TABLE `public_hearings` DISABLE KEYS */;
/*!40000 ALTER TABLE `public_hearings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subject_entities`
--

DROP TABLE IF EXISTS `subject_entities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subject_entities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` int NOT NULL,
  `entity_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subject_entities_subject_id_entity_id_unique` (`subject_id`,`entity_id`),
  KEY `subject_entities_entity_id_entities_id_fk` (`entity_id`),
  CONSTRAINT `subject_entities_entity_id_entities_id_fk` FOREIGN KEY (`entity_id`) REFERENCES `entities` (`id`),
  CONSTRAINT `subject_entities_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subject_entities`
--

LOCK TABLES `subject_entities` WRITE;
/*!40000 ALTER TABLE `subject_entities` DISABLE KEYS */;
/*!40000 ALTER TABLE `subject_entities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `description` text,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `subjects_created_by_users_id_fk` (`created_by`),
  CONSTRAINT `subjects_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_comments`
--

DROP TABLE IF EXISTS `task_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `task_comments_task_id_tasks_id_fk` (`task_id`),
  KEY `task_comments_user_id_users_id_fk` (`user_id`),
  CONSTRAINT `task_comments_task_id_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`),
  CONSTRAINT `task_comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_comments`
--

LOCK TABLES `task_comments` WRITE;
/*!40000 ALTER TABLE `task_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `deadline` timestamp NOT NULL,
  `task_status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `subject_id` int NOT NULL,
  `is_registered_user` tinyint(1) NOT NULL DEFAULT '1',
  `assigned_to_user_id` int DEFAULT NULL,
  `owner_name` text,
  `owner_email` text,
  `owner_phone` text,
  `created_by` int NOT NULL,
  `entity_id` int DEFAULT NULL,
  `meeting_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `tasks_subject_id_subjects_id_fk` (`subject_id`),
  KEY `tasks_assigned_to_user_id_users_id_fk` (`assigned_to_user_id`),
  KEY `tasks_created_by_users_id_fk` (`created_by`),
  KEY `tasks_entity_id_entities_id_fk` (`entity_id`),
  KEY `tasks_meeting_id_meetings_id_fk` (`meeting_id`),
  CONSTRAINT `tasks_assigned_to_user_id_users_id_fk` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `tasks_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `tasks_entity_id_entities_id_fk` FOREIGN KEY (`entity_id`) REFERENCES `entities` (`id`),
  CONSTRAINT `tasks_meeting_id_meetings_id_fk` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`),
  CONSTRAINT `tasks_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_activity_logs`
--

DROP TABLE IF EXISTS `user_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `user_action` enum('login','logout','view','create','update','delete','send','download','upload') NOT NULL,
  `description` text NOT NULL,
  `entity_type` text NOT NULL,
  `entity_id` int DEFAULT NULL,
  `ip_address` text,
  `user_agent` text,
  `metadata` json DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `user_activity_logs_user_id_users_id_fk` (`user_id`),
  CONSTRAINT `user_activity_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_activity_logs`
--

LOCK TABLES `user_activity_logs` WRITE;
/*!40000 ALTER TABLE `user_activity_logs` DISABLE KEYS */;
INSERT INTO `user_activity_logs` VALUES (6,1,'login','User logged in','user',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36','{\"source\": \"http://localhost:5000\"}','2025-06-05 18:41:55'),(7,1,'login','User logged in','user',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36','{\"source\": \"http://localhost:5000\"}','2025-06-05 18:55:22'),(8,1,'login','User logged in','user',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36','{\"source\": \"http://localhost:5000\"}','2025-06-05 19:08:56'),(9,1,'login','User logged in','user',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36','{\"source\": \"http://localhost:5000\"}','2025-06-05 19:13:12'),(10,1,'login','User logged in','user',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36','{\"source\": \"http://localhost:5000\"}','2025-06-05 19:20:10'),(11,1,'login','User logged in','user',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36','{\"source\": \"http://localhost:5000\"}','2025-06-05 19:27:12'),(12,1,'login','User logged in','user',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36','{\"source\": \"http://localhost:5000\"}','2025-06-05 19:28:06');
/*!40000 ALTER TABLE `user_activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_badges`
--

DROP TABLE IF EXISTS `user_badges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_badges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `badge_id` int NOT NULL,
  `earned_at` timestamp NOT NULL DEFAULT (now()),
  `progress` json DEFAULT NULL,
  `featured` tinyint(1) DEFAULT '0',
  `seen` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_badges_user_id_users_id_fk` (`user_id`),
  KEY `user_badges_badge_id_achievement_badges_id_fk` (`badge_id`),
  CONSTRAINT `user_badges_badge_id_achievement_badges_id_fk` FOREIGN KEY (`badge_id`) REFERENCES `achievement_badges` (`id`),
  CONSTRAINT `user_badges_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_badges`
--

LOCK TABLES `user_badges` WRITE;
/*!40000 ALTER TABLE `user_badges` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_badges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` text NOT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` text NOT NULL,
  `role` enum('master_implementer','entity_head','entity_member') NOT NULL DEFAULT 'entity_member',
  `phone` text,
  `whatsapp` text,
  `telegram` text,
  `position` text,
  `entity_id` int DEFAULT NULL,
  `require_password_change` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_entity_id_entities_id_fk` (`entity_id`),
  CONSTRAINT `users_entity_id_entities_id_fk` FOREIGN KEY (`entity_id`) REFERENCES `entities` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','5f4c3fb9abda1e7bb585bf6c3b426f2793141b242a2f49b24fd955d9a41a8b88725ec75b86c39dfead5bfb480617728dea89a52d9047e4967bb89c76f2c5b511.9a624772ab6eb75b92d9d2d4136aa495','admin@comunigov.com','System Administrator','master_implementer',NULL,NULL,NULL,'System Administrator',NULL,0),(2,'slash','aef4bf304239874ba9fcd491443feccf7a7c207b5fab2b1eade7d7c25913cb3c0dadb9e1160318c998de530804bd05286d9fca3b7c76f0b31ce8bff2a0bbea48.1ee54aa364ef9f2490b5bbbf3eb9f643','loirjunior@detran.sc.gov.br','Slash','entity_member','+5551999701152',NULL,NULL,'guitarrista',2,0);
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

-- Dump completed on 2025-06-08 19:37:36
