<?php 
if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); 

$itemTypeMap = [
    1 => 'Broń',
    3 => 'Napierśnik',
    4 => 'Buty',
    5 => 'Rękawice',
    6 => 'Nakrycie głowy',
    7 => 'Pas',
    8 => 'Amulet',
    9 => 'Pierścień'
];

$qry = $db->prepare("SELECT * FROM items WHERE item_type IN (1, 3, 4, 5, 6, 7, 8, 9) AND slot < 10 AND owner_id = :user_id");
$qry->execute([':user_id' => $user_data['user_id']]);
$items_equipment = $qry->fetchAll(PDO::FETCH_ASSOC); // Ekwipunek

$qry = $db->prepare("SELECT * FROM items WHERE item_type IN (1, 3, 4, 5, 6, 7, 8, 9) AND slot >= 10 AND owner_id = :user_id");
$qry->execute([':user_id' => $user_data['user_id']]);
$items_inventory = $qry->fetchAll(PDO::FETCH_ASSOC); // Plecak

$qry = $db->prepare("SELECT * FROM tower_helper_items WHERE item_type IN (1, 3, 4, 5, 6, 7, 8, 9) AND tower_helper = 1 AND user_id = :user_id");
$qry->execute([':user_id' => $user_data['user_id']]);
$tower_helper_item1 = $qry->fetchAll(PDO::FETCH_ASSOC); // Barbarzyński barbar

$qry = $db->prepare("SELECT * FROM tower_helper_items WHERE item_type IN (1, 3, 4, 5, 6, 7, 8, 9) AND tower_helper = 2 AND user_id = :user_id");
$qry->execute([':user_id' => $user_data['user_id']]);
$tower_helper_item2 = $qry->fetchAll(PDO::FETCH_ASSOC); // Maguś Mariusz

$qry = $db->prepare("SELECT * FROM tower_helper_items WHERE item_type IN (1, 3, 4, 5, 6, 7, 8, 9) AND tower_helper = 3 AND user_id = :user_id");
$qry->execute([':user_id' => $user_data['user_id']]);
$tower_helper_item3 = $qry->fetchAll(PDO::FETCH_ASSOC); // Szczwana Kunegunda

// Funkcja pomocnicza generująca HTML karty przedmiotu dla kowala
function renderBlacksmithItem($item, $itemTypeMap, $isTowerHelper = false) {
    $currentUpgrade = (int)($item['upgrade_level'] ?? 0);
    $isEpic = (($item['item_id'] % 1000) >= 50);
    
    // Obliczanie szansy i kosztów na kowalu
    $successChance = 100 - (10 * $currentUpgrade);
    $goldCost = $item['gold'] * (1 + 0.5 * $currentUpgrade);
    $shroomCost = $isEpic ? (10 * ($currentUpgrade + 1)) : 0;
    
    $isMaxed = $currentUpgrade >= 10;
    
    // Budowanie tekstów atrybutów
    $attributesHtml = '';
    $statNames = [1 => 'Siła', 2 => 'Zręczność', 3 => 'Inteligencja', 4 => 'Wytrzymałość', 5 => 'Szczęście', 6 => 'Wszystkie cechy'];
    
    for ($i = 1; $i <= 3; $i++) {
        $type = (int)$item['atr_type_'.$i];
        $val = (int)$item['atr_val_'.$i];
        if ($type > 0 && $val > 0 && isset($statNames[$type])) {
            $attributesHtml .= "<div>{$statNames[$type]}: <span class='text-info fw-bold atr-val-{$i}'>{$val}</span></div>";
        }
    }
    ?>
    <div class="col-12 col-md-6 col-xl-4 blacksmith-item-col" id="item-card-<?= $isTowerHelper ? 'helper-' : '' ?><?= $item['id'] ?>">
        <div class="item-card h-100 p-4 d-flex flex-column justify-content-between text-center shadow">
            
            <div>
                <div class="d-flex justify-content-between align-items-center mb-2 border-bottom border-secondary border-opacity-25 pb-1">
                    <span class="text-secondary small"><?= $itemTypeMap[$item['item_type']] ?? 'Przedmiot' ?></span>
                    <span class="badge <?= $isEpic ? 'bg-warning text-dark' : 'bg-secondary' ?> upgrade-badge fw-bold">
                        <?= $currentUpgrade > 0 ? "+{$currentUpgrade}" : "Brak ulepszeń" ?>
                    </span>
                </div>
                
                <h3 class="fs-5 fw-bold <?= $isEpic ? 'text-warning' : 'text-white' ?> item-name mb-3">
                    <?= htmlspecialchars($item['name'] ?? 'Przedmiot') ?>
                </h3>
                
                <div class="item-stats text-start bg-dark bg-opacity-25 p-3 rounded mb-3 small">
                    <?php if ((int)$item['item_type'] === 1): // Broń ?>
                        <div class="text-danger fw-bold mb-1">
                            Obrażenia: <span class="dmg-min"><?= $item['dmg_min'] ?></span> - <span class="dmg-max"><?= $item['dmg_max'] ?></span>
                        </div>
                    <?php endif; ?>
                    <?= $attributesHtml ?>
                </div>
            </div>

            <div class="mt-auto">
                <?php if ($isMaxed): ?>
                    <div class="alert alert-success py-2 m-0 small fw-bold">MAKSYMALNY POZIOM</div>
                <?php else: ?>
                    <div class="d-flex justify-content-between small text-light opacity-75 mb-2 px-1">
                        <span>Szansa: <b class="text-success success-chance"><?= $successChance ?>%</b></span>
                        <span>Max: +10</span>
                    </div>

                    <button class="btn btn-danger w-100 fw-bold py-2 shadow-sm d-flex justify-content-center align-items-center gap-2" 
                            onclick="upgradeItem(<?= $item['id'] ?>, '<?= $isTowerHelper ? 'helper' : 'player' ?>')">
                        <span>ULEPSZ</span>
                        <div class="d-flex align-items-center gap-1 bg-black bg-opacity-50 px-2 py-1 rounded small border border-secondary border-opacity-25">
                            <span class="gold-text cost-gold"><?= number_format($goldCost / 100, 2, '.', ' ') ?></span>
                            <img src="images/zloto.png" alt="Złoto" width="14">
                            <?php if ($shroomCost > 0): ?>
                                <span class="ms-1 shroom-text cost-mushroom"><?= $shroomCost ?></span>
                                <img src="images/grzyb.png" alt="Grzyby" width="14">
                            <?php endif; ?>
                        </div>
                    </button>
                <?php endif; ?>
            </div>

        </div>
    </div>
    <?php
}
?>

