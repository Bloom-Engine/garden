import {
  Vec3, Color, vec3, vec3Add, vec3Scale, vec3Length, vec3Normalize, vec3Lerp,
  drawSphere, lerp, clamp,
} from 'bloom';

// Colors
const WHITE: Color = { r: 240, g: 240, b: 245, a: 255 };
const DARK: Color = { r: 30, g: 30, b: 40, a: 255 };
const FOOT_COLOR: Color = { r: 220, g: 210, b: 200, a: 255 };

// Physics
const MOVE_SPEED = 6;
const GRAVITY = -12;
const JUMP_VY = 8;
const APEX_GRAVITY_MULT = 0.4;
const ISLAND_RADIUS = 35;

// State
let pos: Vec3 = vec3(0, 2, 0);
let vel: Vec3 = vec3(0, 0, 0);
let grounded = true;
let walkTime = 0;
let collectSpinTimer = 0;
let collectColor: Color = WHITE;
let glowTimer = 0;
let squashTimer = 0;
let facing = 0;

type HeightFn = (x: number, z: number) => number;
let getGroundHeight: HeightFn = () => 0;

export function initPlayer(heightFn: HeightFn): void {
  pos = vec3(0, 2, 0);
  vel = vec3(0, 0, 0);
  grounded = true;
  walkTime = 0;
  collectSpinTimer = 0;
  glowTimer = 0;
  squashTimer = 0;
  facing = 0;
  getGroundHeight = heightFn;
}

export function updatePlayer(dt: number, moveX: number, moveZ: number, jump: boolean, cameraYaw: number): void {
  // Camera-relative movement
  const sinY = Math.sin(cameraYaw);
  const cosY = Math.cos(cameraYaw);
  const forward: Vec3 = vec3(sinY, 0, cosY);
  const right: Vec3 = vec3(cosY, 0, -sinY);

  const targetVelX = (forward.x * -moveZ + right.x * moveX) * MOVE_SPEED;
  const targetVelZ = (forward.z * -moveZ + right.z * moveX) * MOVE_SPEED;

  // Smooth acceleration
  const accelFactor = grounded ? 0.15 : 0.08;
  const smoothT = 1 - Math.pow(1 - accelFactor, dt * 60);
  vel = { x: lerp(vel.x, targetVelX, smoothT), y: vel.y, z: lerp(vel.z, targetVelZ, smoothT) };

  // Jump
  if (jump && grounded) {
    vel.y = JUMP_VY;
    grounded = false;
    squashTimer = 0.15; // stretch on launch
  }

  // Gravity with apex hang
  let grav = GRAVITY;
  if (!grounded && Math.abs(vel.y) < 1.5) {
    grav *= APEX_GRAVITY_MULT;
  }
  vel.y += grav * dt;

  // Apply velocity
  pos = vec3Add(pos, vec3Scale(vel, dt));

  // Ground collision
  const groundY = getGroundHeight(pos.x, pos.z);
  if (pos.y <= groundY) {
    pos.y = groundY;
    if (vel.y < -1) {
      squashTimer = 0.15; // squash on land
    }
    vel.y = 0;
    grounded = true;
  }

  // Island edge constraint
  const distFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
  if (distFromCenter > ISLAND_RADIUS) {
    const norm = vec3Normalize(vec3(pos.x, 0, pos.z));
    pos.x = norm.x * (ISLAND_RADIUS - 0.5);
    pos.z = norm.z * (ISLAND_RADIUS - 0.5);
    // Push back velocity
    vel.x *= 0.5;
    vel.z *= 0.5;
  }

  // Walk animation timer
  const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
  if (hSpeed > 0.5 && grounded) {
    walkTime += dt * hSpeed * 0.8;
    facing = Math.atan2(vel.x, vel.z);
  }

  // Update timers
  if (collectSpinTimer > 0) collectSpinTimer -= dt;
  if (glowTimer > 0) glowTimer -= dt;
  if (squashTimer > 0) squashTimer -= dt;
}

