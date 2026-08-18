<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
$player_id = (int) ($_GET['id'] ?? 0);
$player = acp_fetch_user_by_id($player_id);
$status_message = '';
$error_message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $player) {
    $subject = trim((string) ($_POST['subject'] ?? ''));
    $message = trim((string) ($_POST['message'] ?? ''));

    if ($subject === '' || $message === '') {
        $error_message = 'Uzupełnij temat i treść wiadomości.';
    } else {
        $query = $db->prepare('INSERT INTO messages(sender_id, reciver_id, time, subject, msg) VALUES(:sender_id, :receiver_id, :time, :subject, :msg)');
        $query->execute([
            ':sender_id' => (int) $user_data['user_id'],
            ':receiver_id' => (int) $player['user_id'],
            ':time' => time(),
            ':subject' => urlencode($subject),
            ':msg' => urlencode($message),
        ]);
        $status_message = 'Wiadomość została wysłana.';
    }
}
?>
<section class="admin-page-section">
    <?php if (!$player) { ?>
        <div class="admin-card p-4 shadow text-center text-secondary">Nie znaleziono adresata wiadomości.</div>
    <?php } else { ?>
        <div class="admin-card p-4 shadow">
            <div class="chat_table_header p-2 mb-3">Wyślij wiadomość do: <?= htmlspecialchars($player['user_name']) ?></div>

            <?php if ($status_message !== '') { ?>
                <div class="admin-success-note mb-3"><?= htmlspecialchars($status_message) ?></div>
            <?php } ?>
            <?php if ($error_message !== '') { ?>
                <div class="admin-auth-error mb-3"><?= htmlspecialchars($error_message) ?></div>
            <?php } ?>

            <form method="post" action="index.php?p=message&id=<?= (int) $player['user_id'] ?>" class="d-flex flex-column gap-3">
                <div>
                    <label for="subject" class="form-label admin-auth-label">Temat</label>
                    <input id="subject" type="text" name="subject" class="form-control admin-input" required>
                </div>
                <div>
                    <label for="message" class="form-label admin-auth-label">Treść</label>
                    <textarea id="message" name="message" class="form-control admin-input admin-textarea" required>Treść twojej wiadomości.</textarea>
                </div>
                <div class="d-flex flex-wrap gap-2">
                    <button type="submit" class="admin-btn">Wyślij</button>
                    <a href="index.php?p=user&id=<?= (int) $player['user_id'] ?>" class="admin-btn">Wróć do profilu</a>
                </div>
            </form>
        </div>
    <?php } ?>
</section>