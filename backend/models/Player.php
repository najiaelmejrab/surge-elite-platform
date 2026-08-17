<?php
/**
 * Player Model
 * Handles database operations for athletes, rosters, and team memberships
 */

require_once __DIR__ . '/../config/Database.php';

class Player {
    private PDO $db;

    public function __construct(?PDO $db = null) {
        $this->db = $db ?? Database::getConnection();
    }

    /**
     * Get players with team memberships and search/filters
     */
    public function getAll(array $filters = []): array {
        $sql = "SELECT p.*,
                       tm.id AS membership_id,
                       tm.team_id,
                       tm.season_id,
                       COALESCE(tm.jersey_number, p.jersey_number) AS active_jersey,
                       COALESCE(tm.position, p.position) AS active_position,
                       tm.status AS membership_status,
                       t.name AS team_name,
                       t.slug AS team_slug,
                       t.logo_url AS team_logo,
                       s.name AS season_name
                FROM players p
                LEFT JOIN team_memberships tm ON p.id = tm.player_id AND tm.member_type = 'player'
                LEFT JOIN teams t ON tm.team_id = t.id
                LEFT JOIN seasons s ON tm.season_id = s.id
                WHERE 1=1";

        $params = [];

        // By default, exclude soft-deleted/inactive players unless explicitly requested
        if (isset($filters['status']) && $filters['status'] !== 'all') {
            $sql .= " AND p.status = :status";
            $params['status'] = $filters['status'];
        } elseif (!isset($filters['include_inactive']) || !$filters['include_inactive']) {
            $sql .= " AND p.status != 'inactive'";
        }

        if (!empty($filters['team_id'])) {
            $sql .= " AND tm.team_id = :team_id";
            $params['team_id'] = (int)$filters['team_id'];
        }

        if (!empty($filters['season_id'])) {
            $sql .= " AND tm.season_id = :season_id";
            $params['season_id'] = (int)$filters['season_id'];
        }

        if (!empty($filters['position']) && $filters['position'] !== 'all') {
            $sql .= " AND (p.position = :position OR tm.position = :position)";
            $params['position'] = $filters['position'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (p.first_name LIKE :search_first 
                        OR p.last_name LIKE :search_last 
                        OR p.jersey_number LIKE :search_jersey
                        OR tm.jersey_number LIKE :search_tm_jersey
                        OR CONCAT(p.first_name, ' ', p.last_name) LIKE :search_full)";
            $searchWild = '%' . trim($filters['search']) . '%';
            $params['search_first'] = $searchWild;
            $params['search_last'] = $searchWild;
            $params['search_jersey'] = $searchWild;
            $params['search_tm_jersey'] = $searchWild;
            $params['search_full'] = $searchWild;
        }

        $sql .= " ORDER BY CAST(COALESCE(tm.jersey_number, p.jersey_number, '999') AS UNSIGNED) ASC, p.last_name ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Get single player by ID with active team membership
     */
    public function getById(int $id): ?array {
        $sql = "SELECT p.*,
                       tm.id AS membership_id,
                       tm.team_id,
                       tm.season_id,
                       COALESCE(tm.jersey_number, p.jersey_number) AS active_jersey,
                       COALESCE(tm.position, p.position) AS active_position,
                       t.name AS team_name,
                       t.slug AS team_slug,
                       s.name AS season_name
                FROM players p
                LEFT JOIN team_memberships tm ON p.id = tm.player_id AND tm.member_type = 'player' AND tm.status = 'active'
                LEFT JOIN teams t ON tm.team_id = t.id
                LEFT JOIN seasons s ON tm.season_id = s.id
                WHERE p.id = :id
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $player = $stmt->fetch();

        return $player ?: null;
    }

    /**
     * Create a new athlete record and assign to team
     */
    public function create(array $data): int {
        $this->db->beginTransaction();
        try {
            $sql = "INSERT INTO players (
                        user_id, first_name, last_name, jersey_number, 
                        position, height, weight, date_of_birth, 
                        experience_years, college_or_highschool, bio, 
                        avatar_url, status
                    ) VALUES (
                        :user_id, :first_name, :last_name, :jersey_number,
                        :position, :height, :weight, :date_of_birth,
                        :experience_years, :college_or_highschool, :bio,
                        :avatar_url, :status
                    )";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'user_id'               => !empty($data['user_id']) ? (int)$data['user_id'] : null,
                'first_name'            => $data['first_name'],
                'last_name'             => $data['last_name'],
                'jersey_number'         => !empty($data['jersey_number']) ? $data['jersey_number'] : null,
                'position'              => !empty($data['position']) ? $data['position'] : 'G',
                'height'                => $data['height'] ?? null,
                'weight'                => $data['weight'] ?? null,
                'date_of_birth'         => !empty($data['date_of_birth']) ? $data['date_of_birth'] : null,
                'experience_years'      => isset($data['experience_years']) ? (int)$data['experience_years'] : 0,
                'college_or_highschool' => $data['college_or_highschool'] ?? null,
                'bio'                   => $data['bio'] ?? null,
                'avatar_url'            => $data['avatar_url'] ?? null,
                'status'                => !empty($data['status']) ? $data['status'] : 'active'
            ]);

            $playerId = (int)$this->db->lastInsertId();

            // Assign to team membership if team_id is provided
            if (!empty($data['team_id'])) {
                $seasonId = !empty($data['season_id']) ? (int)$data['season_id'] : 1;
                $this->assignToTeam(
                    $playerId, 
                    (int)$data['team_id'], 
                    $seasonId, 
                    $data['jersey_number'] ?? null, 
                    $data['position'] ?? null
                );
            }

            $this->db->commit();
            return $playerId;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Update an athlete profile and team assignment
     */
    public function update(int $id, array $data): bool {
        $this->db->beginTransaction();
        try {
            $sql = "UPDATE players 
                    SET first_name = :first_name,
                        last_name = :last_name,
                        jersey_number = :jersey_number,
                        position = :position,
                        height = :height,
                        weight = :weight,
                        date_of_birth = :date_of_birth,
                        experience_years = :experience_years,
                        college_or_highschool = :college_or_highschool,
                        bio = :bio,
                        avatar_url = :avatar_url,
                        status = :status,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'id'                    => $id,
                'first_name'            => $data['first_name'],
                'last_name'             => $data['last_name'],
                'jersey_number'         => !empty($data['jersey_number']) ? $data['jersey_number'] : null,
                'position'              => !empty($data['position']) ? $data['position'] : 'G',
                'height'                => $data['height'] ?? null,
                'weight'                => $data['weight'] ?? null,
                'date_of_birth'         => !empty($data['date_of_birth']) ? $data['date_of_birth'] : null,
                'experience_years'      => isset($data['experience_years']) ? (int)$data['experience_years'] : 0,
                'college_or_highschool' => $data['college_or_highschool'] ?? null,
                'bio'                   => $data['bio'] ?? null,
                'avatar_url'            => $data['avatar_url'] ?? null,
                'status'                => !empty($data['status']) ? $data['status'] : 'active'
            ]);

            // Sync team membership
            if (!empty($data['team_id'])) {
                $seasonId = !empty($data['season_id']) ? (int)$data['season_id'] : 1;
                $this->assignToTeam(
                    $id, 
                    (int)$data['team_id'], 
                    $seasonId, 
                    $data['jersey_number'] ?? null, 
                    $data['position'] ?? null
                );
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Soft delete a player by setting status to 'inactive'
     */
    public function softDelete(int $id): bool {
        $this->db->beginTransaction();
        try {
            // Mark player inactive
            $stmt = $this->db->prepare("UPDATE players SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = :id");
            $stmt->execute(['id' => $id]);

            // Also mark any active roster memberships inactive
            $stmtMem = $this->db->prepare("UPDATE team_memberships SET status = 'inactive', left_at = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE player_id = :id");
            $stmtMem->execute(['id' => $id]);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Restore an inactive player to active
     */
    public function restore(int $id): bool {
        $stmt = $this->db->prepare("UPDATE players SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Assign or update player on a team roster for a given season
     */
    public function assignToTeam(int $playerId, int $teamId, int $seasonId, ?string $jersey = null, ?string $position = null): bool {
        $sql = "INSERT INTO team_memberships (
                    team_id, season_id, player_id, member_type, 
                    jersey_number, position, status, joined_at
                ) VALUES (
                    :team_id, :season_id, :player_id, 'player', 
                    :jersey_number, :position, 'active', CURRENT_DATE
                ) ON DUPLICATE KEY UPDATE
                    team_id = VALUES(team_id),
                    jersey_number = VALUES(jersey_number),
                    position = VALUES(position),
                    status = 'active',
                    updated_at = CURRENT_TIMESTAMP";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'team_id'       => $teamId,
            'season_id'     => $seasonId,
            'player_id'     => $playerId,
            'jersey_number' => $jersey,
            'position'      => $position
        ]);
    }
}
