// 头文字R - 3D标题效果
// 使用Three.js实现3D标题效果，包括粒子效果、光影和交互

// 检查WebGL支持
let isWebGLSupported = (function() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
        return false;
    }
})();

// 主要变量
let scene, camera, renderer;
let titleContainer;
let rMesh;
let particles = [];
let lights = [];
let clock;
let isAnimating = true;
let headTextDiv, reactionTextDiv;

// 初始化函数
function init3DTitle() {
    titleContainer = document.getElementById('title-container');
    
    // 如果不支持WebGL，使用2D标题
    if (!isWebGLSupported) {
        createFallbackTitle();
        return;
    }
    
    // 创建场景
    scene = new THREE.Scene();
    
    // 创建相机
    const aspect = titleContainer.clientWidth / titleContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.z = 20;
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(titleContainer.clientWidth, titleContainer.clientHeight);
    renderer.setClearColor(0x000000, 0); // 透明背景
    titleContainer.appendChild(renderer.domElement);
    
    // 添加灯光
    addLights();
    
    // 创建标题元素
    createTitleElements();
    
    // 添加粒子效果
    createParticles();
    
    // 添加事件监听器
    addEventListeners();
    
    // 创建时钟用于动画
    clock = new THREE.Clock();
    
    // 开始动画循环
    animate();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', onWindowResize);
}

// 创建降级2D标题
function createFallbackTitle() {
    const fallbackTitle = document.createElement('div');
    fallbackTitle.className = 'fallback-title';
    fallbackTitle.innerHTML = '<span class="head-text">头文字</span><span class="r-text">R</span><span class="reaction-text">Reaction</span>';
    titleContainer.appendChild(fallbackTitle);
}

// 添加灯光
function addLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // 聚光灯
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(10, 10, 25);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.2;
    scene.add(spotLight);
    lights.push(spotLight);
    
    // 第二个聚光灯
    const spotLight2 = new THREE.SpotLight(0xff9900, 0.8);
    spotLight2.position.set(-10, -10, 15);
    spotLight2.angle = Math.PI / 8;
    spotLight2.penumbra = 0.1;
    scene.add(spotLight2);
    lights.push(spotLight2);
}

// 创建标题元素
function createTitleElements() {
    // 创建HTML元素显示"头文字"
    headTextDiv = document.createElement('div');
    headTextDiv.className = 'head-text-overlay';
    headTextDiv.textContent = '头文字';
    titleContainer.appendChild(headTextDiv);
    
    // 创建HTML元素显示"Reaction"
    reactionTextDiv = document.createElement('div');
    reactionTextDiv.className = 'reaction-text-overlay';
    reactionTextDiv.textContent = 'Reaction';
    titleContainer.appendChild(reactionTextDiv);
    
    // 只用Three.js渲染"R"字母
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
        // 创建3D的"R"
        const rGeometry = new THREE.TextGeometry('R', {
            font: font,
            size: 7, // 增大字体大小
            height: 5, // 厚度≥5单位
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.5,
            bevelSize: 0.3,
            bevelSegments: 5
        });
        
        const rMaterial = new THREE.MeshPhongMaterial({
            color: 0xff5722, // 高饱和橙红
            shininess: 100,
            specular: 0xffffff
        });
        
        rMesh = new THREE.Mesh(rGeometry, rMaterial);
        rGeometry.computeBoundingBox();
        const rWidth = rGeometry.boundingBox.max.x - rGeometry.boundingBox.min.x;
        // 将R放在中心位置
        rMesh.position.set(0, 0, 0);
        scene.add(rMesh);
    });
}

