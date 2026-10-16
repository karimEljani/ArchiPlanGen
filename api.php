<?php
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
try {
    $a = $_GET['action'] ?? '';
    $in = json_decode(file_get_contents('php://input'), true) ?: [];
    $pdo = db();
    switch ($a) {
        case 'list':
            echo json_encode($pdo->query('SELECT id, name, updated_at FROM projects ORDER BY updated_at DESC')->fetchAll());
            break;
        case 'get':
            $s = $pdo->prepare('SELECT id, name, data FROM projects WHERE id = ?');
            $s->execute([(int)($_GET['id'] ?? 0)]);
            $r = $s->fetch();
            if (!$r) { http_response_code(404); echo '{"error":"introuvable"}'; break; }
            $r['data'] = json_decode($r['data'], true);
            echo json_encode($r);
            break;
        case 'save':
            $name = mb_substr(trim($in['name'] ?? 'Sans titre'), 0, 150) ?: 'Sans titre';
            $data = json_encode($in['data'] ?? new stdClass(), JSON_UNESCAPED_UNICODE);
            $id = (int)($in['id'] ?? 0);
            if ($id) {
                $pdo->prepare('UPDATE projects SET name = ?, data = ? WHERE id = ?')->execute([$name, $data, $id]);
            } else {
                $pdo->prepare('INSERT INTO projects (name, data) VALUES (?, ?)')->execute([$name, $data]);
                $id = (int)$pdo->lastInsertId();
            }
            echo json_encode(['id' => $id]);
            break;
        case 'delete':
            $pdo->prepare('DELETE FROM projects WHERE id = ?')->execute([(int)($in['id'] ?? 0)]);
            echo '{"ok":true}';
            break;
        default:
            http_response_code(400);
            echo '{"error":"action inconnue"}';
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Base de données indisponible']);
}
