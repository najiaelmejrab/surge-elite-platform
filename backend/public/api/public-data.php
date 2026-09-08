<?php
require_once __DIR__ . '/../../config/Database.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = Database::getConnection();
    $result = [];
    foreach (['leagues', 'teams', 'players', 'games'] as $table) {
        $rows = $db->query("SELECT * FROM `{$table}`")->fetchAll(PDO::FETCH_ASSOC);
        $result[$table] = [];
        foreach ($rows as $row) {
            $id = (string)($row['id'] ?? count($result[$table]));
            $result[$table][$id] = $row;
        }
    }
    echo json_encode(['success' => true, 'data' => $result]);
} catch (Exception $error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to load public data.']);
}
