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

echo "Authentication seed completed.\n";
