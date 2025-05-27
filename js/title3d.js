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
let headTextDiv;

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
    camera.position.z = 25; // 增加相机距离，确保心跳时R不会超出视野
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(titleContainer.clientWidth, titleContainer.clientHeight);
    renderer.setClearColor(0x000000, 0); // 透明背景
    titleContainer.appendChild(renderer.domElement);
    
    // 添加灯光
    addLights();
    
    // 创建标题元素
    createTitleElements();
    
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
    fallbackTitle.innerHTML = '<span class="head-text">头文字</span><span class="r-text">R</span>';
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
    
    // 只用Three.js渲染"R"字母
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
        // 创建3D的"R"
        const rGeometry = new THREE.TextGeometry('R', {
            font: font,
            size: 9, // 进一步增大字体大小
            height: 5, // 厚度≥5单位
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.5,
            bevelSize: 0.3,
            bevelSegments: 5
        });
        
        const rMaterial = new THREE.MeshPhongMaterial({
            color: 0xffa07a, // 低饱和橙红
            shininess: 100,
            specular: 0xffffff,
            emissive: 0xff3300,
            emissiveIntensity: 0.5
        });
        
        rMesh = new THREE.Mesh(rGeometry, rMaterial);
        rGeometry.computeBoundingBox();
        const rWidth = rGeometry.boundingBox.max.x - rGeometry.boundingBox.min.x;
        // 将R放在中心位置偏右
        rMesh.position.set(5, 0, 2); // 增加z值使R在头文字上层
        scene.add(rMesh);
    });
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

// 更新R的心跳效果
function updateRMesh(time) {
    if (rMesh) {
        // 生成心跳效果
        // 使用正弦函数模拟心跳
        const heartbeatSpeed = 1.2; // 心跳速度，较慢以确保不会超出视野
        
        // 计算心跳曲线
        const heartbeatPhase = ((time * heartbeatSpeed) % 1);
        let heartbeatScale;
        
        if (heartbeatPhase < 0.1) {
            // 快速上升阶段 (收缩期)
            heartbeatScale = 1 + (heartbeatPhase / 0.1) * 0.08; // 减小最大缩放比例
        } else if (heartbeatPhase < 0.2) {
            // 快速下降阶段
            heartbeatScale = 1.08 - ((heartbeatPhase - 0.1) / 0.1) * 0.05;
        } else if (heartbeatPhase < 0.3) {
            // 二次小幅上升 (舒张期)
            heartbeatScale = 1.03 + ((heartbeatPhase - 0.2) / 0.1) * 0.02;
        } else {
            // 缓慢恢复到正常大小
            heartbeatScale = 1.05 - ((heartbeatPhase - 0.3) / 0.7) * 0.05;
        }
        
        // 应用心跳缩放效果
        rMesh.scale.set(heartbeatScale, heartbeatScale, heartbeatScale);
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
    
    // 更新R的心跳效果
    updateRMesh(time);
    
    // 渲染场景
    renderer.render(scene, camera);
}

// 导出初始化函数
window.init3DTitle = init3DTitle;
