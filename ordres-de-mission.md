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
