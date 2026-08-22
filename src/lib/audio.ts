import { Howl } from 'howler';

let flipSound: Howl | null = null;
let winSound: Howl | null = null;
let unlockSound: Howl | null = null;

function initSounds() {
  if (typeof window === 'undefined') return;

  if (!flipSound) {
    flipSound = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'],
      volume: 0.4,
    });
  }

  if (!winSound) {
    winSound = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'],
      volume: 0.6,
    });
  }

  if (!unlockSound) {
    unlockSound = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'],
      volume: 0.5,
    });
  }
}

export function playFlipSound(soundEnabled: boolean = true) {
  if (!soundEnabled) return;
  initSounds();
  flipSound?.play();
}

export function playWinSound(soundEnabled: boolean = true) {
  if (!soundEnabled) return;
  initSounds();
  winSound?.play();
}

export function playUnlockSound(soundEnabled: boolean = true) {
  if (!soundEnabled) return;
  initSounds();
  unlockSound?.play();
}
