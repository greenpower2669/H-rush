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

## 2026-11-05 — APK Android 0.2.1 vérifié
- GitHub Actions 42088822394 : toutes les étapes réussies, 10 tests JS OK.
- Android Gradle compile `fr.fab.ashrush`, versionName 0.2.1, versionCode 21, minSdk 26, targetSdk 35.
- apksigner : schéma v2 valide, certificat CN=Android Debug, clé CI non pérenne.
- Release 0.2.1 : https://github.com/greenpower2669/H-rush/releases/tag/v0.2.1-android-preview
- APK ancien : AshRush-v0.2.1-debug.apk ; SHA-256 `d2aeb17d3fd3226e31027cad47b38b8efc5922c35b07acafc9c817468b752fed`.
- L'installation sur téléphone physique reste à vérifier.

## 2026-11-05 — collision AND directe 0.2.2 (tests locaux)
- Retrait du calcul historique `(A | B) ^ (A ^ B)` du moteur ; `A & B` direct pour 2 lanes 32 bits, résultats A/B/C identiques.
- `capture()` ne fait plus `popcount` + parcours, mais un seul parcours des bits pour nombre et XY ; `forEachImpact()` reste disponible pour les effets.
- Cratères : masques de suppression par mots, `before & ~removalBits`, puis contrôle des projections X et Y.
- `npm test` : 13/13 tests Node réussis, dont 100 cratères aléatoires et contrôle de tous les pixels/projections.
- `npm run bench` : médianes de 9 séries sur Node 22, masques préconstruits ; les résultats varieront selon machine/JIT :
  - clairsemées (340 collisions) : XOR 0,92 ms, AND 0,80 ms, environ 1,15×
  - normales (300) : XOR 1,94 ms, AND 1,70 ms, environ 1,14×
  - denses (170) : XOR 3,61 ms, AND 3,57 ms, environ 1,01×
  - grands sprites partiels (90) : XOR 2,86 ms, AND 2,32 ms, environ 1,23×
- Ces timings ne valident pas encore une augmentation du FPS ni les performances sur Android.

## 2026-11-05 — GitHub Actions / APK 0.2.2
- Workflow réussi : https://github.com/greenpower2669/H-rush/actions/runs/42096290323 ; 13 tests Node, build HTML reproduit à l’octet, compilation Gradle OK.
- Signature APK schéma v2 vérifiée, certificat CN=Android Debug ; apk package `fr.fab.ashrush.preview` versionName 0.2.2 code 22, minSdk 26.
- Release : https://github.com/greenpower2669/H-rush/releases/tag/v0.2.2-android-preview ; fichier `AshRush-v0.2.2-preview-debug.apk` 30 517 octets ; SHA-256 `4acebbdfa0ac1faaa948bb6a622bdceb26a33ff388f220c6d3548c3720699ff7`.
- App Android parallèle pour conserver la v0.2.1, compte tenu de la signature debug régénérée en CI.
- Installation et performances sur Samsung non testées physiquement.
