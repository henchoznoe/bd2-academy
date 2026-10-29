import { useState } from "react";
import { exercises } from "../lib/catalog";
import { runSQL, cancelSQL } from "../lib/sql";
import { compareResults } from "../lib/results";
export const probes = [
  [
    "CASE / NULLIF / COALESCE",
    "SELECT CASE WHEN NULL IS NULL THEN COALESCE(NULLIF(0,0),7) END;",
  ],
  [
    "FILTER",
    "SELECT COUNT(*) FILTER(WHERE category_name='CPU') FROM commande;",
  ],
  [
    "PIVOT statique",
    "SELECT * FROM (SELECT category_name,status,order_id FROM commande) PIVOT(COUNT(order_id) FOR status IN ('Canceled','Pending','Shipped'));",
  ],
  [
    "LATERAL",
    "SELECT p.id,a.id FROM personne p,LATERAL(SELECT id FROM animal WHERE proprioId=p.id ORDER BY age DESC,id LIMIT 2)a;",
  ],
  ["CTE", "WITH x AS (SELECT 1 AS n) SELECT n FROM x;"],
  [
    "MERGE",
    "MERGE INTO table_dest d USING table_source s ON d.id=s.id WHEN MATCHED THEN UPDATE SET txt=s.txt WHEN NOT MATCHED THEN INSERT(id,txt) VALUES(s.id,s.txt);",
  ],
  [
    "OFFSET / FETCH ONLY",
    "SELECT e_id FROM emp ORDER BY e_id OFFSET 1 ROWS FETCH NEXT 2 ROWS ONLY;",
  ],
  [
    "FETCH WITH TIES",
    "SELECT e_id FROM emp ORDER BY salaire DESC FETCH FIRST 1 ROW WITH TIES;",
  ],
  [
    "GROUPING SETS / ROLLUP / CUBE",
    "SELECT deptno,SUM(salaire),GROUPING(deptno) FROM emp GROUP BY GROUPING SETS ((deptno),());",
  ],
  [
    "Fenêtres ROWS et RANGE",
    "SELECT SUM(salaire) OVER(ORDER BY salaire ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), SUM(salaire) OVER(ORDER BY salaire RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) FROM emp;",
  ],
  [
    "RANK / DENSE_RANK / ROW_NUMBER / NTILE",
    "SELECT RANK() OVER(ORDER BY salaire),DENSE_RANK() OVER(ORDER BY salaire),ROW_NUMBER() OVER(ORDER BY salaire,e_id),NTILE(3) OVER(ORDER BY salaire,e_id) FROM emp;",
  ],
  [
    "RANK hypothétique WITHIN GROUP",
    "SELECT RANK(4500) WITHIN GROUP(ORDER BY salaire) FROM emp;",
  ],
  [
    "WITH RECURSIVE",
    "WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<3) SELECT * FROM n;",
  ],
  [
    "LISTAGG Oracle / string_agg DuckDB",
    "SELECT string_agg(ename,'; ' ORDER BY e_id) FROM emp;",
  ],
  ["INSERT ALL Oracle", "INSERT ALL INTO table_dest VALUES(4,'x') SELECT 1;"],
  ["Requête distribuée Oracle", "SELECT * FROM emp@autre_base;"],
  [
    "MATCH AGAINST MySQL",
    "SELECT MATCH(ename) AGAINST('Ana' IN NATURAL LANGUAGE MODE) FROM emp;",
  ],
  ["VECTOR MySQL", "SELECT STRING_TO_VECTOR('[1,2]');"],
] as const;
export default function Compatibility() {
  const [results, setResults] = useState<
      { name: string; ok: boolean; detail: string }[]
    >([]),
    [running, setRunning] = useState(false),
    [message, setMessage] = useState(""),
    [version, setVersion] = useState("");
  async function test(all = false) {
    if (running) return;
    setRunning(true);
    setResults([]);
    setMessage("Chargement du moteur local…");
    try {
      const v = await runSQL("course", "SELECT version();");
      setVersion(String(v.rows[0]?.[0]));
      if (all) {
        const bank = exercises.filter((e) => e.type === "sql");
        for (let i = 0; i < bank.length; i++) {
          const e = bank[i];
          setMessage(`Solution ${i + 1}/${bank.length} : ${e.id}`);
          try {
            for (const fixture of [
              e.datasetId!,
              ...(e.alternativeDatasetIds ?? []),
            ]) {
              const r = await runSQL(fixture, e.solution);
              if (!compareResults(r, r, e.ordered).correct)
                throw new Error("Comparaison incohérente.");
            }
            setResults((r) => [
              ...r,
              {
                name: e.id,
                ok: true,
                detail: `${1 + (e.alternativeDatasetIds?.length ?? 0)} jeu(x) exécuté(s).`,
              },
            ]);
          } catch (error) {
            setResults((r) => [
              ...r,
              { name: e.id, ok: false, detail: String(error) },
            ]);
          }
        }
      } else
        for (const [name, sql] of probes) {
          setMessage(`Test : ${name}`);
          try {
            await runSQL("course", sql);
            setResults((r) => [
              ...r,
              {
                name,
                ok: true,
                detail: "Construction exécutée dans cette version.",
              },
            ]);
          } catch (error) {
            setResults((r) => [
              ...r,
              { name, ok: false, detail: String(error) },
            ]);
          }
        }
      setMessage(
        "Contrôles terminés. Ces tests portent sur les exemples proposés, pas sur toute la compatibilité des dialectes.",
      );
    } catch (error) {
      setMessage(String(error));
    } finally {
      setRunning(false);
    }
  }
  return (
    <div className="page-enter">
      <span className="eyebrow">LE MOTEUR SOUS LE CAPOT</span>
      <h1>Une compatibilité explicite.</h1>
      <p className="page-subtitle">
        DuckDB-WASM 1.32.0 est embarqué. Les constructions sont vérifiées avec
        le moteur réellement chargé.
      </p>
      <section className="panel">
        <h2>Ce que les résultats prouvent</h2>
        <p>
          Les variantes standard peuvent s’exécuter localement. Oracle et MySQL
          ont leurs propres syntaxes, erreurs, contraintes, collations et plans.
          Un succès ci-dessous ne certifie pas l’équivalence complète avec ces
          moteurs.
        </p>
        <p>
          Les exercices WITH TIES et le rang hypothétique proposent une
          adaptation explicite. Les recherches Full Text MySQL, les métadonnées
          physiques et les requêtes distribuées restent guidées.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className="button primary"
            disabled={running}
            onClick={() => void test(false)}
          >
            Tester les constructions
          </button>
          <button
            className="button"
            disabled={running}
            onClick={() => void test(true)}
          >
            Tester toutes les solutions SQL
          </button>
          {running && (
            <button className="button" onClick={cancelSQL}>
              Interrompre la requête active
            </button>
          )}
        </div>
        <p aria-live="polite" className="mt-4">
          {message}
        </p>
        {version && <p className="fine-print">Moteur chargé : {version}.</p>}
      </section>
      <div className="panel table-scroll">
        <table>
          <thead>
            <tr>
              <th>Construction ou solution</th>
              <th>État observé</th>
              <th>Détail</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td>{r.name}</td>
                <td>{r.ok ? "Exécuté" : "Non exécuté / erreur"}</td>
                <td className="max-w-lg break-words">{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
