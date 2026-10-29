import { readFile } from "node:fs/promises";
import { describe, it, expect } from "vitest";
import { exercises, lessons, sources } from "../src/lib/catalog";
import { tokenize } from "../src/lib/calculations";
const movies = JSON.parse(
  await readFile(
    new URL("../public/datasets/movies.json", import.meta.url),
    "utf8",
  ),
) as { n: string; title: string; overview: string; genres: string }[];
describe("teacher Full Text correction and supplied corpus", () => {
  it("references every original TP question and the new explanatory annexes", () => {
    expect(sources.find((s) => s.id === "SOL-FT")).toEqual({
      id: "SOL-FT",
      file: "3_TP_index_FT_sol.pdf",
      pages: 22,
    });
    const questions = exercises.filter(
      (e) => e.tpId === "fulltext" && !/^TP-FT-A\d+$/.test(e.id),
    );
    expect(questions).toHaveLength(26);
    for (const question of questions)
      expect(
        question.sourceRefs.some((r) => r.sourceId === "SOL-FT"),
        question.id,
      ).toBe(true);
    expect(lessons.some((l) => l.id === "texte-collations-tp")).toBe(true);
    expect(exercises.filter((e) => /^TP-FT-A\d+$/.test(e.id))).toHaveLength(4);
  });
  it("checks the original corpus counts instead of copying historical timings", () => {
    expect(movies).toHaveLength(1288);
    expect(
      movies.filter((m) => m.genres.toLowerCase().includes("comedy")),
    ).toHaveLength(463);
    expect(
      movies.filter(
        (m) =>
          m.genres.toLowerCase().includes("comedy") &&
          m.overview.toLowerCase().includes("family"),
      ),
    ).toHaveLength(43);
    expect(
      movies.filter((m) => m.title.toLowerCase().includes("dream")),
    ).toHaveLength(5);
    expect(
      movies.filter((m) => m.title.toLowerCase().startsWith("the ")),
    ).toHaveLength(248);
    expect(movies.filter((m) => m.title.includes("Dream"))).toHaveLength(5);
  });
  it("corrects the reversed 48/53 comments with actual genre members and order", () => {
    const declared = [
      "Action",
      "Adventure",
      "Animation",
      "Comedy",
      "Crime",
      "Documentary",
      "Drama",
      "Family",
      "Fantasy",
      "Foreign",
      "History",
      "Horror",
      "Music",
      "Mystery",
      "Romance",
      "Science Fiction",
      "Thriller",
      "TV Movie",
      "War",
      "Western",
    ];
    const raw = movies.filter((m) => /Action.*Crime/.test(m.genres));
    const members = movies.filter((m) => {
      const genres = m.genres.split(",").map((s) => s.trim());
      return genres.includes("Action") && genres.includes("Crime");
    });
    const canonical = movies.filter((m) =>
      /Action.*Crime/.test(
        declared
          .filter((g) =>
            m.genres
              .split(",")
              .map((s) => s.trim())
              .includes(g),
          )
          .join(","),
      ),
    );
    expect(raw).toHaveLength(48);
    expect(members).toHaveLength(53);
    expect(canonical).toHaveLength(53);
    expect(members.filter((m) => !raw.includes(m)).map((m) => m.n)).toEqual([
      "110",
      "182",
      "437",
      "539",
      "1018",
    ]);
  });
  it("identifies Two Deaths and follows the correction’s title field for fear", () => {
    const substring = movies.filter((m) =>
      m.title.toLowerCase().includes("death"),
    );
    const exact = substring.filter((m) =>
      tokenize(m.title, false).includes("death"),
    );
    expect(substring).toHaveLength(7);
    expect(exact).toHaveLength(6);
    expect(
      substring.filter((m) => !exact.includes(m)).map((m) => m.title),
    ).toEqual(["Two Deaths"]);
    expect(
      movies.filter((m) => /fear|panic|horror/i.test(m.title)),
    ).toHaveLength(7);
    const exercise = exercises.find((e) => e.id === "TP-FT-4.2.8")!;
    expect(exercise.solution).toContain("LOWER(title)");
    expect(exercise.solution).not.toContain("overview");
  });
  it("separates UTF-8 bytes from character counts in the supplied annex", () => {
    expect(new TextEncoder().encode("pingüino")).toHaveLength(9);
    expect([..."pingüino"]).toHaveLength(8);
    expect(new TextEncoder().encode("MySQL Character Set")).toHaveLength(19);
  });
});
