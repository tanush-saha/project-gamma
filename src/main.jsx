import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Link, Navigate, Outlet, RouterProvider, useLocation, useNavigate, useParams } from "react-router-dom";
import { openBooks } from "./books.js";
import { courses, publicTextbooks, textbookCaution } from "./curriculum.js";
import { firebaseConfigured, loadFirebase, missingFirebaseConfig } from "./firebase.js";
import { Badge, Button, Card, EmptyState, ProgressBar, Skeleton, Tabs, ThemeToggle, Toast } from "./components/ui.jsx";
import "./styles.css";

const tracks = [
  { id: "PCM", name: "Physics · Chemistry · Maths", short: "PCM", mark: "∑" },
  { id: "PCB", name: "Physics · Chemistry · Biology", short: "PCB", mark: "✳" },
  { id: "Commerce", name: "Commerce", short: "COM", mark: "↗" },
  { id: "Humanities", name: "Humanities", short: "HUM", mark: "¶" },
];
const guestStorageKey = "study-shelf-profile-v2";
const StudyContext = createContext(null);

function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error("Study Shelf pages must be rendered inside the app.");
  return context;
}

function belongsToTrack(book, track) {
  if (track === "all") return true;
  const subjects = (book.subjects || [book.subject]).map((subject) => subject.trim().toLowerCase());
  return book.track === track
    || ((track === "PCM" || track === "PCB") && subjects.some((subject) => ["physics", "chemistry"].includes(subject)))
    || ((track === "Commerce" || track === "Humanities") && subjects.includes("economics"));
}

function getBookSubjects(book) {
  return book.subjects || [book.subject];
}

function readGuestProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(guestStorageKey) || "{}");
    const previousSavedIds = JSON.parse(localStorage.getItem("study-shelf-saved-books") || "[]");
    return {
      savedBookIds: [...new Set([
        ...(Array.isArray(profile.savedBookIds) ? profile.savedBookIds : []),
        ...(Array.isArray(previousSavedIds) ? previousSavedIds : []),
      ].filter((id) => typeof id === "string"))],
      completedUnitIds: Array.isArray(profile.completedUnitIds) ? profile.completedUnitIds.filter((id) => typeof id === "string") : [],
    };
  } catch (error) {
    console.error("Could not read the local study profile.", error);
    return { savedBookIds: [], completedUnitIds: [] };
  }
}

function writeGuestProfile(profile) {
  try {
    localStorage.setItem(guestStorageKey, JSON.stringify({
      savedBookIds: profile.savedBookIds,
      completedUnitIds: profile.completedUnitIds,
    }));
  } catch (error) {
    throw new Error(`Could not save your local study progress: ${error.message}`);
  }
}

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Study Shelf home">
      <span className="brand-icon" aria-hidden="true">s.</span>
      <span>study shelf</span>
    </Link>
  );
}

function MotionEffects() {
  const cursorRef = useRef(null);
  const cursorDotRef = useRef(null);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!finePointer.matches || motionPreference.matches) return undefined;

    const moveCursor = (event) => {
      const position = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      if (cursorRef.current) cursorRef.current.style.transform = position;
      if (cursorDotRef.current) cursorDotRef.current.style.transform = position;
    };
    const markInteractive = (event) => {
      if (!cursorRef.current) return;
      cursorRef.current.classList.toggle("cursor-hover", Boolean(event.target.closest("a, button, summary, [role='button']")));
    };
    window.addEventListener("pointermove", moveCursor, { passive: true });
    document.addEventListener("pointerover", markInteractive);
    document.documentElement.classList.add("cursor-ready");
    return () => {
      window.removeEventListener("pointermove", moveCursor);
      document.removeEventListener("pointerover", markInteractive);
      document.documentElement.classList.remove("cursor-ready");
    };
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      document.querySelectorAll("[data-reveal]").forEach((item) => item.classList.add("is-visible"));
      return undefined;
    }

    document.documentElement.classList.add("has-scroll-reveals");
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach((element) => element.classList.add("is-visible"));
      return () => document.documentElement.classList.remove("has-scroll-reveals");
    }
    const observed = new WeakSet();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    const observeReveals = () => {
      document.querySelectorAll("[data-reveal]").forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        observer.observe(element);
      });
    };
    observeReveals();
    const mutationObserver = new MutationObserver(observeReveals);
    mutationObserver.observe(document.getElementById("root"), { childList: true, subtree: true });
    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
      document.documentElement.classList.remove("has-scroll-reveals");
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const bar = document.querySelector(".scroll-progress");
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        if (bar) bar.style.transform = `scaleX(${scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0})`;
      });
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return <>
    <div className="scroll-progress" aria-hidden="true" />
    <div className="custom-cursor" ref={cursorRef} aria-hidden="true"><span /></div>
    <div className="custom-cursor-dot" ref={cursorDotRef} aria-hidden="true" />
  </>;
}

function Header({ user, route, savedCount, onSignOut, syncError }) {
  const displayName = user?.displayName || user?.email?.split("@")[0];
  const isCurrent = (path) => route === path || (path !== "/" && route.startsWith(`${path}/`));
  return (
    <>
      <header className="topbar">
        <Brand />
        <nav className="topnav" aria-label="Main navigation">
          <Link to="/" aria-current={isCurrent("/") ? "page" : undefined}>Home</Link>
          <Link to="/library" aria-current={isCurrent("/library") ? "page" : undefined}>Discover</Link>
          {user && !user.isAnonymous && <>
            <Link to="/dashboard" aria-current={isCurrent("/dashboard") ? "page" : undefined}>Workspace</Link>
            <Link to="/dashboard/progress" aria-current={isCurrent("/dashboard/progress") ? "page" : undefined}>Study map</Link>
            <Link to="/dashboard/shelf" aria-current={isCurrent("/dashboard/shelf") ? "page" : undefined}>My PDFs</Link>
          </>}
        </nav>
        <div className="header-account">
          <Link className="saved-link" to={user && !user.isAnonymous ? "/dashboard/library" : "/login"}>
            <span className="saved-star" aria-hidden="true">✳</span>
            <span className="saved-label">Saved</span> <span className="saved-count">{savedCount}</span>
          </Link>
          {user && !user.isAnonymous ? (
            <div className="user-menu">
              <Link className="user-name" to="/dashboard/settings" title={user.email || ""}>{displayName || "My account"}</Link>
              <button onClick={onSignOut} className="sign-in-button">Sign out</button>
            </div>
          ) : (
            <Link to="/login" className="sign-in-button">{user?.isAnonymous ? "Secure shelf" : "Sign in"}</Link>
          )}
        </div>
      </header>
      {syncError && <Toast variant="error">{syncError}</Toast>}
    </>
  );
}

function Footer({ user }) {
  return (
    <footer className="footer">
      <Brand />
      <p>Made for the next question.</p>
      <nav className="footer-navigation" aria-label="More pages">
        <Link to="/">Home</Link><Link to="/library">Discover books</Link>
        <Link to="/about">About</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link>
        {(!user || user.isAnonymous) && <><Link to="/login">Sign in</Link><Link to="/signup">Create account</Link></>}
        {user && !user.isAnonymous && <><Link to="/dashboard">Workspace</Link><Link to="/dashboard/progress">Study map</Link>
          <Link to="/dashboard/library">Saved books</Link><Link to="/dashboard/shelf">My PDFs</Link></>}
      </nav>
      <span className="footer-small">© 2026 STUDY SHELF · READ WITH CURIOSITY</span>
    </footer>
  );
}

