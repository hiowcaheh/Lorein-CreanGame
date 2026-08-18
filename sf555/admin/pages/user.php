<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
$player_id = (int) ($_GET['id'] ?? 0);
$player = acp_fetch_user_by_id($player_id);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $player) {
    $action = (string) ($_POST['action'] ?? '');

    if ($action === 'toggle_enabled' && get_group() > $player['group']) {
        $new_status = ($player['enabled'] ?? 'yes') === 'no' ? 'yes' : 'no';
        $query = $db->prepare('UPDATE user_data SET enabled = :enabled WHERE user_id = :user_id LIMIT 1');
        $query->execute([
            ':enabled' => $new_status,
            ':user_id' => (int) $player_id,
        ]);
    } elseif ($action === 'reset_thirst' && get_group() == 4) {
        $query = $db->prepare('UPDATE user_data SET thirst = 6000 WHERE user_id = :user_id LIMIT 1');
        $query->bindValue(':user_id', (int) $player_id, PDO::PARAM_INT);
        $query->execute();
    } elseif ($action === 'reset_beers' && get_group() == 4) {
        $query = $db->prepare('UPDATE user_data SET beers = 0 WHERE user_id = :user_id LIMIT 1');
        $query->bindValue(':user_id', (int) $player_id, PDO::PARAM_INT);
        $query->execute();
    }

    header('Location: index.php?p=user&id=' . $player_id);
    exit;
}

