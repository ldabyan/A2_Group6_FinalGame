// ============================================================
// Penguin + Animated Blizzard + Timer + Stomp Animation
// Canvas: 800 x 450
// ============================================================

// Screen manager
let gameState = "loss"; 
let startBg;
let winBg;
let lossBg;
let bgImg;
let start_penguin;

// Start screen penguin animation
let testFrame = 0;
let testFrameTimer = 0;

// Buttons states:
let startBtnPressed = false;
let winBtnPressed = false;
let lossBtnPressed = false;
let tutorialBtnPressed = false;
let homeBtnPressed = false;

// Background stuff
const VIEW_W  = 1200;
const VIEW_H  = 800;
let WORLD_W;
let WORLD_H;
const CAM_SMOOTHING = 0.08;
let camX = 0;
let camY = 0;
let camZoom = 2; //change back to 2

// Diagonal wall bounds
const walls = [];

const SPRITES = {
  up: {
    img: null,
    frameWidth: 155,
    frameHeight: 152,
    numFrames: 4,
    animSpeed: 7,
    scale: 0.8,

    cropLeft:  [0, 10, 20, 20],
    cropRight: [25, 20, 10, 5],
    cropTop:   [0, 0, 0, 0],
    cropBottom:[0, 0, 0, 0]
  },

  start_penguin: {
    img: null,
    frameWidth: 155,
    frameHeight: 152,
    numFrames: 4,
    animSpeed: 40,
    scale: 3,

    cropLeft:  [0, 10, 20, 20],
    cropRight: [25, 20, 10, 5],
    cropTop:   [0, 0, 0, 0],
    cropBottom:[0, 0, 0, 0]
  },

  left: {
    img: null,
    frameWidth: 152,
    frameHeight: 137,
    numFrames: 4,
    animSpeed: 9,
    scale: 0.8,

    cropLeft:  [0, 15, 20, 30],
    cropRight: [30, 20, 10, 5],
    cropTop:   [0, 0, 0, 0],
    cropBottom:[0, 0, 0, 0]
  },

  right: {
    img: null,
    frameWidth: 152,
    frameHeight: 136,
    numFrames: 4,
    animSpeed: 7,
    scale: 0.8,

    cropLeft:  [0, 15, 20, 30],
    cropRight: [30, 20, 10, 5],
    cropTop:   [0, 0, 0, 0],
    cropBottom:[0, 0, 0, 0]
  },

  stomp: {
    img: null,
    frameWidth: 140,
    frameHeight: 210,
    numFrames: 6,
    animSpeed: 10,
    scale: 1.05,

    cropLeft:   [0,0,0,0,0,0],
    cropRight:  [0,0,0,0,0,0],
    cropTop:    [0,0,0,0,0,0],
    cropBottom: [0,0,0,0,0,0]
  }
};

let player = {
  x: 0,
  y: 0,
  w: 90,
  h: 90,
  speed: 3,
  currentFrame: 0,
  frameTimer: 0,
  direction: "up",
  isMoving: false,
};

const PENGUIN_HITBOX = {
  w: 50,
  h: 60,
  offsetX: -25,
  offsetY: -50   // because the sprite is now anchored at the feet
};

let DEBUG_PENGUIN_HITBOX = false; // remove after debugging

let clearRadius = 120;
let holeOffsetX = -5;
let holeOffsetY = -70;

// TIMER
let totalTime = 150;
let startTime;
let gameEnded = false;  
let finalTime = null;
let flashTimer = 0;

//STOMPING ANIMATION
let stompAnimating = false;
let stompFrame = 0;
let stompFrameTimer = 0;
const STOMP_FRAME_DURATIONS = [10, 10, 10, 10, 70, 10];
const STOMP_NUM_FRAMES = 6;
let waveActive = false;
let waveRadius = 100;
let waveMaxRadius = 600; 
let waveGrowth = 25;
let waveDelay = 0;
let waveDelayActive = false;
let blueBuffer;
let ringMaskBuffer;
let worldBuffer;
let ringOffsetX = 0;
let ringOffsetY = -50;
let stompOffsetX = -5;
let stompOffsetY = 0;

// ROCKY SPIKES
const SPIKE_DRAW_W = 90;
const SPIKE_DRAW_H = 90;
const SPIKE_HITBOXES = [
  { w: 75, h: 75, offsetX: 7, offsetY: 10 },  // small spike
  { w: 85, h: 80, offsetX: 3, offsetY: 5 },  // mid spike
  { w: 85, h: 85, offsetX: 2, offsetY: 0 },  // tall spike
  { w: 85, h: 70, offsetX: 0, offsetY: 10 }   // double spike
];
let spikeImages = [];
let spikes = [];
let DEBUG_SPIKE_HITBOXES = false; //remove after testing

