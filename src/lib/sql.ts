import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { fixtureSQL } from "./datasets";
import { compareResults } from "./results";
import type { QueryResult } from "./results";
import type { Exercise } from "./catalog";
let database: Promise<AsyncDuckDB> | undefined;
let worker: Worker | undefined;
let abortActive: (() => void) | undefined;
let sequence = 0;
let queue = Promise.resolve();
async function getDatabase() {
  if (!database)
    database = (async () => {
      const duckdb = await import("@duckdb/duckdb-wasm");
      const bundle = await duckdb.selectBundle({
        mvp: {
          mainModule: "/duckdb/duckdb-mvp.wasm",
          mainWorker: "/duckdb/duckdb-browser-mvp.worker.js",
        },
        eh: {
          mainModule: "/duckdb/duckdb-eh.wasm",
          mainWorker: "/duckdb/duckdb-browser-eh.worker.js",
        },
      });
      worker = new Worker(bundle.mainWorker!);
      const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
      await db.instantiate(bundle.mainModule);
      await db.open({
        maximumThreads: 1,
        query: {
          castBigIntToDouble: true,
          castDecimalToDouble: true,
          castTimestampToDate: true,
        },
      });
      const connection = await db.connect();
      await connection.query(
        "SET autoinstall_known_extensions=false; SET autoload_known_extensions=false; SET enable_external_access=false; SET memory_limit='256MB';",
      );
      await connection.close();
      return db;
    })().catch((error) => {
      database = undefined;
      worker?.terminate();
      worker = undefined;
      throw error;
    });
  return database;
}
export function cancelSQL() {
  abortActive?.();
}
export async function runSQL(
  datasetId: string,
  sql: string,
): Promise<QueryResult> {
  if (!sql.trim()) throw new Error("Écrivez une requête avant de l’exécuter.");
  const execute = async () => {
    let timedOut = false,
      timer: ReturnType<typeof setTimeout> | undefined;
    const aborted = new Promise<never>((_, reject) => {
      abortActive = () => {
        timedOut = true;
        worker?.terminate();
        worker = undefined;
        database = undefined;
        reject(
          new Error(
            "Exécution interrompue. Les données seront réinitialisées au prochain essai.",
          ),
        );
      };
      timer = setTimeout(() => abortActive?.(), 30000);
    });
    const operation = async () => {
      const db = await getDatabase();
      if (timedOut) throw new Error("Exécution interrompue.");
      const connection = await db.connect(),
        schema = `training_${++sequence}`;
      try {
        await connection.query(
          `CREATE SCHEMA ${schema}; SET schema='${schema}';`,
        );
        await connection.query(await fixtureSQL(datasetId, undefined, schema));
        const table = await connection.query(sql);
        if (table.numRows > 10000)
          throw new Error(
            "Plus de 10 000 lignes : ajoutez un filtre ou une limite pour explorer le résultat.",
          );
        return {
          columns: table.schema.fields.map((f) => f.name),
          rows: Array.from({ length: table.numRows }, (_, i) =>
            table.schema.fields.map(
              (_, j) => table.getChildAt(j)?.get(i) ?? null,
            ),
          ),
        };
      } finally {
        if (!timedOut) {
          await connection
            .query(
              `SET schema='main'; DROP SCHEMA IF EXISTS ${schema} CASCADE;`,
            )
            .catch(() => undefined);
          await connection.close();
        }
      }
    };
    try {
      return await Promise.race([operation(), aborted]);
    } finally {
      clearTimeout(timer);
      abortActive = undefined;
    }
  };
  const next = queue.catch(() => undefined).then(execute);
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}
export async function verifySQL(exercise: Exercise, sql: string) {
  if (!exercise.datasetId)
    throw new Error("Cet exercice se résout avec une démarche guidée.");
  const fixtures = [
    exercise.datasetId,
    ...(exercise.alternativeDatasetIds ?? []),
  ];
  let first: QueryResult | undefined;
  for (let i = 0; i < fixtures.length; i++) {
    const actual = await runSQL(fixtures[i], sql),
      expected = await runSQL(fixtures[i], exercise.solution);
    first ??= actual;
    const comparison = compareResults(actual, expected, exercise.ordered);
    if (!comparison.correct)
      return {
        ...comparison,
        result: first,
        expected: i === 0 ? expected : undefined,
        tested: i + 1,
        total: fixtures.length,
      };
  }
  return {
    correct: true,
    message: `Résultats corrects sur ${fixtures.length} jeu(x). Expliquez maintenant votre démarche et les cas limites.`,
    result: first!,
    expected: undefined,
    tested: fixtures.length,
    total: fixtures.length,
  };
}
