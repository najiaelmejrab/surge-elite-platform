<?php
/**
 * Surge Elite Basketball Platform - Admin Account Management API
 * Administrator-only endpoint for managing platform users, roles, statuses, and credentials.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../../config/Database.php';

function surgeAccountsJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

// -----------------------------------------------------------------------------
// 1. Authentication & Role Protection (ADMIN ONLY)
// -----------------------------------------------------------------------------
if (empty($_SESSION['user']) || empty($_SESSION['user_id'])) {
    surgeAccountsJson([
        'success' => false,
        'message' => 'Authentication required'
    ], 401);
}

$currentUserRole = strtolower(trim((string)($_SESSION['user']['role'] ?? '')));
if ($currentUserRole !== 'admin') {
    surgeAccountsJson([
        'success' => false,
        'message' => 'Forbidden: Administrator privileges required'
    ], 403);
}

// Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$db = Database::getConnection();

// -----------------------------------------------------------------------------
// 2. GET Endpoint: List All Accounts
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->query(
        'SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.status, u.created_at, u.updated_at,
                p.id AS player_id, p.jersey_number, p.position,
                c.id AS coach_id, c.role_title
         FROM users u
         LEFT JOIN players p ON p.user_id = u.id
         LEFT JOIN coaches c ON c.user_id = u.id
         ORDER BY u.created_at DESC'
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $accounts = array_map(function ($row) {
        return [
            'id' => (int)$row['id'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'name' => trim($row['first_name'] . ' ' . $row['last_name']),
            'email' => $row['email'],
            'phone' => $row['phone'],
            'role' => $row['role'],
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'player_id' => $row['player_id'] ? (int)$row['player_id'] : null,
            'coach_id' => $row['coach_id'] ? (int)$row['coach_id'] : null,
        ];
    }, $rows);

    surgeAccountsJson([
        'success' => true,
        'accounts' => $accounts
    ]);
}

// -----------------------------------------------------------------------------
// 3. POST Endpoints (Create, Update, Status Toggle, Reset Password)
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    surgeAccountsJson([
        'success' => false,
        'message' => 'Method not allowed'
    ], 405);
}

$payload = $_POST;
if (empty($payload) && !empty($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $jsonInput = json_decode((string)file_get_contents('php://input'), true);
    if (is_array($jsonInput)) {
        $payload = $jsonInput;
    }
}

$action = strtolower(trim((string)($_GET['action'] ?? $payload['action'] ?? 'create')));

// -----------------------------------------------------------------------------
// 3A. Create Account (Admin or Coach only)
// -----------------------------------------------------------------------------
if ($action === 'create') {
    $firstName = trim((string)($payload['first_name'] ?? ''));
    $lastName  = trim((string)($payload['last_name'] ?? ''));
    $email     = trim((string)($payload['email'] ?? ''));
    $password  = (string)($payload['password'] ?? '');
    $role      = strtolower(trim((string)($payload['role'] ?? '')));
    $status    = strtolower(trim((string)($payload['status'] ?? 'active')));
    $phone     = trim((string)($payload['phone'] ?? ''));

    if ($firstName === '' || $lastName === '' || $email === '' || $password === '') {
        surgeAccountsJson([
            'success' => false,
            'message' => 'First name, last name, email, and password are required.'
        ], 422);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        surgeAccountsJson([
            'success' => false,
            'message' => 'Please provide a valid email address.'
        ], 422);
    }

    if (strlen($password) < 8) {
        surgeAccountsJson([
            'success' => false,
            'message' => 'Password must be at least 8 characters long.'
        ], 422);
    }

    if (!in_array($role, ['admin', 'coach'], true)) {
        surgeAccountsJson([
            'success' => false,
            'message' => 'Admins can only create Administrator or Coach accounts.'
        ], 422);
    }

    if (!in_array($status, ['active', 'inactive', 'suspended'], true)) {
        $status = 'active';
    }

    // Duplicate email check
    $emailCheck = $db->prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1');
    $emailCheck->execute(['email' => $email]);
    if ($emailCheck->fetch()) {
        surgeAccountsJson([
            'success' => false,
            'message' => 'An account with that email already exists.'
        ], 409);
    }

    $db->beginTransaction();
    try {
        $stmt = $db->prepare(
            'INSERT INTO users (first_name, last_name, email, password, phone, role, status) VALUES (:first_name, :last_name, :email, :password, :phone, :role, :status)'
        );
        $stmt->execute([
            'first_name' => $firstName,
            'last_name'  => $lastName,
            'email'      => strtolower($email),
            'password'   => password_hash($password, PASSWORD_DEFAULT),
            'phone'      => $phone !== '' ? $phone : null,
            'role'       => $role,
            'status'     => $status,
        ]);

        $userId = (int)$db->lastInsertId();

        if ($role === 'coach') {
            $coachStmt = $db->prepare(
                'INSERT INTO coaches (user_id, first_name, last_name, role_title, status) VALUES (:user_id, :first_name, :last_name, :role_title, :status)'
            );
            $coachStmt->execute([
                'user_id'    => $userId,
                'first_name' => $firstName,
                'last_name'  => $lastName,
                'role_title' => 'Head Coach',
                'status'     => $status === 'active' ? 'active' : 'inactive',
            ]);
        }

        $db->commit();

        surgeAccountsJson([
            'success' => true,
            'message' => ucfirst($role) . ' account created successfully.',
            'account' => [
                'id' => $userId,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'name' => "$firstName $lastName",
                'email' => strtolower($email),
                'role' => $role,
                'status' => $status
            ]
        ], 201);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        surgeAccountsJson([
            'success' => false,
            'message' => 'Failed to create account: ' . $e->getMessage()
        ], 500);
    }
}

// -----------------------------------------------------------------------------
// 3B. Update Account Details
// -----------------------------------------------------------------------------
if ($action === 'update') {
    $userId    = (int)($payload['id'] ?? 0);
    $firstName = trim((string)($payload['first_name'] ?? ''));
    $lastName  = trim((string)($payload['last_name'] ?? ''));
    $email     = trim((string)($payload['email'] ?? ''));
    $role      = strtolower(trim((string)($payload['role'] ?? '')));
    $status    = strtolower(trim((string)($payload['status'] ?? '')));
    $phone     = trim((string)($payload['phone'] ?? ''));

    if ($userId <= 0) {
        surgeAccountsJson(['success' => false, 'message' => 'Account ID is required.'], 422);
    }

    if ($firstName === '' || $lastName === '' || $email === '') {
        surgeAccountsJson(['success' => false, 'message' => 'First name, last name, and email are required.'], 422);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        surgeAccountsJson(['success' => false, 'message' => 'Please provide a valid email address.'], 422);
    }

    // Verify user exists
    $userStmt = $db->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
    $userStmt->execute(['id' => $userId]);
    $existingUser = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$existingUser) {
        surgeAccountsJson(['success' => false, 'message' => 'Account not found.'], 404);
    }

    // Check duplicate email
    $emailCheck = $db->prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(:email) AND id != :id LIMIT 1');
    $emailCheck->execute(['email' => $email, 'id' => $userId]);
    if ($emailCheck->fetch()) {
        surgeAccountsJson(['success' => false, 'message' => 'Another account already uses that email address.'], 409);
    }

    $validRoles = ['admin', 'coach', 'player'];
    if ($role === '' || !in_array($role, $validRoles, true)) {
        $role = $existingUser['role'];
    }

    $validStatuses = ['active', 'inactive', 'suspended'];
    if ($status === '' || !in_array($status, $validStatuses, true)) {
        $status = $existingUser['status'];
    }

    $db->beginTransaction();
    try {
        $updateStmt = $db->prepare(
            'UPDATE users SET first_name = :first_name, last_name = :last_name, email = :email, phone = :phone, role = :role, status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id'
        );
        $updateStmt->execute([
            'first_name' => $firstName,
            'last_name'  => $lastName,
            'email'      => strtolower($email),
            'phone'      => $phone !== '' ? $phone : null,
            'role'       => $role,
            'status'     => $status,
            'id'         => $userId,
        ]);

        // Sync linked players record if player
        if ($role === 'player' || $existingUser['role'] === 'player') {
            $db->prepare(
                'UPDATE players SET first_name = :first_name, last_name = :last_name WHERE user_id = :user_id'
            )->execute([
                'first_name' => $firstName,
                'last_name'  => $lastName,
                'user_id'    => $userId,
            ]);
        }

        // Sync linked coaches record if coach
        if ($role === 'coach' || $existingUser['role'] === 'coach') {
            $db->prepare(
                'UPDATE coaches SET first_name = :first_name, last_name = :last_name, status = :status WHERE user_id = :user_id'
            )->execute([
                'first_name' => $firstName,
                'last_name'  => $lastName,
                'status'     => $status === 'active' ? 'active' : 'inactive',
                'user_id'    => $userId,
            ]);
        }

        $db->commit();

        // If updating currently logged in user, refresh session info
        if ((int)$_SESSION['user_id'] === $userId) {
            $_SESSION['user']['first_name'] = $firstName;
            $_SESSION['user']['last_name'] = $lastName;
            $_SESSION['user']['email'] = strtolower($email);
            $_SESSION['user']['role'] = $role;
            $_SESSION['role'] = $role;
        }

        surgeAccountsJson([
            'success' => true,
            'message' => 'Account updated successfully.'
        ]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        surgeAccountsJson([
            'success' => false,
            'message' => 'Update failed: ' . $e->getMessage()
        ], 500);
    }
}

// -----------------------------------------------------------------------------
// 3C. Status Toggle Action (Activate / Deactivate)
// -----------------------------------------------------------------------------
if ($action === 'status') {
    $userId = (int)($payload['id'] ?? 0);
    $status = strtolower(trim((string)($payload['status'] ?? '')));

    if ($userId <= 0) {
        surgeAccountsJson(['success' => false, 'message' => 'Account ID is required.'], 422);
    }

    if (!in_array($status, ['active', 'inactive', 'suspended'], true)) {
        surgeAccountsJson(['success' => false, 'message' => 'Invalid status value.'], 422);
    }

    // Prevent deactivating own active session
    if ($userId === (int)$_SESSION['user_id'] && $status !== 'active') {
        surgeAccountsJson([
            'success' => false,
            'message' => 'You cannot deactivate your own logged-in administrator account.'
        ], 422);
    }

    $stmt = $db->prepare('UPDATE users SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
    $stmt->execute(['status' => $status, 'id' => $userId]);

    // Sync coaches status if exists
    $db->prepare('UPDATE coaches SET status = :status WHERE user_id = :user_id')->execute([
        'status' => $status === 'active' ? 'active' : 'inactive',
        'user_id' => $userId
    ]);

    surgeAccountsJson([
        'success' => true,
        'message' => "Account status set to {$status}."
    ]);
}

// -----------------------------------------------------------------------------
// 3D. Admin Password Reset Action
// -----------------------------------------------------------------------------
if ($action === 'reset_password') {
    $userId   = (int)($payload['id'] ?? 0);
    $password = (string)($payload['password'] ?? '');

    if ($userId <= 0) {
        surgeAccountsJson(['success' => false, 'message' => 'Account ID is required.'], 422);
    }

    if (strlen($password) < 8) {
        surgeAccountsJson(['success' => false, 'message' => 'New password must be at least 8 characters long.'], 422);
    }

    $stmt = $db->prepare('UPDATE users SET password = :password, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
    $stmt->execute([
        'password' => password_hash($password, PASSWORD_DEFAULT),
        'id'       => $userId
    ]);

    surgeAccountsJson([
        'success' => true,
        'message' => 'Account password reset successfully.'
    ]);
}

surgeAccountsJson(['success' => false, 'message' => 'Invalid action requested.'], 400);
