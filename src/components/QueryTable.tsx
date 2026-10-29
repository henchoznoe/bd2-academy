import type { QueryResult } from "../lib/results";
export function QueryTable({ result }: { result: QueryResult }) {
  function format(value: unknown): string {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "bigint") return String(value);
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object")
      return JSON.stringify(value, (_, v: unknown) =>
        typeof v === "bigint" ? String(v) : v,
      );
    return String(value);
  }
  return (
    <div className="query-result">
      <div className="result-caption">
        {result.rows.length} ligne(s) · {result.columns.length} colonne(s)
        {result.rows.length > 100 ? " · aperçu des 100 premières lignes" : ""}
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Résultat SQL"
      >
        <table>
          <thead>
            <tr>
              {result.columns.map((column, i) => (
                <th key={i}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.slice(0, 100).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td className={cell === null ? "null-value" : ""} key={j}>
                    {format(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {result.rows.length === 0 && (
          <p className="p-4 text-sm text-slate-500">Aucune ligne retournée.</p>
        )}
      </div>
    </div>
  );
}
