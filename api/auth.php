<?php
require_once 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'register') {
        $username = isset($data['username']) ? trim($data['username']) : '';
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        if (!$username || !$email || !$password) {
            sendJson(['error' => 'All fields are required'], 400);
        }

        $stmt = $mysqli->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            sendJson(['error' => 'Email already registered'], 400);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $mysqli->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $username, $email, $hash);
        
        if ($stmt->execute()) {
            sendJson(['success' => true]);
        } else {
            sendJson(['error' => 'Registration failed'], 500);
        }
    }

    if ($action === 'login') {
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        if (!$email || !$password) {
            sendJson(['error' => 'Email and password required'], 400);
        }

        $stmt = $mysqli->prepare("SELECT id, username, email, password_hash FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($user = $result->fetch_assoc()) {
            if (password_verify($password, $user['password_hash'])) {
                $_SESSION['user_id'] = $user['id'];
                sendJson([
                    'success' => true,
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'email' => $user['email']
                    ]
                ]);
            }
        }
        sendJson(['error' => 'Invalid credentials'], 401);
    }
    
    if ($action === 'update_profile') {
        if (!isset($_SESSION['user_id'])) sendJson(['error' => 'Unauthorized'], 401);
        $userId = $_SESSION['user_id'];
        $username = isset($data['username']) ? trim($data['username']) : '';
        
        $stmt = $mysqli->prepare("UPDATE users SET username = ? WHERE id = ?");
        $stmt->bind_param("si", $username, $userId);
        if ($stmt->execute()) {
            sendJson(['success' => true]);
        } else {
            sendJson(['error' => 'Failed to update profile'], 500);
        }
    }

    if ($action === 'update_password') {
        if (!isset($_SESSION['user_id'])) sendJson(['error' => 'Unauthorized'], 401);
        $userId = $_SESSION['user_id'];
        $password = isset($data['password']) ? $data['password'] : '';
        
        if (strlen($password) < 6) sendJson(['error' => 'Password must be at least 6 characters'], 400);

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $mysqli->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $stmt->bind_param("si", $hash, $userId);
        if ($stmt->execute()) {
            sendJson(['success' => true]);
        } else {
            sendJson(['error' => 'Failed to update password'], 500);
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'session') {
        if (isset($_SESSION['user_id'])) {
            $stmt = $mysqli->prepare("SELECT id, username, email FROM users WHERE id = ?");
            $stmt->bind_param("i", $_SESSION['user_id']);
            $stmt->execute();
            if ($user = $stmt->get_result()->fetch_assoc()) {
                sendJson(['session' => ['user' => $user]]);
            }
        }
        sendJson(['session' => null]);
    }

    if ($action === 'logout') {
        session_destroy();
        sendJson(['success' => true]);
    }
}

sendJson(['error' => 'Invalid action or HTTP method'], 400);
?>
