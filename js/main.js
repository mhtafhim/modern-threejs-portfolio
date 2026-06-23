/* === UI INTERACTION SFX ENGINE === */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let audioEnabled = false;

function toggleAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    audioEnabled = !audioEnabled;
    
    // Desktop and Mobile Icons update
    const icons = [document.getElementById('audio-icon'), document.getElementById('audio-icon-mobile')];
    const status = document.getElementById('audio-status');
    
    if (audioEnabled) {
        icons.forEach(i => { if(i) i.className = 'fas fa-volume-up text-cyan-400'; });
        if(status) status.textContent = 'UI_SFX ON';
        playBeep(700, 'sine', 0.2); // Interface confirmation beep
    } else {
        icons.forEach(i => { if(i) i.className = 'fas fa-volume-mute'; });
        if(status) status.textContent = 'UI_SFX OFF';
    }
}

function playBeep(freq, type, duration) {
    if (!audioEnabled || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime); // Keep very quiet
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e){}
}

/* === Hacker Matrix Text Decode/Scramble Engine === */
class TextScrambler {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }
    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameId);
        this.frame = 0;
        this.update();
        return promise;
    }
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.chars[Math.floor(Math.random() * this.chars.length)];
                    this.queue[i].char = char;
                }
                output += `<span class="text-cyan-400 font-bold">${char}</span>`;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameId = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
}

function initScramble(el) {
    if (el.dataset.scrambled) return;
    el.dataset.scrambled = 'true';
    const scrambler = new TextScrambler(el);
    scrambler.setText(el.dataset.value || el.innerText);
}

function setupScramble() {
    document.querySelectorAll('.scramble').forEach(el => {
        el.addEventListener('mouseenter', () => initScramble(el));
    });
}

/* === Cursor Physics & Dynamic Hover Spotlights === */
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursor-dot');
let mX = 0, mY = 0, bX = 0, bY = 0;

document.addEventListener('mousemove', (e) => {
    mX = e.clientX; mY = e.clientY;
    if(cursorDot) { cursorDot.style.left = mX + 'px'; cursorDot.style.top = mY + 'px'; }
});

function renderCursor() {
    bX += (mX - bX) * 0.15; bY += (mY - bY) * 0.15;
    if(cursor) { cursor.style.left = bX + 'px'; cursor.style.top = bY + 'px'; }
    requestAnimationFrame(renderCursor);
}

if(window.matchMedia("(pointer: fine)").matches) {
    renderCursor();
}

function setupCyberPanels() {
    document.querySelectorAll('.cyber-panel').forEach(panel => {
        panel.addEventListener('mousemove', (e) => {
            const rect = panel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            panel.style.setProperty('--mouse-x', `${x}px`);
            panel.style.setProperty('--mouse-y', `${y}px`);

            if(window.innerWidth > 768) {
                const centerX = rect.width / 2; const centerY = rect.height / 2;
                const tiltX = (y - centerY) / centerY * 6;
                const tiltY = (centerX - x) / centerX * 6;
                panel.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
            }
        });
        panel.addEventListener('mouseleave', () => panel.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)');
        
        panel.addEventListener('mouseenter', () => {
            playBeep(880, 'sine', 0.04);
            if(cursor) {
                cursor.style.width = '36px'; cursor.style.height = '36px';
                cursor.style.borderColor = '#ff007f'; cursor.style.boxShadow = '0 0 15px #ff007f';
            }
        });
        panel.addEventListener('mouseleave', () => {
            if(cursor) {
                cursor.style.width = '24px'; cursor.style.height = '24px';
                cursor.style.borderColor = '#00f3ff'; cursor.style.boxShadow = '0 0 10px #00f3ff';
            }
        });
    });
}

/* === GSAP ScrollTrigger Animations === */
function setupAnimations() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const sections = document.querySelectorAll('section');
    sections.forEach((sec, idx) => {
        ScrollTrigger.create({
            trigger: sec, start: "top center", end: "bottom center",
            onEnter: () => updateNavNodes(idx), onEnterBack: () => updateNavNodes(idx)
        });
    });

    function updateNavNodes(activeIndex) {
        document.querySelectorAll('.fixed .group').forEach((node, i) => {
            i === activeIndex ? node.classList.add('active-node') : node.classList.remove('active-node');
        });
    }

    gsap.utils.toArray('.scramble').forEach(t => {
        ScrollTrigger.create({ trigger: t, start: "top 85%", onEnter: () => initScramble(t) });
    });

    gsap.utils.toArray('.anim-panel-left').forEach(el => {
        gsap.fromTo(el, 
            { x: -100, rotationY: window.innerWidth > 768 ? 45 : 0, opacity: 0, scale: 0.9 }, 
            { x: 0, rotationY: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } }
        );
    });

    gsap.utils.toArray('.anim-panel-right').forEach(el => {
        gsap.fromTo(el, 
            { x: 100, rotationY: window.innerWidth > 768 ? -45 : 0, opacity: 0, scale: 0.9 }, 
            { x: 0, rotationY: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } }
        );
    });

    gsap.utils.toArray('.anim-panel-up').forEach(el => {
        gsap.fromTo(el, 
            { y: 80, rotationX: window.innerWidth > 768 ? -45 : 0, opacity: 0, scale: 0.9 }, 
            { y: 0, rotationX: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } }
        );
    });

    gsap.utils.toArray('.anim-text-fly').forEach(el => {
        gsap.fromTo(el, 
            { z: -300, y: 30, rotationX: window.innerWidth > 768 ? -30 : 0, opacity: 0 }, 
            { z: 0, y: 0, rotationX: 0, opacity: 1, duration: 1.2, ease: "back.out(1.2)", scrollTrigger: { trigger: el, start: "top 90%" } }
        );
    });

    gsap.utils.toArray('.anim-bar').forEach(b => {
        const textElement = b.parentElement.previousElementSibling.lastElementChild;
        if(textElement) {
            gsap.fromTo(b, { width: "0%" }, {
                width: textElement.innerText,
                duration: 1.5, ease: "power3.out", scrollTrigger: { trigger: b, start: "top 90%" }
            });
        }
    });
}

