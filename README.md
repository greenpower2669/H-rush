# 🚀 Ash Rush — XY Collision Lab

**Prototype 0.3.0** · Jeu de tir spatial 2D jouable et laboratoire de collisions binaires.

Conception de l'approche de collision et idée du jeu : **Fabrice Gourdant**. Dépôt historique : `greenpower2669/H-rush` ; nom public du jeu : **Ash Rush**.

## Jouer

**Version 0.3 : vraies planches et galeries rocheuses.** Une planche **PNG 1024 × 1120** réunit **23 sprites** réellement extraits des planches d'Ash Rush (créées pour le jeu) : joueur 4 frames, éclaireur 4, manta 4, boss, astéroïde 5 phases, missiles 2, effets 2 et bouclier. Le raster dessiné et le masque de collision proviennent **exactement des mêmes pixels alpha**. La version autonome intègre cet atlas dans son HTML et l'APK l'embarque aussi en PNG.

### Décor destructible et permanent

- Au bout d'environ **9 secondes**, le vaisseau entre dans un astéroïde géant. La galerie occupe une partie des cycles de jeu, puis l'espace redevient libre. Évite les parois : **une collision du vaisseau avec une paroi tue immédiatement**, même avec bouclier ; tire pour creuser.
- Les parois sont découpées en **32 tuiles de 128 × 540 pixels**, créées au besoin et conservées en mémoire. La première phase est une **hitbox des tuiles voisines** ; la confirmation a lieu par **AND sur les pixels réellement opaques**.
- Les tirs creusent de petits cratères, les missiles des cratères plus larges. Le moteur utilise `AND NOT` sur le masque **et efface les mêmes pixels du Canvas**. Des bords incandescents dessinent l'excavation. Le forage rapporte des points et parfois des bonus.
- Chaque forage est ajouté à une liste `{X,Y,rayon}` et sauvegardé dans le `localStorage` Android/WebView (`ashrush-cavern-damage-v1`) **au moment de l'impact**. Les tuiles sont reconstruites avec ces dégâts après fermeture, relance ou retour dans la galerie. La sauvegarde reste propre à cette installation d'application : la version test 0.3 s'installe à côté de la 0.2.
- Le système conserve une référence pixel par pixel **uniquement pour les tests**. Pendant le jeu, seule la méthode **AABB → AND XY** fonctionne ; les anciens sélecteurs et boutons laboratoire ne reviennent pas.

**Important :** les 23 images de la planche sont un atlas de **référence artistique rasterisée** ; leur taille logique et leur masque sont alignés. Les contours dessinés et les dégâts du terrain utilisent la même discrétisation. La fluidité et l'ergonomie sur smartphone doivent encore être validées réellement.


Une **version autonome** `ash-rush-standalone.html` est également incluse : télécharger ce fichier et l’ouvrir directement dans un navigateur, même hors ligne.

Pour développer avec les modules JavaScript ES, démarrer un serveur local :

```bash
python3 -m http.server 8080
# Naviguer sur http://localhost:8080
```

Clavier : flèches ou ZQSD/WASD pour le déplacement ; espace pour tirer ; Échap pour mettre en pause. Téléphone : glisser le doigt sur l'aire de jeu et le maintenir pour tirer. Le score, la vie, le bouclier et une vague de boss sont présents. **Deuxième doigt**, touche `M` ou bouton 🚀 : missile à tête chercheuse, avec munitions et multiplicateur.

## Nouveautés 0.2.2 — collision AND, Android, paysage et contrôle décalé

- Le vaisseau se positionne à droite du doigt principal (+88 pixels logiques), avec les bords du terrain protégés. Le deuxième doigt déclenche toujours les missiles.
- Mise en page paysage immersive sur smartphone (HUD compact, commandes accessibles).
- Wrapper Android WebView local, orientation `sensorLandscape`, sans permission INTERNET : `android-app/` (aperçu 0.2.2 sous identifiant de paquet parallèle).
- Workflow GitHub Actions pour compiler, vérifier la signature debug et publier un fichier APK direct **si les autorisations le permettent**. APK de test signé debug, pas Play Store ; ne pas annoncer publié tant que la Release n’est pas vérifiée.

### Migration du calcul binaire

- B et C intersectent directement les masques avec **AND**, par blocs de 32 bits (deux mots par boucle, jusqu’à 64 pixels) après AABB ; le mode C conserve le préfiltre X/Y sans le confondre avec une preuve 2D.
- `capture` accumule le nombre et les coordonnées des bits actifs en **un seul parcours** ; segments `{x,y,bits}` conservés pour les FX.
- Les cratères utilisent `rows[word] &= ~removalBits` (**AND NOT**), puis actualisent les projections des seules rangées/colonnes touchées.
- `benchmarks/legacy-xor.mjs` conserve uniquement le moteur historique pour les mesures comparatives et n’est jamais chargé par le jeu.
- `npm run bench` compare les deux noyaux dans Node sur des masques préconstruits : microbenchmarks indicatifs, **pas** une mesure FPS/Android.
- Le paquet Android de test 0.2.2 utilise un identifiant **parallèle** `fr.fab.ashrush.preview` pour éviter d’écraser la 0.2.1 signée par une autre clé Debug CI. La signature stable de production reste à établir.

