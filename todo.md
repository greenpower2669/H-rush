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
