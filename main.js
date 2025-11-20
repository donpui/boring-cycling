const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.imageSmoothingEnabled = true;

const BODY_BACKGROUND = '#f7f7f7';

const avoidedEl = document.getElementById('avoidedCount');
const challengeEl = document.getElementById('challengeLevel');

const BICYCLE_DIMENSIONS = {
  width: 150,
  height: 100,
};

const BICYCLE_BASE_TILT = -75;
const BOSS_INTERVAL = 60000;
const BOSS_CAR_BASE = {
  width: 200,
  height: 320,
};
const MIN_PED_X_GAP = 90;
const MIN_PED_Y_GAP = 160;

const PEDESTRIAN_DIMENSIONS = {
  width: 44,
  height: 120,
};

const road = {
  bottomWidth: 560,
  topWidth: 160,
  shoulder: 72,
  horizon: 70,
  get center() {
    return canvas.width / 2;
  },
  get left() {
    return this.center - this.bottomWidth / 2;
  },
  get right() {
    return this.center + this.bottomWidth / 2;
  },
};

const keys = {
  left: false,
  right: false,
};

const PEDESTRIAN_COLORS = [
  { shirt: '#0f9fd7', pants: '#263238', accent: '#79d2f2' },
  { shirt: '#ef5350', pants: '#424242', accent: '#ffab91' },
  { shirt: '#66bb6a', pants: '#2e7d32', accent: '#b2dfdb' },
  { shirt: '#f3a530', pants: '#5d4037', accent: '#ffe082' },
];

const state = {
  status: 'ready',
  bicycle: {
    x: 0,
    y: canvas.height - 140,
    width: BICYCLE_DIMENSIONS.width,
    height: BICYCLE_DIMENSIONS.height,
    sway: 0,
  },
  pedestrians: [],
  avoided: 0,
  spawnTimer: 0,
  spawnInterval: 2200,
  elapsed: 0,
  difficulty: 1,
  roadDashOffset: 0,
  message: 'Press space to ride',
  wheelRotation: 0,
  boss: {
    nextSpawn: BOSS_INTERVAL,
    car: null,
  },
};

state.bicycle.x = road.left + (road.bottomWidth - state.bicycle.width) / 2;
state.spawnTimer = state.spawnInterval * 1.2;

function updateCounters() {
  avoidedEl.textContent = state.avoided.toString();
  challengeEl.textContent = `${state.difficulty.toFixed(1)}x`;
}

function resetGame() {
  state.status = 'playing';
  state.bicycle.x = road.left + (road.bottomWidth - state.bicycle.width) / 2;
  state.bicycle.sway = 0;
  state.pedestrians = [];
  state.avoided = 0;
  state.spawnInterval = 2200;
  state.spawnTimer = state.spawnInterval * 1.2;
  state.elapsed = 0;
  state.difficulty = 1;
  state.roadDashOffset = 0;
  state.message = '';
  state.wheelRotation = 0;
  state.boss = {
    nextSpawn: BOSS_INTERVAL,
    car: null,
  };
  updateCounters();
}

function triggerCrash() {
  state.status = 'gameover';
  state.message = 'You crashed! Press space to ride again';
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }

  if (event.code === 'ArrowLeft') {
    keys.left = true;
  } else if (event.code === 'ArrowRight') {
    keys.right = true;
  } else if (event.code === 'Space') {
    if (state.status !== 'playing') {
      resetGame();
    }
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowLeft') {
    keys.left = false;
  } else if (event.code === 'ArrowRight') {
    keys.right = false;
  }
});

function spawnPedestrian() {
  const spawnLeft = road.left + 80;
  const spawnRight = road.right - 80;
  const palette = PEDESTRIAN_COLORS[Math.floor(Math.random() * PEDESTRIAN_COLORS.length)];

  const difficultyBoost = 1 + Math.min(state.elapsed / 90000, 1);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const centerX = spawnLeft + Math.random() * (spawnRight - spawnLeft);
    if (!canSpawnPedestrianAt(centerX)) {
      continue;
    }

    const ped = {
      centerX,
      x: centerX - PEDESTRIAN_DIMENSIONS.width / 2,
      y: road.horizon - PEDESTRIAN_DIMENSIONS.height,
      footY: road.horizon,
      baseWidth: PEDESTRIAN_DIMENSIONS.width,
      baseHeight: PEDESTRIAN_DIMENSIONS.height,
      width: PEDESTRIAN_DIMENSIONS.width,
      height: PEDESTRIAN_DIMENSIONS.height,
      visualScale: 1,
      speed: (120 + Math.random() * 30) * difficultyBoost,
      counted: false,
      palette,
      strideOffset: Math.random() * Math.PI * 2,
    };

    state.pedestrians.push(ped);
    return true;
  }

  return false;
}

