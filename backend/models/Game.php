<?php
/**
 * Game Model
 * Handles database operations for games, quarter scores, and full game schedules
 */

require_once __DIR__ . '/../config/Database.php';

class Game {
    private PDO $db;

    public function __construct(?PDO $db = null) {
        $this->db = $db ?? Database::getConnection();
    }

    /**
     * Get all games with joined league, season, team, and venue metadata
     */
    public function getAll(array $filters = []): array {
        $sql = "SELECT g.*, 
                       l.name AS league_name, l.slug AS league_slug,
                       s.name AS season_name, s.slug AS season_slug,
                       ht.name AS home_team_name, ht.slug AS home_team_slug, ht.logo_url AS home_team_logo,
                       at.name AS away_team_name, at.slug AS away_team_slug, at.logo_url AS away_team_logo,
                       v.name AS venue_name, v.city AS venue_city
                FROM games g
                JOIN leagues l ON g.league_id = l.id
                JOIN seasons s ON g.season_id = s.id
                JOIN teams ht ON g.home_team_id = ht.id
                JOIN teams at ON g.away_team_id = at.id
                LEFT JOIN venues v ON g.venue_id = v.id
                WHERE 1=1";

        $params = [];

        if (!empty($filters['season_id'])) {
            $sql .= " AND g.season_id = :season_id";
            $params['season_id'] = (int)$filters['season_id'];
        }

        if (!empty($filters['league_id'])) {
            $sql .= " AND g.league_id = :league_id";
            $params['league_id'] = (int)$filters['league_id'];
        }

        if (!empty($filters['team_id'])) {
            $sql .= " AND (g.home_team_id = :team_id OR g.away_team_id = :team_id)";
            $params['team_id'] = (int)$filters['team_id'];
        }

        if (!empty($filters['status'])) {
            $sql .= " AND g.status = :status";
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['game_date'])) {
            $sql .= " AND g.game_date = :game_date";
            $params['game_date'] = $filters['game_date'];
        }

        $sql .= " ORDER BY g.game_date DESC, g.game_time DESC, g.id DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Get single game by ID, including quarter scores and optionally player stats
     */
    public function getById(int $id, bool $withDetails = true): ?array {
        $sql = "SELECT g.*, 
                       l.name AS league_name, l.slug AS league_slug,
                       s.name AS season_name, s.slug AS season_slug,
                       ht.name AS home_team_name, ht.slug AS home_team_slug, ht.logo_url AS home_team_logo,
                       at.name AS away_team_name, at.slug AS away_team_slug, at.logo_url AS away_team_logo,
                       v.name AS venue_name, v.address AS venue_address, v.city AS venue_city, v.state AS venue_state
                FROM games g
                JOIN leagues l ON g.league_id = l.id
                JOIN seasons s ON g.season_id = s.id
                JOIN teams ht ON g.home_team_id = ht.id
                JOIN teams at ON g.away_team_id = at.id
                LEFT JOIN venues v ON g.venue_id = v.id
                WHERE g.id = :id
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $game = $stmt->fetch();

        if (!$game) {
            return null;
        }

        if ($withDetails) {
            $game['quarters'] = $this->getQuarters($id);
            
            // Fetch player box scores for home and away teams
            $statModel = new PlayerGameStat($this->db);
            $game['home_player_stats'] = $statModel->getByGame($id, (int)$game['home_team_id']);
            $game['away_player_stats'] = $statModel->getByGame($id, (int)$game['away_team_id']);
        }

        return $game;
    }

