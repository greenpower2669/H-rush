import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneMusic, MUSIC_TRACKS, createMusicEngine } from '../src/music.js';

test('music from Djipie CC0: deterministic contexts',()=>{
  assert.deepEqual(Object.keys(MUSIC_TRACKS), ['space','action','battle','cave']);
  assert.equal(sceneMusic('space'), 'space');
  assert.equal(sceneMusic('atmosphere'), 'action');
  assert.equal(sceneMusic('surface'), 'action');
  assert.equal(sceneMusic('interior'), 'cave');
  assert.equal(sceneMusic('exit'), 'space');
  assert.equal(sceneMusic('interior', true), 'battle');
  assert.equal(sceneMusic('space', false, true), 'battle');
});

test('music engine is quiet until user gesture, handles scene fades and mute',()=>{
  const created=[];
  class FakeAudio {
    constructor(src){ this.src=src;this.volume=0;this.paused=true;this.calls=0;created.push(this);}
    play(){this.paused=false;this.calls++;return Promise.resolve();}
    pause(){this.paused=true;}
  }
  const music=createMusicEngine(FakeAudio);
  music.scene('space');
  assert.equal(created.length,0);
  music.unlock();music.tick(1);
  assert.equal(created.length,1);
  assert.ok(created[0].volume>0);
  music.scene('cave');
  assert.equal(created.length,2);
  for(let i=0;i<25;i++)music.tick(.07);
  assert.equal(created[0].paused,true);
  assert.equal(created[1].paused,false);
  music.setPaused(true);assert.equal(created[1].paused,true);
  music.setPaused(false);assert.equal(created[1].paused,false);
  music.setEnabled(false);assert.equal(created[1].paused,true);
});
