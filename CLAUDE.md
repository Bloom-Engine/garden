# CLAUDE.md

This file provides guidance to Claude Code when working with the Bloom Garden codebase.

## Project Overview

Bloom Garden is a 3D collectathon game built with the Bloom Engine, compiled to native executables by the Perry TypeScript compiler. The player explores an island collecting 12 magical blooms to restore a garden pedestal.

**Tech stack:** TypeScript (Perry-compiled) + Bloom Engine (Rust native layer with wgpu/Metal rendering)

## Repository Structure

```
garden/                    # This repo — the game
  src/main.ts              # Game loop, all game logic (single-file)
  src/input.ts             # Input module (not currently used by main.ts)
  src/ui.ts                # UI module (not currently used by main.ts)
  assets/models/           # 3D models (Kenney CC0 .glb files)
  perry.toml               # Perry build config
  CLAUDE.md                # This file

../engine/                 # Bloom Engine (separate repo: Bloom-Engine/engine)
  src/                     # TypeScript API surface
  native/shared/           # Cross-platform Rust: renderer, audio, models
  native/macos/            # macOS native layer (AppKit + Metal)
  native/ios/              # iOS native layer (UIKit + Metal)
  native/windows/          # Windows native layer
  native/linux/            # Linux native layer
  native/android/          # Android native layer

../../perry/               # Perry compiler (separate repo: PerryTS/perry)
  crates/perry/            # CLI + compiler
  crates/perry-codegen/    # Cranelift code generation
  crates/perry-runtime/    # Runtime library (GC, objects, iOS game loop)
```

## Build Commands

### macOS (desktop)
```bash
perry compile src/main.ts -o main && ./main
```

### iOS Simulator
```bash
perry compile --target ios-simulator --features ios-game-loop src/main.ts -o bloom_garden
/usr/libexec/PlistBuddy -c "Delete :UIApplicationSceneManifest" bloom_garden.app/Info.plist
xcrun simctl install booted bloom_garden.app
xcrun simctl launch booted com.bloomengine.garden
```

### iOS Device
```bash
perry compile --target ios --features ios-game-loop src/main.ts -o BloomGarden
/usr/libexec/PlistBuddy -c "Delete :UIApplicationSceneManifest" BloomGarden.app/Info.plist
# Sign with development profile (see iOS Port section below)
codesign --force --sign "Apple Development: ..." --entitlements ent.plist BloomGarden.app
xcrun devicectl device install app --device <UDID> BloomGarden.app
xcrun devicectl device process launch --device <UDID> com.bloomengine.garden
```

### Android
```bash
# Quick build + install + run:
./build-android.sh --run

# Or manual steps:
NDK_BIN=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/darwin-x86_64/bin \
ANDROID_NDK_HOME=~/Library/Android/sdk/ndk/28.0.12433566 \
CC_aarch64_linux_android=$NDK_BIN/aarch64-linux-android24-clang \
CXX_aarch64_linux_android=$NDK_BIN/aarch64-linux-android24-clang++ \
perry compile --target android src/main.ts -o bloom_garden
cp bloom_garden android/app/src/main/jniLibs/arm64-v8a/libbloom_garden.so
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.bloomengine.garden/.BloomActivity
```

### Rebuilding Perry runtime for iOS targets
```bash
cd /path/to/perry
cargo build --release -p perry-runtime --target aarch64-apple-ios-sim  # Simulator
cargo build --release -p perry-runtime --target aarch64-apple-ios      # Device
# Symlink into garden project:
mkdir -p target/aarch64-apple-ios-sim/release
ln -sf /path/to/perry/target/aarch64-apple-ios-sim/release/libperry_runtime.a \
       target/aarch64-apple-ios-sim/release/libperry_runtime.a
```

### Rebuilding Perry runtime for Android
```bash
cd /path/to/perry
cargo build --release -p perry-runtime --target aarch64-linux-android
# Symlink into garden project:
mkdir -p target/aarch64-linux-android/release
ln -sf /path/to/perry/target/aarch64-linux-android/release/libperry_runtime.a \
       target/aarch64-linux-android/release/libperry_runtime.a
```

## Perry Compiler Pitfalls

Perry compiles TypeScript to native machine code via Cranelift. Several runtime behaviors differ from standard TypeScript/JavaScript:

- **`Math.max`, `Math.min`, `Math.pow` return boxed objects** — use inline helpers: `if (a > b) return a; return b;`
- **Integer literal `0` infers i32** — always use `0.0` for float arithmetic
- **Module-level `let` mutation may not propagate** — use array-based state: `const P = [0.0, 0.0, ...]`
- **`for (const x of array)` may not work** — use index-based: `for (let i = 0.0; i < arr.length; i = i + 1.0)`
- **`createMesh()` crashes** — pointer marshaling fails, use primitive shapes instead
- **`disableCursor()` breaks keyboard on macOS** — use raw mouse delta without cursor lock
- **`export const alias = fn` causes duplicate symbols** — use wrapper functions
- **String `===` in switch/case may fail** — use numeric constants with if/else

## iOS Port Architecture

### The UIApplicationMain Problem

iOS requires `UIApplicationMain()` on the main thread — it blocks forever running the UIKit event loop. But Bloom's game loop (`while !windowShouldClose()`) also runs on the main thread and expects `initWindow()` to return.

