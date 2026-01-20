// Game State
const game = {
    isRunning: false,
    playerSize: 1024, // in KB (1 MB = 1024 KB)
    filesEaten: 0,
    startTime: null,
    timerInterval: null,
    spawnInterval: null,
    player: {
        x: 0,
        y: 0,
        speed: 5,
        width: 80,
        height: 120
    },
    keys: {
        up: false,
        down: false,
        left: false,
        right: false
    },
    foods: [],
    // File types that PDF can "eat" (convert/combine)
    compatibleTypes: [
        { ext: 'DOC', class: 'doc-icon', minSize: 10, maxSize: 60 },
        { ext: 'DOCX', class: 'doc-icon', minSize: 15, maxSize: 55 },
        { ext: 'XLS', class: 'xls-icon', minSize: 12, maxSize: 50 },
        { ext: 'XLSX', class: 'xls-icon', minSize: 18, maxSize: 58 },
        { ext: 'TXT', class: 'txt-icon', minSize: 1, maxSize: 30 },
        { ext: 'JPG', class: 'jpg-icon', minSize: 20, maxSize: 60 },
        { ext: 'PNG', class: 'png-icon', minSize: 25, maxSize: 60 },
        { ext: 'HTML', class: 'html-icon', minSize: 5, maxSize: 40 },
        { ext: 'CSS', class: 'css-icon', minSize: 3, maxSize: 25 },
        { ext: 'JS', class: 'js-icon', minSize: 8, maxSize: 45 }
    ]
};

// DOM Elements
const gameArea = document.getElementById('game-area');
const player = document.getElementById('player');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const pdfSizeDisplay = document.getElementById('pdf-size');
const filesEatenDisplay = document.getElementById('files-eaten');
const gameTimeDisplay = document.getElementById('game-time');
const levelUpEl = document.getElementById('level-up');

// Initialize game
function init() {
    startBtn.addEventListener('click', startGame);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Center player initially
    const rect = gameArea.getBoundingClientRect();
    game.player.x = rect.width / 2 - game.player.width / 2;
    game.player.y = rect.height / 2 - game.player.height / 2;
    updatePlayerPosition();
}

function startGame() {
    startScreen.classList.add('hidden');
    game.isRunning = true;
    game.startTime = Date.now();
    game.playerSize = 1024;
    game.filesEaten = 0;

    // Clear any existing foods
    document.querySelectorAll('.food-file').forEach(f => f.remove());
    game.foods = [];

    // Start timer
    game.timerInterval = setInterval(updateTimer, 1000);

    // Start spawning food
    spawnFood();
    game.spawnInterval = setInterval(spawnFood, 2000);

    // Start game loop
    requestAnimationFrame(gameLoop);

    updateUI();
}

function handleKeyDown(e) {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
            game.keys.up = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            game.keys.down = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            game.keys.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            game.keys.right = true;
            break;
    }
}

function handleKeyUp(e) {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
            game.keys.up = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            game.keys.down = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            game.keys.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            game.keys.right = false;
            break;
    }
}

function gameLoop() {
    if (!game.isRunning) return;

    movePlayer();
    checkCollisions();

    requestAnimationFrame(gameLoop);
}

function movePlayer() {
    const rect = gameArea.getBoundingClientRect();
    const speed = game.player.speed;

    if (game.keys.up) {
        game.player.y = Math.max(0, game.player.y - speed);
    }
    if (game.keys.down) {
        game.player.y = Math.min(rect.height - game.player.height, game.player.y + speed);
    }
    if (game.keys.left) {
        game.player.x = Math.max(0, game.player.x - speed);
    }
    if (game.keys.right) {
        game.player.x = Math.min(rect.width - game.player.width, game.player.x + speed);
    }

    updatePlayerPosition();
}

function updatePlayerPosition() {
    player.style.left = game.player.x + 'px';
    player.style.top = game.player.y + 'px';
}

function spawnFood() {
    if (!game.isRunning) return;

    const rect = gameArea.getBoundingClientRect();
    const type = game.compatibleTypes[Math.floor(Math.random() * game.compatibleTypes.length)];
    const size = Math.floor(Math.random() * (type.maxSize - type.minSize + 1)) + type.minSize;

    const foodWidth = 60;
    const foodHeight = 90;

    const x = Math.random() * (rect.width - foodWidth);
    const y = Math.random() * (rect.height - foodHeight);

    const food = document.createElement('div');
    food.className = 'file-entity food-file';
    food.innerHTML = `
        <div class="file-icon ${type.class}">
            <span class="file-ext">${type.ext}</span>
        </div>
        <span class="file-size">${size} KB</span>
    `;
    food.style.left = x + 'px';
    food.style.top = y + 'px';

    const foodData = {
        element: food,
        x: x,
        y: y,
        width: foodWidth,
        height: foodHeight,
        size: size,
        type: type.ext
    };

    game.foods.push(foodData);
    gameArea.appendChild(food);

    // Random movement for food
    animateFood(foodData);
}

