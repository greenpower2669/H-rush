import test from 'node:test';
import assert from 'node:assert/strict';
import { SPACE_FORTRESS_CUES, createSoundEngine } from '../src/sound.js';

test('SpaceFortress original WAV mapping is explicit and restricted to three files', () => {
  assert.deepEqual(new Set(Object.values(SPACE_FORTRESS_CUES)), new Set(['kinetic_charge.wav','kinetic_ready.wav','kinetic_release.wav']));
  assert.equal(SPACE_FORTRESS_CUES.explosion, 'kinetic_release.wav');
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