function HomePage({ onChooseTrack, savedCount, savedIds, onToggleSaved, onSearchSources, completedCount, user }) {
  const [sourceSearch, setSourceSearch] = useState("");
  const completionPercent = completedCount > 0
    ? Math.max(1, Math.round((completedCount / courses.reduce((sum, course) => sum + course.units.length, 0)) * 100))
    : 0;
  function moveHeroArtwork(event) {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--pointer-x", `${(x * 12).toFixed(1)}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${(y * 9).toFixed(1)}px`);
  }
  function resetHeroArtwork(event) {
    event.currentTarget.style.setProperty("--pointer-x", "0px");
    event.currentTarget.style.setProperty("--pointer-y", "0px");
  }
  return (
    <>
      <section className="hero" data-reveal>
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> A little more curious, every day</p>
          <h1>Read deeper.<br /><em>Find your way.</em></h1>
          <p className="hero-description">
            A thoughtful home for books, ideas and study momentum across PCM, PCB, Commerce and Humanities.
            Find a good source, follow your syllabus, and pick up where you left off.
          </p>
          <Link className="hero-cta" to={user ? "/dashboard" : "/signup"}>
            {user ? "Open your workspace" : "Step into your space"} <span aria-hidden="true">↘</span></Link>
          <Link className="hero-secondary-link" to="/library">Explore the open library <span aria-hidden="true">↗</span></Link>
          <div className="hero-footnote"><span className="footnote-line" /><span>Good books. Thoughtfully found. Progress that stays yours.</span></div>
        </div>
        <div className="hero-art" aria-label="Illustration of a stack of books" role="img"
          onPointerMove={moveHeroArtwork} onPointerLeave={resetHeroArtwork}>
          <div className="art-sun" /><span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" />
          <div className="art-note note-top">READ<br />WIDELY</div><div className="art-note note-bottom">STAY<br />CURIOUS</div>
          <div className="book-stack">
            <div className="book book-back"><span>THE ART OF ASKING</span><i>✳</i></div>
            <div className="book book-middle"><span>THINK IN<br />SYSTEMS</span><i>∿</i></div>
            <div className="book book-front"><span>A FIELD GUIDE<br />TO IDEAS</span><i>⌁</i></div>
          </div>
          <span className="art-caption">YOUR NEXT CHAPTER STARTS HERE</span>
          <span className="art-sparkle sparkle-one">✳</span><span className="art-sparkle sparkle-two">✳</span>
        </div>
        <div className="hero-index"><span>BUILT FOR</span> / YOUR NEXT PAGE</div>
      </section>
      <div className="ticker" aria-label="A good place to start"><div className="ticker-track">
        {Array.from({ length: 4 }, (_, index) => <span key={index}>FOLLOW THE QUESTION <b>✳</b> TRY SOMETHING NEW <b>✳</b></span>)}
      </div></div>
      <section className="section-wrap home-pathways" data-reveal>
        <div className="section-heading">
          <div><p className="eyebrow">01 — A SHELF WITH A SENSE OF DIRECTION</p><h2>What are you<br /><em>here to explore?</em></h2></div>
          <p className="section-aside">Four study paths · 24 subjects<br />Begin with a question. Find your way from there.</p>
        </div>
        <div className="pathway-grid">
          {tracks.map((track, index) => (
            <button className={`pathway-card pathway-${index + 1}`} key={track.id} onClick={() => onChooseTrack(track.id)}>
              <span className="pathway-mark" aria-hidden="true">{track.mark}</span><span className="pathway-number">0{index + 1}</span>
              <span className="pathway-name">{track.name}</span><span className="pathway-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </section>
      <section className="home-source-preview page-wrap" data-reveal>
        <div className="dashboard-section-heading"><div><p className="eyebrow">A FEW TRUSTED PLACES TO BEGIN</p>
          <h2>Find the source.<br /><em>Follow the idea.</em></h2></div>
          <form className="home-source-search" role="search" onSubmit={(event) => {
            event.preventDefault();
            onSearchSources(sourceSearch);
          }}>
            <label className="sr-only" htmlFor="home-source-search">Search open books</label>
            <input id="home-source-search" type="search" value={sourceSearch} onChange={(event) => setSourceSearch(event.target.value)}
              placeholder="Search a subject or title" />
            <button type="submit" aria-label="Search the open library">Search ↗</button>
          </form>
        </div>
        <div className="book-grid">{openBooks.slice(0, 3).map((book, index) => <BookCard key={book.id} book={book}
          saved={savedIds.includes(book.id)} onToggle={onToggleSaved} style={{ "--card-index": index }} />)}</div>
        <Link className="hero-secondary-link" to="/library">Explore all official and open sources <span aria-hidden="true">↗</span></Link>
      </section>
      <section className="home-feature-strip" id="how-it-works" data-reveal>
        <Link className="feature-card" to="/dashboard/progress"><span className="feature-index">01 / FIND YOUR THREAD</span><span className="feature-mark">✓</span>
          <h3>Make the syllabus yours.</h3><p>A clear Class XI–XII study map for every stream. Check off the topics you have covered and pick up where you left off.</p>
          <strong>{completedCount} {completedCount === 1 ? "topic" : "topics"} complete · {completionPercent}% of map</strong></Link>
        <Link className="feature-card" to="/library"><span className="feature-index">02 / READ WITH INTENTION</span><span className="feature-mark">▤</span>
          <h3>A shelf worth returning to.</h3><p>Find official textbooks and open books from their publishers. Save the ones you want within reach.</p><strong>{savedCount} books on your shelf ↗</strong></Link>
        <Link className="feature-card" to={user ? "/dashboard/shelf" : "/signup"}><span className="feature-index">03 / MAKE IT YOURS</span><span className="feature-mark">⌂</span>
          <h3>Your learning, in one place.</h3><p>Your account brings your saved reading and study progress along when you switch devices.</p><strong>{user ? "Open your personal shelf ↗" : "Create a free account ↗"}</strong></Link>
        <Link className="feature-card" to={user ? "/dashboard/progress" : "/signup"}><span className="feature-index">04 / KEEP YOUR PLACE</span><span className="feature-mark">↗</span>
          <h3>Pick up where you left off.</h3><p>Your private study map and, if you enable Firebase Storage, your cloud PDF shelf are there when you sign in.</p><strong>{user ? "Continue learning ↗" : "Create an account ↗"}</strong></Link>
      </section>
      <section className="manifesto"><div className="manifesto-shape" aria-hidden="true">S</div>
        <p className="eyebrow">A NOTE FROM THE SHELF</p><h2>Learning isn’t a<br />race to the <em>last page.</em></h2>
        <p className="manifesto-copy">A reading life is made of small discoveries: a book that opens a door, a question that stays with you, and a place to keep the thread.</p>
        <Link to="/library" className="manifesto-link">Step inside the library <span>↗</span></Link>
      </section>
    </>
  );
}

function DashboardPage({ user, savedCount, completedIds, completedCount }) {
  const totalUnits = courses.reduce((sum, course) => sum + course.units.length, 0);
  const nextCourse = courses.find((course) => course.units.some((unit) => !completedIds.includes(unit.id)));
  const nextUnit = nextCourse?.units.find((unit) => !completedIds.includes(unit.id));
  const firstBooks = [...publicTextbooks, ...openBooks].slice(0, 3);

  return (
    <section className="page-wrap dashboard-page" data-reveal>
      <p className="eyebrow"><span className="eyebrow-dot" /> YOUR STUDY SHELF · A SPACE TO PICK UP THE THREAD</p>
      <div className="dashboard-welcome">
        <div><p className="dashboard-kicker">A NEW PAGE, {new Date().toLocaleDateString(undefined, { weekday: "long" }).toUpperCase()}</p>
          <h1>{user?.displayName ? `Welcome back, ${user.displayName.split(" ")[0]}.` : "Welcome to your shelf."}<br />
            <em>Where to next?</em></h1>
          <p>One place for your books, your progress, and the next thing you want to understand.</p>
        </div>
        <Link className="hero-cta" to={nextCourse ? "/dashboard/progress" : "/library"}>{nextCourse ? "Continue your study map" : "Explore a book"} <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="dashboard-metrics">
        <article className="dashboard-metric"><span>YOUR READING LIST</span><strong>{savedCount.toString().padStart(2, "0")}</strong><Link to="/dashboard/library">Saved titles ↗</Link></article>
        <article className="dashboard-metric"><span>TOPICS EXPLORED</span><strong>{completedCount.toString().padStart(2, "0")}</strong><Link to="/dashboard/progress">{totalUnits} across 24 courses ↗</Link></article>
        <article className="dashboard-metric"><span>YOUR NEXT CHAPTER</span><strong>{nextCourse ? `CLASS ${nextCourse.grade}` : "READY"}</strong><Link to="/dashboard/progress">{nextCourse?.subject || "Every topic complete"} ↗</Link></article>
      </div>
      {nextUnit && <section className="dashboard-next-card">
        <div className="next-card-mark" aria-hidden="true">✳</div>
        <div><p className="eyebrow">A GENTLE PLACE TO BEGIN · CLASS {nextCourse.grade} {nextCourse.subject.toUpperCase()}</p>
          <h2>{nextUnit.title}</h2><p>{nextUnit.chapter} · Pick up at your own pace.</p></div>
        <Link to="/dashboard/progress">Open your study map <span aria-hidden="true">↗</span></Link>
      </section>}
      <div className="dashboard-section-heading"><div><p className="eyebrow">A FEW WAYS IN</p><h2>Make this space <em>yours.</em></h2></div>
        <span>Your reading and study tools, all together.</span></div>
      <div className="dashboard-action-grid">
        <Link to="/library" className="dashboard-action action-library"><span>01 / DISCOVER</span><i>↗</i><strong>Find a book</strong><small>Explore official textbooks and freely available publisher books.</small></Link>
        <Link to="/dashboard/progress" className="dashboard-action action-topics"><span>02 / STUDY</span><i>✓</i><strong>Follow your syllabus</strong><small>Explore classes, subjects, chapters, and learning points.</small></Link>
        <Link to="/dashboard/library" className="dashboard-action action-shelf"><span>03 / YOUR READING LIST</span><i>▤</i><strong>Return to a favorite</strong><small>Find the books you have saved to read next.</small></Link>
      </div>
      <section className="dashboard-reading">
        <div className="dashboard-section-heading"><div><p className="eyebrow">A FEW RECOMMENDED STARTING POINTS</p><h2>Open a good <em>book.</em></h2></div>
          <Link to="/library">See the full collection ↗</Link></div>
        <div className="dashboard-book-list">{firstBooks.map((book, index) => <Link className="dashboard-book-row" to={`/book/${book.id}`} key={book.id}>
          <span>0{index + 1}</span><div><strong>{book.title}</strong><small>{book.author} · {book.subject}</small></div><b>↗</b>
        </Link>)}</div>
      </section>
    </section>
  );
}

function TopicPage({ trackFilter, onTrackChange, completedIds, onToggle, firebaseUser, onSignIn }) {
  const [grade, setGrade] = useState("XI");
  const [courseFilter, setCourseFilter] = useState("all");
  const [search, setSearch] = useState("");
  const scopedCourses = courses.filter((course) => {
    const belongsToTrack = trackFilter === "all" || course.streams.includes(trackFilter);
    const matchesGrade = grade === "both" || course.grade === grade;
    const matchesSubject = courseFilter === "all" || course.id === courseFilter;
    return belongsToTrack && matchesGrade && matchesSubject;
  });
  const matchingUnits = scopedCourses.flatMap((course) =>
    course.units
      .filter((unit) => `${course.subject} ${unit.chapter} ${unit.title}`.toLowerCase().includes(search.trim().toLowerCase()))
      .map((unit) => ({ ...unit, course })),
  );
  const completed = matchingUnits.filter(({ id }) => completedIds.includes(id)).length;
  const percent = matchingUnits.length ? Math.round((completed / matchingUnits.length) * 100) : 0;

  return (
    <section className="page-wrap study-map-page">
      <p className="eyebrow">THE STUDY MAP · YOUR CHECKLIST, YOUR PACE</p>
      <div className="page-heading-row"><h1>Every subject.<br /><em>One step at a time.</em></h1>
        <p>Pick your stream and class, open a chapter, and check off the learning points you have studied.</p></div>
      <div className="coverage-panel">
        <div className="coverage-copy"><span>YOUR COVERAGE</span><strong>{percent}%</strong>
          <p>{completed} of {matchingUnits.length} topics complete</p></div>
        <ProgressBar className="coverage-track" label="Topic coverage" value={percent} />
        {!firebaseUser && firebaseConfigured && <button className="coverage-account" onClick={onSignIn}>Sign in to sync your progress across devices ↗</button>}
        {!firebaseConfigured && <p className="coverage-account-hint">Progress is saved on this browser. Add free Firebase settings to enable login and syncing.</p>}
      </div>
      <div className="topic-filters">
        <label><span>STUDY PATH</span><select value={trackFilter} onChange={(event) => {
          onTrackChange(event.target.value);
          setCourseFilter("all");
        }}>
          <option value="all">Every stream</option>{tracks.map((track) => <option value={track.id} key={track.id}>{track.name}</option>)}
        </select></label>
        <label><span>CLASS</span><select value={grade} onChange={(event) => {
          setGrade(event.target.value);
          setCourseFilter("all");
        }}>
          <option value="XI">Class XI</option><option value="XII">Class XII</option><option value="both">Classes XI &amp; XII</option>
        </select></label>
        <label className="course-filter"><span>SUBJECT</span><select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
          <option value="all">All subjects</option>
          {[...new Map(scopedCourses.map((course) => [course.subject, course.subject])).values()].map((subject) => (
            <optgroup key={subject} label={subject}>{scopedCourses.filter((course) => course.subject === subject).map((course) => (
              <option value={course.id} key={course.id}>Class {course.grade} · {course.subject}</option>))}
            </optgroup>
          ))}
        </select></label>
        <label className="topic-search"><span>FIND A TOPIC</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="e.g. electrostatics" /></label>
      </div>
      <div className="course-list">
        {scopedCourses.map((course) => {
          const units = course.units.filter((unit) => `${course.subject} ${unit.chapter} ${unit.title}`.toLowerCase().includes(search.trim().toLowerCase()));
          if (!units.length) return null;
          const done = units.filter((unit) => completedIds.includes(unit.id)).length;
          const coursePercent = Math.round((done / units.length) * 100);
          const book = publicTextbooks.find((title) => title.subject === course.subject && title.grade === course.grade);
          return (
            <details className="course-accordion" key={course.id}>
              <summary className="course-summary">
                <span className="course-grade">CLASS {course.grade}</span>
                <span className="course-title">{course.subject}</span>
                <span className="course-book">{course.bookTitle}</span>
                <span className="course-progress">{done}/{units.length} topics</span>
                <span className="course-chevron" aria-hidden="true">↗</span>
              </summary>
              <div className="course-body">
                <div className="course-progress-track"><span style={{ width: `${coursePercent}%` }} /></div>
                {units.map((unit) => (
                  <label className={`study-unit ${completedIds.includes(unit.id) ? "unit-complete" : ""}`} key={unit.id}>
                    <input type="checkbox" checked={completedIds.includes(unit.id)} onChange={() => onToggle(unit.id)} />
                    <span className="unit-checkbox" aria-hidden="true">{completedIds.includes(unit.id) ? "✓" : ""}</span>
                    <span><small>{unit.chapter}</small><strong>{unit.title}</strong></span>
                  </label>
                ))}
                <Link className="unit-book-link" to="/library">
                  Open the official NCERT Class {course.grade} {course.subject} textbook ↗
                </Link>
                {!book && <span className="unit-note">Find the relevant chapter by its heading in the NCERT book.</span>}
              </div>
            </details>
          );
        })}
      </div>
      {!matchingUnits.length && <div className="empty-state"><span>✳</span><h3>No matching topics.</h3><p>Try a different search, subject, stream, or class.</p></div>}
      <p className="curriculum-caution">{textbookCaution} <a href="https://cbseacademic.nic.in/curriculum_2027.html" target="_blank" rel="noreferrer">Official CBSE 2026–27 curriculum ↗</a></p>
    </section>
  );
}

function BookCard({ book, saved, onToggle, style }) {
  const link = book.publicPath ? `${import.meta.env.BASE_URL}${book.publicPath}` : book.href;
  return (
    <article className="book-card" style={style}>
      <Link className={`book-cover cover-${book.color}`} to={`/book/${book.id}`}
        aria-label={`View details for ${book.title}`}>
        <span className="cover-topline">{book.type === "official" ? `${book.publisher} · OFFICIAL` : book.publisher} <span>·</span> {book.number}</span>
        <span className="cover-orb" /><span className="cover-title">{book.cover}</span>
        <span className="cover-bottomline">{book.publicPath ? "AVAILABLE ON THIS SITE" : "OPEN AT SOURCE"}</span>
        <span className="cover-open" aria-hidden="true">↗</span>
      </Link>
      <div className="book-details">
        <div className="book-meta"><span>{getBookSubjects(book).join(" · ")}</span><span>{book.level}</span></div>
        <h3><Link to={`/book/${book.id}`}>{book.title}</Link></h3><p className="book-author">By {book.author}</p>
        <p className="book-description">{book.description}</p>
        <div className="book-actions">
          <a className="source-link" href={link} target="_blank" rel="noreferrer">
            {book.publicPath ? "Read or download PDF" : book.source}<span aria-hidden="true"> ↗</span>
          </a>
          <button className={`bookmark-button ${saved ? "is-saved" : ""}`} onClick={() => onToggle(book)}
            aria-label={`${saved ? "Remove" : "Save"} ${book.title}`} aria-pressed={saved}>{saved ? "✳" : "＋"}</button>
        </div>
      </div>
    </article>
  );
}

function BookPage({ savedIds, onToggleSaved, initialSavedOnly = false, privateLibrary = false }) {
  const location = useLocation();
  const [track, setTrack] = useState(initialSavedOnly ? "all" : "all");
  const [grade, setGrade] = useState("all");
  const [subject, setSubject] = useState("all");
  const [sourceType, setSourceType] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get("q") || "");
  const [savedOnly, setSavedOnly] = useState(initialSavedOnly);
  const [visibleCount, setVisibleCount] = useState(12);
  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get("q") || "");
  }, [location.search]);
  const visibleBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...publicTextbooks, ...openBooks]
      .filter((book) => belongsToTrack(book, track))
      .filter((book) => grade === "all" || book.level.includes(grade))
      .filter((book) => subject === "all" || getBookSubjects(book).includes(subject))
      .filter((book) => sourceType === "all" || (sourceType === "official" ? book.type === "official" : book.type !== "official"))
      .filter((book) => !savedOnly || savedIds.includes(book.id))
      .filter((book) => !query || [book.title, ...getBookSubjects(book), book.publisher, book.description]
        .join(" ").toLowerCase().includes(query))
      .sort((a, b) => sort === "title" ? a.title.localeCompare(b.title)
        : sort === "subject" ? a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title)
          : 0);
  }, [grade, savedIds, savedOnly, search, sort, sourceType, subject, track]);
  const displayedBooks = visibleBooks.slice(0, visibleCount);

  return (
    <section className="page-wrap books-page" data-reveal>
      <p className="eyebrow"><span className="eyebrow-dot" /> {privateLibrary ? "YOUR STUDY LIBRARY · SIGNED-IN WORKSPACE" : "THE OPEN SHELF · BOOKS WITH A GOOD SOURCE"}</p>
      <div className="page-heading-row"><h1>{savedOnly ? <>Your saved<br /><em>reading.</em></> : privateLibrary ? <>Your study<br /><em>library.</em></> : <>Find your next<br /><em>good book.</em></>}</h1>
        <p>{savedOnly ? "A small collection of good places to pick up where you left off." : "Browse official and openly available books and study resources. Save useful sources to keep them close; readings always open at their provider."}</p></div>
      <div className="book-filters">
        <Tabs className="track-tabs" itemClassName="track-tab" label="Filter books by study path"
          value={track} onChange={setTrack}
          items={[{ value: "all", label: "ALL" }, ...tracks.map((item) => ({ value: item.id, label: item.short }))]} />
        <label className="grade-filter"><span>CLASS</span><select value={grade} onChange={(event) => setGrade(event.target.value)}>
          <option value="all">XI &amp; XII</option><option value="XI">XI</option><option value="XII">XII</option></select></label>
        <label className="grade-filter"><span>SUBJECT</span><select value={subject} onChange={(event) => setSubject(event.target.value)}>
          <option value="all">All subjects</option>{[...new Set([...publicTextbooks, ...openBooks].flatMap(getBookSubjects))].sort().map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="grade-filter"><span>SOURCE</span><select value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
          <option value="all">All sources</option><option value="official">Official sources</option><option value="open">Open / third-party</option></select></label>
        <label className="grade-filter"><span>SORT</span><select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="recommended">Recommended</option><option value="title">Title A–Z</option><option value="subject">Subject</option></select></label>
        <label className="book-search"><span className="sr-only">Search books</span><input value={search} onChange={(event) => setSearch(event.target.value)}
          type="search" placeholder="Search title or subject" /></label>
        <button className={`saved-only-button ${savedOnly ? "filter-on" : ""}`} onClick={() => setSavedOnly((current) => !current)}>
          {savedOnly ? "Saved only ✳" : `Saved · ${savedIds.length}`}
        </button>
      </div>
      <div className="catalog-heading"><span>{savedOnly ? "YOUR SAVED BOOKS" : `${tracks.find((item) => item.id === track)?.name || "ALL STUDY PATHS"} · CURATED SOURCES`}</span>
        <span>{visibleBooks.length} books</span></div>
      <div className="book-grid">
        {displayedBooks.map((book, index) => <BookCard key={book.id} book={book} saved={savedIds.includes(book.id)}
          onToggle={onToggleSaved} style={{ "--card-index": index }} />)}
      </div>
      {visibleBooks.length > displayedBooks.length && <button className="load-more-button" onClick={() => setVisibleCount((count) => count + 12)}>
        Show more sources · {visibleBooks.length - displayedBooks.length} remaining ↘
      </button>}
      {!visibleBooks.length && <EmptyState title={savedOnly ? "Your reading list is ready to grow." : "No books in this search."}>
        {savedOnly ? "Save a title from the open library and it will be waiting here." : "Try another subject, title, or class."}
      </EmptyState>}
      <div className="rights-note"><span>READ IT FROM THE SOURCE</span><p>Study Shelf links to publishers, institutions, and other identified providers; it does not host these resources. Availability and reuse terms vary, especially for third-party study material. Check the source's terms and the current CBSE syllabus before relying on a resource.</p></div>
    </section>
  );
}

