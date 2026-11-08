import React, { useMemo, useState } from "react";
import { Card, EmptyState } from "../components/ui.jsx";
import { openBooks } from "../books.js";

const referenceBooks = openBooks.filter((book) => book.type === "reference");
const examOptions = [
  { value: "all", label: "All exams" },
  { value: "jee", label: "JEE Main & Advanced" },
  { value: "neet", label: "NEET" },
];

function isPreviousYearResource(book) {
  return /pyq|previous years?|past papers?|solved papers?/i.test(book.title);
}

export function PYQExplorer() {
  const [examFilter, setExamFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [search, setSearch] = useState("");

  const subjects = useMemo(() => [...new Set(
    referenceBooks.filter(isPreviousYearResource).map((book) => book.subject),
  )].sort((a, b) => a.localeCompare(b)), []);

  const items = useMemo(() => {
    const query = search.trim().toLowerCase();
    return referenceBooks
      .filter(isPreviousYearResource)
      .filter((book) => subjectFilter === "all" || book.subject.toLowerCase() === subjectFilter)
      .filter((book) => examFilter === "all"
        || (book.examFocus || []).some((exam) => exam.toLowerCase().startsWith(examFilter)))
      .filter((book) => !query || [book.title, book.author, book.subject, book.publisher, book.description]
        .join(" ").toLowerCase().includes(query))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [examFilter, search, subjectFilter]);

  function clearFilters() {
    setExamFilter("all");
    setSubjectFilter("all");
    setSearch("");
  }

  return (
    <section className="page-wrap pyq-explorer" data-reveal>
      <div className="section-inner">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">PAST PAPERS · JEE &amp; NEET</p>
            <h1>Learn from the<br /><em>questions before.</em></h1>
            <p>Find previous-years’ questions and solved-paper references, organised by exam and subject. Open each source to check its available edition or preview.</p>
          </div>
        </div>

        <div className="pyq-filters panel" aria-label="Filter past-paper resources">
          <label>
            <span className="label">EXAM</span>
            <select value={examFilter} onChange={(event) => setExamFilter(event.target.value)}>
              {examOptions.map((exam) => <option key={exam.value} value={exam.value}>{exam.label}</option>)}
            </select>
          </label>
          <label>
            <span className="label">SUBJECT</span>
            <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
              <option value="all">All subjects</option>
              {subjects.map((subject) => <option key={subject} value={subject.toLowerCase()}>{subject}</option>)}
            </select>
          </label>
          <label className="pyq-search">
            <span className="label">SEARCH</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title, author, or publisher"
            />
          </label>
          <button type="button" className="btn-ghost pyq-clear" onClick={clearFilters}>Clear filters</button>
        </div>

        <div className="pyq-results-heading" aria-live="polite">
          <span className="eyebrow">{items.length} {items.length === 1 ? "RESOURCE" : "RESOURCES"}</span>
          <span>Past-paper books and practice references</span>
        </div>

        {items.length === 0 ? (
          <EmptyState title="No past-paper resources found">
            Try a different exam or subject, or clear your search.
          </EmptyState>
        ) : (
          <div className="book-grid pyq-grid">
            {items.map((book) => (
              <Card key={book.id} className="pyq-card">
                <div className="card-body">
                  <div className="pyq-card-meta">
                    <span className="pyq-tag">{book.examFocus?.join(" · ") || book.track}</span>
                    <span>{book.publisher}</span>
                  </div>
                  <h2>{book.title}</h2>
                  <p>{book.description}</p>
                  <div className="pyq-card-footer">
                    <span>{book.subject} · {book.author}</span>
                    <a href={book.href} target="_blank" rel="noopener noreferrer">
                      {book.source || "Open source"} <span aria-hidden="true">↗</span>
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
