import { Camera3D, Vec3, vec3, vec3Add, vec3Lerp, clamp } from 'bloom';

let yaw = 0;
let pitch = -0.5;
const DISTANCE = 8;
let currentPos: Vec3 = vec3(0, 5, 8);
let currentTarget: Vec3 = vec3(0, 1, 0);
let winOrbitActive = false;
let winOrbitCenter: Vec3 = vec3(0, 0, 0);
let winOrbitAngle = 0;

const SENSITIVITY = 1.0;

export function initCamera(): void {
  yaw = 0;
  pitch = -0.5;
  currentPos = vec3(0, 5, 8);
  currentTarget = vec3(0, 1, 0);
  winOrbitActive = false;
}

export function updateCamera(dt: number, playerPos: Vec3, cameraInputX: number, cameraInputY: number): void {
  if (winOrbitActive) {
    updateWinOrbit(dt);
    return;
  }

  yaw += cameraInputX * SENSITIVITY;
  pitch += cameraInputY * SENSITIVITY;
  pitch = clamp(pitch, -1.2, -0.1);

  // Spherical coordinates
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  const desiredPos: Vec3 = {
    x: playerPos.x + DISTANCE * cosP * sinY,
    y: playerPos.y - DISTANCE * sinP,
    z: playerPos.z + DISTANCE * cosP * cosY,
  };

  const desiredTarget = vec3Add(playerPos, vec3(0, 1, 0));

  // Smooth follow
  const smoothFactor = 1 - Math.pow(0.001, dt);
  currentPos = vec3Lerp(currentPos, desiredPos, smoothFactor);
  currentTarget = vec3Lerp(currentTarget, desiredTarget, smoothFactor);
}

export function getCamera(): Camera3D {
  return {
    position: currentPos,
    target: currentTarget,
    up: vec3(0, 1, 0),
    fovy: 45,
    projection: 0,
  };
}

export function getCameraYaw(): number {
  return yaw;
}

export function startWinOrbit(center: Vec3): void {
  winOrbitActive = true;
  winOrbitCenter = center;
  winOrbitAngle = yaw;
}

function updateWinOrbit(dt: number): void {
  winOrbitAngle += dt * 0.3;
  const dist = 12;
  const height = 6;
  currentPos = {
    x: winOrbitCenter.x + dist * Math.sin(winOrbitAngle),
    y: winOrbitCenter.y + height,
    z: winOrbitCenter.z + dist * Math.cos(winOrbitAngle),
  };
  currentTarget = vec3Add(winOrbitCenter, vec3(0, 1, 0));
}
