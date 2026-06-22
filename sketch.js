// ============================================================
// Penguin Mountain — sketch.js
// Lulu's part: spikes, path bounds, flash reveal, camera
// ============================================================

const WORLD_W = 2000;
const WORLD_H = 2000;
const VIEW_W  = 800;
const VIEW_H  = 450;
const CAM_SMOOTHING = 0.08;
let camX = 0;
let camY = 0;
let camZoom = 1.0;

let bgImg, spikeSheet, penguinSheet, stompSheet;
let winImg, loseImg;

// Penguin sprite sheet exact frame positions
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

// Stomp sprite
const STOMP_COLS  = 4;
const STOMP_FW    = 362;
const STOMP_FH    = 543;
const STOMP_TOTAL = 8;

// Spike variants
const SPIKE_VARIANTS = [
  { x: 86,  y: 91, w: 94,  h: 149 },
  { x: 215, y: 91, w: 123, h: 149 },
  { x: 373, y: 91, w: 144, h: 149 },
  { x: 545, y: 91, w: 170, h: 149 },
  { x: 745, y: 91, w: 174, h: 149 },
  { x: 944, y: 91, w: 217, h: 149 },
];

// Path boundaries
function pathLeft(worldY) {
  return map(worldY, 0, WORLD_H, WORLD_W * 0.46, WORLD_W * 0.22);
}
function pathRight(worldY) {
  return map(worldY, 0, WORLD_H, WORLD_W * 0.54, WORLD_W * 0.78);
}

const PLAYER_SPEED = 4;
const PLAYER_W = 90;
const PLAYER_H = 90;

let player = {
  x: WORLD_W / 2,
  y: WORLD_H - 180,
  w: PLAYER_W,
  h: PLAYER_H,
  frameCol: 0,
  frameRow: 0,
  frameTimer: 0,
  frameDelay: 7,
  moving: false,
};

// Stomp / Flash
let stompFrame  = 0;
let stompTimer  = 0;
let isStomping  = false;
let flashActive = false;
let flashTimer  = 0;
const FLASH_DURATION = 90;

// Spikes in world coords
const SPIKE_DRAW_W = 90;
const SPIKE_DRAW_H = 90;
const SPIKE_HIT_W  = 65;
const SPIKE_HIT_H  = 55;

let spikes = [
  { x: 960,  y: 1700, variant: 0 },
  { x: 1040, y: 1500, variant: 3 },
  { x: 930,  y: 1350, variant: 1 },
  { x: 1060, y: 1200, variant: 4 },
  { x: 970,  y: 1050, variant: 2 },
  { x: 1030, y: 900,  variant: 5 },
  { x: 950,  y: 780,  variant: 0 },
  { x: 1050, y: 660,  variant: 3 },
  { x: 975,  y: 550,  variant: 1 },
  { x: 1025, y: 450,  variant: 4 },
  { x: 990,  y: 370,  variant: 2 },
];

const WIN_Y = 250;
const STATE_PLAY = "play";
const STATE_DEAD = "dead";
const STATE_WIN  = "win";
let gameState = STATE_PLAY;

// ============================================================
function preload() {
  bgImg        = loadImage("assets/Game Background.png");
  spikeSheet   = loadImage("assets/spike plus goat.png");
  penguinSheet = loadImage("assets/penguin sprite.png");
  stompSheet   = loadImage("assets/penguin stompng v2.png");
  winImg       = loadImage("assets/ending happy reference.png");
  loseImg      = loadImage("assets/ending sad reference.png");
}

function setup() {
  createCanvas(VIEW_W, VIEW_H);
  imageMode(CORNER);
  noSmooth();
  camX = player.x - VIEW_W / 2;
  camY = player.y - VIEW_H / 2;
}

