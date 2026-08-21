/**
 * NOMOTION — High-Precision GSAP Cinema Engine
 * 1. Lenis Smooth Scroll + GSAP ScrollTrigger Sync
 * 2. Cinematic Page-Load Intro Timelines & Reticle Locking
 * 3. 77-Frame Scroll-Scrub Video Canvas Engine with Silky End Exit
 * 4. 3D Cylindrical Rotary Wheel Navigation with Precision Hitboxes
 * 5. Infinite Interactive Card Stream with GSAP Spring Physics
 * 6. Spatial 3D Perspective Tilt System
 * 7. GSAP ScrollTrigger Staggered 3D Reveals
 * 8. Subpage Interactive Telemetry, SVG Morphing & VFX Simulators
 */

(function () {
    'use strict';

    /* ==========================================================================
       0. LENIS SMOOTH SCROLL + GSAP SCROLLTRIGGER SYNC ENGINE
       ========================================================================== */
    let lenisInstance = null;

    function initLenisAndGsap() {
        if (typeof Lenis !== 'undefined') {
            lenisInstance = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
                wheelMultiplier: 1.0,
                touchMultiplier: 1.5,
                infinite: false,
            });

            window.lenis = lenisInstance;

            // Connect Lenis to GSAP ScrollTrigger
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);

                lenisInstance.on('scroll', ScrollTrigger.update);

                gsap.ticker.add((time) => {
                    lenisInstance.raf(time * 1000);
                });

                gsap.ticker.lagSmoothing(0);
            } else {
                function raf(time) {
                    lenisInstance.raf(time);
                    requestAnimationFrame(raf);
                }
                requestAnimationFrame(raf);
            }
        } else if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
    }

    /* ==========================================================================
       1. ALWAYS-VISIBLE SMART FLOATING NAVBAR
       ========================================================================== */
    function initSmartNavbar() {
        const header = document.querySelector('.header');
        if (!header) return;

        let ticking = false;

        function updateNavbar() {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 30) {
                header.classList.add('is-compact');
            } else {
                header.classList.remove('is-compact');
            }

            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        }, { passive: true });

        updateNavbar();
    }

    /* ==========================================================================
       2. CINEMATIC PAGE-LOAD ENTRANCE TIMELINES (Autofocus & Typography Tracking)
       ========================================================================== */
    function initPageEntrance() {
        if (typeof gsap === 'undefined') return;

        const isHero = document.getElementById('videoHeroTrack');
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (isHero) {
            // Index Hero Viewfinder & Canvas Entrance Sequence
            const viewfinder = document.querySelector('.viewfinder-frame');
            const vfCorners = document.querySelectorAll('.vf-corner');
            const canvas = document.getElementById('videoCanvas');
            const streamLeft = document.getElementById('heroStreamLeft');
            const streamRight = document.getElementById('heroStreamRight');
            const watermark = document.getElementById('heroBrandWatermark');

            if (streamLeft) gsap.set(streamLeft, { opacity: 0, y: '80vh' });
            if (streamRight) gsap.set(streamRight, { opacity: 0, y: '80vh' });
            if (watermark) gsap.set(watermark, { opacity: 0, yPercent: 40 });

            if (viewfinder) {
                tl.fromTo(viewfinder,
                    { opacity: 0, scale: 1.08 },
                    { opacity: 1, scale: 1.0, duration: 1.1, ease: 'expo.out' }, 0.1
                );
            }

            if (vfCorners.length) {
                tl.fromTo(vfCorners,
                    { scale: 1.5, opacity: 0 },
                    { scale: 1.0, opacity: 1, stagger: 0.06, duration: 0.8, ease: 'back.out(1.8)' }, 0.2
                );
            }

            if (canvas) {
                tl.fromTo(canvas,
                    { scale: 0.96 },
                    { scale: 1.0, duration: 0.9, ease: 'power2.out' }, 0.15
                );
            }
        } else {
            // Subpages: Header Minimal & Hero Stagger
            const heroMinimal = document.querySelector('.hero-minimal');
            if (heroMinimal) {
                const children = heroMinimal.children;
                tl.fromTo(children,
                    { opacity: 0, y: 28 },
                    { opacity: 1, y: 0, stagger: 0.1, duration: 0.85, ease: 'power3.out' }, 0.15
                );
            }
        }
    }

    /* ==========================================================================
       3. GSAP SCROLLABLE VIDEO CANVAS HERO ENGINE (77 Frames + Synced Parallax Storyboard)
       ========================================================================== */
    function initVideoHero() {
        const track = document.getElementById('videoHeroTrack');
        const canvas = document.getElementById('videoCanvas');
        if (!track || !canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        const TOTAL_FRAMES = 77;
        const images = new Array(TOTAL_FRAMES);
        const loaded = new Array(TOTAL_FRAMES).fill(false);

        const streamLeft = document.getElementById('heroStreamLeft');
        const streamRight = document.getElementById('heroStreamRight');
        const watermark = document.getElementById('heroBrandWatermark');
        const viewfinder = document.querySelector('.viewfinder-frame');

        let targetFrame = 0;
        let currentFrame = 0;
        let lastDrawnFrame = -1;
        let cw = 0, ch = 0;

        function updateCanvasSize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = canvas.clientWidth || window.innerWidth || 1920;
            const h = canvas.clientHeight || window.innerHeight || 1080;
            cw = Math.round(w * dpr);
            ch = Math.round(h * dpr);

            if (canvas.width !== cw || canvas.height !== ch) {
                canvas.width = cw;
                canvas.height = ch;
            }
        }
        updateCanvasSize();

        function getFramePath(index) {
            const num = String(index + 1).padStart(3, '0');
            return `video_frames/frame_${num}_no_bg.png`;
        }

        function drawFrame(source) {
            if (!source) return false;

            const iw = source.naturalWidth || source.videoWidth || (source.complete && source.width ? source.width : 0);
            const ih = source.naturalHeight || source.videoHeight || (source.complete && source.height ? source.height : 0);
            if (!iw || !ih) return false;

            if (cw === 0 || ch === 0) updateCanvasSize();

            let ratio;
            if (cw < ch) {
                // Mobile Portrait
                ratio = Math.min((cw / iw) * 1.15, (ch / ih) * 0.50);
            } else {
                // Desktop Landscape
                ratio = Math.min((cw / iw) * 0.95, (ch / ih) * 0.95);
            }

            const nw = iw * ratio;
            const nh = ih * ratio;
            const nx = (cw - nw) * 0.5;
            const ny = (ch - nh) * 0.5;

            ctx.clearRect(0, 0, cw, ch);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(source, nx, ny, nw, nh);
            return true;
        }

        // Hardware-Accelerated Video Fallback
        const video = document.createElement('video');
        video.src = 'assets/hero_camera.webm';
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        let isVideoReady = false;

        video.addEventListener('loadeddata', () => {
            isVideoReady = true;
            video.currentTime = 0.001;
        });
        video.addEventListener('seeked', () => {
            if (lastDrawnFrame < 0) {
                drawFrame(video);
            }
        });
        video.load();

        // Robust Parallel Preloader for Local file:// and Web protocols
        function loadFrame(idx, onDone) {
            if (images[idx] && loaded[idx]) {
                if (onDone) onDone(images[idx]);
                return;
            }
            const img = new Image();
            img.onload = () => {
                loaded[idx] = true;
                if (onDone) onDone(img);
                if (idx === Math.round(currentFrame) || lastDrawnFrame < 0) {
                    const ok = drawFrame(img);
                    if (ok) lastDrawnFrame = idx;
                }
            };
            img.onerror = () => {
                console.warn('Frame load warning for frame:', idx);
            };
            img.src = getFramePath(idx);
            images[idx] = img;

            // In case the image was cached or loaded synchronously from disk
            if (img.complete && img.naturalWidth > 0) {
                loaded[idx] = true;
                if (onDone) onDone(img);
                if (idx === Math.round(currentFrame) || lastDrawnFrame < 0) {
                    const ok = drawFrame(img);
                    if (ok) lastDrawnFrame = idx;
                }
            }
        }

        // Immediately load and draw frame 0
        loadFrame(0, (firstImg) => {
            drawFrame(firstImg);
            lastDrawnFrame = 0;
        });

        // Preload all remaining frames in parallel
        for (let i = 1; i < TOTAL_FRAMES; i++) {
            loadFrame(i);
        }

        function getBestFrame(idx) {
            if (loaded[idx] && images[idx]) return images[idx];

            for (let offset = 1; offset <= 3; offset++) {
                if (idx - offset >= 0 && loaded[idx - offset] && images[idx - offset]) {
                    return images[idx - offset];
                }
                if (idx + offset < TOTAL_FRAMES && loaded[idx + offset] && images[idx + offset]) {
                    return images[idx + offset];
                }
            }
            if (lastDrawnFrame >= 0 && loaded[lastDrawnFrame] && images[lastDrawnFrame]) {
                return images[lastDrawnFrame];
            }
            return images[0] || (isVideoReady ? video : null);
        }

        // Frame rendering tick with Lerp
        let isLoopRunning = false;
        function renderLoop() {
            const diff = targetFrame - currentFrame;
            currentFrame += diff * 0.16;
            const roundedFrame = Math.round(currentFrame);
            const clampedFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, roundedFrame));

            if (clampedFrame !== lastDrawnFrame) {
                const img = getBestFrame(clampedFrame);
                if (img) {
                    const ok = drawFrame(img);
                    if (ok) lastDrawnFrame = clampedFrame;
                }
            }

            if (Math.abs(targetFrame - currentFrame) > 0.005) {
                requestAnimationFrame(renderLoop);
            } else {
                currentFrame = targetFrame;
                const finalImg = getBestFrame(Math.round(targetFrame));
                if (finalImg) {
                    const ok = drawFrame(finalImg);
                    if (ok) lastDrawnFrame = Math.round(targetFrame);
                }
                isLoopRunning = false;
            }
        }

        function triggerRender() {
            if (!isLoopRunning) {
                isLoopRunning = true;
                requestAnimationFrame(renderLoop);
            }
        }

        // GSAP ScrollTrigger Master Timeline for Ultra-Smooth Inertia & Long Sticky Plateaus
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            // Master Timeline with generous 1.2s scrub inertia for liquid smoothness
            const heroTL = gsap.timeline({
                scrollTrigger: {
                    trigger: track,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 1.2,
                    onUpdate: (self) => {
                        const progress = self.progress;
                        // Scrub 77 frames seamlessly across 0.0 -> 0.85
                        const scrubProgress = Math.min(progress / 0.85, 1.0);
                        targetFrame = Math.min(Math.round(scrubProgress * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1);
                        triggerRender();
                    }
                }
            });

            // 1. Watermark ("NOMOTION" floating ambiently in background):
            // Starts invisible at scroll=0, gently glides up & fades in, then floats up and out
            if (watermark) {
                gsap.set(watermark, { yPercent: 40, opacity: 0 });
                heroTL.to(watermark, { yPercent: 0, opacity: 0.08, duration: 0.16, ease: 'power1.out' }, 0.02);
                heroTL.to(watermark, { yPercent: -40, opacity: 0, duration: 0.18, ease: 'power1.in' }, 0.22);
            }

            // 2. Note 1 (Left: MODEL 100 TITAN 6K):
            // 0.04 -> 0.18: Glides up smoothly like silk from +70vh -> 0vh (opacity 0 -> 1)
            // 0.18 -> 0.44: STAYS 100% PINNED & STICKY BESIDE CAMERA (Long comfortable reading window!)
            // 0.44 -> 0.58: Glides smoothly away upwards to -70vh (opacity 1 -> 0)
            if (streamLeft) {
                gsap.set(streamLeft, { y: '70vh', opacity: 0 });
                heroTL.to(streamLeft, { y: '0vh', opacity: 1, duration: 0.14, ease: 'power2.out' }, 0.04);
                // Sticky plateau during 0.18 -> 0.44
                heroTL.to(streamLeft, { y: '-70vh', opacity: 0, duration: 0.14, ease: 'power2.in' }, 0.44);
            }

            // 3. Note 2 (Right: 1.8X ANAMORPHIC T1.5):
            // 0.48 -> 0.64: Glides up smoothly from +70vh -> 0vh (opacity 0 -> 1)
            // 0.64 -> 0.88: STAYS 100% PINNED & STICKY BESIDE CAMERA BEAUTY FRAME (Long comfortable reading window!)
            // 0.88 -> 1.00: Smoothly dissolves and departs as hero finishes
            if (streamRight) {
                gsap.set(streamRight, { y: '70vh', opacity: 0 });
                heroTL.to(streamRight, { y: '0vh', opacity: 1, duration: 0.16, ease: 'power2.out' }, 0.48);
                // Sticky plateau during 0.64 -> 0.88
                heroTL.to(streamRight, { y: '-70vh', opacity: 0, duration: 0.12, ease: 'power2.in' }, 0.88);
            }
        } else {
            function onScroll() {
                const rect = track.getBoundingClientRect();
                const trackHeight = track.offsetHeight - window.innerHeight;
                if (trackHeight <= 0) return;

                const rawProgress = Math.min(Math.max(-rect.top / trackHeight, 0), 1);
                const scrubProgress = Math.min(rawProgress / 0.85, 1.0);
                targetFrame = Math.min(Math.round(scrubProgress * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1);
                triggerRender();
            }
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        }

        window.addEventListener('resize', () => {
            updateCanvasSize();
            const img = getBestFrame(Math.round(currentFrame));
            if (img) drawFrame(img);
        }, { passive: true });
    }

    /* ==========================================================================
       4. 3D CYLINDRICAL WHEEL WITH PRECISION HITBOX ENGINE
       ========================================================================== */
    function initMenu() {
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const fullscreenMenu = document.getElementById('fullscreenMenu');
        const btnText = hamburgerBtn ? hamburgerBtn.querySelector('.menu-btn-text') : null;
        const wheelStage = document.querySelector('.wheel-stage');
        const wheelItems = Array.from(document.querySelectorAll('.wheel-item'));

        if (!hamburgerBtn || !fullscreenMenu || wheelItems.length === 0) return;

        const N = wheelItems.length;
        const stepAngle = 360 / N;

        let initialIdx = wheelItems.findIndex(item => item.querySelector('.wheel-link.active'));
        if (initialIdx === -1) initialIdx = 0;

        let currentAngle = initialIdx * stepAngle;
        let targetAngle = initialIdx * stepAngle;
        let isAnimating = false;
        let hoveredIndex = -1;

        function renderWheel() {
            currentAngle += (targetAngle - currentAngle) * 0.16;

            wheelItems.forEach((item, i) => {
                const baseAngle = i * stepAngle;
                let delta = ((baseAngle - currentAngle) % 360 + 540) % 360 - 180;

                const visibleAngle = delta * 0.38;
                const rad = visibleAngle * (Math.PI / 180);
                const cosVal = Math.cos(rad);

                const translateY = Math.sin(rad) * 250;
                const translateZ = (cosVal - 1) * 95;
                const rotateX = -visibleAngle * 0.72;
                const scale = 0.82 + 0.26 * cosVal;
                const opacity = 0.55 + 0.45 * Math.pow(Math.max(cosVal, 0), 1.8);

                const isHovered = (i === hoveredIndex) || item.classList.contains('is-hovered') || item.matches(':hover');
                const calculatedOpacity = isHovered ? 1.0 : Math.max(opacity, 0.48);
                const zIndexValue = isHovered ? 999 : Math.round((cosVal + 1) * 50);

                item.style.display = 'flex';
                item.style.zIndex = zIndexValue;
                item.style.transform = `translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`;
                item.style.opacity = calculatedOpacity.toFixed(3);

                if (Math.abs(delta) < stepAngle / 2) {
                    item.classList.add('is-centered');
                } else {
                    item.classList.remove('is-centered');
                }
            });

            if (Math.abs(targetAngle - currentAngle) > 0.04 || fullscreenMenu.classList.contains('is-open')) {
                requestAnimationFrame(renderWheel);
            } else {
                isAnimating = false;
            }
        }

        function rotateStep(direction) {
            targetAngle += direction * stepAngle;
            if (!isAnimating) {
                isAnimating = true;
                requestAnimationFrame(renderWheel);
            }
        }

        function getCenteredItem() {
            let normalizedAngle = ((targetAngle % 360) + 360) % 360;
            let closestIdx = Math.round(normalizedAngle / stepAngle) % N;
            return wheelItems[closestIdx];
        }

        document.addEventListener('keydown', (e) => {
            if (!fullscreenMenu.classList.contains('is-open')) return;

            if (e.key === 'ArrowDown' || e.key === 'Down' || e.key === 's' || e.key === 'S') {
                e.preventDefault();
                rotateStep(1);
            } else if (e.key === 'ArrowUp' || e.key === 'Up' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                rotateStep(-1);
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const centered = getCenteredItem();
                if (centered) {
                    const link = centered.querySelector('.wheel-link');
                    if (link) link.click();
                }
            } else if (e.key === 'Escape' || e.key === 'Esc') {
                toggleMenu(true);
            }
        });

        let wheelDeltaAccumulator = 0;
        let lastScrollStepTime = 0;
        let scrollResetTimer = null;

        fullscreenMenu.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const now = Date.now();
            wheelDeltaAccumulator += e.deltaY;

            clearTimeout(scrollResetTimer);
            scrollResetTimer = setTimeout(() => {
                wheelDeltaAccumulator = 0;
            }, 140);

            const SCROLL_THRESHOLD = 55;
            const STEP_COOLDOWN = 140;

            if (Math.abs(wheelDeltaAccumulator) >= SCROLL_THRESHOLD && (now - lastScrollStepTime > STEP_COOLDOWN)) {
                const dir = wheelDeltaAccumulator > 0 ? 1 : -1;
                rotateStep(dir);
                lastScrollStepTime = now;
                wheelDeltaAccumulator = 0;
            }
        }, { passive: false });

        let touchStartY = 0;
        fullscreenMenu.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        fullscreenMenu.addEventListener('touchmove', (e) => {
            const touchEndY = e.touches[0].clientY;
            const diff = touchStartY - touchEndY;
            const now = Date.now();

            if (Math.abs(diff) > 35 && (now - lastScrollStepTime > 140)) {
                rotateStep(diff > 0 ? 1 : -1);
                lastScrollStepTime = now;
                touchStartY = touchEndY;
            }
        }, { passive: true });

        fullscreenMenu.addEventListener('mousemove', (e) => {
            if (!fullscreenMenu.classList.contains('is-open')) return;

            const mx = e.clientX;
            const my = e.clientY;
            let foundIdx = -1;

            for (let i = 0; i < wheelItems.length; i++) {
                const link = wheelItems[i].querySelector('.wheel-link');
                if (!link) continue;

                const rect = link.getBoundingClientRect();
                if (mx >= rect.left - 15 && mx <= rect.right + 15 && my >= rect.top - 8 && my <= rect.bottom + 8) {
                    foundIdx = i;
                    break;
                }
            }

            if (foundIdx !== hoveredIndex) {
                hoveredIndex = foundIdx;
                wheelItems.forEach((item, i) => {
                    if (i === hoveredIndex) {
                        item.classList.add('is-hovered');
                    } else {
                        item.classList.remove('is-hovered');
                    }
                });
                if (!isAnimating) {
                    isAnimating = true;
                    requestAnimationFrame(renderWheel);
                }
            }
        }, { passive: true });

        fullscreenMenu.addEventListener('mouseleave', () => {
            if (hoveredIndex !== -1) {
                hoveredIndex = -1;
                wheelItems.forEach(item => item.classList.remove('is-hovered'));
                if (!isAnimating) {
                    isAnimating = true;
                    requestAnimationFrame(renderWheel);
                }
            }
        }, { passive: true });

        wheelItems.forEach((item) => {
            const link = item.querySelector('.wheel-link');
            if (!link) return;

            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const href = link.getAttribute('href');
                if (!href) return;
                const currentPath = window.location.pathname.split('/').pop() || 'index.html';
                if (href === currentPath || (currentPath === '' && href === 'index.html')) {
                    toggleMenu(true);
                } else {
                    toggleMenu(true);
                    window.location.href = href;
                }
            });
        });

        fullscreenMenu.addEventListener('click', (e) => {
            if (!fullscreenMenu.classList.contains('is-open')) return;
            if (e.target.closest('.wheel-link')) return;

            const mx = e.clientX;
            const my = e.clientY;

            for (let i = 0; i < wheelItems.length; i++) {
                const link = wheelItems[i].querySelector('.wheel-link');
                if (!link) continue;

                const rect = link.getBoundingClientRect();
                if (mx >= rect.left - 20 && mx <= rect.right + 20 && my >= rect.top - 12 && my <= rect.bottom + 12) {
                    const href = link.getAttribute('href');
                    if (href) {
                        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
                        if (href === currentPath || (currentPath === '' && href === 'index.html')) {
                            e.preventDefault();
                            toggleMenu(true);
                        } else {
                            toggleMenu(true);
                            window.location.href = href;
                        }
                    }
                    return;
                }
            }

            if (!e.target.closest('.wheel-stage') && !e.target.closest('.navbar')) {
                toggleMenu(true);
            }
        });

        function toggleMenu(forceClose) {
            const willOpen = forceClose === undefined
                ? !fullscreenMenu.classList.contains('is-open')
                : !forceClose;

            if (willOpen) {
                if (window.lenis) window.lenis.stop();
                fullscreenMenu.classList.add('is-open');
                fullscreenMenu.setAttribute('aria-hidden', 'false');
                hamburgerBtn.classList.add('is-active');
                hamburgerBtn.setAttribute('aria-expanded', 'true');
                document.body.classList.add('menu-open');
                if (btnText) btnText.textContent = 'CLOSE';

                targetAngle = initialIdx * stepAngle;
                currentAngle = targetAngle;
                wheelDeltaAccumulator = 0;
                hoveredIndex = -1;
                isAnimating = true;
                requestAnimationFrame(renderWheel);

                if (typeof gsap !== 'undefined') {
                    gsap.fromTo(wheelItems,
                        { scale: 0.7, opacity: 0 },
                        { scale: 1, opacity: (i) => i === initialIdx ? 1 : 0.65, stagger: 0.04, duration: 0.45, ease: 'back.out(1.4)' }
                    );
                }
            } else {
                fullscreenMenu.classList.remove('is-open');
                fullscreenMenu.setAttribute('aria-hidden', 'true');
                hamburgerBtn.classList.remove('is-active');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('menu-open');
                if (window.lenis) window.lenis.start();
                hoveredIndex = -1;
                wheelItems.forEach(item => item.classList.remove('is-hovered'));
                if (btnText) btnText.textContent = 'MENU';
            }
        }

        hamburgerBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });

        requestAnimationFrame(renderWheel);
    }

    /* ==========================================================================
       5. INFINITE INTERACTIVE CARD STREAM (No-Cutoff & Smooth Physics)
       ========================================================================== */
    function initInfiniteStream() {
        const track = document.getElementById('streamTrack');
        const viewportWrapper = document.querySelector('.stream-viewport-wrapper');
        const statusBadge = document.getElementById('streamControlBadge');
        const statusText = document.getElementById('streamStatusText');
        if (!track || !viewportWrapper) return;

        const originalCards = Array.from(track.children);
        if (originalCards.length === 0) return;

        originalCards.forEach(card => {
            const clone = card.cloneNode(true);
            clone.setAttribute('data-clone', 'true');
            track.appendChild(clone);
        });
        originalCards.forEach(card => {
            const clone2 = card.cloneNode(true);
            clone2.setAttribute('data-clone', 'true');
            track.appendChild(clone2);
        });

        let allCards = Array.from(track.children);
        let singleSetWidth = 0;

        function updateDimensions() {
            const gap = parseFloat(window.getComputedStyle(track).gap) || 28;
            let widthSum = 0;
            for (let i = 0; i < originalCards.length; i++) {
                widthSum += originalCards[i].offsetWidth + gap;
            }
            singleSetWidth = widthSum;
        }
        updateDimensions();
        window.addEventListener('resize', updateDimensions, { passive: true });

        let currentX = 0;
        const BASE_SPEED = 1.15;
        let targetSpeed = BASE_SPEED;
        let currentSpeed = BASE_SPEED;
        let flingVelocity = 0;
        let isPaused = false;
        let isHovered = false;
        let isDragging = false;
        let dragStartX = 0;
        let moveHistory = [];
        let activeCard = null;
        let isMouseDown = false;
        let startPointerX = 0;
        let startPointerY = 0;
        let hasMovedFar = false;

        function setPaused(paused, cardToFocus = null) {
            isPaused = paused;
            flingVelocity = 0;
            if (isPaused) {
                targetSpeed = 0;
                if (statusBadge) {
                    statusBadge.classList.add('is-paused');
                    if (statusText) statusText.textContent = 'STREAM // ANGEHALTEN (KLICKEN ZUM FORTSETZEN)';
                }
                allCards.forEach(c => c.classList.remove('is-popped'));
                if (cardToFocus) {
                    cardToFocus.classList.add('is-popped');
                    activeCard = cardToFocus;
                }
            } else {
                targetSpeed = isHovered ? 0.35 : BASE_SPEED;
                if (statusBadge) {
                    statusBadge.classList.remove('is-paused');
                    if (statusText) statusText.textContent = 'STREAM // ACTIVE (KLICKEN ZUM STOPPEN)';
                }
                allCards.forEach(c => c.classList.remove('is-popped'));
                activeCard = null;
            }
        }

        allCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (hasMovedFar) return;
                if (e.target.closest('.stream-card-link')) return;

                e.stopPropagation();

                if (card.classList.contains('is-popped')) {
                    setPaused(false);
                } else {
                    setPaused(true, card);
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (isPaused && activeCard && !e.target.closest('.stream-card') && !e.target.closest('#streamControlBadge')) {
                setPaused(false);
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isPaused) {
                setPaused(false);
            }
        });

        if (statusBadge) {
            statusBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                setPaused(!isPaused);
            });
        }

        viewportWrapper.addEventListener('mouseenter', () => {
            isHovered = true;
            if (!isPaused && Math.abs(flingVelocity) < 0.5) {
                targetSpeed = 0.35;
            }
        });

        viewportWrapper.addEventListener('mouseleave', () => {
            isHovered = false;
            if (!isPaused && Math.abs(flingVelocity) < 0.5) {
                targetSpeed = BASE_SPEED;
            }
        });

        viewportWrapper.addEventListener('mousedown', (e) => {
            if (e.target.closest('.stream-card-link')) return;
            isMouseDown = true;
            hasMovedFar = false;
            startPointerX = e.clientX;
            startPointerY = e.clientY;
            dragStartX = currentX;
            flingVelocity = 0;
            moveHistory = [{ x: e.clientX, time: performance.now() }];
        });

        window.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            const deltaX = e.clientX - startPointerX;
            const deltaY = e.clientY - startPointerY;

            if (!hasMovedFar && Math.hypot(deltaX, deltaY) > 8) {
                hasMovedFar = true;
                isDragging = true;
                viewportWrapper.style.cursor = 'grabbing';
            }

            if (isDragging) {
                currentX = dragStartX + deltaX;
                moveHistory.push({ x: e.clientX, time: performance.now() });
                if (moveHistory.length > 8) moveHistory.shift();
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (!isMouseDown) return;
            isMouseDown = false;
            viewportWrapper.style.cursor = '';

            if (isDragging) {
                isDragging = false;
                const now = performance.now();
                const recentMoves = moveHistory.filter(m => now - m.time < 140);
                if (recentMoves.length >= 2) {
                    const first = recentMoves[0];
                    const last = recentMoves[recentMoves.length - 1];
                    const timeDiff = last.time - first.time;
                    if (timeDiff > 10) {
                        const vx = (last.x - first.x) / timeDiff;
                        const frameVelocity = -vx * 16.667;
                        if (Math.abs(frameVelocity) > 0.8) {
                            flingVelocity = Math.max(Math.min(frameVelocity, 40), -40);
                            if (isPaused) {
                                setPaused(false);
                            }
                        }
                    }
                }
                setTimeout(() => {
                    hasMovedFar = false;
                }, 80);
            }
        });

        viewportWrapper.addEventListener('touchstart', (e) => {
            if (e.target.closest('.stream-card-link')) return;
            if (e.touches.length !== 1) return;
            isMouseDown = true;
            hasMovedFar = false;
            startPointerX = e.touches[0].clientX;
            startPointerY = e.touches[0].clientY;
            dragStartX = currentX;
            flingVelocity = 0;
            moveHistory = [{ x: e.touches[0].clientX, time: performance.now() }];
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!isMouseDown || e.touches.length !== 1) return;
            const deltaX = e.touches[0].clientX - startPointerX;
            const deltaY = e.touches[0].clientY - startPointerY;

            if (!hasMovedFar && Math.abs(deltaX) > 8) {
                hasMovedFar = true;
                isDragging = true;
            }

            if (isDragging) {
                currentX = dragStartX + deltaX;
                moveHistory.push({ x: e.touches[0].clientX, time: performance.now() });
                if (moveHistory.length > 8) moveHistory.shift();
            }
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            if (!isMouseDown) return;
            isMouseDown = false;

            if (isDragging) {
                isDragging = false;
                const now = performance.now();
                const recentMoves = moveHistory.filter(m => now - m.time < 140);
                if (recentMoves.length >= 2) {
                    const first = recentMoves[0];
                    const last = recentMoves[recentMoves.length - 1];
                    const timeDiff = last.time - first.time;
                    if (timeDiff > 10) {
                        const vx = (last.x - first.x) / timeDiff;
                        const frameVelocity = -vx * 16.667;
                        if (Math.abs(frameVelocity) > 0.8) {
                            flingVelocity = Math.max(Math.min(frameVelocity, 40), -40);
                            if (isPaused) {
                                setPaused(false);
                            }
                        }
                    }
                }
                setTimeout(() => {
                    hasMovedFar = false;
                }, 80);
            }
        });

        let lastTime = performance.now();
        function loop(now) {
            const dt = Math.min((now - lastTime) / 16.667, 2.0);
            lastTime = now;

            if (isDragging) {
                // Direct drag position
            } else if (Math.abs(flingVelocity) > 0.08) {
                currentSpeed = flingVelocity;
                currentX -= currentSpeed * dt;
                flingVelocity *= Math.pow(0.962, dt);

                if (Math.abs(flingVelocity) <= 0.08) {
                    flingVelocity = 0;
                    currentSpeed = BASE_SPEED;
                }
            } else {
                currentSpeed += (targetSpeed - currentSpeed) * (0.08 * dt);
                currentX -= currentSpeed * dt;
            }

            if (singleSetWidth > 0) {
                while (currentX <= -singleSetWidth) {
                    currentX += singleSetWidth;
                    if (isDragging) dragStartX += singleSetWidth;
                }
                while (currentX > 0) {
                    currentX -= singleSetWidth;
                    if (isDragging) dragStartX -= singleSetWidth;
                }
            }

            track.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0)`;
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    }



    /* ==========================================================================
       7. SPATIAL 3D PERSPECTIVE TILT SYSTEM
       ========================================================================== */
    function initSpatialTilt() {
        if (typeof gsap === 'undefined') return;

        const tiltTargets = document.querySelectorAll(`
            .tilt-card,
            .blueprint-card,
            .tech-tower-card,
            .swiss-exhibition-stage,
            .cad-blueprint-stage,
            .mtf-interactive-panel,
            .footage-hero-theater
        `);

        tiltTargets.forEach(card => {
            const rxTo = gsap.quickTo(card, "rotateX", { duration: 0.45, ease: "power2.out" });
            const ryTo = gsap.quickTo(card, "rotateY", { duration: 0.45, ease: "power2.out" });

            card.style.transformPerspective = '1000px';

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const maxAngle = card.classList.contains('swiss-exhibition-stage') ? 2.5 : 4.0;
                const rx = ((y - centerY) / centerY) * -maxAngle;
                const ry = ((x - centerX) / centerX) * maxAngle;

                rxTo(rx);
                ryTo(ry);
            });

            card.addEventListener('mouseleave', () => {
                rxTo(0);
                ryTo(0);
            });
        });
    }

    /* ==========================================================================
       8. GSAP SCROLLTRIGGER STAGGERED REVEALS
       ========================================================================== */
    function initScrollReveal() {
        const revealEls = document.querySelectorAll('.reveal');
        if (!revealEls.length) return;

        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.batch('.reveal', {
                start: 'top 88%',
                once: true,
                onEnter: (batch) => {
                    batch.forEach((el, index) => {
                        el.classList.add('is-visible');

                        // Trigger corner notches and glow triggers
                        el.querySelectorAll('.swiss-stage-corner-notch').forEach(n => n.classList.add('notch-blink'));
                        el.querySelectorAll('td[style*="font-weight: 800"]').forEach(td => td.classList.add('reveal-glow'));
                    });
                }
            });

            const footers = document.querySelectorAll('.footer');
            footers.forEach(f => f.classList.add('is-visible'));
        } else {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        entry.target.querySelectorAll('.swiss-stage-corner-notch').forEach(n => n.classList.add('notch-blink'));
                        entry.target.querySelectorAll('td[style*="font-weight: 800"]').forEach(td => td.classList.add('reveal-glow'));
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

            revealEls.forEach(el => observer.observe(el));
        }
    }

    /* ==========================================================================
       9. FOOTAGE PAGE — Live Timecode Counter
       ========================================================================== */
    function initLiveTimecode() {
        const timecodeEl = document.querySelector('.hud-timecode-live');
        if (!timecodeEl) return;

        let frames = 0;
        const fps = 24;

        function formatTimecode(totalFrames) {
            const f = totalFrames % fps;
            const totalSeconds = Math.floor(totalFrames / fps);
            const s = totalSeconds % 60;
            const totalMinutes = Math.floor(totalSeconds / 60);
            const m = totalMinutes % 60;
            const h = Math.floor(totalMinutes / 60);
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
        }

        frames = 1 * 60 * 60 * fps + 24 * 60 * fps + 18 * fps + 14;

        setInterval(() => {
            frames++;
            timecodeEl.textContent = `[ TIMECODE ${formatTimecode(frames)} ]`;
        }, 1000 / fps);
    }

    /* ==========================================================================
       10. MTF CURVE DRAW-ON & MORPH (Specs page)
       ========================================================================== */
    function initMtfDrawOn() {
        const mtfSag = document.getElementById('mtfPathSagittal');
        const mtfTan = document.getElementById('mtfPathTangential');
        if (!mtfSag || !mtfTan) return;

        mtfSag.classList.add('mtf-draw-on');
        mtfTan.classList.add('mtf-draw-on');

        const mtfPanel = document.querySelector('.mtf-interactive-panel');
        if (!mtfPanel) return;

        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({
                trigger: mtfPanel,
                start: 'top 80%',
                once: true,
                onEnter: () => {
                    setTimeout(() => mtfSag.classList.add('is-drawn'), 200);
                    setTimeout(() => mtfTan.classList.add('is-drawn'), 500);
                }
            });
        }
    }

    /* ==========================================================================
       11. CONFIG CHIP RIPPLE EFFECT
       ========================================================================== */
    function initChipRipple() {
        const chips = document.querySelectorAll('.config-chip-btn');
        if (!chips.length) return;

        chips.forEach(chip => {
            chip.addEventListener('click', function (e) {
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                this.appendChild(ripple);
                ripple.addEventListener('animationend', () => ripple.remove());
            });
        });
    }

    /* ==========================================================================
       12. CONTACT WEIGHT COUNTER SPIN (GSAP Number Tween)
       ========================================================================== */
    function initWeightCounter() {
        const weightDisplay = document.getElementById('totalWeightDisplay');
        if (!weightDisplay) return;

        const lensGroup = document.getElementById('lensGroup');
        if (!lensGroup) return;

        lensGroup.querySelectorAll('.config-chip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetWeight = parseFloat(btn.getAttribute('data-weight'));
                if (isNaN(targetWeight)) return;

                const currentText = weightDisplay.textContent;
                const currentWeight = parseFloat(currentText) || 0;

                if (typeof gsap !== 'undefined') {
                    const counterObj = { val: currentWeight };
                    weightDisplay.classList.add('counting');

                    gsap.to(counterObj, {
                        val: targetWeight,
                        duration: 0.45,
                        ease: 'power2.out',
                        onUpdate: () => {
                            weightDisplay.textContent = counterObj.val.toFixed(2) + ' KG';
                        },
                        onComplete: () => {
                            weightDisplay.textContent = targetWeight.toFixed(2) + ' KG';
                            weightDisplay.classList.remove('counting');
                        }
                    });
                } else {
                    weightDisplay.textContent = targetWeight.toFixed(2) + ' KG';
                }
            });
        });
    }

    /* ==========================================================================
       13. CLOCK TICK PULSE
       ========================================================================== */
    function initClockPulse() {
        const clockEl = document.getElementById('liveCetClock');
        if (!clockEl) return;

        clockEl.classList.add('clock-tick');

        setInterval(() => {
            clockEl.classList.add('tick');
            setTimeout(() => clockEl.classList.remove('tick'), 150);
        }, 1000);
    }

    /* ==========================================================================
       14. CAMERAS 360° AUTO-ROTATE INTRO
       ========================================================================== */
    function initAutoRotateIntro() {
        const thumbButtons = document.querySelectorAll('.angle-thumb-btn');
        if (thumbButtons.length < 2) return;

        let introIndex = 0;
        const totalAngles = thumbButtons.length;
        const introInterval = setInterval(() => {
            introIndex++;
            if (introIndex >= totalAngles) {
                clearInterval(introInterval);
                thumbButtons[0].click();
                return;
            }
            thumbButtons[introIndex].click();
        }, 280);
    }

    /* ==========================================================================
       15. HUD TYPEWRITER EFFECT
       ========================================================================== */
    function initHudTypewriter() {
        const hudTags = document.querySelectorAll('.hud-typewrite');
        if (!hudTags.length) return;

        hudTags.forEach(tag => {
            const fullText = tag.textContent;
            tag.textContent = '';
            tag.style.visibility = 'visible';

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        let i = 0;
                        const typeInterval = setInterval(() => {
                            tag.textContent = fullText.substring(0, i + 1);
                            i++;
                            if (i >= fullText.length) clearInterval(typeInterval);
                        }, 30);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            observer.observe(tag);
        });
    }

    /* ==========================================================================
       16. FOOTER TELEMETRY CLOCK
       ========================================================================== */
    function initFooterClock() {
        const clockEls = document.querySelectorAll('#footerLiveClock');
        if (!clockEls.length) return;

        function update() {
            try {
                const now = new Date();
                const timeString = now.toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich' }) + ' CET';
                clockEls.forEach(el => {
                    el.textContent = timeString;
                });
            } catch (e) {
                const now = new Date();
                const timeString = String(now.getHours()).padStart(2, '0') + ':' +
                                   String(now.getMinutes()).padStart(2, '0') + ':' +
                                   String(now.getSeconds()).padStart(2, '0') + ' CET';
                clockEls.forEach(el => {
                    el.textContent = timeString;
                });
            }
        }

        setInterval(update, 1000);
        update();
    }

    /* ==========================================================================
       17. FOOTER BACK TO TOP SMOOTH SCROLL
       ========================================================================== */
    function initBackToTop() {
        const btn = document.getElementById('footerBackToTop');
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.lenis && typeof window.lenis.scrollTo === 'function') {
                window.lenis.scrollTo(0, { duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    /* ==========================================================================
       18. FOOTER LEGAL MODALS SYSTEM (Impressum & Datenschutz)
       ========================================================================== */
    function initFooterModals() {
        const modalButtons = document.querySelectorAll('[data-modal-target]');
        const closeButtons = document.querySelectorAll('[data-modal-close]');
        const backdrops = document.querySelectorAll('.footer-modal-backdrop');

        function openModal(modalId) {
            const targetModal = document.getElementById(modalId);
            if (!targetModal) return;

            targetModal.classList.add('is-open');
            targetModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            if (window.lenis) window.lenis.stop();

            const closeBtn = targetModal.querySelector('.modal-close-btn');
            if (closeBtn) closeBtn.focus();
        }

        function closeModal(modal) {
            if (!modal) return;
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            
            const anyOpen = document.querySelector('.footer-modal-backdrop.is-open');
            if (!anyOpen) {
                document.body.style.overflow = '';
                if (window.lenis) window.lenis.start();
            }
        }

        modalButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-modal-target');
                if (targetId) openModal(targetId);
            });
        });

        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = btn.closest('.footer-modal-backdrop');
                if (modal) closeModal(modal);
            });
        });

        backdrops.forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    closeModal(backdrop);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.footer-modal-backdrop.is-open');
                openModals.forEach(modal => closeModal(modal));
            }
        });
    }

    /* ==========================================================================
       19. FOOTER WHITEPAPER DISPATCH FORM
       ========================================================================== */
    function initFooterDispatch() {
        const forms = document.querySelectorAll('.footer-dispatch-form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = form.querySelector('.dispatch-input');
                const feedback = form.querySelector('.dispatch-feedback');
                const btn = form.querySelector('.dispatch-btn');
                if (!input || !feedback) return;

                const val = input.value.trim();
                if (!val || !val.includes('@')) {
                    feedback.className = 'dispatch-feedback error';
                    feedback.textContent = '✕ Bitte eine gültige E-Mail angeben.';
                    return;
                }

                feedback.className = 'dispatch-feedback success';
                feedback.textContent = '✓ Whitepaper & MTF-Paket übermittelt!';
                input.value = '';
                input.disabled = true;
                if (btn) btn.disabled = true;

                setTimeout(() => {
                    feedback.textContent = '';
                    input.disabled = false;
                    if (btn) btn.disabled = false;
                }, 5000);
            });
        });
    }

    // Clean up any stale theme attributes
    try {
        localStorage.removeItem('nomotion_theme');
        document.documentElement.removeAttribute('data-theme');
    } catch (e) { }

    function initAll() {
        const modules = [
            { name: 'initLenisAndGsap', fn: initLenisAndGsap },
            { name: 'initSmartNavbar', fn: initSmartNavbar },
            { name: 'initPageEntrance', fn: initPageEntrance },
            { name: 'initVideoHero', fn: initVideoHero },
            { name: 'initMenu', fn: initMenu },
            { name: 'initInfiniteStream', fn: initInfiniteStream },
            { name: 'initSpatialTilt', fn: initSpatialTilt },
            { name: 'initScrollReveal', fn: initScrollReveal },
            { name: 'initLiveTimecode', fn: initLiveTimecode },
            { name: 'initMtfDrawOn', fn: initMtfDrawOn },
            { name: 'initChipRipple', fn: initChipRipple },
            { name: 'initWeightCounter', fn: initWeightCounter },
            { name: 'initClockPulse', fn: initClockPulse },
            { name: 'initAutoRotateIntro', fn: initAutoRotateIntro },
            { name: 'initHudTypewriter', fn: initHudTypewriter },
            { name: 'initFooterClock', fn: initFooterClock },
            { name: 'initBackToTop', fn: initBackToTop },
            { name: 'initFooterModals', fn: initFooterModals },
            { name: 'initFooterDispatch', fn: initFooterDispatch }
        ];

        modules.forEach(mod => {
            try {
                if (typeof mod.fn === 'function') mod.fn();
            } catch (err) {
                console.error('[NoMotion Error] in module ' + mod.name + ':', err);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();
