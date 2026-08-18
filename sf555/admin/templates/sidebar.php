<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
$users_active = in_array($current_page, ['users', 'user', 'edit_user', 'edit_dungeons', 'message'], true);
?>
<aside class="col-lg-3 col-xl-2 offcanvas-lg offcanvas-start h-100" id="sidebarMenu" tabindex="-1" aria-labelledby="sidebarMenuLabel" style="background: #050505; border-right: 1px solid #3D3D3D;">
    <div class="sidebar-content d-flex flex-column justify-content-between h-100">
        <div class="w-100">
            <div class="text-center py-3 mb-4 border-bottom border-dark border-opacity-50 position-relative">
                <span class="fs-4 fw-bold text-uppercase Admin" id="sidebarMenuLabel">ADMIN PANEL</span>
                <button type="button" class="btn-close btn-close-white d-lg-none position-absolute end-0 top-0 mt-3 me-3" data-bs-dismiss="offcanvas" data-bs-target="#sidebarMenu" aria-label="Zamknij"></button>
            </div>

            <nav class="nav flex-column gap-2" aria-label="Nawigacja panelu administratora">
                <a href="index.php?p=main" class="btn admin-nav-btn w-100 text-center <?= $current_page === 'main' ? 'active' : '' ?>">Strona Główna</a>
                <a href="index.php?p=chat" class="btn admin-nav-btn w-100 text-center <?= $current_page === 'chat' ? 'active' : '' ?>">Chat</a>
                <a href="index.php?p=users" class="btn admin-nav-btn w-100 text-center <?= $users_active ? 'active' : '' ?>">Gracze</a>
                <?php if (get_group() == 4): ?>
                <a href="index.php?p=config" class="btn admin-nav-btn w-100 text-center <?= $current_page === 'config' ? 'active' : '' ?>">Konfiguracja Serwera</a>
                <a href="index.php?p=game_settings" class="btn admin-nav-btn w-100 text-center <?= $current_page === 'game_settings' ? 'active' : '' ?>">Ustawienia Gry</a>
                <a href="index.php?p=vouchers" class="btn admin-nav-btn w-100 text-center <?= $current_page === 'vouchers' ? 'active' : '' ?>">Kupony</a>
                <a href="index.php?p=mass_message" class="btn admin-nav-btn w-100 text-center <?= $current_page === 'mass_message' ? 'active' : '' ?>">Masowe Wiadomości</a>
                <?php endif; ?>
                <a href="index.php?p=logout" class="btn admin-nav-btn admin-logout-btn w-100 text-center">Wyloguj</a>
            </nav>
        </div>

        <footer class="text-center pt-3 border-top border-dark border-opacity-50 small text-secondary">
            <p class="m-0">Panel administracyjny<br>Uprawnienia: <?= $current_user['group'] == 3 ? 'Moderator' : 'Administrator' ?></p>
        </footer>
    </div>
</aside>