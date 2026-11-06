# Ordre de mission — Ash Rush / ancien nom de travail XY Impact

Demande de Fabrice Gourdant du 5 novembre 2026 : construire un shoot'em up 2D inspiré du rythme de Space Invaders et du défilement de R-Type, avec laboratoire démonstrateur de la collision binaire XY et **effets exactement sur la silhouette touchée**.

Priorités : silhouettes issues d'un bit par pixel occupé ; translation XY ; après AABB détecter l'intersection ; méthode `((A | B) ^ (A ^ B))` équivalente à AND ; conserver la position de chaque bit actif ; mode de préfiltre indépendant X et Y suivi obligatoirement d'une confirmation en 2D ; UI de comparaison A pixel par pixel / B bitmask / C projection et confirmation ; contrôle tactile et clavier ; animations, vie, score, bouclier, petit boss ; benchmarks et tests vérifiables.

Précision complémentaire de Fab : même sur écrans à forte densité, l'image, ses axes et son masque doivent rester parfaitement alignés ; les étincelles et la destruction visible doivent démarrer sur la carlingue au point réellement touché, avec un FX entourant précisément cette zone. Ne jamais vendre l'alignement de la seule projection X/Y comme une preuve de collision 2D.

Livraison initiale : web HTML5/Canvas/CSS3 et JavaScript, sans dépendances, licence MIT. Futures expériences : effets de frôlement, dégâts incrémentaux, sprites haute résolution, tuilage et performance à milliers de tirs ; réutilisation potentielle du moteur dans PrimeMax, sans mélanger les projets.

## Addendum 05/11/2026 — AND direct / ancien XOR réservé au graphique incrémental
- La méthode actuelle de collision est `impact = A & B`, directement sur les mots de la zone commune AABB.
- Les coordonnées XY de tous les bits actifs sont restituées depuis le masque d’intersection, puis utilisées pour les FX et les cratères.
- Le XOR historique de Fab servait à la logique de tampons et d’affichage partiel d’une autre époque.
- Projections X/Y en préfiltre optionnel, confirmation 2D obligatoire ; oracle pixel par pixel A maintenu.
- AND NOT pour effacer les pixels ; tests + benchmark avant/après ; conserver le jeu complet, sons, paysage et APK Android testable.


## Complément 05/11/2026 — correction livraison graphique et décor
- Fab signale que les précédentes livraisons ~300 Ko n'employaient pas les planches visuelles ; installer **de vrais sprites extraits et animés**.
- Ajouter régulièrement des scènes dans un astéroïde géant, **parois creusables en tirant**, contact mortel en un seul choc, détails de géologie et effets incandescents.
- Conserver les zones détruites à la sortie et à la reprise du jeu. Persistance seulement locale au package Android actuellement ; documenter cette limitation.
- Garder exclusivement AABB + AND, sans sélecteur ni bouton labo visible. Conserver smartphone paysage, vaisseau à droite du doigt, deuxième doigt missile, sons Space Fortress.
- Livrer une APK réellement signée et vérifiée comme asset GitHub Release, pas un ZIP. Mesurer sa taille après intégration et ne jamais affirmer l'asset disponible avant sa vérification.

## 2026-11-05 — Mission globale H-RUSH OMEGA
Concepteur : Fabrice Gourdant. Étendre Ash Rush à un univers 2D personnel généré à partir d'une graine unique de >=128 bits ; sauvegarder et retrouver le même terrain, ses découvertes et ses cicatrices ; 40 familles de mondes, 20 archétypes d'ennemis, 12 niveaux d'organisation cosmique, paysages/planètes explorables, parois oscillantes pouvant bloquer et nécessiter le forage avec l'arme de base, destruction des sprites via AND NOT, musique et bruitages, boss multi-écrans et records de distance non exploitables par aller-retour. Conserver exclusivement la collision `A & B` en gameplay, les sprites réels, l'APK paysage et les commandes multitouch. Versions jouables à chaque étape, données validées et dépôt préservé.

