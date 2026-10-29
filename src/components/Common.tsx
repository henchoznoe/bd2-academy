import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Circle, FileText, RotateCcw } from "lucide-react";
import type { SourceReference, Exercise } from "../lib/catalog";
import { sources } from "../lib/catalog";
import { useProgress } from "./ProgressProvider";
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
export function SourceRefs({ refs }: { refs: SourceReference[] }) {
  return (
    <div className="source-refs">
      {refs.map((ref, i) => (
        <Link
          key={`${ref.sourceId}-${i}`}
          to={`/sources?source=${ref.sourceId}`}
          title="Référence aux pages physiques du PDF original"
        >
          <FileText size={13} />
          {sources.find((s) => s.id === ref.sourceId)?.file ?? ref.sourceId} ·
          p.{" "}
          {ref.pages.length > 5
            ? `${Math.min(...ref.pages)}–${Math.max(...ref.pages)}`
            : ref.pages.join(", ")}
          {ref.section ? ` · ${ref.section}` : ""}
        </Link>
      ))}
    </div>
  );
}
export function Status({ id }: { id: string }) {
  const { record } = useProgress();
  const state = record(id).status;
  return (
    <span className={`status status-${state}`}>
      {state === "verified" ? (
        <Check size={13} />
      ) : state === "review" ? (
        <RotateCcw size={13} />
      ) : (
        <Circle size={11} />
      )}
      {
        {
          new: "À découvrir",
          learning: "En cours",
          review: "À reprendre",
          declared: "Déclaré compris",
          verified: "Réussite vérifiée",
        }[state]
      }
    </span>
  );
}
export const typeLabels: Record<Exercise["type"], string> = {
  quiz: "QCM",
  sql: "SQL interactif",
  guided: "Démarche guidée",
  result: "Résultat à trouver",
  lab: "Atelier",
};
export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link
      className="exercise-card group"
      to={`/exercices/${encodeURIComponent(exercise.id)}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="exercise-type">
          {exercise.type === "sql"
            ? "SQL"
            : exercise.type === "quiz"
              ? "?"
              : "↳"}
        </span>
        <div className="min-w-0">
          <span className="eyebrow">
            {exercise.id} · {typeLabels[exercise.type]}
          </span>
          <h3>{exercise.title}</h3>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Status id={exercise.id} />
        <ArrowUpRight className="text-slate-400" size={18} />
      </div>
    </Link>
  );
}
export function Empty({ children }: { children: string }) {
  return <div className="empty">{children}</div>;
}
