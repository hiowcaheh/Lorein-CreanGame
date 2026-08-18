<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
$page_titles = [
    'main' => 'Dashboard',
    'chat' => 'Moderacja Czatu',
    'config' => 'Konfiguracja Serwera',
    'game_settings' => 'Ustawienia Gry',
    'users' => 'Lista Graczy',
    'user' => 'Profil Gracza',
    'edit_user' => 'Edycja Gracza',
    'edit_dungeons' => 'Edycja Lochów',
    'vouchers' => 'Kupony',
    'message' => 'Wiadomość Prywatna',
    'mass_message' => 'Masowe Wiadomości',
];
?>
<header class="admin-info-header d-flex justify-content-between align-items-center">
    <div class="d-flex align-items-center flex-grow-1 min-w-0">
        <button class="btn admin-btn d-lg-none me-3 py-1 px-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu" aria-controls="sidebarMenu" style="font-size: 1.2rem; line-height: 1;">
            ☰
        </button>
        <h1 class="fs-4 m-0">Zalogowany jako: <span class="Admin"><?= htmlspecialchars($user_data['user_name']) ?></span></h1>
    </div>
    <div class="badge bg-dark border border-secondary border-opacity-25 px-3 py-2 fs-6 text-uppercase tracking-wider">
        <?= htmlspecialchars($page_titles[$current_page] ?? 'Panel') ?>
    </div>
</header>