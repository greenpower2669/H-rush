# Ash Rush — carte des mémoires vivantes

- `brain.md` : principes durables, invariants des coordonnées, architecture.
- `debughistorical.md` : tests réellement exécutés et limites constatées.
- `todo.md` : tâches futures, sans prétendre qu'elles sont achevées.
- `ordres-de-mission.md` : demande originale et critères de réussite.
- `README.md` : mode d'emploi et API de collision.

Le dépôt `H-rush` est le projet du jeu **Ash Rush**, pas PrimeMax et pas Djipie. Aucun changement aux mémoires des autres projets sans demande distincte.

## Modules OMEGA (0.4.0)
- `src/universe.js` : seed 128 bits, coordonnées infinies en pratique, identité des régions, profil, score et sauvegardes JSON.
- `src/omega-terrain.js` : géologie continue, tuiles visibles, cache RAM, parois oscillantes, AND/AND NOT et cicatrices durables.
- `src/omega-visuals.js` : atmosphères, arrière-plans de planètes et de cavernes.
- `src/ecology.js` : 20 archétypes paramétrés, combinaisons comportementales.
- `src/terrain.js` : ancien moteur de grotte 0.3 conservé pour tests, jamais chargé dans le gameplay OMEGA.
- `tools/clean-atlas.py` : nettoyage des fonds opaques résiduels des vraies planches.

- `src/hall.js` : classement local Top 10 des parties OMEGA, exporté avec le profil.
- `src/ecology.js` : variantes contextuelles des 20 archétypes selon monde, région et situation.

- `src/health.js` : convention OMEGA 0.4.3, cinq cœurs avec quatre PV chacun ; test de résistance indépendant du moteur AND.

- `src/obstacle-navigation.js` : placement, déplacement contrôlé, gestion des collisions avec le relief via le moteur `A & B`.
- `src/health.js` : règles séparées de cœurs/PV et seuils de dégâts.

- `src/tilt.js` : pilote capteur gravité Android, calibration, filtrage, sensibilité, priorité du tactile.
- `src/bonuses.js` : silhouettes des 20 bonus, masque AND calculé depuis l'alpha de chaque dessin.
- `assets/branding/` : iconographie officielle, écran d'accueil 16:9/9:16 ; ressources à empaqueter par GitHub Actions.

- `src/input.js` : calibrage tactile persistant, inversion X/Y et positionnement à droite du doigt.
- `src/tilt.js` : sélection tactile/inclinaison persistante, tactile par défaut, calibrage neutre.
- `src/bonuses.js` et `src/health.js` : 24 apparences, bonus ♥+ rare, plafond de 8 cœurs.

## OMEGA 0.4.6 — tiroirs d'implémentation
- `src/biomes.js` : les 12 signatures graphiques, géologiques et physiques des 40 familles de mondes.
- `src/damage.js` : cratères incandescents sur ennemis, sprites animés clonés individuellement et masques exacts.
- `src/omega-terrain.js` : dureté relative barres/sol, passage progressivement creusé, silhouette sans cadre.
- `src/sound.js` : son de charge coupé, sons de combat restants.

- `src/atmosphere.js` : enveloppe thermique visuelle de rentrée/sortie, aucun dégât de coque.
- `src/universe.js` (`PHASE_START`, `formatDuration`, `bestTime`) : régions prolongées, chronomètre et record de survie.
- `src/omega-visuals.js` : silhouettes de monuments ancrées sous la matte paysagère, parallax déterministe.

## OMEGA 0.4.8 — progression et perception d'altitude
- `src/difficulty.js` : directeur déterministe borné, formations, plafonds, récupération, phases de boss et extraction du meilleur score individuel.
- `src/game.js` : intégration de la pression, des décalages de formation, du boss multi-phases et du nouveau HUD SCORE/HIGH SCORE/TEMPS.
- `src/omega-visuals.js` : `visualEnvelope(stage)`, interpolation planète → atmosphère → surface → sortie, profondeur de parallaxe, disparition complète des monuments en espace profond.
- `tests/progression-048.test.js` et `tests/parallax-048.test.js` : seuils, stabilité, limites de densité et continuité des transitions.
- Ne jamais confondre les décors visuels avec les masques de collision `A & B` du `src/omega-terrain.js`.

## OMEGA 0.4.9 — correction orientation du capteur
- `src/tilt.js` : signes corrigés pour les rotations 90°/270° ; `tests/tilt.test.js` : déplacements physiques droite/bas sur les quatre orientations, avec calibrage neutre.
- `ash-rush-standalone.html` : copie autonome synchronisée, utilisée par l'APK ; package Android et sauvegarde compatibles avec 0.4.8.

