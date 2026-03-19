import {
  Vec3, Color, vec3,
  drawCylinder, drawSphere, drawCube,
} from 'bloom';

// Zone types
export type Zone = 'meadow' | 'grove' | 'pond' | 'rocks' | 'arch';

// Colors
const GRASS_GREEN: Color = { r: 80, g: 160, b: 60, a: 255 };
const GROVE_GREEN: Color = { r: 60, g: 130, b: 50, a: 255 };
const ROCK_GREY: Color = { r: 140, g: 135, b: 125, a: 255 };
const POND_TEAL: Color = { r: 60, g: 140, b: 130, a: 255 };
const BROWN: Color = { r: 90, g: 60, b: 35, a: 255 };
const DARK_BROWN: Color = { r: 50, g: 35, b: 20, a: 255 };
const TRUNK_BROWN: Color = { r: 100, g: 70, b: 40, a: 255 };
const LEAF_GREEN1: Color = { r: 50, g: 140, b: 45, a: 255 };
const LEAF_GREEN2: Color = { r: 65, g: 155, b: 55, a: 255 };
const LEAF_GREEN3: Color = { r: 40, g: 125, b: 50, a: 255 };
const WARM_GREY: Color = { r: 155, g: 150, b: 140, a: 255 };
const LIGHT_GREY: Color = { r: 170, g: 165, b: 155, a: 255 };
const STONE: Color = { r: 160, g: 155, b: 145, a: 255 };
const WATER_COLOR: Color = { r: 70, g: 160, b: 170, a: 180 };

const ISLAND_RADIUS = 30;

// Tree positions (grove zone: SE)
const trees: { x: number; z: number; h: number; cr: number }[] = [
  { x: 10, z: 12, h: 2.5, cr: 1.3 },
  { x: 13, z: 10, h: 3.0, cr: 1.1 },
  { x: 8, z: 15, h: 2.2, cr: 1.0 },
  { x: 15, z: 13, h: 2.8, cr: 1.2 },
  { x: 11, z: 16, h: 2.0, cr: 1.0 },
  { x: 14, z: 15, h: 2.6, cr: 1.1 },
];

// Rock positions (rocks zone: NW)
const rocks: { x: number; z: number; r: number }[] = [
  { x: -12, z: -10, r: 1.2 },
  { x: -15, z: -12, r: 0.8 },
  { x: -10, z: -14, r: 1.5 },
  { x: -14, z: -8, r: 0.6 },
  { x: -11, z: -13, r: 1.0 },
];

// Height function — layered sinusoids with circular falloff
export function getGroundHeight(x: number, z: number): number {
  const dist = Math.sqrt(x * x + z * z);
  if (dist > ISLAND_RADIUS) return -10;

  const base =
    1.5 * Math.sin(x * 0.15) * Math.cos(z * 0.12) +
    0.8 * Math.sin(x * 0.3 + z * 0.2) +
    0.4 * Math.cos(x * 0.5 - z * 0.4);

  // Rocks zone (NW) is elevated
  const nx = x / ISLAND_RADIUS;
  const nz = z / ISLAND_RADIUS;
  let rockBoost = 0;
  if (nx < -0.2 && nz < -0.2) {
    const strength = Math.min((-nx - 0.2) * 3, 1) * Math.min((-nz - 0.2) * 3, 1);
    rockBoost = strength * 3;
  }

  // Pond zone (SW) is depressed
  let pondDip = 0;
  if (nx < -0.1 && nz > 0.1) {
    const strength = Math.min((-nx - 0.1) * 3, 1) * Math.min((nz - 0.1) * 3, 1);
    pondDip = strength * -1.5;
  }

  const falloff = Math.pow(Math.max(0, 1 - (dist / ISLAND_RADIUS) * (dist / ISLAND_RADIUS)), 0.5);
  return (base + rockBoost + pondDip) * falloff;
}

export function getZoneAtPosition(pos: Vec3): Zone {
  const nx = pos.x / ISLAND_RADIUS;
  const nz = pos.z / ISLAND_RADIUS;

  if (nx > 0.2 && nz < -0.2) return 'arch';
  if (nx > 0.15 && nz > 0.15) return 'grove';
  if (nx < -0.15 && nz > 0.15) return 'pond';
  if (nx < -0.15 && nz < -0.15) return 'rocks';
  return 'meadow';
}

export function initWorld(): void {
  // No mesh generation needed — ground is drawn as a cube
}

export function drawWorld(time: number): void {
  // Ground — use drawCube instead of drawPlane (drawPlane is back-face culled from above)
  drawCube(vec3(0, -0.5, 0), 60, 1, 60, GRASS_GREEN);

  // Trees
  for (let i = 0; i < trees.length; i++) {
    const tree = trees[i];
    const ty = getGroundHeight(tree.x, tree.z);
    // Trunk
    drawCylinder(vec3(tree.x, ty, tree.z), 0.12, 0.18, tree.h, TRUNK_BROWN);
    // Canopy (overlapping spheres)
    const canopyY = ty + tree.h * 0.8;
    drawSphere(vec3(tree.x, canopyY, tree.z), tree.cr, LEAF_GREEN1);
    drawSphere(vec3(tree.x + 0.3, canopyY + 0.4, tree.z - 0.2), tree.cr * 0.85, LEAF_GREEN2);
    drawSphere(vec3(tree.x - 0.2, canopyY + 0.2, tree.z + 0.3), tree.cr * 0.75, LEAF_GREEN3);
  }

  // Rocks
  for (let i = 0; i < rocks.length; i++) {
    const rock = rocks[i];
    const ry = getGroundHeight(rock.x, rock.z);
    drawSphere(vec3(rock.x, ry + rock.r * 0.5, rock.z), rock.r, WARM_GREY);
  }

  // Stone arch (NE area)
  const archX = 12, archZ = -12;
  const archY = getGroundHeight(archX, archZ);
  // Left pillar
  drawCylinder(vec3(archX - 1.5, archY, archZ), 0.4, 0.5, 4, STONE);
  // Right pillar
  drawCylinder(vec3(archX + 1.5, archY, archZ), 0.4, 0.5, 4, STONE);
  // Top beam (use a cube for the lintel)
  drawSphere(vec3(archX, archY + 4.2, archZ), 0.6, STONE);
  drawCylinder(vec3(archX, archY + 3.8, archZ), 1.8, 1.8, 0.5, STONE);

  // Water (pond zone, SW) — use drawCube instead of drawPlane (drawPlane has culling issues)
  const waterY = getGroundHeight(-10, 10) + 0.3 + Math.sin(time * 0.8) * 0.1;
  drawCube(vec3(-10, waterY, 10), 14, 0.1, 14, WATER_COLOR);
}