**Premier jalon confié à OMEGA 0.4.0 :** seed, génération régionale, parois mobiles destructibles, score, sauvegarde/transport, 20 profils paramétrés, rendu de phases et test d'Android ; toutes les ambitions avancées sont reportées avec traçabilité à `todo.md`.

## 2026-11-05 — Complément OMEGA 0.4.1
À la destruction du vaisseau : afficher GAME OVER, score de partie, Rejouer visible en paysage et Hall of Fame personnel. Ne jamais laisser le joueur croire que l'application est figée ; garder l'univers, les trous creusés et les découvertes après une défaite. Adapter les variantes d'ennemis et leurs actions selon les mondes visités et les situations. Préserver collision de gameplay `A & B`, sprites intégrés, sons, tactile et paysage. Hall mondial restant en tâche séparée faute d'infrastructure sécurisée.

## Correction Fab — 6 novembre 2026 : résistance aux chocs
« One shot » signifiait perte d'un cœur par collision avec une paroi, non destruction immédiate du vaisseau. Un cœur possède plusieurs PV : quatre petits dégâts retirent un cœur. Cinq cœurs au départ. Garder collision AND exacte, pause, Hall of Fame, enregistrement des mondes et bande-son Djipie. Livrer uniquement un APK Android de test direct GitHub Release, sans AAB.

## Addendum OMEGA 0.4.3 — corrections demandées
- Collision roche/paroi : perdre un cœur seulement ; les petits tirs enlèvent des PV avant le prochain cœur. Conserver la protection et les bonus.
- Aucun ennemi ou boss ne doit apparaître ni se déplacer dans le relief opaque. Collision du terrain effective sur toute leur trajectoire et positions des parois mobiles.
- Ajouter des obstacles réellement saillants et bloquants dans les passages, avec diversité de matériaux, oscillations et destruction sauvegardée.
- Préserver l'algorithme `A & B`, les musiques CC0 Djipie, les sons, le tactile paysage, l'univers personnel et le Hall of Fame.
- Livrer uniquement un APK direct sur GitHub, jamais un AAB pour le moment.

## Mission OMEGA 0.4.4 — autorisée par « Go »
Implémenter le pilotage à l'inclinaison avec calibrage et secours tactile, diversifier les apparences des bonus, installer les véritables iconographies et splash écran 16:9 du répertoire `assets/branding`, sans modification de Djipie et sans AAB. Conserver moteur AND et les améliorations OMEGA 0.4.3, exécuter les tests et publier uniquement une APK autonome GitHub Release.

## Ordre OMEGA 0.4.5 — 6 novembre 2026
Retour utilisateur : préférer le tactile au lancement, commandes apparemment inversées ; ajouter dans les options le calibrage tactile, un bouton de bascule tactile/inclinaison, inversions X et Y distinctes. Distribuer parfois des bonus de cœurs supplémentaires. Préserver les versions précédentes ; valider les tests et publier uniquement l'APK.

## OMEGA 0.4.6 — mission retour terrain (6 novembre 2026)
L'utilisateur rapporte une impression de gravité dans le vide, un manque de diversité de niveaux, des barres oscillantes trop fragiles avec cadre rectangulaire peu esthétique, un sol également trop fragile, un son de charge inadapté et des ennemis sans petits impacts visibles. Exigences : aucune gravité passive en espace ; enrichir graphismes et géologie ; faire passer la barre à une dureté intermédiaire (ancienne dureté du sol) et renforcer encore le sol ; retirer tous les cadres ; retirer le son de charge ; de petits trous incandescents persistants doivent changer le vrai masque des vaisseaux ennemis. Conserver collisions gameplay `A & B`, sauvegarde du terrain et commandes, musiques Djipie, Hall of Fame, APK direct uniquement sans AAB.

