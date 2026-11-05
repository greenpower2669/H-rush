import test from 'node:test';
import assert from 'node:assert/strict';
import { touchTarget } from '../src/input.js';

test('le vaisseau reste à droite du doigt dans la zone utile', () => {
  const result = touchTarget({x:120,y:270},74,46);
  assert.deepEqual(result,{x:208,y:247});
  assert.ok(result.x >= 120+74);
});
test('le vaisseau reste visible même lorsque le doigt touche les limites', () => {
  assert.deepEqual(touchTarget({x:955,y:600},74,46),{x:871,y:479});
  assert.deepEqual(touchTarget({x:-400,y:-100},74,46),{x:10,y:35});
});
