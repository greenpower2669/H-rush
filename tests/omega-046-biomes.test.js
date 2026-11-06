import test from 'node:test';
import assert from 'node:assert/strict';
import {biomeFor,BIOME_PALETTES,BIOME_TYPES,debrisGravity} from '../src/biomes.js';
import {terrainBounds,gateSpec,craterRadius,gateY,LASER_GATE_RADIUS} from '../src/omega-terrain.js';
import {REGION_SIZE,regionIdentity} from '../src/universe.js';
import {readFileSync} from 'node:fs';
const seed='0123456789abcdef0123456789abcdef';
const source=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('40 seeded world families are grouped into 12 materially different visible biomes',()=>{
  assert.equal(BIOME_TYPES.length,40);
  assert.equal(Object.keys(BIOME_PALETTES).length,12);
  assert.equal(new Set(BIOME_TYPES).size,12);
  const found=new Set();
  for(let region=0;region<160;region++){
    const a=biomeFor(seed,region),b=biomeFor(seed,region);
    assert.deepEqual(a,b,'region generation deterministic');
    assert.equal(a.family,regionIdentity(seed,region).family);
    found.add(a.kind);
  }
  assert.equal(found.size,12);
  assert.notDeepEqual(biomeFor(seed,0),biomeFor('ffffffffffffffffffffffffffffffff',0));
  const visuals=source('src/omega-visuals.js');
  assert.match(visuals,/paintBiomeMotifs/);
  for(const motif of ['crystal','machine','organic','volcanic','ocean','ice','storm'])
    assert.ok(visuals.includes(motif));
});

test('free space has strictly zero gravity, planet debris has positive downward acceleration',()=>{
  const biome=biomeFor(seed,0);
  assert.equal(debrisGravity('space',biome),0);
  assert.equal(debrisGravity('exit',biome),0);
  assert.ok(debrisGravity('atmosphere',biome)>0);
  assert.ok(debrisGravity('surface',biome)>debrisGravity('atmosphere',biome));
  const game=source('src/game.js');
  assert.match(game,/debrisGravity\(stage\.phase/);
  assert.ok(!/player\.vy\s*\+=\s*gravity/.test(game),'do not apply gravity to controls');
});

test('moving bars withstand repeated standard shots; geological ground is tougher',()=>{
  assert.equal(LASER_GATE_RADIUS,24);
  assert.ok(craterRadius('gate','laser')>craterRadius('tile','laser'));
  assert.ok(craterRadius('gate','missile')>craterRadius('tile','missile'));
  assert.ok(craterRadius('gate','laser')<40,'one laser cannot penetrate a 40px metal bar');
  assert.ok(craterRadius('tile','missile')<craterRadius('gate','laser'));
  const body=source('src/omega-terrain.js');
  assert.doesNotMatch(body,/ctx\.strokeRect\(/,'no unnatural rectangle surrounding bars');
  for(let region=0;region<8;region++){
    const gate=gateSpec(seed,region,1);
    assert.ok(gate.full);
    assert.ok(gate.height>=540);
    assert.ok(new Set([0,.24,.71,1.49].map(t=>gateY(gate,t))).size>=2,'gate oscillates');
  }
});

test('variable natural relief stays traversable and seamless on repeated large regions',()=>{
  for(let region=0;region<30;region++){
    const start=region*REGION_SIZE;
    const first=terrainBounds(seed,start);
    assert.equal(first.top,-80);
    assert.equal(first.bottom,620);
    for(let i=0;i<REGION_SIZE;i+=69){
      const b=terrainBounds(seed,start+i);
      assert.ok(b.bottom-b.top>125,`unmineable geological pinch at ${start+i}`);
    }
    const end=terrainBounds(seed,start+REGION_SIZE-1);
    const next=terrainBounds(seed,start+REGION_SIZE);
    assert.ok(Math.abs(end.top-next.top)<8);
    assert.ok(Math.abs(end.bottom-next.bottom)<8);
  }
});

test('the former kinetic-charge WAV is never a gameplay cue',()=>{
  const sound=source('src/sound.js');
  const cues=sound.slice(sound.indexOf('export const SPACE_FORTRESS_CUES'),sound.indexOf('const SPACE_FORTRESS_AUDIO_DIR'));
  assert.doesNotMatch(cues,/missile:\s*'kinetic_charge\.wav'/);
  assert.doesNotMatch(cues,/boss:\s*'kinetic_charge\.wav'/);
  const game=source('src/game.js');
  assert.doesNotMatch(game,/sound\.play\('boss'\)/);
});