## OMEGA 0.4.7 — immersion et temps (mission autorisée « Ok code ça »)
1. Corriger les fonds planétaires : bâtiments/montagnes plus grands et variés, bases réellement noyées dans les reliefs et brumes, parallaxe crédible.
2. Allonger significativement espace, atmosphère, survol de surface, intérieur et sortie d'atmosphère, avec limites géologiques cohérentes.
3. Créer une animation de chauffe progressive et légère sur le vaisseau pendant la rentrée et la sortie, sans dégâts ni masque fictif.
4. Remplacer la mesure principale de kilomètres par un temps de survie `mm:ss` / `hh:mm:ss`, sauvegarder le record, présenter la durée dans le Hall of Fame. Conserver la progression distance pour l'anti-exploit du score.
5. Préserver le profil personnel, les cœurs, le tactile/inclinaison, les 24 apparences de bonus, le moteur AND, le branding et les musiques Djipie.
6. Tests supplémentaires et QA navigateur ; publier une seule APK depuis GitHub Actions, **aucun AAB**.

## Mission H-RUSH OMEGA 0.4.8 — Progression et parallaxe (6 novembre 2026)
Commande explicite de Fabrice : reprendre la 0.4.7 Immersion depuis une branche neuve, lire Djipie et les cinq mémoires, préserver `A & B`, les anciennes Releases et l'univers personnel 128 bits. Faire progresser la difficulté avec la survie, les régions et les performances ; multiplier les variétés/combinaisons/embuscades/coopérations, ajouter les phases de boss, prévoir des plafonds, des respirations et zéro passage impossible aux armes de base. Score actuel, HIGH SCORE sauvegardé et temps toujours visibles ; annoncer « NOUVEAU RECORD ! », maintenir Top 10 local et JSON, ne pas créer de serveur mondial imaginaire. Corriger l'impression que monuments et montagnes flottent durant l'approche ou après la sortie : espace profond cosmique, apparition graduelle planète/atmosphère, décors du sol uniquement à altitude cohérente, objets ancrés, diminution et extinction avant l'espace, couches de brume et transitions sans rupture. Conserver les phases longues, la diversité, les cœurs, la destruction des vrais masques, les commandes et musiques Djipie CC0, paysages en 16:9 hors ligne. Tester difficulté longue et début accessible, records, transitions, compatibilité 0.4.7, capture navigateur et performances Samsung. Livrer **uniquement APK Android autonome**, vérifier signature, SHA-256 et ressources, publier comme nouvel asset de Release GitHub ; ne jamais générer d'AAB. Toute exigence non validée doit rester en `todo.md`.

## OMEGA 0.4.9 — axes du capteur d'inclinaison (6 novembre 2026)
Retour utilisateur : « Mais pourquoi les geste sont inversé pour les commande à l'inclinés ? », puis autorisation explicite « Corrige ma biloute ». Corriger les signes de rotation native Android 90° et 270° dans le repère écran XY ; garder la gestion du point neutre, des inversions choisies par le joueur, du tactile prioritaire et des sauvegardes. Tester orientations 0/90/180/270 et délivrer, après CI vérifiée, un APK autonome 0.4.9 en nouvelle prérelease, sans AAB, sans écraser 0.4.8 ni fusionner `main`.

## H-RUSH OMEGA 0.5.0 — comportements, astéroïdes et warp (6 novembre 2026)
Autorisation utilisateur : « plus de variété d enemis comportements de Colone d obstruction des astéroïde en pluie de taille variable et plus petit et en partie en des zone portail warp cachée dans les décors et donne accès a niveau cours bonus ou on ça va super vite mais que plein d astéroïde sont à détruire, ... parfois astéroïde sub divisée ... gravité pour les débris lourd et différent dans l'espace ». Livrer des mouvements/attaques variés, pluie de roches petites et grandes, colonnes évitables/forables, portail discret vers bonus 16 s, fragmentation limitée et physique distinguant inertie en espace, pesanteur et traînée près des planètes. Maintenir mode tactile/inclinaison corrigé, univers 128 bits, sauvegardes, moteur A & B et anciennes Releases ; APK direct, aucun AAB.

