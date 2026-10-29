export type QueryResult = { columns: string[]; rows: unknown[][] };
function scalar(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number")
    return Number.isFinite(value)
      ? Math.round(value * 1e8) / 1e8
      : String(value);
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(scalar);
  if (typeof value === "object")
    return JSON.parse(
      JSON.stringify(value, (_, v: unknown) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    );
  return value;
}
export function normalizeResult(result: QueryResult, ordered = false) {
  const rows = result.rows.map((row) => JSON.stringify(row.map(scalar)));
  return { columns: result.columns.length, rows: ordered ? rows : rows.sort() };
}
export function compareResults(
  actual: QueryResult,
  expected: QueryResult,
  ordered = false,
) {
  const a = normalizeResult(actual, ordered),
    e = normalizeResult(expected, ordered);
  if (a.columns !== e.columns)
    return {
      correct: false,
      message: `Nombre de colonnes : ${a.columns}, attendu ${e.columns}. Les alias peuvent varier.`,
    };
  if (a.rows.length !== e.rows.length)
    return {
      correct: false,
      message: `${a.rows.length} ligne(s), attendu ${e.rows.length}. Vérifiez les groupes absents, les doublons et les jointures.`,
    };
  const correct = a.rows.every((row, i) => row === e.rows[i]);
  return {
    correct,
    message: correct
      ? `Résultat correct${ordered ? ", ordre compris" : " (ordre libre)"}.`
      : "Les valeurs diffèrent. Vérifiez NULL, les bornes, les ex æquo et les calculs.",
  };
}
