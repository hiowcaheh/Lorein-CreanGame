<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<body>
<div id="game-dashboard" class="container-fluid p-0">
    <div class="row g-0 h-100">
        <?php include __DIR__ . '/' . $sidebar_view; ?>

        <main class="col-lg-9 col-xl-10 main-content text-white">
            <?php include __DIR__ . '/' . $navbar_view; ?>
            <?php include __DIR__ . '/' . $main_view; ?>
        </main>
    </div>
</div>