/* === Three.js Background === */
function setupThreeJs() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const pCount = window.innerWidth > 768 ? 250 : 120; 
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    const speeds = [];

    for (let i = 0; i < pCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 60;
        positions[i + 1] = (Math.random() - 0.5) * 60;
        positions[i + 2] = (Math.random() - 0.5) * 60;
        speeds.push({
            x: (Math.random() - 0.5) * 0.015, y: (Math.random() - 0.5) * 0.015, z: (Math.random() - 0.5) * 0.015
        });
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x00f3ff, size: window.innerWidth > 768 ? 0.35 : 0.6, transparent: true, opacity: 0.8 });
    const cloud = new THREE.Points(geom, pMat);
    scene.add(cloud);

    const lineGeom = new THREE.BufferGeometry();
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.22 });
    const lineSegments = new THREE.LineSegments(lineGeom, lineMat);
    scene.add(lineSegments);

    const blueLight = new THREE.PointLight(0x00f3ff, 2.5, 120); blueLight.position.set(20, 20, 20); scene.add(blueLight);
    const pinkLight = new THREE.PointLight(0xff007f, 2.5, 120); pinkLight.position.set(-20, -20, -20); scene.add(pinkLight);

    const camPath = [
        { x: 0, y: 0, z: 28 },      // About
        { x: 18, y: -5, z: 22 },    // Experience
        { x: -16, y: 10, z: 26 },   // Skills
        { x: 12, y: -18, z: 18 },   // Projects
        { x: -10, y: 15, z: 20 },   // Blog
        { x: 0, y: 5, z: 32 }       // Contact
    ];

    camera.position.set(camPath[0].x, camPath[0].y, camPath[0].z);

    const sections = document.querySelectorAll('section');
    if (sections.length > 1 && typeof gsap !== 'undefined') {
        sections.forEach((sec, idx) => {
            if (idx === 0 || idx >= camPath.length) return;
            gsap.to(camera.position, {
                x: camPath[idx].x, y: camPath[idx].y, z: camPath[idx].z,
                scrollTrigger: { trigger: sec, start: "top bottom", end: "top top", scrub: 1.5 }
            });
        });
    }

    let camOffsetX = 0, camOffsetY = 0;
    document.addEventListener('mousemove', (e) => {
        if(window.innerWidth > 768) {
            camOffsetX = (e.clientX - window.innerWidth / 2) * 0.003;
            camOffsetY = (e.clientY - window.innerHeight / 2) * 0.003;
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function renderLoop() {
        requestAnimationFrame(renderLoop);
        
        cloud.rotation.y += 0.0006; cloud.rotation.x += 0.0003;

        camera.position.x += (camOffsetX - camera.position.x * 0.05) * 0.02;
        camera.position.y += (-camOffsetY - camera.position.y * 0.05) * 0.02;
        camera.lookAt(0, 0, 0);

        const posAttr = cloud.geometry.attributes.position;
        const linePositions = [];

        for (let i = 0; i < pCount; i++) {
            let x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
            x += speeds[i].x; y += speeds[i].y; z += speeds[i].z;

            if (x > 30 || x < -30) speeds[i].x *= -1;
            if (y > 30 || y < -30) speeds[i].y *= -1;
            if (z > 30 || z < -30) speeds[i].z *= -1;

            posAttr.setXYZ(i, x, y, z);

            for (let j = i + 1; j < pCount; j++) {
                const dx = x - posAttr.getX(j), dy = y - posAttr.getY(j), dz = z - posAttr.getZ(j);
                if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 9.5) {
                    linePositions.push(x, y, z);
                    linePositions.push(posAttr.getX(j), posAttr.getY(j), posAttr.getZ(j));
                }
            }
        }
        posAttr.needsUpdate = true;
        lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        lineGeom.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }
    renderLoop();
}

/* === Terminal Shell logic === */
function setupTerminal() {
    const tInput = document.getElementById('term-input');
    const tHistory = document.getElementById('term-history');
    if(!tInput || !tHistory) return;

    tInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = tInput.value.trim().toLowerCase();
            tInput.value = ''; executeTerminal(cmd);
        }
    });

    function executeTerminal(cmd) {
        playBeep(420, 'square', 0.05);
        let response = '';

        switch(cmd) {
            case 'help': response = `Configs:<br>&gt; <span class="text-cyan-400">profile</span><br>&gt; <span class="text-cyan-400">skills</span><br>&gt; <span class="text-cyan-400">blog</span><br>&gt; <span class="text-cyan-400">contact</span>`; break;
            case 'profile': response = `Mahmudul Haque // BSc CSE<br>Embedded semiconductors and ML.`; break;
            case 'skills': response = `High-Perf: C++, Python, PyTorch<br>DB: MSSQL, MySQL, Firebase`; break;
            case 'blog': response = `Latest log fetched: "Optimizing Spatial Matrices in C++"`; break;
            case 'contact': response = `Transmit to: mahmudulhoquetafhim@gmail.com`; break;
            default: response = `Error: sequence "${cmd}" not recognized.`;
        }

        tHistory.innerHTML += `<div class="mt-2 text-magenta-500 font-bold">&gt; visitor@mhaque:~$ ${cmd}</div><div class="pl-2 border-l border-cyan-500/30 text-white">${response}</div>`;
        tHistory.scrollTop = tHistory.scrollHeight;
    }
}

