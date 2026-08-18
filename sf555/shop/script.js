'use strict';

function buyItem(postData) {
    const formData = new FormData();

    for (const key in postData) {
        if (postData.hasOwnProperty(key)) {
            formData.append(key, postData[key]);
        }
    }

    fetch('ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Sukces!',
                text: data.message,
                timer: 2000,
                showConfirmButton: false
            });

            if (data.balance) {
                Object.keys(data.balance).forEach(key => {
                    updateBalance(key, data.balance[key]);
                });
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Błąd',
                text: data.message,
                timer: 2500,
                showConfirmButton: false
            });
        }
    })
    .catch(error => {
        console.error('Błąd połączenia:', error);
        Swal.fire({
            icon: 'error',
            title: 'Błąd serwera',
            text: 'Nie udało się połączyć z serwerem.',
            timer: 2000,
            showConfirmButton: false
        });
    });
}

function upgradeItem(itemId, targetType) {
    const postData = {
        action: 'blacksmith',
        item_id: itemId,
        target_type: targetType
    };

    const formData = new FormData();
    for (const key in postData) {
        formData.append(key, postData[key]);
    }

    fetch('ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.balance) {
                Object.keys(data.balance).forEach(key => {
                    updateBalance(key, data.balance[key]);
                });
            }

            if (data.upgrade_success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Sukces!',
                    text: data.message,
                    timer: 2000,
                    showConfirmButton: false
                });

                const cardId = targetType === 'helper' ? `item-card-helper-${itemId}` : `item-card-${itemId}`;
                const card = document.getElementById(cardId);

                if (card && data.item_updated) {
                    const info = data.item_updated;

                    const badge = card.querySelector('.upgrade-badge');
                    if (badge) badge.textContent = `+${info.upgrade_level}`;

                    if (info.dmg_min > 0) {
                        const dMin = card.querySelector('.dmg-min');
                        const dMax = card.querySelector('.dmg-max');
                        if (dMin) dMin.textContent = info.dmg_min;
                        if (dMax) dMax.textContent = info.dmg_max;
                    }

                    for (let i = 1; i <= 3; i++) {
                        const atrSpan = card.querySelector(`.atr-val-${i}`);
                        if (atrSpan && info[`atr_val_${i}`] > 0) {
                            atrSpan.textContent = info[`atr_val_${i}`];
                        }
                    }

                    if (info.is_maxed) {
                        const actionArea = card.querySelector('.mt-auto');
                        if (actionArea) {
                            actionArea.innerHTML = `<div class="alert alert-success py-2 m-0 small fw-bold">MAKSYMALNY POZIOM</div>`;
                        }
                    } else {
                        const chanceB = card.querySelector('.success-chance');
                        const goldSpan = card.querySelector('.cost-gold');
                        const shroomSpan = card.querySelector('.cost-mushroom');

                        if (chanceB) chanceB.textContent = `${info.next_chance}%`;
                        if (goldSpan) goldSpan.textContent = info.next_gold_cost;
                        if (shroomSpan && info.next_shroom_cost > 0) shroomSpan.textContent = info.next_shroom_cost;
                    }
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Niepowodzenie',
                    text: data.message,
                    timer: 2500,
                    showConfirmButton: false
                });
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Błąd',
                text: data.message,
                timer: 2500,
                showConfirmButton: false
            });
        }
    })
    .catch(error => {
        console.error('Błąd kowala AJAX:', error);
        Swal.fire({
            icon: 'error',
            title: 'Błąd połączenia',
            text: 'Wystąpił nieoczekiwany problem z warsztatem kowala.',
            timer: 2000,
            showConfirmButton: false
        });
    });
}

function updateBalance(key, value) {
    const elements = document.querySelectorAll(`[data-balance="${key}"]`);
    elements.forEach(el => {
        if (key === 'silver') {
            const goldAmount = Number(value) / 100;
            
            el.textContent = goldAmount.toLocaleString('pl-PL', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).replace(/\s/g, ' ').replace(',', '.');
        } else {
            el.textContent = Number(value).toLocaleString('pl-PL').replace(/\s/g, ' ');
        }
    });
}