// ============================================================
function draw() {
  background(15, 30, 70);

  if (gameState === STATE_PLAY) {
    handleInput();
    applyPathBounds();
    pushOutOfSpikes();
    updateStomp();
    updateFlash();
    checkSpikeCollision();
    checkWin();
  }

  updateCamera();

  // 1. Draw background WITH zoom — gives perspective effect
  push();
  translate(VIEW_W / 2, VIEW_H / 2);
  scale(camZoom);
  translate(-VIEW_W / 2, -VIEW_H / 2);
  translate(-camX, -camY);
  image(bgImg, 0, 0, WORLD_W, WORLD_H);
  pop();

  // 2. Draw spikes in world coords WITHOUT zoom
  push();
  translate(-camX, -camY);
  drawSpikes();
  pop();

  // 3. Draw penguin in SCREEN coords — always same size
  drawPlayerOnScreen();

  // 4. HUD and screens on top
  drawHUD();
  if (gameState === STATE_DEAD) drawDeadScreen();
  if (gameState === STATE_WIN)  drawWinScreen();
}

// ============================================================
// CAMERA + ZOOM (zoom only affects background)
// ============================================================
function updateCamera() {
  let targetX = constrain(player.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
  let targetY = constrain(player.y - VIEW_H / 2, 0, WORLD_H - VIEW_H);
  camX = lerp(camX, targetX, CAM_SMOOTHING);
  camY = lerp(camY, targetY, CAM_SMOOTHING);

  // Background zooms from 1.0 at bottom to 1.8 near top
  let targetZoom = map(player.y, WORLD_H, WIN_Y, 1.0, 1.8);
  camZoom = lerp(camZoom, constrain(targetZoom, 1.0, 1.8), 0.05);
}

// ============================================================
// INPUT
// ============================================================
function handleInput() {
  player.moving = false;

  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
    player.x -= PLAYER_SPEED;
    player.frameRow = 4;
    player.moving = true;
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
    player.x += PLAYER_SPEED;
    player.frameRow = 6;
    player.moving = true;
  }
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
    player.y -= PLAYER_SPEED;
    player.frameRow = 2;
    player.moving = true;
  }
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
    player.y += PLAYER_SPEED;
    player.frameRow = 0;
    player.moving = true;
  }

  if (player.moving && !isStomping) {
    player.frameTimer++;
    if (player.frameTimer >= player.frameDelay) {
      player.frameTimer = 0;
      player.frameCol = (player.frameCol + 1) % 4;
    }
  } else if (!player.moving) {
    player.frameCol = 0;
  }
}

// ============================================================
// PATH BOUNDS
// ============================================================
function applyPathBounds() {
  let cy = player.y + player.h / 2;
  let left  = pathLeft(cy);
  let right = pathRight(cy);
  player.x = constrain(player.x, left, right - player.w);
  player.y = constrain(player.y, WIN_Y, WORLD_H - player.h);
}

// ============================================================
// SPIKE PUSH BOUNDS
// ============================================================
function pushOutOfSpikes() {
  for (let s of spikes) {
    let hx = s.x + (SPIKE_DRAW_W - SPIKE_HIT_W) / 2;
    let hy = s.y + (SPIKE_DRAW_H - SPIKE_HIT_H);

    if (
      player.x + player.w > hx &&
      player.x < hx + SPIKE_HIT_W &&
      player.y + player.h > hy &&
      player.y < hy + SPIKE_HIT_H
    ) {
      let overlapLeft  = (player.x + player.w) - hx;
      let overlapRight = (hx + SPIKE_HIT_W) - player.x;
      let overlapTop   = (player.y + player.h) - hy;
      let overlapDown  = (hy + SPIKE_HIT_H) - player.y;
      let minOverlap   = min(overlapLeft, overlapRight, overlapTop, overlapDown);

      if (minOverlap === overlapLeft)       player.x = hx - player.w;
      else if (minOverlap === overlapRight) player.x = hx + SPIKE_HIT_W;
      else if (minOverlap === overlapTop)   player.y = hy - player.h;
      else                                  player.y = hy + SPIKE_HIT_H;
    }
  }
}

