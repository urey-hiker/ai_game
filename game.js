// 游戏配置
const gameConfig = {
    // 颜色-文字映射
    textMap: { '红': 'red', '黄': 'yellow', '蓝': 'blue', '绿': 'green', '紫': 'purple', '粉': 'pink' },


    // 连击奖励配置
    comboRewards: {
        5: { type: 'doubleScore', duration: 3000, message: '双倍分数！' },
        10: { type: 'extraTime', value: 2, message: '+2秒时间！' },
        15: { type: 'immunity', value: 1, message: '错误免疫！' }
    },

    // 成就配置
    achievements: [
        { id: 'combo-master', name: '连击王者', description: '单次达成15连击', icon: 'combo-master.png', condition: player => player.maxCombo >= 15 },
        { id: 'speed-runner', name: '速通达人', description: '1分钟内通关3关', icon: 'speed-runner.png', condition: player => player.clearedLevels >= 3 && player.totalTime <= 60 },
        { id: 'persistent', name: '不屈战神', description: '连续错误5次仍通关', icon: 'persistent.png', condition: player => player.consecutiveErrors >= 5 && player.clearedLevels > 0 }
    ]
};

// 游戏状态
window.gameState = {
    currentScreen: 'main-menu',
    score: 0,
    combo: 0,
    maxCombo: 0,
    time: 0,
    level: 1,
    clearedLevels: 0,
    totalTime: 0,
    consecutiveErrors: 0,
    doubleScoreActive: false,
    immunityActive: false,
    unlockedAchievements: [],
    currentCorrectOption: null, // 用于基础难度下保存当前正确选项
    debugMode: false, // 调试模式开关
    totalClicks: 0, // 总点击次数
    correctClicks: 0, // 正确点击次数
    clickTimes: [], // 记录每次正确点击的时间
    lastClickTime: 0, // 上次点击的时间戳
    dynamicDifficulty: { // 动态难度设置
        currentColors: ['red', 'yellow', 'blue'], // 当前使用的颜色
        currentTexts: ['红', '黄', '蓝'], // 当前使用的文字
        optionsCount: 4, // 当前选项数量
        nextLevelThreshold: 70 // 下一级难度的分数阈值
    }
};

// DOM元素引用
const elements = {
    screens: {
        mainMenu: document.getElementById('main-menu'),
        rules: document.getElementById('rules-screen'),
        achievements: document.getElementById('achievements-screen'),
        game: document.getElementById('game-screen'),
        result: document.getElementById('result-screen')
    },
    buttons: {
        startGame: document.getElementById('start-game'),
        showRules: document.getElementById('show-rules'),
        showAchievements: document.getElementById('show-achievements'),
        backFromRules: document.getElementById('back-from-rules'),
        backFromAchievements: document.getElementById('back-from-achievements'),
        playAgain: document.getElementById('play-again'),
        shareResult: document.getElementById('share-result'),
        backToMenu: document.getElementById('back-to-menu')
    },
    game: {
        score: document.getElementById('score'),
        combo: document.getElementById('combo'),
        time: document.getElementById('time'),
        level: document.getElementById('level'),
        promptContainer: document.getElementById('prompt-container'),
        optionsContainer: document.getElementById('options-container'),
        countdown: document.getElementById('countdown'),
        countdownNumber: document.querySelector('.countdown-number'),
        comboIndicator: document.getElementById('combo-indicator'),
        comboNumber: document.querySelector('.combo-number')
    },
    result: {
        finalScore: document.getElementById('final-score'),
        maxCombo: document.getElementById('max-combo'),
        clearedLevels: document.getElementById('cleared-levels'),
        accuracy: document.getElementById('accuracy'),
        fastestTime: document.getElementById('fastest-time'),
        averageTime: document.getElementById('average-time'),
        unlockedContainer: document.getElementById('unlocked-container')
    },
    sounds: {
        click: document.getElementById('click-sound'),
        correct: document.getElementById('correct-sound'),
        wrong: document.getElementById('wrong-sound'),
        combo: document.getElementById('combo-sound'),
        levelUp: document.getElementById('level-up-sound'),
        win: document.getElementById('win-sound'),
        bgm: document.getElementById('bgm-sound'),
        home: document.getElementById('home-sound'),
        // 连击欢呼音效
        yay1: document.getElementById('yay1-sound'),
        yay2: document.getElementById('yay2-sound'),
        yay3: document.getElementById('yay3-sound'),
        yay4: document.getElementById('yay4-sound'),
        // 快速反应音效
        nioce: document.getElementById('nioce-sound')
    }
};