function canSpawnPedestrianAt(centerX) {
  for (const ped of state.pedestrians) {
    if (ped.y > MIN_PED_Y_GAP) {
      continue;
    }
    const existingCenter = ped.x + ped.width / 2;
    if (Math.abs(existingCenter - centerX) < MIN_PED_X_GAP) {
      return false;
    }
  }
  return true;
}

function spawnBossCar() {
  const lanePadding = 100;
  const minX = road.left + lanePadding;
  const maxX = road.right - lanePadding;
  const centerX = minX + Math.random() * (maxX - minX);

  state.boss.car = {
    centerX,
    baseWidth: BOSS_CAR_BASE.width,
    baseHeight: BOSS_CAR_BASE.height,
    width: BOSS_CAR_BASE.width * 0.6,
    height: BOSS_CAR_BASE.height * 0.6,
    x: centerX - (BOSS_CAR_BASE.width * 0.6) / 2,
    y: road.horizon - BOSS_CAR_BASE.height * 0.6 - 40,
    groundY: road.horizon,
    speed: 360 + state.difficulty * 60,
    color: Math.random() > 0.5 ? '#d32f2f' : '#1976d2',
  };
}

function update(delta) {
  const seconds = delta / 1000;
  const direction = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
  const moveSpeed = 320;

  if (state.status === 'playing') {
    if (direction !== 0) {
      state.bicycle.x += direction * moveSpeed * seconds;
      const sideAllowance = state.bicycle.width * 0.25;
      const minX = road.left - sideAllowance;
      const maxX = road.right - state.bicycle.width + sideAllowance;
      state.bicycle.x = Math.max(minX, Math.min(maxX, state.bicycle.x));
    }
    const targetSway = direction * 6;
    state.bicycle.sway += (targetSway - state.bicycle.sway) * 0.15;
  } else {
    state.bicycle.sway *= 0.8;
  }

  const passiveScroll = state.status === 'playing' ? 220 : 90;
  state.roadDashOffset = (state.roadDashOffset + seconds * passiveScroll) % 60;

  const wheelSpinSpeed = state.status === 'playing' ? 7.5 + state.difficulty * 2 : 1.5;
  state.wheelRotation = (state.wheelRotation + seconds * wheelSpinSpeed) % (Math.PI * 2);

  if (state.status !== 'playing') {
    return;
  }

  state.elapsed += delta;
  const difficultyRamp = 1 + Math.min(state.elapsed / 60000, 1.4);
  state.difficulty = difficultyRamp;
  updateCounters();

  state.spawnInterval = Math.max(700, 2200 - state.elapsed / 18);
  state.spawnTimer -= delta;
  if (state.spawnTimer <= 0) {
    const spawned = spawnPedestrian();
    state.spawnTimer = spawned ? state.spawnInterval : state.spawnInterval * 0.4;
  }

  const speedMultiplier = 1 + state.elapsed / 80000;
  const bikeFoot = state.bicycle.y + state.bicycle.height;

  const bikeRect = getBikeCollisionRect();
  const bikeLowerRect = bikeRectLowerHalf(bikeRect);

  for (const pedestrian of state.pedestrians) {
    pedestrian.footY += pedestrian.speed * seconds * speedMultiplier;
    const depth = Math.min(1.15, pedestrian.footY / canvas.height);
    const scale = 0.65 + depth * 0.55;
    pedestrian.visualScale = scale;
    pedestrian.width = pedestrian.baseWidth * scale;
    pedestrian.height = pedestrian.baseHeight * scale;
    pedestrian.x = pedestrian.centerX - pedestrian.width / 2;
    pedestrian.y = pedestrian.footY - pedestrian.height;

    if (!pedestrian.counted && pedestrian.footY > bikeFoot) {
      pedestrian.counted = true;
      state.avoided += 1;
      updateCounters();
    }

      const pedRect = {
        x: pedestrian.x + pedestrian.width * 0.15,
        y: pedestrian.y + pedestrian.height * 0.5,
        width: pedestrian.width * 0.7,
        height: pedestrian.height * 0.45,
      };

      if (checkCollision(pedRect, bikeLowerRect)) {
        triggerCrash();
        break;
      }
    }

  updateBossCar(seconds, speedMultiplier, bikeLowerRect);

  state.pedestrians = state.pedestrians.filter((ped) => ped.y < canvas.height + ped.height);
}

