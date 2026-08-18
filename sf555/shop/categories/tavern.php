<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>

<div class="row g-4">
    <?php
    // Definicja danych dla przekąsek
    $karczma_items = [
        1 => ['img' => 'posilek.png', 'price' => 3, 'name' => 'Przekąska I', 'desc' => 'Resetuje 1 wypite piwo w karczmie'],
        2 => ['img' => 'posilek2.png', 'price' => 10, 'name' => 'Przekąska II', 'desc' => 'Resetuje 5 wypitych piw w karczmie'],
        3 => ['img' => 'posilek3.png', 'price' => 25, 'name' => 'Przekąska III', 'desc' => 'Resetuje 10 wypitych piw w karczmie'],
    ];

    foreach ($karczma_items as $id => $data) {
    ?>
    <div class="col-12 col-md-4">
        <div class="item-card h-100 p-4 d-flex flex-column justify-content-between text-center shadow">
            <div class="price-badge mx-auto mb-3">
                <img src="images/<?= $data['img'] ?>" alt="Przekąska">
                <img src="images/grzyb.png" alt="Grzyby">
                <span class="fw-bold fs-5 text-white"><?= $data['price'] ?></span>
            </div>
            
            <div class="mb-4">
                <button class="btn btn-danger w-100 fw-bold shadow py-2 fs-5" onclick="buyItem({action: 'tavern', item: <?= $id ?>})">KUP</button>
            </div>
            
            <div class="mt-auto">
                <h3 class="fs-5 fw-bold text-white mb-2"><?= $data['name'] ?></h3>
                <p class="m-0" style="font-size: 0.9rem; color: #dcdcdc;"><?= $data['desc'] ?></p>
            </div>
        </div>
    </div>
    <?php } ?>
</div>