function preload() {
  SPRITES.up.img = loadImage("assets/images/penguin_front.png");
  SPRITES.start_penguin.img = loadImage("assets/images/penguin_front.png");
  SPRITES.left.img = loadImage("assets/images/penguin_left.png");
  SPRITES.right.img = loadImage("assets/images/penguin_right.png");
  SPRITES.stomp.img = loadImage("assets/images/penguin_stomp.png");
  startBg = loadImage("assets/images/start_screen.png");
  winBg   = loadImage("assets/images/win_screen.png");
  lossBg  = loadImage("assets/images/loss_screen.png");
  start_penguin = loadImage("assets/images/start_penguin.png");
  gameFont = loadFont("assets/fonts/ZenDots-Regular.ttf");
  spikeImages[0] = loadImage("assets/images/spike_small.png");
  spikeImages[1] = loadImage("assets/images/spike_mid.png");
  spikeImages[2] = loadImage("assets/images/spike_tall.png");
  spikeImages[3] = loadImage("assets/images/spike_double.png");
  bgImg = loadImage("assets/images/background.png", () => {
    WORLD_W = bgImg.width;
    WORLD_H = bgImg.height;
    bgScale = Math.max(VIEW_W / WORLD_W, VIEW_H / WORLD_H);
    WORLD_W_SCALED = WORLD_W * bgScale;
    WORLD_H_SCALED = WORLD_H * bgScale;

    // WALL 1 — centered diagonal
    walls.push({
      x1: WORLD_W_SCALED / 2 - 1100,
      y1: WORLD_H_SCALED / 2 + 900,
      x2: WORLD_W_SCALED / 2 + 550,
      y2: WORLD_H_SCALED / 2 - 1600
    });

    // WALL 2 — another diagonal, different angle
    walls.push({
      x1: WORLD_W_SCALED / 2 + 800,
      y1: WORLD_H_SCALED / 2 + 900,
      x2: WORLD_W_SCALED / 2 - 400,
      y2: WORLD_H_SCALED / 2 - 1600
    });

    player.x = WORLD_W_SCALED / 2;
    player.y = WORLD_H_SCALED + 0;

    spikes = [
      // Left bottom cluster
      { x: WORLD_W_SCALED/2 - 550, y: WORLD_H_SCALED/2 + 250, variant: 3 },
      { x: WORLD_W_SCALED/2 - 350, y: WORLD_H_SCALED/2 + 75, variant: 2 },
      { x: WORLD_W_SCALED/2 - 300, y: WORLD_H_SCALED/2 + 130, variant: 1 },
      { x: WORLD_W_SCALED/2 - 300, y: WORLD_H_SCALED/2 + 200, variant: 0 },
      { x: WORLD_W_SCALED/2 - 350, y: WORLD_H_SCALED/2 + 270, variant: 1 },

      // Middle bottom cluster
      { x: WORLD_W_SCALED/2 - 50, y: WORLD_H_SCALED/2 + 200, variant: 0 },
      { x: WORLD_W_SCALED/2 + 15, y: WORLD_H_SCALED/2 + 200, variant: 2 },
      { x: WORLD_W_SCALED/2 + 85, y: WORLD_H_SCALED/2 + 240, variant: 3 },

      // Right bottom cluster
      { x: WORLD_W_SCALED/2 + 360, y: WORLD_H_SCALED/2 + 270, variant: 1 },
      { x: WORLD_W_SCALED/2 + 450, y: WORLD_H_SCALED/2 + 265, variant: 0 },
      { x: WORLD_W_SCALED/2 + 300, y: WORLD_H_SCALED/2 + 300, variant: 2 },
      { x: WORLD_W_SCALED/2 + 390, y: WORLD_H_SCALED/2 + 300, variant: 1 },
      { x: WORLD_W_SCALED/2 + 480, y: WORLD_H_SCALED/2 + 305, variant: 3 },
      
      // Middle high-bottom cluster
      { x: WORLD_W_SCALED/2 - 110, y: WORLD_H_SCALED/2 - 10, variant: 3 },
      { x: WORLD_W_SCALED/2 - 50, y: WORLD_H_SCALED/2 + 20, variant: 1 },
      { x: WORLD_W_SCALED/2 + 25, y: WORLD_H_SCALED/2 + 20, variant: 1 },
      { x: WORLD_W_SCALED/2 + 85, y: WORLD_H_SCALED/2 + 50, variant: 0 },
      
      // Left high-bottom cluster
      { x: WORLD_W_SCALED/2 - 450, y: WORLD_H_SCALED/2 - 90, variant: 0 },
      { x: WORLD_W_SCALED/2 - 370, y: WORLD_H_SCALED/2 - 90, variant: 2 },
      { x: WORLD_W_SCALED/2 - 280, y: WORLD_H_SCALED/2 - 120, variant: 3 },
      { x: WORLD_W_SCALED/2 - 500, y: WORLD_H_SCALED/2 - 50, variant: 0 },

      // Right high-bottom cluster
      { x: WORLD_W_SCALED/2 + 220, y: WORLD_H_SCALED/2 + 60, variant: 0 },
      { x: WORLD_W_SCALED/2 + 250, y: WORLD_H_SCALED/2 + 100, variant: 2 },
      { x: WORLD_W_SCALED/2 + 240, y: WORLD_H_SCALED/2 + 190, variant: 3 },
      { x: WORLD_W_SCALED/2 + 280, y: WORLD_H_SCALED/2 + 230, variant: 1 },
      
      // Middle great rock wall
       { x: WORLD_W_SCALED/2 - 200, y: WORLD_H_SCALED/2 - 170, variant: 0 },
       { x: WORLD_W_SCALED/2 - 140, y: WORLD_H_SCALED/2 - 170, variant: 2 },
       { x: WORLD_W_SCALED/2 - 80, y: WORLD_H_SCALED/2 - 170, variant: 0 },
       { x: WORLD_W_SCALED/2 - 20, y: WORLD_H_SCALED/2 - 170, variant: 2 },
       { x: WORLD_W_SCALED/2 + 40, y: WORLD_H_SCALED/2 - 170, variant: 0 },
       { x: WORLD_W_SCALED/2 + 100, y: WORLD_H_SCALED/2 - 170, variant: 2 },
          //One extra to the left:
       { x: WORLD_W_SCALED/2 - 350, y: WORLD_H_SCALED/2 - 240, variant: 3 },

      // Top middle cluster
         // Back row
       { x: WORLD_W_SCALED/2 - 20, y: WORLD_H_SCALED/2 - 370, variant: 0 },
       { x: WORLD_W_SCALED/2 - 80, y: WORLD_H_SCALED/2 - 350, variant: 0 },
       { x: WORLD_W_SCALED/2 + 60, y: WORLD_H_SCALED/2 - 350, variant: 3 },

       { x: WORLD_W_SCALED/2 - 180, y: WORLD_H_SCALED/2 - 330, variant: 1 },
       { x: WORLD_W_SCALED/2 - 120, y: WORLD_H_SCALED/2 - 330, variant: 2 },
       { x: WORLD_W_SCALED/2 - 60, y: WORLD_H_SCALED/2 - 330, variant: 1 },
       { x: WORLD_W_SCALED/2 - 0, y: WORLD_H_SCALED/2 - 330, variant: 2 },
       { x: WORLD_W_SCALED/2 + 60, y: WORLD_H_SCALED/2 - 330, variant: 1 },
       { x: WORLD_W_SCALED/2 + 120, y: WORLD_H_SCALED/2 - 330, variant: 2 },
       
      // Very top
      { x: WORLD_W_SCALED/2 - 180, y: WORLD_H_SCALED/2 - 520, variant: 3 },
      { x: WORLD_W_SCALED/2 - 40, y: WORLD_H_SCALED/2 - 480, variant: 2 },
      { x: WORLD_W_SCALED/2 + 50, y: WORLD_H_SCALED/2 - 480, variant: 0 },
      { x: WORLD_W_SCALED/2 - 250, y: WORLD_H_SCALED/2 - 480, variant: 1 },
    ];
  });
}

