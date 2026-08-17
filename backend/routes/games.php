<?php
/**
 * Games Route Dispatcher
 * Maps HTTP requests to GameController methods
 */

require_once __DIR__ . '/../controllers/GameController.php';

function dispatchGameRoutes(): void {
    $controller = new GameController();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $action = $_GET['action'] ?? null;
    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    // Handle method override for HTML forms or clients without PUT/DELETE support
    if ($method === 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
        $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
    }

    switch ($method) {
        case 'GET':
            if ($action === 'metadata') {
                $controller->metadata();
            } elseif ($action === 'roster') {
                $teamId = isset($_GET['team_id']) ? (int)$_GET['team_id'] : 0;
                $seasonId = isset($_GET['season_id']) ? (int)$_GET['season_id'] : null;
                $controller->roster($teamId, $seasonId);
            } elseif ($id !== null && $id > 0) {
                $controller->show($id);
            } else {
                $controller->index();
            }
            break;

        case 'POST':
            if ($action === 'save_quarters' && $id !== null && $id > 0) {
                $controller->saveQuarterScores($id);
            } elseif ($action === 'save_stats' && $id !== null && $id > 0) {
                $controller->savePlayerStats($id);
            } else {
                $controller->store();
            }
            break;

        case 'PUT':
        case 'PATCH':
            if ($id !== null && $id > 0) {
                $controller->update($id);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing game ID for update']);
            }
            break;

        case 'DELETE':
            if ($id !== null && $id > 0) {
                $controller->destroy($id);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing game ID for deletion']);
            }
            break;

        case 'OPTIONS':
            // Preflight CORS request
            http_response_code(204);
            exit;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => "Method {$method} not allowed"]);
            break;
    }
}
