import { describe, it, expect } from "vitest";
import {
  parseFDs,
  closure,
  candidateKeys,
  equivalent,
  minimalCover,
  isMinimalCover,
  projection,
  normalForms,
  synthesize3NF,
  decomposeBCNF,
  preservedDependencies,
  losslessBinary,
} from "../src/lib/relations";
describe("Functional dependency reasoning", () => {
  it("reaches a fixed point and retains a useful derivation trace", () => {
    const result = closure(["A"], parseFDs("D -> E; B -> D; A -> B C"));
    expect(result.attributes).toEqual(["A", "B", "C", "D", "E"]);
    expect(result.steps).toHaveLength(3);
    expect(closure(["Z"], parseFDs("A -> B")).attributes).toEqual(["Z"]);
  });
  it("finds all four mixed candidate keys, including those omitted by illustrated closures", () => {
    const f = parseFDs(
      "A -> B1 B2; B1 B2 -> C1 C2; C1 C2 -> D1 D2; D1 D2 -> A; D1 -> B1; D2 -> B2",
    );
    const keys = candidateKeys(["A", "B1", "B2", "C1", "C2", "D1", "D2"], f);
    expect(keys.some((k) => k.join(",") === "A")).toBe(true);
    for (const key of keys)
      for (const attr of key)
        expect(
          closure(
            key.filter((a) => a !== attr),
            f,
          ).attributes.length,
        ).toBeLessThan(7);
  });
  it("accepts different equivalent minimal covers instead of matching one answer", () => {
    const f = parseFDs("A -> B; B -> A; A -> C");
    const other = parseFDs("B -> A C; A -> B");
    expect(equivalent(f, other)).toBe(true);
    const alternative = parseFDs("B -> A; A -> B; B -> C");
    expect(isMinimalCover(alternative)).toBe(true);
    expect(equivalent(f, alternative)).toBe(true);
    expect(isMinimalCover(parseFDs("A -> B C"))).toBe(false);
    expect(isMinimalCover(parseFDs("A X -> B; A -> B"))).toBe(false);
    expect(equivalent(f, parseFDs("A -> B; B -> A"))).toBe(false);
  });
  it("removes extraneous determinants and redundant dependencies without changing semantics", () => {
    const original = parseFDs("A -> B; A B -> C; A -> C; C -> D; A -> D");
    const cover = minimalCover(original).fds;
    expect(equivalent(original, cover)).toBe(true);
    expect(isMinimalCover(cover)).toBe(true);
    expect(cover).toHaveLength(3);
  });
  it("handles independent attributes, empty determinants and all keys exhaustively", () => {
    const f = parseFDs(
      "A -> B C; B -> D; D G -> I; D -> E; A B C -> D; I -> A",
    );
    expect(
      candidateKeys(["A", "B", "C", "D", "E", "G", "H", "I"], f).map((k) =>
        k.join(""),
      ),
    ).toEqual(["AGH", "BGH", "DGH", "GHI"]);
    expect(candidateKeys(["A", "B"], parseFDs(" -> A; A -> B"))).toEqual([[]]);
  });
  it("separates lossless join from preservation", () => {
    const f = parseFDs("A -> B; B -> C");
    expect(losslessBinary(["A", "B", "C"], ["A", "B"], ["A", "C"], f)).toBe(
      true,
    );
    expect(
      preservedDependencies(
        [
          ["A", "B"],
          ["A", "C"],
        ],
        f,
      ),
    ).toEqual([{ left: ["B"], right: ["C"] }]);
    expect(
      losslessBinary(
        ["A", "B", "C"],
        ["A", "B"],
        ["B", "C"],
        parseFDs("A -> B"),
      ),
    ).toBe(false);
    expect(losslessBinary(["A", "B", "C"], ["A"], ["B"], f)).toBe(false);
  });
  it("checks every candidate key for 2NF and allows prime RHS in 3NF", () => {
    const f = parseFDs("A -> B; B C -> A");
    const forms = normalForms(["A", "B", "C"], f);
    expect(forms.keys).toEqual([
      ["A", "C"],
      ["B", "C"],
    ]);
    expect(forms.third).toBe(true);
    expect(forms.bcnf).toBe(false);
    const second = normalForms(
      ["A", "B", "C", "D"],
      parseFDs("A -> D; A B -> C"),
    );
    expect(second.second).toBe(false);
  });
  it("projects inferred dependencies and builds valid 3NF/BCNF components", () => {
    const attrs = ["A", "B", "C"],
      f = parseFDs("A -> B; B -> C");
    expect(closure(["A"], projection(["A", "C"], f)).attributes).toEqual([
      "A",
      "C",
    ]);
    const third = synthesize3NF(attrs, f);
    expect(preservedDependencies(third, f)).toHaveLength(0);
    for (const relation of third)
      expect(normalForms(relation, projection(relation, f)).third).toBe(true);
    for (const relation of decomposeBCNF(attrs, f).relations)
      expect(normalForms(relation, projection(relation, f)).bcnf).toBe(true);
  });
});
