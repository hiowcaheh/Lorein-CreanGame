<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
if (get_group() < 4) {
    die("Brak dostępu do tego modułu.");
}

$player_id = (int) ($_GET['id'] ?? 0);
$player = acp_fetch_user_by_id($player_id);
$status_message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $player) {
    $fields = [];
    for ($i = 1; $i <= 13; $i++) {
        $key = 'dungeon_' . $i;
        $fields[$key] = min(12, max(0, (int) ($_POST[$key] ?? 0)));
    }
    $fields['tower_level'] = min(100, max(1, (int) ($_POST['tower_level'] ?? 1)));

    $assignments = [];
    foreach ($fields as $column => $value) {
        $assignments[] = '`' . $column . '` = :' . $column;
    }

    $query = $db->prepare('UPDATE user_data SET ' . implode(', ', $assignments) . ' WHERE user_id = :user_id LIMIT 1');
    foreach ($fields as $column => $value) {
        $query->bindValue(':' . $column, $value, PDO::PARAM_INT);
    }
    $query->bindValue(':user_id', (int) $player_id, PDO::PARAM_INT);
    $query->execute();

    header('Location: index.php?p=edit_dungeons&id=' . $player_id . '&saved=1');
    exit;
}

if (isset($_GET['saved']) && $_GET['saved'] === '1') {
    $status_message = 'Zapisano nowy stan lochów i wieży.';
}

$player = $player ? acp_fetch_user_by_id($player_id) : false;
$dungeon_options = [];
for ($value = 0; $value <= 12; $value++) {
    $dungeon_options[$value] = acp_get_dungeon_status_label($value);
}
?>
<section class="admin-page-section">
    <?php if (!$player) { ?>
        <div class="admin-card p-4 shadow text-center text-secondary">Nie znaleziono gracza do edycji lochów.</div>
    <?php } else { ?>
        <div class="admin-card p-4 shadow">
            <div class="chat_table_header p-2 mb-3">Edycja lochów: <?= htmlspecialchars($player['user_name']) ?></div>

            <?php if ($status_message !== '') { ?>
                <div class="admin-success-note mb-3"><?= htmlspecialchars($status_message) ?></div>
            <?php } ?>

            <form method="post" action="index.php?p=edit_dungeons&id=<?= (int) $player['user_id'] ?>" class="row g-3">
                <?php for ($i = 1; $i <= 13; $i++) { ?>
                    <div class="col-12 col-md-6 col-xl-4">
                        <label class="form-label admin-auth-label" for="dungeon_<?= $i ?>">Loch <?= $i ?></label>
                        <select id="dungeon_<?= $i ?>" name="dungeon_<?= $i ?>" class="form-select admin-select">
                            <?php foreach ($dungeon_options as $value => $label) { ?>
                                <option value="<?= $value ?>" <?= (int) $player['dungeon_' . $i] === (int) $value ? 'selected' : '' ?>><?= htmlspecialchars($label) ?></option>
                            <?php } ?>
                        </select>
                    </div>
                <?php } ?>

                <div class="col-12 col-md-6 col-xl-4">
                    <label class="form-label admin-auth-label" for="tower_level">Wieża</label>
                    <input id="tower_level" type="number" name="tower_level" class="form-control admin-input" min="1" max="100" value="<?= (int) $player['tower_level'] ?>">
                </div>

                <div class="col-12 d-flex flex-wrap gap-2">
                    <button type="submit" class="admin-btn">Zapisz lochy</button>
                    <a href="index.php?p=user&id=<?= (int) $player['user_id'] ?>" class="admin-btn">Wróć do profilu</a>
                </div>
            </form>
        </div>
    <?php } ?>
</section>