## Nouveautés 0.2 — localité, effets et audio

- Grille spatiale de proximité, calculée à chaque image : une munition n’examine que les cibles traversant son rectangle balayé ; la confirmation reste pixel-précise par masques binaires.
- Astéroïdes grignotés par impact : chaque exemplaire possède sa propre image Canvas, son masque mutable et ses projections recalculées uniquement sur les lignes et colonnes atteintes. Les cratères transparents suivent la collision, puis offrent un bonus quand l’objet est détruit.
- 5 bonus : tir multiple, amélioration missiles, soin, bouclier et zone protectrice (bouclier renforcé). Les dégâts et les étincelles suivent toujours les vrais pixels touchés.
- Web Audio synthétisé en direct : tirs, missiles, impacts, explosions, boucliers, dégâts, bonus et alerte du boss. Les sons sont autonomes, hors ligne, activables et réglables en volume ; l’audio est déverrouillé par geste utilisateur.
- Paysage recommandé sur mobile, multitouch pour missiles. Limite du DPR et retrait des ombres coûteuses pour alléger le GPU.

**Djipie** : catalogue audio privé consulté. Kenney (licence CC0 annoncée, provenance archive à revalider) et Sonniss (redistribution autonome interdite) ne sont pas recopiés dans ce dépôt public. Les effets sonores de cette version sont générés, originaux, et n’ont aucune dépendance au catalogue privé.

## Trois méthodes dans le laboratoire

- **A :** référence pixel par pixel, vérifiant les deux masques.
- **B :** intersection binaire dans la zone commune, deux mots `Uint32` par lot de 64 pixels. Le moteur effectue directement `A & B` sur chacun des deux mots `Uint32` et conserve les bits communs pour récupérer leurs coordonnées. Les doubles XOR appartenaient à une ancienne technique de tampon graphique, documentée dans `benchmarks/legacy-xor.mjs` uniquement.
- **C :** projections d'occupation sur X/Y, préfiltrage puis **obligatoirement** confirmation par le masque 2D.

Cliquer sur **🔬 Voir les collisions** pour afficher rectangles englobants, masques cyan, projections jaunes/vertes, zone 2D candidate, pixel d'impact rouge, coordonnées, nombres de blocs et de pixels, et coût de calcul. Cliquer sur **⏱ Comparer** pour rejouer les mêmes paires de sprites sur chaque méthode.

Les collisions calculent les pixels occupés du **même sprite réellement dessiné** (canal alpha), puis conservent les masques d'intersection sous forme de segments `{ x, y, bits }` ; `forEachImpact` permet d'énumérer *chaque* pixel touché. Un effet part d'un pixel actif sélectionné dans l'intersection, jamais du simple centre de la hitbox. Sa zone sur le sprite (`motor`, `wing`, `hull`) influence son rendu. Les projectiles sont sous-échantillonnés le long de leur trajectoire (pas <= 4 pixels logiques par vérification), pour limiter les traversées entre images.

**Précision :** 1 bit de masque = 1 pixel de la silhouette à sa **résolution logique native** (monde initial 960 × 540). Un écran à DPR élevé améliore le rendu mais **n'ajoute pas de détails au masque par magie**. Pour des sprites plus détaillés, générer leur raster/masque à une résolution logique plus grande (ou conserver un masque multirésolution), puis appliquer la même transformation à l'image, au masque et aux coordonnées de rendu. Un arrondi cohérent des positions est appliqué à l'affichage et au masque. La précision est donc « au pixel du sprite », pas nécessairement au pixel physique de l'écran.

## Tester

