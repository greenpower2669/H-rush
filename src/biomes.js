/** OMEGA 0.4.6: coherent world signatures. A region has an artistic identity,
 * distinct geomorphology and ambience, not just a different palette.
 * All procedural values depend only on the universe seed and the region index.
 */
import { regionIdentity, keyedFloat } from './universe.js';

export const BIOME_TYPES = Object.freeze([
  'nebula', 'ocean', 'crystal', 'desert', 'machine', 'organic', 'asteroid', 'volcanic',
  'machine', 'garden', 'organic', 'ice', 'ruins', 'storm', 'ruins', 'ocean',
  'crystal', 'garden', 'volcanic', 'ocean', 'asteroid', 'ice', 'volcanic', 'desert',
  'ocean', 'asteroid', 'ruins', 'machine', 'desert', 'crystal', 'organic', 'volcanic',
  'storm', 'asteroid', 'crystal', 'ice', 'crystal', 'volcanic', 'machine', 'nebula'
]);
export const BIOME_PALETTES = Object.freeze({
  nebula: {sky:'#171443',rock:'#573c7d',glow:'#f080e2',far:'#312f78'},
  ocean: {sky:'#082f53',rock:'#215b78',glow:'#55f5ee',far:'#1b7d9a'},
  crystal: {sky:'#211a4e',rock:'#5263aa',glow:'#93f4ff',far:'#6848ad'},
  desert: {sky:'#422846',rock:'#a16b65',glow:'#f6c18d',far:'#86525d'},
  machine: {sky:'#0c2036',rock:'#516d82',glow:'#9ff6df',far:'#2d5471'},
  organic: {sky:'#30233c',rock:'#815672',glow:'#ff9a9a',far:'#593e69'},
  asteroid: {sky:'#111d37',rock:'#685f75',glow:'#e8b19b',far:'#343751'},
  volcanic: {sky:'#35152e',rock:'#803e43',glow:'#ff9b4d',far:'#602c3f'},
  garden: {sky:'#153e44',rock:'#3f826c',glow:'#abffb1',far:'#2f6766'},
  ice: {sky:'#172e55',rock:'#5f8eb2',glow:'#dcfaff',far:'#467599'},
  ruins: {sky:'#342645',rock:'#82718e',glow:'#e6bbfc',far:'#5d466c'},
  storm: {sky:'#202e58',rock:'#596681',glow:'#e6e9ff',far:'#364577'},
});
const cache=new Map();
export function biomeFor(seed,region){
  const key=seed+':'+region;
  if(cache.has(key))return cache.get(key);
  const identity=regionIdentity(seed,region),kind=BIOME_TYPES[identity.familyIndex];
  const style=BIOME_PALETTES[kind];
  const profile=Object.freeze({kind, ...style, family:identity.family,
    tone:identity.tone, faction:identity.faction,
    relief:.68+keyedFloat(seed,region,281)*.92,
    roughness:.65+keyedFloat(seed,region,282)*.88,
    gap:.82+keyedFloat(seed,region,283)*.38,
    motifSeed:keyedFloat(seed,region,284)*1000,
    gravity:kind==='asteroid'?.38:kind==='ocean'?.88:1});
  cache.set(key,profile);
  if(cache.size>48)cache.delete(cache.keys().next().value);
  return profile;
}

/** No passive gravity in the void. Gravity is visual debris physics on planets only.
 * Input via the accelerometer is intentional piloting, NEVER world gravity.
 */
export function debrisGravity(phase,profile){
  if(phase==='space'||phase==='exit')return 0;
  const base=phase==='surface'?94:phase==='atmosphere'?46:phase==='interior'?32:0;
  return base*Math.max(.2,Math.min(1.25,profile?.gravity??1));
}
