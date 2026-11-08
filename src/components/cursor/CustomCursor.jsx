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
      const t = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      [wrapRef, dotRef, ringRef, labelRef].forEach((r) => { if (r.current) r.current.style.transform = t; });
    };

    const mark = (e) => {
      if (!enabled || !finePointer.matches || reducedMotion.matches) return;
      const target = e.target.closest("a, button, [role='button'], [data-cursor], input, select, textarea");
      const isInteractive = Boolean(target);
      setHovered(isInteractive);
      if (isInteractive) {
        const kind = target.dataset.cursor ||
          (target.tagName === "A" ? "view" :
           target.tagName === "BUTTON" ? "open" :
           target.dataset.drag ? "drag" :
           target.dataset.play ? "play" : "view");
        setLabel(kind);
      } else {
        setLabel("");
      }
    };

    const clearInteractive = () => { setHovered(false); setLabel(""); };

    updateAvailability();
    finePointer.addEventListener("change", updateAvailability);
    reducedMotion.addEventListener("change", updateAvailability);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", mark, true);
    document.addEventListener("pointerout", clearInteractive, true);
    return () => {
      finePointer.removeEventListener("change", updateAvailability);
      reducedMotion.removeEventListener("change", updateAvailability);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", mark, true);
      document.removeEventListener("pointerout", clearInteractive, true);
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
