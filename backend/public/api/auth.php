<?php
/**
 * Surge Elite Basketball Platform - Unified Authentication API
 * Single auth controller for Admin, Coach, and Player accounts using PHP Sessions & MySQL PDO.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../../config/Database.php';

/**
 * Send JSON response and terminate execution
 */
function surgeAuthJsonResponse(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Resolve relative redirect destination based on account role
 */
function surgeAuthRoleRedirect(string $role): string {
    $role = strtolower(trim($role));

    if ($role === 'admin' || $role === 'coach') {
        return 'admin/index.html';
    }

    if ($role === 'player') {
        return 'player-portal/index.html';
    }

    return 'login.html';
}

// Handle CORS / Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$db = Database::getConnection();

// -----------------------------------------------------------------------------
// 1. Session Check (GET request without action or action=session)
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET' && (!isset($_GET['action']) || $_GET['action'] === 'session' || $_GET['action'] === 'check')) {
    if (empty($_SESSION['user']) || empty($_SESSION['user_id'])) {
        surgeAuthJsonResponse([
            'loggedIn' => false,
            'role' => null,
            'message' => 'Not authenticated'
        ], 401);
    }

    surgeAuthJsonResponse([
        'loggedIn' => true,
        'role' => $_SESSION['user']['role'] ?? null,
        'user' => $_SESSION['user']
    ]);
}

// -----------------------------------------------------------------------------
// 2. Logout Handler (GET/POST ?action=logout)
// -----------------------------------------------------------------------------
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    session_destroy();

    // Check if JSON response is requested
    $acceptHeader = $_SERVER['HTTP_ACCEPT'] ?? '';
    $isJsonRequested = (stripos($acceptHeader, 'application/json') !== false) ||
                       (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest');

    if ($isJsonRequested) {
        surgeAuthJsonResponse([
            'success' => true,
            'message' => 'Logged out successfully.',
            'redirect' => 'login.html'
        ]);
    }

    // Direct browser redirect to login.html
    header('Location: ../../../frontend/login.html', true, 302);
    exit;
}

// -----------------------------------------------------------------------------
// 3. POST Actions (Login & Player Registration)
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    surgeAuthJsonResponse([
        'success' => false,
        'message' => 'Method not allowed'
    ], 405);
}

