<?php
/**
 * Player Controller
 * Handles CRUD and roster operations for athletes and coach management
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Player.php';

class PlayerController {
    private Player $playerModel;

    public function __construct() {
        $db = Database::getConnection();
        $this->playerModel = new Player($db);
    }

    /**
     * Send standard JSON response
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
     * Parse JSON request input
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
     * GET /api/players.php - List athletes with filters
     */
    public function index(): void {
        try {
            $filters = [
                'team_id'          => $_GET['team_id'] ?? null,
                'season_id'        => $_GET['season_id'] ?? null,
                'position'         => $_GET['position'] ?? null,
                'search'           => $_GET['search'] ?? null,
                'status'           => $_GET['status'] ?? null,
                'include_inactive' => isset($_GET['include_inactive']) && $_GET['include_inactive'] === 'true',
            ];

            $players = $this->playerModel->getAll(array_filter($filters, fn($val) => $val !== null && $val !== ''));
            $this->jsonResponse($players, 200, 'Players loaded successfully');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error retrieving players: ' . $e->getMessage(), false);
        }
    }

    /**
     * GET /api/players.php?id=123 - Get single athlete details
     */
    public function show(int $id): void {
        try {
            $player = $this->playerModel->getById($id);
            if (!$player) {
                $this->jsonResponse(null, 404, 'Player athlete not found', false);
                return;
            }
            $this->jsonResponse($player, 200, 'Player retrieved successfully');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error retrieving player: ' . $e->getMessage(), false);
        }
    }

    /**
     * POST /api/players.php - Create athlete & roster assignment
     */
    public function store(): void {
        try {
            $input = $this->getJsonInput();

            if (empty($input['first_name']) || empty($input['last_name'])) {
                $this->jsonResponse(null, 422, 'First name and Last name are required', false);
                return;
            }

            $playerId = $this->playerModel->create($input);
            $player = $this->playerModel->getById($playerId);

            $this->jsonResponse($player, 201, 'Player created and added to roster successfully');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error creating player: ' . $e->getMessage(), false);
        }
    }

    /**
     * PUT /api/players.php?id=123 - Update athlete profile
     */
    public function update(int $id): void {
        try {
            $existing = $this->playerModel->getById($id);
            if (!$existing) {
                $this->jsonResponse(null, 404, 'Player not found', false);
                return;
            }

            $input = $this->getJsonInput();
            $data = array_merge($existing, $input);

            $this->playerModel->update($id, $data);
            $updated = $this->playerModel->getById($id);

            $this->jsonResponse($updated, 200, 'Player profile updated successfully');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error updating player: ' . $e->getMessage(), false);
        }
    }

    /**
     * DELETE /api/players.php?id=123 - Soft delete (mark inactive)
     */
    public function destroy(int $id): void {
        try {
            $existing = $this->playerModel->getById($id);
            if (!$existing) {
                $this->jsonResponse(null, 404, 'Player not found', false);
                return;
            }

            $this->playerModel->softDelete($id);
            $this->jsonResponse(['id' => $id, 'status' => 'inactive'], 200, 'Player marked inactive (soft deleted)');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error soft deleting player: ' . $e->getMessage(), false);
        }
    }

    /**
     * POST /api/players.php?action=restore&id=123 - Restore inactive athlete
     */
    public function restore(int $id): void {
        try {
            $this->playerModel->restore($id);
            $restored = $this->playerModel->getById($id);
            $this->jsonResponse($restored, 200, 'Player restored to active roster');
        } catch (Exception $e) {
            $this->jsonResponse(null, 500, 'Error restoring player: ' . $e->getMessage(), false);
        }
    }
}
