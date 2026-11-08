import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Badge } from "../components/ui.jsx";
import { openBooks } from "../books.js";

const EXAMS = [
  { id: "jee", label: "JEE Main & Advanced" },
  { id: "neet", label: "NEET" },
];

export function NotesLibrary() {
  const [examFilter, setExamFilter] = useState("all");
  const [search, setSearch] = useState("");
  const referenceBooks = openBooks.filter((b) => b.type === "reference");
  const items = useMemo(() => referenceBooks.filter((book) => {
    const matchExam = examFilter === "all" || book.examFocus?.some((e) => e.toLowerCase().includes(examFilter));
    const matchSearch = book.title.toLowerCase().includes(search.toLowerCase()) || book.author.toLowerCase().includes(search.toLowerCase());
    return matchExam && matchSearch;
  }), [examFilter, search, referenceBooks]);
  const jeeCount = referenceBooks.filter((b) => b.examFocus?.some((e) => e === "JEE" || e === "JEE Main" || e === "JEE Advanced")).length;
  const neetCount = referenceBooks.filter((b) => b.examFocus?.includes("NEET")).length;
  return (
    <section className="page-wrap notes-library" data-reveal>
      <div className="section-inner">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">NOTES LIBRARY · JEE &amp; NEET</p>
            <h1>Revision at your<br /><em>fingertips.</em></h1>
            <p>PYQs, short notes, formula sheets, handwritten notes, coaching modules and mock tests — organised by exam and subject.</p>
          </div>
        </div>
        <div className="notes-filters panel" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <span className="label">EXAM</span>
            <button className={`filter-chip ${examFilter === "all" ? "is-active" : ""}`} onClick={() => setExamFilter("all")} style={{ padding: "0.4rem 1rem", borderRadius: "999px", border: "1px solid var(--border)", background: "transparent", color: "var(--fg)", cursor: "pointer", fontSize: "0.85rem" }}>All exams</button>
            {EXAMS.map((exam) => (
              <button key={exam.id} className={`filter-chip ${examFilter === exam.id ? "is-active" : ""}`} onClick={() => setExamFilter(exam.id)} style={{ padding: "0.4rem 1rem", borderRadius: "999px", border: "1px solid var(--border)", background: "transparent", color: "var(--fg)", cursor: "pointer", fontSize: "0.85rem", ...(examFilter === exam.id ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}) }}>{exam.label}</button>
            ))}
            <span style={{ marginLeft: "auto" }} />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, author, publisher…" style={{ padding: "0.5rem 1rem", borderRadius: "999px", border: "1px solid var(--border)", background: "var(--bg-panel)", color: "var(--fg)", fontSize: "0.85rem", minWidth: "220px" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          <div className="stat-card panel" style={{ flex: 1, minWidth: "150px", padding: "1.25rem" }}><span className="eyebrow">TOTAL RESOURCES</span><div className="stat">{items.length}</div></div>
          <div className="stat-card panel" style={{ flex: 1, minWidth: "150px", padding: "1.25rem" }}><span className="eyebrow">JEE RESOURCES</span><div className="stat">{jeeCount}</div></div>
          <div className="stat-card panel" style={{ flex: 1, minWidth: "150px", padding: "1.25rem" }}><span className="eyebrow">NEET RESOURCES</span><div className="stat">{neetCount}</div></div>
        </div>
        <div className="book-grid notes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
          {items.length === 0 ? (
            <div className="ui-empty-state" style={{ gridColumn: "1 / -1", textAlign: "center" }}><span aria-hidden="true">✳</span><h2>No resources match your filters.</h2><p>Try a different exam or search term.</p></div>
          ) : (
            items.map((book) => (
              <Card key={book.id} className="note-card" style={{ borderRadius: "1rem" }}>
                <div className="card-body">
                  <div style={{ display: "flex", alignItems: "start", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", border: "1px solid var(--border-soft)", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "var(--accent-dim)" }}>{book.examFocus?.[0] || book.track}</span>
                    <Badge variant="default" style={{ marginLeft: "auto", fontSize: "0.65rem", padding: "0.25rem 0.6rem" }}>{book.publisher}</Badge>
                  </div>
                  <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1rem", lineHeight: "1.3", color: "var(--fg)" }}>{book.title}</h3>
                  <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.8rem", color: "var(--fg-muted)", lineHeight: "1.4" }}>{book.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--fg-soft)", fontFamily: '"DM Mono", monospace' }}>{book.subject} · {book.level}</span>
                    <Link to={book.href} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: "0.75rem", padding: "0.4rem 0.9rem" }}>Open source ↗</Link>
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