// 初始化游戏
function initGame() {
    loadSavedData();
    setupEventListeners();
    setupDebugMode();
    renderAchievements();

    // 初始化2D标题
    if (typeof window.init2DTitle === 'function') {
        window.init2DTitle();
    }

    // 设置点击继续功能
    setupClickToContinue();

    // 显示主菜单（但菜单选项隐藏，等待点击）
    showScreen('mainMenu');
}

// 设置点击继续功能
function setupClickToContinue() {
    const clickOverlay = document.getElementById('click-to-continue');
    const menuOptions = document.querySelector('.menu-options');

    if (clickOverlay) {
        clickOverlay.addEventListener('click', function () {
            // 播放主菜单音乐
            playHomeMusic();

            // 显示菜单选项
            menuOptions.style.display = 'flex';

            // 隐藏点击提示层
            clickOverlay.style.display = 'none';
        });
    }
}

// 设置调试模式
function setupDebugMode() {
    // 添加键盘事件监听器，按下Ctrl+D切换调试模式
    document.addEventListener('keydown', function (event) {
        // 检测Ctrl+D组合键
        if (event.ctrlKey && event.key === 'd') {
            // 阻止默认行为（浏览器的书签功能）
            event.preventDefault();

            // 切换调试模式
            gameState.debugMode = !gameState.debugMode;

            // 显示调试模式状态
            const message = gameState.debugMode ? '调试模式已开启！所有点击都将视为正确' : '调试模式已关闭';
            showDebugMessage(message);

            console.log('Debug mode:', gameState.debugMode);
        }
    });
}

// 显示调试信息
function showDebugMessage(message) {
    const debugMessage = document.createElement('div');
    debugMessage.className = 'debug-message';
    debugMessage.textContent = message;

    document.body.appendChild(debugMessage);

    // 2秒后移除消息
    setTimeout(() => {
        debugMessage.classList.add('fade-out');
        setTimeout(() => {
            debugMessage.remove();
        }, 500);
    }, 1500);
}

// 导出调试消息函数，供其他模块使用
window.showDebugMessage = showDebugMessage;

// 加载保存的游戏数据
function loadSavedData() {
    const savedData = localStorage.getItem('colorWordGame');
    if (savedData) {
        const data = JSON.parse(savedData);
        gameState.unlockedAchievements = data.unlockedAchievements || [];
        gameState.maxCombo = data.maxCombo || 0;
        gameState.clearedLevels = data.clearedLevels || 0;
    }
}

// 保存游戏数据
function saveGameData() {
    const dataToSave = {
        unlockedAchievements: gameState.unlockedAchievements,
        maxCombo: gameState.maxCombo,
        clearedLevels: gameState.clearedLevels
    };
    localStorage.setItem('colorWordGame', JSON.stringify(dataToSave));
}

// 设置事件监听器
function setupEventListeners() {
    // 主菜单按钮
    elements.buttons.startGame.addEventListener('click', () => {
        elements.sounds.click.play();
        // 直接开始游戏，不再显示难度选择界面
        startGame();
    });
    elements.buttons.showRules.addEventListener('click', () => {
        elements.sounds.click.play();
        showScreen('rules');
    });
    elements.buttons.showAchievements.addEventListener('click', () => {
        elements.sounds.click.play();
        showScreen('achievements');
    });

    // 返回按钮
    elements.buttons.backFromRules.addEventListener('click', () => {
        elements.sounds.click.play();
        showScreen('mainMenu');
    });
    elements.buttons.backFromAchievements.addEventListener('click', () => {
        elements.sounds.click.play();
        showScreen('mainMenu');
    });
    //     elements.sounds.click.play();
    //     showScreen('mainMenu');
    // });

    // 结果界面按钮
    elements.buttons.playAgain.addEventListener('click', () => {
        elements.sounds.click.play();
        // 直接开始游戏，不再显示难度选择界面
        startGame();
    });
    elements.buttons.backToMenu.addEventListener('click', () => {
        elements.sounds.click.play();
        showScreen('mainMenu');
    });
    elements.buttons.shareResult.addEventListener('click', () => {
        elements.sounds.click.play();
        shareResult();
    });
}

// 更新难度按钮状态
function updateDifficultyButtons() {
    elements.buttons.difficultyOptions.medium.disabled = !gameState.unlockedDifficulties.includes('medium');
    elements.buttons.difficultyOptions.hard.disabled = !gameState.unlockedDifficulties.includes('hard');
}

// 显示指定屏幕
function showScreen(screenName) {
    // 停止任何可能正在运行的计时器
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }

    // 处理音乐切换
    if (screenName === 'game') {
        // 进入游戏屏幕，播放游戏背景音乐
        playBackgroundMusic();
    } else {
        // 任何非游戏屏幕，播放主菜单音乐
        playHomeMusic();
    }

    // 隐藏所有屏幕
    Object.values(elements.screens).forEach(screen => {
        screen.classList.remove('active');
    });

    // 显示指定屏幕
    elements.screens[screenName].classList.add('active');

    // 更新当前屏幕
    gameState.currentScreen = screenName;
}

