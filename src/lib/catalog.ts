import { z } from "zod";
import type { ComponentType } from "react";
import curriculum from "../content/curriculum.json" with { type: "json" };
export const sourceReferenceSchema = z.object({
  sourceId: z.string(),
  pages: z.array(z.number().int().positive()).min(1),
  section: z.string().optional(),
});
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export const lessonSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  title: z.string(),
  summary: z.string(),
  objectives: z.array(z.string()).min(1),
  sourceRefs: z.array(sourceReferenceSchema),
  skillIds: z.array(z.string()),
  order: z.number(),
});
export type Lesson = z.infer<typeof lessonSchema>;
export const exerciseSchema = z
  .object({
    id: z.string(),
    lessonId: z.string(),
    title: z.string(),
    type: z.enum(["quiz", "sql", "guided", "result", "lab"]),
    prompt: z.string().min(10),
    hints: z.array(z.string()),
    solution: z.string().min(1),
    explanation: z.string().min(1),
    skillIds: z.array(z.string()),
    sourceRefs: z.array(sourceReferenceSchema),
    origin: z.enum(["course", "tp", "created", "exam"]),
    tpId: z.string().optional(),
    tpQuestion: z.string().optional(),
    options: z.array(z.string()).optional(),
    correctIndex: z.number().int().nonnegative().optional(),
    acceptedAnswers: z.array(z.string()).optional(),
    datasetId: z.string().optional(),
    alternativeDatasetIds: z.array(z.string()).optional(),
    ordered: z.boolean().default(false),
    starter: z.string().optional(),
    dataOrigin: z.string().optional(),
  })
  .superRefine((e, ctx) => {
    if (e.type === "sql" && !e.datasetId)
      ctx.addIssue({ code: "custom", message: `${e.id} : datasetId requis.` });
    if (
      e.type === "quiz" &&
      (!e.options ||
        e.correctIndex === undefined ||
        e.correctIndex >= e.options.length)
    )
      ctx.addIssue({
        code: "custom",
        message: `${e.id} : options et réponse requises.`,
      });
    if (e.type === "result" && !e.acceptedAnswers?.length)
      ctx.addIssue({
        code: "custom",
        message: `${e.id} : réponses acceptées requises.`,
      });
  });
export type Exercise = z.infer<typeof exerciseSchema>;
const contentModules = import.meta.glob<{
  default: ComponentType;
  meta: Lesson;
}>("../content/**/*.mdx", { eager: true });
export const lessonComponents: Record<string, ComponentType> = {};
export const lessons = Object.values(contentModules)
  .map((module) => {
    const meta = lessonSchema.parse(module.meta);
    lessonComponents[meta.id] = module.default;
    return meta;
  })
  .sort((a, b) => a.order - b.order);
