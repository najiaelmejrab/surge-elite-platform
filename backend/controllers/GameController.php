<?php
/**
 * Game Controller
 * Handles incoming API requests for game management, quarter scores, and player statistics
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Game.php';
require_once __DIR__ . '/../models/Venue.php';
require_once __DIR__ . '/../models/PlayerGameStat.php';

class GameController {
    private Game $gameModel;
    private Venue $venueModel;
    private PlayerGameStat $statModel;

    public function __construct() {
        $db = Database::getConnection();
        $this->gameModel = new Game($db);
        $this->venueModel = new Venue($db);
        $this->statModel = new PlayerGameStat($db);
    }

    /**
     * Send standard JSON API response
     */
    private function jsonResponse(mixed $data = null, int $status = 200, string $message = 'Success', bool $success = true): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data'    => $data
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Parse JSON request body
     */
    private function getJsonInput(): array {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return $_POST ?: [];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    /**
     * GET /api/games.php - List all games with optional filters
     */
    public function index(): void {
        try {
            $filters = [
                'season_id' => $_GET['season_id'] ?? null,
                'league_id' => $_GET['league_id'] ?? null,
                'team_id'   => $_GET['team_id'] ?? null,
                'status'    => $_GET['status'] ?? null,
                'game_date' => $_GET['game_date'] ?? null,
            ];

            $games = $this->gameModel->getAll(array_filter($filters));
            $this->jsonResponse($games, 200, 'Games retrieved successfully');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error loading games: ' . $e->getMessage(), false);
        }
    }

    /**
     * GET /api/games.php?id=123 - Get single game with quarters and box score
     */
    public function show(int $id): void {
        try {
            $game = $this->gameModel->getById($id, true);
            if (!$game) {
                $this->jsonResponse(null, 404, 'Game not found', false);
                return;
            }
            $this->jsonResponse($game, 200, 'Game retrieved successfully');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error loading game: ' . $e->getMessage(), false);
        }
    }

    /**
     * POST /api/games.php - Create a new game
     */
    public function store(): void {
        try {
            $input = $this->getJsonInput();

            // Validate mandatory fields
            $required = ['season_id', 'league_id', 'home_team_id', 'away_team_id', 'game_date'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    $this->jsonResponse(null, 422, "Field '{$field}' is required", false);
                    return;
                }
            }

            if ((int)$input['home_team_id'] === (int)$input['away_team_id']) {
                $this->jsonResponse(null, 422, "Home team and Away team cannot be identical", false);
                return;
            }

            $gameId = $this->gameModel->create($input);

            // Handle player box score stats if passed
            if (!empty($input['player_stats']) && is_array($input['player_stats'])) {
                $this->statModel->saveBatch($gameId, $input['player_stats']);
            }

            $createdGame = $this->gameModel->getById($gameId, true);
            $this->jsonResponse($createdGame, 201, 'Game created successfully');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error creating game: ' . $e->getMessage(), false);
        }
    }

    /**
     * PUT/PATCH /api/games.php?id=123 - Update game, quarters, and player stats
     */
    public function update(int $id): void {
        try {
            $existing = $this->gameModel->getById($id, false);
            if (!$existing) {
                $this->jsonResponse(null, 404, 'Game not found', false);
                return;
            }

            $input = $this->getJsonInput();

            // Merge existing data if partial update
            $data = array_merge($existing, $input);

            $this->gameModel->update($id, $data);

            // Update quarters if provided
            if (isset($input['quarters']) && is_array($input['quarters'])) {
                $this->gameModel->saveQuarters($id, $input['quarters']);
            }

            // Update player stats if provided
            if (isset($input['player_stats']) && is_array($input['player_stats'])) {
                $this->statModel->saveBatch($id, $input['player_stats']);
            }

            $updatedGame = $this->gameModel->getById($id, true);
            $this->jsonResponse($updatedGame, 200, 'Game updated successfully');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error updating game: ' . $e->getMessage(), false);
        }
    }

    /**
     * DELETE /api/games.php?id=123 - Delete game
     */
    public function destroy(int $id): void {
        try {
            $existing = $this->gameModel->getById($id, false);
            if (!$existing) {
                $this->jsonResponse(null, 404, 'Game not found', false);
                return;
            }

            $this->gameModel->delete($id);
            $this->jsonResponse(['id' => $id], 200, 'Game deleted successfully');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error deleting game: ' . $e->getMessage(), false);
        }
    }

    /**
     * GET /api/games.php?action=metadata - Get options for select boxes
     */
    public function metadata(): void {
        try {
            $metadata = $this->gameModel->getMetadata();
            $this->jsonResponse($metadata, 200, 'Form metadata retrieved');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error retrieving metadata: ' . $e->getMessage(), false);
        }
    }

    /**
     * GET /api/games.php?action=roster&team_id=123 - Get team roster
     */
    public function roster(int $teamId, ?int $seasonId = null): void {
        try {
            $roster = $this->gameModel->getRosterByTeam($teamId, $seasonId);
            $this->jsonResponse($roster, 200, 'Team roster retrieved');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error retrieving roster: ' . $e->getMessage(), false);
        }
    }

    /**
     * POST /api/games.php?action=save_quarters - Save quarter score matrix
     */
    public function saveQuarterScores(int $gameId): void {
        try {
            $input = $this->getJsonInput();
            $quarters = $input['quarters'] ?? $input;

            if (!is_array($quarters)) {
                $this->jsonResponse(null, 422, 'Invalid quarters data payload', false);
                return;
            }

            $this->gameModel->saveQuarters($gameId, $quarters);

            // Recalculate and update final scores on game table if requested
            if (!empty($input['sync_total_scores'])) {
                $homeTotal = 0;
                $awayTotal = 0;
                foreach ($quarters as $q) {
                    $homeTotal += (int)($q['home_points'] ?? 0);
                    $awayTotal += (int)($q['away_points'] ?? 0);
                }
                $gameData = $this->gameModel->getById($gameId, false);
                if ($gameData) {
                    $gameData['home_score'] = $homeTotal;
                    $gameData['away_score'] = $awayTotal;
                    $this->gameModel->update($gameId, $gameData);
                }
            }

            $savedQuarters = $this->gameModel->getQuarters($gameId);
            $this->jsonResponse($savedQuarters, 200, 'Quarter scores saved');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error saving quarter scores: ' . $e->getMessage(), false);
        }
    }

    /**
     * POST /api/games.php?action=save_stats - Save player box score records
     */
    public function savePlayerStats(int $gameId): void {
        try {
            $input = $this->getJsonInput();
            $stats = $input['stats'] ?? $input;

            if (!is_array($stats)) {
                $this->jsonResponse(null, 422, 'Invalid stats data payload', false);
                return;
            }

            $this->statModel->saveBatch($gameId, $stats);
            $savedStats = $this->statModel->getByGame($gameId);
            $this->jsonResponse($savedStats, 200, 'Player box scores saved successfully');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error saving player statistics: ' . $e->getMessage(), false);
        }
    }
}
