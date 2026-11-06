/**
 * Ash Rush SFX — synthesized fallback with selected SpaceFortressVs originals.
 * Two original PCM WAV cues are copied from SpaceFortressVs with attribution.
 * If external audio cannot load (e.g. standalone HTML opened alone), synth still works offline.
 */
export const SPACE_FORTRESS_CUES = Object.freeze({
  // The kinetic_charge cue is intentionally silent: it sounded like an unrelated charging sequence.
  // Both missile and boss use short synthesized effects instead.
  pickup: 'kinetic_ready.wav',
  shield: 'kinetic_ready.wav',
  explosion: 'kinetic_release.wav',
});
const SPACE_FORTRESS_AUDIO_DIR = 'assets/audio/spacefortress/';

export function createSoundEngine() {
  let context = null, master = null, enabled = true, volume = 0.28, samplesInitialized = false;
  const previous = new Map(), pools = new Map();
  const intervals = { laser: 80, impact: 55, missile: 160, explosion: 130, pickup: 80, shield: 120, damage: 180, boss: 600, graze: 150 };

  function initializeSamples() {
    if (samplesInitialized || typeof Audio === 'undefined') return;
    samplesInitialized = true;
    for (const filename of new Set(Object.values(SPACE_FORTRESS_CUES))) {
      const tracks = Array.from({ length: 3 }, () => {
        const audio = new Audio(SPACE_FORTRESS_AUDIO_DIR + filename);
        audio.preload = 'auto';
        try { audio.load(); } catch { /* loading failure leaves synthesized fallback */ }
        return audio;
      });
      pools.set(filename, { tracks, next: 0 });
    }
  }

  function unlock() {
    if (!enabled || typeof window === 'undefined') return;
    initializeSamples();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      if (!context) {
        context = new Ctx();
        master = context.createGain();
        master.gain.value = volume;
        master.connect(context.destination);
      }
      if (context.state === 'suspended') void context.resume().catch(() => {});
    } catch { /* Browsers may deny audio; gameplay continues. */ }
  }

  function voice(type, from, to, seconds, gain, delay = 0) {
    if (!context || !master || context.state !== 'running') return;
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, from), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), start + seconds);
    amp.gain.setValueAtTime(Math.max(0.0001, gain), start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(amp); amp.connect(master);
    osc.start(start); osc.stop(start + seconds + 0.01);
    osc.onended = () => { osc.disconnect(); amp.disconnect(); };
  }

  function playSample(name) {
    const filename = SPACE_FORTRESS_CUES[name];
    const pool = pools.get(filename);
    if (!pool) return false;
    // A missing or invalid WAV must never suppress the fallback oscillator sound.
    for (let trial = 0; trial < pool.tracks.length; trial++) {
      const idx = (pool.next + trial) % pool.tracks.length;
      const audio = pool.tracks[idx];
      if (audio.error || audio.readyState < 2) continue;
      pool.next = (idx + 1) % pool.tracks.length;
      try {
        audio.pause(); audio.currentTime = 0;
        audio.volume = Math.min(1, volume * 1.7);
        const promise = audio.play();
        if (promise?.catch) void promise.catch(() => {});
        return true;
      } catch { /* use synth fallback below */ }
    }
    return false;
  }

  function play(name) {
    if (!enabled) return;
    unlock();
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const last = previous.get(name) ?? -Infinity;
    if (now - last < (intervals[name] ?? 100)) return;
    previous.set(name, now);
    if (playSample(name)) return;
    if (!context || context.state !== 'running') return;
    switch (name) {
      case 'laser': voice('sawtooth', 940, 250, 0.105, 0.09); break;
      case 'missile': voice('triangle', 280, 92, 0.17, 0.16); voice('sine', 140, 68, 0.13, 0.08); break;
      case 'impact': voice('triangle', 740, 115, 0.11, 0.15); voice('square', 210, 90, 0.065, 0.03); break;
      case 'explosion': voice('sawtooth', 135, 32, 0.45, 0.22); voice('triangle', 78, 35, 0.38, 0.21); break;
      case 'pickup': [630, 840, 1110].forEach((hz, i) => voice('sine', hz, hz * 1.1, 0.16, 0.12, i * 0.075)); break;
      case 'shield': voice('sine', 410, 1120, 0.23, 0.12); voice('triangle', 760, 480, 0.22, 0.06); break;
      case 'damage': voice('square', 250, 85, 0.23, 0.16); break;
      case 'boss': voice('triangle', 360, 220, 0.12, 0.11); break;
      case 'graze': voice('sine', 980, 490, 0.12, 0.025); break;
    }
  }

  return {
    unlock, play,
    get enabled() { return enabled; },
    get volume() { return volume; },
    setEnabled(value) {
      enabled = !!value;
      if (enabled) unlock();
      if (master) master.gain.value = enabled ? volume : 0;
      if (!enabled) for (const pool of pools.values()) for (const audio of pool.tracks) audio.pause();
    },
    setVolume(value) {
      volume = Math.min(0.7, Math.max(0, Number(value) || 0));
      if (master) master.gain.value = enabled ? volume : 0;
      for (const pool of pools.values()) for (const audio of pool.tracks) audio.volume = Math.min(1, volume * 1.7);
    },
  };
}
