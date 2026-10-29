import { readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import {
  createDuckDB,
  VoidLogger,
  NODE_RUNTIME,
} from "@duckdb/duckdb-wasm/blocking";
import { fixtureSQL } from "../src/lib/datasets.ts";
const require = createRequire(import.meta.url);
const engine = await createDuckDB(
  {
    mvp: {
      mainModule: require.resolve("@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm"),
      mainWorker: "",
    },
    eh: {
      mainModule: require.resolve("@duckdb/duckdb-wasm/dist/duckdb-eh.wasm"),
      mainWorker: "",
    },
  },
  new VoidLogger(),
  NODE_RUNTIME,
);
await engine.instantiate();
engine.open({
  query: {
    castBigIntToDouble: true,
    castDecimalToDouble: true,
    castTimestampToDate: true,
  },
});
const files = await readdir("src/content", { recursive: true });
const exercises = (
  await Promise.all(
    files
      .filter((file) => file.endsWith("exercises.json"))
      .map(async (file) =>
        JSON.parse(await readFile("src/content/" + file, "utf8")),
      ),
  )
)
  .flat()
  .filter((e) => e.type === "sql");
const output = {},
  failures = [];
let fixtureCount = 0;
const load = async (path) =>
  JSON.parse(await readFile("public" + path, "utf8"));
for (const exercise of exercises) {
  for (const dataset of [
    exercise.datasetId,
    ...(exercise.alternativeDatasetIds ?? []),
  ]) {
    const connection = engine.connect(),
      schema = "audit_" + fixtureCount++;
    try {
      connection.query(`CREATE SCHEMA ${schema};SET schema='${schema}';`);
      connection.query(await fixtureSQL(dataset, load, schema));
      const table = connection.query(exercise.solution);
      output[exercise.id + "@" + dataset] = {
        columns: table.schema.fields.map((f) => f.name),
        rows: Array.from({ length: table.numRows }, (_, i) =>
          table.schema.fields.map(
            (_, j) => table.getChildAt(j)?.get(i) ?? null,
          ),
        ),
      };
    } catch (error) {
      failures.push({ exercise: exercise.id, dataset, error: String(error) });
    } finally {
      connection.query(`SET schema='main';DROP SCHEMA ${schema} CASCADE;`);
      connection.close();
    }
  }
}
if (process.argv.includes("--write") && !failures.length)
  await writeFile(
    "tests/sql-goldens.json",
    JSON.stringify(
      output,
      (_, v) => (typeof v === "bigint" ? Number(v) : v),
      2,
    ) + "\n",
  );
console.log(
  JSON.stringify(
    {
      engine: engine.getVersion(),
      exercises: exercises.length,
      fixtures: fixtureCount,
      passed: fixtureCount - failures.length,
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
