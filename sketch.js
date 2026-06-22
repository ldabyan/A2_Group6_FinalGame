// =============================================
// PENGUIN GAME - sketch.js
// Lulu's part: Rocky spikes, bounds, flash reveal
// World is 2000x2000, camera follows penguin
// Penguin stays on the snowy path only
// =============================================

let bgImg, spikeSheet, penguinSheet, stompSheet, blizzardImg;

// --- World & Camera ---
const WORLD_W = 2000;
const WORLD_H = 2000;
const VIEW_W  = 800;   // what you see on screen
const VIEW_H  = 600;
let camX = 0;
let camY = 0;

// --- Path boundaries (in world coords) ---
// The path is a triangle/corridor that gets wider toward the bottom
// Top of path is narrow, bottom is wide — matches the background perspective
// These values define the LEFT and RIGHT wall of the path at any given Y
function pathLeftAt(y) {
  // Path narrows as y decreases (going up = further away)
  // At bottom (y=2000): left edge ~500
  // At top (y=0): left edge ~950 (nearly center)
  return map(y, 0, WORLD_H, 950, 450);
}
function pathRightAt(y) {
  // Mirror of left
  return map(y, 0, WORLD_H, 1050, 1550);
}

// --- Penguin sprite exact frame coords ---
const P_COLS = [
  { x: 241, w: 133 },
  { x: 471, w: 129 },
  { x: 675, w: 132 },
  { x: 888, w: 135 },
];
const P_ROWS = [
  { y: 27,   h: 132 },
  { y: 188,  h: 123 },
  { y: 341,  h: 126 },
  { y: 501,  h: 124 },
  { y: 656,  h: 130 },
  { y: 813,  h: 129 },
  { y: 971,  h: 126 },
  { y: 1123, h: 122 },
];

// --- Penguin ---
let penguin = {
  x: 1000,   // start in center of world
  y: 1800,   // start near bottom
  w: 80,
  h: 80,
  speed: 4,
  frameCol: 0,
  frameRow: 0,
  frameTimer: 0,
  frameDelay: 8,
  moving: false,
};

// --- Stomp ---
const STOMP_FRAMES = 6;
const STOMP_FW = 362;
const STOMP_FH = 724;
let stompFrame = 0;
let stompTimer = 0;
let isStomping = false;

// --- Flash reveal ---
let flashActive = false;
let flashTimer = 0;
const FLASH_DURATION = 90;

// --- Spikes (world coords) ---
const SPIKE_FW = 179;
const SPIKE_FH = 179;
let spikes = [
  { x: 980,  y: 1600, w: 65, h: 65, frameCol: 0 },
  { x: 1050, y: 1400, w: 65, h: 65, frameCol: 2 },
  { x: 960,  y: 1200, w: 65, h: 65, frameCol: 4 },
  { x: 1020, y: 1000, w: 65, h: 65, frameCol: 1 },
  { x: 990,  y: 800,  w: 65, h: 65, frameCol: 3 },
  { x: 970,  y: 600,  w: 65, h: 65, frameCol: 0 },
  { x: 1010, y: 400,  w: 65, h: 65, frameCol: 2 },
];

// --- Win zone (reach the top) ---
const WIN_Y = 200;

// --- Game state ---
let gameState = "playing"; // "playing", "dead", "win"

// =============================================
function preload() {
  bgImg        = loadImage("assets/Game Background.png");
  spikeSheet   = loadImage("assets/spike plus goat.png");
  penguinSheet = loadImage("assets/penguin sprite.png");
  stompSheet   = loadImage("assets/penguin stomp animation.png");
  blizzardImg  = loadImage("assets/blizzardd.png");
}

function setup() {
  createCanvas(VIEW_W, VIEW_H);
  imageMode(CORNER);
  noSmooth();
}

// =============================================
function draw() {
  background(20, 40, 80);

  // Update camera to follow penguin (centered on screen)
  camX = constrain(penguin.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
  camY = constrain(penguin.y - VIEW_H / 2, 0, WORLD_H - VIEW_H);

  // Draw world offset by camera
  push();
  translate(-camX, -camY);

  drawBackground();

  if (gameState === "playing") {
    handleInput();
    applyPathBounds();
    updateStompAnim();
    checkSpikeCollision();
    checkWin();
    drawSpikes();
    drawPenguin();
    updateFlash();
  } else if (gameState === "dead") {
    drawSpikes(true);
    drawPenguin();
  } else if (gameState === "win") {
    drawPenguin();
  }

  pop();

  // HUD drawn on top (screen coords, not world)
  if (gameState === "dead") drawDeadScreen();
  if (gameState === "win")  drawWinScreen();
  drawControls();
}

// =============================================
// BACKGROUND — tile/stretch to fill world
function drawBackground() {
  // Stretch background across full world
  image(bgImg, 0, 0, WORLD_W, WORLD_H);

  // Optional: draw faint path boundary lines for debugging
  // stroke(255, 0, 0, 80);
  // for (let y = 0; y < WORLD_H; y += 20) {
  //   line(pathLeftAt(y), y, pathLeftAt(y)+2, y);
  //   line(pathRightAt(y), y, pathRightAt(y)+2, y);
  // }
}

// =============================================
// INPUT
function handleInput() {
  penguin.moving = false;
  let prevX = penguin.x;
  let prevY = penguin.y;

  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
    penguin.x -= penguin.speed;
    penguin.frameRow = 4;
    penguin.moving = true;
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
    penguin.x += penguin.speed;
    penguin.frameRow = 6;
    penguin.moving = true;
  }
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
    penguin.y -= penguin.speed;
    penguin.frameRow = 2;
    penguin.moving = true;
  }
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
    penguin.y += penguin.speed;
    penguin.frameRow = 0;
    penguin.moving = true;
  }

  if (penguin.moving && !isStomping) {
    penguin.frameTimer++;
    if (penguin.frameTimer >= penguin.frameDelay) {
      penguin.frameTimer = 0;
      penguin.frameCol = (penguin.frameCol + 1) % 4;
    }
  } else if (!penguin.moving) {
    penguin.frameCol = 0;
  }
}

