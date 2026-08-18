<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
$current_group = (int) ($user_data['group'] ?? 0);
$has_access = $current_group >= 3;
$can_clear_chat = $current_group === 4;
$chat_table_exists = acp_table_exists('chat');
$chat_display_color_column = acp_column_exists('user_data', 'chat_color') ? 'chat_color' : (acp_column_exists('user_data', 'color') ? 'color' : false);
$chat_ban_column = acp_column_exists('user_data', 'chat_ban_until') ? 'chat_ban_until' : false;
$status_message = '';
$error_message = '';
$meta_refresh_url = '';

if ($has_access && $chat_table_exists) {
    $action = (string) ($_GET['action'] ?? '');

    try {
        if ($action === 'delete') {
            $message_id = (int) ($_GET['id'] ?? 0);

            if ($message_id > 0) {
                $query = $db->prepare('DELETE FROM `chat` WHERE `id` = :message_id LIMIT 1');
                $query->bindValue(':message_id', $message_id, PDO::PARAM_INT);
                $query->execute();
                $status_message = 'Wiadomość została usunięta.';
                $meta_refresh_url = 'index.php?p=chat';
            } else {
                $error_message = 'Nieprawidłowe ID wiadomości.';
            }
        } elseif ($action === 'clear_all') {
            if (!$can_clear_chat) {
                $error_message = 'Tylko Administrator może wyczyścić cały czat.';
            } else {
                $db->beginTransaction();

                try {
                    $db->exec('DELETE FROM `chat`');

                    $system_message = 'Czat został wyczyszczony przez Administratora: ' . trim((string) ($user_data['user_name'] ?? 'Administrator'));
                    $insert = $db->prepare('INSERT INTO `chat` (`user_id`, `message`, `date`) VALUES (:user_id, :message, :date)');
                    $insert->bindValue(':user_id', (int) ($user_data['user_id'] ?? 0), PDO::PARAM_INT);
                    $insert->bindValue(':message', $system_message, PDO::PARAM_STR);
                    $insert->bindValue(':date', time(), PDO::PARAM_INT);
                    $insert->execute();

                    $db->commit();
                } catch (Throwable $exception) {
                    if ($db->inTransaction()) {
                        $db->rollBack();
                    }

                    throw $exception;
                }

                $status_message = 'Czat został wyczyszczony.';
                $meta_refresh_url = 'index.php?p=chat';
            }
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $moderation_action = (string) ($_POST['moderation_action'] ?? 'ban');
            $target_name = trim((string) ($_POST['user_name'] ?? ''));
            $ban_minutes = max(0, (int) ($_POST['ban_minutes'] ?? 0));

            if ($target_name === '') {
                $error_message = 'Wprowadź nick gracza do moderacji czatu.';
            } elseif (!$chat_ban_column) {
                $error_message = 'Kolumna chat_ban_until nie istnieje w tabeli user_data.';
            } else {
                $target_query = $db->prepare('SELECT `user_id`, `user_name`, `group`, `chat_ban_until` FROM `user_data` WHERE `user_name` = :user_name LIMIT 1');
                $target_query->bindValue(':user_name', $target_name, PDO::PARAM_STR);
                $target_query->execute();
                $target_user = $target_query->fetch(PDO::FETCH_ASSOC);

                if (!$target_user) {
                    $error_message = 'Nie znaleziono wskazanego gracza.';
                } elseif ((int) $target_user['user_id'] === (int) ($user_data['user_id'] ?? 0)) {
                    $error_message = 'Nie możesz nadać bana czatu samemu sobie.';
                } elseif ((int) $target_user['group'] >= $current_group) {
                    $error_message = 'Nie możesz nałożyć bana czatu na użytkownika z równą lub wyższą rangą.';
                } elseif ($moderation_action === 'unban') {
                    if ((int) ($target_user['chat_ban_until'] ?? 0) <= time()) {
                        $error_message = 'Ten gracz nie ma aktywnej blokady czatu.';
                    } else {
                        $query = $db->prepare('UPDATE `user_data` SET `' . $chat_ban_column . '` = 0 WHERE `user_id` = :user_id LIMIT 1');
                        $query->bindValue(':user_id', (int) $target_user['user_id'], PDO::PARAM_INT);
                        $query->execute();
                        $status_message = 'Zdjęto blokadę czatu z gracza ' . $target_user['user_name'] . '.';
                        $meta_refresh_url = 'index.php?p=chat';
                    }
                } elseif ($ban_minutes <= 0) {
                    $error_message = 'Podaj poprawną liczbę minut bana czatu.';
                } else {
                    $query = $db->prepare('UPDATE `user_data` SET `' . $chat_ban_column . '` = :ban_until WHERE `user_id` = :user_id LIMIT 1');
                    $query->bindValue(':ban_until', time() + ($ban_minutes * 60), PDO::PARAM_INT);
                    $query->bindValue(':user_id', (int) $target_user['user_id'], PDO::PARAM_INT);
                    $query->execute();
                    $status_message = 'Nałożono blokadę czatu na ' . $target_user['user_name'] . ' na ' . $ban_minutes . ' minut.';
                    $meta_refresh_url = 'index.php?p=chat';
                }
            }
        }
    } catch (Throwable $exception) {
        $error_message = $exception->getMessage();
    }
}

