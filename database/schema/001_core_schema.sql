-- ============================================================================
-- Surge Elite Basketball Platform - Database Schema
-- Milestone 6: Core Database Schema
-- Milestone 7: Game Management Extension
-- Target DBMS: MariaDB / MySQL (Compatible with phpMyAdmin import)
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ----------------------------------------------------------------------------
-- Drop existing tables in reverse dependency order
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `player_game_stats`;
DROP TABLE IF EXISTS `game_quarters`;
DROP TABLE IF EXISTS `games`;
DROP TABLE IF EXISTS `venues`;
DROP TABLE IF EXISTS `team_memberships`;
DROP TABLE IF EXISTS `coaches`;
DROP TABLE IF EXISTS `players`;
DROP TABLE IF EXISTS `teams`;
DROP TABLE IF EXISTS `seasons`;
DROP TABLE IF EXISTS `leagues`;
DROP TABLE IF EXISTS `organizations`;
DROP TABLE IF EXISTS `users`;

-- ============================================================================
-- 1. USERS TABLE
-- Stores account credentials, authentication details, and platform access roles
-- ============================================================================
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NULL DEFAULT NULL,
  `role` ENUM('player', 'coach', 'admin') NOT NULL DEFAULT 'player',
  `avatar_url` VARCHAR(255) NULL DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `remember_token` VARCHAR(100) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. ORGANIZATIONS TABLE
-- Governing bodies or sports entities managing leagues and operations
-- ============================================================================
CREATE TABLE `organizations` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `logo_url` VARCHAR(255) NULL DEFAULT NULL,
  `website` VARCHAR(255) NULL DEFAULT NULL,
  `email` VARCHAR(191) NULL DEFAULT NULL,
  `phone` VARCHAR(30) NULL DEFAULT NULL,
  `city` VARCHAR(100) NULL DEFAULT NULL,
  `state` VARCHAR(100) NULL DEFAULT NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'USA',
  `primary_contact_user_id` INT NULL DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_organizations_slug` (`slug`),
  INDEX `idx_organizations_status` (`status`),
  CONSTRAINT `fk_organizations_primary_contact`
    FOREIGN KEY (`primary_contact_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. LEAGUES TABLE
-- Specific basketball leagues organized under an organization
-- ============================================================================
CREATE TABLE `leagues` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `organization_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `gender` ENUM('men', 'women', 'coed') NOT NULL DEFAULT 'men',
  `skill_level` ENUM('open', 'pro-am', 'recreational', 'youth', 'elite') NOT NULL DEFAULT 'elite',
  `banner_image` VARCHAR(255) NULL DEFAULT NULL,
  `logo_url` VARCHAR(255) NULL DEFAULT NULL,
  `status` ENUM('active', 'upcoming', 'completed', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leagues_org_slug` (`organization_id`, `slug`),
  INDEX `idx_leagues_organization_id` (`organization_id`),
  INDEX `idx_leagues_status` (`status`),
  INDEX `idx_leagues_gender` (`gender`),
  INDEX `idx_leagues_skill_level` (`skill_level`),
  CONSTRAINT `fk_leagues_organization`
    FOREIGN KEY (`organization_id`)
    REFERENCES `organizations` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. SEASONS TABLE
-- Operational seasonal cycles for leagues (e.g. Summer 2026, Winter 2026)
-- ============================================================================
CREATE TABLE `seasons` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `league_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `registration_start` DATE NULL DEFAULT NULL,
  `registration_end` DATE NULL DEFAULT NULL,
  `status` ENUM('upcoming', 'regular_season', 'playoffs', 'completed', 'archived') NOT NULL DEFAULT 'upcoming',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_seasons_league_slug` (`league_id`, `slug`),
  INDEX `idx_seasons_league_id` (`league_id`),
  INDEX `idx_seasons_status` (`status`),
  INDEX `idx_seasons_dates` (`start_date`, `end_date`),
  CONSTRAINT `fk_seasons_league`
    FOREIGN KEY (`league_id`)
    REFERENCES `leagues` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. TEAMS TABLE