## OMEGA 0.5.1 — robots tueurs et vol hélicoptère sous gravité (6 novembre 2026)
Demande : « En gravité, ... pas de meteors des astéroïde robot tueur endurant et qui n'explose comme une mine ... au dessus du sol s'incline pour avancer comme un elicoptère ... visualiser en nuage et particiles la poussée des propulseurs ... panache de poussière ... si il avance il se penche le nez vers le bas et les tirs suivent et si il recule le contraire. » Livrer des sentinelles blindées à tirs dirigés sans explosion au choc dans les phases gravitationnelles, préserver météores dans l'espace et le warp ; piloter le nez vers le bas en avant / vers le haut en arrière, orienter lasers/missiles et masque alpha ensemble ; jets et poussière visuelle conditionnés à la proximité réelle du relief. Préserver les versions antérieures, le moteur AND, l'univers et l'APK direct, sans AAB.

## OMEGA 0.5.2 — intégrité des ennemis et halos (6 novembre 2026)
Message : « les ennemis ... des parties d'eux sont retirées ... ça fait bizarre ... limiter à 5 à 15 pourcent ... on commence à 15 ... plus on approche de 20 pourcent plus le trou est petit mais plus l'incandescence est lumineuse et intense ... robot endurant aussi ». Choix de première itération : budget d'effacement **au maximum 15%** de la surface alpha initiale par ennemi et par frame ; **20% est un repère de saturation thermique, jamais un droit d'effacer davantage** ; impacts répétés diminuent la taille des trous, augmentent l'incandescence ; les PV continuent à diminuer ; robot blindé ne peut pas mourir simplement à cause d'un grand trou dans le masque. Garder collisions `A & B`, sauvegardes et version 0.5.1 ; nouvelle branche et APK direct 0.5.2 sans AAB.

## H-RUSH OMEGA 0.5.3 — la bulle atmosphérique arrive et repart déjà grande (6 novembre 2026)
Retour joueur : la bulle atmosphérique gonfle et rétrécit visiblement, ce qui choque l'œil ; la faire préexister à taille définitive, hors de l'écran, et faire apparaître/disparaître la bulle uniquement par **translation** de sa grande sphère. Ni zoom, ni pop, ni rétrécissement de fin. Préserver l'immersion, l'enveloppe de décor, les collisions, les mémoires et l'univers personnel ; tester puis publier nouvel APK autonome dans une branche 0.5.3, sans AAB, sans fusionner `main`.

## 2026-11-06 — ordre de mise en commun et Release 0.5.3
Fab : « Ouinrelease merge la » — interprété comme autorisation explicite de publier et de fusionner maintenant. Consigne exécutée : PR #6 fusionnant toutes les versions de 0.4.8 à 0.5.3 dans `main` ; Release finale GitHub v0.5.3 distincte des préversions, avec APK direct signé Debug (pas d'AAB), sauvegardes et historique préservés. Validation Android matérielle et certification d'une clé de signature pérenne restent des suites à gérer séparément.

## OMEGA 0.5.4 — atmosphère, bonus, warp et obstacles (6 novembre 2026)
Message de Fab : « L'atmosphère termine trop tôt, la terre d'abord et la bulle d'atmosphère après ; trop de bonus ; warp portals cachés dans du décor et réapparition dans l'espace ; colonnes d'obstruction mouvante nées hors écran et placées derrière terre/grotte ; difficulté progressive ? » Puis autorisation : « Ok code ça ». Préserver la difficulté graduelle et ses plafonds, la graine 128 bits, la sauvegarde JSON, les collisions AND, les cœurs et versions précédentes. Créer 0.5.4 sur branche issue de `main`, tester, livrer l'APK direct en préversion et ne pas fusionner `main` sans consentement distinct.

