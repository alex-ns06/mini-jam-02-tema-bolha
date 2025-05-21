let steveImg, bubbleImg, bgImg, strawImg;
let popSound, bgMusic;
let bubble;
let particles = [];

let gameState = "waiting"; // waiting, growing, popped
let lastClickTime = 0;
let bestSize = 0;

let startTime = 0;
let elapsedTime = 0;

let musicButton;
let musicPlaying = false;

function preload() {
  steveImg = loadImage("assets/image/steve.png");
  bubbleImg = loadImage("assets/image/bubble.png");
  bgImg = loadImage("assets/image/ceu.jpg");
  strawImg = loadImage("assets/image/straw.png");

  popSound = loadSound("assets/music/pop.mp3");
  bgMusic = loadSound("assets/music/bg.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('monospace');
  noCursor();

  bestSize = getItem('bestSize') || 0;
  bubble = new Bubble();

  musicButton = createButton('🔇');
  musicButton.position(20, 80);
  musicButton.size(40, 40);
  musicButton.mousePressed(toggleMusic);
}

function draw() {
  background(200);
  if (bgImg) image(bgImg, 0, 0, width, height);

  drawSteve();

  drawStraw();

  bubble.update();
  bubble.show();

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isDead()) particles.splice(i, 1);
  }

  drawUI();
}

function drawSteve() {
  let steveHeight = height * 0.3;
  let steveWidth = steveHeight * 0.7;
  image(steveImg, width / 2 - steveWidth / 2, height - steveHeight, steveWidth, steveHeight);
}

function drawStraw() {
  let steveHeight = height * 0.3;
  let steveWidth = steveHeight * 0.7;
  let steveX = width / 2 - steveWidth / 2;
  let steveY = height - steveHeight;

  let strawWidth = steveWidth * 0.6;  // 60% da largura do Steve
  let strawHeight = steveHeight * 0.25; // canudo grande

  let strawX = steveX + steveWidth * 0.7; // perto da boca, horizontal
  let strawY = steveY + steveHeight * 0.25; // subi muito, perto da boca!

  image(strawImg, strawX, strawY, strawWidth, strawHeight);

  // Bolha na ponta do canudo (quase no centro vertical)
  bubble.setPosition(strawX + strawWidth * 0.9, strawY + strawHeight * 0.5);
}

function drawUI() {
  drawScoreBox();
  drawInstructions();
  drawTimer();
}

function drawScoreBox() {
  fill(0, 150);
  stroke(255);
  strokeWeight(1);
  rectMode(CENTER);
  rect(width / 2, 40, 400, 60, 10);

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(18);
  text(`📏 Atual: ${floor(bubble.size)}    🏆 Recorde: ${floor(bestSize)}`, width / 2, 40);
}

function drawInstructions() {
  let msg = "";
  if (gameState === "waiting" || gameState === "growing") {
    msg = "💨 Clique no ritmo para inflar. Não erre!";
  } else if (gameState === "popped") {
    msg = "💥 Errou o ritmo! Clique para tentar de novo.";
  }

  fill(0, 150);
  stroke(255);
  strokeWeight(1);
  rectMode(CENTER);
  rect(width / 2, 100, textWidth(msg) + 40, 40, 10);

  fill(255);
  noStroke();
  textSize(16);
  textAlign(CENTER, CENTER);
  text(msg, width / 2, 100);
}

function drawTimer() {
  if (gameState === "growing") {
    elapsedTime = (millis() - startTime) / 1000;
  }
  let txt = nf(elapsedTime, 1, 2) + "s";

  fill(0, 150);
  stroke(255);
  strokeWeight(1);
  rectMode(CENTER);
  rect(width - 70, 40, 100, 40, 10);

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  text(txt, width - 70, 40);
}

function mousePressed() {
  if (gameState === "popped") {
    bubble = new Bubble();
    gameState = "waiting";
    elapsedTime = 0;
    return;
  }

  const now = millis();
  const interval = now - lastClickTime;
  lastClickTime = now;

  if (gameState === "waiting") {
    startTime = millis();
  }

  let minInterval = 250 + map(bubble.size, 50, 400, 0, 100);
  let maxInterval = 1000 - map(bubble.size, 50, 400, 0, 400);
  minInterval = constrain(minInterval, 200, 400);
  maxInterval = constrain(maxInterval, 600, 1000);

  if (interval < minInterval || interval > maxInterval) {
    bubble.pop();
    popSound.play();
    gameState = "popped";

    if (bubble.size > bestSize) {
      bestSize = bubble.size;
      storeItem('bestSize', bestSize);
    }

    let pos = bubble.getPosition();
    for (let i = 0; i < 30; i++) {
      particles.push(new Particle(pos.x, pos.y, bubble.size));
    }
  } else {
    bubble.grow();
    gameState = "growing";
  }
}

function toggleMusic() {
  if (!musicPlaying) {
    bgMusic.loop();
    musicPlaying = true;
    musicButton.html('🔊');
  } else {
    bgMusic.stop();
    musicPlaying = false;
    musicButton.html('🔇');
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

class Bubble {
  constructor() {
    this.size = 50;
    this.state = "idle";
    this.opacity = 255;
    this.scalePulse = 1;
    this.x = width / 2;
    this.y = height / 2;
  }

  update() {
    if (this.state === "popped") {
      this.opacity -= 8;
      if (this.opacity < 0) this.opacity = 0;
    } else {
      this.scalePulse = 1 + sin(frameCount * 0.1) * 0.02;
    }
  }

  show() {
    if (this.opacity <= 0) return;
    push();
    translate(this.x, this.y);
    scale(this.scalePulse);
    tint(255, this.opacity);
    image(bubbleImg, -this.size / 2, -this.size / 2, this.size, this.size);
    pop();
    noTint();
  }

  grow() {
    if (this.state !== "popped") {
      this.size += 8;
      this.size = constrain(this.size, 50, 400);
    }
  }

  pop() {
    this.state = "popped";
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }
}

class Particle {
  constructor(x, y, baseSize) {
    this.pos = createVector(x, y);
    const angle = random(TWO_PI);
    const speed = random(2, 6);
    this.vel = p5.Vector.fromAngle(angle).mult(speed);
    this.lifespan = 255;
    this.size = baseSize * random(0.1, 0.3);
  }

  update() {
    this.pos.add(this.vel);
    this.lifespan -= 10;
  }

  show() {
    noStroke();
    fill(255, this.lifespan);
    ellipse(this.pos.x, this.pos.y, this.size);
  }

  isDead() {
    return this.lifespan <= 0;
  }
}
