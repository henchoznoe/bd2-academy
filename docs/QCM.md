# QCM par chapitre

162 questions supplémentaires (deux par leçon) portent le total à 217 QCM. Les 81 leçons sont couvertes, y compris les entraînements des deux anciens TE1. Les questions ajoutées sont pédagogiques, à choix unique ; elles ne prétendent pas reproduire un QCM officiel. Chaque question possède quatre choix, une réponse, une explication, deux indices et les références de sa leçon.

| Série                      | QCM disponibles |
| -------------------------- | --------------: |
| SQL avancé                 |              63 |
| Dépendances fonctionnelles |              20 |
| Normalisation              |              30 |
| Organisation physique      |              22 |
| B-arbres et index          |              26 |
| Autres organisations       |               8 |
| Recherche textuelle        |              22 |
| Recherche vectorielle      |               7 |
| Anciens TE1                |              19 |
| Total                      |             217 |

## Utilisation

Le menu QCM ouvre `/qcm` ; `/qcm/:moduleId` propose une série dans l'ordre des leçons. Les liens Question précédente/suivante conservent le contexte de la série. Sans contexte de chapitre, les liens enchaînent les QCM de la leçon. Choisir une réponse puis Vérifier ouvre la correction et son explication. On peut passer une question sans lui attribuer de réussite.

Les QCM sont regroupés avant les autres exercices dans les leçons et les anciens TE1. Le lien vers la série précède la liste des leçons dans chaque chapitre. Les exercices SQL, résultats à calculer et démarches de réflexion sont conservés. Les index de réponse des exercices historiques restent identiques.

## Progression

Aucune nouvelle version de stockage ou migration : la clé `bd2-academy:progress:v2` et le modèle de sauvegarde restent inchangés. Tous les nouveaux identifiants commencent par QCM- ; aucun des 287 anciens exercices n'est modifié ni supprimé. Une nouvelle question commence sans réponse. Le nombre total d'exercices augmente, ce qui ne retire aucun acquis existant.

La réponse est évaluée avant d'enregistrer l'ouverture automatique de la correction. Une première bonne réponse sans aide reste donc une réussite vérifiée. Une réponse correcte après lecture d'un indice ou d'une correction est déclarée comprise, suivant les règles déjà utilisées par le site. Les tentatives suivantes conservent ce suivi, sauf réinitialisation volontaire de l'essai. Le chargement d'une page et le passage à la suivante ne valident pas une compétence.

## Vérifications

- Deux nouveaux QCM pour chacune des 81 leçons, quatre options distinctes, correction cohérente, sources et indices.
- Ordre stable : QCM d'abord, puis les autres exercices, sans modifier le tableau source.
- Séries complètes et uniques suivant l'ordre des leçons.
- Conservation des anciens identifiants et associations, et tests existants de compatibilité exacte des sauvegardes v2.
- Calculs de stockage, TF-IDF, bitmaps, caractères UTF-8 et exemples de DF vérifiés.
- Dix réponses SQL confrontées au moteur WebAssembly, en plus des solutions SQL historiques.
- 170 tests, TypeScript et build de production réussis.
- Dans un aperçu isolé : mauvaise réponse avec correction automatique ; bonne réponse après aide classée déclarée ; première bonne réponse classée vérifiée et conservée au rechargement ; navigation suivante et ordre QCM/exercices contrôlés, sans erreur de console.
