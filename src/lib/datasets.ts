export type Dataset = {
  id: string;
  title: string;
  description: string;
  provenance: string;
  schema: string;
  tables: string[];
};
export const datasets: Dataset[] = [
  {
    id: "course",
    title: "Exemples du cours",
    description: "Petites tables indépendantes couvrant les exemples SQL.",
    provenance:
      "Données choisies pour l’entraînement : NULL, zéro, bornes, ex æquo, groupes absents et cycle de graphe.",
    schema:
      "emp(e_id, ename, deptno, taux, salaire, commission)\ndept(deptno, dname)\ncommande(order_id, category_name, status, order_value, namecli)\nbudgets(dept_id, anneeCourante, budgetCourant, budgetPrec)\nproduit(nom, prix)\nsalaires(id, salaire, idDep)\nt(compte, id, val)\nvente(id, annee, mois, prix)\nventeAnim(animal, lieu, qte)\npersonne(id, age)\nanimal(id, proprioId, age)\nvol(compagnie, ville_dep, ville_arr)\ntable_dest(id, txt), table_source(id, txt)",
    tables: [
      "emp",
      "dept",
      "commande",
      "budgets",
      "produit",
      "salaires",
      "t",
      "vente",
      "venteAnim",
      "personne",
      "animal",
      "vol",
      "table_dest",
      "table_source",
    ],
  },
  {
    id: "cinema",
    title: "Cinéma — reconstitution pédagogique",
    description:
      "12 films et des séances réparties sur plusieurs jours, mois et années.",
    provenance:
      "Schéma du TP conservé. Données choisies ; les 40 films et 1398 séances du jeu Oracle original ne sont pas disponibles.",
    schema:
      "T_FILM_FLM(FLM_ID PK, FLM_TITRE, FLM_REALISATEUR, FLM_DUREE_MN, FLM_ANNEE, FLM_GENRE)\nT_SEANCE_SNC(SNC_ID PK, FLM_ID FK, SNC_DATE DATE, SNC_HEURE TIMESTAMP, SNC_BILLET, SNC_TARIF)",
    tables: ["T_FILM_FLM", "T_SEANCE_SNC"],
  },
  {
    id: "zoo",
    title: "Zoo — données pédagogiques",
    description:
      "Table initiale et tables normalisées, permettant de comparer les deux schémas.",
    provenance:
      "Données choisies. Les règles métier viennent du TP ; les anomalies peuvent être introduites par un UPDATE avant un contrôle.",
    schema:
      "zoo(animal, nom, annee_naissance, espece, gardien, prenom, salaire, classe, origine, emplacement, surface, type_empl, libelle_empl)\nanimal(animal, nom, annee_naissance, espece, emplacement)\nespece(espece, origine, classe)\ngardien(gardien, prenom, salaire)\nemplacement(emplacement, surface, type_empl, gardien)\ntype_empl(type_empl, libelle_empl)",
    tables: ["zoo", "animal", "espece", "gardien", "emplacement", "type_empl"],
  },
  {
    id: "index",
    title: "Commandes — extrait des données du TP",
    description:
      "100 clients, 100 vendeurs et 500 commandes tirés des scripts voisins du TP3.",
    provenance:
      "Extrait réduit des données synthétiques fournies dans le dossier TP3. Les tailles et plans MySQL du TP ne se reproduisent pas dans DuckDB.",
    schema:
      "customers(id, email, name, fname, country)\nsalesman(id, name, fname, category, country)\norders(id, customer_id, date_order, amount, salesman_id)\norders2(id, customer_id, date_order, amount, salesman_id, commentaires1, commentaires2, commentaires3, commentaires4)",
    tables: ["customers", "salesman", "orders", "orders2"],
  },
  {
    id: "movies",
    title: "Films — CSV du TP Full Text",
    description:
      "Les 1288 lignes du CSV metadata_prep_sample_v2.csv, disponibles dans le dossier voisin TP4.",
    provenance:
      "Métadonnées originales du TP, converties en JSON sans modification des textes. Les requêtes MATCH AGAINST et les collations MySQL restent guidées.",
    schema:
      "movie(n, adult, budget, genres, id, imdb_id, original_title, overview, poster_path, revenue, title, vote_average, vote_count, imdbURL, tmdbURL, ImageURL)\nmovieFT : même contenu. DuckDB utilise ses propres comparaisons ; ILIKE est explicite pour ignorer la casse.",
    tables: ["movie", "movieFT"],
  },
];
export function datasetInfo(id: string) {
  return (
    datasets.find((d) => d.id === id.replace(/-(alt|dirty)$/, "")) ??
    datasets[0]
  );
}
const quote = (v: unknown): string =>
  v === null || v === undefined || v === ""
    ? "NULL"
    : typeof v === "number"
      ? String(v)
      : typeof v === "boolean"
        ? v
          ? "TRUE"
          : "FALSE"
        : `'${String(v).replaceAll("'", "''")}'`;
