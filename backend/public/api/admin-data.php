<?php
/**
 * Admin data API for leagues, teams, players, and broadcasts.
 * Games continue to use games.php.
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-HTTP-Method-Override');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../../config/Database.php';

function adminInput(): array {
    $raw = file_get_contents('php://input');
    $data = $raw ? json_decode($raw, true) : $_POST;
    return is_array($data) ? $data : [];
}
function adminResponse($data, int $status = 200, string $message = 'Success', bool $success = true): void {
    http_response_code($status);
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data], JSON_UNESCAPED_SLASHES);
    exit;
}
function slugify(string $value): string {
    $slug = strtolower(trim((string)preg_replace('/[^a-z0-9]+/i', '-', $value), '-'));
    return $slug ?: 'item-' . time();
}
function firstOrganization(PDO $db): int {
    $id = (int)$db->query('SELECT id FROM organizations ORDER BY id LIMIT 1')->fetchColumn();
    if ($id) return $id;
    $stmt = $db->prepare('INSERT INTO organizations (name, slug) VALUES (?, ?)');
    $stmt->execute(['Surge Elite', 'surge-elite']);
    return (int)$db->lastInsertId();
}
function seasonFor(PDO $db, int $leagueId, string $name = ''): int {
    $stmt = $db->prepare('SELECT id FROM seasons WHERE league_id = ? ORDER BY id LIMIT 1');
    $stmt->execute([$leagueId]);
    $id = (int)$stmt->fetchColumn();
    if ($id) return $id;
    $name = trim($name) ?: 'Current Season';
    $insert = $db->prepare('INSERT INTO seasons (league_id, name, slug, start_date, end_date) VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR))');
    $insert->execute([$leagueId, $name, slugify($name)]);
    return (int)$db->lastInsertId();
}

try {
    $db = Database::getConnection();
    $entity = $_GET['entity'] ?? 'all';
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if ($method === 'POST' && !empty($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($method === 'GET') {
        $result = [];
        if ($entity === 'all' || $entity === 'leagues') {
            $rows = $db->query("SELECT l.*, s.name AS season FROM leagues l LEFT JOIN seasons s ON s.league_id=l.id ORDER BY l.name")->fetchAll();
            $result['leagues'] = []; foreach ($rows as $row) $result['leagues'][(string)$row['id']] = $row;
        }
        if ($entity === 'all' || $entity === 'teams') {
            $rows = $db->query("SELECT t.*, l.name AS league, s.name AS season FROM teams t JOIN leagues l ON l.id=t.league_id JOIN seasons s ON s.id=t.season_id ORDER BY t.name")->fetchAll();
            $players = $db->query("SELECT tm.team_id, p.*, tm.jersey_number AS membership_jersey, tm.position AS membership_position FROM team_memberships tm JOIN players p ON p.id=tm.player_id WHERE tm.member_type='player' AND tm.status='active'")->fetchAll();
            $byTeam = []; foreach ($players as $player) { $teamId = $player['team_id']; $player['jersey_number'] = $player['membership_jersey'] ?: $player['jersey_number']; $player['position'] = $player['membership_position'] ?: $player['position']; unset($player['team_id'], $player['membership_jersey'], $player['membership_position']); $player['name'] = trim($player['first_name'].' '.$player['last_name']); $byTeam[$teamId][] = $player; }
            $result['teams'] = []; foreach ($rows as $row) { $row['players'] = $byTeam[$row['id']] ?? []; $row['badge'] = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $row['name']), 0, 2)); $result['teams'][(string)$row['id']] = $row; }
        }
        if ($entity === 'all' || $entity === 'players') {
            $rows = $db->query("SELECT p.*, tm.team_id, t.name AS team_name FROM players p LEFT JOIN team_memberships tm ON tm.player_id=p.id AND tm.member_type='player' AND tm.status='active' LEFT JOIN teams t ON t.id=tm.team_id ORDER BY p.last_name, p.first_name")->fetchAll();
            $result['players'] = $rows;
        }
        if ($entity === 'broadcasts') {
            $rows = $db->query('SELECT * FROM broadcasts ORDER BY game_id')->fetchAll();
            $result['broadcasts'] = []; foreach ($rows as $row) { $row['gameId'] = (string)$row['game_id']; $result['broadcasts'][$row['gameId']] = $row; }
        }
        adminResponse($entity === 'all' ? $result : ($result[$entity] ?? []));
    }

    $input = adminInput();
    if (in_array($entity, ['leagues', 'teams'], true) && in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
        if ($entity === 'leagues') {
            $name = trim($input['name'] ?? ''); if ($name === '') adminResponse(null, 422, 'League name is required', false);
            $org = firstOrganization($db); $slug = slugify($input['slug'] ?? $name);
            if ($id) { $stmt = $db->prepare('UPDATE leagues SET name=?, slug=?, description=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'); $stmt->execute([$name, $slug, $input['description'] ?? null, $input['status'] ?? 'active', $id]); }
            else { $stmt = $db->prepare('INSERT INTO leagues (organization_id,name,slug,description,status) VALUES (?,?,?,?,?)'); $stmt->execute([$org,$name,$slug,$input['description'] ?? null,$input['status'] ?? 'upcoming']); $id=(int)$db->lastInsertId(); }
            $row = $db->prepare('SELECT * FROM leagues WHERE id=?'); $row->execute([$id]); adminResponse($row->fetch(), $id ? 200 : 201);
        }
        $name = trim($input['name'] ?? ''); if ($name === '' || empty($input['leagueId'])) adminResponse(null, 422, 'Team name and league are required', false);
        $leagueId=(int)$input['leagueId']; $seasonId=seasonFor($db,$leagueId,(string)($input['season'] ?? ''));
        if ($id) { $stmt=$db->prepare('UPDATE teams SET league_id=?,season_id=?,name=?,slug=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?'); $stmt->execute([$leagueId,$seasonId,$name,slugify($input['slug'] ?? $name),$input['status'] ?? 'active',$id]); }
        else { $stmt=$db->prepare('INSERT INTO teams (organization_id,league_id,season_id,name,slug,status) VALUES (?,?,?,?,?,?)'); $stmt->execute([firstOrganization($db),$leagueId,$seasonId,$name,slugify($input['slug'] ?? $name),$input['status'] ?? 'active']); $id=(int)$db->lastInsertId(); }
        $row=$db->prepare('SELECT * FROM teams WHERE id=?'); $row->execute([$id]); adminResponse($row->fetch(), $id ? 200 : 201);
    }
    if ($entity === 'players' && in_array($method, ['POST','PUT','PATCH'], true)) {
        $data = array_merge(['first_name'=>'','last_name'=>''], $input);
        if ($id) { $stmt=$db->prepare('UPDATE players SET first_name=?,last_name=?,jersey_number=?,position=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?'); $stmt->execute([$data['first_name'],$data['last_name'],$data['jersey_number'] ?? null,$data['position'] ?? null,$data['status'] ?? 'active',$id]); }
        else { $stmt=$db->prepare('INSERT INTO players (first_name,last_name,jersey_number,position,status) VALUES (?,?,?,?,?)'); $stmt->execute([$data['first_name'],$data['last_name'],$data['jersey_number'] ?? null,$data['position'] ?? null,$data['status'] ?? 'active']); $id=(int)$db->lastInsertId(); }
        if (!empty($data['team_id'])) {
            $teamStmt = $db->prepare('SELECT league_id, season_id FROM teams WHERE id=?'); $teamStmt->execute([(int)$data['team_id']]); $team = $teamStmt->fetch();
            if ($team) {
                $membership = $db->prepare("INSERT INTO team_memberships (team_id,season_id,player_id,member_type,jersey_number,position,status) VALUES (?,?,?,?,?,?, 'active') ON DUPLICATE KEY UPDATE jersey_number=VALUES(jersey_number),position=VALUES(position),status='active'");
                $membership->execute([(int)$data['team_id'], (int)$team['season_id'], $id, 'player', $data['jersey_number'] ?? null, $data['position'] ?? null]);
            }
        }
        adminResponse(['id'=>$id]);
    }
    if ($entity === 'broadcasts' && in_array($method, ['POST','PUT','PATCH'], true)) {
        if (empty($input['gameId'])) adminResponse(null, 422, 'Game ID is required', false);
        $stmt = $db->prepare("INSERT INTO broadcasts (game_id,enabled,title,url,scheduled_date,scheduled_time,status,thumbnail,description) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE enabled=VALUES(enabled),title=VALUES(title),url=VALUES(url),scheduled_date=VALUES(scheduled_date),scheduled_time=VALUES(scheduled_time),status=VALUES(status),thumbnail=VALUES(thumbnail),description=VALUES(description)");
        $stmt->execute([(int)$input['gameId'], !empty($input['enabled']) ? 1 : 0, $input['title'] ?? '', $input['url'] ?? '', $input['date'] ?? null, $input['time'] ?? null, $input['status'] ?? 'scheduled', $input['thumbnail'] ?? null, $input['description'] ?? null]);
        adminResponse($input);
    }
    if ($entity === 'broadcasts' && $method === 'DELETE' && $id) {
        $stmt = $db->prepare('DELETE FROM broadcasts WHERE game_id=?'); $stmt->execute([$id]); adminResponse(['id'=>$id]);
    }
    if (in_array($entity, ['leagues','teams'], true) && $method === 'DELETE' && $id) {
        $table = $entity === 'leagues' ? 'leagues' : 'teams'; $stmt=$db->prepare("DELETE FROM {$table} WHERE id=?"); $stmt->execute([$id]); adminResponse(['id'=>$id]);
    }
    adminResponse(null, 405, 'Method not allowed', false);
} catch (Throwable $e) { adminResponse(null, 500, 'Admin data error: '.$e->getMessage(), false); }
