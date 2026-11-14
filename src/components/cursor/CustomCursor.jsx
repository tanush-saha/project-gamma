import React, { useEffect, useRef, useState } from "react";

export function CustomCursor({ enabled = true }) {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);

  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [label, setLabel] = useState("");
  const [cursorDisabled, setCursorDisabled] = useState(() => {
    try {
      return localStorage.getItem("study-shelf:cursor-mode") === "system";
    } catch {
      return false;
    }
  });

  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const rafId = useRef(0);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const docEl = document.documentElement;

    const updateAvailability = () => {
      const available = enabled && !cursorDisabled && finePointer.matches && !reducedMotion.matches;
      setActive(available);
      docEl.classList.toggle("cursor-hidden", available);
      if (!available) {
        setHovered(false);
        setLabel("");
      }
    };

    updateAvailability();
    finePointer.addEventListener("change", updateAvailability);
    reducedMotion.addEventListener("change", updateAvailability);

    return () => {
      finePointer.removeEventListener("change", updateAvailability);
      reducedMotion.removeEventListener("change", updateAvailability);
      docEl.classList.remove("cursor-hidden");
    };
  }, [enabled, cursorDisabled]);

  useEffect(() => {
    if (!active) return undefined;

    const handlePointerMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }

      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const target = hit?.closest?.("a, button, [role='button'], [data-cursor], input, select, textarea, .book-card, .pyq-card, .note-card, .coach-card, .test-card");
      const isInteractive = Boolean(target);
      setHovered(isInteractive);

      if (!isInteractive) {
        setLabel("");
      } else {
        const customKind = target.getAttribute("data-cursor");
        if (customKind) {
          setLabel(customKind);
        } else if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
          setLabel("TYPE");
        } else if (target.classList.contains("bookmark-button")) {
          setLabel("SAVE");
        } else if (target.classList.contains("source-link") || target.href) {
          setLabel("OPEN");
        } else if (target.tagName === "BUTTON") {
          setLabel("SELECT");
        } else {
          setLabel("VIEW");
        }
      }
    };

    // Smooth lerp loop for the outer ring and label
    const loop = () => {
      // Lerp ring towards mouse position
      const factor = 0.22;
      ring.current.x += (mouse.current.x - ring.current.x) * factor;
      ring.current.y += (mouse.current.y - ring.current.y) * factor;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (labelRef.current) {
        labelRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId.current = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    rafId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(rafId.current);
    };
  }, [active]);

  if (!enabled || !active) return null;

  return (
    <div className="custom-cursor-wrap" aria-hidden="true">
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className={`cursor-ring ${hovered ? "is-hovered" : ""}`} />
      <div ref={labelRef} className={`cursor-label ${label ? "visible" : ""}`}>
        {label}
      </div>
    </div>
  );
}
