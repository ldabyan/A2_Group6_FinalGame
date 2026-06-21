// =============================================
// PENGUIN GAME - sketch.js
// Lulu's part: Rocky spikes, bounds, flash reveal
// =============================================

// --- Assets ---
let bgImg, spikeSheet, penguinSheet, stompSheet, blizzardImg;

// --- Penguin ---
let penguin = {
  x: 400,
  y: 480,
  w: 60,
  h: 70,
  speed: 4,
  frameX: 0,     // current animation column
  frameY: 0,     // current animation row (direction)
  frameTimer: 0,
  frameDelay: 8, // frames between sprite updates
};

// Penguin sprite sheet: 4 cols x 8 rows, each frame ~314x157px
const PENGUIN_COLS = 4;
const PENGUIN_FRAME_W = 314;
const PENGUIN_FRAME_H = 157;

// Stomp animation: 6 frames in a row, each ~362x724px
const STOMP_FRAMES = 6;
const STOMP_FRAME_W = 362;
const STOMP_FRAME_H = 724;
let stompFrame = 0;
let stompTimer = 0;
let isStomping = false;
let stompAnimDone = false;

// --- Flash (stomp reveal) ---
let flashActive = false;
let flashTimer = 0;
const FLASH_DURATION = 90; // frames the spikes stay visible after stomp

// --- Spikes ---
// Each spike: { x, y, w, h, frameCol } 
// frameCol picks which spike sprite from the sheet (0-6)
// Spikes are placed along the path, scattered
let spikes = [
  { x: 320, y: 300, w: 55, h: 55, frameCol: 0 },
  { x: 480, y: 220, w: 55, h: 55, frameCol: 2 },
  { x: 250, y: 150, w: 55, h: 55, frameCol: 4 },
  { x: 550, y: 350, w: 55, h: 55, frameCol: 1 },
  { x: 370, y: 100, w: 55, h: 55, frameCol: 3 },
  { x: 430, y: 400, w: 55, h: 55, frameCol: 0 },
  { x: 290, y: 380, w: 55, h: 55, frameCol: 2 },
];

// Spike sprite sheet rows: row 0 = spikes, row 1 = holes
// 7 spike variants across top row, each ~179px
const SPIKE_COLS = 7;
const SPIKE_FRAME_W = 179;
const SPIKE_FRAME_H = 179;

// --- Game state ---
let gameState = "playing"; // "playing", "dead"
let canvasW = 800;
let canvasH = 600;

// =============================================
function preload() {
  bgImg       = loadImage("assets/Game Background.png");
  spikeSheet  = loadImage("assets/spike plus goat.png");
  penguinSheet = loadImage("assets/penguin sprite.png");
  stompSheet  = loadImage("assets/penguin stomp animation.png");
  blizzardImg = loadImage("assets/blizzardd.png");
}

// =============================================
function setup() {
  createCanvas(canvasW, canvasH);
  imageMode(CORNER);
  noSmooth(); // keep pixel art crisp
}

// =============================================
function draw() {
  background(30, 50, 90);

  // Draw background
  drawBackground();

  if (gameState === "playing") {
    handleInput();
    applyBounds();
    updateStompAnim();
    checkSpikeCollision();
    drawSpikes();
    drawPenguin();
    updateFlash();
  } else if (gameState === "dead") {
    drawSpikes(); // show spikes on death screen
    drawDeadScreen();
  }
}

// =============================================
// BACKGROUND
function drawBackground() {
  // Scale background to fill canvas
  image(bgImg, 0, 0, canvasW, canvasH);
}

// =============================================
// INPUT & MOVEMENT
function handleInput() {
  let moving = false;

  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {  // A
    penguin.x -= penguin.speed;
    penguin.frameY = 1; // left-facing row (adjust to match your sprite sheet)
    moving = true;
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // D
    penguin.x += penguin.speed;
    penguin.frameY = 2; // right-facing row
    moving = true;
  }
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) {    // W
    penguin.y -= penguin.speed;
    penguin.frameY = 3; // up-facing row
    moving = true;
  }
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {  // S
    penguin.y += penguin.speed;
    penguin.frameY = 0; // down-facing row
    moving = true;
  }

  // Animate walk cycle
  if (moving && !isStomping) {
    penguin.frameTimer++;
    if (penguin.frameTimer >= penguin.frameDelay) {
      penguin.frameTimer = 0;
      penguin.frameX = (penguin.frameX + 1) % PENGUIN_COLS;
    }
  } else if (!moving) {
    penguin.frameX = 0; // idle frame
  }
}

