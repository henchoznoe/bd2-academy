# BD2 Academy

Application de révision en français construite à partir des 20 PDF du cours et des quatre TP. React, TypeScript strict, Tailwind CSS, Vite, MDX, CodeMirror et DuckDB-WASM.

## Démarrer

Prérequis : **Node 24** et **pnpm 12.15.0**.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Ouvrir l'adresse affichée par Vite. Les fichiers WebAssembly et les workers sont préparés automatiquement depuis la dépendance verrouillée ; aucun CDN ni compte de base de données n'est nécessaire.

```sh
pnpm check        # tests, TypeScript et build de production
pnpm preview     # servir le dossier dist après le build
pnpm test:sql    # exécuter les solutions sur le moteur WebAssembly embarqué
```

## Contenu et fonctionnement

- Huit modules, diagnostic BD1 facultatif, quatre parcours de TP et deux anciens TE1 avec variantes identifiées.
- Chaque question du programme possède une correspondance dans `/sources` ; les références utilisent les positions réelles des pages PDF.
- Sept ateliers : DF, normalisation, B/B+arbres, stockage, bitmaps/hachage, TF-IDF et vecteurs.
- Les exercices SQL comparent les résultats sur deux jeux : valeurs, doublons, NULL et ordre uniquement lorsqu'il est demandé. Les alias peuvent varier. Les résultats numériques sont comparés avec une précision de huit décimales ; le moteur pédagogique utilise la conversion numérique Arrow pour les nombres du cours.
- Le bac SQL repart d'un jeu neuf à chaque exécution. Plusieurs instructions sont possibles ; le dernier résultat est affiché. Limite d'affichage : 100 lignes, limite de résultat : 10 000 lignes, interruption automatique après 30 secondes.
- IndexedDB conserve brouillons, tentatives, acquis et journal. L'export JSON versionné permet de changer d'appareil. Un import affiche un aperçu avant remplacement. L'export Markdown permet de conserver une synthèse de ses propres acquis.
- Lecture, compréhension déclarée, réussite évaluée et correction consultée restent distinctes. Chaque visiteur commence avec zéro acquis, zéro tentative et un journal vide. Le format de progression v2 efface les données héritées de la version 1, puis conserve les nouvelles révisions de chacun localement. Les anciens exports v1 sont incompatibles afin de ne pas réintroduire ces données.

## Sources, vocabulaire et limites

Les PDF originaux et la copie nominative ne sont pas inclus. Les fichiers SQL étudiants ont servi à repérer les ressources, sans être assimilés à des corrigés enseignants. Les données cinéma/zoo sont choisies ; les commandes sont un extrait des scripts du TP3 ; les 1 288 films proviennent du CSV du TP4.

La terminologie de la professeure est prioritaire : **1FN, 2FN, 3FN, BCNF et 4FN**, fonctions d'aiguillage, index recouvrant. L'ordre des arbres suit **d**, soit au plus **2d clés** et **2d+1 enfants internes**. La hauteur compte les niveaux. L'atelier TF-IDF utilise le TF normalisé. Les synonymes introduits sont expliqués.

Voir les audits sourcés dans `docs/TERMINOLOGIE-RELATIONS.md`, `docs/TERMINOLOGIE-SQL.md` et `docs/TERMINOLOGIE-INDEX.md`. Ils recensent les correspondances et les recommandations qui ont servi à harmoniser le site ; les remarques d'audit ne constituent pas des exercices supplémentaires.

DuckDB-WASM 1.32.0 embarque ici DuckDB v1.4.3. Un résultat DuckDB ne valide pas toute la sémantique Oracle/MySQL. Les syntaxes spécifiques, Full Text MySQL, plans et mesures réelles restent guidés. Les simulateurs sont identifiés comme pédagogiques. La page `/compatibilite` permet de tester les constructions et toutes les solutions dans le navigateur.

Le TE1 2024–2025 est incomplet : page imprimée 3 et annexes absentes. Le TE1 2025–2026 contient ses dix pages dans un ordre photographique inhabituel, sans ses annexes. Les données choisies sont annoncées ; les consignes historiques ne définissent pas celles du prochain examen. UNPIVOT, les fonctions signalées non étudiées et la 5FN restent des repères.

## Structure

- `src/content/**/*.mdx` : leçons et métadonnées.
- `src/content/**/exercises.json` : énoncés, indices, corrections, références et jeux.
- `src/lib/catalog.ts` : schémas Zod et contrôles de couverture.
- `src/lib/relations.ts`, `trees.ts`, `calculations.ts` : moteurs déterministes.
- `src/lib/sql.ts`, `datasets.ts`, `results.ts` : exécution et comparaison SQL.
- `src/lib/progress.ts` : modèle versionné et sauvegarde.
- `tests/` : contrôles du contenu, des algorithmes, de la persistance et des 114 cas SQL.

## Hébergement Vercel

Importer le projet comme application **Vite**, avec **Node 24**, `pnpm build` et sortie **dist**. `vercel.json` contient la réécriture SPA pour les liens directs. Les ressources DuckDB, scripts et JSON restent servis comme fichiers. Aucune variable d'environnement, API payante ou base distante n'est nécessaire.

Le build et les routes locales sont contrôlés ; aucun déploiement distant n'est revendiqué. Après déploiement, vérifier le rafraîchissement d'une page `/lecons/sql-case` et l'exécution d'une requête SQL.

Le corrigé Full Text `3_TP_index_FT_sol.pdf` (22 pages) est référencé comme SOL-FT : toutes les sous-questions ont été revues, ainsi que les annexes et coquilles. Voir `docs/CONTROLE-TP-FULLTEXT.md`.

Le TE1 2025–2026 ajoute 5 leçons et 25 questions avec références aux pages physiques du PDF. Les exemples remplaçant les annexes sont signalés ; les trois exercices SQL utilisent les jeux existants et leur variante. La sauvegarde v2, sa clé IndexedDB et tous les anciens identifiants restent inchangés. Voir `docs/CONTROLE-TE1-2526.md`.

## Séries de QCM

`/qcm` regroupe les QCM par chapitre et anciens TE1. 162 QCM supplémentaires couvrent chacune des 81 leçons (deux nouveaux par leçon), avec une seule réponse correcte, indices et explication. La correction s’ouvre après vérification et la navigation permet d’enchaîner les questions. Les QCM précèdent les exercices SQL et les démarches de réflexion ; aucun exercice historique n’est supprimé.

La première réponse sans aide peut être évaluée normalement ; une nouvelle tentative sur la même question après affichage de la correction reste assistée. Le stockage v2 et les identifiants historiques sont conservés.
