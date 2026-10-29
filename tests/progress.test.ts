import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import {
  initialProgress,
  persistProgress,
  loadProgress,
  parseImport,
  progressMarkdown,
} from "../src/lib/progress";
describe("versioned local progression", () => {
  it("preserves declared mastery and partial independently checked skills", () => {
    const p = initialProgress();
    expect(p.records["B0.01"].status).toBe("declared");
    expect(p.records["B0.04"].status).toBe("verified");
    expect(p.records["B1.02"].status).toBe("verified");
    expect(p.records["B1.05c"]).toBeUndefined();
  });
  it("roundtrips IndexedDB, drafts, ordered saves and export/import", async () => {
    const p = initialProgress();
    p.records["B1.02"].draft = "SELECT NULL;";
    await Promise.all([
      persistProgress(p),
      persistProgress({ ...p, lastLesson: "df-cles" }),
    ]);
    const saved = await loadProgress();
    expect(saved.lastLesson).toBe("df-cles");
    expect(saved.records["B1.02"].draft).toBe("SELECT NULL;");
    expect(parseImport(JSON.stringify(saved))).toEqual(saved);
    const md = progressMarkdown(saved);
    expect(md).toContain("[x] **B0.04**");
    expect(md).toContain("[ ] **B0.01**");
    expect(md).toContain("Compréhension déclarée");
  });
  it("rejects wrong versions, malformed fields and oversized imports without replacing data", async () => {
    expect(() => parseImport("{")).toThrow();
    expect(() =>
      parseImport(JSON.stringify({ ...initialProgress(), version: 2 })),
    ).toThrow();
    expect(() =>
      parseImport(
        JSON.stringify({
          ...initialProgress(),
          records: { x: { status: "verified" } },
        }),
      ),
    ).toThrow();
    expect(() => parseImport(" ".repeat(5000001))).toThrow();
    expect((await loadProgress()).lastLesson).toBe("df-cles");
  });
});
