import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Badge } from "../components/ui.jsx";
import { openBooks } from "../books.js";
import { soundEngine } from "../utils/audio.js";

const TESTS = [
  { id: "all", label: "All Tests" },
  { id: "jeemain", label: "JEE Main Mocks" },
  { id: "jeeadvanced", label: "JEE Advanced AITS" },
  { id: "neet", label: "NEET AIATS" },
  { id: "cbt", label: "NTA CBT Simulators" },
];

export function TestSeries({ onQuickRead }) {
  const [testFilter, setTestFilter] = useState("all");
  const [search, setSearch] = useState("");

  const testResources = useMemo(() => {
    return openBooks.filter((b) => {
      return (
        b.resourceKind === "test" ||
        /mock|test series|cbt|aits|aiats|practice test|score test/i.test(
          `${b.title} ${b.description}`,
        )
      );
    });
  }, []);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return testResources.filter((book) => {
      let matchTest = true;
      if (testFilter === "jeemain") {
        matchTest = (book.examFocus || []).some((e) => e.toLowerCase().includes("main") || e.toLowerCase() === "jee");
      } else if (testFilter === "jeeadvanced") {
        matchTest = (book.examFocus || []).some((e) => e.toLowerCase().includes("advanced") || e.toLowerCase() === "jee");
      } else if (testFilter === "neet") {
        matchTest = (book.examFocus || []).some((e) => e.toLowerCase().includes("neet"));
      } else if (testFilter === "cbt") {
        matchTest = /cbt|simulator|nta|quiz/i.test(`${book.title} ${book.description}`);
      }

      const matchSearch =
        !q ||
        [book.title, book.publisher, book.subject, book.description]
          .join(" ")
          .toLowerCase()
          .includes(q);

      return matchTest && matchSearch;
    });
  }, [testFilter, search, testResources]);

  return (
    <section className="page-wrap test-series" data-reveal>
      <div className="section-inner">
        {/* Heading */}
        <div className="dashboard-section-heading">
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <p className="eyebrow" style={{ margin: 0 }}>EXAM PRACTICE // CBT SIMULATORS &amp; MOCKS</p>
              <Badge variant="accent">3-HOUR TIMED TEST PAPERS</Badge>
            </div>
            <h1>Full-length mock tests<br /><em>that predict your rank.</em></h1>
            <p>
              Authentic computer-based test (CBT) simulators, ALLEN Leader test papers, Resonance AITS, and NTA full-syllabus exam replicates for JEE Main, JEE Advanced, and NEET.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="panel" style={{ marginBottom: "2rem", padding: "1.5rem", borderRadius: "1.25rem", background: "var(--card)" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <span className="label" style={{ fontSize: "0.75rem", fontFamily: "var(--mono)", color: "var(--muted)" }}>EXAM FORMAT</span>
            {TESTS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`chip ${testFilter === t.id ? "is-active" : ""}`}
                onClick={() => { soundEngine.playClick(); setTestFilter(t.id); }}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor: testFilter === t.id ? "var(--accent)" : "var(--border)",
                  background: testFilter === t.id ? "rgba(215,173,120,0.15)" : "transparent",
                  color: testFilter === t.id ? "var(--accent)" : "var(--ink)",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontFamily: "var(--mono)",
                }}
              >
                {t.label}
              </button>
            ))}

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search test series, institute..."
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

        {/* Counter */}
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="eyebrow">{items.length} TEST SERIES &amp; PRACTICE SUITES</span>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
            NTA CBT Compliant Format
          </span>
        </div>

        {/* Grid */}
        <div className="book-grid test-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1.5rem" }}>
          {items.length === 0 ? (
            <div className="ui-empty-state" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>
              <span aria-hidden="true" style={{ fontSize: "2rem" }}>✳</span>
              <h2>No mock tests match your filter.</h2>
              <p>Choose another exam format or reset the search filter.</p>
            </div>
          ) : (
            items.map((book) => (
              <Card key={book.id} className="test-card" style={{ borderRadius: "1rem", padding: "1.5rem", background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(56,189,248,0.08)", fontFamily: "var(--mono)" }}>
                      CBT MOCK TEST
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
                      {book.source ? `${book.source} ↗` : "Start Test ↗"}
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
