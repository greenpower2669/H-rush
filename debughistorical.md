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

## 2026-11-06 — OMEGA 0.4.8, corrections préparées sur branche isolée
- Référence vérifiée : `main` HEAD `9bf5c0f`, Release `v0.4.7-immersion-preview` et APK ~13,97 Mo présents.
- Défaut 0.4.7 : `paintScenery` dessinait les bâtiments dès le début de la phase atmosphérique et jusqu'à la fin de sortie, sans filtre continu d'altitude ; arrière-plans semblant flotter dans l'espace.
- Correction 0.4.8 : enveloppes interpolées `surface/planet/atmosphere` via `PHASE_START`, étoiles conservées dans le ciel et monuments absents de l'espace profond, profondeur de parallaxe continue.
- Problème d'équilibrage : cadence spawn liée principalement à `wave` et hasard ; désormais directeur borné et formations ancrées dans la graine, restauration des HP et colis inchangée.
- Vérification de syntaxe de l'HTML autonome après concaténation : `new Function` a accepté le script complet ; collision de symbole `clamp` entre modules détectée puis évitée par renommage en `boundChallenge`.
- Tests Node, APK, mesures Samsung, captures navigateur de toutes les phases et signature : résultats à consigner après essais ; ne pas les déclarer réussis d'avance.

### Validation GitHub Actions 0.4.8 — 6 novembre 2026
- Run de référence : https://github.com/greenpower2669/H-rush/actions/runs/42212267579 — **succès complet** : 82/82 tests Node, contrôle de reconstruction exacte du HTML autonome, téléchargement/validation des 4 pistes CC0, compilation Gradle Debug, identification des ressources, `apksigner verify` v2 et publication dans la Release.
- APK : `HRush-Omega-v0.4.8-progression-parallaxe-debug.apk`, package `fr.fab.ashrush.omegaimmersion`, versionName `0.4.8`, versionCode `48`, SDK 26-35 déclaré ; environ 13,97 Mo ; signature Debug non assimilable à une clé de mise à jour pérenne.
- Release : https://github.com/greenpower2669/H-rush/releases/tag/v0.4.8-progression-parallaxe-preview — APK autonome et fichier SHA256SUMS.txt présents, anciennes Releases conservées.
- Limites : aucune validation visuelle avec captures comparatives dans un navigateur réel sur les cinq phases ni mesure FPS/RAM sur le Samsung physique au stade de cette compilation. La migration complète de cicatrices très anciennes doit aussi être éprouvée sur appareil.
- Plusieurs essais concurrents PR/push ont produit un échec trompeur de l'étape « publier » malgré une Release présente. Le workflow a été renforcé : publication uniquement sur push, PR réservée à la CI, exécutions concurrentes d'un même type annulées.

## 2026-11-06 — OMEGA 0.4.9, diagnostic et correctif des axes
- Retour utilisateur : gestes à l'inclinaison inversés en paysage. Constat dans `src/tilt.js` de 0.4.8 : les transformations ROTATION_90 et ROTATION_270 utilisaient les mauvais signes, et les anciens tests validaient cette inversion.
- Pour une gravité Android (X, Y) en axes physiques, coordonnée écran X droite / Y bas : rotation 90° = (Y, X) ; rotation 270° = (-Y, -X), sans altérer portrait 0/180. Correction écrite dans `src/tilt.js` et l'HTML autonome ; ajout des tests de déplacement physique droite/bas pour les quatre rotations.
- Validation GitHub Actions https://github.com/greenpower2669/H-rush/actions/runs/42215613968 : **succès** (tests Node, génération de standalone identique, musiques CC0, Gradle, APK, contrôle `apksigner`, version et ressources, publication). Release vérifiée https://github.com/greenpower2669/H-rush/releases/tag/v0.4.9-tilt-axes-preview ; asset direct `HRush-Omega-v0.4.9-tilt-fix-debug.apk`, taille **13 969 487 octets**, SHA-256 **106d763c165fdb5c1a6b7abd16b10d506e1e8d06059e89cdecce681e917f95ef**. Identifiant `fr.fab.ashrush.omegaimmersion`, code 49, nom 0.4.9. Test de gestuelle sur Samsung physique toujours en attente. Signature Debug susceptible de varier : attention à l'installation par-dessus une autre APK.

