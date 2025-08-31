const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.height = 450;
canvas.width = 400;

const wallImg = new Image();
wallImg.src = 'brikky.png';

const transparencyImg = new Image();
transparencyImg.src = 'glass.png'

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDe5c4Ez_16kZXTePJMr2icRMgTJ1WdtmE",
  authDomain: "brikky-abd99.firebaseapp.com",
  projectId: "brikky-abd99",
  storageBucket: "brikky-abd99.firebasestorage.app",
  messagingSenderId: "1073642598973",
  appId: "1:1073642598973:web:70c17054fbf578bee5b054",
  measurementId: "G-ELX4ZQSVW2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // <-- Firestore initialized

async function addScoreToLeaderboard(score) {
  if (!playerName) playerName = "Player";

  const docRef = await addDoc(collection(db, "leaderboard"), {
    name: playerName,
    score: score,
    timestamp: Date.now()
  });

  return docRef; // optional, if you want to track the added score
}

async function fetchLeaderboard() {
  const q = query(
    collection(db, "leaderboard"),
    orderBy("score", "desc"),
    limit(10)
  );

  try {
    const snapshot = await getDocs(q);
    leaderboard = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      leaderboard.push({
        name: data.name,
        score: data.score,
        timestamp: data.timestamp
      });
    });
    leaderboardLoaded = true;
    console.log("Leaderboard array:", leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
  }
}

class Paddle {
    constructor(x, y, width, height, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
    }
    draw() {
        ctx.fillStyle = "#6f97abff";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + this.width/2, this.y + this.height);
        ctx.closePath();
        ctx.stroke();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    move(left, right, canvasWidth) {
        if (left && this.x > 0) this.x -= this.speed;
        if (right && this.x < canvasWidth - this.width) this.x += this.speed;
    }
    update(left, right, canvasWidth) {
      this.move(left, right, canvasWidth);
      this.draw();
    }
}

class Ball {
    constructor(x, y, radius, dx, dy) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.dx = dx;
        this.dy = dy;
        this.speed = 1;
        this.maxSpeed = 3;
  }
  draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.closePath();
  }
  increaseSpeed(factor) {
      this.speed *= factor;
      if (this.speed > this.maxSpeed) {
          this.speed = this.maxSpeed;
      }
  }
  move() {
      this.x += this.dx * this.speed;
      this.y += this.dy * this.speed;
  }
  checkWallCollision(canvasWidth, canvasHeight) {
      if (this.x + this.dx > canvasWidth - this.radius || this.x + this.dx < this.radius) this.dx = -this.dx;
      if (this.y + this.dy < this.radius) this.dy = -this.dy;
  }
}

class Brick {
    constructor(x, y, width, height, color, image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.status = 1;
        this.color = color;
        this.image = image;
  }
  destroy() {
    this.status = 0;
  }
  isDestroyed() {
    return this.status === 0;
  }
  draw() {
    if (this.status === 0) return;

    if (this.status === 1) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height)
      }
    }
}

let gameState = "introScreen";
let movingLeft = false;
let movingRight = false;
let bricks = [];
const ball = new Ball(canvas.width / 2, canvas.height - 30, 8, 2, -2);
const paddle = new Paddle((canvas.width - 75) / 2, canvas.height - 20, 75, 10, 5);
let score = 0;
let leaderboard = [];

function gameLoop(timestamp) {


    switch(gameState) {
        case "gameScreen": gameScreen(timestamp); break;
        case "introScreen": introScreen(); break;
        case "gameOverScreen": gameOverScreen(); break;
        case "leaderBoard": leaderBoard(); break;
    }

    requestAnimationFrame(gameLoop);
}

let playerName = "";

const usernameOverlay = document.getElementById("usernameOverlay");
const usernameInput = document.getElementById("usernameInput");
const submitUsername = document.getElementById("submitUsername");

