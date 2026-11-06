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


## 2026-11-05 — chantier visuel 0.3.0, pré-validation locale
- Extraction d'un atlas réel PNG 1024×1120 de 23 frames depuis les planches graphiques créées pour Ash Rush, remplaçant les formes Canvas provisoires par un raster PNG en jeu après chargement.
- Tuiles géologiques déterministes 32 × (128×540), mémoire raster+masque, génération paresseuse au premier besoin ; forage par AND NOT et effacement pixel rigoureusement aligné.
- Sauvegarde des événements de forage dans localStorage, relecture lors de la création de la tuile ; persistance testée en Node avec magasin simulé.
- Tests locaux `npm test` : 18/18 avant CI. Le test est un oracle de cohérence pixel/masque sur deux tuiles traversées par un même cratère.
- `npm run build:standalone` : un HTML autonome contient une copie base64 du PNG 249155 octets. Les WAV originaux Space Fortress restent disponibles en APK via fichiers individuels ; leur chargement est optionnel et dispose d'un secours synthétique.
- Navigateurs headless locaux : capture et navigation indisponibles (`ERR_BLOCKED_BY_ADMINISTRATOR`) ; donc aucune validation visuelle en navigateur réel ni mesure FPS Android revendiquées ici.
- Les 23 frames sont des extractions de planches conceptuelles (pas un art vectoriel refait manuellement). Certains halos/contours des planches doivent encore être revus visuellement sur téléphone.

## 2026-11-05 — OMEGA 0.4.0 — essais locaux et limites
- Ancienne `CaveTerrain` limitée à 4 096 px préservée dans les tests de 0.3 ; nouveau `OmegaTerrain` streamé par blocs de 128px, sans limite de niveau prédéterminée.
- Node 22 : 26 tests réussis à ce stade, y compris 128-bit seed et régions, continuité des niveaux, oscillations, mur intégral, forage au laser, and bitmap après AND NOT, cicatrices persistantes et score monotone. Benchmarks numériques Android non réalisés.
- Chromium headless : vérifié le lancement de l'HTML autonome et le panneau de sauvegarde, puis vérifié les rendus de l'espace, d'une surface et de la galerie avec une barrière intégrale. Deux défauts corrigés pendant le smoke test : `import`/`export` résiduels dans HTML autonome ; frame d'animation négative au démarrage.
- PNG source 0.3 : 22 625 pixels de fond bleu-nuit opaques ont été effacés sur les bordures des sprites, pour retirer les rectangles noirs du rendu et du masque ; le traitement est documenté dans `tools/clean-atlas.py`. Les images de référence originales restent dans l'historique Git.
- Un test a révélé que les cratères traversant une frontière avaient une coordonnée locale négative et étaient rejetés à la restauration ; validation corrigée. Les tests de redémarrage passent.
- Android et AAB : build, signature Debug, vérification SHA-256 et publication à établir via GitHub Actions pour le commit final. Installation et performance sur Samsung encore à valider, comme l'usage réel des fichiers d'export/import via le sélecteur système.
- Fonctionnalités non validées : planètes libres, 40 palettes de graphismes uniques, boss multi-écrans, IA de factions, fragments physiques, monde multijoueur, Hall of Fame mondial, continuité au-delà du domaine exact de `Number` JavaScript.

