import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AUTOFOCUS_STORAGE_KEY,readAutofocus,saveAutofocus,
  twoFingerAimPoint,twoFingerNoseShot,missileAutofocusVelocity} from '../src/two-finger-aim.js';
const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const e=(x,y)=>({x,y,hp:2,morph:{anchor:'air'},sprite:{width:70,height:50}});
const m=()=>({x:110,y:230,vx:345,vy:0,sprite:{width:35,height:20},lockTarget:null});
test('autofocus defaults OFF on every fresh or legacy install; persists opt-in and opt-out',()=>{
  const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  assert.equal(readAutofocus(null),false);
  assert.equal(readAutofocus(storage),false);
  map.set(AUTOFOCUS_STORAGE_KEY,'true'); // stale/ambiguous value never auto-enables
  assert.equal(readAutofocus(storage),false);
  assert.equal(saveAutofocus(storage,true),true);
  assert.equal(map.get(AUTOFOCUS_STORAGE_KEY),'on');
  assert.equal(readAutofocus(storage),true);
  assert.equal(saveAutofocus(storage,false),false);
  assert.equal(readAutofocus(storage),false);
  assert.equal(readAutofocus({getItem(){throw Error('private mode');}}),false);
  assert.equal(saveAutofocus({setItem(){throw Error('full storage');}},true),true);
});
test('default second-finger aim follows fingertip, never locks to moving enemies',()=>{
  const target=e(400,100);
  const state={start:{x:420,y:140},current:{x:500,y:290},target};
  let aim=twoFingerAimPoint(state,[target]);
  assert.deepEqual(aim,{x:500,y:290,target:null,kind:'free'});
  target.x=800;target.y=300;
  aim=twoFingerAimPoint(state,[target],960,540,false);
  assert.deepEqual(aim,{x:500,y:290,target:null,kind:'free'});
  state.current={x:1000,y:-100};
  assert.deepEqual(twoFingerAimPoint(state,[target]),{x:960,y:0,target:null,kind:'free'});
});
test('manual laser and missile rays are fixed by fingertip on EACH launch only',()=>{
  const aim={x:580,y:275,target:null};
  const shot=twoFingerNoseShot(170,220,70,0,780,0,aim);
  assert.ok(shot.vx>0&&shot.vy>0);
  const missile=twoFingerNoseShot(170,220,70,0,345,0,aim);
  const old=Math.atan2(missile.vy,missile.vx);
  const moving=e(250,490);
  const b={...m(),vx:missile.vx,vy:missile.vy,lockTarget:moving};
  for(let i=0;i<40;i++){
    moving.x-=5;moving.y-=6;
    const next=missileAutofocusVelocity(b,[moving],.033);
    assert.deepEqual(next,{vx:missile.vx,vy:missile.vy});
    b.x+=next.vx*.033;b.y+=next.vy*.033;
  }
  assert.ok(Math.abs(Math.atan2(b.vy,b.vx)-old)<1e-12);
});
test('nearby enemies and stale locks NEVER curve an unassisted missile',()=>{
  const target=e(240,20),b={...m(),lockTarget:target};
  assert.deepEqual(missileAutofocusVelocity(b,[target],.033,false),{vx:345,vy:0});
  target.y=515;
  assert.deepEqual(missileAutofocusVelocity(b,[target],.033),{vx:345,vy:0});
  b.lockTarget=null;
  assert.deepEqual(missileAutofocusVelocity(b,[target],.033),{vx:345,vy:0});
  assert.deepEqual(missileAutofocusVelocity(b,[],.033,true),{vx:345,vy:0});
});
test('opt-in autofocus follows a locked target and legacy fallback nearest enemy',()=>{
  const target=e(450,430),b={...m(),lockTarget:target};
  const locked=missileAutofocusVelocity(b,[target],.033,true);
  assert.ok(locked.vy>0);
  assert.ok(Math.abs(Math.hypot(locked.vx,locked.vy)-345)<1e-7);
  b.lockTarget=null;
  const nearest=missileAutofocusVelocity(b,[target],.033,true);
  assert.ok(nearest.vy>0);
  const dead=e(150,50);dead.hp=0;
  assert.deepEqual(missileAutofocusVelocity(b,[dead],.033,true),{vx:345,vy:0});
});
test('menu, persistent setting, and no-auto-guide guard are wired in both builds',()=>{
 const game=src('src/game.js'),html=src('index.html'),standalone=src('ash-rush-standalone.html');
 for(const id of ['autofocusToggle','autofocusStatus']){
   assert.ok(html.includes('id="'+id+'"'),id);
   assert.ok(standalone.includes('id="'+id+'"'),id+' standalone');
 }
 for(const token of ['let autofocusEnabled=readAutofocus(storage)',
   'twoFingerAimPoint(secondFingerAim,enemies,W,H,autofocusEnabled)',
   'target:autofocusEnabled?acquireTwoFingerTarget(enemies,point,W,H):null',
   'autoGuide:autofocusEnabled','if(b.autoGuide===true)',
   'missileAutofocusVelocity(b,enemies,dt,true)',
   "autofocusEnabled=saveAutofocus(storage,e.target.checked)"]){
   assert.ok(game.includes(token),token);
   assert.ok(standalone.includes(token),token+' standalone');
 }
 assert.ok(html.includes('désactivé par défaut'));
 assert.ok(standalone.includes('function missileAutofocusVelocity'));
});
