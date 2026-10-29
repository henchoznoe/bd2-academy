import "fake-indexeddb/auto";
import { beforeEach, describe, it, expect } from "vitest";
import { del, get, set } from "idb-keyval";
import {
  blankRecord,
  initialProgress,
  persistProgress,
  loadProgress,
  parseImport,
  progressMarkdown,
} from "../src/lib/progress";
const currentKey = "bd2-academy:progress:v2";
const legacyKey = "bd2-academy:progress:v1";
beforeEach(async () => {
  await del(currentKey);
  await del(legacyKey);
});
describe("shared course progression reset", () => {
  it("starts every new user with no inherited skills, drafts, journal or lesson", () => {
    expect(initialProgress()).toEqual({
      format: "bd2-academy",
      version: 2,
      records: {},
      journal: [],
      lastLesson: null,
    });
    const first = initialProgress();
    first.records["B1.02"] = { ...blankRecord(), status: "verified" };
    expect(initialProgress().records).toEqual({});
    const markdown = progressMarkdown(initialProgress());
    expect(markdown).not.toContain("- [x]");
    expect(markdown).not.toMatch(/roadmap/i);
  });
  it("discards the full legacy profile for users who already opened the site", async () => {
    await set(legacyKey, {
      format: "bd2-academy",
      version: 1,
      records: {
        "B0.V": { ...blankRecord(), status: "verified", draft: "SELECT 1;" },
      },
      journal: [
        {
          id: "old",
          skill: "B1",
          difficulty: "Legacy note",
          correction: "",
          redo: "",
          resolved: false,
        },
      ],
      lastLesson: "sql-pivot",
    });
    expect(await loadProgress()).toEqual(initialProgress());
    expect(await get(legacyKey)).toBeUndefined();
  });
  it("keeps each user’s new work after the one-time reset and survives reloads", async () => {
    const progress = initialProgress();
    progress.records["B1.02"] = {
      ...blankRecord(),
      status: "verified",
      understood: true,
      draft: "SELECT NULL;",
      attempts: 1,
    };
    progress.records["B0.01"] = {
      ...blankRecord(),
      status: "declared",
      understood: true,
    };
    await Promise.all([
      persistProgress(progress),
      persistProgress({ ...progress, lastLesson: "df-cles" }),
    ]);
    await set(legacyKey, { version: 1, records: { old: "ignored" } });
    const saved = await loadProgress();
    expect(saved.lastLesson).toBe("df-cles");
    expect(saved.records["B1.02"].draft).toBe("SELECT NULL;");
    expect(await get(legacyKey)).toBeUndefined();
    expect(await loadProgress()).toEqual(saved);
    expect(parseImport(JSON.stringify(saved))).toEqual(saved);
    const markdown = progressMarkdown(saved);
    expect(markdown).toContain("[x] **B1.02**");
    expect(markdown).toContain("[ ] **B0.01**");
    expect(markdown).toContain("Compréhension déclarée");
  });
  it("rejects old personal backups and invalid imports without replacing the current work", async () => {
    await persistProgress({ ...initialProgress(), lastLesson: "df-cles" });
    expect(() => parseImport("{")).toThrow();
    expect(() =>
      parseImport(JSON.stringify({ ...initialProgress(), version: 1 })),
    ).toThrow(/version 2/);
    expect(() =>
      parseImport(JSON.stringify({ ...initialProgress(), version: 3 })),
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
