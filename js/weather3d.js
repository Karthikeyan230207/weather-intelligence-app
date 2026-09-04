
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
        
        this.init();
    }

    init() {
        const width = this.container.clientWidth || 300;
        const height = this.container.clientHeight || 250;

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.z = 15;

        // Renderer with alpha/transparency for glassmorphism embedding
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 10, 10);
        this.scene.add(dirLight);

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

        // Resize Listener
        window.addEventListener('resize', () => this.onResize());

        // Start render loop
        this.animate();
    }

    onResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
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
                this.buildSunScene();
                break;
            case 'clear-night':
            case 'night':
                this.buildMoonScene();
                break;
            case 'clouds':
            case 'clouds-night':
                this.buildCloudsScene();
                break;
            case 'rain':
                this.buildRainScene();
                break;
            case 'thunderstorm':
                this.buildThunderstormScene();
                break;
            case 'snow':
                this.buildSnowScene();
                break;
            case 'mist':
                this.buildMistScene();
                break;
            default:
                this.buildSunScene();
                break;
        }
    }

    // 1. 3D Sun Scene (Glowing sun sphere + rotating ray corona + particle sparkle)
    buildSunScene() {
        const group = new THREE.Group();

        // Core Sun Mesh
        const sunGeo = new THREE.SphereGeometry(2.5, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        group.add(sun);

        // Sun Glow Corona Outer Mesh
        const coronaGeo = new THREE.SphereGeometry(3.2, 32, 32);
        const coronaMat = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.35,
            side: THREE.BackSide
        });
        const corona = new THREE.Mesh(coronaGeo, coronaMat);
        group.add(corona);

        // Sun Ray Ring Lines
        const rayCount = 12;
        const raysGroup = new THREE.Group();
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const rayGeo = new THREE.CylinderGeometry(0.08, 0.02, 1.8, 8);
            const rayMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.8 });
            const ray = new THREE.Mesh(rayGeo, rayMat);
            ray.position.set(Math.cos(angle) * 3.8, Math.sin(angle) * 3.8, 0);
            ray.rotation.z = angle - Math.PI / 2;
            raysGroup.add(ray);
        }
        group.add(raysGroup);

        group.userData = { sun, corona, raysGroup };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // 2. 3D Moon & Stars Scene (Glowing crescent/sphere moon + twinkling stars)
    buildMoonScene() {
        const group = new THREE.Group();

        // Moon Sphere
        const moonGeo = new THREE.SphereGeometry(2.3, 32, 32);
        const moonMat = new THREE.MeshStandardMaterial({
            color: 0xe0e6ed,
            roughness: 0.6,
            metalness: 0.1
        });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        group.add(moon);

        // Moon Glow
        const glowGeo = new THREE.SphereGeometry(2.8, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x90caf9,
            transparent: true,
            opacity: 0.25
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        // Stars Particle System
        const starsGeo = new THREE.BufferGeometry();
        const starsCount = 120;
        const posArray = new Float32Array(starsCount * 3);
        for (let i = 0; i < starsCount * 3; i += 3) {
            posArray[i] = (Math.random() - 0.5) * 30;
            posArray[i + 1] = (Math.random() - 0.5) * 30;
            posArray[i + 2] = (Math.random() - 0.5) * 20 - 5;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starsMat = new THREE.PointsMaterial({
            size: 0.15,
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        const stars = new THREE.Points(starsGeo, starsMat);
        group.add(stars);

        group.userData = { moon, stars };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // 3. 3D Cloud Scene
    buildCloudsScene() {
        const group = new THREE.Group();

        for (let i = 0; i < 5; i++) {
            const cloudCluster = new THREE.Group();
            const puffCount = 6;
            for (let j = 0; j < puffCount; j++) {
                const puffGeo = new THREE.SphereGeometry(1.2 + Math.random() * 0.5, 16, 16);
                const puffMat = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    roughness: 0.9,
                    transparent: true,
                    opacity: 0.85
                });
                const puff = new THREE.Mesh(puffGeo, puffMat);
                puff.position.set((j - 2.5) * 0.9, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.4);
                cloudCluster.add(puff);
            }
            cloudCluster.position.set((i - 2) * 3, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2);
            group.add(cloudCluster);
        }

        group.userData = { isClouds: true };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // 4. 3D Rain Scene (Clouds + falling rain particles)
    buildRainScene() {
        const group = new THREE.Group();

        // Dark cloud top layer
        const cloudCluster = new THREE.Group();
        for (let j = 0; j < 7; j++) {
            const puffGeo = new THREE.SphereGeometry(1.4, 16, 16);
            const puffMat = new THREE.MeshStandardMaterial({ color: 0x5a6578, roughness: 0.9 });
            const puff = new THREE.Mesh(puffGeo, puffMat);
            puff.position.set((j - 3) * 1.1, 3.5 + Math.random() * 0.5, (Math.random() - 0.5) * 1);
            cloudCluster.add(puff);
        }
        group.add(cloudCluster);

        // Rain Streak Particles
        const rainCount = 300;
        const rainGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(rainCount * 3);
        const velocities = [];

        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 16;
            positions[i * 3 + 1] = Math.random() * 10 - 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
            velocities.push(0.2 + Math.random() * 0.25);
        }
        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const rainMat = new THREE.PointsMaterial({
            color: 0x82b1ff,
            size: 0.12,
            transparent: true,
            opacity: 0.8
        });
        const rainPoints = new THREE.Points(rainGeo, rainMat);
        group.add(rainPoints);

        group.userData = { rainPoints, velocities, rainCount };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // 5. 3D Thunderstorm Scene (Storm clouds + rain + procedural lightning bolt)
    buildThunderstormScene() {
        const group = new THREE.Group();

        // Dark Storm Cloud Mesh
        const stormCloud = new THREE.Group();
        for (let j = 0; j < 8; j++) {
            const puffGeo = new THREE.SphereGeometry(1.6, 16, 16);
            const puffMat = new THREE.MeshStandardMaterial({ color: 0x2c3440, roughness: 0.95 });
            const puff = new THREE.Mesh(puffGeo, puffMat);
            puff.position.set((j - 3.5) * 1.2, 3.2 + Math.random() * 0.6, (Math.random() - 0.5) * 1);
            stormCloud.add(puff);
        }
        group.add(stormCloud);

        // Lightning Bolt Geometry
        const points = [
            new THREE.Vector3(0, 3, 0),
            new THREE.Vector3(-0.6, 1.5, 0),
            new THREE.Vector3(0.2, 1.2, 0),
            new THREE.Vector3(-0.4, -0.8, 0),
            new THREE.Vector3(0.8, -0.5, 0),
            new THREE.Vector3(0.1, -2.5, 0)
        ];
        const lightningGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lightningMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
        const lightning = new THREE.Line(lightningGeo, lightningMat);
        lightning.visible = false;
        group.add(lightning);

        // Lightning Flash Light
        const flashLight = new THREE.PointLight(0x7c4dff, 0, 30);
        flashLight.position.set(0, 2, 2);
        group.add(flashLight);

        // Rain
        const rainCount = 200;
        const rainGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(rainCount * 3);
        const velocities = [];
        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 16;
            positions[i * 3 + 1] = Math.random() * 10 - 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
            velocities.push(0.3 + Math.random() * 0.3);
        }
        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const rainPoints = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xb388ff, size: 0.14, transparent: true, opacity: 0.85 }));
        group.add(rainPoints);

        group.userData = { lightning, flashLight, rainPoints, velocities, rainCount, lastFlash: 0 };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // 6. 3D Snow Scene (Falling snowflakes)
    buildSnowScene() {
        const group = new THREE.Group();

        const snowCount = 250;
        const snowGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(snowCount * 3);
        const speeds = [];

        for (let i = 0; i < snowCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 18;
            positions[i * 3 + 1] = Math.random() * 12 - 4;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
            speeds.push({
                y: 0.03 + Math.random() * 0.04,
                x: (Math.random() - 0.5) * 0.02
            });
        }
        snowGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const snowMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.22,
            transparent: true,
            opacity: 0.95
        });
        const snowflakes = new THREE.Points(snowGeo, snowMat);
        group.add(snowflakes);

        group.userData = { snowflakes, speeds, snowCount };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // 7. 3D Mist Scene (Floating fog particles)
    buildMistScene() {
        const group = new THREE.Group();

        for (let i = 0; i < 6; i++) {
            const mistGeo = new THREE.PlaneGeometry(8 + Math.random() * 4, 3 + Math.random() * 2);
            const mistMat = new THREE.MeshBasicMaterial({
                color: 0xcfe2fe,
                transparent: true,
                opacity: 0.25,
                side: THREE.DoubleSide
            });
            const mistPlane = new THREE.Mesh(mistGeo, mistMat);
            mistPlane.position.set((i - 2.5) * 2.5, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 4);
            group.add(mistPlane);
        }

        group.userData = { isMist: true };
        this.scene.add(group);
        this.activeObjects.push(group);
    }

    // Animation Loop
    animate() {
        this.animFrameId = requestAnimationFrame(() => this.animate());

        // Smooth mouse interpolation for parallax
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

        if (this.camera) {
            this.camera.position.x = this.mouse.x * 1.5;
            this.camera.position.y = this.mouse.y * 1.5;
            this.camera.lookAt(0, 0, 0);
        }

        // Animate condition-specific objects
        this.activeObjects.forEach(group => {
            const data = group.userData;

            // Sun Rotation
            if (data.sun) {
                data.sun.rotation.y += 0.005;
                if (data.raysGroup) data.raysGroup.rotation.z += 0.004;
            }

            // Moon Rotation
            if (data.moon) {
                data.moon.rotation.y += 0.003;
            }

            // Clouds Float
            if (data.isClouds) {
                group.children.forEach((cloud, idx) => {
                    cloud.position.x += Math.sin(Date.now() * 0.001 + idx) * 0.003;
                });
            }

            // Rain Particles Fall
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

            // Thunderstorm Lightning Flash
            if (data.lightning && data.flashLight) {
                const now = Date.now();
                if (now - data.lastFlash > 3000 + Math.random() * 4000) {
                    data.lastFlash = now;
                    data.lightning.visible = true;
                    data.flashLight.intensity = 3 + Math.random() * 2;

                    setTimeout(() => {
                        data.lightning.visible = false;
                        data.flashLight.intensity = 0;
                    }, 120);
                }
            }

            // Snowflakes Drift
            if (data.snowflakes && data.speeds) {
                const pos = data.snowflakes.geometry.attributes.position.array;
                for (let i = 0; i < data.snowCount; i++) {
                    pos[i * 3 + 1] -= data.speeds[i].y;
                    pos[i * 3] += Math.sin(Date.now() * 0.002 + i) * 0.01;
                    if (pos[i * 3 + 1] < -6) {
                        pos[i * 3 + 1] = 6;
                    }
                }
                data.snowflakes.geometry.attributes.position.needsUpdate = true;
            }

            // Mist Drift
            if (data.isMist) {
                group.children.forEach((plane, idx) => {
                    plane.position.x += (idx % 2 === 0 ? 1 : -1) * 0.004;
                    if (plane.position.x > 8) plane.position.x = -8;
                    if (plane.position.x < -8) plane.position.x = 8;
                });
            }
        });

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
