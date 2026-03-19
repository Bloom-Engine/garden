# BLOOM GARDEN

**The flagship showcase game for the Bloom Engine**

Game Design Document v0.1 · Skelpo GmbH · March 2026

---

## 1. Concept

A tiny, beautiful low-poly 3D collectathon. You play as **Petal**, a small glowing character exploring a floating island garden, collecting bloom flowers to bring the garden back to life. No enemies, no combat, no fail state — just movement, exploration, and the satisfaction of watching a world come alive.

**One sentence:** *"Collect glowing blooms on a floating island to restore a garden — a tiny, beautiful 3D game that proves TypeScript can go native."*

**Genre:** 3D platformer / exploration / collectathon
**Perspective:** Third-person, camera follows character
**Platforms:** macOS, Windows, iOS, Android (via Perry + Bloom Engine)
**Session length:** 5–15 minutes to complete
**Target rating:** Everyone / USK 0 / PEGI 3

---

## 2. Why This Game

Bloom Garden exists to prove exactly one thing: **the Bloom Engine ships real, polished, native 3D games from TypeScript.** Every design decision serves that mission.

| Goal | How Bloom Garden delivers |
|---|---|
| Show 3D rendering | Low-poly island with lighting, shadows, particles |
| Show character movement | Third-person controller with jump, smooth camera |
| Show it's a real game | Collectibles, progress, win state, sound, music |
| Show cross-platform | Same code runs on macOS, Windows, iOS, Android |
| Show App Store quality | Polished enough to pass review and look good in screenshots |
| Show simplicity of engine | Entire game fits in ~800 lines of TypeScript |
| Show performance | Locked 60fps on all platforms, instant load |

---

## 3. Visual Style

### 3.1 Art Direction: "Cozy Low-Poly"

The visual style is low-poly with flat shading, bold colors, and soft lighting. Think Monument Valley meets A Short Hike. No textures needed — everything is vertex-colored geometry. This is both an aesthetic choice and a practical one: it looks beautiful, runs fast, and requires zero art assets beyond simple 3D models.

