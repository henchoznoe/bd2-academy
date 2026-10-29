import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { get, set } from "idb-keyval";
import {
  exercises,
  lessons,
  skills,
  sources,
  exerciseById,
  coverageIssues,
} from "../src/lib/catalog";
import {
  closure,
  candidateKeys,
  parseFDs,
  minimalCover,
  equivalent,
  isMinimalCover,
  normalForms,
  preservedDependencies,
  losslessBinary,
} from "../src/lib/relations";
import {
  loadProgress,
  persistProgress,
  parseImport,
} from "../src/lib/progress";
import baseline from "./fixtures/catalog-before-te1-2526.json";
import previousSave from "./fixtures/progress-v2-before-te1-2526.json";
const attributes = ["A", "B", "C", "D", "E"];
const dfCase = parseFDs("A -> B; B -> D; C -> A; A B -> C; B C -> E");
const nfCase = parseFDs("A -> C; C -> A; B -> E; E -> B; A B -> D");
describe("TE1 2025–2026: coverage, proofs and saved progress compatibility", () => {
  it("covers each of the 25 visible questions with the actual PDF page positions", () => {
    expect(sources.find((s) => s.id === "EX-2526")).toEqual({
      id: "EX-2526",
      file: "TE1_2526.pdf",
      pages: 10,
    });
    const positions: Record<string, number[]> = {
      "1.1": [4],
      "1.2": [4],
      "1.3": [4],
      "1.4": [4],
      "1.5": [2],
      "1.6": [2],
      "1.7": [2],
      "1.8": [2],
      "1.9": [2],
      "1.10": [3],
      "2.1": [3],
      "2.2": [5],
      "2.3": [5],
      "2.4": [5],
      "3.1": [6],
      "3.2": [6],
      "3.3": [6],
      "3.4": [8],
      "4.1-req2": [8],
      "4.1-req3": [7],
      "4.1-req4": [7],
      "4.2": [10],
      "5.1": [10],
      "5.2": [10],
      "5.3": [9],
    };
    const added = exercises.filter((e) => e.id.startsWith("EX-2526-"));
    expect(added).toHaveLength(25);
    expect(lessons.filter((l) => l.id.startsWith("te1-2526-"))).toHaveLength(5);
    for (const [question, pages] of Object.entries(positions)) {
      const exercise = exerciseById("EX-2526-" + question)!;
      expect(exercise.sourceRefs).toContainEqual({
        sourceId: "EX-2526",
        pages,
      });
      expect(exercise.origin).toBe("exam");
      expect(exercise.dataOrigin).toBeTruthy();
    }
    expect(added.filter((e) => e.type === "sql")).toHaveLength(3);
    expect(coverageIssues()).toEqual([]);
  });
  it("preserves every previous lesson route, exercise ID, lesson association and skill ID", () => {
    const lessonIds = new Set(lessons.map((l) => l.id));
    const skillIds = new Set(skills.map((s) => s.id));
    for (const id of baseline.lessonIds)
      expect(lessonIds.has(id), id).toBe(true);
    for (const id of baseline.skillIds) expect(skillIds.has(id), id).toBe(true);
    for (const [id, lessonId] of Object.entries(baseline.exerciseLessons))
      expect(exerciseById(id)?.lessonId, id).toBe(lessonId);
  });
  it("loads an existing v2 profile without resetting any record, draft, attempt, note or resume point", async () => {
    // Write directly to the historical key: a new key or an automatic reset would fail this check.
    await set("bd2-academy:progress:v2", structuredClone(previousSave));
    const loaded = await loadProgress();
    expect(loaded).toEqual(previousSave);
    expect(parseImport(JSON.stringify(previousSave))).toEqual(previousSave);
    await persistProgress(loaded);
    expect(await get("bd2-academy:progress:v2")).toEqual(previousSave);
    expect(await loadProgress()).toEqual(previousSave);
    for (const e of exercises.filter((e) => e.id.startsWith("EX-2526-")))
      expect(loaded.records[e.id]).toBeUndefined();
  });
  it("proves the selected minimal cover, closures and candidate keys", () => {
    const cover = parseFDs("A -> B; B -> D; C -> A; A -> C; C -> E");
    expect(equivalent(dfCase, cover)).toBe(true);
    expect(isMinimalCover(cover)).toBe(true);
    expect(isMinimalCover(minimalCover(dfCase).fds)).toBe(true);
    expect(closure(["A"], dfCase).attributes).toEqual(attributes);
    expect(closure(["E"], dfCase).attributes).toEqual(["E"]);
    expect(closure(["A", "C"], dfCase).attributes).toEqual(attributes);
    expect(candidateKeys(attributes, dfCase)).toEqual([["A"], ["C"]]);
    expect(closure(["A", "E", "C"], dfCase).attributes).toContain("D");
  });
  it("checks that the two-tuple counterexample violates only F1", () => {
    const rows = [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1],
    ];
    const holds = (fd: (typeof dfCase)[number]) =>
      rows.every((a) =>
        rows.every(
          (b) =>
            !fd.left.every(
              (attr) =>
                a[attributes.indexOf(attr)] === b[attributes.indexOf(attr)],
            ) ||
            fd.right.every(
              (attr) =>
                a[attributes.indexOf(attr)] === b[attributes.indexOf(attr)],
            ),
        ),
      );
    expect(dfCase.map(holds)).toEqual([false, true, true, true, true]);
    expect(closure(["A"], dfCase.slice(1)).attributes).toEqual(["A"]);
  });
  it("proves all normalization keys, local forms, DF preservation and both lossless steps", () => {
    expect(candidateKeys(attributes, nfCase)).toEqual([
      ["A", "B"],
      ["B", "C"],
      ["A", "E"],
      ["C", "E"],
    ]);
    const decomposition = [
      ["A", "C"],
      ["B", "E"],
      ["A", "B", "D"],
    ];
    expect(preservedDependencies(decomposition, nfCase)).toEqual([]);
    for (const relation of decomposition)
      expect(normalForms(relation, nfCase).bcnf).toBe(true);
    expect(
      losslessBinary(attributes, ["A", "C"], ["A", "B", "D", "E"], nfCase),
    ).toBe(true);
    expect(
      losslessBinary(["A", "B", "D", "E"], ["B", "E"], ["A", "B", "D"], nfCase),
    ).toBe(true);
    // The first intersection determines AC but not ABDE: only one implication is required.
    expect(closure(["A"], nfCase).attributes).not.toContain("B");
    const counter = normalForms(["A", "B", "C"], parseFDs("A B -> C; C -> B"));
    expect(counter.keys).toEqual([
      ["A", "B"],
      ["A", "C"],
    ]);
    expect(counter.third).toBe(true);
    expect(counter.bcnf).toBe(false);
  });
});
