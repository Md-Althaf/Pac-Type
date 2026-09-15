const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const groundY = 250;
const GRAVITY = 0.8;
const JUMP_FORCE = -13;


const pacman = {
    x: 60,
    y: groundY - 20,
    radius: 20,
    jumpSpeed: 0,
    inAir: false,
    mouthOpen: false,
    timer: 0
};

let pacmanGlow = 0;

function jump() {
    if (!pacman.inAir) {
        pacman.jumpSpeed = JUMP_FORCE;
        pacman.inAir = true;
    }
}

function updatePacman() {
    pacman.y += pacman.jumpSpeed;
    pacman.jumpSpeed += GRAVITY;

    if (pacman.y >= groundY - pacman.radius) {
        pacman.y = groundY - pacman.radius;
        pacman.jumpSpeed = 0;
        pacman.inAir = false;
    }

    if (pacmanGlow > 0) pacmanGlow--;

    pacman.timer++;
    if (pacman.timer >= 60) {
        pacman.mouthOpen = !pacman.mouthOpen;
        pacman.timer = 0;
    }
}

function drawPacman() {
    const mouthGap = pacman.mouthOpen ? 0.25 : 0.02;

    ctx.beginPath();
    ctx.arc(
        pacman.x,
        pacman.y,
        pacman.radius,
        mouthGap * Math.PI,
        (2 - mouthGap) * Math.PI
    );
    ctx.lineTo(pacman.x, pacman.y);
    ctx.fillStyle = pacmanGlow > 0 ? '#2ecc71' : '#ffff00';
    ctx.fill();
    ctx.closePath();
}


let groundShift = 0;
const groundSpeed = 4;

function updateGround() {
    groundShift -= groundSpeed;
    if (groundShift <= -40) groundShift = 0;
}

function drawGround() {
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();

    ctx.strokeStyle = '#999';
    for (let x = groundShift; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, groundY + 4);
        ctx.lineTo(x + 15, groundY + 4);
        ctx.stroke();
    }
}


let clouds = [
    { x: 150, y: 60, size: 20 },
    { x: 400, y: 40, size: 28 },
    { x: 650, y: 80, size: 28 }
];
const cloudSpeed = 1;

function updateClouds() {
    for (const cloud of clouds) {
        cloud.x -= cloudSpeed;
        if (cloud.x + cloud.size < 0) {
            cloud.x = canvas.width + Math.random() * 100;
            cloud.y = 30 + Math.random() * 60;
        }
    }
}

function drawClouds() {
    ctx.fillStyle = '#ccc';
    for (const cloud of clouds) {
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}


const normalWords = ['cat', 'dog', 'run', 'jump', 'code', 'fast', 'type', 'game', 'word', 'play', 'sun', 'moon', 'star', 'tree', 'book'];
const hardWords = ['c0d3!', 'wh@t?', 'gr8-job', '50%off', 'h4x0r', '#trend', 'z1gzaag', 'qu!ckly'];

let monsters = [];
let spawnTimer = 0;
const spawnDelay = 70;
let typedCount = 0;
let makeHardNext = false;
let score = 0;
let gameOver = false;

function spawnMonster() {
    const isHard = makeHardNext || Math.random() < 0.1;
    makeHardNext = false;

    const chosenWord = isHard
        ? hardWords[Math.floor(Math.random() * hardWords.length)]
        : normalWords[Math.floor(Math.random() * normalWords.length)];

    const height = 40;
    const y = groundY - height - Math.random() * 40;

    monsters.push({
        word: chosenWord,
        typed: '',
        x: canvas.width,
        y: y,
        width: 30,
        height: height,
        speed: isHard ? 5 : 3,
        isHard: isHard,
        points: isHard ? 10 : 1,
        alreadyPassed: false
    });
}

function getActiveMonster() {
    return monsters.find(m => m.typed.length < m.word.length && m.x + m.width > pacman.x);
}

function updateMonsters() {
    spawnTimer++;
    if (spawnTimer >= spawnDelay) {
        spawnMonster();
        spawnTimer = 0;
    }

    for (const m of monsters) {
        m.x -= m.speed;

        
        const xDiff = pacman.x - (m.x + m.width / 2);
        const yDiff = pacman.y - (m.y + m.height / 2);
        const distance = Math.hypot(xDiff, yDiff);

        if (distance < pacman.radius + m.width / 2) {
            gameOver = true;
        } else if (!m.alreadyPassed && m.x + m.width < pacman.x) {
            score = Math.max(0, score - 1);
            m.alreadyPassed = true;
        }
    }

    monsters = monsters.filter(m => m.x + m.width > 0);
}

function drawMonsters() {
    const activeMonster = getActiveMonster();

    for (const m of monsters) {
        ctx.beginPath(); 
        
        ctx.fillStyle = m.isHard ? '#f39c12' : '#c0392b';
        ctx.arc(m.x + m.width / 2, m.y + m.height / 2, 12, 0, Math.PI * 2);
        ctx.fill();


        if (m === activeMonster) {
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.font = '12px monospace';
            ctx.fillText('▼', m.x + m.width / 2, m.y - 22);
        }

        
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';

        const textWidth = ctx.measureText(m.word).width;
        const textX = m.x + m.width / 2 - textWidth / 2;
        const textY = m.y - 8;

        let charX = textX;

        for (let i = 0; i < m.word.length; i++) {
            const letter = m.word[i];
            ctx.fillStyle = i < m.typed.length ? '#27ae60' : (m.isHard ? '#f39c12' : '#ffffff');
            ctx.fillText(letter, charX, textY);
            charX += ctx.measureText(letter).width;
        }
    }
}

function drawScore() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 650, 30);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '28px monospace';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);

    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score + ' | press R to restart', canvas.width / 2, canvas.height / 2 + 20);
}

function restart() {
    monsters = [];
    spawnTimer = 0;
    typedCount = 0;
    makeHardNext = false;
    score = 0;
    gameOver = false;

    pacman.y = groundY - pacman.radius;
    pacman.jumpSpeed = 0;
    pacman.inAir = false;
    pacman.timer = 0;
    pacman.mouthOpen = false;
}


window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameOver) jump();
        return;
    }

    if (gameOver) {
        if (e.key === 'r' || e.key === 'R') restart();
        return;
    }

    typeLetter(e.key);
});

function typeLetter(key) {
    if (key.length !== 1) return;

    const target = getActiveMonster();
    if (!target) return;

    const nextLetter = target.word[target.typed.length];

    if (key === nextLetter) {
        target.typed += key;

        if (target.typed === target.word) {
            score += target.points;
            typedCount++;

            if (typedCount % 10 === 0) makeHardNext = true;

            pacmanGlow = 8;
            monsters = monsters.filter(m => m !== target);
        }
    }
}


function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameOver) {
        updatePacman();
        updateGround();
        updateClouds();
        updateMonsters();
    }

    drawClouds();
    drawGround();
    drawMonsters();
    drawPacman();
    drawScore();

    if (gameOver) drawGameOver();

    requestAnimationFrame(loop);
}

loop();