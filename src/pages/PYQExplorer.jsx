import React, { useMemo, useState } from "react";
import { Card, EmptyState, Badge } from "../components/ui.jsx";
import { openBooks } from "../books.js";
import { soundEngine } from "../utils/audio.js";

const examOptions = [
  { value: "all", label: "All Exams" },
  { value: "jee", label: "JEE Main & Advanced" },
  { value: "neet", label: "NEET UG" },
];

function isPreviousYearResource(book) {
  return (
    book.resourceKind === "pyq" ||
    /pyq|previous years?|past papers?|solved papers?|chapter-wise solved/i.test(
      `${book.title} ${book.description}`,
    )
  );
}

export function PYQExplorer({ onQuickRead }) {
  const [examFilter, setExamFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [search, setSearch] = useState("");

  const pyqBooks = useMemo(() => {
    return openBooks.filter(isPreviousYearResource);
  }, []);

  const subjects = useMemo(() => {
    return [
      ...new Set(
        pyqBooks.flatMap((b) => b.subjects || [b.subject]),
      ),
    ].sort();
  }, [pyqBooks]);

  const items = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pyqBooks
      .filter((book) => {
        const bookSubjects = (book.subjects || [book.subject]).map((s) => s.toLowerCase());
        const matchSubject =
          subjectFilter === "all" || bookSubjects.includes(subjectFilter.toLowerCase());

        const matchExam =
          examFilter === "all" ||
          (book.examFocus || []).some((e) => e.toLowerCase().includes(examFilter));

        const matchQuery =
          !query ||
          [book.title, book.author, book.subject, book.publisher, book.description]
            .join(" ")
            .toLowerCase()
            .includes(query);

        return matchSubject && matchExam && matchQuery;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [examFilter, search, subjectFilter, pyqBooks]);

  function clearFilters() {
    soundEngine.playClick();
    setExamFilter("all");
    setSubjectFilter("all");
    setSearch("");
  }

  return (
    <section className="page-wrap pyq-explorer" data-reveal>
      <div className="section-inner">
        {/* Heading */}
        <div className="dashboard-section-heading">
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <p className="eyebrow" style={{ margin: 0 }}>PREVIOUS YEARS' QUESTIONS // 1978–2025 ARCHIVE</p>
              <Badge variant="accent">{pyqBooks.length} PAPERS &amp; COMPILATIONS</Badge>
            </div>
            <h1>Learn from the<br /><em>questions before.</em></h1>
            <p>
              47 years of IIT-JEE Advanced papers, 24 years of JEE Main shifts, and 37 years of NEET/AIPMT questions organised chapter-wise with official NTA &amp; IIT answer keys.
            </p>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="pyq-filters panel" style={{ marginBottom: "2rem", padding: "1.5rem", borderRadius: "1.25rem", background: "var(--card)" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontFamily: "var(--mono)" }}>
              <span className="label" style={{ color: "var(--muted)" }}>EXAM</span>
              <select
                value={examFilter}
                onChange={(e) => { soundEngine.playClick(); setExamFilter(e.target.value); }}
                style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--ink)" }}
              >
                {examOptions.map((exam) => (
                  <option key={exam.value} value={exam.value}>{exam.label}</option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontFamily: "var(--mono)" }}>
              <span className="label" style={{ color: "var(--muted)" }}>SUBJECT</span>
              <select
                value={subjectFilter}
                onChange={(e) => { soundEngine.playClick(); setSubjectFilter(e.target.value); }}
                style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--ink)" }}
              >
                <option value="all">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub.toLowerCase()}>{sub}</option>
                ))}
              </select>
            </label>

            <label className="pyq-search" style={{ marginLeft: "auto" }}>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search year, chapter, topic..."
                style={{ padding: "0.45rem 1rem", borderRadius: "999px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--ink)", fontSize: "0.85rem", minWidth: "220px" }}
              />
            </label>

            <button type="button" className="btn-ghost pyq-clear" onClick={clearFilters} style={{ cursor: "pointer", fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
              Clear filters
            </button>
          </div>
        </div>

        {/* Counter */}
        <div className="pyq-results-heading" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="eyebrow">{items.length} PAST-PAPER RESOURCES</span>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
            Verified IIT &amp; NTA Past Archives
          </span>
        </div>

        {/* Grid */}
        {items.length === 0 ? (
          <EmptyState title="No past-paper resources found">
            Try choosing another exam or subject, or clearing your search.
          </EmptyState>
        ) : (
          <div className="book-grid pyq-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1.5rem" }}>
            {items.map((book) => (
              <Card key={book.id} className="pyq-card" style={{ borderRadius: "1rem", padding: "1.5rem", background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", border: "1px solid rgba(215,173,120,0.3)", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(215,173,120,0.08)", fontFamily: "var(--mono)" }}>
                      SOLVED PAPERS
                    </span>
                    {(book.examFocus || []).map((ex) => (
                      <Badge key={ex} variant="accent" style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem" }}>{ex}</Badge>
                    ))}
                    <Badge variant="default" style={{ marginLeft: "auto", fontSize: "0.65rem" }}>{book.publisher}</Badge>
                  </div>

                  <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", lineHeight: "1.35", color: "var(--ink)" }}>{book.title}</h2>
                  <p style={{ margin: "0 0 1rem 0", fontSize: "0.82rem", color: "var(--muted)", lineHeight: "1.5" }}>{book.description}</p>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                    {book.subject} · {book.level}
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {onQuickRead && (
                      <button
                        type="button"
                        onClick={() => { soundEngine.playClick(); onQuickRead(book); }}
                        style={{ background: "none", border: "1px solid var(--border)", color: "var(--ink)", borderRadius: "999px", padding: "0.35rem 0.75rem", fontSize: "0.75rem", cursor: "pointer" }}
                      >
                        Info
                      </button>
                    )}
                    <a
                      href={book.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-cta"
                      onClick={() => soundEngine.playClick()}
                      style={{ fontSize: "0.75rem", padding: "0.35rem 0.9rem" }}
                    >
                      Open ↗
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