// 开始游戏
function startGame() {
    // 重置游戏状态
    gameState.score = 0;
    gameState.combo = 0;
    gameState.level = 1;
    gameState.consecutiveErrors = 0;
    gameState.totalTime = 0;
    gameState.doubleScoreActive = false;
    gameState.immunityActive = false;

    // 重置统计数据
    gameState.totalClicks = 0;
    gameState.correctClicks = 0;
    gameState.clickTimes = [];
    gameState.lastClickTime = 0;

    // 重置动态难度
    gameState.dynamicDifficulty = {
        currentColors: ['red', 'yellow', 'blue'],
        currentTexts: ['红', '黄', '蓝'],
        optionsCount: 4,
        nextLevelThreshold: 70
    };

    // 设置初始时间
    gameState.time = 300; // 初始时间设置为30秒

    // 更新UI
    updateGameUI();

    // 重置连击指示器
    elements.game.comboIndicator.classList.remove('active');
    elements.game.comboIndicator.classList.remove('milestone');

    // 播放背景音乐
    playBackgroundMusic();

    // 显示游戏屏幕
    showScreen('game');

    // 开始倒计时
    startCountdown();
}

// 播放背景音乐
function playBackgroundMusic() {
    // 停止主菜单音乐
    elements.sounds.home.pause();
    elements.sounds.home.currentTime = 0;

    // 重置音乐到开头
    elements.sounds.bgm.currentTime = 0;
    // 设置音量
    elements.sounds.bgm.volume = 0.5;
    // 播放音乐
    elements.sounds.bgm.play().catch(error => {
        console.log('背景音乐播放失败:', error);
    });
}

// 停止背景音乐
function stopBackgroundMusic() {
    elements.sounds.bgm.pause();
    elements.sounds.bgm.currentTime = 0;
}

// 开始倒计时
function startCountdown() {
    let count = 3;
    elements.game.countdown.style.display = 'flex';
    elements.game.countdownNumber.textContent = count;

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            elements.game.countdownNumber.textContent = count;
        } else {
            clearInterval(countdownInterval);
            elements.game.countdown.style.display = 'none';
            startRound();
        }
    }, 1000);
}

// 开始一轮游戏
function startRound() {
    // 清空选项容器和提示容器
    elements.game.optionsContainer.innerHTML = '';
    elements.game.promptContainer.innerHTML = '';

    // 记录本轮开始时间
    gameState.lastClickTime = Date.now();

    // 使用动态难度生成游戏内容
    generateDynamicRound();

    // 开始计时器
    startTimer();
}

// 生成动态难度的一轮游戏
function generateDynamicRound() {
    // 根据当前级别生成选项
    const dynamicSettings = gameState.dynamicDifficulty;

    // 如果是第一关，只使用基础模式
    if (gameState.level === 1) {
        generateBasicRound();
    } else {
        // 第二关开始，随机选择玩法
        if (Math.random() < 0.5) {
            generateBasicRound();
        } else {
            generateAdvancedRound();
        }
    }
}

// 生成基础模式的一轮游戏
function generateBasicRound() {
    const dynamicSettings = gameState.dynamicDifficulty;

    // 1. 随机选择一个颜色和一个不同的文字
    const colorIndex = Math.floor(Math.random() * dynamicSettings.currentColors.length);
    let textIndex;
    do {
        textIndex = Math.floor(Math.random() * dynamicSettings.currentTexts.length);
    } while (gameConfig.textMap[dynamicSettings.currentTexts[textIndex]] === dynamicSettings.currentColors[colorIndex]);

    const targetColor = dynamicSettings.currentColors[colorIndex];
    const targetText = dynamicSettings.currentTexts[textIndex];

    // 2. 创建提示词，突出显示"对应"
    const prompt = document.createElement('div');
    prompt.innerHTML = `请点击<span class="highlight">"对应"</span>的字：${getColorName(targetColor)} 的 ${targetText}`;
    elements.game.promptContainer.appendChild(prompt);

    // 3. 创建正确选项
    const correctOption = createOptionButton(targetColor, targetText, false, 'basic');

    // 4. 创建错误选项
    const wrongOptions = [];
    for (let i = 0; i < dynamicSettings.optionsCount - 1; i++) {
        let wrongColor, wrongText;

        // 确保错误选项与正确选项不同
        do {
            // 生成颜色相同但文字不同的选项，或文字相同但颜色不同的选项
            wrongText = dynamicSettings.currentTexts[Math.floor(Math.random() * (dynamicSettings.currentTexts.length))];
            wrongColor = dynamicSettings.currentColors[Math.floor(Math.random() * (dynamicSettings.currentColors.length))];
            // 确保这个错误选项不符合"颜色≠文字"的正确条件
        } while (wrongColor == targetColor && wrongText == targetText);

        wrongOptions.push(createOptionButton(wrongColor, wrongText, false, 'basic'));
    }

    // 5. 随机排列所有选项
    const allOptions = [correctOption, ...wrongOptions];
    shuffleArray(allOptions);

    // 6. 添加到容器
    elements.game.optionsContainer.innerHTML = ''; // 清空容器

    // 根据选项数量调整容器的列数
    adjustOptionsContainerColumns(dynamicSettings.optionsCount);

    // 添加选项到容器
    allOptions.forEach(option => {
        elements.game.optionsContainer.appendChild(option);
    });

    // 保存当前正确选项信息，用于判断
    gameState.currentCorrectOption = {
        color: targetColor,
        text: targetText,
        mode: 'basic'
    };
}