export function triggerCollect(color: Color): void {
  collectSpinTimer = 0.4;
  collectColor = color;
  glowTimer = 0.4;
}

export function drawPlayer(time: number): void {
  const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);

  // Procedural animation
  let bobY = 0;
  let tiltX = 0;
  let scaleX = 1, scaleY = 1;

  if (grounded && hSpeed > 0.5) {
    // Walk bob
    bobY = Math.sin(walkTime * 8) * 0.08;
    tiltX = Math.sin(walkTime * 8) * 0.05;
  } else if (grounded) {
    // Idle bob
    bobY = Math.sin(time * 2) * 0.04;
  }

  // Squash/stretch
  if (squashTimer > 0) {
    const t = squashTimer / 0.15;
    if (vel.y > 0) {
      // Stretch on jump
      scaleY = 1 + t * 0.3;
      scaleX = 1 - t * 0.15;
    } else {
      // Squash on land
      scaleY = 1 - t * 0.2;
      scaleX = 1 + t * 0.1;
    }
  }

  // Collect spin
  let spinAngle = 0;
  let collectScale = 1;
  if (collectSpinTimer > 0) {
    const t = 1 - collectSpinTimer / 0.4;
    spinAngle = t * Math.PI * 2;
    collectScale = 1 + Math.sin(t * Math.PI) * 0.3;
  }

  const baseY = pos.y + bobY;
  const bodyR = 0.4 * scaleX * collectScale;
  const bodyH = 0.4 * scaleY * collectScale;

  // Body color (with glow tint)
  let bodyColor = WHITE;
  if (glowTimer > 0) {
    const gt = glowTimer / 0.4;
    bodyColor = {
      r: lerp(WHITE.r, collectColor.r, gt * 0.5),
      g: lerp(WHITE.g, collectColor.g, gt * 0.5),
      b: lerp(WHITE.b, collectColor.b, gt * 0.5),
      a: 255,
    };
  }

  // Body
  drawSphere(vec3(pos.x, baseY + bodyH, pos.z), bodyR, bodyColor);

  // Head
  drawSphere(vec3(pos.x, baseY + bodyH + 0.5 * scaleY * collectScale, pos.z), 0.35 * collectScale, bodyColor);

  // Eyes (facing direction)
  const eyeForwardX = Math.sin(facing);
  const eyeForwardZ = Math.cos(facing);
  const eyeY = baseY + bodyH + 0.55 * scaleY * collectScale;
  const eyeSpread = 0.12;
  const eyeDist = 0.3;

  drawSphere(
    vec3(pos.x + eyeForwardX * eyeDist + eyeForwardZ * eyeSpread, eyeY, pos.z + eyeForwardZ * eyeDist - eyeForwardX * eyeSpread),
    0.06, DARK
  );
  drawSphere(
    vec3(pos.x + eyeForwardX * eyeDist - eyeForwardZ * eyeSpread, eyeY, pos.z + eyeForwardZ * eyeDist + eyeForwardX * eyeSpread),
    0.06, DARK
  );

  // Feet (walk cycle)
  if (grounded) {
    const footOffset = Math.sin(walkTime * 8) * 0.15 * Math.min(hSpeed / MOVE_SPEED, 1);
    const footY = baseY + 0.05;

    drawSphere(
      vec3(pos.x + eyeForwardX * footOffset + eyeForwardZ * 0.15, footY, pos.z + eyeForwardZ * footOffset - eyeForwardX * 0.15),
      0.12, FOOT_COLOR
    );
    drawSphere(
      vec3(pos.x - eyeForwardX * footOffset - eyeForwardZ * 0.15, footY, pos.z - eyeForwardZ * footOffset + eyeForwardX * 0.15),
      0.12, FOOT_COLOR
    );
  }
}

export function getPlayerPos(): Vec3 { return pos; }
export function isPlayerGrounded(): boolean { return grounded; }
export function getPlayerSpeed(): number { return Math.sqrt(vel.x * vel.x + vel.z * vel.z); }
