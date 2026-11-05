/** Djipie CC0 soundtrack, checked against the original author's releases at APK build time. */
export const MUSIC_TRACKS = Object.freeze({
  space:'space_echo.ogg',
  action:'action_a.mp3',
  battle:'battle.mp3',
  cave:'horror.mp3',
});
export const MUSIC_DIR = 'assets/music/djipie/';
export function sceneMusic(phase, boss = false, danger = false) {
  if (boss) return 'battle';
  if (danger && phase !== 'interior') return 'battle';
  if (phase === 'interior') return 'cave';
  if (phase === 'surface' || phase === 'atmosphere') return 'action';
  return 'space';
}
/** Two HTMLAudioElements: old scene fades out while the next fades in. Never streams at runtime. */
export function createMusicEngine(AudioCtor = (typeof Audio !== 'undefined' ? Audio : null)) {
  let unlocked = false, enabled = true, paused = false, volume = .28;
  let current = null, next = null, requested = 'space';
  const fadeSeconds = 1.15;
  const active = () => enabled && !paused && unlocked;
  function prepare(name) {
    if (!AudioCtor || !Object.hasOwn(MUSIC_TRACKS, name)) return null;
    const audio = new AudioCtor(MUSIC_DIR + MUSIC_TRACKS[name]);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    return {name, audio, gain:0};
  }
  function start(track) {
    if (!track || !active()) return;
    try {
      const promise = track.audio.play();
      if (promise?.catch) void promise.catch(() => {}); // Mobile gesture policy / unsupported codec.
    } catch { /* Silence instead of stopping gameplay. */ }
  }
  function stop(track) { if (!track) return;try{track.audio.pause();track.audio.currentTime=0;}catch{} }
  function scene(name) {
    if (!Object.hasOwn(MUSIC_TRACKS,name)) return;
    requested=name;
    if (!unlocked || !enabled) return;
    if (current?.name===name) { if (next && next.name!==name) {stop(next);next=null;} return; }
    if (next?.name===name) return;
    if (next) { stop(next);next=null; }
    next=prepare(name);start(next);
    if (!current) {current=next;next=null;}
  }
  function unlock() {if (!enabled) return;unlocked=true;scene(requested);start(current);start(next);}
  function tick(dt) {
    if (!active()) return;
    const step = Math.min(Math.max(dt,0),.1)/fadeSeconds;
    if (next) {
      next.gain=Math.min(1,next.gain+step);
      if (current) current.gain=Math.max(0,current.gain-step);
      if (!current || current.gain===0) {stop(current);current=next;next=null;}
    } else if (current) current.gain=Math.min(1,current.gain+step);
    if (current) current.audio.volume = Math.min(1,volume*.65*current.gain);
    if (next) next.audio.volume = Math.min(1,volume*.65*next.gain);
  }
  function setEnabled(value) {
    enabled=!!value;
    if (!enabled) { stop(current);stop(next);current=null;next=null;unlocked=false; }
    // Next gesture is required to restart music on mobile after re-enabling.
  }
  function setPaused(value) {
    const wasPaused=paused;paused=!!value;
    if (wasPaused===paused) return;
    if (paused) {current?.audio.pause();next?.audio.pause();}
    else if (wasPaused && active()) {start(current);start(next);}
  }
  function setVolume(value) {volume=Math.max(0,Math.min(.7,Number(value)||0));}
  return {scene, unlock, tick, setEnabled, setPaused, setVolume,
    get requested(){return requested;},get enabled(){return enabled;}};
}
