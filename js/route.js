/**
 * NEXUS 2100 - Route Details & Smart Rebooking Engine (Screen 02)
 * "One Journey. Every Future."
 */

document.addEventListener('DOMContentLoaded', () => {
    // Read query params for Origin/Destination if provided
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    const toParam = urlParams.get('to');

    if (fromParam) {
        const fromEl = document.getElementById('route-from-title');
        if (fromEl) fromEl.textContent = decodeURIComponent(fromParam);
    }
    if (toParam) {
        const toEl = document.getElementById('route-to-title');
        if (toEl) toEl.textContent = decodeURIComponent(toParam);
    }

    // State
    let isDelayed = false;
    let isRebooked = false;

    const delayToggleBtn = document.getElementById('simulate-delay-btn');
    const statusCard = document.getElementById('live-status-card');
    const rebookingBanner = document.getElementById('ai-rebooking-banner');
    const acceptRouteBtn = document.getElementById('accept-rebook-btn');
    const dismissRebookBtn = document.getElementById('dismiss-rebook-btn');
    const timelineContainer = document.getElementById('vertical-timeline');
    const arrivalTimeEl = document.getElementById('route-arrival-time');
    const journeyDurationEl = document.getElementById('route-duration');
    const healthBar = document.getElementById('health-progress-bar');
    const healthScore = document.getElementById('health-score-val');

    // Default Timeline HTML
    const defaultTimelineHTML = `
        <!-- Timeline Step 1: Walk -->
        <div class="timeline-step">
            <div class="timeline-marker">
                <div class="timeline-dot start"></div>
                <div class="timeline-connector"></div>
            </div>
            <div class="timeline-content">
                <div class="timeline-time">10:10 PM</div>
                <div class="timeline-title">KDU Campus Origin Station</div>
                <div class="timeline-detail">
                    <span class="timeline-badge">Walk • 3 min</span>
                    <span class="step-free-badge">♿ Level surface • Zero stairs</span>
                </div>
            </div>
        </div>

        <!-- Timeline Step 2: Autonomous Bus -->
        <div class="timeline-step">
            <div class="timeline-marker">
                <div class="timeline-dot transit">🚌</div>
                <div class="timeline-connector"></div>
            </div>
            <div class="timeline-content highlight">
                <div class="timeline-time">10:13 PM - 10:21 PM (8 min)</div>
                <div class="timeline-title">Autonomous Bus • Route A17</div>
                <div class="timeline-meta">Pod #04 • Bay 02 • Automated Ramp Ready</div>
                <div class="timeline-subtext">Zero-driver urban transit. Low energy electric propulsion.</div>
            </div>
        </div>

        <!-- Timeline Step 3: Transfer Hub -->
        <div class="timeline-step">
            <div class="timeline-marker">
                <div class="timeline-dot transfer">🔄</div>
                <div class="timeline-connector"></div>
            </div>
            <div class="timeline-content">
                <div class="timeline-time">10:21 PM</div>
                <div class="timeline-title">Future Central Hub (Transfer)</div>
                <div class="timeline-detail">
                    <span class="timeline-badge warning">Transfer • 4 min window</span>
                    <span class="step-free-badge">♿ High-speed elevator to Sky-Platform 03</span>
                </div>
            </div>
        </div>

        <!-- Timeline Step 4: SkyRail S2 -->
        <div class="timeline-step" id="step-skyrail">
            <div class="timeline-marker">
                <div class="timeline-dot transit">🚄</div>
                <div class="timeline-connector"></div>
            </div>
            <div class="timeline-content highlight" id="skyrail-content-box">
                <div class="timeline-time" id="skyrail-time-label">10:25 PM - 10:37 PM (12 min)</div>
                <div class="timeline-title" id="skyrail-title-label">SkyRail MagLev • Line S2</div>
                <div class="timeline-meta" id="skyrail-meta-label">Car 02 • High-Speed Corridor • Seat 14A Reserved</div>
                <div class="timeline-subtext">Magnetic levitation line. Cruising at 320 km/h.</div>
            </div>
        </div>

        <!-- Timeline Step 5: Arrival -->
        <div class="timeline-step">
            <div class="timeline-marker">
                <div class="timeline-dot end"></div>
            </div>
            <div class="timeline-content">
                <div class="timeline-time">10:37 PM (Scheduled Arrival)</div>
                <div class="timeline-title">Colombo Future District Terminal</div>
                <div class="timeline-detail">
                    <span class="timeline-badge success">Arrived at Destination</span>
                    <span class="step-free-badge">Direct link to pedestrian skywalk</span>
                </div>
            </div>
        </div>
    `;

    // Rebooked Optimized Timeline HTML
    const rebookedTimelineHTML = `
        <div class="timeline-step">
            <div class="timeline-marker">
                <div class="timeline-dot start"></div>
                <div class="timeline-connector"></div>
            </div>
            <div class="timeline-content">
                <div class="timeline-time">10:10 PM</div>
                <div class="timeline-title">KDU Campus Origin Station</div>
                <div class="timeline-detail">
                    <span class="timeline-badge">Walk • 2 min</span>
                    <span class="step-free-badge">♿ Level surface</span>
                </div>
            </div>
        </div>

        <div class="timeline-step">
            <div class="timeline-marker">
                <div class="timeline-dot transit" style="border-color: var(--cyan);">🚌</div>
                <div class="timeline-connector"></div>
            </div>
            <div class="timeline-content highlight" style="border-left: 3px solid var(--cyan);">
                <div class="timeline-time text-cyan">10:12 PM - 10:19 PM (7 min) • [AI REBOOKED]</div>
                <div class="timeline-title">Smart Express Bus • Route B12</div>
                <div class="timeline-meta">Bay 01 • Priority Dynamic Lane SR-9</div>
                <div class="timeline-subtext">Direct express bypass to Sector 4 Hub.</div>
            </div>
        </div>

        <div class="timeline-step">
            <div class="timeline-marker">
                <div class="timeline-dot transfer">🔄</div>
                <div class="timeline-connector"></div>
            </div>
            <div class="timeline-content">
                <div class="timeline-time">10:19 PM</div>
                <div class="timeline-title">Sector 4 SkyPort Terminal (Transfer)</div>
                <div class="timeline-detail">
                    <span class="timeline-badge success">Transfer • 3 min seamless connection</span>
                    <span class="step-free-badge">♿ Platform level transfer</span>
                </div>
            </div>
        </div>

        <div class="timeline-step">
            <div class="timeline-marker">
                <div class="timeline-dot transit" style="border-color: var(--green);">🚄</div>
                <div class="timeline-connector"></div>
            </div>
            <div class="timeline-content highlight" style="border-left: 3px solid var(--green);">
                <div class="timeline-time text-green">10:22 PM - 10:31 PM (9 min) • [AI REBOOKED]</div>
                <div class="timeline-title">SkyRail Express • Line S4</div>
                <div class="timeline-meta">Platform 01 • Express Non-Stop Corridor</div>
                <div class="timeline-subtext">Bypassed delayed Central Hub junction. Saves 6 minutes total.</div>
            </div>
        </div>

        <div class="timeline-step">
            <div class="timeline-marker">
                <div class="timeline-dot end"></div>
            </div>
            <div class="timeline-content">
                <div class="timeline-time text-cyan">10:31 PM (OPTIMIZED EARLIER ARRIVAL)</div>
                <div class="timeline-title">Colombo Future District Terminal</div>
                <div class="timeline-detail">
                    <span class="timeline-badge success">Arrived at Destination (6 min faster)</span>
                </div>
            </div>
        </div>
    `;

    // Simulate Delay Toggle
    if (delayToggleBtn) {
        delayToggleBtn.addEventListener('click', () => {
            isDelayed = !isDelayed;

            if (isDelayed) {
                delayToggleBtn.textContent = '↺ Reset Delay Simulation';
                delayToggleBtn.classList.add('active');

                // Update Status Card to Warning
                statusCard.classList.remove('status-normal');
                statusCard.classList.add('status-warning');
                statusCard.innerHTML = `
                    <div class="status-card-header">
                        <div class="status-indicator">
                            <span class="status-dot pulsing yellow" aria-hidden="true"></span>
                            <span class="status-badge-text text-yellow">⚠ 4 MIN DELAY DETECTED</span>
                        </div>
                        <span class="pill-badge red">ACTION RECOMMENDED</span>
                    </div>
                    <div class="status-card-body">
                        <p class="status-main-msg">
                            SkyRail Line S2 is delayed by 4 minutes due to magnetic track synchronization at Central Hub.
                        </p>
                        <div class="status-quick-stats">
                            <div><strong>Next Connection:</strong> SkyRail S2 (Delayed)</div>
                            <div><strong>Revised Departure:</strong> 10:29 PM</div>
                            <div><strong>Platform:</strong> 03</div>
                        </div>
                    </div>
                `;

                // Show Smart Rebooking AI Assist
                rebookingBanner.style.display = 'block';
                rebookingBanner.classList.add('animate-fade-up');

                if (healthBar) healthBar.style.width = '78%';
                if (healthScore) healthScore.textContent = '78% Optimal';

                if (window.NEXUS && window.NEXUS.speakOrAnnounce) {
                    window.NEXUS.speakOrAnnounce("Warning: SkyRail S2 has a 4-minute delay. AI Journey Assist has generated a faster alternative saving 6 minutes.");
                }
            } else {
                // Reset to normal
                delayToggleBtn.textContent = '⚡ Simulate Real-Time Delay';
                delayToggleBtn.classList.remove('active');
                rebookingBanner.style.display = 'none';
                resetToNormal();
            }
        });
    }

    function resetToNormal() {
        statusCard.classList.remove('status-warning', 'status-rebooked');
        statusCard.classList.add('status-normal');
        statusCard.innerHTML = `
            <div class="status-card-header">
                <div class="status-indicator">
                    <span class="status-dot pulsing" aria-hidden="true"></span>
                    <span class="status-badge-text text-green">LIVE NETWORK STATUS: NORMAL</span>
                </div>
                <span class="pill-badge green">ALL LINES ON TIME</span>
            </div>
            <div class="status-card-body">
                <p class="status-main-msg">
                    Your journey is running smoothly across all multi-modal vectors.
                </p>
                <div class="status-quick-stats">
                    <div><strong>Next Connection:</strong> SkyRail S2</div>
                    <div><strong>Departure:</strong> 10:25 PM</div>
                    <div><strong>Platform:</strong> 03</div>
                    <div><strong>Time Remaining:</strong> 4 min</div>
                </div>
            </div>
        `;
        if (timelineContainer) timelineContainer.innerHTML = defaultTimelineHTML;
        if (arrivalTimeEl) arrivalTimeEl.textContent = '10:37 PM';
        if (journeyDurationEl) journeyDurationEl.textContent = '32 Minutes';
        if (healthBar) healthBar.style.width = '96%';
        if (healthScore) healthScore.textContent = '96% Optimal';
    }

    // Accept Rebooking Route
    if (acceptRouteBtn) {
        acceptRouteBtn.addEventListener('click', () => {
            isRebooked = true;
            rebookingBanner.style.display = 'none';

            statusCard.classList.remove('status-warning');
            statusCard.classList.add('status-normal', 'status-rebooked');
            statusCard.innerHTML = `
                <div class="status-card-header">
                    <div class="status-indicator">
                        <span class="status-dot pulsing" style="background-color: var(--cyan);" aria-hidden="true"></span>
                        <span class="status-badge-text text-cyan">✓ SMART REBOOKING ACTIVE</span>
                    </div>
                    <span class="pill-badge cyan">6 MINUTES SAVED</span>
                </div>
                <div class="status-card-body">
                    <p class="status-main-msg">
                        AI has rerouted you via Smart Express Bus B12 and SkyRail Express S4. Delayed connection avoided!
                    </p>
                    <div class="status-quick-stats">
                        <div><strong>Next Connection:</strong> Smart Bus B12</div>
                        <div><strong>Departure:</strong> 10:12 PM</div>
                        <div><strong>Bay:</strong> 01 Express</div>
                    </div>
                </div>
            `;

            if (timelineContainer) {
                timelineContainer.innerHTML = rebookedTimelineHTML;
                timelineContainer.classList.add('animate-fade-up');
            }
            if (arrivalTimeEl) arrivalTimeEl.textContent = '10:31 PM';
            if (journeyDurationEl) journeyDurationEl.textContent = '26 Minutes (Saved 6m)';
            if (healthBar) healthBar.style.width = '99%';
            if (healthScore) healthScore.textContent = '99% Maximum Efficiency';

            if (window.NEXUS && window.NEXUS.speakOrAnnounce) {
                window.NEXUS.speakOrAnnounce("New route accepted. You are now rerouted via Smart Express Bus B12 and SkyRail S4. Estimated arrival 10:31 PM.");
            }
        });
    }

    // Dismiss Rebooking
    if (dismissRebookBtn) {
        dismissRebookBtn.addEventListener('click', () => {
            rebookingBanner.style.display = 'none';
            if (window.NEXUS && window.NEXUS.speakOrAnnounce) {
                window.NEXUS.speakOrAnnounce("Current route kept. Proceeding with original itinerary.");
            }
        });
    }
});