## 2026-11-06 — OMEGA 0.5.0, développement initial
- Retour de Fab : plus d'espèces et comportements, colonnes d'obstruction, pluie d'astéroïdes petits et grands, portail warp secret menant à une courte zone rapide, roches divisées en fragments ; débris lourds avec gravité près des planètes et trajectoires inertielles dans le vide.
- Traitement sur branche dédiée dérivée de 0.4.9 ; nouvelle famille de tests déterministes ; reproduction de la même collision `A & B` à partir des alpha du sprite. Portail temporaire sans avance du monde principal, aucune nouvelle propriété dans les JSON persistants.
- Physique fondée sur inertie en vide et pesanteur commune sous traînée fonction de masse ; formule ludique et non simulation orbitale (NASA Newton/drag : https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/newtons-laws-of-motion/ et https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/falling-object-with-air-resistance/).
- GitHub Actions `42220971930` : **succès complet**, 91 tests Node, HTML autonome synchronisé, musiques CC0, construction Gradle Debug, signature v2 `apksigner`, identifiant `fr.fab.ashrush.omegaimmersion`, versionCode 50, versionName 0.5.0, publication Release. URL directe https://github.com/greenpower2669/H-rush/releases/download/v0.5.0-ecologie-warp-preview/HRush-Omega-v0.5.0-ecologie-warp-debug.apk ; taille **13 974 539 octets** ; SHA-256 **64c8e1faf3d7d15b02941f6d5d04cf4cebd10ba9220566b3b4a585993410b25e**. Les tests sur Samsung physique (FPS, qualité/équilibre et signature de migration) demeurent à faire.

- Renforcement prépublication : abaisser les portails au-dessus de la limite géologique basse calculée à partir des familles, prévenir le verrou permanent du directeur de boss après un détour warp, et tester l'accessibilité géologique du portail sur 24 régions.

## 2026-11-06 — OMEGA 0.5.1, gravité et vol de rase-mottes
- Retour : plus de pluie de météores en gravité ; plutôt des astéroïdes-robots tueurs, résistants et sans explosion de mine au contact. Vaisseau piloté avec tangage nez vers le bas à l'avance / vers le haut au recul, projectiles alignés sur le nez ; effets de propulsion et poussière au-dessus du relief.
- Implémentation pure `src/hover-flight.js` (tangage exponentiel ±0,31 rad, visée géométrique, proximité au sol, sentinelles), cache d'images et de vrais masques alpha tournés par `src/game.js`, météo `sentry` de la physique gravitationnelle sans météores. Les anciennes ressources, sauvegardes JSON et collision AND sont préservées.
- Références d'inspiration physique : manuel de vol hélicoptère pour la mise en assiette https://www.cnatra.navy.mil/local/docs/pat-pubs/P-476.pdf ; NASA/Ames pour les nuages de poussière soulevés près du sol https://www.nas.nasa.gov/SC24/research/project06.php. Effet ludique visuel, non CFD ni simulation aérodynamique.
- **Validation réelle CI :** https://github.com/greenpower2669/H-rush/actions/runs/42223944592 — succès complet, **99/99 tests Node**, HTML autonome exact, ressources et musiques CC0 embarquées, Gradle APK Debug, contrôle `apksigner` v2 et `aapt` du package `fr.fab.ashrush.omegaimmersion`, version 0.5.1/code 51. **Release vérifiée :** https://github.com/greenpower2669/H-rush/releases/tag/v0.5.1-sentinelles-hover-preview ; APK autonome `HRush-Omega-v0.5.1-sentinelles-hover-debug.apk`, **13 977 999 octets**, SHA-256 **e6466ef6933924bcc3a028c9059f1ad13f2fa782b14788471aa19b63a640de3e**. Reste QA visuelle et FPS sur le Samsung physique, et compatibilité de mise à jour avec signature Debug variable.

