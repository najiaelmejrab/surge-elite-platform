<?php
/**
 * Database Migration Script: Create player_development table
 */
require_once 'c:/Users/Najia/Documents/surgexelite/surge-elite-platform/backend/config/Database.php';

$db = Database::getConnection();

$sql = "CREATE TABLE IF NOT EXISTS `player_development` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `player_id` INT NOT NULL UNIQUE,
    `ppg` DECIMAL(5,2) DEFAULT 0.00,
    `apg` DECIMAL(5,2) DEFAULT 0.00,
    `rpg` DECIMAL(5,2) DEFAULT 0.00,
    `fg_pct` DECIMAL(5,2) DEFAULT 0.00,
    `three_pct` DECIMAL(5,2) DEFAULT 0.00,
    `usage_pct` DECIMAL(5,2) DEFAULT 0.00,
    `focus` VARCHAR(255) DEFAULT '',
    `workouts` VARCHAR(255) DEFAULT '',
    `recovery` VARCHAR(255) DEFAULT '',
    `next_session_date` DATE NULL,
    `next_session_time` TIME NULL,
    `availability` VARCHAR(100) DEFAULT 'Available',
    `next_game` VARCHAR(255) DEFAULT '',
    `next_practice_date` DATE NULL,
    `next_practice_time` TIME NULL,
    `season_goal` TEXT NULL,
    `immediate_goal` TEXT NULL,
    `action_plan` TEXT NULL,
    `overall_progress` INT DEFAULT 0,
    `readiness` INT DEFAULT 0,
    `summary` TEXT NULL,
    `created_by_user_id` INT NULL,
    `updated_by_user_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

$db->exec($sql);
echo "Table `player_development` created or verified successfully.\n";
