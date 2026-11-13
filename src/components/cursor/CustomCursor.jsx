import React, { useEffect, useRef, useState } from "react";

export function CustomCursor({ enabled = true }) {
  const wrapRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const docEl = document.documentElement;
    const updateAvailability = () => {
      const available = enabled && finePointer.matches && !reducedMotion.matches;
      setActive(available);
      docEl.classList.toggle("cursor-hidden", available);
      if (!available) {
        setHovered(false);
        setLabel("");
      }
    };

    const move = (e) => {
      if (wrapRef.current) {
        wrapRef.current.style.setProperty("--cursor-x", `${e.clientX}px`);
        wrapRef.current.style.setProperty("--cursor-y", `${e.clientY}px`);
      }
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const target = hit?.closest?.("a, button, [role='button'], [data-cursor], input, select, textarea");
      const isInteractive = Boolean(target);
      setHovered(isInteractive);
      if (!isInteractive) {
        setLabel("");
        return;
      }
      const kind = target.dataset.cursor ||
        (target.tagName === "A" ? "view" :
         target.tagName === "BUTTON" ? "open" : "view");
      setLabel(kind);
    };

    updateAvailability();
    finePointer.addEventListener("change", updateAvailability);
    reducedMotion.addEventListener("change", updateAvailability);
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      finePointer.removeEventListener("change", updateAvailability);
      reducedMotion.removeEventListener("change", updateAvailability);
      window.removeEventListener("pointermove", move);
      docEl.classList.remove("cursor-hidden");
      setActive(false);
    };
  }, [enabled]);

  if (!enabled || !active) return null;

  return (
    <div ref={wrapRef} className="custom-cursor-wrap" style={{ pointerEvents: "none" }}>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className={`cursor-ring ${hovered ? "is-hovered" : ""}`} />
      <div ref={labelRef} className={`cursor-label ${label ? "visible" : ""}`}>
        {label}
      </div>
    </div>
  );
}
