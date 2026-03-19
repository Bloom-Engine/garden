import {
  initWindow, windowShouldClose, beginDrawing, endDrawing, clearBackground,
  setTargetFPS, getDeltaTime, getTime, getFPS,
  beginMode3D, endMode3D,
  drawSphere, drawCube, drawCylinder, drawText, drawRect, drawCircle, measureText,
  setAmbientLight, setDirectionalLight,
  isKeyDown, isKeyPressed, isAnyInputPressed,
  getMouseDeltaX, getMouseDeltaY,
  getScreenWidth, getScreenHeight,
  vec3, Key,
  loadModel, drawModel,
} from 'bloom';

// === STATE (all arrays for Perry safety) ===
// ST: [state, sinYaw, cosYaw, winTimer, pitch, collectFlash, moveSpeed]
const ST = [0.0, 0.0, 1.0, 0.0, -0.35, 0.0, 0.0];
// P: [x, y, z, vy, grounded, walkT, faceSin, faceCos]
const P = [0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0];
const V = [0.0, 0.0];
// Blooms
const BD = [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0];
const BX = [5.0,-3.0,2.0,12.0,9.0,14.0,-12.0,-8.0,-13.0,-10.0,-16.0,12.0];
const BZ = [3.0,5.0,-4.0,14.0,11.0,11.0,8.0,12.0,-11.0,-15.0,-9.0,-12.0];
const BI = [0.0,1.0,2.0,0.0,1.0,2.0,0.0,1.0,2.0,0.0,1.0,2.0]; // 0=red,1=yellow,2=purple
const CC = [0.0];
const PS = [-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0];
// Particles
const PRX: number[] = []; const PRY: number[] = []; const PRZ: number[] = [];
const PRVY: number[] = []; const PRL: number[] = []; const PRC: number[] = [];
const W = { r: 255, g: 255, b: 255, a: 255 };

initWindow(800, 600, 'Bloom Garden');
setTargetFPS(60);

// === LOAD MODELS ===
const mdlTreeOak = loadModel('assets/models/tree_oak.glb');
const mdlTreeFat = loadModel('assets/models/tree_fat.glb');
const mdlTreeDetail = loadModel('assets/models/tree_detailed.glb');
const mdlTreeDefault = loadModel('assets/models/tree_default.glb');
const mdlRocks = loadModel('assets/models/rocks.glb');
const mdlStones = loadModel('assets/models/stones.glb');
const mdlFlowerRed = loadModel('assets/models/flower_redA.glb');
const mdlFlowerYellow = loadModel('assets/models/flower_yellowA.glb');
const mdlFlowerPurple = loadModel('assets/models/flower_purpleA.glb');
const mdlBush = loadModel('assets/models/plant_bush.glb');
const mdlBushLarge = loadModel('assets/models/plant_bushLarge.glb');
const mdlMushroom = loadModel('assets/models/mushroom_red.glb');
const mdlBarrel = loadModel('assets/models/barrel.glb');
const mdlColumn = loadModel('assets/models/column.glb');
const mdlChest = loadModel('assets/models/chest.glb');
const mdlCharacter = loadModel('assets/models/character-human.glb');
const mdlMixamo = loadModel('assets/models/character_small.glb');
const mdlLily = loadModel('assets/models/lily_large.glb');
// Bloom collectible models (indexed by BI)
const bloomModels = [mdlFlowerRed, mdlFlowerYellow, mdlFlowerPurple];

