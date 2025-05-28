// 头文字R - 2D标题效果
// 使用纯CSS和JavaScript实现2D标题效果，包括动画和交互

// 主要变量
let titleContainer;
let headTextDiv;
let rTextDiv;
let isAnimating = true;
let animationFrame;

// 初始化函数
function init2DTitle() {
    titleContainer = document.getElementById('title-container');
    if (!titleContainer) return;
    
    // 清空容器
    titleContainer.innerHTML = '';
    
    // 创建标题元素
    createTitleElements();
    
    // 开始动画循环
    startAnimation();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', onWindowResize);
}

// 创建标题元素
function createTitleElements() {
    // 创建容器
    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'title-wrapper';
    
    // 创建"头文字"元素
    headTextDiv = document.createElement('div');
    headTextDiv.className = 'head-text';
    headTextDiv.textContent = '头文字';
    titleWrapper.appendChild(headTextDiv);
    
    // 创建"R"元素
    rTextDiv = document.createElement('div');
    rTextDiv.className = 'r-text';
    rTextDiv.textContent = 'R';
    titleWrapper.appendChild(rTextDiv);
    
    // 添加到容器
    titleContainer.appendChild(titleWrapper);
}

// 窗口大小变化时调整
function onWindowResize() {
    // 可以添加响应式调整逻辑
}

// 开始动画循环
function startAnimation() {
    if (!isAnimating) return;
    
    // 使用requestAnimationFrame实现平滑动画
    animationFrame = requestAnimationFrame(startAnimation);
    
    // 更新R的心跳效果
    updateRHeartbeat();
}

// 停止动画
function stopAnimation() {
    isAnimating = false;
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
}

// 更新R的心跳效果
function updateRHeartbeat() {
    if (!rTextDiv) return;
    
    // 使用CSS变量控制心跳动画
    // 实际的动画在CSS中定义
}

// 导出初始化函数
window.init2DTitle = init2DTitle;