## 2026-11-05 — OMEGA 0.4.1 / Game Over et Hall de gloire
- Correction de l'écran figé : `finishRun` enclenché à la mort combat / paroi, écran GAME OVER, score de run, Rejouer et Hall local. Ancien Rejouer masqué par CSS en paysage.
- Classement Top 10 sauvegardé dans `OmegaUniverse.state.hall` et transporté dans export/restauration JSON, sans serveur mondial. Valeurs validées à l'import.
- `adaptSpecies` varie par phase, région et situation, sans modifier l'archétype de référence.
- Test Node ajouté et smoke headless Chromium (`set_content` + faux stockage local car les URL sont bloquées par la politique de l'environnement).
- Reprise après Game Over et conservation du classement vérifiées en Chromium ; test réel Android à confirmer.

## 2026-11-06 — Préparation musicale 0.4.2
- Catalogue Djipie : 17 fichiers musicaux CC0 et 85 jingles Kenney vérifiés dans l'index ; 4 titres retenus pour ce jalon.
- Origines CC0 : drakzlin/OpenGameArt (Action_A, Battle, Horror) et Centurion_of_war/OpenGameArt (Space Echo).
- Le build GitHub récupère les sources publiques et vérifie quatre SHA-256 avant de les intégrer à l'APK, sans accès aux Releases privées.
- Les tests Node vérifient la logique de scène, fondu, pause et muet ; test Android physique reste à faire.

## 2026-11-06 — OMEGA 0.4.3 · corrections de santé, avant CI
- Source de la correction : l'ancienne collision avec la paroi affectait directement `player.hp=0`, déclenchant un one-shot involontaire.
- Nouvelle abstraction `src/health.js` : 5 cœurs de 4 PV ; paroi retire un cœur, petit impact retire un PV, débordement d'un cœur au quatrième coup ; guérison restaure un cœur + PV.
- Collision paroi : invulnérabilité 1,65 s, recul de 72 pixels logiques, FX et son maintenus ; aucune modification au noyau `A & B`.
- Validation locale : `npm test` 38/38, `npm run build:standalone` réussi. Restent test Android réel, CI, APK signé.

## OMEGA 0.4.3 — examen des obstacles et collisions
- Anomalie observée : `spawnEnemy` choisissait un Y au hasard et `update` déplaçait directement les ennemis ; aucune collision du décor n'était testée. Le boss pouvait traverser une roche opaque.
- Correction : `safeEnemySpawn` teste plusieurs lignes et une courte approche ; `advanceEnemyOnTerrain` avance par pas de 7 unités au maximum et vérifie `terrain.collideEntity` (AND 2D), puis tente glissement/évacuation.
- Anomalie visuelle : les nouveaux piliers étaient initialement ancrés aux bords de l'écran et restaient cachés dans les zones rocheuses d'une caverne ; correction par `terrainBounds(seed, worldX)`.
- La région contient désormais 11 obstacles au lieu de 3, avec conservation des trois IDs historiques et insertion de 8 IDs additionnels compatibles sauvegarde.
- Tests Node : 45/45, incluant 7 nouveaux tests de navigation, un oracle `A & B` et `AND NOT`, les 5 cœurs/PV et l'absence de régression.
- Test Chromium par rendu HTML autonome : page initialisée sans erreur JavaScript, rendu du passage souterrain bloqué visible. Le véritable essai Android et des scénarios de 10 000 m restent à faire.
- Attention GitHub Actions : le script Android 0.4.3 avait une erreur d'indentation Python dans la vérification de paquet ; corrigée avant publication.

## OMEGA 0.4.4 — test ciblé en préparation
Modules `src/tilt.js` et `src/bonuses.js` : tests de projection 0/90/180/270°, zone morte, calibration, persistance des préférences, TTL capteur, variantes de bonus. Les images d'accueil et l'icône native doivent être vérifiées directement dans l'APK par GitHub Actions. La réponse sensorielle en conditions réelles reste à tester sur téléphone.

## 2026-11-06 — OMEGA 0.4.5
- Réponse au retour : inclinaison parfois inversée, demande tactile initial, calibrage tactile, interrupteurs d'axes X/Y, cœurs supplémentaires occasionnels.
- Tests automatisés Node et HTML embarqué : vérifier l'exécution CI sur le commit final avant de déclarer l'APK publié.
- Contrôle réel du capteur et de la qualité de calibration sur le Samsung restant à effectuer.

## OMEGA 0.4.6 — validations exécutées localement (6 novembre 2026)
- Reconstruction du dépôt depuis les sources de versions précédentes et synchronisation avec les changements 0.4.5.
- 64 tests unitaires Node exécutés avec succès au jalon de développement ; tests supplémentaires couvrant 40 familles -> 12 biomes, zéro gravité en espace, limites de forage, conservation des passages, et cicatrices ennemies lors du changement d'image.
- Chromium via `page.set_content` de l'HTML autonome : écran JOUER, démarrage du jeu et simulation après une seconde sans erreur JavaScript. Les URL `file://` et `127.0.0.1` sont bloquées dans ce conteneur ; seule l'injection directe du HTML a été testée.
- Test sur Samsung réel et mesure FPS non effectués. Ne pas confondre tests techniques et validation artistique/ergonomique.
- Vérification supplémentaire dans Chromium avec un vrai Canvas : après forage ennemi, pixel alpha=0 et bit AND=0 sur deux images animées distinctes ; sprite atlas partagé intact. Comparaison de 16 régions : fonds/palettes visuellement distincts, sans erreur JS. Test de ressenti Samsung toujours à effectuer.

## OMEGA 0.4.7 — validation locale (6 novembre 2026)
- Code vérifié sur les sources reconstruites de la Release 0.4.6, avec 69 tests Node réussis localement (64 anciens + 5 nouveaux tests d'immersion), `npm run build:standalone` sans erreur.
- Tests déterministes de 6 segments pour une région à 16384 unités : transition géologique, largeur de passage et répartition des 11 barrières ; même graine = mêmes repères.
- Test du temps `mm:ss`, du meilleur temps persistant et de l'import d'ancienne sauvegarde JSON sans `bestTime` ; temps gelé en pause car `elapsed` n'avance que dans `update()`.
- Visuels chargés dans Chromium en mode `page.set_content()` sur HTML autonome ; commandes JOUER, surface, atmosphère et sortie rendues sans erreur JavaScript. Le système bloque `file://`, donc aucun accès local direct ni vérification de l'écran Android physique.
- Vérification du halo sur le vaisseau et de la matte de relief couvrant les pieds des silhouettes ; variations de maisons, tours et montagnes selon le monde/colonne.
- Limite connue : le changement de `REGION_SIZE` conserve les cicatrices/identifiants, mais peut déplacer des monuments et des barrières par rapport aux anciennes sauvegardes. Tests d'appareil et migration géométrique à approfondir.
- Statut CI GitHub : à consigner uniquement après exécution réelle du workflow.
