import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Badge } from "../components/ui.jsx";
import { openBooks } from "../books.js";
import { soundEngine } from "../utils/audio.js";

const EXAMS = [
  { id: "all", label: "All Exams" },
  { id: "jee", label: "JEE Main & Adv" },
  { id: "neet", label: "NEET" },
];

const SUBJECTS = [
  { id: "all", label: "All Subjects" },
  { id: "physics", label: "Physics" },
  { id: "chemistry", label: "Chemistry" },
  { id: "mathematics", label: "Mathematics" },
  { id: "biology", label: "Biology" },
];

export function NotesLibrary({ onQuickRead }) {
  const [examFilter, setExamFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all"); // all | short-notes | notes
  const [search, setSearch] = useState("");

  const notesBooks = useMemo(() => {
    return openBooks.filter(
      (b) =>
        b.resourceKind === "notes" ||
        b.resourceKind === "short-notes" ||
        /note|formula|handbook|mindmap|cheat sheet|revision/i.test(`${b.title} ${b.description}`),
    );
  }, []);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notesBooks.filter((b) => {
      const matchExam =
        examFilter === "all" ||
        (b.examFocus || []).some((e) => e.toLowerCase().includes(examFilter));

      const matchSubject =
        subjectFilter === "all" ||
        b.subject.toLowerCase() === subjectFilter.toLowerCase() ||
        (b.subjects || []).some((s) => s.toLowerCase() === subjectFilter.toLowerCase());

      const matchKind =
        kindFilter === "all" ||
        (kindFilter === "short-notes"
          ? b.resourceKind === "short-notes" || /formula|cheat sheet/i.test(b.title)
          : b.resourceKind === "notes" || /handwritten|lecture/i.test(b.title));

      const matchSearch =
        !q ||
        [b.title, b.author, b.publisher, b.subject, b.description]
          .join(" ")
          .toLowerCase()
          .includes(q);

      return matchExam && matchSubject && matchKind && matchSearch;
    });
  }, [examFilter, subjectFilter, kindFilter, search, notesBooks]);

  const jeeCount = notesBooks.filter((b) => (b.examFocus || []).some((e) => e.includes("JEE"))).length;
  const neetCount = notesBooks.filter((b) => (b.examFocus || []).some((e) => e.includes("NEET"))).length;
  const formulaCount = notesBooks.filter((b) => b.resourceKind === "short-notes" || /formula/i.test(b.title)).length;

  return (
    <section className="page-wrap notes-library" data-reveal>
      <div className="section-inner">
        {/* Heading */}
        <div className="dashboard-section-heading">
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <p className="eyebrow" style={{ margin: 0 }}>NOTES LIBRARY // JEE ARCHIVE &amp; NEET ARCHIVE</p>
              <Badge variant="accent">{notesBooks.length} VOLUMES</Badge>
            </div>
            <h1>Revision at your<br /><em>fingertips.</em></h1>
            <p>
              Handcrafted short notes, Kota topper revision charts, high-yield formula sheets, and chapter mind maps for JEE Main, JEE Advanced, and NEET.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="panel" style={{ marginBottom: "2rem", padding: "1.5rem", borderRadius: "1.25rem", background: "var(--card)" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <span className="label" style={{ fontSize: "0.75rem", fontFamily: "var(--mono)", color: "var(--muted)" }}>EXAM</span>
            {EXAMS.map((exam) => (
              <button
                key={exam.id}
                type="button"
                className={`filter-chip ${examFilter === exam.id ? "is-active" : ""}`}
                onClick={() => { soundEngine.playClick(); setExamFilter(exam.id); }}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor: examFilter === exam.id ? "var(--accent)" : "var(--border)",
                  background: examFilter === exam.id ? "rgba(215,173,120,0.15)" : "transparent",
                  color: examFilter === exam.id ? "var(--accent)" : "var(--ink)",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontFamily: "var(--mono)",
                }}
              >
                {exam.label}
              </button>
            ))}

            <span style={{ margin: "0 0.5rem", color: "var(--border)" }}>|</span>

            <span className="label" style={{ fontSize: "0.75rem", fontFamily: "var(--mono)", color: "var(--muted)" }}>SUBJECT</span>
            {SUBJECTS.map((sub) => (
              <button
                key={sub.id}
                type="button"
                className={`filter-chip ${subjectFilter === sub.id ? "is-active" : ""}`}
                onClick={() => { soundEngine.playClick(); setSubjectFilter(sub.id); }}
                style={{
                  padding: "0.4rem 0.9rem",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor: subjectFilter === sub.id ? "var(--accent)" : "var(--border)",
                  background: subjectFilter === sub.id ? "rgba(215,173,120,0.15)" : "transparent",
                  color: subjectFilter === sub.id ? "var(--accent)" : "var(--ink)",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontFamily: "var(--mono)",
                }}
              >
                {sub.label}
              </button>
            ))}

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search formula, author, topic..."
              style={{
                marginLeft: "auto",
                padding: "0.45rem 1.1rem",
                borderRadius: "999px",
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.02)",
                color: "var(--ink)",
                fontSize: "0.85rem",
                minWidth: "220px",
              }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          <div className="stat-card panel" style={{ flex: 1, minWidth: "150px", padding: "1.25rem", borderRadius: "1rem", background: "var(--card)" }}>
            <span className="eyebrow">RESOURCES FOUND</span>
            <div className="stat" style={{ fontSize: "1.8rem", fontWeight: 700, fontFamily: "var(--mono)", marginTop: "4px" }}>{items.length}</div>
          </div>
          <div className="stat-card panel" style={{ flex: 1, minWidth: "150px", padding: "1.25rem", borderRadius: "1rem", background: "var(--card)" }}>
            <span className="eyebrow">JEE REVISION NOTES</span>
            <div className="stat" style={{ fontSize: "1.8rem", fontWeight: 700, fontFamily: "var(--mono)", marginTop: "4px" }}>{jeeCount}</div>
          </div>
          <div className="stat-card panel" style={{ flex: 1, minWidth: "150px", padding: "1.25rem", borderRadius: "1rem", background: "var(--card)" }}>
            <span className="eyebrow">NEET REVISION NOTES</span>
            <div className="stat" style={{ fontSize: "1.8rem", fontWeight: 700, fontFamily: "var(--mono)", marginTop: "4px" }}>{neetCount}</div>
          </div>
          <div className="stat-card panel" style={{ flex: 1, minWidth: "150px", padding: "1.25rem", borderRadius: "1rem", background: "var(--card)" }}>
            <span className="eyebrow">FORMULA SHEETS</span>
            <div className="stat" style={{ fontSize: "1.8rem", fontWeight: 700, fontFamily: "var(--mono)", marginTop: "4px" }}>{formulaCount}</div>
          </div>
        </div>

        {/* Grid */}
        <div className="book-grid notes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1.5rem" }}>
          {items.length === 0 ? (
            <div className="ui-empty-state" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>
              <span aria-hidden="true" style={{ fontSize: "2rem" }}>✳</span>
              <h2>No revision notes match your filters.</h2>
              <p>Try switching exams, subjects, or clearing your search query.</p>
            </div>
          ) : (
            items.map((book) => (
              <Card key={book.id} className="note-card" style={{ borderRadius: "1rem", padding: "1.5rem", background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", border: "1px solid rgba(215,173,120,0.3)", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(215,173,120,0.08)", fontFamily: "var(--mono)" }}>
                      {book.resourceKind === "short-notes" ? "FORMULA SHEET" : "REVISION NOTES"}
                    </span>
                    {(book.examFocus || []).map((ex) => (
                      <Badge key={ex} variant="accent" style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem" }}>{ex}</Badge>
                    ))}
                    <Badge variant="default" style={{ marginLeft: "auto", fontSize: "0.65rem" }}>{book.publisher}</Badge>
                  </div>

                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.08rem", lineHeight: "1.35", color: "var(--ink)" }}>{book.title}</h3>
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
                        Preview
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
            ))
          )}
        </div>
      </div>
    </section>
  );
}
