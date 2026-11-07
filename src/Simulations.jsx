import React, { useEffect, useMemo, useState } from "react";

const experiments = [
  { id: "projectile", name: "Projectile motion", subject: "Physics" },
  { id: "quadratic", name: "Quadratic functions", subject: "Mathematics" },
  { id: "genetics", name: "A Mendelian cross", subject: "Biology" },
  { id: "break-even", name: "Break-even point", subject: "Commerce" },
  { id: "market", name: "Supply & demand", subject: "Economics" },
];

function RangeControl({ label, min, max, step = 1, value, onChange, format = (number) => number }) {
  return (
    <label className="lab-control">
      <span>{label} <strong>{format(Number(value))}</strong></span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(event) => onChange(Number(event.target.value))} />
      <span className="lab-control-scale"><small>{format(min)}</small><small>{format(max)}</small></span>
    </label>
  );
}

function ProjectileLab() {
  const [angle, setAngle] = useState(42);
  const [speed, setSpeed] = useState(24);
  const [gravity, setGravity] = useState(9.8);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const radians = (angle * Math.PI) / 180;
  const flightTime = (2 * speed * Math.sin(radians)) / gravity;
  const range = speed * Math.cos(radians) * flightTime;
  const maxHeight = ((speed * Math.sin(radians)) ** 2) / (2 * gravity);
  const chart = useMemo(() => {
    const width = 620;
    const height = 300;
    const left = 39;
    const ground = height - 33;
    const plotWidth = width - 63;
    const plotHeight = height - 63;
    const xMax = Math.max(range * 1.14, 1);
    const yMax = Math.max(maxHeight * 1.2, 1);
    const point = (fraction) => {
      const time = flightTime * fraction;
      const x = speed * Math.cos(radians) * time;
      const y = Math.max(0, speed * Math.sin(radians) * time - 0.5 * gravity * time * time);
      return {
        x: left + (x / xMax) * plotWidth,
        y: ground - (y / yMax) * plotHeight,
      };
    };
    const path = Array.from({ length: 61 }, (_, index) => {
      const position = point(index / 60);
      return `${index ? "L" : "M"}${position.x.toFixed(2)},${position.y.toFixed(2)}`;
    }).join(" ");
    return { width, height, left, ground, plotWidth, plotHeight, path, point };
  }, [flightTime, gravity, maxHeight, radians, range, speed]);

  useEffect(() => {
    if (!running) return undefined;
    const started = performance.now();
    const animationDuration = Math.max(flightTime * 420, 1200);
    const timer = window.setInterval(() => {
      const nextProgress = Math.min((performance.now() - started) / animationDuration, 1);
      setProgress(nextProgress);
      if (nextProgress === 1) setRunning(false);
    }, 16);
    return () => window.clearInterval(timer);
  }, [flightTime, running]);

  const ball = chart.point(progress);

  return (
    <div className="experiment-layout">
      <div className="experiment-settings">
        <p className="eyebrow">01 — CHANGE THE CONDITIONS</p>
        <RangeControl label="Launch angle" min={10} max={80} value={angle}
          onChange={setAngle} format={(number) => `${number}°`} />
        <RangeControl label="Initial speed" min={5} max={40} value={speed}
          onChange={setSpeed} format={(number) => `${number} m/s`} />
        <RangeControl label="Gravity" min={1} max={20} step={0.1} value={gravity}
          onChange={setGravity} format={(number) => `${number.toFixed(1)} m/s²`} />
        <button className="experiment-run" onClick={() => { setProgress(0); setRunning(true); }}>
          {running ? "In flight…" : "Launch the ball ↗"}
        </button>
      </div>
      <div className="experiment-visual">
        <div className="experiment-readouts">
          <div><small>RANGE</small><strong>{range.toFixed(1)} m</strong></div>
          <div><small>FLIGHT TIME</small><strong>{flightTime.toFixed(2)} s</strong></div>
          <div><small>MAX HEIGHT</small><strong>{maxHeight.toFixed(1)} m</strong></div>
        </div>
        <svg className="lab-graph" viewBox={`0 0 ${chart.width} ${chart.height}`}
          role="img" aria-label="Animated projectile trajectory; horizontal axis is distance and vertical axis is height">
          {[0, 1, 2, 3].map((line) => {
            const y = 16 + line * (chart.plotHeight / 3);
            return <line key={line} className="graph-grid-line" x1={chart.left} y1={y}
              x2={chart.left + chart.plotWidth} y2={y} />;
          })}
          <line className="graph-axis" x1={chart.left} y1={chart.ground}
            x2={chart.left + chart.plotWidth} y2={chart.ground} />
          <path className="graph-trajectory" d={chart.path} />
          <circle className="projectile-ball" cx={ball.x} cy={ball.y} r="7" />
          <text className="graph-axis-label" x={chart.width - 22} y={chart.ground + 20}>x</text>
          <text className="graph-axis-label" x={chart.left - 19} y="17">y</text>
        </svg>
        <p className="experiment-caption">No air resistance; constant gravitational acceleration. Move a slider and launch again.</p>
      </div>
    </div>
  );
}

