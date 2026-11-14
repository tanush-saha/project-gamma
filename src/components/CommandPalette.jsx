import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { openBooks } from "../books.js";
import { soundEngine } from "../utils/audio.js";

export function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      soundEngine.playHover();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static navigation actions
  const quickActions = [
    { id: "act-home", title: "Home — Cosmos Portal", category: "Navigation", path: "/", icon: "⌂" },
    { id: "act-library", title: "Discover — Books & Open Library", category: "Navigation", path: "/library", icon: "▤" },
    { id: "act-trigo", title: "Interactive Trigo Lab & Unit Circle", category: "Tools", path: "/trigo", icon: "◉" },
    { id: "act-notes", title: "Notes Library & Formula Sheets", category: "Navigation", path: "/notes", icon: "∑" },
    { id: "act-coaching", title: "Coaching Material (Allen, PW, Reso)", category: "Navigation", path: "/coaching", icon: "🏫" },
    { id: "act-pyq", title: "Past Papers (PYQs) 1978–2025", category: "Navigation", path: "/pyq", icon: "📄" },
    { id: "act-tests", title: "Mock Test Series & CBT Simulator", category: "Navigation", path: "/tests", icon: "⚡" },
    { id: "act-study-map", title: "Study Map & Syllabus Progress", category: "Workspace", path: "/dashboard/progress", icon: "✓" },
  ];

  // Filter items
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return quickActions;
    }

    const matchedActions = quickActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q),
    );

    const matchedBooks = openBooks
      .filter((b) => {
        const text = `${b.title} ${b.author} ${b.subject} ${b.publisher} ${b.level} ${(b.examFocus || []).join(" ")}`.toLowerCase();
        return text.includes(q);
      })
      .slice(0, 14)
      .map((b) => ({
        id: b.id,
        title: b.title,
        category: b.resourceKind ? b.resourceKind.toUpperCase() : "RESOURCE",
        meta: `${b.publisher} · ${b.subject} · ${b.level}`,
        path: `/book/${b.id}`,
        href: b.href,
        icon: b.resourceKind === "book" ? "📖" : b.resourceKind === "pyq" ? "📄" : b.resourceKind === "test" ? "⚡" : "✳",
      }));

    return [...matchedActions, ...matchedBooks];
  }, [query]);

  // Keyboard controls
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((idx) => (idx + 1) % Math.max(1, filtered.length));
      soundEngine.playClick();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((idx) => (idx - 1 + filtered.length) % Math.max(1, filtered.length));
      soundEngine.playClick();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filtered[selectedIndex];
      if (selected) {
        soundEngine.playClick();
        if (selected.path) {
          navigate(selected.path);
        } else if (selected.href) {
          window.open(selected.href, "_blank", "noopener,noreferrer");
        }
        onClose();
      }
    }
  };

  const handleSelect = (item) => {
    soundEngine.playClick();
    if (item.path) {
      navigate(item.path);
    } else if (item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="cmd-palette-backdrop"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="cmd-palette-modal" role="dialog" aria-modal="true" aria-label="Command Palette">
        <div className="cmd-palette-search-row">
          <span className="cmd-search-icon" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            type="search"
            className="cmd-palette-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search books, notes, formulas, past papers, coaching modules... [ESC to exit]"
            aria-label="Search study shelf resources"
          />
          <button type="button" className="cmd-close-btn" onClick={onClose} aria-label="Close palette">
            ✕
          </button>
        </div>

        <div className="cmd-palette-list" ref={listRef}>
          {filtered.length === 0 ? (
            <div className="cmd-empty-state">
              <span>✳</span>
              <p>No matching resources found for "{query}".</p>
              <small>Try searching for "HC Verma", "Trigo", "Allen", "NEET", or "Calculus".</small>
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.id}
                className={`cmd-palette-item ${selectedIndex === idx ? "is-selected" : ""}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span className="cmd-item-icon" aria-hidden="true">{item.icon}</span>
                <div className="cmd-item-info">
                  <div className="cmd-item-title">{item.title}</div>
                  {item.meta && <div className="cmd-item-meta">{item.meta}</div>}
                </div>
                <span className="cmd-item-badge">{item.category}</span>
                <span className="cmd-item-enter" aria-hidden="true">↵</span>
              </div>
            ))
          )}
        </div>

        <div className="cmd-palette-footer">
          <div className="cmd-footer-keys">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <div className="cmd-footer-count">
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </div>
        </div>
      </div>
    </div>
  );
}
