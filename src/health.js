/** H-RUSH OMEGA — five hearts, four hull PV per heart.
 * A wall costs exactly one heart; a small hit costs one PV.
 * Pure state transitions, independent of rendering and Fab's AND collision engine.
 */
export const MAX_HEARTS = 5;
export const PV_PER_HEART = 4;

export function initialHealth() { return { hp: MAX_HEARTS, pv: PV_PER_HEART }; }

export function applyHealthDamage(state, kind = 'hit') {
  const hp = state.hp, pv = state.pv;
  if (!Number.isInteger(hp) || hp < 0 || hp > MAX_HEARTS ||
      !Number.isInteger(pv) || pv < 0 || pv > PV_PER_HEART ||
      (hp === 0 && pv !== 0) || (hp > 0 && pv === 0)) throw RangeError('Invalid hull health');
  if (kind !== 'hit' && kind !== 'wall') throw RangeError('Invalid damage type');
  if (hp === 0) return { hp: 0, pv: 0 };
  if (kind === 'wall') {
    const hearts = hp - 1;
    return { hp: hearts, pv: hearts > 0 ? PV_PER_HEART : 0 };
  }
  if (pv > 1) return { hp, pv: pv - 1 };
  const hearts = hp - 1;
  return { hp: hearts, pv: hearts > 0 ? PV_PER_HEART : 0 };
}

/** Healing pickups restore one heart and refill the active heart's PV. */
export function restoreHeart(state) {
  if (state.hp <= 0) return initialHealth();
  return { hp: Math.min(MAX_HEARTS, state.hp + 1), pv: PV_PER_HEART };
}