function changeChatColor(colorId) {
    const postData = {
        action: 'chat_color',
        color: colorId
    };

    const formData = new FormData();
    for (const key in postData) {
        formData.append(key, postData[key]);
    }

    fetch('ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: data.new_color === 0 ? 'Usunięto kolor!' : 'Zmieniono kolor!',
                text: data.message,
                timer: 2000,
                showConfirmButton: false
            });

            if (data.balance && typeof data.balance.mushroom !== 'undefined') {
                updateBalance('mushroom', data.balance.mushroom);
            }

            const previewNick = document.querySelector('.chat-preview-nick');
            const navbarNick = document.querySelector('.navbar-player-nick');

            if (previewNick) {
                if (data.new_color === 0) {
                    const defaultRankClass = previewNick.getAttribute('data-default-class');
                    previewNick.className = `fs-4 fw-bold chat-preview-nick ${defaultRankClass}`;
                } else {
                    previewNick.className = `fs-4 fw-bold chat-preview-nick color${data.new_color}`;
                }
            }

            if (navbarNick) {
                if (data.new_color === 0) {
                    const defaultRankClass = navbarNick.getAttribute('data-default-class');
                    navbarNick.className = `fs-4 fs-sm-3 navbar-player-nick ${defaultRankClass}`;
                } else {
                    navbarNick.className = `fs-4 fs-sm-3 navbar-player-nick color${data.new_color}`;
                }
            }

            const oldActiveBtnContainer = document.querySelector('.chat-color-viewport .btn-success')?.parentElement;
            if (oldActiveBtnContainer) {
                const card = oldActiveBtnContainer.closest('.item-card');
                if (card.classList.contains('option-card-color-0')) {
                    oldActiveBtnContainer.innerHTML = `<button class="btn btn-secondary w-100 fw-bold py-2 shadow-sm" onclick="changeChatColor(0)">USUŃ KOLOR</button>`;
                } else {
                    const match = card.className.match(/option-card-color-(\d+)/);
                    const lastColorId = match ? parseInt(match[1]) : 1;

                    oldActiveBtnContainer.innerHTML = `
                        <button class="btn btn-danger w-100 fw-bold py-2 shadow-sm d-flex justify-content-center align-items-center gap-2 main-color-action-btn" onclick="changeChatColor(${lastColorId})">
                            <span>USTAW</span>
                            <div class="d-flex align-items-center gap-1 bg-black bg-opacity-50 px-2 py-1 rounded small border border-secondary border-opacity-25">
                                <span class="shroom-text">100</span>
                                <img src="images/grzyb.png" alt="Grzyby" width="14">
                            </div>
                        </button>
                    `;
                }
            }

            const currentCard = document.querySelector(`.option-card-color-${data.new_color}`);
            if (currentCard) {
                const actionArea = currentCard.querySelector('.mt-4');
                if (actionArea) {
                    actionArea.innerHTML = `
                        <button class="btn btn-success w-100 fw-bold py-2 disabled opacity-100" disabled>
                            👑 AKTYWNY
                        </button>
                    `;
                }
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Błąd',
                text: data.message,
                timer: 2500,
                showConfirmButton: false
            });
        }
    })
    .catch(error => {
        console.error('Błąd zmiany koloru AJAX:', error);
        Swal.fire({
            icon: 'error',
            title: 'Błąd połączenia',
            text: 'Wystąpił nieoczekiwany problem z serwerem.',
            timer: 2000,
            showConfirmButton: false
        });
    });
}

function redeemVoucher(event) {
    event.preventDefault();

    const codeInput = document.getElementById('voucherCode');
    if (!codeInput) return;

    const postData = {
        action: 'voucher',
        code: codeInput.value
    };

    const formData = new FormData();
    for (const key in postData) {
        formData.append(key, postData[key]);
    }

    fetch('ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Kod zrealizowany!',
                text: data.message,
                confirmButtonText: 'SUPER'
            }).then(() => {
                const activeTab = document.querySelector('#shop-tab-navigation .active');
                if (activeTab) activeTab.click();
            });

            if (data.balance) {
                if (typeof data.balance.mushroom !== 'undefined') updateBalance('mushroom', data.balance.mushroom);
                if (typeof data.balance.silver !== 'undefined') updateBalance('silver', data.balance.silver);
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Błąd vouchera',
                text: data.message,
                timer: 2500,
                showConfirmButton: false
            });
        }
    })
    .catch(error => {
        console.error('Błąd vouchera AJAX:', error);
        Swal.fire({
            icon: 'error',
            title: 'Błąd połączenia',
            text: 'Wystąpił problem podczas weryfikacji kodu.',
            timer: 2000,
            showConfirmButton: false
        });
    });
}