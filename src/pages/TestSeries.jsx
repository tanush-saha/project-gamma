import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui.jsx";
import { openBooks } from "../books.js";

const TESTS = [
  { id: "jeemain", label: "JEE Main" },
  { id: "jeeadvanced", label: "JEE Advanced" },
  { id: "neet", label: "NEET" },
];

export function TestSeries() {
  const [testFilter, setTestFilter] = useState("all");
  const referenceBooks = openBooks.filter((b) => b.type === "reference");
  const items = useMemo(() => referenceBooks.filter((book) => {
    const isTest = /mock|test series|test/i.test(book.title);
    const matchTest = testFilter === "all" || (book.examFocus || []).some((e) => e.toLowerCase().includes(testFilter));
    return isTest && matchTest;
  }), [testFilter, referenceBooks]);
  return (
    <section className="page-wrap test-series" data-reveal>
      <div className="section-inner">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">TEST SERIES · JEE &amp; NEET</p>
            <h1>Mock tests that<br /><em>matter.</em></h1>
            <p>JEE Main, JEE Advanced and NEET mock test series and previous years' papers to practise under exam conditions.</p>
          </div>
        </div>
        <div className="test-filters panel" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <span className="label">EXAM</span>
            <button className={`chip ${testFilter === "all" ? "is-active" : ""}`} onClick={() => setTestFilter("all")} style={{ padding: "0.4rem 1rem", borderRadius: "999px", border: "1px solid var(--border)", background: "transparent", color: "var(--fg)", cursor: "pointer", fontSize: "0.85rem" }}>All</button>
            {TESTS.map((t) => (
              <button key={t.id} className={`chip ${testFilter === t.id ? "is-active" : ""}`} onClick={() => setTestFilter(t.id)} style={{ padding: "0.4rem 1rem", borderRadius: "999px", border: "1px solid var(--border)", background: "transparent", color: "var(--fg)", cursor: "pointer", fontSize: "0.85rem", ...(testFilter === t.id ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}) }}>{t.label}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <span className="eyebrow">{items.length} test resources</span>
        </div>
        <div className="book-grid test-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {items.length === 0 ? (
            <div className="ui-empty-state" style={{ gridColumn: "1 / -1", textAlign: "center" }}><span aria-hidden="true">✳</span><h2>No tests match your filter.</h2><p>Choose another exam.</p></div>
          ) : (
            items.map((book) => (
              <Card key={book.id} className="test-card" style={{ borderRadius: "1rem" }}>
                <div className="card-body">
                  <span style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", border: "1px solid var(--border-soft)", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "var(--accent-dim)", display: "block", width: "fit-content", marginBottom: "0.5rem" }}>{book.examFocus?.[0]}</span>
                  <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1rem", lineHeight: "1.3", color: "var(--fg)" }}>{book.title}</h3>
                  <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.8rem", color: "var(--fg-muted)", lineHeight: "1.4" }}>{book.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--fg-soft)", fontFamily: '"DM Mono", monospace' }}>{book.subject} · Classes XI–XII</span>
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