$chat_logs = [];
if ($has_access && $chat_table_exists) {
    $warned_select = acp_column_exists('user_data', 'warned') ? ', u.`warned`' : ", 'no' AS warned";
    $color_select = $chat_display_color_column ? ', CAST(u.`' . $chat_display_color_column . '` AS SIGNED) AS chat_color' : ', 0 AS chat_color';
    $query = $db->prepare(
        'SELECT c.`id`, c.`user_id`, c.`message`, c.`date`,
                u.`user_name`, u.`group`, u.`class`, u.`enabled`, u.`reg_date`' . $warned_select . $color_select . '
         FROM `chat` c
         LEFT JOIN `user_data` u ON u.`user_id` = c.`user_id`
         ORDER BY c.`date` DESC, c.`id` DESC
         LIMIT :limit'
    );
    $query->bindValue(':limit', 150, PDO::PARAM_INT);
    $query->execute();
    $chat_logs = $query->fetchAll(PDO::FETCH_ASSOC) ?: [];
}
?>
<section class="admin-page-section">
    <?php if ($meta_refresh_url !== '') { ?>
        <meta http-equiv="refresh" content="0;url=<?= htmlspecialchars($meta_refresh_url) ?>">
    <?php } ?>

    <?php if (!$has_access) { ?>
        <div class="admin-card p-4 shadow text-center text-secondary">Brak uprawnień do moderacji czatu.</div>
    <?php } elseif (!$chat_table_exists) { ?>
        <div class="admin-card p-4 shadow text-center text-secondary">Tabela chat nie istnieje w aktualnej bazie danych.</div>
    <?php } else { ?>
        <div class="admin-card p-4 shadow mb-4">
            <div class="chat_table_header p-2 mb-3">Moderacja czatu</div>

            <?php if ($status_message !== '') { ?>
                <div class="admin-success-note mb-3"><?= htmlspecialchars($status_message) ?></div>
            <?php } ?>
            <?php if ($error_message !== '') { ?>
                <div class="admin-auth-error mb-3"><?= htmlspecialchars($error_message) ?></div>
            <?php } ?>

            <div class="row g-4">
                <div class="col-12 col-xl-8">
                    <form method="post" action="index.php?p=chat" class="row g-3 align-items-end">
                        <div class="col-12 col-md-5">
                            <label for="chat-ban-user" class="form-label admin-auth-label">Nick gracza</label>
                            <input id="chat-ban-user" type="text" name="user_name" class="form-control admin-input" required>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="chat-ban-minutes" class="form-label admin-auth-label">Ban na minuty</label>
                            <input id="chat-ban-minutes" type="number" name="ban_minutes" min="1" class="form-control admin-input" required>
                        </div>
                        <div class="col-12 col-md-4">
                            <div class="d-grid gap-2">
                                <button type="submit" name="moderation_action" value="ban" class="admin-btn">Nałóż Czat-Ban</button>
                                <button type="submit" name="moderation_action" value="unban" class="admin-btn" formnovalidate>Zdejmij Czat-Ban</button>
                            </div>
                        </div>
                    </form>
                    <?php if (!$chat_ban_column) { ?>
                        <div class="small text-secondary mt-3">Brak kolumny <strong>chat_ban_until</strong> w tabeli user_data. Formularz działa dopiero po dodaniu tej kolumny.</div>
                    <?php } else { ?>
                        <div class="small text-secondary mt-3">Aby zdjąć bana, wpisz nick gracza i kliknij <strong>Zdejmij Czat-Ban</strong>. Pole minut jest wymagane tylko przy nakładaniu blokady.</div>
                    <?php } ?>
                </div>

                <div class="col-12 col-xl-4">
                    <div class="d-grid gap-2">
                        <?php if ($can_clear_chat) { ?>
                            <a href="index.php?p=chat&action=clear_all" class="admin-btn admin-btn-danger">Wyczyść cały czat</a>
                        <?php } else { ?>
                            <div class="text-secondary small">Wyczyszczenie całego czatu jest dostępne wyłącznie dla Administratora.</div>
                        <?php } ?>
                    </div>
                </div>
            </div>
        </div>

        <div class="admin-card p-4 shadow">
            <div class="chat_table_header p-2 mb-3">Logi czatu</div>
            <div id="chat_messages" class="p-2">
                <?php if ($chat_logs) { ?>
                    <?php foreach ($chat_logs as $chat_log) { ?>
                        <?php
                        $author_name = $chat_log['user_name'] ?: 'System';
                        $author_class = $chat_log['user_name'] ? acp_get_player_css_class($chat_log) : 'Admin';
                        ?>
                        <div class="message">
                            <ul class="message_ul">
                                <li class="chat-message-time">[<?= htmlspecialchars(acp_format_datetime($chat_log['date'])) ?>]</li>
                                <li class="chat-message-author"><span class="<?= htmlspecialchars($author_class) ?>"><?= htmlspecialchars($author_name) ?></span>:</li>
                                <li class="chat-message-body"><?= nl2br(htmlspecialchars(acp_fix_special_chars((string) ($chat_log['message'] ?? '')))) ?></li>
                                <li class="ms-auto">
                                    <a href="index.php?p=chat&action=delete&id=<?= (int) $chat_log['id'] ?>" class="admin-btn admin-btn-mini admin-btn-danger">[X]</a>
                                </li>
                            </ul>
                        </div>
                    <?php } ?>
                <?php } else { ?>
                    <div class="message">
                        <ul class="message_ul">
                            <li class="chat-message-body text-secondary">Brak wiadomości w logach czatu.</li>
                        </ul>
                    </div>
                <?php } ?>
            </div>
        </div>
    <?php } ?>
</section>