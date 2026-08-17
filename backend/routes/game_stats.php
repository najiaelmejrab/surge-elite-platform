<?php
/**
 * Game Stats Route Dispatcher
 * Dedicated route handler for quarter scores and player statistics operations
 */

require_once __DIR__ . '/../controllers/GameController.php';
require_once __DIR__ . '/../models/PlayerGameStat.php';

function dispatchGameStatsRoutes(): void {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $action = $_GET['action'] ?? null;
    $gameId = isset($_GET['game_id']) ? (int)$_GET['game_id'] : (isset($_GET['id']) ? (int)$_GET['id'] : null);
    $playerId = isset($_GET['player_id']) ? (int)$_GET['player_id'] : null;

    $db = Database::getConnection();
    $statModel = new PlayerGameStat($db);
    $controller = new GameController();

    switch ($method) {
        case 'GET':
            if ($playerId !== null && $playerId > 0) {
                $stats = $statModel->getByPlayer($playerId);
                http_response_code(200);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => true, 'data' => $stats]);
            } elseif ($gameId !== null && $gameId > 0) {
                $teamId = isset($_GET['team_id']) ? (int)$_GET['team_id'] : null;
                $stats = $statModel->getByGame($gameId, $teamId);
                http_response_code(200);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => true, 'data' => $stats]);
            } else {
                http_response_code(400);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => false, 'message' => 'game_id or player_id is required']);
            }
            break;

        case 'POST':
            if ($action === 'quarters' && $gameId !== null) {
                $controller->saveQuarterScores($gameId);
            } elseif ($gameId !== null) {
                $controller->savePlayerStats($gameId);
            } else {
                http_response_code(400);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => false, 'message' => 'game_id is required']);
            }
            break;

        case 'OPTIONS':
            http_response_code(204);
            exit;

        default:
            http_response_code(405);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'message' => "Method {$method} not allowed"]);
            break;
    }
}
