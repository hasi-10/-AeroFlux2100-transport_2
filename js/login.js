document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Background Particles & Parallax ---
    const particlesContainer = document.getElementById('particles-container');
    const bgWrapper = document.getElementById('parallax-bg');
    const cardWrapper = document.getElementById('login-card-wrapper');
    
    // Generate subtle particles
    if (particlesContainer) {
        for (let i = 0; i < 30; i++) {
            createParticle(particlesContainer);
        }
    }

    function createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 3 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Random drift animation using WAAPI for performance
        const duration = Math.random() * 20000 + 10000;
        particle.animate([
            { transform: 'translate(0, 0)', opacity: Math.random() * 0.5 },
            { transform: `translate(${(Math.random() - 0.5) * 100}px, ${(Math.random() - 0.5) * 100}px)`, opacity: Math.random() * 0.8 },
            { transform: 'translate(0, 0)', opacity: Math.random() * 0.5 }
        ], {
            duration: duration,
            iterations: Infinity,
            easing: 'ease-in-out'
        });
        
        container.appendChild(particle);
    }

    // Mouse Parallax (disable if reduced motion or mobile)
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isReducedMotion && window.innerWidth > 768 && bgWrapper && cardWrapper) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
            const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
            
            // Subtle shifts
            bgWrapper.style.transform = `translate(${x * -10}px, ${y * -10}px)`;
            cardWrapper.style.transform = `translate(${x * 5}px, ${y * 5}px)`;
        });
    }

    // --- 2. Panel Transitions ---
    const loginPanel = document.getElementById('panel-login');
    const forgotPanel = document.getElementById('panel-forgot');
    const registerPanel = document.getElementById('panel-register');
    const bioPanel = document.getElementById('panel-biometric');

    function switchPanel(targetPanelId) {
        // Hide all active panels by sliding them out
        document.querySelectorAll('.login-panel.active-panel').forEach(panel => {
            panel.classList.remove('active-panel');
            panel.classList.add('hidden-panel', 'left'); // slide left
        });

        // Bring in target panel
        const target = document.getElementById(targetPanelId);
        if (target) {
            // Force reflow to reset transition if needed, then slide in
            target.classList.remove('left', 'right');
            // small delay to allow previous panel to slide out
            setTimeout(() => {
                target.classList.remove('hidden-panel');
                target.classList.add('active-panel');
            }, 50);
        }
    }

    let bioStream = null;

    async function startBiometricScan() {
        const video = document.getElementById('bio-camera');
        const fallbackIcon = document.getElementById('bio-fallback-icon');
        const statusText = document.querySelector('.bio-status');
        
        try {
            bioStream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = bioStream;
            video.style.opacity = '1';
            if (fallbackIcon) fallbackIcon.style.opacity = '0';
            
            statusText.textContent = "ANALYZING FACIAL GEOMETRY...";
            
            // Simulate processing time
            setTimeout(() => {
                statusText.textContent = "BIOMETRIC MATCH FOUND";
                statusText.style.color = "var(--green)";
                
                // Capture photo from video feed
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 400;
                canvas.height = video.videoHeight || 400;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const photoDataUrl = canvas.toDataURL('image/jpeg');
                
                // Generate Mobility ID
                const generatedId = "#AX-" + Math.floor(1000 + Math.random() * 9000);
                
                // Save to session
                sessionStorage.setItem('aeroflux_user_photo', photoDataUrl);
                sessionStorage.setItem('aeroflux_user_id', generatedId);
                
                setTimeout(() => {
                    stopBiometricScan();
                    const successOverlay = document.getElementById('success-overlay');
                    const successAvatar = document.getElementById('success-avatar');
                    const successIdText = document.getElementById('success-id-text');
                    
                    if (successAvatar) {
                        successAvatar.src = photoDataUrl;
                        successAvatar.style.display = 'block';
                    }
                    if (successIdText) {
                        successIdText.textContent = "ID: " + generatedId;
                    }
                    if (successOverlay) successOverlay.classList.add('active');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2500); // Wait a bit longer to show the cool avatar
                }, 1000);
            }, 3000);
            
        } catch (err) {
            console.warn("Camera access denied or blocked. Proceeding with simulated scan.");
            statusText.textContent = "SIMULATING FACIAL SCAN...";
            
            setTimeout(() => {
                statusText.textContent = "BIOMETRIC MATCH FOUND";
                statusText.style.color = "var(--green)";
                
                // Use a fallback avatar for local testing where camera is blocked
                const fallbackPhotoDataUrl = "https://ui-avatars.com/api/?name=Guest+User&background=00F0FF&color=010204&rounded=true&size=200";
                const generatedId = "#AX-" + Math.floor(1000 + Math.random() * 9000);
                
                sessionStorage.setItem('aeroflux_user_photo', fallbackPhotoDataUrl);
                sessionStorage.setItem('aeroflux_user_id', generatedId);
                
                setTimeout(() => {
                    stopBiometricScan();
                    const successOverlay = document.getElementById('success-overlay');
                    const successAvatar = document.getElementById('success-avatar');
                    const successIdText = document.getElementById('success-id-text');
                    
                    if (successAvatar) {
                        successAvatar.src = fallbackPhotoDataUrl;
                        successAvatar.style.display = 'block';
                    }
                    if (successIdText) {
                        successIdText.textContent = "ID: " + generatedId;
                    }
                    if (successOverlay) successOverlay.classList.add('active');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2500);
                }, 1000);
            }, 3000);
        }
    }

    function stopBiometricScan() {
        if (bioStream) {
            bioStream.getTracks().forEach(track => track.stop());
            bioStream = null;
        }
        const video = document.getElementById('bio-camera');
        const fallbackIcon = document.getElementById('bio-fallback-icon');
        if (video) {
            video.srcObject = null;
            video.style.opacity = '0';
        }
        if (fallbackIcon) fallbackIcon.style.opacity = '0.8';
        
        const statusText = document.querySelector('.bio-status');
        if (statusText) {
            statusText.textContent = "VERIFYING IDENTITY...";
            statusText.style.color = "var(--cyan)";
        }
    }

    document.getElementById('link-forgot-pwd')?.addEventListener('click', () => switchPanel('panel-forgot'));
    document.getElementById('link-create-id')?.addEventListener('click', () => switchPanel('panel-register'));
    document.getElementById('link-manual-login')?.addEventListener('click', () => {
        switchPanel('panel-login');
        stopBiometricScan();
    });
    
    // Auto-start biometric scan since it's the default panel
    // Card is visible after ~1100ms (0.5s delay + 0.6s animation), so start at 1200ms
    setTimeout(() => {
        startBiometricScan();
    }, 1200);
    
    // Back buttons
    document.querySelectorAll('.back-icon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            
            // Stop camera if we are leaving biometric panel
            stopBiometricScan();
            
            // Move current active panel to the right
            document.querySelectorAll('.login-panel.active-panel').forEach(panel => {
                panel.classList.remove('active-panel');
                panel.classList.add('hidden-panel', 'right');
            });
            
            // Bring target back from left
            const target = document.getElementById(targetId);
            if (target) {
                target.classList.remove('right');
                target.classList.add('left'); // stage it on the left
                setTimeout(() => {
                    target.classList.remove('hidden-panel', 'left');
                    target.classList.add('active-panel');
                }, 50);
            }
        });
    });

    // --- 3. Password Toggle ---
    const pwdInput = document.getElementById('password');
    const pwdToggle = document.getElementById('toggle-pwd');
    if (pwdInput && pwdToggle) {
        pwdToggle.addEventListener('click', () => {
            const type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
            pwdInput.setAttribute('type', type);
            pwdToggle.textContent = type === 'password' ? '👁️' : '🚫';
        });
    }

    // --- 4. Login Authentication Flow ---
    const loginForm = document.getElementById('form-login');
    const submitBtn = document.getElementById('btn-submit-login');
    const successOverlay = document.getElementById('success-overlay');

    if (loginForm && submitBtn) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Set loading state
            submitBtn.classList.add('loading');
            submitBtn.querySelector('.btn-text').textContent = 'AUTHENTICATING...';
            
            // Simulate network request (1.5s)
            setTimeout(() => {
                submitBtn.classList.remove('loading');
                submitBtn.querySelector('.btn-text').textContent = 'ACCESS GRANTED';
                submitBtn.style.backgroundColor = 'var(--green)';
                submitBtn.style.borderColor = 'var(--green)';
                submitBtn.style.boxShadow = '0 0 20px rgba(0, 255, 128, 0.4)';
                
                // Show success overlay
                setTimeout(() => {
                    if(successOverlay) successOverlay.classList.add('active');
                    
                    // Redirect to dashboard (index.html for now)
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                }, 800);
                
            }, 1500);
        });
    }

    // --- 5. Data Counters ---
    function animateCounter(id, start, end, duration) {
        const obj = document.getElementById(id);
        if (!obj) return;
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out quad
            const easeProgress = progress * (2 - progress);
            obj.innerHTML = Math.floor(easeProgress * (end - start) + start).toLocaleString();
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end.toLocaleString();
            }
        };
        window.requestAnimationFrame(step);
    }

    // Start counters after the cinematic intro finishes (~3.5s)
    setTimeout(() => {
        animateCounter('count-hubs', 0, 1840, 1500);
        animateCounter('count-routes', 0, 38412, 1500);
    }, 3500);
});