function animateFood(foodData) {
    const rect = gameArea.getBoundingClientRect();
    const speed = 0.5 + Math.random() * 1;
    let dirX = (Math.random() - 0.5) * 2;
    let dirY = (Math.random() - 0.5) * 2;

    function move() {
        if (!game.isRunning || !foodData.element.parentNode) return;

        foodData.x += dirX * speed;
        foodData.y += dirY * speed;

        // Bounce off walls
        if (foodData.x <= 0 || foodData.x >= rect.width - foodData.width) {
            dirX *= -1;
            foodData.x = Math.max(0, Math.min(rect.width - foodData.width, foodData.x));
        }
        if (foodData.y <= 0 || foodData.y >= rect.height - foodData.height) {
            dirY *= -1;
            foodData.y = Math.max(0, Math.min(rect.height - foodData.height, foodData.y));
        }

        foodData.element.style.left = foodData.x + 'px';
        foodData.element.style.top = foodData.y + 'px';

        requestAnimationFrame(move);
    }

    move();
}

function checkCollisions() {
    const playerRect = {
        x: game.player.x,
        y: game.player.y,
        width: game.player.width,
        height: game.player.height
    };

    for (let i = game.foods.length - 1; i >= 0; i--) {
        const food = game.foods[i];

        if (isColliding(playerRect, food)) {
            eatFood(food, i);
        }
    }
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

function eatFood(food, index) {
    // Add eating animation
    food.element.classList.add('eating');

    // Create particles
    createParticles(food.x + food.width / 2, food.y + food.height / 2);

    // Update game state
    game.playerSize += food.size;
    game.filesEaten++;

    // Check for level up (every 1 MB)
    const previousMB = Math.floor((game.playerSize - food.size) / 1024);
    const currentMB = Math.floor(game.playerSize / 1024);
    if (currentMB > previousMB) {
        showLevelUp();
        // Increase player speed slightly
        game.player.speed = Math.min(10, game.player.speed + 0.2);
    }

    // Animate player size growth
    player.classList.add('size-up');
    setTimeout(() => player.classList.remove('size-up'), 400);

    // Remove food from array
    game.foods.splice(index, 1);

    // Remove food element after animation
    setTimeout(() => {
        if (food.element.parentNode) {
            food.element.remove();
        }
    }, 300);

    updateUI();
}

function createParticles(x, y) {
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'];

    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];

        const angle = (Math.PI * 2 / 8) * i;
        const distance = 30 + Math.random() * 30;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.transform = `translate(${tx}px, ${ty}px)`;

        gameArea.appendChild(particle);

        setTimeout(() => particle.remove(), 800);
    }
}

function showLevelUp() {
    levelUpEl.classList.remove('hidden');
    setTimeout(() => {
        levelUpEl.classList.add('hidden');
    }, 1500);
}

function updateUI() {
    // Format size
    const sizeMB = game.playerSize / 1024;
    let sizeText;
    if (sizeMB >= 1024) {
        sizeText = (sizeMB / 1024).toFixed(2) + ' GB';
    } else {
        sizeText = sizeMB.toFixed(2) + ' MB';
    }

    pdfSizeDisplay.textContent = sizeText;
    player.querySelector('.file-size').textContent = sizeText;
    filesEatenDisplay.textContent = game.filesEaten;

    // Scale player based on size (subtle growth)
    const scale = 1 + Math.log10(game.playerSize / 1024) * 0.1;
    player.querySelector('.file-icon').style.transform = `scale(${Math.min(scale, 1.5)})`;
}

function updateTimer() {
    if (!game.isRunning) return;

    const elapsed = Math.floor((Date.now() - game.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    gameTimeDisplay.textContent = `${minutes}:${seconds}`;
}

// Mobile Joystick
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');

let joystickActive = false;
let joystickData = { x: 0, y: 0 };

function initMobileControls() {
    if (!joystickBase) return;

    joystickBase.addEventListener('touchstart', handleJoystickStart, { passive: false });
    joystickBase.addEventListener('touchmove', handleJoystickMove, { passive: false });
    joystickBase.addEventListener('touchend', handleJoystickEnd);
    joystickBase.addEventListener('touchcancel', handleJoystickEnd);

    // Also support mouse for testing
    joystickBase.addEventListener('mousedown', handleJoystickStart);
    document.addEventListener('mousemove', handleJoystickMove);
    document.addEventListener('mouseup', handleJoystickEnd);
}

function handleJoystickStart(e) {
    e.preventDefault();
    joystickActive = true;
    joystickStick.classList.add('active');
    handleJoystickMove(e);
}

function handleJoystickMove(e) {
    if (!joystickActive) return;
    e.preventDefault();

    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;

    const maxDistance = rect.width / 2 - 25;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
    }

    joystickStick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

    // Normalize to -1 to 1
    joystickData.x = deltaX / maxDistance;
    joystickData.y = deltaY / maxDistance;

    // Update game keys based on joystick
    game.keys.left = joystickData.x < -0.3;
    game.keys.right = joystickData.x > 0.3;
    game.keys.up = joystickData.y < -0.3;
    game.keys.down = joystickData.y > 0.3;
}

function handleJoystickEnd() {
    joystickActive = false;
    joystickStick.classList.remove('active');
    joystickStick.style.transform = 'translate(-50%, -50%)';
    joystickData = { x: 0, y: 0 };

    // Reset keys
    game.keys.left = false;
    game.keys.right = false;
    game.keys.up = false;
    game.keys.down = false;
}

// Start initialization
init();
initMobileControls();
