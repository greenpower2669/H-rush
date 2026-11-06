# H-Rush OMEGA — Graphismes et identité visuelle

Tous les visuels sont utilisables indépendamment, sans modification du moteur du jeu.

## Assets principaux

- `h-rush-icon-1024.png` — icône carrée de référence, 1024 × 1024, fond transparent autour du contour.
- `h-rush-icon-original.png` — icône carrée d'origine, 589 × 589.
- `h-rush-splash-16x9.webp` — écran d'accueil paysage, **sans HUD**, 1672 × 941.
- `h-rush-splash-9x16.webp` — écran d'accueil portrait, **sans HUD**, 941 × 1672.
- `h-rush-accueil-alternative.webp` — variante d'accueil, **sans HUD**, 946 × 1024.
- `h-rush-composition-alternative.webp` — composition d'ensemble, **sans HUD**, 1536 × 1024.
- `h-rush-embleme-vaisseau.webp` — H en forme de vaisseau, 1254 × 1254.
- `h-rush-hud-concept.webp` — concept HUD historique, **référence graphique uniquement**, 1672 × 941.

Les images panoramiques et conceptuelles sont fournies en **WebP qualité 84** à leur résolution d'origine pour réduire le poids des assets Android/Web ; les icônes sont des **PNG intacts**. Les PNG originaux des autres créations restent disponibles dans le paquet d'assets préparé dans la conversation.

## Intégration

Ne pas afficher le HUD du concept sur les écrans d'accueil. Prévoir `object-fit: cover` avec zone de sécurité pour le logo, et choisir la variante 9:16 en portrait, 16:9 en paysage. Conserver les contrôles et le HUD du moteur de jeu indépendants de ces visuels. Les images ne sont pas encore automatiquement branchées dans l'application : cette livraison concerne les assets.
