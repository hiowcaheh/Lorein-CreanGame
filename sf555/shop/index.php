<?php
require_once '../globals.php';

define('IN_ITEMSHOP', true);

$user_data = loaduserdata();
$is_logged_in = !empty($user_data);

if ($is_logged_in) {
    $sidebar_view = 'sidebar.php';
    $navbar_view = 'navbar.php';
    $main_view = 'main_content.php';
    
    require __DIR__ . '/templates/header.php';
    require __DIR__ . '/templates/layout.php';
    require __DIR__ . '/templates/footer.php';
} else {
    require __DIR__ . '/templates/header.php';
    require __DIR__ . '/templates/login_required.php';
    require __DIR__ . '/templates/footer.php';
}