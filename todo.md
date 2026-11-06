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