$player = $player ? acp_fetch_user_by_id($player_id) : false;
?>
<section class="admin-page-section">
    <?php if (!$player) { ?>
        <div class="admin-card p-4 shadow text-center text-secondary">Nie znaleziono wybranego gracza.</div>
    <?php } else { ?>
        <?php
        $guild_name = null;
        if ((int) $player['guild_id'] > 0) {
            $query = $db->prepare('SELECT name FROM guilds WHERE guild_id = :guild_id LIMIT 1');
            $query->bindValue(':guild_id', (int) $player['guild_id'], PDO::PARAM_INT);
            $query->execute();
            $guild_name = $query->fetchColumn() ?: null;
        }

        $activity_column = acp_get_activity_column();
        $activity_value = $activity_column ? (int) ($player[$activity_column] ?? 0) : 0;
        $registration_minutes = max(0, (int) floor((time() - (int) $player['reg_date']) / 60));
        $registration_hours = (int) floor($registration_minutes / 60);
        $registration_minutes -= $registration_hours * 60;
        $registration_days = (int) floor($registration_hours / 24);
        $registration_hours -= $registration_days * 24;
        $registration_weeks = (int) floor($registration_days / 7);
        $registration_days -= $registration_weeks * 7;

        if ($registration_weeks > 0) {
            $registration_elapsed = $registration_weeks . ' tygodni';
        } elseif ($registration_days > 0) {
            $registration_elapsed = $registration_days . ' dni';
        } elseif ($registration_hours > 0) {
            $registration_elapsed = $registration_hours . ' godzin';
        } elseif ($registration_minutes > 0) {
            $registration_elapsed = $registration_minutes . ' minut';
        } else {
            $registration_elapsed = '< 1 minuty';
        }

        switch ((int) $player['class']) {
            case 1:
                $class_name = 'Wojownik';
                break;
            case 2:
                $class_name = 'Mag';
                break;
            case 3:
                $class_name = 'Łowca';
                break;
            default:
                $class_name = 'Nieznana';
                break;
        }
        ?>
        <div class="admin-card p-4 shadow mb-4">
            <div class="chat_table_header p-2 mb-3">Profil gracza: <?= htmlspecialchars($player['user_name']) ?></div>
            <div class="table-responsive">
                <table class="table table-dark table-hover m-0 align-middle admin-data-table">
                    <tbody>
                        <tr><th>ID</th><td><?= (int) $player['user_id'] ?></td><th>Ranga</th><td><?= htmlspecialchars(get_group_name($player)) ?></td></tr>
                        <tr><th>Level</th><td><?= (int) $player['lvl'] ?></td><th>Profesja</th><td><?= htmlspecialchars($class_name) ?></td></tr>
                        <tr><th>Złoto</th><td><?= htmlspecialchars(acp_format_silver($player['silver'])) ?></td><th>Grzyby</th><td><?= (int) $player['mushroom'] ?></td></tr>
                        <tr><th>Kupon</th><td><?= (int) ($player['kupon'] ?? 0) ?></td><th>Honor</th><td><?= (int) $player['honor'] ?></td></tr>
                        <tr><th>Gildia</th><td><?= htmlspecialchars($guild_name ?? 'Brak gildii') ?></td><th>Ranga gildyjna</th><td><?= (int) $player['guild_rank'] ?></td></tr>
                        <tr><th>Email</th><td><?= htmlspecialchars(acp_fix_special_chars($player['email'])) ?></td><th>Ostatnie IP</th><td><?= htmlspecialchars((string) $player['last_ip']) ?></td></tr>
                        <tr><th>Rejestracja</th><td><?= htmlspecialchars($registration_elapsed) ?> temu (<?= htmlspecialchars(acp_format_datetime($player['reg_date'])) ?>)</td><th>Ostatnia aktywność</th><td><?= htmlspecialchars($activity_value > 0 ? acp_format_datetime($activity_value) : 'Brak danych') ?></td></tr>
                        <tr><th>SSID</th><td><?= htmlspecialchars((string) $player['ssid']) ?></td><th>Złota ramka</th><td><?= (int) $player['golden_frame'] === 32 ? 'Tak' : 'Nie' ?></td></tr>
                        <tr><th>Opis</th><td colspan="3"><?= nl2br(htmlspecialchars(acp_fix_special_chars(urldecode((string) ($player['user_desc'] ?? 'Brak opisu'))))) ?></td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-12 col-xl-6">
                <div class="admin-card p-4 shadow h-100">
                    <div class="chat_table_header p-2 mb-3">Statystyki i postęp</div>
                    <div class="row row-cols-2 g-3 small">
                        <div><strong>Siła:</strong> <?= (int) $player['attr_str'] ?></div>
                        <div><strong>Zręczność:</strong> <?= (int) $player['attr_agi'] ?></div>
                        <div><strong>Inteligencja:</strong> <?= (int) $player['attr_int'] ?></div>
                        <div><strong>Wytrzymałość:</strong> <?= (int) $player['attr_wit'] ?></div>
                        <div><strong>Szczęście:</strong> <?= (int) $player['attr_luck'] ?></div>
                        <div><strong>Piwa:</strong> <?= (int) $player['beers'] ?></div>
                        <div><strong>Awanturniczość:</strong> <?= number_format(((int) $player['thirst']) / 60, 0, '.', ' ') ?>%</div>
                        <div><strong>Status:</strong> <?= (int) $player['status'] ?></div>
                    </div>

                    <div class="chat_table_header p-2 mt-4 mb-3">Lochy i wieża</div>
                    <div class="row row-cols-2 g-2 small">
                        <?php for ($i = 1; $i <= 13; $i++) { ?>
                            <div><strong>Loch <?= $i ?>:</strong> <?= htmlspecialchars(acp_get_dungeon_status_label($player['dungeon_' . $i])) ?></div>
                        <?php } ?>
                        <div><strong>Wieża:</strong> Poziom <?= (int) $player['tower_level'] ?></div>
                    </div>
                </div>
            </div>

            <div class="col-12 col-xl-6">
                <div class="admin-card p-4 shadow h-100">
                    <div class="chat_table_header p-2 mb-3">Akcje administracyjne</div>
                    <div class="d-flex flex-column gap-2 admin-action-list">
                        <a href="index.php?p=message&id=<?= (int) $player['user_id'] ?>" class="admin-btn">Napisz do tego gracza</a>
                        <?php if (get_group() == 4): ?>
                        <a href="index.php?p=edit_dungeons&id=<?= (int) $player['user_id'] ?>" class="admin-btn">Edytuj lochy tego gracza</a>
                        <a href="index.php?p=edit_user&id=<?= (int) $player['user_id'] ?>" class="admin-btn">Edytuj tego gracza</a>
                        <form method="post" action="index.php?p=user&id=<?= (int) $player['user_id'] ?>">
                            <input type="hidden" name="action" value="reset_thirst">
                            <button type="submit" class="admin-btn w-100">Zresetuj awanturniczość</button>
                        </form>
                        <form method="post" action="index.php?p=user&id=<?= (int) $player['user_id'] ?>">
                            <input type="hidden" name="action" value="reset_beers">
                            <button type="submit" class="admin-btn w-100">Zresetuj wypite piwa</button>
                        </form>
                        <?php endif; ?>

                        <?php if (get_group() > $player['group']): ?>
                        <form method="post" action="index.php?p=user&id=<?= (int) $player['user_id'] ?>">
                            <input type="hidden" name="action" value="toggle_enabled">
                            <button type="submit" class="admin-btn w-100"><?= ($player['enabled'] ?? 'yes') === 'no' ? 'Odblokuj konto' : 'Zablokuj konto' ?></button>
                        </form>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    <?php } ?>
</section>