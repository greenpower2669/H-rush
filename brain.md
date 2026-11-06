# Brain — Ash Rush

Concepteur de l'idée de collision : Fabrice Gourdant. Prototype jouable HTML5/Canvas/CSS3, moteur pur dans `src/collision.js`.

Invariants :

1. Silhouette visuelle et masque sont issus du même raster alpha à la résolution logique.
2. Tout déplacement est appliqué de façon cohérente à l'image rendue et au masque (arrondi des coordonnées monde).
3. La bounding box n'est qu'un filtre grossier ; les projections X/Y ne sont qu'un préfiltrage nécessaire ; seule une intersection 2D établit le contact.
4. Les impacts restent des segments binaires 2D non destructifs `{x,y,bits}` ; `forEachImpact` énumère chaque pixel touché ; les FX prennent une coordonnée appartenant réellement à l'intersection.
5. En JavaScript, deux lanes Uint32 = 64 pixels par boucle (sans prétendre à une instruction SIMD).
6. Les mêmes tests doivent réussir en modes A, B et C ; optimiser sans perdre l'oracle pixel par pixel.
7. Préserver l'indépendance du module de collision pour expérimenter d'autres projets sans recopier les mémoires.

8. Toute dégradation de sprite doit modifier le masque partagé avec la physique à la même résolution logique ; jamais modifier uniquement le visuel.
9. Les sons de cette version sont originaux, synthétisés en Web Audio ; les sons privés de Djipie restent référencés et soumis aux licences et à la provenance.

10. Le vaisseau suit le premier doigt avec un décalage horizontal positif pour rester visible ; le deuxième doigt lance les missiles. Le paysage est privilégié en natif.
11. Les masques 2D se comparent avec `A & B`, jamais via la construction `(A|B)^(A^B)` dans le moteur de jeu. L’usage ancien du XOR correspondait aux tampons graphiques incrémentaux, pas au test d’intersection moderne.
12. En collision, énumérer les bits actifs une seule fois pour les coordonnées, le nombre et le centroïde ; pour effacer une région, appliquer AND NOT aux mots affectés.

13. Gameplay : une seule méthode de collision autorisée, AABB → AND binaire 2D → coordonnées XY. L'ancien oracle A et les projections C ne servent qu'aux tests techniques, jamais à des modes sélectionnables par l'utilisateur.

14. La planche graphique `assets/sprites/atlas.png` (23 frames) est **une ressource du jeu utilisée réellement**, décomposée par `src/art.js` ; chaque frame est rasterisée et son masque généré depuis les mêmes pixels alpha.
15. La galerie géante est rendue par tuiles Canvas 128×540. Son état de collision, les pixels visuels et la sauvegarde des cratères sont synchronisés. La paroi détruite ne doit jamais se régénérer au retour dans la même installation.
16. Seule l'intersection `AND` sur les tuiles voisines détermine le contact ; `AND NOT` retire les pixels de paroi. Contact du vaisseau avec la paroi = mort immédiate.
17. Les tests utilisent des méthodes de référence, mais l'UI du joueur n'expose aucun menu de collisions. Maintenir les sons Space Fortress sans modifier leur projet source.

## Invariants OMEGA 0.4
18. Une graine cryptographique de 128 bits identifie chaque univers personnel. Les régions sont dérivées de la graine et des coordonnées via `src/universe.js`; aucune variation de terrain ne repose sur la consommation séquentielle d'un RNG à chaque frame.
19. Les terrains de `src/omega-terrain.js` sont chargés par tuiles (cache RAM borné). Les déplacements des barrières utilisent le même arrondi XY pour le raster affiché et le masque `A & B`.
20. Les cicatrices persistent dans les coordonnées intrinsèques des tuiles ou des parois, et le masque ET le rendu sont modifiés par un même cratère. Les enregistrements chevauchant une frontière de tuile acceptent des coordonnées locales négatives dans les cicatrices.
21. Le record de distance est strictement monotone ; score distance = maximum de distance seulement. Récompenses de destruction et de découverte sont conservées dans le profil.
22. Le mode OMEGA est un premier parcours horizontal procédural à phases, pas encore une simulation géographique libre de planètes ni 40 mondes artistiquement terminés. Les 20 profils adverses partagent encore des familles de sprites.
23. Ne pas modifier les mémoires de Djipie ou de SpaceFortressVs au titre de la mission OMEGA. La sonothèque WAV attribuée est réutilisée telle quelle, sans dupliquer les mémoires des projets.

