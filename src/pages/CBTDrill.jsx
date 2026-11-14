import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { soundEngine } from "../utils/audio.js";

const CBT_QUESTIONS = [
  // Physics (JEE & NEET)
  {
    id: "phy-01",
    subject: "Physics",
    exam: "JEE Main / NEET",
    topic: "Modern Physics · Photoelectric Effect",
    question: "When light of frequency 2ν₀ (where ν₀ is the threshold frequency) is incident on a metal plate, the maximum velocity of electrons emitted is v₁. When the frequency of the incident radiation is increased to 5ν₀, the maximum velocity of electrons emitted becomes v₂. The ratio v₁ / v₂ is:",
    options: [
      { id: "A", text: "1 : 2" },
      { id: "B", text: "1 : 4" },
      { id: "C", text: "1 : √2" },
      { id: "D", text: "2 : 1" },
    ],
    correctAnswer: "A",
    solution: "By Einstein's photoelectric equation: K_max = 1/2 m v² = hν - hν₀.\nCase 1: 1/2 m v₁² = h(2ν₀) - hν₀ = hν₀\nCase 2: 1/2 m v₂² = h(5ν₀) - hν₀ = 4hν₀\nDividing: (v₁ / v₂)² = hν₀ / (4hν₀) = 1/4  ⟹  v₁ / v₂ = 1/2.",
    marks: 4,
    negative: 1,
  },
  {
    id: "phy-02",
    subject: "Physics",
    exam: "JEE Advanced",
    topic: "Rotational Dynamics · Pure Rolling",
    question: "A solid sphere and a hollow cylinder of equal mass and radius are rolled down an inclined plane of inclination θ from the same height without slipping. The ratio of their accelerations (a_sphere / a_cylinder) is:",
    options: [
      { id: "A", text: "5 / 7" },
      { id: "B", text: "14 / 15" },
      { id: "C", text: "10 / 7" },
      { id: "D", text: "7 / 5" },
    ],
    correctAnswer: "D",
    solution: "Acceleration on an incline without slipping is a = g sinθ / (1 + I / (m R²)).\nFor solid sphere: I = 2/5 m R² ⟹ a_sphere = g sinθ / (1 + 2/5) = 5/7 g sinθ.\nFor hollow cylinder: I = m R² ⟹ a_cylinder = g sinθ / (1 + 1) = 1/2 g sinθ.\nRatio = (5/7) / (1/2) = 10/7.",
    marks: 4,
    negative: 1,
  },
  {
    id: "phy-03",
    subject: "Physics",
    exam: "JEE Main / NEET",
    topic: "Current Electricity · Kirchhoff's & Drift",
    question: "A wire of resistance R is stretched uniformly such that its length becomes 3 times its original length. Assuming the density of the material remains constant, the new resistance of the wire will be:",
    options: [
      { id: "A", text: "3 R" },
      { id: "B", text: "6 R" },
      { id: "C", text: "9 R" },
      { id: "D", text: "R / 3" },
    ],
    correctAnswer: "C",
    solution: "Volume V = A × L is constant. When length becomes L' = 3L, cross-sectional area becomes A' = A / 3.\nNew resistance R' = ρ L' / A' = ρ (3L) / (A / 3) = 9 (ρ L / A) = 9R.",
    marks: 4,
    negative: 1,
  },

  // Chemistry (JEE & NEET)
  {
    id: "chem-01",
    subject: "Chemistry",
    exam: "JEE Main / NEET",
    topic: "Organic Chemistry · Aldol & Cannizzaro",
    question: "Which of the following compounds will undergo Cannizzaro's reaction when treated with 50% aqueous sodium hydroxide?",
    options: [
      { id: "A", text: "CH₃CHO (Acetaldehyde)" },
      { id: "B", text: "C₆H₅CHO (Benzaldehyde)" },
      { id: "C", text: "CH₃COCH₃ (Acetone)" },
      { id: "D", text: "CH₃CH₂CHO (Propanal)" },
    ],
    correctAnswer: "B",
    solution: "Cannizzaro's reaction is given exclusively by aldehydes having NO α-hydrogen atoms. Benzaldehyde (C₆H₅CHO) and Formaldehyde (HCHO) lack α-hydrogens, undergoing self-redox to produce benzyl alcohol and sodium benzoate.",
    marks: 4,
    negative: 1,
  },
  {
    id: "chem-02",
    subject: "Chemistry",
    exam: "JEE Main / NEET",
    topic: "Coordination Compounds · Crystal Field Theory",
    question: "According to Crystal Field Theory, the electronic configuration of d⁶ in a strong octahedral field (Δ₀ > P) is:",
    options: [
      { id: "A", text: "t₂g⁴ eg²" },
      { id: "B", text: "t₂g⁶ eg⁰" },
      { id: "C", text: "t₂g³ eg³" },
      { id: "D", text: "t₂g⁵ eg¹" },
    ],
    correctAnswer: "B",
    solution: "In a strong field, pairing energy P is smaller than crystal field splitting Δ₀ (Δ₀ > P). All 6 electrons pair up in the lower energy t₂g orbitals, resulting in diamagnetic low-spin configuration: t₂g⁶ eg⁰.",
    marks: 4,
    negative: 1,
  },
  {
    id: "chem-03",
    subject: "Chemistry",
    exam: "JEE Advanced",
    topic: "Thermodynamics · Gibbs Free Energy",
    question: "For an endothermic reaction (ΔH > 0) to be spontaneous at all temperatures, the entropy change (ΔS) must be:",
    options: [
      { id: "A", text: "ΔS > 0 and |TΔS| > |ΔH|" },
      { id: "B", text: "ΔS < 0" },
      { id: "C", text: "Spontaneous at high T only when ΔS > 0" },
      { id: "D", text: "Spontaneous at all T only if ΔH < 0 and ΔS > 0" },
    ],
    correctAnswer: "C",
    solution: "Gibbs free energy relation: ΔG = ΔH - TΔS. Since ΔH > 0 (endothermic), ΔG can only be negative (spontaneous) if ΔS > 0 and the temperature T is sufficiently high such that TΔS > ΔH.",
    marks: 4,
    negative: 1,
  },

  // Mathematics (JEE Main & Advanced)
  {
    id: "math-01",
    subject: "Mathematics",
    exam: "JEE Main",
    topic: "Calculus · Definite Integrals",
    question: "Evaluate the integral: I = ∫ [from 0 to π/2] (sin⁴ x) / (sin⁴ x + cos⁴ x) dx.",
    options: [
      { id: "A", text: "π / 2" },
      { id: "B", text: "π / 4" },
      { id: "C", text: "π" },
      { id: "D", text: "0" },
    ],
    correctAnswer: "B",
    solution: "Using King's property: ∫ [0 to a] f(x) dx = ∫ [0 to a] f(a - x) dx.\nHere a = π/2, so sin(π/2 - x) = cos x and cos(π/2 - x) = sin x.\nI = ∫ [0 to π/2] (cos⁴ x) / (cos⁴ x + sin⁴ x) dx.\nAdding both equations:\n2I = ∫ [0 to π/2] 1 dx = π/2  ⟹  I = π / 4.",
    marks: 4,
    negative: 1,
  },
  {
    id: "math-02",
    subject: "Mathematics",
    exam: "JEE Main / Advanced",
    topic: "Trigonometry · Identity Optimization",
    question: "If sin θ + cosec θ = 2, then the value of sin¹⁰ θ + cosec¹⁰ θ is equal to:",
    options: [
      { id: "A", text: "2¹⁰" },
      { id: "B", text: "2" },
      { id: "C", text: "1" },
      { id: "D", text: "10" },
    ],
    correctAnswer: "B",
    solution: "Let x = sin θ. Then x + 1/x = 2 ⟹ x² - 2x + 1 = 0 ⟹ (x - 1)² = 0 ⟹ x = 1.\nThus sin θ = 1 and cosec θ = 1.\nTherefore sin¹⁰ θ + cosec¹⁰ θ = (1)¹⁰ + (1)¹⁰ = 1 + 1 = 2.",
    marks: 4,
    negative: 1,
  },
  {
    id: "math-03",
    subject: "Mathematics",
    exam: "JEE Advanced",
    topic: "Vectors & 3D Geometry",
    question: "The shortest distance between the skew lines r₁ = (i + 2j + 3k) + λ(2i + 3j + 4k) and r₂ = (2i + 4j + 5k) + μ(3i + 4j + 5k) is:",
    options: [
      { id: "A", text: "1 / √6" },
      { id: "B", text: "1 / √3" },
      { id: "C", text: "2 / √6" },
      { id: "D", text: "0" },
    ],
    correctAnswer: "A",
    solution: "Shortest distance d = |(a₂ - a₁) · (b₁ × b₂)| / |b₁ × b₂|.\na₂ - a₁ = (2-1)i + (4-2)j + (5-3)k = i + 2j + 2k.\nb₁ × b₂ = |i j k; 2 3 4; 3 4 5| = -i + 2j - k.\nNumerator: |(1)(-1) + (2)(2) + (2)(-1)| = |-1 + 4 - 2| = 1.\nDenominator: |b₁ × b₂| = √((-1)² + 2² + (-1)²) = √(1 + 4 + 1) = √6.\nThus d = 1 / √6.",
    marks: 4,
    negative: 1,
  },

  // Biology (NEET)
  {
    id: "bio-01",
    subject: "Biology",
    exam: "NEET",
    topic: "Genetics · Molecular Basis of Inheritance",
    question: "If the sequence of nitrogen bases of the coding strand of DNA is 5'-ATGCGATAG-3', what will be the sequence of bases in the corresponding mRNA?",
    options: [
      { id: "A", text: "5'-UACGCUAUC-3'" },
      { id: "B", text: "5'-AUGCGAUAG-3'" },
      { id: "C", text: "3'-AUGCGAUAG-5'" },
      { id: "D", text: "5'-CUAUGCGUA-3'" },
    ],
    correctAnswer: "B",
    solution: "The mRNA transcript has the EXACT SAME polarity (5' → 3') and sequence as the coding strand, with only Thymine (T) replaced by Uracil (U). Therefore, 5'-ATGCGATAG-3' transcribes to 5'-AUGCGAUAG-3'.",
    marks: 4,
    negative: 1,
  },
  {
    id: "bio-02",
    subject: "Biology",
    exam: "NEET",
    topic: "Human Physiology · Neural Control",
    question: "During the generation of action potential across the axolemma of a neuron, the rapid influx of which ion is responsible for depolarization?",
    options: [
      { id: "A", text: "K⁺ ions" },
      { id: "B", text: "Na⁺ ions" },
      { id: "C", text: "Ca²⁺ ions" },
      { id: "D", text: "Cl⁻ ions" },
    ],
    correctAnswer: "B",
    solution: "When a stimulus is applied to a resting nerve, voltage-gated Na⁺ channels open rapidly. The influx of Na⁺ down its electrochemical gradient causes the interior of the membrane to become positively charged, producing depolarization.",
    marks: 4,
    negative: 1,
  },
  {
    id: "bio-03",
    subject: "Biology",
    exam: "NEET",
    topic: "Ecology · Biodiversity & Conservation",
    question: "According to Robert May's global estimate, the total number of species present on Earth is approximately:",
    options: [
      { id: "A", text: "1.7 to 1.8 million" },
      { id: "B", text: "20 to 50 million" },
      { id: "C", text: "7 million" },
      { id: "D", text: "100 million" },
    ],
    correctAnswer: "C",
    solution: "According to Robert May's mathematically sound global estimate, there are approximately 7 million species on Earth, of which only 22% (around 1.5 million) have been officially discovered and named so far.",
    marks: 4,
    negative: 1,
  },
];

