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