<div class="blacksmith-viewport p-2">
    <ul class="nav nav-pills gap-2 mb-4 justify-content-center" id="blacksmithTabs" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="btn nav-btn px-4 py-2 active" id="eq-tab" data-bs-toggle="tab" data-bs-target="#blacksmith-eq" type="button" role="tab">Ekwipunek</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="btn nav-btn px-4 py-2" id="bag-tab" data-bs-toggle="tab" data-bs-target="#blacksmith-bag" type="button" role="tab">Plecak</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="btn nav-btn px-4 py-2" id="helpers-tab" data-bs-toggle="tab" data-bs-target="#blacksmith-helpers" type="button" role="tab">Pomocnicy z wieży</button>
        </li>
    </ul>

    <div class="tab-content" id="blacksmithTabsContent">
        
        <div class="tab-pane fade show active" id="blacksmith-eq" role="tabpanel">
            <div class="row g-4">
                <?php 
                if (empty($items_equipment)) {
                    echo '<div class="w-100 text-center opacity-50 py-4">Nie masz założonych żadnych przedmiotów podlegających ulepszeniu.</div>';
                } else {
                    foreach ($items_equipment as $item) { renderBlacksmithItem($item, $itemTypeMap, false); } 
                }
                ?>
            </div>
        </div>

        <div class="tab-pane fade" id="blacksmith-bag" role="tabpanel">
            <div class="row g-4">
                <?php 
                if (empty($items_inventory)) {
                    echo '<div class="w-100 text-center opacity-50 py-4">Twój plecak jest pusty lub nie ma w nim ulepszalnego ekwipunku.</div>';
                } else {
                    foreach ($items_inventory as $item) { renderBlacksmithItem($item, $itemTypeMap, false); } 
                }
                ?>
            </div>
        </div>

        <div class="tab-pane fade" id="blacksmith-helpers" role="tabpanel">
            
            <div class="d-flex justify-content-center mb-4">
                <div class="nav nav-pills gap-2 p-1 rounded bg-black bg-opacity-20 border border-secondary border-opacity-10 shadow-sm" id="helpersSubTabs" role="tablist">
                    <button class="btn nav-btn btn-sm px-3 py-1 active" id="helper1-tab" data-bs-toggle="tab" data-bs-target="#helper-barbarzynca" type="button" role="tab">Barbarzyński Barbar</button>
                    <button class="btn nav-btn btn-sm px-3 py-1" id="helper2-tab" data-bs-toggle="tab" data-bs-target="#helper-mag" type="button" role="tab">Maguś Mariusz</button>
                    <button class="btn nav-btn btn-sm px-3 py-1" id="helper3-tab" data-bs-toggle="tab" data-bs-target="#helper-zwiadowca" type="button" role="tab">Szczwana Kunegunda</button>
                </div>
            </div>

            <div class="tab-content" id="helpersSubTabsContent">
                
                <div class="tab-pane fade show active" id="helper-barbarzynca" role="tabpanel">
                    <div class="row g-4">
                        <?php 
                        if (empty($tower_helper_item1)) {
                            echo '<div class="w-100 text-center opacity-50 py-4">Barbarzyńca nie posiada żadnego ekwipunku.</div>';
                        } else {
                            foreach ($tower_helper_item1 as $item) { renderBlacksmithItem($item, $itemTypeMap, true); } 
                        }
                        ?>
                    </div>
                </div>

                <div class="tab-pane fade" id="helper-mag" role="tabpanel">
                    <div class="row g-4">
                        <?php 
                        if (empty($tower_helper_item2)) {
                            echo '<div class="w-100 text-center opacity-50 py-4">Maguś Mariusz nie posiada żadnego ekwipunku.</div>';
                        } else {
                            foreach ($tower_helper_item2 as $item) { renderBlacksmithItem($item, $itemTypeMap, true); } 
                        }
                        ?>
                    </div>
                </div>

                <div class="tab-pane fade" id="helper-zwiadowca" role="tabpanel">
                    <div class="row g-4">
                        <?php 
                        if (empty($tower_helper_item3)) {
                            echo '<div class="w-100 text-center opacity-50 py-4">Szczwana Kunegunda nie posiada żadnego ekwipunku.</div>';
                        } else {
                            foreach ($tower_helper_item3 as $item) { renderBlacksmithItem($item, $itemTypeMap, true); } 
                        }
                        ?>
                    </div>
                </div>

            </div>
        </div>

    </div>
</div>