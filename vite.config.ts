import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
export default defineConfig({
  plugins: [mdx({ remarkPlugins: [remarkGfm] }), react(), tailwindcss()],
  optimizeDeps: { exclude: ["@duckdb/duckdb-wasm"] },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
  build: { chunkSizeWarningLimit: 1500 },
});
