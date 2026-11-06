# TODO — Ash Rush

## V0.1 : socle livré dans la proposition
- [x] Sprite visuel et masque issus des mêmes pixels alpha
- [x] Hitbox grossière, axes X/Y et intersection 2D exacte
- [x] Trois modes A/B/C et test comparatif déterministe
- [x] FX ancrés sur un vrai pixel de collision, différenciés par zone
- [x] Jeu de base, touches et tactile, vies, score, bouclier, mini-boss
- [x] Vérification des tirs rapides à plusieurs positions intermédiaires
- [x] Six tests unitaires d'égalité des méthodes
- [x] README, licence MIT et mémoires du projet

## V0.2 — implémenté, à confirmer sur appareil
- [x] Grille de proximité pour limiter le nombre de paires examinées (sans réduire l’exactitude 2D)
- [x] Astéroïdes à cratères transparents, masques individuels mutables et projections mises à jour
- [x] Missiles guidés (2e doigt, touche M, bouton) et bonus (tir x2/x3, missile, vie, bouclier)
- [x] Sons originaux Web Audio hors ligne, volume et mode muet
- [x] Limite DPR et ombres de particules supprimées pour limiter la charge
- [x] 8 tests automatisés passés localement + construction standalone effectuée

## Après revue humaine et tests appareil
- [ ] Valider jeu navigateur desktop et téléphone, orientation portrait/paysage, TalkBack
- [ ] Ajouter un retour de proximité sans dégât via distance signée/forme dilatée
- [ ] Dessiner les **blocs individuels réellement évalués** par-dessus les masques en laboratoire
- [x] Dégrader localement les astéroïdes, reconstruire le masque de façon incrémentale (sprites de vaisseaux à suivre)
- [ ] Étudier les décalages subpixel, zoom et sprites très haute définition en monde logique
- [ ] Stress test : 1000 à 5000 projectiles et sprites 512px, mesures RAM/CPU/IPS
- [ ] Spatial hash/tiling pour éviter l'examen des paires éloignées
- [ ] SIMD Wasm vs Uint32, cache des projections et gestion des rangées clairsemées
- [ ] Vérifier les tirs ultrarapides et collisions mobiles continues (swept motion des deux objets)
- [ ] Publier une URL GitHub Pages après vérification des permissions et paramètres
- [ ] Ajouter des effets audio, des variations de boss, davantage d'obstacles et équilibrage

## 2026-11-05 — Android 0.2.1 — état vérifié sur GitHub
- [x] Commande tactile : vaisseau décalé à droite du doigt, gardé dans l’aire de jeu
- [x] Interface CSS adaptée aux écrans paysage et immersive Android
- [x] Wrapper Android WebView local et workflow de compilation APK direct
- [x] Deux tests supplémentaires de positionnement tactile
- [x] GitHub Actions 42088822394 : compilation réussie et 10 tests JS OK
- [x] Prérelease v0.2.1-android-preview : APK vérifié sur GitHub, SHA-256 et signature Debug v2 contrôlées
- [ ] Tester sur téléphone Android physique, navigation système, écran paysage et multitouch
- [ ] Remplacer la signature debug de CI par une signature stable pour la livraison de production

## 2026-11-05 — mission 0.2.2 : XOR historique → AND
- [x] Remplacer les doubles XOR par `A & B` sur deux blocs `Uint32` (64 pixels par itération), avec AABB conservées
- [x] Un seul parcours des bits communs pour count, XY et centre ; conserver les segments pour les FX
- [x] AND NOT pour supprimer les pixels des cratères, mises à jour des projections X/Y
- [x] Comparer l'oracle pixel par pixel et les modes A/B/C (13 tests, dont 100 cratères)
- [x] Comparer le moteur historique au moteur AND sur Node 22 (`npm run bench`, mesures dans debughistorical.md)
- [x] Préserver sons, FX, commandes tactiles paysage et génération HTML autonome
- [ ] Vérifier le workflow GitHub Actions de la v0.2.2 et l'APK réellement publié avec hash et signature
- [ ] Tester sur Samsung (FPS, CPU, précision aux contacts, multitouch, son) et comparer à 0.2.1
- [ ] Préparer une signature Android de production stable ; ne pas écraser les APK de test d'ancienne clé
- [ ] Réévaluer le coût du préfiltre C selon les scènes ; activer automatiquement uniquement quand rentable

## 2026-11-05 — interface joueur : méthode unique Fab
- [x] Supprimer la barre d'outils du laboratoire : sélecteur A/B/C, bouton « Voir les collisions » et bouton « Comparer »
- [x] Utiliser exclusivement `METHODS.BITMASK` (masques XY + `A & B`) pour les collisions en jeu
- [x] Éliminer le rendu et les métriques du laboratoire durant le jeu pour alléger l'affichage
- [x] Conserver l'oracle pixel par pixel uniquement dans les tests, sans commandes utilisateur
- [ ] Finaliser les planches PNG utilisables, les parois destructibles et leur persistance (mission en cours, distincte de cette correction UI)
- [ ] Recompiler et valider l'APK de la prochaine version sur Android réel

