<?php
/**
 * PlayerGameStat Model
 * Handles database operations for individual player game box scores
 */

require_once __DIR__ . '/../config/Database.php';

class PlayerGameStat {
    private PDO $db;

    public function __construct(?PDO $db = null) {
        $this->db = $db ?? Database::getConnection();
    }

    /**
     * Get all player stats for a game, optionally filtered by team
     */
    public function getByGame(int $gameId, ?int $teamId = null): array {
        $sql = "SELECT pgs.*, 
                       p.first_name, p.last_name, p.jersey_number AS player_default_jersey, p.position AS player_position,
                       t.name AS team_name, t.slug AS team_slug
                FROM player_game_stats pgs
                JOIN players p ON pgs.player_id = p.id
                JOIN teams t ON pgs.team_id = t.id
                WHERE pgs.game_id = :game_id";

        $params = ['game_id' => $gameId];

        if ($teamId !== null) {
            $sql .= " AND pgs.team_id = :team_id";
            $params['team_id'] = $teamId;
        }

        $sql .= " ORDER BY pgs.team_id ASC, pgs.points DESC, pgs.minutes DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Get player stats by player ID
     */
    public function getByPlayer(int $playerId): array {
        $sql = "SELECT pgs.*, g.game_date, g.game_time, g.status AS game_status,
                       ht.name AS home_team_name, at.name AS away_team_name,
                       l.name AS league_name, s.name AS season_name
                FROM player_game_stats pgs
                JOIN games g ON pgs.game_id = g.id
                JOIN teams ht ON g.home_team_id = ht.id
                JOIN teams at ON g.away_team_id = at.id
                JOIN leagues l ON g.league_id = l.id
                JOIN seasons s ON g.season_id = s.id
                WHERE pgs.player_id = :player_id
                ORDER BY g.game_date DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['player_id' => $playerId]);
        return $stmt->fetchAll();
    }

    /**
     * Save a single player game stat (Upsert)
     */
    public function saveSingle(array $data): int {
        $sql = "INSERT INTO player_game_stats (
                    game_id, player_id, team_id, minutes, points, rebounds, 
                    offensive_rebounds, defensive_rebounds, assists, steals, blocks, 
                    turnovers, fouls, field_goals_made, field_goals_attempted, 
                    three_pointers_made, three_pointers_attempted, free_throws_made, 
                    free_throws_attempted, plus_minus
                ) VALUES (
                    :game_id, :player_id, :team_id, :minutes, :points, :rebounds,
                    :offensive_rebounds, :defensive_rebounds, :assists, :steals, :blocks,
                    :turnovers, :fouls, :field_goals_made, :field_goals_attempted,
                    :three_pointers_made, :three_pointers_attempted, :free_throws_made,
                    :free_throws_attempted, :plus_minus
                ) ON DUPLICATE KEY UPDATE
                    team_id = VALUES(team_id),
                    minutes = VALUES(minutes),
                    points = VALUES(points),
                    rebounds = VALUES(rebounds),
                    offensive_rebounds = VALUES(offensive_rebounds),
                    defensive_rebounds = VALUES(defensive_rebounds),
                    assists = VALUES(assists),
                    steals = VALUES(steals),
                    blocks = VALUES(blocks),
                    turnovers = VALUES(turnovers),
                    fouls = VALUES(fouls),
                    field_goals_made = VALUES(field_goals_made),
                    field_goals_attempted = VALUES(field_goals_attempted),
                    three_pointers_made = VALUES(three_pointers_made),
                    three_pointers_attempted = VALUES(three_pointers_attempted),
                    free_throws_made = VALUES(free_throws_made),
                    free_throws_attempted = VALUES(free_throws_attempted),
                    plus_minus = VALUES(plus_minus),
                    updated_at = CURRENT_TIMESTAMP";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'game_id'                  => (int)$data['game_id'],
            'player_id'                => (int)$data['player_id'],
            'team_id'                  => (int)$data['team_id'],
            'minutes'                  => isset($data['minutes']) ? (int)$data['minutes'] : 0,
            'points'                   => isset($data['points']) ? (int)$data['points'] : 0,
            'rebounds'                 => isset($data['rebounds']) ? (int)$data['rebounds'] : 0,
            'offensive_rebounds'       => isset($data['offensive_rebounds']) ? (int)$data['offensive_rebounds'] : 0,
            'defensive_rebounds'       => isset($data['defensive_rebounds']) ? (int)$data['defensive_rebounds'] : 0,
            'assists'                  => isset($data['assists']) ? (int)$data['assists'] : 0,
            'steals'                   => isset($data['steals']) ? (int)$data['steals'] : 0,
            'blocks'                   => isset($data['blocks']) ? (int)$data['blocks'] : 0,
            'turnovers'                => isset($data['turnovers']) ? (int)$data['turnovers'] : 0,
            'fouls'                    => isset($data['fouls']) ? (int)$data['fouls'] : 0,
            'field_goals_made'         => isset($data['field_goals_made']) ? (int)$data['field_goals_made'] : 0,
            'field_goals_attempted'    => isset($data['field_goals_attempted']) ? (int)$data['field_goals_attempted'] : 0,
            'three_pointers_made'      => isset($data['three_pointers_made']) ? (int)$data['three_pointers_made'] : 0,
            'three_pointers_attempted' => isset($data['three_pointers_attempted']) ? (int)$data['three_pointers_attempted'] : 0,
            'free_throws_made'         => isset($data['free_throws_made']) ? (int)$data['free_throws_made'] : 0,
            'free_throws_attempted'    => isset($data['free_throws_attempted']) ? (int)$data['free_throws_attempted'] : 0,
            'plus_minus'               => isset($data['plus_minus']) ? (int)$data['plus_minus'] : 0,
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Batch save player stats in a single transaction
     */
    public function saveBatch(int $gameId, array $stats): bool {
        $this->db->beginTransaction();
        try {
            foreach ($stats as $stat) {
                if (empty($stat['player_id']) || empty($stat['team_id'])) {
                    continue;
                }
                $stat['game_id'] = $gameId;
                $this->saveSingle($stat);
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Delete stats by ID
     */
    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM player_game_stats WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Delete all stats for a game
     */
    public function deleteByGame(int $gameId): bool {
        $stmt = $this->db->prepare("DELETE FROM player_game_stats WHERE game_id = :game_id");
        return $stmt->execute(['game_id' => $gameId]);
    }
}