function setup() {
  createCanvas(VIEW_W, VIEW_H);
  imageMode(CORNER);
  startTime = millis();
  blueBuffer  = createGraphics(VIEW_W, VIEW_H);
  ringMaskBuffer = createGraphics(VIEW_W, VIEW_H);
  worldBuffer = createGraphics(VIEW_W, VIEW_H);
}

// Tutorial text
let tutorialActive = false;
let tutorialAlpha = 0;
let tutorialIndex = 0;
let tutorialDelay = 0;
let postTutorialTimerActive = false;
let postTutorialTimer = 0;
let postTutorialDelayFrames = 360; // 6 seconds
let tutorialSteps = [
  {
    text: "! AVALANCHE WARNING !\n{time}",
    //text
    fill: [233, 241, 242],
    size: 36,
    // box
    boxFill: [209, 29, 29],
    yOffset: -20,
    delay: 60
  },
  {
    text: "The blizzard is picking up,\n keep climbing to find shelter,",
    //text
    fill: [255, 145, 48],
    size: 36,
    // box
    boxFill: [0, 92, 158],
    yOffset: -20,
    delay: 20
  },
  {
    text: "Use A, W, D to move around.",
    //text
    fill: [255, 145, 48],
    size: 36,
    // box
    boxFill: [0, 92, 158],
    yOffset: -5,
    delay: 20
  },
  {
    text: "Really can't see much, try pressing space!\n But careful, stomping causes vibrations...",
    //text
    fill: [255, 145, 48],
    size: 28,
    // box
    boxFill: [0, 92, 158],
    yOffset: -20,
    delay: 20
  }
];

function drawSpikes() {
  for (let s of spikes) {
    let img = spikeImages[s.variant];
    image(img, s.x, s.y, SPIKE_DRAW_W, SPIKE_DRAW_H);
  }
}

function drawSpikeHitboxes() { //remove after debugging
  if (!DEBUG_SPIKE_HITBOXES) return;
  push();
  noFill();
  for (let s of spikes) {
    let hb = SPIKE_HITBOXES[s.variant];
    if (!hb) continue;
    let hx = s.x + hb.offsetX;
    let hy = s.y + hb.offsetY;
    rect(hx, hy, hb.w, hb.h);
  }
  pop();
}

function drawPenguinHitbox() {
  if (!DEBUG_PENGUIN_HITBOX) return;

  let hw = PENGUIN_HITBOX.w;
  let hh = PENGUIN_HITBOX.h;
  let ox = PENGUIN_HITBOX.offsetX;
  let oy = PENGUIN_HITBOX.offsetY;

  // world → screen
  let screenX = (player.x - camX) * camZoom * bgScale + ox;
  let screenY = (player.y - camY) * camZoom * bgScale + oy;

  push();
  noFill();
  rect(screenX, screenY, hw, hh);
  pop();
}

