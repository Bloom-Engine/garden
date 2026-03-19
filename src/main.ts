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
} from 'bloom';

// ST[0]=state, ST[1]=sinYaw, ST[2]=cosYaw, ST[3]=winTimer, ST[4]=pitch
const ST = [0.0, 0.0, 1.0, 0.0, -0.35];
// P[0]=x, P[1]=y, P[2]=z, P[3]=vy, P[4]=grounded, P[5]=walkT, P[6]=faceSin, P[7]=faceCos
const P = [0.0, 0.4, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0];
const V = [0.0, 0.0]; // vx, vz
const BD = [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0];
const BX = [5.0,-3.0,2.0,12.0,9.0,14.0,-12.0,-8.0,-13.0,-10.0,-16.0,12.0];
const BZ = [3.0,5.0,-4.0,14.0,11.0,11.0,8.0,12.0,-11.0,-15.0,-9.0,-12.0];
const BI = [0.0,1.0,2.0,3.0,0.0,4.0,2.0,4.0,1.0,3.0,0.0,2.0];
const CR = [255,255,179,244,128]; const CG = [213,138,157,143,203]; const CB = [79,101,219,177,196];
const CC = [0.0];
const PS = [-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0,-1.0];
// Particles: up to 60 particles, 6 floats each (x,y,z,vy,life,ci)
const PRT = [0.0]; // PRT[0] = particle count
const PRX: number[] = []; const PRY: number[] = []; const PRZ: number[] = [];
const PRVY: number[] = []; const PRL: number[] = []; const PRC: number[] = [];

initWindow(800, 600, 'Bloom Garden');
setTargetFPS(60);