function QuadraticLab() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [probe, setProbe] = useState(1);
  const curve = useMemo(() => {
    const values = Array.from({ length: 121 }, (_, index) => {
      const x = -6 + (12 * index) / 120;
      return { x, y: a * x * x + b * x + c };
    });
    const minY = Math.min(...values.map((point) => point.y), -1);
    const maxY = Math.max(...values.map((point) => point.y), 1);
    const pad = (maxY - minY) * 0.09 || 1;
    const low = minY - pad;
    const high = maxY + pad;
    const path = values.map(({ x, y }, index) => {
      const px = 30 + ((x + 6) / 12) * 560;
      const py = 14 + ((high - y) / (high - low)) * 245;
      return `${index ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`;
    }).join(" ");
    const rootTerm = b * b - 4 * a * c;
    const roots = a === 0
      ? [b === 0 ? (c === 0 ? "Every x" : "No solution") : `x = ${(-c / b).toFixed(2)}`]
      : rootTerm < 0
        ? ["No real roots"]
        : rootTerm === 0
          ? [`x = ${(-b / (2 * a)).toFixed(2)}`]
          : [`${((-b - Math.sqrt(rootTerm)) / (2 * a)).toFixed(2)}`,
            `${((-b + Math.sqrt(rootTerm)) / (2 * a)).toFixed(2)}`];
    return { path, rootTerm, roots, low, high };
  }, [a, b, c]);
  const yProbe = a * probe * probe + b * probe + c;

  return (
    <div className="experiment-layout">
      <div className="experiment-settings">
        <p className="eyebrow">01 — SHAPE THE FUNCTION</p>
        <RangeControl label="a · x² coefficient" min={-3} max={3} step={0.1}
          value={a} onChange={setA} format={(number) => number.toFixed(1)} />
        <RangeControl label="b · x coefficient" min={-6} max={6} step={0.1}
          value={b} onChange={setB} format={(number) => number.toFixed(1)} />
        <RangeControl label="c · constant" min={-8} max={8} step={0.1}
          value={c} onChange={setC} format={(number) => number.toFixed(1)} />
        <RangeControl label="Probe x-value" min={-6} max={6} step={0.1}
          value={probe} onChange={setProbe} format={(number) => number.toFixed(1)} />
      </div>
      <div className="experiment-visual">
        <div className="equation-display">y = {a.toFixed(1)}x² + {b.toFixed(1)}x + {c.toFixed(1)}</div>
        <svg className="lab-graph" viewBox="0 0 620 280" role="img" aria-label="Interactive graph of a quadratic function">
          {[0, 1, 2, 3, 4].map((line) => <line key={`x${line}`} className="graph-grid-line"
            x1={30 + line * 140} y1="14" x2={30 + line * 140} y2="259" />)}
          {[0, 1, 2, 3].map((line) => <line key={`y${line}`} className="graph-grid-line"
            x1="30" y1={14 + line * 81} x2="590" y2={14 + line * 81} />)}
          <line className="graph-axis" x1="30"
            y1={14 + ((curve.high - 0) / (curve.high - curve.low)) * 245}
            x2="590" y2={14 + ((curve.high - 0) / (curve.high - curve.low)) * 245} />
          <line className="graph-axis" x1="310" y1="14" x2="310" y2="259" />
          <path className="graph-trajectory" d={curve.path} />
          <circle className="projectile-ball" cx={30 + ((probe + 6) / 12) * 560}
            cy={14 + ((curve.high - yProbe) / (curve.high - curve.low)) * 245} r="6" />
        </svg>
        <div className="experiment-readouts">
          <div><small>DISCRIMINANT</small><strong>{curve.rootTerm.toFixed(2)}</strong></div>
          <div><small>REAL ROOTS</small><strong>{curve.roots.join("  ·  ")}</strong></div>
          <div><small>f({probe.toFixed(1)})</small><strong>{yProbe.toFixed(2)}</strong></div>
        </div>
        <p className="experiment-caption">Explore how each coefficient changes a parabola, its roots, and its symmetry.</p>
      </div>
    </div>
  );
}

