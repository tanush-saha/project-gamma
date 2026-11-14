import React, { useMemo, useState } from "react";
import { Card, Badge } from "../components/ui.jsx";
import { soundEngine } from "../utils/audio.js";

const STANDARD_ANGLES = [
  { deg: 0, rad: "0", sin: "0", cos: "1", tan: "0" },
  { deg: 30, rad: "π/6", sin: "1/2", cos: "√3/2", tan: "1/√3" },
  { deg: 45, rad: "π/4", sin: "1/√2", cos: "1/√2", tan: "1" },
  { deg: 60, rad: "π/3", sin: "√3/2", cos: "1/2", tan: "√3" },
  { deg: 90, rad: "π/2", sin: "1", cos: "0", tan: "Undefined" },
  { deg: 120, rad: "2π/3", sin: "√3/2", cos: "-1/2", tan: "-√3" },
  { deg: 135, rad: "3π/4", sin: "1/√2", cos: "-1/√2", tan: "-1" },
  { deg: 150, rad: "5π/6", sin: "1/2", cos: "-√3/2", tan: "-1/√3" },
  { deg: 180, rad: "π", sin: "0", cos: "-1", tan: "0" },
  { deg: 210, rad: "7π/6", sin: "-1/2", cos: "-√3/2", tan: "1/√3" },
  { deg: 225, rad: "5π/4", sin: "-1/√2", cos: "-1/√2", tan: "1" },
  { deg: 240, rad: "4π/3", sin: "-√3/2", cos: "-1/2", tan: "√3" },
  { deg: 270, rad: "3π/2", sin: "-1", cos: "0", tan: "Undefined" },
  { deg: 300, rad: "5π/3", sin: "-√3/2", cos: "1/2", tan: "-√3" },
  { deg: 315, rad: "7π/4", sin: "-1/√2", cos: "1/√2", tan: "-1" },
  { deg: 330, rad: "11π/6", sin: "-1/2", cos: "√3/2", tan: "-1/√3" },
  { deg: 360, rad: "2π", sin: "0", cos: "1", tan: "0" },
];

