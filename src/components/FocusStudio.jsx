import { useEffect, useState } from "react";
import "./focus-studio.css";
import { soundEngine } from "../utils/audio.js";

const studyPrompts = [
  { track: "PCM", question: "What does the slope of a position–time graph tell you about motion?" },
  { track: "PCB", question: "Why can a tiny change in pH affect how an enzyme works?" },
  { track: "Commerce", question: "What happens to demand when the price of a substitute falls?" },
  { track: "Humanities", question: "How do historians decide whether a source is reliable?" },
  { track: "PCM", question: "How can you predict the shape of a quadratic graph from its equation?" },
  { track: "PCB", question: "How does the structure of DNA help it copy itself accurately?" },
  { track: "Commerce", question: "Why does a business distinguish fixed costs from variable costs?" },
  { track: "Humanities", question: "How can the same event be remembered in different ways?" },
  { track: "PCM", question: "What is the physical meaning of the cross product of two vectors?" },
  { track: "PCB", question: "How does the nephron maintain electrolyte balance in the human body?" },
];

const durations = {
  focus: [15, 25, 45],
  break: [5, 10, 15],
};

function getDailyPromptIndex() {
  const today = new Date();
  const dayNumber = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86_400_000);
  return dayNumber % studyPrompts.length;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function FocusStudio({ onSearchSources }) {
  const [promptIndex, setPromptIndex] = useState(getDailyPromptIndex);
  const [mode, setMode] = useState("focus");
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [deadline, setDeadline] = useState(null);
  const [running, setRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [timerMessage, setTimerMessage] = useState("Choose a length, then begin when you’re ready.");
  const [ambience, setAmbience] = useState("none");

  useEffect(() => {
    if (!running || deadline === null) return undefined;

    const tick = () => {
      const secondsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(secondsLeft);
      if (secondsLeft === 0) {
        setRunning(false);
        setDeadline(null);
        soundEngine.playIntroChord();
        if (mode === "focus") setCompletedSessions((count) => count + 1);
        setTimerMessage(mode === "focus" ? "Focus session complete. Take a well-earned pause." : "Break complete. Ready when you are.");
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [deadline, mode, running]);

  function handleAmbienceChange(type) {
    soundEngine.playClick();
    setAmbience(type);
    soundEngine.setAmbience(type);
  }

  function chooseMode(nextMode) {
    soundEngine.playClick();
    const nextMinutes = durations[nextMode][nextMode === "focus" ? 1 : 0];
    setMode(nextMode);
    setMinutes(nextMinutes);
    setRemaining(nextMinutes * 60);
    setDeadline(null);
    setRunning(false);
    setTimerMessage(nextMode === "focus" ? "A little focus goes a long way." : "A short pause can clear the page.");
  }

  function chooseDuration(nextMinutes) {
    soundEngine.playClick();
    setMinutes(nextMinutes);
    setRemaining(nextMinutes * 60);
    setDeadline(null);
    setRunning(false);
    setTimerMessage(`Ready for ${nextMinutes} minutes.`);
  }

  function toggleTimer() {
    soundEngine.playClick();
    if (running) {
      const secondsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(secondsLeft);
      setDeadline(null);
      setRunning(false);
      setTimerMessage("Timer paused. Pick it up whenever you’re ready.");
      return;
    }

    const secondsToRun = remaining === 0 ? minutes * 60 : remaining;
    setRemaining(secondsToRun);
    setDeadline(Date.now() + secondsToRun * 1000);
    setRunning(true);
    setTimerMessage(mode === "focus" ? "Focus session in progress." : "Break in progress.");
  }

  function resetTimer() {
    soundEngine.playClick();
    setRunning(false);
    setDeadline(null);
    setRemaining(minutes * 60);
    setTimerMessage(`Reset. Ready for ${minutes} minutes.`);
  }

  const prompt = studyPrompts[promptIndex];
  const progress = 1 - remaining / (minutes * 60);

  return (
    <section className="focus-studio page-wrap" data-reveal aria-labelledby="focus-studio-title">
      <div className="focus-studio-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> A QUESTION TO FOLLOW · A MOMENT TO FOCUS</p>
          <h2 id="focus-studio-title">Make a little<br /><em>room to think.</em></h2>
        </div>
        <p>Start with a spark of curiosity, then give yourself a few quiet minutes to follow it.</p>
      </div>

      <div className="focus-studio-grid">
        <article className="daily-spark-card">
          <div className="spark-card-topline">
            <span className="spark-card-label"><span className="spark-live-dot" /> TODAY’S STUDY SPARK</span>
            <span className="spark-track">{prompt.track}</span>
          </div>
          <div className="spark-orbit" aria-hidden="true"><span>?</span></div>
          <p className="spark-card-kicker">A QUESTION FOR YOUR SHELF</p>
          <h3 key={promptIndex} className="spark-question">{prompt.question}</h3>
          <p className="spark-card-note">Good questions are a lovely place to begin.</p>
          <div className="spark-card-actions">
            <button
              type="button"
              className="spark-next-button"
              onClick={() => {
                soundEngine.playClick();
                setPromptIndex((index) => (index + 1) % studyPrompts.length);
              }}
            >
              Another question <span aria-hidden="true">↻</span>
            </button>
            <button
              type="button"
              className="spark-explore-button"
              onClick={() => {
                soundEngine.playClick();
                onSearchSources(prompt.question);
              }}
            >
              Explore this idea <span aria-hidden="true">↗</span>
            </button>
          </div>
        </article>

        <article className="focus-timer-card" aria-label="Focus timer">
          <div className="timer-mode-switch" role="group" aria-label="Timer mode">
            <button type="button" aria-pressed={mode === "focus"} onClick={() => chooseMode("focus")}>Focus</button>
            <button type="button" aria-pressed={mode === "break"} onClick={() => chooseMode("break")}>Break</button>
          </div>
          <div className={`timer-dial ${running ? "is-running" : ""}`} style={{ "--timer-offset": 452.39 * (1 - progress) }}>
            <svg viewBox="0 0 160 160" aria-hidden="true">
              <circle className="timer-dial-track" cx="80" cy="80" r="72" />
              <circle className="timer-dial-progress" cx="80" cy="80" r="72" />
            </svg>
            <div className="timer-reading" role="timer" aria-label={`${formatTime(remaining)} remaining`}>
              <span>{formatTime(remaining)}</span>
              <small>{running ? "IN SESSION" : mode === "focus" ? "FOCUS TIME" : "BREATHER"}</small>
            </div>
          </div>
          <div className="timer-presets" role="group" aria-label="Session length">
            {durations[mode].map((duration) => (
              <button
                type="button"
                key={`${mode}-${duration}`}
                aria-pressed={minutes === duration}
                disabled={running}
                onClick={() => chooseDuration(duration)}
              >
                {duration}<small>MIN</small>
              </button>
            ))}
          </div>
          <div className="timer-actions">
            <button type="button" className="timer-start-button" onClick={toggleTimer}>
              {running ? "Pause session" : remaining === minutes * 60 || remaining === 0 ? "Start a session" : "Resume session"}
              <span aria-hidden="true">{running ? "Ⅱ" : "↗"}</span>
            </button>
            <button type="button" className="timer-reset-button" onClick={resetTimer} aria-label="Reset timer">↺</button>
          </div>

          {/* Ambient Soundscapes Switcher */}
          <div className="timer-ambience-panel" style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "0.85rem" }}>
            <span style={{ fontSize: "0.7rem", fontFamily: "var(--mono)", color: "var(--muted)", display: "block", marginBottom: "6px" }}>
              ♪ FOCUS SOUNDSCAPES (WEB AUDIO)
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { id: "none", label: "Mute" },
                { id: "rain", label: "Rain 🌧️" },
                { id: "space", label: "Cosmos 🌌" },
                { id: "binaural", label: "432Hz 🧘" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAmbienceChange(item.id)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "999px",
                    border: "1px solid",
                    borderColor: ambience === item.id ? "var(--accent)" : "var(--border)",
                    background: ambience === item.id ? "rgba(215,173,120,0.15)" : "transparent",
                    color: ambience === item.id ? "var(--accent)" : "inherit",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                    fontFamily: "var(--mono)",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="timer-footer">
            <span aria-live="polite">{timerMessage}</span>
            <span>{completedSessions} {completedSessions === 1 ? "session" : "sessions"} finished</span>
          </div>
        </article>
      </div>
    </section>
  );
}
