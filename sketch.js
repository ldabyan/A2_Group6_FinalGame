// ============================================================
// Penguin Mountain — sketch.js
// Lulu's part: spikes, path bounds, flash reveal, camera
// Follows Week 6 pattern: world coords + camera translate
// ============================================================

// ------------------------------------------------------------
// WORLD & CAMERA
// ------------------------------------------------------------
const WORLD_W = 2000;
const WORLD_H = 2000;
const VIEW_W  = 800;   // what the player sees — tell your group this is 800x450
const VIEW_H  = 450;
const CAM_SMOOTHING = 0.1;
let camX = 0;
let camY = 0;

// ------------------------------------------------------------
// ASSETS
// ------------------------------------------------------------
let bgImg, spikeSheet, penguinSheet, stompSheet, blizzardImg;
let winImg, loseImg;

// ------------------------------------------------------------
// PENGUIN SPRITE SHEET
// 1254x1254, 4 cols x 8 rows
// Exact pixel positions found by gap analysis
// ------------------------------------------------------------
const P_COLS = [
  { x: 241, w: 133 },
  { x: 471, w: 129 },
  { x: 675, w: 132 },
  { x: 888, w: 135 },
];
const P_ROWS = [
  { y: 27,   h: 132 }, // row 0 — down
  { y: 188,  h: 123 }, // row 1
  { y: 341,  h: 126 }, // row 2 — up
  { y: 501,  h: 124 }, // row 3
  { y: 656,  h: 130 }, // row 4 — left
  { y: 813,  h: 129 }, // row 5
  { y: 971,  h: 126 }, // row 6 — right
  { y: 1123, h: 122 }, // row 7
];

// ------------------------------------------------------------
// STOMP SPRITE (penguin_stompng_v2.png)
// 1448x1086, 4 cols x 2 rows = 362x543 per frame
// 8 frames total
// ------------------------------------------------------------
const STOMP_COLS  = 4;
const STOMP_ROWS  = 2;
const STOMP_FW    = 362;
const STOMP_FH    = 543;
const STOMP_TOTAL = 8;

// ------------------------------------------------------------
// SPIKE SHEET (spike_plus_goat.png)
// 6 spike variants in top content row (y=91 to 240)
// Positions found by gap analysis
// ------------------------------------------------------------
const SPIKE_VARIANTS = [
  { x: 86,  y: 91, w: 94,  h: 149 },
  { x: 215, y: 91, w: 123, h: 149 },
  { x: 373, y: 91, w: 144, h: 149 },
  { x: 545, y: 91, w: 170, h: 149 },
  { x: 745, y: 91, w: 174, h: 149 },
  { x: 944, y: 91, w: 217, h: 149 },
];

// ------------------------------------------------------------
// PATH BOUNDARIES (world coords)
// The snowy path is a corridor that narrows toward the top.
// Background is 1086x1448 portrait, scaled to WORLD_W x WORLD_H.
// Path edges measured from the background image visually:
//   At bottom (y=2000): left ~28%, right ~72% of width
//   At top    (y=0):    left ~46%, right ~54% of width
// ------------------------------------------------------------
function pathLeft(worldY) {
  return map(worldY, 0, WORLD_H, WORLD_W * 0.46, WORLD_W * 0.22);
}
function pathRight(worldY) {
  return map(worldY, 0, WORLD_H, WORLD_W * 0.54, WORLD_W * 0.78);
}

// ------------------------------------------------------------
// PLAYER
// Starts near bottom centre, moves up the path
// ------------------------------------------------------------
const PLAYER_SPEED = 4;
let player = {
  x: WORLD_W / 2,
  y: WORLD_H - 180,
  w: 90,
  h: 90,
  frameCol: 0,
  frameRow: 0,   // 0=down, 2=up, 4=left, 6=right
  frameTimer: 0,
  frameDelay: 7,
  moving: false,
};

// ------------------------------------------------------------
// STOMP / FLASH
// ------------------------------------------------------------
let stompFrame  = 0;
let stompTimer  = 0;
let isStomping  = false;
let flashActive = false;
let flashTimer  = 0;
const FLASH_DURATION = 90; // ~1.5 sec at 60fps

// ------------------------------------------------------------
// SPIKES (world coords)
// Placed ON the path — x values between pathLeft and pathRight
// Spread across the mountain as player goes up
// ------------------------------------------------------------
let spikes = [
  { x: 960,  y: 1750, variant: 0 },
  { x: 1040, y: 1550, variant: 3 },
  { x: 990,  y: 1350, variant: 1 },
  { x: 1010, y: 1150, variant: 4 },
  { x: 975,  y: 950,  variant: 2 },
  { x: 1025, y: 750,  variant: 5 },
  { x: 985,  y: 550,  variant: 0 },
  { x: 1005, y: 380,  variant: 3 },
];
const SPIKE_DRAW_W = 90;   // bigger than before
const SPIKE_DRAW_H = 90;
const SPIKE_HIT_W  = 70;   // collision box slightly smaller
const SPIKE_HIT_H  = 60;

