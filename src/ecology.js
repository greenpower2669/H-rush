/** OMEGA's first data-driven enemy ecology (20 combinable roles, 6 movement families).
 * Visuals reuse the actual animated sprite atlas with per-role hue variation.
 * Future missions will add 20 unique hand-drawn atlases and faction relations.
 */
import { keyedFloat, regionIdentity } from './universe.js';

export const SPECIES = Object.freeze([
  ['Chasseur ionique','scout','zigzag','single',2,98,15],
  ['Bombardier basaltique','manta','patrol','burst',5,48,75],
  ['Intercepteur fulgurant','scout','pursuit','single',2,170,155],
  ['Drone sentinelle','scout','patrol','single',2,85,230],
  ['Essaim de lucioles','scout','wave','rapid',1,155,75],
  ['Organisme tentaculaire','manta','wave','single',4,72,265],
  ['Serpent du vide','manta','serpent','rapid',4,105,20],
  ['Machine antique','manta','patrol','burst',7,48,140],
  ['Golem cristallin','asteroid','slow','none',7,66,165],
  ['Parasite d’étoile','scout','pursuit','rapid',1,141,250],
  ['Vaisseau vivant','manta','zigzag','single',5,82,285],
  ['Tourelle orbitale','scout','slow','burst',5,42,100],
  ['Gardien de faille','manta','pursuit','single',5,88,200],
  ['Réparateur alien','scout','patrol','none',3,63,125],
  ['Transporteur massif','manta','slow','single',8,54,100],
  ['Prédateur atmosphérique','scout','pursuit','rapid',3,135,320],
  ['Forteresse nomade','manta','slow','burst',9,39,160],
  ['Géant segmenté','asteroid','wave','none',8,61,48],
  ['Spectre énergétique','scout','serpent','rapid',2,124,255],
  ['Boss composite','boss','zigzag','burst',35,30,0]
].map(([name,base,movement,weapon,hp,speed,hue],index)=>Object.freeze({name,base,movement,weapon,hp,speed,hue,index})));

export function speciesFor(seed,region,encounter) {
  const offset=Math.floor(keyedFloat(seed,region,95)*SPECIES.length);
  const idx=(offset+encounter)%SPECIES.length;
  // Reserve the composite boss for its scheduled wave, not random enemy spawns.
  return SPECIES[idx===19?18:idx];
}
export function movementDelta(spec,age,phase,enemyY,playerY,dt) {
  switch(spec.movement){
    case 'wave':return Math.cos(age*4+phase)*42*dt;
    case 'serpent':return Math.cos(age*6.5+phase)*76*dt;
    case 'zigzag':return Math.cos(age*3.2+phase)*40*dt;
    case 'pursuit':return Math.max(-38*dt,Math.min(38*dt,(playerY-enemyY)*.6*dt));
    case 'patrol':return Math.sin(age*1.8+phase)*24*dt;
    case 'swoop':return Math.cos(age*5+phase)*94*dt;
    case 'feint':return Math.sin(age*7+phase)*(age%4<2?78:-55)*dt;
    case 'orbit':return Math.cos(age*2.2+phase)*100*dt;
    case 'weave':return (Math.sin(age*5.8+phase)*47+Math.sin(age*2.3+phase)*28)*dt;
    case 'ambush':return Math.max(-115*dt,Math.min(115*dt,(playerY-enemyY)*1.45*dt));
    default:return 0;
  }
}

/** Horizontal feints and charges stay bounded and obey terrain collision. */
export function movementSpeedScale(spec,age,phase){
  switch(spec?.movement){
    case 'swoop':return 1.15+.29*Math.sin(age*3.8+phase);
    case 'feint':return .95+.43*Math.cos(age*2.8+phase);
    case 'orbit':return .87+.21*Math.sin(age*2+phase);
    case 'ambush':return age<1.3?.63:age<2.5?1.6:1.05;
    default:return 1;
  }
}

/** Contextual variants are stable for a given seed, region, encounter and situation.
 * Reuse the same 20 logical archetypes, but mutate combat traits by location.
 * Enemy morphologies are still shared pending dedicated artist sprite sheets.
 */
export function adaptSpecies(spec, seed, region, phase, encounter, condition = 'normal') {
  const identity = regionIdentity(seed,region);
  const draw = keyedFloat(seed,region*100000 + encounter,173);
  const phaseMods = {
    space: {speed:1.15, hp:1, moves:['zigzag','pursuit','wave'], weapon:'rapid'},
    atmosphere: {speed:1.04,hp:1,moves:['wave','serpent','zigzag'],weapon:'burst'},
    surface: {speed:.84,hp:1.2,moves:['patrol','slow','pursuit'],weapon:'burst'},
    interior: {speed:.91,hp:1.3,moves:['serpent','pursuit','patrol'],weapon:'rapid'},
    exit: {speed:1.23,hp:.9,moves:['pursuit','zigzag','serpent'],weapon:'single'},
  };
  const m=phaseMods[phase] || phaseMods.space;
  const aggressive = condition === 'low-hp' ? .84 : condition === 'shielded' ? 1.08 : 1;
  const variation = .83 + draw*.38;
  const moves=[...m.moves,'swoop','feint','orbit','weave','ambush'];
  const movement=draw>.31 ? moves[(identity.faction+encounter+Math.floor(draw*11))%moves.length] : spec.movement;
  const armory=['aimed','cross','spiral',m.weapon];
  const weapon=spec.weapon==='none' ? 'none' : draw>.47 ? armory[(identity.faction+encounter)%armory.length] : spec.weapon;
  return {...spec, speed:Math.max(25,Math.round(spec.speed*m.speed*variation*aggressive)),
    hp:Math.max(1,Math.round(spec.hp*m.hp*(.92+draw*.26))),
    movement,weapon,hue:(spec.hue+identity.tone*.35+encounter*9)%360,
    faction:identity.faction,phase,trait:['éclaireur','blindé','furieux','furtif','sentinelle'][(identity.faction+Math.floor(draw*5))%5],
    fireRate:condition==='low-hp' ? 1.23 : (phase==='interior'?.82:1)};
}