    /**
     * Create a new game
     */
    public function create(array $data): int {
        $sql = "INSERT INTO games (
                    season_id, league_id, home_team_id, away_team_id, 
                    venue_id, game_date, game_time, status, home_score, 
                    away_score, current_quarter
                ) VALUES (
                    :season_id, :league_id, :home_team_id, :away_team_id, 
                    :venue_id, :game_date, :game_time, :status, :home_score, 
                    :away_score, :current_quarter
                )";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'season_id'       => (int)$data['season_id'],
            'league_id'       => (int)$data['league_id'],
            'home_team_id'    => (int)$data['home_team_id'],
            'away_team_id'    => (int)$data['away_team_id'],
            'venue_id'        => !empty($data['venue_id']) ? (int)$data['venue_id'] : null,
            'game_date'       => $data['game_date'],
            'game_time'       => !empty($data['game_time']) ? $data['game_time'] : null,
            'status'          => !empty($data['status']) ? $data['status'] : 'scheduled',
            'home_score'      => isset($data['home_score']) ? (int)$data['home_score'] : 0,
            'away_score'      => isset($data['away_score']) ? (int)$data['away_score'] : 0,
            'current_quarter' => !empty($data['current_quarter']) ? (int)$data['current_quarter'] : null
        ]);

        $gameId = (int)$this->db->lastInsertId();

        // If quarter scores are passed with game creation, save them
        if (!empty($data['quarters']) && is_array($data['quarters'])) {
            $this->saveQuarters($gameId, $data['quarters']);
        }

        return $gameId;
    }

    /**
     * Update an existing game
     */
    public function update(int $id, array $data): bool {
        $sql = "UPDATE games 
                SET season_id = :season_id,
                    league_id = :league_id,
                    home_team_id = :home_team_id,
                    away_team_id = :away_team_id,
                    venue_id = :venue_id,
                    game_date = :game_date,
                    game_time = :game_time,
                    status = :status,
                    home_score = :home_score,
                    away_score = :away_score,
                    current_quarter = :current_quarter,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        $result = $stmt->execute([
            'id'              => $id,
            'season_id'       => (int)$data['season_id'],
            'league_id'       => (int)$data['league_id'],
            'home_team_id'    => (int)$data['home_team_id'],
            'away_team_id'    => (int)$data['away_team_id'],
            'venue_id'        => !empty($data['venue_id']) ? (int)$data['venue_id'] : null,
            'game_date'       => $data['game_date'],
            'game_time'       => !empty($data['game_time']) ? $data['game_time'] : null,
            'status'          => !empty($data['status']) ? $data['status'] : 'scheduled',
            'home_score'      => isset($data['home_score']) ? (int)$data['home_score'] : 0,
            'away_score'      => isset($data['away_score']) ? (int)$data['away_score'] : 0,
            'current_quarter' => !empty($data['current_quarter']) ? (int)$data['current_quarter'] : null
        ]);

        // Save quarters if present
        if (!empty($data['quarters']) && is_array($data['quarters'])) {
            $this->saveQuarters($id, $data['quarters']);
        }

        return $result;
    }

    /**
     * Delete a game
     */
    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM games WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Get quarter scores for a game
     */
    public function getQuarters(int $gameId): array {
        $stmt = $this->db->prepare("SELECT * FROM game_quarters WHERE game_id = :game_id ORDER BY quarter_number ASC");
        $stmt->execute(['game_id' => $gameId]);
        return $stmt->fetchAll();
    }

    /**
     * Save/upsert quarter scores for a game
     */
    public function saveQuarters(int $gameId, array $quarters): bool {
        $sql = "INSERT INTO game_quarters (game_id, quarter_number, home_points, away_points)
                VALUES (:game_id, :quarter_number, :home_points, :away_points)
                ON DUPLICATE KEY UPDATE
                    home_points = VALUES(home_points),
                    away_points = VALUES(away_points),
                    updated_at = CURRENT_TIMESTAMP";

        $stmt = $this->db->prepare($sql);

        foreach ($quarters as $q) {
            if (!isset($q['quarter_number'])) continue;

            $stmt->execute([
                'game_id'        => $gameId,
                'quarter_number' => (int)$q['quarter_number'],
                'home_points'    => isset($q['home_points']) ? (int)$q['home_points'] : 0,
                'away_points'    => isset($q['away_points']) ? (int)$q['away_points'] : 0,
            ]);
        }

        return true;
    }

    /**
     * Get team roster (players) for selection in box scores
     */
    public function getRosterByTeam(int $teamId, ?int $seasonId = null): array {
        $sql = "SELECT p.id, p.first_name, p.last_name, 
                       COALESCE(tm.jersey_number, p.jersey_number) AS jersey_number,
                       COALESCE(tm.position, p.position) AS position,
                       p.avatar_url, tm.team_id, tm.season_id
                FROM team_memberships tm
                JOIN players p ON tm.player_id = p.id
                WHERE tm.team_id = :team_id
                  AND tm.member_type = 'player'
                  AND tm.status = 'active'";

        $params = ['team_id' => $teamId];

        if ($seasonId !== null) {
            $sql .= " AND tm.season_id = :season_id";
            $params['season_id'] = $seasonId;
        }

        $sql .= " ORDER BY CAST(COALESCE(tm.jersey_number, p.jersey_number, '999') AS UNSIGNED) ASC, p.last_name ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $roster = $stmt->fetchAll();

        // Fallback: If no team_memberships rows found yet, return all players with this team's context
        if (empty($roster)) {
            $fallbackStmt = $this->db->query("SELECT id, first_name, last_name, jersey_number, position, avatar_url FROM players WHERE status = 'active' ORDER BY last_name ASC");
            return $fallbackStmt->fetchAll();
        }

        return $roster;
    }

    /**
     * Fetch complete metadata (Leagues, Seasons, Teams, Venues) for form dropdowns
     */
    public function getMetadata(): array {
        $leaguesStmt = $this->db->query("SELECT id, name, slug, gender, skill_level FROM leagues WHERE status = 'active' ORDER BY name ASC");
        $seasonsStmt = $this->db->query("SELECT id, league_id, name, slug, status FROM seasons ORDER BY start_date DESC");
        $teamsStmt = $this->db->query("SELECT id, league_id, season_id, name, slug, division, logo_url FROM teams WHERE status = 'active' ORDER BY name ASC");
        $venuesStmt = $this->db->query("SELECT id, name, city, state, capacity FROM venues ORDER BY name ASC");
        $playersStmt = $this->db->query("SELECT id, first_name, last_name, jersey_number, position FROM players WHERE status = 'active' ORDER BY last_name ASC");

        return [
            'leagues' => $leaguesStmt->fetchAll(),
            'seasons' => $seasonsStmt->fetchAll(),
            'teams'   => $teamsStmt->fetchAll(),
            'venues'  => $venuesStmt->fetchAll(),
            'players' => $playersStmt->fetchAll(),
        ];
    }
}
