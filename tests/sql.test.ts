import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import {
  createDuckDB,
  VoidLogger,
  NODE_RUNTIME,
} from "@duckdb/duckdb-wasm/blocking";
import { fixtureSQL } from "../src/lib/datasets";
import { exercises } from "../src/lib/catalog";
import { compareResults } from "../src/lib/results";
import type { QueryResult } from "../src/lib/results";
import goldens from "./sql-goldens.json";
const require = createRequire(import.meta.url);
let engine: Awaited<ReturnType<typeof createDuckDB>>,
  counter = 0;
const load = async (path: string) =>
  JSON.parse(
    await readFile(new URL("../public" + path, import.meta.url), "utf8"),
  ) as unknown;
async function query(dataset: string, sql: string): Promise<QueryResult> {
  const connection = engine.connect(),
    schema = `spec_${++counter}`;
  try {
    connection.query(`CREATE SCHEMA ${schema};SET schema='${schema}';`);
    connection.query(await fixtureSQL(dataset, load, schema));
    const table = connection.query(sql);
    return {
      columns: table.schema.fields.map((f) => f.name),
      rows: Array.from({ length: table.numRows }, (_, i) =>
        table.schema.fields.map((_, j) => table.getChildAt(j)?.get(i) ?? null),
      ),
    };
  } finally {
    connection.query(`SET schema='main';DROP SCHEMA ${schema} CASCADE;`);
    connection.close();
  }
}
beforeAll(async () => {
  engine = await createDuckDB(
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
}, 30000);
afterAll(() => {
  engine?.reset();
});
describe("reference SQL on the pinned WebAssembly engine", () => {
  for (const exercise of exercises.filter((e) => e.type === "sql"))
    for (const dataset of [
      exercise.datasetId!,
      ...(exercise.alternativeDatasetIds ?? []),
    ])
      it(`${exercise.id} / ${dataset}`, async () => {
        const actual = await query(dataset, exercise.solution),
          expected = (goldens as Record<string, QueryResult>)[
            `${exercise.id}@${dataset}`
          ];
        expect(expected).toBeDefined();
        expect(compareResults(actual, expected, exercise.ordered).correct).toBe(
          true,
        );
      });
  it("independently checks NULL, zero, strict interval bounds and groups without matches", async () => {
    expect(
      (
        await query(
          "course",
          "SELECT COUNT(*),COUNT(salaire),SUM(salaire),AVG(salaire) FROM emp;",
        )
      ).rows,
    ).toEqual([[7, 6, 22500, 3750]]);
    const occupation = exercises.find((e) => e.id === "LMD-C02")!;
    const wrong = occupation.solution.replace("taux > 0", "taux >= 0");
    expect(
      compareResults(
        await query("course", wrong),
        await query("course", occupation.solution),
      ).correct,
    ).toBe(false);
    expect(
      (
        await query(
          "course",
          "SELECT COUNT(CASE WHEN category_name='CPU' THEN 1 END),COUNT(CASE WHEN category_name='CPU' THEN 1 ELSE 0 END) FROM commande;",
        )
      ).rows,
    ).toEqual([[3, 7]]);
  });
  it("distinguishes ROWS from RANGE on tied sort keys", async () => {
    const result = await query(
      "course",
      "SELECT e_id,SUM(salaire) OVER(ORDER BY salaire RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) r,SUM(salaire) OVER(ORDER BY salaire,e_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) s FROM emp WHERE salaire IS NOT NULL ORDER BY salaire,e_id;",
    );
    const tied = result.rows.filter((row) => row[0] === 4 || row[0] === 5);
    expect(tied).toEqual([
      [4, 22500, 17000],
      [5, 22500, 22500],
    ]);
  });
  it("checks original CSV cardinality and refuses hardcoded counts on the alternative fixture", async () => {
    expect((await query("movies", "SELECT COUNT(*) FROM movie;")).rows).toEqual(
      [[1288]],
    );
    expect(
      (await query("movies-alt", "SELECT COUNT(*) FROM movie;")).rows,
    ).toEqual([[1289]]);
  });
  it("exposes dirty-data controls and NULL anti-join traps", async () => {
    expect(
      (
        await query(
          "zoo-dirty",
          exercises.find((e) => e.id === "TP-N-2a-ext")!.solution,
        )
      ).rows,
    ).toHaveLength(2);
    const notExists = await query(
      "index-alt",
      exercises.find((e) => e.id === "TP-I-5.2.3")!.solution,
    );
    expect(notExists.rows[0][0]).toBe(2);
    const notIn = await query(
      "index-alt",
      "SELECT COUNT(c.id) FROM customers c WHERE country NOT IN(SELECT country FROM salesman);",
    );
    expect(notIn.rows[0][0]).toBe(0);
  });
  it("accepts equivalent conditional aggregation and retains zero groups", async () => {
    const exercise = exercises.find((e) => e.id === "SQL-E01")!;
    const alternative =
      "SELECT status,SUM(CASE WHEN category_name='CPU' THEN 1 ELSE 0 END),SUM(CASE WHEN category_name='Video Card' THEN 1 ELSE 0 END) FROM commande GROUP BY status;";
    for (const data of ["course", "course-alt"])
      expect(
        compareResults(
          await query(data, alternative),
          await query(data, exercise.solution),
        ).correct,
      ).toBe(true);
  });
  it("distinguishes an empty aggregate from an empty window and handles all-NULL salaries", async () => {
    expect(
      (await query("course", "SELECT AVG(salaire) FROM emp WHERE FALSE;")).rows,
    ).toEqual([[null]]);
    expect(
      (
        await query(
          "course",
          "SELECT AVG(salaire) OVER() FROM emp WHERE FALSE;",
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await query(
          "course",
          "SELECT AVG(salaire) FROM emp WHERE salaire IS NULL;",
        )
      ).rows,
    ).toEqual([[null]]);
    expect(
      (
        await query(
          "course",
          "SELECT AVG(salaire) OVER() FROM emp WHERE salaire IS NULL;",
        )
      ).rows,
    ).toEqual([[null]]);
  });
  it("preserves TE1 correlated averages when regrouping, including NULL departments and strict thresholds", async () => {
    const original = `SELECT e.e_id,e.ename,e.salaire FROM emp e WHERE e.salaire > (
      SELECT AVG(q.salaire) FROM emp q WHERE q.deptno=e.deptno
      GROUP BY q.deptno HAVING q.deptno=e.deptno);`;
    const edgeCases =
      "INSERT INTO emp VALUES(90,'Sans département 1',NULL,100,100,NULL),(91,'Sans département 2',NULL,100,1000,NULL),(92,'Sans salaire',60,100,NULL,NULL),(93,'Seuil nul',70,100,0,NULL);";
    for (const data of ["course", "course-alt"]) {
      const expected = await query(data, edgeCases + original);
      expect(
        expected.rows.some((row) => [90, 91, 92, 93].includes(Number(row[0]))),
      ).toBe(false);
      for (const id of ["EX-2526-5.1", "EX-2526-5.3"]) {
        const alternative = await query(
          data,
          edgeCases + exercises.find((e) => e.id === id)!.solution,
        );
        expect(compareResults(alternative, expected).correct, id).toBe(true);
      }
      const wrongWindow = await query(
        data,
        edgeCases +
          "SELECT e_id,ename,salaire FROM (SELECT *,AVG(salaire) OVER(PARTITION BY deptno) AS moyenne FROM emp) q WHERE salaire>moyenne;",
      );
      expect(compareResults(wrongWindow, expected).correct).toBe(false);
    }
  });
});