function drawPenguinInWorld(g) {
  let cfg = stompAnimating ? SPRITES.stomp : SPRITES[player.direction];
  let f   = stompAnimating ? stompFrame : player.currentFrame;

  // cropping
  let cropL = cfg.cropLeft[f]  || 0;
  let cropR = cfg.cropRight[f] || 0;
  let cropT = cfg.cropTop[f]   || 0;
  let cropB = cfg.cropBottom[f]|| 0;

  let sx = f * cfg.frameWidth + cropL;
  let sy = cropT;
  let sw = cfg.frameWidth  - cropL - cropR;
  let sh = cfg.frameHeight - cropT - cropB;

  let dw = sw * cfg.scale;
  let dh = sh * cfg.scale;

  // world‑space feet‑anchored position
  let wx = player.x - dw / 2;
  let wy = player.y - dh + 10;

  g.image(cfg.img, wx, wy, dw, dh, sx, sy, sw, sh);
}

function drawButton(label, x, y, w, h, pressedFlag) {
  let hover = mouseX > x-w/2 && mouseX < x+w/2 &&
              mouseY > y-h/2 && mouseY < y+h/2;

  let offsetY = pressedFlag ? 4 : 0;
  let pulse = sin(frameCount * 0.07) * (hover ? 0 : 3);

  // shadow
  noStroke();
  fill(10, 20, 60, 130);
  rect(floor(x-w/2+5), floor(y-h/2+5+offsetY), w, h, 8);

  // body
  fill(hover ? 60 : 42, hover ? 90 : 68, hover ? 175 : 150, 230);
  stroke(130, 170, 230, 200);
  strokeWeight(3);
  rect(floor(x-w/2+pulse/2), floor(y-h/2+offsetY+pulse/2), w-pulse, h-pulse, 8);
  noStroke();

  // shine
  fill(255, 255, 255, 50);
  rect(floor(x-w/2+pulse/2+4), floor(y-h/2+offsetY+pulse/2+4), w-pulse-8, 10, 4);

  // label
  textFont(gameFont);
  textSize(24);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);

  for (let [ox,oy] of [[-2,-2],[2,-2],[-2,2],[2,2]]) {
    fill(10, 20, 70, 200);
    text(label, floor(x+ox), floor(y+offsetY+oy));
  }

  fill(210, 230, 255);
  text(label, floor(x), floor(y+offsetY));

  cursor(hover ? HAND : ARROW);

  return hover;
}

function draw() {
  if (gameState === "start") {
    drawStartScreen();
    return;
  }

  if (gameState === "win") {
    drawWinScreen();
    return;
  }

  if (gameState === "loss") {
    drawLossScreen();
    return;
  }

  // -------------------------
  // GAMEPLAY (unchanged)
  // -------------------------
  if (gameEnded) {
    gameState = "loss";
    return;
  }

  handleInput();
  animateSprite();
  updateCamera();
  updateStompAnimation();

  // WIN CONDITION:
  let penguinScreenBottom =
  (player.y - camY) * camZoom * bgScale;

  if (penguinScreenBottom < 0) {
    // compute time survived
    let elapsed = floor((millis() - startTime) / 1000);
    finalTime = elapsed;

    gameState = "win";
    return;
  }

  if (waveDelayActive) {
    waveDelay--;
    if (waveDelay <= 0) {
      waveDelayActive = false;
      startWaveForFrame(4);
    }
  }
  if (waveActive) updateWave();

  push();
  scale(camZoom * bgScale);
  translate(-camX, -camY);
  drawBackground();
  drawSpikes();
  drawSpikeHitboxes();
  pop();

  push();
  scale(camZoom * bgScale);
  translate(-camX, -camY);
  for (let w of walls) {
    line(w.x1, w.y1, w.x2, w.y2);
  }
  pop();

  drawCharacterOnScreen();
  drawPenguinHitbox();
  baseWorldFrame = get();
  drawBlizzardOverlay();

  // X-ray ring (unchanged)
  if (waveActive) {
    ringMaskBuffer.clear();
    ringMaskBuffer.noStroke();

    const cx = (player.x - camX) * camZoom * bgScale + ringOffsetX;
    const cy = (player.y - camY) * camZoom * bgScale + ringOffsetY;

    const outerRadius = waveRadius;
    const innerRadius = waveRadius - 80;

    ringMaskBuffer.fill(255);
    ringMaskBuffer.circle(cx, cy, outerRadius * 2);

    if (innerRadius > 0) {
      ringMaskBuffer.erase();
      ringMaskBuffer.circle(cx, cy, innerRadius * 2);
      ringMaskBuffer.noErase();
    }

    blueBuffer.clear();
    blueBuffer.image(baseWorldFrame, 0, 0);

    let maskedBlue = blueBuffer.get();
    maskedBlue.mask(ringMaskBuffer);

    let fade = map(waveRadius, waveMaxRadius * 0.7, waveMaxRadius, 255, 0);
    fade = constrain(fade, 0, 255);

    tint(0, 120, 255, fade);
    image(maskedBlue, 0, 0);
    noTint();
  }

  drawTimer();

  if (postTutorialTimerActive) {
    postTutorialTimer++;

    if (postTutorialTimer >= postTutorialDelayFrames) {
      postTutorialTimerActive = false;
      tutorialActive = true;
      gameState = "tutorial";
      tutorialIndex = 3;  // final card
      tutorialDelay = tutorialSteps[3].delay;
    }
  }

  if (tutorialActive) {
    drawTutorialOverlay();
  }
}

