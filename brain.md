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