-- Teams competing in specific leagues and seasons
-- ============================================================================
CREATE TABLE `teams` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `organization_id` INT NULL DEFAULT NULL,
  `league_id` INT NOT NULL,
  `season_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `division` VARCHAR(50) NULL DEFAULT NULL,
  `logo_url` VARCHAR(255) NULL DEFAULT NULL,
  `primary_color` VARCHAR(20) NOT NULL DEFAULT '#00E5FF',
  `secondary_color` VARCHAR(20) NOT NULL DEFAULT '#FF0055',
  `home_city` VARCHAR(100) NULL DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'disbanded') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teams_season_slug` (`season_id`, `slug`),
  INDEX `idx_teams_organization_id` (`organization_id`),
  INDEX `idx_teams_league_id` (`league_id`),
  INDEX `idx_teams_season_id` (`season_id`),
  INDEX `idx_teams_division` (`division`),
  INDEX `idx_teams_status` (`status`),
  CONSTRAINT `fk_teams_organization`
    FOREIGN KEY (`organization_id`)
    REFERENCES `organizations` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_teams_league`
    FOREIGN KEY (`league_id`)
    REFERENCES `leagues` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_teams_season`
    FOREIGN KEY (`season_id`)
    REFERENCES `seasons` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. PLAYERS TABLE
-- Player athlete profiles and attributes
-- ============================================================================
CREATE TABLE `players` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `user_id` INT NULL DEFAULT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `jersey_number` VARCHAR(10) NULL DEFAULT NULL,
  `position` ENUM('PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'G/F', 'F/C') NULL DEFAULT NULL,
  `height` VARCHAR(20) NULL DEFAULT NULL,
  `weight` VARCHAR(20) NULL DEFAULT NULL,
  `date_of_birth` DATE NULL DEFAULT NULL,
  `experience_years` INT NOT NULL DEFAULT 0,
  `college_or_highschool` VARCHAR(150) NULL DEFAULT NULL,
  `bio` TEXT NULL DEFAULT NULL,
  `avatar_url` VARCHAR(255) NULL DEFAULT NULL,
  `status` ENUM('active', 'injured', 'inactive', 'free_agent') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_players_user_id` (`user_id`),
  INDEX `idx_players_position` (`position`),
  INDEX `idx_players_status` (`status`),
  INDEX `idx_players_name` (`last_name`, `first_name`),
  CONSTRAINT `fk_players_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. COACHES TABLE
-- Coaching staff profiles and credentials
-- ============================================================================
CREATE TABLE `coaches` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `user_id` INT NULL DEFAULT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `role_title` VARCHAR(100) NOT NULL DEFAULT 'Head Coach',
  `experience_years` INT NOT NULL DEFAULT 0,
  `bio` TEXT NULL DEFAULT NULL,
  `phone` VARCHAR(30) NULL DEFAULT NULL,
  `avatar_url` VARCHAR(255) NULL DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_coaches_user_id` (`user_id`),
  INDEX `idx_coaches_status` (`status`),
  INDEX `idx_coaches_name` (`last_name`, `first_name`),
  CONSTRAINT `fk_coaches_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. TEAM_MEMBERSHIPS TABLE
-- Roster assignments linking players and coaches to teams per season
-- ============================================================================
CREATE TABLE `team_memberships` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `team_id` INT NOT NULL,
  `season_id` INT NOT NULL,
  `player_id` INT NULL DEFAULT NULL,
  `coach_id` INT NULL DEFAULT NULL,
  `member_type` ENUM('player', 'coach', 'staff') NOT NULL DEFAULT 'player',
  `jersey_number` VARCHAR(10) NULL DEFAULT NULL,
  `position` VARCHAR(50) NULL DEFAULT NULL,
  `role_title` VARCHAR(100) NULL DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'benched', 'injured', 'transferred') NOT NULL DEFAULT 'active',
  `joined_at` DATE NULL DEFAULT NULL,
  `left_at` DATE NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_memberships_player_team_season` (`team_id`, `season_id`, `player_id`),
  UNIQUE KEY `uq_memberships_coach_team_season` (`team_id`, `season_id`, `coach_id`),
  INDEX `idx_memberships_team_id` (`team_id`),
  INDEX `idx_memberships_season_id` (`season_id`),
  INDEX `idx_memberships_player_id` (`player_id`),
  INDEX `idx_memberships_coach_id` (`coach_id`),
  INDEX `idx_memberships_member_type` (`member_type`),
  INDEX `idx_memberships_status` (`status`),
  CONSTRAINT `fk_memberships_team`
    FOREIGN KEY (`team_id`)
    REFERENCES `teams` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_memberships_season`
    FOREIGN KEY (`season_id`)
    REFERENCES `seasons` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_memberships_player`
    FOREIGN KEY (`player_id`)
    REFERENCES `players` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_memberships_coach`
    FOREIGN KEY (`coach_id`)
    REFERENCES `coaches` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. VENUES TABLE
