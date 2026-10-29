# Intégration du TE1 2025–2026

Source : `TE1_2526.pdf`, 10 photographies, référence EX-2526. Lecture visuelle de toutes les pages. Les annexes citées dans les exercices 2 à 5 ne sont pas fournies ; les noms et notes de l'étudiant ne sont pas publiés. Les règles d'aide, de durée et de pondération restent historiques.

## Ordre réel et couverture

| Page PDF | Page imprimée | Contenu                                                      |
| -------- | ------------- | ------------------------------------------------------------ |
| 1        | 1             | Présentation et consignes historiques                        |
| 2        | 3             | Questions 1.5 à 1.9                                          |
| 3        | 4             | Question 1.10, puis 2.1                                      |
| 4        | 2             | Questions 1.1 à 1.4                                          |
| 5        | 5             | Questions 2.2 à 2.4                                          |
| 6        | 6             | Questions 3.1 à 3.3                                          |
| 7        | 8             | MySQL après Req3 et Req4                                     |
| 8        | 7             | Bonus 3.4 et MySQL après Req2                                |
| 9        | 10            | Comparaison de Req02 et ReqOptimi                            |
| 10       | 9             | Tableau Oracle et deux premières questions de réécriture SQL |

Les 25 questions et sous-questions ont des identifiants nouveaux EX-2526-*. La préparation est répartie en cinq leçons : théorie ; DF ; normalisation ; stockage ; réécriture. Les chapitres existants renvoient à ces cas. Les trois exercices SQL utilisent course/course-alt, sans modification des jeux déjà utilisés.

## Ce qui est renforcé

- QCM à plusieurs bonnes assertions : transitivité/augmentation, cellule multivaluée, PK composée, UNIQUE et hypothèse non-NULL.
- Anomalie de propagation illustrée par une règle métier explicite.
- Volume des seules données contre volume données + index. Les questions 1.5 et 1.8 ont le même texte visible ; les coches de la copie ne sont pas transformées en corrigé officiel contradictoire.
- LIKE avec joker initial contre recherche de mots, et index recouvrant qui doit aussi couvrir WHERE.
- Contre-exemple qui viole une seule DF, sans violer les contraintes à conserver ; distinction clé/superclé et preuve de DF redondante.
- Clés exhaustives, formes locales jusqu'à BCNF, preuve sans perte par deux applications de Heath avec OU logique.
- InnoDB : clé clustered et localisateur secondaire par PK ; Oracle : heap avec ROWID contre IOT explicitement déclarée. DESC concerne l'index choisi, pas automatiquement la table.
- Réécriture groupée/corrélée/agrégée : équivalence avec NULL et seuil strict ; résultats vérifiés séparément des performances.

## Statut des données

Les DF, données et scripts des annexes ne sont pas récupérables avec certitude depuis les réponses manuscrites. Les jeux DF et normalisation ainsi que Req2/Req3/Req4, ReqOptimi/Req01/Req02 sont donc remplacés par des cas choisis, annoncés dans les leçons et exercices. Aucun temps MySQL ni schéma physique du serveur n'est présenté comme mesuré ici. Les partitions en blocs sont un modèle pédagogique à capacités déclarées.

Les annotations Oracle ne permettent pas d'affirmer une IOT sans son DDL. Le contenu conserve la différence des organisations au lieu de généraliser « PK = clustered » à tous les moteurs.

## Compatibilité de la progression

Aucune modification de `src/lib/progress.ts` ni de `ProgressProvider.tsx`. Format v2, clé `bd2-academy:progress:v2`, import/export et mécanisme de chargement inchangés. Aucun effacement v2, renommage d'ancien identifiant ou nouveau profil initial. Les nouvelles questions n'ont aucune réussite préremplie.

`tests/fixtures/catalog-before-te1-2526.json` fixe les identifiants et associations présents avant cet ajout. Une sauvegarde v2 anonyme représentative vérifie le maintien exact des acquis, brouillons, tentatives, journal et dernière leçon. L'ajout de questions peut modifier un pourcentage global parce que le total augmente ; il ne retire aucun acquis.

## Vérifications

- Correspondance de chaque question avec sa page physique du PDF.
- Fermetures, couverture minimale équivalente et contre-exemple ciblé.
- Clés de normalisation, BCNF des composantes, conservation des DF et absence de perte par étapes.
- Moyenne sur ensemble vide/tout-NULL ; réécritures SQL sur deux jeux avec NULL, égalité au seuil et absence de moyenne.
- Solutions SQL sur DuckDB-WASM : contrôle des résultats, sans extrapolation de performances MySQL.

## Références techniques complémentaires

- [MySQL 8.4 : index clustered et secondaires](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html).
- [MySQL 8.4 : recherche Full Text avec MATCH/AGAINST](https://dev.mysql.com/doc/refman/8.4/en/fulltext-search.html).
- [Oracle 19c : tables heap et index-organized tables](https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/tables-and-table-clusters.html).

Le contrôle final passe 164 tests, TypeScript et le build de production. Les 120 cas SQL (dont 6 nouveaux) passent avec les 114 résultats historiques inchangés. Dans un aperçu isolé, import d’une sauvegarde v2 avec 4 éléments et une note, rechargement sans perte visible, ouverture du nouveau parcours, puis vérification de EX-2526-5.3 sur deux jeux dans le navigateur, sans erreur de console.
