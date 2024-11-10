const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
const cellSize = 25;
const rows = 20;
const cols = 20;
const maze = [];
let player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 0.1 };
let goal = { x: cols - 1, y: rows - 1 };
let level = 1;
let timer = null;
let timeInterval = 5000; // Initial 5 seconds interval for maze change
let powerUps = [];
let powerUpDuration = 5000; // Power-up effect lasts for 5 seconds
let freezeTimer = false;
let speedBoostActive = false;

function initMaze() {
    for (let y = 0; y < rows; y++) {
        maze[y] = [];
        for (let x = 0; x < cols; x++) {
            maze[y][x] = { top: true, right: true, bottom: true, left: true, visited: false };
        }
    }
    generateMaze(0, 0);
    drawMaze();
    drawPlayer();
    addPowerUps();
}

function generateMaze(x, y) {
    maze[y][x].visited = true;
    const directions = ["top", "right", "bottom", "left"].sort(() => Math.random() - 0.5);

    for (const direction of directions) {
        const nx = direction === "right" ? x + 1 : direction === "left" ? x - 1 : x;
        const ny = direction === "bottom" ? y + 1 : direction === "top" ? y - 1 : y;

        if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && !maze[ny][nx].visited) {
            if (direction === "top") maze[y][x].top = maze[ny][nx].bottom = false;
            if (direction === "right") maze[y][x].right = maze[ny][nx].left = false;
            if (direction === "bottom") maze[y][x].bottom = maze[ny][nx].top = false;
            if (direction === "left") maze[y][x].left = maze[ny][nx].right = false;

            generateMaze(nx, ny);
        }
    }
}

function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = maze[y][x];
            const x1 = x * cellSize;
            const y1 = y * cellSize;
            if (cell.top) drawLine(x1, y1, x1 + cellSize, y1);
            if (cell.right) drawLine(x1 + cellSize, y1, x1 + cellSize, y1 + cellSize);
            if (cell.bottom) drawLine(x1, y1 + cellSize, x1 + cellSize, y1 + cellSize);
            if (cell.left) drawLine(x1, y1, x1, y1 + cellSize);
        }
    }
    drawGoal();
    drawPowerUps();
}

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawPlayer() {
    const px = player.x * cellSize + cellSize / 2;
    const py = player.y * cellSize + cellSize / 2;

    ctx.font = `${cellSize - 6}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🚶‍♂️", px, py);
}

function drawGoal() {
    const gx = goal.x * cellSize + cellSize / 2;
    const gy = goal.y * cellSize + cellSize / 2;

    ctx.font = `${cellSize - 6}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🚪", gx, gy);
}

function addPowerUps() {
    powerUps = [];
    const powerUpTypes = ["🕒", "⚡"];
    for (let i = 0; i < 2; i++) {
        const type = powerUpTypes[i];
        const px = Math.floor(Math.random() * cols);
        const py = Math.floor(Math.random() * rows);
        if ((px !== player.x || py !== player.y) && (px !== goal.x || py !== goal.y)) {
            powerUps.push({ x: px, y: py, type: type });
        }
    }
    drawMaze();
}

function drawPowerUps() {
    ctx.font = `${cellSize - 6}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const powerUp of powerUps) {
        const px = powerUp.x * cellSize + cellSize / 2;
        const py = powerUp.y * cellSize + cellSize / 2;
        ctx.fillText(powerUp.type, px, py);
    }
}

function movePlayer(dx, dy) {
    const newX = player.targetX + dx;
    const newY = player.targetY + dy;
    if (newX >= 0 && newY >= 0 && newX < cols && newY < rows) {
        const cell = maze[player.targetY][player.targetX];
        if ((dx === 1 && !cell.right) || (dx === -1 && !cell.left) || (dy === 1 && !cell.bottom) || (dy === -1 && !cell.top)) {
            player.targetX = newX;
            player.targetY = newY;
            checkPowerUpCollision();
            if (player.targetX === goal.x && player.targetY === goal.y) {
                levelUp();
            }
        }
    }
}

function checkPowerUpCollision() {
    const powerUp = powerUps.find(p => p.x === player.targetX && p.y === player.targetY);
    if (powerUp) {
        if (powerUp.type === "🕒") {
            activateTimeFreeze();
        } else if (powerUp.type === "⚡") {
            activateSpeedBoost();
        }
        powerUps = powerUps.filter(p => p !== powerUp); // Remove the collected power-up
        drawMaze();
    }
}

function activateTimeFreeze() {
    freezeTimer = true;
    clearTimeout(freezeTimerTimeout);
    const freezeTimerTimeout = setTimeout(() => {
        freezeTimer = false;
        resetMazeTimer(); // Resume maze changes after freeze
    }, powerUpDuration);
}

function activateSpeedBoost() {
    speedBoostActive = true;
    player.speed = 0.3; // Increase player speed
    clearTimeout(speedBoostTimeout);
    const speedBoostTimeout = setTimeout(() => {
        speedBoostActive = false;
        player.speed = 0.1; // Reset player speed
    }, powerUpDuration);
}

function animatePlayer() {
    player.x += (player.targetX - player.x) * player.speed;
    player.y += (player.targetY - player.y) * player.speed;
    drawMaze();
    drawPlayer();
    requestAnimationFrame(animatePlayer);
}

function levelUp() {
    level++;
    if (level > 5) {
        alert("Congratulations! You have completed all levels!");
        return;
    }
    timeInterval = Math.max(1000, timeInterval - 1000); // Reduce time interval with each level, minimum 1 second
    alert(`Level up! Level: ${level}`);
    player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 0.1 };
    resetMazeTimer();
    addPowerUps();
}

function resetMazeTimer() {
    if (timer) {
        clearInterval(timer);
    }
    initMaze();
    if (!freezeTimer) {
        timer = setInterval(() => {
            initMaze();
            addPowerUps(); // Add new power-ups when maze regenerates
        }, timeInterval);
    }
}

document.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowUp": movePlayer(0, -1); break;
        case "ArrowDown": movePlayer(0, 1); break;
        case "ArrowLeft": movePlayer(-1, 0); break;
        case "ArrowRight": movePlayer(1, 0); break;
    }
});

initMaze();
animatePlayer();
resetMazeTimer();
