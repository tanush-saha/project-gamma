import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { openBooks } from "./books.js";
import { courses, publicTextbooks, textbookCaution } from "./curriculum.js";
import { deletePrivateBook, getPrivateBook, listPrivateBooks, MAX_PRIVATE_BOOK_BYTES, savePrivateBook } from "./bookshelf.js";
import { firebaseConfigured, loadFirebase } from "./firebase.js";
import { COMMUNITY_FILE_LIMIT, communityApiConfigured, communityApiUrl, communityRequest, formatFileSize } from "./community.js";
import "./styles.css";

const Simulations = lazy(() => import("./Simulations.jsx"));
const Models3D = lazy(() => import("./Models3D.jsx"));
const tracks = [
  { id: "PCM", name: "Physics · Chemistry · Maths", short: "PCM", mark: "∑" },
  { id: "PCB", name: "Physics · Chemistry · Biology", short: "PCB", mark: "✳" },
  { id: "Commerce", name: "Commerce", short: "COM", mark: "↗" },
  { id: "Humanities", name: "Humanities", short: "HUM", mark: "¶" },
];
const guestStorageKey = "study-shelf-profile-v2";

function belongsToTrack(book, track) {
  const sharedSubject = book.subject?.trim().toLowerCase();
  return book.track === track
    || ((track === "PCM" || track === "PCB") && ["physics", "chemistry"].includes(sharedSubject))
    || ((track === "Commerce" || track === "Humanities") && sharedSubject === "economics");
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

function useStudyRoute() {
  const [route, setRoute] = useState(() => {
    const initial = window.location.hash.replace(/^#\/?/, "").split("?")[0];
    return initial || "home";
  });

  useEffect(() => {
    const updateRoute = () => {
      const next = window.location.hash.replace(/^#\/?/, "").split("?")[0] || "home";
      setRoute(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

  return route;
}

function Brand() {
  return (
    <a className="brand" href="#/" aria-label="Study Shelf home">
      <span className="brand-icon" aria-hidden="true">s.</span>
      <span>study shelf</span>
    </a>
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
    document.documentElement.classList.add("custom-cursor-ready");
    return () => {
      window.removeEventListener("pointermove", moveCursor);
      document.removeEventListener("pointerover", markInteractive);
      document.documentElement.classList.remove("custom-cursor-ready");
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

function Header({ user, savedCount, onSignIn, onSignOut, syncError }) {
  const displayName = user?.displayName || user?.email?.split("@")[0];
  return (
    <>
      <header className="topbar">
        <Brand />
        <nav className="topnav" aria-label="Main navigation">
          <a href="#/library">Books</a>
          <a href="#/topics">Study map</a>
          <a href="#/simulations">Simulations</a>
          <a href="#/models">3D models</a>
        </nav>
        <div className="header-account">
          <a className="saved-link" href="#/library">
            <span className="saved-star" aria-hidden="true">✳</span>
            <span className="saved-label">Saved</span> <span className="saved-count">{savedCount}</span>
          </a>
          {user && !user.isAnonymous ? (
            <div className="user-menu">
              <a className="user-name" href="#/account" title={user.email || ""}>{displayName || "My account"}</a>
              <button onClick={onSignOut} className="sign-in-button">Sign out</button>
            </div>
          ) : (
            <button onClick={onSignIn} className="sign-in-button">{user?.isAnonymous ? "Secure shelf" : "Sign in"}</button>
          )}
        </div>
      </header>
      {syncError && <div className="global-error" role="status">{syncError}</div>}
    </>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <Brand />
      <p>Made for the next question.</p>
      <nav className="footer-navigation" aria-label="More pages">
        <a href="#/topics">Topics</a><a href="#/library">Books</a>
        <a href="#/simulations">Simulations</a><a href="#/models">3D models</a>
      </nav>
      <span className="footer-small">© 2026 STUDY SHELF · READ WITH CURIOSITY</span>
    </footer>
  );
}

function PageLoading() {
  return <div className="page-loading" aria-live="polite">Getting the learning lab ready…</div>;
}

function HomePage({ onChooseTrack, savedCount, completedCount }) {
  const completionPercent = Math.round((completedCount / courses.reduce((sum, course) => sum + course.units.length, 0)) * 100);
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
          <h1>Good books.<br /><em>Big ideas.</em></h1>
          <p className="hero-description">
            Your free study space for CBSE and NCERT Classes 11 &amp; 12.
            Find textbook chapters, track every topic, run an experiment, and explore ideas in 3D.
          </p>
          <a className="hero-cta" href="#/topics">Start with the study map <span aria-hidden="true">↘</span></a>
          <div className="hero-footnote"><span className="footnote-line" /><span>Free to use. Learning stays in your hands.</span></div>
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
        <div className="hero-index"><span>FREE</span> / FOREVER</div>
      </section>
      <div className="ticker" aria-label="A good place to start"><div className="ticker-track">
        {Array.from({ length: 4 }, (_, index) => <span key={index}>FOLLOW THE QUESTION <b>✳</b> TRY SOMETHING NEW <b>✳</b></span>)}
      </div></div>
      <section className="section-wrap home-pathways" data-reveal>
        <div className="section-heading">
          <div><p className="eyebrow">01 — CHOOSE YOUR STUDY PATH</p><h2>One starting point.<br /><em>All the way through.</em></h2></div>
          <p className="section-aside">24 courses · hundreds of study units<br />Checklists update with the current syllabus.</p>
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
      <section className="home-feature-strip" data-reveal>
        <a className="feature-card" href="#/topics"><span className="feature-index">01 / TRACK</span><span className="feature-mark">✓</span>
          <h3>See where you are.</h3><p>Tick off syllabus topics as you learn. Your coverage and progress stay in your study map.</p>
          <strong>{completedCount} topics complete · {completionPercent}% of map</strong></a>
        <a className="feature-card" href="#/simulations"><span className="feature-index">02 / EXPLORE</span><span className="feature-mark">∿</span>
          <h3>Change a variable.</h3><p>Launch a ball, reshape a graph, cross some alleles, or find a market equilibrium.</p><strong>5 browser-based experiments ↗</strong></a>
        <a className="feature-card" href="#/models"><span className="feature-index">03 / ROTATE</span><span className="feature-mark">◉</span>
          <h3>Look closer.</h3><p>Rotate a molecule, a cell, and a crystal lattice with interactive 3D models.</p><strong>4 interactive models ↗</strong></a>
        <a className="feature-card" href="#/library"><span className="feature-index">04 / READ</span><span className="feature-mark">▤</span>
          <h3>Find the right book.</h3><p>Browse official NCERT books, free publisher PDFs, and your own private PDFs.</p><strong>{savedCount} books saved ↗</strong></a>
      </section>
      <section className="manifesto"><div className="manifesto-shape" aria-hidden="true">S</div>
        <p className="eyebrow">A NOTE FROM THE SHELF</p><h2>Learning isn’t a<br />race to the <em>last page.</em></h2>
        <p className="manifesto-copy">Progress is personal. A good book, a clear picture, and space to practise are a pretty good start.</p>
        <a href="#/topics" className="manifesto-link">Find your starting point <span>↗</span></a>
      </section>
    </>
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
        <div className="coverage-track" role="progressbar" aria-label="Topic coverage" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${percent}%` }} /></div>
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
                <a className="unit-book-link" href="#/library">
                  Open the official NCERT Class {course.grade} {course.subject} textbook ↗
                </a>
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
      <a className={`book-cover cover-${book.color}`} href={link} target="_blank" rel="noreferrer"
        aria-label={`${book.publicPath ? "Read or download" : "Open"} ${book.title}`}>
        <span className="cover-topline">{book.type === "official" ? "NCERT · OFFICIAL" : book.publisher} <span>·</span> {book.number}</span>
        <span className="cover-orb" /><span className="cover-title">{book.cover}</span>
        <span className="cover-bottomline">{book.publicPath ? "AVAILABLE ON THIS SITE" : "OPEN PUBLISHER BOOK"}</span>
        <span className="cover-open" aria-hidden="true">↗</span>
      </a>
      <div className="book-details">
        <div className="book-meta"><span>{book.subject}</span><span>{book.level}</span></div>
        <h3>{book.title}</h3><p className="book-author">By {book.author}</p>
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

function BookPage({ savedIds, onToggleSaved, onSignIn, firebaseUser, firebaseReady }) {
  const [track, setTrack] = useState("PCM");
  const [grade, setGrade] = useState("all");
  const [search, setSearch] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [privateBooks, setPrivateBooks] = useState([]);
  const [privateError, setPrivateError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [reader, setReader] = useState(null);
  const [cloudBooks, setCloudBooks] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState("");
  const [communityMessage, setCommunityMessage] = useState("");
  const [uploadFormOpen, setUploadFormOpen] = useState(false);
  const [communitySubmitting, setCommunitySubmitting] = useState(false);
  const [moderationQueue, setModerationQueue] = useState(null);
  const [moderatingId, setModeratingId] = useState("");
  const [uploadFields, setUploadFields] = useState({
    title: "",
    author: "",
    subject: "",
    track: "PCM",
    grade: "XI",
    description: "",
    license: "CC-BY",
    rightsConfirmed: false,
  });
  const fileInput = useRef(null);
  const cloudFileInput = useRef(null);

  useEffect(() => {
    let active = true;
    listPrivateBooks().then((items) => {
      if (active) setPrivateBooks(items);
    }).catch((error) => {
      if (active) setPrivateError(`Could not load PDFs stored on this device: ${error.message}`);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    if (reader?.url) URL.revokeObjectURL(reader.url);
  }, [reader?.url]);

  useEffect(() => {
    if (!communityApiConfigured) {
      setCommunityLoading(false);
      setCommunityError("");
      return undefined;
    }
    let active = true;
    setCommunityLoading(true);
    setCommunityError("");
    setCloudBooks([]);
    const params = new URLSearchParams({ track, grade: grade === "all" ? "ALL" : grade });
    communityRequest(`/api/books?${params}`, { user: firebaseUser }).then(({ books: sharedBooks }) => {
      if (active) setCloudBooks(sharedBooks);
    }).catch((error) => {
      if (active) setCommunityError(error.message);
    }).finally(() => {
      if (active) setCommunityLoading(false);
    });

    return () => { active = false; };
  }, [track, grade, firebaseUser]);

  useEffect(() => {
    if (!communityApiConfigured || !firebaseUser || firebaseUser.isAnonymous) {
      setModerationQueue(null);
      return undefined;
    }
    let active = true;
    communityRequest("/api/admin/books", { user: firebaseUser }).then(({ books: queue }) => {
      if (active) setModerationQueue(queue);
    }).catch((error) => {
      if (active && error.status === 403) setModerationQueue(null);
      else if (active) setCommunityError(error.message);
    });
    return () => { active = false; };
  }, [firebaseUser]);

  const visibleBooks = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    return [...publicTextbooks, ...openBooks]
      .filter((book) => belongsToTrack(book, track))
      .filter((book) => grade === "all" || book.level.includes(grade))
      .filter((book) => !savedOnly || savedIds.includes(book.id))
      .filter((book) => !normalizedQuery
        || [book.title, book.subject, book.publisher, book.description].join(" ").toLowerCase().includes(normalizedQuery));
  }, [grade, savedIds, savedOnly, search, track]);

  const matchingCloudBooks = cloudBooks.filter((book) => belongsToTrack(book, track)
    && (grade === "all" || book.grade === grade || book.grade === "SUPPLEMENTAL")
    && (!search.trim() || `${book.title} ${book.author} ${book.subject}`.toLowerCase().includes(search.trim().toLowerCase())));

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setPrivateError("");
    try {
      const metadata = await savePrivateBook(file);
      setPrivateBooks((current) => [metadata, ...current]);
    } catch (error) {
      setPrivateError(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleOpenPrivateBook(book) {
    setPrivateError("");
    try {
      const fullBook = await getPrivateBook(book.id);
      setReader({ id: book.id, title: book.title, url: URL.createObjectURL(fullBook.file), ownedBlob: true });
    } catch (error) {
      setPrivateError(error.message);
    }
  }

  async function handleDeletePrivateBook(book) {
    if (!window.confirm(`Remove "${book.title}" from this browser? This cannot be undone.`)) return;
    try {
      await deletePrivateBook(book.id);
      setPrivateBooks((current) => current.filter((entry) => entry.id !== book.id));
      setPrivateError("");
    } catch (error) {
      setPrivateError(error.message);
    }
  }

  async function handleCommunityUpload(event) {
    event.preventDefault();
    const file = cloudFileInput.current?.files?.[0];
    if (!communityApiConfigured || !firebaseUser || firebaseUser.isAnonymous || !firebaseReady || !file) {
      setCommunityError(!communityApiConfigured
        ? "Add the community API URL using the account setup guide before uploading."
        : !firebaseUser || firebaseUser.isAnonymous
          ? "Sign in with email or Google before publishing a book."
          : !firebaseReady
            ? "Your Firebase sign-in is still connecting."
            : "Select a PDF to upload.");
      return;
    }
    if (file.size > COMMUNITY_FILE_LIMIT) {
      setCommunityError(`This PDF is larger than ${formatFileSize(COMMUNITY_FILE_LIMIT)}. Choose a smaller file.`);
      return;
    }
    setCommunitySubmitting(true);
    setCommunityError("");
    setCommunityMessage("");
    try {
      const body = new FormData();
      for (const [key, value] of Object.entries(uploadFields)) {
          if (key === "rightsConfirmed") continue;
          body.set(key, String(value));
        }
        body.set("rightsConfirmed", uploadFields.rightsConfirmed ? "on" : "off");
      body.set("file", file);
      const { book } = await communityRequest("/api/books", {
        user: firebaseUser,
        method: "POST",
        body,
      });
      setCloudBooks((current) => [{ ...book, canDelete: true }, ...current.filter(({ id }) => id !== book.id)]);
      setCommunityMessage(`“${book.title}” is safely stored in the shared cloud library and awaiting a license review.`);
      setUploadFormOpen(false);
      setUploadFields({ title: "", author: "", subject: "", track, grade: grade === "XI" || grade === "XII" ? grade : "XI", description: "", license: "CC-BY", rightsConfirmed: false });
      if (cloudFileInput.current) cloudFileInput.current.value = "";
    } catch (error) {
      setCommunityError(error.message);
    } finally {
      setCommunitySubmitting(false);
    }
  }

  async function openCommunityBook(book) {
    setCommunityError("");
    try {
      const headers = book.status === "approved"
        ? {}
        : { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
      const response = await fetch(book.downloadUrl, { headers });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Could not open this book (${response.status}).`);
      }
      const url = URL.createObjectURL(await response.blob());
      setReader({ id: book.id, title: book.title, url, ownedBlob: true });
    } catch (error) {
      setCommunityError(error.message);
    }
  }

  async function removeCommunityBook(book) {
    if (!window.confirm(`Permanently remove “${book.title}” from the shared cloud library?`)) return;
    setCommunityError("");
    try {
      await communityRequest(`/api/books/${encodeURIComponent(book.id)}`, { user: firebaseUser, method: "DELETE" });
      setCloudBooks((current) => current.filter(({ id }) => id !== book.id));
      setCommunityMessage(`“${book.title}” was removed from the cloud library.`);
    } catch (error) {
      setCommunityError(error.message);
    }
  }

  async function reviewCommunityBook(book, status) {
    setModeratingId(book.id);
    setCommunityError("");
    try {
      await communityRequest(`/api/admin/books/${encodeURIComponent(book.id)}`, {
        user: firebaseUser,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setModerationQueue((current) => current?.filter(({ id }) => id !== book.id) || []);
      if (status === "approved") setCloudBooks((current) => current.map((entry) => entry.id === book.id ? { ...entry, status } : entry));
    } catch (error) {
      setCommunityError(error.message);
    } finally {
      setModeratingId("");
    }
  }

  function updateUploadField(event) {
    const { name, value, checked, type } = event.target;
    setUploadFields((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  return (
    <section className="page-wrap books-page" data-reveal>
      <p className="eyebrow">THE OPEN SHELF · FREE READING, RIGHTFUL SOURCES</p>
      <div className="page-heading-row"><h1>Good books.<br /><em>One useful shelf.</em></h1>
        <p>Start with the actual NCERT textbooks, go deeper with legal free books from their publishers, or bring in your own PDFs.</p></div>
      <div className="book-filters">
        <div className="track-tabs" role="tablist" aria-label="Filter books by study path">
          {tracks.map((item) => <button key={item.id} className={`track-tab ${track === item.id ? "is-active" : ""}`}
            onClick={() => setTrack(item.id)} role="tab" aria-selected={track === item.id}>{item.short}</button>)}
        </div>
        <label className="grade-filter"><span>CLASS</span><select value={grade} onChange={(event) => setGrade(event.target.value)}>
          <option value="all">XI &amp; XII</option><option value="XI">XI</option><option value="XII">XII</option></select></label>
        <label className="book-search"><span className="sr-only">Search books</span><input value={search} onChange={(event) => setSearch(event.target.value)}
          type="search" placeholder="Search title or subject" /></label>
        <button className={`saved-only-button ${savedOnly ? "filter-on" : ""}`} onClick={() => setSavedOnly((current) => !current)}>
          {savedOnly ? "Saved only ✳" : `Saved · ${savedIds.length}`}
        </button>
      </div>
      <div className="catalog-heading"><span>{savedOnly ? "YOUR SAVED BOOKS" : `${tracks.find((item) => item.id === track)?.name} · FREE AND OFFICIAL`}</span>
        <span>{visibleBooks.length} books</span></div>
      <div className="book-grid">
        {visibleBooks.map((book, index) => <BookCard key={book.id} book={book}
          saved={savedIds.includes(book.id)} onToggle={onToggleSaved} style={{ "--card-index": index }} />)}
      </div>
      {!visibleBooks.length && <div className="empty-state"><span>✳</span><h3>No books in this search.</h3>
        <p>{savedOnly ? "Save an official book to see it here." : "Try another subject, title, or class."}</p></div>}
      <section className="community-shelf" data-reveal>
        <div className="community-heading">
          <div><p className="eyebrow"><span className="eyebrow-dot" /> THE SHARED LIBRARY · STORED IN THE CLOUD</p>
            <h2>More good books,<br /><em>from the community.</em></h2></div>
          <div className="cloud-live-label"><span className={`status-dot ${communityApiConfigured && !communityError ? "status-live" : ""}`} />
            {communityLoading ? "Connecting to cloud…" : communityApiConfigured ? `${matchingCloudBooks.length} shared PDFs` : "Cloud setup needed"}</div>
        </div>
        <p className="community-intro">Find openly licensed books shared by learners. Sign in to publish PDFs that you have explicit permission to redistribute; every upload is reviewed before anyone else can download it.</p>
        {communityError && <p className="community-error" role="alert">{communityError}</p>}
        {communityMessage && <p className="community-success" role="status">{communityMessage}</p>}
        {!communityApiConfigured && <div className="community-connect-card">
          <div><strong>Connect a private cloud catalog.</strong><p>The app is ready, but this deployment has no Cloudflare Worker URL yet. Set up a free Worker + private R2 bucket + D1 catalog, then add <code>VITE_COMMUNITY_API_URL</code> as a GitHub Actions variable and redeploy.</p></div>
          <a href="#/account">Open cloud setup guide ↗</a>
        </div>}
        {communityApiConfigured && !firebaseUser && <div className="community-connect-card">
          <div><strong>Browse the public shelf. Sign in to share.</strong><p>Anyone can read approved community books. Sign in with email or Google to upload, manage your books, and help moderate your library.</p></div>
          <button onClick={onSignIn}>Sign in to contribute ↗</button>
        </div>}
        {communityApiConfigured && firebaseUser?.isAnonymous && <div className="community-connect-card">
          <div><strong>Make a free account to publish.</strong><p>Shared-book uploads require email or Google sign-in. Your existing anonymous study progress will be kept when you link your account.</p></div>
          <button onClick={onSignIn}>Secure my shelf ↗</button>
        </div>}
        {communityApiConfigured && firebaseUser && !firebaseUser.isAnonymous && <div className="community-action-row">
          <div><span className="cloud-badge">☁ COMMUNITY UPLOAD</span>
            <p>Your PDFs go to private cloud storage; only approved books become public.</p></div>
          <button className="hero-cta community-upload-button" onClick={() => setUploadFormOpen((current) => !current)}>
            {uploadFormOpen ? "Close upload form" : "Share a permitted book"} <span aria-hidden="true">{uploadFormOpen ? "×" : "↗"}</span>
          </button>
        </div>}
        {uploadFormOpen && firebaseUser && <form className="community-upload-form" onSubmit={handleCommunityUpload}>
          <p className="eyebrow">01 — CREDIT THE SOURCE &amp; EXPLAIN THE LICENSE</p>
          <div className="community-form-grid">
            <label>Book title<input name="title" value={uploadFields.title} onChange={updateUploadField} maxLength={140} required /></label>
            <label>Author / attribution<input name="author" value={uploadFields.author} onChange={updateUploadField} maxLength={140} required /></label>
            <label>Subject<input name="subject" value={uploadFields.subject} onChange={updateUploadField} maxLength={80} required placeholder="e.g. Mathematics" /></label>
            <label>Study stream<select name="track" value={uploadFields.track} onChange={updateUploadField}>
              {tracks.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
            <label>Class<select name="grade" value={uploadFields.grade} onChange={updateUploadField}>
              <option value="XI">Class XI</option><option value="XII">Class XII</option><option value="SUPPLEMENTAL">Supplemental / other</option>
            </select></label>
            <label>Redistribution license<select name="license" value={uploadFields.license} onChange={updateUploadField}>
              <option value="CC-BY">Creative Commons BY · attribution required</option>
              <option value="CC-BY-SA">Creative Commons BY-SA · share alike</option>
              <option value="PUBLIC-DOMAIN">Public domain</option>
              <option value="OER">Other explicitly redistributable OER</option>
            </select></label>
            <label className="upload-description-field">Source &amp; description<textarea name="description" value={uploadFields.description} onChange={updateUploadField}
              placeholder="Explain where this file came from and how its license permits public sharing." maxLength={500} required /></label>
          </div>
          <label className="cloud-file-picker"><span>Choose a PDF · max {formatFileSize(COMMUNITY_FILE_LIMIT)}</span>
            <input ref={cloudFileInput} type="file" accept=".pdf,application/pdf" required /></label>
          <label className="rights-confirmation"><input type="checkbox" name="rightsConfirmed" checked={uploadFields.rightsConfirmed} onChange={updateUploadField} />
            <span>I have the legal right to upload and share this exact PDF with the public. Its license explicitly permits public redistribution.</span></label>
          <p className="community-license-warning">Uploaded PDFs are stored in the shared cloud and anyone can download an approved book. Choose an allowed license and credit the original author and source. Do not upload a textbook, scan, or personal copy unless its exact license explicitly permits redistribution.</p>
          <button type="submit" className="experiment-run" disabled={communitySubmitting || !firebaseReady || !uploadFields.rightsConfirmed}>
            {communitySubmitting ? "Uploading securely to the cloud…" : "Upload to the cloud for review ↗"}
          </button>
        </form>}
        {communityApiConfigured && communityLoading && <div className="community-loading">Connecting securely to the shared bookshelf…</div>}
        {communityApiConfigured && !communityLoading && matchingCloudBooks.length > 0 && <div className="community-book-grid">
          {matchingCloudBooks.map((book, index) => {
              const isPending = book.status !== "approved";
              return <article className={`community-book-card ${isPending ? "is-pending" : ""}`} key={book.id} style={{ "--card-index": index }}>
                <div className={`community-cover community-cover-${index % 4}`}><span>THE COMMUNITY SHELF</span>
                  <strong>{book.title}</strong><i>✳</i><small>{book.license} · {formatFileSize(book.fileSize)}</small></div>
                <div className="community-book-info"><div><span>{book.subject} · {book.grade}</span>
                  <span className={`community-status-badge ${book.status}`}>{book.status === "approved" ? "PUBLIC · CLOUD STORED" : `YOUR BOOK · ${book.status.toUpperCase()}`}</span></div>
                  <h3>{book.title}</h3><p className="book-author">By {book.author}</p>
                  <p>{book.description}</p><small>Shared {new Date(book.createdAt).toLocaleDateString()}</small>
                  <div className="community-book-actions">{!isPending
                    ? <a href={book.downloadUrl} target="_blank" rel="noreferrer">Read / download PDF ↗</a>
                    : <button onClick={() => openCommunityBook(book)} disabled={book.status === "rejected"}>{book.status === "rejected" ? "Review rejected" : "Preview my PDF ↗"}</button>}
                    {book.canDelete && <button className="private-delete" onClick={() => removeCommunityBook(book)}>Remove from cloud</button>}
                  </div>
                </div>
              </article>;
          })}
        </div>}
        {communityApiConfigured && !communityLoading && matchingCloudBooks.length === 0
          && <div className="private-empty">{cloudBooks.length > 0
            ? "No cloud books match this stream, class, and search yet."
            : "The cloud shelf is waiting for its first licensed books. Want to contribute?"}</div>}
        {Array.isArray(moderationQueue) && <section className="moderation-queue">
          <div className="moderation-heading"><p className="eyebrow">MODERATOR DESK · REVIEW BEFORE PUBLISHING</p><span>{moderationQueue.length} awaiting review</span></div>
          {!moderationQueue.length && <p>The cloud shelf is up to date. No pending book reviews.</p>}
          {moderationQueue.map((book) => <article className="moderation-row" key={book.id}>
            <div><strong>{book.title}</strong><span>By {book.author} · {book.subject} · {book.license} · {formatFileSize(book.fileSize)}</span>
              <p>{book.description}</p></div>
            <button onClick={() => openCommunityBook(book)}>Inspect PDF</button>
            <button disabled={moderatingId === book.id} onClick={() => reviewCommunityBook(book, "approved")}>Approve</button>
            <button className="private-delete" disabled={moderatingId === book.id} onClick={() => reviewCommunityBook(book, "rejected")}>Reject</button>
          </article>)}
        </section>}
      </section>
      <div className="rights-note"><span>READ IT FROM THE SOURCE</span><p>Official NCERT textbooks open the NCERT textbook portal: choose a class, subject, and title there to download its PDF. OpenStax links open the publisher page with its own online reader and free PDF. Their books are helpful supplements, not a substitute for the CBSE syllabus.</p></div>
      <details className="private-library private-library-collapsible">
        <summary><div><p className="eyebrow">LOCAL BACKUP · THIS BROWSER ONLY</p><strong>A private shelf for personal books</strong></div><span aria-hidden="true">＋</span></summary>
        <div className="private-library-content">
        <div className="private-library-heading"><div><p className="eyebrow">YOUR PRIVATE COPIES · THIS BROWSER ONLY</p>
          <h2>Bring your own<br /><em>reading.</em></h2></div>
          <button className="hero-cta" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? "Adding PDF…" : "Add a PDF"} <span aria-hidden="true">＋</span></button>
          <input ref={fileInput} className="sr-only" type="file" accept=".pdf,application/pdf" onChange={handleUpload} />
        </div>
        <p className="private-explanation">Your PDF stays on this device in your browser’s private database. It is not uploaded to the website, cloud, or shared with other visitors. Maximum size: {MAX_PRIVATE_BOOK_BYTES / 1024 / 1024} MB per file. A copy elsewhere is still a good idea.</p>
        {privateError && <p className="private-error" role="alert">{privateError}</p>}
        {privateBooks.length === 0 ? <div className="private-empty">Your private shelf is empty. Add a PDF that you own or have permission to use.</div> : (
          <div className="private-book-list">{privateBooks.map((book) => (
            <div className="private-book-row" key={book.id}><span className="private-pdf-mark">PDF</span>
              <div className="private-book-title"><strong>{book.title}</strong><small>{(book.size / (1024 * 1024)).toFixed(2)} MB · saved only in this browser</small></div>
              <button onClick={() => handleOpenPrivateBook(book)}>Read ↗</button>
              <button onClick={() => handleDeletePrivateBook(book)} aria-label={`Delete ${book.title}`} className="private-delete">Remove</button>
            </div>
          ))}</div>
        )}
        </div>
      </details>
      {!firebaseUser && firebaseConfigured && <div className="account-nudge"><span>SYNC YOUR READING LIST</span><p>Bookmarks and study progress sync across your signed-in devices. Private PDF files remain on this browser.</p>
        <button onClick={onSignIn}>Sign in ↗</button></div>}
      {!firebaseConfigured && <p className="curriculum-caution">Bookmarks are stored on this browser until Firebase is configured. <a href="#/account">See account setup ↗</a></p>}
      {reader && <div className="reader-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) { URL.revokeObjectURL(reader.url); setReader(null); } }}>
        <section className="pdf-reader" role="dialog" aria-modal="true" aria-labelledby="reader-title">
          <header><h2 id="reader-title">{reader.title}</h2>          <a href={reader.url} download={reader.ownedBlob ? `${reader.title}.pdf` : undefined} target={reader.ownedBlob ? undefined : "_blank"}
            rel={reader.ownedBlob ? undefined : "noreferrer"}>Open / download PDF ↗</a>
            <button onClick={() => { if (reader.ownedBlob) URL.revokeObjectURL(reader.url); setReader(null); }} aria-label="Close PDF reader">×</button></header>
          <iframe title={`PDF reader: ${reader.title}`} src={reader.url} />
        </section></div>}
    </section>
  );
}

function AuthDialog({ services, currentUser, onClose }) {
  const [mode, setMode] = useState(currentUser?.isAnonymous ? "upgrade" : "signin");
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
        onClose();
      } else if (mode === "signin") {
        await services.signInWithEmailAndPassword(services.auth, email, password);
        onClose();
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
        "auth/unauthorized-domain": "Add this GitHub Pages domain to Firebase's authorised domains.",
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
      onClose();
    } catch (authError) {
      setError(authError.code === "auth/unauthorized-domain"
        ? "Add this GitHub Pages domain to Firebase's authorised domains."
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
        <p className="auth-intro">Sign in to sync bookmarks and topic progress across devices. Personal imports stay in this browser; community PDFs are shared only after moderation.</p>
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
          <button className="experiment-run" type="submit" disabled={busy || !firebaseConfigured}>{busy ? "One moment…" : mode === "signup" ? "Create your free account" : mode === "upgrade" ? "Link and save my shelf" : mode === "reset" ? "Send reset link" : "Sign in"}</button>
        </form>
        <div className="auth-switches">
          {mode === "signin" && <><button onClick={() => { setMode("reset"); setError(""); setNotice(""); }}>Forgot password?</button>
            <span>New here?</span><button onClick={() => { setMode("signup"); setError(""); setNotice(""); }}>Create a free account</button></>}
          {(mode === "signup" || mode === "upgrade") && <><span>Already have an account?</span>
            {!upgrading && <button onClick={() => { setMode("signin"); setError(""); setNotice(""); }}>Sign in</button>}</>}
          {mode === "reset" && <button onClick={() => { setMode("signin"); setError(""); setNotice(""); }}>Back to sign in</button>}
        </div>
        {!firebaseConfigured && <p className="auth-setup-note">This site is not connected to Firebase yet. Follow the free setup guide on the account page.</p>}
      </section>
    </div>
  );
}

function AccountPage({ user, firebaseReady, onSignIn, onSignOut, onSyncRetry }) {
  return (
    <section className="page-wrap account-page">
      <p className="eyebrow">YOUR SHELF · A PRIVATE LITTLE CORNER</p>
      <div className="page-heading-row"><h1>It’s your<br /><em>space to learn.</em></h1>
        <p>A free account saves your bookmarks and topic checklist on this device and syncs them between your signed-in devices.</p></div>
      {user && !user.isAnonymous ? <div className="account-status-card"><span className="account-avatar">{(user.displayName || user.email || "S").slice(0, 1).toUpperCase()}</span>
        <div><span>SIGNED IN</span><h2>{user.displayName || user.email}</h2><p>{user.email}</p><small>{firebaseReady ? "Your bookmarks and topic progress are synced." : "Syncing your reading list…"}</small></div>
        <button onClick={onSignOut}>Sign out</button></div>
        : <div className="account-status-card"><span className="account-avatar">s.</span><div><span>GUEST SHELF</span>
          <h2>{firebaseConfigured ? "Your local shelf is ready." : "Firebase isn’t connected yet."}</h2>
          <p>Without Firebase config, your bookmarks and progress stay in this browser.</p></div>
          {firebaseConfigured && <button onClick={onSignIn}>{user?.isAnonymous ? "Secure your old shelf ↗" : "Sign in ↗"}</button>}</div>}
      <section className="setup-guide"><p className="eyebrow">NO SUBSCRIPTION REQUIRED · YOUR FIREBASE PROJECT</p>
        <h2>Turn on free accounts and syncing.</h2>
        <p>GitHub Pages hosts the public website for free. Firebase Spark provides Google or email sign-in and a small free Firestore quota for bookmarks and checklists. This app never uploads PDFs to Firebase.</p>
        <ol>
          <li>Create a Firebase project on the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">Firebase Console ↗</a>. Do not enable billing.</li>
          <li>In <strong>Project settings → General → Your apps</strong>, add a Web app and copy its six config values.</li>
          <li>Copy <code>.env.example</code> to <code>.env.local</code> in the project root and fill in the values. Keep <code>.env.local</code> out of GitHub.</li>
          <li>In <strong>Authentication → Sign-in method</strong>, enable <strong>Email/Password</strong> and <strong>Google</strong>.</li>
          <li>In <strong>Authentication → Settings → Authorised domains</strong>, add <code>YOUR-USERNAME.github.io</code>.</li>
          <li>Create a <strong>Firestore Database</strong> in test-free production mode. Publish this project’s <code>firestore.rules</code> from Firebase CLI using <code>firebase deploy --only firestore:rules</code>.</li>
          <li>Restart local Vite with <code>npm run dev</code>. Vite environment values are embedded at build time; rebuild and redeploy after changing them.</li>
        </ol>
        <div className="free-quota-note"><strong>Keep it free:</strong> Stay on the Spark plan; no billing account or Cloud Storage bucket is needed. Firebase’s free quotas are limited and can change. Firestore is used only for signed-in users’ text-based bookmarks and topic IDs. If a quota is reached, your local reading still works.</div>
        <button className="account-retry" onClick={onSyncRetry}>Retry Firebase connection ↗</button>
      </section>
      <section className="setup-guide upload-guide"><p className="eyebrow">SHARE A BOOK YOU OWN</p><h2>Where your book files go.</h2>
        <p><strong>Share with everyone through the cloud:</strong> connect the free-tier Cloudflare Worker + private R2 bucket + D1 catalog below. Sign in, submit the title and source, and upload a permitted PDF from the Books page. Each file stays private until a moderator approves it.</p>
        <p><strong>Private:</strong> use the Library page’s Add a PDF button. It is stored in this browser and never published. It will not sync to another device.</p>
        <p><strong>Publish a free book for every visitor:</strong> only upload a book when its license permits public redistribution. Add the PDF to <code>public/books/</code> in your repository, then add a book entry to <code>src/books.js</code>. Commit and push to deploy it. Anyone can read or download files in that folder.</p>
        <p>Do not publicly upload copyrighted textbooks or personal copies. The NCERT and OpenStax book links already provide their own authorized reader and PDF downloads.</p>
        <a className="manifesto-link" href="#/library">Go to the bookshelf <span>↗</span></a>
      </section>
      <section className="setup-guide cloud-setup-guide" id="cloud-setup" data-reveal>
        <p className="eyebrow"><span className="eyebrow-dot" /> FREE-TIER CLOUD BOOK SHARING</p>
        <h2>Put the library in the cloud.</h2>
        <p>GitHub Pages serves the app; Firebase confirms accounts; Cloudflare stores the PDFs and book records. The R2 bucket stays private: the Worker streams approved books to readers, checks sign-in for private previews, and queues every upload for moderator review.</p>
        <div className="free-quota-note"><strong>Before you start:</strong> Create a free Cloudflare account and stay within the current Workers, D1 and R2 free allowances. Free quotas and eligibility can change and are not unlimited; review Cloudflare’s current pricing and usage before uploading. Do not enable billing unless you explicitly choose to. PDFs are public once approved. Never upload copyrighted scans, textbooks, or personal copies without redistribution rights.</div>
        <ol className="cloud-setup-steps">
          <li><strong>Install the project tools.</strong> In the project folder run <code>npm install</code>, then log in: <code>npx wrangler login</code>. Cloudflare opens an official sign-in page in your browser.</li>
          <li><strong>Create the private PDF bucket.</strong> Run <code>npm run cloud:r2:create</code>. Do not enable a public R2 development URL or add an R2 public custom domain.</li>
          <li><strong>Create the catalog database.</strong> Run <code>npm run cloud:d1:create</code>. Copy the database ID from the output into <code>database_id</code> in <code>cloudflare/wrangler.toml</code>.</li>
          <li><strong>Create the catalog tables.</strong> With the database ID in place, run <code>npm run cloud:d1:init</code>. This applies <code>cloudflare/schema.sql</code> to the remote D1 database.</li>
          <li><strong>Configure your Firebase project.</strong> Set <code>FIREBASE_PROJECT_ID</code> in <code>cloudflare/wrangler.toml</code> to the same project ID as <code>VITE_FIREBASE_PROJECT_ID</code>. In <code>ALLOWED_ORIGINS</code>, replace <code>https://YOUR-USERNAME.github.io</code> with your exact Pages origin (origin only: no repository path or trailing slash). Keep the localhost entries for development. If you have a custom domain, add its exact origin.</li>
          <li><strong>Choose a moderator.</strong> Sign in to your site at least once with that Firebase account. In Firebase Console → Authentication → Users, copy its UID. Run <code>npx wrangler secret put ADMIN_UIDS --config cloudflare/wrangler.toml</code>, paste the UID, and press Enter. To appoint more moderators, enter comma-separated UIDs. Keep this secret private; do not put moderator UIDs in <code>VITE_</code> settings.</li>
          <li><strong>Deploy the cloud API.</strong> Run <code>npm run cloud:deploy</code>. Wrangler prints the Worker URL, such as <code>https://study-shelf-community.YOUR-ACCOUNT.workers.dev</code>.</li>
          <li><strong>Connect the website.</strong> Add the complete Worker URL (without a trailing slash) as <code>VITE_COMMUNITY_API_URL</code> in GitHub → repository Settings → Secrets and variables → Actions → Variables. Add the same line to your local <code>.env.local</code> for local app development. Keep the six Firebase browser config variables there too. These browser config values are public; the moderator secret is not.</li>
          <li><strong>Publish and verify.</strong> Push a commit to the GitHub Pages branch so Actions rebuilds with the Worker URL. Then open <code>{communityApiUrl || "YOUR-WORKER-URL"}/api/health</code> in a new tab; seeing <code>{"{\"status\":\"ok\",\"feature\":\"community-books\""}</code> confirms the API is reachable. Return to Books to browse, publish, and moderate books.</li>
        </ol>
        <div className="free-quota-note"><strong>Moderation matters:</strong> Cloud upload does not give permission to share a book. Review its original publisher’s license and source before approving it. The uploader confirms their rights; moderators must still verify them. Reject/delete an upload instead of publishing when its rights are unclear.</div>
        <p className="community-connect-link">Worker configuration lives in <code>cloudflare/wrangler.toml</code>; the access-controlled API is in <code>cloudflare/worker.js</code>, with D1 tables in <code>cloudflare/schema.sql</code>. Never make the R2 bucket public. The Worker validates Firebase ID-token signatures and does not use a browser-visible service-account key.</p>
        <a className="manifesto-link" href="#/library">Open the shared bookshelf <span>↗</span></a>
      </section>
    </section>
  );
}

function App() {
  const route = useStudyRoute();
  const guestProfile = useMemo(readGuestProfile, []);
  const [savedIds, setSavedIds] = useState(guestProfile.savedBookIds);
  const [completedIds, setCompletedIds] = useState(guestProfile.completedUnitIds);
  const [user, setUser] = useState(null);
  const [firebaseServices, setFirebaseServices] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(!firebaseConfigured);
  const [syncError, setSyncError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [trackFilter, setTrackFilter] = useState("all");
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const savedIdsRef = useRef(savedIds);
  const completedIdsRef = useRef(completedIds);
  const guestProfileRef = useRef(guestProfile);
  savedIdsRef.current = savedIds;
  completedIdsRef.current = completedIds;

  const allUnitIds = useMemo(() => courses.flatMap((course) => course.units.map((unit) => unit.id)), []);
  const completedCount = completedIds.filter((id) => allUnitIds.includes(id)).length;

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
        if (!currentUser) {
          setFirebaseReady(true);
          return;
        }

        setFirebaseReady(false);
        setSyncError("");
        const profileRef = services.doc(services.db, "users", currentUser.uid);
        try {
          const profileSnapshot = await services.getDoc(profileRef);
          const cloudProfile = profileSnapshot.exists() ? profileSnapshot.data() : {};
          const legacySavedSnapshot = await services.getDocs(
            services.collection(services.db, "users", currentUser.uid, "savedBooks"),
          );
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

  const pageTitles = {
    home: "Study Shelf — Find your next great book",
    topics: "Study map — Study Shelf",
    library: "Free book library — Study Shelf",
    simulations: "Interactive simulations — Study Shelf",
    models: "Interactive 3D models — Study Shelf",
    account: "Your account — Study Shelf",
  };
  const currentPage = pageTitles[route] ? route : "not-found";

  useEffect(() => {
    document.title = pageTitles[route] || "Page not found — Study Shelf";
  }, [route]);

  return (
    <>
      <MotionEffects />
      <Header user={user} savedCount={savedIds.length} onSignIn={() => setAuthOpen(true)} onSignOut={handleSignOut} syncError={syncError} />
      <main id="top">
        {currentPage === "home" && <HomePage savedCount={savedIds.length} completedCount={completedCount}
          onChooseTrack={(stream) => { setTrackFilter(stream); window.location.hash = "#/topics"; }} />}
        {currentPage === "topics" && <TopicPage trackFilter={trackFilter} onTrackChange={setTrackFilter}
          completedIds={completedIds} onToggle={toggleUnit} firebaseUser={user} onSignIn={() => setAuthOpen(true)} />}
        {currentPage === "library" && <BookPage savedIds={savedIds} onToggleSaved={toggleSaved}
          onSignIn={() => setAuthOpen(true)} firebaseUser={user} firebaseReady={firebaseReady} />}
        {currentPage === "simulations" && <Suspense fallback={<PageLoading />}><Simulations /></Suspense>}
        {currentPage === "models" && <Suspense fallback={<PageLoading />}><Models3D /></Suspense>}
        {currentPage === "account" && <AccountPage user={user} firebaseReady={firebaseReady} onSignIn={() => setAuthOpen(true)}
          onSignOut={handleSignOut} onSyncRetry={() => { setSyncError(""); setFirebaseReady(false); setConnectionAttempt((value) => value + 1); }} />}
        {currentPage === "not-found" && <section className="not-found"><p className="eyebrow">THIS CHAPTER ISN’T IN THE BOOK</p>
          <h1>Try another<br /><em>page.</em></h1><a className="hero-cta" href="#/">Go to the home page ↗</a></section>}
      </main>
      <Footer />
      <div className="firebase-status" aria-live="polite">
        <span className={`status-dot ${firebaseConfigured && user && firebaseReady && !syncError ? "status-live" : ""}`} />
        {firebaseConfigured
          ? user ? firebaseReady ? "Signed in · cloud sync on" : "Syncing your free account…"
            : "Guest shelf · sign in to sync"
          : "Guest mode · saved on this browser"}
      </div>
      {authOpen && <AuthDialog services={firebaseServices} currentUser={user} onClose={() => setAuthOpen(false)} />}
    </>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Study Shelf could not find its root element.");
const root = createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);

if (import.meta.hot) {
  import.meta.hot.dispose(() => root.unmount());
}
