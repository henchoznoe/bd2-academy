import { describe, it, expect } from "vitest";
import {
  coverageIssues,
  exercises,
  lessons,
  modules,
  sources,
  skills,
} from "../src/lib/catalog";
describe("source and pedagogical coverage", () => {
  it("covers all curriculum exercises, TP subquestions and visible exam questions", () => {
    expect(coverageIssues()).toEqual([]);
    expect(sources).toHaveLength(20);
    expect(sources.reduce((n, s) => n + s.pages, 0)).toBe(687);
    expect(modules).toHaveLength(8);
    expect(exercises.filter((e) => e.origin === "exam")).toHaveLength(55);
  });
  it("attaches every lesson to practice and every exercise to real skills and hints", () => {
    for (const lesson of lessons) {
      expect(
        exercises.some((e) => e.lessonId === lesson.id),
        lesson.id,
      ).toBe(true);
      expect(lesson.sourceRefs.length, lesson.id).toBeGreaterThan(0);
    }
    for (const exercise of exercises) {
      expect(exercise.hints.length, exercise.id).toBeGreaterThanOrEqual(2);
      for (const id of exercise.skillIds)
        expect(
          skills.some((s) => s.id === id),
          `${exercise.id}: ${id}`,
        ).toBe(true);
    }
  });
});
