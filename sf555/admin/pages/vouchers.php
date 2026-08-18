<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
if (get_group() < 4) {
    die("Brak dostępu do tego modułu.");
}

$status_message = '';
$error_message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string) ($_POST['action'] ?? '');

    try {
        if ($action === 'create') {
            if (!acp_table_exists('vouchers')) {
                throw new RuntimeException('Tabela vouchers nie istnieje w tej bazie danych.');
            }

            $quantity = max(1, (int) ($_POST['quantity'] ?? 0));
            $uses = max(1, (int) ($_POST['uses'] ?? 0));
            $amount = max(1, (int) ($_POST['amount'] ?? 0));
            $db_type = (string) ($_POST['type'] ?? 'mushroom') === 'silver' ? 'silver' : 'mushroom';

            if ($db_type === 'silver') {
                $amount *= 100;
            }

            $query = $db->prepare('INSERT INTO vouchers(code, type, amount, used) VALUES(:code, :type, :amount, :used)');
            for ($i = 0; $i < $quantity; $i++) {
                $query->execute([
                    ':code' => strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 10)),
                    ':type' => $db_type,
                    ':amount' => $amount,
                    ':used' => $uses,
                ]);
            }

            $status_message = 'Pomyślnie wygenerowano kupony.';
        } elseif ($action === 'delete') {
            if (acp_table_exists('vouchers')) {
                $query = $db->prepare('DELETE FROM vouchers WHERE id = :voucher_id LIMIT 1');
                $query->bindValue(':voucher_id', (int) ($_POST['voucher_id'] ?? 0), PDO::PARAM_INT);
                $query->execute();
            }
            $status_message = 'Kupon został usunięty.';
        } elseif ($action === 'delete_all') {
            if (acp_table_exists('vouchers')) {
                $db->exec('DELETE FROM vouchers');
            }
            $status_message = 'Usunięto wszystkie kupony.';
        }
    } catch (Throwable $exception) {
        $error_message = $exception->getMessage();
    }
}

$vouchers_available = acp_table_exists('vouchers');
$vouchers = [];

if ($vouchers_available) {
    $query = $db->query('SELECT id, code, type, amount, used FROM vouchers ORDER BY type ASC, amount DESC, used DESC');
    $vouchers = $query->fetchAll(PDO::FETCH_ASSOC) ?: [];
}
?>
<section class="admin-page-section">
    <?php if (!$vouchers_available) { ?>
        <div class="admin-card p-4 shadow text-center text-secondary">Tabela vouchers nie istnieje w aktualnej bazie danych.</div>
    <?php } else { ?>
        <div class="row g-4">
            <div class="col-12 col-xl-4">
                <div class="admin-card p-4 shadow h-100">
                    <div class="chat_table_header p-2 mb-3">Generuj kupony</div>

                    <?php if ($status_message !== '') { ?>
                        <div class="admin-success-note mb-3"><?= htmlspecialchars($status_message) ?></div>
                    <?php } ?>
                    <?php if ($error_message !== '') { ?>
                        <div class="admin-auth-error mb-3"><?= htmlspecialchars($error_message) ?></div>
                    <?php } ?>

                    <form method="post" action="index.php?p=vouchers" class="d-flex flex-column gap-3">
                        <input type="hidden" name="action" value="create">
                        <div>
                            <label class="form-label admin-auth-label" for="voucher-amount">Wartość</label>
                            <input id="voucher-amount" type="number" name="amount" class="form-control admin-input" min="1" required>
                        </div>
                        <div>
                            <label class="form-label admin-auth-label" for="voucher-type">Typ</label>
                            <select id="voucher-type" name="type" class="form-select admin-select">
                                <option value="mushroom">Grzyby</option>
                                <option value="silver">Złoto</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label admin-auth-label" for="voucher-quantity">Ilość kodów</label>
                            <input id="voucher-quantity" type="number" name="quantity" class="form-control admin-input" min="1" required>
                        </div>
                        <div>
                            <label class="form-label admin-auth-label" for="voucher-uses">Ilość użyć</label>
                            <input id="voucher-uses" type="number" name="uses" class="form-control admin-input" min="1" required>
                        </div>
                        <button type="submit" class="admin-btn">Dodaj kupony</button>
                    </form>
                </div>
            </div>

            <div class="col-12 col-xl-8">
                <div class="admin-card p-4 shadow h-100">
                    <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
                        <div class="chat_table_header p-2 flex-grow-1">Wszystkie kupony (<?= count($vouchers) ?>)</div>
                        <form method="post" action="index.php?p=vouchers">
                            <input type="hidden" name="action" value="delete_all">
                            <button type="submit" class="admin-btn">Usuń wszystkie</button>
                        </form>
                    </div>

                    <div class="table-responsive">
                        <table class="table table-dark table-hover m-0 align-middle admin-data-table">
                            <thead>
                                <tr>
                                    <th>Kod</th>
                                    <th>Wartość</th>
                                    <th>Ilość użyć</th>
                                    <th>Akcja</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if ($vouchers) { ?>
                                    <?php foreach ($vouchers as $voucher) { ?>
                                        <tr>
                                            <td><?= htmlspecialchars($voucher['code']) ?></td>
                                            <td>
                                                <?php if ($voucher['type'] === 'silver') { ?>
                                                    <?= htmlspecialchars(acp_format_silver($voucher['amount'])) ?> złota
                                                <?php } else { ?>
                                                    <?= (int) $voucher['amount'] ?> grzybów
                                                <?php } ?>
                                            </td>
                                            <td><?= (int) $voucher['used'] ?></td>
                                            <td>
                                                <form method="post" action="index.php?p=vouchers">
                                                    <input type="hidden" name="action" value="delete">
                                                    <input type="hidden" name="voucher_id" value="<?= (int) $voucher['id'] ?>">
                                                    <button type="submit" class="admin-btn">Usuń</button>
                                                </form>
                                            </td>
                                        </tr>
                                    <?php } ?>
                                <?php } else { ?>
                                    <tr>
                                        <td colspan="4" class="text-center text-secondary">Brak aktywnych kuponów.</td>
                                    </tr>
                                <?php } ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    <?php } ?>
</section>