// 生成高级模式的一轮游戏
function generateAdvancedRound() {
    const dynamicSettings = gameState.dynamicDifficulty;

    // 清空选项容器
    elements.game.optionsContainer.innerHTML = '';

    // 创建提示词，突出显示"不同"
    const prompt = document.createElement('div');
    prompt.innerHTML = `点击颜色与文字<span class="highlight">"不同"</span>的选项`;
    elements.game.promptContainer.appendChild(prompt);

    // 生成选项
    const options = [];
    let hasCorrectOption = false;

    // 确保至少有一个正确选项（颜色≠文字）
    for (let i = 0; i < dynamicSettings.optionsCount; i++) {
        let color, text, isDistractor = false;

        // 最后一个选项，如果还没有正确选项，强制生成一个
        if (i === dynamicSettings.optionsCount - 1 && !hasCorrectOption) {
            // 强制生成一个正确选项（颜色≠文字）
            do {
                color = dynamicSettings.currentColors[Math.floor(Math.random() * dynamicSettings.currentColors.length)];
                text = dynamicSettings.currentTexts[Math.floor(Math.random() * dynamicSettings.currentTexts.length)];
            } while (color === gameConfig.textMap[text]);
            hasCorrectOption = true;
        } else {
            // 随机生成选项，有50%概率是正确的（颜色≠文字）
            if (Math.random() < 0.5 && !hasCorrectOption) {
                // 生成正确选项（颜色≠文字）
                do {
                    color = dynamicSettings.currentColors[Math.floor(Math.random() * dynamicSettings.currentColors.length)];
                    text = dynamicSettings.currentTexts[Math.floor(Math.random() * dynamicSettings.currentTexts.length)];
                } while (color === gameConfig.textMap[text]);
                hasCorrectOption = true;
            } else {
                // 生成错误选项（颜色=文字）
                text = dynamicSettings.currentTexts[Math.floor(Math.random() * dynamicSettings.currentTexts.length)];
                color = gameConfig.textMap[text];
            }
        }

        options.push(createOptionButton(color, text, isDistractor, 'advanced'));
    }

    // 随机排列所有选项
    shuffleArray(options);

    // 根据选项数量调整容器的列数
    adjustOptionsContainerColumns(dynamicSettings.optionsCount);

    // 添加到容器
    options.forEach(option => {
        elements.game.optionsContainer.appendChild(option);
    });

    // 保存当前游戏模式
    gameState.currentCorrectOption = {
        mode: 'advanced'
    };
}

// 创建选项按钮

// 创建选项按钮
function createOptionButton(color, text, isDistractor, mode) {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.style.color = color;
    button.textContent = text;
    button.dataset.mode = mode; // 添加模式标记

    // 添加点击事件
    button.addEventListener('click', () => {
        handleButtonClick(button);
    });

    return button;
}

// 处理按钮点击
function handleButtonClick(button) {
    const mode = gameState.currentCorrectOption.mode;

    // 在调试模式下，所有点击都视为正确
    if (gameState.debugMode) {
        handleCorrectAnswer(button);
    } else {
        if (mode === 'basic') {
            handleBasicModeClick(button);
        } else {
            handleAdvancedModeClick(button);
        }
    }

    // 检查是否需要进入下一关
    checkLevelProgress();

    // 开始新一轮
    startRound();
}

// 处理基础模式的点击
function handleBasicModeClick(button) {
    const targetColor = button.style.color;
    const targetText = button.textContent;

    // 检查是否是正确选项
    if (targetColor === gameState.currentCorrectOption.color &&
        targetText === gameState.currentCorrectOption.text) {
        // 正确
        handleCorrectAnswer(button);
    } else {
        // 错误
        handleWrongAnswer(button);
    }
}

