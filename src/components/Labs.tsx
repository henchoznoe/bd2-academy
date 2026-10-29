import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronRight, RotateCcw } from "lucide-react";
import {
  parseAttributes,
  parseFDs,
  closure,
  candidateKeys,
  minimalCover,
  equivalent,
  isMinimalCover,
  formatFD,
  normalForms,
  synthesize3NF,
  decomposeBCNF,
  projection,
  preservedDependencies,
  losslessBinary,
} from "../lib/relations";
import {
  storage,
  cacheCost,
  bitmapCombine,
  hashBuckets,
  textIndex,
  vectorMetrics,
} from "../lib/calculations";
import { BTree, BPlusTree } from "../lib/trees";
import type { TreeNode } from "../lib/trees";
const number = (value: number) =>
  new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 5 }).format(value);
function guarded<T>(
  fn: () => T,
): { value: T; error?: never } | { value?: never; error: string } {
  try {
    return { value: fn() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
function Field({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
function LabResult({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="lab-result">
      <span className="eyebrow">{label}</span>
      <div>{children}</div>
    </div>
  );
}
const titles: Record<string, [string, string]> = {
  df: [
    "Fermetures et clés",
    "Appliquer les DF pas à pas et vérifier une couverture équivalente.",
  ],
  normalisation: [
    "Normaliser sans perdre le sens",
    "Examiner les projections, les garanties et les dépendances perdues.",
  ],
  arbres: [
    "B-arbres et B+arbres",
    "Insérer, supprimer et chercher en observant les rééquilibrages.",
  ],
  physique: [
    "Blocs, tailles et coûts",
    "Faire varier les hypothèses et suivre les unités.",
  ],
  bitmaps: [
    "Bitmaps et hachage",
    "Combiner des ensembles et rendre les collisions visibles.",
  ],
  texte: [
    "Index inversé et TF-IDF",
    "Construire les termes, les listes de documents et les scores.",
  ],
  vecteurs: [
    "Vecteurs et voisins",
    "Comparer plusieurs mesures sur les mêmes points.",
  ],
};
export default function Labs() {
  const { id = "df" } = useParams();
  const info = titles[id];
  if (!info)
    return (
      <p>
        Atelier introuvable. <Link to="/ateliers/df">Ouvrir les ateliers</Link>
      </p>
    );
  return (
    <div className="page-enter">
      <div className="eyebrow">Le laboratoire</div>
      <h1>{info[0]}</h1>
      <p className="page-subtitle">{info[1]}</p>
      <div className="lab-tabs">
        {Object.entries(titles).map(([key, [title]]) => (
          <Link
            key={key}
            to={`/ateliers/${key}`}
            className={id === key ? "active" : ""}
          >
            {title.split(" et ")[0]}
          </Link>
        ))}
      </div>
      <p className="notice">
        Simulateur pédagogique déterministe. Les hypothèses sont explicites ;
        les résultats ne constituent pas des mesures d’un SGBD réel.
      </p>
      {id === "df" ? (
        <RelationsLab />
      ) : id === "normalisation" ? (
        <RelationsLab normalization />
      ) : id === "arbres" ? (
        <TreeLab />
      ) : id === "physique" ? (
        <StorageLab />
      ) : id === "bitmaps" ? (
        <BitmapLab />
      ) : id === "texte" ? (
        <TextLab />
      ) : (
        <VectorLab />
      )}
    </div>
  );
}
function RelationsLab({ normalization = false }: { normalization?: boolean }) {
  const [attributes, setAttributes] = useState("A B C D E"),
    [rules, setRules] = useState("A -> B C\nB -> D\nD -> E\nE -> A"),
    [seed, setSeed] = useState("A"),
    [answer, setAnswer] = useState(""),
    [feedback, setFeedback] = useState(""),
    [method, setMethod] = useState("3fn"),
    [first, setFirst] = useState("A B"),
    [second, setSecond] = useState("B C D E");
  const calculation = useMemo(
    () =>
      guarded(() => {
        const attrs = parseAttributes(attributes),
          fds = parseFDs(rules);
        if (
          !attrs.length ||
          fds.some((f) =>
            [...f.left, ...f.right].some((a) => !attrs.includes(a)),
          )
        )
          throw new Error("Déclarer tous les attributs utilisés dans R.");
        if (parseAttributes(seed).some((a) => !attrs.includes(a)))
          throw new Error("La source doit être incluse dans R.");
        return {
          attrs,
          fds,
          reached: closure(parseAttributes(seed), fds),
          keys: candidateKeys(attrs, fds),
          cover: minimalCover(fds),
          forms: normalization ? normalForms(attrs, fds) : undefined,
        };
      }),
    [attributes, rules, seed, normalization],
  );
  const value = calculation.value;
  const decomposition = useMemo(
    () =>
      value && normalization
        ? guarded(() => {
            const split =
              method === "3fn"
                ? {
                    relations: synthesize3NF(value.attrs, value.fds),
                    steps: [
                      "1. Calculer une couverture minimale G et toutes les clés.",
                      "2. Partitionner G par source identique.",
                      "3. Fusionner les groupes de sources équivalentes ; contrôler la 3FN sur les DF des morceaux.",
                      "4. Construire une relation avec les attributs de chaque groupe.",
                      "5. Éliminer les relations incluses dans une autre et y conserver les DF.",
                      "6. Ajouter une relation sur une clé si aucun morceau ne contient une clé du schéma initial.",
                    ],
                  }
                : decomposeBCNF(value.attrs, value.fds);
            return {
              ...split,
              lost: preservedDependencies(split.relations, value.fds),
              details: split.relations.map((r) => ({
                attrs: r,
                forms: normalForms(r, projection(r, value.fds)),
                projection: projection(r, value.fds),
              })),
            };
          })
        : undefined,
    [value, method, normalization],
  );
  function verify() {
    if (!value) return;
    const result = guarded(() => {
      const proposed = parseFDs(answer);
      if (
        proposed.some((f) =>
          [...f.left, ...f.right].some((x) => !value.attrs.includes(x)),
        )
      )
        throw new Error("La proposition utilise un attribut absent de R.");
      return {
        same: equivalent(value.fds, proposed),
        minimal: isMinimalCover(proposed),
      };
    });
    setFeedback(
      result.error ??
        (result.value.same
          ? result.value.minimal
            ? "Couverture équivalente et minimale. Une autre couverture aurait aussi pu être correcte."
            : "Ensemble équivalent, mais non minimal : vérifier cibles, attributs superflus et DF redondantes."
          : "Les ensembles ne sont pas équivalents. Tester chaque DF dans les deux sens."),
    );
  }
  return (
    <>
      <div className="lab-grid">
        <section className="panel">
          <h2>Définir le schéma</h2>
          <Field
            label="Attributs de R (séparés par des espaces)"
            value={attributes}
            onChange={setAttributes}
          />
          <Field
            label="Dépendances fonctionnelles (une par ligne)"
            value={rules}
            onChange={setRules}
            rows={6}
          />
          <Field
            label="Source dont on cherche la fermeture"
            value={seed}
            onChange={setSeed}
          />
          <p className="fine-print">
            La fermeture suppose les DF valides dans toutes les instances
            légales. Elle ne les déduit pas d’un échantillon de données. Clés :
            au plus 12 attributs ; projections : au plus 8.
          </p>
        </section>
        <section className="panel">
          <h2>Voir le raisonnement</h2>
          {calculation.error ? (
            <p role="alert" className="feedback error">
              {calculation.error}
            </p>
          ) : (
            value && (
              <>
                <LabResult label="Fermeture">
                  ({seed || "∅"})⁺ ={" "}
                  {value.reached.attributes.join(", ") || "∅"}
                </LabResult>
                <ol className="trace">
                  {value.reached.steps.map((step, i) => (
                    <li key={i}>
                      <code>{formatFD(step.rule)}</code>
                      <span>
                        ajoute {step.added.join(", ")} →{" "}
                        {step.result.join(", ")}
                      </span>
                    </li>
                  ))}
                </ol>
                {!value.reached.steps.length && (
                  <p>Aucune DF n’ajoute d’attribut.</p>
                )}
                <LabResult label="Toutes les clés candidates">
                  {value.keys
                    .map((k) => `(${k.join(", ") || "∅"})`)
                    .join(" · ")}
                </LabResult>
                <p className="fine-print">
                  Énumération exhaustive par taille croissante ; toute extension
                  d’une clé déjà trouvée est éliminée.
                </p>
              </>
            )
          )}
        </section>
      </div>
      {value && !normalization && (
        <div className="lab-grid">
          <section className="panel">
            <h2>Une couverture minimale possible</h2>
            <ol className="trace">
              {value.cover.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <pre>{value.cover.fds.map(formatFD).join("\n") || "∅"}</pre>
            <p>
              La couverture n’est pas nécessairement unique. Le résultat est
              déterministe pour cet ordre des DF.
            </p>
          </section>
          <section className="panel">
            <h2>Tester votre propre couverture</h2>
            <Field
              label="Votre proposition (cibles simples)"
              value={answer}
              onChange={setAnswer}
              rows={6}
            />
            <button className="button primary" onClick={verify}>
              Vérifier l’équivalence et la minimalité
            </button>
            <p aria-live="polite" className="mt-4">
              {feedback}
            </p>
          </section>
        </div>
      )}
      {value && normalization && (
        <>
          <section className="panel">
            <h2>Diagnostic, sous l’hypothèse 1FN</h2>
            <div className="metric-grid">
              {[
                ["2FN", value.forms?.second],
                ["3FN", value.forms?.third],
                ["BCNF", value.forms?.bcnf],
              ].map(([name, ok]) => (
                <LabResult key={String(name)} label={String(name)}>
                  {ok ? "Respectée" : "Violation détectée"}
                </LabResult>
              ))}
            </div>
            <p>
              Attributs clés (aussi appelés premiers) :{" "}
              {value.forms?.prime.join(", ") || "aucun"}. Les attributs d’une
              clé candidate quelconque sont premiers.
            </p>
            {value.forms?.bcnfViolations.map((f, i) => (
              <p key={i}>
                <code>{formatFD(f)}</code> : source non superclé
                {value.forms?.thirdViolations.some(
                  (v) => formatFD(v) === formatFD(f),
                )
                  ? " et cible non clé, donc violation de la 3FN."
                  : ", mais cible appartenant à une clé possible en 3FN."}
              </p>
            ))}
            <label className="field">
              <span>Méthode de décomposition</span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="3fn">Synthèse 3FN</option>
                <option value="bcnf">Décomposition BCNF</option>
              </select>
            </label>
            {decomposition?.error ? (
              <p>{decomposition.error}</p>
            ) : (
              decomposition?.value && (
                <>
                  <ol className="trace">
                    {decomposition.value.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  <div className="relation-cards">
                    {decomposition.value.details.map((relation, i) => (
                      <div key={i}>
                        <strong>
                          R{i + 1}({relation.attrs.join(", ")})
                        </strong>
                        <p>
                          Clés :{" "}
                          {relation.forms.keys
                            .map((k) => `(${k.join(",") || "∅"})`)
                            .join(", ")}
                        </p>
                        <p>
                          {relation.forms.bcnf
                            ? "BCNF"
                            : relation.forms.third
                              ? "3FN"
                              : "Attention : 3FN non respectée"}
                        </p>
                        <pre>
                          {relation.projection.map(formatFD).join("\n") ||
                            "Aucune DF non triviale"}
                        </pre>
                      </div>
                    ))}
                  </div>
                  <p className="feedback success">
                    Cette construction conserve le contenu : synthèse 3FN avec
                    relation contenant une clé, ou décompositions binaires selon
                    Heath.
                  </p>
                  <p
                    className={`feedback ${decomposition.value.lost.length ? "" : "success"}`}
                  >
                    {decomposition.value.lost.length
                      ? `DF non préservées par les projections : ${decomposition.value.lost.map(formatFD).join(" ; ")}`
                      : "Toutes les DF fournies sont préservées par les contraintes projetées."}
                  </p>
                </>
              )
            )}
          </section>
          <section className="panel">
            <h2>Tester une décomposition binaire</h2>
            <div className="lab-grid">
              <Field label="R1" value={first} onChange={setFirst} />
              <Field label="R2" value={second} onChange={setSecond} />
            </div>
            <p className="notice">
              {losslessBinary(
                value.attrs,
                parseAttributes(first),
                parseAttributes(second),
                value.fds,
              )
                ? "Sans perte : l’intersection détermine au moins une des deux relations et leur union couvre exactement R."
                : "Garantie sans perte non satisfaite : vérifier la couverture de R et les deux implications du théorème de Heath."}
            </p>
          </section>
          <section className="panel">
            <h2>Passer à la 4FN</h2>
            <p>
              Exemple avec règle métier annoncée : pour une personne, langues et
              loisirs sont indépendants. La DM Personne ↠ Langue impose toutes
              les combinaisons langue/loisir pour cette personne.
            </p>
            <pre>
              R(Personne, Langue, Loisir)\n→ R1(Personne, Langue) + R2(Personne,
              Loisir)
            </pre>
            <p>
              La décomposition est sans perte sous cette DM. Sans DF non
              triviale, le schéma initial peut être BCNF ; la source Personne
              n’étant pas superclé, cette DM non triviale viole la 4FN. Un petit
              échantillon de lignes ne prouve pas une indépendance métier.
            </p>
          </section>
        </>
      )}
    </>
  );
}
function TreeDiagram({
  node,
  path = [],
}: {
  node: TreeNode;
  path?: TreeNode[];
}) {
  return (
    <div className="tree-branch">
      <div
        className={`tree-node ${node.leaf ? "leaf" : ""} ${path.includes(node) ? "visited" : ""}`}
      >
        <span className="tree-node-type">
          {node.leaf ? "feuille" : "nœud interne"}
        </span>
        <div>
          {node.keys.length ? (
            node.keys.map((key, i) => <span key={i}>{key}</span>)
          ) : (
            <span>∅</span>
          )}
        </div>
      </div>
      {node.children.length > 0 && (
        <div className="tree-children">
          {node.children.map((child, i) => (
            <TreeDiagram key={i} node={child} path={path} />
          ))}
        </div>
      )}
    </div>
  );
}
function TreeLab() {
  const [kind, setKind] = useState("bplus"),
    [operations, setOperations] = useState<
      { type: "insert" | "delete"; key: number }[]
    >([]),
    [position, setPosition] = useState(0),
    [input, setInput] = useState("24"),
    [search, setSearch] = useState<number>(),
    [error, setError] = useState("");
  const tree = useMemo(() => {
    const instance = kind === "bplus" ? new BPlusTree() : new BTree();
    [10, 20, 5, 6, 12, 30, 7, 17, 3, 4, 25, 28].forEach((k) =>
      instance.insert(k),
    );
    instance.events = ["Arbre initial construit."];
    operations.slice(0, position).forEach((op) => instance[op.type](op.key));
    return instance;
  }, [kind, operations, position]);
  const found = search === undefined ? undefined : tree.search(search);
  function operate(type: "insert" | "delete" | "search") {
    const key = Number(input);
    if (!input.trim() || !Number.isSafeInteger(key)) {
      setError("Saisir une clé entière.");
      return;
    }
    setError("");
    if (type === "search") {
      setSearch(key);
      return;
    }
    if (operations.length >= 100) {
      setError("Limiter l’historique à 100 opérations puis réinitialiser.");
      return;
    }
    const next = [...operations.slice(0, position), { type, key }];
    setOperations(next);
    setPosition(next.length);
    setSearch(undefined);
  }
  return (
    <>
      <section className="panel">
        <div className="flex flex-wrap items-end gap-3">
          <label className="field">
            <span>Structure</span>
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="bplus">B+arbre</option>
              <option value="btree">B-arbre</option>
            </select>
          </label>
          <Field label="Clé" value={input} onChange={setInput} />
          <button className="button primary" onClick={() => operate("insert")}>
            Insérer
          </button>
          <button className="button" onClick={() => operate("delete")}>
            Supprimer
          </button>
          <button className="button" onClick={() => operate("search")}>
            Chercher
          </button>
          <button
            className="button ghost"
            onClick={() => {
              setOperations([]);
              setPosition(0);
              setSearch(undefined);
            }}
          >
            <RotateCcw size={15} />
            Réinitialiser
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
        <p className="fine-print">
          Convention du cours : ordre d = 2, au plus 2d = 4 clés et 2d+1 = 5
          enfants par nœud interne.{" "}
          {kind === "bplus"
            ? "Feuille : d à 2d entrées hors racine ; séparateur = borne supérieure du fils gauche, comme dans la figure du cours. Les données/RID restent dans les feuilles."
            : "Entre d et 2d clés par nœud hors racine. Une clé interne contient aussi une entrée de données."}{" "}
          Une clé existe une seule fois ; les doublons sont ignorés.
        </p>
        <div
          className="tree-canvas"
          tabIndex={0}
          role="region"
          aria-label="Arbre interactif"
        >
          <TreeDiagram node={tree.root} path={found?.path} />
        </div>
        {tree instanceof BPlusTree && (
          <div className="leaf-chain">
            <span className="eyebrow">Chaînage des feuilles</span>
            {tree.leaves().map((leaf, i) => (
              <span key={i}>
                [{leaf.join(" · ")}]{i < tree.leaves().length - 1 ? " → " : ""}
              </span>
            ))}
          </div>
        )}
        <div aria-live="polite">
          {found && (
            <p className="feedback">
              {found.found ? "Clé trouvée" : "Clé absente"} ·{" "}
              {found.path.length} bloc(s) d’index visités, cache vide. Pour un
              index non recouvrant, ajouter les blocs de données nécessaires.
            </p>
          )}
        </div>
        <ol className="trace">
          {tree.events.map((event, i) => (
            <li key={i}>{event}</li>
          ))}
        </ol>
        <div className="flex items-center justify-between gap-3">
          <button
            className="button"
            disabled={position === 0}
            onClick={() => {
              setPosition(position - 1);
              setSearch(undefined);
            }}
          >
            <ArrowLeft size={15} />
            Étape précédente
          </button>
          <span>
            {position} / {operations.length}
          </span>
          <button
            className="button"
            disabled={position === operations.length}
            onClick={() => {
              setPosition(position + 1);
              setSearch(undefined);
            }}
          >
            Étape suivante
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
      <div className="panel">
        <h2>À observer</h2>
        <p>
          Insérer plusieurs clés pour remplir une feuille, puis supprimer
          jusqu’à provoquer une redistribution ou une fusion. Le B-arbre fait
          monter une médiane ; le B+arbre conserve la clé de données dans la
          feuille et copie un séparateur. Tous les chemins vers les feuilles ont
          la même longueur.
        </p>
        <p>
          Les E/S ci-dessus comptent des blocs visités dans un modèle à cache
          vide. Elles ne mesurent ni le temps MySQL ni les écritures de journal.
        </p>
      </div>
    </>
  );
}
function StorageLab() {
  const [input, setInput] = useState({
      count: 1000000,
      block: 4096,
      record: 100,
      key: 20,
      pointer: 8,
      header: 0,
      fill: 1,
    }),
    [logical, setLogical] = useState(10000),
    [ratio, setRatio] = useState(0.92),
    [physical, setPhysical] = useState(10),
    [memory, setMemory] = useState(0.001);
  const result = guarded(() => storage(input)),
    cost = guarded(() => cacheCost(logical, ratio, physical, memory));
  const labels: Record<keyof typeof input, string> = {
    count: "Nombre de lignes N",
    block: "Bloc B (octets)",
    record: "Enregistrement R (octets)",
    key: "Clé K (octets)",
    pointer: "Pointeur P (octets)",
    header: "En-tête H (octets)",
    fill: "Remplissage des feuilles (0 à 1)",
  };
  return (
    <>
      <div className="lab-grid">
        <section className="panel">
          <h2>Paramètres physiques</h2>
          {Object.entries(input).map(([key, value]) => (
            <label className="field" key={key}>
              <span>{labels[key as keyof typeof input]}</span>
              <input
                type="number"
                min={
                  key === "header" || key === "count"
                    ? 0
                    : key === "fill"
                      ? 0.01
                      : 1
                }
                max={key === "fill" ? 1 : undefined}
                step={key === "fill" ? 0.05 : 1}
                value={value}
                onChange={(e) =>
                  setInput({ ...input, [key]: Number(e.target.value) })
                }
              />
            </label>
          ))}
        </section>
        <section className="panel">
          <h2>Calculs et unités</h2>
          {result.error ? (
            <p className="feedback error">{result.error}</p>
          ) : (
            result.value && (
              <>
                <LabResult label="Lignes / bloc">
                  ⌊(B − H) / R⌋ = {number(result.value.recordsPerBlock)}
                </LabResult>
                <LabResult label="Table">
                  {number(result.value.dataBlocks)} blocs ={" "}
                  {number(result.value.dataBytes)} octets
                </LabResult>
                <LabResult label="Capacité d’une feuille">
                  ⌊(B − H − P) / (K + P)⌋ = {number(result.value.leafCapacity)}{" "}
                  entrées ; {result.value.occupied} occupées
                </LabResult>
                <LabResult label="Nombre maximal de fils (fanout)">
                  ⌊(B − H + K) / (K + P)⌋ = {result.value.fanout} enfants
                </LabResult>
                <LabResult label="Index dense">
                  {result.value.height} niveau(x) ·{" "}
                  {number(result.value.indexBlocks)} blocs ·{" "}
                  {number(result.value.indexBytes)} octets
                </LabResult>
                <p>
                  Du sommet aux feuilles :{" "}
                  {[...result.value.levels].reverse().join(" → ")} bloc(s).
                </p>
              </>
            )
          )}
          <p className="fine-print">
            Modèle : enregistrements non fragmentés, table pleine, un pointeur
            de chaînage par feuille, m pointeurs et m−1 clés par nœud interne.
            Densité appliquée au nombre maximal d’entrées des feuilles ; nœuds
            internes pleins. Les frais non renseignés sont ignorés. Une hauteur
            en remplissage maximal n’est pas une hauteur maximale garantie.
          </p>
        </section>
      </div>
      <section className="panel">
        <h2>Cache et coût attendu</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Lectures logiques", logical, setLogical],
            ["Hit ratio (0 à 1)", ratio, setRatio],
            ["Accès disque (ms)", physical, setPhysical],
            ["Recherche RAM (ms)", memory, setMemory],
          ].map(([label, value, change]) => (
            <label className="field" key={String(label)}>
              <span>{String(label)}</span>
              <input
                type="number"
                step="any"
                value={Number(value)}
                onChange={(e) =>
                  (change as (v: number) => void)(Number(e.target.value))
                }
              />
            </label>
          ))}
        </div>
        {cost.error ? (
          <p>{cost.error}</p>
        ) : (
          cost.value && (
            <div className="metric-grid">
              <LabResult label="Succès RAM attendus">
                {number(cost.value.hits)}
              </LabResult>
              <LabResult label="Lectures physiques attendues">
                {number(cost.value.physical)}
              </LabResult>
              <LabResult label="Coût du modèle">
                {number(cost.value.milliseconds)} ms
              </LabResult>
            </div>
          )
        )}
        <p className="fine-print">
          Chaque lecture logique paie le coût de recherche RAM ; les défauts
          ajoutent un accès disque. Ce modèle est un coût attendu simplifié,
          sans parallélisme ni écritures.
        </p>
      </section>
      <IndexPlanLab />
    </>
  );
}
function IndexPlanLab() {
  const [scenario, setScenario] = useState("date");
  const cases: Record<
    string,
    {
      before: string;
      after: string;
      index: string;
      explanation: string;
      plan: string;
    }
  > = {
    date: {
      before:
        "SELECT * FROM orders WHERE MONTH(date_order)=3 AND YEAR(date_order)=2024;",
      after:
        "SELECT * FROM orders WHERE date_order >= DATE '2024-03-01' AND date_order < DATE '2024-04-01';",
      index: "CREATE INDEX ix_date ON orders(date_order);",
      explanation:
        "L’intervalle demi-ouvert évite la fonction sur la colonne indexée et couvre toutes les heures si le type devient un timestamp. Un accès range devient possible ; le choix réel dépend de la sélectivité et des statistiques.",
      plan: "type: range possible ; key: ix_date si retenu ; lignes estimées dépendantes des statistiques.",
    },
    cover: {
      before: "SELECT * FROM customers WHERE country = 'country_1';",
      after: "SELECT country, name FROM customers WHERE country = 'country_1';",
      index: "CREATE INDEX ix_country_name ON customers(country,name);",
      explanation:
        "Le second SELECT est recouvert par les colonnes de l’index. Les colonnes restantes de SELECT * peuvent nécessiter l’accès aux lignes. Le préfixe country sert à la recherche.",
      plan: "type: ref possible ; key: ix_country_name ; Extra: Using index possible pour la projection recouverte.",
    },
    suffix: {
      before: "SELECT id FROM customers WHERE name LIKE '%2';",
      after: "SELECT id FROM customers WHERE REVERSE(name) LIKE '2%';",
      index:
        "-- MySQL compatible : colonne générée indexée, ou index fonctionnel adapté à la version.",
      explanation:
        "Un préfixe inversé peut exploiter un index sur l’expression inversée. Un index ordinaire sur name ne transforme pas le suffixe en intervalle contigu. Vérifier expression, collation et version.",
      plan: "Index ordinaire name : balayage probable. Index sur expression inversée : range possible.",
    },
  };
  const current = cases[scenario];
  return (
    <section className="panel">
      <h2>Lire un choix d’index</h2>
      <label className="field">
        <span>Scénario MySQL/InnoDB</span>
        <select value={scenario} onChange={(e) => setScenario(e.target.value)}>
          <option value="date">Filtrer un mois</option>
          <option value="cover">Recouvrir la projection</option>
          <option value="suffix">Chercher un suffixe</option>
        </select>
      </label>
      <p className="notice">
        Scénarios illustratifs, sans plan ni mesure produits par MySQL dans le
        navigateur. Le TP décrit ses données et ses propres observations.
      </p>
      <div className="lab-grid">
        <div>
          <h3>Formulation initiale</h3>
          <pre>{current.before}</pre>
        </div>
        <div>
          <h3>Formulation à examiner</h3>
          <pre>{current.after}</pre>
        </div>
      </div>
      <pre>{current.index}</pre>
      <p>{current.explanation}</p>
      <p className="feedback">Lecture d’un plan possible : {current.plan}</p>
      <Link className="text-link" to="/tp/index">
        Reprendre les sous-questions du TP index
        <ChevronRight size={14} />
      </Link>
    </section>
  );
}
function BitmapLab() {
  const [first, setFirst] = useState([
      true,
      false,
      true,
      true,
      false,
      false,
      true,
      false,
    ]),
    [second, setSecond] = useState([
      false,
      true,
      true,
      false,
      true,
      false,
      true,
      false,
    ]),
    [operation, setOperation] = useState<"AND" | "OR" | "XOR" | "NOT">("AND"),
    [values, setValues] = useState("2, 7, 12, 4, 9, 14, 3"),
    [bucketCount, setBucketCount] = useState(5);
  const combined = bitmapCombine(first, second, operation),
    hashed = guarded(() => {
      const parsed = values
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map(Number);
      if (parsed.some((x) => !Number.isSafeInteger(x)))
        throw new Error("Utiliser des clés entières.");
      if (bucketCount > 30)
        throw new Error("Maximum 30 seaux pour cet affichage.");
      return hashBuckets(parsed, bucketCount);
    });
  return (
    <>
      <section className="panel">
        <h2>Opérations sur les bitmaps</h2>
        <p>
          Les positions correspondent aux mêmes huit lignes de table. Cliquez
          sur un bit pour modifier l’appartenance au filtre.
        </p>
        {[
          [first, setFirst, "Filtre A"],
          [second, setSecond, "Filtre B"],
        ].map(([bits, setter, label]) => (
          <div className="bitmap-row" key={String(label)}>
            <strong>{String(label)}</strong>
            {(bits as boolean[]).map((bit, i) => (
              <button
                key={i}
                className={`bit ${bit ? "on" : ""}`}
                aria-label={`${label}, ligne ${i + 1}, ${bit ? 1 : 0}`}
                aria-pressed={bit}
                onClick={() =>
                  (setter as (v: boolean[]) => void)(
                    (bits as boolean[]).map((b, j) => (i === j ? !b : b)),
                  )
                }
              >
                {bit ? 1 : 0}
              </button>
            ))}
          </div>
        ))}
        <label className="field">
          <span>Combinaison</span>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value as typeof operation)}
          >
            {["AND", "OR", "XOR", "NOT"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <div className="bitmap-row">
          <strong>Résultat</strong>
          {combined.map((b, i) => (
            <span className={`bit ${b ? "on" : ""}`} key={i}>
              {b ? 1 : 0}
            </span>
          ))}
        </div>
        <p>
          Lignes sélectionnées :{" "}
          {combined.flatMap((b, i) => (b ? [i + 1] : [])).join(", ") ||
            "aucune"}
          . NOT porte sur A, dans cet univers de huit lignes.
        </p>
        <p className="fine-print">
          Un bitmap peut combiner efficacement des filtres. Les coûts
          d’écriture, la cardinalité, la compression et les verrous dépendent de
          la structure et du SGBD.
        </p>
      </section>
      <section className="panel">
        <h2>Collisions par hachage</h2>
        <Field label="Clés entières" value={values} onChange={setValues} />
        <label className="field">
          <span>Nombre de seaux m</span>
          <input
            type="number"
            min={1}
            max={30}
            value={bucketCount}
            onChange={(e) => setBucketCount(Number(e.target.value))}
          />
        </label>
        <p>
          Fonction annoncée : h(k) = k modulo m, ramené à une position positive.
          Collisions résolues par chaînage.
        </p>
        {hashed.error ? (
          <p>{hashed.error}</p>
        ) : (
          hashed.value?.map((bucket, i) => (
            <div className="hash-bucket" key={i}>
              <strong>Seau {i}</strong>
              <span>{bucket.join(" → ") || "vide"}</span>
              {bucket.length > 1 && (
                <small>{bucket.length - 1} collision(s)</small>
              )}
            </div>
          ))
        )}
        <p className="fine-print">
          Des clés différentes peuvent partager un seau. Ce regroupement ne les
          rend pas égales. Une recherche par intervalle n’est pas aidée par
          l’ordre des seaux.
        </p>
      </section>
    </>
  );
}
function TextLab() {
  const [documents, setDocuments] = useState(
      "Le chat aime la maison\nLe chien garde la maison\nUn chat et un chien jouent",
    ),
    [query, setQuery] = useState("chat maison"),
    [stops, setStops] = useState(true),
    [accents, setAccents] = useState(true);
  const docs = documents
      .split("\n")
      .filter((x) => x.trim())
      .slice(0, 12),
    index = textIndex(docs, query, stops, accents);
  return (
    <>
      <div className="lab-grid">
        <section className="panel">
          <h2>Un corpus miniature</h2>
          <Field
            label="Un document par ligne (12 au maximum)"
            value={documents}
            onChange={setDocuments}
            rows={7}
          />
          <Field label="Requête" value={query} onChange={setQuery} />
          <label className="check-row">
            <input
              type="checkbox"
              checked={stops}
              onChange={(e) => setStops(e.target.checked)}
            />
            Retirer une petite liste de stopwords annoncée
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={accents}
              onChange={(e) => setAccents(e.target.checked)}
            />
            Neutraliser les accents
          </label>
          <p className="fine-print">
            Liste : le, la, les, un, une, des, de, du, et, en, a, au, aux, the,
            an, of, and, is, to. Découpage Unicode en lettres/chiffres ; pas de
            stemming. Ce prétraitement pédagogique diffère des parseurs MySQL.
          </p>
        </section>
        <section className="panel">
          <h2>Tokens et scores</h2>
          {index.tokens.map((tokens, i) => (
            <div className="token-document" key={i}>
              <strong>D{i + 1}</strong>
              <span>{tokens.join(" · ") || "aucun token"}</span>
              <b>
                cos ={" "}
                {index.scores[i] === null
                  ? "indéfini (norme nulle)"
                  : number(index.scores[i]!)}
              </b>
            </div>
          ))}
          <p className="notice">
            Conventions : TF normalisé = occurrences / nombre de termes du
            document ; IDF = log₁₀(N/df) ; poids = TF × IDF. Le cours écrit log
            ; la base 10 est ici annoncée. Le cosinus normalise les normes. Un
            terme absent du vocabulaire n’a pas de coordonnée ; un vecteur nul
            rend le cosinus indéfini.
          </p>
        </section>
      </div>
      <section className="panel">
        <h2>Index inversé et calculs</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Terme</th>
                <th>Documents</th>
                <th>df</th>
                <th>IDF</th>
                {docs.map((_, i) => (
                  <th key={i}>D{i + 1} : TF normalisé → poids</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {index.vocabulary.map((term, i) => (
                <tr key={term}>
                  <td>{term}</td>
                  <td>{index.postings[i].documents.join(", ")}</td>
                  <td>{index.df[i]}</td>
                  <td>{number(index.idf[i])}</td>
                  {docs.map((_, j) => (
                    <td key={j}>
                      {number(index.tfs[j][i])} → {number(index.vectors[j][i])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine-print">
          Ces poids ne sont pas les scores retournés par InnoDB. Pour un mot
          dans le modèle illustré au cours, le ranking fait intervenir TF × IDF²
          ; les modes, l’index et les paramètres du moteur influencent les
          résultats réels.
        </p>
      </section>
    </>
  );
}
function VectorLab() {
  const [query, setQuery] = useState("1, 1"),
    [points, setPoints] = useState(
      "Chat : 1, 0.8\nChien : 0.8, 1.2\nVoiture : -1, 0\nMaison : 0, 2",
    ),
    [metric, setMetric] = useState("l2");
  const result = guarded(() => {
    const vector = query
      .split(/[\s,;]+/)
      .filter(Boolean)
      .map(Number);
    const parsed = points
      .split("\n")
      .filter((x) => x.trim())
      .slice(0, 15)
      .map((line, i) => {
        const split = line.split(":");
        const values = (split.length > 1 ? split[1] : split[0])
          .trim()
          .split(/[\s,;]+/)
          .filter(Boolean)
          .map(Number);
        return {
          name: split.length > 1 ? split[0] : `Point ${i + 1}`,
          values,
          ...vectorMetrics(vector, values),
        };
      });
    return {
      vector,
      points: parsed.sort((a, b) => {
        const x = a[metric as "l2" | "l1" | "dot" | "cosine"],
          y = b[metric as "l2" | "l1" | "dot" | "cosine"];
        return x === null
          ? 1
          : y === null
            ? -1
            : metric === "dot" || metric === "cosine"
              ? y - x
              : x - y;
      }),
    };
  });
  const value = result.value;
  const extent = value
    ? Math.max(
        2,
        ...value.points.flatMap((p) => p.values.slice(0, 2).map(Math.abs)),
        ...value.vector.slice(0, 2).map(Math.abs),
      ) * 1.2
    : 2;
  const coordinate = (v: number) => 180 + (v / extent) * 145;
  return (
    <>
      <div className="lab-grid">
        <section className="panel">
          <h2>Choisir les vecteurs</h2>
          <Field label="Vecteur de requête" value={query} onChange={setQuery} />
          <Field
            label="Un nom : coordonnées par ligne"
            value={points}
            onChange={setPoints}
            rows={7}
          />
          <label className="field">
            <span>Classer par</span>
            <select value={metric} onChange={(e) => setMetric(e.target.value)}>
              <option value="l2">Distance euclidienne croissante</option>
              <option value="cosine">Similarité cosinus décroissante</option>
              <option value="dot">Produit scalaire décroissant</option>
            </select>
          </label>
          <p className="fine-print">
            Vecteurs choisis pour visualiser la géométrie ; ce ne sont pas des
            embeddings générés par un modèle. Stocker un VECTOR ne produit pas
            son embedding et ne construit pas automatiquement un index ANN.
          </p>
        </section>
        <section className="panel">
          <h2>Voir la proximité</h2>
          {result.error ? (
            <p className="feedback error">{result.error}</p>
          ) : (
            value && (
              <>
                <svg
                  viewBox="0 0 360 360"
                  className="vector-plot"
                  role="img"
                  aria-label="Projection des vecteurs sur leurs deux premières coordonnées"
                >
                  <line x1="15" y1="180" x2="345" y2="180" stroke="#cbd5e1" />
                  <line x1="180" y1="15" x2="180" y2="345" stroke="#cbd5e1" />
                  {value.points.map((p) => (
                    <g key={p.name}>
                      <line
                        x1="180"
                        y1="180"
                        x2={coordinate(p.values[0])}
                        y2={360 - coordinate(p.values[1] ?? 0)}
                        stroke="#c7d2fe"
                      />
                      <circle
                        cx={coordinate(p.values[0])}
                        cy={360 - coordinate(p.values[1] ?? 0)}
                        r="6"
                        fill="#6366f1"
                      />
                      <text
                        x={coordinate(p.values[0]) + 9}
                        y={360 - coordinate(p.values[1] ?? 0) - 9}
                        fontSize="11"
                        fill="#475569"
                      >
                        {p.name}
                      </text>
                    </g>
                  ))}
                  <circle
                    cx={coordinate(value.vector[0])}
                    cy={360 - coordinate(value.vector[1] ?? 0)}
                    r="8"
                    fill="#f59e0b"
                  />
                  <text
                    x={coordinate(value.vector[0]) + 10}
                    y={360 - coordinate(value.vector[1] ?? 0) + 15}
                    fontSize="11"
                  >
                    Requête
                  </text>
                </svg>
                <p className="fine-print">
                  Projection sur deux coordonnées ; les mesures utilisent toutes
                  les dimensions. Les vecteurs nuls ont un cosinus indéfini.
                </p>
              </>
            )
          )}
        </section>
      </div>
      {value && (
        <section className="panel">
          <h2>Voisins par {metric}</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Voisin</th>
                  <th>L2</th>
                  <th>Cosinus</th>
                  <th>1 − cosinus</th>
                  <th>Produit scalaire</th>
                </tr>
              </thead>
              <tbody>
                {value.points.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    {[p.l2, p.cosine, p.cosineDistance, p.dot].map((v, i) => (
                      <td key={i}>{v === null ? "indéfini" : number(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="notice">
            Une distance se minimise ; une similarité se maximise. Le produit
            scalaire dépend des normes. Sur vecteurs normalisés, maximiser le
            cosinus et minimiser la distance euclidienne donnent le même ordre.
            Ce laboratoire calcule des voisins exacts ; un index ANN échange une
            partie du rappel contre un coût réduit.
          </p>
        </section>
      )}
    </>
  );
}
