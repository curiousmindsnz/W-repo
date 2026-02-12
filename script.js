const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const staminaBar = document.getElementById("staminaBar");
const distanceValue = document.getElementById("distanceValue");
const statusValue = document.getElementById("statusValue");
const startOverlay = document.getElementById("startScreen");
const gameOverOverlay = document.getElementById("gameOver");
const startButton = document.getElementById("start");
const restartButton = document.getElementById("restart");

let animationId = null;

const state = {
  eyesClosed: false,
  stamina: 100,
  distance: 100,
  blur: 0,
  shake: 0,
  timeWithoutBlink: 0,
  timeBlinking: 0,
  running: false,
  lastTime: performance.now(),
};

const config = {
  blinkDrainRate: 35,
  staminaRegenRate: 25,
  monsterAdvanceRate: 10,
  monsterRetreatRate: 2,
  blurRate: 22,
  shakeRate: 16,
  maxBlur: 18,
  maxShake: 14,
  minDistance: 0,
  maxDistance: 100,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setEyesClosed(closed) {
  state.eyesClosed = closed;
}

window.addEventListener("mousedown", (event) => {
  if (event.button === 0 && state.running) {
    setEyesClosed(true);
  }
});

window.addEventListener("mouseup", (event) => {
  if (event.button === 0 && state.running) {
    setEyesClosed(false);
  }
});

window.addEventListener("mouseleave", () => {
  if (state.running) {
    setEyesClosed(false);
  }
});

function resetState() {
  state.eyesClosed = false;
  state.stamina = 100;
  state.distance = config.maxDistance;
  state.blur = 0;
  state.shake = 0;
  state.timeWithoutBlink = 0;
  state.timeBlinking = 0;
}

function startGame() {
  resetState();
  state.running = true;
  startOverlay.hidden = true;
  gameOverOverlay.hidden = true;
  state.lastTime = performance.now();
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }
  animationId = requestAnimationFrame(loop);
}

startButton.addEventListener("click", () => {
  startGame();
});

restartButton.addEventListener("click", () => {
  startGame();
});

function update(delta) {
  if (!state.running) return;

  if (state.eyesClosed) {
    state.timeBlinking += delta;
    state.timeWithoutBlink = 0;
    state.stamina = clamp(
      state.stamina + config.staminaRegenRate * delta,
      0,
      100
    );
    state.distance = clamp(
      state.distance - config.monsterAdvanceRate * delta,
      config.minDistance,
      config.maxDistance
    );
    state.blur = clamp(state.blur - config.blurRate * delta, 0, config.maxBlur);
    state.shake = clamp(state.shake - config.shakeRate * delta, 0, config.maxShake);
  } else {
    state.timeWithoutBlink += delta;
    state.timeBlinking = 0;
    state.stamina = clamp(
      state.stamina - config.blinkDrainRate * delta,
      0,
      100
    );
    state.distance = clamp(
      state.distance + config.monsterRetreatRate * delta,
      config.minDistance,
      config.maxDistance
    );

    const fatigue = clamp(state.timeWithoutBlink / 6, 0, 1);
    state.blur = clamp(state.blur + config.blurRate * delta * fatigue, 0, config.maxBlur);
    state.shake = clamp(state.shake + config.shakeRate * delta * fatigue, 0, config.maxShake);
  }

  if (state.stamina <= 0 || state.distance <= 0) {
    state.running = false;
    gameOverOverlay.hidden = false;
    animationId = null;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const shakeX = (Math.random() - 0.5) * state.shake;
  const shakeY = (Math.random() - 0.5) * state.shake;

  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.filter = `blur(${state.blur}px)`;

  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 + 40;

  const monsterScale = clamp(1 - state.distance / config.maxDistance, 0.05, 1);
  const monsterSize = 70 + monsterScale * 300;

  ctx.fillStyle = "#2a0a0d";
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, monsterSize * 0.65, monsterSize, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5a171b";
  ctx.beginPath();
  ctx.arc(centerX - monsterSize * 0.25, centerY - monsterSize * 0.2, monsterSize * 0.1, 0, Math.PI * 2);
  ctx.arc(centerX + monsterSize * 0.25, centerY - monsterSize * 0.2, monsterSize * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#a31c22";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(centerX, centerY + monsterSize * 0.2, monsterSize * 0.3, 0, Math.PI);
  ctx.stroke();

  ctx.restore();

  if (state.eyesClosed) {
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  staminaBar.style.width = `${Math.round(state.stamina)}%`;
  distanceValue.textContent = Math.round(state.distance).toString();
  statusValue.textContent = state.eyesClosed ? "BLINKING" : "EYES OPEN";
}

function loop(now) {
  const delta = Math.min((now - state.lastTime) / 1000, 0.1);
  state.lastTime = now;
  update(delta);
  draw();
  if (state.running) {
    animationId = requestAnimationFrame(loop);
  }
}

animationId = requestAnimationFrame(loop);
