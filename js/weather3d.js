class Weather3DEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentCondition = null;
        this.animFrameId = null;
        this.activeObjects = [];

        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

        // Configuration for adaptive scaling & framing
        this.baseAspect = 1.35;
        this.baseZ = 16;
        this.baseFov = 45;

        this.resizeObserver = null;
        this.init();
    }

    init() {
        const width = this.container.clientWidth || 300;
        const height = this.container.clientHeight || 250;

        // Scene
        this.scene = new THREE.Scene();

        // Camera with initial Perspective
        this.camera = new THREE.PerspectiveCamera(this.baseFov, width / height, 0.1, 1000);

        // Renderer with alpha/transparency for glassmorphism embedding
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        // Set initial sizing and camera adjustments
        this.onResize();

        // Enhanced Cinematic Lighting for Realism
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
        mainLight.position.set(15, 20, 15);
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x90caf9, 0.6);
        fillLight.position.set(-15, -10, -10);
        this.scene.add(fillLight);

        // Mouse Parallax Listener
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            this.mouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.targetY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        });

        this.container.addEventListener('mouseleave', () => {
            this.mouse.targetX = 0;
            this.mouse.targetY = 0;
        });

        // Resize Listeners
        window.addEventListener('resize', () => this.onResize());
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.onResize());
            this.resizeObserver.observe(this.container);
        }

        // Start render loop
        this.animate();
    }

    onResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (!width || !height) return;

        const aspect = width / height;
        this.camera.aspect = aspect;

        if (aspect < this.baseAspect) {
            const fovRad = 2 * Math.atan(Math.tan((this.baseFov * Math.PI) / 360) * (this.baseAspect / aspect));
            this.camera.fov = fovRad * (180 / Math.PI);
        } else {
            this.camera.fov = this.baseFov;
        }

        this.camera.position.z = this.baseZ;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    clearActiveObjects() {
        this.activeObjects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            this.scene.remove(obj);
        });
        this.activeObjects = [];
    }

    updateCondition(conditionType) {
        if (this.currentCondition === conditionType) return;
        this.currentCondition = conditionType;
        this.clearActiveObjects();

        switch (conditionType) {
            case 'clear-day':
                this.buildRealisticSunScene();
                break;
            case 'clear-night':
            case 'night':
                this.buildRealisticMoonScene();
                break;
            case 'clouds':
            case 'clouds-night':
                this.buildRealisticCloudsScene();
                break;
            case 'rain':
                this.buildRealisticRainScene();
                break;
            case 'thunderstorm':
                this.buildRealisticThunderstormScene();
                break;
            case 'snow':
                this.buildRealisticSnowScene();
                break;
            case 'mist':
                this.buildRealisticMistScene();
                break;
            default:
                this.buildRealisticSunScene();
                break;
        }
    }

    // --- Procedural Texture Helpers for Realism ---
    createSunTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
        grad.addColorStop(0, '#fff3a1');
        grad.addColorStop(0.4, '#ff9900');
        grad.addColorStop(0.8, '#ff3300');
        grad.addColorStop(1, '#881100');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
        return new THREE.CanvasTexture(canvas);
    }

    createMoonTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#b0b8c4';
        ctx.fillRect(0, 0, 512, 512);
        // Add procedural craters for realistic lunar surface
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const r = 5 + Math.random() * 25;
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(70,75,85,0.4)' : 'rgba(210,215,225,0.3)';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        return new THREE.CanvasTexture(canvas);
    }

    // 1. Realistic 3D Sun Scene
    buildRealisticSunScene() {
        const group = new THREE.Group();

        // Core glowing sun with custom texture and physical material
        const sunGeo = new THREE.SphereGeometry(2.4, 64, 64);
        const sunMat = new THREE.MeshStandardMaterial({
            map: this.createSunTexture(),
            roughness: 0.3,
            metalness: 0.1,
            emissive: 0xff6600,
            emissiveIntensity: 0.6
        });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        group.add(sun);

        // Soft atmospheric outer glow halo
        const haloGeo = new THREE.SphereGeometry(3.1, 32, 32);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        group.add(halo);

        // Dynamic radiant solar rays
        const rayCount = 16;
        const raysGroup = new THREE.Group();
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const rayGeo = new THREE.ConeGeometry(0.12, 2.2, 8);
            const rayMat = new THREE.MeshBasicMaterial({
                color: 0xffd700,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            const ray = new THREE.Mesh(rayGeo, rayMat);
            ray.position.set(Math.cos(angle) * 3.4, Math.sin(angle) * 3.4, 0);
            ray.rotation.z = angle - Math.PI / 2;
            raysGroup.add(ray);
        }
        group.add(raysGroup);

        group.userData = { sun, halo, raysGroup };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // 2. Realistic 3D Moon & Starfield Scene
    buildRealisticMoonScene() {
        const group = new THREE.Group();

        const moonGeo = new THREE.SphereGeometry(2.3, 64, 64);
        const moonMat = new THREE.MeshStandardMaterial({
            map: this.createMoonTexture(),
            roughness: 0.85,
            metalness: 0.05
        });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        group.add(moon);

        // Soft lunar atmospheric rim glow
        const glowGeo = new THREE.SphereGeometry(2.7, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x8ab4f8,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        // High-density realistic starfield
        const starsGeo = new THREE.BufferGeometry();
        const starsCount = 200;
        const posArray = new Float32Array(starsCount * 3);
        const scaleArray = new Float32Array(starsCount);

        for (let i = 0; i < starsCount * 3; i += 3) {
            posArray[i] = (Math.random() - 0.5) * 35;
            posArray[i + 1] = (Math.random() - 0.5) * 35;
            posArray[i + 2] = (Math.random() - 0.5) * 20 - 8;
            scaleArray[i / 3] = Math.random();
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starsMat = new THREE.PointsMaterial({
            size: 0.12,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const stars = new THREE.Points(starsGeo, starsMat);
        group.add(stars);

        group.userData = { moon, stars };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // 3. Volumetric 3D Cloud Scene
    buildRealisticCloudsScene() {
        const group = new THREE.Group();

        for (let c = 0; c < 3; c++) {
            const cloudCluster = new THREE.Group();
            const puffCount = 12;
            for (let j = 0; j < puffCount; j++) {
                const size = 0.8 + Math.random() * 0.9;
                const puffGeo = new THREE.SphereGeometry(size, 24, 24);
                const puffMat = new THREE.MeshStandardMaterial({
                    color: 0xf0f4f8,
                    roughness: 0.9,
                    metalness: 0.0,
                    transparent: true,
                    opacity: 0.75
                });
                const puff = new THREE.Mesh(puffGeo, puffMat);
                puff.position.set(
                    (j - puffCount / 2) * 0.55 + (Math.random() - 0.5) * 0.4,
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.5) * 0.5
                );
                cloudCluster.add(puff);
            }
            cloudCluster.position.set((c - 1) * 3.8, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.5);
            group.add(cloudCluster);
        }

        group.userData = { isClouds: true };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // 4. Cinematic 3D Rain Scene
    buildRealisticRainScene() {
        const group = new THREE.Group();

        // Dark overcast heavy rain clouds above
        const cloudCluster = new THREE.Group();
        for (let j = 0; j < 12; j++) {
            const puffGeo = new THREE.SphereGeometry(1.5, 20, 20);
            const puffMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.95 });
            const puff = new THREE.Mesh(puffGeo, puffMat);
            puff.position.set((j - 5) * 1.0, 3.8 + Math.random() * 0.4, (Math.random() - 0.5) * 1.2);
            cloudCluster.add(puff);
        }
        group.add(cloudCluster);

        // Realistic elongated streak raindrops
        const rainCount = 450;
        const rainGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(rainCount * 3);
        const velocities = [];

        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 18;
            positions[i * 3 + 1] = Math.random() * 12 - 4;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
            velocities.push(0.35 + Math.random() * 0.3);
        }
        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const rainMat = new THREE.PointsMaterial({
            color: 0x93c5fd,
            size: 0.18,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
        });
        const rainPoints = new THREE.Points(rainGeo, rainMat);
        group.add(rainPoints);

        group.userData = { rainPoints, velocities, rainCount };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // 5. Cinematic Thunderstorm Scene with Dynamic Lightning
    buildRealisticThunderstormScene() {
        const group = new THREE.Group();

        const stormCloud = new THREE.Group();
        for (let j = 0; j < 10; j++) {
            const puffGeo = new THREE.SphereGeometry(1.6, 20, 20);
            const puffMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.98 });
            const puff = new THREE.Mesh(puffGeo, puffMat);
            puff.position.set((j - 4.5) * 1.1, 3.5 + Math.random() * 0.5, (Math.random() - 0.5) * 1.2);
            stormCloud.add(puff);
        }
        group.add(stormCloud);

        // Jagged multi-segment lightning bolt
        const points = [
            new THREE.Vector3(0, 3.2, 0),
            new THREE.Vector3(-0.5, 1.8, 0.1),
            new THREE.Vector3(0.3, 1.1, -0.1),
            new THREE.Vector3(-0.3, -0.2, 0.2),
            new THREE.Vector3(0.6, -1.0, -0.1),
            new THREE.Vector3(0.0, -2.8, 0)
        ];
        const lightningGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lightningMat = new THREE.LineBasicMaterial({
            color: 0xe0e7ff,
            linewidth: 4,
            blending: THREE.AdditiveBlending
        });
        const lightning = new THREE.Line(lightningGeo, lightningMat);
        lightning.visible = false;
        group.add(lightning);

        const flashLight = new THREE.PointLight(0x818cf8, 0, 35);
        flashLight.position.set(0, 2, 2);
        group.add(flashLight);

        // Heavy slanted rain
        const rainCount = 300;
        const rainGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(rainCount * 3);
        const velocities = [];
        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 18;
            positions[i * 3 + 1] = Math.random() * 12 - 4;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
            velocities.push(0.4 + Math.random() * 0.35);
        }
        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const rainPoints = new THREE.Points(rainGeo, new THREE.PointsMaterial({
            color: 0xc4b5fd,
            size: 0.15,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        }));
        group.add(rainPoints);

        group.userData = { lightning, flashLight, rainPoints, velocities, rainCount, lastFlash: 0 };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // 6. Realistic 3D Snow Scene
    buildRealisticSnowScene() {
        const group = new THREE.Group();

        const snowCount = 350;
        const snowGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(snowCount * 3);
        const speeds = [];

        for (let i = 0; i < snowCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 18;
            positions[i * 3 + 1] = Math.random() * 12 - 4;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
            speeds.push({
                y: 0.025 + Math.random() * 0.035,
                drift: (Math.random() - 0.5) * 0.015
            });
        }
        snowGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const snowMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.2,
            transparent: true,
            opacity: 0.95
        });
        const snowflakes = new THREE.Points(snowGeo, snowMat);
        group.add(snowflakes);

        group.userData = { snowflakes, speeds, snowCount };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // 7. Atmospheric 3D Mist/Fog Scene
    buildRealisticMistScene() {
        const group = new THREE.Group();

        for (let i = 0; i < 8; i++) {
            const mistGeo = new THREE.PlaneGeometry(10 + Math.random() * 4, 3.5 + Math.random() * 2);
            const mistMat = new THREE.MeshBasicMaterial({
                color: 0xdbeafe,
                transparent: true,
                opacity: 0.18,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            const mistPlane = new THREE.Mesh(mistGeo, mistMat);
            mistPlane.position.set((i - 3.5) * 2.2, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 4);
            group.add(mistPlane);
        }

        group.userData = { isMist: true };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // Real-Time Animation Loop
    animate() {
        this.animFrameId = requestAnimationFrame(() => this.animate());

        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

        if (this.camera) {
            this.camera.position.x = this.mouse.x * 1.2;
            this.camera.position.y = this.mouse.y * 1.2;
            this.camera.lookAt(0, 0, 0);
        }

        this.activeObjects.forEach(group => {
            const data = group.userData;

            if (data.sun) {
                data.sun.rotation.y += 0.003;
                if (data.raysGroup) data.raysGroup.rotation.z += 0.002;
            }

            if (data.moon) {
                data.moon.rotation.y += 0.002;
            }

            if (data.isClouds) {
                group.children.forEach((cloud, idx) => {
                    cloud.position.x += Math.sin(Date.now() * 0.0008 + idx) * 0.002;
                });
            }

            if (data.rainPoints && data.velocities) {
                const pos = data.rainPoints.geometry.attributes.position.array;
                for (let i = 0; i < data.rainCount; i++) {
                    pos[i * 3 + 1] -= data.velocities[i];
                    if (pos[i * 3 + 1] < -6) {
                        pos[i * 3 + 1] = 6;
                    }
                }
                data.rainPoints.geometry.attributes.position.needsUpdate = true;
            }

            if (data.lightning && data.flashLight) {
                const now = Date.now();
                if (now - data.lastFlash > 3500 + Math.random() * 4500) {
                    data.lastFlash = now;
                    data.lightning.visible = true;
                    data.flashLight.intensity = 4 + Math.random() * 3;

                    setTimeout(() => {
                        data.lightning.visible = false;
                        data.flashLight.intensity = 0;
                    }, 100);
                }
            }

            if (data.snowflakes && data.speeds) {
                const pos = data.snowflakes.geometry.attributes.position.array;
                for (let i = 0; i < data.snowCount; i++) {
                    pos[i * 3 + 1] -= data.speeds[i].y;
                    pos[i * 3] += Math.sin(Date.now() * 0.0015 + i) * 0.008;
                    if (pos[i * 3 + 1] < -6) {
                        pos[i * 3 + 1] = 6;
                    }
                }
                data.snowflakes.geometry.attributes.position.needsUpdate = true;
            }

            if (data.isMist) {
                group.children.forEach((plane, idx) => {
                    plane.position.x += (idx % 2 === 0 ? 1 : -1) * 0.003;
                    if (plane.position.x > 9) plane.position.x = -9;
                    if (plane.position.x < -9) plane.position.x = 9;
                });
            }
        });

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}