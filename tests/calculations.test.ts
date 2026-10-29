import { describe, it, expect } from "vitest";
import {
  storage,
  cacheCost,
  vectorMetrics,
  tokenize,
  textIndex,
  bitmapCombine,
  hashBuckets,
} from "../src/lib/calculations";
import { compareResults } from "../src/lib/results";
describe("physical storage", () => {
  it("rounds rows, pages and index fanout according to the announced model", () => {
    const result = storage({
      count: 1000000,
      block: 4096,
      record: 100,
      key: 20,
      pointer: 8,
      header: 0,
      fill: 1,
    });
    expect(result.recordsPerBlock).toBe(40);
    expect(result.dataBlocks).toBe(25000);
    expect(result.fanout).toBe(147);
    expect(result.leafCapacity).toBe(146);
    expect(result.height).toBe(3);
    expect(result.levels).toEqual([6850, 47, 1]);
    expect(result.indexBlocks).toBe(6898);
    const smaller = storage({
      count: 1000000,
      block: 4096,
      record: 50,
      key: 20,
      pointer: 8,
      header: 0,
      fill: 1,
    });
    expect(smaller.dataBlocks).toBe(12346);
    expect(smaller.indexBlocks).toBe(result.indexBlocks);
  });
  it("handles empty tables, insufficient blocks and expected cache costs", () => {
    expect(
      storage({
        count: 0,
        block: 4096,
        record: 100,
        key: 20,
        pointer: 8,
        header: 0,
        fill: 0.7,
      }).height,
    ).toBe(0);
    expect(() =>
      storage({
        count: 10,
        block: 10,
        record: 100,
        key: 20,
        pointer: 8,
        header: 0,
        fill: 1,
      }),
    ).toThrow();
    const cost = cacheCost(10000, 0.92, 10, 0.001);
    expect(cost.physical).toBeCloseTo(800);
    expect(cost.milliseconds).toBeCloseTo(8010);
  });
});
describe("text and vectors", () => {
  it("uses Unicode tokens, stopwords and optional accent normalization", () => {
    expect(tokenize("Le CHAT, été !")).toEqual(["chat", "ete"]);
    expect(tokenize("Été", false, false)).toEqual(["été"]);
  });
  it("builds postings and makes zero norm explicit", () => {
    const index = textIndex(["chat maison", "chien maison"], "chat");
    expect(index.postings).toContainEqual({ term: "chat", documents: [1] });
    expect(index.idf[index.vocabulary.indexOf("maison")]).toBe(0);
    expect(index.scores[0]).toBeCloseTo(1);
    expect(index.scores[1]).toBe(0);
    expect(textIndex(["mot", "mot"], "mot").scores).toEqual([null, null]);
  });
  it("separates distances, similarities and dimensions", () => {
    const m = vectorMetrics([1, 0], [0, 1]);
    expect(m.cosine).toBe(0);
    expect(m.cosineDistance).toBe(1);
    expect(m.l2).toBeCloseTo(Math.sqrt(2));
    expect(m.l1).toBe(2);
    expect(vectorMetrics([0, 0], [1, 2]).cosine).toBeNull();
    expect(() => vectorMetrics([1], [1, 2])).toThrow();
  });
  it("combines bitmap positions and chains hash collisions deterministically", () => {
    expect(
      bitmapCombine([true, false, true], [false, true, true], "AND"),
    ).toEqual([false, false, true]);
    expect(hashBuckets([2, 7, 12, -3], 5)[2]).toEqual([2, 7, 12, -3]);
  });
});
describe("SQL answer comparison", () => {
  const expected = { columns: ["x"], rows: [[null], [0], [2], [2]] };
  it("preserves duplicate multiplicity, null and zero", () => {
    expect(
      compareResults(
        { columns: ["different alias"], rows: [[2], [null], [2], [0]] },
        expected,
      ).correct,
    ).toBe(true);
    expect(
      compareResults({ columns: ["x"], rows: [[null], [0], [2]] }, expected)
        .correct,
    ).toBe(false);
    expect(
      compareResults({ columns: ["x"], rows: [[0], [0], [2], [2]] }, expected)
        .correct,
    ).toBe(false);
  });
  it("only enforces ordering when required", () => {
    expect(
      compareResults(
        { columns: ["x"], rows: [[0], [null], [2], [2]] },
        expected,
        true,
      ).correct,
    ).toBe(false);
  });
});