18. Fin de partie : blocage de l'update uniquement, overlay GAME OVER visible sur écran paysage, Rejouer au checkpoint de région et classement personnel. Le monde, les cratères et la graine restent intacts.
19. Hall personnel : 10 meilleurs scores **de partie**, calculés par différence du score total monotone entre début et fin de run, exportés avec l'univers. Classement mondial distinct, nécessite un backend fiable.
20. Ennemis : archétypes permanents et variantes contextuelles `adaptSpecies` (phase, région, situation joueur), déterministes pour entrées identiques ; sprite atlas et moteur AND inchangés.

## Musique (OMEGA 0.4.2)
Musique d'ambiance depuis le catalogue CC0 de Djipie, **pistes originales téléchargées chez les auteurs et SHA-256 strictement vérifié à la compilation**. Soundtrack hors réseau dans l'APK. Transitions déterministes : espace -> Space Echo, atmosphère/surface -> Action_A, intérieur -> Horror, boss/danger -> Battle. Ne pas copier de musiques de licence inconnue ni de fichiers privés Sonniss. Pas d'AAB.

## Règle de résistance OMEGA 0.4.3
Cinq cœurs de quatre PV chacun. Un choc paroi retire un cœur directement, avec recul et invulnérabilité de 1,65 s ; les tirs ennemis retirent un PV, quatre petits dégâts retirent un cœur, invulnérabilité 0,9 s. Boucliers conservent leur rôle pour les petits impacts. Le module `src/health.js` est pur et testé ; les masques AND restent la seule preuve de contact en jeu.

## OMEGA 0.4.3 — obstacle et navigation physique
24. Tout spawn d'ennemi et de boss vérifie le masque AND du terrain au point de départ ET sur le couloir d'approche, sans apparition interne aux murs.
25. Tout déplacement d'ennemi utilise des sous-pas spatiaux et le même moteur AND ; une paroi oscillante ne peut pas laisser un sprite encastré. Les boss peuvent creuser réellement, les autres réagissent aux obstacles.
26. Les obstacles existants types 0–2 conservent leur ID (`region*3+type`) ; types 3–10 reçoivent des IDs hors de l'espace historique. Leur hauteur suit les limites locales de la caverne, pas les bords de l'écran.
27. Le système coque possède 5 cœurs et 4 PV par cœur. Un mur coûte un cœur ; un petit impact coûte un PV. Invulnérabilité temporaire contre pertes multiples.

## OMEGA 0.4.4 — commandes, bonus et branding
- Pilotage gravité Android natif TYPE_GRAVITY (accéléromètre en secours), projection suivant l'orientation de l'écran, filtrage et calibrage neutre, zone morte, sensibilité 40–180 %, inversions X/Y. Pendant un contact tactile, le doigt reste prioritaire ; sans capteur la conduite tactile/clavier fonctionne sans dégradation.
- Les 20 variantes de bonus (cinq catégories × quatre silhouettes) sont dessinées sur Canvas et les masques `A & B` sont calculés depuis leurs pixels alpha ; éviter toute géométrie visible non synchronisée avec les collisions.
- Branding 16:9 / 9:16 et icône proviennent uniquement de `assets/branding` déjà validés par Fab ; pas de substitution générique. L'accueil attend JOUER et calibre le capteur ; aucune simulation perdue au lancement.
- Livraison : uniquement APK, sans AAB ; CI vérifie l'icône native, le splash embarqué et les quatre musiques.

## Contrôles et bonus 0.4.5
24. Pilotage tactile **par défaut**, indépendamment des anciens paramètres `enabled` de 0.4.4. Le choix explicite touch/tilt est persistant. X/Y peuvent être inversés séparément pour les deux modes ; le moteur de collision travaille toujours dans le même repère logique.
25. Le calibrage tactile ajuste le décalage du doigt via un toucher et des glissières, sans toucher aux coordonnées de masque; les 2 doigts restent distincts (second = missile). Le capteur n'influence jamais le jeu en mode tactile.
26. Un bonus exceptionnel `extraHeart` (3 % des bonus aléatoires) augmente le plafond temporaire de cinq à huit cœurs ; `heal` conserve sa règle existante.

