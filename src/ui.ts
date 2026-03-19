import {
  drawText, drawRect, drawCircle, measureText,
  getScreenWidth, getScreenHeight, getTouchCount,
  Color,
} from 'bloom';

const WHITE: Color = { r: 255, g: 255, b: 255, a: 255 };
const SHADOW: Color = { r: 0, g: 0, b: 0, a: 80 };
const DIM_WHITE: Color = { r: 255, g: 255, b: 255, a: 180 };
const OVERLAY: Color = { r: 0, g: 0, b: 20, a: 160 };
const HUD_BG: Color = { r: 0, g: 0, b: 0, a: 100 };
const JOY_OUTER: Color = { r: 255, g: 255, b: 255, a: 40 };
const JOY_INNER: Color = { r: 255, g: 255, b: 255, a: 80 };
const JUMP_BTN: Color = { r: 255, g: 255, b: 255, a: 60 };

let hudFadeTimer = 3;

export function resetHudFade(): void {
  hudFadeTimer = 3;
}

// HUD
export function drawHUD(collected: number, total: number, dt: number): void {
  hudFadeTimer -= dt;

  const sw = getScreenWidth();
  const text = `${collected} / ${total}`;
  const size = 28;
  const tw = measureText(text, size);
  const x = sw - tw - 20;
  const y = 20;

  let alpha = 255;
  if (hudFadeTimer < 0) {
    alpha = Math.max(0, Math.floor(80)); // dim after timeout
  }

  drawRect(x - 10, y - 5, tw + 20, size + 10, { r: 0, g: 0, b: 0, a: Math.floor(alpha * 0.4) });
  drawText(text, x, y, size, { r: 255, g: 255, b: 255, a: alpha });

  // Mobile controls
  if (getTouchCount() > 0) {
    drawTouchControls();
  }
}

// Title screen
export function drawTitleScreen(dt: number, time: number): void {
  const sw = getScreenWidth();
  const sh = getScreenHeight();

  // Dark overlay
  drawRect(0, 0, sw, sh, OVERLAY);

  // Title
  const title = 'Bloom Garden';
  const titleSize = 48;
  const titleW = measureText(title, titleSize);
  drawText(title, (sw - titleW) / 2 + 2, sh * 0.35 + 2, titleSize, SHADOW);
  drawText(title, (sw - titleW) / 2, sh * 0.35, titleSize, WHITE);

  // Subtitle
  const sub = 'A Bloom Engine Showcase';
  const subSize = 20;
  const subW = measureText(sub, subSize);
  drawText(sub, (sw - subW) / 2, sh * 0.35 + 60, subSize, DIM_WHITE);

  // Pulsing "Press any key"
  const pulseAlpha = Math.floor(140 + Math.sin(time * 3) * 80);
  const prompt = 'Press any key to begin';
  const promptSize = 22;
  const promptW = measureText(prompt, promptSize);
  drawText(prompt, (sw - promptW) / 2, sh * 0.6, promptSize, { r: 255, g: 255, b: 255, a: pulseAlpha });
}

// Win screen
export function drawWinScreen(winTimer: number): void {
  const sw = getScreenWidth();
  const sh = getScreenHeight();

  // Fade in overlay
  const overlayAlpha = Math.min(160, Math.floor(winTimer * 80));
  drawRect(0, 0, sw, sh, { r: 0, g: 0, b: 20, a: overlayAlpha });

  if (winTimer > 1) {
    const fadeIn = Math.min(1, (winTimer - 1) / 1.5);
    const alpha = Math.floor(fadeIn * 255);
    const title = 'Garden Restored';
    const titleSize = 44;
    const titleW = measureText(title, titleSize);
    drawText(title, (sw - titleW) / 2 + 2, sh * 0.35 + 2, titleSize, { r: 0, g: 0, b: 0, a: Math.floor(alpha * 0.3) });
    drawText(title, (sw - titleW) / 2, sh * 0.35, titleSize, { r: 255, g: 220, b: 180, a: alpha });
  }

  if (winTimer > 3) {
    const fadeIn = Math.min(1, (winTimer - 3) / 1);
    const alpha = Math.floor(fadeIn * 200);
    const sub = 'Powered by Bloom Engine';
    const subSize = 18;
    const subW = measureText(sub, subSize);
    drawText(sub, (sw - subW) / 2, sh * 0.35 + 55, subSize, { r: 200, g: 200, b: 220, a: alpha });
  }

  if (winTimer > 5) {
    const pulseAlpha = Math.floor(120 + Math.sin(winTimer * 3) * 80);
    const prompt = 'Press any key to play again';
    const promptSize = 20;
    const promptW = measureText(prompt, promptSize);
    drawText(prompt, (sw - promptW) / 2, sh * 0.6, promptSize, { r: 255, g: 255, b: 255, a: pulseAlpha });
  }
}

function drawTouchControls(): void {
  const sh = getScreenHeight();

  // Virtual joystick (bottom-left)
  const joyX = 100;
  const joyY = sh - 140;
  drawCircle(joyX, joyY, 60, JOY_OUTER);
  drawCircle(joyX, joyY, 25, JOY_INNER);

  // Jump button (bottom-right)
  const sw = getScreenWidth();
  const btnX = sw - 80;
  const btnY = sh - 100;
  drawCircle(btnX, btnY, 35, JUMP_BTN);
  drawText('Jump', btnX - 18, btnY - 8, 16, DIM_WHITE);
}
