<?php
if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly.");

$currentTime = time();
$voucherCooldown = (int)($user_data['voucher_date'] ?? 0);
$isLocked = ($voucherCooldown > $currentTime);
$timeLeft = $voucherCooldown - $currentTime;
?>

<div class="voucher-viewport p-2 d-flex justify-content-center">
    <div class="item-card p-4 text-center shadow" style="max-width: 500px; width: 100%;">
        
        <div class="mb-4">
            <div class="fs-1 mb-2">🎟️</div>
            <h3 class="fs-4 fw-bold text-white text-uppercase tracking-wider">Kody Promocyjne</h3>
            <p class="text-secondary small m-0">Wpisz posiadany voucher, aby odebrać darmowe grzyby lub złoto!</p>
        </div>

        <hr class="border-secondary border-opacity-25 my-3">

        <?php if ($isLocked): 
            // Kalkulacja pozostałego czasu (godziny i minuty)
            $hours = floor($timeLeft / 3600);
            $minutes = floor(($timeLeft % 3600) / 60);
        ?>
            <div class="alert alert-warning py-3 m-0 small fw-bold border-2 border-warning border-opacity-10 shadow-sm text-start">
                ⏳ <span class="text-white">Kolejny voucher możesz zrealizować za:</span>
                <div class="fs-5 mt-1 text-warning">
                    <?= $hours > 0 ? "{$hours} godz. " : "" ?><?= $minutes ?> min.
                </div>
            </div>
        <?php else: ?>
            <form onsubmit="redeemVoucher(event)" id="voucherForm">
                <div class="mb-4">
                    <input type="text" 
                           id="voucherCode" 
                           class="form-control form-control-lg text-center fw-bold text-uppercase rounded-3" 
                           placeholder="KOD-VOUCHERA" 
                           maxlength="32"
                           style="background: rgba(0,0,0,0.4); border: 2px solid rgba(255,255,255,0.15); color: aqua; letter-spacing: 2px; font-family: sans-serif;"
                           required>
                </div>

                <button type="submit" class="btn btn-danger w-100 fw-bold py-3 shadow rounded-3 fs-5 d-flex justify-content-center align-items-center gap-2">
                    <span>AKTYWUJ VOUCHER</span>
                </button>
            </form>
        <?php endif; ?>

    </div>
</div>