## OMEGA 0.4.6 — physique, résistance, dégâts visibles (6 novembre 2026)
24. Absence de gravité passive dans l'espace et la phase `exit` : `debrisGravity` retourne zéro ; les débris n'accélèrent vers le sol que dans les environnements planétaires. Le capteur d'inclinaison est une commande volontaire, distincte de cette physique.
25. `src/biomes.js` relie les 40 familles à douze grammaires géométriques/palettes déterministes ; `omega-visuals.js` affiche des motifs distincts, `omega-terrain.js` fait varier relief et couleurs avec continuité. Les décorations sans collision ne doivent jamais être présentées comme des obstacles solides.
26. `craterRadius` : laser barre 24px, missile barre 43px, laser sol 9px, missile sol 19px. Les barres restent plus faciles à forer que le sol, mais un tir de base ne doit plus vider une barrière complète. Des coups successifs permettent de sortir d'un obstacle bloquant.
27. `src/damage.js` : chaque ennemi conserve ses cicatrices propres aux coordonnées du sprite ; les sprites partagés restent intacts ; chaque frame est clonée/percée au besoin, visuel et masque effacés avec la même géométrie disque AND NOT, avec contour chaud uniquement sur les pixels encore opaques.
28. Les cadres artificiels des barres sont supprimés. Le son `kinetic_charge.wav` est désactivé et exclu de l'APK ; les sons autorisés restants et la musique Djipie restent indépendants.

## H-RUSH OMEGA 0.4.7 — invariants d'immersion

- L'identité de région est déterministe (seed + index) ; les phases utilisent `REGION_SIZE=16384` et `PHASE_START`, partagés entre `src/universe.js`, géologie et décors. Les intervalles de cavernes et d'obstacles doivent rester praticables ; conserver `A & B` pour toute collision.
- Les monuments visuels sont **dessinés avant la matte des collines** et ancrés sous celle-ci. Aucun objet décoratif ne crée de collision artificielle ; seule la géologie rasterisée fait foi.
- Les effets de chaleur du vaisseau `src/atmosphere.js` sont purement visuels et indépendants du masque, des cœurs et des PV.
- L'indicateur principal de voyage est un **chronomètre** qui s'arrête en pause. Le meilleur temps `bestTime` est persistant (facultatif lors de l'import des JSON anciens). Les distances historiques restent calculées en interne pour la notation et la continuité du score.
- Les anciennes sauvegardes et cicatrices ne sont pas effacées lors du changement de taille de région ; une migration géométrique parfaite des anciennes cicatrices reste un point de QA.
- Livraison APK autonome uniquement, aucune génération d'AAB avant décision explicite de Fab.

## H-RUSH OMEGA 0.4.8 — invariants de progression et de parallaxe
- `src/difficulty.js` dirige des rencontres à pression plafonnée selon survie, régions, victimes et santé ; la graine personnelle fixe les formations. Les périodes de récupération suspendent les nouveaux spawns et le plafond d'ennemis simultanés protège la jouabilité et la fluidité. Les collisions, spawns géologiquement sûrs et les impacts conservent uniquement `A & B`.
- Les phases de boss dépendant des PV sont bornées (1 à 4), sans changement d'algorithme d'intersection. Le score affiché est le score **de la partie**, dérivé du total monotone moins le total initial. Le HIGH SCORE provient du Hall local, importable/exportable. Un nouveau record exige un score de partie strictement supérieur à l'ancien.
- `visualEnvelope` utilise les seuils `PHASE_START` pour interpoler continûment les présences planète/atmosphère/surface, sans architecture terrestre en espace profond. Les bases des monuments restent derrière trois mattes géologiques de parallaxe. La sortie masque complètement le sol AVANT `spaceTail`.
- Garder l'identifiant Android `fr.fab.ashrush.omegaimmersion` et le format de sauvegarde 1 inchangés ; livrer un APK autonome signé, sans AAB ni altération de `main` avant validation.

## OMEGA 0.4.9 — repère de gravité Android
- Le capteur Android fournit X/Y dans le repère physique de l'appareil ; le jeu utilise X vers la droite et Y vers le bas. Avec écran en paysage, `screenGravity` transforme ROTATION_90 en `{x:+deviceY,y:+deviceX}` et ROTATION_270 en `{x:-deviceY,y:-deviceX}` ; portrait 0/180 inchangé. Le calibrage neutre et les inversions utilisateur restent indépendants.
- Ne jamais modifier collision A & B ni la sauvegarde pour corriger un simple repère de commande ; valider les deux paysages sur matériel avant de considérer la prise en main certifiée.

## OMEGA 0.5.0 — événements, passages et corps physiques
- `src/omega-events.js` définit les portails déterministes par seed/région, les fenêtres météoriques, les colonnes à brèche garantie, la fragmentation à profondeur <=2 et l'intégration inertielle ou sous pesanteur/traînée. Les particules et météores ne tombent pas artificiellement en espace profond.
- Les portails bonus sont temporaires (16 secondes), sans progression de la distance pendant le détour : terrain, cicatrices, graine, sauvegarde JSON et collision `A & B` sont préservés. Le portail est une silhouette alpha contrôlée par le même masque AND ; son halo discret est un indice visuel seulement.
- Dans le modèle ludique, gravité identique pour petits/grands débris, mais décélération liée à la masse ; ne pas confondre ceci avec une simulation orbitale ou une prédiction physique exacte.

## OMEGA 0.5.1 — vol gravitationnel et sentinelles
- En phase atmosphère/surface/intérieur : l'inclinaison longitudinale suit le déplacement horizontal, 0 à ±0,31 rad avec détente exponentielle. Avancer = nez abaissé (+ angle dans l'écran), reculer = nez relevé. Les lasers et missiles partent du nez suivant sa direction ; chaque sprite tourné (joueur/munitions) est redessiné puis masqué par le même raster alpha pour conserver la collision `A & B` exacte.
- Les jets de propulsion et nuages de poussière sont purement visuels ; leur force dépend de la hauteur par rapport au vrai sol géologique (pas un fond de décor), sans poussière en espace/warp et avec cap d'entités. Aucun bonus de dégât par poussière.
- `asteroidWeather` produit des sentinelles robotiques blindées dans les trois phases gravitationnelles. Elles poursuivent et tirent, persistent après une collision avec le joueur et ne détonent pas comme des mines ; destruction finale = étincelles, sans souffle de zone. Les pluies de roches naturelles et fragments persistent en espace/warp. Les formations gardent une brèche praticable.

