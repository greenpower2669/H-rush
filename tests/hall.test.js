import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHall, insertHallEntry, scoreRun, HALL_SIZE } from '../src/hall.js';
import { OmegaUniverse } from '../src/universe.js';
import { readFileSync } from 'node:fs';

const rng={getRandomValues(arr){arr.fill(17);return arr;}};
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m};};
const entry=(score,minutes=0)=>({score,points:score,newDistance:2200,maxDistance:12500,
  kills:3,seconds:minutes,region:2,world:'Nébuleuse de corail',cause:'wall',time:'2026-11-05T22:30:00.000Z'});

test('Hall records sort by score; cap entries and preserve a stable tie break',()=>{
  let hall=[];
  for(let i=0;i<14;i++)hall=insertHallEntry(hall,entry(i*125,i));
  assert.equal(hall.length,HALL_SIZE);
  assert.equal(hall[0].score,1625);
  assert.equal(hall.at(-1).score,500);
  assert.deepEqual(normalizeHall(hall),hall);
  assert.equal(scoreRun(1000,1450),450);
  assert.equal(scoreRun(1450,1450),0);
  assert.equal(scoreRun(2000,1100),0);
});

test('Hall personal records survive restart and JSON export / restore',()=>{
  const db=storage(),u=new OmegaUniverse(db,rng);
  u.advance(12000);
  u.recordRun(entry(980));u.recordRun(entry(1840));
  assert.equal(u.hall[0].score,1840);
  const loaded=new OmegaUniverse(db,rng);
  assert.equal(loaded.hall.length,2);
  assert.equal(loaded.seed,u.seed);
  const copy=new OmegaUniverse(storage(),rng);
  copy.restoreText(loaded.exportText());
  assert.deepEqual(copy.hall,loaded.hall);
  assert.equal(copy.maxDistance,loaded.maxDistance);
});

test('Hall rejects malformed saved entries and does not replace valid data',()=>{
  const u=new OmegaUniverse(storage(),rng);u.recordRun(entry(250));
  const bad={...u.state,hall:[{...entry(250),score:-1}]};
  assert.throws(()=>u.restoreText(JSON.stringify(bad)),/Hall of Fame invalide/);
  assert.equal(u.hall[0].score,250);
  assert.throws(()=>insertHallEntry(u.hall,{...entry(0),world:'x'.repeat(120)}),/invalide/);
});

test('Game over and accessible buttons remain in both HTML variants and only AND for gameplay',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const id of ['gameOverPanel','endReplay','endHall','hallPanel','hallButton','hallBody'])
    assert.ok(html.includes(`id="${id}"`),`missing ${id}`);
  const code=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
  assert.match(code,/function finishRun\(cause\)/);
  assert.match(code,/finishRun\('wall'\)/);
  assert.match(code,/finishRun\('combat'\)/);
  assert.match(code,/METHODS\.BITMASK/);
  assert.doesNotMatch(html,/id="method"|id="benchmark"/);
});
