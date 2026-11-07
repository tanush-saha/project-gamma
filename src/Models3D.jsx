import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const models = [
  { id: "atom", label: "Carbon atom", note: "A schematic nucleus and electron shells. Not to scale." },
  { id: "water", label: "Water molecule", note: "Bent H₂O geometry; the O–H bond angle is approximately 104.5°." },
  { id: "lattice", label: "Cubic unit cell", note: "A simple cubic lattice with atoms at the corners and face centres." },
  { id: "cell", label: "Animal cell", note: "A schematic view of selected membrane-bound cell structures." },
];

function addSphere(group, THREE, { x = 0, y = 0, z = 0, radius, colour, opacity = 1, wireframe = false }) {
  const geometry = new THREE.SphereGeometry(radius, 32, 24);
  const material = new THREE.MeshStandardMaterial({
    color: colour,
    roughness: 0.38,
    metalness: 0.08,
    transparent: opacity < 1,
    opacity,
    wireframe,
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(x, y, z);
  group.add(sphere);
  return sphere;
}

function addBond(group, THREE, from, to, colour, radius = 0.055) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = new THREE.Vector3().subVectors(end, start);
  const bond = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 12),
    new THREE.MeshStandardMaterial({ color: colour, roughness: 0.45 }),
  );
  bond.position.copy(start.clone().add(end).multiplyScalar(0.5));
  bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  group.add(bond);
}

function buildModel(group, id) {
  if (id === "atom") {
    const nucleus = new THREE.Group();
    const nucleons = [
      [-0.17, 0, 0, 0xff795e], [0.17, 0, 0, 0xf1cf88], [0, 0.16, 0.07, 0xf1cf88],
      [0, -0.16, -0.08, 0xff795e], [0.08, 0.05, 0.2, 0xf1cf88], [-0.07, 0.07, -0.2, 0xff795e],
    ];
    nucleons.forEach(([x, y, z, colour]) => addSphere(nucleus, THREE, { x, y, z, radius: 0.19, colour }));
    group.add(nucleus);

    const shellSpecs = [
      { radius: 1.18, rotation: [0.15, 0, 0], phase: 0, speed: 0.6 },
      { radius: 1.57, rotation: [1.15, 0.4, 0.25], phase: 1.6, speed: -0.42 },
      { radius: 1.94, rotation: [0.6, -0.6, 1], phase: 3.2, speed: 0.32 },
    ];
    const electrons = [];
    shellSpecs.forEach((spec, index) => {
      const points = [];
      for (let step = 0; step <= 120; step += 1) {
        const theta = (step / 120) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * spec.radius, Math.sin(theta) * spec.radius, 0));
      }
      const orbitGroup = new THREE.Group();
      orbitGroup.rotation.set(...spec.rotation);
      orbitGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0xe9a483, transparent: true, opacity: 0.7 }),
      ));
      const electron = addSphere(orbitGroup, THREE, {
        x: Math.cos(spec.phase) * spec.radius,
        y: Math.sin(spec.phase) * spec.radius,
        radius: 0.095,
        colour: 0x8dd3c1,
      });
      group.add(orbitGroup);
      electrons.push({ electron, spec, orbitGroup, index });
    });
    return (time) => electrons.forEach(({ electron, spec, orbitGroup, index }) => {
      const theta = spec.phase + time * spec.speed;
      electron.position.set(Math.cos(theta) * spec.radius, Math.sin(theta) * spec.radius, 0);
      orbitGroup.rotation.z += index === 0 ? 0.0007 : 0;
    });
  }

  if (id === "water") {
    const angle = 104.5 * (Math.PI / 180);
    const hydrogenOne = [Math.sin(angle / 2) * 1.06, Math.cos(angle / 2) * 1.06, 0];
    const hydrogenTwo = [-hydrogenOne[0], hydrogenOne[1], 0];
    addBond(group, THREE, [0, 0, 0], hydrogenOne, 0xd5c8ae, 0.07);
    addBond(group, THREE, [0, 0, 0], hydrogenTwo, 0xd5c8ae, 0.07);
    addSphere(group, THREE, { radius: 0.45, colour: 0xe7775b });
    addSphere(group, THREE, { x: hydrogenOne[0], y: hydrogenOne[1], radius: 0.24, colour: 0x89b8cf });
    addSphere(group, THREE, { x: hydrogenTwo[0], y: hydrogenTwo[1], radius: 0.24, colour: 0x89b8cf });
    return (time) => { group.rotation.y = Math.sin(time * 0.35) * 0.09; };
  }

  if (id === "lattice") {
    const cubeSize = 2.8;
    const cube = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)),
      new THREE.LineBasicMaterial({ color: 0xe0b28f }),
    );
    group.add(cube);
    const coordinate = cubeSize / 2;
    for (const x of [-coordinate, coordinate]) {
      for (const y of [-coordinate, coordinate]) {
        for (const z of [-coordinate, coordinate]) {
          addSphere(group, THREE, { x, y, z, radius: 0.2, colour: 0xe7775b });
        }
      }
    }
    for (const x of [-coordinate, coordinate]) {
      for (const y of [-coordinate, coordinate]) {
        addSphere(group, THREE, { x: 0, y, z: 0, radius: 0.17, colour: 0x89b8cf });
        addSphere(group, THREE, { x, y: 0, z: 0, radius: 0.17, colour: 0x89b8cf });
      }
      addSphere(group, THREE, { x, y: 0, z: coordinate, radius: 0.17, colour: 0x89b8cf });
      addSphere(group, THREE, { x, y: 0, z: -coordinate, radius: 0.17, colour: 0x89b8cf });
    }
    addSphere(group, THREE, { radius: 0.18, colour: 0xb5cda9 });
    return (time) => { group.rotation.y = time * 0.18; group.rotation.x = Math.sin(time * 0.12) * 0.08; };
  }

  const membrane = addSphere(group, THREE, { radius: 1.55, colour: 0x8eb4b6, opacity: 0.17, wireframe: true });
  membrane.scale.set(1.23, 0.92, 0.92);
  const cytoplasm = addSphere(group, THREE, { radius: 1.38, colour: 0x88a594, opacity: 0.12 });
  cytoplasm.scale.set(1.23, 0.92, 0.92);
  const nucleus = addSphere(group, THREE, { x: -0.43, y: 0.12, z: 0, radius: 0.56, colour: 0x8977a7 });
  const nucleolus = addSphere(group, THREE, { x: -0.32, y: 0.14, z: 0.41, radius: 0.17, colour: 0xe7a77e });
  const mitochondrion = addSphere(group, THREE, { x: 0.68, y: 0.33, z: 0.12, radius: 0.38, colour: 0xcf805d });
  mitochondrion.scale.set(1.35, 0.65, 0.7);
  addSphere(group, THREE, { x: 0.33, y: -0.52, z: 0.25, radius: 0.26, colour: 0xb3a47c });
  addSphere(group, THREE, { x: -0.85, y: -0.48, z: -0.4, radius: 0.25, colour: 0xb3a47c });
  return (time) => {
    group.rotation.y = time * 0.14;
    group.rotation.x = Math.sin(time * 0.13) * 0.035;
    nucleus.rotation.y = time * 0.08;
    nucleolus.rotation.z = time * 0.2;
    mitochondrion.rotation.z = Math.sin(time * 0.5) * 0.1;
  };
}