## 2026-11-06 — OMEGA 0.5.2, réduction des trous et incandescence
- Retour utilisateur : les tirs retirent trop de matière des ennemis. Fixer d'abord un **maximum cumulé de 15%** des pixels opaques initiaux par ennemi (plage évoquée 5–15%), puis privilégier des trous plus petits et un halo plus lumineux quand on approche d'un repère thermique de 20% ; robots résistants.
- Implémentation : calcul préalable exact par `hasPixel`, disque réduit tant qu'il dépasserait le budget, `eraseDisc` et `clearRect` sur les mêmes pixels, lueur `source-atop` sans nouvel alpha ; cumul garanti séparément pour chaque frame de sprite. Réduction progressive du rayon, intensité dépendante de la proportion retirée ET des PV perdus. À saturation, coup conserve son effet sur les PV.
- **CI vérifiée :** GitHub Actions https://github.com/greenpower2669/H-rush/actions/runs/42228246873 — succès complet **104/104 tests Node**, contrôle du HTML autonome identique, Gradle APK signé Debug, `apksigner` v2, package `fr.fab.ashrush.omegaimmersion`, version 0.5.2 / code 52, médias CC0 contrôlés. Release : https://github.com/greenpower2669/H-rush/releases/tag/v0.5.2-incandescence-15pct-preview ; asset direct https://github.com/greenpower2669/H-rush/releases/download/v0.5.2-incandescence-15pct-preview/HRush-Omega-v0.5.2-incandescence-15pct-debug.apk, **13 979 311 octets**, SHA-256 **9cb2d417103666c274379c0eff6645075d210bd0793c69fe09a615032b8ba89c**. Reste validation esthétique et FPS sur téléphone Samsung et installation avec certificats Debug variables.

## 2026-11-06 — OMEGA 0.5.3, planète/bulle qui gonfle visiblement
- Retour de Fab : « La bulle d'atmosphère grandit et diminue, ça se voit ; la faire arriver et disparaître déjà grande, déjà positionnée ; la translation la fera apparaître/disparaître. »
- Diagnostic du code précédent : le rayon passait de `105` à `1345` pixels selon l'enveloppe `planet`, tandis que le centre et l'alpha variaient aussi. Cela produit un gonflement artificiel, notamment pendant l'approche et la sortie.
- Correctif : globe et halo de diamètre constant basés sur la largeur du viewport ; centre part plus à droite que le halo complet, translation monotone jusqu'à sa position scène puis translation à gauche à l'extraction. Tests numériques des seuils et du rayon et test de dessin. Aucun changement de la collision ou du format JSON.
- **CI vérifiée :** https://github.com/greenpower2669/H-rush/actions/runs/42231334713 — succès **109/109 tests Node**, HTML autonome synchronisé, Gradle APK Debug, `apksigner` v2, version 0.5.3/code 53, ressources et musiques CC0. Release : https://github.com/greenpower2669/H-rush/releases/tag/v0.5.3-atmosphere-translation-preview ; APK direct https://github.com/greenpower2669/H-rush/releases/download/v0.5.3-atmosphere-translation-preview/HRush-Omega-v0.5.3-atmosphere-translation-debug.apk ; **13 979 807 octets**, SHA-256 **cbfe7f200185d821c153976ee67218260ce2e44d0796df5b8877d48a073272a6**. Reste une QA visuelle réelle de transitions, FPS et installation Samsung ; clé Debug susceptible de changer.

## 2026-11-06 — consolidation `main`, Release officielle v0.5.3
- Autorisation explicite de Fab : fusionner et publier maintenant. PR https://github.com/greenpower2669/H-rush/pull/6 retargetée de la branche 0.5.2 vers `main` car elle inclut l'intégralité des évolutions cumulées 0.4.8→0.5.3 ; merge GitHub `c8f1f855a4eb8ff0bdc12e2fa8f65bce4da58dc4` confirmé. Version 0.4.7 de référence avant fusion : `9bf5c0f252c601829237ec6169a1c799f447f9b5`.
- Workflow amendé pour publier le tag non-préversion `v0.5.3` sur `main` et conserver les tags `-preview` sur les branches de développement.
- GitHub Actions **succès complet** : https://github.com/greenpower2669/H-rush/actions/runs/42239384805, tests 109/109, reconstruction autonome, compilation/signature v2 APK Android, versionName 0.5.3/code 53, ressources et son vérifiés.
- Release officielle : https://github.com/greenpower2669/H-rush/releases/tag/v0.5.3 (prerelease=false). APK autonome direct de **13 979 807 octets**, SHA-256 **f1065958d3603e637bffa50145ca4f725c25de92acae8023fa0e2d8ad8625825**. L'APK reste signée Debug, donc aucune garantie de compatibilité d'installation sur une version préexistante à certificat différent ; sauvegarder l'univers via JSON avant désinstallation. Tests réels Samsung non réalisés.