// 处理高级模式的点击
function handleAdvancedModeClick(button) {
    const targetColor = button.style.color;
    const targetText = button.textContent;

    if (targetColor === gameConfig.textMap[targetText]) {
        // 错误：颜色=文字
        handleWrongAnswer(button);
    } else {
        // 正确：颜色≠文字
        handleCorrectAnswer(button);
    }
}

// 获取颜色名称
function getColorName(color) {
    const colorNames = {
        'red': '红色',
        'yellow': '黄色',
        'blue': '蓝色',
        'green': '绿色',
        'purple': '紫色',
        'pink': '粉色'
    };
    return colorNames[color] || color;
}

// 打乱数组顺序
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 处理正确答案
function handleCorrectAnswer(button) {
    // 记录点击统计
    gameState.totalClicks++;
    gameState.correctClicks++;

    // 计算并记录反应时间
    const clickTime = Date.now();
    const reactionTime = (clickTime - gameState.lastClickTime) / 1000; // 转换为秒
    gameState.clickTimes.push(reactionTime);

    // 播放正确音效
    elements.sounds.correct.currentTime = 0;
    elements.sounds.correct.play();
    
    // 如果反应时间小于1.3秒，播放快速反应音效
    if (reactionTime < 1.3) {
        elements.sounds.nioce.currentTime = 0;
        elements.sounds.nioce.play();
        
        // 显示快速反应提示
        showFastReactionEffect(button);
    }

    // 显示正确提示
    // showFeedbackMessage('正确！', 'correct');

    // 高亮显示正确选项
    button.classList.add('correct');
    setTimeout(() => {
        button.classList.remove('correct');
    }, 800);

    // 增加分数
    const baseScore = 10;
    let scoreToAdd = gameState.doubleScoreActive ? baseScore * 2 : baseScore;
    gameState.score += scoreToAdd;

    // 显示得分特效
    showScoreEffect(button, `+${scoreToAdd}`);

    // 增加连击
    gameState.combo++;
    if (gameState.combo > gameState.maxCombo) {
        gameState.maxCombo = gameState.combo;
    }

    // 播放连击欢呼音效
    playComboYaySound(gameState.combo);

    // 显示连击效果
    showComboEffect(button);

    // 检查连击奖励
    checkComboRewards();

    // 重置连续错误计数
    gameState.consecutiveErrors = 0;

    // 更新UI
    updateGameUI();
}

// 处理错误答案
function handleWrongAnswer(button) {
    // 记录点击统计
    gameState.totalClicks++;

    // 如果有免疫，则不计错误
    if (gameState.immunityActive) {
        gameState.immunityActive = false;
        showBonusEffect('免疫生效！');
        return;
    }

    // 播放错误音效
    elements.sounds.wrong.currentTime = 0;
    elements.sounds.wrong.play();

    // 显示错误提示
    // showFeedbackMessage('错误！', 'wrong');

    // 显示错误特效
    showScoreEffect(button, '❌');

    // 高亮显示错误选项
    button.classList.add('wrong');
    setTimeout(() => {
        button.classList.remove('wrong');
    }, 800);

    // 添加抖动效果
    button.classList.add('shake');
    setTimeout(() => {
        button.classList.remove('shake');
    }, 500);

    // 重置连击
    gameState.combo = 0;

    // 增加连续错误计数
    gameState.consecutiveErrors++;

    // 减少时间
    gameState.time = Math.max(0, gameState.time - 1);

    // 更新UI
    updateGameUI();
}

// 显示反馈信息
function showFeedbackMessage(message, type) {
    const feedbackMessage = document.createElement('div');
    feedbackMessage.className = `feedback-message feedback-${type}`;
    feedbackMessage.textContent = message;

    elements.screens.game.appendChild(feedbackMessage);

    // 延迟移除元素
    setTimeout(() => {
        feedbackMessage.remove();
    }, 1000);
}

// 显示连击效果
function showComboEffect(button) {
    const comboEffect = document.createElement('div');
    comboEffect.className = 'combo-effect';
    comboEffect.textContent = `${gameState.combo}连击!`;
    comboEffect.style.left = `${button.offsetLeft + button.offsetWidth / 2}px`;
    comboEffect.style.top = `${button.offsetTop}px`;

    elements.game.optionsContainer.appendChild(comboEffect);

    setTimeout(() => {
        comboEffect.remove();
    }, 1000);
}

