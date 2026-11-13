import React from "react";
import { EmptyState } from "./ui.jsx";

const kindLabels = {
  book: "Book",
  ncert: "NCERT",
  notes: "Notes",
  "short-notes": "Short notes",
  coaching: "Coaching",
  test: "Test",
  pyq: "Past paper",
  foundation: "Foundation",
  open: "Open",
};

export function ResourceRows({ items, emptyTitle, emptyCopy }) {
  if (!items.length) {
    return <EmptyState title={emptyTitle}>{emptyCopy}</EmptyState>;
  }
  return (
    <ol className="archive-rows">
      {items.map((book, index) => (
        <li className="archive-row" key={book.id}>
          <a href={book.href} target="_blank" rel="noopener noreferrer">
            <span className="archive-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="archive-row-copy">
              <strong>{book.title}</strong>
              <small>{book.publisher} · {book.subject} · {book.level}</small>
            </span>
            <em>{kindLabels[book.resourceKind] || "Source"}</em>
            <b aria-hidden="true">↗</b>
          </a>
          <p>{book.description}</p>
        </li>
      ))}
    </ol>
  );
}