// Parse payload from POST or JSON input
$payload = $_POST;
if (empty($payload) && !empty($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $jsonInput = json_decode((string)file_get_contents('php://input'), true);
    if (is_array($jsonInput)) {
        $payload = $jsonInput;
    }
}

$action = strtolower(trim((string)($_GET['action'] ?? $payload['action'] ?? 'login')));

// -----------------------------------------------------------------------------
// 3A. Player Registration Action
// -----------------------------------------------------------------------------
if ($action === 'register') {
    $firstName = trim((string)($payload['first_name'] ?? ''));
    $lastName = trim((string)($payload['last_name'] ?? ''));
    $email = trim((string)($payload['email'] ?? ''));
    $password = (string)($payload['password'] ?? '');
    $confirmPassword = (string)($payload['confirm_password'] ?? '');
    $phone = trim((string)($payload['phone'] ?? ''));

    if ($firstName === '' || $lastName === '' || $email === '' || $password === '') {
        surgeAuthJsonResponse([
            'success' => false,
            'message' => 'First name, last name, email, and password are required.'
        ], 422);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        surgeAuthJsonResponse([
            'success' => false,
            'message' => 'Please provide a valid email address.'
        ], 422);
    }

    if (strlen($password) < 8) {
        surgeAuthJsonResponse([
            'success' => false,
            'message' => 'Password must be at least 8 characters long.'
        ], 422);
    }

    if ($confirmPassword !== '' && $password !== $confirmPassword) {
        surgeAuthJsonResponse([
            'success' => false,
            'message' => 'Passwords do not match.'
        ], 422);
    }

    // Check for existing account with the same email
    $emailCheck = $db->prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1');
    $emailCheck->execute(['email' => $email]);
    if ($emailCheck->fetch()) {
        surgeAuthJsonResponse([
            'success' => false,
            'message' => 'An account with that email already exists.'
        ], 409);
    }

    // Create user and linked player record in transaction
    $db->beginTransaction();
    try {
        $userInsert = $db->prepare(
            'INSERT INTO users (first_name, last_name, email, password, phone, role, status) VALUES (:first_name, :last_name, :email, :password, :phone, :role, :status)'
        );
        $userInsert->execute([
            'first_name' => $firstName,
            'last_name'  => $lastName,
            'email'      => strtolower($email),
            'password'   => password_hash($password, PASSWORD_DEFAULT),
            'phone'      => $phone !== '' ? $phone : null,
            'role'       => 'player',
            'status'     => 'active'
        ]);

        $userId = (int)$db->lastInsertId();

        $playerInsert = $db->prepare(
            'INSERT INTO players (user_id, first_name, last_name, status) VALUES (:user_id, :first_name, :last_name, :status)'
        );
        $playerInsert->execute([
            'user_id'    => $userId,
            'first_name' => $firstName,
            'last_name'  => $lastName,
            'status'     => 'active'
        ]);

        $playerId = (int)$db->lastInsertId();

        $db->commit();

        // Initialize PHP session for the new player
        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id'         => $userId,
            'first_name' => $firstName,
            'last_name'  => $lastName,
            'email'      => strtolower($email),
            'role'       => 'player',
            'player_id'  => $playerId,
            'avatar_url' => null,
        ];
        $_SESSION['user_id'] = $userId;
        $_SESSION['role'] = 'player';

        surgeAuthJsonResponse([
            'success'  => true,
            'message'  => 'Player account created successfully.',
            'redirect' => 'player-portal/index.html',
            'role'     => 'player',
            'user'     => $_SESSION['user']
        ], 201);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        surgeAuthJsonResponse([
            'success' => false,
            'message' => 'Registration failed: ' . $e->getMessage()
        ], 500);
    }
}

// -----------------------------------------------------------------------------
// 3B. Unified Login Action (Admin, Coach, Player)
// -----------------------------------------------------------------------------
$email = trim((string)($payload['email'] ?? ''));
$password = (string)($payload['password'] ?? '');

if ($email === '' || $password === '') {
    surgeAuthJsonResponse([
        'success' => false,
        'message' => 'Email and password are required.'
    ], 422);
}

// Query user and optional linked player record
$stmt = $db->prepare(
    'SELECT u.*, p.id AS player_id
     FROM users u
     LEFT JOIN players p ON p.user_id = u.id
     WHERE LOWER(u.email) = LOWER(:email)
     LIMIT 1'
);
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    surgeAuthJsonResponse([
        'success' => false,
        'message' => 'Invalid email or password.'
    ], 401);
}

if (($user['status'] ?? 'inactive') !== 'active') {
    surgeAuthJsonResponse([
        'success' => false,
        'message' => 'Your account is not active. Please contact platform administrators.'
    ], 403);
}

// Successful authentication: regenerate session ID and store user data
session_regenerate_id(true);

$userRole = strtolower(trim((string)$user['role']));

$_SESSION['user'] = [
    'id'         => (int)$user['id'],
    'first_name' => $user['first_name'],
    'last_name'  => $user['last_name'],
    'email'      => $user['email'],
    'role'       => $userRole,
    'player_id'  => !empty($user['player_id']) ? (int)$user['player_id'] : null,
    'avatar_url' => $user['avatar_url'] ?? null,
];
$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['role'] = $userRole;

$redirectUrl = surgeAuthRoleRedirect($userRole);

surgeAuthJsonResponse([
    'success'  => true,
    'message'  => 'Login successful.',
    'redirect' => $redirectUrl,
    'role'     => $userRole,
    'user'     => $_SESSION['user']
]);
