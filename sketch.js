// =============================================
// PENGUIN GAME - sketch.js
// Lulu's part: Rocky spikes, bounds, flash reveal
// =============================================

let bgImg, spikeSheet, penguinSheet, stompSheet, blizzardImg;

// --- Penguin sprite sheet exact frame coords ---
// Sheet is 1254x1254, 4 cols x 8 rows
// Frames are NOT evenly spaced — these are the real pixel positions
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
  x: 380,
  y: 460,
  w: 80,
  h: 80,
  speed: 4,
  frameCol: 0,
  frameRow: 0,
  frameTimer: 0,
  frameDelay: 8,
  moving: false,
};

// --- Stomp animation ---
// Sheet: 2172x724, 6 frames horizontally
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

// --- Spikes ---
// frameCol = which spike variant (0–6) from top row of spike_plus_goat.png
const SPIKE_FW = 179;
const SPIKE_FH = 179;
let spikes = [
  { x: 330, y: 310, w: 60, h: 60, frameCol: 0 },
  { x: 490, y: 230, w: 60, h: 60, frameCol: 2 },
  { x: 260, y: 160, w: 60, h: 60, frameCol: 4 },
  { x: 520, y: 360, w: 60, h: 60, frameCol: 1 },
  { x: 380, y: 110, w: 60, h: 60, frameCol: 3 },
  { x: 420, y: 390, w: 60, h: 60, frameCol: 0 },
  { x: 300, y: 400, w: 60, h: 60, frameCol: 2 },
];

// --- Game state ---
let gameState = "playing";
const CW = 800;
const CH = 600;

// =============================================
function preload() {
  bgImg        = loadImage("assets/Game Background.png");
  spikeSheet   = loadImage("assets/spike plus goat.png");
  penguinSheet = loadImage("assets/penguin sprite.png");
  stompSheet   = loadImage("assets/penguin stomp animation.png");
  blizzardImg  = loadImage("assets/blizzardd.png");
}

function setup() {
  createCanvas(CW, CH);
  imageMode(CORNER);
  noSmooth();
}

// =============================================
function draw() {
  background(20, 40, 80);
  image(bgImg, 0, 0, CW, CH);

  if (gameState === "playing") {
    handleInput();
    applyBounds();
    updateStompAnim();
    checkSpikeCollision();
    drawSpikes();
    drawPenguin();
    updateFlash();
  } else if (gameState === "dead") {
    drawSpikes(true);
    drawDeadScreen();
  }
}

// =============================================
// INPUT
function handleInput() {
  penguin.moving = false;

  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
    penguin.x -= penguin.speed;
    penguin.frameRow = 4; // left
    penguin.moving = true;
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
    penguin.x += penguin.speed;
    penguin.frameRow = 6; // right
    penguin.moving = true;
  }
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
    penguin.y -= penguin.speed;
    penguin.frameRow = 2; // up
    penguin.moving = true;
  }
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
    penguin.y += penguin.speed;
    penguin.frameRow = 0; // down
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
// BOUNDS
function applyBounds() {
  penguin.x = constrain(penguin.x, 0, CW - penguin.w);
  penguin.y = constrain(penguin.y, 0, CH - penguin.h);
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
      // Ultra faint hint
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
    image(stompSheet, penguin.x - 10, penguin.y - 15, penguin.w + 20, penguin.h + 20,
          sx, 0, STOMP_FW, STOMP_FH);
    return;
  }

  // Use exact pixel coords for clean crop
  let col = P_COLS[penguin.frameCol];
  let row = P_ROWS[penguin.frameRow];
  image(
    penguinSheet,
    penguin.x, penguin.y, penguin.w, penguin.h,
    col.x, row.y, col.w, row.h
  );
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

// =============================================
// DEAD SCREEN
function drawDeadScreen() {
  fill(0, 0, 20, 170);
  noStroke();
  rect(0, 0, CW, CH);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("Lost in the Storm", CW / 2, CH / 2 - 40);
  textSize(20);
  text("Trust your stomps next time.", CW / 2, CH / 2 + 15);
  textSize(14);
  fill(180);
  text("Press R to try again", CW / 2, CH / 2 + 55);
}

// =============================================
// RESTART
function restartGame() {
  penguin.x = 380;
  penguin.y = 460;
  penguin.frameCol = 0;
  penguin.frameRow = 0;
  isStomping = false;
  stompFrame = 0;
  flashActive = false;
  flashTimer = 0;
  gameState = "playing";
}
