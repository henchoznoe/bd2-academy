import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Database,
  Download,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  SquareCheckBig,
  X,
} from "lucide-react";
import { modules, sources } from "./lib/catalog";
import { useProgress, ProgressProvider } from "./components/ProgressProvider";
import { downloadText } from "./lib/progress";
import {
  Dashboard,
  ModulePage,
  LessonPage,
  TracksPage,
  TrackPage,
  ExamPage,
  SearchPage,
  SourcesPage,
  GlossaryPage,
} from "./components/Pages";
const QuizPage = lazy(() => import("./components/QuizPage"));
const ExercisePage = lazy(() => import("./components/ExercisePage"));
const Labs = lazy(() => import("./components/Labs"));
const ProgressPage = lazy(() => import("./components/ProgressPage"));
const SqlPlayground = lazy(() => import("./components/SqlPlayground"));
const Compatibility = lazy(() => import("./components/Compatibility"));
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const heading = document.querySelector("main h1");
    if (heading instanceof HTMLElement) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [pathname]);
  return null;
}
function Shell() {
  const { data, error, saving, ready, retry } = useProgress(),
    [menu, setMenu] = useState(false),
    [query, setQuery] = useState(""),
    location = useLocation(),
    navigate = useNavigate(),
    searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setMenu(false);
  }, [location.pathname]);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (
        event.key === "/" &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target as HTMLElement)?.isContentEditable
      ) {
        event.preventDefault();
        searchInput.current?.focus();
      }
      if (event.key === "Escape") setMenu(false);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const menuLinks = [
    ["/", "Mon parcours", LayoutDashboard],
    ["/qcm", "QCM", Check],
    ["/tp", "Travaux pratiques", SquareCheckBig],
    ["/examen", "Préparer l’examen", GraduationCap],
    ["/ateliers/df", "Laboratoire", FlaskConical],
    ["/sql", "Bac à SQL", Code2],
    ["/progression", "Mes acquis", ShieldCheck],
  ] as const;
  return (
    <>
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      {menu && (
        <button
          className="sidebar-overlay"
          aria-label="Fermer le menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        className={`sidebar ${menu ? "is-open" : ""}`}
        aria-label="Navigation principale"
      >
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Database size={22} />
          </span>
          <span>
            bd2<span className="font-normal text-indigo-500">academy</span>
            <small>LE SAVOIR PAR LA PRATIQUE</small>
          </span>
        </Link>
        <button
          className="mobile-close"
          aria-label="Fermer le menu"
          onClick={() => setMenu(false)}
        >
          <X size={20} />
        </button>
        <div className="sidebar-section">VOTRE ESPACE</div>
        <nav className="main-nav">
          {menuLinks.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-section flex items-center justify-between">
          <span>LE COURS</span>
          <span className="count-badge">08</span>
        </div>
        <nav className="course-nav">
          {modules.map((module) => (
            <NavLink
              key={module.id}
              to={`/cours/${module.id}`}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span>{module.number}</span>
              <span>{module.title}</span>
              <ChevronRight size={13} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/glossaire">
            <BookOpen size={16} />
            Glossaire
          </Link>
          <Link to="/sources">
            <BookOpen size={16} />
            Sources et couverture
            <ArrowUpRight size={13} />
          </Link>
          <div className="local-note">
            <span className="green-dot" />
            Votre progression reste sur cet appareil.
          </div>
        </div>
      </aside>
      <div className="app-area">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="menu-button"
              onClick={() => setMenu(!menu)}
              aria-label="Ouvrir le menu"
              aria-expanded={menu}
            >
              <Menu size={22} />
            </button>
            <span className="top-breadcrumb">
              ESPACE DE RÉVISION <span>/</span> BASES DE DONNÉES 2
            </span>
          </div>
          <form
            className="global-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(`/recherche?q=${encodeURIComponent(query)}`);
            }}
          >
            <Search size={16} />
            <label className="sr-only" htmlFor="global-search">
              Chercher dans le cours
            </label>
            <input
              ref={searchInput}
              id="global-search"
              placeholder="Une notion, un exercice…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>/</kbd>
          </form>
          <span className="save-state" aria-live="polite">
            {saving ? (
              "Sauvegarde…"
            ) : error ? (
              "Sauvegarde à vérifier"
            ) : ready ? (
              <>
                <Check size={13} />
                Enregistré ici
              </>
            ) : (
              "Chargement…"
            )}
          </span>
        </header>
        <main id="main" tabIndex={-1}>
          {error && (
            <div className="save-error" role="alert">
              <strong>La sauvegarde demande votre attention.</strong>
              <p>{error}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="button"
                  onClick={() =>
                    downloadText(
                      "bd2-academy-secours.json",
                      JSON.stringify(data, null, 2),
                    )
                  }
                >
                  <Download size={14} />
                  Exporter maintenant
                </button>
                <button className="button" onClick={retry}>
                  Réessayer la sauvegarde
                </button>
              </div>
            </div>
          )}
          {!ready ? (
            <p className="loading">Chargement de votre progression…</p>
          ) : (
            <Suspense
              fallback={<p className="loading">Ouverture de l’espace…</p>}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/cours/:moduleId" element={<ModulePage />} />
                <Route path="/lecons/:id" element={<LessonPage />} />
                <Route path="/exercices/:id" element={<ExercisePage />} />
                <Route path="/qcm" element={<QuizPage />} />
                <Route path="/qcm/:moduleId" element={<QuizPage />} />
                <Route path="/tp" element={<TracksPage />} />
                <Route path="/tp/:track" element={<TrackPage />} />
                <Route path="/examen" element={<ExamPage />} />
                <Route path="/ateliers/:id" element={<Labs />} />
                <Route path="/progression" element={<ProgressPage />} />
                <Route path="/sources" element={<SourcesPage />} />
                <Route path="/glossaire" element={<GlossaryPage />} />
                <Route path="/recherche" element={<SearchPage />} />
                <Route path="/sql" element={<SqlPlayground />} />
                <Route path="/compatibilite" element={<Compatibility />} />
                <Route
                  path="*"
                  element={
                    <div>
                      <h1>Cette page n’existe pas.</h1>
                      <Link to="/">Retrouver mon parcours</Link>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          )}
          <footer className="footer">
            <span>
              BD2 ACADEMY <span className="mx-2">·</span> Comprendre avant de
              cocher.
            </span>
            <Link to="/sources">
              {sources.length} supports, un parcours vérifiable
              <ChevronRight size={13} />
            </Link>
          </footer>
        </main>
      </div>
      <ScrollToTop />
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <ProgressProvider>
        <Shell />
      </ProgressProvider>
    </BrowserRouter>
  );
}