while (!windowShouldClose()) {
  beginDrawing();
  const dt = getDeltaTime();
  const t = getTime();
  const sw = getScreenWidth();
  const sh = getScreenHeight();

  let imx = 0.0; let imz = 0.0;
  if (isKeyDown(Key.W)) imz = -1.0;
  if (isKeyDown(Key.S)) imz = 1.0;
  if (isKeyDown(Key.A)) imx = -1.0;
  if (isKeyDown(Key.D)) imx = 1.0;
  const iml = Math.sqrt(imx * imx + imz * imz);
  if (iml > 1.0) { imx = imx / iml; imz = imz / iml; }

  // Camera: Arrow keys + Q/E + mouse
  const mdx = getMouseDeltaX() * -0.006;
  let camRot = mdx;
  if (isKeyDown(Key.LEFT) || isKeyDown(Key.Q)) camRot = camRot + 3.0 * dt;
  if (isKeyDown(Key.RIGHT) || isKeyDown(Key.E)) camRot = camRot - 3.0 * dt;
  const da = camRot;
  // Always apply rotation (no threshold — Perry has issues with negative comparisons)
  const os = ST[1]; const oc = ST[2];
  ST[1] = os + oc * da;
  ST[2] = oc - os * da;
  // Renormalize every frame to prevent drift
  const mag = Math.sqrt(ST[1] * ST[1] + ST[2] * ST[2]);
  ST[1] = ST[1] / mag;
  ST[2] = ST[2] / mag;
  // Pitch
  ST[4] = ST[4] + mdy;
  if (ST[4] < -1.0) ST[4] = -1.0;
  if (ST[4] > -0.1) ST[4] = -0.1;

  clearBackground({ r: 135, g: 185, b: 230, a: 255 });
  setAmbientLight({ r: 140, g: 170, b: 200, a: 255 }, 0.35);
  setDirectionalLight(vec3(0.6, 0.8, 0.3), { r: 255, g: 220, b: 180, a: 255 }, 0.75);

  // ==================== TITLE ====================
  if (ST[0] < 0.5) {
    // Slow orbit
    const ts = Math.sin(t * 0.15); const tc = Math.cos(t * 0.15);
    beginMode3D({ position: vec3(22.0 * ts, 10.0, 22.0 * tc), target: vec3(0, 1, 0), up: vec3(0, 1, 0), fovy: 45.0, projection: 0.0 });
    // World
    drawCube(vec3(0, -0.5, 0), 60.0, 1.0, 60.0, { r: 75, g: 155, b: 55, a: 255 });
    drawCube(vec3(0, -0.48, 0), 28.0, 1.0, 28.0, { r: 85, g: 165, b: 62, a: 255 });
    drawCylinder(vec3(10, 0, 12), 0.12, 0.2, 2.5, { r: 100, g: 70, b: 40, a: 255 });
    drawSphere(vec3(10, 2.3, 12), 1.4, { r: 50, g: 140, b: 45, a: 255 });
    drawSphere(vec3(10.4, 2.7, 11.7), 1.0, { r: 65, g: 155, b: 55, a: 255 });
    drawCylinder(vec3(13, 0, 10), 0.12, 0.2, 3.0, { r: 100, g: 70, b: 40, a: 255 });
    drawSphere(vec3(13, 2.8, 10), 1.2, { r: 55, g: 145, b: 50, a: 255 });
    drawSphere(vec3(-12, 0.6, -10), 1.2, { r: 155, g: 150, b: 140, a: 255 });
    drawSphere(vec3(-10, 0.8, -14), 1.5, { r: 150, g: 145, b: 135, a: 255 });
    drawCylinder(vec3(10.5, 0, -12), 0.45, 0.55, 4.5, { r: 158, g: 153, b: 143, a: 255 });
    drawCylinder(vec3(13.5, 0, -12), 0.45, 0.55, 4.5, { r: 158, g: 153, b: 143, a: 255 });
    drawCylinder(vec3(12, 4.2, -12), 2.0, 2.0, 0.5, { r: 165, g: 160, b: 150, a: 255 });
    drawSphere(vec3(12, 4.9, -12), 0.5, { r: 170, g: 165, b: 155, a: 255 });
    drawCylinder(vec3(0, 0, 0), 2.0, 2.3, 0.25, { r: 135, g: 130, b: 120, a: 255 });
    drawCylinder(vec3(0, 0.25, 0), 0.35, 0.5, 0.9, { r: 155, g: 150, b: 140, a: 255 });
    drawCube(vec3(-10, 0.15, 10), 14.0, 0.08, 14.0, { r: 65, g: 155, b: 170, a: 170 });
    // Blooms preview
    for (let i = 0.0; i < 12.0; i = i + 1.0) {
      const j = Math.floor(i);
      const bx = BX[j]; const bz = BZ[j];
      const bb = Math.sin(t * 2.0 + bx * 0.5) * 0.15;
      const ci = Math.floor(BI[j]);
      drawSphere(vec3(bx, 1.0 + bb, bz), 0.4, { r: CR[ci], g: CG[ci], b: CB[ci], a: 80 });
      drawSphere(vec3(bx, 1.0 + bb, bz), 0.15, { r: CR[ci], g: CG[ci], b: CB[ci], a: 255 });
    }
    endMode3D();
    drawRect(0, 0, sw, sh, { r: 5, g: 10, b: 30, a: 150 });
    const tt = 'Bloom Garden'; const tw = measureText(tt, 52);
    drawText(tt, (sw - tw) / 2.0 + 2.0, sh * 0.28 + 2.0, 52, { r: 0, g: 0, b: 0, a: 80 });
    drawText(tt, (sw - tw) / 2.0, sh * 0.28, 52, { r: 255, g: 250, b: 240, a: 255 });
    const su = 'A Bloom Engine Showcase'; const sw3 = measureText(su, 18);
    drawText(su, (sw - sw3) / 2.0, sh * 0.28 + 62.0, 18, { r: 190, g: 200, b: 220, a: 200 });
    const pa = Math.floor(150.0 + Math.sin(t * 3.0) * 80.0);
    const pr = 'Click to begin'; const pw = measureText(pr, 24);
    drawText(pr, (sw - pw) / 2.0, sh * 0.55, 24, { r: 255, g: 255, b: 255, a: pa });
    if (isAnyInputPressed()) {
      ST[0] = 1.0; ST[1] = 0.0; ST[2] = 1.0; ST[3] = 0.0; ST[4] = -0.35;
      P[0]=0.0; P[1]=0.4; P[2]=0.0; P[3]=0.0; P[4]=1.0; P[5]=0.0; P[6]=0.0; P[7]=1.0;
      V[0]=0.0; V[1]=0.0; CC[0]=0.0;
      for (let i = 0.0; i < 12.0; i = i + 1.0) { const j = Math.floor(i); BD[j]=0.0; PS[j]=-1.0; }
    }

  // ==================== GAME ====================
  } else if (ST[0] < 1.5) {
    // Camera-relative movement
    V[0] = (ST[1] * imz + ST[2] * imx) * 6.0;
    V[1] = (ST[2] * imz - ST[1] * imx) * 6.0;
    P[0] = P[0] + V[0] * dt;
    P[2] = P[2] + V[1] * dt;

    // Ground level (gravity disabled — Perry array index issue)
    P[1] = 0.0;

    // Island boundary
    const pd = Math.sqrt(P[0] * P[0] + P[2] * P[2]);
    if (pd > 28.0) { const sc = 27.5 / pd; P[0] = P[0] * sc; P[2] = P[2] * sc; }

    // Walk & facing
    const hs = Math.sqrt(V[0] * V[0] + V[1] * V[1]);
    if (hs > 0.5 && P[4] > 0.5) {
      P[5] = P[5] + dt * hs * 0.8;
      // Track facing with incremental sin/cos (like camera)
      const targetS = V[0] / hs; const targetC = V[1] / hs;
      P[6] = P[6] + (targetS - P[6]) * 0.15;
      P[7] = P[7] + (targetC - P[7]) * 0.15;
    }

    // Camera
    const cdist = 10.0;
    const cpitch = ST[4] + 0.0;
    // cos/sin of pitch via stored value (pitch changes slowly, approximate)
    const cpp = 1.0 - cpitch * cpitch * 0.5; // cos(pitch) ≈ 1 - p²/2
    const spp = cpitch; // sin(pitch) ≈ pitch for small angles
    const camX = P[0] + cdist * cpp * ST[1];
    const camY = P[1] - cdist * spp + 2.0;
    const camZ = P[2] + cdist * cpp * ST[2];

    beginMode3D({ position: vec3(camX, camY, camZ), target: vec3(P[0], P[1] + 1.0, P[2]), up: vec3(0, 1, 0), fovy: 45.0, projection: 0.0 });

    // === WORLD ===
    drawCube(vec3(0, -0.5, 0), 60.0, 1.0, 60.0, { r: 75, g: 155, b: 55, a: 255 });
    drawCube(vec3(0, -0.48, 0), 28.0, 1.0, 28.0, { r: 85, g: 165, b: 62, a: 255 });
    // Grove (SE) — 6 trees
    drawCylinder(vec3(10, 0, 12), 0.12, 0.2, 2.5, { r: 100, g: 70, b: 40, a: 255 });
    drawSphere(vec3(10, 2.3, 12), 1.4, { r: 50, g: 140, b: 45, a: 255 });
    drawSphere(vec3(10.4, 2.7, 11.7), 1.0, { r: 65, g: 155, b: 55, a: 255 });
    drawCylinder(vec3(13, 0, 10), 0.12, 0.2, 3.0, { r: 100, g: 70, b: 40, a: 255 });
    drawSphere(vec3(13, 2.8, 10), 1.2, { r: 55, g: 145, b: 50, a: 255 });
    drawSphere(vec3(12.6, 3.1, 10.3), 0.85, { r: 40, g: 128, b: 45, a: 255 });
    drawCylinder(vec3(8, 0, 15), 0.12, 0.18, 2.2, { r: 100, g: 70, b: 40, a: 255 });
    drawSphere(vec3(8, 2.0, 15), 1.1, { r: 48, g: 138, b: 48, a: 255 });
    drawCylinder(vec3(15, 0, 13), 0.12, 0.18, 2.8, { r: 100, g: 70, b: 40, a: 255 });
    drawSphere(vec3(15, 2.5, 13), 1.2, { r: 58, g: 148, b: 52, a: 255 });
    drawCylinder(vec3(11, 0, 16), 0.1, 0.16, 2.0, { r: 100, g: 70, b: 40, a: 255 });
    drawSphere(vec3(11, 1.8, 16), 1.0, { r: 52, g: 142, b: 50, a: 255 });
    drawCylinder(vec3(14, 0, 15), 0.1, 0.15, 1.8, { r: 95, g: 68, b: 38, a: 255 });
    drawSphere(vec3(14, 1.6, 15), 0.9, { r: 55, g: 138, b: 46, a: 255 });
    // Rocks (NW) — 7 rocks
    drawSphere(vec3(-12, 0.7, -10), 1.3, { r: 155, g: 150, b: 140, a: 255 });
    drawSphere(vec3(-10, 0.9, -14), 1.6, { r: 148, g: 143, b: 133, a: 255 });
    drawSphere(vec3(-15, 0.45, -12), 0.9, { r: 160, g: 155, b: 145, a: 255 });
    drawSphere(vec3(-14, 0.4, -8), 0.75, { r: 145, g: 140, b: 130, a: 255 });
    drawSphere(vec3(-11, 0.55, -13), 1.1, { r: 152, g: 147, b: 137, a: 255 });
    drawSphere(vec3(-13, 0.25, -11), 0.5, { r: 140, g: 135, b: 128, a: 255 });
    drawSphere(vec3(-9, 0.2, -15), 0.4, { r: 150, g: 145, b: 138, a: 255 });
    // Arch (NE)
    drawCylinder(vec3(10.5, 0, -12), 0.5, 0.6, 4.5, { r: 158, g: 153, b: 143, a: 255 });
    drawCylinder(vec3(13.5, 0, -12), 0.5, 0.6, 4.5, { r: 158, g: 153, b: 143, a: 255 });
    drawCylinder(vec3(12, 4.2, -12), 2.2, 2.2, 0.5, { r: 165, g: 160, b: 150, a: 255 });
    drawSphere(vec3(12, 4.9, -12), 0.55, { r: 170, g: 165, b: 155, a: 255 });
    // Pedestal
    drawCylinder(vec3(0, 0, 0), 2.0, 2.3, 0.25, { r: 135, g: 130, b: 120, a: 255 });
    drawCylinder(vec3(0, 0.25, 0), 0.4, 0.55, 0.9, { r: 152, g: 147, b: 137, a: 255 });
    drawCylinder(vec3(0, 1.15, 0), 0.7, 0.7, 0.08, { r: 165, g: 160, b: 150, a: 255 });
    // Pedestal slots
    for (let i = 0.0; i < 12.0; i = i + 1.0) {
      const j = Math.floor(i);
      const sa = (i * 3.14159 * 2.0) / 12.0;
      const sx = Math.cos(sa) * 1.5; const sz = Math.sin(sa) * 1.5;
      if (PS[j] >= 0.0) {
        const ci = Math.floor(PS[j]);
        const sb = Math.sin(t * 2.0 + i) * 0.06;
        drawSphere(vec3(sx, 0.55 + sb, sz), 0.12, { r: CR[ci], g: CG[ci], b: CB[ci], a: 255 });
        drawSphere(vec3(sx, 0.55 + sb, sz), 0.25, { r: CR[ci], g: CG[ci], b: CB[ci], a: 40 });
      } else {
        drawSphere(vec3(sx, 0.35, sz), 0.08, { r: 120, g: 115, b: 110, a: 100 });
      }
    }
    // Water (SW)
    const wy = 0.12 + Math.sin(t * 0.8) * 0.08;
    drawCube(vec3(-10, wy, 10), 14.0, 0.08, 14.0, { r: 60, g: 150, b: 168, a: 165 });
    // Pond rocks
    drawSphere(vec3(-4, 0.2, 4), 0.6, { r: 140, g: 135, b: 128, a: 255 });
    drawSphere(vec3(-16, 0.25, 16), 0.5, { r: 145, g: 140, b: 132, a: 255 });
    // Bushes
    drawSphere(vec3(3, 0.3, -2), 0.5, { r: 58, g: 128, b: 44, a: 255 });
    drawSphere(vec3(-2, 0.25, 3), 0.4, { r: 55, g: 125, b: 42, a: 255 });
    drawSphere(vec3(4, 0.2, 5), 0.35, { r: 62, g: 132, b: 46, a: 255 });
    drawSphere(vec3(-6, 0.2, -3), 0.3, { r: 50, g: 120, b: 40, a: 255 });
    // Compass pillars
    drawCylinder(vec3(25, 0, 0), 0.15, 0.15, 2.5, { r: 200, g: 60, b: 60, a: 255 });
    drawSphere(vec3(25, 2.7, 0), 0.25, { r: 220, g: 80, b: 80, a: 255 });
    drawCylinder(vec3(-25, 0, 0), 0.15, 0.15, 2.5, { r: 60, g: 60, b: 200, a: 255 });
    drawSphere(vec3(-25, 2.7, 0), 0.25, { r: 80, g: 80, b: 220, a: 255 });
    drawCylinder(vec3(0, 0, 25), 0.15, 0.15, 2.5, { r: 200, g: 200, b: 60, a: 255 });
    drawSphere(vec3(0, 2.7, 25), 0.25, { r: 220, g: 220, b: 80, a: 255 });
    drawCylinder(vec3(0, 0, -25), 0.15, 0.15, 2.5, { r: 60, g: 200, b: 60, a: 255 });
    drawSphere(vec3(0, 2.7, -25), 0.25, { r: 80, g: 220, b: 80, a: 255 });

    // === PLAYER ===
    const bob = P[4] > 0.5 && hs > 0.5 ? Math.sin(P[5] * 8.0) * 0.06 : Math.sin(t * 2.0) * 0.03;
    const py = P[1] + bob;
    drawSphere(vec3(P[0], py + 0.45, P[2]), 0.4, { r: 240, g: 240, b: 245, a: 255 });
    drawSphere(vec3(P[0], py + 0.95, P[2]), 0.32, { r: 242, g: 242, b: 248, a: 255 });
    // Eyes
    const ef = P[6]; const ec = P[7];
    drawSphere(vec3(P[0]+ef*0.28+ec*0.1, py+1.0, P[2]+ec*0.28-ef*0.1), 0.055, { r: 25, g: 25, b: 35, a: 255 });
    drawSphere(vec3(P[0]+ef*0.28-ec*0.1, py+1.0, P[2]+ec*0.28+ef*0.1), 0.055, { r: 25, g: 25, b: 35, a: 255 });
    // Cheeks (subtle)
    drawSphere(vec3(P[0]+ef*0.22+ec*0.18, py+0.9, P[2]+ec*0.22-ef*0.18), 0.06, { r: 255, g: 200, b: 190, a: 120 });
    drawSphere(vec3(P[0]+ef*0.22-ec*0.18, py+0.9, P[2]+ec*0.22+ef*0.18), 0.06, { r: 255, g: 200, b: 190, a: 120 });
    // Feet
    if (P[4] > 0.5) {
      const fo = Math.sin(P[5] * 8.0) * 0.12;
      drawSphere(vec3(P[0]+ef*fo+ec*0.12, py+0.06, P[2]+ec*fo-ef*0.12), 0.1, { r: 218, g: 208, b: 198, a: 255 });
      drawSphere(vec3(P[0]-ef*fo-ec*0.12, py+0.06, P[2]-ec*fo+ef*0.12), 0.1, { r: 218, g: 208, b: 198, a: 255 });
    }

    // === BLOOMS ===
    for (let i = 0.0; i < 12.0; i = i + 1.0) {
      const j = Math.floor(i);
      if (BD[j] > 0.5) continue;
      const bx = BX[j]; const bz = BZ[j]; const by = 0.8;
      const bb = Math.sin(t * 2.0 + bx * 0.5) * 0.2;
      const ci = Math.floor(BI[j]);
      // Large glow
      drawSphere(vec3(bx, by + bb, bz), 0.8, { r: CR[ci], g: CG[ci], b: CB[ci], a: 40 });
      // Stem
      drawCylinder(vec3(bx, 0, bz), 0.04, 0.04, by + bb - 0.1, { r: 80, g: 140, b: 50, a: 255 });
      // Center
      drawSphere(vec3(bx, by + bb, bz), 0.2, { r: CR[ci], g: CG[ci], b: CB[ci], a: 255 });
      // Petals
      for (let k = 0.0; k < 5.0; k = k + 1.0) {
        const a = t * 0.5 + bx + (k * 3.14159 * 2.0) / 5.0;
        drawSphere(vec3(bx + Math.cos(a) * 0.3, by + bb, bz + Math.sin(a) * 0.3), 0.15, { r: CR[ci], g: CG[ci], b: CB[ci], a: 255 });
      }
      // Collection — generous radius, ignore Y
      const dx = P[0] - bx; const dz = P[2] - bz;
      if (dx*dx + dz*dz < 4.0) {
        BD[j] = 1.0; CC[0] = CC[0] + 1.0;
        for (let s = 0.0; s < 12.0; s = s + 1.0) {
          const si = Math.floor(s);
          if (PS[si] < 0.0) { PS[si] = BI[j]; break; }
        }
        // Spawn particles
        for (let p = 0.0; p < 15.0; p = p + 1.0) {
          PRX.push(bx + Math.sin(p * 47.0) * 0.3);
          PRY.push(by + Math.cos(p * 31.0) * 0.3);
          PRZ.push(bz + Math.sin(p * 19.0) * 0.3);
          PRVY.push(2.0 + Math.cos(p * 53.0) * 3.0);
          PRL.push(0.6 + Math.sin(p * 37.0) * 0.2);
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
      const ci = Math.floor(PRC[j]);
      const al = Math.floor(PRL[j] * 400.0);
      const sz = PRL[j] * 0.12;
      drawSphere(vec3(PRX[j], PRY[j], PRZ[j]), sz, { r: CR[ci], g: CG[ci], b: CB[ci], a: al });
    }

    endMode3D();

    // Win check
    if (CC[0] > 11.5) { ST[0] = 2.0; ST[3] = 0.0; }

    // HUD
    const ht = Math.floor(CC[0]) + ' / 12';
    const hw = measureText(ht, 30);
    drawRect(sw - hw - 30.0, 12, hw + 20.0, 42, { r: 0, g: 0, b: 0, a: 110 });
    drawText(ht, sw - hw - 20.0, 18, 30, { r: 255, g: 255, b: 255, a: 255 });
    drawCircle(sw / 2.0, sh / 2.0, 2.0, { r: 255, g: 255, b: 255, a: 60 });
    drawText('FPS:' + Math.floor(getFPS()) + ' y:' + Math.floor(P[1] * 10.0) + ' vy:' + Math.floor(P[3] * 10.0), 10, sh - 20.0, 14, { r: 255, g: 255, b: 255, a: 120 });

  // ==================== WIN ====================
  } else {
    ST[3] = ST[3] + dt;
    const ws = Math.sin(ST[3] * 0.25); const wc = Math.cos(ST[3] * 0.25);
    beginMode3D({ position: vec3(16.0 * ws, 8.0, 16.0 * wc), target: vec3(0, 1, 0), up: vec3(0, 1, 0), fovy: 45.0, projection: 0.0 });
    drawCube(vec3(0, -0.5, 0), 60.0, 1.0, 60.0, { r: 75, g: 155, b: 55, a: 255 });
    drawCylinder(vec3(0, 0, 0), 2.0, 2.3, 0.25, { r: 135, g: 130, b: 120, a: 255 });
    drawCylinder(vec3(0, 0.25, 0), 0.4, 0.55, 0.9, { r: 152, g: 147, b: 137, a: 255 });
    for (let i = 0.0; i < 12.0; i = i + 1.0) {
      const j = Math.floor(i);
      if (PS[j] >= 0.0) {
        const sa = (i * 3.14159 * 2.0) / 12.0;
        const ci = Math.floor(PS[j]);
        drawSphere(vec3(Math.cos(sa) * 1.5, 0.55 + Math.sin(t * 2.0 + i) * 0.06, Math.sin(sa) * 1.5), 0.12, { r: CR[ci], g: CG[ci], b: CB[ci], a: 255 });
      }
    }
    endMode3D();
    drawRect(0, 0, sw, sh, { r: 5, g: 10, b: 30, a: 150 });
    if (ST[3] > 0.5) {
      const wt = 'Garden Restored'; const ww = measureText(wt, 48);
      drawText(wt, (sw - ww) / 2.0 + 2.0, sh * 0.28 + 2.0, 48, { r: 0, g: 0, b: 0, a: 70 });
      drawText(wt, (sw - ww) / 2.0, sh * 0.28, 48, { r: 255, g: 225, b: 185, a: 255 });
    }
    if (ST[3] > 2.0) {
      const st = 'Powered by Bloom Engine'; const stw = measureText(st, 20);
      drawText(st, (sw - stw) / 2.0, sh * 0.28 + 62.0, 20, { r: 190, g: 195, b: 215, a: 200 });
    }
    if (ST[3] > 4.0) {
      const pa2 = Math.floor(140.0 + Math.sin(t * 3.0) * 80.0);
      const rp = 'Press any key to play again'; const rpw = measureText(rp, 22);
      drawText(rp, (sw - rpw) / 2.0, sh * 0.55, 22, { r: 255, g: 255, b: 255, a: pa2 });
      if (isAnyInputPressed()) {
        ST[0] = 1.0; ST[1] = 0.0; ST[2] = 1.0; ST[3] = 0.0; ST[4] = -0.35;
        P[0]=0.0; P[1]=0.4; P[2]=0.0; P[3]=0.0; P[4]=1.0; P[5]=0.0; P[6]=0.0; P[7]=1.0;
        V[0]=0.0; V[1]=0.0; CC[0]=0.0;
        for (let i = 0.0; i < 12.0; i = i + 1.0) { const j = Math.floor(i); BD[j]=0.0; PS[j]=-1.0; }
      }
    }
  }
  endDrawing();
}
