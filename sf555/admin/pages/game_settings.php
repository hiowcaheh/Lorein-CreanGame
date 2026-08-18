<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
$has_access = get_group() === 4;
$status_message = '';
$error_message = '';
$meta_refresh_url = '';
$settings_definitions = [
    'POTION_DUR' => [
        'label' => 'Czas trwania mikstury w godzinach',
        'type' => 'number',
        'default' => '72',
    ],
    'FILL_EPIC' => [
        'label' => 'Aura za epicki przedmiot w WC',
        'type' => 'number',
        'default' => '50',
    ],
    'FILL' => [
        'label' => 'Aura za przedmiot w WC',
        'type' => 'number',
        'default' => '25',
    ],
    'MUSH_CHANCE' => [
        'label' => 'Szansa na grzyba z misji w karczmie (%)',
        'type' => 'number',
        'default' => '15',
    ],
    'MUSH_CHANCE_EVENT' => [
        'label' => 'Szansa na grzyba z misji podczas eventu (%)',
        'type' => 'number',
        'default' => '45',
    ],
    'MUSH_DROP_FOUND' => [
        'label' => 'Ilość znalezionych grzybów w karczmie',
        'type' => 'number',
        'default' => '1',
    ],
    'GAMBLER' => [
        'label' => 'Szansa na wygraną u hazardzisty (%)',
        'type' => 'number',
        'default' => '33',
    ],
    'ITEMGEN_PMUSH_EPIC' => [
        'label' => 'Koszt epika w grzybach',
        'type' => 'number',
        'default' => '15',
    ],
    'ITEMGEN_PMUSH_TWOSTATS' => [
        'label' => 'Koszt dwustata w grzybach',
        'type' => 'number',
        'default' => '10',
    ],
    'ITEMGEN_PMUSH_LIFEPOT' => [
        'label' => 'Koszt mikstury życia w grzybach',
        'type' => 'number',
        'default' => '15',
    ],
    'GUILD_S_MINLEVEL' => [
        'label' => 'Wymagany poziom do wpłacania do gildii',
        'type' => 'number',
        'default' => '10',
    ],
    'SERVER_RESTART' => [
        'label' => 'Czas restartu serwera jako UNIX Timestamp',
        'type' => 'text',
        'default' => '1589148000',
        'hint' => 'Domyślna wartość 1589148000 oznacza 11 maja 2020 00:00:00.',
    ],
    'FILL_POTION' => [
        'label' => 'Aura za miksturę w WC',
        'type' => 'number',
        'default' => '10',
    ],
    'QUEST_EXP' => [
        'label' => 'Bonusowe doświadczenie za wykonanie misji',
        'type' => 'number',
        'default' => '150',
    ],
    'QUEST_GOLD' => [
        'label' => 'Bonusowa ilość złota za wykonanie misji',
        'type' => 'number',
        'default' => '600',
    ],
    'EPIC_CHANCE_SHOP' => [
        'label' => 'Szansa na epika w sklepie (%)',
        'type' => 'number',
        'default' => '2',
    ],
    'EPIC_CHANCE_SHOP_EVENT' => [
        'label' => 'Szansa na epika w sklepie podczas eventu (%)',
        'type' => 'number',
        'default' => '8',
    ],
    'WORK_MULTIPLIER' => [
        'label' => 'Mnożnik zarobków z pracy',
        'type' => 'float',
        'default' => '1',
    ],
    'UNLIMITED_BEERS' => [
        'label' => 'Nieograniczone piwa',
        'type' => 'select',
        'default' => '0',
        'options' => [
            '0' => 'Wyłączone',
            '1' => 'Włączone',
        ],
    ],
];

if ($has_access && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!acp_table_exists('game_settings')) {
            throw new RuntimeException('Tabela game_settings nie istnieje w aktualnej bazie danych.');
        }

        $insert = $db->prepare('INSERT IGNORE INTO game_settings(setting, value) VALUES(?, ?)');
        foreach ($settings_definitions as $setting => $definition) {
            $insert->execute([$setting, (string) $definition['default']]);
        }

        $query = $db->prepare('UPDATE game_settings SET value = ? WHERE setting = ?');
        foreach ($settings_definitions as $setting => $definition) {
            $value = isset($_POST[$setting]) ? trim((string) $_POST[$setting]) : (string) $definition['default'];

            if ($definition['type'] === 'number') {
                $value = (string) max(0, (int) $value);
            } elseif ($definition['type'] === 'float') {
                $normalized = str_replace(',', '.', $value);
                $value = is_numeric($normalized) ? (string) max(0, (float) $normalized) : (string) $definition['default'];
            } elseif ($definition['type'] === 'select') {
                $options = $definition['options'] ?? [];
                if (!array_key_exists($value, $options)) {
                    $value = (string) $definition['default'];
                }
            } elseif ($value === '') {
                $value = (string) $definition['default'];
            }

            $query->execute([$value, $setting]);
        }

        $status_message = 'Ustawienia gry zostały zapisane.';
        $meta_refresh_url = 'index.php?p=game_settings';
    } catch (Throwable $exception) {
        $error_message = $exception->getMessage();
    }
}

