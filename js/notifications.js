/**
 * AeroFlux2100 — Notification Service & UI
 * "One Journey. Every Future."
 *
 * Adds: bell, panel, filters, toasts, preferences
 * Preserves: all existing functionality
 */

(function () {
    'use strict';

    // =========================================================================
    // STORAGE KEYS
    // =========================================================================
    const NOTIF_KEY  = 'aeroflux_notifications';
    const PREFS_KEY  = 'aeroflux_notif_prefs';

    // =========================================================================
    // DEFAULT PREFERENCES
    // =========================================================================
    const DEFAULT_PREFS = {
        journeyUpdates:    true,
        delayAlerts:       true,
        paymentUpdates:    true,
        bookingUpdates:    true,
        serviceAlerts:     true,
        aiRecommendations: true,
        sound:             false
    };

    // =========================================================================
    // NOTIFICATION TYPES & ICONS
    // =========================================================================
    const TYPE_META = {
        journey:  { icon: '🚆', label: 'Journey',  filter: 'journeys'  },
        transport:{ icon: '🚌', label: 'Transport', filter: 'journeys'  },
        delay:    { icon: '⚠',  label: 'Delay',    filter: 'alerts'    },
        platform: { icon: '📍', label: 'Platform',  filter: 'alerts'    },
        payment:  { icon: '💳', label: 'Payment',   filter: 'payments'  },
        booking:  { icon: '✅', label: 'Booking',   filter: 'journeys'  },
        system:   { icon: '⚙',  label: 'System',   filter: 'system'    },
        ai:       { icon: '✦',  label: 'AI',        filter: 'system'    }
    };

    // Priority styling
    const PRIORITY_CLASS = {
        normal:    '',
        important: 'notif-important',
        urgent:    'notif-urgent'
    };

    // =========================================================================
    // STORAGE HELPERS
    // =========================================================================
    function loadNotifications() {
        try {
            const raw = localStorage.getItem(NOTIF_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    function saveNotifications(list) {
        try { localStorage.setItem(NOTIF_KEY, JSON.stringify(list)); } catch {}
    }

    function loadPrefs() {
        try {
            const raw = localStorage.getItem(PREFS_KEY);
            return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
        } catch { return { ...DEFAULT_PREFS }; }
    }

    function savePrefs(prefs) {
        try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
    }

    // =========================================================================
    // NOTIFICATION SERVICE API
    // =========================================================================
    let _prefs = loadPrefs();

    function createNotification(type, title, message, priority = 'normal', action = null) {
        // Respect per-category prefs
        const prefMap = {
            journey:   _prefs.journeyUpdates,
            transport: _prefs.journeyUpdates,
            delay:     _prefs.delayAlerts,
            platform:  _prefs.delayAlerts,
            payment:   _prefs.paymentUpdates,
            booking:   _prefs.bookingUpdates,
            system:    _prefs.serviceAlerts,
            ai:        _prefs.aiRecommendations
        };
        if (prefMap[type] === false) return null;

        const notif = {
            id:        'N-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            type,
            title,
            message,
            priority,
            action,      // { label, href } or null
            read:        false,
            timestamp:   new Date().toISOString()
        };

        const list = loadNotifications();
        list.unshift(notif); // newest first
        // Cap at 50 notifications
        if (list.length > 50) list.splice(50);
        saveNotifications(list);

        // Update badge
        updateBadge();

        // Dispatch event for other modules
        document.dispatchEvent(new CustomEvent('aeroflux:notification', { detail: notif }));

        // Toast for important/urgent
        if (priority === 'important' || priority === 'urgent') {
            showToast(notif);
        }

        return notif;
    }

    function getNotifications(filter = 'all') {
        const list = loadNotifications();
        if (filter === 'all') return list;
        return list.filter(n => {
            const meta = TYPE_META[n.type] || {};
            return meta.filter === filter;
        });
    }

    function markAsRead(id) {
        const list = loadNotifications();
        const n = list.find(x => x.id === id);
        if (n) { n.read = true; saveNotifications(list); updateBadge(); }
    }

    function markAllAsRead() {
        const list = loadNotifications();
        list.forEach(n => n.read = true);
        saveNotifications(list);
        updateBadge();
        renderPanel();
    }

    function getUnreadCount() {
        return loadNotifications().filter(n => !n.read).length;
    }

    // =========================================================================
    // BADGE
    // =========================================================================
    function updateBadge() {
        const badge = document.getElementById('notif-badge');
        if (!badge) return;
        const count = getUnreadCount();
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // =========================================================================
    // TOAST NOTIFICATIONS
    // =========================================================================
    function showToast(notif) {
        const container = document.getElementById('af-toast-container');
        if (!container) return;

        const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            || document.body.classList.contains('reduce-motion');

        const meta  = TYPE_META[notif.type] || { icon: '●', label: 'Update' };
        const toast = document.createElement('div');
        toast.className = `af-toast af-toast-${notif.priority || 'normal'}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.innerHTML = `
            <div class="af-toast-header">
                <span class="af-toast-dot"></span>
                <span class="af-toast-type">${meta.label.toUpperCase()}</span>
                <button class="af-toast-close" aria-label="Dismiss notification">×</button>
            </div>
            <div class="af-toast-body">
                <strong>${escHtml(notif.title)}</strong>
                <p>${escHtml(notif.message)}</p>
                ${notif.action ? `<a href="${notif.action.href}" class="af-toast-action">${escHtml(notif.action.label)} →</a>` : ''}
            </div>
        `;

        container.appendChild(toast);

        // Animate in
        if (!isReducedMotion) {
            requestAnimationFrame(() => toast.classList.add('af-toast-visible'));
        } else {
            toast.classList.add('af-toast-visible');
        }

        // Close button
        toast.querySelector('.af-toast-close').addEventListener('click', () => dismissToast(toast));

        // Auto dismiss after 5s
        const timer = setTimeout(() => dismissToast(toast), 5000);
        toast._timer = timer;
    }

    function dismissToast(toast) {
        clearTimeout(toast._timer);
        toast.classList.remove('af-toast-visible');
        toast.classList.add('af-toast-out');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
    }

    // =========================================================================
    // FORMAT TIMESTAMP
    // =========================================================================
    function formatTimeAgo(iso) {
        const diff = Date.now() - new Date(iso).getTime();
        const sec  = Math.floor(diff / 1000);
        const min  = Math.floor(sec / 60);
        const hr   = Math.floor(min / 60);
        const day  = Math.floor(hr  / 24);
        if (sec < 60)  return 'just now';
        if (min < 60)  return `${min} min ago`;
        if (hr  < 24)  return `${hr} hr ago`;
        if (day === 1) return 'yesterday';
        return `${day} days ago`;
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;');
    }

    // =========================================================================
    // PANEL RENDERING
    // =========================================================================
    let _activeFilter = 'all';

    function renderPanel() {
        const list    = document.getElementById('af-notif-list');
        const empty   = document.getElementById('af-notif-empty');
        if (!list) return;

        const notifications = getNotifications(_activeFilter);
        list.innerHTML = '';

        if (notifications.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        notifications.forEach(n => {
            const meta  = TYPE_META[n.type] || { icon: '●' };
            const pCls  = PRIORITY_CLASS[n.priority] || '';
            const card  = document.createElement('div');
            card.className = `af-notif-card ${n.read ? 'af-notif-read' : 'af-notif-unread'} ${pCls}`;
            card.setAttribute('data-id', n.id);
            card.innerHTML = `
                <div class="af-notif-icon">${meta.icon}</div>
                <div class="af-notif-content">
                    <div class="af-notif-title-row">
                        <span class="af-notif-title">${escHtml(n.title)}</span>
                        ${!n.read ? '<span class="af-notif-unread-dot" aria-label="Unread"></span>' : ''}
                    </div>
                    <p class="af-notif-msg">${escHtml(n.message)}</p>
                    <span class="af-notif-time">${formatTimeAgo(n.timestamp)}</span>
                    ${n.action ? `<a href="${n.action.href}" class="af-notif-action-btn">${escHtml(n.action.label)}</a>` : ''}
                </div>
            `;
            // Mark as read on click
            card.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') return;
                markAsRead(n.id);
                card.classList.remove('af-notif-unread');
                card.classList.add('af-notif-read');
                const dot = card.querySelector('.af-notif-unread-dot');
                if (dot) dot.remove();
                if (n.action) window.location.href = n.action.href;
            });
            list.appendChild(card);
        });
    }

    // =========================================================================
    // PANEL OPEN / CLOSE
    // =========================================================================
    function openPanel() {
        const panel = document.getElementById('af-notif-panel');
        const bell  = document.getElementById('af-notif-bell');
        if (!panel) return;
        renderPanel();
        panel.classList.add('af-panel-open');
        panel.setAttribute('aria-hidden', 'false');
        if (bell) bell.setAttribute('aria-expanded', 'true');
        // Focus trap first focusable element
        const first = panel.querySelector('button, a, [tabindex]');
        if (first) setTimeout(() => first.focus(), 50);
    }

    function closePanel() {
        const panel = document.getElementById('af-notif-panel');
        const bell  = document.getElementById('af-notif-bell');
        if (!panel) return;
        panel.classList.remove('af-panel-open');
        panel.setAttribute('aria-hidden', 'true');
        if (bell) {
            bell.setAttribute('aria-expanded', 'false');
            bell.focus();
        }
    }

    // =========================================================================
    // BELL ANIMATION
    // =========================================================================
    function animateBell() {
        const bell = document.getElementById('af-notif-bell');
        if (!bell) return;
        if (document.body.classList.contains('reduce-motion')) return;
        bell.classList.remove('af-bell-ring');
        void bell.offsetWidth; // reflow
        bell.classList.add('af-bell-ring');
        bell.addEventListener('animationend', () => bell.classList.remove('af-bell-ring'), { once: true });
    }

    // =========================================================================
    // SEED DEMO NOTIFICATIONS (if empty on first load)
    // =========================================================================
    function seedDemoNotifications() {
        const existing = loadNotifications();
        if (existing.length > 0) return;

        const demos = [
            {
                type: 'journey', title: 'Journey Confirmed', priority: 'normal',
                message: 'Your AeroFlux journey from KDU to Colombo Future District is confirmed. Departure at 18:10.',
                action: { label: 'View Journey', href: 'route.html' }
            },
            {
                type: 'transport', title: 'SkyRail Arriving', priority: 'normal',
                message: 'SkyRail S2 is arriving at Platform 04 in 3 minutes.',
                action: null
            },
            {
                type: 'delay', title: 'Journey Alert', priority: 'important',
                message: 'SkyRail S2 is delayed by 6 minutes. ORA has found an alternative route.',
                action: { label: 'View Alternative', href: 'route.html' }
            },
            {
                type: 'payment', title: 'Payment Successful', priority: 'normal',
                message: 'Your AeroFlux journey payment of LKR 470.00 was completed successfully.',
                action: { label: 'View Receipt', href: 'payments.html' }
            },
            {
                type: 'booking', title: 'Journey Booked', priority: 'normal',
                message: 'Your booking #AF-2100-2841 for KDU → Colombo has been confirmed.',
                action: { label: 'View Journey', href: 'route.html' }
            },
            {
                type: 'system', title: 'Network Update', priority: 'normal',
                message: 'AeroFlux network maintenance is scheduled tonight between 02:00–04:00. Minimal disruption expected.',
                action: null
            }
        ];

        // Seed with staggered fake timestamps
        const now = Date.now();
        demos.forEach((d, i) => {
            const notif = {
                id:        'N-DEMO-' + i,
                type:      d.type,
                title:     d.title,
                message:   d.message,
                priority:  d.priority,
                action:    d.action,
                read:      i > 2,  // first 3 unread
                timestamp: new Date(now - (i * 8 * 60 * 1000)).toISOString()
            };
            const list = loadNotifications();
            list.push(notif);
            saveNotifications(list);
        });
    }

    // =========================================================================
    // PREFERENCES UI
    // =========================================================================
    function bindPreferenceToggles() {
        document.querySelectorAll('[data-notif-pref]').forEach(el => {
            const key = el.getAttribute('data-notif-pref');
            if (!key) return;
            // Set initial state
            el.checked = _prefs[key] !== false;
            el.addEventListener('change', () => {
                _prefs[key] = el.checked;
                savePrefs(_prefs);
                // Sync all matching toggles on page
                document.querySelectorAll(`[data-notif-pref="${key}"]`).forEach(o => {
                    if (o !== el) o.checked = el.checked;
                });
            });
        });
    }

    // =========================================================================
    // DOM INJECTION — Bell + Panel + Toast Container
    // =========================================================================
    function injectNotificationUI() {
        // Skip login/intro pages
        const path = window.location.pathname;
        if (path.includes('login.html') || path.includes('intro.html')) return;

        // --- 1. BELL BUTTON ---
        injectBell();

        // --- 2. NOTIFICATION PANEL ---
        injectPanel();

        // --- 3. TOAST CONTAINER ---
        injectToastContainer();

        // --- 4. BIND EVENTS ---
        bindPanelEvents();
        bindPreferenceToggles();
        updateBadge();

        // Animate bell when new notification arrives
        document.addEventListener('aeroflux:notification', () => {
            animateBell();
            updateBadge();
            // Re-render panel if open
            const panel = document.getElementById('af-notif-panel');
            if (panel && panel.classList.contains('af-panel-open')) {
                renderPanel();
            }
        });
    }

    function injectBell() {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions || document.getElementById('af-notif-bell')) return;

        const bellBtn = document.createElement('button');
        bellBtn.id = 'af-notif-bell';
        bellBtn.type = 'button';
        bellBtn.className = 'af-bell-btn';
        bellBtn.setAttribute('aria-label', 'Open notifications');
        bellBtn.setAttribute('aria-expanded', 'false');
        bellBtn.setAttribute('aria-controls', 'af-notif-panel');
        bellBtn.innerHTML = `
            <svg class="af-bell-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span id="notif-badge" class="af-notif-badge" aria-label="unread notifications" style="display:none;">0</span>
        `;

        // Insert before the first child (Login button / profile)
        navActions.insertBefore(bellBtn, navActions.firstChild);
    }

    function injectPanel() {
        if (document.getElementById('af-notif-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'af-notif-panel';
        panel.className = 'af-notif-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'false');
        panel.setAttribute('aria-labelledby', 'af-notif-panel-title');
        panel.setAttribute('aria-hidden', 'true');

        panel.innerHTML = `
            <div class="af-panel-header">
                <h2 id="af-notif-panel-title" class="af-panel-title">NOTIFICATIONS</h2>
                <div class="af-panel-header-actions">
                    <button type="button" id="af-mark-all-read" class="af-text-btn">Mark all as read</button>
                    <button type="button" id="af-close-panel" class="af-panel-close" aria-label="Close notifications">×</button>
                </div>
            </div>

            <div class="af-notif-filters" role="tablist" aria-label="Filter notifications">
                <button type="button" class="af-filter-tab active" data-filter="all" role="tab" aria-selected="true">All</button>
                <button type="button" class="af-filter-tab" data-filter="journeys" role="tab" aria-selected="false">Journeys</button>
                <button type="button" class="af-filter-tab" data-filter="payments" role="tab" aria-selected="false">Payments</button>
                <button type="button" class="af-filter-tab" data-filter="alerts" role="tab" aria-selected="false">Alerts</button>
                <button type="button" class="af-filter-tab" data-filter="system" role="tab" aria-selected="false">System</button>
            </div>

            <div id="af-notif-list" class="af-notif-list" role="list"></div>

            <div id="af-notif-empty" class="af-notif-empty" style="display:none;" aria-live="polite">
                <div class="af-empty-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                </div>
                <h3>You're all caught up</h3>
                <p>No updates from the AeroFlux network.</p>
            </div>
        `;

        document.body.appendChild(panel);
    }

    function injectToastContainer() {
        if (document.getElementById('af-toast-container')) return;
        const tc = document.createElement('div');
        tc.id = 'af-toast-container';
        tc.className = 'af-toast-container';
        tc.setAttribute('aria-live', 'polite');
        tc.setAttribute('aria-atomic', 'false');
        document.body.appendChild(tc);
    }

    function bindPanelEvents() {
        // Bell toggle
        document.addEventListener('click', (e) => {
            const bell = e.target.closest('#af-notif-bell');
            if (bell) {
                const panel = document.getElementById('af-notif-panel');
                if (panel && panel.classList.contains('af-panel-open')) {
                    closePanel();
                } else {
                    openPanel();
                }
                return;
            }

            // Close panel
            if (e.target.closest('#af-close-panel')) {
                closePanel();
                return;
            }

            // Mark all read
            if (e.target.closest('#af-mark-all-read')) {
                markAllAsRead();
                return;
            }

            // Filter tabs
            const tab = e.target.closest('.af-filter-tab');
            if (tab) {
                const panel = document.getElementById('af-notif-panel');
                if (!panel) return;
                panel.querySelectorAll('.af-filter-tab').forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                _activeFilter = tab.getAttribute('data-filter') || 'all';
                renderPanel();
                return;
            }

            // Close if clicking outside panel
            const panel = document.getElementById('af-notif-panel');
            if (panel && panel.classList.contains('af-panel-open')) {
                if (!panel.contains(e.target) && !e.target.closest('#af-notif-bell')) {
                    closePanel();
                }
            }
        });

        // Escape key closes panel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const panel = document.getElementById('af-notif-panel');
                if (panel && panel.classList.contains('af-panel-open')) {
                    closePanel();
                }
            }
        });
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================
    window.AeroFluxNotifications = {
        create:      createNotification,
        get:         getNotifications,
        markRead:    markAsRead,
        markAllRead: markAllAsRead,
        unreadCount: getUnreadCount,
        showToast,
        prefs:       () => _prefs
    };

    // =========================================================================
    // INIT
    // =========================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        _prefs = loadPrefs();
        seedDemoNotifications();
        injectNotificationUI();
    }

})();