## H-RUSH OMEGA 0.5.2 — intégrité visible après les tirs
- Un ennemi perd au maximum **15% des pixels alpha opaques de sa silhouette initiale**, et cela séparément sur chaque frame d'animation, avec vraie suppression `AND NOT` et image effacée au même endroit. Les robots ne sont jamais détruits par simple seuil de masque : leurs PV seuls régissent leur résistance.
- Le repère **20%** sert uniquement au calcul du rétrécissement du rayon et de la progression de lumière, sans autoriser 20% d'effacement. À saturation, nouveaux tirs causent toujours des dégâts en PV mais pas de nouvelle disparition ; auréoles source-atop jaunes/blanches intenses préservant l'alpha. Test automatisé long sur 55+ impacts.

## H-RUSH OMEGA 0.5.3 — planète/bulle atmosphérique sans zoom perceptible
- La planète et sa bulle/hale volumétrique ont un **rayon fixe pendant toute la traversée**. À l'approche, leur centre démarre en dehors de la fenêtre (droite, halo entièrement caché) et avance continûment vers le décor ; à la sortie, le centre translate à gauche jusqu'à disparition du halo entier. Il n'y a plus de croissance/rétrécissement du diamètre ni de flash d'alpha pour révéler l'atmosphère.
- `atmosphereGlobePosition` est pure, monotone et liée au `local` de la région ; départ et arrivée hors champ, positions fixes aux seuils, aucun pop lors des phases ou au changement de région. L'ancienne enveloppe `visualEnvelope` reste dédiée aux atmosphères, silhouettes et profondes couches parallax afin de ne pas toucher à la géologie/collision A & B.