## OMEGA 0.5.0 — météo, événements, portails
- `src/omega-events.js` : portails cachés, pluie/belts de roches, formation colonnes avec ouverture, fragments limités, déplacement inertiel/gravité/traînée ; `tests/omega-events-050.test.js` : oracles déterministes.
- `src/game.js` : sprites d'astéroïdes originaux à masque pixel, séquence warp 16s, retour de parcours, formations, projectiles variés, cap de charge ; `src/ecology.js` : mouvements/armes supplémentaires.

## OMEGA 0.5.1 — pilotage hélicoptère et sentinelles
- `src/hover-flight.js` : loi bornée du tangage, trajectoires laser/missile depuis nez, altitude/effets de poussée, caractéristiques et poursuite des sentinelles ; `tests/hover-flight-051.test.js` vérifie directions, absence de pluie gravitationnelle et masque alpha cohérent.
- `src/game.js` : cache de sprites réellement pivotés et collision AND synchronisée, direction de tir, panaches/dust capés, ennemis robotiques résistants sans mort au contact. `src/omega-events.js` : météo planète = sentinelles, météo espace = météores.

## OMEGA 0.5.2 — budget de trous et lumière
- `src/damage.js` : `burnHoleLimited`, limite cumulée 15% de pixels initiaux, rayon décroissant sur repère de 20% et chaleur croissante ; copies d'atlases et masques A & B strictement cohérents. `src/game.js` : impacts météores et robots limités, robots durables par PV. `tests/omega-052-thermal-budget.test.js` : séries d'impacts et rechargement de frames.

## OMEGA 0.5.3 — atmosphère en translation seule
- `src/omega-visuals.js` : `atmosphereGlobePosition(local,W,H)` calcule un globe de rayon fixe, déjà formé hors écran, translate droite→gauche de l'approche à la sortie, puis disparaît seulement quand son halo est totalement hors champ. `tests/omega-053-atmosphere-globe.test.js` : diamètre invariant, centres monotones, continuité aux seuils, absence de rendu hors champ et HTML autonome synchronisé.

## OMEGA 0.5.4 — cohérence horizon et rythme
- `src/omega-visuals.js` : sortie de la bulle après la terre, taille fixe et brouillard prolongé. `src/bonuses.js` : `bonusDropAllowed` et cadence plafonnée.
- `src/omega-events.js` : `warpExitWorld`, `offscreenSpawnX`, portails près du sol réel ; `src/game.js` : décor portail discret, retour espace, distribution clairsemée et colonnes derrière la géologie. `src/omega-terrain.js` : barrières dessinées derrière le vrai terrain.
- `tests/omega-054-visual-pacing.test.js` : géologie/halo, bonus, warp spatial, occultation, apparition hors écran et progression de la difficulté.

## OMEGA 0.5.5 — détourage et richesses des créatures
- `src/art.js` : `cleanFrameMatte` avant création des masques, suppression des fonds opaques rectangulaires par flood-fill bordé.
- `src/bestiary.js` : 49 ennemis morphologiques et 16 boss, peintres Canvas à silhouettes distinctes, cache 140, variantes 2 frames, boss 4 phases ; `src/ecology.js` : 52 rôles combattants, et `src/game.js` : attaches au relief / sauts et tirs différenciés.
- `tests/atlas-clean-055.test.js` et `tests/bestiary-055.test.js` : matte alpha, identité, sélections déterministes, contrôles boss/combat et intégration source/standalone.

## OMEGA 0.5.6 — visée tactile deux doigts
- `src/two-finger-aim.js` : `acquireTwoFingerTarget` (plafond/sol/air), `twoFingerAimPoint` (corrections X/Y), `twoFingerNoseShot` (vrai nez et vecteur dynamique), `guidedMissileVelocity`, sélection d'un pixel opaque survivant du masque AND.
- `src/game.js` : second `pointerId` autonome, missile initial, visée continue laser/missile, marqueur de cible visuel, relâchement, angle du projectile ±π sans changer l'inclinaison réelle du vaisseau ; `index.html` / HTML autonome documentent le geste.
- `tests/two-finger-aim-056.test.js` : 10 tests de comportement et géométrie ; 134/134 tests complets avec run GitHub Actions `42265215991`.


- **OMEGA 0.5.15 — `src/living-organics.js`** : FSM bornée des morceaux organiques coupés, secours par un voisin, réancrage et embuscade. `src/bestiary.js` : rendus organiques plus grands et vrai bras manquant dans l'alpha/masque AND. `src/omega-terrain.js` : colonnes rares (3–4 emplacements possibles sur 11 IDs), toutes sauvegardes intactes. Tests `tests/living-colony-065.test.js`, état/QA dans `todo.md`.


- **OMEGA 0.5.16 — organismes ancrés très résistants** : `src/living-organics.js` (`organicDurability`, `organicSurfaceY`) ; `src/bestiary.js` (12 poses organiques, `organicArmWave`, bulbes sous le bord rocheux) ; `src/game.js` (ancrage fixe sans éviction par sa propre roche). `tests/heavy-organic-066.test.js`, suivi QA dans `todo.md`.