// 检查连击奖励
function checkComboRewards() {
    const comboMilestones = Object.keys(gameConfig.comboRewards).map(Number);

    for (const milestone of comboMilestones) {
        if (gameState.combo === milestone) {
            const reward = gameConfig.comboRewards[milestone];

            // 播放连击音效
            elements.sounds.combo.play();

            // 应用奖励效果
            applyComboReward(reward);

            // 显示奖励效果
            showBonusEffect(reward.message);

            break;
        }
    }
}

// 应用连击奖励
function applyComboReward(reward) {
    switch (reward.type) {
        case 'doubleScore':
            gameState.doubleScoreActive = true;
            setTimeout(() => {
                gameState.doubleScoreActive = false;
            }, reward.duration);
            break;

        case 'extraTime':
            gameState.time += reward.value;
            updateGameUI();
            break;

        case 'immunity':
            gameState.immunityActive = true;
            break;
    }
}

// 显示奖励效果
function showBonusEffect(message) {
    const bonusEffect = document.createElement('div');
    bonusEffect.className = 'bonus-effect';
    bonusEffect.textContent = message;

    elements.screens.game.appendChild(bonusEffect);

    setTimeout(() => {
        bonusEffect.remove();
    }, 2000);
}

// 开始计时器
function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    gameState.timerInterval = setInterval(() => {
        gameState.time -= 0.1;
        gameState.totalTime += 0.1;

        if (gameState.time <= 0) {
            clearInterval(gameState.timerInterval);
            endGame();
        }

        updateGameUI();
    }, 100);
}

// 检查关卡进度
function checkLevelProgress() {
    const dynamicSettings = gameState.dynamicDifficulty;
    const targetScore = dynamicSettings.nextLevelThreshold;

    if (gameState.score >= targetScore) {
        // 升级
        gameState.level++;
        gameState.clearedLevels++;

        // 播放升级音效
        elements.sounds.levelUp.play();

        // 增加时间奖励
        gameState.time += 5;

        // 增加难度
        increaseDifficulty();

        // 显示升级效果
        showBonusEffect(`升级到第${gameState.level}关！`);

        // 更新UI
        updateGameUI();
    }
}

// 增加游戏难度
function increaseDifficulty() {
    const dynamicSettings = gameState.dynamicDifficulty;

    // 根据当前关卡增加难度
    switch (gameState.level) {
        case 2:
            // 第2关：增加所有颜色，6个选项
            dynamicSettings.currentColors = ['red', 'yellow', 'blue', 'green'];
            dynamicSettings.currentTexts = ['红', '黄', '蓝', '绿'];
            dynamicSettings.optionsCount = 6;
            dynamicSettings.nextLevelThreshold = 150;
            break;
        case 3:
            // 第3关：9个选项
            dynamicSettings.currentColors = ['red', 'yellow', 'blue', 'green', 'purple', 'pink'];
            dynamicSettings.currentTexts = ['红', '黄', '蓝', '绿', '紫', '粉'];
            dynamicSettings.optionsCount = 9;
            dynamicSettings.nextLevelThreshold = 240;
            break;
        default:
            // 已经是最高关卡，只增加分数阈值
            dynamicSettings.nextLevelThreshold += 100;
            break;
    }
}

// 更新游戏UI
function updateGameUI() {
    elements.game.score.textContent = gameState.score;
    elements.game.combo.textContent = gameState.combo;
    elements.game.time.textContent = Math.max(0, Math.floor(gameState.time * 10) / 10).toFixed(1);
    elements.game.level.textContent = gameState.level;

    // 更新连击指示器
    updateComboIndicator();
}

// 更新连击指示器
function updateComboIndicator() {
    // 更新连击数字
    elements.game.comboNumber.textContent = gameState.combo;

    // 显示/隐藏连击指示器
    if (gameState.combo > 0) {
        elements.game.comboIndicator.classList.add('active');
    } else {
        elements.game.comboIndicator.classList.remove('active');
        elements.game.comboIndicator.classList.remove('milestone');
    }

    // 检查是否达到连击里程碑
    const comboMilestones = Object.keys(gameConfig.comboRewards).map(Number);
    const isAtMilestone = comboMilestones.some(milestone =>
        gameState.combo > 0 && gameState.combo % milestone === 0
    );

    if (isAtMilestone) {
        elements.game.comboIndicator.classList.add('milestone');
    } else {
        elements.game.comboIndicator.classList.remove('milestone');
    }
}

// 结束游戏
function endGame() {
    // 停止计时器
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }

    // 停止背景音乐
    stopBackgroundMusic();

    // 播放游戏结束音效
    elements.sounds.win.play();

    // 检查成就
    checkAchievements();

    // 保存游戏数据
    saveGameData();

    // 更新结果界面
    updateResultScreen();

    // 显示结果界面
    showScreen('result');
}

