// --- CANVAS SETUP ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 400;

// --- SPIELVARIABLEN ---
const groundHeight = 80;

const player = {
  x: 50,
  y: canvas.height - groundHeight - 60,
  width: 40,
  height: 60,
  velocityY: 0,
  jumpForce: 15,
  gravity: 0.8,
  grounded: true,
  jumpCount: 0,
  baseColor: "blue",
  color: "blue",
  invulnerable: false,
  invTimer: 0
};

let obstacles = [];
let obstacleTimer = 0;
let speed = 5;
let score = 0;
let gameRunning = false;
let highscore = localStorage.getItem("endlessRunnerHighscore") || 0;

let powerup = null;
let powerupTimer = 0;

// --- HINTERGRUND FÜR PARALLAX ---
const backgroundLayers = [
  { x: 0, y: 0, speed: 0.5, color: "#a0d8f7" },
  { x: 0, y: 50, speed: 1, color: "#70c0ff" }
];

// --- HINDERNIS-TYPEN ---
const obstacleTypes = [
  { width: 50, height: 20, color: "red" },
  { width: 10, height: 120, color: "red" },
  { width: 150, height: 10, color: "red" }
];

// --- POWERUP TYPEN ---
const powerupTypes = [
  { width: 30, height: 30, color: "gold", effect: "invulnerable" }
];

// --- AUDIO ---
const powerupSound = new Audio("https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum_hit.ogg");

// --- FUNKTION: NEUES HINDERNIS ---
function createObstacle() {
  const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  obstacles.push({
    x: canvas.width,
    y: canvas.height - groundHeight - type.height,
    width: type.width,
    height: type.height,
    color: type.color
  });
}

// --- FUNKTION: NEUES POWERUP ---
function createPowerup() {
  const type = powerupTypes[0];
  powerup = {
    x: canvas.width,
    y: canvas.height - groundHeight - type.height - 10,
    width: type.width,
    height: type.height,
    color: type.color,
    effect: type.effect
  };
}

// --- FUNKTION: SPIELUPDATES ---
function update() {
  if (!gameRunning) return;

  // Spieler Gravitation & Bewegung
  player.velocityY += player.gravity;
  player.y += player.velocityY;

  // Spieler auf Boden setzen
  if (player.y + player.height >= canvas.height - groundHeight) {
    player.y = canvas.height - groundHeight - player.height;
    player.velocityY = 0;
    player.grounded = true;
    player.jumpCount = 0;
    player.color = player.baseColor; // Farbe zurücksetzen
  } else {
    player.grounded = false;
  }

  // Hindernisse bewegen
  obstacles.forEach(obstacle => {
    obstacle.x -= speed;
  });
  obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);

  // Neue Hindernisse erzeugen
  obstacleTimer++;
  if (obstacleTimer > 80) {
    if (Math.random() < 0.8) createObstacle();  // 80% Hindernis
    if (!powerup && Math.random() < 0.02) createPowerup();  // 2% Powerup
    obstacleTimer = 0;
  }

  // Powerup bewegen
  if (powerup) {
    powerup.x -= speed;
    if (powerup.x + powerup.width < 0) powerup = null;
  }

  // Kollision mit Hindernissen
  for (let obstacle of obstacles) {
    if (collision(player, obstacle)) {
      if (!player.invulnerable) {
        endGame();
        return;
      }
    }
  }

  // Kollision mit Powerup
  if (powerup && collision(player, powerup)) {
    powerupSound.play();
    applyPowerup(powerup.effect);
    powerup = null;
  }

  // Powerup Timer runterzählen
  if (player.invulnerable) {
    player.invTimer--;
    player.color = (player.invTimer % 10 < 5) ? "yellow" : player.baseColor; // blink Effekt

    if (player.invTimer <= 0) {
      player.invulnerable = false;
      player.color = player.baseColor;
    }
  }

  // Hintergrund scrollen
  backgroundLayers.forEach(layer => {
    layer.x -= layer.speed;
    if (layer.x <= -canvas.width) layer.x = 0;
  });

  // Geschwindigkeit erhöhen
  if (score > 0 && score % 500 === 0) {
    speed += 3.0;
  }

  // Punkte erhöhen
  score++;
}

