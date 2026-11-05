# Ordre de mission — Ash Rush / ancien nom de travail XY Impact

Demande de Fabrice Gourdant du 5 novembre 2026 : construire un shoot'em up 2D inspiré du rythme de Space Invaders et du défilement de R-Type, avec laboratoire démonstrateur de la collision binaire XY et **effets exactement sur la silhouette touchée**.

Priorités : silhouettes issues d'un bit par pixel occupé ; translation XY ; après AABB détecter l'intersection ; méthode `((A | B) ^ (A ^ B))` équivalente à AND ; conserver la position de chaque bit actif ; mode de préfiltre indépendant X et Y suivi obligatoirement d'une confirmation en 2D ; UI de comparaison A pixel par pixel / B bitmask / C projection et confirmation ; contrôle tactile et clavier ; animations, vie, score, bouclier, petit boss ; benchmarks et tests vérifiables.

Précision complémentaire de Fab : même sur écrans à forte densité, l'image, ses axes et son masque doivent rester parfaitement alignés ; les étincelles et la destruction visible doivent démarrer sur la carlingue au point réellement touché, avec un FX entourant précisément cette zone. Ne jamais vendre l'alignement de la seule projection X/Y comme une preuve de collision 2D.

Livraison initiale : web HTML5/Canvas/CSS3 et JavaScript, sans dépendances, licence MIT. Futures expériences : effets de frôlement, dégâts incrémentaux, sprites haute résolution, tuilage et performance à milliers de tirs ; réutilisation potentielle du moteur dans PrimeMax, sans mélanger les projets.