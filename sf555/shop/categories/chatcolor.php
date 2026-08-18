<?php 
if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); 

$user_name = $user_data['user_name'];
$current_color = (int)($user_data['color'] ?? 0);
$change_cost = 100;

// Ustalamy klasę dla podglądu nicku
$preview_class = ($current_color === 0) ? get_color($user_data) : "color" . $current_color;
?>

<div class="chat-color-viewport p-2">
    <div class="item-card p-4 mb-4 text-center shadow">
        <h3 class="fs-5 fw-bold text-secondary mb-2 text-uppercase">Podgląd Twojego Chatu</h3>
        <div class="p-3 bg-black bg-opacity-40 rounded border border-secondary border-opacity-10 d-inline-block min-w-50">
            <span class="fs-4 fw-bold chat-preview-nick <?= $preview_class ?>" data-default-class="<?= get_color($user_data) ?>"><?= htmlspecialchars($user_name) ?></span>
            <span class="text-white opacity-75 fs-5">: Siema! Ktoś chętny na lochy?</span>
        </div>
    </div>

    <div class="row g-4">
        <div class="col-12 col-sm-6 col-md-4">
            <div class="item-card h-100 p-4 d-flex flex-column justify-content-between text-center shadow option-card-color-0">
                <div>
                    <div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary border-opacity-25 pb-2">
                        <span class="text-secondary small">Reset stylu</span>
                        <span class="badge bg-secondary text-white p-2">Domyślny</span>
                    </div>
                    
                    <div class="py-3 my-2 bg-black bg-opacity-20 rounded">
                        <span class="fw-bold fs-4 <?= get_color($user_data) ?>">Kolor rangi</span>
                    </div>
                </div>

                <div class="mt-4">
                    <?php if ($current_color === 0): ?>
                        <button class="btn btn-success w-100 fw-bold py-2 disabled opacity-100" disabled>
                            👑 AKTYWNY
                        </button>
                    <?php else: ?>
                        <button class="btn btn-secondary w-100 fw-bold py-2 shadow-sm" onclick="changeChatColor(0)">
                            USUŃ KOLOR
                        </button>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <?php for ($color = 1; $color <= 6; $color++): 
            $isActive = ($current_color === $color);
        ?>
            <div class="col-12 col-sm-6 col-md-4">
                <div class="item-card h-100 p-4 d-flex flex-column justify-content-between text-center shadow option-card-color-<?= $color ?>">
                    
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary border-opacity-25 pb-2">
                            <span class="text-secondary small">Styl czatu</span>
                            <span class="badge bg-dark border border-secondary border-opacity-25 text-white p-2">Kolor #<?= $color ?></span>
                        </div>
                        
                        <div class="py-3 my-2 bg-black bg-opacity-20 rounded">
                            <span class="fw-bold fs-4 color<?= $color ?>">Tekst czatu</span>
                        </div>
                    </div>

                    <div class="mt-4">
                        <?php if ($isActive): ?>
                            <button class="btn btn-success w-100 fw-bold py-2 disabled opacity-100" disabled>
                                👑 AKTYWNY
                            </button>
                        <?php else: ?>
                            <button class="btn btn-danger w-100 fw-bold py-2 shadow-sm d-flex justify-content-center align-items-center gap-2 main-color-action-btn" 
                                    onclick="changeChatColor(<?= $color ?>)">
                                <span>USTAW</span>
                                <div class="d-flex align-items-center gap-1 bg-black bg-opacity-50 px-2 py-1 rounded small border border-secondary border-opacity-25">
                                    <span class="shroom-text"><?= $change_cost ?></span>
                                    <img src="images/grzyb.png" alt="Grzyby" width="14">
                                </div>
                            </button>
                        <?php endif; ?>
                    </div>

                </div>
            </div>
        <?php endfor; ?>
    </div>
</div>