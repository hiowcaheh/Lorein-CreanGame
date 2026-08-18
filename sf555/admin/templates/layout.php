<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<div id="game-dashboard" class="container-fluid p-0">
    <div class="row g-0 h-100">
        <?php require __DIR__ . '/' . $sidebar_view; ?>

        <main class="col-lg-9 col-xl-10 main-content d-flex flex-column">
            <?php require __DIR__ . '/' . $navbar_view; ?>
            <?php require __DIR__ . '/' . $main_view; ?>
        </main>
    </div>
</div>