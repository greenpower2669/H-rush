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
