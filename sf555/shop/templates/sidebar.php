<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<aside class="col-lg-3 col-xl-2 offcanvas-lg offcanvas-start h-100" id="sidebarMenu" tabindex="-1" aria-labelledby="sidebarMenuLabel" style="background: transparent; border: none;">
    <div class="sidebar-content">
        <div class="w-100">
            <div class="d-flex justify-content-center align-items-center py-3 mb-4 border-bottom border-secondary border-opacity-50 position-relative">
                <span class="fs-4 fw-bold text-uppercase" id="sidebarMenuLabel" style="color: aqua; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Sklep</span>
                <button type="button" class="btn-close btn-close-white d-lg-none position-absolute end-0 me-3" data-bs-dismiss="offcanvas" data-bs-target="#sidebarMenu" aria-label="Zamknij"></button>
            </div>

            <div class="nav flex-column gap-2" id="shop-tab-navigation" role="tablist" aria-orientation="vertical">
                <button class="btn nav-btn w-100 text-center text-uppercase active" id="mikstury-tab" data-bs-toggle="tab" data-bs-target="#mikstury" type="button" role="tab" aria-controls="mikstury" aria-selected="true">Mikstury</button>
                <button class="btn nav-btn w-100 text-center text-uppercase" id="karczma-tab" data-bs-toggle="tab" data-bs-target="#karczma" type="button" role="tab" aria-controls="karczma" aria-selected="false">Karczma</button>
                <button class="btn nav-btn w-100 text-center text-uppercase" id="lochy-tab" data-bs-toggle="tab" data-bs-target="#lochy" type="button" role="tab" aria-controls="lochy" aria-selected="false">Klucze</button>
                <button class="btn nav-btn w-100 text-center text-uppercase" id="smith-tab" data-bs-toggle="tab" data-bs-target="#smith" type="button" role="tab" aria-controls="smith" aria-selected="false">Kowal</button>
                <button class="btn nav-btn w-100 text-center text-uppercase" id="chatcolor-tab" data-bs-toggle="tab" data-bs-target="#chatcolor" type="button" role="tab" aria-controls="chatcolor" aria-selected="false">Kolor czatu</button>
                <button class="btn nav-btn w-100 text-center text-uppercase" id="redeemvoucher-tab" data-bs-toggle="tab" data-bs-target="#redeemvoucher" type="button" role="tab" aria-controls="redeemvoucher" aria-selected="false">Wykorzystaj voucher</button>
            </div>
        </div>
    </div>
</aside>