# BD2 Academy

Application de révision en français construite à partir des 18 PDF du cours, de la roadmap et des quatre TP. React, TypeScript strict, Tailwind CSS, Vite, MDX, CodeMirror et DuckDB-WASM.

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

- Huit modules, diagnostic BD1 facultatif, quatre parcours de TP et ancien examen avec variantes identifiées.
- Chaque question de la roadmap possède une correspondance dans `/sources` ; les références utilisent les positions réelles des pages PDF.
- Sept ateliers : DF, normalisation, B/B+arbres, stockage, bitmaps/hachage, TF-IDF et vecteurs.
- Les exercices SQL comparent les résultats sur deux jeux : valeurs, doublons, NULL et ordre uniquement lorsqu'il est demandé. Les alias peuvent varier. Les résultats numériques sont comparés avec une précision de huit décimales ; le moteur pédagogique utilise la conversion numérique Arrow pour les nombres du cours.
- Le bac SQL repart d'un jeu neuf à chaque exécution. Plusieurs instructions sont possibles ; le dernier résultat est affiché. Limite d'affichage : 100 lignes, limite de résultat : 10 000 lignes, interruption automatique après 30 secondes.
- IndexedDB conserve brouillons, tentatives, acquis et journal. L'export JSON versionné permet de changer d'appareil. Un import affiche un aperçu avant remplacement. L'export Markdown ne modifie pas le fichier original de la roadmap.
- Lecture, compréhension déclarée, réussite évaluée et correction consultée restent distinctes. Les acquis initiaux viennent de la roadmap ; les validations BD1 seulement déclarées sont conservées comme telles.

## Sources, vocabulaire et limites

Les PDF originaux et la copie nominative ne sont pas inclus. Les fichiers SQL étudiants ont servi à repérer les ressources, sans être assimilés à des corrigés enseignants. Les données cinéma/zoo sont choisies ; les commandes sont un extrait des scripts du TP3 ; les 1 288 films proviennent du CSV du TP4.

La terminologie de la professeure est prioritaire : **1FN, 2FN, 3FN, BCNF et 4FN**, fonctions d'aiguillage, index recouvrant. L'ordre des arbres suit **d**, soit au plus **2d clés** et **2d+1 enfants internes**. La hauteur compte les niveaux. L'atelier TF-IDF utilise le TF normalisé. Les synonymes introduits sont expliqués.

Voir les audits sourcés dans `docs/TERMINOLOGIE-RELATIONS.md`, `docs/TERMINOLOGIE-SQL.md` et `docs/TERMINOLOGIE-INDEX.md`. Ils recensent les correspondances et les recommandations qui ont servi à harmoniser le site ; les remarques d'audit ne constituent pas des exercices supplémentaires.

DuckDB-WASM 1.32.0 embarque ici DuckDB v1.4.3. Un résultat DuckDB ne valide pas toute la sémantique Oracle/MySQL. Les syntaxes spécifiques, Full Text MySQL, plans et mesures réelles restent guidés. Les simulateurs sont identifiés comme pédagogiques. La page `/compatibilite` permet de tester les constructions et toutes les solutions dans le navigateur.

L'ancien examen est incomplet : page imprimée 3 et annexes absentes. Les données choisies sont annoncées ; les consignes historiques ne définissent pas celles du prochain examen. UNPIVOT, les fonctions signalées non étudiées et la 5FN restent des repères.

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