**Color palette:**
- Sky: soft gradient from pale blue (#B4D4E7) to warm peach (#F5D5C0) at the horizon
- Grass: muted sage green (#7BA seventeen78) to warm olive (#A4B86A)
- Stone: warm grey (#B8AFA6) to light tan (#D4C9BB)
- Water: translucent teal (#6DC5D1) with gentle vertex animation
- Blooms: glowing warm colors — gold (#FFD54F), coral (#FF8A65), lavender (#B39DDB), rose (#F48FB1), mint (#80CBC4)
- Petal (character): soft white (#F5F5F0) with a gentle glow

**Lighting:**
- One directional light (warm sun, casting soft shadows)
- Gentle ambient light (cool blue tint, fills shadows)
- Bloom flowers emit a subtle point light glow
- Time of day is fixed at "golden hour" — permanent magic hour lighting

### 3.2 No Textures, No UV Mapping

Every surface is flat-shaded vertex-colored polygons. This means:
- No texture loading or UV mapping code needed in the engine
- Models are tiny (a few KB each)
- The look is consistent and intentional
- Anyone can make new models in Blender in minutes

### 3.3 Scale & Proportions

Everything is slightly chunky and rounded. Trees are puffy, rocks are smooth, the character is chibi-proportioned (big head, small body). The island is small enough to see from edge to edge — it should feel like a diorama or snow globe you can explore from the inside.

---

## 4. The World

### 4.1 The Island

One floating island, roughly 60×60 units, hovering in an infinite sky. The island has gentle elevation changes — small hills, a shallow pond, a rocky outcrop, a few trees — but no deadly falls or hard platforming. If you walk off the edge, you gently float back to the center (no death, no punishment).

**Zones (all on one connected island):**

| Zone | Description | Bloom count | Key feature |
|---|---|---|---|
| **The Meadow** | Open grassy area, starting point | 3 blooms | Gentle hills, tutorial space |
| **The Grove** | Cluster of low-poly trees | 3 blooms | Dappled light through canopy, blooms hidden in branches |
| **The Pond** | Small shallow pond with lily pads | 2 blooms | Water rendering, one bloom floating on water |
| **The Rocks** | Rocky outcrop, highest point | 3 blooms | Light jumping/climbing, vista view of whole island |
| **The Arch** | Natural stone arch bridge | 1 bloom | The "reward" bloom — on top of the arch, satisfying to reach |

**Total: 12 blooms to collect.**

### 4.2 The Pedestal

In the center of the meadow is a stone pedestal with 12 empty slots arranged in a circle. As you collect blooms, they appear on the pedestal, each glowing in its color. When all 12 are placed, the pedestal activates — the whole island bursts into bloom (flowers appear everywhere, trees get fuller, butterflies spawn, the music swells). That's the win state.

---

## 5. The Character: Petal

### 5.1 Design

Petal is a small, round, white character — roughly capsule-shaped with stubby legs, no arms, and two dot eyes. Think Kirby meets a marshmallow. Petal has a soft outer glow that pulses gently (like breathing). When Petal collects a bloom, the glow briefly takes on the bloom's color.

The simple design means:
- The 3D model is ~200 polygons
- Animation is minimal (bob while walking, squish on landing, spin on collect)
- Instantly readable at any camera distance
- Works as an app icon silhouette

### 5.2 Movement

| Action | Input (Desktop) | Input (Mobile) | Input (Gamepad) |
|---|---|---|---|
| Move | WASD | Virtual joystick (left thumb) | Left stick |
| Camera | Mouse | Drag right side of screen | Right stick |
| Jump | Space | Tap jump button (right thumb) | A / X button |

**Movement feel:**
- Speed: brisk but not frantic (~6 units/second)
- Acceleration: quick ramp-up (0.15s to full speed), gentle deceleration
- Jump: satisfying arc, ~2.5 units high, with slight hang time at apex
- Gravity: slightly floaty (80% of "realistic") — this is a garden, not a battlefield
- Camera: follows behind Petal at ~8 units distance, ~30° angle, smooth lerp (0.1 damping)
- Camera collision: camera pushes closer if it would clip through geometry

### 5.3 Animations (All Procedural)

No skeletal animation needed. All movement is procedural:

| State | Animation |
|---|---|
| Idle | Gentle up/down bob (sine wave, 0.5Hz, 0.1 amplitude) |
| Walking | Faster bob (2Hz, 0.15 amplitude) + slight side-to-side tilt |
| Jumping | Stretch vertically on launch, squash on landing |
| Collecting | Quick 360° spin + scale pulse (1.0 → 1.3 → 1.0) |
| Falling | Slow rotation, arms(?) spread — or just a gentle tumble |

This means zero animation files, zero rigging. Just math in the game loop. Perfect for showcasing the engine's simplicity.

---

## 6. Blooms (Collectibles)

### 6.1 Design

Each bloom is a simple 3D flower shape — 5-6 petal polygons arranged radially around a center sphere. They hover ~1 unit off the ground, slowly rotating (30°/s) and bobbing (sine wave). Each bloom has a point light matching its color, creating a warm glow on nearby surfaces.

### 6.2 Collection

When Petal gets within 1.5 units of a bloom:
1. The bloom flies toward Petal in an arc (0.3s ease-out)
2. On contact: a burst of 20-30 small particles in the bloom's color
3. A satisfying "ding" sound (pitched slightly higher for each subsequent bloom)
4. A brief haptic pulse on mobile/gamepad
5. The bloom appears on the pedestal in the meadow
6. UI counter updates: "7/12"

### 6.3 Placement Difficulty

Most blooms are in plain sight — the challenge is light exploration, not puzzle-solving. A few require minor platforming (jumping to a rock ledge) or looking behind a tree. None are truly hidden — if you walk around the island once, you'll see them all. The game respects the player's time.

---

## 7. Audio

### 7.1 Music

One ambient music track, ~3 minutes looping. Style: gentle acoustic guitar + soft pads + light chimes. Think the Animal Crossing "outside" music or the A Short Hike soundtrack. The music is always playing but quiet enough to not overwhelm.

When the final bloom is collected and the island "blooms," the music swells — a second layer fades in with strings and a melody, transforming the ambient track into something triumphant. This is the emotional payoff.

### 7.2 Sound Effects

| Event | Sound | Notes |
|---|---|---|
| Footsteps | Soft "pat pat" on grass, "tap tap" on stone | Varies by surface, 3-4 random variants per surface |
| Jump | Soft "whoosh" on takeoff | Short, light |
| Land | Gentle "thud" + subtle squish | Heavier for higher falls |
| Collect bloom | Musical "ding" + sparkle shimmer | Pitch rises with collection count |
| Bloom placed on pedestal | Resonant chime | Unique per bloom slot |
| Water | Gentle lapping loop | Spatial audio, louder near pond |
| Wind | Soft ambient breeze | Constant, very quiet |
| Final bloom / win | Music swell + cascade of chimes | The big moment |

### 7.3 Audio Implementation

- Music: `loadMusic()` + `playMusic()` + `updateMusic()` — streaming
- SFX: `loadSound()` + `playSound()` — fully loaded in memory
- Spatial: bloom glow sounds and water use 3D positioned audio
- Total audio assets: ~15-20 small files

---

## 8. UI

### 8.1 Philosophy: Almost No UI

The game is deliberately minimal on UI. No health bar, no minimap, no menus during gameplay. The world *is* the interface.

### 8.2 HUD Elements

| Element | Position | Description |
|---|---|---|
| Bloom counter | Top-right | "7 / 12" with a small bloom icon. Fades in when a bloom is collected, fades out after 3s |
| Mobile joystick | Bottom-left | Virtual joystick, only on touch devices, semi-transparent |
| Mobile jump button | Bottom-right | Circle button, only on touch devices, semi-transparent |

### 8.3 Screens

| Screen | Content |
|---|---|
| **Title** | "Bloom Garden" text over a blurred view of the island. "Tap to start" / "Press any key". No menu — just start. |
| **Gameplay** | The game. Minimal HUD as described above. |
| **Win** | Camera slowly orbits the now-blooming island. "Garden Restored" text fades in. "Powered by Bloom Engine" subtle text at bottom. Tap/click to restart. |

No settings screen in v1. No pause menu. Keep it pure.

---

## 9. Technical Showcase (What Bloom Engine Features Are Exercised)

This is the real point of the game. Every major engine feature gets used:

| Bloom Engine Feature | How Bloom Garden uses it |
|---|---|
| `initWindow()` | Window creation with title and icon |
| `beginMode3D()` / `endMode3D()` | All 3D rendering |
| `Camera3D` | Third-person follow camera with smooth interpolation |
| `loadModel()` / `drawModel()` | Island, trees, rocks, character, blooms (glTF) |
| `drawSphere()` / `drawCube()` | Particle effects, debug visualization |
| `isKeyPressed/Down()` | Desktop keyboard input |
| `getGamepadAxisValue()` | Gamepad support |
| `getTouchPosition()` | Mobile virtual joystick |
| `checkCollisionSpheres()` | Bloom collection radius |
| `checkCollisionBoxes()` | Ground/wall collision |
| `loadFont()` / `drawTextEx()` | Bloom counter, title screen text |
| `loadSound()` / `playSound()` | All sound effects |
| `loadMusic()` / `updateMusic()` | Background music + win swell |
| `getDeltaTime()` | Frame-independent movement and animation |
| `lerp()` / `easeInOut()` | Camera smoothing, collection animation |
| `Vec3()` / `vec3Add()` / `vec3Lerp()` | All 3D math |
| `randomFloat()` | Particle spread, animation variation |
| `clearBackground()` | Sky gradient (or solid sky color) |
| `drawGrid()` | Debug mode only |
| Perry asset bundling | All models, sounds, fonts embedded in binary |
| Perry cross-platform | Same code, native on all targets |
| Perry Publish | App Store / Steam packaging |

---

## 10. Asset List

### 10.1 3D Models (glTF, vertex-colored, no textures)

| Model | Est. polygons | Notes |
|---|---|---|
| Petal (character) | ~200 | Capsule body, dot eyes, stubby feet |
| Bloom flower (×5 color variants) | ~80 each | 5-petal flower, center sphere |
| Island terrain | ~2000 | One mesh, vertex-colored zones |
| Tree (×2 variants) | ~150 each | Cone/sphere canopy on cylinder trunk |
| Rock (×3 variants) | ~60 each | Smooth rounded boulders |
| Grass tuft (×2 variants) | ~20 each | Simple blade clusters |
| Lily pad | ~30 | Flat disc with notch |
| Pedestal | ~200 | Stone cylinder with 12 indentations |
| Stone arch | ~300 | Natural rock bridge |
| Butterfly (for win state) | ~30 | Two triangle wings |

**Total scene: ~5000-6000 polygons.** Trivial for any GPU made in the last 15 years.

### 10.2 Audio Files

| File | Format | Duration | Size est. |
|---|---|---|---|
| music_ambient.ogg | OGG | ~3:00 loop | ~1.5 MB |
| music_win_layer.ogg | OGG | ~1:00 | ~500 KB |
| sfx_footstep_grass_01-04.wav | WAV | ~0.1s each | ~20 KB each |
| sfx_footstep_stone_01-04.wav | WAV | ~0.1s each | ~20 KB each |
| sfx_jump.wav | WAV | ~0.2s | ~15 KB |
| sfx_land.wav | WAV | ~0.2s | ~20 KB |
| sfx_collect_01-12.wav | WAV | ~0.4s each | ~30 KB each |
| sfx_pedestal_chime.wav | WAV | ~1.0s | ~50 KB |
| sfx_win_cascade.wav | WAV | ~3.0s | ~150 KB |
| sfx_water_loop.ogg | OGG | ~5.0s loop | ~100 KB |
| sfx_wind_loop.ogg | OGG | ~8.0s loop | ~150 KB |

**Total audio: ~3 MB**

### 10.3 Fonts

| File | Notes |
|---|---|
| bloom_ui.ttf | One rounded, friendly font (e.g., Nunito or Quicksand, both OFL licensed) |

### 10.4 Total Bundle Size

Models (~100 KB) + Audio (~3 MB) + Font (~200 KB) = **~3.5 MB of assets**. With the native binary, total app size should be **under 10 MB**. That's tiny. That's the pitch.

---

## 11. Code Architecture

The entire game is ~800 lines of TypeScript split across a few files:

```
bloom-garden/
  perry.toml
  src/
    main.ts          # Entry point, game loop, screen management (~100 lines)
    player.ts        # Petal movement, jump, procedural animation (~150 lines)
    camera.ts        # Third-person follow camera (~80 lines)
    world.ts         # Island loading, zone setup, collision (~100 lines)
    blooms.ts        # Bloom spawning, collection, particles (~120 lines)
    pedestal.ts      # Pedestal state, win condition (~60 lines)
    audio.ts         # Music + SFX manager (~80 lines)
    ui.ts            # HUD, title screen, win screen (~80 lines)
    input.ts         # Unified input (keyboard/mouse/touch/gamepad) (~80 lines)
  assets/
    models/          # All glTF files
    sounds/          # All audio files
    fonts/           # UI font
```

### 11.1 Game Loop (main.ts sketch)

```typescript
import { initWindow, closeWindow, windowShouldClose,
         beginDrawing, endDrawing, clearBackground,
         beginMode3D, endMode3D, setTargetFPS,
         getDeltaTime, Color } from "bloomengine";
import { initWorld, drawWorld } from "./world";
import { initPlayer, updatePlayer, drawPlayer } from "./player";
import { initCamera, updateCamera, getCamera } from "./camera";
import { initBlooms, updateBlooms, drawBlooms, allCollected } from "./blooms";
import { initPedestal, drawPedestal } from "./pedestal";
import { initAudio, updateAudio } from "./audio";
import { drawHUD, drawTitleScreen, drawWinScreen } from "./ui";

initWindow(800, 600, "Bloom Garden");
setTargetFPS(60);

initWorld();
initPlayer();
initCamera();
initBlooms();
initPedestal();
initAudio();

type Screen = "title" | "game" | "win";
let screen: Screen = "title";

while (!windowShouldClose()) {
  const dt = getDeltaTime();

  if (screen === "title") {
    if (anyInputPressed()) screen = "game";
  } else if (screen === "game") {
    updatePlayer(dt);
    updateCamera(dt);
    updateBlooms(dt);
    updateAudio(dt);
    if (allCollected()) screen = "win";
  }

  beginDrawing();
  clearBackground(Color.SkyBlue);

  if (screen === "title") {
    drawTitleScreen();
  } else if (screen === "game") {
    beginMode3D(getCamera());
      drawWorld();
      drawBlooms();
      drawPedestal();
      drawPlayer();
    endMode3D();
    drawHUD();
  } else {
    beginMode3D(getCamera());
      drawWorld();
      drawBlooms();
      drawPedestal();
    endMode3D();
    drawWinScreen();
  }

  endDrawing();
}

closeWindow();
```

That's the entire game loop. Readable, obvious, no magic.

---

## 12. Development Phases

| Phase | What | Effort | Result |
|---|---|---|---|
| **Phase 1: Grey box** | Flat ground plane, capsule character, WASD movement, third-person camera, jump with gravity | 1-2 days | Playable movement prototype |
| **Phase 2: Island** | Load island glTF, ground collision, edge-of-world teleport, camera collision | 2-3 days | Walk around the actual island |
| **Phase 3: Blooms** | Spawn 12 blooms, collection trigger, fly-to-player animation, particle burst, counter | 2-3 days | Core gameplay loop complete |
| **Phase 4: Pedestal** | Pedestal model, bloom placement visualization, win state trigger | 1 day | Game has beginning, middle, end |
| **Phase 5: Audio** | Music streaming, footstep SFX, collect SFX, spatial water, win music swell | 2 days | Game feels alive |
| **Phase 6: Polish** | Procedural character animation, bloom glow lights, camera refinement, title/win screens | 2-3 days | Game feels polished |
| **Phase 7: Mobile** | Virtual joystick, touch jump button, touch camera, screen scaling | 2 days | Runs on iOS/Android |
| **Phase 8: Ship** | App icons, screenshots, App Store metadata, Perry Publish packaging | 1-2 days | Published |

**Total: ~2-3 weeks of focused work** (after the Bloom Engine itself supports the required features).

---

## 13. App Store Strategy

### 13.1 Listing

- **Name:** Bloom Garden
- **Subtitle:** "A tiny garden adventure"
- **Category:** Games → Adventure (or Casual)
- **Price:** Free (no IAP, no ads — it's a showcase, not a revenue play)
- **Age rating:** 4+ / Everyone
- **Size:** < 10 MB

### 13.2 Screenshots (5 required for App Store)

1. Petal standing in the meadow, bloom counter visible, warm golden light
2. Collecting a bloom — particle burst, glow, mid-spin
3. The grove — looking up through low-poly trees
4. The rocks — vista shot looking down at the whole island
5. Win state — island in full bloom, butterflies, "Garden Restored"

### 13.3 Description

> Explore a tiny floating island. Collect glowing blooms. Watch the garden come alive.
>
> Bloom Garden is a peaceful 3D collectathon — no enemies, no timers, no fail states. Just you, a beautiful island, and 12 flowers waiting to be found.
>
> Built with the Bloom Engine, powered by Perry.

### 13.4 The "Built With" Signal

The App Store listing, loading screen, and win screen all subtly credit "Built with Bloom Engine · Powered by Perry" — not obnoxiously, but clearly enough that any developer who plays it will see it and think "wait, this is TypeScript?"

That moment of surprise is the entire marketing strategy.

---

## 14. What Success Looks Like

Bloom Garden is successful if:

1. **It passes App Store review** on first submission (proves Perry produces real native apps)
2. **It runs at locked 60fps** on an iPhone 12 and a mid-range Android (proves performance)
3. **The source code is readable** — any TypeScript developer can open it, understand it, and modify it in under an hour (proves engine simplicity)
4. **It fits in ~800 lines** (proves you don't need Unity for a polished game)
5. **At least one developer forks it** to make their own game (proves ecosystem potential)
6. **The total binary is under 10 MB** (proves Perry's output is lean)
7. **Someone tweets "this was written in TypeScript?!"** (proves the pitch works)

---

## 15. Open Questions

- **Character design:** Should Petal have arms? A hat? A trail? Keep it minimal but recognizable enough for an app icon.
- **Haptics:** iOS Taptic Engine feedback on collect? Would add premium feel.
- **Accessibility:** Should there be a "no-jump" mode where all blooms are reachable on foot? (Yes, probably.)
- **Replay value:** After winning, should blooms respawn for a second playthrough? Or is one-and-done fine for a showcase?
- **Leaderboard / timer:** Some people might want a speedrun mode. Add a hidden timer that shows on the win screen?
- **Music licensing:** Commission original music or use CC-licensed ambient tracks? Original is better for brand but costs money.
- **Bloom count:** Is 12 the right number? Too few feels empty, too many feels like a chore. 12 = "one dozen blooms in a garden" feels right.