$settings_values = [];
foreach ($settings_definitions as $setting => $definition) {
    $settings_values[$setting] = (string) $definition['default'];
}

if (acp_table_exists('game_settings')) {
    $insert = $db->prepare('INSERT IGNORE INTO game_settings(setting, value) VALUES(?, ?)');
    foreach ($settings_definitions as $setting => $definition) {
        $insert->execute([$setting, (string) $definition['default']]);
    }

    $query = $db->query('SELECT setting, value FROM game_settings');
    foreach ($query->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        if (isset($settings_definitions[$row['setting']])) {
            $settings_values[$row['setting']] = (string) $row['value'];
        }
    }
}
?>
<section class="admin-page-section">
    <?php if ($meta_refresh_url !== '') { ?>
        <meta http-equiv="refresh" content="0;url=<?= htmlspecialchars($meta_refresh_url) ?>">
    <?php } ?>

    <?php if (!$has_access) { ?>
        <div class="admin-card p-4 shadow text-center text-secondary">Brak uprawnień do ustawień gry.</div>
    <?php } else { ?>
        <div class="admin-card p-4 shadow">
            <div class="chat_table_header p-2 mb-3">Ustawienia Gry</div>

            <?php if ($status_message !== '') { ?>
                <div class="admin-success-note mb-3"><?= htmlspecialchars($status_message) ?></div>
            <?php } ?>

            <?php if ($error_message !== '') { ?>
                <div class="admin-auth-error mb-3"><?= htmlspecialchars($error_message) ?></div>
            <?php } ?>

            <form method="post" action="index.php?p=game_settings">
                <?php foreach ($settings_definitions as $setting => $definition) { ?>
                    <?php $field_id = 'game-setting-' . strtolower(str_replace('_', '-', $setting)); ?>
                    <div class="row mb-3 align-items-center">
                        <div class="col-12 col-lg-4 mb-2 mb-lg-0">
                            <label for="<?= htmlspecialchars($field_id) ?>" class="form-label admin-auth-label m-0"><?= htmlspecialchars($setting) ?></label>
                        </div>
                        <div class="col-12 col-lg-8">
                            <?php if (($definition['type'] ?? 'text') === 'select') { ?>
                                <select id="<?= htmlspecialchars($field_id) ?>" name="<?= htmlspecialchars($setting) ?>" class="form-select admin-select w-100 text-center">
                                    <?php foreach (($definition['options'] ?? []) as $option_value => $option_label) { ?>
                                        <option value="<?= htmlspecialchars($option_value) ?>" <?= (string) ($settings_values[$setting] ?? $definition['default']) === (string) $option_value ? 'selected' : '' ?>><?= htmlspecialchars($option_label) ?></option>
                                    <?php } ?>
                                </select>
                            <?php } else { ?>
                                <input
                                    id="<?= htmlspecialchars($field_id) ?>"
                                    type="<?= ($definition['type'] ?? 'text') === 'float' ? 'number' : htmlspecialchars($definition['type'] ?? 'text') ?>"
                                    <?= ($definition['type'] ?? 'text') === 'float' ? 'step="0.01"' : '' ?>
                                    name="<?= htmlspecialchars($setting) ?>"
                                    value="<?= htmlspecialchars((string) ($settings_values[$setting] ?? $definition['default'])) ?>"
                                    class="admin-input w-100 text-center"
                                >
                            <?php } ?>

                            <div class="small text-secondary mt-1"><?= htmlspecialchars($definition['label']) ?></div>
                            <?php if (!empty($definition['hint'])) { ?>
                                <div class="small text-secondary mt-1"><?= htmlspecialchars((string) $definition['hint']) ?></div>
                            <?php } ?>
                        </div>
                    </div>
                <?php } ?>

                <div class="row mt-4">
                    <div class="col-12 d-flex justify-content-end">
                        <button type="submit" class="admin-btn">Zapisz ustawienia gry</button>
                    </div>
                </div>
            </form>
        </div>
    <?php } ?>
</section>