const exerciseModules = import.meta.glob<{ default: unknown }>(
  "../content/**/exercises.json",
  { eager: true },
);
export const exercises = Object.values(exerciseModules).flatMap((module) =>
  z.array(exerciseSchema).parse(module.default),
);
export const modules = [
  {
    id: "sql",
    number: "01",
    title: "SQL avancé",
    description: "Transformer, regrouper et explorer les données.",
    icon: "code",
    color: "indigo",
    lab: "sql",
    skillPrefix: ["B0.", "B1.", "B2.", "B3.", "B4."],
  },
  {
    id: "df",
    number: "02",
    title: "Dépendances fonctionnelles",
    description: "Prouver les règles et retrouver toutes les clés.",
    icon: "network",
    color: "blue",
    lab: "df",
    skillPrefix: ["B5."],
  },
  {
    id: "normalisation",
    number: "03",
    title: "Normalisation",
    description: "Décomposer avec des garanties : 1FN, 2FN, 3FN, BCNF et 4FN.",
    icon: "layers",
    color: "violet",
    lab: "normalisation",
    skillPrefix: ["B6."],
  },
  {
    id: "physique",
    number: "04",
    title: "Organisation physique",
    description: "Relier blocs, cache et coûts des accès.",
    icon: "database",
    color: "amber",
    lab: "physique",
    skillPrefix: ["B7."],
  },
  {
    id: "btree",
    number: "05",
    title: "B-arbres et index",
    description: "Construire les arbres et choisir les bons index.",
    icon: "tree",
    color: "emerald",
    lab: "arbres",
    skillPrefix: ["B8."],
  },
  {
    id: "autres-index",
    number: "06",
    title: "Autres organisations",
    description: "Bitmaps, hachage et clusters, selon les requêtes.",
    icon: "grid",
    color: "cyan",
    lab: "bitmaps",
    skillPrefix: ["B9."],
  },
  {
    id: "fulltext",
    number: "07",
    title: "Recherche textuelle",
    description: "Des mots aux documents et à leur pertinence.",
    icon: "search",
    color: "rose",
    lab: "texte",
    skillPrefix: ["B10.0", "B10.1"],
  },
  {
    id: "vecteurs",
    number: "08",
    title: "Recherche vectorielle",
    description: "Embeddings, distances et voisins.",
    icon: "sparkles",
    color: "purple",
    lab: "vecteurs",
    skillPrefix: ["B10.13", "B10.14", "B10.15", "B10.16", "B10.17", "B10.18"],
  },
];
export const tpTracks = [
  {
    id: "cinema",
    title: "Cinéma",
    subtitle: "SQL avancé, fenêtres et classements",
    icon: "film",
    sourceId: "TP-L",
  },
  {
    id: "zoo",
    title: "Zoo",
    subtitle: "Contrôler les DF puis normaliser",
    icon: "leaf",
    sourceId: "TP-N",
  },
  {
    id: "index",
    title: "Index",
    subtitle: "Stockage, formulation SQL et plans MySQL",
    icon: "database",
    sourceId: "TP-I",
  },
  {
    id: "fulltext",
    title: "Full Text",
    subtitle: "Films, index et recherche MySQL",
    icon: "search",
    sourceId: "TP-FT",
  },
];
export const sources = curriculum.sources;
export const skills = curriculum.skills.filter((s) => s.kind === "skill");
export const lessonById = (id?: string) => lessons.find((l) => l.id === id);
export const exerciseById = (id?: string) => exercises.find((e) => e.id === id);
export const moduleLessons = (id: string) =>
  lessons.filter((l) => l.moduleId === id);
export const lessonExercises = (id: string) =>
  exercises.filter((e) => e.lessonId === id);
export function coverageIssues() {
  const issues: string[] = [],
    ids = new Set<string>();
  for (const lesson of lessons) {
    if (ids.has(lesson.id)) issues.push(`Leçon en double : ${lesson.id}`);
    ids.add(lesson.id);
  }
  const exerciseIds = new Set<string>();
  for (const e of exercises) {
    if (exerciseIds.has(e.id)) issues.push(`Exercice en double : ${e.id}`);
    exerciseIds.add(e.id);
    if (!lessonById(e.lessonId)) issues.push(`Leçon manquante pour ${e.id}`);
  }
  for (const item of [...lessons, ...exercises])
    for (const ref of item.sourceRefs) {
      const source = sources.find((s) => s.id === ref.sourceId);
      if (!source || ref.pages.some((p) => p > source.pages))
        issues.push(`Référence invalide : ${item.id} / ${ref.sourceId}`);
    }
  for (const row of curriculum.skills.filter((s) =>
    /^(LMD-C|DF-C|FN-C|PHY-C|IDX-C|AUT-C|FT-C|VEC-C|TP-|EX-)/.test(s.id),
  )) {
    const id = row.id.split(" — ")[0];
    if (!exerciseIds.has(id)) issues.push(`Exercice non couvert : ${id}`);
  }
  return issues;
}