## 2026-11-06 — OMEGA 0.5.4, correction d'après retour terrain
- Retour de Fab : atmosphère qui se termine avant les terres, trop de bonus, portails trop visibles et retour sur la planète, colonnes mouvantes surgissant au premier plan. Difficulté progressive jugée satisfaisante, à conserver.
- Causes identifiées : départ de la bulle à `exit-900` et fin avant le sol ; gain de bonus quasi systématique des fragments ; portail flottant à altitude arbitraire 136–228 affiché en surimpression ; barres géologiques dessinées après les tuiles ; nouveaux ennemis formés juste à droite du bord écran.
- Modifications : bulle à rayon fixe visible après `spaceTail`, brouillard décroissant seulement en fin de région ; récompenses à cadence/probabilité plafonnées ; entrée warp en alcôve reliée au véritable sol et sortie dans l'espace de la région suivante ; dessin des colonnes et barres derrière les tuiles alpha du terrain. Le saut warp est une progression de distance assumée, sans perte des cicatrices ni de l'identité 128 bits.
- **CI vérifiée :** https://github.com/greenpower2669/H-rush/actions/runs/42249472579 — **116/116 tests Node réussis**, reconstruction exacte HTML, Gradle Android Debug, validation package et version 0.5.4/code 54, signature v2 `apksigner`, musiques CC0 et publication Release. Préversion https://github.com/greenpower2669/H-rush/releases/tag/v0.5.4-pacing-atmosphere-warp-preview ; APK direct https://github.com/greenpower2669/H-rush/releases/download/v0.5.4-pacing-atmosphere-warp-preview/HRush-Omega-v0.5.4-pacing-atmosphere-warp-debug.apk ; **13 981 163 octets**, SHA-256 **4af9673ad70ba2fd97d7d6cbdb06046c6dc551496ff3d4630f9d30d160ed8bbd**. QA sur Samsung et éventuelle signature de mise à jour restent à vérifier. PR de travail #7 non fusionnée.

## 2026-11-06 — OMEGA 0.5.5 : bord rectangulaire visible et diversité insuffisante
- Capture Samsung fournie par Fab : certaines images de vaisseaux montrent un cadre d'illustration. Hypothèse technique : arrière-plan résiduel opaque sur une sous-frame de l'atlas `assets/sprites/atlas.png`, malgré le nettoyage historique des zones bleu marine par `tools/clean-atlas.py`. Sans l'image source de la frame isolée sous contrôle matériel, ne PAS prétendre que toute trace est définitivement éliminée ; la correction traite les fonds connectés aux coins et le bleeding interframes.
- Correction runtime dans `src/art.js` : graine depuis coins opaques (>=3), couverture d'opaque sur le bord >=64%, propagation chromatique locale bornée, alpha remis à zéro et `maskFromImageData` calculé ensuite depuis les mêmes pixels. Préserve les silhouettes intérieures aux limites chromatiques ; tests synthétiques fond dégradé / transparence / sprite en coin.
- Extension bestiaire : 52 rôles écologiques, 49 morphologies de troupes et 16 grands boss (plusieurs familles géométriques), boss avec types de tir changeant en phase, racines/tentacules suspendues, worms sauteurs et unités au sol. Dessins procéduraux Canvas offline ; pas de nouvel atlas HD. Cache de frames limité pour RAM.
- Premier CI de PR #8 refusé, car variable globale `clamp` du bestiaire en collision avec celle du jeu dans l'HTML autonome ; changement en `bestiaryClamp` puis nouvelle reconstruction du standalone.
- **Validation CI réussie** : https://github.com/greenpower2669/H-rush/actions/runs/42254515405 — **124/124 tests**, HTML autonome reconstruit identique, Android Gradle APK Debug version 0.5.5/code55, signature vérifiée, musique/branding contrôlés. APK asset officiel en **préversion** : https://github.com/greenpower2669/H-rush/releases/tag/v0.5.5-bestiary-alpha-preview ; binaire direct https://github.com/greenpower2669/H-rush/releases/download/v0.5.5-bestiary-alpha-preview/HRush-Omega-v0.5.5-bestiary-alpha-debug.apk ; **13 989 503 octets**, SHA-256 **1cded1715110967f6965eaceaa9b2069440b113a97281b56d0a057a96efc19b9**. QA visuelle réelle Samsung et contrôle long FPS/RAM non effectués.

