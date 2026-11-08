import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui.jsx";
import { openBooks } from "../books.js";

const PROVIDERS = [
  { id: "allen", label: "ALLEN" },
  { id: "aakash", label: "Aakash" },
  { id: "resonance", label: "Resonance" },
  { id: "pw", label: "Physics Wallah (PW)" },
  { id: "fiitjee", label: "FIITJEE" },
];

export function CoachingMaterial() {
  const [providerFilter, setProviderFilter] = useState("all");
  const referenceBooks = openBooks.filter((b) => b.type === "reference");
  const items = useMemo(() => referenceBooks.filter((book) => {
    const isModule = /allen|aakash|resonance|pw|physics wallah|fiitjee|module|study material/i.test(book.title + " " + book.publisher);
    const matchProvider = providerFilter === "all" || book.publisher.toLowerCase().includes(providerFilter);
    return isModule && matchProvider;
  }), [providerFilter, referenceBooks]);
  return (
    <section className="page-wrap coaching-material" data-reveal>
      <div className="section-inner">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">COACHING MATERIAL · JEE &amp; NEET</p>
            <h1>Trusted coaching<br /><em>modules.</em></h1>
            <p>Study material and module sets from ALLEN, Aakash, Resonance, Physics Wallah and FIITJEE for JEE and NEET preparation.</p>
          </div>
        </div>
        <div className="coach-filters panel" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <span className="label">PROVIDER</span>
            <button className={`chip ${providerFilter === "all" ? "is-active" : ""}`} onClick={() => setProviderFilter("all")} style={{ padding: "0.4rem 1rem", borderRadius: "999px", border: "1px solid var(--border)", background: "transparent", color: "var(--fg)", cursor: "pointer", fontSize: "0.85rem" }}>All</button>
            {PROVIDERS.map((p) => (
              <button key={p.id} className={`chip ${providerFilter === p.id ? "is-active" : ""}`} onClick={() => setProviderFilter(p.id)} style={{ padding: "0.4rem 1rem", borderRadius: "999px", border: "1px solid var(--border)", background: "transparent", color: "var(--fg)", cursor: "pointer", fontSize: "0.85rem", ...(providerFilter === p.id ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}) }}>{p.label}</button>
            ))}
            <span style={{ marginLeft: "auto" }} />
          </div>
        </div>
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <span className="eyebrow">{items.length} module sets</span>
        </div>
        <div className="book-grid coach-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {items.length === 0 ? (
            <div className="ui-empty-state" style={{ gridColumn: "1 / -1", textAlign: "center" }}><span aria-hidden="true">✳</span><h2>No modules match your filter.</h2><p>Choose another provider.</p></div>
          ) : (
            items.map((book) => (
              <Card key={book.id} className="coach-card" style={{ borderRadius: "1rem" }}>
                <div className="card-body">
                  <span style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", border: "1px solid var(--border-soft)", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "var(--accent-dim)", display: "block", width: "fit-content", marginBottom: "0.5rem" }}>{book.examFocus?.[0]}</span>
                  <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1rem", lineHeight: "1.3", color: "var(--fg)" }}>{book.title}</h3>
                  <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.8rem", color: "var(--fg-muted)", lineHeight: "1.4" }}>{book.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--fg-soft)", fontFamily: '"DM Mono", monospace' }}>{book.publisher} · {book.subject}</span>
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