// 检查成就
function checkAchievements() {
    const player = {
        maxCombo: gameState.maxCombo,
        clearedLevels: gameState.clearedLevels,
        totalTime: gameState.totalTime,
        consecutiveErrors: gameState.consecutiveErrors
    };

    gameConfig.achievements.forEach(achievement => {
        if (!gameState.unlockedAchievements.includes(achievement.id) && achievement.condition(player)) {
            gameState.unlockedAchievements.push(achievement.id);
            showUnlockNotification(`解锁成就：${achievement.name}！`);
        }
    });
}

// 显示解锁通知
function showUnlockNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = 'unlocked-item';

    elements.result.unlockedContainer.appendChild(notification);
}

// 更新结果界面
function updateResultScreen() {
    // 更新结果数据
    elements.result.finalScore.textContent = gameState.score;
    elements.result.maxCombo.textContent = gameState.maxCombo;
    elements.result.clearedLevels.textContent = gameState.clearedLevels;
    elements.result.unlockedContainer.innerHTML = '';

    // 计算并显示正确率
    const accuracy = gameState.totalClicks > 0
        ? Math.round((gameState.correctClicks / gameState.totalClicks) * 100)
        : 0;
    elements.result.accuracy.textContent = `${accuracy}%`;

    // 计算并显示最快反应时间
    let fastestTime = gameState.clickTimes.length > 0
        ? Math.min(...gameState.clickTimes).toFixed(2)
        : "0.00";
    elements.result.fastestTime.textContent = fastestTime;

    // 计算并显示平均反应时间
    let averageTime = "0.00";
    if (gameState.clickTimes.length > 0) {
        const sum = gameState.clickTimes.reduce((a, b) => a + b, 0);
        averageTime = (sum / gameState.clickTimes.length).toFixed(2);
    }
    elements.result.averageTime.textContent = averageTime;

    // 获取结果按钮容器
    const resultButtons = document.querySelector('.result-buttons');

    // 先隐藏按钮
    resultButtons.classList.remove('show');

    // 1秒后显示按钮
    setTimeout(() => {
        resultButtons.classList.add('show');
    }, 1000);
}