submitUsername.addEventListener("click", () => {
    const name = usernameInput.value.trim().toUpperCase();
    if (name.length === 0) {
        alert("Please enter a name!");
        return;
    }
    playerName = name;
    usernameOverlay.style.display = "none";
    gameState = "introScreen";
});

const colors = ["#f00", "rgba(2, 153, 2, 1)", "rgba(0, 157, 230, 1)", "#ff0",
      "rgba(107, 0, 107, 1)", "rgba(255, 164, 8, 1)",
      "rgba(255, 0, 170, 1)", "rgba(32, 218, 235, 1)", 
      "rgba(170, 255, 0, 1)", "rgba(0, 132, 86, 1)"];

let nextColorIndex = 0;

function getNextRowColor() {
    const color = colors[nextColorIndex];
    nextColorIndex = (nextColorIndex + 1) % colors.length;
    return color;
}

function setupBricks() {
    bricks = [];
    const brickRowCount = 1;
    const brickColumnCount = 5;
    const brickWidth = canvas.width / 6;
    const brickHeight = 20;
    const brickPadding = 10;
    const brickOffsetTop = 30;
    const totalBricksWidth = brickColumnCount * brickWidth + (brickColumnCount - 1) * brickPadding;
    const brickOffsetLeft = (canvas.width - totalBricksWidth) / 2;
    const rowColor = getNextRowColor();

    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const x = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const y = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks.push(new Brick(x, y, brickWidth, brickHeight, rowColor, transparencyImg));
      }
    }
}

function checkBricks() {
    const anyBricksLeft = bricks.some(brick => !brick.isDestroyed());
    if (!anyBricksLeft) {
        bricks = [];
        setupBricks();
    }
}

function addNewRow() {
    const brickColumnCount = 5;
    const brickWidth = canvas.width / 6;
    const brickHeight = 20;
    const brickPadding = 10;
    const brickOffsetTop = 30;
    
    for (let brick of bricks) {
      if (brick.status === 1 && brick.y + brick.height >= canvas.height - paddle.height) {
          bricks = [];
          ball.speed = 0;
          gameState = 'gameOverScreen'
          return;
      }
    }

    bricks.forEach(brick => {
        brick.y += brickHeight + brickPadding;
    });

    const totalRowWidth = brickColumnCount * brickWidth + (brickColumnCount - 1) * brickPadding;
    const brickOffsetLeft = (canvas.width - totalRowWidth) / 2;
    const rowColor = getNextRowColor();

    for (let c = 0; c < brickColumnCount; c++) {
        const x = brickOffsetLeft + c * (brickWidth + brickPadding);
        const y = brickOffsetTop;
        bricks.push(new Brick(x, y, brickWidth, brickHeight, rowColor, transparencyImg));
    }
}

function collisionDetection() {
    bricks.forEach(brick => {
      if (brick.status === 1) {
        if (
          ball.x > brick.x &&
          ball.x < brick.x + brick.width &&
          ball.y > brick.y &&
          ball.y < brick.y + brick.height
        ) {
          ball.dy = -ball.dy;
          brick.destroy();
          score++;
          ball.increaseSpeed(1.01);
          console.log("Ball speed:", ball.speed.toFixed(2));

        }
      }
    });
}

function paddleCollision() {
    const paddleTop = canvas.height - paddle.height - 10;
    if (ball.y + ball.dy > paddleTop) {
        if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            const hitPos = (ball.x - paddle.x) / paddle.width;
            const maxAngle = Math.PI / 3;
            const angle = (hitPos - 0.5) * 2 * maxAngle; 

            const speed = Math.sqrt(ball.dx**2 + ball.dy**2);

            ball.dx = speed * Math.sin(angle);
            ball.dy = -speed * Math.cos(angle);
        } else if (ball.y + ball.dy > canvas.height) {
            bricks = [];
            ball.speed = 0;
            gameState = 'gameOverScreen'

        }
    }
}

