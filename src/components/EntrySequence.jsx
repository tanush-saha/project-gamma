import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { soundEngine } from "../utils/audio.js";

const ease = [0.16, 1, 0.3, 1];
const STORAGE_KEY = "study-shelf:entered";

export function EntrySequence({ onEnter }) {
  const [percent, setPercent] = useState(0);
  const [telemetry, setTelemetry] = useState("INITIALIZING COSMOS...");
  const [isReady, setIsReady] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [soundMuted, setSoundMuted] = useState(() => soundEngine.isMuted());
  const canvasRef = useRef(null);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleSkip();
      } else if ((e.key === "Enter" || e.key === " ") && isReady && !isEntering) {
        handleLaunch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReady, isEntering]);

  // Loading telemetry simulation
  useEffect(() => {
    const messages = [
      { at: 15, msg: "SYNCHRONIZING JEE & NEET ARCHIVES..." },
      { at: 42, msg: "INDEXING 250+ KOTA MODULES & CENGAGE VOLUMES..." },
      { at: 70, msg: "CALIBRATING INTERACTIVE TRIGO LAB & FORMULA ENGINE..." },
      { at: 92, msg: "DE-FRAGMENTING PAST PAPERS (1978–2025)..." },
      { at: 100, msg: "ORBITAL SHELF SYNCHRONIZED · SYSTEM READY" },
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 4;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setPercent(100);
        setTelemetry("ORBITAL SHELF SYNCHRONIZED · SYSTEM READY");
        setTimeout(() => setIsReady(true), 250);
      } else {
        setPercent(current);
        const match = messages.findLast((m) => current >= m.at);
        if (match) setTelemetry(match.msg);
      }
    }, 60);

    return () => clearInterval(interval);
  }, []);

  // Interactive Particle Warp Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const numStars = 140;
    const stars = Array.from({ length: numStars }, () => ({
      x: (Math.random() - 0.5) * width * 1.5,
      y: (Math.random() - 0.5) * height * 1.5,
      z: Math.random() * width,
      size: Math.random() * 1.5 + 0.5,
      color: Math.random() > 0.3 ? "#d7ad78" : "#81a890",
    }));

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX - width / 2) * 0.08;
      mouseY = (e.clientY - height / 2) * 0.08;
    };
    window.addEventListener("pointermove", handleMouseMove, { passive: true });

    let animationFrameId;
    const render = () => {
      ctx.fillStyle = "rgba(9, 13, 13, 0.28)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2 + mouseX;
      const cy = height / 2 + mouseY;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.z -= 4;
        if (star.z <= 0) {
          star.z = width;
          star.x = (Math.random() - 0.5) * width * 1.5;
          star.y = (Math.random() - 0.5) * height * 1.5;
        }

        const k = 220 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const alpha = Math.min(1, Math.max(0.15, 1 - star.z / width));
          ctx.beginPath();
          ctx.arc(px, py, star.size * k * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleLaunch = () => {
    setIsEntering(true);
    soundEngine.playIntroChord();
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setTimeout(() => {
      onEnter?.();
    }, 700);
  };

  const handleSkip = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    onEnter?.();
  };

  const toggleSound = () => {
    const next = soundEngine.toggleMute();
    setSoundMuted(next);
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`entry-overlay-enhanced ${isEntering ? "is-exiting" : ""}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.65, ease }}
      >
        {/* Canvas Background */}
        <canvas ref={canvasRef} className="entry-canvas-field" aria-hidden="true" />

        {/* Ambient Radial Mesh */}
        <div className="entry-radial-glow" aria-hidden="true" />
        <div className="entry-grid-overlay" aria-hidden="true" />

        {/* Top Control Bar */}
        <div className="entry-top-bar">
          <div className="entry-telemetry-badge">
            <span className="telemetry-dot" />
            <span>SYS.MATRIX // v2.6 ONLINE</span>
          </div>

          <div className="entry-top-actions">
            <button
              type="button"
              className="entry-audio-toggle"
              onClick={toggleSound}
              aria-label={soundMuted ? "Unmute audio" : "Mute audio"}
            >
              {soundMuted ? "♪ MUTED" : "♪ AUDIO ON"}
            </button>
            <button
              type="button"
              className="entry-skip-btn"
              onClick={handleSkip}
              aria-label="Skip introduction"
            >
              SKIP INTRO [ESC]
            </button>
          </div>
        </div>

        {/* Center Stage */}
        <div className="entry-center-stage">
          {/* Logo Mark with Pulsing Orb */}
          <div className="entry-brand-mark">
            <div className="entry-orb-ring" />
            <div className="entry-orb-pulse" />
            <span className="entry-mark-symbol">s.</span>
          </div>

          {/* Typography */}
          <h1 className="entry-hero-title">
            STUDY<br />
            <span>SHELF</span>
          </h1>

          <p className="entry-hero-tagline">
            THE ORBITAL REPOSITORY FOR JEE, NEET &amp; CURIOUS MINDS
          </p>

          {/* Progress / Status HUD */}
          <div className="entry-hud-loader" aria-live="polite">
            <div className="hud-metric-row">
              <span className="hud-telemetry-text">{telemetry}</span>
              <span className="hud-percent-value">{percent}%</span>
            </div>
            <div className="hud-track">
              <motion.div
                className="hud-fill"
                style={{ width: `${percent}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Action Trigger */}
          <div className="entry-actions-row">
            <button
              type="button"
              className={`entry-launch-button ${isReady ? "is-ready" : "is-loading"}`}
              onClick={handleLaunch}
              disabled={!isReady || isEntering}
              onMouseEnter={() => soundEngine.playHover()}
              aria-label="Enter your study universe"
            >
              <span className="btn-glow" />
              <span className="btn-text">
                {isEntering ? "OPENING COSMOS..." : isReady ? "ENTER STUDY UNIVERSE ↗" : "SYNCHRONIZING..."}
              </span>
            </button>
          </div>

          {/* Bottom Telemetry Metrics */}
          <div className="entry-bottom-telemetry">
            <span>[ARCHIVE: 250+ TITLES]</span>
            <span>·</span>
            <span>[JEE MAIN &amp; ADVANCED]</span>
            <span>·</span>
            <span>[NEET UG]</span>
            <span>·</span>
            <span>[INTERACTIVE TRIGO]</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
