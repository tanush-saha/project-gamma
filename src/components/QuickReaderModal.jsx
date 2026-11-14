import React from "react";
import { Badge, Button } from "./ui.jsx";
import { soundEngine } from "../utils/audio.js";

export function QuickReaderModal({ book, isOpen, onClose, isSaved, onToggleSaved }) {
  if (!isOpen || !book) return null;

  const sourceUrl = book.publicPath
    ? `${import.meta.env.BASE_URL}${book.publicPath}`
    : book.href;

  const handleBookmark = () => {
    soundEngine.playClick();
    onToggleSaved(book);
  };

  return (
    <div
      className="quick-reader-backdrop"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="quick-reader-modal" role="dialog" aria-modal="true" aria-labelledby="reader-book-title">
        {/* Header Bar */}
        <div className="reader-modal-header">
          <div className="reader-header-badges">
            <span className="reader-kind-badge">{book.resourceKind ? book.resourceKind.toUpperCase() : "RESOURCE"}</span>
            {book.examFocus && book.examFocus.map((ex) => (
              <Badge key={ex} variant="accent">{ex}</Badge>
            ))}
            <Badge variant="default">{book.publisher}</Badge>
          </div>
          <button
            type="button"
            className="reader-close-btn"
            onClick={onClose}
            aria-label="Close reader preview"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="reader-modal-body">
          <div className="reader-cover-column">
            <div className={`reader-cover-preview cover-${book.color || "mint"}`} aria-hidden="true">
              <span className="reader-cover-pub">{book.publisher}</span>
              <strong className="reader-cover-title">{book.cover || book.subject}</strong>
              <small className="reader-cover-level">{book.level}</small>
            </div>

            <div className="reader-sidebar-actions">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-cta reader-open-btn"
                onClick={() => soundEngine.playClick()}
              >
                {book.source || "Open Official Resource"} ↗
              </a>

              <button
                type="button"
                className={`bookmark-button reader-save-btn ${isSaved ? "is-saved" : ""}`}
                onClick={handleBookmark}
                aria-pressed={isSaved}
              >
                {isSaved ? "Saved to your shelf ✳" : "Save to shelf ＋"}
              </button>
            </div>
          </div>

          <div className="reader-info-column">
            <p className="eyebrow" style={{ marginBottom: "6px" }}>
              {book.subject.toUpperCase()} · {book.track} · {book.level}
            </p>

            <h2 id="reader-book-title" className="reader-title">
              {book.title}
            </h2>

            <p className="reader-author">
              By <strong>{book.author}</strong> · Published by {book.publisher}
            </p>

            <div className="reader-description">
              <p>{book.description}</p>
            </div>

            {/* Quick Study Insights / Syllabus Alignment */}
            <div className="reader-curriculum-box">
              <span className="eyebrow">SYLLABUS &amp; EXAM UTILITY</span>
              <ul className="reader-points-list">
                <li>
                  <strong>Target Exams:</strong> {(book.examFocus || ["JEE", "NEET", "CBSE"]).join(", ")}
                </li>
                <li>
                  <strong>Class Mapping:</strong> {book.level.includes("XI") ? "Class XI Syllabus" : book.level.includes("XII") ? "Class XII Syllabus" : "Foundation & Complete Syllabus"}
                </li>
                <li>
                  <strong>Recommended Use:</strong> {book.resourceKind === "pyq" ? "Timed past-paper simulation and trend analysis" : book.resourceKind === "short-notes" ? "Rapid revision 24 hours prior to mock or actual exam" : book.resourceKind === "test" ? "Full-length 3-hour exam condition testing" : "In-depth chapter conceptual study and problem-solving exercises"}
                </li>
              </ul>
            </div>

            <div className="reader-rights-disclaimer">
              <span>SOURCE INTEGRITY &amp; ACCESS</span>
              <p>
                Study Shelf links directly to official education portals, government archives, and open publishers. Confirm current syllabus notices and edition variations before reading.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
