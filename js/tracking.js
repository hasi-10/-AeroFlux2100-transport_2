/**
 * NEXUS 2100 - Live Vehicle Tracking & Futuristic Map Engine (Screen 03)
 * "One Journey. Every Future."
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Countdown Timer for ETA (Section 39) ---
    let timeInSeconds = 272; // 04:32 initial
    const etaDisplay = document.getElementById('live-eta-countdown');
    const speedDisplay = document.getElementById('live-speed-telemetry');
    const distanceDisplay = document.getElementById('live-distance-telemetry');

    function updateTimer() {
        if (timeInSeconds > 0) {
            timeInSeconds--;
            const mins = Math.floor(timeInSeconds / 60);
            const secs = timeInSeconds % 60;
            if (etaDisplay) {
                etaDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }

            // Fluctuate speed slightly for realistic live telemetry
            if (speedDisplay && Math.random() > 0.6) {
                const baseSpeed = 280;
                const jitter = Math.floor(Math.random() * 8) - 4;
                speedDisplay.textContent = `${baseSpeed + jitter} km/h`;
            }

            // Fluctuate distance
            if (distanceDisplay) {
                const remainingKm = (timeInSeconds * 0.075).toFixed(1);
                distanceDisplay.textContent = `${remainingKm} km`;
            }
        } else {
            if (etaDisplay) etaDisplay.textContent = "ARRIVING NOW";
            if (window.NEXUS && window.NEXUS.speakOrAnnounce) {
                window.NEXUS.speakOrAnnounce("SkyRail S2 has arrived at Future Central Hub Platform 03. Please prepare for transfer.");
            }
        }
    }

    setInterval(updateTimer, 1000);

    // --- Interactive Map Canvas / SVG Vehicle Animation ---
    const vehicleIcon = document.getElementById('moving-vehicle-marker');
    const vehicleTrack = document.getElementById('vehicle-active-path');
    const radarPulse = document.getElementById('vehicle-radar-pulse');
    const stationInfoBox = document.getElementById('station-info-toast');

    let progress = 0.25; // 25% along route initially
    let direction = 1;

    function animateVehicleMovement() {
        // Only run animation if not in reduced motion mode
        const isReducedMotion = document.body.classList.contains('reduce-motion');
        
        if (!isReducedMotion && vehicleIcon && vehicleTrack) {
            progress += 0.0008 * direction;
            if (progress > 0.85) direction = -1;
            if (progress < 0.15) direction = 1;

            // Compute coordinate on SVG path
            const pathLength = vehicleTrack.getTotalLength ? vehicleTrack.getTotalLength() : 600;
            const currentPoint = vehicleTrack.getPointAtLength(progress * pathLength);

            vehicleIcon.setAttribute('transform', `translate(${currentPoint.x - 20}, ${currentPoint.y - 20})`);
            if (radarPulse) {
                radarPulse.setAttribute('cx', currentPoint.x);
                radarPulse.setAttribute('cy', currentPoint.y);
            }
        }

        requestAnimationFrame(animateVehicleMovement);
    }

    if (vehicleTrack && vehicleTrack.getTotalLength) {
        requestAnimationFrame(animateVehicleMovement);
    }

    // --- Interactive Stations on Map ---
    const mapStations = document.querySelectorAll('.map-station-node');
    mapStations.forEach(st => {
        st.addEventListener('click', () => {
            const name = st.getAttribute('data-station');
            const eta = st.getAttribute('data-eta');
            const platform = st.getAttribute('data-platform');

            if (stationInfoBox) {
                stationInfoBox.innerHTML = `
                    <div style="font-weight: 700; color: var(--cyan); margin-bottom: 2px;">● ${name}</div>
                    <div style="font-size: 0.85rem; color: #E2E8F0;">Arrival ETA: <strong>${eta}</strong> • Platform: <strong>${platform}</strong></div>
                    <div style="font-size: 0.78rem; color: var(--green); margin-top: 4px;">✓ Level boarding & elevator connected</div>
                `;
                stationInfoBox.style.display = 'block';
                stationInfoBox.classList.add('animate-fade-up');
            }

            if (window.NEXUS && window.NEXUS.speakOrAnnounce) {
                window.NEXUS.speakOrAnnounce(`Station selected: ${name}. Platform ${platform}. ETA ${eta}.`);
            }
        });
    });

    // --- Voice Announcer Button ---
    const voiceAnnounceBtn = document.getElementById('speak-next-stop-btn');
    if (voiceAnnounceBtn) {
        voiceAnnounceBtn.addEventListener('click', () => {
            const msg = "Attention passengers. SkyRail S2 is approaching Future Central Hub, Platform 03. Connections available for Autonomous Bus A17 and AirLink SkyPort. Level step-free exit on the right.";
            if (window.NEXUS && window.NEXUS.speakOrAnnounce) {
                window.NEXUS.speakOrAnnounce(msg);
            }
        });
    }

    // --- Map Layer Selector (Rail / Air / Roads) ---
    const layerButtons = document.querySelectorAll('.map-layer-toggle');
    layerButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            layerButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const layer = btn.getAttribute('data-layer');

            const railPaths = document.querySelectorAll('.path-rail');
            const airPaths = document.querySelectorAll('.path-air');
            const roadPaths = document.querySelectorAll('.path-road');

            if (layer === 'all') {
                railPaths.forEach(p => p.style.opacity = '1');
                airPaths.forEach(p => p.style.opacity = '0.7');
                roadPaths.forEach(p => p.style.opacity = '0.5');
            } else if (layer === 'rail') {
                railPaths.forEach(p => p.style.opacity = '1');
                airPaths.forEach(p => p.style.opacity = '0.15');
                roadPaths.forEach(p => p.style.opacity = '0.15');
            } else if (layer === 'air') {
                railPaths.forEach(p => p.style.opacity = '0.2');
                airPaths.forEach(p => p.style.opacity = '1');
                roadPaths.forEach(p => p.style.opacity = '0.15');
            } else if (layer === 'road') {
                railPaths.forEach(p => p.style.opacity = '0.2');
                airPaths.forEach(p => p.style.opacity = '0.15');
                roadPaths.forEach(p => p.style.opacity = '1');
            }

            if (window.NEXUS && window.NEXUS.speakOrAnnounce) {
                window.NEXUS.speakOrAnnounce(`Map filter set to ${btn.textContent.trim()}`);
            }
        });
    });
});
