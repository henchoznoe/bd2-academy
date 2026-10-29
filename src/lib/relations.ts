export type FD = { left: string[]; right: string[] };
const unique = (xs: string[]) => [...new Set(xs)].sort();
const includes = (a: string[], b: string[]) => b.every((x) => a.includes(x));
export function parseAttributes(text: string): string[] {
  return unique(text.split(/[\s,;]+/).filter(Boolean));
}
export function parseFDs(text: string): FD[] {
  return text
    .split(/[;\n]+/)
    .filter((x) => x.trim())
    .map((line) => {
      const sides = line.split(/->|→/);
      if (sides.length !== 2)
        throw new Error(
          "Écrire chaque DF sous la forme A B -> C, une par ligne.",
        );
      const left = parseAttributes(sides[0]),
        right = parseAttributes(sides[1]);
      if (!right.length)
        throw new Error("La cible d’une DF doit contenir un attribut.");
      return { left, right };
    });
}
export function closure(seed: string[], fds: FD[]) {
  const result = new Set(seed);
  const steps: { rule: FD; added: string[]; result: string[] }[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of fds)
      if (rule.left.every((x) => result.has(x))) {
        const added = rule.right.filter((x) => !result.has(x));
        if (added.length) {
          added.forEach((x) => result.add(x));
          changed = true;
          steps.push({ rule, added, result: [...result].sort() });
        }
      }
  }
  return { attributes: [...result].sort(), steps };
}
export function equivalent(first: FD[], second: FD[]): boolean {
  return (
    first.every((f) => includes(closure(f.left, second).attributes, f.right)) &&
    second.every((f) => includes(closure(f.left, first).attributes, f.right))
  );
}
export function subsets(attributes: string[]): string[][] {
  if (attributes.length > 12)
    throw new Error(
      "Limiter à 12 attributs pour cette exploration exhaustive.",
    );
  return Array.from({ length: 2 ** attributes.length }, (_, mask) =>
    attributes.filter((_, i) => mask & (1 << i)),
  ).sort((a, b) => a.length - b.length);
}
export function candidateKeys(attributes: string[], fds: FD[]): string[][] {
  const keys: string[][] = [];
  for (const set of subsets(unique(attributes))) {
    if (keys.some((key) => includes(set, key))) continue;
    if (includes(closure(set, fds).attributes, attributes)) keys.push(set);
  }
  return keys;
}
export function minimalCover(fds: FD[]) {
  const steps: string[] = [];
  let result: FD[] = fds
    .flatMap((f) => f.right.map((r) => ({ left: unique(f.left), right: [r] })))
    .filter((f) => !f.left.includes(f.right[0]));
  const format = (f: FD) => `${f.left.join(" ") || "∅"} → ${f.right.join(" ")}`;
  steps.push("Décomposer les cibles et supprimer les DF triviales.");
  for (let i = 0; i < result.length; i++) {
    for (const attribute of [...result[i].left]) {
      const reduced = result[i].left.filter((x) => x !== attribute);
      if (includes(closure(reduced, result).attributes, result[i].right)) {
        steps.push(`${attribute} est superflu dans ${format(result[i])}.`);
        result[i] = { left: reduced, right: result[i].right };
      }
    }
  }
  for (let i = result.length - 1; i >= 0; i--) {
    const rest = result.filter((_, j) => i !== j);
    if (includes(closure(result[i].left, rest).attributes, result[i].right)) {
      steps.push(`${format(result[i])} est redondante.`);
      result = rest;
    }
  }
  return { fds: result, steps };
}
export function projection(attributes: string[], fds: FD[]): FD[] {
  if (attributes.length > 8)
    throw new Error(
      "Limiter à 8 attributs pour la projection exhaustive et la normalisation de cet atelier.",
    );
  const projected: FD[] = [];
  for (const left of subsets(attributes))
    for (const right of closure(left, fds).attributes) {
      if (attributes.includes(right) && !left.includes(right))
        projected.push({ left, right: [right] });
    }
  return minimalCover(projected).fds;
}
export function normalForms(attributes: string[], fds: FD[]) {
  const keys = candidateKeys(attributes, fds),
    prime = unique(keys.flat());
  const projected = projection(attributes, fds);
  const thirdViolations = projected.filter(
    (f) =>
      !includes(closure(f.left, fds).attributes, attributes) &&
      f.right.some((x) => !prime.includes(x)),
  );
  const bcnfViolations = projected.filter(
    (f) => !includes(closure(f.left, fds).attributes, attributes),
  );
  const secondViolations: FD[] = [];
  for (const key of keys)
    for (const part of subsets(key).filter((p) => p.length < key.length)) {
      const right = closure(part, fds).attributes.filter(
        (x) => attributes.includes(x) && !prime.includes(x),
      );
      if (right.length) secondViolations.push({ left: part, right });
    }
  return {
    keys,
    prime,
    second: secondViolations.length === 0,
    third: thirdViolations.length === 0,
    bcnf: bcnfViolations.length === 0,
    secondViolations,
    thirdViolations,
    bcnfViolations,
  };
}
export function synthesize3NF(attributes: string[], fds: FD[]) {
  const cover = minimalCover(fds).fds;
  const groups = new Map<string, string[]>();
  for (const f of cover) {
    const key = f.left.join(",");
    groups.set(key, unique([...(groups.get(key) ?? f.left), ...f.right]));
  }
  const partitions = [...groups.entries()].map(([source, attrs]) => ({
    source: source ? source.split(",") : [],
    attrs,
  }));
  for (let i = 0; i < partitions.length; i++)
    for (let j = partitions.length - 1; j > i; j--) {
      const left = partitions[i],
        right = partitions[j];
      if (
        includes(closure(left.source, cover).attributes, right.source) &&
        includes(closure(right.source, cover).attributes, left.source)
      ) {
        const merged = unique([...left.attrs, ...right.attrs]);
        if (normalForms(merged, projection(merged, cover)).third) {
          left.attrs = merged;
          partitions.splice(j, 1);
        }
      }
    }
  let relations = partitions.map((group) => group.attrs);
  relations = relations.filter(
    (r, i) =>
      !relations.some(
        (s, j) => i !== j && includes(s, r) && (s.length > r.length || j < i),
      ),
  );
  const key = candidateKeys(attributes, fds)[0] ?? attributes;
  if (!relations.some((r) => includes(r, key))) relations.push(key);
  return relations;
}
export function decomposeBCNF(
  attributes: string[],
  fds: FD[],
): { relations: string[][]; steps: string[] } {
  const steps: string[] = [];
  function split(attrs: string[]): string[][] {
    const local = projection(attrs, fds);
    const violation = local.find(
      (f) => !includes(closure(f.left, local).attributes, attrs),
    );
    if (!violation) return [attrs];
    const first = unique([...violation.left, ...violation.right]);
    const second = attrs.filter(
      (x) => !violation.right.includes(x) || violation.left.includes(x),
    );
    steps.push(
      `${attrs.join(",")} : ${violation.left.join(",")} → ${violation.right.join(",")} donne (${first.join(",")}) et (${second.join(",")}).`,
    );
    return [...split(first), ...split(second)];
  }
  return { relations: split(unique(attributes)), steps };
}
export function losslessBinary(
  original: string[],
  first: string[],
  second: string[],
  fds: FD[],
): boolean {
  if (
    !includes(unique([...first, ...second]), original) ||
    !includes(original, [...first, ...second])
  )
    return false;
  const intersection = first.filter((x) => second.includes(x));
  const reached = closure(intersection, fds).attributes;
  return includes(reached, first) || includes(reached, second);
}
export function preservedDependencies(relations: string[][], fds: FD[]): FD[] {
  const projected = relations.flatMap((r) => projection(r, fds));
  return fds.filter(
    (f) => !includes(closure(f.left, projected).attributes, f.right),
  );
}
export const formatFD = (f: FD) =>
  `${f.left.join(" ") || "∅"} → ${f.right.join(" ")}`;

export function isMinimalCover(fds: FD[]): boolean {
  if (fds.some((f) => f.right.length !== 1 || f.left.includes(f.right[0])))
    return false;
  return fds.every(
    (f, i) =>
      !f.left.some((x) =>
        includes(
          closure(
            f.left.filter((a) => a !== x),
            fds,
          ).attributes,
          f.right,
        ),
      ) &&
      !includes(
        closure(
          f.left,
          fds.filter((_, j) => i !== j),
        ).attributes,
        f.right,
      ),
  );
}
