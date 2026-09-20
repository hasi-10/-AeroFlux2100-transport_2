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
    
    // --- Hero Parallax Effect ---
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            // Map 0 -> 1 to 30% -> 70% for a smooth shift
            const moveX = 30 + (x * 40);
            const moveY = 30 + (y * 40);
            
            heroSection.style.setProperty('--parallax-x', `${moveX}%`);
            heroSection.style.setProperty('--parallax-y', `${moveY}%`);
        });

        // Reset when mouse leaves
        heroSection.addEventListener('mouseleave', () => {
            heroSection.style.setProperty('--parallax-x', '50%');
            heroSection.style.setProperty('--parallax-y', '50%');
        });
    }

    // --- Hero Text Letter Animation ---
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle && !document.body.classList.contains('reduce-motion')) {
        // We only want to animate text nodes, not the <br> or the inner <span> yet.
        // Actually, let's just animate all text inside the h1.
        const htmlContent = heroTitle.innerHTML;
        // Strip out the existing gradient span and br temporarily to rebuild it
        // We use text-cyan instead of text-gradient because background-clip: text 
        // completely breaks when children have opacity/transform animations in Webkit.
        heroTitle.innerHTML = `
            <span class="word-wrapper">One</span> <span class="word-wrapper">Journey.</span><br>
            <span class="text-cyan" style="text-shadow: 0 0 15px rgba(0,240,255,0.5);"><span class="word-wrapper">Every</span> <span class="word-wrapper">Future.</span></span>
        `;
        
        const wrappers = heroTitle.querySelectorAll('.word-wrapper');
        let charDelay = 0;
        
        wrappers.forEach(wrapper => {
            const text = wrapper.textContent;
            wrapper.innerHTML = ''; // clear
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const span = document.createElement('span');
                span.className = 'char-span';
                span.style.animationDelay = `${charDelay}ms`;
                span.textContent = char === ' ' ? '\u00A0' : char;
                wrapper.appendChild(span);
                charDelay += 50; // stagger
            }
            // Add space after word
            wrapper.innerHTML += ' ';
        });
    }
});