/* === Dynamic Blog Loading === */
async function loadBlogPosts() {
    const blogContainer = document.getElementById('blog-grid');
    if(!blogContainer) return;

    try {
        const res = await fetch('data/blogs.json');
        const blogs = await res.json();
        
        let html = '';
        blogs.forEach(blog => {
            const tagsHtml = blog.tags.map(t => `<span>${t}</span>`).join('');
            html += `
            <div class="cyber-panel p-6 flex flex-col justify-between border-magenta-500/30 anim-panel-up group">
                <div class="space-y-3 text-xs font-mono">
                    <div class="text-magenta-400 tracking-widest mb-2 border-b border-magenta-500/20 pb-2">${blog.date}</div>
                    <h3 class="text-lg font-bold text-white scramble group-hover:text-cyan-400 transition-colors" data-value="${blog.title}">${blog.title}</h3>
                    <p class="text-cyan-200/80 leading-relaxed">
                        ${blog.summary}
                    </p>
                </div>
                <div class="mt-4 pt-4 flex items-center justify-between border-t border-magenta-500/10">
                    <div class="flex gap-2 text-[9px] text-cyan-500">${tagsHtml}</div>
                    <a href="post.html?id=${blog.id}" class="text-cyan-400 text-xs hover:text-white cursor-none transition-colors"><i class="fas fa-arrow-right"></i> READ</a>
                </div>
            </div>`;
        });
        blogContainer.innerHTML = html;
        setupScramble(); // Re-initialize scramble for newly added elements
        setupCyberPanels(); // Re-initialize hover effects
    } catch(e) {
        console.error("Error loading blog posts", e);
    }
}

/* === Single Post Loading === */
async function loadSinglePost() {
    const postContainer = document.getElementById('single-post-container');
    if(!postContainer) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if(!id) {
        postContainer.innerHTML = "<h2 class='text-red-500 font-bold text-2xl'>ERROR: Post ID missing.</h2>";
        return;
    }

    try {
        const res = await fetch('data/blogs.json');
        const blogs = await res.json();
        const blog = blogs.find(b => b.id === id);

        if(blog) {
            const tagsHtml = blog.tags.map(t => `<span class="bg-cyan-950/40 border border-cyan-500/30 px-2 py-1">${t}</span>`).join('');
            postContainer.innerHTML = `
                <div class="text-magenta-400 tracking-widest mb-4 border-b border-magenta-500/20 pb-2">${blog.date}</div>
                <h1 class="text-3xl md:text-5xl font-black text-white leading-none glitch-text scramble mb-6" data-value="${blog.title}">${blog.title}</h1>
                <div class="flex gap-3 text-xs text-cyan-500 mb-8 font-mono">
                    ${tagsHtml}
                </div>
                <div class="text-sm md:text-md text-cyan-100/90 font-mono leading-relaxed space-y-4">
                    ${blog.content}
                </div>
            `;
            setupScramble();
        } else {
            postContainer.innerHTML = "<h2 class='text-red-500 font-bold text-2xl'>ERROR: Post not found.</h2>";
        }
    } catch(e) {
        console.error("Error loading post", e);
        postContainer.innerHTML = "<h2 class='text-red-500 font-bold text-2xl'>ERROR: Could not load post.</h2>";
    }
}

/* === Initialize Everything === */
document.addEventListener('DOMContentLoaded', () => {
    setupScramble();
    setupCyberPanels();
    setupThreeJs();
    setupAnimations();
    setupTerminal();
    loadBlogPosts();
    loadSinglePost();
});