function animateUpTest() {
  let cfg = SPRITES.start_penguin;

  testFrameTimer++;

  if (testFrameTimer >= cfg.animSpeed) {
    testFrameTimer = 0;
    testFrame = (testFrame + 1) % cfg.numFrames;  // loop
  }
}

function drawUpAnimation(x, y) {
  let cfg = SPRITES.start_penguin;
  let f = testFrame;

  // cropping
  let cropL = cfg.cropLeft[f];
  let cropR = cfg.cropRight[f];
  let cropT = cfg.cropTop[f];
  let cropB = cfg.cropBottom[f];

  let sx = f * cfg.frameWidth + cropL;
  let sy = cropT;
  let sw = cfg.frameWidth  - cropL - cropR;
  let sh = cfg.frameHeight - cropT - cropB;

  let dw = sw * cfg.scale;
  let dh = sh * cfg.scale;

  image(cfg.img, x, y, dw, dh, sx, sy, sw, sh);
}

function drawStartScreen() {
  imageMode(CORNER);
  image(startBg, 0, 0, width, height);
  textFont(gameFont);
  stroke(10, 15, 54);
  strokeWeight(8);
  textAlign(CENTER);
  textSize(72);
  fill(235, 132, 30);
  text("the Mountains", width / 2, height / 2 - 108);
  fill(245, 155, 66);  
  text("Straight Towards", width / 2, height / 2 - 170);
  let bx = width/2;
  let by = 400;
  let hover = drawButton("Start", bx, by, 320, 64, startBtnPressed);


 //imageMode(CENTER);
  //image(start_penguin, width/2, 720, 399, 456);

  animateUpTest();
  drawUpAnimation(420, 470);
}

function drawWinScreen() {
  image(winBg, 0, 0, width, height);
  fill(255);
  stroke(10, 15, 54);
  strokeWeight(8);
  textSize(36);
  textAlign(CENTER);
  textFont(gameFont);
  let minutes = floor(finalTime / 60);
  let seconds = finalTime % 60;
  let timeText = minutes + ":" + nf(seconds, 2);
  text(timeText, width / 2, height / 2 + 10);
  
  drawButton("Home", width/2, height*0.90, 260, 56, homeBtnPressed);


}

function drawLossScreen() {
  image(lossBg, 0, 0, width, height);

  fill(245, 155, 66);
  stroke(10, 15, 54);
  strokeWeight(8);
  textFont(gameFont);
  textAlign(CENTER);
  textSize(36);
  
  drawButton("Try Again", width/2, height*0.45, 320, 64, lossBtnPressed);
  drawButton("Home", width/2, height*0.90, 260, 56, homeBtnPressed);
}

function drawTutorialOverlay() {
  // Count down delay
  if (tutorialDelay > 0) {
    tutorialDelay--;
    return;   // ← DO NOT DRAW THE CARD YET
  }

  let step = tutorialSteps[tutorialIndex];

  // Format timer
  let rawText = step.text;
  let elapsed = floor((millis() - startTime) / 1000);
  let timeLeft = max(0, totalTime - elapsed);
  let minutes = floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  let formatted = minutes + ":" + nf(seconds, 2);
  let displayText = rawText.replace("{time}", formatted);

  push();
  textAlign(CENTER);
  textFont(gameFont);

  // Box
  fill(...step.boxFill);
  stroke(10, 15, 54);
  strokeWeight(12);
  rect(width/2 - 400, height/2 - 100, 800, 240, 20);

  // Text
  fill(step.fill[0], step.fill[1], step.fill[2]);
  textSize(step.size);
  stroke(10, 15, 54);
  strokeWeight(8);
  text(displayText, width/2, height/2 + step.yOffset);

  drawButton("Continue", width/2, height*0.60, 320, 64, tutorialBtnPressed);
  pop()
}

function keyPressed() {
  // START SCREEN → ENTER → TUTORIAL
  if (gameState === "start" && keyCode === ENTER) {
    resetGame();
    gameState = "tutorial";
    tutorialActive = true;
    tutorialAlpha = 0;
    tutorialIndex = 0;
    tutorialDelay = 40;   // optional: 0.5 sec before ENTER works
    return;
  }

  // TUTORIAL → ENTER → PLAYING
  if (gameState === "tutorial" && keyCode === ENTER) {
    // ignore ENTER until delay finishes
    if (tutorialDelay > 0) return;
    tutorialIndex++;
    if (tutorialIndex === 3) {
      tutorialActive = false;            // hide tutorial
      gameState = "playing";             // allow movement
      postTutorialTimerActive = true;    // start countdown
      postTutorialTimer = 0;
      return;
    }

    if (tutorialIndex < tutorialSteps.length) {
      tutorialAlpha = 255;
      tutorialDelay = tutorialSteps[tutorialIndex].delay;
      return;
    }

    tutorialActive = false;
    gameState = "playing";
    return;
  }

  // WIN SCREEN → ENTER → START
  if (gameState === "win" && keyCode === ENTER) {
    gameState = "start";
    return;
  }

  // LOSS SCREEN → R → RESTART
  if (gameState === "loss" && key === "r") {
    resetGame();
    gameState = "playing";
    return;
  }

  // LOSS SCREEN → ENTER → START
  if (gameState === "loss" && keyCode === ENTER) {
    gameState = "start";
    return;
  }
}

