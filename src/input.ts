import {
  isKeyDown, isKeyPressed,
  getMouseDeltaX, getMouseDeltaY, disableCursor,
  isMouseButtonPressed,
  isGamepadAvailable, getGamepadAxis, isGamepadButtonPressed,
  getTouchX, getTouchY, getTouchCount,
  getScreenWidth, getScreenHeight,
  isAnyInputPressed,
  Key,
} from 'bloom';

export interface InputState {
  moveX: number;
  moveZ: number;
  cameraX: number;
  cameraY: number;
  jump: boolean;
  anyStart: boolean;
}

const MOUSE_SENSITIVITY = 0.003;
const STICK_SENSITIVITY = 3.0;
const STICK_DEADZONE = 0.15;
const TOUCH_JOYSTICK_RADIUS = 60;
const TOUCH_JOYSTICK_X = 100;
const TOUCH_JOYSTICK_Y_OFFSET = 140; // from bottom

let cursorDisabled = false;
let touchMoveId = -1;
let touchMoveStartX = 0;
let touchMoveStartY = 0;
let touchCameraId = -1;
let touchCameraLastX = 0;
let touchCameraLastY = 0;

export function initInput(): void {
  disableCursor();
  cursorDisabled = true;
}

function applyDeadzone(value: number): number {
  if (Math.abs(value) < STICK_DEADZONE) return 0;
  return (value - Math.sign(value) * STICK_DEADZONE) / (1 - STICK_DEADZONE);
}

export function updateInput(dt: number): InputState {
  let moveX = 0;
  let moveZ = 0;
  let cameraX = 0;
  let cameraY = 0;
  let jump = false;
  let anyStart = false;

  // Keyboard
  if (isKeyDown(Key.W) || isKeyDown(Key.UP)) moveZ -= 1;
  if (isKeyDown(Key.S) || isKeyDown(Key.DOWN)) moveZ += 1;
  if (isKeyDown(Key.A) || isKeyDown(Key.LEFT)) moveX -= 1;
  if (isKeyDown(Key.D) || isKeyDown(Key.RIGHT)) moveX += 1;
  if (isKeyPressed(Key.SPACE)) jump = true;

  // Check for any input (engine-level check — most reliable)
  if (isAnyInputPressed()) {
    anyStart = true;
  }

  // Normalize diagonal movement
  const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
  if (moveLen > 1) {
    moveX /= moveLen;
    moveZ /= moveLen;
  }

  // Mouse camera
  if (cursorDisabled) {
    cameraX = getMouseDeltaX() * MOUSE_SENSITIVITY;
    cameraY = getMouseDeltaY() * MOUSE_SENSITIVITY;
  }

  // Gamepad
  if (isGamepadAvailable()) {
    const lx = applyDeadzone(getGamepadAxis(0));
    const ly = applyDeadzone(getGamepadAxis(1));
    const rx = applyDeadzone(getGamepadAxis(2));
    const ry = applyDeadzone(getGamepadAxis(3));

    if (Math.abs(lx) > 0 || Math.abs(ly) > 0) {
      moveX = lx;
      moveZ = ly;
    }
    cameraX += rx * STICK_SENSITIVITY * dt;
    cameraY += ry * STICK_SENSITIVITY * dt;

    if (isGamepadButtonPressed(0)) { // A button
      jump = true;
      anyStart = true;
    }
  }

  // Touch
  const touchCount = getTouchCount();
  if (touchCount > 0) {
    anyStart = true;
    const screenW = getScreenWidth();
    const screenH = getScreenHeight();
    const joyY = screenH - TOUCH_JOYSTICK_Y_OFFSET;

    for (let i = 0; i < touchCount; i++) {
      const tx = getTouchX(i);
      const ty = getTouchY(i);

      // Left side = move joystick
      if (tx < screenW * 0.4) {
        const dx = tx - TOUCH_JOYSTICK_X;
        const dy = ty - joyY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          const clampDist = Math.min(dist, TOUCH_JOYSTICK_RADIUS);
          moveX = (dx / dist) * (clampDist / TOUCH_JOYSTICK_RADIUS);
          moveZ = (dy / dist) * (clampDist / TOUCH_JOYSTICK_RADIUS);
        }
      }
      // Right side bottom = jump
      else if (tx > screenW * 0.7 && ty > screenH * 0.6) {
        jump = true;
      }
      // Right side = camera drag
      else if (tx > screenW * 0.4) {
        if (touchCameraId === -1) {
          touchCameraId = i;
          touchCameraLastX = tx;
          touchCameraLastY = ty;
        } else if (touchCameraId === i) {
          cameraX += (tx - touchCameraLastX) * 0.005;
          cameraY += (ty - touchCameraLastY) * 0.005;
          touchCameraLastX = tx;
          touchCameraLastY = ty;
        }
      }
    }
  } else {
    touchCameraId = -1;
  }

  return { moveX, moveZ, cameraX, cameraY, jump, anyStart };
}
