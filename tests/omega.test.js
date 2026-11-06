import test from 'node:test';
import assert from 'node:assert/strict';
import { newSeed128, keyed64, keyedFloat, stageAt, regionIdentity, REGION_SIZE, OmegaUniverse, OMEGA_KEY, WORLD_FAMILIES, ARCHETYPES } from '../src/universe.js';
import { terrainBounds, gateSpec, gateY, LASER_GATE_RADIUS } from '../src/omega-terrain.js';

const seed1='0123456789abcdef0123456789abcdef';
const seed2='abcdef0123456789abcdef0123456789';
const rng={getRandomValues(bytes){bytes.set(Array.from({length:16},(_,i)=>i*13));return bytes;}};
function store(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),m};}

test('128-bit cryptographic seed; deterministic keyed values and unique generation',()=>{
  const generated=newSeed128(rng);
  assert.match(generated,/^[a-f0-9]{32}$/);
  assert.equal(generated,newSeed128(rng));
  assert.equal(keyed64(seed1,42),keyed64(seed1,42));
  assert.notEqual(keyed64(seed1,42),keyed64(seed1,43));
  assert.notEqual(keyed64(seed1,42),keyed64(seed2,42));
  assert.equal(keyedFloat(seed1,-2),keyedFloat(seed1,-2));
  assert.equal(WORLD_FAMILIES.length,40);
  assert.equal(ARCHETYPES.length,20);
  assert.notDeepEqual(Array.from({length:12},(_,n)=>regionIdentity(seed1,n)),Array.from({length:12},(_,n)=>regionIdentity(seed2,n)));
});

test('space -> atmosphere -> surface -> interior -> exit -> space in each region',()=>{
  assert.equal(stageAt(0).phase,'space');
  assert.equal(stageAt(3800).phase,'atmosphere');
  assert.equal(stageAt(7300).phase,'surface');
  assert.equal(stageAt(11400).phase,'interior');
  assert.equal(stageAt(14700).phase,'exit');
  assert.equal(stageAt(REGION_SIZE+3800).phase,'atmosphere');
  assert.equal(stageAt(REGION_SIZE+3800).region,1);
  assert.equal(stageAt(1e9).region,Math.floor(1e9/REGION_SIZE));
  assert.deepEqual(terrainBounds(seed1,3222),terrainBounds(seed1,3222));
  // Terrain boundaries remain continuous when a tile boundary is crossed.
  for(let x=127;x<REGION_SIZE*2;x+=128){
    const a=terrainBounds(seed1,x),b=terrainBounds(seed1,x+1);
    assert.ok(Math.abs(a.top-b.top)<15,'top seam '+x);
    assert.ok(Math.abs(a.bottom-b.bottom)<15,'bottom seam '+x);
  }
  // Mandatory path is always wider than a 90px ship, except at intentionally mineable gates.
  for(let x=2700;x<REGION_SIZE*3;x+=31){
    const b=terrainBounds(seed1,x);
    assert.ok(b.bottom-b.top>125,`unmineable geological pinch at ${x}`);
  }
});

test('gates oscillate in bounded y; first obligatory gate is fully solid and mineable',()=>{
  const gate=gateSpec(seed1,0,1);
  assert.equal(gate.full,true);
  assert.equal(gate.width,40);
  assert.ok(LASER_GATE_RADIUS>=18 && LASER_GATE_RADIUS<=28,'bars should require multiple laser impacts');
  assert.notEqual(gateY(gate,0),gateY(gate,0.6));
  for(let n=0;n<30;n++)assert.ok(Math.abs(gateY(gate,n*.1)-gate.baseY)<=Math.ceil(gate.amplitude));
  const a=gateSpec(seed1,0,1),b=gateSpec(seed1,0,1);
  assert.deepEqual(a,b);
});

test('personal persistence, discovery, maximum distance without backward score exploit',()=>{
  const storage=store(),universe=new OmegaUniverse(storage,rng),seed=universe.seed;
  universe.advance(1000);universe.addPoints(50);const s1=universe.totalScore;
  universe.advance(350);assert.equal(universe.totalScore,s1);
  universe.advance(REGION_SIZE+1300);const s2=universe.totalScore;
  assert.ok(s2>s1);
  universe.appendScar('t:30',[20,60,12]);
  universe.appendScar('g:1',[10,330,60]);
  assert.equal(universe.scarCount,2);
  const text=universe.exportText();
  assert.ok(storage.getItem(OMEGA_KEY));
  const reload=new OmegaUniverse(storage,rng);
  assert.equal(reload.seed,seed);
  assert.equal(reload.maxDistance,universe.maxDistance);
  assert.deepEqual(reload.scars('g:1'),[[10,330,60]]);
  const other=new OmegaUniverse(store(),rng);other.restoreText(text);
  assert.equal(other.seed,seed);
  assert.equal(other.totalScore,universe.totalScore);
  assert.throws(()=>other.restoreText(JSON.stringify({...universe.state,scars:{'t:1':[[1,2,800]]}})),/invalides/);
});
