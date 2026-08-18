<?php
require_once '../globals.php';
require_once __DIR__ . '/include/functions.php';

define('IN_ITEMSHOP', true);
define('IN_ACP', true);

$current_page = acp_resolve_page($_GET['p'] ?? 'main');
$current_user = acp_get_current_user();
$user_data = check_admin();

require __DIR__ . '/templates/header.php';

if ($current_page === 'logout') {
	require __DIR__ . '/pages/login.php';
	require __DIR__ . '/templates/footer.php';
	exit;
}

if (!$current_user) {
	require __DIR__ . '/pages/login.php';
	require __DIR__ . '/templates/footer.php';
	exit;
}

if (!$user_data) {
	require __DIR__ . '/templates/login_required.php';
	require __DIR__ . '/templates/footer.php';
	exit;
}

if ($current_page === 'login') {
	header('Location: index.php?p=main');
	exit;
}

$page_map = [
	'main' => 'main.php',
	'chat' => 'chat.php',
	'config' => 'config.php',
	'game_settings' => 'game_settings.php',
	'users' => 'users.php',
	'user' => 'user.php',
	'edit_user' => 'edit_user.php',
	'edit_dungeons' => 'edit_dungeons.php',
	'vouchers' => 'vouchers.php',
	'message' => 'message.php',
	'mass_message' => 'mass_message.php',
];

$sidebar_view = 'sidebar.php';
$navbar_view = 'navbar.php';
$main_view = 'main_content.php';
$page_view = __DIR__ . '/pages/' . $page_map[$current_page];

require __DIR__ . '/templates/layout.php';
require __DIR__ . '/templates/footer.php';