## 2026-11-05 — Ash Rush 0.3.0 : planches animées et parois destructibles
- [x] Extraire les 23 frames des planches graphiques originales et produire un véritable atlas PNG RGBA transparent
- [x] Charger les sprites de gameplay et reconstruire leurs masques depuis la même image ; animation joueur / éclaireur / manta / missile
- [x] Ajouter un intérieur d'astéroïde géant, galeries et parois à 32 blocs de 128 × 540
- [x] Impact AND XY sur les parois, minage par laser/missile avec AND NOT, FX incendescents
- [x] Une collision du joueur avec la paroi entraîne un one-shot ; le joueur peut dégager un passage
- [x] Enregistrer durablement les cratères dans localStorage ; rejouer les impacts lors de la reconstruction d'une tuile
- [x] Points et bonus occasionnels liés au forage, sons et contrôle paysage maintenus
- [x] 18 tests Node passent localement, y compris pixel/mask cohérents après excavation et persistance
- [ ] Vérifier en vrai sur Samsung la qualité des sprites découpés, l'animation, les parois, le paysage et la restitution des WAV
- [ ] Mesurer l'impact FPS de la génération des tuiles au premier passage et améliorer si utile (préchargement en tâche idle)
- [ ] Ajouter sauvegarde de progression et migration entre installations Android de packages de test différents
- [ ] Remplacer la signature Android Debug variable par une signature stable de publication
- [ ] Vérifier les permissions de GitHub et publier un APK 0.3 uniquement si CI + asset Release sont validés

## H-RUSH OMEGA — mission générale, progression par jalons
### OMEGA 0.4.0 — noyau procédural jouable
- [x] Seed personnelle cryptographique 128 bits, profil local stable, dérivation des régions par coordonnées
- [x] Enchaîner continûment espace, entrée atmosphérique, surface en rase-mottes, intérieur planétaire, sortie
- [x] 40 identités procédurales de mondes comme base des combinaisons, à détailler artistiquement
- [x] Cache de tuiles de terrain 128px, gravure réelle AND NOT et cicatrices par coordonnées locales
- [x] Parois oscillantes avec fréquences/amplitudes/phases différentes, barrière pleine forable au laser standard
- [x] Collisions de gameplay exclusivement par `A & B` avec positions exactes et masques synchronisés
- [x] Score de distance maximale non exploitable par aller-retour + points combat/minage/découverte
- [x] Sauvegarde JSON locale et export/import navigateur + Android SAF, sans permission réseau
- [x] 20 archétypes de combat sous forme de profils + mouvements et armes différenciées (sprites génériques teintés)
- [x] Réutiliser l'atlas réellement intégré ; retirer 22 625 pixels parasites de fond opaque des planches
- [x] Conserver audio WAV Space Fortress / fallback, tactile paysage, 2e doigt missiles, fichiers de référence
- [x] Tests de reproductibilité, continuité, mur percé, persistance et non-régression (26 réussis localement)
- [ ] Valider APK 0.4.0 et AAB, empreinte SHA-256, signature et assets dans GitHub Actions
- [ ] Tester la sensation de pilotage et les FPS sur Samsung réel, notamment avec 1000 projectiles
- [ ] Vérifier un export/restauration vers une autre installation Android sur appareil physique

### OMEGA 0.5 et suivantes — fonctionnalités encore à réaliser
- [ ] Construire des planches de sprites réellement distinctes pour les 20 archétypes, boss modulaires et leurs anims physiques
- [ ] Composer les 40 familles avec végétation, villes, océans, biomes et civilisations visuellement uniques
- [ ] Rendre les transitions planétaires libres et navigables au lieu de sections horizontales scénarisées
- [ ] Débris à physique, parois stratifiées, réactions en chaîne, pistons à contraintes et télégraphie renforcée
- [ ] Dégâts localisés aux organes des vaisseaux, démembrement et perte de fonctions selon l'impact XY
- [ ] Simulation de factions (alliances, hostilité, réparation, constructions et histoire persistante)
- [ ] Boss gigantesques multi-écrans et niveaux internes destructibles, points faibles
- [ ] Ambiances sonores procédurales par biome et civilisation, musiques adaptatives originales, licences traçables
- [ ] Passer sauvegarde de cratères vers IndexedDB/SQLite paginé, crash safety, migration des anciennes installations
- [ ] Accélérer les grands masques avec WebAssembly/SIMD si mesures prouvent un bénéfice et tuilage physique
- [ ] Tester l'antitunneling exact des collisions de deux objets mobiles rapides (swept XY)
- [ ] Déploiement Android signature production stable, AAB signé, éventuelle publication Play Store
- [ ] Hall of Fame mondial avec serveur, opt-in et mécanismes anti-triche
- [ ] Équilibrage du forage avec laser de base et préavis sur les passages, sans mort injuste

