import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, FileDown, Plus, Trash2, Upload, X } from "lucide-react";
import { exercises, skills } from "../lib/catalog";
import { downloadText, parseImport, progressMarkdown } from "../lib/progress";
import type { Progress } from "../lib/progress";
import { useProgress } from "./ProgressProvider";
import { Status } from "./Common";
export default function ProgressPage() {
  const { data, update, record, patch } = useProgress(),
    [params] = useSearchParams(),
    [pending, setPending] = useState<Progress>(),
    [importError, setImportError] = useState(""),
    [filter, setFilter] = useState("all"),
    [skill, setSkill] = useState(params.get("skill") ?? ""),
    [difficulty, setDifficulty] = useState(""),
    [correction, setCorrection] = useState(""),
    [redo, setRedo] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (pending && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [pending]);
  const verified = exercises.filter(
      (e) => record(e.id).status === "verified",
    ).length,
    declared = exercises.filter(
      (e) => record(e.id).status === "declared",
    ).length,
    attempts = exercises.reduce((sum, e) => sum + record(e.id).attempts, 0);
  async function importFile(file: File | undefined) {
    if (!file) return;
    setImportError("");
    try {
      setPending(parseImport(await file.text()));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    }
  }
  function addEntry() {
    if (!skill.trim() || !difficulty.trim()) return;
    update((p) => ({
      ...p,
      journal: [
        ...p.journal,
        {
          id: crypto.randomUUID(),
          skill,
          difficulty,
          correction,
          redo,
          resolved: false,
        },
      ],
    }));
    setSkill("");
    setDifficulty("");
    setCorrection("");
    setRedo("");
  }
  return (
    <div className="page-enter">
      <span className="eyebrow">MES ACQUIS</span>
      <h1>
        Voir ce qui tient.
        <br />
        <span className="text-slate-400">Reprendre ce qui résiste.</span>
      </h1>
      <p className="page-subtitle">
        La progression est enregistrée dans ce navigateur. Une exportation
        permet de la garder ou de changer d’appareil.
      </p>
      <div className="stats-grid three">
        <div>
          <strong>
            {verified}
            <small>réussites évaluées</small>
          </strong>
        </div>
        <div>
          <strong>
            {declared}
            <small>compréhensions déclarées</small>
          </strong>
        </div>
        <div>
          <strong>
            {attempts}
            <small>tentatives enregistrées</small>
          </strong>
        </div>
      </div>
      <section className="panel">
        <h2>Emporter mes révisions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            className="button primary"
            onClick={() =>
              downloadText(
                "bd2-academy-progression-v2.json",
                JSON.stringify(data, null, 2),
              )
            }
          >
            <Download size={16} />
            Exporter JSON
          </button>
          <button
            className="button"
            onClick={() =>
              downloadText(
                "MES-ACQUIS-BD2.md",
                progressMarkdown(data),
                "text/markdown;charset=utf-8",
              )
            }
          >
            <FileDown size={16} />
            Exporter Markdown
          </button>
          <label className="button cursor-pointer">
            <Upload size={16} />
            Importer une sauvegarde
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                void importFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="fine-print mt-3">
          L’import est présenté avant remplacement. Le JSON contient vos
          réponses et votre journal ; conservez-le comme une sauvegarde
          personnelle.
        </p>
        {importError && (
          <p role="alert" className="feedback error">
            {importError}
          </p>
        )}
      </section>
      {pending && (
        <dialog
          ref={dialog}
          className="import-dialog"
          aria-labelledby="import-title"
          onCancel={() => setPending(undefined)}
        >
          <div className="flex items-center justify-between">
            <h2 id="import-title">Vérifier avant de remplacer</h2>
            <button
              className="button ghost"
              aria-label="Fermer l’aperçu"
              onClick={() => setPending(undefined)}
            >
              <X size={19} />
            </button>
          </div>
          <p>Le fichier BD2 Academy version 2 contient :</p>
          <ul className="plain-list">
            <li>
              {Object.keys(pending.records).length} éléments de progression ou
              brouillons.
            </li>
            <li>
              {
                Object.values(pending.records).filter(
                  (r) => r.status === "verified",
                ).length
              }{" "}
              validations vérifiées, compétences importées comprises.
            </li>
            <li>{pending.journal.length} entrées de journal.</li>
          </ul>
          <p>
            Confirmer remplacera les données actuellement enregistrées sur cet
            appareil. Exportez-les d’abord si vous souhaitez les conserver.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="button primary"
              autoFocus
              onClick={() => {
                update(() => pending);
                setPending(undefined);
              }}
            >
              Confirmer le remplacement
            </button>
            <button className="button" onClick={() => setPending(undefined)}>
              Annuler
            </button>
            <button
              className="button ghost"
              onClick={() =>
                downloadText(
                  "bd2-academy-avant-import.json",
                  JSON.stringify(data, null, 2),
                )
              }
            >
              Exporter la version actuelle
            </button>
          </div>
        </dialog>
      )}
      <section className="panel">
        <div className="section-heading m-0">
          <div>
            <span className="eyebrow">JOURNAL</span>
            <h2>Garder une trace du déclic.</h2>
          </div>
          <span className="fine-print">
            {data.journal.filter((j) => !j.resolved).length} difficulté(s)
            ouvertes
          </span>
        </div>
        <div className="journal-form">
          <label className="field">
            <span>Compétence ou exercice</span>
            <input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="B1.05, TP-N-2c…"
            />
          </label>
          <label className="field">
            <span>Difficulté rencontrée</span>
            <textarea
              rows={2}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Correction comprise, avec mes mots</span>
            <textarea
              rows={2}
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Exercice à refaire</span>
            <input value={redo} onChange={(e) => setRedo(e.target.value)} />
          </label>
        </div>
        <button
          className="button primary"
          disabled={!skill.trim() || !difficulty.trim()}
          onClick={addEntry}
        >
          <Plus size={16} />
          Ajouter au journal
        </button>
        <div className="journal-entries">
          {data.journal.map((entry) => (
            <section
              key={entry.id}
              className={`journal-entry ${entry.resolved ? "resolved" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <strong>{entry.skill}</strong>
                <div className="flex items-center gap-3">
                  <label className="check-row m-0">
                    <input
                      type="checkbox"
                      checked={entry.resolved}
                      onChange={(e) =>
                        update((p) => ({
                          ...p,
                          journal: p.journal.map((j) =>
                            j.id === entry.id
                              ? { ...j, resolved: e.target.checked }
                              : j,
                          ),
                        }))
                      }
                    />
                    Résolu
                  </label>
                  <button
                    className="button ghost"
                    aria-label={`Supprimer l’entrée ${entry.skill}`}
                    onClick={() =>
                      update((p) => ({
                        ...p,
                        journal: p.journal.filter((j) => j.id !== entry.id),
                      }))
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p>
                <strong>Difficulté :</strong> {entry.difficulty}
              </p>
              <label className="field">
                <span>Correction comprise</span>
                <textarea
                  rows={2}
                  value={entry.correction}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      journal: p.journal.map((j) =>
                        j.id === entry.id
                          ? { ...j, correction: e.target.value }
                          : j,
                      ),
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>À refaire</span>
                <input
                  value={entry.redo}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      journal: p.journal.map((j) =>
                        j.id === entry.id ? { ...j, redo: e.target.value } : j,
                      ),
                    }))
                  }
                />
              </label>
            </section>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>Les compétences du programme</h2>
        <p>
          Votre progression est propre à ce navigateur. Une nouvelle coche
          manuelle indique « déclaré compris » ; les exercices évalués par le
          site sont suivis séparément.
        </p>
        <label className="field">
          <span>Afficher</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Toutes les compétences</option>
            <option value="new">À apprendre ou à reprendre</option>
            <option value="declared">Compréhension déclarée</option>
            <option value="verified">Réussites évaluées</option>
          </select>
        </label>
        <div className="skill-list">
          {skills
            .filter((s) =>
              filter === "all" || filter === "new"
                ? !["verified", "declared"].includes(record(s.id).status) ||
                  filter === "all"
                : record(s.id).status === filter,
            )
            .map((s) => {
              const state = record(s.id);
              return (
                <div className="skill-row" key={s.id}>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={state.understood}
                      onChange={(e) =>
                        patch(s.id, {
                          understood: e.target.checked,
                          status: e.target.checked ? "declared" : "review",
                          evidence: "Autoévaluation manuelle.",
                        })
                      }
                    />
                    <span>
                      <strong>{s.id}</strong> {s.description}
                    </span>
                  </label>
                  <Status id={s.id} />
                  {state.evidence && (
                    <p className="fine-print">{state.evidence}</p>
                  )}
                </div>
              );
            })}
        </div>
      </section>
      <section className="panel">
        <h2>Les exercices travaillés</h2>
        {exercises.filter((e) => record(e.id).attempts > 0).length === 0 ? (
          <p>Vos tentatives apparaîtront ici après la première vérification.</p>
        ) : (
          exercises
            .filter((e) => record(e.id).attempts > 0)
            .map((e) => (
              <Link
                className="lesson-practice-link"
                to={`/exercices/${e.id}`}
                key={e.id}
              >
                <span>
                  {e.id} · {e.title}
                </span>
                <Status id={e.id} />
                <span className="fine-print">
                  {record(e.id).attempts} essai(s)
                </span>
              </Link>
            ))
        )}
      </section>
    </div>
  );
}
