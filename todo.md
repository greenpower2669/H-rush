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
- [x] GitHub Actions 42096290323 : 13 tests, HTML synchronisé, Gradle, signature v2 et publication vérifiés ; prérelease v0.2.2-android-preview, APK 30 517 octets, SHA-256 `4acebbdfa0ac1faaa948bb6a622bdceb26a33ff388f220c6d3548c3720699ff7`
- [ ] Tester sur Samsung (FPS, CPU, précision aux contacts, multitouch, son) et comparer à 0.2.1
- [ ] Préparer une signature Android de production stable ; ne pas écraser les APK de test d'ancienne clé
- [ ] Réévaluer le coût du préfiltre C selon les scènes ; activer automatiquement uniquement quand rentable
