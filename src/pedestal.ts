import {
  Vec3, Color, vec3, vec3Add,
  drawCylinder, drawSphere,
} from 'bloom';
import { getGroundHeight } from './world';

const STONE: Color = { r: 180, g: 175, b: 165, a: 255 };
const DARK_STONE: Color = { r: 140, g: 135, b: 125, a: 255 };
const MARKER_DIM: Color = { r: 100, g: 100, b: 100, a: 120 };
const SLOT_RADIUS = 1.5;
const TOTAL_SLOTS = 12;

const PEDESTAL_POS = vec3(0, 0, 0);

let collectedSlots: (Color | null)[] = [];
let winTriggered = false;

export function initPedestal(): void {
  collectedSlots = new Array(TOTAL_SLOTS).fill(null);
  winTriggered = false;
}

export function addBloomToSlot(color: Color): void {
  for (let i = 0; i < collectedSlots.length; i++) {
    if (collectedSlots[i] === null) {
      collectedSlots[i] = color;
      break;
    }
  }

  // Check win
  let allFilled = true;
  for (let i = 0; i < collectedSlots.length; i++) {
    if (collectedSlots[i] === null) {
      allFilled = false;
      break;
    }
  }
  if (allFilled) {
    winTriggered = true;
  }
}

export function isWinTriggered(): boolean { return winTriggered; }

export function drawPedestal(time: number): void {
  const baseY = getGroundHeight(PEDESTAL_POS.x, PEDESTAL_POS.z);
  const basePos = vec3(PEDESTAL_POS.x, baseY, PEDESTAL_POS.z);

  // Base disc
  drawCylinder(basePos, 2.0, 2.2, 0.3, DARK_STONE);

  // Column
  drawCylinder(vec3Add(basePos, vec3(0, 0.3, 0)), 0.35, 0.45, 0.8, STONE);

  // Top plate
  drawCylinder(vec3Add(basePos, vec3(0, 1.1, 0)), 0.6, 0.6, 0.1, STONE);

  // 12 radial slots
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const angle = (i * Math.PI * 2) / TOTAL_SLOTS;
    const slotX = PEDESTAL_POS.x + Math.cos(angle) * SLOT_RADIUS;
    const slotZ = PEDESTAL_POS.z + Math.sin(angle) * SLOT_RADIUS;
    const slotY = baseY + 0.35;
    const slotPos = vec3(slotX, slotY, slotZ);

    if (collectedSlots[i]) {
      const color = collectedSlots[i]!;
      // Collected bloom: mini flower at slot
      const bobY = Math.sin(time * 2 + i) * 0.05;
      const bloomPos = vec3Add(slotPos, vec3(0, bobY + 0.15, 0));

      // Glow
      drawSphere(bloomPos, 0.25, { r: color.r, g: color.g, b: color.b, a: 60 });

      // Center
      drawSphere(bloomPos, 0.08, color);

      // Petals
      for (let j = 0; j < 5; j++) {
        const pAngle = time * 0.3 + (j * Math.PI * 2) / 5;
        drawSphere(
          vec3(bloomPos.x + Math.cos(pAngle) * 0.12, bloomPos.y, bloomPos.z + Math.sin(pAngle) * 0.12),
          0.06, color
        );
      }
    } else {
      // Empty slot marker
      drawSphere(slotPos, 0.1, MARKER_DIM);
    }
  }
}

export function getPedestalPos(): Vec3 { return PEDESTAL_POS; }
