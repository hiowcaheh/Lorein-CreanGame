<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<section class="admin-access-denied d-flex align-items-center justify-content-center">
    <div class="admin-access-card text-center">
        <div class="admin-access-label">Brak dostępu</div>
        <h1 class="h3 mb-3 text-success">To konto nie ma uprawnień administratora</h1>
        <p class="mb-4 text-light opacity-75">Sesja ACP istnieje, ale zalogowany użytkownik nie należy do grupy Admin.</p>
        <a href="index.php?p=logout" class="admin-btn">Wyloguj się</a>
    </div>
</section>