// 渲染成就列表
function renderAchievements() {
    const achievementsContainer = document.querySelector('.achievements-list');
    achievementsContainer.innerHTML = '';

    gameConfig.achievements.forEach(achievement => {
        const isUnlocked = gameState.unlockedAchievements.includes(achievement.id);

        const achievementElement = document.createElement('div');
        achievementElement.className = `achievement-item ${isUnlocked ? '' : 'achievement-locked'}`;

        achievementElement.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <h3>${achievement.name}</h3>
            <p>${achievement.description}</p>
        `;

        achievementsContainer.appendChild(achievementElement);
    });
}

// 分享结果
function shareResult() {
    // 计算正确率和平均反应时间
    const accuracy = gameState.totalClicks > 0
        ? Math.round((gameState.correctClicks / gameState.totalClicks) * 100)
        : 0;

    let averageTime = "0.00";
    if (gameState.clickTimes.length > 0) {
        const sum = gameState.clickTimes.reduce((a, b) => a + b, 0);
        averageTime = (sum / gameState.clickTimes.length).toFixed(2);
    }

    // 创建分享文本
    const shareText = `我在《头文字R》中获得了${gameState.score}分，最高连击${gameState.maxCombo}次，通过了${gameState.clearedLevels}关！正确率${accuracy}%，平均反应时间${averageTime}秒。来挑战我吧！`;

    // 尝试使用Web Share API
    if (navigator.share) {
        navigator.share({
            title: '头文字R',
            text: shareText,
            url: window.location.href
        }).catch(err => {
            console.error('分享失败:', err);
            alert(shareText);
        });
    } else {
        // 回退方案：复制到剪贴板
        navigator.clipboard.writeText(shareText).then(() => {
            alert('分享文本已复制到剪贴板！');
        }).catch(() => {
            alert(shareText);
        });
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', initGame);
// 根据选项数量调整容器的列数
function adjustOptionsContainerColumns(optionsCount) {
    const container = elements.game.optionsContainer;
    const isMobile = window.innerWidth <= 500;

    // 根据选项数量设置合适的列数
    let columns;
    switch (optionsCount) {
        case 4:
            columns = 2; // 始终使用2x2布局
            break;
        case 6:
            columns = isMobile ? 2 : 3; // 移动端2x3布局，桌面端3x2布局
            break;
        case 9:
            columns = 3; // 3x3布局
            break;
        default:
            columns = Math.ceil(Math.sqrt(optionsCount)); // 默认尽量接近正方形布局
    }

    // 设置列数和列宽
    const columnWidth = isMobile ? 70 : 80;
    container.style.gridTemplateColumns = `repeat(${columns}, ${columnWidth}px)`;
}

// 显示得分特效
function showScoreEffect(button, score) {
    // 创建得分特效元素
    const scoreEffect = document.createElement('div');
    scoreEffect.className = 'score-effect';

    // 如果是错误特效，添加wrong类
    if (score === '❌') {
        scoreEffect.classList.add('wrong');
    }

    scoreEffect.textContent = score;

    // 计算初始位置（按钮中心）
    const buttonRect = button.getBoundingClientRect();
    const gameRect = elements.screens.game.getBoundingClientRect();

    // 设置初始位置（相对于游戏容器）
    const left = buttonRect.left - gameRect.left + buttonRect.width / 2;
    const top = buttonRect.top - gameRect.top + buttonRect.height / 2;

    scoreEffect.style.left = `${left}px`;
    scoreEffect.style.top = `${top}px`;

    // 物理参数
    const physics = {
        x: 0,
        y: 0,
        vx: (Math.random() - 0.5) * 10, // 随机水平速度
        vy: -Math.random() * 15 - 5,   // 随机向上的初始速度
        gravity: score === '❌' ? 0.8 : 0.5,                   // 重力加速度
        friction: 0.99                  // 摩擦力
    };

    // 添加到游戏容器
    elements.screens.game.appendChild(scoreEffect);
    scoreEffect.style.transform = 'translate(0, 0)';

    // 使用requestAnimationFrame实现平滑动画
    let opacity = 1;
    let animationId;

    function animate() {
        // 更新速度和位置
        physics.vy += physics.gravity;  // 应用重力
        physics.vx *= physics.friction; // 应用摩擦力
        physics.x += physics.vx;
        physics.y += physics.vy;

        // 更新元素位置
        scoreEffect.style.transform = `translate(${physics.x}px, ${physics.y}px)`;

        // 逐渐降低透明度
        opacity -= 0.01;
        if (opacity > 0) {
            scoreEffect.style.opacity = opacity;
        }

        // 检查是否已经离开屏幕或完全透明
        if (opacity > 0 &&
            top + physics.y < gameRect.height + 100 &&
            left + physics.x > -100 &&
            left + physics.x < gameRect.width + 100) {
            animationId = requestAnimationFrame(animate);
        } else {
            scoreEffect.remove();
            cancelAnimationFrame(animationId);
        }
    }

    // 开始动画
    animationId = requestAnimationFrame(animate);
}
// 播放主菜单音乐
function playHomeMusic() {
    // 如果主菜单音乐已经在播放，则不需要重新开始
    if (!elements.sounds.home.paused) {
        return;
    }

    // 停止游戏背景音乐（如果正在播放）
    elements.sounds.bgm.pause();
    elements.sounds.bgm.currentTime = 0;

    // 重置主菜单音乐到开头
    elements.sounds.home.currentTime = 0;
    // 设置音量
    elements.sounds.home.volume = 0.4;
    // 设置循环播放
    elements.sounds.home.loop = true;
    // 播放音乐
    elements.sounds.home.play().catch(error => {
        console.log('主菜单音乐播放失败，等待用户交互后再播放:', error);
    });
}
// 播放连击欢呼音效
function playComboYaySound(comboCount) {
    // 连击数小于2时不播放
    if (comboCount < 2) return;

    // 连击数为5时播放特殊音效
    if (comboCount === 5) {
        elements.sounds.yay4.currentTime = 0;
        elements.sounds.yay4.play();
        return;
    }

    // 其他连击数随机播放普通欢呼音效
    if (comboCount == 2 || Math.random() < 0.5) {
        const randomYay = Math.floor(Math.random() * 3) + 1; // 1-3之间的随机数
        const yaySound = elements.sounds[`yay${randomYay}`];

        if (yaySound) {
            yaySound.currentTime = 0;
            yaySound.play();
        }
    }
}
// 显示快速反应效果
function showFastReactionEffect(button) {
    // 创建快速反应提示元素
    const fastReactionEffect = document.createElement('div');
    fastReactionEffect.className = 'fast-reaction-effect';
    fastReactionEffect.textContent = '反应神速！';
    
    // 设置初始位置（相对于按钮）
    const buttonRect = button.getBoundingClientRect();
    fastReactionEffect.style.left = `${buttonRect.left + buttonRect.width / 2}px`;
    fastReactionEffect.style.top = `${buttonRect.top - 20}px`;
    
    // 添加到文档
    document.body.appendChild(fastReactionEffect);
    
    // 添加动画类
    setTimeout(() => {
        fastReactionEffect.classList.add('animate');
    }, 10);
    
    // 动画结束后移除元素
    setTimeout(() => {
        fastReactionEffect.remove();
    }, 1500);
}
