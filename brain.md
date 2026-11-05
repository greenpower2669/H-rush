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
