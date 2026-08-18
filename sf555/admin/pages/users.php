<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
$sort_by = $_GET['by'] ?? 'id';
$search = trim((string) ($_GET['name'] ?? ''));
$sort_map = [
    'id' => '`user_id` ASC',
    'name' => '`user_name` ASC',
    'level' => '`lvl` DESC',
    'silver' => '`silver` DESC',
    'mushroom' => '`mushroom` DESC',
    'regdate' => '`reg_date` DESC',
];
$order_sql = $sort_map[$sort_by] ?? $sort_map['id'];

$sql = 'SELECT user_id, user_name, reg_date, lvl, silver, mushroom, `group`, class FROM user_data';
if ($search !== '') {
    $sql .= ' WHERE user_name LIKE :search';
}
$sql .= ' ORDER BY ' . $order_sql;

$query = $db->prepare($sql);
if ($search !== '') {
    $query->bindValue(':search', '%' . $search . '%', PDO::PARAM_STR);
}
$query->execute();
$players = $query->fetchAll(PDO::FETCH_ASSOC) ?: [];
?>
<section class="admin-page-section">
    <div class="admin-card p-4 shadow mb-4">
        <div class="chat_table_header p-2 mb-3">Szukaj gracza</div>
        <form method="get" action="index.php" class="row g-3 align-items-end">
            <input type="hidden" name="p" value="users">
            <div class="col-12 col-lg-6">
                <label for="search-name" class="form-label admin-auth-label">Nick gracza</label>
                <input type="text" id="search-name" name="name" value="<?= htmlspecialchars($search) ?>" class="form-control admin-input text-center">
            </div>
            <div class="col-12 col-lg-3">
                <label for="sort-by" class="form-label admin-auth-label">Sortowanie</label>
                <select id="sort-by" name="by" class="form-select admin-select text-center">
                    <option value="id" <?= $sort_by === 'id' ? 'selected' : '' ?>>ID</option>
                    <option value="name" <?= $sort_by === 'name' ? 'selected' : '' ?>>Nazwa gracza</option>
                    <option value="regdate" <?= $sort_by === 'regdate' ? 'selected' : '' ?>>Rejestracja</option>
                    <option value="level" <?= $sort_by === 'level' ? 'selected' : '' ?>>Level</option>
                    <option value="silver" <?= $sort_by === 'silver' ? 'selected' : '' ?>>Złoto</option>
                    <option value="mushroom" <?= $sort_by === 'mushroom' ? 'selected' : '' ?>>Grzyby</option>
                </select>
            </div>
            <div class="col-12 col-lg-3 d-grid">
                <button type="submit" class="admin-btn">Filtruj</button>
            </div>
        </form>
    </div>

    <div class="admin-card p-4 shadow">
        <div class="chat_table_header p-2 mb-3">Lista graczy</div>
        <div class="table-responsive">
            <table class="table table-dark table-hover m-0 align-middle admin-data-table">
                <thead>
                    <tr>
                        <th><a href="index.php?p=users&by=id<?= $search !== '' ? '&name=' . urlencode($search) : '' ?>">ID</a></th>
                        <th><a href="index.php?p=users&by=name<?= $search !== '' ? '&name=' . urlencode($search) : '' ?>">Nazwa gracza</a></th>
                        <th><a href="index.php?p=users&by=regdate<?= $search !== '' ? '&name=' . urlencode($search) : '' ?>">Rejestracja</a></th>
                        <th><a href="index.php?p=users&by=level<?= $search !== '' ? '&name=' . urlencode($search) : '' ?>">Level</a></th>
                        <th><a href="index.php?p=users&by=silver<?= $search !== '' ? '&name=' . urlencode($search) : '' ?>">Złoto</a></th>
                        <th><a href="index.php?p=users&by=mushroom<?= $search !== '' ? '&name=' . urlencode($search) : '' ?>">Grzyby</a></th>
                        <th>Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if ($players) { ?>
                        <?php foreach ($players as $player) { ?>
                            <tr>
                                <td><?= (int) $player['user_id'] ?></td>
                                <td><span class="<?= htmlspecialchars(acp_get_player_css_class($player)) ?>"><?= htmlspecialchars($player['user_name']) ?></span></td>
                                <td><?= htmlspecialchars(acp_format_datetime($player['reg_date'])) ?></td>
                                <td><?= (int) $player['lvl'] ?></td>
                                <td><?= htmlspecialchars(acp_format_silver($player['silver'])) ?></td>
                                <td><?= (int) $player['mushroom'] ?></td>
                                <td>
                                    <div class="d-flex flex-wrap gap-2">
                                        <a href="index.php?p=user&id=<?= (int) $player['user_id'] ?>" class="admin-btn">Podgląd</a>
                                        <?php if (get_group() == 4): ?>
                                        <a href="index.php?p=edit_user&id=<?= (int) $player['user_id'] ?>" class="admin-btn">Edytuj</a>
                                        <?php endif; ?>
                                    </div>
                                </td>
                            </tr>
                        <?php } ?>
                    <?php } else { ?>
                        <tr>
                            <td colspan="7" class="text-center text-secondary">Brak wyników dla podanych kryteriów.</td>
                        </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>
    </div>
</section>