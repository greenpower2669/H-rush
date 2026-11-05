/** Reproducible local Node micro-benchmark. Not an Android/FPS measurement. */
import { performance } from 'node:perf_hooks';
import { createMask as newMask, collide as directAnd, METHODS } from '../src/collision.js';
import { createMask as oldMask, collide as legacyXor } from './legacy-xor.mjs';

let seed=0x9e3779b9;
function next(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;}
function pattern(w,h,density){
  const a=new Uint8Array(w*h);
  for(let i=0;i<a.length;i++)a[i]=next()%100<density?1:0;
  return a;
}
const cases=[];
function makeCase(label,width,height,density,pairs){
  const a=pattern(width,height,density),b=pattern(width,height,density);
  const oldA=oldMask(width,height,(x,y)=>a[y*width+x]),oldB=oldMask(width,height,(x,y)=>b[y*width+x]);
  const newA=newMask(width,height,(x,y)=>a[y*width+x]),newB=newMask(width,height,(x,y)=>b[y*width+x]);
  const list=[];
  for(let i=0;i<pairs;i++){
    const ax=next()%45-22,ay=next()%31-15;
    const bx=next()%45-22,by=next()%31-15;
    list.push({oldA,oldB,newA,newB,ax,ay,bx,by});
  }
  cases.push({label,list});
}
makeCase('silhouettes clairsemées',94,52,13,340);
makeCase('silhouettes normales',95,61,43,300);
makeCase('zones denses',128,68,88,170);
makeCase('grands sprites partiels',256,128,27,90);

function execute(list,algorithm){
  let hash=0;
  for(const c of list){
    const r=algorithm==='legacy'
      ?legacyXor(c.oldA,c.ax,c.ay,c.oldB,c.bx,c.by,METHODS.BITMASK)
      :directAnd(c.newA,c.ax,c.ay,c.newB,c.bx,c.by,METHODS.BITMASK);
    hash=(hash+r.count*37+(r.first?.x??0)*3+(r.first?.y??0))|0;
  }
  return hash;
}
const rounds=9;
for(const {label,list} of cases){
  const expected=execute(list,'legacy');
  if(expected!==execute(list,'direct'))throw Error(`Différence avant/après : ${label}`);
  for(let i=0;i<3;i++){execute(list,'legacy');execute(list,'direct');}
  const times={legacy:[],direct:[]};
  for(let i=0;i<rounds;i++){
    const order=i%2?['legacy','direct']:['direct','legacy'];
    for(const method of order){
      const t0=performance.now();
      execute(list,method);
      times[method].push(performance.now()-t0);
    }
  }
  const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
  const old=median(times.legacy),modern=median(times.direct);
  const change=(old/modern).toFixed(2);
  console.log(`${label.padEnd(26)} ${String(list.length).padStart(4)} collisions | XOR ${old.toFixed(2)} ms | AND ${modern.toFixed(2)} ms | ratio ${change}x | mêmes résultats`);
}
