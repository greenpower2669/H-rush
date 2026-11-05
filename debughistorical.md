# Historique des validations — Ash Rush

## 2026-11-05 — initialisation v0.1.0

- Noyau `src/collision.js` développé : masque alpha, deux words 32b/64 pixels, préfiltre axes, restitution des pixels actifs.
- Test `npm test` lancé localement : 6 suites réussies, 0 échec, 100 scénarios pseudo-aléatoires déterministes + limites de mots et projections trompeuses.
- `node --check src/game.js` passé.
- Le benchmark interactif compare des paires de sprites fixes sur cet appareil ; aucune performance chiffrée sur mobile réel n'est encore certifiée.
- Les sprites du jeu sont dessinés en Canvas, puis le moteur extrait la silhouette alpha des mêmes sprites.

## Points à ne pas confondre

- Résolution écran/DPR vs résolution logique du masque.
- Proximité vs vraie intersection (effets de souffle non encore implémentés).
- Temps d'évaluation JavaScript vs complexité algorithmique asymptotique.
- Pas de test matériel réel de milliers de projectiles à ce stade.

## 2026-11-05 — prototype v0.2.0

- Ajout grille spatiale `SpatialGrid`, effets audio Web Audio synthétisés, multi-touch missiles, bonus, astéroïdes destructibles.
- `node --test` : **8/8 tests réussis** ; scénario cratère, équivalence A/B/C et non-fuite grille inclus.
- `npm run build:standalone` : script reconstruit un seul fichier HTML sans imports externes.
- Inspection visuelle Chromium headless non concluante dans cet environnement (impossible d’obtenir une capture) ; pas de validation navigateur Android revendiquée.
- Sources Djipie : catalogue audio consulté et notices de licences lues ; aucun son privé recopié.
- Mesures FPS/CPU/RAM sur smartphone, orientation et multitouch réel : toujours à vérifier.