// 创建粒子效果
function createParticles() {
    // 创建围绕"R"的粒子
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xff5722,
        size: 0.2,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        // 初始位置：围绕一个圆
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 2;
        
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
        positions[i * 3 + 2] = Math.random() * 2 - 1;
        
        // 速度
        velocities.push({
            x: Math.cos(angle) * 0.02,
            y: Math.sin(angle) * 0.02,
            z: Math.random() * 0.01 - 0.005
        });
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    
    particles.push({
        system: particleSystem,
        geometry: particleGeometry,
        velocities: velocities
    });
    
    // 创建背景"颜色文字干扰块"粒子
    const bgParticleCount = 50;
    const bgParticleGeometry = new THREE.BufferGeometry();
    
    const bgPositions = new Float32Array(bgParticleCount * 3);
    const bgColors = new Float32Array(bgParticleCount * 3);
    const bgVelocities = [];
    
    const colorOptions = [
        new THREE.Color(0xff0000), // 红
        new THREE.Color(0x00ff00), // 绿
        new THREE.Color(0x0000ff), // 蓝
        new THREE.Color(0xffff00), // 黄
        new THREE.Color(0xff00ff), // 紫
        new THREE.Color(0x00ffff)  // 青
    ];
    
    for (let i = 0; i < bgParticleCount; i++) {
        // 随机位置
        bgPositions[i * 3] = Math.random() * 40 - 20;
        bgPositions[i * 3 + 1] = Math.random() * 30 - 15;
        bgPositions[i * 3 + 2] = Math.random() * -10 - 5;
        
        // 随机颜色
        const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
        bgColors[i * 3] = color.r;
        bgColors[i * 3 + 1] = color.g;
        bgColors[i * 3 + 2] = color.b;
        
        // 速度
        bgVelocities.push({
            x: Math.random() * 0.04 - 0.02,
            y: Math.random() * 0.04 - 0.02,
            z: Math.random() * 0.01 - 0.005
        });
    }
    
    bgParticleGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    bgParticleGeometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));
    
    const bgParticleMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    
    const bgParticleSystem = new THREE.Points(bgParticleGeometry, bgParticleMaterial);
    scene.add(bgParticleSystem);
    
    particles.push({
        system: bgParticleSystem,
        geometry: bgParticleGeometry,
        velocities: bgVelocities
    });
}

// 添加事件监听器
function addEventListeners() {
    // 鼠标悬停在"Reaction"上
    titleContainer.addEventListener('mousemove', function(event) {
        if (!reactionTextDiv) return;
        
        const rect = titleContainer.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // 检查鼠标是否在Reaction文本上
        const reactionRect = reactionTextDiv.getBoundingClientRect();
        const isOverReaction = 
            mouseX >= reactionRect.left - rect.left && 
            mouseX <= reactionRect.right - rect.left &&
            mouseY >= reactionRect.top - rect.top && 
            mouseY <= reactionRect.bottom - rect.top;
        
        if (isOverReaction) {
            // 悬停在Reaction上
            reactionTextDiv.style.opacity = '0.8';
        } else {
            // 不在Reaction上
            reactionTextDiv.style.opacity = '0.6';
        }
    });
    
    // 点击"R"触发粒子爆发
    titleContainer.addEventListener('click', function(event) {
        if (!rMesh) return;
        
        const rect = titleContainer.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        
        const intersects = raycaster.intersectObject(rMesh);
        
        if (intersects.length > 0) {
            // 点击了R，触发粒子爆发
            createParticleExplosion();
        }
    });
}