function CloudShelfPage({ user, services, firebaseReady }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [uploadSummary, setUploadSummary] = useState("");
  const [uploadFileProgress, setUploadFileProgress] = useState("");
  const [reader, setReader] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const fileInput = useRef(null);
  const folderInput = useRef(null);

  useEffect(() => {
    let active = true;
    if (!services || !user || !firebaseReady) return undefined;
    setLoading(true);
    services.getDocs(services.query(
      services.collection(services.db, "users", user.uid, "books"),
      services.orderBy("createdAt", "desc"),
    )).then((snapshot) => {
      if (active) setBooks(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    }).catch((loadError) => {
      if (active) setError(`Could not load your cloud shelf: ${loadError.message}`);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [firebaseReady, services, user]);

  useEffect(() => () => {
    if (reader?.url) URL.revokeObjectURL(reader.url);
  }, [reader?.url]);

  async function handleUpload(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    if (!services || !firebaseReady) {
      setError("Your Firebase account is still connecting. Try again shortly.");
      return;
    }
    if (!services.storage || !services.ref || !services.uploadBytesResumable) {
      setError("Firebase sign-in and your study library are available, but cloud PDF uploads are not configured. Add the Storage bucket to the GitHub Actions configuration and enable Firebase Storage; check its current billing requirements first.");
      return;
    }

    setError("");
    setUploadSummary("");
    const validFiles = [];
    const failures = [];
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
      failures.push(`${file.name}: larger than 20 MB`);
      continue;
      }
      if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) {
      failures.push(`${file.name}: not a PDF`);
      continue;
      }
      const signature = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
      if (signature !== "%PDF-") {
      failures.push(`${file.name}: invalid PDF signature`);
      continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) {
      setError(`No PDFs were uploaded. ${failures.join("; ")}`);
      return;
    }

    const totalBytes = validFiles.reduce((total, file) => total + file.size, 0);
    const totalMegabytes = (totalBytes / (1024 * 1024)).toFixed(1);
    if (!window.confirm(
      `Upload ${validFiles.length} PDF${validFiles.length === 1 ? "" : "s"} (${totalMegabytes} MB total) to your private Firebase shelf? Only upload files you own or are authorized to store. Firebase Storage may incur charges.`,
    )) return;

    setUploading(true);
    setProgress(0);
    let completedBytes = 0;
    const uploadedBooks = [];
    try {
      for (const [index, file] of validFiles.entries()) {
      setUploadFileProgress(`Uploading ${index + 1} of ${validFiles.length}: ${file.name}`);
      const id = crypto.randomUUID();
      const storagePath = `users/${user.uid}/books/${id}.pdf`;
      const fileRef = services.ref(services.storage, storagePath);
      try {
        const task = services.uploadBytesResumable(fileRef, file, { contentType: "application/pdf" });
        await new Promise((resolve, reject) => {
          task.on("state_changed", (snapshot) => {
            const percent = ((completedBytes + snapshot.bytesTransferred) / totalBytes) * 100;
            setProgress(Math.round(percent));
          }, reject, resolve);
        });
        const title = file.name.replace(/\.pdf$/i, "").trim().slice(0, 180) || "Untitled PDF";
        const metadata = {
          title,
          originalName: (file.webkitRelativePath || file.name).slice(0, 255),
          size: file.size,
          contentType: "application/pdf",
          storagePath,
          createdAt: new Date(),
        };
        try {
          await services.setDoc(services.doc(services.db, "users", user.uid, "books", id), {
            ...metadata,
            createdAt: services.serverTimestamp(),
          });
        } catch (metadataError) {
          try {
            await services.deleteObject(fileRef);
          } catch (cleanupError) {
            throw new Error(`${metadataError.message}. Uploaded file cleanup failed: ${cleanupError.message}`);
          }
          throw metadataError;
        }
        uploadedBooks.push({ id, ...metadata });
      } catch (uploadError) {
        failures.push(`${file.name}: ${uploadError.message}`);
      }
      completedBytes += file.size;
      setProgress(Math.round((completedBytes / totalBytes) * 100));
      }
      if (uploadedBooks.length) {
      setBooks((current) => [...uploadedBooks, ...current]);
      setUploadSummary(`${uploadedBooks.length} PDF${uploadedBooks.length === 1 ? "" : "s"} added to your private shelf.`);
      }
      if (failures.length) {
      setError(`${failures.length} file${failures.length === 1 ? " was" : "s were"} skipped or failed: ${failures.join("; ")}`);
      }
    } finally {
      setUploading(false);
      setUploadFileProgress("");
    }
  }

  async function openBook(book) {
    if (!services?.storage || !services.ref || !services.getBytes) {
      setError("Firebase Storage is not configured for this deployment. Your account and book library still work without PDF uploads.");
      return;
    }
    setError("");
    try {
      const bytes = await services.getBytes(services.ref(services.storage, book.storagePath), 20 * 1024 * 1024);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      setReader({ title: book.title, url });
    } catch (readError) {
      setError(`Could not open this private PDF: ${readError.message}`);
    }
  }

  async function removeBook(book) {
    if (!window.confirm(`Permanently remove "${book.title}" from your Firebase account? This cannot be undone.`)) return;
    if (!services?.storage || !services.ref || !services.deleteObject) {
      setError("Firebase Storage is not configured for this deployment, so this PDF cannot be removed safely.");
      return;
    }
    setError("");
    const fileRef = services.ref(services.storage, book.storagePath);
    try {
      try {
        await services.deleteObject(fileRef);
      } catch (storageError) {
        if (storageError.code !== "storage/object-not-found") throw storageError;
      }
      await services.deleteDoc(services.doc(services.db, "users", user.uid, "books", book.id));
      setBooks((current) => current.filter((entry) => entry.id !== book.id));
    } catch (removeError) {
      setError(`Could not completely remove this PDF: ${removeError.message}`);
    }
  }

  async function renameBook(event, book) {
    event.preventDefault();
    const title = draftTitle.trim().slice(0, 180);
    if (!title) {
      setError("Enter a title for this PDF.");
      return;
    }
    try {
      await services.updateDoc(services.doc(services.db, "users", user.uid, "books", book.id), { title });
      setBooks((current) => current.map((entry) => entry.id === book.id ? { ...entry, title } : entry));
      setEditingId("");
      setError("");
    } catch (renameError) {
      setError(`Could not rename this PDF: ${renameError.message}`);
    }
  }

  return (
    <section className="page-wrap cloud-shelf-page" data-reveal>
      <p className="eyebrow"><span className="eyebrow-dot" /> YOUR PRIVATE LIBRARY · FIREBASE CLOUD</p>
      <div className="page-heading-row"><h1>Your books.<br /><em>Wherever you are.</em></h1>
        <p>PDFs in this shelf are private to your account and available on your signed-in devices. Original files are kept as uploaded.</p></div>
      <section className="cloud-shelf-panel">
        <p className="cloud-storage-cost-note">Optional: private PDF storage requires Firebase's billing-enabled Blaze plan. Check current pricing and quotas before uploading; no-cost allowances are not a spending cap.</p>
        <div className="cloud-shelf-toolbar"><div><p className="eyebrow">PERSONAL FILES · PRIVATE BY DEFAULT</p>
          <h2>A place for your own<br /><em>reading.</em></h2></div>
          <div><div className="cloud-upload-actions">
            <button className="hero-cta" onClick={() => fileInput.current?.click()} disabled={!firebaseReady || uploading || !services?.storage}>
              {uploading ? `Uploading ${progress}%` : "Choose PDFs"} <span aria-hidden="true">＋</span></button>
            <button className="cloud-folder-button" onClick={() => folderInput.current?.click()} disabled={!firebaseReady || uploading || !services?.storage}>
              Choose folder</button>
            <input ref={fileInput} className="sr-only" type="file" accept=".pdf,application/pdf" multiple onChange={handleUpload} />
            <input ref={folderInput} className="sr-only" type="file" accept=".pdf,application/pdf" multiple webkitdirectory="" onChange={handleUpload} />
          </div><p className="cloud-shelf-limit">{services?.storage ? "Select multiple PDFs or a folder · 20 MB maximum per PDF" : "Cloud Storage not configured"}</p></div>
        </div>
        {uploading && <div className="cloud-upload-progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
          <span style={{ width: `${progress}%` }} /></div>}
        {uploading && <p className="cloud-upload-status" role="status">{uploadFileProgress}</p>}
        {uploadSummary && <p className="cloud-upload-success" role="status">{uploadSummary}</p>}
        {error && <p className="private-error" role="alert">{error}</p>}
        {loading ? <Skeleton className="shelf-skeleton" lines={3} />
          : books.length === 0 ? <EmptyState title="Your cloud shelf is empty.">Add a PDF you own or are authorized to store.</EmptyState>
            : <div className="private-book-list">{books.map((book) => (
              <article className="private-book-row" key={book.id}><span className="private-pdf-mark">PDF</span>
                <div className="private-book-title">{editingId === book.id
                  ? <form className="pdf-rename-form" onSubmit={(event) => renameBook(event, book)}>
                    <label className="sr-only" htmlFor={`pdf-title-${book.id}`}>PDF title</label>
                    <input id={`pdf-title-${book.id}`} value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} maxLength={180} autoFocus />
                    <button type="submit">Save</button><button type="button" onClick={() => setEditingId("")}>Cancel</button>
                  </form>
                  : <strong>{book.title}</strong>}
                  <small>{(book.size / (1024 * 1024)).toFixed(2)} MB · {new Date(book.createdAt?.toDate ? book.createdAt.toDate() : book.createdAt || Date.now()).toLocaleDateString()}</small></div>
                <button onClick={() => openBook(book)}>Read ↗</button>
                <button onClick={() => { setEditingId(book.id); setDraftTitle(book.title); }} aria-label={`Rename ${book.title}`}>Rename</button>
                <button onClick={() => removeBook(book)} aria-label={`Delete ${book.title}`} className="private-delete">Remove</button>
              </article>
            ))}</div>}
        <p className="cloud-shelf-footnote">Files are stored in your Firebase Storage bucket. Never upload a book unless you have permission to store it.</p>
      </section>
      {reader && <div className="reader-backdrop" role="presentation" onClick={(event) => {
        if (event.target === event.currentTarget) { URL.revokeObjectURL(reader.url); setReader(null); }
      }}>
        <section className="pdf-reader" role="dialog" aria-modal="true" aria-labelledby="reader-title">
          <header><h2 id="reader-title">{reader.title}</h2><a href={reader.url} download={`${reader.title}.pdf`}>Download PDF ↗</a>
            <button onClick={() => { URL.revokeObjectURL(reader.url); setReader(null); }} aria-label="Close PDF reader">×</button></header>
          <iframe title={`PDF reader: ${reader.title}`} src={reader.url} />
        </section></div>}
    </section>
  );
}

function AuthDialog({ services, currentUser, onClose, connectionError, onRetry, initialMode = "signin" }) {
  const [mode, setMode] = useState(currentUser?.isAnonymous ? "upgrade" : initialMode);
  const upgrading = currentUser?.isAnonymous;
  const dialogRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previousFocus = document.activeElement;
    dialog.querySelector("input:not(:disabled)")?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...dialog.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), a[href]',
      )];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!services) { setError("Firebase is still connecting. Try again in a moment."); return; }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signup" || mode === "upgrade") {
        const credential = mode === "upgrade"
            ? await services.linkWithCredential(
              currentUser,
              services.EmailAuthProvider.credential(email, password),
            )
            : await services.createUserWithEmailAndPassword(services.auth, email, password);
          if (displayName.trim()) await services.updateProfile(credential.user, { displayName: displayName.trim() });
        } else if (mode === "signin") {
          await services.signInWithEmailAndPassword(services.auth, email, password);
        } else {
        await services.sendPasswordResetEmail(services.auth, email);
        setNotice("If an account exists for this address, a password-reset link is on its way.");
      }
    } catch (authError) {
      const friendlyErrors = {
        "auth/invalid-email": "Enter a valid email address.",
        "auth/email-already-in-use": "That email already has an account. Sign in instead.",
        "auth/weak-password": "Choose a password with at least six characters.",
        "auth/invalid-credential": "The email or password is not correct.",
        "auth/user-disabled": "This account has been disabled.",
        "auth/too-many-requests": "Too many attempts. Wait a little, then try again.",
        "auth/operation-not-allowed": "Enable Email/Password sign-in in Firebase Authentication first.",
        "auth/popup-blocked": "Allow pop-ups for this site and try Google sign-in again.",
        "auth/invalid-api-key": "Firebase rejected this app's API key. Check the GitHub Actions web-app configuration and rerun the Pages deployment.",
        "auth/unauthorized-domain": `Add ${window.location.hostname} to Firebase Authentication → Settings → Authorized domains, then redeploy.`,
        "auth/network-request-failed": "Firebase could not be reached. Check your connection and try again.",
        "auth/popup-closed-by-user": "The Google sign-in window was closed before sign-in completed.",
        "auth/account-exists-with-different-credential": "This email already uses another sign-in method. Sign in with that method first.",
      };
      setError(friendlyErrors[authError.code] || `Could not complete sign-in: ${authError.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!services) { setError("Firebase is still connecting. Try again in a moment."); return; }
    setBusy(true);
    setError("");
    try {
      const provider = new services.GoogleAuthProvider();
      if (currentUser?.isAnonymous) await services.linkWithPopup(currentUser, provider);
      else await services.signInWithPopup(services.auth, provider);
    } catch (authError) {
      setError(authError.code === "auth/unauthorized-domain"
        ? `Add ${window.location.hostname} to Firebase Authentication → Settings → Authorized domains, then try again.`
        : authError.code === "auth/popup-blocked"
          ? "Allow pop-ups for this site and try Google sign-in again."
          : authError.code === "auth/invalid-api-key"
            ? "Firebase rejected this app's API key. Check the GitHub Actions web-app configuration and rerun the Pages deployment."
            : authError.code === "auth/network-request-failed"
              ? "Firebase could not be reached. Check your connection and try again."
          : `Google sign-in failed: ${authError.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="auth-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="auth-heading">
        <button className="auth-close" onClick={onClose} aria-label="Close sign-in">×</button>
        <p className="eyebrow">YOUR SHELF · FREE ACCOUNTS</p>
        <h2 id="auth-heading">{mode === "signup" || mode === "upgrade"
          ? upgrading ? "Save your anonymous shelf." : "Make room to grow."
          : mode === "reset" ? "A fresh start." : "Welcome back."}</h2>
        <p className="auth-intro">A free account opens your study library, syncs saved books and progress, and gives you a private workspace. PDF uploads are optional and require Firebase Storage.</p>
        {!services && firebaseConfigured && connectionError && <div className="auth-connection-error" role="alert">
          <p>{connectionError}</p>
          <button type="button" onClick={onRetry}>Retry Firebase connection</button>
        </div>}
        {mode !== "reset" && <button className="google-sign-in" onClick={handleGoogleSignIn} disabled={busy || !services}>
          <span aria-hidden="true">G</span> {upgrading ? "Link Google to your shelf" : "Continue with Google"}</button>}
        {mode !== "reset" && <div className="auth-separator"><span>OR WITH EMAIL</span></div>}
        <form onSubmit={handleSubmit} className="auth-form">
          {(mode === "signup" || mode === "upgrade") && <label>Your name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="name" maxLength={70} /></label>}
          <label>Email address<input value={email} onChange={(event) => setEmail(event.target.value)}
            type="email" autoComplete="email" required /></label>
          {mode !== "reset" && mode !== "upgrade" && <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)}
            type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={6} required /></label>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-success" role="status">{notice}</p>}
          {mode === "upgrade" && <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)}
            type="password" autoComplete="new-password" minLength={6} required /></label>}
          <button className="primary-submit" type="submit" disabled={busy || !firebaseConfigured || !services}>
            {busy ? "One moment…" : !services && firebaseConfigured ? "Connecting to Firebase…" : mode === "signup" ? "Create your free account" : mode === "upgrade" ? "Link and save my shelf" : mode === "reset" ? "Send reset link" : "Sign in"}
          </button>
        </form>
        <div className="auth-switches">
          {mode === "signin" && <><button onClick={() => { setMode("reset"); setError(""); setNotice(""); }}>Forgot password?</button>
            <span>New here?</span><button onClick={() => { setMode("signup"); setError(""); setNotice(""); }}>Create a free account</button></>}
          {(mode === "signup" || mode === "upgrade") && <><span>Already have an account?</span>
            {!upgrading && <button onClick={() => { setMode("signin"); setError(""); setNotice(""); }}>Sign in</button>}</>}
          {mode === "reset" && <button onClick={() => { setMode("signin"); setError(""); setNotice(""); }}>Back to sign in</button>}
        </div>
        {!firebaseConfigured && <p className="auth-setup-note">This deployment was built without Firebase configuration{missingFirebaseConfig.length ? ` (${missingFirebaseConfig.join(", ")})` : ""}. Add the missing values to this repository's Actions variables or secrets and rerun the Pages workflow. For local development, set them in .env.local.</p>}
      </section>
    </div>
  );
}

