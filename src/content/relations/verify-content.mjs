// Content-specific verification against the same pinned DuckDB-WASM as the app.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import {
  createDuckDB,
  VoidLogger,
  NODE_RUNTIME,
} from "@duckdb/duckdb-wasm/blocking";
import { fixtureSQL } from "../../lib/datasets.ts";
const require = createRequire(import.meta.url);
const db = await createDuckDB(
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
await db.instantiate();
db.open({ path: ":memory:" });
const exercises = JSON.parse(
  readFileSync(new URL("./exercises.json", import.meta.url), "utf8"),
);
const result = [];
for (const dataset of ["zoo", "zoo-alt", "zoo-dirty"]) {
  const c = db.connect();
  c.query(
    "CREATE SCHEMA " +
      dataset.replace("-", "_") +
      "; SET schema='" +
      dataset.replace("-", "_") +
      "';",
  );
  c.query(await fixtureSQL(dataset));
  for (const exercise of exercises.filter(
    (e) =>
      e.type === "sql" &&
      (dataset === "zoo" || e.alternativeDatasetIds?.includes(dataset)),
  )) {
    const table = c.query(exercise.solution);
    result.push({
      dataset,
      id: exercise.id,
      rows: table.numRows,
      columns: table.schema.fields.map((f) => f.name),
    });
  }
  c.close();
}
console.log(JSON.stringify(result, null, 2));
