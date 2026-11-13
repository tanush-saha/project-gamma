import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.16, 1, 0.3, 1];
const STORAGE_KEY = "study-shelf:entered";

export function EntrySequence({ onEnter }) {
  const [step, setStep] = useState(0); // 0: threshold, 1: unfolding, 2: reveal, 3: done

  useEffect(() => {
    const alreadyEntered = sessionStorage.getItem(STORAGE_KEY) === "1";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (alreadyEntered || reducedMotion) {
      setStep(3);
      onEnter?.();
      return undefined;
    }
    const t = setTimeout(() => setStep(1), 100);
    return () => clearTimeout(t);
  }, [onEnter]);

  useEffect(() => {
    if (step !== 1) return undefined;
    const t = setTimeout(() => setStep(2), 1600);
    return () => clearTimeout(t);
  }, [step]);

  const handleSkip = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setStep(3);
    onEnter?.();
  };

  const handleDone = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setStep(3);
    onEnter?.();
  };

  return (
    <AnimatePresence>
      {step !== 3 && (
        <div
          className="entry-overlay"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
        >
          {/* Layer 0: atmospheric dark field */}
          <div className="entry-field" aria-hidden="true" />
          {/* Skip control — always visible */}
          <button
            type="button"
            className="entry-skip"
            onClick={handleSkip}
            aria-label="Skip intro"
          >
            Skip intro
          </button>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="unfold"
                className="entry-pages"
                initial={{ opacity: 0, scale: 0.85, rotateX: 20 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 1.15, rotateX: -10 }}
                transition={{ duration: 0.8, ease }}
              >
                <span className="entry-page entry-page-a" aria-hidden="true" />
                <span className="entry-page entry-page-b" aria-hidden="true" />
                <span className="entry-page entry-page-c" aria-hidden="true" />
                <span className="entry-glow" aria-hidden="true" />
                <p className="entry-label">Your study shelf is opening</p>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="reveal"
                className="entry-reveal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease }}
              >
                <div className="entry-mark" aria-hidden="true">s.</div>
                <h1 className="entry-title">Study<br />Shelf</h1>
                <p className="entry-sub">A personal library in a quiet cosmos.</p>
                <button
                  type="button"
                  className="entry-continue"
                  onClick={handleDone}
                  aria-label="Enter your study universe"
                >
                  Enter your study universe
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
