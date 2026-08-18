<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
$has_access = get_group() === 4;
$status_message = '';
$error_message = '';
$meta_refresh_url = '';
$config_definitions = [
    'HOST' => [
        'label' => 'HOST',
        'type' => 'text',
        'default' => 'localhost',
    ],
    'LANGUAGE' => [
        'label' => 'LANGUAGE',
        'type' => 'text',
        'default' => 'en',
    ],
    'BACKGROUND' => [
        'label' => 'BACKGROUND',
        'type' => 'number',
        'default' => '1',
    ],
    'MAIL' => [
        'label' => 'MAIL',
        'type' => 'email',
        'default' => 'admin@local.host',
    ],
    'SYSTEM_VERSION' => [
        'label' => 'SYSTEM_VERSION',
        'type' => 'number',
        'default' => '555',
    ],
    'GAME_VERSION' => [
        'label' => 'GAME_VERSION',
        'type' => 'text',
        'default' => '1.0.0',
    ],
    'EVENT' => [
        'label' => 'EVENT',
        'type' => 'select',
        'default' => '0',
        'options' => [
            '0' => 'Brak',
            '1' => 'Doświadczenia',
            '2' => 'Epicki Weekend',
            '3' => 'Złota',
            '4' => 'Grzybów',
            '5' => 'Wszystkiego',
            '6' => 'Octoberfest',
        ],
    ],
    'SEASON_EPICS' => [
        'label' => 'SEASON_EPICS',
        'type' => 'select',
        'default' => '0',
        'options' => [
            '0' => 'brak',
            '1' => 'wielkanoc',
            '2' => 'halloween',
            '3' => 'boże narodzenie',
        ],
    ],
];

if ($has_access && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!acp_table_exists('server_config')) {
            throw new RuntimeException('Tabela server_config nie istnieje w aktualnej bazie danych.');
        }

        $insert = $db->prepare('INSERT IGNORE INTO server_config(name, value) VALUES(?, ?)');
        foreach ($config_definitions as $name => $definition) {
            $insert->execute([$name, (string) $definition['default']]);
        }

        $query = $db->prepare('UPDATE server_config SET value = ? WHERE name = ?');
        foreach ($config_definitions as $name => $definition) {
            $value = isset($_POST[$name]) ? trim((string) $_POST[$name]) : (string) $definition['default'];

            if ($definition['type'] === 'number') {
                $value = (string) max(0, (int) $value);
            } elseif ($definition['type'] === 'select') {
                $options = $definition['options'] ?? [];
                if (!array_key_exists($value, $options)) {
                    $value = (string) $definition['default'];
                }
            } elseif ($value === '') {
                $value = (string) $definition['default'];
            }

            $query->execute([$value, $name]);
        }

        $status_message = 'Konfiguracja serwera została zapisana.';
        $meta_refresh_url = 'index.php?p=config';
    } catch (Throwable $exception) {
        $error_message = $exception->getMessage();
    }
}

$config_values = [];
foreach ($config_definitions as $name => $definition) {
    $config_values[$name] = (string) $definition['default'];
}

if (acp_table_exists('server_config')) {
    $insert = $db->prepare('INSERT IGNORE INTO server_config(name, value) VALUES(?, ?)');
    foreach ($config_definitions as $name => $definition) {
        $insert->execute([$name, (string) $definition['default']]);
    }

    $query = $db->query('SELECT name, value FROM server_config');
    foreach ($query->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        if (isset($config_definitions[$row['name']])) {
            $config_values[$row['name']] = (string) $row['value'];
        }
    }
}
?>
<section class="admin-page-section">
    <?php if ($meta_refresh_url !== '') { ?>
        <meta http-equiv="refresh" content="0;url=<?= htmlspecialchars($meta_refresh_url) ?>">
    <?php } ?>

    <?php if (!$has_access) { ?>
        <div class="admin-card p-4 shadow text-center text-secondary">Brak uprawnień do konfiguracji serwera.</div>
    <?php } else { ?>
        <div class="admin-card p-4 shadow">
            <div class="chat_table_header p-2 mb-3">Konfiguracja Serwera</div>

            <?php if ($status_message !== '') { ?>
                <div class="admin-success-note mb-3"><?= htmlspecialchars($status_message) ?></div>
            <?php } ?>

            <?php if ($error_message !== '') { ?>
                <div class="admin-auth-error mb-3"><?= htmlspecialchars($error_message) ?></div>
            <?php } ?>

            <form method="post" action="index.php?p=config">
                <?php foreach ($config_definitions as $name => $definition) { ?>
                    <?php $field_id = 'config-' . strtolower(str_replace('_', '-', $name)); ?>
                    <div class="row mb-3 align-items-center">
                        <div class="col-12 col-lg-4 mb-2 mb-lg-0">
                            <label for="<?= htmlspecialchars($field_id) ?>" class="form-label admin-auth-label m-0"><?= htmlspecialchars($definition['label']) ?></label>
                        </div>
                        <div class="col-12 col-lg-8">
                            <?php if (($definition['type'] ?? 'text') === 'select') { ?>
                                <select id="<?= htmlspecialchars($field_id) ?>" name="<?= htmlspecialchars($name) ?>" class="form-select admin-select w-100 text-center">
                                    <?php foreach (($definition['options'] ?? []) as $option_value => $option_label) { ?>
                                        <option value="<?= htmlspecialchars($option_value) ?>" <?= (string) ($config_values[$name] ?? $definition['default']) === (string) $option_value ? 'selected' : '' ?>><?= htmlspecialchars($option_label) ?></option>
                                    <?php } ?>
                                </select>
                            <?php } else { ?>
                                <input
                                    id="<?= htmlspecialchars($field_id) ?>"
                                    type="<?= htmlspecialchars($definition['type'] ?? 'text') ?>"
                                    name="<?= htmlspecialchars($name) ?>"
                                    value="<?= htmlspecialchars((string) ($config_values[$name] ?? $definition['default'])) ?>"
                                    class="admin-input w-100 text-center"
                                >
                            <?php } ?>
                        </div>
                    </div>
                <?php } ?>

                <div class="row mt-4">
                    <div class="col-12 d-flex justify-content-end">
                        <button type="submit" class="admin-btn">Zapisz konfigurację</button>
                    </div>
                </div>
            </form>
        </div>
    <?php } ?>
</section>