// --- FUNKTION: KOLLISIONS-PRÜFUNG ---
function collision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

// --- FUNKTION: POWERUP ANWENDEN ---
function applyPowerup(effect) {
  if (effect === "invulnerable") {
    player.invulnerable = true;
    player.invTimer = 300; // ca 5 Sekunden bei 60 FPS
  }
}

// --- FUNKTION: ZEICHNEN ---
function draw() {
  if (!gameRunning) return;

  // Hintergrund zeichnen (Parallax)
  backgroundLayers.forEach(layer => {
    ctx.fillStyle = layer.color;
    ctx.fillRect(layer.x, layer.y, canvas.width, canvas.height);
    ctx.fillRect(layer.x + canvas.width, layer.y, canvas.width, canvas.height);
  });

  // Boden zeichnen
  ctx.fillStyle = "green";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Spieler zeichnen
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Hindernisse zeichnen
  obstacles.forEach(obstacle => {
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });

  // Powerup zeichnen
  if (powerup) {
    ctx.fillStyle = powerup.color;
    ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
  }

  // Punkte und Highscore anzeigen
  ctx.fillStyle = "black";
  ctx.font = "24px Arial";
  ctx.fillText("Punkte: " + score, 20, 30);
  ctx.fillText("Highscore: " + highscore, 20, 60);
}

// --- SPIELSCHLEIFE ---
function gameLoop() {
  update();
  draw();
  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

// --- SPIELENDE ---
function endGame() {
  gameRunning = false;
  document.getElementById("gameOverScreen").style.display = "block";
  canvas.style.display = "none";
  document.getElementById("finalScore").innerText = "Dein Score: " + score;

  // Highscore speichern
  if (score > highscore) {
    highscore = score;
    localStorage.setItem("endlessRunnerHighscore", highscore);
  }

  document.getElementById("highscoreAfterGame").innerText = "Highscore: " + highscore;
}

// --- NEUSTART FUNKTION ---
function restartGame() {
  obstacles = [];
  obstacleTimer = 0;
  speed = 5;
  score = 0;
  player.y = canvas.height - groundHeight - player.height;
  player.velocityY = 0;
  player.grounded = true;
  player.jumpCount = 0;
  player.invulnerable = false;
  player.color = player.baseColor;
  powerup = null;
  powerupTimer = 0;

  gameRunning = true;
  canvas.style.display = "block";
  document.getElementById("gameOverScreen").style.display = "none";
  gameLoop();
}

// --- SPIEL STARTEN ---
function startGame() {
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";
  gameRunning = true;
  gameLoop();
}

// --- STEUERUNG MIT DOPPELSPRUNG UND SOUND ---
window.addEventListener("keydown", function(e) {
  if ((e.code === "Space" || e.code === "ArrowUp") && gameRunning) {
    if (player.grounded || player.jumpCount < 2) {
      player.velocityY = -player.jumpForce;
      player.jumpCount++;
      player.grounded = false;
      jumpSound.play();
      player.color = "lightblue"; // kurze Farbänderung beim Springen
    }
  }
});

// Mobile Touch-Steuerung
canvas.addEventListener("touchstart", () => {
  if (!gameRunning) return;
  if (player.grounded || player.jumpCount < player.maxJumps) {
    player.velocityY = player.jumpForce;
    player.grounded = false;
    player.jumpCount++;
    player.color = "lightblue";
    setTimeout(() => (player.color = player.baseColor), 200);
  }
});

// --- Highscore beim Menü anzeigen ---
document.getElementById("highscoreDisplay").innerText = "Highscore: " + highscore;
