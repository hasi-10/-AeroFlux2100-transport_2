/**
 * NEXUS 2100 - Home Page Interactions (Screen 01)
 * "One Journey. Every Future."
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Swap Locations Button ---
    const swapBtn = document.getElementById('swap-locations-btn');
    const fromInput = document.getElementById('from-location-input');
    const toInput = document.getElementById('to-location-input');

    if (swapBtn && fromInput && toInput) {
        swapBtn.addEventListener('click', () => {
            const temp = fromInput.value;
            fromInput.value = toInput.value;
            toInput.value = temp;

            // Subtle rotation feedback
            swapBtn.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                swapBtn.style.transform = '';
            }, 300);

            if (window.NEXUS && window.NEXUS.speakOrAnnounce) {
                window.NEXUS.speakOrAnnounce(`Swapped origin and destination. From ${fromInput.value} to ${toInput.value}`);
            }
        });
    }

    // --- Transport Mode Chips ---
    const modeChips = document.querySelectorAll('.mode-chip');
    modeChips.forEach(chip => {
        chip.addEventListener('click', () => {
            modeChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const mode = chip.getAttribute('data-mode') || 'smart';
            
            if (window.NEXUS && window.NEXUS.speakOrAnnounce) {
                window.NEXUS.speakOrAnnounce(`Mode selected: ${chip.textContent.trim()}`);
            }
        });
    });

    // --- AI Search Flow Simulation ---
    const searchBtn = document.getElementById('find-route-btn');
    const analysisOverlay = document.getElementById('analysis-overlay');
    const step1 = document.getElementById('step-bus');
    const step2 = document.getElementById('step-rail');
    const step3 = document.getElementById('step-air');
    const step4 = document.getElementById('step-opt');
    const analysisTitle = document.getElementById('analysis-title');

    window.findJourney = function () {
        if (!analysisOverlay) {
            window.location.href = 'route.html';
            return;
        }

        // Display Loading Overlay
        analysisOverlay.classList.add('open');
        analysisOverlay.setAttribute('aria-hidden', 'false');

        if (window.NEXUS && window.NEXUS.speakOrAnnounce) {
            window.NEXUS.speakOrAnnounce("Analyzing network. Checking autonomous buses, SkyRail, and air routes.");
        }

        // Sequential multi-stage AI analysis animation
        setTimeout(() => {
            if (step1) {
                step1.classList.add('done');
                step1.querySelector('.step-status').textContent = '● Bus network synced (Route A17)';
            }
        }, 350);

        setTimeout(() => {
            if (step2) {
                step2.classList.add('done');
                step2.querySelector('.step-status').textContent = '● SkyRail S2 confirmed on schedule';
            }
        }, 700);

        setTimeout(() => {
            if (step3) {
                step3.classList.add('done');
                step3.querySelector('.step-status').textContent = '● AirLink corridor verified';
            }
        }, 1050);

        setTimeout(() => {
            if (step4) {
                step4.classList.add('done');
                step4.querySelector('.step-status').textContent = '✓ Transfer at Central Hub: 4 min seamless connection';
            }
            if (analysisTitle) {
                analysisTitle.textContent = 'OPTIMAL ROUTE CALCULATED';
                analysisTitle.style.color = 'var(--cyan)';
            }
        }, 1400);

        // Transition to Screen 02 Route Details
        setTimeout(() => {
            const fromVal = encodeURIComponent(fromInput ? fromInput.value : 'KDU Campus');
            const toVal = encodeURIComponent(toInput ? toInput.value : 'Colombo Future District');
            window.location.href = `route.html?from=${fromVal}&to=${toVal}`;
        }, 1900);
    };

    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.findJourney();
        });
    }

    // Interactive Network Node Highlight
    const schematicNodes = document.querySelectorAll('.transit-node');
    schematicNodes.forEach(node => {
        node.addEventListener('mouseenter', () => {
            const name = node.getAttribute('data-station-name') || 'Transit Station';
            const infoEl = document.getElementById('active-node-info');
            if (infoEl) {
                infoEl.textContent = `${name}: Real-time flow 99.4% optimal`;
            }
        });
    });
});