-- Stadiums, arenas, and court facilities hosting games
-- ============================================================================
CREATE TABLE `venues` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `address` VARCHAR(255) NULL DEFAULT NULL,
  `city` VARCHAR(100) NULL DEFAULT NULL,
  `state` VARCHAR(100) NULL DEFAULT NULL,
  `postal_code` VARCHAR(20) NULL DEFAULT NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'USA',
  `capacity` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_venues_city` (`city`),
  INDEX `idx_venues_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. GAMES TABLE
-- Scheduled, live, and completed basketball fixtures
-- ============================================================================
CREATE TABLE `games` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `season_id` INT NOT NULL,
  `league_id` INT NOT NULL,
  `home_team_id` INT NOT NULL,
  `away_team_id` INT NOT NULL,
  `venue_id` INT NULL DEFAULT NULL,
  `game_date` DATE NOT NULL,
  `game_time` TIME NULL DEFAULT NULL,
  `status` ENUM('scheduled', 'live', 'completed') NOT NULL DEFAULT 'scheduled',
  `home_score` INT NOT NULL DEFAULT 0,
  `away_score` INT NOT NULL DEFAULT 0,
  `current_quarter` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_games_season_id` (`season_id`),
  INDEX `idx_games_league_id` (`league_id`),
  INDEX `idx_games_home_team_id` (`home_team_id`),
  INDEX `idx_games_away_team_id` (`away_team_id`),
  INDEX `idx_games_venue_id` (`venue_id`),
  INDEX `idx_games_status` (`status`),
  INDEX `idx_games_schedule` (`game_date`, `game_time`),
  CONSTRAINT `fk_games_season`
    FOREIGN KEY (`season_id`)
    REFERENCES `seasons` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_games_league`
    FOREIGN KEY (`league_id`)
    REFERENCES `leagues` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_games_home_team`
    FOREIGN KEY (`home_team_id`)
    REFERENCES `teams` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_games_away_team`
    FOREIGN KEY (`away_team_id`)
    REFERENCES `teams` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_games_venue`
    FOREIGN KEY (`venue_id`)
    REFERENCES `venues` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. GAME_QUARTERS TABLE
-- Period-by-period scoring breakdown per game
-- ============================================================================
CREATE TABLE `game_quarters` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `game_id` INT NOT NULL,
  `quarter_number` INT NOT NULL,
  `home_points` INT NOT NULL DEFAULT 0,
  `away_points` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_game_quarter` (`game_id`, `quarter_number`),
  INDEX `idx_game_quarters_game_id` (`game_id`),
  CONSTRAINT `fk_game_quarters_game`
    FOREIGN KEY (`game_id`)
    REFERENCES `games` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. PLAYER_GAME_STATS TABLE
-- Comprehensive individual player box score metrics for a game
-- ============================================================================
CREATE TABLE `player_game_stats` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `game_id` INT NOT NULL,
  `player_id` INT NOT NULL,
  `team_id` INT NOT NULL,
  `minutes` INT NOT NULL DEFAULT 0,
  `points` INT NOT NULL DEFAULT 0,
  `rebounds` INT NOT NULL DEFAULT 0,
  `offensive_rebounds` INT NOT NULL DEFAULT 0,
  `defensive_rebounds` INT NOT NULL DEFAULT 0,
  `assists` INT NOT NULL DEFAULT 0,
  `steals` INT NOT NULL DEFAULT 0,
  `blocks` INT NOT NULL DEFAULT 0,
  `turnovers` INT NOT NULL DEFAULT 0,
  `fouls` INT NOT NULL DEFAULT 0,
  `field_goals_made` INT NOT NULL DEFAULT 0,
  `field_goals_attempted` INT NOT NULL DEFAULT 0,
  `three_pointers_made` INT NOT NULL DEFAULT 0,
  `three_pointers_attempted` INT NOT NULL DEFAULT 0,
  `free_throws_made` INT NOT NULL DEFAULT 0,
  `free_throws_attempted` INT NOT NULL DEFAULT 0,
  `plus_minus` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_player_game_stat` (`game_id`, `player_id`),
  INDEX `idx_stats_game_id` (`game_id`),
  INDEX `idx_stats_player_id` (`player_id`),
  INDEX `idx_stats_team_id` (`team_id`),
  CONSTRAINT `fk_player_game_stats_game`
    FOREIGN KEY (`game_id`)
    REFERENCES `games` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_player_game_stats_player`
    FOREIGN KEY (`player_id`)
    REFERENCES `players` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_player_game_stats_team`
    FOREIGN KEY (`team_id`)
    REFERENCES `teams` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