## H-RUSH OMEGA 0.5.4 — horizons, bonus et couche arrière
- La planète (bulle atmosphérique de rayon fixe) entre avant l'arrivée du relief, et l'atmosphère reste visible APRÈS extinction du sol/grotte à `spaceTail` : translation jusqu'à `REGION_SIZE-160`, brouillard fondu à la fin de région ; aucune collision modifiée.
- Bonus beaucoup plus rares : au plus un simultané, minimum 24 secondes entre distributions, probabilité initiale de ~9,5% par destruction ordinaire, ajustement léger en faibles PV ou boss, aucune pluie de bonus pour fragments/warp et fin du bouclier automatique aux 11 éliminations. Difficulté déterministe progressive et récupérations conservées.
- Les portails sont placés juste au-dessus du vrai sol échantillonné sur toute leur largeur et dessinés en alcôves devant le fond mais derrière les vraies tuiles géologiques. Collision AND inchangée.
- Fin du tunnel warp : progression réelle vers `warpExitWorld(region)` en phase `space` de la région suivante, sauvegarde JSON et cicatrices préservées ; la distance parcourue reflète aussi ce raccourci.
- Colonnes et adversaires apparaissent totalement hors champ. Colonnes et barrières oscillantes peintes derrière les tuiles sol/grotte de la couche de premier plan, tout en conservant leur véritable masque de collision.

## H-RUSH OMEGA 0.5.5 — atlas dématé et véritable bestiaire étendu
- `src/art.js` : nettoyage local des cadres opaques résiduels dans chaque frame de l'atlas par diffusion depuis les coins/bords de couleur similaire, sans franchir les contrastes des silhouettes ; le `putImageData` et le masque `maskFromImageData` utilisent strictement les **mêmes pixels RGBA nettoyés**. Copie des images d'origine intacte et anciennes frames préservées. Les frames déjà transparentes ne sont pas modifiées.
- `src/bestiary.js` : **49 modèles morphologiques ordinaires**, **16 boss distincts** et 20 familles structurelles de dessin Canvas (plantes/racines, tentacules, worms, tanks/rovers, tourelles/forteresses, spiders, chasseurs, bombardiers, corvettes, drones, hybrides) ; deux frames animées et jusqu'à quatre phases boss, avec cache raster borné à 140 sources. Le sprite visible et son vrai masque AND proviennent de la même ImageData, puis `damage.js` clone les pixels par ennemi pour les blessures.
- `src/ecology.js` : 52 rôles de combat nommés (20 rôles historiques et 32 ajouts) avec modes de mouvement supplémentaires. `src/game.js` : morphologie déterministe par région, biome, phase et compteur d'apparitions ; attaches aux plafonds et sols réels avec `terrainBounds`, saut effectif des worms et tirs de boss changeant avec la phase. Directeur de difficulté et plafonds inchangés.
- Les nouvelles figures sont des silhouettes Canvas stylisées et non de nouvelles planches d'art haute définition ; QA esthétique et performances sur Samsung nécessaire avant validation.

## OMEGA 0.5.6 — tirs au nez, double doigt et appuis AND
- La visée ne part jamais du rectangle du joueur. `noseWorldPoint` prend le dernier **pixel opaque** de la coque, l'oriente exactement avec le rendu `pitchSprite` quantifié par 0,05 rad ; `projectileOriginAtNose` replace le pixel opaque arrière du laser ou missile sur le point de nez en monde. Le premier doigt déplace le vaisseau, le deuxième acquiert un ennemi proche (y compris un doigt dessous racine/tentacule, à côté d'un ver/tank ou haut/bas d'un avion), avec réticule et retouches bornées pendant le vol. La vitesse avant/arrière influence la vélocité initiale, en compensant la visée.
- Les ennemis à ancrage sol/plafond utilisent `anchoredAndPose` et `groundOrientation` : vrais tests `terrain.collideEntity` / `METHODS.BITMASK` sur les pixels opaques des tuiles modifiées par les cratères, **pas** un support basé uniquement sur `terrainBounds`. Les sprites de véhicules sont tournés et le canon articulé AVANT de calculer un masque AND correspondant aux pixels Canvas (`spriteForMorph` avec paramètres de pose). Contrôle de repos fin au pixel près pour éviter les unités flottantes.
- Chars/tourelles/forteresses : canon vers le joueur, corrigé de l'inclinaison de coque, embouchure en coordonnées monde; tirs avec gravité positive écran et formule `y(t)=y0+vy*t+0.5*g*t²`, vitesse horizontale limitée, collisions AND balayées. Les worms rongent le terrain véritable à la tête via `terrain.carveImpact`, en conservant les cicatrices de l'univers, morsure espacée pour RAM/CPU.
- Les 49 morphologies + 16 boss de la version précédente, le warp, la difficulté progressive, le score, le high score et la sauvegarde JSON sont préservés. Le deuxième doigt ne déclenche plus de missile accidentel ; bouton/touche M conservés.