function resetGame() {
  gameEnded = false;
  startTime = millis();
  finalTime = null;

  totalTime = 150;   // reset timer

  tutorialActive = false;          // <-- FIX
  postTutorialTimerActive = false; // <-- FIX
  tutorialIndex = 0;               // <-- FIX
  tutorialDelay = 0;               // <-- FIX

  player.x = WORLD_W_SCALED / 2;
  player.y = WORLD_H_SCALED + 0;

  stompAnimating = false;
  stompFrame = 0;
  waveActive = false;
  waveRadius = 0;
}



function pointSide(px, py, x1, y1, x2, y2) {
  return (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1);
}

function drawBackground() {
  image(bgImg, -30, 0, WORLD_W_SCALED, WORLD_H_SCALED);
}

function updateCamera() {
  if (!WORLD_W_SCALED || !WORLD_H_SCALED) return;

  // visible window in world units
  let visibleW = VIEW_W / (camZoom * bgScale);
  let visibleH = VIEW_H / (camZoom * bgScale);

  // center camera on player
  let targetX = player.x - visibleW / 2;
  let targetY = player.y - visibleH * 0.7;

  // clamp camera to scaled world
  targetX = constrain(targetX, 0, (WORLD_W_SCALED - visibleW) - 30);
  targetY = constrain(targetY, 0, WORLD_H_SCALED - visibleH);

  camX = lerp(camX, targetX, CAM_SMOOTHING);
  camY = lerp(camY, targetY, CAM_SMOOTHING);
}

function drawTimer() {
  let elapsed = floor((millis() - startTime) / 1000);
  let timeLeft = totalTime - elapsed;

  if (timeLeft <= 0) {
    timeLeft = 0;
    gameEnded = true;
  }

  let minutes = floor(timeLeft / 60);
  let seconds = timeLeft % 60;

  let timerText = minutes + ":" + nf(seconds, 2);

  // FLASH LOGIC
  if (flashTimer > 0) {
    flashTimer--;

    // alternate red/white every 10 frames
    if (floor(flashTimer / 10) % 2 === 0) {
      fill(255, 0, 0);   // red
    } else {
      fill(255);         // white
    }
  } else {
    // normal timer color
    if (timeLeft <= 10) {
      fill(255, 0, 0);
    } else {
      fill(168, 247, 247);  // your normal color
    }
  }


  textAlign(CENTER);
  stroke(10, 15, 54);
  strokeWeight(8);
  textSize(32);
  textFont(gameFont);
  text(timerText, width / 2, 60);
}

function drawSadEnding() {
  imageMode(CORNER);
  image(endingSadImg, 0, 0, width, height);
  imageMode(CENTER);
}

function handleInput() {
  if (tutorialActive) {
    player.isMoving = false;
    return;   // block all movement + stomp
  }

  if (stompAnimating) {
    player.isMoving = false;
    return;   // completely skip movement logic
  }

  let newX = player.x;
  let newY = player.y;

  // reset each frame
  player.isMoving = false;

  if (keyIsDown(87)) {           // W / up
    newY -= player.speed;
    player.direction = "up";
    player.isMoving = true;
  }
  if (keyIsDown(65)) {           // A / left
    newX -= player.speed;
    player.direction = "left";
    player.isMoving = true;
  }
  if (keyIsDown(68)) {           // D / right
    newX += player.speed;
    player.direction = "right";
    player.isMoving = true;
  }
  if (keyIsDown(32) && !stompAnimating) { // space bar / stomping
    stompAnimating = true;
    stompFrame = 0;
    stompFrameTimer = 0;
    waveDelay = 0;
    waveDelayActive = false;
    totalTime = max(0, totalTime - 20);
    flashTimer= 150;
  }

  if (WORLD_W_SCALED && WORLD_H_SCALED) {
    newX = constrain(newX, player.w / 2, WORLD_W_SCALED - player.w / 2);
    newY = min(newY, WORLD_H_SCALED - player.h / 2);
  }

  // collision radius
  let r = player.w * 0.45;

  // three collision test points (world space)
  let topX    = newX;
  let topY    = newY - r;
  let leftX   = newX - r;
  let leftY   = newY;
  let rightX  = newX + r;
  let rightY  = newY;
  
  // --- DIAGONAL WALL COLLISION (circle vs line) ---
  function crossed(px, py) {
    let d0 = pointSide(player.x, player.y, wall.x1, wall.y1, wall.x2, wall.y2);
    let d1 = pointSide(px, py,        wall.x1, wall.y1, wall.x2, wall.y2);
    return d0 * d1 < 0;
  }

  for (let w of walls) {
    function crossed(px, py) {
      let d0 = pointSide(player.x, player.y, w.x1, w.y1, w.x2, w.y2);
      let d1 = pointSide(px, py, w.x1, w.y1, w.x2, w.y2);
      return d0 * d1 < 0;
    }
    if (crossed(topX, topY) || crossed(leftX, leftY) || crossed(rightX, rightY)) {
      newX = player.x;
      newY = player.y;
      break;
    }
  }

  let dx = newX - player.x;
  let stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
  for (let i = 0; i < Math.abs(dx); i++) {
    let testX = player.x + stepX;
    if (!wouldCollideWithSpike(testX, player.y)) {

      player.x = testX;
    } else {
      break;
    }
  }
  let dy = newY - player.y;
  let stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
  for (let i = 0; i < Math.abs(dy); i++) {
    let testY = player.y + stepY;
    if (!wouldCollideWithSpike(player.x, testY)) {
      player.y = testY;
    } else {
      break;
    }
  }
}

