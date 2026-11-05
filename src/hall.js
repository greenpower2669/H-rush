/** Personal Hall of Fame — compact, deterministic ranking, shared with OMEGA exports.
 * Server-side global ranking is deliberately not claimed here.
 */
export const HALL_SIZE = 10;
const safeInt = n => Number.isSafeInteger(n) && n >= 0;
export function validRun(run) {
  return !!run && typeof run === 'object' && ['combat','wall'].includes(run.cause) &&
    typeof run.world === 'string' && run.world.length <= 100 &&
    typeof run.time === 'string' && /^\d{4}-\d\d-\d\dT/.test(run.time) && run.time.length <= 32 &&
    ['score','points','newDistance','maxDistance','kills','seconds','region'].every(k => safeInt(run[k]));
}
export function normalizeHall(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.filter(validRun).slice(0,50).sort((a,b) =>
    b.score - a.score || b.newDistance - a.newDistance || b.kills - a.kills || a.time.localeCompare(b.time)
  ).slice(0,HALL_SIZE).map(x => ({
    score:x.score,points:x.points,newDistance:x.newDistance,maxDistance:x.maxDistance,
    kills:x.kills,seconds:x.seconds,region:x.region,world:x.world,cause:x.cause,time:x.time
  }));
}
export function insertHallEntry(entries, entry) {
  if (!validRun(entry)) throw Error('Entrée Hall of Fame invalide');
  return normalizeHall([...normalizeHall(entries),entry]);
}
/** A run gains only its newly earned lifetime score, never repeated mileage. */
export function scoreRun(start, end) {
  return Math.max(0,Math.floor(end)-Math.floor(start));
}
