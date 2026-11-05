/** Position du vaisseau à droite du doigt, en coordonnées logiques. */
export function touchTarget(point, shipWidth, shipHeight, worldWidth = 960, worldHeight = 540) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  // 88px de séparation horizontale, dont 74px de vaisseau + une petite marge.
  // Le pilote touche plutôt la partie gauche de l'écran : le vaisseau reste devant son doigt.
  const clearance = Math.max(88, shipWidth + 14);
  return {
    x: clamp(point.x + clearance, 10, worldWidth - shipWidth - 15),
    y: clamp(point.y - shipHeight * 0.5, 35, worldHeight - shipHeight - 15),
  };
}
