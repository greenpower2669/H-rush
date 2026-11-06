## OMEGA 0.4.3 — cinq cœurs et PV par cœur (correction de jouabilité)

- **5 cœurs**, chaque cœur dispose de **4 PV** (affichés en haut et sous le vaisseau).
- **Collision avec une paroi** = perte d'**un seul cœur**, quel que soit le nombre de PV restant dans ce cœur. Le dernier cœur perdu déclenche GAME OVER.
- **Petit tir ou collision avec un ennemi** = perte de **1 PV** ; quand les quatre PV du cœur sont consommés, un cœur disparaît et le prochain commence avec 4 PV. Les boucliers absorbent ces petits dégâts comme auparavant.
- Après un choc contre une paroi : recul horizontal et **1,65 seconde de protection** contre une nouvelle collision ; après un petit impact, **0,9 seconde**. Les dégâts continuent d'être confirmés par le masque binaire `A & B`.
- Bonus cœur : rend un cœur (jusqu'à 5) et remplit les PV du cœur actif.
- Les musiques CC0 Djipie, les graphismes, les galeries creusées, le Hall of Fame et la sauvegarde sont conservés. **APK de test uniquement, aucun AAB**.

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

## OMEGA 0.4.1 — GAME OVER et records
- Les morts en combat ou collision frontale affichent un véritable écran **GAME OVER**, avec un bouton **Rejouer** utilisable en paysage et un bouton **Hall of Fame**. La partie reprend au début de la région, avec sa graine et ses destructions intactes.
- Le Hall of Fame **personnel** classe les dix meilleures parties par score gagné depuis leur début, et conserve les victimes, la nouvelle distance et le monde de la mort. Les records sont exportés/restaurés avec la sauvegarde de l'univers. Il n'y a pas encore de classement mondial : backend et anti-triche restent à développer.
- Les vingt archétypes existants adaptent désormais certaines caractéristiques (armes, mouvements, vitesse, résistance, couleur) en fonction du milieu rencontré et de la situation du pilote ; des planches artistiques dédiées à chaque archétype restent à produire.
- APK `fr.fab.ashrush.omegahall` de test signé Debug ; identifiant parallèle pour éviter les conflits entre clés de compilation éphémères.

## 🎵 Musiques de Djipie — 0.4.2
Quatre morceaux CC0 (OpenGameArt, indexés et contrôlés dans Djipie) intégrés dans l'APK **sans dépendance réseau après installation**. La compilation télécharge les fichiers directement depuis les auteurs et **vérifie SHA-256 contre le catalogue Djipie** ; en cas d'échec, elle s'arrête sans publier d'APK.
- `space_echo.ogg` — Centurion_of_war, exploration spatiale / sortie
- `Action_A.mp3` — drakzlin, entrée atmosphérique / survol de surface
- `Horror.mp3` — drakzlin, cavernes et galeries
- `Battle.mp3` — drakzlin, boss et situations dangereuses
Licences CC0 : https://opengameart.org/content/space-echo et https://opengameart.org/content/music-loops-0. Leurs noms dans le moteur sont `space_echo.ogg`, `action_a.mp3`, `horror.mp3`, `battle.mp3`. Fondu entre scènes, volume et muet coordonnés aux commandes du jeu ; lecture débutant après un geste de l'utilisateur. Les fichiers ne sont pas intégrés à l'historique Git : les packs sont embarqués pendant GitHub Actions. Les téléchargements HTML seuls n'incluent pas les musiques binaires ; l'APK les inclut.

## OMEGA 0.4.3 — Cœurs et obstacles réellement physiques

- **5 cœurs, 4 PV par cœur** : petits tirs ennemis = 1 PV ; collision avec la paroi = 1 cœur, avec 1,65 s de protection et recul ; soins rechargeant un cœur et les PV actifs.
- **11 obstacles mobiles déterministes par région** (3 existants + 8 nouveaux) : métal, cristal, roche, éléments attachés au relief local des planètes et cavernes. Ils restent réellement dans le couloir, et tous les impacts restent synchronisés aux masques et sauvegardes.
- **Apparition contrôlée** : un ennemi ou un boss apparaît uniquement si un court couloir libre est confirmé par la collision binaire `A & B`. Lorsqu'une paroi bouche ce couloir, l'apparition est différée.
- **Déplacement contrôlé en sous-pas** : les ennemis et les boss glissent, contournent ou s'arrêtent au contact du décor. Si un élément oscillant les englobe, ils sont dégagés sans laisser un sprite traverser les roches. Un ennemi bloqué peut s'écraser ; un boss creuse la paroi en frappant, créant des dégâts persistants réels.
- Les trois premiers obstacles gardent leurs anciens IDs, pour préserver les brèches sauvegardées. Les huit suivants ont des identifiants distincts.
- Tests automatisés : 45 succès locaux, puis validation GitHub Android requise. Tests navigateur hors réseau : démarrage sans erreur JS, aperçu du couloir densifié.
- APK autonome uniquement, **aucune génération d'AAB**. Version de test installée parallèlement (`fr.fab.ashrush.omegahearts`) jusqu'à adoption d'une signature stable.

## OMEGA 0.4.4 — pilotage à l'inclinaison et identité H-RUSH
L'APK Android lit la gravité via les capteurs natifs, calibre la position neutre au lancement de JOUER, puis pilote le vaisseau en paysage. Une **zone morte** et un filtre limitent les tremblements. Le bouton **🎮 Inclinaison / ✋ Tactile** commute le mode ; dans **🌌 Univers**, régler la sensibilité, inverser X/Y ou cliquer **⌖ Calibrer**. Le doigt garde toujours la priorité et les flèches/clavier restent utilisables. Si aucun capteur n'est détecté, les commandes tactiles/clavier restent opérationnelles. Le tir est automatique quand l'inclinaison est active ; missiles au bouton ou au deuxième doigt.

Les bonus ont cinq fonctions (tir, missile, cœur, bouclier, protection) et **quatre formes animables par fonction** : diamant, hexagone, étoile et orbite ; leurs pixels visibles génèrent leurs masques binaires exacts. Le fond de l'écran d'accueil est `assets/branding/h-rush-splash-16x9.webp` en paysage (9:16 en portrait), et l'icône native utilise `assets/branding/h-rush-icon-1024.png`. Toutes ces ressources sont emballées dans l'APK ; aucune permission Internet. **Aucune génération AAB** jusqu'à décision future.