function GeneticsLab() {
  const [first, setFirst] = useState("Aa");
  const [second, setSecond] = useState("Aa");
  const outcomes = [
    `${first[0]}${second[0]}`,
    `${first[0]}${second[1]}`,
    `${first[1]}${second[0]}`,
    `${first[1]}${second[1]}`,
  ];
  const dominant = outcomes.filter((genotype) => genotype.includes("A")).length;

  return (
    <div className="experiment-layout">
      <div className="experiment-settings">
        <p className="eyebrow">01 — CHOOSE EACH PARENT</p>
        <label className="lab-control"><span>Parent one · genotype</span>
          <select value={first} onChange={(event) => setFirst(event.target.value)}>
            <option value="AA">AA · homozygous dominant</option>
            <option value="Aa">Aa · heterozygous</option>
            <option value="aa">aa · homozygous recessive</option>
          </select>
        </label>
        <label className="lab-control"><span>Parent two · genotype</span>
          <select value={second} onChange={(event) => setSecond(event.target.value)}>
            <option value="AA">AA · homozygous dominant</option>
            <option value="Aa">Aa · heterozygous</option>
            <option value="aa">aa · homozygous recessive</option>
          </select>
        </label>
        <div className="genetics-legend">
          <span><i className="allele-dominant" /> A = dominant allele</span>
          <span><i className="allele-recessive" /> a = recessive allele</span>
        </div>
      </div>
      <div className="experiment-visual genetics-visual">
        <p className="punnett-label">PARENT ONE ↓ &nbsp; PARENT TWO →</p>
        <div className="punnett-grid">
          <span className="punnett-corner">×</span>
          {[first[0], first[1]].map((allele, index) => (
            <span className="punnett-header" key={`top-${index}`}>{allele}</span>
          ))}
          {second.split("").map((rowAllele, row) => (
            <React.Fragment key={`row-${row}`}>
              <span className="punnett-header">{rowAllele}</span>
              {first.split("").map((columnAllele, column) => {
                const genotype = `${columnAllele}${rowAllele}`;
                const normalized = [...genotype]
                  .sort((left, right) => left === right ? 0 : left === "A" ? -1 : 1)
                  .join("");
                return <span className={`punnett-cell ${normalized.includes("A") ? "cell-dominant" : "cell-recessive"}`}
                  key={`${row}-${column}`} title={`${normalized}: ${normalized.includes("A") ? "dominant phenotype" : "recessive phenotype"}`}>
                  {normalized}
                </span>;
              })}
            </React.Fragment>
          ))}
        </div>
        <div className="experiment-readouts">
          <div><small>DOMINANT PHENOTYPE</small><strong>{dominant}/4 = {dominant * 25}%</strong></div>
          <div><small>RECESSIVE PHENOTYPE</small><strong>{100 - dominant * 25}%</strong></div>
        </div>
        <p className="experiment-caption">A simple Mendelian model: each offspring receives one allele from each parent. Real traits can be more complex.</p>
      </div>
    </div>
  );
}

