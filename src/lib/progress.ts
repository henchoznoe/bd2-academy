import { z } from "zod";
import { del, get, set } from "idb-keyval";
import curriculum from "../content/curriculum.json" with { type: "json" };
export const recordSchema = z.object({
  status: z.enum(["new", "learning", "review", "declared", "verified"]),
  attempts: z.number().int().nonnegative(),
  solutionSeen: z.boolean(),
  understood: z.boolean(),
  draft: z.string().max(100000),
  evidence: z.string().max(1000).optional(),
});
export type ProgressRecord = z.infer<typeof recordSchema>;
export const journalSchema = z.object({
  id: z.string(),
  skill: z.string().max(300),
  difficulty: z.string().max(10000),
  correction: z.string().max(10000),
  redo: z.string().max(1000),
  resolved: z.boolean(),
});
export const progressSchema = z.object({
  format: z.literal("bd2-academy"),
  version: z.literal(2),
  records: z.record(z.string(), recordSchema),
  journal: z.array(journalSchema).max(10000),
  lastLesson: z.string().nullable(),
});
export type Progress = z.infer<typeof progressSchema>;
export const blankRecord = (): ProgressRecord => ({
  status: "new",
  attempts: 0,
  solutionSeen: false,
  understood: false,
  draft: "",
});
export function initialProgress(): Progress {
  return {
    format: "bd2-academy",
    version: 2,
    records: {},
    journal: [],
    lastLesson: null,
  };
}
export function parseImport(text: string): Progress {
  if (text.length > 5_000_000)
    throw new Error("Fichier trop volumineux : maximum 5 Mo.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Ce fichier ne contient pas du JSON valide.");
  }
  const parsed = progressSchema.safeParse(raw);
  if (!parsed.success)
    throw new Error(
      "Format de progression incompatible ou champs invalides. Attendu : BD2 Academy, version 2.",
    );
  return parsed.data;
}
const key = "bd2-academy:progress:v2";
let writeQueue = Promise.resolve();
export async function loadProgress(): Promise<Progress> {
  const saved = await get(key);
  // Version 1 contained inherited personal data. Never migrate it into the shared course.
  await del("bd2-academy:progress:v1");
  return saved === undefined ? initialProgress() : progressSchema.parse(saved);
}
export function persistProgress(progress: Progress) {
  const snapshot = structuredClone(progress);
  const next = writeQueue.catch(() => undefined).then(() => set(key, snapshot));
  writeQueue = next;
  return next;
}
export function progressMarkdown(progress: Progress) {
  const lines = [
    "# Mes acquis — BD2 Academy",
    "",
    "Une réussite évaluée et une compréhension déclarée restent distinguées.",
    "",
    "## Compétences du programme",
    "",
  ];
  for (const skill of curriculum.skills.filter((s) => s.kind === "skill")) {
    const record = progress.records[skill.id];
    const verified = record?.status === "verified";
    lines.push(
      `- [${verified ? "x" : " "}] **${skill.id}** ${skill.description} — ${verified ? "Vérifié" : record?.status === "declared" ? "Compréhension déclarée" : record?.status === "review" ? "À reprendre" : "À apprendre"}`,
    );
  }
  lines.push("", "## Exercices", "");
  for (const [id, record] of Object.entries(progress.records).filter(
    ([id, record]) => !id.startsWith("B") && record.attempts,
  ))
    lines.push(
      `- [${record.status === "verified" ? "x" : " "}] ${id} — ${record.status}, ${record.attempts} tentative(s)${record.solutionSeen ? ", correction consultée" : ""}`,
    );
  lines.push("", "## Journal des difficultés", "");
  for (const entry of progress.journal)
    lines.push(
      `### ${entry.skill}${entry.resolved ? " — résolu" : ""}`,
      "",
      `Difficulté : ${entry.difficulty}`,
      "",
      `Correction comprise : ${entry.correction || "À compléter"}`,
      "",
      `À refaire : ${entry.redo}`,
      "",
    );
  return lines.join("\n");
}
export function downloadText(
  filename: string,
  text: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
