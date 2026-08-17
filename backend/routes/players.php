<?php
/**
 * Players Route Dispatcher
 * Maps HTTP requests to PlayerController methods
 */

require_once __DIR__ . '/../controllers/PlayerController.php';

function dispatchPlayerRoutes(): void {
    $controller = new PlayerController();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $action = $_GET['action'] ?? null;
    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    if ($method === 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
        $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
    }

    switch ($method) {
        case 'GET':
            if ($id !== null && $id > 0) {
                $controller->show($id);
            } else {
                $controller->index();
            }
            break;

        case 'POST':
            if ($action === 'restore' && $id !== null && $id > 0) {
                $controller->restore($id);
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
                echo json_encode(['success' => false, 'message' => 'Player ID required for update']);
            }
            break;

        case 'DELETE':
            if ($id !== null && $id > 0) {
                $controller->destroy($id);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Player ID required for deletion']);
            }
            break;

        case 'OPTIONS':
            http_response_code(204);
            exit;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => "Method {$method} not allowed"]);
            break;
    }
}