**Solution:** Perry's `--features ios-game-loop` (opt-in):

1. **Perry codegen** (`perry-codegen/src/module_init.rs`): When `compile_target == 1 (iOS)` AND `ios-game-loop` feature is enabled, generates `_perry_user_main` instead of `main`
2. **Perry runtime** (`perry-runtime/src/ios_game_loop.rs`): Provides the actual `main()`:
   - Spawns game thread running `_perry_user_main`
   - Calls `UIApplicationMain` on the main thread
   - App delegate's `didFinishLaunching` calls `perry_scene_will_connect(NULL)` — the native library creates the window here
3. **Bloom iOS native** (`engine/native/ios/src/lib.rs`):
   - `perry_register_native_classes()` — registers BloomMetalView before UIApplicationMain starts
   - `perry_scene_will_connect()` — creates UIWindow, BloomMetalView (CAMetalLayer), wgpu surface, and engine. All on main thread (UIKit-safe)
   - `bloom_init_window()` — runs on game thread, waits for ENGINE to be initialized by the scene delegate

### Why UIApplicationSceneManifest must be removed

Perry's linker generates an Info.plist with `UIApplicationSceneManifest` referencing `PerrySceneDelegate`. For game-loop apps, we bypass the scene lifecycle entirely — the window is created directly in `didFinishLaunching` via `perry_scene_will_connect(NULL)` with `initWithFrame:` (no scene attachment). The manifest must be stripped post-build.

### Touch Coordinate Scaling

UIKit touch events (`locationInView:`) return coordinates in **points**. The Bloom renderer's `getScreenWidth()`/`getScreenHeight()` return **pixels** (points x scale). The iOS native layer multiplies touch coordinates by `SCREEN_SCALE` so they match the renderer's coordinate space. Without this, touch controls only work in one direction.

### Asset Path Resolution

On iOS, relative paths like `assets/models/tree.glb` don't resolve because the working directory isn't the app bundle. The iOS native layer's `resolve_path()` prepends `NSBundle.mainBundle.resourcePath` for all relative asset paths. This affects `loadModel`, `loadTexture`, `loadFont`, `loadSound`, `loadMusic`, `readFile`, and `fileExists`.

### Key iOS Native FFI Functions

These were missing from the iOS lib and had to be added to match the macOS implementation:
- `bloom_set_ambient_light` / `bloom_set_directional_light` — lighting
- `bloom_set_joint_test` — skeletal animation debug (no-op stub)
- `draw_model_mesh_tinted` updated with `texture_idx` parameter

### Code Signing for Device

Development profile (wildcard `K6UW5YV9F7.*`) from Xcode, signed with `Apple Development` identity. Entitlements need `application-identifier`, `com.apple.developer.team-identifier`, `get-task-allow: true`, and `keychain-access-groups`.

## Android Port Architecture

- **Rendering**: SurfaceView + Vulkan via wgpu
- **JNI bridge**: `BloomGameBridge.kt` calls bloom-android JNI functions (`JNI_OnLoad`, `nativeSetSurface`, `nativeMain`, `nativeOnTouch`, `nativeOnDestroy`)
- **Asset path**: `BLOOM_ASSET_PATH` env var set before `loadLibrary`; assets extracted from APK to `filesDir`
- **Touch events**: `BloomActivity.onTouchEvent` -> `BloomGameBridge.nativeOnTouch` -> `bloom_android_on_touch`
- **Game thread**: Spawned from `surfaceCreated` callback, runs the compiled `main()`
- **MTE disabled**: In `JNI_OnLoad` for Perry NaN-boxing compatibility
- **Perry output**: Compiles to `.so` (shared library), placed in `jniLibs/arm64-v8a/`
- **No `android-game-loop` feature needed** (unlike iOS) — the Activity spawns the game thread directly

## Game Architecture

All game state lives in `const` arrays (Perry-safe pattern):
- `ST[7]` — game state, camera yaw sin/cos, win timer, pitch, collect flash, move speed
- `P[8]` — player position, velocity, grounded, walk time, facing sin/cos
- `V[2]` — velocity x/z
- `BD[12]` — bloom collected flags
- `BX[12]`, `BZ[12]`, `BI[12]` — bloom positions and color indices
- `TCH[4]` — touch camera state (lastX, lastY, active, showControls)

### Touch Controls (Mobile Only)

Enabled when `isMobile()` returns true (iOS or Android):
- **Left 40% of screen**: Virtual joystick — drag to move
- **Right 60%**: Camera drag — drag to rotate view
- **Visual overlay**: Semi-transparent joystick ring + knob position indicator
- Togglable via `TCH[3]` (1.0 = show, 0.0 = hide)

## Debugging Tips

- **iOS black screen**: Usually means UIApplicationMain lifecycle issue or `get_current_texture()` failing silently. Check crash reports in `~/Library/Logs/DiagnosticReports/`
- **iOS crash in `drawModel`**: Model assets failed to load (relative path issue). Check `resolve_path()` and that assets are in the .app bundle
- **Perry crash with `js_dynamic_object_get_property`**: NaN-boxed pointer issue, often from a function returning 0.0 (failed load) being used as an object handle
- **Simulator screenshot**: `xcrun simctl io booted screenshot /tmp/screenshot.png`
- **Device logs**: `xcrun devicectl device process launch --console --device <UDID> com.bloomengine.garden`