function BusinessLab() {
  const [fixedCosts, setFixedCosts] = useState(5000);
  const [unitPrice, setUnitPrice] = useState(250);
  const [unitCost, setUnitCost] = useState(100);
  const margin = unitPrice - unitCost;
  const breakEven = margin > 0 ? Math.ceil(fixedCosts / margin) : null;

  return (
    <div className="experiment-layout">
      <div className="experiment-settings">
        <p className="eyebrow">01 — PLAN THE BUSINESS</p>
        <RangeControl label="Fixed monthly costs" min={1000} max={50000} step={500}
          value={fixedCosts} onChange={setFixedCosts} format={(number) => `₹${number.toLocaleString("en-IN")}`} />
        <RangeControl label="Selling price per item" min={50} max={1000} step={10}
          value={unitPrice} onChange={setUnitPrice} format={(number) => `₹${number}`} />
        <RangeControl label="Variable cost per item" min={10} max={900} step={10}
          value={unitCost} onChange={setUnitCost} format={(number) => `₹${number}`} />
      </div>
      <div className="experiment-visual break-even-visual">
        <p className="equation-display">Break-even units = fixed cost ÷ (selling price − variable cost)</p>
        <div className="break-even-result">
          <span className="break-even-icon">₹</span>
          <div><small>UNITS TO BREAK EVEN</small><strong>{breakEven === null ? "No positive margin" : breakEven.toLocaleString("en-IN")}</strong></div>
        </div>
        {breakEven === null ? (
          <p className="experiment-caption">Set a selling price above the variable cost per item to create a contribution margin.</p>
        ) : (
          <p className="experiment-caption">Each item contributes ₹{margin.toLocaleString("en-IN")} towards ₹{fixedCosts.toLocaleString("en-IN")} of fixed costs. At {breakEven.toLocaleString("en-IN")} items sold, revenue covers the costs shown.</p>
        )}
      </div>
    </div>
  );
}

