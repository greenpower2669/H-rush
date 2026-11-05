# 🚀 Ash Rush — XY Collision Lab

**Prototype 0.2.1** · Jeu de tir spatial 2D jouable et laboratoire de collisions binaires.

Conception de l'approche de collision et idée du jeu : **Fabrice Gourdant**. Dépôt historique : `greenpower2669/H-rush` ; nom public du jeu : **Ash Rush**.

## Android 0.2.1 — APK test direct

[**AshRush-v0.2.1-debug.apk**](https://github.com/greenpower2669/H-rush/releases/download/v0.2.1-android-preview/AshRush-v0.2.1-debug.apk) : APK autonome, hors connexion, plein écran paysage, vaisseau à droite du premier doigt, deuxième doigt pour missiles. Package `fr.fab.ashrush`, versionCode 21. Compilation et signature debug v2 vérifiées par [GitHub Actions](https://github.com/greenpower2669/H-rush/actions/runs/42088822394). Pas encore testé sur téléphone réel ; la signature debug n'est pas une clé de mise à jour permanente.

## Jouer

Une **version autonome** `ash-rush-standalone.html` est également incluse : télécharger ce fichier et l’ouvrir directement dans un navigateur, même hors ligne.

Pour développer avec les modules JavaScript ES, démarrer un serveur local :

```bash
python3 -m http.server 8080
# Naviguer sur http://localhost:8080
```

Clavier : flèches ou ZQSD/WASD pour le déplacement ; espace pour tirer ; Échap pour mettre en pause. Téléphone : glisser le doigt sur l'aire de jeu et le maintenir pour tirer. Le score, la vie, le bouclier et une vague de boss sont présents. **Deuxième doigt**, touche `M` ou bouton 🚀 : missile à tête chercheuse, avec munitions et multiplicateur.

## Nouveautés 0.2 — localité, effets et audio

- Grille spatiale de proximité, calculée à chaque image : une munition n’examine que les cibles traversant son rectangle balayé ; la confirmation reste pixel-précise par masques binaires.
- Astéroïdes grignotés par impact : chaque exemplaire possède sa propre image Canvas, son masque mutable et ses projections recalculées uniquement sur les lignes et colonnes atteintes. Les cratères transparents suivent la collision, puis offrent un bonus quand l’objet est détruit.
- 5 bonus : tir multiple, amélioration missiles, soin, bouclier et zone protectrice (bouclier renforcé). Les dégâts et les étincelles suivent toujours les vrais pixels touchés.
- Web Audio synthétisé en direct : tirs, missiles, impacts, explosions, boucliers, dégâts, bonus et alerte du boss. Les sons sont autonomes, hors ligne, activables et réglables en volume ; l’audio est déverrouillé par geste utilisateur.
- Paysage recommandé sur mobile, multitouch pour missiles. Limite du DPR et retrait des ombres coûteuses pour alléger le GPU.

**Djipie** : catalogue audio privé consulté. Kenney (licence CC0 annoncée, provenance archive à revalider) et Sonniss (redistribution autonome interdite) ne sont pas recopiés dans ce dépôt public. Les effets sonores de cette version sont générés, originaux, et n’ont aucune dépendance au catalogue privé.

## Trois méthodes dans le laboratoire

- **A :** référence pixel par pixel, vérifiant les deux masques.
- **B :** intersection binaire dans la zone commune, deux mots `Uint32` par lot de 64 pixels. Le calcul pédagogique `(A | B) ^ (A ^ B)` correspond exactement à `A & B`.
- **C :** projections d'occupation sur X/Y, préfiltrage puis **obligatoirement** confirmation par le masque 2D.

Cliquer sur **🔬 Voir les collisions** pour afficher rectangles englobants, masques cyan, projections jaunes/vertes, zone 2D candidate, pixel d'impact rouge, coordonnées, nombres de blocs et de pixels, et coût de calcul. Cliquer sur **⏱ Comparer** pour rejouer les mêmes paires de sprites sur chaque méthode.

Les collisions calculent les pixels occupés du **même sprite réellement dessiné** (canal alpha), puis conservent les masques d'intersection sous forme de segments `{ x, y, bits }` ; `forEachImpact` permet d'énumérer *chaque* pixel touché. Un effet part d'un pixel actif sélectionné dans l'intersection, jamais du simple centre de la hitbox. Sa zone sur le sprite (`motor`, `wing`, `hull`) influence son rendu. Les projectiles sont sous-échantillonnés le long de leur trajectoire (pas <= 4 pixels logiques par vérification), pour limiter les traversées entre images.

**Précision :** 1 bit de masque = 1 pixel de la silhouette à sa **résolution logique native** (monde initial 960 × 540). Un écran à DPR élevé améliore le rendu mais **n'ajoute pas de détails au masque par magie**. Pour des sprites plus détaillés, générer leur raster/masque à une résolution logique plus grande (ou conserver un masque multirésolution), puis appliquer la même transformation à l'image, au masque et aux coordonnées de rendu. Un arrondi cohérent des positions est appliqué à l'affichage et au masque. La précision est donc « au pixel du sprite », pas nécessairement au pixel physique de l'écran.

## Tester

```bash
npm test
npm run build:standalone
```

Les tests comparent A/B/C à 100 scénarios déterministes aléatoires et à des bords de mots (31/32/63/64), offsets négatifs et faux positifs de projections. Les mesures du bouton « Comparer » sont indicatives ; elles ne démontrent pas à elles seules une supériorité asymptotique. `performance.now()` compte le coût d'algorithme et d'extraction sur l'appareil.

## Architecture

```
index.html         Page et commandes accessibles
style.css          Interface adaptative, contrastée
src/collision.js   Noyau autonome, projet réutilisable
src/game.js        Gameplay, sprites et FX localisés
tests/             Comparaison d'oracles
brainmap.md        Navigation dans la mémoire du projet
brain.md           Principes d'architecture
debughistorical.md Journal des validations et limites
todo.md            Prochaines étapes
ordres-de-mission.md Mission d'origine
```

## Connaissances et limites actuelles

- Projections X/Y : elles détectent seulement une condition **nécessaire** de contact. Croiser X et Y ne suffit pas pour conclure à l'intersection 2D.
- Le mode B lit des paires de blocs de 32 bits, soit **64 pixels par itération**, sans SIMD matériel explicite. BigInt, SIMD/Wasm, tuilage, cache dynamique et vraie destruction de silhouette restent à étudier.
- Le nombre de « blocs » correspond aux mots 32 bits vérifiés, pas aux paires 64 bits. Les compteurs de temps dépendent du navigateur, du matériel et de la charge.
- Prototype testé par 8 tests unitaires Node ; le gameplay mobile nécessite encore une validation sur appareils réels et des benchmarks à grande échelle.

Licence : **MIT**. Copyright © 2026 Fabrice Gourdant.
