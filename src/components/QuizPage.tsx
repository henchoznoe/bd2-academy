import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import {
  modules,
  moduleLessons,
  moduleQuizzes,
  lessonExercises,
} from "../lib/catalog";
import { ExerciseCard, Empty } from "./Common";
import { useProgress } from "./ProgressProvider";

const chapters = [
  ...modules.map(({ id, title }) => ({ id, title })),
  { id: "examen", title: "Anciens TE1" },
];
export default function QuizPage() {
  const { moduleId } = useParams();
  const { record } = useProgress();
  const chapter = chapters.find((item) => item.id === moduleId);
  if (moduleId && !chapter) return <Empty>Chapitre de QCM introuvable.</Empty>;
  const list = chapter ? moduleQuizzes(chapter.id) : [];
  const verified = list.filter(
    (e) => record(e.id).status === "verified",
  ).length;
  return (
    <div className="page-enter">
      {chapter && (
        <Link className="back-link" to="/qcm">
          <ArrowLeft size={15} />
          Tous les chapitres
        </Link>
      )}
      <span className="eyebrow">COMPRENDRE AVANT DE CHOISIR</span>
      <h1>
        {chapter ? `QCM · ${chapter.title}` : "Les QCM, chapitre par chapitre."}
      </h1>
      <p className="page-subtitle">
        Une seule réponse correcte par question. Vérifiez votre choix, puis
        lisez la correction expliquée avant de continuer.
      </p>
      <p className="notice">
        Les QCM créés pour le site sont des entraînements sourcés. Une réponse
        après consultation d’un indice ou d’une correction reste distinguée
        d’une réussite sans aide. Les questions de réflexion et exercices SQL
        sont conservés après les QCM dans chaque leçon.
      </p>
      {!chapter ? (
        <div className="module-grid">
          {chapters.map((item) => {
            const questions = moduleQuizzes(item.id);
            const done = questions.filter(
              (e) => record(e.id).status === "verified",
            ).length;
            return (
              <Link
                className="module-card"
                to={`/qcm/${item.id}`}
                key={item.id}
              >
                <span className="module-icon">
                  <GraduationCap size={23} />
                </span>
                <h2>{item.title}</h2>
                <p>
                  {questions.length} QCM · {done} réussite(s) sans aide
                </p>
                <div className="module-meta">
                  <span>Réponses et corrections expliquées</span>
                  <ArrowRight size={17} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <>
          <section className="panel mb-6">
            <h2>
              {list.length} QCM · {verified} réussite(s) sans aide
            </h2>
            <p>
              Avancez dans l’ordre des leçons ou choisissez une question à
              reprendre.
            </p>
            {list[0] && (
              <Link
                className="button primary mt-4"
                to={`/exercices/${list[0].id}?serie=${chapter.id}`}
              >
                Commencer la série <ArrowRight size={16} />
              </Link>
            )}
          </section>
          {moduleLessons(chapter.id).map((lesson) => (
            <section className="mt-7" key={lesson.id} aria-label={lesson.title}>
              <div className="section-heading">
                <h2>{lesson.title}</h2>
                <Link className="text-link" to={`/lecons/${lesson.id}`}>
                  Revoir la leçon <ArrowRight size={14} />
                </Link>
              </div>
              <div className="exercise-list">
                {lessonExercises(lesson.id)
                  .filter((e) => e.type === "quiz")
                  .map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      seriesId={chapter.id}
                    />
                  ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