while (!windowShouldClose()) {
  beginDrawing();
  const dt = getDeltaTime();
  const t = getTime();
  const sw = getScreenWidth();
  const sh = getScreenHeight();

  // Input
  let imx = 0.0; let imz = 0.0;
  if (isKeyDown(Key.W)) imz = -1.0;
  if (isKeyDown(Key.S)) imz = 1.0;
  if (isKeyDown(Key.A)) imx = -1.0;
  if (isKeyDown(Key.D)) imx = 1.0;
  const iml = Math.sqrt(imx * imx + imz * imz);
  if (iml > 1.0) { imx = imx / iml; imz = imz / iml; }

  // Camera rotation
  const mdx = getMouseDeltaX() * -0.006;
  const mdy = getMouseDeltaY() * -0.004;
  let camRot = mdx;
  if (isKeyDown(Key.LEFT) || isKeyDown(Key.Q)) camRot = camRot + 3.0 * dt;
  if (isKeyDown(Key.RIGHT) || isKeyDown(Key.E)) camRot = camRot - 3.0 * dt;
  const os = ST[1]; const oc = ST[2];
  ST[1] = os + oc * camRot;
  ST[2] = oc - os * camRot;
  const mag = Math.sqrt(ST[1] * ST[1] + ST[2] * ST[2]);
  ST[1] = ST[1] / mag; ST[2] = ST[2] / mag;
  ST[4] = ST[4] + mdy;
  if (ST[4] < -1.0) ST[4] = -1.0;
  if (ST[4] > -0.1) ST[4] = -0.1;
  // Decay collect flash
  if (ST[5] > 0.0) ST[5] = ST[5] - dt * 3.0;
  if (ST[5] < 0.0) ST[5] = 0.0;

  clearBackground({ r: 135, g: 185, b: 230, a: 255 });
  setAmbientLight({ r: 140, g: 170, b: 200, a: 255 }, 0.35);
  setDirectionalLight(vec3(0.6, 0.8, 0.3), { r: 255, g: 220, b: 180, a: 255 }, 0.75);

  // ==================== TITLE ====================
  if (ST[0] < 0.5) {
    const ts = Math.sin(t * 0.12); const tc = Math.cos(t * 0.12);
    beginMode3D({ position: vec3(25.0 * ts, 12.0, 25.0 * tc), target: vec3(0, 1, 0), up: vec3(0, 1, 0), fovy: 45.0, projection: 0.0 });
    // Ground + ocean ring
    drawCube(vec3(0, -0.5, 0), 60.0, 1.0, 60.0, { r: 75, g: 155, b: 55, a: 255 });
    drawCube(vec3(0, -0.6, 0), 120.0, 0.5, 120.0, { r: 50, g: 130, b: 170, a: 200 });
    // Trees
    drawModel(mdlTreeOak, vec3(10, 0, 12), 2.0, W);
    drawModel(mdlTreeDetail, vec3(13, 0, 10), 2.2, W);
    drawModel(mdlTreeFat, vec3(8, 0, 15), 1.8, W);
    drawModel(mdlTreeDefault, vec3(-8, 0, -5), 1.8, W);
    // Rocks
    drawModel(mdlRocks, vec3(-12, 0, -10), 2.0, W);
    drawModel(mdlStones, vec3(-10, 0, -14), 2.5, W);
    // Arch
    drawModel(mdlColumn, vec3(10.5, 0, -12), 3.0, W);
    drawModel(mdlColumn, vec3(13.5, 0, -12), 3.0, W);
    drawCylinder(vec3(12, 4.2, -12), 2.2, 2.2, 0.5, { r: 165, g: 160, b: 150, a: 255 });
    // Pedestal + chest
    drawCylinder(vec3(0, 0, 0), 2.0, 2.3, 0.25, { r: 135, g: 130, b: 120, a: 255 });
    drawCylinder(vec3(0, 0.25, 0), 0.4, 0.55, 0.9, { r: 155, g: 150, b: 140, a: 255 });
    drawModel(mdlChest, vec3(0, 1.2, 0), 1.5, W);
    // Water
    drawCube(vec3(-10, 0.12, 10), 14.0, 0.08, 14.0, { r: 60, g: 150, b: 168, a: 165 });
    drawModel(mdlLily, vec3(-8, 0.15, 12), 2.0, W);
    drawModel(mdlLily, vec3(-12, 0.15, 8), 1.5, W);
    // Blooms preview
    for (let i = 0.0; i < 12.0; i = i + 1.0) {
      const j = Math.floor(i); const bx = BX[j]; const bz = BZ[j];
      const bb = Math.sin(t * 2.0 + bx * 0.5) * 0.15;
      const ci = Math.floor(BI[j]);
      drawModel(bloomModels[ci], vec3(bx, bb, bz), 2.0, W);
      drawSphere(vec3(bx, 0.8 + bb, bz), 0.6, { r: 255, g: 230, b: 100, a: 30 });
    }
    endMode3D();

    // Title overlay
    drawRect(0, 0, sw, sh, { r: 5, g: 10, b: 30, a: 140 });
    const tt = 'Bloom Garden'; const tw = measureText(tt, 56);
    drawText(tt, (sw - tw) / 2.0 + 2.0, sh * 0.25 + 2.0, 56, { r: 0, g: 0, b: 0, a: 80 });
    drawText(tt, (sw - tw) / 2.0, sh * 0.25, 56, { r: 255, g: 250, b: 240, a: 255 });
    const su = 'A Bloom Engine Showcase'; const sw3 = measureText(su, 18);
    drawText(su, (sw - sw3) / 2.0, sh * 0.25 + 68.0, 18, { r: 190, g: 200, b: 220, a: 200 });
    const pa = Math.floor(150.0 + Math.sin(t * 3.0) * 80.0);
    const pr = 'Click to begin'; const pw = measureText(pr, 26);
    drawText(pr, (sw - pw) / 2.0, sh * 0.55, 26, { r: 255, g: 255, b: 255, a: pa });
    // Controls hint
    const ch = 'WASD move | Q/E rotate | Mouse look'; const chw = measureText(ch, 14);
    drawText(ch, (sw - chw) / 2.0, sh * 0.65, 14, { r: 180, g: 190, b: 210, a: 160 });

    if (isAnyInputPressed()) {
      ST[0] = 1.0; ST[1] = 0.0; ST[2] = 1.0; ST[3] = 0.0; ST[4] = -0.35; ST[5] = 0.0;
      P[0]=0.0; P[1]=0.0; P[2]=5.0; P[3]=0.0; P[4]=1.0; P[5]=0.0; P[6]=0.0; P[7]=1.0;
      V[0]=0.0; V[1]=0.0; CC[0]=0.0;
      for (let i = 0.0; i < 12.0; i = i + 1.0) { const j = Math.floor(i); BD[j]=0.0; PS[j]=-1.0; }
    }

  // ==================== GAME ====================
  } else if (ST[0] < 1.5) {
    // Movement with smoothing
    const tgtVX = (ST[1] * imz + ST[2] * imx) * 6.0;
    const tgtVZ = (ST[2] * imz - ST[1] * imx) * 6.0;
    V[0] = V[0] + (tgtVX - V[0]) * 0.12;
    V[1] = V[1] + (tgtVZ - V[1]) * 0.12;
    P[0] = P[0] + V[0] * dt;
    P[2] = P[2] + V[1] * dt;
    P[1] = 0.0; // ground

    // Island boundary
    const pd = Math.sqrt(P[0] * P[0] + P[2] * P[2]);
    if (pd > 28.0) { const sc = 27.5 / pd; P[0] = P[0] * sc; P[2] = P[2] * sc; }

    // Walk & facing
    const hs = Math.sqrt(V[0] * V[0] + V[1] * V[1]);
    if (hs > 0.3) {
      P[5] = P[5] + dt * hs * 0.8;
      const ts2 = V[0] / hs; const tc2 = V[1] / hs;
      P[6] = P[6] + (ts2 - P[6]) * 0.12;
      P[7] = P[7] + (tc2 - P[7]) * 0.12;
    }
    // Move speed for animation
    ST[6] = hs;

    // Camera
    const cdist = 6.0;
    const cpp = 1.0 - ST[4] * ST[4] * 0.5;
    const spp = ST[4];
    const camX = P[0] + cdist * cpp * ST[1];
    const camY = P[1] - cdist * spp + 2.0;
    const camZ = P[2] + cdist * cpp * ST[2];

    beginMode3D({ position: vec3(camX, camY, camZ), target: vec3(P[0], P[1] + 1.0, P[2]), up: vec3(0, 1, 0), fovy: 45.0, projection: 0.0 });

    // === WORLD ===
    drawCube(vec3(0, -0.5, 0), 60.0, 1.0, 60.0, { r: 75, g: 155, b: 55, a: 255 });
    drawCube(vec3(0, -0.48, 0), 28.0, 1.0, 28.0, { r: 85, g: 165, b: 62, a: 255 });
    // Ocean ring
    drawCube(vec3(0, -0.7, 0), 120.0, 0.5, 120.0, { r: 50, g: 130, b: 170, a: 200 });

    // Grove (SE) — 6 trees
    drawModel(mdlTreeOak, vec3(10, 0, 12), 2.0, W);
    drawModel(mdlTreeDetail, vec3(13, 0, 10), 2.2, W);
    drawModel(mdlTreeFat, vec3(8, 0, 15), 1.8, W);
    drawModel(mdlTreeDefault, vec3(15, 0, 13), 2.0, W);
    drawModel(mdlTreeOak, vec3(11, 0, 16), 1.6, W);
    drawModel(mdlTreeDetail, vec3(14, 0, 15), 1.5, W);
    // Scattered trees
    drawModel(mdlTreeFat, vec3(-8, 0, -5), 1.8, W);
    drawModel(mdlTreeDefault, vec3(5, 0, -15), 2.0, W);
    drawModel(mdlTreeOak, vec3(-15, 0, 5), 1.5, W);
    drawModel(mdlTreeDefault, vec3(20, 0, -5), 1.8, W);
    drawModel(mdlTreeFat, vec3(-5, 0, 18), 1.4, W);
    drawModel(mdlTreeOak, vec3(-18, 0, -15), 1.6, W);
    // Rocks (NW)
    drawModel(mdlRocks, vec3(-12, 0, -10), 2.0, W);
    drawModel(mdlStones, vec3(-10, 0, -14), 2.5, W);
    drawModel(mdlRocks, vec3(-15, 0, -12), 1.5, W);
    drawModel(mdlStones, vec3(-14, 0, -8), 1.2, W);
    drawModel(mdlRocks, vec3(-11, 0, -13), 1.8, W);
    // Arch (NE)
    drawModel(mdlColumn, vec3(10.5, 0, -12), 3.0, W);
    drawModel(mdlColumn, vec3(13.5, 0, -12), 3.0, W);
    drawCylinder(vec3(12, 4.2, -12), 2.2, 2.2, 0.5, { r: 165, g: 160, b: 150, a: 255 });
    // Pedestal + chest
    drawCylinder(vec3(0, 0, 0), 2.0, 2.3, 0.25, { r: 135, g: 130, b: 120, a: 255 });
    drawCylinder(vec3(0, 0.25, 0), 0.4, 0.55, 0.9, { r: 155, g: 150, b: 140, a: 255 });
    drawCylinder(vec3(0, 1.15, 0), 0.7, 0.7, 0.08, { r: 165, g: 160, b: 150, a: 255 });
    drawModel(mdlChest, vec3(0, 1.2, 0), 1.2, W);
    // Pedestal collected blooms
    for (let i = 0.0; i < 12.0; i = i + 1.0) {
      const j = Math.floor(i);
      const sa = (i * 3.14159 * 2.0) / 12.0;
      const sx = Math.cos(sa) * 1.8; const sz = Math.sin(sa) * 1.8;
      if (PS[j] >= 0.0) {
        const ci = Math.floor(PS[j]);
        const sb = Math.sin(t * 2.0 + i) * 0.06;
        drawModel(bloomModels[ci], vec3(sx, 0.25 + sb, sz), 1.0, W);
      } else {
        drawSphere(vec3(sx, 0.35, sz), 0.06, { r: 120, g: 115, b: 110, a: 80 });
      }
    }
    // Water (SW)
    const wy = 0.12 + Math.sin(t * 0.8) * 0.08;
    drawCube(vec3(-10, wy, 10), 14.0, 0.08, 14.0, { r: 60, g: 150, b: 168, a: 165 });
    drawModel(mdlLily, vec3(-8, wy + 0.02, 12), 2.0, W);
    drawModel(mdlLily, vec3(-12, wy + 0.02, 8), 1.5, W);
    drawModel(mdlLily, vec3(-6, wy + 0.02, 9), 1.2, W);
    // Bushes
    drawModel(mdlBush, vec3(3, 0, -2), 1.5, W);
    drawModel(mdlBushLarge, vec3(-2, 0, 3), 1.2, W);
    drawModel(mdlBush, vec3(4, 0, 5), 1.0, W);
    drawModel(mdlBushLarge, vec3(-6, 0, -3), 0.8, W);
    drawModel(mdlBush, vec3(18, 0, 5), 1.3, W);
    drawModel(mdlBushLarge, vec3(-3, 0, -18), 1.0, W);
    // Ground flowers (decorative, not collectible)
    drawModel(mdlFlowerRed, vec3(6, 0, 2), 1.5, W);
    drawModel(mdlFlowerYellow, vec3(-4, 0, -5), 1.5, W);
    drawModel(mdlFlowerPurple, vec3(8, 0, -3), 1.5, W);
    drawModel(mdlFlowerRed, vec3(-7, 0, 7), 1.2, W);
    drawModel(mdlFlowerYellow, vec3(16, 0, 8), 1.0, W);
    drawModel(mdlFlowerPurple, vec3(-18, 0, 3), 1.3, W);
    // Mushrooms
    drawModel(mdlMushroom, vec3(7, 0, 14), 1.5, W);
    drawModel(mdlMushroom, vec3(-13, 0, -9), 2.0, W);
    drawModel(mdlMushroom, vec3(12, 0, -6), 1.2, W);
    // Barrels
    drawModel(mdlBarrel, vec3(11, 0, -10), 1.5, W);
    drawModel(mdlBarrel, vec3(14, 0, -10), 1.5, W);
    // Pond rocks
    drawModel(mdlRocks, vec3(-4, 0, 4), 1.0, W);
    drawModel(mdlStones, vec3(-16, 0, 16), 0.8, W);

    // === PLAYER — textured Mixamo character ===
    drawModel(mdlMixamo, vec3(P[0], 0.0, P[2]), 1.0, W);

    // === COLLECTIBLE BLOOMS ===
    for (let i = 0.0; i < 12.0; i = i + 1.0) {
      const j = Math.floor(i);
      if (BD[j] > 0.5) continue;
      const bx = BX[j]; const bz = BZ[j]; const by = 0.0;
      const bb = Math.sin(t * 2.0 + bx * 0.5) * 0.2;
      const ci = Math.floor(BI[j]);
      // Render collectible flower model
      drawModel(bloomModels[ci], vec3(bx, by + bb, bz), 2.5, W);
      // Glow sphere
      drawSphere(vec3(bx, 0.8 + bb, bz), 0.8, { r: 255, g: 230, b: 100, a: 35 });
      drawSphere(vec3(bx, 0.8 + bb, bz), 0.4, { r: 255, g: 250, b: 200, a: 50 });
      // Collection check
      const dx = P[0] - bx; const dz = P[2] - bz;
      if (dx * dx + dz * dz < 4.0) {
        BD[j] = 1.0; CC[0] = CC[0] + 1.0;
        ST[5] = 1.0; // collect flash
        for (let s = 0.0; s < 12.0; s = s + 1.0) {
          const si = Math.floor(s);
          if (PS[si] < 0.0) { PS[si] = BI[j]; break; }
        }
        // Particles
        for (let p = 0.0; p < 20.0; p = p + 1.0) {
          PRX.push(bx + Math.sin(p * 47.0) * 0.4);
          PRY.push(0.8 + Math.cos(p * 31.0) * 0.4);
          PRZ.push(bz + Math.sin(p * 19.0) * 0.4);
          PRVY.push(3.0 + Math.cos(p * 53.0) * 4.0);
          PRL.push(0.8 + Math.sin(p * 37.0) * 0.3);
          PRC.push(BI[j]);
        }
      }
    }

    // === PARTICLES ===
    for (let i = PRL.length - 1.0; i >= 0.0; i = i - 1.0) {
      const j = Math.floor(i);
      PRL[j] = PRL[j] - dt;
      if (PRL[j] <= 0.0) {
        PRX.splice(j, 1); PRY.splice(j, 1); PRZ.splice(j, 1);
        PRVY.splice(j, 1); PRL.splice(j, 1); PRC.splice(j, 1);
        continue;
      }
      PRVY[j] = PRVY[j] - 8.0 * dt;
      PRY[j] = PRY[j] + PRVY[j] * dt;
      PRX[j] = PRX[j] + Math.sin(PRY[j] * 5.0) * dt * 0.5;
      const al = Math.floor(PRL[j] * 350.0);
      const sz = PRL[j] * 0.15;
      drawSphere(vec3(PRX[j], PRY[j], PRZ[j]), sz, { r: 255, g: 240, b: 150, a: al });
    }

    endMode3D();

    // Win check
    if (CC[0] > 11.5) { ST[0] = 2.0; ST[3] = 0.0; }

    // Collection flash overlay
    if (ST[5] > 0.01) {
      const fa = Math.floor(ST[5] * 80.0);
      drawRect(0, 0, sw, sh, { r: 255, g: 240, b: 180, a: fa });
    }

    // HUD
    const ht = Math.floor(CC[0]) + ' / 12';
    const hw = measureText(ht, 32);
    drawRect(sw - hw - 35.0, 10, hw + 25.0, 46, { r: 0, g: 0, b: 0, a: 120 });
    drawText(ht, sw - hw - 22.0, 16, 32, { r: 255, g: 255, b: 255, a: 255 });
    drawCircle(sw / 2.0, sh / 2.0, 2.0, { r: 255, g: 255, b: 255, a: 50 });
    drawText('FPS:' + Math.floor(getFPS()), 10, sh - 22.0, 14, { r: 255, g: 255, b: 255, a: 100 });

  // ==================== WIN ====================
  } else {
    ST[3] = ST[3] + dt;
    const ws = Math.sin(ST[3] * 0.2); const wc = Math.cos(ST[3] * 0.2);
    beginMode3D({ position: vec3(12.0 * ws, 6.0, 12.0 * wc), target: vec3(0, 1.5, 0), up: vec3(0, 1, 0), fovy: 45.0, projection: 0.0 });
    drawCube(vec3(0, -0.5, 0), 60.0, 1.0, 60.0, { r: 75, g: 155, b: 55, a: 255 });
    drawCube(vec3(0, -0.7, 0), 120.0, 0.5, 120.0, { r: 50, g: 130, b: 170, a: 200 });
    // Some world
    drawModel(mdlTreeOak, vec3(10, 0, 12), 2.0, W);
    drawModel(mdlTreeDetail, vec3(13, 0, 10), 2.2, W);
    drawModel(mdlRocks, vec3(-12, 0, -10), 2.0, W);
    drawModel(mdlColumn, vec3(10.5, 0, -12), 3.0, W);
    drawModel(mdlColumn, vec3(13.5, 0, -12), 3.0, W);
    // Pedestal + chest + all collected blooms
    drawCylinder(vec3(0, 0, 0), 2.0, 2.3, 0.25, { r: 135, g: 130, b: 120, a: 255 });
    drawCylinder(vec3(0, 0.25, 0), 0.4, 0.55, 0.9, { r: 155, g: 150, b: 140, a: 255 });
    drawModel(mdlChest, vec3(0, 1.2, 0), 1.5, W);
    for (let i = 0.0; i < 12.0; i = i + 1.0) {
      const j = Math.floor(i);
      if (PS[j] >= 0.0) {
        const sa = (i * 3.14159 * 2.0) / 12.0;
        const ci = Math.floor(PS[j]);
        const sb = Math.sin(t * 2.0 + i) * 0.08;
        drawModel(bloomModels[ci], vec3(Math.cos(sa) * 1.8, 0.3 + sb, Math.sin(sa) * 1.8), 1.2, W);
        drawSphere(vec3(Math.cos(sa) * 1.8, 0.8 + sb, Math.sin(sa) * 1.8), 0.3, { r: 255, g: 240, b: 150, a: 40 });
      }
    }
    // Victory particles (ambient sparkles)
    for (let i = 0.0; i < 8.0; i = i + 1.0) {
      const sa = t * 0.5 + i * 0.785;
      const sr = 3.0 + Math.sin(t + i) * 0.5;
      const sy = 1.5 + Math.sin(t * 2.0 + i * 1.3) * 0.5;
      drawSphere(vec3(Math.cos(sa) * sr, sy, Math.sin(sa) * sr), 0.08, { r: 255, g: 240, b: 150, a: 150 });
    }
    endMode3D();

    // Win overlay
    drawRect(0, 0, sw, sh, { r: 5, g: 10, b: 30, a: 130 });
    if (ST[3] > 0.5) {
      const wt = 'Garden Restored'; const ww = measureText(wt, 52);
      drawText(wt, (sw - ww) / 2.0 + 2.0, sh * 0.25 + 2.0, 52, { r: 0, g: 0, b: 0, a: 70 });
      drawText(wt, (sw - ww) / 2.0, sh * 0.25, 52, { r: 255, g: 225, b: 185, a: 255 });
    }
    if (ST[3] > 2.0) {
      const st = 'All 12 blooms collected!'; const stw = measureText(st, 22);
      drawText(st, (sw - stw) / 2.0, sh * 0.25 + 60.0, 22, { r: 220, g: 230, b: 240, a: 220 });
    }
    if (ST[3] > 3.5) {
      const pe = 'Powered by Bloom Engine'; const pew = measureText(pe, 16);
      drawText(pe, (sw - pew) / 2.0, sh * 0.25 + 90.0, 16, { r: 180, g: 190, b: 210, a: 180 });
    }
    if (ST[3] > 5.0) {
      const pa2 = Math.floor(140.0 + Math.sin(t * 3.0) * 80.0);
      const rp = 'Press any key to play again'; const rpw = measureText(rp, 24);
      drawText(rp, (sw - rpw) / 2.0, sh * 0.55, 24, { r: 255, g: 255, b: 255, a: pa2 });
      if (isAnyInputPressed()) {
        ST[0] = 1.0; ST[1] = 0.0; ST[2] = 1.0; ST[3] = 0.0; ST[4] = -0.35; ST[5] = 0.0;
        P[0]=0.0; P[1]=0.0; P[2]=5.0; P[3]=0.0; P[4]=1.0; P[5]=0.0; P[6]=0.0; P[7]=1.0;
        V[0]=0.0; V[1]=0.0; CC[0]=0.0;
        for (let i = 0.0; i < 12.0; i = i + 1.0) { const j = Math.floor(i); BD[j]=0.0; PS[j]=-1.0; }
      }
    }
  }
  endDrawing();
}
