<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>

<div class="row g-4">
    <?php
    // Definicja danych eliksirów
    $elixirs = [
        1 => ['img' => 'e1.png', 'price' => 10, 'name' => 'Eliksir Bogów ( I )', 'desc' => 'Na stałe zwiększa twoje wszystkie cechy o 5 punktów'],
        2 => ['img' => 'e2.png', 'price' => 15, 'name' => 'Eliksir Bogów ( II )', 'desc' => 'Na stałe zwiększa twoje wszystkie cechy o 10 punktów'],
        3 => ['img' => 'e3.png', 'price' => 20, 'name' => 'Eliksir Bogów ( III )', 'desc' => 'Na stałe zwiększa twoje wszystkie cechy o 15 punktów'],
    ];

    foreach ($elixirs as $id => $data) {
    ?>
    <div class="col-12 col-md-4">
        <div class="item-card h-100 p-4 d-flex flex-column justify-content-between text-center shadow">
            <div class="price-badge mx-auto mb-3">
                <img src="images/<?= $data['img'] ?>" alt="Eliksir">
                <img src="images/grzyb.png" alt="Grzyby">
                <span class="fw-bold fs-5 text-white"><?= $data['price'] ?></span>
            </div>
            
            <div class="mb-4">
                <button class="btn btn-danger w-100 fw-bold shadow py-2 fs-5" onclick="buyItem({action: 'elixirs', item: <?= $id ?>})">KUP</button>
            </div>
            
            <div class="mt-auto">
                <h3 class="fs-5 fw-bold text-white mb-2"><?= $data['name'] ?></h3>
                <p class="m-0" style="font-size: 0.9rem; color: #dcdcdc;"><?= $data['desc'] ?></p>
            </div>
        </div>
    </div>
    <?php } ?>
</div>