// ============================================================
// STOMP
// ============================================================
function keyPressed() {
  if (key === ' ' && gameState === STATE_PLAY && !isStomping) {
    isStomping  = true;
    stompFrame  = 0;
    stompTimer  = 0;
    flashActive = true;
    flashTimer  = FLASH_DURATION;
  }
  if ((key === 'r' || key === 'R') && gameState !== STATE_PLAY) {
    restartGame();
  }
}

function updateStomp() {
  if (!isStomping) return;
  stompTimer++;
  if (stompTimer >= 5) {
    stompTimer = 0;
    stompFrame++;
    if (stompFrame >= STOMP_TOTAL) {
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

// ============================================================
// DRAW SPIKES (world coords, no zoom)
// ============================================================
function drawSpikes() {
  for (let s of spikes) {
    let v = SPIKE_VARIANTS[s.variant];
    image(spikeSheet,
      s.x, s.y, SPIKE_DRAW_W, SPIKE_DRAW_H,
      v.x, v.y, v.w, v.h);
  }
}

// ============================================================
// DRAW PLAYER — in screen coords so size never changes
// ============================================================
function drawPlayerOnScreen() {
  // Convert world position to screen position
  let screenX = (player.x - camX) - player.w / 2;
  let screenY = (player.y - camY) - player.h / 2;

  if (isStomping) {
    let col = stompFrame % STOMP_COLS;
    let row = floor(stompFrame / STOMP_COLS);
    image(stompSheet,
      screenX - 15, screenY - 20, player.w + 30, player.h + 30,
      col * STOMP_FW, row * STOMP_FH, STOMP_FW, STOMP_FH);
    return;
  }

  let col = P_COLS[player.frameCol];
  let row = P_ROWS[player.frameRow];
  image(penguinSheet,
    screenX, screenY, player.w, player.h,
    col.x, row.y, col.w, row.h);
}

// ============================================================
// COLLISION
// ============================================================
function checkSpikeCollision() {
  for (let s of spikes) {
    let hx = s.x + (SPIKE_DRAW_W - SPIKE_HIT_W) / 2;
    let hy = s.y + (SPIKE_DRAW_H - SPIKE_HIT_H);
    if (
      player.x + player.w > hx &&
      player.x < hx + SPIKE_HIT_W &&
      player.y + player.h > hy &&
      player.y < hy + SPIKE_HIT_H
    ) {
      gameState = STATE_DEAD;
    }
  }
}

function checkWin() {
  if (player.y <= WIN_Y) gameState = STATE_WIN;
}

// ============================================================
// HUD
// ============================================================
function drawHUD() {
  noStroke();
  fill(255, 255, 255, 130);
  textAlign(LEFT, BOTTOM);
  textSize(12);
  text("Arrow keys / WASD — move   |   Space — stomp   |   R — restart", 10, VIEW_H - 8);
}

// ============================================================
// SCREENS
// ============================================================
function drawDeadScreen() {
  image(loseImg, 0, 0, VIEW_W, VIEW_H);
  fill(0, 0, 0, 100);
  noStroke();
  rect(0, 0, VIEW_W, VIEW_H);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text("Press R to try again", VIEW_W / 2, VIEW_H - 30);
}

function drawWinScreen() {
  image(winImg, 0, 0, VIEW_W, VIEW_H);
  fill(0, 0, 0, 80);
  noStroke();
  rect(0, 0, VIEW_W, VIEW_H);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text("Press R to play again", VIEW_W / 2, VIEW_H - 30);
}

// ============================================================
// RESTART
// ============================================================
function restartGame() {
  player.x        = WORLD_W / 2;
  player.y        = WORLD_H - 180;
  player.frameCol = 0;
  player.frameRow = 0;
  isStomping      = false;
  stompFrame      = 0;
  flashActive     = false;
  flashTimer      = 0;
  gameState       = STATE_PLAY;
  camZoom         = 1.0;
  camX = player.x - VIEW_W / 2;
  camY = player.y - VIEW_H / 2;
}