## OMEGA 0.5.5 — nouvelles silhouettes, boss et cadres de sprites (6 novembre 2026)
Demande de Fab sur capture du jeu : « Sprite mal découpé sur certaines images, on voit le cadre », puis augmentation drastique de la diversité : racines/tentacules venant d'en haut, worms sauteurs, véhicules terrestres, aériens et spatiaux, structures défensives, bestiaire organique et robotique, boss plus nombreux et diversifiés ; confirmation « Code ça ». Traiter d'abord le dématage d'atlas et le calcul AND issu des mêmes pixels, étendre réellement les silhouettes et les comportements avec variantes et boss multi-phases ; garder difficulté progressive, save JSON, collisions A & B, warp, bonus, atmosphère, commandes et anciennes versions. Livrer APK test autonome sous GitHub Releases, aucun AAB, ne fusionner `main` qu'avec nouvel accord. État : PR #8 brouillon, code/CI et préversion v0.5.5 livrés, tests réels du Samsung encore ouverts.

## OMEGA 0.5.6 — visée au deuxième doigt (6 novembre 2026)
Fab : « si le deuxième doigt est juste en dessous d'un ennemi au plafond/sol alors les tirs vecteur du nez du vaisseau à l'ennemi ; les avancées et reculs affectent le tir ; tirs réajustés avec marge gauche/droite pour sol/plafond, haut/bas pour ennemi en l'air ; racines, tentacules et vers sauteurs bien intégrés ? » Réponse et exécution : oui ces espèces ont été introduites en 0.5.5, mais le guidage second doigt était absent. 0.5.6 implémente acquisition relative au relief, verrouillage et marges X/Y, recalcul vectoriel depuis nez réel après mouvement, lasers/missiles orientés avec masques AND, missile initial conservé, marqueur discret, retour au tir par tangage à la levée du deuxième doigt. Tests automatiques 134/134 ; APK Debug direct via Release en préversion, PR #9 non fusionnée vers `main`. Essais physiques Samsung et installation/sauvegarde restent nécessaires.


## H-RUSH OMEGA 0.5.8 — missiles au double tap et esthétique du bestiaire (6 novembre 2026)
Demande de Fab : « Pour H Rush ajoute double tap deuxième ou premier doigt pour le missile ; améliore la totalité du bestiaire et vaisseaux ennemis, car là c'est moche. » Reprise strictement depuis la branche 0.5.7, sans perdre les racines, vers fouisseurs, chars, tourelles balistiques, visée 0.5.6, jeu ni sauvegardes. Double tap court d'un premier doigt (pilote) et d'un deuxième doigt (visée) déclenche chacun un missile ; conserver le tir immédiat au premier appui du deuxième doigt, empêcher la double consommation lors d'un double appui, distinguer les rôles et identifiants transitoires. Refaire la lecture visuelle des 49 ennemis et 16 boss : palettes de matériaux, relief, coques, moteurs, organiques, cockpit et orientation des vaisseaux vers le joueur ; dessiner et tester le masque AND à partir du même raster alpha, y compris pour les pièces blessées. L'APK Android doit être autonome (version 0.5.8/code 58) et accessible comme fichier direct après tests et signature, sans AAB. Ne pas fusionner main sans validation distincte. QA réelle Samsung encore obligatoire pour la qualité visuelle et les gestes.

## H-RUSH OMEGA 0.5.9 — crash intermittent sur Android (6 novembre 2026)
Retour Fab : « Le jeu crash parfois ». Sur la 0.5.8, le moteur WebView Android n'avait aucun `onRenderProcessGone` ; une mort du processus de rendu (crash/pression mémoire) pouvait interrompre l'application native. En l'absence de journal Samsung, l'origine du crash n'est PAS établie. Mission corrective : gérer l'arrêt du processus, détruire la WebView morte et la recréer en conservant les sauvegardes déjà écrites ; limiter les boucles de redémarrage avec un écran d'essai manuel ; exposer le dernier incident localement. Isoler les exceptions JavaScript de la boucle d'animation dans une interface de secours copiable, réduire les rotations en cache des sprites blessés et supprimer les recalculs de formes inchangées. Conserver gameplay, double tap, bestiaire, collisions AND, package et fichier JSON ; APK direct 0.5.9/code 59 uniquement après compilation et vérifications ; ne pas fusionner sans accord.