export function CBTDrill() {
  const [filterTrack, setFilterTrack] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [visitedIndices, setVisitedIndices] = useState(new Set([0]));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600 seconds)
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const timerRef = useRef(null);

  const filteredQuestions = CBT_QUESTIONS.filter((q) => {
    if (filterTrack === "PCM") return q.subject !== "Biology";
    if (filterTrack === "PCB") return q.subject !== "Mathematics";
    if (filterTrack === "NEET") return q.exam.includes("NEET");
    if (filterTrack === "JEE") return q.exam.includes("JEE");
    return true;
  });

  const activeQuestion = filteredQuestions[currentIndex] || filteredQuestions[0];

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || !isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, isTimerRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectAnswer = (optionId) => {
    soundEngine.playClick();
    setUserAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: optionId,
    }));
  };

  const handleClearResponse = () => {
    soundEngine.playClick();
    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[activeQuestion.id];
      return next;
    });
  };

  const handleToggleReview = () => {
    soundEngine.playClick();
    setMarkedForReview((prev) => ({
      ...prev,
      [activeQuestion.id]: !prev[activeQuestion.id],
    }));
    handleNext();
  };

  const handleNext = () => {
    soundEngine.playClick();
    if (currentIndex < filteredQuestions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setVisitedIndices((prev) => new Set([...prev, nextIdx]));
    }
  };

  const handlePrev = () => {
    soundEngine.playClick();
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setVisitedIndices((prev) => new Set([...prev, prevIdx]));
    }
  };

  const handleJumpTo = (index) => {
    soundEngine.playClick();
    setCurrentIndex(index);
    setVisitedIndices((prev) => new Set([...prev, index]));
  };

  const handleSubmit = () => {
    soundEngine.playSuccess();
    setIsSubmitted(true);
    setIsTimerRunning(false);
  };

  const handleRestart = () => {
    soundEngine.playClick();
    setUserAnswers({});
    setMarkedForReview({});
    setVisitedIndices(new Set([0]));
    setCurrentIndex(0);
    setTimeLeft(600);
    setIsTimerRunning(true);
    setIsSubmitted(false);
  };

  // Calculate score & statistics
  const totalQuestions = filteredQuestions.length;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let totalScore = 0;

  filteredQuestions.forEach((q) => {
    const answer = userAnswers[q.id];
    if (!answer) {
      unattemptedCount++;
    } else if (answer === q.correctAnswer) {
      correctCount++;
      totalScore += q.marks;
    } else {
      incorrectCount++;
      totalScore -= q.negative;
    }
  });

  const maxPossibleScore = totalQuestions * 4;
  const accuracy = correctCount + incorrectCount > 0
    ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
    : 0;

  return (
    <div className="page-wrap cbt-drill-container" data-reveal>
      {/* Top Telemetry & Banner */}
      <header className="cbt-header-banner">
        <div>
          <div className="cbt-badge-row">
            <span className="cbt-live-dot" />
            <span className="cbt-exam-tag">NTA PRACTICE SUITE · 2026</span>
            <span className="cbt-sub-tag">AUTHENTIC CBT SIMULATOR</span>
          </div>
          <h1 className="cbt-title">
            All India <em>CBT Exam Drill</em>
          </h1>
          <p className="cbt-subtitle">
            Timed simulation with authentic NTA pattern, negative marking (+4 / -1), question telemetry, and instant solution analytics.
          </p>
        </div>

        {/* Realtime Countdown Timer */}
        {!isSubmitted && (
          <div className={`cbt-timer-box ${timeLeft < 120 ? "is-urgent" : ""}`}>
            <span className="timer-label">TIME REMAINING</span>
            <span className="timer-digits">{formatTime(timeLeft)}</span>
            <button
              type="button"
              className="timer-pause-btn"
              onClick={() => {
                soundEngine.playClick();
                setIsTimerRunning((r) => !r);
              }}
              title={isTimerRunning ? "Pause timer" : "Resume timer"}
            >
              {isTimerRunning ? "Pause ❚❚" : "Resume ▶"}
            </button>
          </div>
        )}
      </header>

      {/* Stream / Track Selector */}
      {!isSubmitted && (
        <div className="cbt-track-selector" role="tablist" aria-label="Exam track">
          {[
            { id: "all", label: "All Subjects (PCM + Bio)" },
            { id: "PCM", label: "JEE Main Sprint (PCM)" },
            { id: "PCB", label: "NEET Super-10 (PCB)" },
            { id: "JEE", label: "JEE Archive Specials" },
          ].map((track) => (
            <button
              key={track.id}
              type="button"
              className={`cbt-track-btn ${filterTrack === track.id ? "is-active" : ""}`}
              onClick={() => {
                soundEngine.playClick();
                setFilterTrack(track.id);
                setCurrentIndex(0);
                setVisitedIndices(new Set([0]));
              }}
            >
              {track.label}
            </button>
          ))}
        </div>
      )}

      {isSubmitted ? (
        /* Results & Solutions Analytics View */
        <section className="cbt-results-screen" aria-label="Exam results">
          <div className="cbt-score-card">
            <span className="score-badge">EXAM DRILL COMPLETE</span>
            <h2 className="score-headline">Performance Analysis</h2>
            
            <div className="cbt-metrics-grid">
              <div className="metric-box">
                <span className="metric-title">TOTAL SCORE</span>
                <span className={`metric-val ${totalScore >= 0 ? "is-pos" : "is-neg"}`}>
                  {totalScore} <small>/ {maxPossibleScore}</small>
                </span>
                <span className="metric-sub">NTA (+4 / -1)</span>
              </div>
              <div className="metric-box">
                <span className="metric-title">ACCURACY</span>
                <span className="metric-val">{accuracy}%</span>
                <span className="metric-sub">Precision Rate</span>
              </div>
              <div className="metric-box">
                <span className="metric-title">CORRECT</span>
                <span className="metric-val is-green">{correctCount}</span>
                <span className="metric-sub">Questions</span>
              </div>
              <div className="metric-box">
                <span className="metric-title">INCORRECT</span>
                <span className="metric-val is-red">{incorrectCount}</span>
                <span className="metric-sub">(-{incorrectCount} marks)</span>
              </div>
              <div className="metric-box">
                <span className="metric-title">UNATTEMPTED</span>
                <span className="metric-val">{unattemptedCount}</span>
                <span className="metric-sub">Skipped</span>
              </div>
            </div>

            <div className="cbt-actions-row">
              <button
                type="button"
                className="cbt-cta-btn"
                onClick={handleRestart}
              >
                Retake CBT Drill ↺
              </button>
              <Link to="/pyq" className="cbt-secondary-btn">
                Browse 47-Year PYQ Papers ↗
              </Link>
            </div>
          </div>

          {/* Solutions Breakdown */}
          <div className="cbt-solutions-vault">
            <h3 className="solutions-heading">Comprehensive Step-by-Step Solutions</h3>
            <div className="solutions-list">
              {filteredQuestions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isCorrect = userAns === q.correctAnswer;
                const isSkipped = !userAns;

                return (
                  <article key={q.id} className={`solution-item ${isCorrect ? "was-correct" : isSkipped ? "was-skipped" : "was-incorrect"}`}>
                    <div className="solution-item-header">
                      <div>
                        <span className="solution-q-num">Q{idx + 1} · {q.subject}</span>
                        <span className="solution-topic">{q.topic}</span>
                      </div>
                      <span className={`solution-result-badge ${isCorrect ? "badge-green" : isSkipped ? "badge-grey" : "badge-red"}`}>
                        {isCorrect ? "✓ +4 MARKS" : isSkipped ? "○ UNATTEMPTED" : "✕ -1 MARK"}
                      </span>
                    </div>

                    <p className="solution-q-text">{q.question}</p>

                    <div className="solution-options-preview">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`preview-opt ${opt.id === q.correctAnswer ? "is-correct-opt" : ""} ${userAns === opt.id && !isCorrect ? "is-wrong-opt" : ""}`}
                        >
                          <strong>({opt.id})</strong> {opt.text}
                          {opt.id === q.correctAnswer && <span className="opt-tag">CORRECT ANSWER</span>}
                          {userAns === opt.id && opt.id !== q.correctAnswer && <span className="opt-tag tag-wrong">YOUR ANSWER</span>}
                        </div>
                      ))}
                    </div>

                    <div className="solution-derivation-box">
                      <span className="derivation-label">STEP-BY-STEP DERIVATION:</span>
                      <pre className="derivation-content">{q.solution}</pre>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        /* Active Question & Palette Screen */
        <div className="cbt-stage-grid">
          {/* Main Question Arena */}
          <main className="cbt-question-card" aria-label="Question workspace">
            <div className="cbt-q-header">
              <div className="cbt-q-meta">
                <span className="cbt-q-index">QUESTION {currentIndex + 1} OF {filteredQuestions.length}</span>
                <span className="cbt-subject-tag">{activeQuestion.subject}</span>
                <span className="cbt-topic-tag">{activeQuestion.topic}</span>
              </div>
              <div className="cbt-marks-info">
                <span className="mark-pos">+4</span>
                <span className="mark-neg">-1</span>
              </div>
            </div>

            <div className="cbt-q-body">
              <p className="cbt-q-text">{activeQuestion.question}</p>

              {/* Options */}
              <div className="cbt-options-group" role="radiogroup">
                {activeQuestion.options.map((option) => {
                  const isSelected = userAnswers[activeQuestion.id] === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`cbt-option-item ${isSelected ? "is-selected" : ""}`}
                      onClick={() => handleSelectAnswer(option.id)}
                    >
                      <input
                        type="radio"
                        name={`q-${activeQuestion.id}`}
                        checked={isSelected}
                        onChange={() => handleSelectAnswer(option.id)}
                        className="sr-only"
                      />
                      <span className="opt-key">{option.id}</span>
                      <span className="opt-text">{option.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Controls */}
            <footer className="cbt-q-controls">
              <div className="controls-left">
                <button
                  type="button"
                  className="cbt-btn btn-secondary"
                  onClick={handleClearResponse}
                  disabled={!userAnswers[activeQuestion.id]}
                >
                  Clear Response
                </button>
                <button
                  type="button"
                  className="cbt-btn btn-review"
                  onClick={handleToggleReview}
                >
                  {markedForReview[activeQuestion.id] ? "Unmark Review" : "Mark for Review & Next"}
                </button>
              </div>

              <div className="controls-right">
                <button
                  type="button"
                  className="cbt-btn btn-nav"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className="cbt-btn btn-primary"
                  onClick={handleNext}
                  disabled={currentIndex === filteredQuestions.length - 1}
                >
                  Save &amp; Next →
                </button>
                <button
                  type="button"
                  className="cbt-btn btn-submit"
                  onClick={handleSubmit}
                >
                  Submit Test ↗
                </button>
              </div>
            </footer>
          </main>

          {/* Question Palette Sidebar (NTA Authentic Design) */}
          <aside className="cbt-palette-card" aria-label="Question status palette">
            <h3 className="palette-title">Question Palette</h3>
            
            {/* Legend */}
            <div className="palette-legend">
              <div className="legend-item">
                <span className="legend-box box-answered" />
                <span>Answered</span>
              </div>
              <div className="legend-item">
                <span className="legend-box box-review" />
                <span>Marked Review</span>
              </div>
              <div className="legend-item">
                <span className="legend-box box-not-answered" />
                <span>Not Answered</span>
              </div>
              <div className="legend-item">
                <span className="legend-box box-not-visited" />
                <span>Not Visited</span>
              </div>
            </div>

            {/* Palette Grid */}
            <div className="palette-grid">
              {filteredQuestions.map((q, idx) => {
                const isAnswered = Boolean(userAnswers[q.id]);
                const isReview = Boolean(markedForReview[q.id]);
                const isVisited = visitedIndices.has(idx);
                const isCurrent = idx === currentIndex;

                let statusClass = "is-not-visited";
                if (isReview) {
                  statusClass = "is-review";
                } else if (isAnswered) {
                  statusClass = "is-answered";
                } else if (isVisited) {
                  statusClass = "is-not-answered";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    className={`palette-num-btn ${statusClass} ${isCurrent ? "is-current-btn" : ""}`}
                    onClick={() => handleJumpTo(idx)}
                    title={`Jump to Q${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Quick summary tally */}
            <div className="palette-tally">
              <div className="tally-row">
                <span>Total Questions:</span>
                <strong>{filteredQuestions.length}</strong>
              </div>
              <div className="tally-row">
                <span>Answered:</span>
                <strong className="text-green">
                  {filteredQuestions.filter((q) => userAnswers[q.id]).length}
                </strong>
              </div>
              <div className="tally-row">
                <span>Marked for Review:</span>
                <strong className="text-purple">
                  {filteredQuestions.filter((q) => markedForReview[q.id]).length}
                </strong>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
