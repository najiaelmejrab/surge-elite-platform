<?php
/**
 * Venue Model
 * Handles database operations for venues
 */

require_once __DIR__ . '/../config/Database.php';

class Venue {
    private PDO $db;

    public function __construct(?PDO $db = null) {
        $this->db = $db ?? Database::getConnection();
    }

    /**
     * Get all venues
     */
    public function getAll(): array {
        $stmt = $this->db->query("SELECT * FROM venues ORDER BY name ASC");
        return $stmt->fetchAll();
    }

    /**
     * Get venue by ID
     */
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM venues WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    /**
     * Create a new venue
     */
    public function create(array $data): int {
        $sql = "INSERT INTO venues (name, address, city, state, postal_code, country, capacity)
                VALUES (:name, :address, :city, :state, :postal_code, :country, :capacity)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'name'        => $data['name'],
            'address'     => $data['address'] ?? null,
            'city'        => $data['city'] ?? null,
            'state'       => $data['state'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'country'     => $data['country'] ?? 'USA',
            'capacity'    => !empty($data['capacity']) ? (int)$data['capacity'] : null
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Update an existing venue
     */
    public function update(int $id, array $data): bool {
        $sql = "UPDATE venues 
                SET name = :name,
                    address = :address,
                    city = :city,
                    state = :state,
                    postal_code = :postal_code,
                    country = :country,
                    capacity = :capacity,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id'          => $id,
            'name'        => $data['name'],
            'address'     => $data['address'] ?? null,
            'city'        => $data['city'] ?? null,
            'state'       => $data['state'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'country'     => $data['country'] ?? 'USA',
            'capacity'    => !empty($data['capacity']) ? (int)$data['capacity'] : null
        ]);
    }

    /**
     * Delete a venue
     */
    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM venues WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }
}
