// ============================================
// PORTFOLIO - MAIN JAVASCRIPT
// Personalized for Omm Prakash Padhiary
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // ---------- LOADER ----------
    const loader = document.getElementById('loader');
    
    window.addEventListener('load', () => {
        // Professional fix: Remove the artificial timeout. 
        // Hide instantly once the browser is actually done loading.
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500); // Clean up DOM
        }
        document.body.style.overflow = 'auto';
        initAnimations();
    });

    // ---------- THEME TOGGLE ----------
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';

    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // ---------- BLUEPRINT SHADER GRID (WEBGL) ----------
    const shaderCanvas = document.getElementById('blueprintShaderGrid');
    if (shaderCanvas) {
        const gl = shaderCanvas.getContext('webgl');
        if (gl) {
            const vertexShaderSource = `
                attribute vec2 position;
                void main() {
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            `;
            const fragmentShaderSource = `
                precision mediump float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec3 u_color;
                uniform vec3 u_glow;

                void main() {
                    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                    vec2 pos = gl_FragCoord.xy;
                    
                    float gridAlpha = 0.0;
                    float size = 40.0; 
                    
                    vec2 offset = vec2(u_time * 15.0, u_time * 15.0);
                    vec2 gridPos = mod(pos + offset, size);
                    
                    if (gridPos.x < 1.0 || gridPos.y < 1.0) {
                        gridAlpha = 0.15; 
                    }
                    
                    vec2 majorGridPos = mod(pos + offset, size * 5.0);
                    if (majorGridPos.x < 1.5 || majorGridPos.y < 1.5) {
                        gridAlpha = 0.4;
                    }

                    float scanner = sin(uv.y * 10.0 - u_time * 2.0) * 0.5 + 0.5;
                    scanner = pow(scanner, 10.0) * 0.5;

                    gridAlpha = min(1.0, gridAlpha + (scanner * 0.8 * step(0.1, gridAlpha)));

                    vec3 finalColor = mix(u_color, u_glow, scanner * step(0.1, gridAlpha));
                    
                    float dist = distance(uv, vec2(0.5, 0.5));
                    float mask = smoothstep(0.9, 0.1, dist);

                    gl_FragColor = vec4(finalColor, gridAlpha * mask);
                }
            `;

            function compileShader(gl, source, type) {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                return shader;
            }

            const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
            const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);

            const positionLocation = gl.getAttribLocation(program, "position");
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
                -1.0,  1.0,  1.0, -1.0,  1.0,  1.0
            ]), gl.STATIC_DRAW);

            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
            const timeLocation = gl.getUniformLocation(program, "u_time");
            const colorLocation = gl.getUniformLocation(program, "u_color");
            const glowLocation = gl.getUniformLocation(program, "u_glow");

            let startTime = Date.now();

            function resizeCanvas() {
                shaderCanvas.width = window.innerWidth;
                shaderCanvas.height = window.innerHeight;
                gl.viewport(0, 0, shaderCanvas.width, shaderCanvas.height);
            }
            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();

            function renderShader() {
                // Professional fix: Respect accessibility preferences
                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                
                if (document.hidden || prefersReducedMotion) {
                    if (!prefersReducedMotion) {
                        requestAnimationFrame(renderShader);
                    }
                    return;
                }

                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                
                if (isDark) {
                    gl.uniform3f(colorLocation, 124/255, 115/255, 255/255); 
                    gl.uniform3f(glowLocation, 94/255, 221/255, 212/255);  
                } else {
                    gl.uniform3f(colorLocation, 108/255, 99/255, 255/255);
                    gl.uniform3f(glowLocation, 78/255, 205/255, 196/255);
                }

                gl.uniform2f(resolutionLocation, shaderCanvas.width, shaderCanvas.height);
                gl.uniform1f(timeLocation, (Date.now() - startTime) / 1000);

                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.clearColor(0, 0, 0, 0); 
                gl.clear(gl.COLOR_BUFFER_BIT);

                gl.drawArrays(gl.TRIANGLES, 0, 6);

                if (window.innerWidth < 768) {
                    setTimeout(() => requestAnimationFrame(renderShader), 100); 
                } else {
                    requestAnimationFrame(renderShader);
                }
            }
            renderShader();
        } else {
            console.warn("WebGL not supported, falling back to empty background.");
        }
    }

    // ---------- CURSOR FOLLOWER ----------
    const cursor = document.getElementById('cursorFollower');

    document.addEventListener('mousemove', (e) => {
        if(cursor) {
            cursor.classList.add('active');
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        }
    });

    document.addEventListener('mouseleave', () => {
        if(cursor) cursor.classList.remove('active');
    });

    document.querySelectorAll('a, button, .skill-card, .project-card, .learning-card').forEach(el => {
        el.addEventListener('mouseenter', () => {
            if(cursor) {
                cursor.style.transform = 'translate(-50%, -50%) scale(1.8)';
                cursor.style.opacity = '0.3';
            }
        });
        el.addEventListener('mouseleave', () => {
            if(cursor) {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                cursor.style.opacity = '0.6';
            }
        });
    });

    // ---------- 3D TILT EFFECT ----------
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const tiltCards = document.querySelectorAll('.project-item, .skill-card, .learning-card');
        
        tiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; 
                const y = e.clientY - rect.top;  
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * -8; 
                const rotateY = ((x - centerX) / centerX) * 8;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                card.style.transition = 'none'; 
                card.style.zIndex = '10'; 
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                card.style.transition = 'transform 0.5s ease'; 
                card.style.zIndex = '1';
            });
        });
    }

    // ---------- NAVBAR ----------
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : 'auto';
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    const sections = document.querySelectorAll('section[id]');
    function updateActiveNav() {
        const scrollY = window.scrollY + 100;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollY >= top && scrollY < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    window.addEventListener('scroll', updateActiveNav);

    // ---------- TYPING ANIMATION ----------
    const typedText = document.getElementById('typedText');
    const roles = [
        'AI Architecture Enthusiast',
        'Systems & Hardware Explorer',
        'Front-End Developer',
        'Computer Vision Learner',
        'B.Tech AI @ NIT Rourkela',
        'Deep Learning',
        'Code Optimizer' 
    ];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;

    function typeWriter() {
        if (!typedText) return;
        const currentRole = roles[roleIndex];

        if (isDeleting) {
            typedText.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 40;
        } else {
            typedText.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 80;
        }

        if (!isDeleting && charIndex === currentRole.length) {
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            typingSpeed = 300;
        }

        setTimeout(typeWriter, typingSpeed);
    }
    typeWriter();

    // ---------- COUNTER ANIMATION ----------
    function animateCounters() {
        document.querySelectorAll('.stat-number').forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(current);
            }, 16);
        });
    }

    // ---------- SCROLL ANIMATIONS ----------
    function initAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');

                    if (entry.target.closest('.hero-stats')) {
                        animateCounters();
                    }

                    if (entry.target.classList.contains('skill-card')) {
                        const bar = entry.target.querySelector('.skill-progress');
                        if (bar) {
                            setTimeout(() => {
                                bar.style.width = bar.getAttribute('data-progress') + '%';
                            }, 200);
                        }
                    }

                    if (entry.target.classList.contains('learning-card') || entry.target.classList.contains('shine-wrapper')) {
                        const fill = entry.target.querySelector('.learning-fill');
                        if (fill) {
                            setTimeout(() => {
                                fill.style.width = fill.getAttribute('data-width') + '%';
                            }, 300);
                        }
                    }

                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    // ---------- SKILLS TABS ----------
    const skillTabs = document.querySelectorAll('.skill-tab');
    const skillGrids = document.querySelectorAll('.skills-grid');

    skillTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            skillTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            skillGrids.forEach(grid => {
                grid.classList.remove('active');
                if (grid.id === targetTab) {
                    grid.classList.add('active');
                    grid.querySelectorAll('.skill-progress').forEach(bar => {
                        bar.style.width = '0';
                        setTimeout(() => {
                            bar.style.width = bar.getAttribute('data-progress') + '%';
                        }, 100);
                    });
                }
            });
        });
    });

    // ---------- CONTACT FORM ----------
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');

    if(contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();

            if (!name || !email || !subject || !message) {
                formStatus.textContent = 'Please fill in all fields.';
                formStatus.className = 'form-status error';
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                formStatus.textContent = 'Please enter a valid email address.';
                formStatus.className = 'form-status error';
                return;
            }

            const submitBtn = contactForm.querySelector('.btn-submit');
            submitBtn.innerHTML = '<span>Sending...</span><i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    formStatus.textContent = '✅ Message sent successfully! I\'ll get back to you soon.';
                    formStatus.className = 'form-status success';
                    contactForm.reset();
                } else {
                    throw new Error('Failed to send message');
                }
            } catch (error) {
                formStatus.textContent = '❌ Oops! There was a problem submitting your form.';
                formStatus.className = 'form-status error';
            } finally {
                submitBtn.innerHTML = '<span>Send Message</span><i class="fas fa-paper-plane"></i>';
                submitBtn.disabled = false;

                setTimeout(() => {
                    formStatus.textContent = '';
                    formStatus.className = 'form-status';
                }, 5000);
            }
        });
    }

    // ---------- BACK TO TOP ----------
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if(backToTop) backToTop.classList.toggle('visible', window.scrollY > 500);
    });

    if(backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ---------- SMOOTH SCROLL ----------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ---------- NAVBAR HIDE ON SCROLL DOWN (MOBILE) ----------
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 768) {
            const currentScroll = window.scrollY;
            navbar.style.transform = (currentScroll > lastScroll && currentScroll > 200)
                ? 'translateY(-100%)'
                : 'translateY(0)';
            lastScroll = currentScroll;
        } else {
            navbar.style.transform = 'translateY(0)';
        }
    });

    // Init if no loader
    if(!document.getElementById('loader')) {
        initAnimations();
    }
});