function EconomicsLab() {
  const [demand, setDemand] = useState(90);
  const [supply, setSupply] = useState(10);
  const [slope, setSlope] = useState(2);
  const equilibriumQuantity = Math.max(0, Math.min(100, (demand - supply) / (slope * 2)));
  const equilibriumPrice = supply + slope * equilibriumQuantity;
  const chart = { width: 600, height: 310, left: 49, bottom: 270, scale: 2.45 };
  const demandStart = `${chart.left},${chart.bottom - demand * chart.scale}`;
  const demandEnd = `${chart.left + 100 * chart.scale},${chart.bottom}`;
  const supplyStart = `${chart.left},${chart.bottom - supply * chart.scale}`;
  const supplyEnd = `${chart.left + 100 * chart.scale},${chart.bottom - Math.min(100, supply + slope * 100) * chart.scale}`;
  const pointX = chart.left + equilibriumQuantity * chart.scale;
  const pointY = chart.bottom - equilibriumPrice * chart.scale;

  return (
    <div className="experiment-layout">
      <div className="experiment-settings">
        <p className="eyebrow">01 — MOVE THE MARKET</p>
        <RangeControl label="Demand intercept" min={20} max={100} value={demand} onChange={setDemand} />
        <RangeControl label="Supply intercept" min={0} max={70} value={supply} onChange={setSupply} />
        <RangeControl label="Supply slope" min={1} max={4} step={0.1} value={slope}
          onChange={setSlope} format={(number) => number.toFixed(1)} />
      </div>
      <div className="experiment-visual">
        <svg className="lab-graph market-graph" viewBox={`0 0 ${chart.width} ${chart.height}`}
          role="img" aria-label="Supply and demand curves with an adjustable market equilibrium">
          {[0, 1, 2, 3, 4].map((line) => <line key={`vertical-${line}`} className="graph-grid-line"
            x1={chart.left + line * 120} y1="20" x2={chart.left + line * 120} y2={chart.bottom} />)}
          {[0, 1, 2, 3].map((line) => <line key={`horizontal-${line}`} className="graph-grid-line"
            x1={chart.left} y1={chart.bottom - line * 80} x2="555" y2={chart.bottom - line * 80} />)}
          <line className="graph-axis" x1={chart.left} y1="17" x2={chart.left} y2={chart.bottom} />
          <line className="graph-axis" x1={chart.left} y1={chart.bottom} x2="560" y2={chart.bottom} />
          <line className="graph-demand" x1={demandStart.split(",")[0]} y1={demandStart.split(",")[1]}
            x2={demandEnd.split(",")[0]} y2={demandEnd.split(",")[1]} />
          <line className="graph-supply" x1={supplyStart.split(",")[0]} y1={supplyStart.split(",")[1]}
            x2={supplyEnd.split(",")[0]} y2={supplyEnd.split(",")[1]} />
          <line className="equilibrium-guide" x1={pointX} y1={pointY} x2={pointX} y2={chart.bottom} />
          <circle className="projectile-ball" cx={pointX} cy={pointY} r="7" />
          <text className="graph-legend-demand" x="490" y="46">D · demand</text>
          <text className="graph-legend-supply" x="490" y="64">S · supply</text>
          <text className="graph-axis-label" x="282" y="298">Quantity →</text>
          <text className="graph-axis-label" x="8" y="31">Price</text>
        </svg>
        <div className="experiment-readouts">
          <div><small>EQUILIBRIUM QUANTITY</small><strong>{equilibriumQuantity.toFixed(1)}</strong></div>
          <div><small>EQUILIBRIUM PRICE</small><strong>{equilibriumPrice.toFixed(1)}</strong></div>
        </div>
        <p className="experiment-caption">A linear supply-and-demand model (demand: P = {demand} − Q; supply: P = {supply} + {slope.toFixed(1)}Q).</p>
      </div>
    </div>
  );
}

export default function Simulations() {
  const [activeExperiment, setActiveExperiment] = useState("projectile");
  const active = experiments.find((experiment) => experiment.id === activeExperiment);

  return (
    <section className="page-wrap labs-page">
      <p className="eyebrow">THE OPEN LAB · LEARN BY CHANGING THINGS</p>
      <div className="page-heading-row">
        <h1>Small experiments.<br /><em>Big “aha” moments.</em></h1>
        <p>Move a slider, make a prediction, and watch an idea take shape. These self-contained models run in your browser.</p>
      </div>
      <div className="lab-selector" role="tablist" aria-label="Choose an interactive simulation">
        {experiments.map((experiment) => (
          <button key={experiment.id} className={`lab-tab ${activeExperiment === experiment.id ? "is-active" : ""}`}
            onClick={() => setActiveExperiment(experiment.id)} role="tab" aria-selected={activeExperiment === experiment.id}>
            <small>{experiment.subject}</small><span>{experiment.name}</span>
          </button>
        ))}
      </div>
      <article className="experiment-panel">
        <div className="experiment-title">
          <div><p className="eyebrow">INTERACTIVE SIMULATION · {active.subject.toUpperCase()}</p>
            <h2>{active.name}</h2></div>
          <span className="experiment-number">{String(experiments.indexOf(active) + 1).padStart(2, "0")} / {String(experiments.length).padStart(2, "0")}</span>
        </div>
        {activeExperiment === "projectile" && <ProjectileLab />}
        {activeExperiment === "quadratic" && <QuadraticLab />}
        {activeExperiment === "genetics" && <GeneticsLab />}
        {activeExperiment === "break-even" && <BusinessLab />}
        {activeExperiment === "market" && <EconomicsLab />}
      </article>
      <p className="lab-note">These are simplified learning models, not lab measurements or financial advice. Check your syllabus and textbooks for full derivations.</p>
    </section>
  );
}
