// ============================================================
// Penguin Mountain — sketch.js
// Lulu's part: spikes, path bounds, flash reveal, camera
// ============================================================

const WORLD_W = 2000;
const WORLD_H = 2000;
const VIEW_W  = 800;
const VIEW_H  = 450;
const CAM_SMOOTHING = 0.1;
let camX = 0;
let camY = 0;

// Camera zoom — zooms in as penguin goes up the mountain
let camZoom = 1.0;

let bgImg, spikeSheet, penguinSheet, stompSheet, blizzardImg;
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

// Stomp sprite: 1448x1086, 4 cols x 2 rows
const STOMP_COLS  = 4;
const STOMP_FW    = 362;
const STOMP_FH    = 543;
const STOMP_TOTAL = 8;

// Spike variants from sprite sheet
const SPIKE_VARIANTS = [
  { x: 86,  y: 91, w: 94,  h: 149 },
  { x: 215, y: 91, w: 123, h: 149 },
  { x: 373, y: 91, w: 144, h: 149 },
  { x: 545, y: 91, w: 170, h: 149 },
  { x: 745, y: 91, w: 174, h: 149 },
  { x: 944, y: 91, w: 217, h: 149 },
];

// Path boundaries — snowy corridor narrows toward top
function pathLeft(worldY) {
  return map(worldY, 0, WORLD_H, WORLD_W * 0.46, WORLD_W * 0.22);
}
function pathRight(worldY) {
  return map(worldY, 0, WORLD_H, WORLD_W * 0.54, WORLD_W * 0.78);
}

const PLAYER_SPEED = 4;
let player = {
  x: WORLD_W / 2,
  y: WORLD_H - 180,
  w: 90,
  h: 90,
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

// Spikes — placed well above spawn so player doesn't die immediately
const SPIKE_DRAW_W = 90;
const SPIKE_DRAW_H = 90;
const SPIKE_HIT_W  = 65;
const SPIKE_HIT_H  = 55;

let spikes = [
  { x: 960,  y: 1500, variant: 0 },
  { x: 1040, y: 1300, variant: 3 },
  { x: 990,  y: 1100, variant: 1 },
  { x: 1010, y: 900,  variant: 4 },
  { x: 975,  y: 700,  variant: 2 },
  { x: 1025, y: 550,  variant: 5 },
  { x: 985,  y: 400,  variant: 0 },
  { x: 1005, y: 280,  variant: 3 },
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
  blizzardImg  = loadImage("assets/blizzardd.png");
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

  updateCamera();

  push();
  // Apply zoom centered on canvas
  translate(VIEW_W / 2, VIEW_H / 2);
  scale(camZoom);
  translate(-VIEW_W / 2, -VIEW_H / 2);
  translate(-camX, -camY);

  drawBackground();

  if (gameState === STATE_PLAY) {
    handleInput();
    applyPathBounds();
    pushOutOfSpikes();
    updateStomp();
    updateFlash();
    checkSpikeCollision();
    checkWin();
    drawSpikes();
    drawPlayer();
  } else if (gameState === STATE_DEAD) {
    drawSpikes();
    drawPlayer();
  } else if (gameState === STATE_WIN) {
    drawPlayer();
  }

  pop();

  drawHUD();
  if (gameState === STATE_DEAD) drawDeadScreen();
  if (gameState === STATE_WIN)  drawWinScreen();
}

// ============================================================
// CAMERA + ZOOM
// Zoom increases as penguin goes further up the mountain
// ============================================================
function updateCamera() {
  let targetX = constrain(player.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
  let targetY = constrain(player.y - VIEW_H / 2, 0, WORLD_H - VIEW_H);
  camX = lerp(camX, targetX, CAM_SMOOTHING);
  camY = lerp(camY, targetY, CAM_SMOOTHING);

  // Zoom from 1.0 at bottom to 1.8 at top
  let targetZoom = map(player.y, WORLD_H, WIN_Y, 1.0, 1.8);
  camZoom = lerp(camZoom, targetZoom, 0.05);
}

// ============================================================
function drawBackground() {
  image(bgImg, 0, 0, WORLD_W, WORLD_H);
}

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
// SPIKE BOUNDS — push penguin out of spike zones
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
      // Push player back based on which side they came from
      let overlapLeft  = (player.x + player.w) - hx;
      let overlapRight = (hx + SPIKE_HIT_W) - player.x;
      let overlapTop   = (player.y + player.h) - hy;
      let overlapDown  = (hy + SPIKE_HIT_H) - player.y;

      let minOverlap = min(overlapLeft, overlapRight, overlapTop, overlapDown);

      if (minOverlap === overlapLeft)  player.x = hx - player.w;
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
// DRAW SPIKES — always visible now
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
// DRAW PLAYER
// ============================================================
function drawPlayer() {
  if (isStomping) {
    let col = stompFrame % STOMP_COLS;
    let row = floor(stompFrame / STOMP_COLS);
    image(stompSheet,
      player.x - 15, player.y - 20, player.w + 30, player.h + 30,
      col * STOMP_FW, row * STOMP_FH, STOMP_FW, STOMP_FH);
    return;
  }
  let col = P_COLS[player.frameCol];
  let row = P_ROWS[player.frameRow];
  image(penguinSheet,
    player.x, player.y, player.w, player.h,
    col.x, row.y, col.w, row.h);
}

// ============================================================
// COLLISION — death on spike touch
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
