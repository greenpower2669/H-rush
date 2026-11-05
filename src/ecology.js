/** OMEGA's first data-driven enemy ecology (20 combinable roles, 6 movement families).
 * Visuals reuse the actual animated sprite atlas with per-role hue variation.
 * Future missions will add 20 unique hand-drawn atlases and faction relations.
 */
import { keyedFloat } from './universe.js';

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
    default:return 0;
  }
}
