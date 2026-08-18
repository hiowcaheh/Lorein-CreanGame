<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<div class="row g-4">
    <?php
    // Definiujemy dane kluczy, żeby nie powtarzać kodu HTML
    $keys = [
        1 => ['img' => 'key1.png', 'price' => 25, 'name' => 'Klucz I'],
        2 => ['img' => 'key2.png', 'price' => 35, 'name' => 'Klucz II'],
        3 => ['img' => 'key3.png', 'price' => 45, 'name' => 'Klucz III'],
        4 => ['img' => 'key4.png', 'price' => 55, 'name' => 'Klucz IV'],
        5 => ['img' => 'key5.png', 'price' => 65, 'name' => 'Klucz V'],
        6 => ['img' => 'key6.png', 'price' => 75, 'name' => 'Klucz VI'],
        7 => ['img' => 'key7.png', 'price' => 85, 'name' => 'Klucz VII'],
        8 => ['img' => 'key8.png', 'price' => 95, 'name' => 'Klucz VIII'],
        9 => ['img' => 'key9.png', 'price' => 100, 'name' => 'Klucz IX'],
    ];

    foreach ($keys as $id => $data) {
    ?>
    <div class="col-12 col-md-4">
        <div class="item-card h-100 p-4 d-flex flex-column justify-content-between text-center shadow">
            <div class="price-badge mx-auto mb-3">
                <img src="images/<?= $data['img'] ?>" alt="Klucz">
                <img src="images/grzyb.png" alt="Grzyby">
                <span class="fw-bold fs-5 text-white"><?= $data['price'] ?></span>
            </div>
            
            <div class="mb-4">
                <button class="btn btn-danger w-100 fw-bold shadow py-2 fs-5" onclick="buyItem({action: 'dungeon', item: <?= $id ?>})">KUP</button>
            </div>
            
            <div class="mt-auto">
                <h3 class="fs-5 fw-bold text-white mb-2"><?= $data['name'] ?></h3>
                <p class="m-0" style="font-size: 0.9rem; color: #dcdcdc;">Otwiera lochy</p>
            </div>
        </div>
    </div>
    <?php } ?>
</div>