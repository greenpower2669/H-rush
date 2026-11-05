/** H-RUSH OMEGA: deterministic, per-installation 128-bit universe and durable discoveries. */
export const OMEGA_KEY = 'ashrush-omega-universe-v1';
export const REGION_SIZE = 5120;
const U64 = (1n << 64n) - 1n;
export const WORLD_FAMILIES = Object.freeze([
  'Nébuleuse de corail', 'Océan céleste', 'Forêt cristalline', 'Désert de verre',
  'Cité mécanique', 'Caverne organique', 'Astéroïde creux', 'Volcan d’obsidienne',
  'Station cyclopéenne', 'Jardin stellaire', 'Planète vivante', 'Banquise magnétique',
  'Ruines des anciens', 'Tempête ionique', 'Cathédrale gravitationnelle', 'Archipel flottant',
  'Anneaux d’émeraude', 'Marais bioluminescent', 'Canyon de plasma', 'Métropole submergée',
  'Débris de titan', 'Nuit polaire', 'Lagon de soufre', 'Désert sonore',
  'Océan de nuages', 'Champ d’épaves', 'Citadelle fossile', 'Matrice orbitale',
  'Sable lunaire', 'Forêt de géodes', 'Champignonnière géante', 'Flèches de basalte',
  'Faille quantique', 'Déluge de météores', 'Miroirs stellaires', 'Toundra ambrée',
  'Mines chantantes', 'Volcans sous-marins', 'Mégastructure brisée', 'Aurore abyssale'
]);
export const ARCHETYPES = Object.freeze([
  'chasseur', 'bombardier', 'intercepteur', 'drone', 'essaim', 'organisme',
  'serpent', 'machine antique', 'cristallin', 'parasite', 'vaisseau vivant', 'tourelle',
  'gardien', 'réparateur', 'transporteur', 'prédateur', 'forteresse mobile',
  'géant segmenté', 'entité énergétique', 'boss composite'
]);
export function isSeed128(value) { return typeof value === 'string' && /^[a-f0-9]{32}$/i.test(value); }
export function newSeed128(randomSource = globalThis.crypto) {
  if (!randomSource?.getRandomValues) throw Error('Un générateur cryptographique est nécessaire pour créer un univers personnel.');
  const bytes = new Uint8Array(16);
  randomSource.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('');
}
function mix64(x) {
  x = (x + 0x9e3779b97f4a7c15n) & U64;
  x = ((x ^ (x >> 30n)) * 0xbf58476d1ce4e5b9n) & U64;
  x = ((x ^ (x >> 27n)) * 0x94d049bb133111ebn) & U64;
  return (x ^ (x >> 31n)) & U64;
}
/** Stable on different browsers and devices; handles negative region indices. */
export function keyed64(seed, index, salt = 0) {
  if (!isSeed128(seed)) throw RangeError('Invalid 128-bit seed');
  const a = BigInt('0x' + seed.slice(0,16)), b = BigInt('0x' + seed.slice(16));
  return mix64(mix64(a ^ BigInt(index)) ^ mix64(b + BigInt(salt)));
}
export function keyedFloat(seed, index, salt = 0) {
  return Number(keyed64(seed,index,salt) >> 11n) / 9007199254740992;
}
export function stageAt(distance) {
  if (!Number.isFinite(distance) || distance < 0) throw RangeError('Invalid world distance');
  const region = Math.floor(distance / REGION_SIZE);
  const local = distance - region * REGION_SIZE;
  const phase = local < 900 ? 'space' : local < 1620 ? 'atmosphere' : local < 2680 ? 'surface' : local < 4180 ? 'interior' : local < 4750 ? 'exit' : 'space';
  return { region, local, phase };
}
export function regionIdentity(seed, index) {
  const familyIndex = Number(keyed64(seed,index,1) % BigInt(WORLD_FAMILIES.length));
  const faction = Number(keyed64(seed,index,2) % 16n);
  const enemyFamilies = [0,1,2,3].map(k => ARCHETYPES[Number(keyed64(seed,index,20+k) % BigInt(ARCHETYPES.length))]);
  const tone = Number(keyed64(seed,index,3) % 360n);
  return { index, familyIndex, family: WORLD_FAMILIES[familyIndex], faction, enemyFamilies, tone };
}
function positive(n) { return n >= 0 && Number.isSafeInteger(n); }
export function validateUniverseState(input) {
  if (!input || typeof input !== 'object' || input.format !== 1 || !isSeed128(input.seed)) throw Error('Sauvegarde OMEGA invalide.');
  if (!positive(input.distance) || !positive(input.maxDistance) || !positive(input.points) || !positive(input.discoveries)) throw Error('Progression OMEGA invalide.');
  if (!input.scars || typeof input.scars !== 'object' || Array.isArray(input.scars)) throw Error('Dégâts OMEGA invalides.');
  if (Object.keys(input.scars).length > 3000) throw Error('Sauvegarde trop grande.');
  let count = 0;
  for (const [id, edits] of Object.entries(input.scars)) {
    if (!/^(t|g):\d+$/.test(id) || !Array.isArray(edits) || edits.length > 500) throw Error('Historique de dégâts invalide.');
    count += edits.length;
    if (count > 16000 || edits.some(a => !Array.isArray(a) || a.length !== 3 || !a.every(Number.isInteger) || a[0] < -70 || a[0] > 200 || a[1] < -70 || a[1] > 700 || a[2] < 1 || a[2] > 70)) throw Error('Coordonnées de dégâts invalides.');
  }
  return input;
}
export class OmegaUniverse {
  constructor(storage = null, randomSource = globalThis.crypto) {
    this.storage = storage;
    let restored = null;
    try { const raw = storage?.getItem(OMEGA_KEY); if (raw) restored = validateUniverseState(JSON.parse(raw)); } catch { /* corrupt external state is ignored; new profile below */ }
    this.state = restored || { format:1, seed:newSeed128(randomSource), distance:0, maxDistance:0, points:0, discoveries:0, scars:{}, visited:[] };
    this.state.visited = Array.isArray(this.state.visited) ? this.state.visited.filter(positive).slice(0,512) : [];
    this.dirty = !restored;
    this.saved = false;
    this.persistenceWarning = null;
    this._scarCount = Object.values(this.state.scars).reduce((a,v)=>a+v.length,0);
    if (this.dirty) this.flush();
  }
  get seed() { return this.state.seed; }
  get maxDistance() { return this.state.maxDistance; }
  get totalScore() { return this.state.points + Math.floor(this.maxDistance / 10) + this.state.discoveries * 400; }
  get scarCount() { return this._scarCount; }
  region(index) { return regionIdentity(this.seed,index); }
  advance(distance) {
    if (!Number.isSafeInteger(Math.floor(distance)) || distance < 0) return;
    this.state.distance = Math.floor(distance);
    if (distance > this.state.maxDistance) this.state.maxDistance = Math.floor(distance);
    const region = stageAt(distance).region;
    if (!this.state.visited.includes(region)) {
      this.state.visited.push(region);
      if (this.state.visited.length > 512) this.state.visited.shift();
      if(region > 0)this.state.discoveries++;
    }
    this.dirty = true;
  }
  addPoints(points) { this.state.points += Math.max(0,Math.floor(points)); this.dirty=true; }
  appendScar(id,edit) {
    const list=this.state.scars[id] || (this.state.scars[id]=[]);
    if(list.length>=500 || this.scarCount>=16000) {this.persistenceWarning="Limite de sauvegarde atteinte : exportez votre univers.";return false;}
    list.push(edit);this._scarCount++;this.dirty=true;return true;
  }
  scars(id) { return this.state.scars[id] || []; }
  flush() {
    if(!this.dirty)return this.saved;
    try {this.storage?.setItem(OMEGA_KEY,JSON.stringify(this.state));this.saved=!!this.storage;this.dirty=false;if(!this.saved)this.persistenceWarning="Stockage local indisponible.";}catch{this.saved=false;this.persistenceWarning="Sauvegarde impossible : stockage plein ou inaccessible.";}
    return this.saved;
  }
  exportText() { this.flush();return JSON.stringify(this.state); }
  restoreText(text) {
    const state=validateUniverseState(JSON.parse(text));
    this.state=structuredClone(state);
    this.state.visited=Array.isArray(this.state.visited)?this.state.visited.filter(positive).slice(0,512):[];
    this._scarCount=Object.values(this.state.scars).reduce((a,v)=>a+v.length,0);
    this.dirty=true;this.flush();
  }
}
