import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Stars } from "@react-three/drei";
import { MathUtils } from "three";

function BookVolume({ position, rotation, color, scale = 1, speed = 0.7 }) {
  const volume = useRef(null);
  const reducedMotion = useRef(false);

  useFrame(({ pointer }, delta) => {
    if (!volume.current || reducedMotion.current) return;
    volume.current.rotation.y = MathUtils.damp(volume.current.rotation.y, rotation[1] + pointer.x * 0.1, 3, delta);
    volume.current.rotation.x = MathUtils.damp(volume.current.rotation.x, rotation[0] - pointer.y * 0.06, 3, delta);
  });

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => { reducedMotion.current = preference.matches; };
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  return (
    <Float speed={speed} rotationIntensity={0.045} floatIntensity={0.12}>
      <group ref={volume} position={position} rotation={rotation} scale={scale}>
        <mesh position={[0, 0, -0.035]} castShadow receiveShadow>
          <boxGeometry args={[2.05, 2.72, 0.16]} />
          <meshStandardMaterial color={color} roughness={0.72} metalness={0.12} />
        </mesh>
        <mesh position={[0.045, 0, 0.055]} castShadow>
          <boxGeometry args={[1.91, 2.55, 0.12]} />
          <meshStandardMaterial color="#d5c9b0" roughness={0.92} />
        </mesh>
        <mesh position={[0, 0, 0.13]} castShadow>
          <boxGeometry args={[2.04, 2.72, 0.045]} />
          <meshStandardMaterial color={color} roughness={0.67} metalness={0.12} />
        </mesh>
        <mesh position={[-1.035, 0, 0.015]} castShadow>
          <boxGeometry args={[0.12, 2.72, 0.2]} />
          <meshStandardMaterial color="#a87950" roughness={0.5} metalness={0.38} />
        </mesh>
        {[-1.02, -0.96, 0.9, 0.96].map((x) => (
          <mesh key={x} position={[x, 0, 0.158]}>
            <boxGeometry args={[0.012, 2.43, 0.008]} />
            <meshStandardMaterial color="#e5c694" roughness={0.4} metalness={0.65} />
          </mesh>
        ))}
        <mesh position={[0, 0.1, 0.16]}>
          <torusGeometry args={[0.36, 0.008, 6, 48]} />
          <meshStandardMaterial color="#e6c58e" roughness={0.3} metalness={0.72} />
        </mesh>
        <mesh position={[0, 0.1, 0.17]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.31, 0.31, 0.01]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

function LibraryScene() {
  return (
    <>
      <fog attach="fog" args={["#090d0d", 8, 17]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[-3, 5, 6]} intensity={3} color="#f0d7b1" />
      <pointLight position={[4, 1, -2]} intensity={28} color="#7ab8a4" distance={12} />
      <pointLight position={[-4, -1, 1]} intensity={16} color="#d48754" distance={10} />
      <Stars radius={24} depth={22} count={90} factor={1.5} saturation={0} fade speed={0.12} />
      <Sparkles count={22} scale={[5.2, 4.2, 3]} size={1.5} speed={0.15} opacity={0.35} color="#d5c39e" />
      <group position={[0, 0, 0]}>
        <BookVolume position={[-0.22, -0.02, 0.1]} rotation={[0.1, -0.27, -0.06]} color="#24483e" />
        <BookVolume position={[1.14, -0.72, -0.9]} rotation={[-0.12, 0.48, 0.16]} color="#a45b3e" scale={0.58} speed={0.52} />
        <BookVolume position={[-1.26, 0.68, -1.5]} rotation={[0.2, -0.62, -0.18]} color="#60665a" scale={0.46} speed={0.58} />
      </group>
    </>
  );
}

export default function BookScene() {
  const container = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!container.current || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "120px" });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} className="book-scene-canvas">
      <Canvas
        aria-hidden="true"
        dpr={[1, 1.35]}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 0, 6.4], fov: 34 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <LibraryScene />
      </Canvas>
    </div>
  );
}
