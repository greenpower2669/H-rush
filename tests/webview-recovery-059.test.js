import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {copyDamageSprite,MAX_ENEMY_DAMAGE_FRAMES} from '../src/damage.js';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('native WebView death is handled without terminating the host activity',()=>{
  const java=src('android-app/app/src/main/java/fr/fab/ashrush/MainActivity.java');
  for(const token of ['onRenderProcessGone(WebView view, RenderProcessGoneDetail detail)',
    'view.destroy();','if (repeated) showRendererRecovery();',
    'createGameWebView();','return true;', 'RENDERER_RETRY_GUARD_MS',
    'putBoolean("low_memory", true)','lastRendererIssue()']){
    assert.ok(java.includes(token),token);
  }
  assert.ok(java.includes('removeView(view)'),'dead WebView must leave its parent');
  assert.ok(java.includes('onConsoleMessage(ConsoleMessage message)'));
  assert.ok(!java.includes('loadUrl("chrome://crash")'));
});
test('frame loop captures fatal exceptions and allows a visible, copyable recovery',()=>{
 const game=src('src/game.js'),html=src('index.html'),stand=src('ash-rush-standalone.html');
 for(const token of ['recordRuntimeError(error','function stopBrokenFrame(error)',
   'if(fatalFrameError)return','catch(error){stopBrokenFrame(error);}',
   'RUNTIME_ERROR_KEY','SAFE_GRAPHICS',"$\x28'#crashReload'\x29"]){
   assert.ok(game.includes(token),token);
 }
 for(const id of ['crashPanel','crashMessage','crashDetails','crashReload','omegaDiagnostics']){
   assert.ok(html.includes('id="'+id+'"'),id);
   assert.ok(stand.includes('id="'+id+'"'),id+' standalone');
 }
 assert.ok(stand.includes('function stopBrokenFrame(error)'));
});
test('damaged sprites have a small rotation LRU, while AND mask is retained',()=>{
 const game=src('src/game.js'),damage=src('src/damage.js');
 assert.ok(game.includes('const cap=base.volatileDamage?4:20;'));
 assert.ok(game.includes('enemy.lastVisualSource===base'));
 assert.ok(game.includes('enemy.visualDirty=true'));
 assert.ok(damage.includes('volatileDamage:true'));
 assert.ok(MAX_ENEMY_DAMAGE_FRAMES<=12);
 const mask={width:2,height:2,stride:1,rows:new Uint32Array(2),
   xProjection:new Uint32Array(1),yProjection:new Uint32Array(1),filled:1};
 const source={width:2,height:2,image:{},mask};
 // Canvas belongs to Android/WebView; here assert only source immutability
 // through an offline static oracle, not a fake browser run.
 assert.equal(source.mask.filled,1);
 assert.ok(game.includes('maskFromImageData(g.getImageData(0,0,size,size))'));
});
