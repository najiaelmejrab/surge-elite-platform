<?php
require_once __DIR__ . '/../backend/config/Database.php';

$users = [
    [
        'first_name' => 'Admin',
        'last_name' => 'User',
        'email' => 'admin@surgelite.com',
        'password' => 'Admin123!',
        'role' => 'admin',
        'status' => 'active',
    ],
    [
        'first_name' => 'Coach',
        'last_name' => 'James',
        'email' => 'coach@surgelite.com',
        'password' => 'Coach123!',
        'role' => 'coach',
        'status' => 'active',
    ],
    [
        'first_name' => 'Marcus',
        'last_name' => 'Vance',
        'email' => 'player@surgelite.com',
        'password' => 'Player123!',
        'role' => 'player',
        'status' => 'active',
    ],
];

$db = Database::getConnection();

foreach ($users as $user) {
    $existing = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $existing->execute(['email' => strtolower($user['email'])]);
    $result = $existing->fetch();

    if ($result) {
        $db->prepare('UPDATE users SET password = :password, role = :role, status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id')
            ->execute([
                'password' => password_hash($user['password'], PASSWORD_DEFAULT),
                'role' => $user['role'],
                'status' => $user['status'],
                'id' => (int)$result['id'],
            ]);
        echo "Updated user: {$user['email']}\n";
        continue;
    }

    $db->prepare('INSERT INTO users (first_name, last_name, email, password, role, status) VALUES (:first_name, :last_name, :email, :password, :role, :status)')
        ->execute([
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'email' => strtolower($user['email']),
            'password' => password_hash($user['password'], PASSWORD_DEFAULT),
            'role' => $user['role'],
            'status' => $user['status'],
        ]);

    echo "Inserted user: {$user['email']}\n";
}

$adminUser = $db->query("SELECT id FROM users WHERE email = 'admin@surgelite.com' LIMIT 1")->fetch();
if ($adminUser) {
    $coachUser = $db->query("SELECT id FROM users WHERE email = 'coach@surgelite.com' LIMIT 1")->fetch();
    $playerUser = $db->query("SELECT id FROM users WHERE email = 'player@surgelite.com' LIMIT 1")->fetch();

    $db->prepare('INSERT INTO coaches (user_id, first_name, last_name, role_title, experience_years, status) VALUES (:user_id, :first_name, :last_name, :role_title, 5, :status) ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name)')
        ->execute([
            'user_id' => (int)$coachUser['id'],
            'first_name' => 'Coach',
            'last_name' => 'James',
            'role_title' => 'Head Coach',
            'status' => 'active',
        ]);

    $db->prepare('INSERT INTO players (user_id, first_name, last_name, jersey_number, position, height, date_of_birth, status) VALUES (:user_id, :first_name, :last_name, :jersey_number, :position, :height, :date_of_birth, :status) ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), jersey_number = VALUES(jersey_number), position = VALUES(position), height = VALUES(height), date_of_birth = VALUES(date_of_birth)')
        ->execute([
            'user_id' => (int)$playerUser['id'],
            'first_name' => 'Marcus',
            'last_name' => 'Vance',
            'jersey_number' => '23',
            'position' => 'PG',
            'height' => '6\'3"',
            'date_of_birth' => '2009-04-18',
            'status' => 'active',
        ]);
}

echo "Authentication seed completed.\n";