const FORMULA_CATEGORIES = [
  {
    category: "Fundamental & Pythagorean",
    items: [
      { name: "First Pythagorean Identity", formula: "sin²θ + cos²θ = 1", note: "Valid for all real θ" },
      { name: "Second Pythagorean Identity", formula: "1 + tan²θ = sec²θ", note: "θ ≠ (2n+1)π/2" },
      { name: "Third Pythagorean Identity", formula: "1 + cot²θ = cosec²θ", note: "θ ≠ nπ" },
      { name: "Reciprocal Relations", formula: "cosec θ = 1/sin θ · sec θ = 1/cos θ · cot θ = 1/tan θ", note: "Standard definitions" },
      { name: "Quotient Relations", formula: "tan θ = sin θ / cos θ · cot θ = cos θ / sin θ", note: "Core definitions" },
    ],
  },
  {
    category: "Compound Angles (Addition / Subtraction)",
    items: [
      { name: "Sine Addition", formula: "sin(A + B) = sin A cos B + cos A sin B", note: "JEE & NEET staple" },
      { name: "Sine Subtraction", formula: "sin(A - B) = sin A cos B - cos A sin B", note: "High yield" },
      { name: "Cosine Addition", formula: "cos(A + B) = cos A cos B - sin A sin B", note: "Sign flips!" },
      { name: "Cosine Subtraction", formula: "cos(A - B) = cos A cos B + sin A sin B", note: "Sign flips!" },
      { name: "Tangent Addition", formula: "tan(A + B) = (tan A + tan B) / (1 - tan A tan B)", note: "Denominator 1 - tan A tan B" },
      { name: "Tangent Subtraction", formula: "tan(A - B) = (tan A - tan B) / (1 + tan A tan B)", note: "Denominator 1 + tan A tan B" },
    ],
  },
  {
    category: "Multiple & Sub-multiple Angles",
    items: [
      { name: "Sin 2A (Double Angle)", formula: "sin 2A = 2 sin A cos A = (2 tan A) / (1 + tan²A)", note: "Both forms vital for integration" },
      { name: "Cos 2A (Four Forms)", formula: "cos 2A = cos²A - sin²A = 2cos²A - 1 = 1 - 2sin²A = (1 - tan²A)/(1 + tan²A)", note: "Power reducing staple" },
      { name: "Tan 2A", formula: "tan 2A = (2 tan A) / (1 - tan²A)", note: "Useful in limits and derivatives" },
      { name: "Sin 3A (Triple Angle)", formula: "sin 3A = 3 sin A - 4 sin³A", note: "Remember: 34 with cube on 4" },
      { name: "Cos 3A (Triple Angle)", formula: "cos 3A = 4 cos³A - 3 cos A", note: "Remember: 43 with cube on 4" },
      { name: "Tan 3A", formula: "tan 3A = (3 tan A - tan³A) / (1 - 3 tan²A)", note: "JEE Advanced favorite" },
    ],
  },
  {
    category: "Transformation (Product to Sum & Sum to Product)",
    items: [
      { name: "2 sin A cos B", formula: "2 sin A cos B = sin(A + B) + sin(A - B)", note: "Convert product to sum" },
      { name: "2 cos A sin B", formula: "2 cos A sin B = sin(A + B) - sin(A - B)", note: "Convert product to difference" },
      { name: "2 cos A cos B", formula: "2 cos A cos B = cos(A + B) + cos(A - B)", note: "Cosine sum" },
      { name: "2 sin A sin B", formula: "2 sin A sin B = cos(A - B) - cos(A + B)", note: "Notice cos(A-B) comes first!" },
      { name: "C-D Formula (sin C + sin D)", formula: "sin C + sin D = 2 sin((C+D)/2) cos((C-D)/2)", note: "Essential in algebra" },
      { name: "C-D Formula (cos C - cos D)", formula: "cos C - cos D = -2 sin((C+D)/2) sin((C-D)/2)", note: "Minus sign or (D-C)" },
    ],
  },
  {
    category: "Inverse Trigonometry & General Solutions",
    items: [
      { name: "Sin General Solution", formula: "sin θ = sin α ⟹ θ = nπ + (-1)ⁿ α, n ∈ ℤ", note: "Odd/even parity" },
      { name: "Cos General Solution", formula: "cos θ = cos α ⟹ θ = 2nπ ± α, n ∈ ℤ", note: "Symmetric about x-axis" },
      { name: "Tan General Solution", formula: "tan θ = tan α ⟹ θ = nπ + α, n ∈ ℤ", note: "Period is π" },
      { name: "Co-function Inverse Sum", formula: "sin⁻¹x + cos⁻¹x = π/2 · tan⁻¹x + cot⁻¹x = π/2 · sec⁻¹x + cosec⁻¹x = π/2", note: "For valid domains" },
      { name: "Tan Inverse Addition", formula: "tan⁻¹x + tan⁻¹y = tan⁻¹((x + y)/(1 - xy)) (if xy < 1)", note: "Check xy < 1 boundary condition!" },
    ],
  },
];

