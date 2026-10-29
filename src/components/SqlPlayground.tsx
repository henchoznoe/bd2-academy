import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, RotateCcw, Square } from "lucide-react";
import SqlEditor from "./SqlEditor";
import { QueryTable } from "./QueryTable";
import { datasets, datasetInfo } from "../lib/datasets";
import { cancelSQL, runSQL } from "../lib/sql";
import type { QueryResult } from "../lib/results";
import { useProgress } from "./ProgressProvider";
export default function SqlPlayground() {
  const { record, patch } = useProgress(),
    [dataset, setDataset] = useState("course"),
    [result, setResult] = useState<QueryResult>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const id = `playground:${dataset}`,
    info = datasetInfo(dataset),
    value = record(id).draft || `SELECT * FROM ${info.tables[0]} LIMIT 10;`;
  async function execute() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setResult(await runSQL(dataset, value));
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-enter">
      <span className="eyebrow">LE BAC À SQL</span>
      <h1>Essayer. Observer. Comprendre.</h1>
      <p className="page-subtitle">
        Un vrai moteur SQL, dans le navigateur, pour explorer les jeux de
        révision.
      </p>
      <section className="panel">
        <label className="field">
          <span>Jeu de données</span>
          <select
            disabled={busy}
            value={dataset}
            onChange={(e) => {
              setDataset(e.target.value);
              setResult(undefined);
              setError("");
            }}
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </label>
        <p>{info.description}</p>
        <p className="notice">{info.provenance}</p>
        <details>
          <summary>Voir le schéma</summary>
          <pre>{info.schema}</pre>
        </details>
      </section>
      <section className="panel p-0 overflow-hidden">
        <div className="editor-heading">
          <span>DuckDB-WASM · exécution locale</span>
          <span>⌘ / Ctrl + Entrée</span>
        </div>
        <SqlEditor
          value={value}
          onChange={(draft) => patch(id, { draft })}
          onRun={() => void execute()}
        />
        <div className="editor-actions">
          <button
            className="button primary"
            disabled={busy || !value.trim()}
            onClick={() => void execute()}
          >
            <Play size={15} />
            {busy ? "Exécution…" : "Exécuter"}
          </button>
          {busy && (
            <button className="button" onClick={cancelSQL}>
              <Square size={14} />
              Interrompre
            </button>
          )}
          <button
            className="button ghost"
            disabled={busy}
            onClick={() => {
              patch(id, { draft: `SELECT * FROM ${info.tables[0]} LIMIT 10;` });
              setResult(undefined);
              setError("");
            }}
          >
            <RotateCcw size={15} />
            Réinitialiser
          </button>
        </div>
      </section>
      <div aria-live="polite">
        {error && <p className="feedback error">{error}</p>}
      </div>
      {result && <QueryTable result={result} />}
      <p className="fine-print">
        Chaque exécution repart d’un jeu neuf. Vous pouvez exécuter plusieurs
        instructions séparées par un point-virgule ; le dernier résultat est
        affiché. Le brouillon est sauvegardé. Les fichiers et extensions
        externes sont désactivés ; aucun serveur de base de données n’est
        appelé.
      </p>
      <Link className="text-link" to="/compatibilite">
        Consulter et tester la compatibilité des syntaxes
      </Link>
    </div>
  );
}
