(function () {
    document.getElementById('year').textContent = new Date().getFullYear();

    const PI2 = Math.PI * 2;

    let canvas, ctx, width, height, particles = [];
    let scrollSpeed = 0;
    let targetScrollSpeed = 0;
    let lastScrollY = window.scrollY;

    let lastTime = 0;
    let deltaTime = 0;

    let activeMagnet = null;

    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || "143, 185, 150";

    // Dynamic Scroll Handling
    const navLinks = document.querySelectorAll(".header-inner .nav a, .header-inner .brand");

    // Email Handling
    const emailPill = document.querySelector(".email-pill");
    if (emailPill) {
        emailPill.addEventListener("click", (e) => {
            e.preventDefault();
            const recipient = "kharnyx3@gmail.com";
            const subject = "Inquiry regarding Unity Assets";
            window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}`;
        });
    }

    // Search Functionality
    const searchInput = document.getElementById('asset-search');
    const resultsCount = document.getElementById('results-count');
    const noResultsMsg = document.getElementById('no-results');
    const cards = document.querySelectorAll('.model-card');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            let visibleCount = 0;

            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();

                if (title.includes(query) || description.includes(query)) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';

            if (query === "") {
                resultsCount.textContent = "Showing all assets";
            } else {
                resultsCount.textContent = `Found ${visibleCount} matching asset${visibleCount !== 1 ? 's' : ''}`;
            }
        });
    }

    // Mouse-tracking parallax effect
    let ticking = false;
    document.addEventListener('mousemove', (e) => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const x = (e.clientX / window.innerWidth - 0.5) * 15;
                const y = (e.clientY / window.innerHeight - 0.5) * 15;

                document.documentElement.style.setProperty('--px', `${x}px`);
                document.documentElement.style.setProperty('--py', `${y}px`);
                ticking = false;
            });
            ticking = true;
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            handleAnchorNavigation(link, e);
        });
    });

    function handleAnchorNavigation(link, event = null) {
        const targetId = link.getAttribute('href');

        if (targetId && targetId.startsWith('#')) {
            if (event) {
                event.preventDefault();
            }

            const targetElement = document.querySelector(targetId);
            const header = document.querySelector('.header');

            if (targetElement && header) {
                const headerHeight = header.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;

                window.scrollTo({
                    top: elementPosition - headerHeight - 34,
                    behavior: 'smooth'
                });

                if (event) {
                    history.pushState(null, null, targetId);
                }
            }
        }
    }

    window.addEventListener('load', () => {
        const hash = window.location.hash;
        if (hash) {
            const matchingLink = document.querySelector(`a[href="${hash}"]`);
            if (matchingLink) {
                handleAnchorNavigation(matchingLink);
            }
        }
    });

    const modelCards = document.querySelectorAll(".model-card");

    modelCards.forEach(card => {
        const slider = card.querySelector(".preview-slider");
        if (!slider) return;

        const images = slider.querySelectorAll("img");
        if (images.length <= 1) return;

        let currentIndex = 0;

        const nav = document.createElement("div");
        nav.classList.add("preview-nav");

        const prevBtn = document.createElement("button");
        prevBtn.className = "nav-arrow";
        prevBtn.innerHTML = "←";

        const nextBtn = document.createElement("button");
        nextBtn.className = "nav-arrow";
        nextBtn.innerHTML = "→";

        const dotsContainer = document.createElement("div");
        dotsContainer.classList.add("dots-navigation");

        images.forEach((_, idx) => {
            const dot = document.createElement("button");
            dot.className = `dot ${idx === 0 ? 'active' : ''}`;
            dot.addEventListener("click", (e) => {
                e.preventDefault();
                updateSlider(idx);
            });
            dotsContainer.appendChild(dot);
        });

        const updateSlider = (newIndex) => {
            if (newIndex < 0) newIndex = images.length - 1;
            if (newIndex >= images.length) newIndex = 0;

            currentIndex = newIndex;

            images.forEach((img, idx) => {
                img.classList.toggle("active", idx === currentIndex);
            });

            dotsContainer.querySelectorAll(".dot").forEach((dot, idx) => {
                dot.classList.toggle("active", idx === currentIndex);
            });
        };

        prevBtn.addEventListener("click", (e) => {
            e.preventDefault();
            updateSlider(currentIndex - 1);
        });

        nextBtn.addEventListener("click", (e) => {
            e.preventDefault();
            updateSlider(currentIndex + 1);
        });

        nav.appendChild(prevBtn);
        nav.appendChild(nextBtn);

        const preview = card.querySelector(".preview");
        preview.appendChild(nav);
        preview.appendChild(dotsContainer);
    });

    // Initialize canvas settings and event listeners
    function init() {
        canvas = document.getElementById('bg-particles');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < 120; i++) particles.push(new Particle());

        setupMagnetListeners();

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            targetScrollSpeed = (currentScrollY - lastScrollY) * 0.5;
            lastScrollY = currentScrollY;

            if (activeMagnet) {
                const hoveredBtn = document.querySelector('.open-asset-store:hover');
                if (hoveredBtn) {
                    const rect = hoveredBtn.getBoundingClientRect();
                    activeMagnet = {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                        width: rect.width,
                        height: rect.height
                    };
                }
            }
        });

        lastTime = performance.now();
        animate(lastTime);
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.reset();
            this.y = Math.random() * height;
            this.displayOpacity = this.opacity;
            this.vx = 0;
            this.vy = 0;
        }

        reset() {
            this.x = Math.random() * width;
            this.y = -50;
            this.vx = 0;
            this.vy = 0;
            this.lastDx = 0;
            this.lastDy = 0;
            this.direction = (Math.random() * 10 + 58) * (Math.PI / 180);
            this.size = Math.random() * 1.2 + 0.5;
            this.displaySize = this.size;
            this.baseSpeed = Math.random() * 5 + 10;
            this.opacity = Math.random() * 0.15 + 0.15;
            this.displayOpacity = this.opacity;
            this.targetRadius = Math.random() * 20 + 10;
            this.isExploding = false;
            this.isNearMagnet = false;
        }

        spawnAround(targetX, targetY) {
            const spawnRadius = Math.random() * 120 + 30;
            const angle = Math.random() * Math.PI * 2;
            this.x = targetX + Math.cos(angle) * spawnRadius;
            this.y = targetY + Math.sin(angle) * spawnRadius;
            this.displayOpacity = 0.3;
            this.isExploding = false;
            this.vx = 0;
            this.vy = 0;
        }

        update() {
            scrollSpeed += (targetScrollSpeed - scrollSpeed) * 0.1;
            this.isNearMagnet = false;

            if (activeMagnet) {
                const offset = this.targetRadius;
                const halfW = (activeMagnet.width / 2) + offset;
                const halfH = (activeMagnet.height / 2) + offset;
                const cornerRadius = 24;

                const posX = this.x - activeMagnet.x;
                const posY = this.y - activeMagnet.y;

                const clampX = Math.max(-halfW + cornerRadius, Math.min(posX, halfW - cornerRadius));
                const clampY = Math.max(-halfH + cornerRadius, Math.min(posY, halfH - cornerRadius));

                let dx = posX - clampX;
                let dy = posY - clampY;
                let mag = Math.sqrt(dx * dx + dy * dy);

                if (mag === 0) {
                    const distToLeft = posX - (-halfW);
                    const distToRight = halfW - posX;
                    const distToTop = posY - (-halfH);
                    const distToBottom = halfH - posY;
                    const minDst = Math.min(distToLeft, distToRight, distToTop, distToBottom);

                    if (minDst === distToLeft) { dx = -1; dy = 0; }
                    else if (minDst === distToRight) { dx = 1; dy = 0; }
                    else if (minDst === distToTop) { dx = 0; dy = -1; }
                    else { dx = 0; dy = 1; }
                    mag = 1;
                }

                const distToEdge = mag - cornerRadius + 5;

                if (distToEdge < 160) {
                    this.isNearMagnet = true;
                    this.isExploding = false;
                    this.lastDx = dx;
                    this.lastDy = dy;

                    const attractionForce = 2.5;
                    const pullDirection = distToEdge < 0 ? 1 : -1;
                    this.x += (dx / mag) * Math.min(Math.abs(distToEdge), 40) * attractionForce * deltaTime * pullDirection;
                    this.y += (dy / mag) * Math.min(Math.abs(distToEdge), 40) * attractionForce * deltaTime * pullDirection;

                    const orbitSpeed = (this.baseSpeed * 15) * deltaTime;
                    const margin = 5;

                    if (posY <= -halfH + margin && posX < halfW - cornerRadius) {
                        this.x += orbitSpeed;
                    } else if (posX >= halfW - margin && posY < halfH - cornerRadius) {
                        this.y += orbitSpeed;
                    } else if (posY >= halfH - margin && posX > -halfW + cornerRadius) {
                        this.x -= orbitSpeed;
                    } else if (posX <= -halfW + margin && posY > -halfH + cornerRadius) {
                        this.y -= orbitSpeed;
                    } else {
                        this.x += (posY > 0 ? -orbitSpeed : orbitSpeed);
                        this.y += (posX > 0 ? orbitSpeed : -orbitSpeed);
                    }

                    const proximityGlow = Math.max(0, 1 - Math.abs(distToEdge) / 15);
                    this.displaySize = this.size * (1.0 + proximityGlow * 1.5);
                    this.displayOpacity = Math.min(this.opacity + 0.3 + proximityGlow, 0.85);

                    this.vx = 0;
                    this.vy = 0;
                } else {
                    this.standardMove();
                }
            } else if (this.isExploding) {
                if (this.vx === 0 && this.vy === 0) {
                    let angle = (typeof this.lastDx === 'number' && typeof this.lastDy === 'number' && (this.lastDx !== 0 || this.lastDy !== 0))
                        ? Math.atan2(this.lastDy, this.lastDx)
                        : Math.random() * Math.PI * 2;

                    const finalAngle = angle + (Math.random() - 0.5) * 0.8;
                    const speed = (Math.random() * 250 + 100);

                    this.vx = Math.cos(finalAngle) * speed;
                    this.vy = Math.sin(finalAngle) * speed;
                    this.shouldReset = Math.random() > 0.4;
                }

                this.x += this.vx * deltaTime;
                this.vy += 800 * deltaTime;
                this.y += this.vy * deltaTime;

                const friction = Math.pow(0.95, deltaTime * 60);
                this.vx *= friction;
                this.vy *= friction;
                this.displayOpacity *= Math.pow(0.92, deltaTime * 60);

                if (this.displayOpacity < 0.02) {
                    this.isExploding = false;
                    if (this.shouldReset) {
                        this.reset();
                    } else {
                        this.vx = 0;
                        this.vy = 0;
                    }
                }
            } else {
                this.standardMove();
            }

            if (this.y > height + 100) this.reset();
        }

        standardMove() {
            this.x += (Math.cos(this.direction) * this.baseSpeed) * deltaTime;
            this.y += (Math.sin(this.direction) * this.baseSpeed + Math.abs(scrollSpeed * 0.2)) * deltaTime;
            this.displaySize += (this.size - this.displaySize) * 0.01 * deltaTime;
            this.displayOpacity += (this.opacity - this.displayOpacity) * 0.01 * deltaTime;
            this.stretch = Math.min(Math.abs(scrollSpeed) * (1 - this.displayOpacity) * 0.25, 25);
        }

        draw(accentColor) {
            const alpha = Math.max(0, Math.min(1, this.displayOpacity));

            if (this.isNearMagnet) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';

                const glowAlpha = Math.max(0, Math.min(1, alpha * 0.4));
                const coreAlpha = Math.max(0, Math.min(1, alpha * 1.8));

                const mag = Math.sqrt(this.lastDx * this.lastDx + this.lastDy * this.lastDy) || 1;
                const dirX = this.lastDx / mag;
                const dirY = this.lastDy / mag;

                ctx.beginPath();
                ctx.strokeStyle = `rgba(${accentColor}, ${glowAlpha})`;
                ctx.lineWidth = this.displaySize * 3;
                ctx.lineCap = 'round';
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - dirX, this.y - dirY);
                ctx.stroke();

                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${coreAlpha})`;
                ctx.lineWidth = this.displaySize * 0.9;
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - dirX, this.y - dirY);
                ctx.stroke();

                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${accentColor}, ${alpha})`;
                ctx.lineWidth = this.displaySize;
                ctx.lineCap = 'round';
                ctx.moveTo(this.x, this.y);
                const s = this.isExploding ? 1 : 2 + this.stretch;
                ctx.lineTo(this.x, this.y + s);
                ctx.stroke();
            }
        }
    }

    function setupMagnetListeners() {
        const pulseButtons = document.querySelectorAll('.open-asset-store');

        pulseButtons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                const rect = btn.getBoundingClientRect();
                activeMagnet = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    width: rect.width,
                    height: rect.height
                };

                let count = 0;
                for (let p of particles) {
                    if (!p.isNearMagnet && count < 45) {
                        p.spawnAround(activeMagnet.x, activeMagnet.y);
                        count++;
                    }
                }
            });

            btn.addEventListener('mouseleave', () => {
                activeMagnet = null;
                for (let p of particles) {
                    if (p.isNearMagnet) {
                        p.isExploding = true;
                        p.isNearMagnet = false;
                    }
                }
            });
        });
    }

    function drawGodRays() {
        const time = Date.now() * 0.0005;
        const rays = [
            { x: width * 0.75, w: 90, op: 0.03 },
            { x: width * 0.90, w: 140, op: 0.06 },
            { x: width * 1.10, w: 110, op: 0.05 }
        ];

        rays.forEach((ray, i) => {
            const pulse = Math.sin(time + i) * 0.02 * deltaTime;
            const grad = ctx.createLinearGradient(ray.x, 0, ray.x - 500, height);

            grad.addColorStop(0, `rgba(255, 255, 255, ${ray.op + pulse})`);
            grad.addColorStop(0.2, `rgba(255, 255, 255, ${(ray.op + pulse) * 0.25})`);
            grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(ray.x, 0);
            ctx.lineTo(ray.x + ray.w, 0);
            ctx.lineTo(ray.x + ray.w - 800, height);
            ctx.lineTo(ray.x - 800, height);
            ctx.fill();
        });
    }

    function animate(timestamp) {
        if (!timestamp) {
            requestAnimationFrame(animate);
            return;
        }

        let delta = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        deltaTime = isNaN(delta) ? 0 : Math.min(delta, 0.1);

        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, width, height);

        targetScrollSpeed *= 0.9;

        drawGodRays();

        particles.forEach(p => {
            p.update();
            p.draw(accentColor);
        });

        requestAnimationFrame(animate);
    }

    window.onload = init;
})();