const QUIZ_QUESTIONS = [
  {
    question: "What is the exact value of sin(15°) [or sin(π/12)]?",
    options: ["(√6 - √2)/4", "(√6 + √2)/4", "(√3 - 1)/2√2", "Both A and C are correct"],
    answerIndex: 3,
    explanation: "sin(15°) = sin(45° - 30°) = sin 45° cos 30° - cos 45° sin 30° = (√6 - √2)/4, which simplifies to (√3 - 1)/(2√2).",
  },
  {
    question: "If sin θ + cosec θ = 2, what is the value of sin¹⁰θ + cosec¹⁰θ?",
    options: ["2", "10", "20", "2¹⁰"],
    answerIndex: 0,
    explanation: "sin θ + 1/sin θ = 2 leads to (sin θ - 1)² = 0 ⟹ sin θ = 1. Thus 1¹⁰ + 1¹⁰ = 2.",
  },
  {
    question: "What is the general solution of cos θ = 0?",
    options: ["nπ", "2nπ", "(2n + 1)π/2", "(n + 1/2)π"],
    answerIndex: 2,
    explanation: "Cosine vanishes at all odd multiples of π/2, given by (2n + 1)π/2 for n ∈ ℤ.",
  },
  {
    question: "Which of the following is equivalent to cos 2θ?",
    options: ["2cos²θ - 1", "1 - 2sin²θ", "(1 - tan²θ)/(1 + tan²θ)", "All of the above"],
    answerIndex: 3,
    explanation: "cos 2θ has 4 standard identities: cos²θ - sin²θ, 2cos²θ - 1, 1 - 2sin²θ, and (1 - tan²θ)/(1 + tan²θ).",
  },
  {
    question: "In any triangle ABC, the Sine Rule states that:",
    options: ["a/sin A = b/sin B = c/sin C = 2R", "a/cos A = b/cos B = c/cos C", "a² = b² + c² - 2bc cos A", "Δ = abc/2R"],
    answerIndex: 0,
    explanation: "The Sine Rule relates side lengths to the sines of opposite angles: a/sin A = b/sin B = c/sin C = 2R where R is circumradius.",
  },
];

