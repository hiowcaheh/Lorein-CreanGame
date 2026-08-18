<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<header class="player-info-header d-flex justify-content-between align-items-center gap-2">
    <div class="d-flex align-items-center gap-3">
        <button class="btn menu-toggler d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu" aria-controls="sidebarMenu">
            <span style="font-size: 1.2rem; line-height: 1; display: block;">&#9776;</span>
        </button>

        <?php if ($is_logged_in) { ?>
        <h1 class="<?= get_color($user_data) ?> fs-4 fs-sm-3 navbar-player-nick" data-default-class="<?= get_color($user_data) ?>">
            <?= htmlspecialchars($user_data['user_name']) ?>
        </h1>
        <?php } else { ?>
            <h1 class="fs-4 fs-sm-3 text-white m-0">ItemShop</h1>
        <?php } ?>
    </div>

    <?php if ($is_logged_in) { ?>
        <div class="wallet shadow-sm">
            <div class="wallet-item">
                <img src="images/zloto.png" alt="Złoto" title="Złote Monety" width="20">
                <span class="gold-text" data-balance="silver" style="font-size: 0.95rem;"><?= number_format(((float) ($user_data['silver'] ?? 0)) / 100, 2, '.', ' ') ?></span>
            </div>
            <div class="text-secondary opacity-50">|</div>
            <div class="wallet-item">
                <img src="images/grzyb.png" alt="Grzyby" title="Grzyby" width="20">
                <span class="shroom-text" data-balance="mushroom" style="font-size: 0.95rem;"><?= number_format((int) ($user_data['mushroom'] ?? 0), 0, '.', ' ') ?></span>
            </div>
        </div>
    <?php } ?>
</header>