## 2026-11-06 — OMEGA 0.5.6, visée seconde main
- Question Fab : les racines/tentacules suspendus et worms sauteurs sont-ils vraiment présents ? Oui : morphologies `root`, `vine`, `tentacle` au plafond et `worm` au sol intégrées en 0.5.5. Mais 0.5.5 utilisait le deuxième doigt exclusivement pour tirer un missile, sans viser les lasers.
- Souhait 0.5.6 : doigt sous l'ennemi du plafond / au-dessus du sol, tir vectoriel depuis le nez vers la cible. Ajustement horizontal des cibles fixes au plafond/sol, vertical pour les ennemis aériens, angle recalculé à chaque déplacement du joueur. Conservation de la gestuelle missile et de l'autofire au premier doigt.
- Correctif : `two-finger-aim.js` avec 2 `pointerId` indépendants, cible verrouillée et mise à jour à sa position vivante, recherche du **pixel alpha opaque survivant** (et cache réinvalidé après AND NOT), rayon depuis le nez, missile guidé progressivement et guide graphique non-collisionnel. Tirs peuvent pivoter à ±π ; vrai masque de chaque frame pivotée fourni au test AND. 10 nouveaux tests et 124 historiques.
- Premier workflow push `42264951082` : **133/133 tests et APK Gradle Debug validés, mais publication GH CLI échec syntaxique** `unexpected EOF while looking for matching quote`, une guillemet de trop dans `--notes`. Corrigé dans le YAML puis test additionnel pour déclencher un nouveau push ; **run final réussi** : https://github.com/greenpower2669/H-rush/actions/runs/42265215991 (**134/134 tests**, standalone HTML byte-à-byte identique, APK Android versionName 0.5.6/code56, signature v2, package `fr.fab.ashrush.omegaimmersion`, médias et musique présents, Release publiée).
- Préversion : https://github.com/greenpower2669/H-rush/releases/tag/v0.5.6-double-touch-aim-preview ; APK direct https://github.com/greenpower2669/H-rush/releases/download/v0.5.6-double-touch-aim-preview/HRush-Omega-v0.5.6-double-touch-aim-debug.apk, **13 992 583 octets**, SHA-256 **909ff6c14f0815d5ef7435e66ae86b277711fef9e492fa2ab28abef2a238c048**. PR #9 brouillon vers main, non fusionnée ; tests Samsung réels restant ouverts. Certificat Debug peut différer de la version installée, préserver JSON.


## 2026-11-06 — OMEGA 0.5.8 double tap et refonte graphique
- Source : nouvelle branche issue de 0.5.7, PR #12 en brouillon. main non modifiée.
- Gestes premier et second doigts : reconnaissance de double tap en 320 ms, garde-fous déplacements et anti-double missile ; second doigt conserve la visée.
- 49 ennemis et 16 boss retouchés avec détails et palettes de famille. Biseau uniquement RGB et masque AND produit sur la même ImageData ; visuel des aéronefs inversé vers le joueur.
- Tests : deux premières itérations CI ont décelé deux assertions historiques à réviser, puis deux commentaires divergents dans le HTML autonome. Correction par vérification des invariants et synchronisation du bundle.
- Validation finale : https://github.com/greenpower2669/H-rush/actions/runs/42272382589 ; 152 tests réussis, Android Debug 0.5.8/code58, signature et bundle vérifiés.
- APK direct : https://github.com/greenpower2669/H-rush/releases/download/v0.5.8-double-tap-bestiary-preview/HRush-Omega-v0.5.8-double-tap-bestiary-debug.apk ; 14 000 499 octets ; SHA256 2d01be8dc4f8042272ad2f1ba25b2d07b4af81c81cc1505db09c152ab9f21fd2.
- QA encore ouverte : vrais gestes Samsung, résultat esthétique, FPS/RAM, mises à jour de signature et conservation des sauvegardes.