function gameStats() {
    ctx.fillStyle = 'white';
    ctx.font = '35px pixelPurl';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE - ${score}`, canvas.width/2, 14);
}

function UIButton(x, y, width, height, color, text, textSize, image, onClick, screen) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.color = color;
  this.text = text;
  this.textSize = textSize;
  this.image = image;
  this.onClick = onClick;
  this.screen = screen;

  this.draw = function() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${this.textSize}px pixelPurl`;
    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);

    ctx.strokeStyle = "white";
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    if (this.image) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  };
}

let uiButtons = [];
let leaderboardLoaded = false;

function createUIButtons() {
  uiButtons = [
    new UIButton(
      canvas.width / 2 - 125, 250, 250, 75, "green",
      "PLAY", 50, transparencyImg,
      () => { 
              gameState = "gameScreen"; 
              resetGame(); 
            },
      "introScreen"
    ),
    new UIButton(
      canvas.width / 2 - 125, 350, 250, 75, "teal",
      "LEADERBOARD", 30, transparencyImg,
      () => {
              leaderboardLoaded = false;
              fetchLeaderboard();
              gameState = "leaderBoard";
            },
      "introScreen"
    ),

    new UIButton(
      canvas.width / 2 - 125, 350, 250, 75, "green",
      "PLAY AGAIN?", 30, transparencyImg,
      () => { 
              console.log("PLAY AGAIN clicked");
              resetGame();
              gameState = "introScreen"; 
            },
      "gameOverScreen"
    ),

    new UIButton(
      canvas.width / 2 - 125, 350, 250, 75, "green",
      "BACK", 30, transparencyImg,
      () => { 
              gameState = "introScreen";  
            },
      "leaderBoard"
    )
  ];
}

function handleClick(x, y) {
  uiButtons
    .filter(btn => btn.screen === gameState)
    .forEach(btn => {
      if (x >= btn.x && x <= btn.x + btn.width &&
          y >= btn.y && y <= btn.y + btn.height) {
        btn.onClick();
      }
    });
}

function resetGame() {
  score = 0;
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 30;
  ball.speed = 1;
  paddle.x = canvas.width / 2 - paddle.width / 2;
  bricks = [];
  nextColorIndex = 0;
  scoreAddedToLeaderboard = false;
  setupBricks();
}

let lastRowTime = 0;
const rowInterval = 5000;

function gameScreen(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(wallImg,0,0);

    if (!lastRowTime) lastRowTime = timestamp;

    if (timestamp - lastRowTime >= rowInterval) {
        addNewRow();
        lastRowTime = timestamp;
    }

    bricks.forEach(brick => brick.draw());
    ball.draw();
    paddle.update(movingLeft, movingRight, canvas.width);
    collisionDetection();

    ball.move();
    ball.checkWallCollision(canvas.width, canvas.height);
    paddleCollision();
    checkBricks();
    gameStats();
}

function introScreen() {
  ctx.clearRect(0,0,canvas.width, canvas.height);
  ctx.drawImage(wallImg,0,0);
  ctx.fillStyle = 'white';
  ctx.font = '40px pixelPurl';
  ctx.textAlign = 'center';
  ctx.fillText(playerName, canvas.width/2, 20)
  ctx.fillStyle = 'white';
  ctx.font = '60px pixelPurl';
  ctx.textAlign = 'center';
  ctx.fillText('WELCOME TO', canvas.width/2, 60)

  uiButtons
    .filter(btn => btn.screen === "introScreen")
    .forEach(btn => btn.draw());

}

let scoreAddedToLeaderboard = false;

function gameOverScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(wallImg, 0, 0);

  ctx.fillStyle = 'white';
  ctx.font = '50px pixelPurl';
  ctx.textAlign = 'center';
  ctx.fillText('THANKS FOR PLAYING', canvas.width/2, 40);

  ctx.font = '80px pixelPurl';
  ctx.fillText('GAME OVER', canvas.width/2, 244);

  ctx.font = "50px pixelPurl";
  ctx.fillText(playerName, canvas.width/2, 290);
  ctx.fillText(`SCORE - ${score}`, canvas.width/2, 325);

  if (!scoreAddedToLeaderboard) {
    // Fire-and-forget, but refresh leaderboard immediately
    addScoreToLeaderboard(score).then(() => {
      scoreAddedToLeaderboard = true;
    });
  }

  uiButtons
    .filter(btn => btn.screen === "gameOverScreen")
    .forEach(btn => btn.draw());
}

function leaderBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(wallImg, 0, 0);

  ctx.fillStyle = 'white';
  ctx.font = '60px pixelPurl';
  ctx.textAlign = 'center';
  ctx.fillText('LEADERBOARD', canvas.width/2, 40);

  if (!leaderboardLoaded) {
    ctx.font = '30px pixelPurl';
    ctx.fillText('Loading...', canvas.width/2, canvas.height/2);
    return;
  }

  console.log('Rendering leaderboard with entries:', leaderboard.length);

  const startY = 80;
  const rowHeight = 25;
  const colX = {
    place: canvas.width/4 - 50,
    name: canvas.width/2,
    score: 3*canvas.width/4 + 50
  };

  ctx.font = '30px pixelPurl';
  ctx.fillText('PLACE', colX.place, startY);
  ctx.fillText('NAME', colX.name, startY);
  ctx.fillText('SCORE', colX.score, startY);

  ctx.font = '28px pixelPurl';
  for (let i = 0; i < 10; i++) {
    const y = startY + (i + 1) * rowHeight;
    if (leaderboard[i]) {
      const entry = leaderboard[i];
      ctx.fillStyle = 'white';
      ctx.fillText(i + 1, colX.place, y);
      ctx.fillText(entry.name, colX.name, y);
      ctx.fillText(entry.score, colX.score, y);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(i + 1, colX.place, y);
      ctx.fillText('---', colX.name, y);
      ctx.fillText('0', colX.score, y);
      ctx.fillStyle = 'white';
    }
  }

  // Draw buttons for this screen
  uiButtons
    .filter(btn => btn.screen === "leaderBoard")
    .forEach(btn => btn.draw());
}


setupBricks();
createUIButtons();
gameLoop();

function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) * (canvas.width / rect.width),
        y: (evt.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function getTouchPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const touch = evt.touches[0] || evt.changedTouches[0];
    return {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
}
canvas.addEventListener("click", (e) => {
    const pos = getMousePos(e);
    handleClick(pos.x, pos.y);
});

canvas.addEventListener("touchstart", (e) => {
    const pos = getTouchPos(e);
    handleClick(pos.x, pos.y);
}, { passive: true });


document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") movingLeft = true;
  if (e.key === "ArrowRight") movingRight = true;
  if (e.key === " ") {
    gameState = 'gameScreen';
  }
  if (e.key === 'p' && gameState === 'gameOverScreen') {
    resetGame();
    gameState = 'introScreen';
  }
  if (e.key === 'r' && gameState === 'leaderBoard') {
    gameState = 'introScreen';
  }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") movingLeft = false;
    if (e.key === "ArrowRight") movingRight = false;
});

document.getElementById("left").addEventListener("touchstart", () => movingLeft = true, { passive: true });
document.getElementById("left").addEventListener("touchend", () => movingLeft = false, { passive: true });
document.getElementById("right").addEventListener("touchstart", () => movingRight = true, { passive: true });
document.getElementById("right").addEventListener("touchend", () => movingRight = false, { passive: true });

usernameInput.addEventListener("input", () => {
    usernameInput.value = usernameInput.value.toUpperCase().slice(0,5);
});

document.querySelectorAll('#controls button').forEach(btn => {
  btn.addEventListener('contextmenu', e => e.preventDefault());
});