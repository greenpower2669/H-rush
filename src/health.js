/** H-RUSH OMEGA — five hearts, four hull PV per heart.
 * A wall costs exactly one heart; a small hit costs one PV.
 * Pure state transitions, independent of rendering and Fab's AND collision engine.
 */
export const MAX_HEARTS = 5;
export const EXTRA_HEARTS_CAP = 8;
export const PV_PER_HEART = 4;

export function initialHealth() { return { hp: MAX_HEARTS, pv: PV_PER_HEART }; }

export function applyHealthDamage(state, kind = 'hit') {
  const hp = state.hp, pv = state.pv;
  const maximum = state.maxHearts ?? MAX_HEARTS;
  const extra = state.maxHearts === undefined ? {} : {maxHearts:maximum};
  if (!Number.isInteger(maximum) || maximum < MAX_HEARTS || maximum > EXTRA_HEARTS_CAP ||
      !Number.isInteger(hp) || hp < 0 || hp > maximum ||
      !Number.isInteger(pv) || pv < 0 || pv > PV_PER_HEART ||
      (hp === 0 && pv !== 0) || (hp > 0 && pv === 0)) throw RangeError('Invalid hull health');
  if (kind !== 'hit' && kind !== 'wall') throw RangeError('Invalid damage type');
  if (hp === 0) return { hp: 0, pv: 0, ...extra };
  if (kind === 'wall') {
    const hearts = hp - 1;
    return { hp: hearts, pv: hearts > 0 ? PV_PER_HEART : 0, ...extra };
  }
  if (pv > 1) return { hp, pv: pv - 1, ...extra };
  const hearts = hp - 1;
  return { hp: hearts, pv: hearts > 0 ? PV_PER_HEART : 0, ...extra };
}

/** Healing pickups restore one heart and refill the active heart's PV. */
export function restoreHeart(state) {
  if (state.hp <= 0) return initialHealth();
  const maximum=state.maxHearts??MAX_HEARTS;
  return { hp: Math.min(maximum,state.hp+1), pv: PV_PER_HEART, ...(state.maxHearts===undefined?{}:{maxHearts:maximum}) };
}

/** Rare extra-heart pickups permanently raise the heart ceiling for the current run, up to eight. */
export function grantExtraHeart(state) {
  const maximum=state.maxHearts??MAX_HEARTS;
  if(state.hp<=0) return initialHealth();
  if(maximum<EXTRA_HEARTS_CAP) return {hp:Math.min(maximum+1,state.hp+1),pv:PV_PER_HEART,maxHearts:maximum+1};
  return {hp:Math.min(maximum,state.hp+1),pv:PV_PER_HEART,maxHearts:maximum};
}