// 创建粒子爆发效果
function createParticleExplosion() {
    if (!rMesh) return;
    
    const explosionCount = 200;
    const explosionGeometry = new THREE.BufferGeometry();
    const explosionMaterial = new THREE.PointsMaterial({
        color: 0xff5722,
        size: 0.3,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const positions = new Float32Array(explosionCount * 3);
    const velocities = [];
    
    // 从R的位置开始爆发
    const center = new THREE.Vector3();
    rMesh.getWorldPosition(center);
    
    for (let i = 0; i < explosionCount; i++) {
        // 初始位置：R的中心
        positions[i * 3] = center.x;
        positions[i * 3 + 1] = center.y;
        positions[i * 3 + 2] = center.z;
        
        // 随机方向的速度
        const speed = 0.1 + Math.random() * 0.2;
        const angle = Math.random() * Math.PI * 2;
        const elevation = Math.random() * Math.PI - Math.PI/2;
        
        velocities.push({
            x: Math.cos(angle) * Math.cos(elevation) * speed,
            y: Math.sin(elevation) * speed,
            z: Math.sin(angle) * Math.cos(elevation) * speed
        });
    }
    
    explosionGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const explosionSystem = new THREE.Points(explosionGeometry, explosionMaterial);
    scene.add(explosionSystem);
    
    // 1秒后消失
    const explosion = {
        system: explosionSystem,
        geometry: explosionGeometry,
        velocities: velocities,
        life: 1.0
    };
    
    particles.push(explosion);
    
    // 1秒后移除
    setTimeout(() => {
        scene.remove(explosionSystem);
        particles = particles.filter(p => p !== explosion);
    }, 1000);
}

// 窗口大小变化时调整
function onWindowResize() {
    if (!camera || !renderer || !titleContainer) return;
    
    const aspect = titleContainer.clientWidth / titleContainer.clientHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    
    renderer.setSize(titleContainer.clientWidth, titleContainer.clientHeight);
}

// 更新粒子位置
function updateParticles(delta) {
    particles.forEach(particleObj => {
        const positions = particleObj.geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
            // 更新位置
            positions[i * 3] += particleObj.velocities[i].x;
            positions[i * 3 + 1] += particleObj.velocities[i].y;
            positions[i * 3 + 2] += particleObj.velocities[i].z;
            
            // 如果是爆发粒子，减少生命值
            if (particleObj.life !== undefined) {
                particleObj.life -= delta;
                if (particleObj.life <= 0) {
                    particleObj.material.opacity = 0;
                } else {
                    particleObj.material.opacity = particleObj.life * 0.8;
                }
            }
            
            // 如果是围绕R的粒子，让它们围绕中心旋转
            if (particleObj === particles[0]) {
                // 计算到中心的距离和角度
                const x = positions[i * 3];
                const y = positions[i * 3 + 1];
                const distance = Math.sqrt(x*x + y*y);
                let angle = Math.atan2(y, x);
                
                // 增加角度，使粒子围绕中心旋转
                angle += 0.01;
                
                // 更新位置
                positions[i * 3] = Math.cos(angle) * distance;
                positions[i * 3 + 1] = Math.sin(angle) * distance;
            }
            
            // 如果是背景粒子，检查边界
            if (particleObj === particles[1]) {
                // 如果超出边界，从另一侧重新进入
                if (positions[i * 3] > 20) positions[i * 3] = -20;
                if (positions[i * 3] < -20) positions[i * 3] = 20;
                if (positions[i * 3 + 1] > 15) positions[i * 3 + 1] = -15;
                if (positions[i * 3 + 1] < -15) positions[i * 3 + 1] = 15;
            }
        }
        
        particleObj.geometry.attributes.position.needsUpdate = true;
    });
}

// 更新灯光
function updateLights(time) {
    if (lights.length >= 2) {
        // 移动第一个聚光灯
        lights[0].position.x = Math.sin(time * 0.5) * 15;
        lights[0].position.y = Math.cos(time * 0.7) * 10;
        
        // 移动第二个聚光灯
        lights[1].position.x = Math.cos(time * 0.3) * 10;
        lights[1].position.y = Math.sin(time * 0.5) * 15;
    }
}

// 更新相机
function updateCamera(time) {
    // 小幅度摇摆
    camera.position.x = Math.sin(time * 0.5) * 0.5;
    camera.position.y = Math.cos(time * 0.7) * 0.3;
    camera.lookAt(scene.position);
}

// 更新R的呼吸效果
function updateRMesh(time) {
    if (rMesh) {
        // 呼吸缩放效果
        const scale = 1 + Math.sin(time * 2) * 0.05;
        rMesh.scale.set(scale, scale, scale);
        
        // 轻微旋转
        rMesh.rotation.y = Math.sin(time * 0.5) * 0.1;
    }
}

// 动画循环
function animate() {
    if (!isAnimating) return;
    
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
    // 更新粒子
    updateParticles(delta);
    
    // 更新灯光
    updateLights(time);
    
    // 更新相机
    updateCamera(time);
    
    // 更新R的呼吸效果
    updateRMesh(time);
    
    // 渲染场景
    renderer.render(scene, camera);
}

// 导出初始化函数
window.init3DTitle = init3DTitle;
