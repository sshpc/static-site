// 音效管理模块
const soundManager = {
    startSound: new Howl({
        src: ['start.aac'],
        preload: true,
        rate: 1
    }),
    runSound: new Howl({
        src: ['run.aac'],
        preload: true,
        loop: true,
        rate: 1
    }),
    stopSound: new Howl({
        src: ['stop.aac'],
        preload: true,
        rate: 1
    }),
    playStartSound() {
        this.startSound.volume(0.8);
        this.startSound.play();
    },
    playRunSound() {
        this.runSound.play();
    },
    playStopSound() {
        this.runSound.volume(1);
        this.stopSound.play();
    },
    stopAllSounds() {
        this.startSound.stop();
        this.runSound.stop();
        this.stopSound.stop();
    },
    setRunSoundRate(rate) {
        this.runSound.rate(rate);
    },
    setRunSoundVolume(volume) {
        this.runSound.volume(volume);
    }
};

// 元素管理模块
const elementManager = {
    startButton: document.getElementById('startButton'),
    throttleButton: document.getElementById('throttleButton'),
    turboButton: document.getElementById('turboButton'),
    stopButton: document.getElementById('stopButton'),
    throttleText: document.getElementById('throttleText'),
    flywheelCanvas: document.getElementById('flywheelCanvas'),
    disableButton(button) {
        button.disabled = true;
    },
    enableButton(button) {
        button.disabled = false;
    },
    updateThrottleText(value) {
        setTimeout(() => {
            this.throttleText.textContent = `转速: ${(value.toFixed(1) * 1000)} `;
        }, 300);
    }
};

// 状态管理模块
const stateManager = {
    isStarted: false,
    isStable: false,
    soundSpeed: 0,
    throttleInterval: null,
    flywheelRotation: 0, // 新增：飞轮旋转角度
    start() {
        this.isStarted = true;
        elementManager.disableButton(elementManager.startButton);
        elementManager.enableButton(elementManager.stopButton);
    },
    stop() {
        this.isStarted = false;
        this.isStable = false;
        elementManager.enableButton(elementManager.startButton);
        elementManager.disableButton(elementManager.stopButton);
    }
};

// 平滑变速函数
function smoothSpeedChange(currentSpeed, targetSpeed, acceleratedSpeed = 0.02, callback) {
    clearInterval(stateManager.throttleInterval);

    const intervalId = setInterval(() => {
        if (currentSpeed > targetSpeed) {
            currentSpeed -= acceleratedSpeed;
        } else if (currentSpeed < targetSpeed) {
            currentSpeed += acceleratedSpeed;
        }



        if (Math.abs(currentSpeed - targetSpeed) < acceleratedSpeed) {
            currentSpeed = targetSpeed;
            clearInterval(intervalId);
            if (callback) {
                callback();
            }
        }

        soundManager.setRunSoundRate(currentSpeed);
        stateManager.soundSpeed = currentSpeed;
        elementManager.updateThrottleText(currentSpeed);

    }, 100);

    stateManager.throttleInterval = intervalId;
}

// 绘制飞轮
function drawFlywheel() {
    const canvas = elementManager.flywheelCanvas;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 150;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制圆盘
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();

    // 绘制四个对称的孔
    const holeRadius = 10;
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 2) + stateManager.flywheelRotation;
        const holeX = centerX + Math.cos(angle) * (radius - holeRadius - 5);
        const holeY = centerY + Math.sin(angle) * (radius - holeRadius - 5);
        ctx.beginPath();
        ctx.arc(holeX, holeY, holeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f0f0f0';
        ctx.fill();
    }
}

// 单独的定时器更新飞轮旋转角度
function updateFlywheelRotation() {
    const rotationSpeed = stateManager.soundSpeed / 5; 
    stateManager.flywheelRotation += rotationSpeed;
    drawFlywheel();
    requestAnimationFrame(updateFlywheelRotation);
}

// 事件处理模块
const eventHandler = {
    handleStartClick() {
        if (!stateManager.isStarted) {
            soundManager.stopAllSounds(); // 确保之前的音效停止
            soundManager.playStartSound();
            smoothSpeedChange(stateManager.soundSpeed, 1, 0.03);

            soundManager.startSound.on('end', () => {
                soundManager.playRunSound();
                stateManager.isStable = true;
            });

            stateManager.start();
            elementManager.updateThrottleText(stateManager.soundSpeed);
        }
    },
    handleThrottleMouseDown() {
        if (stateManager.isStable) {
            smoothSpeedChange(stateManager.soundSpeed, 1.6);
        }
    },
    handleThrottleMouseUp() {
        if (stateManager.isStable) {
        smoothSpeedChange(stateManager.soundSpeed, 0.8);
        }
    },
    handleTurboClick() {
        if (stateManager.isStarted && stateManager.isStable) {
            smoothSpeedChange(stateManager.soundSpeed, 1.9, 0.07);

            setTimeout(() => {
                smoothSpeedChange(stateManager.soundSpeed, 0.9, 0.05);
            }, 6000);
        }
    },
    handleStopClick() {
        if (stateManager.isStarted) {
            smoothSpeedChange(stateManager.soundSpeed, 0.2, 0.04, () => {
                soundManager.stopAllSounds();

                soundManager.playStopSound();
                
                soundManager.stopSound.on('end', () => {
                    //转速归零
                    stateManager.soundSpeed = 0;
                    elementManager.updateThrottleText(stateManager.soundSpeed);
                    stateManager.stop();
                });
            });
        }
    }
};

// 初始化事件监听器
function initEventListeners() {
    elementManager.startButton.addEventListener('click', eventHandler.handleStartClick);
    elementManager.throttleButton.addEventListener('mousedown', eventHandler.handleThrottleMouseDown);
    elementManager.throttleButton.addEventListener('mouseup', eventHandler.handleThrottleMouseUp);
    elementManager.turboButton.addEventListener('click', eventHandler.handleTurboClick);
    elementManager.stopButton.addEventListener('click', eventHandler.handleStopClick);
}

// 初始化函数
function init() {
    elementManager.disableButton(elementManager.stopButton);
    initEventListeners();
    drawFlywheel(); // 初始绘制飞轮
    requestAnimationFrame(updateFlywheelRotation); // 启动飞轮旋转更新定时器
}

// 页面加载完成后执行初始化
window.onload = init;