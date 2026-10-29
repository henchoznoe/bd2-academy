import {
  mkdir,
  copyFile,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
const dist = path.dirname(
  require.resolve("@duckdb/duckdb-wasm/dist/duckdb-browser.mjs"),
);
await mkdir("public/duckdb", { recursive: true });
for (const filename of [
  "duckdb-mvp.wasm",
  "duckdb-eh.wasm",
  "duckdb-browser-mvp.worker.js",
  "duckdb-browser-eh.worker.js",
])
  await copyFile(
    path.join(dist, filename),
    path.join("public/duckdb", filename),
  );
console.log("DuckDB WebAssembly et workers disponibles localement.");

const lessonFiles = (await readdir("src/content", { recursive: true })).filter(
  (file) => file.endsWith(".mdx"),
);
const searchIndex = {};
for (const file of lessonFiles)
  searchIndex[path.basename(file, ".mdx")] = await readFile(
    path.join("src/content", file),
    "utf8",
  );
await mkdir("public/datasets", { recursive: true });
await writeFile(
  "public/datasets/search-index.json",
  JSON.stringify(searchIndex),
);
