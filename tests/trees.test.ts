import { describe, it, expect } from "vitest";
import { BTree, BPlusTree } from "../src/lib/trees";
import type { TreeNode } from "../src/lib/trees";
function keys(node: TreeNode, plus: boolean): number[] {
  return node.leaf
    ? [...node.keys]
    : plus
      ? node.children.flatMap((c) => keys(c, true))
      : node.children.flatMap((c, i) => [
          ...keys(c, false),
          ...(i < node.keys.length ? [node.keys[i]] : []),
        ]);
}
function validate(root: TreeNode, plus: boolean) {
  const depths: number[] = [];
  function visit(n: TreeNode, depth: number, isRoot = false) {
    expect(n.keys).toEqual([...n.keys].sort((a, b) => a - b));
    expect(n.keys.length).toBeLessThanOrEqual(4);
    if (!isRoot) expect(n.keys.length).toBeGreaterThanOrEqual(2);
    if (n.leaf) {
      depths.push(depth);
      expect(n.children.length).toBe(0);
    } else {
      expect(n.children.length).toBe(n.keys.length + 1);
      n.children.forEach((c) => visit(c, depth + 1));
      if (plus)
        n.keys.forEach((key, i) =>
          expect(key).toBe(keys(n.children[i], true).at(-1)),
        );
    }
  }
  visit(root, 0, true);
  expect(new Set(depths).size).toBe(1);
  const all = keys(root, plus);
  expect(all).toEqual([...new Set(all)].sort((a, b) => a - b));
}
describe.each([
  ["B-tree", false],
  ["B+tree", true],
] as const)("%s operations", (_, plus) => {
  it("preserves sorted keys, occupancy, separators and equal leaf depth during insertions and deletions", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const tree = plus ? new BPlusTree() : new BTree(),
        expected = new Set<number>();
      const values = Array.from({ length: 65 }, (_, i) => i).sort(
        (a, b) => ((a * 17 + seed * 31) % 67) - ((b * 17 + seed * 31) % 67),
      );
      for (const value of values) {
        tree.insert(value);
        expected.add(value);
        validate(tree.root, plus);
        expect(keys(tree.root, plus)).toEqual(
          [...expected].sort((a, b) => a - b),
        );
      }
      tree.insert(values[0]);
      validate(tree.root, plus);
      for (const value of [...values].reverse()) {
        expect(tree.search(value).found).toBe(true);
        tree.delete(value);
        expected.delete(value);
        validate(tree.root, plus);
        expect(keys(tree.root, plus)).toEqual(
          [...expected].sort((a, b) => a - b),
        );
        expect(tree.search(value).found).toBe(false);
      }
      tree.delete(999);
      expect(tree.root.keys).toEqual([]);
    }
  });
  it("counts the visited index blocks along a search path", () => {
    const tree = plus ? new BPlusTree() : new BTree();
    [10, 20, 5, 6, 12, 30, 7, 17].forEach((v) => tree.insert(v));
    expect(tree.search(17).found).toBe(true);
    expect(tree.search(17).path.length).toBeGreaterThan(1);
    expect(tree.search(999).found).toBe(false);
  });
});
