// 游戏配置
const gameConfig = {
    // 颜色-文字映射
    textMap: { '红': 'red', '黄': 'yellow', '蓝': 'blue', '绿': 'green', '紫': 'purple', '粉': 'pink' },
    
    // 难度设置
    difficulties: {
        easy: {
            colors: ['red', 'yellow'],
            texts: ['红', '黄'],
            optionsCount: 3,
            timeLimit: 10,
            targetScore: 100
        },
        medium: {
            colors: ['red', 'yellow', 'blue', 'green'],
            texts: ['红', '黄', '蓝', '绿'],
            optionsCount: 5,
            timeLimit: 8,
            targetScore: 200
        },
        hard: {
            colors: ['red', 'yellow', 'blue', 'green', 'purple', 'pink'],
            texts: ['红', '黄', '蓝', '绿', '紫', '粉', '彩虹'], // 彩虹是干扰项
            optionsCount: 5,
            timeLimit: 5,
            targetScore: 300
        }
    },
    
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
const gameState = {
    currentScreen: 'main-menu',
    difficulty: 'easy',
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
    unlockedDifficulties: ['easy'],
    currentCorrectOption: null // 用于基础难度下保存当前正确选项
};

// DOM元素引用
const elements = {
    screens: {
        mainMenu: document.getElementById('main-menu'),
        rules: document.getElementById('rules-screen'),
        achievements: document.getElementById('achievements-screen'),
        difficulty: document.getElementById('difficulty-screen'),
        game: document.getElementById('game-screen'),
        result: document.getElementById('result-screen')
    },
    buttons: {
        startGame: document.getElementById('start-game'),
        showRules: document.getElementById('show-rules'),
        showAchievements: document.getElementById('show-achievements'),
        backFromRules: document.getElementById('back-from-rules'),
        backFromAchievements: document.getElementById('back-from-achievements'),
        backFromDifficulty: document.getElementById('back-from-difficulty'),
        playAgain: document.getElementById('play-again'),
        shareResult: document.getElementById('share-result'),
        backToMenu: document.getElementById('back-to-menu'),
        difficultyOptions: {
            easy: document.getElementById('easy'),
            medium: document.getElementById('medium'),
            hard: document.getElementById('hard')
        }
    },
    game: {
        score: document.getElementById('score'),
        combo: document.getElementById('combo'),
        time: document.getElementById('time'),
        level: document.getElementById('level'),
        promptContainer: document.getElementById('prompt-container'),
        optionsContainer: document.getElementById('options-container'),
        countdown: document.getElementById('countdown'),
        countdownNumber: document.querySelector('.countdown-number')
    },
    result: {
        finalScore: document.getElementById('final-score'),
        maxCombo: document.getElementById('max-combo'),
        clearedLevels: document.getElementById('cleared-levels'),
        unlockedContainer: document.getElementById('unlocked-container')
    },
    sounds: {
        correct: document.getElementById('correct-sound'),
        wrong: document.getElementById('wrong-sound'),
        combo: document.getElementById('combo-sound'),
        levelUp: document.getElementById('level-up-sound')
    }
};

// 初始化游戏
function initGame() {
    loadSavedData();
    setupEventListeners();
    updateDifficultyButtons();
    renderAchievements();
}

// 加载保存的游戏数据
function loadSavedData() {
    const savedData = localStorage.getItem('colorWordGame');
    if (savedData) {
        const data = JSON.parse(savedData);
        gameState.unlockedDifficulties = data.unlockedDifficulties || ['easy'];
        gameState.unlockedAchievements = data.unlockedAchievements || [];
        gameState.maxCombo = data.maxCombo || 0;
        gameState.clearedLevels = data.clearedLevels || 0;
    }
}

// 保存游戏数据
function saveGameData() {
    const dataToSave = {
        unlockedDifficulties: gameState.unlockedDifficulties,
        unlockedAchievements: gameState.unlockedAchievements,
        maxCombo: gameState.maxCombo,
        clearedLevels: gameState.clearedLevels
    };
    localStorage.setItem('colorWordGame', JSON.stringify(dataToSave));
}

// 设置事件监听器
function setupEventListeners() {
    // 主菜单按钮
    elements.buttons.startGame.addEventListener('click', () => showScreen('difficulty'));
    elements.buttons.showRules.addEventListener('click', () => showScreen('rules'));
    elements.buttons.showAchievements.addEventListener('click', () => showScreen('achievements'));
    
    // 返回按钮
    elements.buttons.backFromRules.addEventListener('click', () => showScreen('main-menu'));
    elements.buttons.backFromAchievements.addEventListener('click', () => showScreen('main-menu'));
    elements.buttons.backFromDifficulty.addEventListener('click', () => showScreen('main-menu'));
    
    // 难度选择按钮
    elements.buttons.difficultyOptions.easy.addEventListener('click', () => {
        gameState.difficulty = 'easy';
        startGame();
    });
    elements.buttons.difficultyOptions.medium.addEventListener('click', () => {
        gameState.difficulty = 'medium';
        startGame();
    });
    elements.buttons.difficultyOptions.hard.addEventListener('click', () => {
        gameState.difficulty = 'hard';
        startGame();
    });
    
    // 结果界面按钮
    elements.buttons.playAgain.addEventListener('click', () => showScreen('difficulty'));
    elements.buttons.backToMenu.addEventListener('click', () => showScreen('main-menu'));
    elements.buttons.shareResult.addEventListener('click', shareResult);
}

// 更新难度按钮状态
function updateDifficultyButtons() {
    elements.buttons.difficultyOptions.medium.disabled = !gameState.unlockedDifficulties.includes('medium');
    elements.buttons.difficultyOptions.hard.disabled = !gameState.unlockedDifficulties.includes('hard');
}

// 显示指定屏幕
function showScreen(screenName) {
    // 隐藏所有屏幕
    Object.values(elements.screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 显示指定屏幕
    elements.screens[screenName].classList.add('active');
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
    
    // 设置初始时间
    const difficultySettings = gameConfig.difficulties[gameState.difficulty];
    gameState.time = difficultySettings.timeLimit;
    
    // 更新UI
    updateGameUI();
    
    // 显示游戏屏幕
    showScreen('game');
    
    // 开始倒计时
    startCountdown();
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
    
    // 获取当前难度设置
    const difficultySettings = gameConfig.difficulties[gameState.difficulty];
    
    if (gameState.difficulty === 'easy') {
        // 基础难度：生成提示词和一个正确选项，其余为错误选项
        generateEasyModeRound(difficultySettings);
    } else {
        // 中级和高级难度：随机生成选项
        generateNormalModeRound(difficultySettings);
    }
    
    // 开始计时器
    startTimer();
}

// 生成基础难度的一轮游戏
function generateEasyModeRound(difficultySettings) {
    // 1. 随机选择一个颜色和一个不同的文字
    const colorIndex = Math.floor(Math.random() * difficultySettings.colors.length);
    let textIndex;
    do {
        textIndex = Math.floor(Math.random() * difficultySettings.texts.length);
    } while (gameConfig.textMap[difficultySettings.texts[textIndex]] === difficultySettings.colors[colorIndex]);
    
    const targetColor = difficultySettings.colors[colorIndex];
    const targetText = difficultySettings.texts[textIndex];
    
    // 2. 创建提示词
    const prompt = document.createElement('div');
    prompt.textContent = `请点击${getColorName(targetColor)}的"${targetText}"字`;
    elements.game.promptContainer.appendChild(prompt);
    
    // 3. 创建正确选项
    const correctOption = createOptionButton(targetColor, targetText, false);
    
    // 4. 创建错误选项
    const wrongOptions = [];
    for (let i = 0; i < difficultySettings.optionsCount - 1; i++) {
        let wrongColor, wrongText;
        
        // 确保错误选项与正确选项不同
        do {
            // 生成颜色相同但文字不同的选项，或文字相同但颜色不同的选项
            if (Math.random() < 0.5) {
                wrongColor = targetColor;
                do {
                    wrongText = difficultySettings.texts[Math.floor(Math.random() * difficultySettings.texts.length)];
                } while (wrongText === targetText);
            } else {
                do {
                    wrongColor = difficultySettings.colors[Math.floor(Math.random() * difficultySettings.colors.length)];
                } while (wrongColor === targetColor);
                wrongText = targetText;
            }
            
            // 确保这个错误选项不符合"颜色≠文字"的正确条件
        } while (wrongColor !== gameConfig.textMap[wrongText]);
        
        wrongOptions.push(createOptionButton(wrongColor, wrongText, false));
    }
    
    // 5. 随机排列所有选项
    const allOptions = [correctOption, ...wrongOptions];
    shuffleArray(allOptions);
    
    // 6. 添加到容器
    allOptions.forEach(option => {
        elements.game.optionsContainer.appendChild(option);
    });
    
    // 保存当前正确选项信息，用于判断
    gameState.currentCorrectOption = {
        color: targetColor,
        text: targetText
    };
}

// 生成普通模式的一轮游戏（中级和高级难度）
function generateNormalModeRound(difficultySettings) {
    // 清空选项容器
    elements.game.optionsContainer.innerHTML = '';
    
    // 生成选项
    for (let i = 0; i < difficultySettings.optionsCount; i++) {
        const option = generateOption(difficultySettings);
        elements.game.optionsContainer.appendChild(option);
    }
}

// 创建选项按钮
function createOptionButton(color, text, isDistractor) {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.style.color = color;
    button.textContent = text;
    
    // 添加点击事件
    button.addEventListener('click', () => {
        if (gameState.difficulty === 'easy') {
            handleEasyModeClick(button);
        } else {
            handleNormalModeClick(button, isDistractor);
        }
    });
    
    return button;
}

// 处理基础难度的点击
function handleEasyModeClick(button) {
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
    
    // 检查是否需要进入下一关
    checkLevelProgress();
    
    // 开始新一轮
    startRound();
}

// 处理普通模式的点击
function handleNormalModeClick(button, isDistractor) {
    const targetColor = button.style.color;
    const targetText = button.textContent;
    
    if (isDistractor || targetColor === gameConfig.textMap[targetText]) {
        // 错误：干扰项或颜色=文字
        handleWrongAnswer(button);
    } else {
        // 正确：颜色≠文字
        handleCorrectAnswer(button);
    }
    
    // 检查是否需要进入下一关
    checkLevelProgress();
    
    // 开始新一轮
    startRound();
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
    // 播放正确音效
    elements.sounds.correct.play();
    
    // 显示正确提示
    showFeedbackMessage('正确！', 'correct');
    
    // 高亮显示正确选项
    button.classList.add('correct');
    setTimeout(() => {
        button.classList.remove('correct');
    }, 800);
    
    // 增加分数
    const baseScore = 10;
    let scoreToAdd = gameState.doubleScoreActive ? baseScore * 2 : baseScore;
    gameState.score += scoreToAdd;
    
    // 增加连击
    gameState.combo++;
    if (gameState.combo > gameState.maxCombo) {
        gameState.maxCombo = gameState.combo;
    }
    
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
    // 如果有免疫，则不计错误
    if (gameState.immunityActive) {
        gameState.immunityActive = false;
        showBonusEffect('免疫生效！');
        return;
    }
    
    // 播放错误音效
    elements.sounds.wrong.play();
    
    // 显示错误提示
    showFeedbackMessage('错误！', 'wrong');
    
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
    gameState.time = Math.max(1, gameState.time - 1);
    
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
    const difficultySettings = gameConfig.difficulties[gameState.difficulty];
    const targetScore = difficultySettings.targetScore * gameState.level;
    
    if (gameState.score >= targetScore) {
        // 升级
        gameState.level++;
        gameState.clearedLevels++;
        
        // 播放升级音效
        elements.sounds.levelUp.play();
        
        // 增加时间奖励
        gameState.time += 3;
        
        // 显示升级效果
        showBonusEffect(`升级到第${gameState.level}关！`);
        
        // 更新UI
        updateGameUI();
    }
}

// 更新游戏UI
function updateGameUI() {
    elements.game.score.textContent = gameState.score;
    elements.game.combo.textContent = gameState.combo;
    elements.game.time.textContent = Math.max(0, Math.floor(gameState.time * 10) / 10).toFixed(1);
    elements.game.level.textContent = gameState.level;
}

// 结束游戏
function endGame() {
    // 停止计时器
    clearInterval(gameState.timerInterval);
    
    // 检查是否解锁新难度
    checkDifficultyUnlock();
    
    // 检查成就
    checkAchievements();
    
    // 保存游戏数据
    saveGameData();
    
    // 更新结果界面
    updateResultScreen();
    
    // 显示结果界面
    showScreen('result');
}

// 检查难度解锁
function checkDifficultyUnlock() {
    if (gameState.difficulty === 'easy' && gameState.level >= 5 && !gameState.unlockedDifficulties.includes('medium')) {
        gameState.unlockedDifficulties.push('medium');
        showUnlockNotification('解锁进阶难度！');
    }
    
    if (gameState.difficulty === 'medium' && gameState.level >= 5 && !gameState.unlockedDifficulties.includes('hard')) {
        gameState.unlockedDifficulties.push('hard');
        showUnlockNotification('解锁地狱难度！');
    }
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
    elements.result.finalScore.textContent = gameState.score;
    elements.result.maxCombo.textContent = gameState.maxCombo;
    elements.result.clearedLevels.textContent = gameState.clearedLevels;
    elements.result.unlockedContainer.innerHTML = '';
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
    // 创建分享文本
    const shareText = `我在《字色快打！》中获得了${gameState.score}分，最高连击${gameState.maxCombo}次，通过了${gameState.clearedLevels}关！来挑战我吧！`;
    
    // 尝试使用Web Share API
    if (navigator.share) {
        navigator.share({
            title: '字色快打！',
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
