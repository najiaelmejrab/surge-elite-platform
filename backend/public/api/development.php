<?php
/**
 * Surge Elite Basketball Platform - Admin & Coach Player Development API
 * Endpoint for viewing and managing player development profiles, performance metrics,
 * training schedules, goals, and progress.
 * Server-side protection: Admin or Coach ONLY.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../../config/Database.php';

function surgeDevJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

// -----------------------------------------------------------------------------
// 1. Authentication & Role Protection (ADMIN OR COACH ONLY)
// -----------------------------------------------------------------------------
if (empty($_SESSION['user']) || empty($_SESSION['user_id'])) {
    surgeDevJson([
        'success' => false,
        'message' => 'Authentication required'
    ], 401);
}

$currentUserRole = strtolower(trim((string)($_SESSION['user']['role'] ?? '')));
if ($currentUserRole !== 'admin' && $currentUserRole !== 'coach') {
    surgeDevJson([
        'success' => false,
        'message' => 'Forbidden: Administrator or Coach privileges required'
    ], 403);
}

// Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$db = Database::getConnection();

// Ensure player_development table exists
$db->exec("CREATE TABLE IF NOT EXISTS `player_development` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

function surgeAuditLabel(?string $firstName, ?string $lastName, ?string $role): string {
    $first = trim((string)$firstName);
    $last = trim((string)$lastName);
    $name = trim($first . ' ' . $last);
    $r = strtolower(trim((string)$role));
    if ($name === '') {
        return $r === 'coach' ? 'Coach Staff' : 'System Administrator';
    }
    if (stripos($name, 'coach') === 0 || stripos($name, 'admin') === 0) {
        return $name;
    }
    if ($r === 'coach') {
        return 'Coach ' . $name;
    }
    if ($r === 'admin') {
        return 'Admin ' . $name;
    }
    return $name;
}

// -----------------------------------------------------------------------------
// 2. GET Endpoint: List All Players & Their Development Data
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->query(
        "SELECT 
            p.id AS player_id,
            p.user_id,
            p.first_name,
            p.last_name,
            p.jersey_number,
            p.position,
            p.status AS player_status,
            p.avatar_url,
            u.email AS user_email,
            t.name AS team_name,
            d.id AS dev_id,
            d.ppg, d.apg, d.rpg, d.fg_pct, d.three_pct, d.usage_pct,
            d.focus, d.workouts, d.recovery, d.next_session_date, d.next_session_time,
            d.availability, d.next_game, d.next_practice_date, d.next_practice_time,
            d.season_goal, d.immediate_goal, d.action_plan,
            d.overall_progress, d.readiness, d.summary,
            d.created_at AS dev_created_at, d.updated_at AS dev_updated_at,
            u_create.first_name AS creator_first_name,
            u_create.last_name AS creator_last_name,
            u_create.role AS creator_role,
            u_update.first_name AS updater_first_name,
            u_update.last_name AS updater_last_name,
            u_update.role AS updater_role
         FROM players p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN team_memberships tm ON tm.player_id = p.id AND tm.status = 'active'
         LEFT JOIN teams t ON t.id = tm.team_id
         LEFT JOIN player_development d ON d.player_id = p.id
         LEFT JOIN users u_create ON u_create.id = d.created_by_user_id
         LEFT JOIN users u_update ON u_update.id = d.updated_by_user_id
         ORDER BY p.last_name ASC, p.first_name ASC"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $players = [];
    $teamsList = [];

    foreach ($rows as $row) {
        $teamName = $row['team_name'] ?: 'Free Agent / Unassigned';
        if ($row['team_name'] && !in_array($row['team_name'], $teamsList, true)) {
            $teamsList[] = $row['team_name'];
        }

        $creatorLabel = surgeAuditLabel(
            $row['creator_first_name'] ?? null,
            $row['creator_last_name'] ?? null,
            $row['creator_role'] ?? null
        );

        $updaterLabel = surgeAuditLabel(
            $row['updater_first_name'] ?? null,
            $row['updater_last_name'] ?? null,
            $row['updater_role'] ?? null
        );

        $nextSessionTime = $row['next_session_time'] ? substr($row['next_session_time'], 0, 5) : '';
        $nextPracticeTime = $row['next_practice_time'] ? substr($row['next_practice_time'], 0, 5) : '';

        $players[] = [
            'id' => (int)$row['player_id'],
            'user_id' => (int)$row['user_id'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'name' => trim($row['first_name'] . ' ' . $row['last_name']),
            'email' => $row['user_email'],
            'position' => $row['position'] ?: 'Player',
            'jersey_number' => $row['jersey_number'],
            'status' => $row['player_status'] ?: 'active',
            'teamName' => $teamName,
            'development' => [
                'id' => $row['dev_id'] ? (int)$row['dev_id'] : null,
                'performance' => [
                    'ppg' => (float)($row['ppg'] ?? 0.0),
                    'apg' => (float)($row['apg'] ?? 0.0),
                    'rpg' => (float)($row['rpg'] ?? 0.0),
                    'fgPct' => (float)($row['fg_pct'] ?? 0.0),
                    'threePct' => (float)($row['three_pct'] ?? 0.0),
                    'usage' => (float)($row['usage_pct'] ?? 0.0),
                ],
                'training' => [
                    'focus' => $row['focus'] ?? '',
                    'workouts' => $row['workouts'] ?? '',
                    'recovery' => $row['recovery'] ?? '',
                    'nextSessionDate' => $row['next_session_date'] ?? '',
                    'nextSessionTime' => $nextSessionTime,
                ],
                'schedule' => [
                    'availability' => $row['availability'] ?? 'Available',
                    'nextGame' => $row['next_game'] ?? '',
                    'nextPracticeDate' => $row['next_practice_date'] ?? '',
                    'nextPracticeTime' => $nextPracticeTime,
                ],
                'goals' => [
                    'seasonGoal' => $row['season_goal'] ?? '',
                    'immediateGoal' => $row['immediate_goal'] ?? '',
                    'actionPlan' => $row['action_plan'] ?? '',
                ],
                'progress' => [
                    'overall' => (int)($row['overall_progress'] ?? 0),
                    'readiness' => (int)($row['readiness'] ?? 0),
                    'summary' => $row['summary'] ?? '',
                ],
                'audit' => [
                    'createdBy' => $creatorLabel,
                    'createdAt' => $row['dev_created_at'] ?? null,
                    'updatedBy' => $updaterLabel,
                    'updatedAt' => $row['dev_updated_at'] ?? null,
                ]
            ]
        ];
    }

    sort($teamsList);

    surgeDevJson([
        'success' => true,
        'players' => $players,
        'teams' => $teamsList
    ]);
}

// -----------------------------------------------------------------------------
// 3. POST Endpoint: Update Player Development Data
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    surgeDevJson(['success' => false, 'message' => 'Method not allowed'], 405);
}

$payload = $_POST;
if (empty($payload) && !empty($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $jsonInput = json_decode((string)file_get_contents('php://input'), true);
    if (is_array($jsonInput)) {
        $payload = $jsonInput;
    }
}

$playerId = (int)($payload['player_id'] ?? $payload['id'] ?? 0);
if ($playerId <= 0) {
    surgeDevJson(['success' => false, 'message' => 'Player ID is required.'], 422);
}

// Verify player exists in players table
$pStmt = $db->prepare('SELECT id FROM players WHERE id = :id LIMIT 1');
$pStmt->execute(['id' => $playerId]);
if (!$pStmt->fetch()) {
    surgeDevJson(['success' => false, 'message' => 'Player record not found.'], 404);
}

// Extract fields
$ppg          = (float)($payload['ppg'] ?? $payload['performance']['ppg'] ?? 0.0);
$apg          = (float)($payload['apg'] ?? $payload['performance']['apg'] ?? 0.0);
$rpg          = (float)($payload['rpg'] ?? $payload['performance']['rpg'] ?? 0.0);
$fgPct        = (float)($payload['fg_pct'] ?? $payload['performance']['fgPct'] ?? 0.0);
$threePct     = (float)($payload['three_pct'] ?? $payload['performance']['threePct'] ?? 0.0);
$usagePct     = (float)($payload['usage_pct'] ?? $payload['performance']['usage'] ?? 0.0);

$focus        = trim((string)($payload['focus'] ?? $payload['training']['focus'] ?? ''));
$workouts     = trim((string)($payload['workouts'] ?? $payload['training']['workouts'] ?? ''));
$recovery     = trim((string)($payload['recovery'] ?? $payload['training']['recovery'] ?? ''));
$nextSessDate = trim((string)($payload['next_session_date'] ?? $payload['training']['nextSessionDate'] ?? ''));
$nextSessTime = trim((string)($payload['next_session_time'] ?? $payload['training']['nextSessionTime'] ?? ''));

$availability = trim((string)($payload['availability'] ?? $payload['schedule']['availability'] ?? 'Available'));
$nextGame     = trim((string)($payload['next_game'] ?? $payload['schedule']['nextGame'] ?? ''));
$nextPracDate = trim((string)($payload['next_practice_date'] ?? $payload['schedule']['nextPracticeDate'] ?? ''));
$nextPracTime = trim((string)($payload['next_practice_time'] ?? $payload['schedule']['nextPracticeTime'] ?? ''));

$seasonGoal    = trim((string)($payload['season_goal'] ?? $payload['goals']['seasonGoal'] ?? ''));
$immediateGoal = trim((string)($payload['immediate_goal'] ?? $payload['goals']['immediateGoal'] ?? ''));
$actionPlan    = trim((string)($payload['action_plan'] ?? $payload['goals']['actionPlan'] ?? ''));

$overallProg   = (int)($payload['overall_progress'] ?? $payload['progress']['overall'] ?? 0);
$readiness     = (int)($payload['readiness'] ?? $payload['progress']['readiness'] ?? 0);
$summary       = trim((string)($payload['summary'] ?? $payload['progress']['summary'] ?? ''));

$currentUserId = (int)$_SESSION['user_id'];

$stmt = $db->prepare(
    "INSERT INTO player_development (
        player_id, ppg, apg, rpg, fg_pct, three_pct, usage_pct,
        focus, workouts, recovery, next_session_date, next_session_time,
        availability, next_game, next_practice_date, next_practice_time,
        season_goal, immediate_goal, action_plan,
        overall_progress, readiness, summary,
        created_by_user_id, updated_by_user_id
    ) VALUES (
        :player_id, :ppg, :apg, :rpg, :fg_pct, :three_pct, :usage_pct,
        :focus, :workouts, :recovery, :next_session_date, :next_session_time,
        :availability, :next_game, :next_practice_date, :next_practice_time,
        :season_goal, :immediate_goal, :action_plan,
        :overall_progress, :readiness, :summary,
        :created_by, :updated_by
    ) ON DUPLICATE KEY UPDATE
        ppg = VALUES(ppg),
        apg = VALUES(apg),
        rpg = VALUES(rpg),
        fg_pct = VALUES(fg_pct),
        three_pct = VALUES(three_pct),
        usage_pct = VALUES(usage_pct),
        focus = VALUES(focus),
        workouts = VALUES(workouts),
        recovery = VALUES(recovery),
        next_session_date = VALUES(next_session_date),
        next_session_time = VALUES(next_session_time),
        availability = VALUES(availability),
        next_game = VALUES(next_game),
        next_practice_date = VALUES(next_practice_date),
        next_practice_time = VALUES(next_practice_time),
        season_goal = VALUES(season_goal),
        immediate_goal = VALUES(immediate_goal),
        action_plan = VALUES(action_plan),
        overall_progress = VALUES(overall_progress),
        readiness = VALUES(readiness),
        summary = VALUES(summary),
        updated_by_user_id = VALUES(updated_by_user_id),
        updated_at = CURRENT_TIMESTAMP"
);

$stmt->execute([
    'player_id'          => $playerId,
    'ppg'                => $ppg,
    'apg'                => $apg,
    'rpg'                => $rpg,
    'fg_pct'             => $fgPct,
    'three_pct'          => $threePct,
    'usage_pct'          => $usagePct,
    'focus'              => $focus,
    'workouts'           => $workouts,
    'recovery'           => $recovery,
    'next_session_date'  => $nextSessDate !== '' ? $nextSessDate : null,
    'next_session_time'  => $nextSessTime !== '' ? $nextSessTime : null,
    'availability'       => $availability,
    'next_game'          => $nextGame,
    'next_practice_date' => $nextPracDate !== '' ? $nextPracDate : null,
    'next_practice_time' => $nextPracTime !== '' ? $nextPracTime : null,
    'season_goal'        => $seasonGoal,
    'immediate_goal'     => $immediateGoal,
    'action_plan'        => $actionPlan,
    'overall_progress'   => $overallProg,
    'readiness'          => $readiness,
    'summary'            => $summary,
    'created_by'         => $currentUserId,
    'updated_by'         => $currentUserId,
]);

surgeDevJson([
    'success' => true,
    'message' => 'Player development record updated successfully.'
]);
