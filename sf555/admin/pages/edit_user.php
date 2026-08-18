<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
if (get_group() < 4) {
    die("Brak dostępu do tego modułu.");
}

$player_id = (int) ($_GET['id'] ?? 0);
$advanced = isset($_GET['advanced']) && $_GET['advanced'] === '1';
$player = acp_fetch_user_by_id($player_id);
$error_message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $player) {
    try {
        $new_id = $advanced ? max(1, (int) ($_POST['user_id'] ?? $player['user_id'])) : (int) $player['user_id'];
        $fields = [
            'user_name' => trim((string) ($_POST['user_name'] ?? $player['user_name'])),
            'lvl' => max(1, (int) ($_POST['lvl'] ?? $player['lvl'])),
            'silver' => max(0, (int) ($_POST['silver'] ?? $player['silver'])),
            'mushroom' => max(0, (int) ($_POST['mushroom'] ?? $player['mushroom'])),
            'honor' => max(0, (int) ($_POST['honor'] ?? $player['honor'])),
            'attr_str' => max(0, (int) ($_POST['attr_str'] ?? $player['attr_str'])),
            'attr_agi' => max(0, (int) ($_POST['attr_agi'] ?? $player['attr_agi'])),
            'attr_int' => max(0, (int) ($_POST['attr_int'] ?? $player['attr_int'])),
            'attr_wit' => max(0, (int) ($_POST['attr_wit'] ?? $player['attr_wit'])),
            'attr_luck' => max(0, (int) ($_POST['attr_luck'] ?? $player['attr_luck'])),
        ];

        if (acp_column_exists('user_data', 'kupon')) {
            $fields['kupon'] = max(0, (int) ($_POST['kupon'] ?? $player['kupon'] ?? 0));
        }

        if ($advanced) {
            $fields['user_id'] = $new_id;
            $fields['email'] = trim((string) ($_POST['email'] ?? $player['email']));
            $fields['exp'] = max(0, (int) ($_POST['exp'] ?? $player['exp']));
            $fields['group'] = min(4, max(1, (int) ($_POST['group'] ?? $player['group'])));
            $fields['class'] = min(3, max(1, (int) ($_POST['class'] ?? $player['class'])));
        }

        if ($fields['user_name'] === '') {
            throw new RuntimeException('Nick gracza nie może być pusty.');
        }

        $assignments = [];
        foreach ($fields as $column => $value) {
            $assignments[] = '`' . $column . '` = :' . $column;
        }

        $query = $db->prepare('UPDATE user_data SET ' . implode(', ', $assignments) . ' WHERE user_id = :current_user_id LIMIT 1');
        foreach ($fields as $column => $value) {
            $query->bindValue(':' . $column, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $query->bindValue(':current_user_id', (int) $player['user_id'], PDO::PARAM_INT);
        $query->execute();

        header('Location: index.php?p=user&id=' . $new_id);
        exit;
    } catch (Throwable $exception) {
        $error_message = $exception->getMessage();
    }
}

$player = $player ? acp_fetch_user_by_id($player_id) : false;
?>
<section class="admin-page-section">
    <?php if (!$player) { ?>
        <div class="admin-card p-4 shadow text-center text-secondary">Nie znaleziono gracza do edycji.</div>
    <?php } else { ?>
        <div class="admin-card p-4 shadow">
            <div class="chat_table_header p-2 mb-3">Edycja profilu: <?= htmlspecialchars($player['user_name']) ?></div>

            <?php if ($error_message !== '') { ?>
                <div class="admin-auth-error mb-3"><?= htmlspecialchars($error_message) ?></div>
            <?php } ?>

            <form method="post" action="index.php?p=edit_user&id=<?= (int) $player['user_id'] ?><?= $advanced ? '&advanced=1' : '' ?>" class="row g-3">
                <div class="col-12 col-md-6">
                    <label class="form-label admin-auth-label" for="user_name">Nick</label>
                    <input id="user_name" type="text" name="user_name" class="form-control admin-input" value="<?= htmlspecialchars($player['user_name']) ?>" required>
                </div>
                <div class="col-12 col-md-6">
                    <label class="form-label admin-auth-label" for="lvl">Level</label>
                    <input id="lvl" type="number" name="lvl" class="form-control admin-input" value="<?= (int) $player['lvl'] ?>" min="1">
                </div>
                <div class="col-12 col-md-6">
                    <label class="form-label admin-auth-label" for="silver">Srebro</label>
                    <input id="silver" type="number" name="silver" class="form-control admin-input" value="<?= (int) $player['silver'] ?>" min="0">
                </div>
                <div class="col-12 col-md-6">
                    <label class="form-label admin-auth-label" for="mushroom">Grzyby</label>
                    <input id="mushroom" type="number" name="mushroom" class="form-control admin-input" value="<?= (int) $player['mushroom'] ?>" min="0">
                </div>
                <div class="col-12 col-md-6">
                    <label class="form-label admin-auth-label" for="kupon">Kupon</label>
                    <input id="kupon" type="number" name="kupon" class="form-control admin-input" value="<?= (int) ($player['kupon'] ?? 0) ?>" min="0">
                </div>
                <div class="col-12 col-md-6">
                    <label class="form-label admin-auth-label" for="honor">Honor</label>
                    <input id="honor" type="number" name="honor" class="form-control admin-input" value="<?= (int) $player['honor'] ?>" min="0">
                </div>
                <div class="col-12 col-md-4">
                    <label class="form-label admin-auth-label" for="attr_str">Siła</label>
                    <input id="attr_str" type="number" name="attr_str" class="form-control admin-input" value="<?= (int) $player['attr_str'] ?>" min="0">
                </div>
                <div class="col-12 col-md-4">
                    <label class="form-label admin-auth-label" for="attr_agi">Zręczność</label>
                    <input id="attr_agi" type="number" name="attr_agi" class="form-control admin-input" value="<?= (int) $player['attr_agi'] ?>" min="0">
                </div>
                <div class="col-12 col-md-4">
                    <label class="form-label admin-auth-label" for="attr_int">Inteligencja</label>
                    <input id="attr_int" type="number" name="attr_int" class="form-control admin-input" value="<?= (int) $player['attr_int'] ?>" min="0">
                </div>
                <div class="col-12 col-md-6">
                    <label class="form-label admin-auth-label" for="attr_wit">Wytrzymałość</label>
                    <input id="attr_wit" type="number" name="attr_wit" class="form-control admin-input" value="<?= (int) $player['attr_wit'] ?>" min="0">
                </div>
                <div class="col-12 col-md-6">
                    <label class="form-label admin-auth-label" for="attr_luck">Szczęście</label>
                    <input id="attr_luck" type="number" name="attr_luck" class="form-control admin-input" value="<?= (int) $player['attr_luck'] ?>" min="0">
                </div>

                <?php if ($advanced) { ?>
                    <div class="col-12"><div class="chat_table_header p-2">Zaawansowane</div></div>
                    <div class="col-12 col-md-4">
                        <label class="form-label admin-auth-label" for="user_id">ID gracza</label>
                        <input id="user_id" type="number" name="user_id" class="form-control admin-input" value="<?= (int) $player['user_id'] ?>" min="1">
                    </div>
                    <div class="col-12 col-md-4">
                        <label class="form-label admin-auth-label" for="email">Email</label>
                        <input id="email" type="text" name="email" class="form-control admin-input" value="<?= htmlspecialchars(acp_fix_special_chars($player['email'])) ?>">
                    </div>
                    <div class="col-12 col-md-4">
                        <label class="form-label admin-auth-label" for="exp">Exp</label>
                        <input id="exp" type="number" name="exp" class="form-control admin-input" value="<?= (int) $player['exp'] ?>" min="0">
                    </div>
                    <div class="col-12 col-md-6">
                        <label class="form-label admin-auth-label" for="group">Ranga (group)</label>
                        <select id="group" name="group" class="form-select admin-select">
                            <?php foreach ([1 => 'Gracz', 2 => 'VIP', 3 => 'Moderator', 4 => 'Admin'] as $group_id => $group_name) { ?>
                                <option value="<?= $group_id ?>" <?= (int) $player['group'] === $group_id ? 'selected' : '' ?>><?= htmlspecialchars($group_name) ?></option>
                            <?php } ?>
                        </select>
                    </div>
                    <div class="col-12 col-md-6">
                        <label class="form-label admin-auth-label" for="class">Profesja</label>
                        <select id="class" name="class" class="form-select admin-select">
                            <?php foreach ([1 => 'Wojownik', 2 => 'Mag', 3 => 'Łowca'] as $class_id => $class_name) { ?>
                                <option value="<?= $class_id ?>" <?= (int) $player['class'] === $class_id ? 'selected' : '' ?>><?= htmlspecialchars($class_name) ?></option>
                            <?php } ?>
                        </select>
                    </div>
                <?php } ?>

                <div class="col-12 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div class="d-flex flex-wrap gap-2">
                        <button type="submit" class="admin-btn">Zapisz zmiany</button>
                        <a href="index.php?p=user&id=<?= (int) $player['user_id'] ?>" class="admin-btn">Anuluj</a>
                    </div>
                    <?php if (!$advanced) { ?>
                        <a href="index.php?p=edit_user&id=<?= (int) $player['user_id'] ?>&advanced=1" class="admin-btn">Pokaż zaawansowane</a>
                    <?php } ?>
                </div>
            </form>
        </div>
    <?php } ?>
</section>