import {
  initAudio, closeAudio,
  loadSound, playSound, setSoundVolume,
  loadMusic, playMusic, stopMusic, updateMusicStream, setMusicVolume, isMusicPlaying,
  Sound, Music,
} from 'bloom';
import { Zone } from './world';

let musicHandle: Music | null = null;
let footstepTimer = 0;
let audioInitialized = false;

// Sound handles (will be loaded if files exist)
let sndCollect: Sound | null = null;
let sndJump: Sound | null = null;
let sndLand: Sound | null = null;

export function initGameAudio(): void {
  initAudio();
  audioInitialized = true;

  // Try loading sounds (graceful if files don't exist yet)
  try { sndJump = loadSound('assets/sounds/jump.wav'); } catch (e) {}
  try { sndLand = loadSound('assets/sounds/land.wav'); } catch (e) {}
  try { sndCollect = loadSound('assets/sounds/collect.wav'); } catch (e) {}
  try {
    musicHandle = loadMusic('assets/sounds/ambient.ogg');
    if (musicHandle) {
      setMusicVolume(musicHandle, 0.5);
      playMusic(musicHandle);
    }
  } catch (e) {}
}

export function updateGameAudio(dt: number, moving: boolean, grounded: boolean, zone: Zone): void {
  if (!audioInitialized) return;

  // Update music stream
  if (musicHandle) {
    updateMusicStream(musicHandle);
  }
}

export function playCollectSound(index: number): void {
  if (sndCollect) playSound(sndCollect);
}

export function playJumpSound(): void {
  if (sndJump) playSound(sndJump);
}

export function playLandSound(): void {
  if (sndLand) playSound(sndLand);
}

export function triggerWinAudio(): void {
  // Win audio would play a fanfare if available
}

export function cleanupAudio(): void {
  if (audioInitialized) {
    if (musicHandle) stopMusic(musicHandle);
    closeAudio();
    audioInitialized = false;
  }
}