// =============================================
// BOUNDS — penguin stays inside canvas
function applyBounds() {
  penguin.x = constrain(penguin.x, 0, canvasW - penguin.w);
  penguin.y = constrain(penguin.y, 0, canvasH - penguin.h);
}

// =============================================
// STOMP — triggered by SPACE key
function keyPressed() {
  if (key === ' ' && gameState === "playing" && !isStomping) {
    triggerStomp();
  }
  // Restart on R after death
  if (key === 'r' || key === 'R') {
    restartGame();
  }
}

function triggerStomp() {
  isStomping = true;
  stompFrame = 0;
  stompTimer = 0;
  stompAnimDone = false;

  // Activate the flash reveal
  flashActive = true;
  flashTimer = FLASH_DURATION;
}

function updateStompAnim() {
  if (!isStomping) return;

  stompTimer++;
  if (stompTimer >= 5) { // advance stomp frame every 5 draw frames
    stompTimer = 0;
    stompFrame++;
    if (stompFrame >= STOMP_FRAMES) {
      isStomping = false;
      stompFrame = 0;
    }
  }
}

// =============================================
// FLASH TIMER
function updateFlash() {
  if (flashActive) {
    flashTimer--;
    if (flashTimer <= 0) {
      flashActive = false;
    }
  }
}

// =============================================
// DRAW SPIKES
// Spikes are hidden unless flashActive (stomp reveal) or game is over
function drawSpikes() {
  let showSpikes = flashActive || gameState === "dead";

  for (let s of spikes) {
    if (showSpikes) {
      // Draw spike from sprite sheet — top row, pick frameCol
      let sx = s.frameCol * SPIKE_FRAME_W;
      let sy = 0; // row 0 = spikes

      image(
        spikeSheet,
        s.x, s.y, s.w, s.h,          // destination on canvas
        sx, sy, SPIKE_FRAME_W, SPIKE_FRAME_H  // source from sheet
      );
    } else {
      // Hidden: draw a very faint outline so player can learn over time
      // (optional — remove if you want totally invisible)
      noFill();
      stroke(255, 255, 255, 15);
      strokeWeight(1);
      rect(s.x, s.y, s.w, s.h);
      noStroke();
    }
  }
}

// =============================================
// DRAW PENGUIN
function drawPenguin() {
  if (isStomping) {
    // Show stomp animation frame
    let sx = stompFrame * STOMP_FRAME_W;
    image(
      stompSheet,
      penguin.x - 10, penguin.y - 20, penguin.w + 20, penguin.h + 20,
      sx, 0, STOMP_FRAME_W, STOMP_FRAME_H
    );
  } else {
    // Show walk/idle frame from penguin_sprite sheet
    let sx = penguin.frameX * PENGUIN_FRAME_W;
    let sy = penguin.frameY * PENGUIN_FRAME_H;
    image(
      penguinSheet,
      penguin.x, penguin.y, penguin.w, penguin.h,
      sx, sy, PENGUIN_FRAME_W, PENGUIN_FRAME_H
    );
  }
}

// =============================================
// SPIKE COLLISION
function checkSpikeCollision() {
  for (let s of spikes) {
    if (
      penguin.x < s.x + s.w &&
      penguin.x + penguin.w > s.x &&
      penguin.y < s.y + s.h &&
      penguin.y + penguin.h > s.y
    ) {
      gameState = "dead";
    }
  }
}

// =============================================
// DEAD SCREEN
function drawDeadScreen() {
  // Dark overlay
  fill(0, 0, 30, 160);
  rect(0, 0, canvasW, canvasH);

  // Text
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("Lost in the Storm", canvasW / 2, canvasH / 2 - 40);
  textSize(22);
  text("Trust your stomps next time.", canvasW / 2, canvasH / 2 + 20);
  textSize(16);
  fill(200);
  text("Press R to try again", canvasW / 2, canvasH / 2 + 60);
}

// =============================================
// RESTART
function restartGame() {
  penguin.x = 400;
  penguin.y = 480;
  penguin.frameX = 0;
  penguin.frameY = 0;
  isStomping = false;
  stompFrame = 0;
  flashActive = false;
  flashTimer = 0;
  gameState = "playing";
}
