import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Badge } from "../components/ui.jsx";
import { openBooks } from "../books.js";
import { soundEngine } from "../utils/audio.js";

const PROVIDERS = [
  { id: "all", label: "All Institutes" },
  { id: "allen", label: "ALLEN Kota" },
  { id: "resonance", label: "Resonance" },
  { id: "pw", label: "Physics Wallah" },
  { id: "fiitjee", label: "FIITJEE" },
  { id: "aakash", label: "Aakash" },
];

export function CoachingMaterial({ onQuickRead }) {
  const [providerFilter, setProviderFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");
  const [search, setSearch] = useState("");

  const coachingItems = useMemo(() => {
    return openBooks.filter((b) => {
      return (
        b.resourceKind === "coaching" ||
        /allen|aakash|resonance|pw|physics wallah|fiitjee|motion|bansal|vmc|vidyamandir|dlp|gmp|module|study material/i.test(
          `${b.title} ${b.publisher} ${b.description}`,
        )
      );
    });
  }, []);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coachingItems.filter((book) => {
      const matchProvider =
        providerFilter === "all" ||
        book.publisher.toLowerCase().includes(providerFilter) ||
        book.title.toLowerCase().includes(providerFilter);

      const matchExam =
        examFilter === "all" ||
        (book.examFocus || []).some((e) => e.toLowerCase().includes(examFilter));

      const matchSearch =
        !q ||
        [book.title, book.publisher, book.subject, book.description]
          .join(" ")
          .toLowerCase()
          .includes(q);

      return matchProvider && matchExam && matchSearch;
    });
  }, [providerFilter, examFilter, search, coachingItems]);

  return (
    <section className="page-wrap coaching-material" data-reveal>
      <div className="section-inner">
        {/* Heading */}
        <div className="dashboard-section-heading">
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <p className="eyebrow" style={{ margin: 0 }}>COACHING REPOSITORIES // KOTA &amp; NATIONAL DLP</p>
              <Badge variant="accent">ALLEN · RESO · PW · FIITJEE · AAKASH</Badge>
            </div>
            <h1>Premier coaching<br /><em>classroom modules.</em></h1>
            <p>
              Classroom study material, Daily Practice Problems (DPPs), Rank Booster sheets, and Grand Masters Packages from India's premier entrance institutes.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="panel" style={{ marginBottom: "2rem", padding: "1.5rem", borderRadius: "1.25rem", background: "var(--card)" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <span className="label" style={{ fontSize: "0.75rem", fontFamily: "var(--mono)", color: "var(--muted)" }}>INSTITUTE</span>
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip ${providerFilter === p.id ? "is-active" : ""}`}
                onClick={() => { soundEngine.playClick(); setProviderFilter(p.id); }}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor: providerFilter === p.id ? "var(--accent)" : "var(--border)",
                  background: providerFilter === p.id ? "rgba(215,173,120,0.15)" : "transparent",
                  color: providerFilter === p.id ? "var(--accent)" : "var(--ink)",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontFamily: "var(--mono)",
                }}
              >
                {p.label}
              </button>
            ))}

            <span style={{ margin: "0 0.5rem", color: "var(--border)" }}>|</span>

            <span className="label" style={{ fontSize: "0.75rem", fontFamily: "var(--mono)", color: "var(--muted)" }}>TARGET</span>
            {["all", "jee", "neet"].map((ex) => (
              <button
                key={ex}
                type="button"
                className={`chip ${examFilter === ex ? "is-active" : ""}`}
                onClick={() => { soundEngine.playClick(); setExamFilter(ex); }}
                style={{
                  padding: "0.4rem 0.9rem",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor: examFilter === ex ? "var(--accent)" : "var(--border)",
                  background: examFilter === ex ? "rgba(215,173,120,0.15)" : "transparent",
                  color: examFilter === ex ? "var(--accent)" : "var(--ink)",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontFamily: "var(--mono)",
                  textTransform: "uppercase",
                }}
              >
                {ex === "all" ? "All Exams" : ex}
              </button>
            ))}

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search module name or topic..."
              style={{
                marginLeft: "auto",
                padding: "0.45rem 1.1rem",
                borderRadius: "999px",
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.02)",
                color: "var(--ink)",
                fontSize: "0.85rem",
                minWidth: "200px",
              }}
            />
          </div>
        </div>

        {/* Counter */}
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="eyebrow">{items.length} MODULE SETS AVAILABLE</span>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
            Updated from JEE Archive &amp; NEET Archive
          </span>
        </div>

        {/* Grid */}
        <div className="book-grid coach-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1.5rem" }}>
          {items.length === 0 ? (
            <div className="ui-empty-state" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>
              <span aria-hidden="true" style={{ fontSize: "2rem" }}>✳</span>
              <h2>No coaching modules match your filter.</h2>
              <p>Try switching to "All Institutes" or clearing the search query.</p>
            </div>
          ) : (
            items.map((book) => (
              <Card key={book.id} className="coach-card" style={{ borderRadius: "1rem", padding: "1.5rem", background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", border: "1px solid rgba(215,173,120,0.3)", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(215,173,120,0.08)", fontFamily: "var(--mono)" }}>
                      {book.publisher}
                    </span>
                    {(book.examFocus || []).map((ex) => (
                      <Badge key={ex} variant="accent" style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem" }}>{ex}</Badge>
                    ))}
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
                        Details
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