function wouldCollideWithSpike(testX, testY) {
  let hw = PENGUIN_HITBOX.w;
  let hh = PENGUIN_HITBOX.h;
  let ox = PENGUIN_HITBOX.offsetX;
  let oy = PENGUIN_HITBOX.offsetY;

  // WORLD-SPACE penguin hitbox (top-left) at the tested center
  let px = testX + ox;
  let py = testY + oy;

  for (let s of spikes) {
    let hb = SPIKE_HITBOXES[s.variant];
    if (!hb) continue;

    let hx = s.x + hb.offsetX;
    let hy = s.y + hb.offsetY;

    if (
      px + hw > hx &&
      px < hx + hb.w &&
      py + hh > hy &&
      py < hy + hb.h
    ) {
      return true;
    }
  }
  return false;
}

function animateSprite() {
  let cfg = SPRITES[player.direction];

  if (player.isMoving) {
    player.frameTimer++;

    if (player.frameTimer >= cfg.animSpeed) {
      player.frameTimer = 0;
      player.currentFrame = (player.currentFrame + 1) % cfg.numFrames;
    }
  } else {
    player.currentFrame = 0;
    player.frameTimer = 0;
  }
}

function drawCharacterOnScreen() {
  if (stompAnimating) {
    let cfg = SPRITES.stomp;
    let f = stompFrame;
    let sx = f * cfg.frameWidth;
    let sy = 0;
    let sw = cfg.frameWidth;
    let sh = cfg.frameHeight;
    let dw = sw * cfg.scale;
    let dh = sh * cfg.scale;
    let screenX = (player.x - camX) * camZoom * bgScale - dw / 2 + stompOffsetX;
    let screenY = (player.y - camY) * camZoom * bgScale - dh + 10 + stompOffsetY;
    image(cfg.img, screenX, screenY, dw, dh, sx, sy, sw, sh);
    return;
  }


  let cfg = SPRITES[player.direction];
  let f   = player.currentFrame;

  // cropping
  let cropL = cfg.cropLeft[f]  || 0;
  let cropR = cfg.cropRight[f] || 0;
  let cropT = cfg.cropTop[f]   || 0;
  let cropB = cfg.cropBottom[f]|| 0;

  let sx = f * cfg.frameWidth + cropL;
  let sy = cropT;
  let sw = cfg.frameWidth  - cropL - cropR;
  let sh = cfg.frameHeight - cropT - cropB;

  // fixed-size penguin (never scales)
  let dw = sw * cfg.scale;
  let dh = sh * cfg.scale;
  player.w = dw;
  player.h = dh;
  player.offsetX = (cropL - cropR) * cfg.scale / 2;
  player.offsetY = (cropT - cropB) * cfg.scale / 2;

  // correct world → screen conversion
  let screenX = (player.x - camX) * camZoom * bgScale - dw / 2;
  let screenY = (player.y - camY) * camZoom * bgScale - dh + 10;

  image(cfg.img, screenX, screenY, dw, dh, sx, sy, sw, sh);
}

function updateStompAnimation() {
  if (!stompAnimating) return;

  stompFrameTimer++;

  if (stompFrameTimer >= STOMP_FRAME_DURATIONS[stompFrame]) {
    stompFrameTimer = 0;
    stompFrame++;

    if (stompFrame === 4) {
      waveDelay = 10;
      waveDelayActive = true;
    }

    if (stompFrame >= STOMP_NUM_FRAMES) {
      stompAnimating = false;
      stompFrame = 0;
    }
  }
}

function updateWave() {
  if (!waveActive) return;

  waveRadius += waveGrowth;

  if (waveRadius >= waveMaxRadius) {
    waveActive = false;
  }
}

function startWaveForFrame(frameIndex) {
  waveActive = true;
  waveRadius = 0;

  const duration = STOMP_FRAME_DURATIONS[frameIndex];
  waveGrowth = waveMaxRadius / duration;
}

