import {
  initWindow, windowShouldClose, beginDrawing, endDrawing, clearBackground,
  setTargetFPS, getTime,
  beginMode3D, endMode3D,
  drawSphere, drawCube, drawText,
  setAmbientLight, setDirectionalLight,
  vec3,
} from 'bloom';

initWindow(800, 600, 'Model Test');
setTargetFPS(60);

while (!windowShouldClose()) {
  beginDrawing();
  const t = getTime();
  clearBackground({ r: 135, g: 185, b: 230, a: 255 });
  setAmbientLight({ r: 140, g: 170, b: 200, a: 255 }, 0.35);
  setDirectionalLight(vec3(0.6, 0.8, 0.3), { r: 255, g: 220, b: 180, a: 255 }, 0.75);

  beginMode3D({ position: vec3(0, 4, 8), target: vec3(0, 0.5, 0), up: vec3(0, 1, 0), fovy: 45.0, projection: 0.0 });
  drawCube(vec3(0, -0.5, 0), 20.0, 1.0, 20.0, { r: 80, g: 160, b: 60, a: 255 });
  drawSphere(vec3(0, 1, 0), 0.5, { r: 255, g: 50, b: 50, a: 255 });
  endMode3D();

  drawText('Test: fixed camera + primitives', 10, 10, 20, { r: 255, g: 255, b: 255, a: 255 });
  endDrawing();
}
