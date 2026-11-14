import React, { useRef, useState } from "react";
import { soundEngine } from "../utils/audio.js";

export function HoloTiltCard({
  children,
  className = "",
  style = {},
  maxTilt = 8,
  glare = true,
  onClick,
  ...props
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState("perspective(900px) rotateX(0deg) rotateY(0deg)");
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handlePointerMove = (e) => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransform(`perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.18,
    });
  };

  const handlePointerEnter = () => {
    soundEngine.playTiltTick();
  };

  const handlePointerLeave = () => {
    setTransform("perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      className={`holo-tilt-card ${className}`}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      style={{
        ...style,
        transform,
      }}
      {...props}
    >
      {children}
      {glare && (
        <div
          className="holo-glare-overlay"
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${glarePos.opacity}) 0%, transparent 60%)`,
          }}
        />
      )}
    </div>
  );
}