function AccountPage({ user, firebaseReady, onSignOut, onSyncRetry, theme, setTheme, onDeleteAccount }) {
  const { trackFilter, setTrackFilter, persistProfile, updateDisplayName } = useStudy();
  const [name, setName] = useState(user?.displayName || "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    setStatus("");
    setError("");
    try {
      if (name.trim() !== (user.displayName || "")) {
        await updateDisplayName(name.trim());
      }
      setStatus("Your profile details are saved.");
    } catch (saveError) {
      setError(`Could not update your profile: ${saveError.message}`);
    }
  }

  async function confirmDeleteAccount(event) {
    event.preventDefault();
    if (!window.confirm("Permanently delete your Study Shelf account, saved books, progress, and PDFs? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      await onDeleteAccount(password);
    } catch (deleteError) {
      setError(`Account deletion did not complete: ${deleteError.message}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="page-wrap account-page">
      <p className="eyebrow"><span className="eyebrow-dot" /> YOUR ACCOUNT · YOUR SETTINGS</p>
      <div className="page-heading-row"><h1>Your account.<br /><em>Your own pace.</em></h1>
        <p>Manage your sign-in and see what is connected to your private Study Shelf.</p></div>
      <div className="account-status-card"><span className="account-avatar">{(user?.displayName || user?.email || "S").slice(0, 1).toUpperCase()}</span>
        <div><span>SIGNED IN</span><h2>{user?.displayName || user?.email}</h2><p>{user?.email}</p>
          <small>{firebaseReady ? "Your study profile is connected to Firebase." : "Connecting your account…"}</small></div>
        <button onClick={onSignOut}>Sign out</button></div>
      <form className="settings-card" onSubmit={saveProfile}>
        <p className="eyebrow">PERSONALIZE YOUR SPACE</p><h2>Make it feel like yours.</h2>
        <Input label="Display name" value={name} onChange={(event) => setName(event.target.value)} maxLength={70} autoComplete="name" />
        <label>Preferred study path<select value={tracks.some((track) => track.id === trackFilter) ? trackFilter : "PCM"}
          onChange={(event) => {
            const nextStream = event.target.value;
            setTrackFilter(nextStream);
            void persistProfile({ preferredStream: nextStream });
          }}>
          {tracks.map((track) => <option value={track.id} key={track.id}>{track.name}</option>)}
        </select></label>
        <div className="settings-theme"><span>Reading atmosphere</span>
          <ThemeToggle theme={theme} onChange={setTheme} /></div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {status && <p className="auth-success" role="status">{status}</p>}
        <button type="submit" className="primary-submit">Save display name</button>
      </form>
      <div className="account-destination-grid">
        <Link to="/dashboard"><span>01 / YOUR SPACE</span><strong>Workspace ↗</strong></Link>
        <Link to="/dashboard/shelf"><span>02 / YOUR BOOKS</span><strong>Private cloud shelf ↗</strong></Link>
        <Link to="/dashboard/progress"><span>03 / YOUR PROGRESS</span><strong>Study map ↗</strong></Link>
      </div>
      <button className="account-retry" onClick={onSyncRetry}>Retry Firebase connection ↗</button>
      <p className="curriculum-caution">Your files and learning progress are protected by this project's Firebase security rules. To review deployment and storage setup, open <strong>SETUP.md</strong> in the project source.</p>
      <details className="account-delete">
        <summary>Delete my account and data</summary>
        <form onSubmit={confirmDeleteAccount}>
          <p>Deletion removes your saved reading list, topic progress, PDF files, and Firebase sign-in. Firebase may ask you to sign in again before it permits this sensitive action.</p>
          {user?.providerData?.some((provider) => provider.providerId === "password") &&
            <label>Confirm with your password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>}
          {user?.providerData?.some((provider) => provider.providerId === "google.com") &&
            <p>Google accounts will confirm their identity in a Google sign-in window.</p>}
          <button className="account-delete-button" type="submit" disabled={deleting}>{deleting ? "Deleting account…" : "Permanently delete account"}</button>
        </form>
      </details>
    </section>
  );
}

function PageIntro({ eyebrow, title, description }) {
  return <section className="info-hero page-wrap" data-reveal>
    <p className="eyebrow"><span className="eyebrow-dot" /> {eyebrow}</p>
    <h1>{title}</h1>
    <p>{description}</p>
  </section>;
}

function InfoPage({ kind }) {
  const content = {
    about: {
      eyebrow: "WHY THIS SHELF EXISTS",
      title: <>A little more room<br /><em>to understand.</em></>,
      description: "Study Shelf brings trusted reading, a calm study map, and your own learning space together—without pretending that learning can be reduced to a streak.",
      sections: [
        ["Find a reliable starting point", "Discover official NCERT textbooks and books that their publishers make openly available. Each reading link takes you to the source."],
        ["Keep a thread, not a score", "Save titles and use the syllabus checklist to remember where you want to return. Your progress is personal, and it is not an exam prediction."],
        ["Keep private files private", "The optional PDF shelf is for documents you own or have permission to store. Files are restricted to the signed-in account by Firebase rules."],
      ],
    },
    privacy: {
      eyebrow: "CLEAR BY DESIGN",
      title: <>Your study life<br /><em>belongs to you.</em></>,
      description: "Study Shelf uses Firebase for account and cloud features. Review the following data practices before creating an account or uploading a file.",
      sections: [
        ["Account and profile", "Firebase Authentication processes sign-in details. Firestore stores a signed-in user’s saved book identifiers, completed topic identifiers, private per-book reading percentages, preferred study path, and focus/day theme so these preferences can sync between devices. Guest bookmarks and topic progress stay in this browser’s local storage."],
        ["Personal PDF shelf", "If you enable Firebase Storage, PDF bytes and their title, filename, size, storage path, and upload date are stored under your account. The shelf is optional; do not upload files you are not authorized to store."],
        ["Analytics and external sources", "Firebase Analytics loads only when a measurement ID is configured and the browser reports support. External book links are provided by publishers or official sources, which have their own privacy policies."],
        ["Your choices", "You can sign out, remove saved books, remove PDFs, and delete your account from workspace settings. Account deletion requires recent authentication and removes this account’s known Firestore and Storage data before deleting its Firebase sign-in."],
      ],
    },
    terms: {
      eyebrow: "A FEW SHARED EXPECTATIONS",
      title: <>Learn freely.<br /><em>Respect the source.</em></>,
      description: "Use Study Shelf as a guide to learning and discovery. It is not a substitute for official curriculum advice or professional guidance.",
      sections: [
        ["Respect copyright", "Study Shelf links to official or openly available sources and does not authorize redistribution of copyrighted books. Upload only material you own or have explicit permission to store."],
        ["Use your account responsibly", "Keep your sign-in secure, provide accurate account information, and do not attempt to access another person’s files or disrupt the service."],
        ["Availability and accuracy", "External sources, curricula, and Firebase features can change. Check the original publisher and current education-board materials for authoritative information."],
        ["Cloud costs", "Optional Firebase Storage requires a billing-enabled plan. The project owner is responsible for monitoring usage and any applicable charges."],
      ],
    },
  }[kind];

  return <div className="info-page">
    <PageIntro eyebrow={content.eyebrow} title={content.title} description={content.description} />
    <section className="info-sections page-wrap">
      {content.sections.map(([title, text], index) => <Card className="info-card" key={title}>
        <span>0{index + 1} / {kind.toUpperCase()}</span><h2>{title}</h2><p>{text}</p>
      </Card>)}
      {kind === "about" && <Link className="hero-cta" to="/library">Explore the open library <span>↗</span></Link>}
    </section>
  </div>;
}

function BookDetailPage() {
  const { id } = useParams();
  const { savedIds, toggleSaved } = useStudy();
  const book = [...publicTextbooks, ...openBooks].find((item) => item.id === id);
  if (!book) return <NotFoundPage />;
  const sourceUrl = book.publicPath ? `${import.meta.env.BASE_URL}${book.publicPath}` : book.href;
  const saved = savedIds.includes(book.id);
  return <section className="book-detail page-wrap" data-reveal>
    <Link className="back-link" to="/library">← Back to the open library</Link>
    <div className="book-detail-grid">
      <div className={`book-detail-cover cover-${book.color}`} aria-hidden="true">
        <span>{book.publisher}</span><strong>{book.cover}</strong><i>✳</i><small>{book.level}</small>
      </div>
      <div className="book-detail-copy">
        <p className="eyebrow"><span className="eyebrow-dot" /> {book.type === "official" ? "OFFICIAL SOURCE" : "OPEN / THIRD-PARTY RESOURCE"} · {getBookSubjects(book).join(" · ").toUpperCase()}</p>
        <h1>{book.title}</h1>        <p className="book-detail-author">By {book.author} · {book.level} · {book.track} · {book.language || "Language not specified"}</p>
        <p className="book-detail-description">{book.description}</p>
        <div className="book-detail-actions">
          <a className="hero-cta" href={sourceUrl} target="_blank" rel="noopener noreferrer">{book.source || "Open the publisher source"} <span>↗</span></a>
          <button className={`bookmark-button ${saved ? "is-saved" : ""}`} onClick={() => toggleSaved(book)} aria-pressed={saved}>
            {saved ? "Saved to your shelf ✳" : "Save this book ＋"}
          </button>
        </div>
        <aside className="source-disclaimer"><strong>Opens on an external website</strong><p>Study Shelf does not host this book. Confirm the publisher, license, language, and current availability on the source website before reading or downloading.</p>
          <span>{book.publisher} · {book.href}</span></aside>
      </div>
    </div>
    <section className="related-books"><div className="dashboard-section-heading"><div><p className="eyebrow">KEEP FOLLOWING THE THREAD</p><h2>More from this <em>shelf.</em></h2></div><Link to="/library">Browse everything ↗</Link></div>
      <div className="book-grid">{[...publicTextbooks, ...openBooks].filter((item) => item.id !== book.id && item.track === book.track).slice(0, 3)
        .map((item, index) => <BookCard key={item.id} book={item} saved={savedIds.includes(item.id)} onToggle={toggleSaved} style={{ "--card-index": index }} />)}</div>
    </section>
  </section>;
}

function NotFoundPage() {
  return <section className="not-found page-wrap"><p className="eyebrow">THIS CHAPTER ISN’T IN THE BOOK</p>
    <h1>Try another<br /><em>page.</em></h1><Link className="hero-cta" to="/">Go to the home page ↗</Link></section>;
}

function HomeRoute() {
  const study = useStudy();
  const navigate = useNavigate();
  return <HomePage savedCount={study.savedIds.length} savedIds={study.savedIds} onToggleSaved={study.toggleSaved}
    completedCount={study.completedCount} user={study.user}
    onChooseTrack={(stream) => {
      study.setTrackFilter(stream);
      navigate("/dashboard/progress");
    }} onSearchSources={(query) => navigate(`/library?q=${encodeURIComponent(query)}`)} />;
}

function LibraryRoute() {
  const study = useStudy();
  return <BookPage savedIds={study.savedIds} onToggleSaved={study.toggleSaved} />;
}

function AuthRoute({ mode }) {
  const study = useStudy();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || "/dashboard";
  if (study.user && !study.user.isAnonymous) return <Navigate to={from} replace />;
  return <div className="auth-page">
    <div className="auth-page-note"><p className="eyebrow">YOUR SPACE, YOUR PACE</p><h1>A shelf that<br /><em>knows your place.</em></h1>
      <p>Save a good source. Keep a little progress. Come back when you’re ready.</p></div>
    <AuthDialog services={study.firebaseServices} currentUser={study.user} connectionError={study.syncError}
      onRetry={study.retryFirebase} initialMode={mode}
      onClose={() => navigate("/", { replace: true })}
    />
  </div>;
}

function RequireAuth() {
  const { user, firebaseReady } = useStudy();
  const location = useLocation();
  if (firebaseConfigured && !firebaseReady) return <div className="page-loading" role="status">Connecting to your private shelf…</div>;
  if (!user || user.isAnonymous) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

function DashboardLayout() {
  const { user, onSignOut, theme, setTheme } = useStudy();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const navItems = [
    ["/dashboard", "Overview", "⌂", true],
    ["/dashboard/library", "My library", "▤"],
    ["/dashboard/progress", "Study progress", "↗"],
    ["/dashboard/shelf", "PDF shelf", "＋"],
    ["/dashboard/settings", "Settings", "⚙"],
  ];
  return <div className="dashboard-shell">
    <aside className="dashboard-sidebar" aria-label="Workspace navigation">
      <Link to="/dashboard" className="sidebar-brand"><span className="brand-icon">s.</span><span>your workspace<small>STUDY SHELF</small></span></Link>
      <p className="sidebar-label">YOUR SPACE</p>
      <nav>{navItems.map(([path, label, icon, exact]) => <Link key={path} to={path}
        className={`sidebar-link ${location.pathname === path || (!exact && location.pathname.startsWith(`${path}/`)) ? "is-active" : ""}`}
        aria-current={location.pathname === path ? "page" : undefined}><span aria-hidden="true">{icon}</span>{label}</Link>)}</nav>
      <div className="sidebar-bottom"><Link to="/library">Discover books <span>↗</span></Link>
        <p><span className="eyebrow-dot" /> PRIVATE TO YOUR ACCOUNT</p></div>
    </aside>
    <div className="dashboard-main">
      <header className="dashboard-topbar">
        <form className="workspace-search" role="search" onSubmit={(event) => {
          event.preventDefault();
          navigate(`/library?q=${encodeURIComponent(query.trim())}`);
        }}><label className="sr-only" htmlFor="workspace-search">Search books and subjects</label>
          <input id="workspace-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search books, subjects, ideas…" />
          <button type="submit" aria-label="Search">⌕</button></form>
        <div className="workspace-tools">
          <ThemeToggle theme={theme} onChange={setTheme} />
          <Link className="workspace-profile" to="/dashboard/settings" aria-label={`Settings for ${user?.displayName || user?.email}`}>
            {(user?.displayName || user?.email || "S").slice(0, 1).toUpperCase()}</Link>
          <button className="workspace-signout" onClick={onSignOut}>Sign out</button>
        </div>
      </header>
      <div className="dashboard-content"><Outlet /></div>
    </div>
    <nav className="dashboard-mobile-nav" aria-label="Workspace navigation">
      {navItems.map(([path, label, icon]) => <Link key={path} to={path}
        aria-current={location.pathname === path ? "page" : undefined}><span>{icon}</span>{label}</Link>)}
    </nav>
  </div>;
}

function DashboardOverviewRoute() {
  const { user, savedIds, completedIds, completedCount, firebaseServices, firebaseReady } = useStudy();
  const [recentPdfs, setRecentPdfs] = useState([]);
  const [pdfsLoading, setPdfsLoading] = useState(true);
  const [pdfError, setPdfError] = useState("");
  const totalUnits = courses.reduce((sum, course) => sum + course.units.length, 0);
  const completion = totalUnits ? Math.round((completedCount / totalUnits) * 100) : 0;
  const activeSubjects = [...new Set(courses.filter((course) => course.units.some((unit) => completedIds.includes(unit.id)))
    .map((course) => course.subject))];

  useEffect(() => {
    let active = true;
    if (!firebaseServices || !user || !firebaseReady) return undefined;
    firebaseServices.getDocs(firebaseServices.query(
      firebaseServices.collection(firebaseServices.db, "users", user.uid, "books"),
      firebaseServices.orderBy("createdAt", "desc"),
      firebaseServices.limit(3),
    )).then((snapshot) => {
      if (active) setRecentPdfs(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    }).catch((error) => {
      if (active) setPdfError(`Recent PDFs could not be loaded: ${error.message}`);
    }).finally(() => {
      if (active) setPdfsLoading(false);
    });
    return () => { active = false; };
  }, [firebaseReady, firebaseServices, user]);

  return <>
    <DashboardPage user={user} savedCount={savedIds.length} completedIds={completedIds} completedCount={completedCount} />
    <section className="dashboard-insights page-wrap">
      <div className="dashboard-section-heading"><div><p className="eyebrow">YOUR MOMENTUM</p><h2>Small steps add <em>up.</em></h2></div>
        <Link to="/dashboard/progress">Open study progress ↗</Link></div>
      <div className="insight-grid">
        <Card className="insight-card"><span>OVERALL STUDY MAP</span>
          <div className="progress-ring" role="img" aria-label={`${completion}% of study topics complete`}
            style={{ "--progress-angle": `${completion * 3.6}deg` }}><span>{completion}%</span></div>
          <ProgressBar value={completion} label="Overall study map completion" />
          <p>{completedCount} of {totalUnits} learning points marked complete.</p></Card>
        <Card className="insight-card"><span>SUBJECTS IN MOTION</span><strong>{activeSubjects.length.toString().padStart(2, "0")}</strong>
          <p>{activeSubjects.length ? activeSubjects.join(" · ") : "Your first subject is waiting for you."}</p></Card>
        <Card className="insight-card insight-recent"><span>RECENT PRIVATE PDFs</span>
          {pdfError ? <Toast variant="error">{pdfError}</Toast>
            : pdfsLoading ? <Skeleton lines={2} />
              : recentPdfs.length ? recentPdfs.map((book) => <Link key={book.id} to="/dashboard/shelf">
                <strong>{book.title}</strong><small>{(book.size / (1024 * 1024)).toFixed(2)} MB · Open your private shelf ↗</small></Link>)
                : <EmptyState title="No personal PDFs yet.">Your saved books and progress work without cloud uploads.</EmptyState>}
        </Card>
      </div>
    </section>
  </>;
}

function DashboardLibraryRoute() {
  const { savedIds, toggleSaved } = useStudy();
  return <BookPage savedIds={savedIds} onToggleSaved={toggleSaved} privateLibrary />;
}

function DashboardProgressRoute() {
  const { trackFilter, setTrackFilter, completedIds, toggleUnit, user, navigateToLogin, savedIds, bookProgress, updateBookProgress } = useStudy();
  return <>
    <TopicPage trackFilter={trackFilter} onTrackChange={setTrackFilter} completedIds={completedIds}
      onToggle={toggleUnit} firebaseUser={user} onSignIn={navigateToLogin} />
    <BookProgressPanel savedIds={savedIds} records={bookProgress} onChange={updateBookProgress} />
  </>;
}

function BookProgressPanel({ savedIds, records, onChange }) {
  const savedBooks = [...publicTextbooks, ...openBooks].filter((book) => savedIds.includes(book.id));
  const recent = savedBooks.filter((book) => records[book.id]?.updatedAt)
    .sort((a, b) => new Date(records[b.id].updatedAt?.toDate?.() || records[b.id].updatedAt)
      - new Date(records[a.id].updatedAt?.toDate?.() || records[a.id].updatedAt));
  return <section className="book-progress-panel page-wrap">
    <div className="dashboard-section-heading"><div><p className="eyebrow">YOUR READING PROGRESS</p>
      <h2>Read a little.<br /><em>Mark your place.</em></h2></div>
      <p>Update a saved book’s progress whenever it feels useful. This is a private manual note, not a reading tracker.</p></div>
    {!savedBooks.length ? <EmptyState title="Save a book to track your reading.">
      Your book-level progress appears here after you add a title to your library.
    </EmptyState> : <>
      {recent.length > 0 && <p className="reading-activity-note">RECENTLY UPDATED · {recent.slice(0, 3).map((book) => book.title).join(" · ")}</p>}
      <div className="book-progress-list">{savedBooks.map((book) => {
        const percent = records[book.id]?.percent || 0;
        return <article className="book-progress-row" key={book.id}>
          <div className="book-progress-meta"><span>{book.subject} · {book.level}</span><strong>{book.title}</strong></div>
          <label><span className="sr-only">Reading progress for {book.title}</span>
            <input type="range" min="0" max="100" step="5" value={percent}
              onChange={(event) => onChange(book.id, Number(event.target.value))} aria-valuetext={`${percent}% read`} />
          </label>
          <ProgressBar value={percent} label={`${book.title} reading progress`} />
          <strong className="book-progress-value">{percent}%</strong>
        </article>;
      })}</div>
    </>}
  </section>;
}

function DashboardShelfRoute() {
  const { user, firebaseServices, firebaseReady } = useStudy();
  return <CloudShelfPage user={user} services={firebaseServices} firebaseReady={firebaseReady} />;
}

function SettingsRoute() {
  const study = useStudy();
  return <AccountPage user={study.user} firebaseReady={study.firebaseReady} onSignOut={study.onSignOut}
    onSyncRetry={study.retryFirebase} theme={study.theme} setTheme={study.setTheme}
    onDeleteAccount={study.deleteAccount} />;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const guestProfile = useMemo(readGuestProfile, []);
  const [savedIds, setSavedIds] = useState(guestProfile.savedBookIds);
  const [completedIds, setCompletedIds] = useState(guestProfile.completedUnitIds);
  const [bookProgress, setBookProgress] = useState({});
  const [user, setUser] = useState(null);
  const [, setDisplayNameRefresh] = useState("");
  const [firebaseServices, setFirebaseServices] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(!firebaseConfigured);
  const [syncError, setSyncError] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("study-shelf-theme") === "day" ? "day" : "focus";
    } catch (error) {
      console.error("Could not read your theme preference.", error);
      return "focus";
    }
  });
  const savedIdsRef = useRef(savedIds);
  const completedIdsRef = useRef(completedIds);
  const guestProfileRef = useRef(guestProfile);
  savedIdsRef.current = savedIds;
  completedIdsRef.current = completedIds;

  const allUnitIds = useMemo(() => courses.flatMap((course) => course.units.map((unit) => unit.id)), []);
  const completedCount = completedIds.filter((id) => allUnitIds.includes(id)).length;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("study-shelf-theme", theme);
    } catch (error) {
      console.error("Could not save your theme preference.", error);
    }
    if (user && firebaseServices && firebaseReady) void persistProfile({ theme });
  }, [firebaseReady, firebaseServices, theme, user]);

  useEffect(() => {
    try {
      writeGuestProfile({ savedBookIds: savedIds, completedUnitIds: completedIds });
    } catch (error) {
      setSyncError(error.message);
    }
  }, [completedIds, savedIds]);

  useEffect(() => {
    if (!firebaseConfigured) return undefined;
    let active = true;
    let unsubscribe;

    loadFirebase().then((services) => {
      if (!active) return;
      setFirebaseServices(services);
      unsubscribe = services.onAuthStateChanged(services.auth, async (currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setDisplayNameRefresh(currentUser?.displayName || "");
        if (!currentUser) {
          setBookProgress({});
          setFirebaseReady(true);
          return;
        }

        setBookProgress({});
        setFirebaseReady(false);
        setSyncError("");
        const profileRef = services.doc(services.db, "users", currentUser.uid);
        try {
          const profileSnapshot = await services.getDoc(profileRef);
          const cloudProfile = profileSnapshot.exists() ? profileSnapshot.data() : {};
          if (cloudProfile.theme === "day" || cloudProfile.theme === "focus") setTheme(cloudProfile.theme);
          if (tracks.some((track) => track.id === cloudProfile.preferredStream)) setTrackFilter(cloudProfile.preferredStream);
          const legacySavedSnapshot = await services.getDocs(
            services.collection(services.db, "users", currentUser.uid, "savedBooks"),
          );
          const bookProgressSnapshot = await services.getDocs(
            services.collection(services.db, "users", currentUser.uid, "bookProgress"),
          );
          const nextBookProgress = Object.fromEntries(bookProgressSnapshot.docs.map((entry) => [entry.id, entry.data()]));
          const legacySavedIds = legacySavedSnapshot.docs.map((savedBook) => savedBook.id);
          const nextSaved = [...new Set([
            ...(Array.isArray(cloudProfile.savedBookIds) ? cloudProfile.savedBookIds : []),
            ...legacySavedIds,
            ...savedIdsRef.current,
          ])];
          const nextCompleted = [...new Set([...(cloudProfile.completedUnitIds || []), ...completedIdsRef.current])];
          if (!active) return;
          setSavedIds(nextSaved);
          setCompletedIds(nextCompleted);
          setBookProgress(nextBookProgress);
          writeGuestProfile({ savedBookIds: nextSaved, completedUnitIds: nextCompleted });
          await services.setDoc(profileRef, {
            savedBookIds: nextSaved,
            completedUnitIds: nextCompleted,
            updatedAt: services.serverTimestamp(),
          }, { merge: true });
          if (active) setFirebaseReady(true);
        } catch (error) {
          if (!active) return;
          setSyncError(`Your cloud shelf could not be loaded or merged: ${error.message} Your local books are still available.`);
          setFirebaseReady(true);
        }
      }, (error) => {
        if (!active) return;
        setSyncError(`Firebase authentication failed: ${error.message}`);
        setFirebaseReady(true);
      });
    }).catch((error) => {
      if (!active) return;
      setSyncError(`Firebase could not be initialized: ${error.message}`);
      setFirebaseReady(true);
    });

    return () => { active = false; unsubscribe?.(); };
  }, [connectionAttempt]);

  async function persistProfile(patch) {
    if (!firebaseConfigured || !user || !firebaseServices) return;
    if (!firebaseReady) {
      setSyncError("Your Firebase profile is still syncing. Try again shortly.");
      return;
    }
    try {
      await firebaseServices.setDoc(
        firebaseServices.doc(firebaseServices.db, "users", user.uid),
        { ...patch, updatedAt: firebaseServices.serverTimestamp() },
        { merge: true },
      );
      setSyncError("");
    } catch (error) {
      setSyncError(`Could not sync this change: ${error.message} It is still saved in this browser.`);
    }
  }

  function toggleSaved(book) {
    const next = savedIds.includes(book.id)
      ? savedIds.filter((id) => id !== book.id)
      : [...savedIds, book.id];
    setSavedIds(next);
    if (!user) guestProfileRef.current = { ...guestProfileRef.current, savedBookIds: next };
    void persistProfile({ savedBookIds: next });
  }

  function toggleUnit(unitId) {
    const next = completedIds.includes(unitId)
      ? completedIds.filter((id) => id !== unitId)
      : [...completedIds, unitId];
    setCompletedIds(next);
    if (!user) guestProfileRef.current = { ...guestProfileRef.current, completedUnitIds: next };
    void persistProfile({ completedUnitIds: next });
  }

  async function updateBookProgress(bookId, percent) {
    if (!user || !firebaseServices || !firebaseReady) {
      setSyncError("Your Firebase account is still connecting. Try again shortly.");
      return;
    }
    const safePercent = Math.min(100, Math.max(0, Math.round(percent / 5) * 5));
    const previous = bookProgress[bookId];
    setBookProgress((current) => ({ ...current, [bookId]: { percent: safePercent, updatedAt: new Date() } }));
    try {
      await firebaseServices.setDoc(
        firebaseServices.doc(firebaseServices.db, "users", user.uid, "bookProgress", bookId),
        { percent: safePercent, updatedAt: firebaseServices.serverTimestamp() },
      );
      setSyncError("");
    } catch (error) {
      setBookProgress((current) => {
        const next = { ...current };
        if (previous) next[bookId] = previous;
        else delete next[bookId];
        return next;
      });
      setSyncError(`Could not save reading progress: ${error.message}`);
    }
  }

  async function handleSignOut() {
    if (!firebaseServices) return;
    const guestProfileAtSignOut = guestProfileRef.current;
    try {
      await firebaseServices.signOut(firebaseServices.auth);
      setSavedIds(guestProfileAtSignOut.savedBookIds);
      setCompletedIds(guestProfileAtSignOut.completedUnitIds);
      setSyncError("");
    } catch (error) {
      setSyncError(`Could not sign out: ${error.message}`);
    }
  }

  async function deleteAccount(password) {
    if (!user || !firebaseServices) throw new Error("Your Firebase account is not ready.");
    const providers = user.providerData.map((provider) => provider.providerId);
    if (providers.includes("password")) {
      if (!password) throw new Error("Enter your password to confirm account deletion.");
      const credential = firebaseServices.EmailAuthProvider.credential(user.email, password);
      await firebaseServices.reauthenticateWithCredential(user, credential);
    } else if (providers.includes("google.com")) {
      await firebaseServices.reauthenticateWithPopup(user, new firebaseServices.GoogleAuthProvider());
    } else {
      throw new Error("This sign-in provider does not yet support secure account deletion in the app.");
    }

    const booksRef = firebaseServices.collection(firebaseServices.db, "users", user.uid, "books");
    const booksSnapshot = await firebaseServices.getDocs(booksRef);
    for (const bookSnapshot of booksSnapshot.docs) {
      const book = bookSnapshot.data();
      if (book.storagePath) {
        if (!firebaseServices.storage || !firebaseServices.ref || !firebaseServices.deleteObject) {
          throw new Error("This account has private PDFs, but Firebase Storage is not configured in this deployment. Configure the Storage bucket, then retry deletion so those files can be removed safely.");
        }
        try {
          await firebaseServices.deleteObject(firebaseServices.ref(firebaseServices.storage, book.storagePath));
        } catch (storageError) {
          if (storageError.code !== "storage/object-not-found") throw storageError;
        }
      }
      await firebaseServices.deleteDoc(bookSnapshot.ref);
    }

    const legacySavedRef = firebaseServices.collection(firebaseServices.db, "users", user.uid, "savedBooks");
    const legacySavedSnapshot = await firebaseServices.getDocs(legacySavedRef);
    for (const savedBook of legacySavedSnapshot.docs) await firebaseServices.deleteDoc(savedBook.ref);
    const bookProgressRef = firebaseServices.collection(firebaseServices.db, "users", user.uid, "bookProgress");
    const bookProgressSnapshot = await firebaseServices.getDocs(bookProgressRef);
    for (const record of bookProgressSnapshot.docs) await firebaseServices.deleteDoc(record.ref);
    await firebaseServices.deleteDoc(firebaseServices.doc(firebaseServices.db, "users", user.uid));
    await firebaseServices.deleteUser(user);
    setSavedIds([]);
    setCompletedIds([]);
    guestProfileRef.current = { savedBookIds: [], completedUnitIds: [] };
    writeGuestProfile(guestProfileRef.current);
    navigate("/", { replace: true });
  }

  async function updateDisplayName(displayName) {
    if (!user || !firebaseServices) throw new Error("Your Firebase account is not ready.");
    await firebaseServices.updateProfile(user, { displayName });
    setDisplayNameRefresh(displayName);
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    const titles = {
      "/": "Study Shelf — Find your next great book",
      "/library": "Discover books — Study Shelf",
      "/about": "About — Study Shelf",
      "/privacy": "Privacy — Study Shelf",
      "/terms": "Terms — Study Shelf",
      "/login": "Sign in — Study Shelf",
      "/signup": "Create your workspace — Study Shelf",
      "/dashboard": "Your workspace — Study Shelf",
      "/dashboard/library": "Your library — Study Shelf",
      "/dashboard/progress": "Study progress — Study Shelf",
      "/dashboard/shelf": "Your PDF shelf — Study Shelf",
      "/dashboard/settings": "Workspace settings — Study Shelf",
    };
    document.title = titles[location.pathname] || (location.pathname.startsWith("/book/") ? "Book details — Study Shelf" : "Page not found — Study Shelf");
  }, [location.pathname]);

  const studyValue = {
    user, firebaseServices, firebaseReady, syncError, savedIds, completedIds, bookProgress, completedCount,
    trackFilter, setTrackFilter, toggleSaved, toggleUnit, onSignOut: handleSignOut,
    deleteAccount, persistProfile, updateBookProgress,
    updateDisplayName,
    retryFirebase: () => { setSyncError(""); setFirebaseReady(false); setConnectionAttempt((value) => value + 1); },
    theme, setTheme, navigateToLogin: () => navigate("/login"),
  };

  useEffect(() => {
    if (!location.hash.startsWith("#/")) return;
    const [legacyPath, query = ""] = location.hash.slice(1).split("?");
    const redirects = {
      "/": "/",
      "/dashboard": "/dashboard",
      "/topics": "/dashboard/progress",
      "/library": "/library",
      "/saved": "/dashboard/library",
      "/shelf": "/dashboard/shelf",
      "/account": "/dashboard/settings",
    };
    const destination = redirects[legacyPath];
    if (destination) navigate(`${destination}${query ? `?${query}` : ""}`, { replace: true });
  }, [location.hash, navigate]);

  return (
    <StudyContext.Provider value={studyValue}>
      <MotionEffects />
      <Header user={user} route={location.pathname} savedCount={savedIds.length} onSignOut={handleSignOut} syncError={syncError} />
      <main id="top"><Outlet /></main>
      <Footer user={user} />
      <div className="firebase-status" aria-live="polite">
        <span className={`status-dot ${firebaseConfigured && user && firebaseReady && !syncError ? "status-live" : ""}`} />
        {firebaseConfigured
          ? user ? firebaseReady ? "Signed in · cloud sync on" : "Syncing your free account…"
            : "Guest shelf · sign in to sync"
          : "Guest mode · saved on this browser"}
      </div>
    </StudyContext.Provider>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Study Shelf could not find its root element.");
const root = createRoot(rootElement);
const router = createBrowserRouter([{
  path: "/",
  element: <App />,
  errorElement: <NotFoundPage />,
  children: [
    { index: true, element: <HomeRoute /> },
    { path: "library", element: <LibraryRoute /> },
    { path: "book/:id", element: <BookDetailPage /> },
    { path: "about", element: <InfoPage kind="about" /> },
    { path: "privacy", element: <InfoPage kind="privacy" /> },
    { path: "terms", element: <InfoPage kind="terms" /> },
    { path: "login", element: <AuthRoute mode="signin" /> },
    { path: "signup", element: <AuthRoute mode="signup" /> },
    {
      path: "dashboard",
      element: <RequireAuth />,
      children: [{
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardOverviewRoute /> },
          { path: "library", element: <DashboardLibraryRoute /> },
          { path: "progress", element: <DashboardProgressRoute /> },
          { path: "shelf", element: <DashboardShelfRoute /> },
          { path: "settings", element: <SettingsRoute /> },
        ],
      }],
    },
    { path: "*", element: <NotFoundPage /> },
  ],
}], { basename: import.meta.env.BASE_URL });
root.render(<React.StrictMode><RouterProvider router={router} /></React.StrictMode>);

if (import.meta.hot) {
  import.meta.hot.dispose(() => root.unmount());
}