// ------------------------------------------------------------
// WIN ZONE
// ------------------------------------------------------------
const WIN_Y = 250;

// ------------------------------------------------------------
// GAME STATE
// ------------------------------------------------------------
const STATE_PLAY = "play";
const STATE_DEAD = "dead";
const STATE_WIN  = "win";
let gameState = STATE_PLAY;

// ============================================================
function preload() {
  bgImg        = loadImage("assets/Game_Background.png");
  spikeSheet   = loadImage("assets/spike_plus_goat.png");
  penguinSheet = loadImage("assets/penguin_sprite.png");
  stompSheet   = loadImage("assets/penguin_stompng_v2.png");
  blizzardImg  = loadImage("assets/blizzardd.png");
  winImg       = loadImage("assets/ending_happy_reference.png");
  loseImg      = loadImage("assets/ending_sad_reference.png");
}

function setup() {
  createCanvas(VIEW_W, VIEW_H);
  imageMode(CORNER);
  noSmooth();

  // Start camera so player is visible
  camX = player.x - VIEW_W / 2;
  camY = player.y - VIEW_H / 2;
}

// ============================================================
// DRAW LOOP
// ============================================================
function draw() {
  background(15, 30, 70);

  updateCamera();

  // Everything in world coordinates
  push();
  translate(-camX, -camY);

  drawBackground();

  if (gameState === STATE_PLAY) {
    handleInput();
    applyPathBounds();
    updateStomp();
    updateFlash();
    checkSpikeCollision();
    checkWin();
    drawSpikes(false);
    drawPlayer();
  } else if (gameState === STATE_DEAD) {
    drawSpikes(true);
    drawPlayer();
  } else if (gameState === STATE_WIN) {
    drawPlayer();
  }

  pop(); // back to screen coords

  // HUD always on top
  drawHUD();
  if (gameState === STATE_DEAD) drawDeadScreen();
  if (gameState === STATE_WIN)  drawWinScreen();
}

// ============================================================
// CAMERA — smooth follow, clamped to world (Week 6 style)
// ============================================================
function updateCamera() {
  let targetX = constrain(player.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
  let targetY = constrain(player.y - VIEW_H / 2, 0, WORLD_H - VIEW_H);
  camX = lerp(camX, targetX, CAM_SMOOTHING);
  camY = lerp(camY, targetY, CAM_SMOOTHING);
}

// ============================================================
// BACKGROUND
// ============================================================
function drawBackground() {
  image(bgImg, 0, 0, WORLD_W, WORLD_H);
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
// PATH BOUNDS — penguin stays on the snowy corridor
// ============================================================
function applyPathBounds() {
  let cy = player.y + player.h / 2;
  let left  = pathLeft(cy);
  let right = pathRight(cy);

  player.x = constrain(player.x, left, right - player.w);
  player.y = constrain(player.y, WIN_Y, WORLD_H - player.h);
}

// ============================================================
// STOMP (SPACE)
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
// DRAW SPIKES
// ============================================================
function drawSpikes(forceShow) {
  let show = flashActive || forceShow;
  for (let s of spikes) {
    let v = SPIKE_VARIANTS[s.variant];
    if (show) {
      image(spikeSheet,
        s.x, s.y, SPIKE_DRAW_W, SPIKE_DRAW_H,
        v.x, v.y, v.w, v.h);
    } else {
      // Nearly invisible hint
      noFill();
      stroke(255, 255, 255, 10);
      strokeWeight(1);
      rect(s.x, s.y, SPIKE_DRAW_W, SPIKE_DRAW_H);
      noStroke();
    }
  }
}

// ============================================================
// DRAW PLAYER
// ============================================================
function drawPlayer() {
  if (isStomping) {
    let col = stompFrame % STOMP_COLS;
    let row = floor(stompFrame / STOMP_COLS);
    let sx  = col * STOMP_FW;
    let sy  = row * STOMP_FH;
    image(stompSheet,
      player.x - 15, player.y - 20, player.w + 30, player.h + 30,
      sx, sy, STOMP_FW, STOMP_FH);
    return;
  }

  let col = P_COLS[player.frameCol];
  let row = P_ROWS[player.frameRow];
  image(penguinSheet,
    player.x, player.y, player.w, player.h,
    col.x, row.y, col.w, row.h);
}

// ============================================================
// COLLISION
// ============================================================
function checkSpikeCollision() {
  for (let s of spikes) {
    // Offset hit box to center under spike
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
// HUD (screen coords)
// ============================================================
function drawHUD() {
  noStroke();
  fill(255, 255, 255, 130);
  textAlign(LEFT, BOTTOM);
  textSize(12);
  text("Arrow keys / WASD — move   |   Space — stomp to reveal spikes   |   R — restart", 10, VIEW_H - 8);
}

// ============================================================
// SCREENS (screen coords, drawn after pop())
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

  camX = player.x - VIEW_W / 2;
  camY = player.y - VIEW_H / 2;
}
