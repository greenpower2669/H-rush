import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {gravityNozzlePositions} from '../src/hover-flight.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('gravity exhaust roots remain inside the rotated hull, including pitch',()=>{
  for(const pitch of [-.31,0,.31]){
    const cx=210,cy=270,width=90,height=62;
    const nozzles=gravityNozzlePositions(cx,cy,width,height,pitch);
    assert.equal(nozzles.length,2);
    for(const point of nozzles){
      const dx=point.x-cx,dy=point.y-cy;
      const localX=Math.cos(pitch)*dx+Math.sin(pitch)*dy;
      const localY=-Math.sin(pitch)*dx+Math.cos(pitch)*dy;
      assert.ok(Math.abs(localX)<width*.35);
      assert.ok(localY>0&&localY<height*.5,'emitter is hidden within hull');
    }
  }
});

test('offensive exhaust is drawn BEHIND the ship and orbitals after the hull',()=>{
  for(const path of ['src/game.js','ash-rush-standalone.html']){
    const src=read(path);
    const render=src.slice(src.indexOf('function render()'));
    const plume=render.indexOf('renderHoverPlume();');
    const exhaust=render.indexOf('renderThrusterUnderlay();');
    const ship=render.indexOf('drawEntity(player,');
    const orbital=render.indexOf('renderOffensiveSystems();');
    assert.ok(plume>=0&&exhaust>plume&&ship>exhaust&&orbital>ship,path);
    assert.ok(src.includes('gravityNozzlePositions(cx,cy,base.width,base.height,player.pitch)'));
  }
});

test('explosion uses exclusively circular transparent primitives, independently of atlas FX',()=>{
  for(const path of ['src/game.js','ash-rush-standalone.html']){
    const src=read(path);
    const start=src.indexOf('function renderExplosionBurst(fx){');
    const end=src.indexOf('const stars =',start);
    assert.ok(start>=0&&end>start,path);
    const code=src.slice(start,end);
    assert.doesNotMatch(code,/drawImage|fillRect|strokeRect|artFrames/);
    assert.match(src,/for\(const fx of bursts\)renderExplosionBurst\(fx\)/);
  }
  const src=read('src/game.js');
  const start=src.indexOf('function renderExplosionBurst(fx){');
  const end=src.indexOf('const stars =',start);
  const ops=[];
  const ctx={
    save(){ops.push('save');},restore(){ops.push('restore');},
    beginPath(){ops.push('begin');},arc(){ops.push('arc');},
    fill(){ops.push('fill');},stroke(){ops.push('stroke');},
    moveTo(){},lineTo(){},
    createRadialGradient(){return {addColorStop(pos,color){ops.push('stop');}};},
    drawImage(){throw Error('rectangular FX drawn');},
    fillRect(){throw Error('rectangular FX drawn');}
  };
  runInNewContext(src.slice(start,end)+'\nrenderExplosionBurst({x:120,y:180,size:1,age:.09,life:.34,phase:0});',{ctx,TAU:2*Math.PI});
  assert.ok(ops.includes('arc')&&ops.includes('stop')&&ops.includes('restore'));
});
