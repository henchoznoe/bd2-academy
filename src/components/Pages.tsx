import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Database,
  Film,
  FlaskConical,
  GraduationCap,
  Layers,
  Leaf,
  Network,
  Search,
  Sparkles,
} from "lucide-react";
import {
  coverageIssues,
  exercises,
  lessons,
  lessonById,
  lessonComponents,
  lessonExercises,
  moduleLessons,
  moduleQuizzes,
  prioritizeQuizzes,
  modules,
  skills,
  sources,
  tpTracks,
} from "../lib/catalog";
import { useProgress } from "./ProgressProvider";
import { ExerciseCard, SourceRefs, Empty, Status } from "./Common";
import curriculum from "../content/curriculum.json" with { type: "json" };
const icons = {
  code: Code2,
  network: Network,
  layers: Layers,
  database: Database,
  tree: Network,
  grid: Layers,
  search: Search,
  sparkles: Sparkles,
  film: Film,
  leaf: Leaf,
};
function ModuleIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = icons[name as keyof typeof icons] ?? BookOpen;
  return <Icon size={size} />;
}
export function Dashboard() {
  const { data, record } = useProgress();
  const verified = exercises.filter(
      (e) => record(e.id).status === "verified",
    ).length,
    declared = exercises.filter(
      (e) => record(e.id).status === "declared",
    ).length;
  const resume = lessonById(data.lastLesson ?? "sql-bd1") ?? lessons[0];
  const difficulties = data.journal.filter((j) => !j.resolved).length;
  return (
    <div className="page-enter">
      <div className="eyebrow flex items-center gap-2">
        <span className="indigo-dot" />
        VOTRE PARCOURS, À VOTRE RYTHME
      </div>
      <section className="welcome">
        <div>
          <h1>
            Comprendre.
            <br />
            <span>Pratiquer. Maîtriser.</span>
          </h1>
          <p>
            Tout le cours de bases de données 2,
            <br className="hidden sm:block" />
            un concept et un exercice à la fois.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="button primary" to={`/lecons/${resume.id}`}>
              Reprendre mon parcours
              <ArrowRight size={16} />
            </Link>
            <Link className="button" to="/ateliers/df">
              <FlaskConical size={16} />
              Explorer les ateliers
            </Link>
          </div>
        </div>
        <div className="welcome-graphic" aria-hidden="true">
          <div className="graphic-label">LA THÉORIE PREND FORME</div>
          <div className="graphic-query">
            <span className="query-dot" />
            <code>
              SELECT compréhension
              <br />
              <span>FROM</span> pratique
              <br />
              <span>WHERE</span> curiosité = TRUE;
            </code>
          </div>
          <div className="graphic-connector" />
          <div className="graphic-result">
            <CheckCircle2 size={20} />
            <div>
              <strong>Le déclic est dans l’exercice.</strong>
              <span>Une réponse. Un raisonnement. Un acquis.</span>
            </div>
          </div>
          <span className="graphic-spark one">✦</span>
          <span className="graphic-spark two">✦</span>
        </div>
      </section>
      <div className="stats-grid">
        <div>
          <span className="stat-icon">
            <BookOpen size={18} />
          </span>
          <strong>
            {lessons.filter((l) => l.moduleId !== "examen").length}
            <small>leçons pour tout comprendre</small>
          </strong>
        </div>
        <div>
          <span className="stat-icon">
            <Code2 size={18} />
          </span>
          <strong>
            {exercises.length}
            <small>exercices et questions de TP</small>
          </strong>
        </div>
        <div>
          <span className="stat-icon green">
            <CheckCircle2 size={18} />
          </span>
          <strong>
            {verified}
            <small>réussites évaluées · {declared} déclarées</small>
          </strong>
        </div>
        <div>
          <span className="stat-icon amber">
            <FlaskConical size={18} />
          </span>
          <strong>
            7<small>ateliers interactifs</small>
          </strong>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">LE PROGRAMME</span>
          <h2>De la requête à la structure.</h2>
        </div>
        <Link className="text-link" to="/progression">
          Voir mes acquis
          <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="module-grid">
        {modules.map((module) => {
          const lessonSet = moduleLessons(module.id),
            moduleExercises = exercises.filter((e) =>
              lessonSet.some((l) => l.id === e.lessonId),
            ),
            done = moduleExercises.filter(
              (e) => record(e.id).status === "verified",
            ).length;
          return (
            <Link
              to={`/cours/${module.id}`}
              className="module-card"
              key={module.id}
              data-module={module.id}
            >
              <div className="flex items-center justify-between">
                <span className="module-icon">
                  <ModuleIcon name={module.icon} />
                </span>
                <span className="module-number">{module.number}</span>
              </div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <div className="module-meta">
                <span>
                  {lessonSet.length} leçons <span>·</span>{" "}
                  {moduleExercises.length} exercices
                </span>
                <ArrowUpRight size={17} />
              </div>
              <div className="progress-track">
                <span
                  style={{
                    width: `${moduleExercises.length ? (done / moduleExercises.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </Link>
          );
        })}
      </div>
      <div className="dashboard-bottom">
        <Link className="feature-card" to="/tp">
          <span className="feature-icon">
            <Layers size={24} />
          </span>
          <div>
            <span className="eyebrow">LES MAINS DANS LES DONNÉES</span>
            <h3>Les quatre TP, question par question.</h3>
            <p>
              Cinéma, zoo, index et Full Text. Des indices pour avancer, des
              corrections pour comprendre.
            </p>
          </div>
          <ArrowRight size={20} />
        </Link>
        <Link className="feature-card" to="/progression">
          <span className="feature-icon amber">
            <Sparkles size={24} />
          </span>
          <div>
            <span className="eyebrow">FAIRE LE POINT</span>
            <h3>{difficulties} difficulté(s) à reprendre.</h3>
            <p>
              Conserver le déclic d’une correction et choisir le prochain
              exercice à refaire.
            </p>
          </div>
          <ArrowRight size={20} />
        </Link>
      </div>
      <p className="fine-print mt-5">
        Chaque personne commence sans acquis ni difficulté préremplis. Lire une
        leçon ou afficher une correction ne coche aucune réussite.
      </p>
    </div>
  );
}
export function ModulePage() {
  const { moduleId } = useParams(),
    module = modules.find((m) => m.id === moduleId);
  if (!module) return <Empty>Module introuvable.</Empty>;
  const list = moduleLessons(module.id);
  return (
    <div className="page-enter">
      <Link className="back-link" to="/">
        <ArrowLeft size={15} />
        Mon parcours
      </Link>
      <div className="eyebrow">MODULE {module.number}</div>
      <h1>{module.title}</h1>
      <p className="page-subtitle">{module.description}</p>
      <div className="module-banner">
        <ModuleIcon name={module.icon} size={30} />
        <div>
          <strong>{list.length} leçons pour construire vos repères</strong>
          <p>Lire, dérouler un exemple, pratiquer puis expliquer sans aide.</p>
        </div>
        <Link
          className="button"
          to={module.lab === "sql" ? "/sql" : `/ateliers/${module.lab}`}
        >
          <FlaskConical size={16} />
          Ouvrir l’atelier
        </Link>
      </div>
      <section className="panel mt-6 mb-6">
        <span className="eyebrow">COMMENCER PAR LES QCM</span>
        <h2>{moduleQuizzes(module.id).length} QCM pour vérifier vos repères</h2>
        <p>
          Une seule bonne réponse par question, des indices et une correction
          expliquée. Les exercices SQL et les questions de réflexion restent
          disponibles dans les leçons, après les QCM.
        </p>
        <Link className="button primary mt-4" to={`/qcm/${module.id}`}>
          Ouvrir la série de QCM <ArrowRight size={16} />
        </Link>
      </section>
      <div className="lesson-list">
        {list.map((lesson, i) => (
          <Link
            key={lesson.id}
            to={`/lecons/${lesson.id}`}
            className="lesson-card"
          >
            <span className="lesson-position">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2>{lesson.title}</h2>
              <p>{lesson.summary}</p>
              <span className="fine-print">
                {lessonExercises(lesson.id).length} exercice(s) ·{" "}
                {lesson.skillIds.join(", ")}
              </span>
            </div>
            <Status id={`lesson:${lesson.id}`} />
            <ChevronRight size={18} />
          </Link>
        ))}
      </div>
      <div className="panel mt-6">
        <h2>Critère de réussite</h2>
        <p>
          Je sais expliquer, appliquer sur un autre exemple, justifier les
          hypothèses et reconnaître les pièges. Une réussite sur un cas n’efface
          pas les autres compétences à travailler.
        </p>
      </div>
    </div>
  );
}
export function LessonPage() {
  const { id } = useParams(),
    lesson = lessonById(id),
    { patch, record, update } = useProgress();
  useEffect(() => {
    if (lesson)
      update((p) =>
        p.lastLesson === lesson.id ? p : { ...p, lastLesson: lesson.id },
      );
  }, [lesson?.id]);
  if (!lesson) return <Empty>Leçon introuvable.</Empty>;
  const Content = lessonComponents[lesson.id],
    module = modules.find((m) => m.id === lesson.moduleId),
    siblings = moduleLessons(lesson.moduleId),
    index = siblings.findIndex((l) => l.id === lesson.id),
    practice = lessonExercises(lesson.id),
    read = record(`lesson:${lesson.id}`).understood;
  return (
    <div className="page-enter">
      <Link
        className="back-link"
        to={module ? `/cours/${module.id}` : "/examen"}
      >
        <ArrowLeft size={15} />
        {module?.title ?? "Entraînement à l’examen"}
      </Link>
      <div className="eyebrow">
        LEÇON {index + 1} / {siblings.length}
      </div>
      <h1>{lesson.title}</h1>
      <p className="page-subtitle">{lesson.summary}</p>
      <SourceRefs refs={lesson.sourceRefs} />
      <div className="lesson-layout">
        <article className="panel lesson-article prose">
          <Content />
        </article>
        <aside className="lesson-aside">
          <section className="panel">
            <span className="eyebrow">À LA FIN, JE SAURAI…</span>
            <ul className="objectives">
              {lesson.objectives.map((objective) => (
                <li key={objective}>
                  <CheckCircle2 size={16} />
                  {objective}
                </li>
              ))}
            </ul>
            <label className="check-row">
              <input
                type="checkbox"
                checked={read}
                onChange={(e) =>
                  patch(`lesson:${lesson.id}`, {
                    understood: e.target.checked,
                    status: e.target.checked ? "learning" : "new",
                  })
                }
              />
              J’ai lu cette leçon
            </label>
            <p className="fine-print">
              Lecture suivie séparément des compétences et des exercices.
            </p>
          </section>
          <section className="panel">
            <span className="eyebrow">PASSER À LA PRATIQUE</span>
            {practice.slice(0, 6).map((exercise) => (
              <Link
                className="lesson-practice-link"
                key={exercise.id}
                to={`/exercices/${exercise.id}`}
              >
                <span>{exercise.title}</span>
                <ArrowUpRight size={14} />
              </Link>
            ))}
            {module && (
              <Link
                className="button mt-4"
                to={module.lab === "sql" ? "/sql" : `/ateliers/${module.lab}`}
              >
                Manipuler en atelier
              </Link>
            )}
          </section>
        </aside>
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">VÉRIFIER LE DÉCLIC</span>
          <h2>À vous de pratiquer.</h2>
        </div>
        <span className="fine-print">{practice.length} exercice(s)</span>
      </div>
      <section aria-label="QCM de la leçon">
        <h3>1. Commencer par les QCM</h3>
        <p className="fine-print mb-4">
          Choisir une réponse, la vérifier, puis consulter la correction pour
          comprendre le raisonnement.
        </p>
        <div className="exercise-list">
          {practice
            .filter((e) => e.type === "quiz")
            .map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
        </div>
      </section>
      {practice.some((e) => e.type !== "quiz") && (
        <section
          className="mt-7"
          aria-label="Exercices et questions de réflexion"
        >
          <h3>2. Approfondir avec les exercices et la réflexion</h3>
          <div className="exercise-list">
            {practice
              .filter((e) => e.type !== "quiz")
              .map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
          </div>
        </section>
      )}
      <section className="panel mt-6">
        <h2>Mes repères de compréhension</h2>
        <p>
          Cocher ici enregistre une compréhension déclarée. Les réussites
          évaluées restent identifiées séparément.
        </p>
        {lesson.skillIds.map((id) => {
          const skill = skills.find((s) => s.id === id),
            state = record(id);
          return (
            <label className="check-row" key={id}>
              <input
                type="checkbox"
                checked={state.understood}
                onChange={(e) =>
                  patch(id, {
                    understood: e.target.checked,
                    status: e.target.checked ? "declared" : "review",
                  })
                }
              />
              <span>
                <strong>{id}</strong>{" "}
                {skill?.description ??
                  "Je peux expliquer et réappliquer cette compétence."}
              </span>
            </label>
          );
        })}
      </section>
      <div className="lesson-pagination">
        {siblings[index - 1] ? (
          <Link to={`/lecons/${siblings[index - 1].id}`}>
            <ArrowLeft size={17} />
            {siblings[index - 1].title}
          </Link>
        ) : (
          <span />
        )}
        {siblings[index + 1] && (
          <Link to={`/lecons/${siblings[index + 1].id}`}>
            {siblings[index + 1].title}
            <ArrowRight size={17} />
          </Link>
        )}
      </div>
    </div>
  );
}
export function TracksPage() {
  return (
    <div className="page-enter">
      <span className="eyebrow">LES TRAVAUX PRATIQUES</span>
      <h1>Passer du cours aux données.</h1>
      <p className="page-subtitle">
        Les quatre TP du semestre, avec chaque sous-question et sa correction.
      </p>
      <div className="module-grid">
        {tpTracks.map((tp) => (
          <Link className="module-card" key={tp.id} to={`/tp/${tp.id}`}>
            <span className="module-icon">
              <ModuleIcon name={tp.icon} size={23} />
            </span>
            <h2>{tp.title}</h2>
            <p>{tp.subtitle}</p>
            <div className="module-meta">
              <span>
                {exercises.filter((e) => e.tpId === tp.id).length} question(s)
              </span>
              <ArrowUpRight size={17} />
            </div>
          </Link>
        ))}
      </div>
      <section className="panel mt-6">
        <h2>Des données identifiées</h2>
        <p>
          Les scripts voisins des TP ont été inspectés. Le cinéma et le zoo
          utilisent des données choisies. Les commandes sont un extrait réduit
          des scripts du TP3 ; les 1 288 films viennent du CSV du TP4. Les
          fichiers de réponses de l’étudiant ne sont pas traités comme des
          corrigés enseignants.
        </p>
        <p>
          Les manipulations d’administration, les plans, les scores Full Text et
          les mesures physiques MySQL restent guidés et contextualisés. Une
          mesure non exécutée reste identifiée.
        </p>
      </section>
    </div>
  );
}
export function TrackPage() {
  const { track } = useParams(),
    tp = tpTracks.find((t) => t.id === track);
  if (!tp) return <Empty>TP introuvable.</Empty>;
  const list = prioritizeQuizzes(exercises.filter((e) => e.tpId === tp.id));
  return (
    <div className="page-enter">
      <Link className="back-link" to="/tp">
        <ArrowLeft size={15} />
        Les travaux pratiques
      </Link>
      <span className="eyebrow">TP · {tp.sourceId}</span>
      <h1>{tp.title}</h1>
      <p className="page-subtitle">{tp.subtitle}</p>
      <p className="notice">
        Commencer par une tentative personnelle. Les questions liées à
        Oracle/MySQL ou à une mesure réelle utilisent une démarche guidée ; leur
        compréhension déclarée reste distincte d’une exécution réalisée.
      </p>
      <div className="exercise-list">
        {list.map((e) => (
          <ExerciseCard exercise={e} key={e.id} />
        ))}
      </div>
    </div>
  );
}
export function ExamPage() {
  const sessions = [
    {
      sourceId: "EX-2526",
      title: "TE1 2025–2026",
      description:
        "25 questions et sous-questions : théorie, DF, normalisation, stockage et réécriture SQL.",
      notice:
        "10 pages photographiées, dans l’ordre imprimé 1, 3, 4, 2, 5, 6, 8, 7, 10, 9. Les annexes ne sont pas fournies ; les pages de référence sont celles du PDF.",
    },
    {
      sourceId: "EX",
      title: "TE1 2024–2025",
      description: "24 questions visibles et 6 variantes déjà disponibles.",
      notice:
        "9 pages PDF. La page imprimée 3 et les annexes manquent. Des variantes pédagogiques remplacent les données absentes.",
    },
  ];
  return (
    <div className="page-enter">
      <span className="eyebrow">ENTRAÎNEMENT TRANSVERSAL</span>
      <h1>Relier tous les chapitres.</h1>
      <p className="page-subtitle">
        Deux anciens TE1, avec théorie, exemples et questions à travailler
        séparément.
      </p>
      <div className="notice">
        Les annotations manuscrites sont des indices à vérifier, pas un corrigé
        officiel. Les consignes historiques d’aide, de durée et de pondération
        ne décrivent pas le prochain examen.
      </div>
      <section className="panel">
        <h2>Lire les données avant de calculer</h2>
        <p>
          <strong>Énoncé visible :</strong> ce que demande effectivement la
          question.
        </p>
        <p>
          <strong>Donnée déduite de la copie :</strong> une hypothèse
          argumentée, jamais un fait certain.
        </p>
        <p>
          <strong>Donnée choisie pour l’entraînement :</strong> schémas, DF,
          scripts et chiffres fournis pour remplacer les annexes absentes.
          Chaque exercice annonce sa provenance.
        </p>
      </section>
      {sessions.map((session) => {
        const sessionLessons = lessons.filter(
          (l) =>
            l.moduleId === "examen" &&
            l.sourceRefs.some((r) => r.sourceId === session.sourceId),
        );
        const ids = new Set(sessionLessons.map((l) => l.id));
        const list = prioritizeQuizzes(
          exercises.filter((e) => ids.has(e.lessonId)),
        );
        return (
          <section
            className="mt-7"
            key={session.sourceId}
            aria-label={session.title}
          >
            <div className="section-heading">
              <h2>{session.title}</h2>
              <span className="fine-print">{list.length} entraînements</span>
            </div>
            <p className="page-subtitle">{session.description}</p>
            <p className="notice">{session.notice}</p>
            <div className="panel">
              <h3>Comprendre les raisonnements</h3>
              {sessionLessons.map((l) => (
                <Link
                  className="lesson-practice-link"
                  to={`/lecons/${l.id}`}
                  key={l.id}
                >
                  <GraduationCap size={16} />
                  <span>{l.title}</span>
                  <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
            <h3 className="mt-7">
              QCM, puis questions de réflexion et exercices
            </h3>
            <div className="exercise-list">
              {list.map((e) => (
                <ExerciseCard key={e.id} exercise={e} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
export const glossary = [
  [
    "Agrégation",
    "Calcul qui regroupe plusieurs lignes : COUNT, SUM, AVG, MIN, MAX. Avec OVER, le résultat peut être reporté sur chaque ligne.",
    "sql-aggregation-conditionnelle",
  ],
  [
    "Clé candidate",
    "Ensemble minimal d’attributs qui détermine tous les attributs de la relation. Chaque clé candidate doit être examinée en normalisation.",
    "df-cles",
  ],
  [
    "Superclé",
    "Ensemble qui détermine tous les attributs, sans exigence de minimalité.",
    "df-cles",
  ],
  [
    "Fermeture X⁺",
    "Attributs déterminés par X sous un ensemble de DF donné. Diffère de F⁺, l’ensemble des DF impliquées.",
    "df-fermetures",
  ],
  [
    "Couverture minimale",
    "Ensemble de DF équivalent, à cibles simples, sans attribut superflu dans une source ni DF redondante. Plusieurs couvertures sont possibles.",
    "df-couverture",
  ],
  [
    "Attribut appartenant à une clé (attribut premier)",
    "Attribut appartenant à au moins une clé candidate.",
    "fn-3fn",
  ],
  [
    "Sans perte",
    "La jointure des projections reconstitue exactement chaque instance légale ; elle ne crée pas de tuples parasites.",
    "fn-sans-perte",
  ],
  [
    "Préservation des DF",
    "Les contraintes projetées permettent de déduire les DF initiales sans contrôler une jointure globale.",
    "fn-preservation",
  ],
  [
    "BCNF — forme normale de Boyce-Codd",
    "Pour chaque DF non triviale du schéma, la source est une superclé.",
    "fn-bcnf",
  ],
  [
    "4FN — quatrième forme normale",
    "Pour toute dépendance multivaluée non triviale, la source est une super clé. Le support la définit p.72. La 4FN implique BCNF ; BCNF et 4FN ne sont donc pas deux noms du même critère.",
    "fn-4fn",
  ],
  [
    "Dépendance multivaluée",
    "Règle d’indépendance entre deux ensembles d’informations pour une même source ; elle impose des combinaisons de tuples.",
    "fn-dm",
  ],
  [
    "Fenêtre",
    "Ensemble de lignes utilisé par une fonction OVER. Partition, ordre et cadre jouent des rôles différents.",
    "sql-fenetres",
  ],
  [
    "Ex æquo",
    "Lignes possédant la même valeur sur les expressions de classement ; RANK et DENSE_RANK ne numérotent pas leurs successeurs pareil.",
    "sql-classements",
  ],
  [
    "NULL",
    "Marqueur d’information absente. Les comparaisons ordinaires peuvent produire UNKNOWN ; COUNT(expression) ignore NULL.",
    "sql-case",
  ],
  [
    "Index recouvrant",
    "Index contenant toutes les informations requises pour une requête, permettant parfois d’éviter la lecture des lignes de table.",
    "",
  ],
  [
    "Clustering",
    "Regroupement physique des lignes selon une clé ou un modèle d’accès ; la signification précise dépend du SGBD.",
    "",
  ],
  [
    "Hit ratio",
    "Part des lectures logiques satisfaites depuis le buffer : (L−P)/L.",
    "physique-cache",
  ],
  [
    "Index inversé",
    "Structure associant chaque terme à une liste de documents qui le contiennent, avec les informations utiles aux scores.",
    "",
  ],
  [
    "TF-IDF",
    "Pondération d’un terme dans un document combinant sa fréquence locale et son caractère rare dans le corpus.",
    "",
  ],
  [
    "Embedding",
    "Vecteur appris représentant une information ; sa proximité géométrique peut représenter une proximité de sens.",
    "",
  ],
  [
    "KNN / ANN",
    "Recherche exacte des k voisins / recherche approchée réduisant le coût avec un compromis de rappel.",
    "",
  ],
];
export function GlossaryPage() {
  const [query, setQuery] = useState("");
  return (
    <div className="page-enter">
      <span className="eyebrow">LES MOTS DU COURS</span>
      <h1>Un glossaire pour garder le fil.</h1>
      <p className="notice">
        Les appellations du support sont conservées : 1FN, 2FN, 3FN, BCNF et
        4FN. « 4NF » est la notation anglaise de 4FN ; BCNF désigne une autre
        forme normale. B-arbres : ordre d, au plus 2d clés et 2d+1 enfants. Les
        synonymes ajoutés sont explicités dans les leçons.
      </p>
      <label className="field">
        <span>Rechercher un terme</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Clé, fenêtre, embedding…"
        />
      </label>
      <div className="glossary-grid">
        {glossary
          .filter((g) =>
            g.join(" ").toLowerCase().includes(query.toLowerCase()),
          )
          .map(([term, definition, id]) => (
            <section key={term} className="panel">
              <h2>{term}</h2>
              <p>{definition}</p>
              {lessonById(id) && (
                <Link className="text-link" to={`/lecons/${id}`}>
                  Revoir la leçon
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </section>
          ))}
      </div>
    </div>
  );
}
export function SearchPage() {
  const [lessonTexts, setLessonTexts] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    fetch("/datasets/search-index.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, string>) => {
        if (active) setLessonTexts(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const [params, setParams] = useSearchParams(),
    query = params.get("q") ?? "",
    needle = query.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const match = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").includes(needle);
  const foundLessons = lessons.filter((l) =>
      match(
        [
          l.title,
          l.summary,
          ...l.objectives,
          ...l.skillIds,
          lessonTexts[l.id] ?? "",
        ].join(" "),
      ),
    ),
    foundExercises = exercises.filter((e) =>
      match([e.id, e.title, e.prompt, ...e.skillIds].join(" ")),
    ),
    terms = glossary.filter((g) => match(g.join(" ")));
  return (
    <div className="page-enter">
      <span className="eyebrow">RETROUVER UN REPÈRE</span>
      <h1>Chercher dans le parcours.</h1>
      <label className="field">
        <span>Notion, identifiant ou question</span>
        <input
          autoFocus
          value={query}
          onChange={(e) => setParams({ q: e.target.value }, { replace: true })}
        />
      </label>
      {!query.trim() ? (
        <Empty>
          Saisissez une notion, par exemple « fenêtre », « zoo » ou « B1.04 ».
        </Empty>
      ) : (
        <>
          <h2 className="mt-7">{foundLessons.length} leçon(s)</h2>
          {foundLessons.map((l) => (
            <Link className="search-result" key={l.id} to={`/lecons/${l.id}`}>
              <BookOpen size={17} />
              <div>
                <strong>{l.title}</strong>
                <p>{l.summary}</p>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          ))}
          <h2 className="mt-7">{foundExercises.length} exercice(s)</h2>
          <div className="exercise-list">
            {foundExercises.map((e) => (
              <ExerciseCard key={e.id} exercise={e} />
            ))}
          </div>
          <h2 className="mt-7">{terms.length} terme(s) du glossaire</h2>
          {terms.map(([title, definition]) => (
            <section className="panel" key={title}>
              <h3>{title}</h3>
              <p>{definition}</p>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
export function SourcesPage() {
  const [params] = useSearchParams(),
    selected = params.get("source"),
    issues = coverageIssues();
  const rows = curriculum.skills.filter((s) =>
    /^(LMD-C|DF-C|FN-C|PHY-C|IDX-C|AUT-C|FT-C|VEC-C|TP-|EX-|QCM-)/.test(s.id),
  );
  return (
    <div className="page-enter">
      <span className="eyebrow">UN COURS TRAÇABLE</span>
      <h1>Sources et couverture.</h1>
      <p className="page-subtitle">
        {sources.length} PDF,{" "}
        {sources.reduce((total, source) => total + source.pages, 0)} pages et
        les ressources voisines des TP. Les pages indiquées sont les positions
        réelles des PDF.
      </p>
      <div className={`feedback ${issues.length ? "error" : "success"}`}>
        {issues.length
          ? `${issues.length} correspondance(s) à corriger dans le catalogue.`
          : `Les ${rows.length} exercices et questions recensés dans le programme ont une correspondance dans le site.`}
      </div>
      {issues.length > 0 && <pre>{issues.join("\n")}</pre>}
      <p className="notice">
        Les PDF originaux et les copies nominatives des examens ne sont pas
        distribués. Retrouvez ces fichiers dans votre dossier de cours ; les
        références restent vérifiables par nom et page. Les contenus sont des
        explications pédagogiques rédigées et contrôlées à partir de ces
        supports.
      </p>
      <div className="panel">
        <h2>Inventaire des supports</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Fichier</th>
                <th>Pages</th>
                <th>Liens dans le parcours</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => {
                const linked = lessons.filter((l) =>
                  l.sourceRefs.some((r) => r.sourceId === source.id),
                );
                return (
                  <tr
                    key={source.id}
                    className={selected === source.id ? "highlight-row" : ""}
                  >
                    <td>{source.id}</td>
                    <td>{source.file}</td>
                    <td>{source.pages}</td>
                    <td>
                      {linked.length ? (
                        linked.map((l) => (
                          <Link
                            className="source-lesson"
                            to={`/lecons/${l.id}`}
                            key={l.id}
                          >
                            {l.title}
                          </Link>
                        ))
                      ) : (
                        <span>
                          {
                            exercises.filter((e) =>
                              e.sourceRefs.some(
                                (r) => r.sourceId === source.id,
                              ),
                            ).length
                          }{" "}
                          exercice(s) référencé(s)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <section className="panel">
        <h2>La matrice des exercices</h2>
        <p>
          Chaque ligne conserve l’identifiant du programme. Les corrections
          partielles ou reconstruites sont annoncées dans l’exercice.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Identifiant du programme</th>
                <th>Exercice</th>
                <th>Leçon associée</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = row.id.split(" — ")[0],
                  e = exercises.find((e) => e.id === id),
                  l = lessonById(e?.lessonId);
                return (
                  <tr key={id}>
                    <td>
                      <code>{id}</code>
                    </td>
                    <td>
                      {e ? (
                        <Link to={`/exercices/${id}`}>{e.title}</Link>
                      ) : (
                        "Correspondance manquante"
                      )}
                    </td>
                    <td>
                      {l && <Link to={`/lecons/${l.id}`}>{l.title}</Link>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2>Annexes et limites du périmètre</h2>
        <ul className="plain-list">
          <li>
            UNPIVOT, la famille analytique à droite du schéma LMD p.122 (dont
            LEAD/LAG) et la 5FN restent des repères annoncés non étudiés.
          </li>
          <li>
            PIVOT XML Oracle, insertions multiples, matériel, RAID,
            démonstration de Heath, règles de DM, variantes de SGBD et
            paramètres Full Text sont identifiés comme compléments dans les
            leçons.
          </li>
          <li>
            Les références matérielles et les limites VECTOR décrivent le
            contexte des diapositives ; elles ne sont pas généralisées à toutes
            les versions.
          </li>
          <li>
            Coquilles expliquées : ROWS/RANGE avec ex æquo ; 16384 octets = 16
            Kio ; CHAR/VARCHAR ; jointure supprimée mais mauvaise colonne
            projetée ; DF redondante du zoo et colonnes manquantes d’une
            correction.
          </li>
          <li>
            Les fichiers SQL étudiants voisins ont servi à identifier les
            ressources, pas à certifier les corrections.
          </li>
        </ul>
        <Link className="button" to="/compatibilite">
          Voir la compatibilité du moteur SQL
          <ArrowUpRight size={15} />
        </Link>
      </section>
      <section className="panel">
        <h2>Section par section</h2>
        {modules.map((module) => (
          <details key={module.id}>
            <summary>
              {module.title} · {moduleLessons(module.id).length} leçons
            </summary>
            {moduleLessons(module.id).map((l) => (
              <div className="source-mapping" key={l.id}>
                <Link to={`/lecons/${l.id}`}>{l.title}</Link>
                <SourceRefs refs={l.sourceRefs} />
                <p className="fine-print">{l.skillIds.join(" · ")}</p>
              </div>
            ))}
          </details>
        ))}
      </section>
    </div>
  );
}
