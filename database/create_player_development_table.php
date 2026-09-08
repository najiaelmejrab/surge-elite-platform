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

// Seed default development records for any players missing one
$players = $db->query("SELECT p.id, p.user_id, p.first_name, p.last_name FROM players p")->fetchAll(PDO::FETCH_ASSOC);

foreach ($players as $player) {
    $pid = (int)$player['id'];
    $check = $db->prepare("SELECT id FROM player_development WHERE player_id = :pid");
    $check->execute(['pid' => $pid]);
    if (!$check->fetch()) {
        $stmt = $db->prepare("INSERT INTO player_development 
            (player_id, ppg, apg, rpg, fg_pct, three_pct, usage_pct, focus, workouts, recovery, next_session_date, next_session_time, availability, next_game, next_practice_date, next_practice_time, season_goal, immediate_goal, action_plan, overall_progress, readiness, summary, created_by_user_id, updated_by_user_id)
            VALUES
            (:pid, 24.8, 9.4, 6.2, 58.0, 41.0, 34.0, 'Ball handling and finishing', '4 sessions / week', 'On track', '2026-09-12', '18:15:00', 'Available', 'Next game TBD', '2026-09-13', '18:00:00', 'Lead team in assists and efficiency', 'Improve transition decisions', 'Daily film + extra ball-handling work', 88, 91, 'Strong development curve with growth in tempo control and finishing.', 1, 1)");
        $stmt->execute(['pid' => $pid]);
        echo "Seeded default development record for player ID #{$pid} ({$player['first_name']} {$player['last_name']}).\n";
    }
}
