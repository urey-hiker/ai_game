// 头文字R - 3D标题效果
// 使用Three.js实现3D标题效果，包括光影和交互

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
            specular: 0xffffff,
            emissive: 0xff3300,
            emissiveIntensity: 0.5
        });
        
        rMesh = new THREE.Mesh(rGeometry, rMaterial);
        rGeometry.computeBoundingBox();
        const rWidth = rGeometry.boundingBox.max.x - rGeometry.boundingBox.min.x;
        // 将R放在中心位置
        rMesh.position.set(0, 0, 0);
        scene.add(rMesh);
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
    
    // 点击"R"触发效果
    titleContainer.addEventListener('click', function(event) {
        if (!rMesh) return;
        
        const rect = titleContainer.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        
        const intersects = raycaster.intersectObject(rMesh);
        
        if (intersects.length > 0) {
            // 点击了R，触发闪烁效果
            triggerRFlash();
        }
    });
}

// 触发R的闪烁效果
function triggerRFlash() {
    if (!rMesh || !rMesh.material) return;
    
    // 保存原始颜色和发光强度
    const originalColor = rMesh.material.color.clone();
    const originalEmissive = rMesh.material.emissive.clone();
    const originalEmissiveIntensity = rMesh.material.emissiveIntensity;
    
    // 设置为明亮的白色
    rMesh.material.color.set(0xffffff);
    rMesh.material.emissive.set(0xffffff);
    rMesh.material.emissiveIntensity = 1.0;
    
    // 0.3秒后恢复
    setTimeout(() => {
        rMesh.material.color.copy(originalColor);
        rMesh.material.emissive.copy(originalEmissive);
        rMesh.material.emissiveIntensity = originalEmissiveIntensity;
    }, 300);
}

// 窗口大小变化时调整
function onWindowResize() {
    if (!camera || !renderer || !titleContainer) return;
    
    const aspect = titleContainer.clientWidth / titleContainer.clientHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    
    renderer.setSize(titleContainer.clientWidth, titleContainer.clientHeight);
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

// 更新R的呼吸和闪烁效果
function updateRMesh(time) {
    if (rMesh) {
        // 呼吸缩放效果
        const scale = 1 + Math.sin(time * 2) * 0.05;
        rMesh.scale.set(scale, scale, scale);
        
        // 轻微旋转
        rMesh.rotation.y = Math.sin(time * 0.5) * 0.1;
        
        // 跳动的闪烁效果
        const flashIntensity = 0.7 + Math.sin(time * 8) * 0.3; // 快速闪烁
        const jumpEffect = 1 + Math.abs(Math.sin(time * 3)) * 0.1; // 跳动效果
        
        // 应用闪烁效果到材质
        if (rMesh.material) {
            rMesh.material.emissiveIntensity = flashIntensity;
            rMesh.material.emissive = new THREE.Color(0xff3300);
            
            // 随机颜色变化
            if (Math.random() > 0.95) {
                const hue = Math.random() * 0.1 + 0.05; // 保持在橙红色范围内
                rMesh.material.color.setHSL(hue, 1, 0.5);
            }
        }
        
        // 应用跳动效果
        rMesh.position.y = Math.sin(time * 3) * 0.2; // 轻微上下跳动
    }
}

// 动画循环
function animate() {
    if (!isAnimating) return;
    
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
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
