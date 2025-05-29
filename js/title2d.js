// 头文字R - 2D标题效果
// 使用纯CSS和JavaScript实现2D标题效果，包括动画和交互

// 主要变量
let titleContainer;
let headTextDiv;
let rTextDiv;
let isAnimating = true;
let animationFrame;
let rClickCount = 0; // 记录R被点击的次数
let rClickTimer = null; // 用于重置点击计数的定时器

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
    headTextDiv.innerHTML = '<em>头文字</em>';
    titleWrapper.appendChild(headTextDiv);
    
    // 创建"R"元素
    rTextDiv = document.createElement('div');
    rTextDiv.className = 'r-text';
    rTextDiv.textContent = 'R';
    
    // 添加R的点击事件，用于触发调试模式
    rTextDiv.addEventListener('click', handleRClick);
    
    titleWrapper.appendChild(rTextDiv);
    
    // 添加到容器
    titleContainer.appendChild(titleWrapper);
    
    // 调整标题大小以适应屏幕
    adjustTitleSize();
}

// 处理R的点击事件
function handleRClick() {
    // 播放点击音效
    const clickSound = document.getElementById('click-sound');
    if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.play();
    }
    
    // 增加点击计数
    rClickCount++;
    
    // 清除之前的定时器
    if (rClickTimer) {
        clearTimeout(rClickTimer);
    }
    
    // 设置新的定时器，3秒后重置点击计数
    rClickTimer = setTimeout(() => {
        rClickCount = 0;
    }, 3000);
    
    // 检查是否达到5次点击
    if (rClickCount >= 5) {
        // 重置点击计数
        rClickCount = 0;
        
        // 调用game.js中的调试模式切换功能
        toggleGameDebugMode();
    }
}

// 调用game.js中的调试模式切换功能
function toggleGameDebugMode() {
    console.log("Attempting to toggle debug mode");
    
    // 检查gameState是否存在于window对象中
    if (typeof window.gameState === 'undefined') {
        console.error("gameState is not defined in window object");
        return;
    }
    
    // 切换调试模式
    window.gameState.debugMode = !window.gameState.debugMode;
    
    // 显示调试模式状态
    const message = window.gameState.debugMode ? '调试模式已开启！所有点击都将视为正确' : '调试模式已关闭';
    console.log(message);
    
    // 使用game.js中的showDebugMessage函数
    if (typeof window.showDebugMessage === 'function') {
        window.showDebugMessage(message);
    } else {
        // 如果showDebugMessage不可用，创建一个简单的消息显示
        const debugMsg = document.createElement('div');
        debugMsg.className = 'debug-message';
        debugMsg.textContent = message;
        document.body.appendChild(debugMsg);
        
        setTimeout(() => {
            debugMsg.classList.add('fade-out');
            setTimeout(() => {
                debugMsg.remove();
            }, 500);
        }, 1500);
    }
}

// 窗口大小变化时调整
function onWindowResize() {
    adjustTitleSize();
}

// 调整标题大小以适应屏幕宽度
function adjustTitleSize() {
    if (!headTextDiv || !rTextDiv || !titleContainer) return;
    
    const containerWidth = titleContainer.clientWidth;
    const containerHeight = titleContainer.clientHeight;
    const aspectRatio = containerWidth / containerHeight;
    
    // 基础字体大小，根据容器宽度动态计算
    const baseSize = Math.min(containerWidth * 0.2, 240); // 限制最大值
    
    // 设置"头文字"的字体大小
    headTextDiv.style.fontSize = `${baseSize}px`;
    
    // "R"的字体大小稍大一些
    rTextDiv.style.fontSize = `${baseSize * 2}px`;
    
    // 根据屏幕宽度调整标题容器的高度和边距
    if (containerWidth < 600) {
        // 移动设备
        titleContainer.style.height = '120px';
        titleContainer.style.marginTop = '10px';
    } else if (containerWidth < 1024) {
        // 平板设备
        titleContainer.style.height = '150px';
        titleContainer.style.marginTop = '20px';
    } else {
        // 桌面设备
        titleContainer.style.height = '180px';
        titleContainer.style.marginTop = '30px';
    }
    
    console.log(`调整标题大小: 容器宽度=${containerWidth}px, 基础字体大小=${baseSize}px`);
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