export function TrigoStudio() {
  const [angleDeg, setAngleDeg] = useState(45);
  const [activeTab, setActiveTab] = useState("circle"); // circle | formulas | quiz
  const [formulaSearch, setFormulaSearch] = useState("");
  const [copiedFormula, setCopiedFormula] = useState(null);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const angleRad = (angleDeg * Math.PI) / 180;
  const sinVal = Math.sin(angleRad);
  const cosVal = Math.cos(angleRad);
  const tanVal = Math.abs(cosVal) < 1e-6 ? null : Math.tan(angleRad);

  const standardMatch = STANDARD_ANGLES.find((a) => a.deg === angleDeg);

  const handleCopy = (formula) => {
    soundEngine.playClick();
    navigator.clipboard.writeText(formula).catch(() => {});
    setCopiedFormula(formula);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  const handleOptionSelect = (idx) => {
    if (showAnswer) return;
    soundEngine.playClick();
    setSelectedOption(idx);
    setShowAnswer(true);
    if (idx === QUIZ_QUESTIONS[quizIndex].answerIndex) {
      setQuizScore((s) => s + 1);
    }
  };

  const nextQuiz = () => {
    soundEngine.playClick();
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex((i) => i + 1);
      setSelectedOption(null);
      setShowAnswer(false);
    } else {
      // reset
      setQuizIndex(0);
      setSelectedOption(null);
      setShowAnswer(false);
      setQuizScore(0);
    }
  };

  // Filter formulas
  const filteredFormulas = useMemo(() => {
    const q = formulaSearch.trim().toLowerCase();
    if (!q) return FORMULA_CATEGORIES;
    return FORMULA_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (it) => it.name.toLowerCase().includes(q) || it.formula.toLowerCase().includes(q) || it.note.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [formulaSearch]);

  return (
    <section className="page-wrap trigo-studio-page" data-reveal>
      <div className="section-inner">
        {/* Header HUD */}
        <div className="dashboard-section-heading">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span className="eyebrow" style={{ margin: 0 }}>INTERACTIVE TRIGO LAB // v2.4</span>
              <Badge variant="accent">INSPIRED BY TRIGO AARUSH</Badge>
            </div>
            <h1>Visual Trigonometry &amp;<br /><em>Formula Matrix.</em></h1>
            <p>
              Explore the Unit Circle in real time, examine standard angle ratios, look up high-yield JEE &amp; NEET identities, and test your speed with rapid challenge questions.
            </p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="trigo-nav-tabs" style={{ display: "flex", gap: "10px", margin: "1.5rem 0 2rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`trigo-tab-btn ${activeTab === "circle" ? "is-active" : ""}`}
            onClick={() => { soundEngine.playClick(); setActiveTab("circle"); }}
          >
            ◉ Interactive Unit Circle
          </button>
          <button
            type="button"
            className={`trigo-tab-btn ${activeTab === "formulas" ? "is-active" : ""}`}
            onClick={() => { soundEngine.playClick(); setActiveTab("formulas"); }}
          >
            ∑ Trigonometric Identities Vault
          </button>
          <button
            type="button"
            className={`trigo-tab-btn ${activeTab === "quiz" ? "is-active" : ""}`}
            onClick={() => { soundEngine.playClick(); setActiveTab("quiz"); }}
          >
            ⚡ Speed Quiz ({quizScore}/{QUIZ_QUESTIONS.length})
          </button>
        </div>

        {/* Tab 1: Interactive Unit Circle */}
        {activeTab === "circle" && (
          <div className="trigo-circle-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
            {/* Visualizer Panel */}
            <Card className="unit-circle-card" style={{ padding: "2rem", borderRadius: "1.25rem", background: "var(--card)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span className="eyebrow">THE UNIT CIRCLE (R = 1)</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "0.85rem", color: "var(--accent)" }}>
                  θ = {angleDeg}° ({((angleDeg * Math.PI) / 180).toFixed(2)} rad)
                </span>
              </div>

              {/* SVG Canvas for Unit Circle */}
              <div style={{ position: "relative", width: "100%", maxWidth: "340px", margin: "0 auto", aspectRatio: "1" }}>
                <svg viewBox="-140 -140 280 280" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                  {/* Grid Lines */}
                  <line x1="-125" y1="0" x2="125" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <line x1="0" y1="-125" x2="0" y2="125" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

                  {/* Circle */}
                  <circle cx="0" cy="0" r="100" fill="none" stroke="rgba(215,173,120,0.3)" strokeWidth="2" strokeDasharray="4 4" />

                  {/* Arc for Angle */}
                  <path
                    d={`M 25 0 A 25 25 0 ${angleDeg > 180 ? 1 : 0} 0 ${25 * Math.cos(-angleRad)} ${25 * Math.sin(-angleRad)}`}
                    fill="rgba(215,173,120,0.2)"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                  />

                  {/* Cosine Line (x-projection) */}
                  <line
                    x1="0"
                    y1="0"
                    x2={100 * cosVal}
                    y2="0"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Sine Line (y-projection) */}
                  <line
                    x1={100 * cosVal}
                    y1="0"
                    x2={100 * cosVal}
                    y2={-100 * sinVal}
                    stroke="#4ade80"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Hypotenuse Radius Vector */}
                  <line
                    x1="0"
                    y1="0"
                    x2={100 * cosVal}
                    y2={-100 * sinVal}
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />

                  {/* Terminal Point Handle */}
                  <circle
                    cx={100 * cosVal}
                    cy={-100 * sinVal}
                    r="6.5"
                    fill="#fff"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    style={{ filter: "drop-shadow(0 0 8px #38bdf8)" }}
                  />

                  {/* Axis Labels */}
                  <text x="130" y="4" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">x (cos)</text>
                  <text x="-4" y="-130" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">y (sin)</text>
                </svg>
              </div>

              {/* Slider Controller */}
              <div style={{ marginTop: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "6px" }}>
                  <span>0°</span>
                  <span>90°</span>
                  <span>180°</span>
                  <span>270°</span>
                  <span>360°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={angleDeg}
                  onChange={(e) => setAngleDeg(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                  aria-label="Adjust angle in degrees"
                />
              </div>

              {/* Quick Angle Preset Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "1rem" }}>
                {[0, 30, 45, 60, 90, 120, 135, 180, 270, 360].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => { soundEngine.playClick(); setAngleDeg(deg); }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      border: "1px solid",
                      borderColor: angleDeg === deg ? "var(--accent)" : "rgba(255,255,255,0.12)",
                      background: angleDeg === deg ? "rgba(215,173,120,0.15)" : "transparent",
                      color: angleDeg === deg ? "var(--accent)" : "inherit",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </Card>

            {/* Readout Telemetry & Wave Graphs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <Card style={{ padding: "1.5rem", borderRadius: "1.25rem", background: "var(--card)" }}>
                <span className="eyebrow">TRIGONOMETRIC TELEMETRY</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                  <div className="stat-card" style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)" }}>
                    <small style={{ color: "#4ade80", fontFamily: "var(--mono)", fontSize: "0.75rem" }}>sin(θ) [Vertical]</small>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, fontFamily: "var(--mono)", marginTop: "4px" }}>
                      {standardMatch ? standardMatch.sin : sinVal.toFixed(4)}
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)" }}>
                    <small style={{ color: "#f59e0b", fontFamily: "var(--mono)", fontSize: "0.75rem" }}>cos(θ) [Horizontal]</small>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, fontFamily: "var(--mono)", marginTop: "4px" }}>
                      {standardMatch ? standardMatch.cos : cosVal.toFixed(4)}
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)" }}>
                    <small style={{ color: "#38bdf8", fontFamily: "var(--mono)", fontSize: "0.75rem" }}>tan(θ) [Slope]</small>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, fontFamily: "var(--mono)", marginTop: "4px" }}>
                      {standardMatch ? standardMatch.tan : tanVal !== null ? tanVal.toFixed(4) : "∞ Undefined"}
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)" }}>
                    <small style={{ color: "#d7ad78", fontFamily: "var(--mono)", fontSize: "0.75rem" }}>Quadrant</small>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, fontFamily: "var(--mono)", marginTop: "4px" }}>
                      {angleDeg === 0 || angleDeg === 360 ? "Positive X-axis"
                        : angleDeg === 90 ? "Positive Y-axis"
                        : angleDeg === 180 ? "Negative X-axis"
                        : angleDeg === 270 ? "Negative Y-axis"
                        : angleDeg < 90 ? "Quadrant I (+, +)"
                        : angleDeg < 180 ? "Quadrant II (-, +)"
                        : angleDeg < 270 ? "Quadrant III (-, -)"
                        : "Quadrant IV (+, -)"}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Exact Surds Table Reference */}
              <Card style={{ padding: "1.5rem", borderRadius: "1.25rem", background: "var(--card)" }}>
                <span className="eyebrow">STANDARD ANGLE RATIOS (EXACT SURDS)</span>
                <div style={{ overflowX: "auto", marginTop: "1rem" }}>
                  <table style={{ width: "100%", fontSize: "0.8rem", textAlign: "center", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--muted)" }}>
                        <th style={{ padding: "8px" }}>Deg</th>
                        <th style={{ padding: "8px" }}>Rad</th>
                        <th style={{ padding: "8px", color: "#4ade80" }}>sin θ</th>
                        <th style={{ padding: "8px", color: "#f59e0b" }}>cos θ</th>
                        <th style={{ padding: "8px", color: "#38bdf8" }}>tan θ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STANDARD_ANGLES.slice(0, 9).map((ang) => (
                        <tr
                          key={ang.deg}
                          onClick={() => { soundEngine.playClick(); setAngleDeg(ang.deg); }}
                          style={{
                            cursor: "pointer",
                            background: angleDeg === ang.deg ? "rgba(215,173,120,0.1)" : "transparent",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <td style={{ padding: "6px", fontWeight: 600 }}>{ang.deg}°</td>
                          <td style={{ padding: "6px", fontFamily: "var(--mono)", color: "var(--muted)" }}>{ang.rad}</td>
                          <td style={{ padding: "6px", fontFamily: "var(--mono)" }}>{ang.sin}</td>
                          <td style={{ padding: "6px", fontFamily: "var(--mono)" }}>{ang.cos}</td>
                          <td style={{ padding: "6px", fontFamily: "var(--mono)" }}>{ang.tan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Formulas & Identities Vault */}
        {activeTab === "formulas" && (
          <div className="trigo-formulas-vault">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <input
                type="search"
                value={formulaSearch}
                onChange={(e) => setFormulaSearch(e.target.value)}
                placeholder="Search identity, formula, or theorem (e.g. sin 2A, Pythagorean, inverse)..."
                style={{
                  flex: "1",
                  minWidth: "280px",
                  padding: "0.6rem 1.2rem",
                  borderRadius: "999px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--ink)",
                  fontSize: "0.88rem",
                }}
              />
              {copiedFormula && (
                <span style={{ color: "#4ade80", fontFamily: "var(--mono)", fontSize: "0.8rem" }}>
                  ✓ Copied to clipboard!
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {filteredFormulas.map((cat) => (
                <div key={cat.category}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                    <h2 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 700 }}>{cat.category}</h2>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                      ({cat.items.length} formulas)
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "1rem" }}>
                    {cat.items.map((item) => (
                      <Card
                        key={item.name}
                        style={{
                          padding: "1.25rem",
                          borderRadius: "1rem",
                          background: "var(--card)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          border: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.08em" }}>
                              {item.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.formula)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--accent)",
                                fontSize: "0.75rem",
                                fontFamily: "var(--mono)",
                              }}
                              title="Copy formula"
                            >
                              COPY
                            </button>
                          </div>
                          <div
                            style={{
                              margin: "0.75rem 0",
                              fontSize: "1.05rem",
                              fontWeight: 700,
                              fontFamily: "var(--mono)",
                              color: "var(--ink)",
                              padding: "0.5rem 0.75rem",
                              background: "rgba(255,255,255,0.02)",
                              borderRadius: "6px",
                              borderLeft: "3px solid var(--accent)",
                            }}
                          >
                            {item.formula}
                          </div>
                        </div>
                        <small style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{item.note}</small>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Speed Challenge Quiz */}
        {activeTab === "quiz" && (
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            <Card style={{ padding: "2rem", borderRadius: "1.25rem", background: "var(--card)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <span className="eyebrow">QUESTION {quizIndex + 1} OF {QUIZ_QUESTIONS.length}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "0.85rem", color: "var(--accent)" }}>
                  SCORE: {quizScore}
                </span>
              </div>

              <h2 style={{ fontSize: "1.25rem", lineHeight: 1.4, margin: "0 0 1.5rem" }}>
                {QUIZ_QUESTIONS[quizIndex].question}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {QUIZ_QUESTIONS[quizIndex].options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === QUIZ_QUESTIONS[quizIndex].answerIndex;
                  let bg = "rgba(255,255,255,0.03)";
                  let border = "1px solid rgba(255,255,255,0.1)";
                  let text = "inherit";

                  if (showAnswer) {
                    if (isCorrect) {
                      bg = "rgba(74, 222, 128, 0.15)";
                      border = "1px solid #4ade80";
                      text = "#4ade80";
                    } else if (isSelected) {
                      bg = "rgba(239, 68, 68, 0.15)";
                      border = "1px solid #ef4444";
                      text = "#ef4444";
                    }
                  } else if (isSelected) {
                    border = "1px solid var(--accent)";
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={showAnswer}
                      onClick={() => handleOptionSelect(idx)}
                      style={{
                        padding: "1rem 1.25rem",
                        borderRadius: "0.75rem",
                        background: bg,
                        border,
                        color: text,
                        textAlign: "left",
                        fontSize: "0.95rem",
                        cursor: showAnswer ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          border: "1px solid currentColor",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "0.75rem",
                          fontFamily: "var(--mono)",
                        }}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {showAnswer && (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(215, 173, 120, 0.08)",
                    border: "1px solid rgba(215, 173, 120, 0.2)",
                    marginBottom: "1.5rem",
                  }}
                >
                  <strong style={{ display: "block", color: "var(--accent)", marginBottom: "4px", fontSize: "0.85rem" }}>
                    EXPLANATION:
                  </strong>
                  <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5, color: "var(--muted)" }}>
                    {QUIZ_QUESTIONS[quizIndex].explanation}
                  </p>
                </div>
              )}

              {showAnswer && (
                <button
                  type="button"
                  className="hero-cta"
                  onClick={nextQuiz}
                  style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}
                >
                  {quizIndex < QUIZ_QUESTIONS.length - 1 ? "Next Question ↗" : "Finish & Review Score ↗"}
                </button>
              )}
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