function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function getBikeCollisionRect() {
  const bike = state.bicycle;
  const paddingX = bike.width * 0.15;
  const headOffset = bike.height * 0.25;
  return {
    x: bike.x + paddingX,
    y: bike.y + headOffset,
    width: bike.width - paddingX * 2,
    height: bike.height - headOffset * 0.9,
  };
}

function bikeRectLowerHalf(fullRect) {
  return {
    x: fullRect.x,
    y: fullRect.y + fullRect.height * 0.45,
    width: fullRect.width,
    height: fullRect.height * 0.55,
  };
}

function updateBossCar(seconds, speedMultiplier, bikeLowerRect) {
  const boss = state.boss;

  if (!boss.car && state.elapsed >= boss.nextSpawn) {
    spawnBossCar();
  }

  const car = boss.car;
  if (!car) {
    return;
  }

  car.groundY += car.speed * seconds * (0.9 + speedMultiplier * 0.4);
  const travel =
    (car.groundY - road.horizon) / (canvas.height - road.horizon + 200);
  const clampedTravel = Math.max(0, Math.min(1.3, travel));
  const scale = 0.5 + clampedTravel * 0.9;
  car.width = car.baseWidth * scale;
  car.height = car.baseHeight * scale;
  const clampedCenter = Math.max(
    road.left + car.width / 2 + 20,
    Math.min(road.right - car.width / 2 - 20, car.centerX)
  );
  car.x = clampedCenter - car.width / 2;
  car.y = car.groundY - car.height;

  const carRect = {
    x: car.x + car.width * 0.12,
    y: car.y + car.height * 0.5,
    width: car.width * 0.76,
    height: car.height * 0.45,
  };

  if (checkCollision(carRect, bikeLowerRect)) {
    triggerCrash();
  }

  if (car.y > canvas.height + car.height * 0.2) {
    boss.car = null;
    boss.nextSpawn += BOSS_INTERVAL;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackdrop();
  drawRoad();
  drawPedestrians();
  drawBossCar();
  drawBicycle();
  drawScore();

  if (state.status !== 'playing') {
    drawMessage(state.message || 'Press space to begin');
  }
}

function drawBackdrop() {
  ctx.fillStyle = BODY_BACKGROUND;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawRoad() {
  const { center, topWidth, bottomWidth, horizon, shoulder } = road;
  const depth = canvas.height - horizon;
  const widthAt = (progress) => topWidth + (bottomWidth - topWidth) * progress;
  const halfWidthAt = (progress) => widthAt(progress) / 2;

  ctx.fillStyle = '#c8d5dc';
  ctx.beginPath();
  ctx.moveTo(center - bottomWidth / 2 - shoulder, canvas.height);
  ctx.lineTo(center - topWidth / 2 - shoulder * 0.4, horizon);
  ctx.lineTo(center + topWidth / 2 + shoulder * 0.4, horizon);
  ctx.lineTo(center + bottomWidth / 2 + shoulder, canvas.height);
  ctx.closePath();
  ctx.fill();

  const asphaltGradient = ctx.createLinearGradient(0, horizon, 0, canvas.height + 60);
  asphaltGradient.addColorStop(0, '#51585f');
  asphaltGradient.addColorStop(1, '#2c333b');
  ctx.fillStyle = asphaltGradient;
  ctx.beginPath();
  ctx.moveTo(center - bottomWidth / 2, canvas.height);
  ctx.lineTo(center - topWidth / 2, horizon);
  ctx.lineTo(center + topWidth / 2, horizon);
  ctx.lineTo(center + bottomWidth / 2, canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(240, 244, 248, 0.45)';
  ctx.lineWidth = 4;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(center + side * (bottomWidth / 2 + 6), canvas.height);
    ctx.lineTo(center + side * (topWidth / 2 + 2), horizon);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(20, 26, 32, 0.35)';
  for (let i = 1; i <= 10; i += 1) {
    const progress = i / 10;
    const y = horizon + depth * progress;
    const halfWidth = halfWidthAt(progress);
    ctx.lineWidth = 1 + (1 - progress) * 1.6;
    ctx.beginPath();
    ctx.moveTo(center - halfWidth * 0.95, y);
    ctx.lineTo(center - halfWidth * 0.7, y);
    ctx.moveTo(center + halfWidth * 0.7, y);
    ctx.lineTo(center + halfWidth * 0.95, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#f7d977';
  const dashCount = 14;
  const dashLength = 0.09;
  for (let i = 0; i < dashCount; i += 1) {
    const startProg = i * dashLength * 1.3 - (state.roadDashOffset / 1200);
    if (startProg > 1) break;
    const endProg = startProg + dashLength;
    if (endProg < 0) continue;
    const clampedStart = Math.max(0, startProg);
    const clampedEnd = Math.min(1, endProg);
    const y1 = horizon + depth * clampedStart;
    const y2 = horizon + depth * clampedEnd;
    const halfWidth1 = halfWidthAt(clampedStart) * 0.05;
    const halfWidth2 = halfWidthAt(clampedEnd) * 0.04;
    ctx.beginPath();
    ctx.moveTo(center - halfWidth1, y1);
    ctx.lineTo(center + halfWidth1, y1);
    ctx.lineTo(center + halfWidth2, y2);
    ctx.lineTo(center - halfWidth2, y2);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPedestrians() {
  for (const ped of state.pedestrians) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(ped.centerX, ped.footY - 6, ped.width * 0.35, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    drawPedestrianSprite(ped);
  }
}

function drawBossCar() {
  const car = state.boss.car;
  if (!car) {
    return;
  }

  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(car.x + car.width / 2, car.groundY - 6, car.width * 0.45, 10, 0, Math.PI * 2);
  ctx.fill();

  const accent = car.color === '#d32f2f' ? '#f8b8b5' : '#90caf9';
  const gradient = ctx.createLinearGradient(car.x, car.y, car.x, car.y + car.height);
  gradient.addColorStop(0, accent);
  gradient.addColorStop(1, car.color);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(car.x + 20, car.y);
  ctx.lineTo(car.x + car.width - 20, car.y);
  ctx.quadraticCurveTo(car.x + car.width, car.y + 40, car.x + car.width, car.y + car.height - 60);
  ctx.lineTo(car.x + car.width, car.y + car.height - 20);
  ctx.quadraticCurveTo(car.x + car.width - 20, car.y + car.height, car.x + car.width / 2, car.y + car.height);
  ctx.quadraticCurveTo(car.x + 20, car.y + car.height, car.x, car.y + car.height - 20);
  ctx.lineTo(car.x, car.y + car.height - 60);
  ctx.quadraticCurveTo(car.x, car.y + 40, car.x + 20, car.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1f2f3f';
  ctx.fillRect(car.x + 18, car.y + car.height - 70, car.width - 36, 12);

  ctx.fillStyle = 'rgba(250, 250, 255, 0.85)';
  ctx.fillRect(car.x + car.width * 0.2, car.y + car.height * 0.25, car.width * 0.6, car.height * 0.18);

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(car.x + car.width * 0.15, car.y + car.height - 40, car.width * 0.15, 16);
  ctx.fillRect(car.x + car.width * 0.7, car.y + car.height - 40, car.width * 0.15, 16);

  ctx.fillStyle = '#ffd740';
  ctx.fillRect(car.x + 8, car.y + car.height - 36, 14, 10);
  ctx.fillRect(car.x + car.width - 22, car.y + car.height - 36, 14, 10);

  ctx.restore();
}

function drawPedestrianSprite(pedestrian) {
  const baseWidth = PEDESTRIAN_DIMENSIONS.width;
  const baseHeight = PEDESTRIAN_DIMENSIONS.height;
  ctx.save();
  ctx.translate(pedestrian.centerX, pedestrian.footY);
  ctx.scale(pedestrian.visualScale, pedestrian.visualScale);
  ctx.translate(-baseWidth / 2, -baseHeight);

  const stride = Math.sin(state.elapsed * 0.008 + pedestrian.strideOffset);
  const hipY = baseHeight - 90;
  const kneeY = baseHeight - 45;
  const footY = baseHeight - 10;
  const hipLeftX = baseWidth * 0.38;
  const hipRightX = baseWidth * 0.62;
  const legSwing = stride * 8;
  const legLead = stride * 4;

  ctx.strokeStyle = pedestrian.palette.pants;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(hipLeftX, hipY);
  ctx.quadraticCurveTo(hipLeftX - legSwing, kneeY, hipLeftX - legLead, footY);
  ctx.moveTo(hipRightX, hipY);
  ctx.quadraticCurveTo(hipRightX + legSwing, kneeY, hipRightX + legLead, footY);
  ctx.stroke();

  ctx.strokeStyle = pedestrian.palette.shirt;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(baseWidth * 0.3, baseHeight - 80);
  ctx.lineTo(baseWidth * 0.15 + stride * 4, baseHeight - 110);
  ctx.moveTo(baseWidth * 0.7, baseHeight - 80);
  ctx.lineTo(baseWidth * 0.85 - stride * 4, baseHeight - 112);
  ctx.stroke();

  ctx.fillStyle = pedestrian.palette.pants;
  ctx.fillRect(baseWidth * 0.24, baseHeight - 90, baseWidth * 0.52, 40);
  ctx.fillStyle = pedestrian.palette.shirt;
  ctx.fillRect(baseWidth * 0.2, baseHeight - 140, baseWidth * 0.6, 58);

  ctx.fillStyle = pedestrian.palette.accent;
  ctx.fillRect(baseWidth * 0.32, baseHeight - 140, baseWidth * 0.12, 58);
  ctx.fillRect(baseWidth * 0.56, baseHeight - 140, baseWidth * 0.12, 58);

  ctx.fillStyle = '#ffddb5';
  ctx.beginPath();
  ctx.arc(baseWidth / 2, baseHeight - 160, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2b3642';
  ctx.beginPath();
  ctx.moveTo(baseWidth / 2 - 18, baseHeight - 150);
  ctx.lineTo(baseWidth / 2 + 18, baseHeight - 150);
  ctx.lineTo(baseWidth / 2 + 12, baseHeight - 115);
  ctx.lineTo(baseWidth / 2 - 12, baseHeight - 115);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBicycle() {
  const bike = state.bicycle;
  ctx.save();
  ctx.translate(bike.x + bike.width / 2, bike.y + bike.height / 2);
  ctx.rotate(((BICYCLE_BASE_TILT + bike.sway) * Math.PI) / 180);
  ctx.translate(-bike.width / 2, -bike.height / 2);

  const wheelRadius = 30;
  const frontWheelX = bike.width - 38;
  const rearWheelX = 38;
  const wheelY = bike.height - 10;
  const seat = { x: bike.width * 0.42, y: bike.height * 0.34 };
  const handle = { x: frontWheelX + 8, y: bike.height * 0.2 };
  const crankCenter = { x: bike.width * 0.5, y: bike.height * 0.62 };
  const crankRadius = 18;
  const crankAngle = state.wheelRotation * 1.5;

  drawWheel(rearWheelX, wheelY, wheelRadius);
  drawWheel(frontWheelX, wheelY, wheelRadius);

  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ff5c35';
  ctx.beginPath();
  ctx.moveTo(rearWheelX, wheelY);
  ctx.lineTo(seat.x, seat.y);
  ctx.lineTo(bike.width * 0.5, bike.height * 0.48);
  ctx.lineTo(frontWheelX, wheelY - 6);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(seat.x, seat.y);
  ctx.lineTo(handle.x - 20, handle.y - 4);
  ctx.lineTo(frontWheelX, wheelY - 6);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(seat.x, seat.y);
  ctx.lineTo(crankCenter.x, crankCenter.y);
  ctx.stroke();

  drawHandlebar(handle);

  ctx.fillStyle = '#1f2f3f';
  ctx.fillRect(seat.x - 12, seat.y - 6, 24, 6);

  ctx.fillStyle = '#1a1f26';
  ctx.beginPath();
  ctx.arc(crankCenter.x, crankCenter.y, 6, 0, Math.PI * 2);
  ctx.fill();

  const pedals = [0, Math.PI].map((offset) => ({
    x: crankCenter.x + crankRadius * Math.cos(crankAngle + offset),
    y: crankCenter.y + crankRadius * Math.sin(crankAngle + offset),
  }));

  ctx.strokeStyle = '#1f2530';
  ctx.lineWidth = 4;
  for (const pedal of pedals) {
    ctx.beginPath();
    ctx.moveTo(crankCenter.x, crankCenter.y);
    ctx.lineTo(pedal.x, pedal.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pedal.x - 4, pedal.y);
    ctx.lineTo(pedal.x + 4, pedal.y);
    ctx.stroke();
  }

  drawRider({ seat, handle, pedals });

  ctx.restore();
}

function drawWheel(x, y, radius) {
  ctx.save();
  ctx.translate(x, y);

  ctx.lineWidth = 9;
  ctx.strokeStyle = '#121921';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f9fafb';
  ctx.beginPath();
  ctx.arc(0, 0, radius - 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#1a1f26';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(state.wheelRotation);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#ffebee';
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, radius - 10);
    ctx.stroke();
    ctx.rotate(Math.PI / 2);
  }
  ctx.restore();

  ctx.restore();
}

function drawRider({ seat, handle, pedals }) {
  const hip = { x: seat.x + 2, y: seat.y + 10 };
  const shoulder = { x: seat.x + 20, y: seat.y - 12 };
  const chest = { x: shoulder.x + 12, y: shoulder.y - 4 };
  const head = { x: chest.x + 8, y: chest.y - 20 };

  ctx.fillStyle = '#26394d';
  ctx.beginPath();
  ctx.moveTo(hip.x - 8, hip.y + 8);
  ctx.lineTo(hip.x + 20, hip.y + 10);
  ctx.lineTo(chest.x + 6, chest.y - 4);
  ctx.lineTo(shoulder.x - 6, shoulder.y - 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ff6f43';
  ctx.fillRect(chest.x - 2, chest.y - 6, 6, 26);

  const elbow = {
    x: (shoulder.x + handle.x) / 2 + 6,
    y: (shoulder.y + handle.y) / 2 - 8,
  };
  ctx.strokeStyle = '#1f2d3a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(shoulder.x, shoulder.y);
  ctx.lineTo(elbow.x, elbow.y);
  ctx.lineTo(handle.x, handle.y);
  ctx.stroke();

  ctx.fillStyle = '#ffcf9d';
  ctx.beginPath();
  ctx.arc(handle.x + 6, handle.y - 4, 4, 0, Math.PI * 2);
  ctx.fill();

  drawLegSegment(hip, pedals[0], 1);
  drawLegSegment(hip, pedals[1], -1);

  ctx.fillStyle = '#ffcf9d';
  ctx.beginPath();
  ctx.arc(head.x, head.y, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1b2836';
  ctx.beginPath();
  ctx.arc(head.x, head.y - 6, 13, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f5c273';
  ctx.fillRect(head.x - 9, head.y - 6, 18, 6);
}

function drawHandlebar(handle) {
  ctx.strokeStyle = '#243038';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(handle.x - 34, handle.y - 10);
  ctx.quadraticCurveTo(handle.x - 4, handle.y - 16, handle.x + 18, handle.y - 10);
  ctx.stroke();

  ctx.strokeStyle = '#ff5c35';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(handle.x - 12, handle.y - 12);
  ctx.lineTo(handle.x - 4, handle.y - 30);
  ctx.lineTo(handle.x + 10, handle.y - 26);
  ctx.stroke();

  ctx.strokeStyle = '#1a1f26';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(handle.x - 4, handle.y - 30);
  ctx.lineTo(handle.x - 4, handle.y - 6);
  ctx.stroke();
}

function drawScore() {
  ctx.fillStyle = '#1f2a30';
  ctx.font = '16px "Press Start 2P", "Courier New", monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(`Avoided ${state.avoided}`, 24, 20);
  ctx.fillText(`Speed ${state.difficulty.toFixed(1)}x`, 24, 44);
  if (state.boss.car) {
    ctx.fillText('Boss car!', 24, 68);
  }
}

function drawMessage(text) {
  ctx.save();
  ctx.fillStyle = 'rgba(20, 28, 32, 0.85)';
  ctx.font = '20px "Press Start 2P", "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  ctx.restore();
}

function drawLegSegment(hip, pedal, bendDirection) {
  const knee = {
    x: (hip.x + pedal.x) / 2 + bendDirection * 8,
    y: (hip.y + pedal.y) / 2 - 6,
  };
  ctx.strokeStyle = '#1f2733';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(hip.x, hip.y);
  ctx.lineTo(knee.x, knee.y);
  ctx.lineTo(pedal.x, pedal.y);
  ctx.stroke();

  ctx.strokeStyle = '#0f1419';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pedal.x - 5, pedal.y + 2);
  ctx.lineTo(pedal.x + 5, pedal.y + 2);
  ctx.stroke();
}

let lastTime = performance.now();
function loop(now) {
  const delta = now - lastTime;
  lastTime = now;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

updateCounters();
requestAnimationFrame(loop);