// =============================================
// PATH BOUNDS — penguin stays on the snowy path
function applyPathBounds() {
  let penguinCenterY = penguin.y + penguin.h / 2;
  let left  = pathLeftAt(penguinCenterY);
  let right = pathRightAt(penguinCenterY);

  // Clamp x to path
  penguin.x = constrain(penguin.x, left, right - penguin.w);

  // Clamp y to world
  penguin.y = constrain(penguin.y, 0, WORLD_H - penguin.h);
}

// =============================================
// STOMP
function keyPressed() {
  if (key === ' ' && gameState === "playing" && !isStomping) {
    isStomping = true;
    stompFrame = 0;
    stompTimer = 0;
    flashActive = true;
    flashTimer = FLASH_DURATION;
  }
  if ((key === 'r' || key === 'R') && gameState === "dead") {
    restartGame();
  }
}

function updateStompAnim() {
  if (!isStomping) return;
  stompTimer++;
  if (stompTimer >= 5) {
    stompTimer = 0;
    stompFrame++;
    if (stompFrame >= STOMP_FRAMES) {
      isStomping = false;
      stompFrame = 0;
    }
  }
}

function updateFlash() {
  if (flashActive) {
    flashTimer--;
    if (flashTimer <= 0) flashActive = false;
  }
}

// =============================================
// DRAW SPIKES
function drawSpikes(forceShow = false) {
  let show = flashActive || forceShow;
  for (let s of spikes) {
    if (show) {
      let sx = s.frameCol * SPIKE_FW;
      image(spikeSheet, s.x, s.y, s.w, s.h, sx, 0, SPIKE_FW, SPIKE_FH);
    } else {
      noFill();
      stroke(255, 255, 255, 12);
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
    let sx = stompFrame * STOMP_FW;
    image(stompSheet,
      penguin.x - 10, penguin.y - 15, penguin.w + 20, penguin.h + 20,
      sx, 0, STOMP_FW, STOMP_FH);
    return;
  }
  let col = P_COLS[penguin.frameCol];
  let row = P_ROWS[penguin.frameRow];
  image(penguinSheet,
    penguin.x, penguin.y, penguin.w, penguin.h,
    col.x, row.y, col.w, row.h);
}

// =============================================
// COLLISION
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

// WIN
function checkWin() {
  if (penguin.y <= WIN_Y) gameState = "win";
}

// =============================================
// SCREENS
function drawDeadScreen() {
  fill(0, 0, 20, 170);
  noStroke();
  rect(0, 0, VIEW_W, VIEW_H);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(46);
  text("Lost in the Storm", VIEW_W / 2, VIEW_H / 2 - 40);
  textSize(20);
  text("Trust your stomps next time.", VIEW_W / 2, VIEW_H / 2 + 15);
  textSize(14);
  fill(180);
  text("Press R to try again", VIEW_W / 2, VIEW_H / 2 + 55);
}

function drawWinScreen() {
  fill(0, 20, 0, 160);
  noStroke();
  rect(0, 0, VIEW_W, VIEW_H);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(46);
  text("You Survived!", VIEW_W / 2, VIEW_H / 2 - 30);
  textSize(20);
  text("The mountain couldn't stop you.", VIEW_W / 2, VIEW_H / 2 + 20);
}

function drawControls() {
  fill(255, 255, 255, 120);
  noStroke();
  textAlign(LEFT, BOTTOM);
  textSize(12);
  text("Arrow keys / WASD: move   |   Space: stomp to reveal spikes", 10, VIEW_H - 10);
}

// =============================================
// RESTART
function restartGame() {
  penguin.x = 1000;
  penguin.y = 1800;
  penguin.frameCol = 0;
  penguin.frameRow = 0;
  isStomping = false;
  stompFrame = 0;
  flashActive = false;
  flashTimer = 0;
  gameState = "playing";
}