const insert = (table: string, rows: unknown[][]) =>
  rows.length
    ? `INSERT INTO ${table} VALUES ${rows.map((row) => `(${row.map(quote).join(",")})`).join(",")};`
    : "";
export async function fixtureSQL(
  id: string,
  load: (path: string) => Promise<unknown> = async (path) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error("Jeu de données introuvable.");
    return response.json();
  },
  schema = "main",
): Promise<string> {
  const alternative = id.endsWith("-alt"),
    dirty = id.endsWith("-dirty"),
    base = id.replace(/-(alt|dirty)$/, "");
  if (base === "course")
    return `
CREATE TABLE emp(e_id INTEGER,ename VARCHAR,deptno INTEGER,taux INTEGER,salaire DECIMAL(12,2),commission DECIMAL(12,2));
INSERT INTO emp VALUES (1,'Ana',10,100,2500,NULL),(2,'Ben',10,80,3500,0),(3,'Chloé',NULL,NULL,NULL,100),(4,'Dina',20,0,5500,200),(5,'Eli',20,120,5500,NULL),(6,'Fay',30,-10,1000,0),(7,'Gus',30,50,4500,NULL);
${alternative ? "INSERT INTO emp VALUES(8,'Hugo',40,0,4500,0),(9,'Inès',NULL,100,0,NULL),(10,'Jo',20,NULL,3500,500);" : ""}
CREATE TABLE dept(deptno INTEGER,dname VARCHAR); INSERT INTO dept VALUES(10,'Enseignement'),(20,'Recherche'),(30,'Support'),(40,'Sans employé');
CREATE TABLE commande(order_id INTEGER,category_name VARCHAR,status VARCHAR,order_value INTEGER,namecli VARCHAR);
INSERT INTO commande VALUES(1,'CPU','Shipped',100,'Alice'),(2,'Video Card','Shipped',200,'Alice'),(3,'CPU','Pending',150,'Bob'),(4,'RAM','Canceled',0,'Bob'),(5,'CPU','Shipped',NULL,'Alice'),(6,'RAM','Pending',80,'Camille'),(7,'Video Card',NULL,250,'Camille');
${alternative ? "INSERT INTO commande VALUES(8,'RAM','Shipped',50,'Zoé'),(9,'Video Card','Canceled',NULL,'Bob'),(10,NULL,'Pending',0,NULL);" : ""}
CREATE TABLE budgets(dept_id INTEGER,anneeCourante INTEGER,budgetCourant INTEGER,budgetPrec INTEGER); INSERT INTO budgets VALUES(10,2025,100,100),(20,2025,200,100),(30,2025,NULL,50),(40,2025,0,NULL),(50,2025,NULL,NULL);
CREATE TABLE produit(nom VARCHAR,prix INTEGER); INSERT INTO produit VALUES('Clavier',50),('Écran',200),('Écran bis',200),('Inconnu',NULL);
CREATE TABLE salaires(id INTEGER,salaire INTEGER,idDep INTEGER); INSERT INTO salaires VALUES(1,100,10),(2,200,10),(3,200,20),(4,NULL,20),(5,0,NULL);
CREATE TABLE t(compte VARCHAR,id INTEGER,val INTEGER); INSERT INTO t VALUES('A',1,100),('A',2,-20),('A',3,0),('B',1,50),('B',2,50);
CREATE TABLE vente(id INTEGER,annee INTEGER,mois INTEGER,prix INTEGER); INSERT INTO vente VALUES(1,2010,1,100),(2,2010,1,20),(3,2010,2,80),(4,2011,1,30),(5,2011,3,70),(6,2009,1,999),(7,2016,1,999);
CREATE TABLE venteAnim(animal VARCHAR,lieu VARCHAR,qte INTEGER); INSERT INTO venteAnim VALUES('Chat','Fribourg',2),('Chat','Berne',3),('Chien','Fribourg',1),(NULL,'Berne',4);
CREATE TABLE personne(id INTEGER,age INTEGER); INSERT INTO personne VALUES(1,30),(2,40),(3,50);
CREATE TABLE animal(id INTEGER,proprioId INTEGER,age INTEGER); INSERT INTO animal VALUES(1,1,8),(2,1,8),(3,1,3),(4,2,10),(5,2,5),(6,2,5);
CREATE TABLE vol(compagnie VARCHAR,ville_dep VARCHAR,ville_arr VARCHAR); INSERT INTO vol VALUES('A','Genève','Paris'),('B','Paris','Berlin'),('A','Berlin','Genève'),('A','Genève','Rome'),('B','Paris','Rome');
CREATE TABLE table_dest(id INTEGER,txt VARCHAR); INSERT INTO table_dest VALUES(1,'ancien'),(2,'stable');
CREATE TABLE table_source(id INTEGER,txt VARCHAR); INSERT INTO table_source VALUES(1,'nouveau'),(3,'ajout');`;
  if (base === "cinema") {
    const films: unknown[][] = [
      [
        1,
        "2001, l’odyssée de l’espace",
        "Stanley Kubrick",
        149,
        1968,
        "Science-fiction",
      ],
      [2, "Barry Lyndon", "Stanley Kubrick", 185, 1975, "Historique"],
      [3, "Certains l’aiment chaud", "Billy Wilder", 121, 1959, "Comédie"],
      [4, "Boulevard du crépuscule", "Billy Wilder", 110, 1950, "Drame"],
      [
        5,
        "L’armée des douze singes",
        "Terry Gilliam",
        129,
        1995,
        "Science-fiction",
      ],
      [6, "Big Fish", "Tim Burton", 125, 2003, "Fantastique"],
      [7, "Un film sans genre", "Tim Burton", 90, 2003, null],
      [8, "Une biographie", "Réalisatrice A", 100, 1960, "Biographie"],
      [9, "Notre histoire", "Réalisatrice A", 120, 1960, "Histoire"],
      [10, "La comédie", "Réalisateur B", 95, 1980, "Comédie"],
      [11, "Le documentaire", "Réalisateur B", 80, 1980, "Documentaire"],
      [12, "Sans séance", "Stanley Kubrick", 99, 1987, "Drame"],
    ];
    if (alternative)
      films.push(
        [20, "Autre genre inconnu", "Réalisatrice A", 101, 1959, null],
        [21, "Autre film historique", "Tim Burton", 120, 2003, "Historique"],
      );
    const sessions: unknown[][] = [];
    for (let i = 1; i <= 11; i++)
      for (let j = 0; j < 3; j++) {
        const date = `2009-${j === 2 ? "02" : "01"}-${String((i % 3) + 1).padStart(2, "0")}`;
        sessions.push([
          i * 10 + j,
          i,
          date,
          `${date} ${j ? "20" : "15"}:00:00`,
          j === 0 ? 50 : i % 2 ? 200 : 250,
          j ? 12 : 8,
        ]);
      }
    if (alternative)
      sessions.push(
        [900, 20, "2010-01-01", "2010-01-01 15:00:00", 0, 10],
        [901, 21, "2010-01-01", "2010-01-01 15:00:00", 100, 10],
        [902, 1, "2009-01-02", "2009-01-02 20:00:00", 250, 12],
      );
    return `CREATE TABLE T_FILM_FLM(FLM_ID INTEGER PRIMARY KEY,FLM_TITRE VARCHAR,FLM_REALISATEUR VARCHAR,FLM_DUREE_MN SMALLINT,FLM_ANNEE SMALLINT,FLM_GENRE VARCHAR); CREATE TABLE T_SEANCE_SNC(SNC_ID INTEGER PRIMARY KEY,FLM_ID INTEGER REFERENCES ${schema}.T_FILM_FLM(FLM_ID),SNC_DATE DATE,SNC_HEURE TIMESTAMP,SNC_BILLET SMALLINT,SNC_TARIF DECIMAL(5,2));${insert("T_FILM_FLM", films)}${insert("T_SEANCE_SNC", sessions)}`;
  }
  if (base === "zoo")
    return `CREATE TABLE gardien(gardien VARCHAR,prenom VARCHAR,salaire INTEGER); INSERT INTO gardien VALUES('Dupont','Ana',4000),('Martin','Ben',4000),('Petit','Camille',5000);
CREATE TABLE espece(espece VARCHAR,origine VARCHAR,classe VARCHAR); INSERT INTO espece VALUES('Ours','Europe','Mammifère'),('Loup','Europe','Mammifère'),('Aigle','Europe','Oiseau');
CREATE TABLE type_empl(type_empl VARCHAR,libelle_empl VARCHAR); INSERT INTO type_empl VALUES('F','foret'),('B','Banquise'),('V','Volière');
CREATE TABLE emplacement(emplacement INTEGER,surface INTEGER,type_empl VARCHAR,gardien VARCHAR); INSERT INTO emplacement VALUES(1,100,'F','Dupont'),(2,200,'B','Martin'),(3,300,'V','Petit');
CREATE TABLE animal(animal INTEGER,nom VARCHAR,annee_naissance INTEGER,espece VARCHAR,emplacement INTEGER); INSERT INTO animal VALUES(1,'Bruno',2010,'Ours',1),(2,'Blanche',2011,'Ours',2),(3,'Luna',2015,'Loup',1),(4,'Ari',2014,'Aigle',1),(5,'Alba',2016,'Aigle',3);
${alternative ? "INSERT INTO animal VALUES(6,'Petit ours',2020,'Ours',1);" : ""}
CREATE TABLE zoo AS SELECT a.animal,a.nom,a.annee_naissance,a.espece,e.gardien,g.prenom,g.salaire,s.classe,s.origine,a.emplacement,e.surface,e.type_empl,t.libelle_empl FROM animal a JOIN espece s ON a.espece=s.espece JOIN emplacement e ON a.emplacement=e.emplacement JOIN gardien g ON e.gardien=g.gardien JOIN type_empl t ON e.type_empl=t.type_empl;${dirty ? "UPDATE zoo SET origine='Asie' WHERE animal=1; UPDATE zoo SET salaire=4500 WHERE animal=3;" : ""}`;
  if (base === "index") {
    const data = (await load("/datasets/index.json")) as Record<
      string,
      unknown[][]
    >;
    return `CREATE TABLE customers(id INTEGER,email VARCHAR,name VARCHAR,fname VARCHAR,country VARCHAR);CREATE TABLE salesman(id INTEGER,name VARCHAR,fname VARCHAR,category INTEGER,country VARCHAR);CREATE TABLE orders(id INTEGER,customer_id INTEGER,date_order DATE,amount DECIMAL(10,2),salesman_id INTEGER);${insert("customers", data.customers)}${insert("salesman", data.salesman)}${insert("orders", data.orders)}${alternative ? "INSERT INTO customers VALUES(201,'empty@example.com','sans_commande','Test','country_2'),(202,'absent@example.com','absent','Test','country_inconnu'),(203,'null@example.com','sans_pays','Test',NULL); INSERT INTO salesman VALUES(999,'Sans pays','Test',1,NULL); INSERT INTO orders VALUES(999999,NULL,'2024-01-01',0,NULL);" : ""}CREATE TABLE orders2 AS SELECT *,CAST(NULL AS VARCHAR) AS commentaires1,CAST(NULL AS VARCHAR) AS commentaires2,CAST(NULL AS VARCHAR) AS commentaires3,CAST(NULL AS VARCHAR) AS commentaires4 FROM orders;`;
  }
  if (base === "movies") {
    const records = (await load("/datasets/movies.json")) as Record<
      string,
      string
    >[];
    const columns = [
      "n",
      "adult",
      "budget",
      "genres",
      "id",
      "imdb_id",
      "original_title",
      "overview",
      "poster_path",
      "revenue",
      "title",
      "vote_average",
      "vote_count",
      "imdbURL",
      "tmdbURL",
      "ImageURL",
    ];
    const numbers = new Set([
      "n",
      "budget",
      "id",
      "revenue",
      "vote_average",
      "vote_count",
    ]);
    return `CREATE TABLE movie(n INTEGER,adult BOOLEAN,budget DOUBLE,genres VARCHAR,id INTEGER,imdb_id VARCHAR,original_title VARCHAR,overview VARCHAR,poster_path VARCHAR,revenue DOUBLE,title VARCHAR,vote_average DOUBLE,vote_count INTEGER,imdbURL VARCHAR,tmdbURL VARCHAR,ImageURL VARCHAR);${insert(
      "movie",
      records.map((r) =>
        columns.map((c) =>
          c === "adult"
            ? r[c] === "True"
            : numbers.has(c)
              ? r[c] && Number.isFinite(Number(r[c]))
                ? Number(r[c])
                : null
              : r[c],
        ),
      ),
    )}${alternative ? "INSERT INTO movie VALUES(9999,false,0,'Comedy',999999,'test999','The Dream of Fear','A family faces panic and fear in a dream',NULL,0,'The Dream of Fear',0,0,NULL,NULL,NULL);" : ""}CREATE TABLE movieFT AS SELECT * FROM movie;`;
  }
  throw new Error(`Jeu inconnu : ${id}`);
}
