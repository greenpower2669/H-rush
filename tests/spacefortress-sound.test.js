import test from 'node:test';
import assert from 'node:assert/strict';
import { SPACE_FORTRESS_CUES, createSoundEngine } from '../src/sound.js';

test('charge WAV is disabled; only the two appropriate SpaceFortress cues remain', () => {
  assert.deepEqual(new Set(Object.values(SPACE_FORTRESS_CUES)), new Set(['kinetic_ready.wav','kinetic_release.wav']));
  assert.equal(SPACE_FORTRESS_CUES.explosion, 'kinetic_release.wav');
  assert.equal(SPACE_FORTRESS_CUES.missile, undefined);
  assert.equal(SPACE_FORTRESS_CUES.boss, undefined);
});

test('sound engine remains safe and configurable without browser APIs', () => {
  const sound = createSoundEngine();
  assert.equal(sound.enabled, true);
  sound.play('explosion'); // no window, no Audio: must not throw
  sound.setVolume(0.45);
  assert.equal(sound.volume, 0.45);
  sound.setEnabled(false);
  assert.equal(sound.enabled, false);
  sound.play('missile');
});
