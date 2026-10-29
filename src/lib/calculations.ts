export function storage(input: {
  count: number;
  block: number;
  record: number;
  key: number;
  pointer: number;
  header: number;
  fill: number;
}) {
  const { count, block, record, key, pointer, header, fill } = input;
  if (
    ![count, block, record, key, pointer, header].every(Number.isInteger) ||
    count < 0 ||
    record <= 0 ||
    key <= 0 ||
    pointer <= 0 ||
    header < 0 ||
    block <= header ||
    fill <= 0 ||
    fill > 1
  )
    throw new Error(
      "Utiliser des entiers positifs, un effectif positif ou nul et une densité entre 0 et 1.",
    );
  const recordsPerBlock = Math.floor((block - header) / record);
  const leafCapacity = Math.floor((block - header - pointer) / (key + pointer));
  const fanout = Math.floor((block - header + key) / (key + pointer));
  if (recordsPerBlock < 1 || leafCapacity < 1 || fanout < 2)
    throw new Error("Bloc trop petit pour les tailles demandées.");
  const occupied = Math.max(1, Math.floor(leafCapacity * fill));
  const dataBlocks = Math.ceil(count / recordsPerBlock),
    levels: number[] = [];
  let nodes = Math.ceil(count / occupied);
  if (nodes) levels.push(nodes);
  while (nodes > 1) {
    nodes = Math.ceil(nodes / fanout);
    levels.push(nodes);
  }
  return {
    recordsPerBlock,
    leafCapacity,
    occupied,
    fanout,
    dataBlocks,
    levels,
    height: levels.length,
    indexBlocks: levels.reduce((a, b) => a + b, 0),
    dataBytes: dataBlocks * block,
    indexBytes: levels.reduce((a, b) => a + b, 0) * block,
  };
}
export function cacheCost(
  logical: number,
  ratio: number,
  physicalMs: number,
  memoryMs: number,
) {
  if (logical < 0 || ratio < 0 || ratio > 1 || memoryMs < 0 || physicalMs < 0)
    throw new Error("Vérifier les bornes des paramètres.");
  return {
    hits: logical * ratio,
    physical: logical * (1 - ratio),
    milliseconds: logical * memoryMs + logical * (1 - ratio) * physicalMs,
  };
}
export function vectorMetrics(first: number[], second: number[]) {
  if (
    !first.length ||
    first.length !== second.length ||
    [...first, ...second].some((x) => !Number.isFinite(x))
  )
    throw new Error(
      "Les vecteurs doivent avoir la même dimension et des valeurs finies.",
    );
  const dot = first.reduce((s, x, i) => s + x * second[i], 0);
  const normA = Math.hypot(...first),
    normB = Math.hypot(...second);
  const cosine =
    normA && normB ? Math.max(-1, Math.min(1, dot / (normA * normB))) : null;
  return {
    dot,
    cosine,
    cosineDistance: cosine === null ? null : 1 - cosine,
    l1: first.reduce((s, x, i) => s + Math.abs(x - second[i]), 0),
    l2: Math.hypot(...first.map((x, i) => x - second[i])),
  };
}
const stopwords = new Set([
  "le",
  "la",
  "les",
  "un",
  "une",
  "des",
  "de",
  "du",
  "et",
  "en",
  "a",
  "au",
  "aux",
  "the",
  "a",
  "an",
  "of",
  "and",
  "is",
  "to",
]);
export function tokenize(text: string, removeStops = true, foldAccents = true) {
  const normalized = foldAccents
    ? text.normalize("NFD").replace(/\p{M}/gu, "")
    : text.normalize("NFC");
  return (normalized.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    (t) => !removeStops || !stopwords.has(t),
  );
}
export function textIndex(
  documents: string[],
  query: string,
  removeStops = true,
  foldAccents = true,
) {
  const tokens = documents.map((d) => tokenize(d, removeStops, foldAccents));
  const vocabulary = [...new Set(tokens.flat())].sort();
  const frequencies = tokens.map((words) =>
    vocabulary.map((term) => words.filter((t) => t === term).length),
  );
  const df = vocabulary.map(
    (_, i) => frequencies.filter((row) => row[i] > 0).length,
  );
  const idf = df.map((n) => Math.log10(documents.length / n));
  const tfs = frequencies.map((row, j) =>
    row.map((count) => count / (tokens[j].length || 1)),
  );
  const vectors = tfs.map((row) => row.map((tf, i) => tf * idf[i]));
  const queryTokens = tokenize(query, removeStops, foldAccents);
  const queryVector = vocabulary.map(
    (term, i) =>
      (queryTokens.filter((t) => t === term).length /
        (queryTokens.length || 1)) *
      idf[i],
  );
  const scores = vectors.map((v) =>
    v.length ? vectorMetrics(v, queryVector).cosine : null,
  );
  return {
    tokens,
    vocabulary,
    frequencies,
    tfs,
    df,
    idf,
    vectors,
    scores,
    postings: vocabulary.map((term, i) => ({
      term,
      documents: frequencies.flatMap((row, j) => (row[i] ? [j + 1] : [])),
    })),
  };
}
export function bitmapCombine(
  first: boolean[],
  second: boolean[],
  operation: "AND" | "OR" | "XOR" | "NOT",
) {
  if (first.length !== second.length)
    throw new Error("Les bitmaps doivent avoir la même longueur.");
  return first.map((a, i) =>
    operation === "AND"
      ? a && second[i]
      : operation === "OR"
        ? a || second[i]
        : operation === "XOR"
          ? a !== second[i]
          : !a,
  );
}
export function hashBuckets(values: number[], count: number) {
  if (!Number.isInteger(count) || count < 1)
    throw new Error("Nombre de seaux entier positif requis.");
  const buckets = Array.from({ length: count }, () => [] as number[]);
  values.forEach((v) => buckets[((v % count) + count) % count].push(v));
  return buckets;
}
