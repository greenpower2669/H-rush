/** Ash Rush SFX — original, synthesized at runtime: no external audio, offline and license-safe. */
export function createSoundEngine() {
  let context = null, master = null, enabled = true, volume = 0.28;
  const previous = new Map();
  const intervals = { laser: 80, impact: 55, missile: 160, explosion: 130, pickup: 80, shield: 120, damage: 180, boss: 600, graze: 150 };
  function unlock() {
    if (!enabled) return;
    if(typeof window==='undefined') return;
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
  function play(name) {
    if (!enabled) return;
    unlock();
    if (!context || context.state !== 'running') return;
    const now = performance.now(), last = previous.get(name) ?? -Infinity;
    if (now - last < (intervals[name] ?? 100)) return;
    previous.set(name, now);
    switch (name) {
      case 'laser': voice('sawtooth', 940, 250, 0.105, 0.09); break;
      case 'missile': voice('sawtooth', 210, 60, 0.34, 0.22); voice('triangle', 680, 180, 0.27, 0.08); break;
      case 'impact': voice('triangle', 740, 115, 0.11, 0.15); voice('square', 210, 90, 0.065, 0.03); break;
      case 'explosion': voice('sawtooth', 135, 32, 0.45, 0.22); voice('triangle', 78, 35, 0.38, 0.21); break;
      case 'pickup': [630, 840, 1110].forEach((hz, i) => voice('sine', hz, hz * 1.1, 0.16, 0.12, i * 0.075)); break;
      case 'shield': voice('sine', 410, 1120, 0.23, 0.12); voice('triangle', 760, 480, 0.22, 0.06); break;
      case 'damage': voice('square', 250, 85, 0.23, 0.16); break;
      case 'boss': [120, 150, 110].forEach((hz, i) => voice('sawtooth', hz, hz * .7, 0.25, 0.11, i * 0.22)); break;
      case 'graze': voice('sine', 980, 490, 0.12, 0.025); break;
    }
  }
  return {
    unlock, play,
    get enabled() { return enabled; },
    get volume() { return volume; },
    setEnabled(value) { enabled = !!value; if (enabled) unlock(); if (master) master.gain.value = enabled ? volume : 0; },
    setVolume(value) { volume = Math.min(0.7, Math.max(0, Number(value) || 0)); if (master) master.gain.value = enabled ? volume : 0; },
  };
}
