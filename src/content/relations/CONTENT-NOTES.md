# DF, normalisation et TP zoo — contenu et contrôles

17 leçons MDX, 64 exercices : les 14 DF-C, 12 FN-C et 16 TP-N de la roadmap, 16 QCM, 4 résultats courts et 2 requêtes supplémentaires. Le total comprend 8 exercices SQL réellement exécutables. Les autres questions qui exigent une démarche sont guidées et ont une réponse complète.

Les références désignent les pages PDF réelles des six fichiers du bloc (C-DF, SOL-DF, C-FN, SOL-FN, TP-N, SOL-N). Les numéros de diapositives imprimés ne sont pas utilisés comme pages. Les répétitions et pages de plan n'ajoutent pas d'objectifs. Les annexes DF/DM sont identifiées ; la 5FN est explicitement non étudiée.

Les données originales du zoo manquent : les schémas et les règles sont conservés mais tous les résultats du laboratoire sont issus de données choisies. Le SQL des cinq requêtes du TP retourne les deux formulations dans un même résultat, avec une colonne `schema`. La question emplacements projette bien numéro, surface et libellé, contrairement au corrigé abrégé qui ne montre que le numéro.

## Nuances mathématiques vérifiées

- DF-C07 : une couverture possible est A→B, ACD→E, EF→G, EF→H.
- DF-C09 : quatre clés, et non seulement les deux fermetures illustrées : B1B2, D1D2, B1C2D1, B2C1D2.
- DF-C12 : sept clés, toutes avec HIJ : compléments BK, BL, CK, CL, DK, DL, EK.
- DF-C13 / FN-C07 : séparer les cibles avant de vérifier la minimalité. Les deux cibles de B1B2→D1D2 ne sont pas toutes deux indispensables dans une couverture atomique.
- FN-C07 : fusionner tous les groupes de sources équivalentes sans recontrôler la 3FN peut produire une relation non 3FN. La synthèse canonique sûre et les contrôles des projections sont donnés, ainsi qu'un contre-exemple à la fusion abusive. Les décompositions équivalentes sont acceptées.
- TP-N-1c : Zoo n'est pas 2FN à cause de la clé alternative Nom,Espece et des dépendances partielles Espece→Origine,Classe, malgré la PK simple Animal.
- TP-N-1b : Animal,Emplacement→Surface est redondante ; la liste finale du corrigé l'omet effectivement.
- FN-C12 : les clés plaque et parent/prénom impliquent les hypothèses explicitement signalées dans le corrigé ; elles ne sont pas des vérités générales.

## Vérification reproductible

Depuis la racine du projet :

```sh
python3 src/content/relations/verify-logic.py
node src/content/relations/verify-content.mjs
```

Le premier vérifie exhaustivement les exemples de clés difficiles, l'irréductibilité des couvertures et la 3FN des morceaux de FN-C07. Le second utilise la version installée de DuckDB-WASM, le vrai `fixtureSQL`, et exécute les solutions SQL sur leurs jeux principal et alternatif. Les contrôles d'incohérence utilisent `zoo-dirty` ; les six autres SQL utilisent `zoo-alt`.

Les fichiers MDX et exercises.json sont les sources éditoriales. Les scripts de vérification ne les réécrivent pas.