```bash
npm test
npm run build:standalone
npm run bench
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
- Prototype testé par 13 tests unitaires Node ; le gameplay mobile nécessite encore une validation sur appareils réels et des benchmarks à grande échelle.

Licence : **MIT**. Copyright © 2026 Fabrice Gourdant.

---

## 🌌 OMEGA 0.4.0 — premier socle de l'univers personnel (5 novembre 2026)

**Il s'agit d'une étape jouable, et non de la réalisation de toutes les ambitions OMEGA.** Les versions 0.3.0 et précédentes restent accessibles dans GitHub Releases.

### Le monde qui t'appartient

- Au premier lancement, `crypto.getRandomValues` crée **16 octets aléatoires (128 bits)** ; la graine reste dans le stockage local de l'application. Elle est affichée sous **🌌 Univers** et peut être exportée/restaurée au format JSON. Sans disponibilité du générateur cryptographique, l'application refuse de créer une fausse graine prétendument sécurisée.
- Une même graine et les mêmes coordonnées produisent les mêmes **régions, famille visuelle, relief, barrières, fréquence et phase des parois oscillantes**. Le générateur utilise SplitMix64 avec `BigInt` et des dérivations sur les coordonnées ; deux graines produisent statistiquement des mondes différents.
- Chaque région de 5 120 unités suit une **progression de gameplay** espace → atmosphère → surface (rase-mottes) → profondeur minérale → sortie vers l'espace. La génération se poursuit en coordonnées croissantes sans longueur prédéterminée, dans les limites numériques de JavaScript. Il ne s'agit pas encore d'une exploration planétaire libre dans plusieurs directions.
- Les **40 familles de mondes** sont des identités procédurales (palettes, tonalités, reliefs et nom) ; les 40 environnements artistiques complets restent à produire.
- Les **20 archétypes** disposent de profils paramétrés de vitesse, vie, armes, couleur et mouvement (poursuite, zigzag, serpent, patrouille, etc.), utilisant provisoirement les mêmes planches de base : leurs sprites distinctifs et comportements sociaux avancés restent à réaliser.

### Terrain vivant et collision fidèle

- Tuiles de roche de **128×540 pixels**, générées à la demande, conservées dans un cache borné à 18 tuiles ; deux couches utilisent le même raster alpha pour afficher la roche et tester les collisions.
- Trois dispositifs de paroi oscillante par région, dont une **barrière métallique qui ferme toute la section**. Le déplacement vertical est appliqué simultanément au dessin et au masque, en coordonnées entières. La cadence et la phase dépendent de la graine de l'univers.
- Le laser de base creuse une brèche de rayon **60 pixels logiques** sur la barrière (épaisseur 40 px), ce qui permet le passage du vaisseau ; le missile ouvre une brèche plus grande, rayon 70 px. Les matériaux stratifiés et réactions en chaîne sont des développements futurs.
- La collision en jeu reste exclusivement **AABB puis masque XY `A & B`**. Les anciennes méthodes de référence sont conservées uniquement dans les tests. Les tirs rapides parcourent leur trajectoire par petits pas. Chaque cratère utilise `AND NOT` et supprime exactement les mêmes pixels du dessin. Les cicatrices des parois mobiles sont stockées en coordonnées locales : elles bougent avec la paroi et sont retrouvées après redémarrage.
- Les fragments physiques, les dégâts par organes des boss et les collisions continues totalement robustes pour deux objets mobiles restent à étudier.

### Sauvegarde / restauration et score

- Le profil local conserve la graine, l'avancée du parcours, le record de distance, les points, les régions découvertes et les cicatrices des tuiles/barrières ; écriture groupée sur disque environ toutes les 0,6 s et lors de la pause. Après redémarrage, le jeu reprend légèrement avant le dernier point pour éviter une réapparition dans la paroi.
- Les points de distance proviennent de **la plus grande distance jamais atteinte** : revenir en arrière ne permet pas de marquer des points supplémentaires.
- Le panneau **🌌 Univers** permet l'export JSON et la restauration. Sur Android, la sauvegarde et le chargement utilisent le sélecteur de fichiers du système (Storage Access Framework), sans permission INTERNET. Le fichier exporté sert aussi à déplacer ton univers vers une autre installation.
- Si le stockage n'est pas disponible ou plein, une alerte apparaît dans le panneau. Les événements stockés sont plafonnés (16 000 cicatrices) dans ce premier format, à remplacer plus tard par un stockage IndexedDB ou SQLite paginé.

### Vérification

```sh
npm test
npm run build:standalone
```

Le build inclut la **planche de sprites en PNG nettoyée et transparente**, ainsi que l'assemblage HTML/CSS/JavaScript sans instructions `import` ou `export` de module. `npm test` valide notamment : génération déterministe, continuité des tuiles, passage par une paroi pleine puis percée au laser, égalité du masque binaire et de l'alpha, persistance des cratères sur plusieurs blocs, et record de distance non exploitable. La vidéo/l'interaction dans le navigateur a été vérifiée sur Chromium headless ; mesures mobiles réelles à effectuer.

La Release Android produit un **APK de test Debug**, autonome et signé temporairement par GitHub Actions, et un **AAB non signé** destiné seulement à la préparation d'une future version Play Store. La signature de production n'est pas encore configurée. Cette version utilise `fr.fab.ashrush.omegapreview`, installable à côté des anciennes versions, et n'importe pas automatiquement leurs anciennes sauvegardes.
