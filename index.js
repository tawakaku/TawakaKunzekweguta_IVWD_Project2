// Age verification
function submitAge() {
    const age = document.getElementById('age').value;
    if (age === '' || isNaN(age) || age < 13) {
        document.getElementById('ageError').textContent = 'You need to be 13+ to play the game.';
    } else {
        document.getElementById('prompt').style.display = 'none';
        document.getElementById('namePrompt').style.display = 'block';
    }
}

// Name submission
function submitName() {
    const name = document.getElementById('name').value;
    if (name === '') {
        return;
    }
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('welcomeMessage').textContent = `Welcome to Tetris, ${name}`;
    startCountdown(startGame);
}

// Game setup
const canvas = document.getElementById('tetrisCanvas');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextContext = nextCanvas.getContext('2d');

const COLS = 12;
const ROWS = 24;
const BLOCK_SIZE = 25;
let score = 0;
let board = [];
let tetromino;
let nextTetromino;
let gameOver = false;
let isPaused = false;
let dropStart = Date.now();
let interval;
let countdownElement = document.getElementById('countdown');

const TETROMINOS = [
    [[1, 1, 1, 1]], // I
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1], [1, 1]], // O
    [[1, 1, 0], [0, 1, 1]], // Z
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 0, 0], [1, 1, 1]], // L
    [[0, 0, 1], [1, 1, 1]]  // J
];

const COLORS = ['cyan', 'purple', 'yellow', 'red', 'green', 'orange', 'blue'];

// Draw block
function drawBlock(context, x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeStyle = 'black';
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// Draw board
function drawBoard() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            drawBlock(context, col, row, board[row][col] === 0 ? '#000' : board[row][col]);
        }
    }
}

// Generate new tetromino
function generateTetromino() {
    const index = Math.floor(Math.random() * TETROMINOS.length);
    return {
        shape: TETROMINOS[index],
        color: COLORS[index],
        x: Math.floor(COLS / 2) - Math.ceil(TETROMINOS[index][0].length / 2),
        y: 0,
        type: index
    };
}

// Rotate tetromino
function rotate(tetromino) {
    const N = tetromino.shape.length;
    const newShape = [];
    for (let y = 0; y < N; y++) {
        newShape[y] = [];
        for (let x = 0; x < N; x++) {
            newShape[y][x] = tetromino.shape[N - 1 - x][y];
        }
    }
    return newShape;
}

// Check collision
function collision(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] && 
                (board[y + row] && board[y + row][x + col]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Move tetromino
function moveTetromino(dir) {
    if (!collision(tetromino.x + dir, tetromino.y, tetromino.shape)) {
        tetromino.x += dir;
    }
}

// Drop tetromino
function dropTetromino() {
    if (!collision(tetromino.x, tetromino.y + 1, tetromino.shape)) {
        tetromino.y++;
    } else {
        for (let row = 0; row < tetromino.shape.length; row++) {
            for (let col = 0; col < tetromino.shape[row].length; col++) {
                if (tetromino.shape[row][col]) {
                    if (tetromino.y + row < 0) {
                        gameOver = true;
                        break;
                    }
                    board[tetromino.y + row][tetromino.x + col] = tetromino.color;
                }
            }
        }
        if (gameOver) {
            document.getElementById('winMessage').style.display = 'block';
            clearInterval(interval);
            return;
        }
        let fullRows = 0;
        for (let row = 0; row < ROWS; row++) {
            let isFull = true;
            for (let col = 0; col < COLS; col++) {
                if (board[row][col] === 0) {
                    isFull = false;
                    break;
                }
            }
            if (isFull) {
                board.splice(row, 1);
                board.unshift(new Array(COLS).fill(0));
                fullRows++;
            }
        }
        switch (fullRows) {
            case 1:
                score += 30;
                break;
            case 2:
                score += 50;
                break;
            case 3:
                score += 60;
                break;
            case 4:
                score += 80;
                break;
        }
        document.getElementById('score').textContent = score;
        if (score >= 150 && score < 300) {
            document.body.style.backgroundColor = '#5CB9A1';
        } else if (score >= 300) {
            document.getElementById('winMessage').style.display = 'block';
            clearInterval(interval);
            return;
        }
        tetromino = nextTetromino;
        nextTetromino = generateTetromino();
    }
}

// Draw tetromino
function drawTetromino() {
    tetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(context, tetromino.x + x, tetromino.y + y, tetromino.color);
            }
        });
    });
}

// Draw next tetromino
function drawNextTetromino() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextTetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(nextContext, x, y, nextTetromino.color);
            }
        });
    });
}

// Update game
function updateGame() {
    if (!isPaused) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard();
        drawTetromino();
        drawNextTetromino();
        if (Date.now() - dropStart > 900) {
            dropTetromino();
            dropStart = Date.now();
        }
    }
}

// Start game
function startGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    tetromino = generateTetromino();
    nextTetromino = generateTetromino();
    score = 0;
    gameOver = false;
    isPaused = false;
    dropStart = Date.now();
    document.getElementById('score').textContent = score;
    interval = setInterval(updateGame, 100);
}

// Countdown
function startCountdown(callback) {
    let count = 5;
    countdownElement.style.display = 'block';
    const countdownInterval = setInterval(() => {
        countdownElement.textContent = count;
        count--;
        if (count < 0) {
            clearInterval(countdownInterval);
            countdownElement.style.display = 'none';
            callback();
        }
    }, 1000);
}

// Pause game
function pauseGame() {
    isPaused = true;
    document.getElementById('pauseButton').style.display = 'none';
    document.getElementById('resumeButton').style.display = 'inline';
}

// Resume game
function resumeGame() {
    isPaused = false;
    document.getElementById('pauseButton').style.display = 'inline';
    document.getElementById('resumeButton').style.display = 'none';
}

// Restart game
function restartGame() {
    clearInterval(interval);
    startCountdown(startGame);
}

// Quit game
function quitGame() {
    clearInterval(interval);
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('prompt').style.display = 'block';
    document.getElementById('namePrompt').style.display = 'none';
}

// Show instructions
function showInstructions() {
    document.getElementById('instructions').style.display = 'block';
}

// Close instructions
function closeInstructions() {
    document.getElementById('instructions').style.display = 'none';
}

// Event listeners
document.getElementById('pauseButton').addEventListener('click', pauseGame);
document.getElementById('resumeButton').addEventListener('click', resumeGame);
document.getElementById('restartButton').addEventListener('click', restartGame);
document.getElementById('quitButton').addEventListener('click', quitGame);
document.getElementById('instructionsButton').addEventListener('click', showInstructions);
document.getElementById('closeInstructionsButton').addEventListener('click', closeInstructions);
document.addEventListener('keydown', (event) => {
    if (!isPaused && !gameOver) {
        switch (event.key) {
            case 'ArrowLeft':
                moveTetromino(-1);
                break;
            case 'ArrowRight':
                moveTetromino(1);
                break;
            case 'ArrowDown':
                dropTetromino();
                break;
            case ' ':
                const rotatedShape = rotate(tetromino);
                if (!collision(tetromino.x, tetromino.y, rotatedShape)) {
                    tetromino.shape = rotatedShape;
                }
                break;
        }
    }
});