## 2026-11-06 — H-RUSH OMEGA 0.5.9 : crash Android intermittent
- Retour joueur : « Le jeu crash parfois » ; sans logs Samsung, la cause précise n'est pas confirmée.
- Cause évitable identifiée dans le code Android 0.5.8 : aucune implémentation `WebViewClient.onRenderProcessGone` (Android 26+), ce qui permet à un renderer WebView tué ou planté d'entraîner l'application entière. Source technique officielle : https://developer.android.com/develop/ui/views/layout/webapps/handle-termination.
- Correctif : retirer/détruire l'ancienne WebView après arrêt du renderer, relancer une instance une fois, puis écran natif « Réessayer » si deux incidents en 90 s ; logcat natif et préférences pour le motif, mode RAM réduit après incident. Aucune permission INTERNET.
- Boucle JS `requestAnimationFrame` protégée : erreurs enregistrées localement (`ashrush-runtime-error-v1`), arrêt de la boucle fautive et diagnostic copiable via l'écran d'erreur ou menu Univers ; collecte des erreurs console Android sans envoi distant.
- Économie des Canvas : copies d'ennemis blessés marquées `volatileDamage` pour plafonner à 4 rotations par source, 20 pour les sources immuables ; réutiliser image/masque lors d'une orientation et frame inchangées. L'alpha des masques ET/AND et les cicatrices persistent.
- Validation contrôlée GitHub Actions : [run 42275912875](https://github.com/greenpower2669/H-rush/actions/runs/42275912875) pour tests, HTML et compilation (publication ignorée en PR), puis [run final 42276249897](https://github.com/greenpower2669/H-rush/actions/runs/42276249897) succès avec publication. 155/155 tests, Android APK Debug 0.5.9/code 59, signature/package et ressources vérifiées.
- [Prérelease](https://github.com/greenpower2669/H-rush/releases/tag/v0.5.9-crash-recovery-preview) ; [APK direct](https://github.com/greenpower2669/H-rush/releases/download/v0.5.9-crash-recovery-preview/HRush-Omega-v0.5.9-crash-recovery-debug.apk), 14 004 531 octets, SHA-256 7d1c4bbe2f4bacf9f64117f0b55ab28fafdc79acba53a71d73597154a174df31 selon le digest de l'asset GitHub.
- Tests de longue durée sur Samsung et repro du crash encore ouverts ; si persistance, demander un export du diagnostic et le moment (combat, démarrage, retour d'arrière-plan). APK autonome sans AAB, branche corrective non fusionnée dans main.


## 2026-11-06 — H-RUSH OMEGA 0.5.10 : tirs zigzag et autofocus forcé
- Signal utilisateur : lasers/missiles affichant occasionnellement un changement de cap (« zigzag »), sans autofocus souhaité.
- Diagnostic du code v0.5.9 : `twoFingerAimPoint` verrouillait/reprenait automatiquement une cible au second doigt, y compris pour les tirs laser successifs. `advanceMissile` retouchait le `vy` du projectile chaque image pour aller vers l'ennemi le plus proche, **même sans lockTarget** : la trajectoire d'un missile était intrinsèquement courbe/irrégulière.
- Correction 0.5.10 : chaque projectile conserve son vecteur après départ tant que le joueur n'a pas explicitement activé l'autofocus ; le deuxième doigt vise ses coordonnées physiques sans accrochage ni suivi d'ennemi. Le guidage historique demeure disponible exclusivement derrière la case `🌌 Univers → Commandes → Autofocus`, OFF par défaut, préférences localStorage `ashrush-autofocus-v1` (`on` ou `off`) ; une vieille installation sans clé ne l'active pas.
- Le comportement du missile est fixé à son lancement (`autoGuide:autofocusEnabled`) : modifier l'option n'oriente pas rétroactivement les projectiles déjà partis. Masques alpha A & B, double-tap, collisions, sauvegarde et protections WebView 0.5.9 inchangés.
- Contrôle : tests unitaires sur la conservation du vecteur face à une cible mouvante, le ciblage facultatif, l'état initial des préférences, l'option HTML et le bundle Android. Une ancienne assertion structurelle 0.5.6 attendait toujours `guidedMissileVelocity` dans `game.js` et a été mise à jour pour le nouvel intercepteur `missileAutofocusVelocity` (première CI : 1 échec uniquement sur cette assertion). CI suivante : [42299088386](https://github.com/greenpower2669/H-rush/actions/runs/42299088386) **161/161 tests**, HTML autonome reconstruit identique, signature/Android Gradle vérifiés, publication préversion réussie.
- [APK 0.5.10 direct](https://github.com/greenpower2669/H-rush/releases/download/v0.5.10-manual-aim-preview/HRush-Omega-v0.5.10-manual-aim-debug.apk) 14 005 631 octets, empreinte SHA-256 disponible dans `SHA256SUMS.txt` joint à la Release. [PR #14](https://github.com/greenpower2669/H-rush/pull/14) en brouillon, aucun merge main. Tests réels Samsung à confirmer.

## 2026-11-06 — H-RUSH OMEGA 0.5.11 : missile au premier contact du deuxième doigt
- **Reproduction par lecture du code v0.5.10** : `TouchMissileGestures.down(id,'secondary',point,time)` retournait `true` à la première pose, donc le gestionnaire `pointerdown` exécutait immédiatement `launchMissile()`, avant même un double-tap ; ce comportement était délibérément conservé depuis la 0.5.6, mais contraire au contrôle validé ensuite.
- **Solution** : supprimer le tir dans `pointerdown`; `down` enregistre les deux rôles et renvoie toujours `false`. `up` ne renvoie `true` qu'au deuxième relâchement rapide validé du même rôle, premier ou second doigt. Déplacement trop grand, appui long, `pointercancel` et `lostpointercapture` ne tirent pas. Les `pointerId` Android successifs peuvent varier : l'historique court est par rôle.
- **Préservation** : second doigt toujours libre pour orienter les lasers, autofocus OFF sauf option, double-tap premier doigt, collisions AND, bruitages, sauvegardes, stabilisation WebView 0.5.9.
- **Validation** : [GitHub Actions 42302055667](https://github.com/greenpower2669/H-rush/actions/runs/42302055667), 163/163 tests, bundle Android identique aux sources, signature/package et ressources présents ; [APK direct v0.5.11](https://github.com/greenpower2669/H-rush/releases/download/v0.5.11-double-tap-only-preview/HRush-Omega-v0.5.11-double-tap-only-debug.apk) (14 005 659 octets lors de la première livraison, SHA256SUMS.txt fourni). Tests physiques Samsung encore nécessaires. PR #15 en brouillon, aucune fusion main.


## 2026-11-07 — H-RUSH OMEGA 0.5.12 : crash reproductible sur apparition astéroïde (téléphone)
- Diagnostic du joueur : `2026-11-07T10:52:20.692Z`, `origin: animation`, `TypeError: Cannot read properties of null (reading 'anchor')` dans `morphMovement` (HTML Android ligne 1627), appelée par `spawnEnemy` (ligne 3548), puis `update` et `frame`. Région 2, phase `space`, 2 ennemis et 17 projectiles. `safeGraphics:false` n'établit aucun problème de RAM.
- Cause localisée : `spawnEnemy(kind='asteroid',species)` crée volontairement un sprite rocheux sans `morph` ; `morph?.anchor!=='air'` évaluait `true` même lorsque `morph===null`, puis appelait `morphMovement(null)`, qui accédait à `profile.anchor`. Ni les projectiles ni le mécanisme de tir n'étaient à l'origine de cette exception.
- Fix : `spawnMovement(morph,species.movement)` distingue correctement absence de morphologie (respect des valeurs `slow` ou `wave` des espèces astéroïdes), aérien (conserve mouvement écologique), sol et plafond (mouvement morphologique). `morphMovement(null)` possède aussi un garde-fou générique qui évite l'arrêt complet de la boucle si un autre appelant est ajouté plus tard.
- Tests : invocation réelle isolée de `spawnEnemy` en environnement contrôlé, région 2 espace, pour les deux espèces astéroïdes ; couverture toutes morphologies et phases / vérification de l'HTML autonome, plus suite existante. La simulation n'est pas une mesure FPS ni un test matériel Android.
- Branche `fix/omega-062-null-morph-spawn-20261107` depuis la 0.5.11 ; conservés : missiles exclusivement double-tap, autofocus opt-in, protections WebView et moteur de collision AND. Validation GitHub Actions [42366251548](https://github.com/greenpower2669/H-rush/actions/runs/42366251548) : **167/167 tests**, HTML autonome reconstruit identique, APK Android Debug 0.5.12/code 62 signé et ressources vérifiées. Prérelease [APK direct](https://github.com/greenpower2669/H-rush/releases/download/v0.5.12-null-morph-crashfix-preview/HRush-Omega-v0.5.12-null-morph-crashfix-debug.apk), fichier `SHA256SUMS.txt` joint. Tests réels Samsung encore nécessaires ; aucune fusion dans main.


## 2026-11-07 — OMEGA 0.5.13 : nouvelle couche organique et colonnes résistantes
- Demande : racines vivantes surgissant du sol, tentacules réellement pendus au plafond, colonnes verticales oscillantes sensiblement plus difficiles à détruire, plus variété cauchemardesque.
- Diagnostic du code : les morphes `root` appartenaient jusque-là à `ceilingShapes` ; les morphes organiques ne possédaient que deux images et avaient une base identique au plafond. Les portes mobiles utilisaient le rayon de cratère standard, peu de différence de résistance avec la roche ordinaire.
- Correction : `root` désormais ancré au sol ; `tentacle` et `vine` conservent `ceiling`. La géométrie Bézier organique est véritablement redessinée par six poses distinctes avec courbure, longueur et signal lumineux variables ; `spriteForMorph` reconstruit le masque AND depuis les mêmes pixels RGBA. Les organiques partagent une coordonnée monde X fixe qui défile avec la planète, leur base reste liée à la roche.
- Variété : huit nouvelles morphologies normales et deux boss racines/tentacules ; éléments anatomiques (veines, ventouses, crocs, yeux, bouche) peints dans la même alpha physique.
- Colonnes : amplitude `gateY` accrue ; `gateHardness` de 1.7 à 3.1, `hardenedGateCraterRadius` utilise le même rayon pour effacer l'alpha et persister les marques. IDs historiques et sauvegardes inchangés. Formations d'astéroïdes `column` passent à 3.2 × PV avec limite 95 ; pas de nouvelles propriétés de sauvegarde.
- CI [42369812217](https://github.com/greenpower2669/H-rush/actions/runs/42369812217) **173/173 tests réussis**, HTML autonome reconstruit sans différence, signature et ressources APK Android 0.5.13/code 63 vérifiées. [APK direct publié](https://github.com/greenpower2669/H-rush/releases/download/v0.5.13-organic-nightmare-preview/HRush-Omega-v0.5.13-organic-nightmare-debug.apk). **Aucune mesure réelle Samsung ni validation artistique et FPS encore effectuée** ; l'augmentation d'armor et les nouvelles poses nécessitent un test appareil. Aucune fusion dans main.


## 2026-11-07 — OMEGA 0.5.14 : suppression des colonnes flottantes / mines robotiques
- Signalement : la partie haute de colonnes mobiles apparaissait à l'air libre lorsqu'elles descendaient ; certaines semblaient également apparaître en espace ouvert sans paysage. Demande complémentaire : petites mines explosives très résistantes, couleur de l'avertissement suivant puissance croissante blanc → jaune → orange → rouge, luminosité et vibration renforcées.
- Cause trouvée : les huit portes supplémentaires avaient une hauteur 110–320px seulement, leur base verticale ne garantit pas l'enfouissement maximal ; leurs positions étaient calculées indépendamment de la présence d'une véritable toiture/fondation et certaines tombent en atmosphère/sortie. Le directeur de vagues `obstructionColumn` créait par ailleurs une formation de roches en plein vide spatial.
- Correction : `gateSpec` vérifie la phase et l'existence de sol/plafond, place le côté d'ancrage à au moins une marge enterrée sur toute l'oscillation, ajoute une jonction décorative rendue sous les véritables pixels du paysage ; supprime les `obstructionColumn` générées par le directeur de rencontres. Les portes historiques conservent leurs IDs (et dimensions des trois premiers types) ; attention à l'aspect des anciennes cicatrices dans une colonne qui change de pose verticale.
- Mines : nouveau module pur `src/robot-mines.js` avec quatre classes de puissance et HP 14–55, rayon 44–104, quatre modes et délai d'activation. Sprites Canvas mécaniques (~38–44px), pixels alpha exacts/mutables, noyau lumineux, halo, vibrations en coordonnées physiques ; détonation déclenchée par impact, contact ou fin du compte à rebours ; collision de souffle par masque circulaire AND avec la silhouette du vaisseau et bouclier/invulnérabilité préexistants.
- Densité bornée à trois mines actives, cache de quatre masques d'explosion, pas de nouvelle clé dans l'export JSON. Tests automatiques ajoutés ; **pas encore de test perceptif ou de benchmark FPS réel sur Samsung**.