function drawBlizzardOverlay() {
  let stormLayer = createGraphics(width, height);

  stormLayer.noStroke();
  stormLayer.fill(255, 255, 255, 251);
  stormLayer.rect(0, 0, width, height);

  // Convert penguin world → screen
  const screenX = (player.x - camX) * camZoom * bgScale + holeOffsetX;
  const screenY = (player.y - camY) * camZoom * bgScale + holeOffsetY;

  // Cut-out hole
  stormLayer.drawingContext.globalCompositeOperation = "destination-out";
  stormLayer.fill(255);
  stormLayer.ellipse(screenX, screenY, clearRadius * 2, clearRadius * 2);
  image(stormLayer, 0, 0);
}

function mousePressed() {
  let bx, by, bw = 320, bh = 64;

  // --- START SCREEN BUTTON ---
  if (gameState === "start") {
    let bx = width/2, by = 400, bw = 320, bh = 64; 
    if (mouseX > bx-bw/2 && mouseX < bx+bw/2 &&
        mouseY > by-bh/2 && mouseY < by+bh/2) {
      startBtnPressed = true;
    }
  }

  // --- WIN SCREEN BUTTON ---
  if (gameState === "win") {
    bx = width/2;
    by = height * 0.82;

    if (mouseX > bx-bw/2 && mouseX < bx+bw/2 &&
        mouseY > by-bh/2 && mouseY < by+bh/2) {
      winBtnPressed = true;
    }
  }

  // --- LOSS SCREEN BUTTON ---
  if (gameState === "loss") {
    bx = width/2;
    by = height * 0.45;
    bw = 320;
    bh = 64

    if (mouseX > bx-bw/2 && mouseX < bx+bw/2 &&
        mouseY > by-bh/2 && mouseY < by+bh/2) {
      lossBtnPressed = true;
    }
  }

  // --- TUTORIAL BUTTON (optional future use) ---
  if (gameState === "tutorial") {
    bx = width/2;
    by = height * 0.60;
    bw = 320;
    bh = 64

    if (mouseX > bx-bw/2 && mouseX < bx+bw/2 &&
        mouseY > by-bh/2 && mouseY < by+bh/2) {
      tutorialBtnPressed = true;
    }
  }

  // --- HOME BUTTON (win + loss screens) ---
  if (gameState === "win" || gameState === "loss") {
    let bx = width/2, by = height*0.90, bw = 260, bh = 56;
    if (mouseX > bx-bw/2 && mouseX < bx+bw/2 &&
        mouseY > by-bh/2 && mouseY < by+bh/2) {
      homeBtnPressed = true;
    }
  }
}

function mouseReleased() {
  let bx, by, bw = 320, bh = 64;

  // --- START SCREEN BUTTON RELEASE ---
  if (gameState === "start") {
    let bx = width/2, by = 400, bw = 320, bh = 64; 
    if (startBtnPressed &&
        mouseX > bx-bw/2 && mouseX < bx+bw/2 &&
        mouseY > by-bh/2 && mouseY < by+bh/2) {

      resetGame();
      gameState = "tutorial";
      tutorialActive = true;
      tutorialIndex = 0;
      tutorialDelay = tutorialSteps[0].delay;
    }
    startBtnPressed = false;
  }

  // --- WIN SCREEN BUTTON RELEASE ---
  if (gameState === "win") {
    bx = width/2;
    by = height * 0.82;

    if (winBtnPressed &&
        mouseX > bx-bw/2 && mouseX < bx+bw/2 &&
        mouseY > by-bh/2 && mouseY < by+bh/2) {

      resetGame();
      gameState = "playing";
    }
    winBtnPressed = false;
  }

  // --- LOSS SCREEN BUTTON RELEASE ---
  if (gameState === "loss") {
    bx = width/2;
    by = height * 0.45;
    bw = 320;
    bh = 64

    if (lossBtnPressed &&
        mouseX > bx-bw/2 && mouseX < bx+bw/2 &&
        mouseY > by-bh/2 && mouseY < by+bh/2) {

      resetGame();
      gameState = "playing";
    }
    lossBtnPressed = false;
  }

  // --- TUTORIAL BUTTON RELEASE (optional) ---
  if (gameState === "tutorial") {
    bx = width/2;
    by = height * 0.60;
    bw = 320;
    bh = 64;

    if (tutorialBtnPressed &&
        mouseX > bx-bw/2 && mouseX < bx+bw/2 &&
        mouseY > by-bh/2 && mouseY < by+bh/2) {

      // Same logic as pressing ENTER
      if (tutorialDelay <= 0) {
        tutorialIndex++;

        if (tutorialIndex === 3) {
          tutorialActive = false;
          gameState = "playing";
          postTutorialTimerActive = true;
          postTutorialTimer = 0;
        } else if (tutorialIndex < tutorialSteps.length) {
          tutorialDelay = tutorialSteps[tutorialIndex].delay;
        } else {
          tutorialActive = false;
          gameState = "playing";
        }
      }
    }
    tutorialBtnPressed = false;
  }

  // --- HOME BUTTON RELEASE ---
  if (gameState === "win" || gameState === "loss") {
    let bx = width/2, by = height*0.90, bw = 260, bh = 56;

    if (homeBtnPressed &&
        mouseX > bx-bw/2 && mouseX < bx+bw/2 &&
        mouseY > by-bh/2 && mouseY < by+bh/2) {

      // Go back to start screen
      gameState = "start";
    }

    homeBtnPressed = false;
  }
}



