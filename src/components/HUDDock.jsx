import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { soundEngine } from "../utils/audio.js";

export function HUDDock({
  onOpenCommand,
  onToggleRadio,
  isRadioOpen,
  onReplayIntro,
  savedCount = 0,
}) {
  const location = useLocation();
  const [activeTooltip, setActiveTooltip] = useState(null);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleHover = (label) => {
    setActiveTooltip(label);
    soundEngine.playHover();
  };

  const handleLeave = () => {
    setActiveTooltip(null);
  };

  const scrollToTop = () => {
    soundEngine.playClick();
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  return (
    <nav className="hud-dock-wrapper" aria-label="HUD Quick Dock">
      <div className="hud-dock-container">
        {/* Search */}
        <button
          type="button"
          className="hud-dock-item"
          onClick={() => {
            soundEngine.playClick();
            onOpenCommand?.();
          }}
          onMouseEnter={() => handleHover("Command Search (Ctrl+K)")}
          onMouseLeave={handleLeave}
          title="Search books, notes, formulas (Ctrl+K)"
          aria-label="Open command search"
        >
          <span className="hud-icon">⌕</span>
          <span className="hud-badge-kbd">⌘K</span>
        </button>

        <span className="hud-dock-divider" aria-hidden="true" />

        {/* Trigo Lab */}
        <Link
          to="/trigo"
          className={`hud-dock-item ${isActive("/trigo") ? "is-active" : ""}`}
          onClick={() => soundEngine.playClick()}
          onMouseEnter={() => handleHover("Trigo & Unit Circle Lab")}
          onMouseLeave={handleLeave}
          title="Trigonometry & Unit Circle Lab"
          aria-label="Trigonometry & Unit Circle Lab"
        >
          <span className="hud-icon">📐</span>
          <span className="hud-mini-label">Trigo</span>
        </Link>

        {/* CBT Drill Exam Simulator */}
        <Link
          to="/drill"
          className={`hud-dock-item hud-dock-highlight ${isActive("/drill") ? "is-active" : ""}`}
          onClick={() => soundEngine.playClick()}
          onMouseEnter={() => handleHover("NTA CBT Exam Simulator")}
          onMouseLeave={handleLeave}
          title="NTA CBT Exam Simulator"
          aria-label="NTA CBT Exam Simulator"
        >
          <span className="hud-icon">⚡</span>
          <span className="hud-mini-label">CBT Drill</span>
          <span className="hud-pulse-glow" aria-hidden="true" />
        </Link>

        {/* Chem Nexus Periodic Matrix */}
        <Link
          to="/chem"
          className={`hud-dock-item ${isActive("/chem") ? "is-active" : ""}`}
          onClick={() => soundEngine.playClick()}
          onMouseEnter={() => handleHover("Chemistry Nexus & Periodic Matrix")}
          onMouseLeave={handleLeave}
          title="Chemistry Nexus & Periodic Matrix"
          aria-label="Chemistry Nexus & Periodic Matrix"
        >
          <span className="hud-icon">🧪</span>
          <span className="hud-mini-label">Chem</span>
        </Link>

        {/* Notes & Formulas */}
        <Link
          to="/notes"
          className={`hud-dock-item ${isActive("/notes") ? "is-active" : ""}`}
          onClick={() => soundEngine.playClick()}
          onMouseEnter={() => handleHover("Topper Notes & Formula Books")}
          onMouseLeave={handleLeave}
          title="Topper Notes & Formula Books"
          aria-label="Topper Notes & Formula Books"
        >
          <span className="hud-icon">📝</span>
          <span className="hud-mini-label">Notes</span>
        </Link>

        {/* Coaching Modules */}
        <Link
          to="/coaching"
          className={`hud-dock-item ${isActive("/coaching") ? "is-active" : ""}`}
          onClick={() => soundEngine.playClick()}
          onMouseEnter={() => handleHover("Kota Coaching Modules")}
          onMouseLeave={handleLeave}
          title="Kota Coaching Modules (Allen, Reso, PW)"
          aria-label="Kota Coaching Modules"
        >
          <span className="hud-icon">🏛️</span>
          <span className="hud-mini-label">Kota</span>
        </Link>

        <span className="hud-dock-divider" aria-hidden="true" />

        {/* Cosmic Radio Toggle */}
        <button
          type="button"
          className={`hud-dock-item ${isRadioOpen ? "is-active" : ""}`}
          onClick={() => {
            soundEngine.playClick();
            onToggleRadio?.();
          }}
          onMouseEnter={() => handleHover(isRadioOpen ? "Hide Cosmic Radio" : "Open Cosmic Radio")}
          onMouseLeave={handleLeave}
          title="Toggle Cosmic Radio & Equalizer"
          aria-label="Toggle Cosmic Radio"
        >
          <span className="hud-icon">🎧</span>
          <span className="hud-mini-label">Radio</span>
        </button>

        {/* Saved Books */}
        <Link
          to="/dashboard/library"
          className={`hud-dock-item ${isActive("/dashboard/library") ? "is-active" : ""}`}
          onClick={() => soundEngine.playClick()}
          onMouseEnter={() => handleHover(`Saved Shelf (${savedCount})`)}
          onMouseLeave={handleLeave}
          title={`Saved books (${savedCount})`}
          aria-label={`Saved books (${savedCount})`}
        >
          <span className="hud-icon">✳</span>
          {savedCount > 0 && <span className="hud-count-tag">{savedCount}</span>}
        </Link>

        {/* Replay Cinematic Warp Intro */}
        {onReplayIntro && (
          <button
            type="button"
            className="hud-dock-item"
            onClick={() => {
              soundEngine.playClick();
              onReplayIntro();
            }}
            onMouseEnter={() => handleHover("Replay Cosmic Warp Intro")}
            onMouseLeave={handleLeave}
            title="Replay Cosmic Warp Intro"
            aria-label="Replay Cosmic Warp Intro"
          >
            <span className="hud-icon">🌌</span>
          </button>
        )}

        {/* Scroll To Top */}
        <button
          type="button"
          className="hud-dock-item"
          onClick={scrollToTop}
          onMouseEnter={() => handleHover("Scroll to Top")}
          onMouseLeave={handleLeave}
          title="Back to top"
          aria-label="Back to top"
        >
          <span className="hud-icon">↑</span>
        </button>
      </div>

      {/* Floating Dynamic Tooltip */}
      {activeTooltip && (
        <div className="hud-dock-tooltip" role="tooltip">
          {activeTooltip}
        </div>
      )}
    </nav>
  );
}
