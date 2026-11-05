import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ART_FRAMES} from '../src/art.js';
const png=readFileSync(new URL('../assets/sprites/atlas.png',import.meta.url));
test('real transparent sprite atlas contains all animation families and fits every frame',()=>{
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  const w=png.readUInt32BE(16),h=png.readUInt32BE(20);
  assert.equal(w,1024);assert.equal(h,1120);
  for (const family of ['player','scout','manta','boss','asteroid','missile','fx','shield']) {
    assert.ok(ART_FRAMES[family]?.length>0,family+' not available');
    for(const [x,y,cw,ch] of ART_FRAMES[family]) {
      assert.ok(x>=0&&y>=0&&cw>0&&ch>0&&x+cw<=w&&y+ch<=h, family+' invalid crop');
    }
  }
  assert.ok(ART_FRAMES.player.length>=4);
  assert.ok(ART_FRAMES.asteroid.length>=5);
});
test('standalone APK HTML embeds the real atlas, not a URL needing Internet',()=>{
  const html=readFileSync(new URL('../ash-rush-standalone.html',import.meta.url),'utf8');
  const m=html.match(/window\.__ASH_RUSH_ATLAS__='data:image\/png;base64,([^']+)'/);
  assert.ok(m && m[1].length>200000,'PNG atlas is missing from offline app');
  assert.deepEqual(Buffer.from(m[1],'base64'),png);
});
