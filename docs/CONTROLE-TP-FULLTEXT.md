# Contrôle du corrigé du TP Full Text

Les 26 sous-questions originales ont été revues et rattachées à `3_TP_index_FT_sol.pdf` (SOL-FT, 22 pages physiques). Deux leçons regroupent la lecture du corrigé et son annexe sur les chaînes ; quatre entraînements distincts couvrent les compléments. Le PDF original reste dans le dossier de cours, sans être distribué par le site.

## Correspondances des questions

| Question     | Pages physiques du corrigé |
| ------------ | -------------------------- |
| TP-FT-0      | 1, 2, 3, 4, 5              |
| TP-FT-4.1.1  | 6                          |
| TP-FT-4.1.2  | 6                          |
| TP-FT-4.2.1  | 6                          |
| TP-FT-4.2.2  | 6                          |
| TP-FT-4.2.3  | 6, 7                       |
| TP-FT-4.2.4  | 7, 18, 19, 20              |
| TP-FT-4.2.5  | 7, 8                       |
| TP-FT-4.2.6  | 8                          |
| TP-FT-4.2.7  | 8, 9                       |
| TP-FT-4.2.8  | 9                          |
| TP-FT-4.2.9a | 9                          |
| TP-FT-4.2.9b | 9, 10                      |
| TP-FT-4.2.9c | 10                         |
| TP-FT-4.2.9d | 10, 11                     |
| TP-FT-4.2.9e | 11, 12                     |
| TP-FT-4.3.1  | 12                         |
| TP-FT-4.3.2a | 12                         |
| TP-FT-4.3.2b | 12                         |
| TP-FT-4.3.2c | 12                         |
| TP-FT-4.3.2d | 12, 13                     |
| TP-FT-4.3.2e | 13                         |
| TP-FT-4.3.3  | 13                         |
| TP-FT-4.4.1  | 13, 14                     |
| TP-FT-4.4.2  | 14                         |
| TP-FT-4.4.3  | 14, 15, 16                 |
| TP-FT-A1     | 7, 18, 19, 20, 21          |
| TP-FT-A2     | 19                         |
| TP-FT-A3     | 18, 19, 20, 21, 22         |
| TP-FT-A4     | 16, 17                     |

## Résultats et limites vérifiés

- CSV fourni : 1288 films, 463 comédies, 43 comédies avec family dans le résumé, 5 titres dream, 248 titres commençant par The suivi d’un espace. Les temps du corrigé restent historiques.
- SET p.11–12 : les commentaires 48/53 sont inversés. La chaîne brute donne 48, le SET déclaré donne 53, et la présence des deux membres donne 53. Les cinq ajouts sont n=110,182,437,539,1018.
- REGEXP p.8 : le zéro annoncé pour le motif sensible Dream ne correspond pas au CSV fourni, qui contient cinq titres correspondants.
- La demande fear/panic/horror p.9 porte sur title. La version exécutable a été alignée : sept films dans le jeu principal, plutôt qu’une recherche différente dans overview.
- Les SUBSTRING_INDEX premier/dernier p.9–10 ne suffisent pas pour un genre toujours au milieu ; une extraction complète et la solution relationnelle sont expliquées. Les espaces de Science Fiction sont conservés.
- CREATE TABLE AS SELECT et CREATE TABLE LIKE ne conservent pas les mêmes contraintes. L’ajout de PK dépend du schéma réel ; l’identifiant de document InnoDB ne se confond pas avec cette PK.
- Le mode booléen peut calculer un score et être trié explicitement. La note contraire p.14 ne doit pas être apprise. Les scores et comptes d’expansion ne sont pas présentés comme exécutés dans le navigateur.
- Two Deaths explique la différence entre sept sous-chaînes death et six tokens death. Son numéro n vaut 794 dans le CSV fourni, contre 808 dans le corrigé : les positions de lignes ne sont pas des identifiants universels.
- Le témoignage p.16–17 utilise une forme `+*western*` invalide pour InnoDB. La forme `+western*` est un préfixe de mot, dont la sémantique diffère de LIKE avec joker initial.
- Annexe p.18–22 : la phrase générale case sensitive contredit son propre résultat A=a. La collation effective doit être relevée. latin1_general_ci historique ignore bien la casse tout en distinguant les accents ; les résultats 6/11 ne doivent pas être remplacés par ceux d’une collation Unicode moderne.
- Le premier INSERT de la table de test manque une parenthèse ; ORDER doit être ORDER BY. LENGTH mesure les octets et CHAR_LENGTH les caractères ; pingüino vaut 9 octets/8 caractères en UTF-8.

## Vérification et références techniques

Les calculs sur le CSV, les références de chaque question et les cas de chaînes sont couverts par tests/fulltext-correction.test.ts. Les 114 cas SQL sont exécutés avec DuckDB-WASM ; cela ne certifie pas les paramètres, plans ou scores d’un serveur MySQL non exécuté ici.

- [MySQL 8.4 — SET et ordre des membres](https://dev.mysql.com/doc/refman/8.4/en/set.html)
- [MySQL 8.4 — recherche booléenne, scores et jokers](https://dev.mysql.com/doc/refman/8.4/en/fulltext-boolean.html)
- [MySQL 8.4 — effets de la collation](https://dev.mysql.com/doc/refman/8.4/en/charset-collation-effect.html)
- [Poids des collations latin1 dans le code officiel MySQL 8.4](https://github.com/mysql/mysql-server/blob/8.4/share/charsets/latin1.xml)

## Réinitialisation de la progression partagée

Le format v2 démarre sans compétence, tentative, brouillon, journal ou dernière leçon. À la lecture de la nouvelle version, la clé IndexedDB v1 est supprimée ; aucune valeur de l’ancien profil n’est reprise. La progression créée ensuite sous v2 est conservée. Les sauvegardes v1 sont refusées pour éviter leur réintroduction. Les tests vérifient anciens visiteurs, nouveaux visiteurs, rechargement, import/export et indépendance des profils initiaux.
