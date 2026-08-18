<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
$error_message = '';
$username = trim((string) ($_POST['username'] ?? ''));

if ($current_page === 'logout') {
    acp_logout();
    header('Location: index.php?p=login');
    exit;
}

if (check_admin()) {
    header('Location: index.php?p=main');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = (string) ($_POST['password'] ?? '');

    if ($username === '' || $password === '') {
        $error_message = 'Wprowadź nazwę użytkownika i hasło.';
    } else {
        $query = $db->prepare('SELECT user_id, user_name, password, `group` FROM user_data WHERE user_name = :username LIMIT 1');
        $query->bindValue(':username', $username, PDO::PARAM_STR);
        $query->execute();
        $user = $query->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $error_message = 'Nie znaleziono użytkownika.';
        } elseif ((string) $user['password'] !== md5($password)) {
            $error_message = 'Błędne hasło.';
        } elseif (!in_array((int) ($user['group'] ?? 0), [3, 4], true)) {
            $error_message = 'Brak uprawnień moderatora lub administratora.';
        } else {
            $_SESSION['acp_user_id'] = (int) $user['user_id'];
            header('Location: index.php?p=main');
            exit;
        }
    }
}
?>
<section class="admin-auth-screen d-flex align-items-center justify-content-center">
    <div class="admin-auth-card">
        <div class="text-center mb-4">
            <h1 class="h3 text-success mb-2">Logowanie</h1>
        </div>

        <?php if ($error_message !== '') { ?>
            <div class="admin-auth-error mb-3"><?= htmlspecialchars($error_message) ?></div>
        <?php } ?>

        <form method="post" action="index.php?p=login" class="d-flex flex-column gap-3">
            <div>
                <label for="username" class="form-label admin-auth-label">Login</label>
                <input type="text" id="username" name="username" class="form-control admin-input w-100" value="<?= htmlspecialchars($username) ?>" autocomplete="username" required>
            </div>

            <div>
                <label for="password" class="form-label admin-auth-label">Hasło</label>
                <input type="password" id="password" name="password" class="form-control admin-input w-100" autocomplete="current-password" required>
            </div>

            <button type="submit" class="admin-btn w-100 mt-2">Zaloguj się</button>
        </form>
    </div>
</section>
