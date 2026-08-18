<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<div class="shop-viewport">
    <div class="tab-content" id="shop-tab-content">
        <section class="tab-pane fade show active" id="mikstury" role="tabpanel" aria-labelledby="mikstury-tab" tabindex="0">
            <?php require __DIR__ . '/../categories/elixirs.php'; ?>
        </section>

        <section class="tab-pane fade" id="karczma" role="tabpanel" aria-labelledby="karczma-tab" tabindex="0">
            <?php require __DIR__ . '/../categories/tavern.php'; ?>
        </section>

        <section class="tab-pane fade" id="lochy" role="tabpanel" aria-labelledby="lochy-tab" tabindex="0">
            <?php require __DIR__ . '/../categories/dungeon.php'; ?>
        </section>

        <section class="tab-pane fade" id="smith" role="tabpanel" aria-labelledby="smith-tab" tabindex="0">
            <?php require __DIR__ . '/../categories/smith.php'; ?>
        </section>

        <section class="tab-pane fade" id="chatcolor" role="tabpanel" aria-labelledby="chatcolor-tab" tabindex="0">
            <?php require __DIR__ . '/../categories/chatcolor.php'; ?>
        </section>

        <section class="tab-pane fade" id="redeemvoucher" role="tabpanel" aria-labelledby="redeemvoucher-tab" tabindex="0">
            <?php require __DIR__ . '/../categories/redeemvoucher.php'; ?>
        </section>
    </div>
</div>