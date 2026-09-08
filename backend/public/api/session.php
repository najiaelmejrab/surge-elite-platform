<?php
/**
 * Surge Elite Basketball Platform - Session Verification API
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['user']) || empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'loggedIn' => false,
        'role'     => null,
        'message'  => 'Not authenticated'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

http_response_code(200);
echo json_encode([
    'loggedIn' => true,
    'role'     => $_SESSION['user']['role'] ?? null,
    'user'     => $_SESSION['user']
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
exit;