## 2026-11-05 — OMEGA 0.4.1 · fin de partie / records / adaptation
- [x] Écran GAME OVER accessible en paysage après mort en combat ou contre une paroi ; simulation arrêtée
- [x] Rejouer depuis un point sûr au début de la région ; conserver la graine et les destructions
- [x] Hall of Fame **personnel local** avec dix meilleures parties (score gagné par session, nouvelles distances, victimes, monde)
- [x] Hall intégré à l'export/restauration JSON de l'univers, validation des champs pour résister aux sauvegardes invalides
- [x] Variations déterministes de vitesse, HP, comportements, armes, couleurs et fréquence selon phase du monde et état du joueur
- [x] Tests unitaires des scores, du classement, des sauvegardes, de l'UI et des variantes ; navigateur paysage à vérifier
- [ ] Vrai Hall of Fame mondial : serveur partagé/authentification, consentement, anti-triche et protection des données, sans réutiliser les secrets de Space Fortress
- [ ] Planche dédiée par archétype et sons propres à chaque civilisation (les 20 variantes réutilisent encore une partie de l'atlas actuel)
- [ ] Tester manuellement sur Samsung la visibilité des commandes en paysage, le son et la fluidité réelle
- [ ] Clé de signature Android stable pour des mises à jour sans installation parallèle

## 2026-11-06 — Musique Djipie CC0, OMEGA 0.4.2
- [x] Sélectionner quatre morceaux CC0 du catalogue Djipie et leurs empreintes SHA-256
- [x] Implémenter ambiance musique dynamique avec fondu selon environnement et combat
- [x] Téléchargement public par GitHub Actions avec vérification SHA-256 et inclusion APK uniquement ; aucun AAB
- [ ] Validation CI GitHub : source téléchargeable, empreintes valides, APK avec quatre pistes
- [ ] Tester sur Samsung la lecture, transition, pause/reprise, écran éteint et bouton Muet
- [ ] Ajouter d'autres pistes et jingles CC0 après écoute et vérification audio

## 2026-11-06 — OMEGA 0.4.3 · vies moins punitives
- [x] Collision avec paroi : retirer un cœur, jamais cinq en une seule collision
- [x] Quatre PV par cœur ; plusieurs dégâts légers sont nécessaires pour perdre un cœur
- [x] Bouclier absorbant les impacts légers, bonus de soin réparant un cœur et sa jauge
- [x] Protection temporisée (paroi 1,65 s, combat 0,9 s), petit recul pour aider à se dégager
- [x] Cœurs et PV visibles dans HUD et jauge sous vaisseau
- [x] Tests de règles de vie + non-régression : 38/38 localement
- [ ] Vérifier compilation APK, signature, SHA-256 et inclusion des 4 musiques en GitHub Actions
- [ ] Mesurer sur Samsung le risque de multi-collision lors d'une fermeture rapide de paroi ; ajuster les durées selon retour utilisateur
- [ ] Pas d'AAB tant que Fab ne demande pas une publication Google Play

## OMEGA 0.4.3 — cœurs, boss, spawn et densité du décor
- [x] Cinq cœurs avec quatre PV par cœur ; perte d'un cœur par choc dans les murs avec délai de protection
- [x] Éviter le spawn des ennemis/boss dans le relief, vérifier un corridor d'approche par `A & B`
- [x] Déplacement des ennemis/boss contrôlé en sous-pas contre murs fixes et mobiles, résolution des enfermements
- [x] Boss pouvant creuser réellement des brèches ; ennemis ordinaires bloqués réagissant et pouvant s'écraser
- [x] Onze obstacles mobiles par région au lieu de trois, formes et matériaux variés, parties saillantes dans les vrais couloirs
- [x] Préserver IDs et cicatrices des trois obstacles historiques, ajouter de nouveaux IDs non conflictuels
- [x] Tests locaux 45/45, gameplay initialisé sans erreur JS ; test visuel de galerie avec obstacles
- [ ] Vérifier sur Samsung vitesse, difficulté, fréquence des spawns et blocages à long terme (5 000+ unités monde)
- [ ] Ajuster les hauteurs de barrières et la chance de réapparition de boss selon l'équilibrage réel
- [ ] Signature de production stable : conserver export/import de l'univers entre versions de test
- [ ] Vérifier la nouvelle compilation GitHub Actions et le fichier APK de la Release
- [ ] Maintenir génération AAB désactivée jusqu'à demande explicite

## OMEGA 0.4.4 — inclination, bonus et véritable branding
- [x] Lire `assets/branding/manifest.json` et utiliser le PNG 1024 natif + splash paysage 16:9 et portrait 9:16 déjà présents.
- [x] Écran d'accueil JOUER sans HUD incrusté dans l'image, calibrage du point neutre au démarrage.
- [x] Contrôle de gravité Android sans permission et sans réseau, filtre, zone morte, plage de sensibilité et inversions X/Y, sauvegarde locale, tactile prioritaire.
- [x] Cinq types de bonus × quatre formes = vingt sprites réellement distincts, masques AND depuis leurs pixels alpha.
- [x] Nouveaux tests unitaires du capteur et des bonus ; CI vérifie les ressources embarquées.
- [ ] Valider sur Samsung (sens de l'inclinaison pour les deux orientations paysage, temps de réaction, stabilité du point neutre, tactile et animation bonus).
- [ ] Ajuster l'équilibrage/sensibilité selon retour de jeu ; mesurer FPS et consommation capteur.
- [ ] Signature Android stable : conserver les identités de debug indépendantes jusqu'à publication.
- [ ] Hall mondial et enrichissement des planches : missions futures, hors OMEGA 0.4.4.

## OMEGA 0.4.5 — demandes de pilotage et bonus
- [x] Mode Tactile initial, choix Tactile / Inclinaison dans options et bouton rapide.
- [x] Inversion X et Y indépendantes, communes aux modes tactile et inclinaison, avec sauvegarde.
- [x] Calibrage tactile interactif par un toucher + ajustement X/Y en option + remise à zéro.
- [x] Rare bonus ♥+ : plafond de cœurs augmenté temporairement à 8, sprite distinct et poids 3 %.
- [x] Préserver moteur de collision AND, 16:9, musiques et commandes paysage.
- [ ] Contrôler les 2 orientations paysage et le mouvement X/Y sur Samsung (retour tactile et tilt).
- [ ] Régler les amplitudes du calibrage et l'équilibrage ♥+ après retour de jeu.
- [ ] Toujours livrer uniquement APK autonome, sans AAB.

## OMEGA 0.4.6 — retours sur la jouabilité (6 novembre 2026)
- [x] Différencier nettement les régions : 12 motifs/palettes déterministes couvrant les 40 familles de mondes, relief variable et espace sans silhouettes de sol plantées.
- [x] Zéro gravité passive pour débris spatiaux, accélération visuelle limitée aux environnements planétaires ; conserver inclinaison volontaire.
- [x] Réduire la fragilité des barres (laser 24px, missile 43px), et rendre le sol plus dur (9px / 19px) avec cicatrices permanentes.
- [x] Éliminer le cadre rectangulaire ajouté par le rendu autour des barres ; casser leur contour rectiligne.
- [x] Supprimer le son de charge et ne pas le copier dans le nouvel APK ; conserver les musiques CC0 Djipie.
- [x] Petits cratères incandescents des ennemis/boss, partage des images intact, masques AND NOT suivant toutes les images animées.
- [x] Vérifier les tests Node et le démarrage HTML autonome avant publication.
- [ ] Vérifier le nouvel APK sur téléphone Android réel, le rythme de forage et la lisibilité des impacts.
- [ ] Enrichir les motifs de biome avec d'autres sprites graphiques artistiques et de nouvelles architectures physiques (12 familles graphiques, 40 familles nominales).
- [ ] Mesurer FPS/mémoire avec ennemis multi-frames détériorés ; introduire cache borné par budgets mémoire si nécessaire.
- [ ] Faire évoluer vers un profil Android unique signé durablement au lieu d'installations parallèles de prévisualisation.
- [ ] Protéger les sauvegardes et enregistrer d'autres éléments destructibles, y compris les débris physiques.

## OMEGA 0.4.7 — immersion planétaire / temps humain (6 novembre 2026)
- [x] Régions étendues de 5120 à 16384 unités, phases partagées `PHASE_START` géologie/décors.
- [x] Dessiner des structures bien plus grandes et variées (tours, ruines, pics, végétaux, cristaux) et masquer leurs bases derrière trois plans de collines, sans faux masque de collision.
- [x] Créer une chauffe légère du vaisseau pour rentrée et sortie atmosphérique, plus voile lumineux progressif, sans toucher à l'algorithme `A & B` ni aux PV.
- [x] Afficher TEMPS au HUD au format mm:ss / hh:mm:ss, durer uniquement durant le gameplay, conserver et exporter le meilleur temps. Le Hall affiche maintenant la durée.
- [x] Maintenir la distance interne monotone pour le score et les historiques, sans kilomètres en grand sur le HUD.
- [x] Couvrir les changements par des tests de phases, géologie, ancres, thermique, chronomètre et sauvegarde d'ancien JSON.
- [ ] Vérifier en profondeur sur Samsung les silhouettes, la rentrée/sortie, les FPS et la stabilité du temps.
- [ ] Tester l'alignement des cicatrices d'un ancien univers 0.4.6 : géométrie allongée = nouvelles positions des biomes et des obstacles ; migration exacte à étudier.
- [ ] Une signature de publication stable et l'option d'actualiser l'appli sans export/import restent à préparer.
- [ ] Nouveaux biomes artistiques non répétitifs, davantage de factions et variantes de boss pour les prochaines versions.
- [ ] Play Store/AAB uniquement sur nouvelle demande explicite.

## H-RUSH OMEGA 0.4.8 — progression et parallaxe (mission 06/11/2026)
- [x] Lire Djipie et les cinq mémoires, identifier le HEAD `9bf5c0f` et préserver la Release 0.4.7.
- [x] Créer `feature/omega-048-progression-parallaxe-20261106` sans toucher à `main`.
- [x] Ajouter directeur de difficulté deterministe avec plafonds, repos, formations et boss à phases bornées.
- [x] Afficher SCORE de partie, HIGH SCORE local, TEMPS et NOUVEAU RECORD en fin de partie.
- [x] Supprimer les monuments de l'espace profond, interpoler atmosphère/surface et sortie, conserver leurs bases masquées.
- [x] Garder le noyau `A & B`, les cicatrices, la sauvegarde JSON format 1, l'ID Android et le build APK uniquement.
- [x] Écrire tests de progression et de parallaxe et synchroniser le HTML autonome.
- [ ] Vérifier `npm test` et la reconstruction exacte `npm run build:standalone` dans GitHub Actions.
- [ ] Obtenir captures d'un véritable navigateur aux cinq phases et évaluer artistiquement leur continuité.
- [ ] Contrôler FPS/RAM et anciennes sauvegardes sur un Samsung physique ; la validation locale seule ne suffit pas.
- [ ] Contrôler compilation APK v0.4.8 code 48, `apksigner`, SHA-256, ressources et asset direct de Release ; aucun AAB.
- [ ] Conserver anciennes Releases et ne pas fusionner la branche dans `main` sans autorisation distincte.

### Vérifications réalisées après l'implémentation 0.4.8
- [x] `npm test` : 82 tests réussis via GitHub Actions (run `42212267579`).
- [x] HTML autonome régénéré par les sources et comparé byte-à-byte (workflow réussi).
- [x] Gradle assembleDebug Android version 0.4.8 code 48 ; aucune compilation AAB.
- [x] Signature Android v2 (clé Debug), package et ressources du ZIP APK vérifiés en CI ; SHA-256 calculé et attaché en complément de la Release.
- [x] Nouvel APK direct publié dans `v0.4.8-progression-parallaxe-preview`, anciennes Releases conservées.
- [ ] **QA manuelle restante :** captures comparatives dans vrai navigateur, FPS/RAM Android Samsung, entrée-sortie atmosphérique et équilibrage en partie longue.
- [ ] **Compatibilité d'installation :** la clé de signature Debug n'est pas encore stable ; vérifier un processus de mise à jour sur place, en conservant les univers par export JSON, avant de garantir l'absence de perte de données.
- [ ] **Visuels :** revoir les silhouettes à très haute altitude et les couches parallax sur Samsung ; ajuster la richesse artistique selon observations, ne pas présenter les tests de logique comme une validation graphique.

## 2026-11-06 — OMEGA 0.4.9, commandes à l'inclinaison en paysage
- [x] Corriger les transformations ROTATION_90/270° des données Android `TYPE_GRAVITY` vers le repère logique du jeu.
- [x] Ajouter des cas de test direction physique droite/bas pour rotations 0/90/180/270 et garder calibrage, mode tactile, sensibilité, inversion paramétrable.
- [x] Préserver score, terrain, seed personnelle, collisions A & B, format JSON et identifiant Android.
- [x] CI `42215613968` réussie : APK 0.4.9 13 969 487 octets, contrôles version/package/signature `apksigner` et SHA-256 ; Release `v0.4.9-tilt-axes-preview` et asset `.apk` direct présents.
- [ ] Contrôler physiquement sur Samsung les deux orientations paysage (90° et 270°), les inversions volontairement cochées et le recalibrage du neutre.
- [ ] Valider la conservation de données après mise à jour depuis la version installée ; signature Debug potentiellement différente, prévoir export JSON avant réinstallation.

## 2026-11-06 — OMEGA 0.5.0, météores et passages bonus
- [x] Ajouter mouvements et tirs contextuels, enrichir les formations sans dépasser les plafonds de difficulté.
- [x] Ajouter météo d'astéroïdes de tailles variées, des colonnes avec ouverture, fragmentation bornée, et sprites alpha dérivés du masque AND.
- [x] Ajouter portails cachés déterministes et séquence bonus warp de 16s, sans avance ni mutation de la progression d'univers pendant le détour.
- [x] Distinguer débris inertiels du vide et débris sous gravité/traînée des phases planétaires ; tests unitaires.
- [x] Validation GitHub Actions `42220971930` : 91 tests OK, HTML autonome identique aux sources, compilation Gradle, signature v2, versionCode 50/versionName 0.5.0, SHA-256, Release GitHub avec APK autonome direct de 13 974 539 octets.
- [ ] Contrôler sur Samsung : fluidité des pluies et splits, temps de transition portal, impossibilité de collision terrain pendant warp, qualité de l'animation et équilibre réel.
- [ ] Tester endurance de 10 minutes, densité de projectiles et comportement des portails en présence de grandes barrières.
- [ ] Valider installation par-dessus l'ancienne APK ; exporter JSON avant désinstallation car clé Debug CI susceptible de varier.

## 2026-11-06 — OMEGA 0.5.1, sentinelles blindées et poussée près du sol
- [x] Réserver les météores naturels à l'espace / sortie / bonus warp ; phases atmosphère/surface/intérieur : sentinelles robotiques résistantes à tirs dirigés, sans explosion de mine au contact.
- [x] Modéliser un tangage progressif proportionnel au déplacement horizontal (avance nez bas, recul nez haut) et les trajectoires laser/missile alignées sur le nez.
- [x] Tourner la forme visible du vaisseau et des tirs avec le masque AND issu des mêmes pixels, sans redimensionnement de masque théorique approximatif.
- [x] Ajouter panaches de propulseurs et poussière stratifiée près du vrai relief, avec limite RAM/entités, aucune poussière en espace profond.
- [x] GitHub Actions `42223944592` réussi : **99/99 tests**, HTML autonome reconstruit identique, musiques CC0, Gradle APK Debug, `apksigner` v2, `aapt` package/versionCode 51, ressources et SHA-256 ; Release `v0.5.1-sentinelles-hover-preview`, asset APK direct vérifié.
- [ ] QA Samsung : assiette et sensations tactiles / capteur, tirs bien dans le prolongement du nez, collisions de la silhouette réellement pivotée, qualité nuages dans les 40 environnements, performances de longue partie et perception des robots.
- [ ] Vérifier si la taille des robots, leur cadence et absence de mine correspondent à l'intention exacte de Fab ; ajustement sur retour de partie.
- [ ] Tester installation / sauvegarde JSON lors d'une mise à jour Android signée Debug avec certificat variable.

## OMEGA 0.5.2 — dégâts visibles limités et robots durables (6 novembre 2026)
- [x] Plafonner l'effacement cumulé des ennemis (dont robots) à 15% des pixels initiaux, sur chaque frame d'animation ; plus aucune disparition excessive du sprite.
- [x] Réduire les rayons de brûlure à mesure que la proportion effacée approche du repère de 20% ; rendre les bords plus jaunes/blancs et lumineux, uniquement sur alpha existant.
- [x] Conserver les PV et dégâts de combat au-delà du plafond ; éviter le déclenchement de destruction instantanée des robots à partir de leur masque.
- [x] Ajouter tests longue durée avec 55+ impacts, contrôle des masques et de toutes les frames animées.
- [x] GitHub Actions `42228246873` : **104/104 tests**, standalone HTML régénéré identique, Gradle APK Debug, package/version code 52, contrôle signature v2, ressources CC0, Release `v0.5.2-incandescence-15pct-preview` et lien APK direct vérifiés ; **13 979 311 octets**, SHA-256 `9cb2d417103666c274379c0eff6645075d210bd0793c69fe09a615032b8ba89c`.
- [ ] Réglage visuel Samsung : équilibre entre petit trou et halo lumineux après ~10–30 tirs, FPS et atlas animé ; possibilité future de tester plafonds 5%, 10%, 15%.
- [ ] Vérifier signature Debug d'installation et sauvegarde de l'univers avant désinstallation.

## H-RUSH OMEGA 0.5.3 — bulle atmosphérique préformée et translative (6 novembre 2026)
- [x] Retirer le rayon animé du globe (ancien 105→1345 px) ; calculer une sphère et halo déjà grands avant leur première apparition.
- [x] Laisser seulement un déplacement déterministe et continu du centre droite→gauche pour l'entrée et sortie, hors champ complet aux deux bornes.
- [x] Conserver effets de chaleur, brumes, parallaxe, relief ET moteur A & B sans changement de sauvegarde ni d'anciens APK.
- [x] Tests de géométrie de rendu et non-régression des transitions et d'absence de saut visible.
- [x] GitHub Actions `42231334713` : **109/109 tests**, HTML autonome identique, Gradle APK Debug, ressources/musiques CC0, vérification `apksigner` v2, versionCode 53/versionName 0.5.3, publication Release `v0.5.3-atmosphere-translation-preview`. Asset APK direct vérifié, **13 979 807 octets**, SHA-256 `cbfe7f200185d821c153976ee67218260ce2e44d0796df5b8877d48a073272a6`.
- [ ] QA manuelle Samsung : comparer approche, entrée, surface, intérieur, sortie, début de région suivante, halos réellement sans artefact visuel ni baisse FPS.

## 2026-11-06 — validation explicite de fusion + publication OMEGA 0.5.3
- [x] Fab a autorisé « Oui release merge là » : PR #6 redirigée sur `main` puis fusionnée ; commit de fusion `c8f1f855a4eb8ff0bdc12e2fa8f65bce4da58dc4`. Toute la chaîne OMEGA 0.4.8 à 0.5.3 est maintenant sur `main` sans écrasement des tags historiques.
- [x] GitHub Actions `42239384805` sur `main` : 109/109 tests, HTML autonome à jour, Gradle APK Debug, contrôle de signature v2, package et code 53, médias présents, publication réussie.
- [x] Release GitHub **finale**, non marquée préversion : `v0.5.3` — https://github.com/greenpower2669/H-rush/releases/tag/v0.5.3 ; APK autonome direct https://github.com/greenpower2669/H-rush/releases/download/v0.5.3/HRush-Omega-v0.5.3-atmosphere-translation-debug.apk ; **13 979 807 octets**, SHA-256 `f1065958d3603e637bffa50145ca4f725c25de92acae8023fa0e2d8ad8625825`.
- [ ] La Release stable de GitHub contient une **APK Debug** et ne possède pas encore de signature de distribution permanente. Exporter l'univers JSON avant une réinstallation si Android refuse une mise à jour en place.
- [ ] QA sur Samsung : FPS, transitions atmosphériques, animation, rendu des effets, calibration des commandes ; aucun test physique encore confirmé.

## H-RUSH OMEGA 0.5.4 — ordre de correction intégral (6 novembre 2026)
- [x] Atmosphère de même taille visible après disparition de la terre ; brouillard cohérent après sol/grotte, extinction avant région suivante.
- [x] Diviser les bonus : 24 s au moins entre apparitions, un seul simultané, chance de base 9,5%, suppression des fragments généreux et du bouclier imposé tous les 11 kills.
- [x] Cacher le portail warp dans une alcôve de roche, près du vrai sol et derrière les tuiles opaques, tout en gardant un accès collision AND.
- [x] Réapparaître après le warp en phase spatiale de la région suivante, sauvegarder la distance et les cicatrices, nettoyer l'ancienne rencontre.
- [x] Les colonnes arrivent entièrement hors écran ; les colonnes et barrières oscillantes passent derrière le relief solide.
- [x] Écrire des tests de géométrie, plafond de bonus, warp, couches et progression de difficulté.
- [x] GitHub Actions `42249472579` sur branche 0.5.4 : **116/116 tests**, HTML autonome identique, Gradle APK Debug, versionName 0.5.4/code 54, vérification signature v2, média CC0, publication de la préversion `v0.5.4-pacing-atmosphere-warp-preview`. Asset APK direct vérifié, **13 981 163 octets**, SHA-256 `4af9673ad70ba2fd97d7d6cbdb06046c6dc551496ff3d4630f9d30d160ed8bbd`.
- [ ] QA Samsung : mesurer fluidité et apparition réelle des portails/obstacles, voir l'atmosphère après le sol, fréquence des bonus, sortie warp sur plusieurs régions, compatibilité de l'installation.
- [ ] Validation explicite de Fab requise avant fusion `main`. Aucune génération AAB avant commande spécifique.

## OMEGA 0.5.5 — cadres d'atlas, faune, véhicules, racines et boss (6 novembre 2026)
- [x] Conserver les atlas réels, supprimer les rectangles de fond résiduel par `cleanFrameMatte` et fabriquer le masque AND depuis la même ImageData RGBA.
- [x] Enrichir les ennemis à 52 rôles, 49 morphologies et 16 profils de boss avec deux états d'animation Canvas et les attaques changeantes selon la phase.
- [x] Ajouter organismes de plafond (racines/tentacules/lianes), worms avec saut, tourelles/forteresses, blindés et véhicules terrestres, aéronefs et vaisseaux spatiaux.
- [x] Sélection déterministe par graine/région/biome/phase et cache borné (140), sans toucher aux sauvegardes ni à la difficulté progressive.
- [x] Tests dédiés aux mats alpha, 52 espèces, couverture des morphologies, variété des boss, animation/AND source ; 124/124 tests réussis sur GitHub Actions `42254515405`.
- [x] Construire APK direct **OMEGA 0.5.5/code 55** signé Debug et prérelease GitHub ; **13 989 503 octets**, SHA-256 `1cded1715110967f6965eaceaa9b2069440b113a97281b56d0a057a96efc19b9`.
- [ ] **QA Samsung matérielle indispensable :** confirmer disparition effective du cadre sur la frame de la capture, vérifier 49 silhouettes et 16 boss réellement reconnaissables, animations/root/warp, fluidité et RAM lors de longues sessions. Ajouter une capture comparative du sprite fautif si des fuites restent.
- [ ] Mesurer les pics de cache Canvas et de copies de cicatrices en sessions d'endurance ; envisager cache de tailles adaptées et amélioration des modèles vectoriels par sprites HD une fois le gameplay validé.
- [ ] Tester la signature Debug sur mise à jour ; sauvegarder l'univers JSON avant désinstallation.
- [ ] Faire approuver explicitement une fusion de la PR #8 avant de changer `main` ; protéger la 0.5.3 stable et les Releases 0.5.4/0.5.5.

## H-RUSH OMEGA 0.5.6 — deuxième doigt, tirs nez-vecteur et ajustement tactile (6 novembre 2026)
- [x] Confirmer les ennemis suspendus et worms de 0.5.5 ; conserver leurs profils et modes d'apparition.
- [x] Donner au deuxième doigt un verrou indépendant du premier avec missiles à la pose et guidage des lasers/missiles tant que le doigt reste appuyé ; retour au tir normal en relâchant.
- [x] Permettre une pose **sous** racines/tentacules du plafond, **au-dessus** des worms/tourelles/sol ; correction ±54 px gauche/droite, ennemis volants ±64 px haut/bas.
- [x] Recalculer la direction depuis le vrai nez incliné après chaque avance/recul ; suivre une cible mouvante, ne pas verrouiller les ennemis morts/hors champ, viser un pixel alpha encore opaque.
- [x] Rotation sprite + masque AND des projectiles jusqu'à ±π, guidage progressif missile verrouillé, guide visuel non-collisionnel, captures tactiles propres (troisième doigt ignoré, blur/cancel).
- [x] Guide tactile mis à jour, bundle standalone reconstruit identique aux sources.
- [x] GitHub Actions `42265215991` **134/134 tests**, APK Debug autonome `0.5.6` / versionCode `56`, package/signature validés, Release préversion publiée et asset direct vérifié : **13 992 583 octets**, SHA-256 `909ff6c14f0815d5ef7435e66ae86b277711fef9e492fa2ab28abef2a238c048`.
- [ ] QA Samsung : véritable multitouch en paysage, cas premier doigt pilotant + second doigt glissant, verrou sous racine/tentacule, au-dessus du worm sauteur, tir en arrière/avant, guidage missiles, troisième doigt et relâchements rapides, FPS.
- [ ] Vérifier si changement de certificat Debug impose une réinstallation ; **exporter l'univers JSON avant désinstallation**, ne jamais le faire perdre.
- [ ] Valider la 0.5.5 et 0.5.6 avant éventuelle fusion des PR #8/#9 vers `main`. Aucune fusion sans autorisation explicite ; aucun AAB.


## H-RUSH OMEGA 0.5.8 — double-tap, passage graphique global (6 novembre 2026)
- [x] Créer une branche dédiée 0.5.8 depuis 0.5.7 sans fusion automatique ; PR #12 en brouillon.
- [x] Ajouter double tap missile au premier doigt (sans interrompre le pilotage), puis au deuxième ; conserver l'acquisition ciblée et le premier missile immédiat du deuxième doigt ; éviter une deuxième consommation de munition sur ce geste.
- [x] Bornes d'anti-erreur temporelles/spatiales, vérification du déplacement cumulatif et nettoyage des identifiants de pointer sur blur, reset ou cancel.
- [x] Revoir les 49 ennemis et 16 boss par familles de matériaux, couleurs cohérentes, détails de coque/cockpit, lumières, textures et orientation des aéronefs vers la gauche ; biseau RGB uniquement, aucune modification d'alpha ou des masques AND.
- [x] Conserver la visée deuxième doigt 0.5.6, le combat au sol et les vers 0.5.7, les sauvegardes et l'état du gameplay.
- [x] Actualiser le guide tactile et assembler les sources dans l'HTML autonome identique à la version Android.
- [x] Ajouter des tests double-tap, anti-drag et invariance alpha du traitement graphique ; adapter deux assertions anciennes sur le sens des vers et le reset des touches.
- [x] CI validée : GitHub Actions [42272382589](https://github.com/greenpower2669/H-rush/actions/runs/42272382589), **152/152 tests**, bundle autonome reconstruit à l'identique, APK Debug Android 0.5.8/code 58, signature/package/musiques/branding vérifiés. Prérelease [v0.5.8-double-tap-bestiary-preview](https://github.com/greenpower2669/H-rush/releases/tag/v0.5.8-double-tap-bestiary-preview), APK [direct](https://github.com/greenpower2669/H-rush/releases/download/v0.5.8-double-tap-bestiary-preview/HRush-Omega-v0.5.8-double-tap-bestiary-debug.apk) : **14 000 499 octets**, SHA-256 `2d01be8dc4f8042272ad2f1ba25b2d07b4af81c81cc1505db09c152ab9f21fd2` (digest d'asset GitHub).
- [ ] QA Samsung en paysage : tap/double tap des deux doigts, pilotage pendant tir, mouvements vers et depuis l'ennemi, absence de double dépense de munitions, contrôles rapides, absence de faux missiles lors des glissés.
- [ ] QA visuelle et performances : silhouettes reconnaissables (49 ennemis/16 boss), orientation, contraste, masques et cratères AND exacts, fluidité RAM/FPS et rendu de longues parties. Si le style procédural n'est toujours pas assez riche, planches artistiques HD à étudier avant une version finale.
- [ ] Exporter l'univers JSON avant toute désinstallation, vérifier la compatibilité du certificat Debug sur appareil, faire valider la PR #12 avant toute fusion vers main. Aucun AAB demandé.

## H-RUSH OMEGA 0.5.9 — stabilité WebView (6 novembre 2026)
- [x] Examiner les sources 0.5.8 : aucune gestion native du renderer WebView disparu, caches de rotations de sprites blessés potentiellement coûteux et boucle de rendu sans diagnostic d'erreur.
- [x] `onRenderProcessGone` native : diagnostic local, détachement/destruction de la WebView invalide, redémarrage unique puis écran de reprise manuelle si récidive en 90 secondes.
- [x] Activer un mode graphique mémoire réduite après terminaison, sans changer la résolution logique des collisions AND.
- [x] Catch sur `requestAnimationFrame`, panneau d'erreur lisible, diagnostic JS enregistré localement et bouton Diagnostic accessible depuis Univers.
- [x] Marquage des copies de sprites blessés comme volatiles : 4 rotations en cache au lieu de 32, plus de recréation de raster si frame/bucket/tir inchangés.
- [x] Tests statiques du mécanisme natif, diagnostic, garde-fous de caches ; HTML autonome synchronisé avec le code.
- [ ] Valider GitHub Actions : tests, HTML inchangé après reconstruction, APK signé 0.5.9/code 59 et checksum ; n'annoncer une livraison qu'après publication réelle.
- [ ] Essais Samsung : crash pendant combat long, nombreux adversaires blessés, pause/reprise, changement d'application, rotation, vérification des crashes et du mode graphique réduit, collecte éventuelle du diagnostic depuis Univers.
- [ ] Mesurer FPS/RAM réels sur une session longue, distinguer arrêt de WebView, exception JS et arrêt système complet ; si les crashs persistent, collecter logcat Android et heure/circonstances.
- [ ] Vérifier mise à jour APK/signature sans désinstallation ni perte de sauvegarde ; exporter l'univers JSON avant manipulation. Aucune fusion `main` et aucun AAB.
