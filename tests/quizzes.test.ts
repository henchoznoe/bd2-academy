import { describe, expect, it } from "vitest";
import {
  exercises,
  exerciseById,
  lessons,
  lessonExercises,
  moduleQuizzes,
  modules,
  prioritizeQuizzes,
  coverageIssues,
} from "../src/lib/catalog";
import {
  candidateKeys,
  closure,
  normalForms,
  parseFDs,
} from "../src/lib/relations";
import baseline from "./fixtures/catalog-before-qcm.json";
const answer = (id: string) => {
  const e = exerciseById(`QCM-${id}`)!;
  return e.options![e.correctIndex!];
};
describe("chapter QCM coverage and ordering", () => {
  it("adds exactly two source-backed questions to every lesson, including exam practice", () => {
    const added = exercises.filter((e) => e.id.startsWith("QCM-"));
    expect(added).toHaveLength(162);
    expect(exercises.filter((e) => e.type === "quiz")).toHaveLength(217);
    expect(new Set(added.map((e) => e.prompt)).size).toBe(added.length);
    for (const lesson of lessons)
      expect(
        added.filter((e) => e.lessonId === lesson.id),
        lesson.id,
      ).toHaveLength(2);
    for (const e of added) {
      expect(e.type).toBe("quiz");
      expect(e.origin).toBe("created");
      expect(e.options, e.id).toHaveLength(4);
      expect(new Set(e.options).size, e.id).toBe(4);
      expect(e.solution, e.id).toContain(e.options![e.correctIndex!]);
      expect(e.solution, e.id).toContain(
        String.fromCharCode(65 + e.correctIndex!),
      );
      expect(e.explanation.length, e.id).toBeGreaterThan(60);
      expect(e.dataOrigin, e.id).toContain("entraînement");
      expect(e.sourceRefs.length, e.id).toBeGreaterThan(0);
    }
    expect(coverageIssues()).toEqual([]);
  });
  it("keeps all existing exercise IDs and associations while placing QCM first stably", () => {
    for (const [id, lessonId] of Object.entries(baseline.exerciseLessons))
      expect(exerciseById(id)?.lessonId, id).toBe(lessonId);
    for (const lesson of lessons) {
      const original = exercises.filter((e) => e.lessonId === lesson.id);
      const sorted = lessonExercises(lesson.id);
      const split = sorted.findIndex((e) => e.type !== "quiz");
      if (split >= 0)
        expect(
          sorted.slice(split).some((e) => e.type === "quiz"),
          lesson.id,
        ).toBe(false);
      expect(sorted.filter((e) => e.type !== "quiz").map((e) => e.id)).toEqual(
        original.filter((e) => e.type !== "quiz").map((e) => e.id),
      );
      expect(new Set(sorted.map((e) => e.id)).size).toBe(original.length);
    }
    const source = exercises.slice(0, 10),
      before = source.map((e) => e.id);
    prioritizeQuizzes(source);
    expect(source.map((e) => e.id)).toEqual(before);
  });
  it("provides complete unique sequences in lesson order for every chapter", () => {
    const all: string[] = [];
    for (const id of [...modules.map((m) => m.id), "examen"]) {
      const series = moduleQuizzes(id);
      expect(series.length, id).toBeGreaterThanOrEqual(6);
      expect(series.every((e) => e.type === "quiz")).toBe(true);
      expect(new Set(series.map((e) => e.id)).size).toBe(series.length);
      all.push(...series.map((e) => e.id));
      const orders = series.map(
        (e) => lessons.find((l) => l.id === e.lessonId)!.order,
      );
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    }
    expect(all).toHaveLength(217);
    expect(new Set(all).size).toBe(217);
    expect(moduleQuizzes("unknown")).toEqual([]);
  });
  it("independently checks numeric questions with the stated units and conventions", () => {
    const cases: [string, string][] = [
      ["physique-acces-02", `${4 + 3 + 1} ms`],
      ["physique-cache-01", `${(900 / 1000) * 100} %`],
      ["physique-blocs-01", String(Math.floor(4096 / 100))],
      ["physique-blocs-02", String(Math.ceil(1000 / 40))],
      ["btree-capacite-01", `${2 * 3} clés et ${2 * 3 + 1} fils`],
      ["btree-capacite-02", String(3)],
      ["index-couts-01", `${3 + 1} lectures de blocs`],
      ["index-couts-02", String(3 + 1 - 1)],
      ["sql-cinema-01", String(50 * 12)],
      [
        "sql-cinema-02",
        String((10 * 8 + 90 * 12) / (10 + 90)).replace(".", ","),
      ],
      ["sql-rollup-cube-02", String(2 ** 3)],
      ["texte-tfidf-01", String(3 / 12).replace(".", ",")],
      ["texte-tfidf-02", String(Math.log10(3 / 3))],
      ["texte-ranking-innodb-02", String(6 * Math.log10(10 / 1) ** 2)],
      ["vecteurs-mysql-01", `${512 * 4} octets`],
    ];
    for (const [id, expected] of cases) expect(answer(id), id).toBe(expected);
    const a = "101100",
      b = "011010";
    const and = [...a]
      .map((v, i) => (v === "1" && b[i] === "1" ? "1" : "0"))
      .join("");
    const union = [...a].filter((v, i) => v === "1" || b[i] === "1").length;
    expect(answer("bitmap-01")).toBe(and);
    expect(answer("bitmap-02")).toBe(String(union));
    expect(answer("texte-collations-tp-01")).toBe(
      `${new TextEncoder().encode("pingüino").length} et ${[..."pingüino"].length}`,
    );
  });
  it("checks the DF and normal-form examples using implication and key exploration", () => {
    expect(closure(["A"], parseFDs("A -> B; B -> C")).attributes).toEqual([
      "A",
      "B",
      "C",
    ]);
    expect(answer("df-fermetures-01")).toBe("{A,B,C}");
    const form = normalForms(["A", "B", "C"], parseFDs("A B -> C; C -> B"));
    expect(form.third).toBe(true);
    expect(form.bcnf).toBe(false);
    expect(answer("fn-3fn-02")).toBe("U est en 3FN mais pas en BCNF.");
    const f = parseFDs("A -> B; B -> D; C -> A; A B -> C; B C -> E");
    expect(candidateKeys(["A", "B", "C", "D", "E"], f)).toEqual([["A"], ["C"]]);
    expect(answer("te1-2526-df-01")).toBe("C'est une superclé non minimale.");
  });
});