export default function Models3D() {
  const canvasHost = useRef(null);
  const [activeModel, setActiveModel] = useState("atom");
  const [canvasError, setCanvasError] = useState("");
  const model = models.find(({ id }) => id === activeModel);

  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return undefined;

    let renderer;
    let animationFrame;
    let disposed = false;
    let controls;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(host.clientWidth, host.clientHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      host.replaceChildren(renderer.domElement);
    } catch (error) {
      setCanvasError(`WebGL could not start: ${error.message}`);
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, 0.1, 60);
    camera.position.set(3.35, 2.6, 5.2);
    scene.add(new THREE.HemisphereLight(0xffefd6, 0x385145, 2.05));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xe5a185, 7, 12);
    rimLight.position.set(-4, 0, 2);
    scene.add(rimLight);
    const group = new THREE.Group();
    scene.add(group);
    const animateModel = buildModel(group, activeModel);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 2.5;
    controls.maxDistance = 9;

    const resizeObserver = new ResizeObserver(() => {
      if (disposed || !host.clientWidth || !host.clientHeight) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    });
    resizeObserver.observe(host);

    const clock = new THREE.Clock();
    const renderFrame = () => {
      if (disposed) return;
      const elapsed = clock.getElapsedTime();
      animateModel?.(elapsed);
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(renderFrame);
    };
    setCanvasError("");
    renderFrame();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      controls.dispose();
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [activeModel]);

  return (
    <section className="page-wrap models-page">
      <p className="eyebrow">THE OBJECT ROOM · TURN IT AROUND</p>
      <div className="page-heading-row">
        <h1>Ideas with<br /><em>another dimension.</em></h1>
        <p>Choose a model. Drag to turn it; scroll to zoom. A good picture makes an abstract idea feel close.</p>
      </div>
      <div className="model-tabs" role="tablist" aria-label="Choose a three-dimensional model">
        {models.map((entry) => (
          <button key={entry.id} className={`model-tab ${activeModel === entry.id ? "is-active" : ""}`}
            onClick={() => setActiveModel(entry.id)} role="tab" aria-selected={activeModel === entry.id}>
            {entry.label}<span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <section className="model-stage">
        <div className="model-canvas" ref={canvasHost} role="img" aria-label={`${model.label} interactive 3D model`} />
        {canvasError && <p className="model-error" role="status">{canvasError} Try a browser with WebGL enabled.</p>}
        <div className="model-overlay"><span>✳ DRAG TO ORBIT</span><span>SCROLL TO ZOOM</span></div>
        <div className="model-description"><p className="eyebrow">SCHEMATIC MODEL · {String(models.indexOf(model) + 1).padStart(2, "0")}</p>
          <h2>{model.label}</h2><p>{model.note}</p></div>
      </section>
      <p className="lab-note">Shapes and sizes are educational illustrations. They are not scale models or substitutes for the textbook diagrams.</p>
    </section>
  );
}
