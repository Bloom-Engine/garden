import {
  Vec3, Color, vec3, vec3Add, vec3Sub, vec3Scale, vec3Distance, vec3Lerp,
  drawSphere, checkCollisionSpheres, randomFloat, easeOutCubic,
} from 'bloom';
import { getGroundHeight, getZoneAtPosition } from './world';

interface Bloom {
  pos: Vec3;
  color: Color;
  collected: boolean;
  collectTimer: number;
  collectStartPos: Vec3;
  baseY: number;
}

interface Particle {
  pos: Vec3;
  vel: Vec3;
  color: Color;
  life: number;
  maxLife: number;
  size: number;
}

// Bloom colors
const GOLD: Color = { r: 255, g: 213, b: 79, a: 255 };
const CORAL: Color = { r: 255, g: 138, b: 101, a: 255 };
const LAVENDER: Color = { r: 179, g: 157, b: 219, a: 255 };
const ROSE: Color = { r: 244, g: 143, b: 177, a: 255 };
const MINT: Color = { r: 128, g: 203, b: 196, a: 255 };

const BLOOM_COLORS = [GOLD, CORAL, LAVENDER, ROSE, MINT];

// Bloom positions: 3 meadow, 3 grove, 2 pond, 3 rocks, 1 arch
const BLOOM_PLACEMENTS: { x: number; z: number; colorIdx: number }[] = [
  // Meadow (center)
  { x: 5, z: 3, colorIdx: 0 },
  { x: -3, z: 5, colorIdx: 1 },
  { x: 2, z: -4, colorIdx: 2 },
  // Grove (SE)
  { x: 12, z: 14, colorIdx: 3 },
  { x: 9, z: 11, colorIdx: 0 },
  { x: 14, z: 11, colorIdx: 4 },
  // Pond (SW)
  { x: -12, z: 8, colorIdx: 2 },
  { x: -8, z: 12, colorIdx: 4 },
  // Rocks (NW)
  { x: -13, z: -11, colorIdx: 1 },
  { x: -10, z: -15, colorIdx: 3 },
  { x: -16, z: -9, colorIdx: 0 },
  // Arch (NE)
  { x: 12, z: -12, colorIdx: 2 },
];

let blooms: Bloom[] = [];
let particles: Particle[] = [];
let collectedCount = 0;

export function initBlooms(): void {
  blooms = BLOOM_PLACEMENTS.map(p => {
    const baseY = getGroundHeight(p.x, p.z);
    return {
      pos: vec3(p.x, baseY + 1, p.z),
      color: BLOOM_COLORS[p.colorIdx],
      collected: false,
      collectTimer: 0,
      collectStartPos: vec3(p.x, baseY + 1, p.z),
      baseY,
    };
  });
  particles = [];
  collectedCount = 0;
}

export function updateBlooms(dt: number, playerPos: Vec3): { collected: boolean; color: Color } | null {
  let result: { collected: boolean; color: Color } | null = null;

  for (let i = 0; i < blooms.length; i++) {
    const bloom = blooms[i];
    if (bloom.collected) {
      if (bloom.collectTimer > 0) {
        bloom.collectTimer -= dt;
        // Lerp toward player with easing
        const t = easeOutCubic(1 - bloom.collectTimer / 0.3);
        bloom.pos = vec3Lerp(bloom.collectStartPos, vec3Add(playerPos, vec3(0, 1.5, 0)), t);
      }
      continue;
    }

    // Check collection
    if (checkCollisionSpheres(playerPos, 0.8, bloom.pos, 0.7)) {
      bloom.collected = true;
      bloom.collectTimer = 0.3;
      bloom.collectStartPos = { ...bloom.pos };
      collectedCount++;

      // Spawn particles
      spawnParticles(bloom.pos, bloom.color, 25);

      result = { collected: true, color: bloom.color };
    }
  }

  // Update particles
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.vel.y -= 6 * dt; // gravity
    p.pos = vec3Add(p.pos, vec3Scale(p.vel, dt));
    p.life -= dt;
    p.size *= (1 - dt * 2);
  }
  particles = particles.filter(p => p.life > 0 && p.size > 0.01);

  return result;
}

function spawnParticles(pos: Vec3, color: Color, count: number): void {
  for (let i = 0; i < count; i++) {
    particles.push({
      pos: vec3Add(pos, vec3(randomFloat(-0.3, 0.3), randomFloat(-0.3, 0.3), randomFloat(-0.3, 0.3))),
      vel: vec3(randomFloat(-3, 3), randomFloat(2, 6), randomFloat(-3, 3)),
      color: {
        r: Math.min(255, color.r + randomFloat(-20, 20)),
        g: Math.min(255, color.g + randomFloat(-20, 20)),
        b: Math.min(255, color.b + randomFloat(-20, 20)),
        a: 255,
      },
      life: randomFloat(0.4, 0.8),
      maxLife: 0.8,
      size: randomFloat(0.05, 0.12),
    });
  }
}

export function drawBlooms(time: number): void {
  for (let i = 0; i < blooms.length; i++) {
    const bloom = blooms[i];
    if (bloom.collected && bloom.collectTimer <= 0) continue;

    const bobY = bloom.collected ? 0 : Math.sin(time * 2 + bloom.pos.x * 0.5) * 0.15;
    const rotation = time * 0.5 + bloom.pos.x;
    const p = vec3Add(bloom.pos, vec3(0, bobY, 0));

    // Glow sphere (semi-transparent)
    if (!bloom.collected) {
      drawSphere(p, 0.5, { r: bloom.color.r, g: bloom.color.g, b: bloom.color.b, a: 60 });
    }

    // Center
    drawSphere(p, 0.15, bloom.color);

    // 5 petals
    for (let j = 0; j < 5; j++) {
      const angle = rotation + (j * Math.PI * 2) / 5;
      const petalDist = 0.22;
      const petalPos = vec3(
        p.x + Math.cos(angle) * petalDist,
        p.y,
        p.z + Math.sin(angle) * petalDist,
      );
      drawSphere(petalPos, 0.12, bloom.color);
    }
  }

  // Draw particles
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const alpha = Math.max(0, (p.life / p.maxLife) * 255);
    drawSphere(p.pos, p.size, { r: p.color.r, g: p.color.g, b: p.color.b, a: alpha });
  }
}

export function getCollectedCount(): number { return collectedCount; }
export function getTotalBlooms(): number { return blooms.length; }
export function getBloomColor(index: number): Color {
  return blooms[index] ? blooms[index].color : GOLD;
}
