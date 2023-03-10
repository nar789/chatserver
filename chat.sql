-- MySQL dump 10.13  Distrib 8.0.21, for Win64 (x86_64)
--
-- Host: localhost    Database: chat
-- ------------------------------------------------------
-- Server version	8.0.21



CREATE TABLE `conversation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `thumbnail` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `last_message_id` int DEFAULT NULL,
  `user_count` int DEFAULT NULL,
  PRIMARY KEY (`id`)
)


CREATE TABLE `message` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int DEFAULT NULL,
  `user_id` text DEFAULT NULL,
  `message_type` int DEFAULT NULL,
  `message` text,
  `updated` timestamp NULL DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
)


CREATE TABLE `read_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int DEFAULT NULL,
  `user_id` text DEFAULT NULL,
  `last_message_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
)


CREATE TABLE `user_conversation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` text DEFAULT NULL,
  `conversation_id` int DEFAULT NULL,
  `is_block` tinyint(1) DEFAULT NULL,
  `is_alarm` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
)