/**
 * NEXUS 2100 - Common Engine & Accessibility Framework
 * "One Journey. Every Future."
 */

(function () {
    'use strict';

    // --- State Storage Keys ---
    const STORAGE_KEY = 'nexus_2100_preferences';

    // Default User Preferences
    const defaultPreferences = {
        textSize: 'normal',      // 'normal' | 'large'
        contrast: 'normal',      // 'normal' | 'high'
        motion: 'normal',        // 'normal' | 'reduced'
        stepFree: false,
        voiceGuidance: false
    };

    let preferences = { ...defaultPreferences };

    // Load saved preferences
    function loadPreferences() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                preferences = { ...defaultPreferences, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Storage unavailable, using defaults');
        }
        applyPreferences();
    }

    // Save preferences
    function savePreferences() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
        } catch (e) {
            console.warn('Could not save to localStorage');
        }
        applyPreferences();
    }

    // Apply styles to document body
    function applyPreferences() {
        const body = document.body;

        // Text Size
        if (preferences.textSize === 'large') {
            body.classList.add('large-text');
        } else {
            body.classList.remove('large-text');
        }

        // Contrast
        if (preferences.contrast === 'high') {
            body.classList.add('high-contrast');
        } else {
            body.classList.remove('high-contrast');
        }

        // Motion
        if (preferences.motion === 'reduced') {
            body.classList.add('reduce-motion');
        } else {
            body.classList.remove('reduce-motion');
        }

        // Sync UI Buttons in DOM if present
        syncAccessUI();
    }

    function syncAccessUI() {
        // Text buttons
        document.querySelectorAll('[data-access-text]').forEach(btn => {
            const val = btn.getAttribute('data-access-text');
            btn.classList.toggle('active', val === preferences.textSize);
        });

        // Contrast buttons
        document.querySelectorAll('[data-access-contrast]').forEach(btn => {
            const val = btn.getAttribute('data-access-contrast');
            btn.classList.toggle('active', val === preferences.contrast);
        });

        // Motion buttons
        document.querySelectorAll('[data-access-motion]').forEach(btn => {
            const val = btn.getAttribute('data-access-motion');
            btn.classList.toggle('active', val === preferences.motion);
        });

        // Step Free Checkbox
        const stepFreeCheck = document.getElementById('step-free-check');
        if (stepFreeCheck) {
            stepFreeCheck.checked = preferences.stepFree;
        }

        // Voice Guidance Checkbox
        const voiceCheck = document.getElementById('voice-guidance-check');
        if (voiceCheck) {
            voiceCheck.checked = preferences.voiceGuidance;
        }
    }

    // Live ARIA Announcer for screen readers
    function speakOrAnnounce(text) {
        let liveRegion = document.getElementById('nexus-live-announcer');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'nexus-live-announcer';
            liveRegion.setAttribute('aria-live', 'assertive');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.padding = '0';
            liveRegion.style.overflow = 'hidden';
            liveRegion.style.clip = 'rect(0, 0, 0, 0)';
            liveRegion.style.whiteSpace = 'nowrap';
            liveRegion.style.border = '0';
            document.body.appendChild(liveRegion);
        }
        liveRegion.textContent = text;

        if (preferences.voiceGuidance && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.05;
            window.speechSynthesis.speak(utterance);
        }
    }

    // Modal Handlers
    function setupModals() {
        // Accessibility Modal
        const accessBtn = document.getElementById('accessibility-toggle-btn');
        const accessModal = document.getElementById('accessibility-modal');
        const closeAccessBtn = document.getElementById('close-access-modal');

        if (accessBtn && accessModal) {
            accessBtn.addEventListener('click', () => {
                accessModal.classList.add('open');
                accessModal.setAttribute('aria-hidden', 'false');
            });
        }

        if (closeAccessBtn && accessModal) {
            closeAccessBtn.addEventListener('click', () => {
                accessModal.classList.remove('open');
                accessModal.setAttribute('aria-hidden', 'true');
            });
        }

        // ORA AI Assistant
        const oraBtn = document.getElementById('ora-ai-trigger-btn');
        const oraModal = document.getElementById('ora-ai-modal');
        const closeOraBtn = document.getElementById('close-ora-modal');

        if (oraBtn && oraModal) {
            oraBtn.addEventListener('click', () => {
                oraModal.classList.add('open');
                oraModal.setAttribute('aria-hidden', 'false');
                const input = document.getElementById('ora-user-input');
                if (input) input.focus();
            });
        }

        if (closeOraBtn && oraModal) {
            closeOraBtn.addEventListener('click', () => {
                oraModal.classList.remove('open');
                oraModal.setAttribute('aria-hidden', 'true');
            });
        }

        // Close when clicking backdrop
        window.addEventListener('click', (e) => {
            if (e.target === accessModal) {
                accessModal.classList.remove('open');
                accessModal.setAttribute('aria-hidden', 'true');
            }
            if (e.target === oraModal) {
                oraModal.classList.remove('open');
                oraModal.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // ORA AI Chat Engine
    function setupOraChat() {
        const input = document.getElementById('ora-user-input');
        const sendBtn = document.getElementById('ora-send-btn');
        const chatContainer = document.getElementById('ora-chat-messages');

        if (!input || !chatContainer) return;

        function addMessage(text, isUser = false) {
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${isUser ? 'user' : 'assistant'}`;
            bubble.textContent = text;
            chatContainer.appendChild(bubble);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            if (!isUser) speakOrAnnounce(text);
        }

        function handleSend() {
            const query = input.value.trim();
            if (!query) return;
            addMessage(query, true);
            input.value = '';

            // AI Thinking Simulation
            setTimeout(() => {
                const lower = query.toLowerCase();
                let reply = "I'm monitoring all transit lines across Colombo Future District. How may I optimize your journey?";

                if (lower.includes('fast') || lower.includes('speed')) {
                    reply = "Optimal recommendation: SkyRail Line S2 combined with Autonomous Bus A17 gets you to Colombo Future District in 32 minutes flat with zero delay risk.";
                } else if (lower.includes('stair') || lower.includes('step') || lower.includes('wheelchair') || lower.includes('access')) {
                    preferences.stepFree = true;
                    savePreferences();
                    reply = "Step-free mode activated! All selected routes now utilize level boarding platforms, zero-grade magnetic elevators, and tactile guidance.";
                } else if (lower.includes('late') || lower.includes('delay') || lower.includes('hurry')) {
                    reply = "I've flagged high-priority connections. If your current transit encounters traffic, Smart Rebooking will automatically switch you to AirLink Shuttle AL-310.";
                } else if (lower.includes('air') || lower.includes('fly')) {
                    reply = "AirLink Urban Shuttles are currently boarding at SkyPort 04 with 5-minute flight intervals across the bay.";
                } else if (lower.includes('energy') || lower.includes('carbon') || lower.includes('green')) {
                    reply = "Your selected multi-modal itinerary generates zero direct emissions and consumes 18% less energy than individual transport.";
                }

                addMessage(reply, false);
            }, 600);
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', handleSend);
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSend();
        });

        // Quick suggestions
        document.querySelectorAll('.suggestion-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                input.value = btn.textContent.replace(/["]/g, '').trim();
                handleSend();
            });
        });
    }

    // Initialize Accessibility Listeners
    function setupAccessibilityListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-access-text]');
            if (target) {
                preferences.textSize = target.getAttribute('data-access-text');
                savePreferences();
                speakOrAnnounce(`Text size set to ${preferences.textSize}`);
            }

            const cTarget = e.target.closest('[data-access-contrast]');
            if (cTarget) {
                preferences.contrast = cTarget.getAttribute('data-access-contrast');
                savePreferences();
                speakOrAnnounce(`Contrast set to ${preferences.contrast}`);
            }

            const mTarget = e.target.closest('[data-access-motion]');
            if (mTarget) {
                preferences.motion = mTarget.getAttribute('data-access-motion');
                savePreferences();
                speakOrAnnounce(`Motion set to ${preferences.motion}`);
            }
        });

        const stepCheck = document.getElementById('step-free-check');
        if (stepCheck) {
            stepCheck.addEventListener('change', (e) => {
                preferences.stepFree = e.target.checked;
                savePreferences();
                speakOrAnnounce(e.target.checked ? "Step-free routes enabled" : "Step-free routes disabled");
            });
        }

        const voiceCheck = document.getElementById('voice-guidance-check');
        if (voiceCheck) {
            voiceCheck.addEventListener('change', (e) => {
                preferences.voiceGuidance = e.target.checked;
                savePreferences();
                speakOrAnnounce(e.target.checked ? "Voice guidance activated" : "Voice guidance deactivated");
            });
        }
    }

    // Export to global scope
    window.NEXUS = {
        preferences,
        speakOrAnnounce,
        setPreference: (key, val) => {
            preferences[key] = val;
            savePreferences();
        }
    };

    // DOM Ready initialization
    document.addEventListener('DOMContentLoaded', () => {
        loadPreferences();
        setupModals();
        setupOraChat();
        setupAccessibilityListeners();
    });

})();
