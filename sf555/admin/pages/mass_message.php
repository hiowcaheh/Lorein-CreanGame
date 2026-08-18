<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
if (get_group() < 4) {
    die("Brak dostępu do tego modułu.");
}

$status_message = '';
$error_message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $subject = trim((string) ($_POST['subject'] ?? ''));
    $message = trim((string) ($_POST['message'] ?? ''));

    if ($subject === '' || $message === '') {
        $error_message = 'Uzupełnij temat i treść wiadomości.';
    } else {
        $query = $db->prepare('INSERT INTO messages(sender_id, reciver_id, time, subject, msg) SELECT :sender_id, user_id, :time, :subject, :msg FROM user_data');
        $query->execute([
            ':sender_id' => (int) $user_data['user_id'],
            ':time' => time(),
            ':subject' => urlencode($subject),
            ':msg' => urlencode($message),
        ]);
        $status_message = 'Wiadomość została rozesłana do wszystkich graczy.';
    }
}
?>
<section class="admin-page-section">
    <div class="admin-card p-4 shadow">
        <div class="chat_table_header p-2 mb-3">Masowe wiadomości</div>

        <?php if ($status_message !== '') { ?>
            <div class="admin-success-note mb-3"><?= htmlspecialchars($status_message) ?></div>
        <?php } ?>
        <?php if ($error_message !== '') { ?>
            <div class="admin-auth-error mb-3"><?= htmlspecialchars($error_message) ?></div>
        <?php } ?>

        <form method="post" action="index.php?p=mass_message" class="d-flex flex-column gap-3">
            <div>
                <label for="subject" class="form-label admin-auth-label">Temat</label>
                <input id="subject" type="text" name="subject" class="form-control admin-input" required>
            </div>
            <div>
                <label for="message" class="form-label admin-auth-label">Treść</label>
                <textarea id="message" name="message" class="form-control admin-input admin-textarea" required>Treść twojej wiadomości.</textarea>
            </div>
            <button type="submit" class="admin-btn">Wyślij do wszystkich</button>
        </form>
    </div>
</section>