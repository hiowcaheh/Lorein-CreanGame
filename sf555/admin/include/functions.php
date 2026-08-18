<?php
function acp_get_current_user()
{
    global $db;

    if (empty($_SESSION['acp_user_id'])) {
        return false;
    }

    $query = $db->prepare('SELECT user_id, user_name, `group`, class FROM user_data WHERE user_id = :user_id LIMIT 1');
    $query->bindValue(':user_id', (int) $_SESSION['acp_user_id'], PDO::PARAM_INT);
    $query->execute();

    $user = $query->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        return false;
    }

    $user['user_id'] = (int) ($user['user_id'] ?? 0);
    $user['group'] = (int) ($user['group'] ?? 0);
    $user['class'] = (int) ($user['class'] ?? 0);

    return $user;
}

function check_admin()
{
    $user = acp_get_current_user();

    if (!$user) {
        return false;
    }

    return in_array((int) ($user['group'] ?? 0), [3, 4], true) ? $user : false;
}

function get_group()
{
    $user = acp_get_current_user();

    if (!$user) {
        return 0;
    }

    return (int) ($user['group'] ?? 0);
}

function acp_logout()
{
    unset($_SESSION['acp_user_id']);
}

function acp_resolve_page($page)
{
    $allowed_pages = ['login', 'logout', 'main', 'chat', 'config', 'game_settings', 'users', 'user', 'edit_user', 'edit_dungeons', 'vouchers', 'message', 'mass_message'];

    if (!is_string($page) || !in_array($page, $allowed_pages, true)) {
        return 'main';
    }

    return $page;
}

function acp_table_exists($table)
{
    global $db;

    static $cache = [];

    if (isset($cache[$table])) {
        return $cache[$table];
    }

    $query = $db->prepare('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name');
    $query->execute([':table_name' => $table]);
    $cache[$table] = (bool) $query->fetchColumn();

    return $cache[$table];
}

function acp_column_exists($table, $column)
{
    global $db;

    static $cache = [];
    $cache_key = $table . ':' . $column;

    if (isset($cache[$cache_key])) {
        return $cache[$cache_key];
    }

    $query = $db->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name AND COLUMN_NAME = :column_name');
    $query->execute([
        ':table_name' => $table,
        ':column_name' => $column,
    ]);
    $cache[$cache_key] = (bool) $query->fetchColumn();

    return $cache[$cache_key];
}

function acp_get_activity_column()
{
    static $activity_column;

    if ($activity_column !== null) {
        return $activity_column;
    }

    if (acp_column_exists('user_data', 'last_activity')) {
        $activity_column = 'last_activity';
    } elseif (acp_column_exists('user_data', 'last_activ')) {
        $activity_column = 'last_activ';
    } else {
        $activity_column = false;
    }

    return $activity_column;
}

function acp_fix_special_chars($text)
{
    $text = (string) $text;
    $replace_map = [
        '%u0142' => 'ł', '%u0141' => 'Ł', '%u0105' => 'ą', '%u0104' => 'Ą', '%u0119' => 'ę',
        '%u0118' => 'Ę', '%u0107' => 'ć', '%u0106' => 'Ć', '%u015B' => 'ś', '%u015A' => 'Ś',
        '%u017C' => 'ż', '%u017B' => 'Ż', '%u017A' => 'ź', '%u0179' => 'Ź', '%40' => '@',
    ];

    return str_replace(array_keys($replace_map), array_values($replace_map), $text);
}

function acp_get_dungeon_status_label($value)
{
    $value = (int) $value;

    if ($value <= 0) {
        return 'Nieotwarte';
    }
    if ($value >= 12) {
        return 'Ukończone';
    }
    if ($value <= 2) {
        return 'Poziom 1';
    }

    return 'Poziom ' . ($value - 1);
}

function acp_format_datetime($timestamp)
{
    $timestamp = (int) $timestamp;

    if ($timestamp <= 0) {
        return 'Brak danych';
    }

    return date('d.m.Y H:i:s', $timestamp);
}

function acp_format_silver($silver)
{
    return number_format(((int) $silver) / 100, 2, '.', ' ');
}

function acp_fetch_user_by_id($user_id)
{
    global $db;

    $user_id = (int) $user_id;
    if ($user_id <= 0) {
        return false;
    }

    $columns = [
        'user_id', 'user_name', 'lvl', 'silver', 'mushroom', 'email', 'exp', 'reg_date',
        'group', 'class', 'guild_id', 'guild_rank', 'honor', 'enabled', 'thirst', 'beers',
        'status', 'status_end', 'last_ip', 'ssid', 'golden_frame', 'user_desc', 'attr_str',
        'attr_agi', 'attr_int', 'attr_wit', 'attr_luck', 'tower_level'
    ];

    $activity_column = acp_get_activity_column();
    if ($activity_column) {
        $columns[] = $activity_column;
    }

    for ($i = 1; $i <= 13; $i++) {
        $columns[] = 'dungeon_' . $i;
    }

    foreach (['warned', 'kupon', 'chat_color'] as $optional_column) {
        if (acp_column_exists('user_data', $optional_column)) {
            $columns[] = $optional_column;
        }
    }

    $query = $db->prepare('SELECT ' . implode(', ', array_map(static function ($column) {
        return '`' . $column . '`';
    }, $columns)) . ' FROM user_data WHERE user_id = :user_id LIMIT 1');
    $query->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $query->execute();
    $user = $query->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        return false;
    }

    $user['warned'] = $user['warned'] ?? 'no';
    $user['kupon'] = $user['kupon'] ?? 0;
    $user['chat_color'] = $user['chat_color'] ?? 0;

    return $user;
}

function acp_get_player_css_class($player)
{
    $chat_color = (int) ($player['chat_color'] ?? 0);
    if ($chat_color > 0) {
        return 'color' . $chat_color;
    }

    switch ((int) ($player['group'] ?? 1)) {
        case 2:
            return 'VIP';
        case 3:
            return 'Moderator';
        case 4:
            return 'Admin';
        default:
            return 'Gracz';
    }
}