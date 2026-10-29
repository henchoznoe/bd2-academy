import { lazy, Suspense, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import {
  exerciseById,
  lessonById,
  lessonExercises,
  moduleQuizzes,
} from "../lib/catalog";
import { datasetInfo } from "../lib/datasets";
import { cancelSQL, runSQL, verifySQL } from "../lib/sql";
import type { QueryResult } from "../lib/results";
import { useProgress } from "./ProgressProvider";
import { Markdown, SourceRefs, Status, typeLabels } from "./Common";
import { QueryTable } from "./QueryTable";
const SqlEditor = lazy(() => import("./SqlEditor"));
const normalize = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
export default function ExercisePage() {
  const { id } = useParams();
  const exercise = exerciseById(id);
  if (!exercise)
    return (
      <p>
        Exercice introuvable. <Link to="/">Revenir au parcours</Link>
      </p>
    );
  return <Exercise key={exercise.id} id={exercise.id} />;
}
function Exercise({ id }: { id: string }) {
  const exercise = exerciseById(id)!,
    lesson = lessonById(exercise.lessonId),
    { record, patch } = useProgress(),
    saved = record(id);
  const [hints, setHints] = useState(0),
    [showSolution, setShowSolution] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [correct, setCorrect] = useState<boolean | null>(null),
    [result, setResult] = useState<QueryResult>(),
    [expected, setExpected] = useState<QueryResult>(),
    [rubric, setRubric] = useState<boolean[]>([false, false, false, false]);
  const data = exercise.datasetId ? datasetInfo(exercise.datasetId) : undefined;
  const answer = saved.draft;
  const [searchParams] = useSearchParams();
  const seriesId = searchParams.get("serie");
  const inChapterSeries =
    exercise.type === "quiz" && !!lesson && seriesId === lesson.moduleId;
  const quizzes =
    exercise.type === "quiz"
      ? inChapterSeries
        ? moduleQuizzes(lesson!.moduleId)
        : lessonExercises(exercise.lessonId).filter((e) => e.type === "quiz")
      : [];
  const quizIndex = quizzes.findIndex((e) => e.id === id);
  const quizLink = (exerciseId: string) =>
    `/exercices/${encodeURIComponent(exerciseId)}${inChapterSeries ? `?serie=${encodeURIComponent(seriesId!)}` : ""}`;
  function setAnswer(value: string) {
    patch(id, {
      draft: value,
      status: saved.status === "new" ? "learning" : saved.status,
    });
  }
  function feedback(ok: boolean, text: string) {
    const assisted = saved.solutionSeen || hints > 0;
    patch(id, {
      attempts: saved.attempts + 1,
      status: ok ? (assisted ? "declared" : "verified") : "review",
      understood: ok,
      evidence: ok
        ? assisted
          ? "Résultat correct après consultation d’une aide."
          : "Résultat évalué dans le site, sans aide consultée pour cet essai."
        : "Tentative à reprendre.",
    });
    setCorrect(ok);
    setMessage(
      text +
        (ok && assisted
          ? " Aide consultée : compréhension déclarée, à confirmer sur un nouveau cas."
          : ""),
    );
  }
  async function execute(validate = false) {
    if (busy) return;
    setBusy(true);
    setMessage("Chargement du moteur et des données…");
    setCorrect(null);
    setExpected(undefined);
    try {
      if (validate) {
        const evaluation = await verifySQL(exercise, answer);
        setResult(evaluation.result);
        setExpected(evaluation.expected);
        feedback(evaluation.correct, evaluation.message);
      } else {
        setResult(await runSQL(exercise.datasetId!, answer));
        setMessage(
          "Requête exécutée. La vérification du résultat se fait avec le bouton Vérifier.",
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      setCorrect(false);
      if (validate)
        patch(id, { attempts: saved.attempts + 1, status: "review" });
    } finally {
      setBusy(false);
    }
  }
  function validate() {
    if (exercise.type === "quiz") {
      feedback(
        answer === String(exercise.correctIndex),
        answer === String(exercise.correctIndex)
          ? "Bonne réponse. La correction ci-dessous explique le raisonnement."
          : "Cette réponse est à reprendre. Consultez la correction ci-dessous.",
      );
      setShowSolution(true);
      patch(id, { solutionSeen: true });
    } else if (exercise.type === "result") {
      const ok = exercise.acceptedAnswers!.some(
        (a) => normalize(a) === normalize(answer),
      );
      feedback(
        ok,
        ok
          ? "Résultat correct."
          : "Résultat à reprendre. Vérifiez les unités et la forme demandée.",
      );
    } else {
      setShowSolution(true);
      patch(id, {
        solutionSeen: true,
        attempts: saved.attempts + 1,
        status: "learning",
      });
    }
  }
  function reset() {
    setAnswer(exercise.starter ?? "");
    setResult(undefined);
    setExpected(undefined);
    setMessage(
      "Données réinitialisées : chaque exécution repart du jeu annoncé.",
    );
    setCorrect(null);
  }
  const guided = exercise.type === "guided" || exercise.type === "lab";
  return (
    <div className="page-enter exercise-page">
      <Link
        className="back-link"
        to={lesson ? `/lecons/${lesson.id}` : "/examen"}
      >
        <ArrowLeft size={15} /> {lesson?.title ?? "Entraînement"}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow">
          {exercise.id} · {typeLabels[exercise.type]}
        </span>
        <Status id={id} />
      </div>
      <h1>{exercise.title}</h1>
      <SourceRefs refs={exercise.sourceRefs} />
      {exercise.type === "quiz" && (
        <section className="panel" aria-label="Navigation de la série QCM">
          <p className="fine-print">
            Question {quizIndex + 1} / {quizzes.length} · Une seule bonne
            réponse
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            {quizzes[quizIndex - 1] && (
              <Link className="button" to={quizLink(quizzes[quizIndex - 1].id)}>
                <ArrowLeft size={15} />
                Question précédente
              </Link>
            )}
            <Link
              className="button ghost"
              to={`/qcm/${lesson?.moduleId ?? ""}`}
            >
              Tous les QCM du chapitre
            </Link>
          </div>
        </section>
      )}
      {exercise.id.startsWith("QCM-") && (
        <p className="notice">
          QCM d’entraînement créé pour cette leçon, avec correction expliquée.
          Les références renvoient aux supports, sans présenter cet exemple
          comme une question officielle.
        </p>
      )}
      {exercise.origin === "exam" && (
        <div className="notice">
          Énoncé visible dans la copie ancienne ; données d’entraînement
          choisies pour remplacer les annexes absentes. Aucune annexe originale
          n’est reconstituée avec certitude.
        </div>
      )}
      <section className="panel exercise-prompt">
        <h2>À vous de jouer</h2>
        <Markdown>{exercise.prompt}</Markdown>
      </section>
      {data && (
        <details className="panel details-panel">
          <summary>
            Schéma et données · {data.title}
            <ChevronDown size={16} />
          </summary>
          <p>{data.description}</p>
          <p className="notice">{data.provenance}</p>
          <pre>{data.schema}</pre>
          <DataPreview datasetId={data.id} />
        </details>
      )}
      <section className="panel p-0 overflow-hidden">
        <div className="editor-heading">
          <span>
            {exercise.type === "sql"
              ? "Votre requête · DuckDB-WASM"
              : guided
                ? "Votre démarche"
                : "Votre réponse"}
          </span>
          {exercise.type === "sql" && (
            <span className="text-xs text-slate-500">⌘ / Ctrl + Entrée</span>
          )}
        </div>
        {exercise.type === "sql" ? (
          <Suspense fallback={<p className="p-5">Chargement de l’éditeur…</p>}>
            <SqlEditor
              value={answer}
              onChange={setAnswer}
              onRun={() => void execute(false)}
            />
          </Suspense>
        ) : exercise.type === "quiz" ? (
          <fieldset className="quiz-options">
            <legend className="sr-only">Choisissez une réponse</legend>
            {exercise.options?.map((option, i) => (
              <label key={i} className={answer === String(i) ? "selected" : ""}>
                <input
                  type="radio"
                  name={id}
                  value={i}
                  checked={answer === String(i)}
                  onChange={() => setAnswer(String(i))}
                />
                <span>{String.fromCharCode(65 + i)}</span>
                <Markdown>{option}</Markdown>
              </label>
            ))}
          </fieldset>
        ) : (
          <div className="p-5">
            <label className="sr-only" htmlFor="answer">
              Votre réponse
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={guided ? 7 : 2}
              placeholder={
                guided
                  ? "Écrivez votre raisonnement avant de consulter la correction…"
                  : "Écrivez le résultat demandé…"
              }
            />
          </div>
        )}
        <div className="editor-actions">
          {exercise.type === "sql" ? (
            <>
              <button
                className="button primary"
                disabled={busy || !answer.trim()}
                onClick={() => void execute(false)}
              >
                <Play size={15} />
                {busy ? "Exécution…" : "Exécuter"}
              </button>
              <button
                className="button"
                disabled={busy || !answer.trim()}
                onClick={() => void execute(true)}
              >
                <CheckCircle2 size={16} />
                Vérifier
              </button>
              {busy && (
                <button className="button" onClick={() => cancelSQL()}>
                  <Square size={14} />
                  Interrompre
                </button>
              )}
              <button className="button ghost" disabled={busy} onClick={reset}>
                <RotateCcw size={15} />
                Réinitialiser
              </button>
            </>
          ) : (
            <button
              className="button primary"
              disabled={!answer.trim()}
              onClick={validate}
            >
              {guided ? "Comparer ma démarche" : "Vérifier ma réponse"}
            </button>
          )}
        </div>
      </section>
      <div aria-live="polite">
        {message && (
          <div
            className={`feedback ${correct === true ? "success" : correct === false ? "error" : ""}`}
          >
            {message}
          </div>
        )}
      </div>
      {result && <QueryTable result={result} />}{" "}
      {expected && (
        <details className="panel">
          <summary>Comparer au résultat attendu sur ce jeu</summary>
          <QueryTable result={expected} />
        </details>
      )}
      {exercise.type === "sql" && (
        <p className="fine-print">
          Les lignes, doublons, NULL et valeurs sont comparés. L’ordre est{" "}
          {exercise.ordered
            ? "obligatoire dans cet exercice"
            : "libre dans cet exercice"}{" "}
          ; les alias de colonnes peuvent varier. Les données repartent de zéro
          avant chaque exécution. DuckDB ne valide pas les particularités
          Oracle/MySQL.
        </p>
      )}
      <section className="panel hints-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2">
            <Lightbulb size={18} />
            Un coup de pouce
          </h2>
          <span className="text-sm text-slate-400">
            {hints}/{exercise.hints.length}
          </span>
        </div>
        {exercise.hints.slice(0, hints).map((hint, i) => (
          <div className="hint" key={i}>
            <strong>Indice {i + 1}</strong>
            <Markdown>{hint}</Markdown>
          </div>
        ))}
        <button
          className="button"
          disabled={hints >= exercise.hints.length}
          onClick={() => setHints(hints + 1)}
        >
          {hints ? "Afficher l’indice suivant" : "Afficher un premier indice"}
        </button>
      </section>
      <section className="panel">
        <button
          className="solution-toggle"
          aria-expanded={showSolution}
          onClick={() => {
            setShowSolution(!showSolution);
            if (!showSolution) patch(id, { solutionSeen: true });
          }}
        >
          <span>Correction expliquée</span>
          <ChevronDown size={18} />
        </button>
        {showSolution && (
          <div className="solution">
            <p className="notice">
              Consulter la correction ne valide pas la compétence. Refaire sur
              un autre cas permet de vérifier votre compréhension.
            </p>
            <Markdown>
              {exercise.type === "sql"
                ? `\`\`\`sql\n${exercise.solution}\n\`\`\``
                : exercise.solution}
            </Markdown>
            <h3>Pourquoi cette solution fonctionne</h3>
            <Markdown>{exercise.explanation}</Markdown>
            {guided && (
              <>
                <h3>Validation personnelle</h3>
                {[
                  "Je peux expliquer la méthode avec mes mots.",
                  "J’ai appliqué chaque étape sans recopier.",
                  "Je peux justifier les hypothèses et les contraintes.",
                  "Je reconnais un piège ou un contre-exemple.",
                ].map((text, i) => (
                  <label className="check-row" key={text}>
                    <input
                      type="checkbox"
                      checked={rubric[i]}
                      onChange={(event) =>
                        setRubric((items) =>
                          items.map((v, j) =>
                            i === j ? event.target.checked : v,
                          ),
                        )
                      }
                    />
                    {text}
                  </label>
                ))}
                <button
                  className="button primary mt-4"
                  disabled={!rubric.every(Boolean) || !answer.trim()}
                  onClick={() => {
                    patch(id, {
                      status: "declared",
                      understood: true,
                      evidence:
                        "Autoévaluation guidée après comparaison à la correction.",
                    });
                    setMessage(
                      "Compréhension déclarée enregistrée. Cette autoévaluation reste distincte d’une réussite évaluée.",
                    );
                  }}
                >
                  Enregistrer mon autoévaluation
                </button>
              </>
            )}
          </div>
        )}
      </section>
      {exercise.type === "quiz" && (
        <nav
          className="panel flex flex-wrap items-center justify-between gap-3"
          aria-label="Continuer la série QCM"
        >
          <p className="fine-print">
            {quizzes[quizIndex + 1]
              ? "Expliquez le choix correct avant de passer à la suite."
              : "Vous avez atteint la dernière question de cette série."}
          </p>
          {quizzes[quizIndex + 1] ? (
            <Link
              className="button primary"
              to={quizLink(quizzes[quizIndex + 1].id)}
            >
              Question suivante <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              className="button primary"
              to={`/qcm/${lesson?.moduleId ?? ""}`}
            >
              Revenir aux QCM du chapitre <ArrowRight size={16} />
            </Link>
          )}
        </nav>
      )}
      <div className="flex flex-wrap gap-3">
        <Link
          className="button"
          to={`/progression?skill=${exercise.skillIds[0] ?? id}`}
        >
          Noter une difficulté
        </Link>
        <Link
          className="button ghost"
          to={lesson ? `/lecons/${lesson.id}` : "/examen"}
        >
          Revenir au cours
        </Link>
        <button
          className="button ghost"
          onClick={() => {
            setShowSolution(false);
            setHints(0);
            patch(id, { solutionSeen: false, draft: "", status: "review" });
            setMessage(
              "Nouvel essai depuis une page blanche. L’historique des tentatives est conservé.",
            );
          }}
        >
          Nouvel essai sans aide
        </button>
      </div>
    </div>
  );
}
function DataPreview({ datasetId }: { datasetId: string }) {
  const data = datasetInfo(datasetId),
    [table, setTable] = useState(data.tables[0]),
    [result, setResult] = useState<QueryResult>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    setError("");
    try {
      setResult(await runSQL(datasetId, `SELECT * FROM "${table}" LIMIT 10;`));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="preview-table">
          Table à consulter
        </label>
        <select
          id="preview-table"
          value={table}
          onChange={(e) => setTable(e.target.value)}
        >
          {data.tables.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <button className="button" disabled={busy} onClick={() => void load()}>
          {busy ? "Chargement…" : "Voir 10 lignes"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {result && <QueryTable result={result} />}
    </div>
  );
}
