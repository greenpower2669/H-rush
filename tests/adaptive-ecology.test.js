import test from 'node:test';
import assert from 'node:assert/strict';
import { speciesFor, adaptSpecies } from '../src/ecology.js';
const seed='0123456789abcdef0123456789abcdef';
test('enemy combat and visual variants adapt to world phase and situation',()=>{
 const archetype=speciesFor(seed,5,3);
 const space=adaptSpecies(archetype,seed,5,'space',3,'normal');
 const inside=adaptSpecies(archetype,seed,5,'interior',3,'normal');
 const low=adaptSpecies(archetype,seed,5,'interior',3,'low-hp');
 assert.deepEqual(space,adaptSpecies(archetype,seed,5,'space',3,'normal'));
 assert.notDeepEqual(space,inside);
 assert.notEqual(low.speed,inside.speed);
 assert.ok(['patrol','pursuit','serpent','wave','zigzag','slow','swoop','feint','orbit','weave','ambush','dart','swarm','jump','ceiling','ground'].includes(inside.movement));
 assert.ok(['none','burst','rapid','single','aimed','cross','spiral'].includes(inside.weapon));
 assert.ok(inside.hue>=0&&inside.hue<360);
 assert.ok(inside.hp>=1);
 assert.equal(archetype.phase,undefined,'do not mutate canonical archetypes');
});
