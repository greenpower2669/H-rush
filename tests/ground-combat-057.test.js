import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMask,collide,eraseDisc,hasPixel,METHODS} from '../src/collision.js';
import {TILE_SIZE} from '../src/omega-terrain.js';
import {ENEMY_MORPHS} from '../src/bestiary.js';
import {MAX_ENEMY_DAMAGE_FRAMES} from '../src/damage.js';
import {
  isBallisticTurret,isBitingWorm,isGroundCreature,solidBelow,groundPitchByAnd,
  alignByTerrainAnd,ballisticSolution,gnawTerrainByAnd,
  BALLISTIC_GRAVITY,WORM_BITE_RADIUS,WORM_BITE_INTERVAL,GROUND_MAX_PITCH
} from '../src/ground-combat.js';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

function soil(floor=(x=>400)){
  const store=new Map(),scars=[];
  const t={scroll:0,scars,
    tile(index){
      if(index<0)return null;
      if(!store.has(index)){
        const mask=createMask(TILE_SIZE,540,(x,y)=>y>=floor(x+index*TILE_SIZE));
        store.set(index,{mask,width:TILE_SIZE,height:540});
      }
      return store.get(index);
    },
    collideEntity(entity){
      const x0=Math.max(0,Math.floor((entity.x+t.scroll)/TILE_SIZE));
      const x1=Math.floor((entity.x+t.scroll+entity.sprite.width)/TILE_SIZE);
      for(let index=x0;index<=x1;index++){
        const tile=t.tile(index),tileX=index*TILE_SIZE-t.scroll;
        const result=collide(entity.sprite.mask,entity.x,entity.y,tile.mask,tileX,0,METHODS.BITMASK);
        if(result.hit)return {kind:'tile',result,obj:tile,index,screenX:tileX,screenY:0};
      }
      return null;
    },
    firstWorldImpact(hit){
      const p=hit.result.first;
      return p?{x:p.x+t.scroll,y:p.y,screenX:p.x,screenY:p.y}:null;
    },
    carveImpact(hit,p,radius){
      const cut=eraseDisc(hit.obj.mask,p.x-hit.index*TILE_SIZE,p.y,radius);
      if(cut)scars.push({x:p.x,y:p.y,radius,cut});
      return cut;
    }
  };
  return t;
}
function ship(width=34,height=20,alpha=(x,y)=>x>=2&&x<width-2&&y>=height*.55){
 return {width,height,mask:createMask(width,height,alpha)};
}
test('tank cannon, rover and fixed turrets use artillery; roots and worms remain terrain-bound',()=>{
 const shapes=new Set(ENEMY_MORPHS.map(x=>x.shape));
 for(const name of ['tank','turret','tower','fortress','rover'])
   assert.ok(shapes.has(name)&&isBallisticTurret({shape:name}));
 assert.ok(!isBallisticTurret({shape:'worm'}));
 assert.ok(isBitingWorm({shape:'worm'}));
 assert.ok(isGroundCreature({anchor:'ground'})&&isGroundCreature({anchor:'ceiling'}));
 assert.ok(WORM_BITE_INTERVAL>=.35&&WORM_BITE_RADIUS<=10);
});
test('surface sampling uses the actual AND-NOT rock tile and observes persisted holes',()=>{
 const terrain=soil(()=>400);
 assert.equal(solidBelow(terrain,53,370),400);
 const mask=terrain.tile(0).mask;
 assert.ok(eraseDisc(mask,53,405,12)>0);
 assert.ok(solidBelow(terrain,53,395)>405,'carved crater must remove its previous solid pixels');
 assert.ok(hasPixel(mask,53,421));
});
test('enemy feet stop at REAL opaque terrain, not the sprite bounding rectangle',()=>{
 const terrain=soil(()=>400);
 const entity={x:44,y:344,sprite:ship(35,24,(x,y)=>x>5&&x<30&&y>=14)};
 const aligned=alignByTerrainAnd(terrain,entity,'ground',100);
 assert.ok(aligned.supported);
 assert.ok(entity.y>344&&entity.y<390);
 assert.equal(terrain.collideEntity(entity),null);
 assert.ok(terrain.collideEntity({...entity,y:entity.y+2}));
});
test('rotated / changing alpha footprint changes collision exactly under the same AND',()=>{
 const terrain=soil(x=>380+Math.floor(x*.14));
 const a={x:55,y:354,sprite:ship(44,25,(x,y)=>y>=18&&x>=4&&x<37)};
 const b={x:55,y:354,sprite:ship(44,25,(x,y)=>y>=21&&x>=10&&x<33)};
 const poseA=alignByTerrainAnd(terrain,a,'ground',100);
 const poseB=alignByTerrainAnd(terrain,b,'ground',100);
 assert.ok(poseA.supported&&poseB.supported);
 assert.ok(b.y>a.y,'fewer lower opaque pixels allow a lower physical contact pose');
 assert.equal(terrain.collideEntity(a),null);
 assert.equal(terrain.collideEntity(b),null);
});
test('chassis inclination uses LEFT and RIGHT opaque AND surface samples, with stable cap',()=>{
 const terrain=soil(x=>370+Math.floor(x*.35));
 const enemy={x:70,y:335,sprite:ship(46,28)};
 let previous=0;
 for(let i=0;i<20;i++)previous=groundPitchByAnd(terrain,enemy,previous,.033);
 assert.ok(previous>.08&&previous<=GROUND_MAX_PITCH);
 const level=soil(()=>420);
 assert.ok(Math.abs(groundPitchByAnd(level,enemy,0,.03))<.01);
});
test('ballistic tank shells aim upward and follow the true gravity parabola',()=>{
 const tank={x:470,y:340,sprite:{width:86,height:62},
   morph:{shape:'tank'},hullPitch:.18};
 const player={x:120,y:210,sprite:{width:74,height:46}};
 const shot=ballisticSolution(tank,player);
 assert.equal(shot.gravity,BALLISTIC_GRAVITY);
 assert.ok(shot.vx<0&&shot.vy<0,'upper-left player => tank fires UP-LEFT');
 assert.ok(shot.angle<-Math.PI/2);
 assert.ok(shot.flight>.3);
 assert.ok(Math.abs(shot.x+shot.vx*shot.flight-shot.target.x)<.001);
 assert.ok(Math.abs(shot.y+shot.vy*shot.flight+
   shot.gravity*shot.flight**2*.5-shot.target.y)<.001);
});
test('jumping worms actually bite the surviving soil pixels and leave permanent scars',()=>{
 const terrain=soil(()=>420);
 const worm={x:70,y:365,vx:-80,
   sprite:ship(40,50,(x,y)=>x>=2&&x<39&&y>=10)};
 const filled=terrain.tile(0).mask.filled;
 const bite=gnawTerrainByAnd(worm,terrain);
 assert.ok(bite&&bite.removed>0,'mouth must touch real rock pixels');
 assert.equal(bite.radius,WORM_BITE_RADIUS);
 assert.ok(terrain.tile(0).mask.filled<filled);
 assert.equal(terrain.scars.length,1,'a persistent crater is recorded');
 assert.equal(terrain.collideEntity(worm),null,'worm body remains outside uncut rock');
});
test('cannon, shell, rotated enemy wounds and gnawing are wired to actual game play',()=>{
 const game=src('src/game.js'),art=src('src/bestiary.js');
 assert.ok(game.includes('groundPitchByAnd(terrain,enemy'));
 assert.ok(game.includes('alignByTerrainAnd(terrain,enemy'));
 assert.ok(game.includes('isBallisticTurret(enemy.morph)'));
 assert.ok(game.includes('ballisticSolution(enemy,player)'));
 assert.ok(game.includes('b.vy+=b.gravity*dt'));
 assert.ok(game.includes('gnawTerrainByAnd(enemy,terrain)'));
 assert.ok(game.includes('pitchSprite(enemy.sprite,enemy.hullPitch)'));
 assert.ok(game.includes('pitchSpriteCache.delete(damaged)'));
 assert.ok(art.includes('paintMorph(g,morph,poseFrame,phase,resolvedAngle)'));
 assert.ok(art.includes('maskFromImageData(data,42)'));
 assert.ok(art.includes("morph.anchor==='air'||morph.shape==='worm'||morph.shape==='crawler'"));
 assert.ok(MAX_ENEMY_DAMAGE_FRAMES<=12);
 const html=src('ash-rush-standalone.html');
 assert.ok(html.includes('function gnawTerrainByAnd'));
 assert.ok(html.includes('function ballisticSolution'));
 assert.ok(html.includes('function alignByTerrainAnd'));
});

test('ballistic solution follows the target when its relative height or distance changes',()=>{
 const cannon={x:500,y:350,sprite:{width:86,height:62},morph:{shape:'turret'},hullPitch:-.12};
 const nearTarget={x:250,y:250,sprite:{width:74,height:46}};
 const farTarget={x:80,y:170,sprite:{width:74,height:46}};
 const nearShot=ballisticSolution(cannon,nearTarget);
 const farShot=ballisticSolution(cannon,farTarget);
 assert.ok(farShot.flight>nearShot.flight);
 assert.ok(nearShot.angle!==farShot.angle);
 for(const s of [nearShot,farShot]){
   assert.ok(Number.isFinite(s.angle));
   assert.ok(s.vx<0);
   assert.ok(s.gravity>0);
   assert.ok(Math.abs(s.x+s.vx*s.flight-s.target.x)<.001);
 }
});

test('artillery remains live for a tank with a support-only ecological weapon role',()=>{
 const game=src('src/game.js');
 assert.ok(game.includes("enemy.species?.weapon!=='none'||isBallisticTurret(enemy.morph)"),
   'tank turrets must still shoot a real ballistic shell when generic species is unarmed');
 assert.ok(game.includes("enemyShots.push({kind:'shell'"));
});
