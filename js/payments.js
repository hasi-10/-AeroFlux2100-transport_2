/**
 * AeroFlux2100 — Payment Service & UI
 * "One Journey. Every Future."
 *
 * Prototype / Demo Mode — no real payment processing
 * Only safe display data is stored (never CVV, full card number, PIN)
 */

(function () {
    'use strict';

    // =========================================================================
    // CURRENCY — change this one variable to switch currency
    // =========================================================================
    const AF_CURRENCY     = 'LKR';
    const AF_CURRENCY_SYM = 'LKR';

    // =========================================================================
    // STORAGE KEYS
    // =========================================================================
    const PM_KEY    = 'aeroflux_payment_methods';
    const TX_KEY    = 'aeroflux_transactions';

    // =========================================================================
    // CARD BRAND DETECTION
    // =========================================================================
    const CARD_BRANDS = [
        { name: 'Visa',       pattern: /^4/,           icon: 'VISA'  },
        { name: 'Mastercard', pattern: /^5[1-5]/,       icon: 'MC'   },
        { name: 'Amex',       pattern: /^3[47]/,        icon: 'AMEX'  },
        { name: 'Discover',   pattern: /^6(?:011|5)/,   icon: 'DISC'  }
    ];

    function detectBrand(number) {
        const cleaned = number.replace(/\s/g, '');
        for (const b of CARD_BRANDS) {
            if (b.pattern.test(cleaned)) return b;
        }
        return { name: 'Card', icon: '💳' };
    }

    // =========================================================================
    // STORAGE HELPERS
    // =========================================================================
    function loadPaymentMethods() {
        try {
            const raw = localStorage.getItem(PM_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    function savePaymentMethods(list) {
        try { localStorage.setItem(PM_KEY, JSON.stringify(list)); } catch {}
    }

    function loadTransactions() {
        try {
            const raw = localStorage.getItem(TX_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    function saveTransactions(list) {
        try { localStorage.setItem(TX_KEY, JSON.stringify(list)); } catch {}
    }

    // =========================================================================
    // PAYMENT SERVICE API
    // =========================================================================
    function getPaymentMethods() {
        return loadPaymentMethods();
    }

    function addPaymentMethod(safeData) {
        // safeData: { brand, last4, expiryMonth, expiryYear, cardholderName, isDefault }
        const list = loadPaymentMethods();
        const method = {
            id:              'pm_' + Date.now(),
            type:            'card',
            brand:           safeData.brand    || 'Card',
            last4:           safeData.last4    || '0000',
            expiryMonth:     safeData.expiryMonth,
            expiryYear:      safeData.expiryYear,
            cardholderName:  safeData.cardholderName,
            isDefault:       safeData.isDefault || list.length === 0,
            createdAt:       new Date().toISOString().slice(0, 10)
        };

        // If new card is default, demote others
        if (method.isDefault) {
            list.forEach(m => m.isDefault = false);
        }

        list.push(method);
        savePaymentMethods(list);

        // Notification
        if (window.AeroFluxNotifications) {
            window.AeroFluxNotifications.create(
                'payment',
                'Payment Method Added',
                `${method.brand} ending in ${method.last4} was added to your account.`,
                'normal',
                { label: 'Manage Payments', href: 'payments.html' }
            );
        }

        document.dispatchEvent(new CustomEvent('aeroflux:payment-method-added', { detail: method }));
        return method;
    }

    function removePaymentMethod(id) {
        let list = loadPaymentMethods();
        const removed = list.find(m => m.id === id);
        list = list.filter(m => m.id !== id);

        // If removed was default, promote first remaining
        if (removed && removed.isDefault && list.length > 0) {
            list[0].isDefault = true;
        }

        savePaymentMethods(list);
        document.dispatchEvent(new CustomEvent('aeroflux:payment-method-removed', { detail: removed }));
        return removed;
    }

    function setDefaultPaymentMethod(id) {
        const list = loadPaymentMethods();
        list.forEach(m => m.isDefault = (m.id === id));
        savePaymentMethods(list);
        document.dispatchEvent(new CustomEvent('aeroflux:default-payment-changed', { detail: { id } }));
    }

    function getDefaultPaymentMethod() {
        const list = loadPaymentMethods();
        return list.find(m => m.isDefault) || list[0] || null;
    }

    function getTransactions() {
        return loadTransactions();
    }

    function getTransaction(id) {
        return loadTransactions().find(t => t.id === id) || null;
    }

    function generateBookingId() {
        const n = Math.floor(1000 + Math.random() * 9000);
        return `AF-2100-${n}`;
    }

    /**
     * processDemoPayment — simulates payment flow
     * @param {object} opts { amount, method, journeyFrom, journeyTo, departure }
     * @returns Promise<transaction>
     */
    function processDemoPayment(opts) {
        return new Promise((resolve, reject) => {
            // Simulate network delay (1.8s)
            setTimeout(() => {
                // Demo: 95% success rate
                const success = Math.random() > 0.05;

                const bookingId = generateBookingId();
                const fee = Math.round(opts.amount * 0.04); // 4% service fee
                const total = opts.amount + fee;

                if (success) {
                    const tx = {
                        id:            bookingId,
                        journeyFrom:   opts.journeyFrom || 'KDU',
                        journeyTo:     opts.journeyTo   || 'Colombo',
                        departure:     opts.departure   || '18:10',
                        amount:        opts.amount,
                        fee:           fee,
                        total:         total,
                        currency:      AF_CURRENCY,
                        status:        'paid',
                        paymentMethod: `${opts.method.brand} •••• ${opts.method.last4}`,
                        paymentId:     opts.method.id,
                        createdAt:     new Date().toISOString().slice(0, 10)
                    };

                    const txList = loadTransactions();
                    txList.unshift(tx);
                    saveTransactions(txList);

                    // Fire notifications
                    if (window.AeroFluxNotifications) {
                        window.AeroFluxNotifications.create(
                            'payment',
                            'Payment Successful',
                            `Your payment of ${AF_CURRENCY_SYM} ${total.toLocaleString()} was completed.`,
                            'important',
                            { label: 'View Receipt', href: 'payments.html' }
                        );
                        window.AeroFluxNotifications.create(
                            'booking',
                            'Journey Confirmed',
                            `Your AeroFlux journey from ${tx.journeyFrom} to ${tx.journeyTo} is confirmed. Departure: ${tx.departure}.`,
                            'important',
                            { label: 'View Journey', href: 'route.html' }
                        );
                    }

                    document.dispatchEvent(new CustomEvent('aeroflux:payment-success', { detail: tx }));
                    resolve(tx);
                } else {
                    if (window.AeroFluxNotifications) {
                        window.AeroFluxNotifications.create(
                            'payment',
                            'Payment Failed',
                            'Your payment could not be completed. Please try another payment method.',
                            'urgent',
                            { label: 'Update Payment', href: 'payments.html' }
                        );
                    }
                    document.dispatchEvent(new CustomEvent('aeroflux:payment-failed', { detail: { reason: 'Demo payment declined' } }));
                    reject(new Error('Payment could not be processed'));
                }
            }, 1800);
        });
    }

    // =========================================================================
    // SEED DEMO DATA
    // =========================================================================
    function seedDemoData() {
        if (loadPaymentMethods().length > 0) return;

        // One demo card
        const methods = [{
            id:             'pm_demo_001',
            type:           'card',
            brand:          'Visa',
            last4:          '4821',
            expiryMonth:    '08',
            expiryYear:     '29',
            cardholderName: 'AeroFlux User',
            isDefault:      true,
            createdAt:      '2026-09-01'
        }];
        savePaymentMethods(methods);

        // Demo transactions
        const txs = [
            {
                id:            'AF-2100-2841',
                journeyFrom:   'KDU',
                journeyTo:     'Colombo',
                departure:     '18:10',
                amount:        450,
                fee:           20,
                total:         470,
                currency:      'LKR',
                status:        'paid',
                paymentMethod: 'Visa •••• 4821',
                paymentId:     'pm_demo_001',
                createdAt:     '2026-09-20'
            },
            {
                id:            'AF-2100-2765',
                journeyFrom:   'Colombo',
                journeyTo:     'KDU',
                departure:     '08:30',
                amount:        450,
                fee:           0,
                total:         450,
                currency:      'LKR',
                status:        'paid',
                paymentMethod: 'Visa •••• 4821',
                paymentId:     'pm_demo_001',
                createdAt:     '2026-09-18'
            }
        ];
        saveTransactions(txs);
    }

    // =========================================================================
    // UTILITY
    // =========================================================================
    function escHtml(str) {
        return String(str)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function fmtDate(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // =========================================================================
    // PAYMENTS PAGE UI — only runs on payments.html
    // =========================================================================
    function initPaymentsPage() {
        if (!document.getElementById('af-payments-root')) return;

        renderPaymentMethods();
        renderTransactionHistory();
        bindPaymentsPageEvents();
    }

    // --- RENDER PAYMENT METHODS ---
    function renderPaymentMethods() {
        const grid  = document.getElementById('af-pm-grid');
        const empty = document.getElementById('af-pm-empty');
        if (!grid) return;

        const methods = loadPaymentMethods();
        grid.innerHTML = '';

        if (methods.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        methods.forEach(m => {
            const card = buildPaymentCard(m);
            grid.appendChild(card);
        });
    }

    function buildPaymentCard(m) {
        const wrap = document.createElement('div');
        wrap.className = `af-pm-card ${m.isDefault ? 'af-pm-card-default' : ''}`;
        wrap.setAttribute('data-pm-id', m.id);

        // Brand gradient
        const brandGrads = {
            Visa: 'linear-gradient(135deg, #0D1424 0%, #1a2744 100%)',
            Mastercard: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            Amex: 'linear-gradient(135deg, #0f1923 0%, #1e3a5f 100%)',
        };
        const grad = brandGrads[m.brand] || 'linear-gradient(135deg, #0D1424 0%, #111B2E 100%)';

        wrap.innerHTML = `
            <div class="af-pm-card-inner" style="background: ${grad};">
                <div class="af-pm-card-header">
                    <span class="af-pm-brand-label">AEROFLUX</span>
                    <span class="af-pm-brand-logo">${escHtml(m.brand.toUpperCase())}</span>
                </div>
                <div class="af-pm-card-number">•••• •••• •••• ${escHtml(m.last4)}</div>
                <div class="af-pm-card-footer">
                    <div>
                        <div class="af-pm-card-meta-label">CARDHOLDER</div>
                        <div class="af-pm-card-meta-val">${escHtml(m.cardholderName.toUpperCase())}</div>
                    </div>
                    <div>
                        <div class="af-pm-card-meta-label">EXPIRES</div>
                        <div class="af-pm-card-meta-val">${escHtml(m.expiryMonth)}/${escHtml(m.expiryYear)}</div>
                    </div>
                    ${m.isDefault ? '<div class="af-pm-default-badge">✓ DEFAULT</div>' : ''}
                </div>
                <div class="af-pm-card-shine"></div>
            </div>
            <div class="af-pm-card-actions">
                ${!m.isDefault ? `<button type="button" class="af-pm-set-default-btn outline-btn" data-pm-id="${m.id}" style="font-size:0.82rem; padding:7px 14px;">Set as Default</button>` : '<span class="af-pm-is-default-tag text-cyan" style="font-size:0.82rem; font-weight:600;">✓ Default</span>'}
                <button type="button" class="af-pm-remove-btn" data-pm-id="${m.id}" aria-label="Remove ${m.brand} ending in ${m.last4}">Remove</button>
            </div>
        `;
        return wrap;
    }

    // --- RENDER TRANSACTIONS ---
    function renderTransactionHistory() {
        const list = document.getElementById('af-tx-list');
        const empty = document.getElementById('af-tx-empty');
        if (!list) return;

        const txs = loadTransactions();
        list.innerHTML = '';

        if (txs.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        txs.forEach(tx => {
            const row = document.createElement('div');
            row.className = 'af-tx-row';
            row.setAttribute('data-tx-id', tx.id);
            const statusClass = tx.status === 'paid' ? 'text-green' : tx.status === 'failed' ? 'text-red' : 'text-yellow';
            const statusIcon  = tx.status === 'paid' ? '✓' : tx.status === 'failed' ? '✗' : '⏳';
            row.innerHTML = `
                <div class="af-tx-info">
                    <div class="af-tx-route">${escHtml(tx.journeyFrom)} → ${escHtml(tx.journeyTo)}</div>
                    <div class="af-tx-meta">
                        <span class="af-tx-id">#${escHtml(tx.id)}</span>
                        <span>•</span>
                        <span>${fmtDate(tx.createdAt)}</span>
                        <span>•</span>
                        <span>${escHtml(tx.paymentMethod)}</span>
                    </div>
                </div>
                <div class="af-tx-right">
                    <div class="af-tx-amount">${AF_CURRENCY_SYM} ${tx.total.toLocaleString()}</div>
                    <span class="af-tx-status ${statusClass}">${statusIcon} ${tx.status.toUpperCase()}</span>
                    <button type="button" class="af-view-receipt-btn outline-btn" data-tx-id="${tx.id}" style="font-size:0.8rem; padding:6px 12px;">Receipt</button>
                </div>
            `;
            list.appendChild(row);
        });
    }

    // --- BIND PAYMENTS PAGE EVENTS ---
    function bindPaymentsPageEvents() {
        document.addEventListener('click', (e) => {
            // Add Payment Method
            if (e.target.closest('#af-add-pm-btn')) {
                openAddCardModal();
                return;
            }
            // Close add card modal
            if (e.target.closest('#af-modal-close') || e.target.id === 'af-add-card-modal') {
                closeAddCardModal();
                return;
            }
            // Set default
            const setDefaultBtn = e.target.closest('.af-pm-set-default-btn');
            if (setDefaultBtn) {
                const id = setDefaultBtn.getAttribute('data-pm-id');
                setDefaultPaymentMethod(id);
                renderPaymentMethods();
                return;
            }
            // Remove
            const removeBtn = e.target.closest('.af-pm-remove-btn');
            if (removeBtn) {
                const id = removeBtn.getAttribute('data-pm-id');
                openRemoveConfirmModal(id);
                return;
            }
            // Confirm remove
            if (e.target.closest('#af-confirm-remove-btn')) {
                const id = document.getElementById('af-confirm-remove-btn').getAttribute('data-remove-id');
                if (id) {
                    const removed = removePaymentMethod(id);
                    closeRemoveModal();
                    if (removed) {
                        showPaymentFeedback(`${removed.brand} ending in ${removed.last4} has been removed.`, 'success');
                        renderPaymentMethods();
                    }
                }
                return;
            }
            // Cancel remove
            if (e.target.closest('#af-cancel-remove-btn') || e.target.id === 'af-remove-modal') {
                closeRemoveModal();
                return;
            }
            // View receipt
            const receiptBtn = e.target.closest('.af-view-receipt-btn');
            if (receiptBtn) {
                const txId = receiptBtn.getAttribute('data-tx-id');
                openReceiptModal(txId);
                return;
            }
            // Close receipt modal
            if (e.target.closest('#af-receipt-close') || e.target.id === 'af-receipt-modal') {
                closeReceiptModal();
                return;
            }
        });

        // Card form submission
        const cardForm = document.getElementById('af-card-form');
        if (cardForm) {
            cardForm.addEventListener('submit', handleCardFormSubmit);
        }

        // Card number formatting
        const cardNumInput = document.getElementById('af-card-number');
        if (cardNumInput) {
            cardNumInput.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '').slice(0, 16);
                e.target.value = val.replace(/(.{4})/g, '$1 ').trim();
                // Brand detection
                const brand = detectBrand(val);
                const brandEl = document.getElementById('af-detected-brand');
                if (brandEl) brandEl.textContent = brand.name !== 'Card' ? brand.icon : '';
            });
        }

        // Expiry formatting
        const expiryInput = document.getElementById('af-card-expiry');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
                e.target.value = val;
            });
        }
    }

    function handleCardFormSubmit(e) {
        e.preventDefault();
        if (!validateCardForm()) return;

        const nameVal    = document.getElementById('af-card-name').value.trim();
        const numVal     = document.getElementById('af-card-number').value.replace(/\s/g, '');
        const expiryVal  = document.getElementById('af-card-expiry').value;
        const isDefault  = document.getElementById('af-card-default')?.checked || false;

        const brand = detectBrand(numVal);
        const last4 = numVal.slice(-4);
        const [mm, yy] = expiryVal.split('/');

        // Show success animation
        showCardAddSuccess(() => {
            const method = addPaymentMethod({
                brand:         brand.name,
                last4,
                expiryMonth:   mm,
                expiryYear:    yy,
                cardholderName: nameVal,
                isDefault
            });

            closeAddCardModal();
            renderPaymentMethods();
            showPaymentFeedback(`${brand.name} ending in ${last4} has been added to your account.`, 'success');
        });
    }

    // =========================================================================
    // CARD FORM VALIDATION
    // =========================================================================
    function validateCardForm() {
        let valid = true;

        const nameEl  = document.getElementById('af-card-name');
        const numEl   = document.getElementById('af-card-number');
        const expEl   = document.getElementById('af-card-expiry');
        const cvvEl   = document.getElementById('af-card-cvv');

        clearValidationErrors();

        if (!nameEl.value.trim()) {
            showFieldError(nameEl, 'Enter a cardholder name.'); valid = false;
        }

        const rawNum = numEl.value.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(rawNum)) {
            showFieldError(numEl, 'Enter a valid card number.'); valid = false;
        }

        if (!/^\d{2}\/\d{2}$/.test(expEl.value)) {
            showFieldError(expEl, 'Enter a valid expiry date (MM/YY).'); valid = false;
        } else {
            const [mm, yy] = expEl.value.split('/').map(Number);
            const now = new Date();
            const expDate = new Date(2000 + yy, mm - 1);
            if (mm < 1 || mm > 12 || expDate < now) {
                showFieldError(expEl, 'Enter a valid expiry date.'); valid = false;
            }
        }

        if (!/^\d{3,4}$/.test(cvvEl.value)) {
            showFieldError(cvvEl, 'Enter a 3-digit security code.'); valid = false;
        }

        return valid;
    }

    function showFieldError(input, msg) {
        input.classList.add('af-input-error');
        let err = input.parentElement.querySelector('.af-field-error');
        if (!err) {
            err = document.createElement('span');
            err.className = 'af-field-error';
            err.setAttribute('role', 'alert');
            input.parentElement.appendChild(err);
        }
        err.textContent = msg;
    }

    function clearValidationErrors() {
        document.querySelectorAll('.af-input-error').forEach(el => el.classList.remove('af-input-error'));
        document.querySelectorAll('.af-field-error').forEach(el => el.remove());
    }

    // =========================================================================
    // MODALS
    // =========================================================================
    function openAddCardModal() {
        const modal = document.getElementById('af-add-card-modal');
        if (!modal) return;
        clearValidationErrors();
        document.getElementById('af-card-form')?.reset();
        const brandEl = document.getElementById('af-detected-brand');
        if (brandEl) brandEl.textContent = '';
        modal.classList.add('af-modal-open');
        modal.setAttribute('aria-hidden', 'false');
        setTimeout(() => {
            const first = modal.querySelector('input, button');
            if (first) first.focus();
        }, 100);
    }

    function closeAddCardModal() {
        const modal = document.getElementById('af-add-card-modal');
        if (!modal) return;
        modal.classList.remove('af-modal-open');
        modal.setAttribute('aria-hidden', 'true');
    }

    function openRemoveConfirmModal(pmId) {
        const modal  = document.getElementById('af-remove-modal');
        const btn    = document.getElementById('af-confirm-remove-btn');
        const detail = document.getElementById('af-remove-detail');
        if (!modal || !btn) return;

        const method = loadPaymentMethods().find(m => m.id === pmId);
        if (!method) return;

        if (detail) detail.textContent = `${method.brand} ending in ${method.last4} will be removed from your AeroFlux account.`;
        btn.setAttribute('data-remove-id', pmId);

        modal.classList.add('af-modal-open');
        modal.setAttribute('aria-hidden', 'false');
        setTimeout(() => btn.focus(), 100);
    }

    function closeRemoveModal() {
        const modal = document.getElementById('af-remove-modal');
        if (!modal) return;
        modal.classList.remove('af-modal-open');
        modal.setAttribute('aria-hidden', 'true');
    }

    function openReceiptModal(txId) {
        const modal = document.getElementById('af-receipt-modal');
        const body  = document.getElementById('af-receipt-body');
        if (!modal || !body) return;

        const tx = getTransaction(txId);
        if (!tx) return;

        body.innerHTML = `
            <div class="af-receipt-logo">AeroFlux<span>2100</span></div>
            <div class="af-receipt-title">Journey Receipt</div>
            <div class="af-receipt-badge pill-badge green">✓ ${tx.status.toUpperCase()}</div>
            <div class="af-receipt-divider"></div>
            <div class="af-receipt-rows">
                <div class="af-receipt-row"><span>Booking ID</span><strong>#${escHtml(tx.id)}</strong></div>
                <div class="af-receipt-row"><span>Date</span><strong>${fmtDate(tx.createdAt)}</strong></div>
                <div class="af-receipt-row"><span>Journey</span><strong>${escHtml(tx.journeyFrom)} → ${escHtml(tx.journeyTo)}</strong></div>
                <div class="af-receipt-row"><span>Departure</span><strong>${escHtml(tx.departure)}</strong></div>
                <div class="af-receipt-row"><span>Fare</span><strong>${AF_CURRENCY_SYM} ${tx.amount.toLocaleString()}</strong></div>
                <div class="af-receipt-row"><span>Service Fee</span><strong>${AF_CURRENCY_SYM} ${tx.fee.toLocaleString()}</strong></div>
                <div class="af-receipt-divider"></div>
                <div class="af-receipt-row af-receipt-total"><span>Total</span><strong class="text-cyan">${AF_CURRENCY_SYM} ${tx.total.toLocaleString()}</strong></div>
                <div class="af-receipt-row"><span>Payment</span><strong>${escHtml(tx.paymentMethod)}</strong></div>
            </div>
            <p class="af-receipt-demo-note">⚠ Demo Receipt — AeroFlux2100 Prototype</p>
        `;

        modal.classList.add('af-modal-open');
        modal.setAttribute('aria-hidden', 'false');

        // Download button (print-ready)
        const dlBtn = document.getElementById('af-receipt-download');
        if (dlBtn) {
            dlBtn.onclick = () => {
                const content = body.innerHTML;
                const win = window.open('', '_blank', 'width=600,height=800');
                if (!win) return;
                win.document.write(`<!DOCTYPE html><html><head><title>Receipt ${tx.id}</title>
                    <style>body{font-family:sans-serif;padding:40px;max-width:500px;margin:auto;}
                    .text-cyan{color:#00E5FF;}.pill-badge{display:inline-block;padding:4px 12px;border-radius:20px;border:1px solid #39E58C;color:#39E58C;font-weight:700;}
                    .af-receipt-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;}
                    .af-receipt-total strong{font-size:1.3rem;color:#00E5FF;}</style></head>
                    <body>${content}<script>window.print();window.close();</script></body></html>`);
                win.document.close();
            };
        }
    }

    function closeReceiptModal() {
        const modal = document.getElementById('af-receipt-modal');
        if (!modal) return;
        modal.classList.remove('af-modal-open');
        modal.setAttribute('aria-hidden', 'true');
    }

    // =========================================================================
    // CARD ADD SUCCESS ANIMATION
    // =========================================================================
    function showCardAddSuccess(callback) {
        const btn = document.getElementById('af-card-submit-btn');
        if (!btn) { callback(); return; }

        const origText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = '<span class="af-btn-spinner"></span> Processing...';

        // Show ring + checkmark animation inside the modal
        const successDiv = document.getElementById('af-add-success-anim');
        if (successDiv) {
            successDiv.style.display = 'flex';
        }

        setTimeout(() => {
            if (btn) { btn.disabled = false; btn.textContent = origText; }
            if (successDiv) successDiv.style.display = 'none';
            callback();
        }, 1200);
    }

    // =========================================================================
    // FEEDBACK TOAST
    // =========================================================================
    function showPaymentFeedback(msg, type = 'success') {
        if (window.AeroFluxNotifications) {
            window.AeroFluxNotifications.showToast({
                type:     type === 'success' ? 'payment' : 'system',
                title:    type === 'success' ? 'Payment Method Updated' : 'Error',
                message:  msg,
                priority: 'important',
                action:   null,
                id:       'fb-' + Date.now(),
                read:     false,
                timestamp: new Date().toISOString()
            });
        }
    }

    // =========================================================================
    // CHECKOUT FLOW (embedded on route.html)
    // =========================================================================
    function initCheckoutWidget() {
        const widget = document.getElementById('af-checkout-widget');
        if (!widget) return;

        renderCheckoutPaymentMethod();
        bindCheckoutEvents();
    }

    function renderCheckoutPaymentMethod() {
        const pmDisplay = document.getElementById('af-checkout-pm-display');
        if (!pmDisplay) return;
        const method = getDefaultPaymentMethod();
        if (method) {
            pmDisplay.innerHTML = `<span class="af-checkout-pm-brand">${escHtml(method.brand)}</span> •••• ${escHtml(method.last4)}`;
        } else {
            pmDisplay.innerHTML = `<a href="payments.html" class="text-cyan">+ Add Payment Method</a>`;
        }
    }

    function bindCheckoutEvents() {
        // Change payment method
        const changeBtn = document.getElementById('af-checkout-change-pm');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => {
                window.location.href = 'payments.html';
            });
        }

        // Confirm & Pay
        const payBtn = document.getElementById('af-confirm-pay-btn');
        if (payBtn) {
            payBtn.addEventListener('click', handleCheckoutPay);
        }
    }

    function handleCheckoutPay() {
        const payBtn = document.getElementById('af-confirm-pay-btn');
        if (!payBtn || payBtn.disabled) return;

        const method = getDefaultPaymentMethod();
        if (!method) {
            showPaymentFeedback('Please add a payment method first.', 'error');
            return;
        }

        // Disable button immediately to prevent double-click
        payBtn.disabled = true;
        payBtn.innerHTML = '<span class="af-btn-spinner"></span> PROCESSING PAYMENT...';

        // Show processing overlay
        showPaymentProcessingOverlay();

        const fromEl = document.getElementById('route-from-title');
        const toEl   = document.getElementById('route-to-title');
        const amount = 450; // base fare from route

        processDemoPayment({
            amount:      amount,
            method:      method,
            journeyFrom: fromEl ? fromEl.textContent : 'KDU',
            journeyTo:   toEl   ? toEl.textContent   : 'Colombo',
            departure:   '18:10'
        }).then(tx => {
            hidePaymentProcessingOverlay();
            showPaymentSuccessOverlay(tx);
        }).catch(() => {
            hidePaymentProcessingOverlay();
            showPaymentFailureOverlay();
            payBtn.disabled = false;
            payBtn.textContent = 'CONFIRM & PAY';
        });
    }

    function showPaymentProcessingOverlay() {
        const overlay = document.getElementById('af-payment-overlay');
        if (!overlay) return;
        overlay.innerHTML = `
            <div class="af-pay-overlay-card">
                <div class="af-pay-spinner-ring"></div>
                <div class="af-pay-status-steps">
                    <div class="af-pay-step" id="step-connect">Connecting...</div>
                    <div class="af-pay-step" id="step-verify">Verifying...</div>
                    <div class="af-pay-step" id="step-process">Processing...</div>
                </div>
                <p class="af-pay-demo-label">⚠ SIMULATED PAYMENT</p>
            </div>
        `;
        overlay.classList.add('af-overlay-open');
        overlay.setAttribute('aria-hidden', 'false');

        // Animate steps
        setTimeout(() => { const el = document.getElementById('step-connect'); if (el) el.classList.add('active'); }, 200);
        setTimeout(() => { const el = document.getElementById('step-verify');  if (el) el.classList.add('active'); }, 700);
        setTimeout(() => { const el = document.getElementById('step-process'); if (el) el.classList.add('active'); }, 1200);
    }

    function hidePaymentProcessingOverlay() {
        const overlay = document.getElementById('af-payment-overlay');
        if (!overlay) return;
        overlay.classList.remove('af-overlay-open');
        overlay.setAttribute('aria-hidden', 'true');
    }

    function showPaymentSuccessOverlay(tx) {
        const overlay = document.getElementById('af-payment-overlay');
        if (!overlay) return;
        overlay.innerHTML = `
            <div class="af-pay-overlay-card af-pay-success">
                <div class="af-pay-check-ring">
                    <svg viewBox="0 0 52 52" class="af-checkmark" aria-hidden="true">
                        <circle cx="26" cy="26" r="25" fill="none"/>
                        <path fill="none" d="M14 27l7 7 17-17" class="af-check-path"/>
                    </svg>
                </div>
                <h2 class="af-pay-success-title">PAYMENT SUCCESSFUL ✓</h2>
                <p>Your journey has been confirmed.</p>
                <div class="af-pay-receipt-mini">
                    <div class="af-receipt-row"><span>Booking ID</span><strong>#${escHtml(tx.id)}</strong></div>
                    <div class="af-receipt-row"><span>Journey</span><strong>${escHtml(tx.journeyFrom)} → ${escHtml(tx.journeyTo)}</strong></div>
                    <div class="af-receipt-row"><span>Departure</span><strong>${escHtml(tx.departure)}</strong></div>
                    <div class="af-receipt-row"><span>Total</span><strong class="text-cyan">${AF_CURRENCY_SYM} ${tx.total.toLocaleString()}</strong></div>
                    <div class="af-receipt-row"><span>Payment</span><strong>${escHtml(tx.paymentMethod)}</strong></div>
                </div>
                <div class="af-pay-success-actions">
                    <a href="route.html" class="primary-btn">View Journey</a>
                    <a href="payments.html" class="outline-btn">View Receipt</a>
                </div>
            </div>
        `;
        overlay.classList.add('af-overlay-open');
        overlay.setAttribute('aria-hidden', 'false');
    }

    function showPaymentFailureOverlay() {
        const overlay = document.getElementById('af-payment-overlay');
        if (!overlay) return;
        overlay.innerHTML = `
            <div class="af-pay-overlay-card af-pay-failure">
                <div class="af-pay-fail-icon">✗</div>
                <h2>PAYMENT COULD NOT BE COMPLETED</h2>
                <p>Your payment method was not accepted. Please try again or use a different card.</p>
                <div class="af-pay-success-actions">
                    <button type="button" class="primary-btn" onclick="document.getElementById('af-payment-overlay').classList.remove('af-overlay-open');">TRY AGAIN</button>
                    <a href="payments.html" class="outline-btn">CHANGE PAYMENT</a>
                </div>
            </div>
        `;
        overlay.classList.add('af-overlay-open');
        overlay.setAttribute('aria-hidden', 'false');

        // Close button
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('af-overlay-open');
            }
        }, { once: true });
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================
    window.AeroFluxPayments = {
        getPaymentMethods,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,
        getDefaultPaymentMethod,
        processDemoPayment,
        getTransactions,
        getTransaction,
        currency: AF_CURRENCY,
        currencySym: AF_CURRENCY_SYM
    };

    // =========================================================================
    // INIT
    // =========================================================================
    function init() {
        seedDemoData();
        initPaymentsPage();
        initCheckoutWidget();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
