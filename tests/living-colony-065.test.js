import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ORGANIC_STATES,ORGANIC_FRAGMENT_LIMIT,organicCanSever,
  organicSeverDue,rescueHelper,stepOrganicFragment} from '../src/living-organics.js';
import {ENEMY_MORPHS,BOSS_MORPHS} from '../src/bestiary.js';
import {GATE_TYPES,gateSpec,gateY} from '../src/omega-terrain.js';
const seed='0123456789abcdef0123456789abcdef';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

const player=(x=100,y=300)=>({x,y,sprite:{width:74,height:46}});
const fragment=(state='crawl',origin='tentacle')=>({
  kind:'organic-fragment',fragment:true,origin,state,stateAge:.6,ttl:23,
  x:400,y:290,sprite:{width:69,height:65},hp:3,maxHp:3,vy:0,worldAnchorX:null
});
const helper=(x=460,y=90)=>({
  x,y,hp:6,morph:{anchor:'ceiling',shape:'tentacle'},
  sprite:{width:158,height:174}
});

test('all organic severing is bounded to one genuine fragment per living parent',()=>{
  assert.ok(ORGANIC_FRAGMENT_LIMIT<=6);
  assert.deepEqual(ORGANIC_STATES,['fall','crawl','lunge','rescue','ambush','drop']);
  const m=ENEMY_MORPHS.find(x=>x.shape==='tentacle');
  const root=ENEMY_MORPHS.find(x=>x.shape==='root');
  for(const morph of [m,root]){
    const enemy={morph,hp:6,maxHp:6,severCount:0};
    assert.equal(organicCanSever(enemy),true);
    assert.equal(organicSeverDue(enemy),false);
    enemy.hp=3;assert.equal(organicSeverDue(enemy),true);
    enemy.severCount=1;assert.equal(organicCanSever(enemy),false);
  }
  assert.equal(organicCanSever({morph:null,hp:2,maxHp:4}),false);
});
test('only a SECOND nearby living ceiling tentacle can rescue a severed tentacle',()=>{
  const cut=fragment(),live=helper(),distant=helper(950),dead={...helper(),hp:0};
  const ground={...helper(405),morph:{shape:'root',anchor:'ground'}};
  assert.equal(rescueHelper(cut,[cut,dead,ground,distant,live]),live);
  assert.equal(rescueHelper(cut,[cut,dead,ground,distant]),null);
  assert.equal(rescueHelper(fragment('crawl','root'),[live]),null);
  assert.equal(rescueHelper(fragment('fall'),[live]),null);
  assert.equal(rescueHelper({...cut,stateAge:.15},[live]),null);
  const other={...fragment('rescue'),helper:live};
  assert.equal(rescueHelper(cut,[live,other]),null,'helper cannot carry multiple severed pieces');
});
test('a living helper CARRIES a severed tentacle into its cave ceiling, then ambushes and drops',()=>{
  const f=fragment(),h=helper(),actors=[f,h];
  let env={floor:465,ceiling:77,scroll:4000};
  let p=player(30,290);
  const first=stepOrganicFragment(f,actors,p,env,.033);
  assert.equal(f.state,'rescue');
  assert.equal(f.helper,h);
  assert.ok(first.dy<0,'physical lifting motion moves upward');
  let reattached=false;
  for(let t=0;t<180;t++){
    const m=stepOrganicFragment(f,actors,p,env,.033);
    if(m.expired)throw Error('fragment timed out during rescue');
    f.x+=m.dx;f.y+=m.dy;
    if(m.reanchored){reattached=true;break;}
  }
  assert.equal(reattached,true);
  assert.equal(f.state,'ambush');
  assert.equal(f.helper,null,'after reattachment the helper is released');
  assert.ok(Number.isFinite(f.worldAnchorX),'stable world-coordinate anchor');
  let m=stepOrganicFragment(f,actors,p,env,.033);
  assert.equal(f.state,'ambush','wait until ship passes');
  assert.ok(Math.abs(m.dx)<=24);
  env={...env,scroll:4010};
  m=stepOrganicFragment(f,actors,p,env,.033);
  assert.ok(m.dx<0,'the new anchor scrolls with its planet');
  p=player(f.x+5,f.y+130);
  m=stepOrganicFragment(f,actors,p,env,.033);
  assert.equal(f.state,'drop','drop only when the ship arrives below');
  assert.equal(m.dropped,true);
  m=stepOrganicFragment(f,actors,p,env,.033);
  assert.ok(m.dy>0,'falling is actual acceleration');
});
test('rescuer death or loss of real ceiling drops the fragment safely',()=>{
  for(const mode of ['dead','noCeiling']){
    const f=fragment(),h=helper();
    f.state='rescue';f.helper=h;
    if(mode==='dead')h.hp=0;
    const m=stepOrganicFragment(f,[f,h],player(),{
      floor:445,ceiling:mode==='noCeiling'?-80:85,scroll:50},.04);
    assert.equal(f.state,'fall');
    assert.equal(f.helper,null);
    assert.ok(Number.isFinite(m.dx)&&Number.isFinite(m.dy));
  }
});
test('cut roots and tentacles crawl and lunge only within a bounded lifetime',()=>{
  const f=fragment('crawl','root');
  const env={floor:420,ceiling:-80,scroll:500};
  let m=stepOrganicFragment(f,[f],player(50,290),env,.02);
  assert.equal(f.state,'crawl');assert.ok(m.dy>0||m.dy<0||m.dy===0);
  f.stateAge=.78; // Sufficient recovery time before a hostile lunge.
  m=stepOrganicFragment(f,[f],player(f.x+20,f.y+4),env,.03);
  assert.equal(f.state,'lunge');
  assert.ok(m.dy<0,'lunge leaps upward');
  const expired=fragment('crawl');expired.ttl=.01;
  assert.equal(stepOrganicFragment(expired,[expired],player(),env,.05).expired,true);
});
test('the original morphs retain correct attachment and high-detail silhouette is real alpha',()=>{
  const art=read('src/bestiary.js');
  assert.ok(ENEMY_MORPHS.filter(x=>x.shape==='root').every(x=>x.anchor==='ground'));
  assert.ok(ENEMY_MORPHS.filter(x=>x.shape==='tentacle').every(x=>x.anchor==='ceiling'));
  assert.ok(BOSS_MORPHS.some(x=>x.shape==='tentacle'));
  for(const token of ['function paintLivingOrganism(g,m,frame,missingArm=-1)', 'function organicFragmentSprite(morph,frame=0)',
    'maskFromImageData(data,42)', 'g.bezierCurveTo(', 'g.createLinearGradient(',
    'g.createRadialGradient(', "if(isLivingAppendage(m)){paintLivingOrganism(g,m,frame,missingArm);return;}",
    "const w=living?(morph.boss?230:158)", "const h=living?(morph.boss?244:174)"]){
    assert.ok(art.includes(token),token);
  }
});
test('columns much rarer but historic IDs, material and craters are preserved',()=>{
  assert.equal(GATE_TYPES,11);
  let total=0;
  for(let region=0;region<16;region++){
    const gates=Array.from({length:GATE_TYPES},(_,which)=>gateSpec(seed,region,which));
    assert.equal(gates.length,11);
    assert.equal(new Set(gates.map(g=>g.id)).size,11);
    assert.ok(gates.filter(g=>g.enabled).length<=4,'no more than four mobile gates per region');
    assert.equal(gates[0].id,region*3);
    for(const g of gates)if(g.enabled){
      total++;
      assert.ok(g.anchor==='ground'||g.anchor==='ceiling');
      assert.ok(Number.isFinite(gateY(g,.6)));
    }
  }
  assert.ok(total<16*GATE_TYPES*.42,'reduce mobile-column density by at least 58%');
});
test('game enforces roof for ceiling tentacles and the Android bundle includes rescue AI',()=>{
  const src=read('src/game.js'),html=read('ash-rush-standalone.html');
  for(const code of [src,html]){
    for(const token of ['if(morph?.anchor===\'ceiling\'&&preview.top<40)',
      'function spawnOrganicFragment(parent,impact)', 'function drawRescueLink(f)',
      'organicSeverDue(enemy)', 'stepOrganicFragment(enemy,enemies,player',
      "if(enemy.state==='crawl')alignByTerrainAnd",
      'if(isLivingAppendage(enemy.morph))drawEntity(enemy)']){
      assert.ok(code.includes(token),token+' missing');
    }
  }
  assert.ok(html.includes('function rescueHelper(fragment,actors)'));
  assert.ok(html.includes('if(i===missingArm)continue'));
  assert.ok(src.includes('enemy.severArm=Math.max(0'));
  assert.ok(src.includes('enemy.severArm??-1'));
  assert.ok(html.includes('function organicFragmentSprite(morph,frame=0)'));
  assert.ok(!src.includes('if(enemy.kind !== \'asteroid\' && !enemy.morph)'));
});
