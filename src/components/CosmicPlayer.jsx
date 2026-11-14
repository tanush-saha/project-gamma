import React, { useEffect, useRef, useState } from "react";
import { soundEngine } from "../utils/audio.js";

const STATIONS = [
  { id: "lofi", label: "Lo-Fi Study Drift", tag: "WARM CHORDS", icon: "☕" },
  { id: "rain", label: "Rainy Library", tag: "NATURAL PINK NOISE", icon: "🌧️" },
  { id: "space", label: "Cosmic Drone", tag: "SUB-BASS RESONANCE", icon: "🌌" },
  { id: "binaural", label: "432Hz Binaural Beat", tag: "THETA FOCUS", icon: "🧠" },
  { id: "none", label: "Mute Station", tag: "SILENCE", icon: "⏹️" },
];

export function CosmicPlayer({ isOpen, onClose }) {
  const [audioState, setAudioState] = useState({
    currentAmbience: "none",
    muted: false,
    volume: 0.35,
  });
  const [isMinimized, setIsMinimized] = useState(true);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const unsubscribe = soundEngine.subscribe((state) => {
      setAudioState({ ...state });
    });
    return unsubscribe;
  }, []);

  // Live frequency visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      const freqData = soundEngine.getFrequencies();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const barCount = 28;
      const barWidth = (width / barCount) - 2;
      const isMutedOrSilent = audioState.muted || audioState.currentAmbience === "none";

      for (let i = 0; i < barCount; i++) {
        // Sample frequencies or create gentle idling wave if idle
        let val = isMutedOrSilent
          ? 4 + Math.sin(Date.now() * 0.003 + i * 0.4) * 3
          : (freqData[i % freqData.length] / 255) * height;

        val = Math.max(3, Math.min(height, val));

        const x = i * (barWidth + 2);
        const y = height - val;

        // Gradient: cyan to amber/gold
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, "rgba(215, 173, 120, 0.4)");
        grad.addColorStop(0.6, "rgba(215, 173, 120, 0.95)");
        grad.addColorStop(1, "rgba(255, 235, 190, 1)");

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, val);

        // Highlight tip dot
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.fillRect(x, Math.max(0, y - 2), barWidth, 2);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [audioState.muted, audioState.currentAmbience]);

  const activeStation = STATIONS.find((s) => s.id === audioState.currentAmbience) || STATIONS[4];
  const isPlaying = audioState.currentAmbience !== "none" && !audioState.muted;

  const handleSelectStation = (id) => {
    soundEngine.playClick();
    if (audioState.currentAmbience === id && id !== "none") {
      soundEngine.setAmbience("none");
    } else {
      soundEngine.setAmbience(id);
    }
  };

  const handleTogglePlay = () => {
    soundEngine.playClick();
    if (isPlaying) {
      soundEngine.setAmbience("none");
    } else {
      soundEngine.setAmbience("lofi");
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    soundEngine.setVolume(val);
  };

  const handleToggleMute = () => {
    soundEngine.playClick();
    soundEngine.toggleMute();
  };

  if (!isOpen) return null;

  return (
    <aside
      className={`cosmic-player-deck ${isMinimized ? "is-minimized" : "is-expanded"}`}
      aria-label="Cosmic Audio Player"
    >
      {isMinimized ? (
        <div
          className="cosmic-minimized-pill"
          onClick={() => {
            soundEngine.playClick();
            setIsMinimized(false);
          }}
          title="Open Cosmic Radio & Audio Visualizer"
          role="button"
          tabIndex={0}
        >
          <div className="mini-bars" aria-hidden="true">
            <span className={isPlaying ? "is-bouncing b1" : "b1"} />
            <span className={isPlaying ? "is-bouncing b2" : "b2"} />
            <span className={isPlaying ? "is-bouncing b3" : "b3"} />
          </div>
          <span className="mini-station-name">
            {isPlaying ? activeStation.label : "Cosmic Radio"}
          </span>
          <button
            type="button"
            className="mini-play-toggle"
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePlay();
            }}
            title={isPlaying ? "Pause audio" : "Play Lo-Fi"}
            aria-label={isPlaying ? "Pause audio" : "Play Lo-Fi"}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>
        </div>
      ) : (
        <div className="cosmic-expanded-panel">
          <header className="cosmic-header">
            <div className="cosmic-title-wrap">
              <span className="cosmic-signal-orb" aria-hidden="true" />
              <div>
                <span className="cosmic-kicker">ATMOSPHERIC SOUND ENGINE</span>
                <h3 className="cosmic-title">Cosmic Radio &amp; Waves</h3>
              </div>
            </div>
            <div className="cosmic-window-actions">
              <button
                type="button"
                className="cosmic-icon-btn"
                onClick={() => {
                  soundEngine.playClick();
                  setIsMinimized(true);
                }}
                title="Minimize player"
                aria-label="Minimize player"
              >
                _
              </button>
              <button
                type="button"
                className="cosmic-icon-btn"
                onClick={() => {
                  soundEngine.playClick();
                  onClose?.();
                }}
                title="Close player"
                aria-label="Close player"
              >
                ✕
              </button>
            </div>
          </header>

          {/* Realtime Canvas Frequency Equalizer */}
          <div className="cosmic-visualizer-container">
            <canvas
              ref={canvasRef}
              width={280}
              height={56}
              className="cosmic-canvas"
            />
            <div className="cosmic-status-row">
              <span className="cosmic-status-badge">
                {isPlaying ? "● BROADCASTING LIVE" : "○ ENGINE STANDBY"}
              </span>
              <span className="cosmic-tag-label">{activeStation.tag}</span>
            </div>
          </div>

          {/* Sound Stations */}
          <div className="cosmic-station-list" role="radiogroup" aria-label="Audio stations">
            {STATIONS.map((station) => {
              const isCurrent = audioState.currentAmbience === station.id;
              return (
                <button
                  key={station.id}
                  type="button"
                  className={`cosmic-station-item ${isCurrent ? "is-active" : ""}`}
                  onClick={() => handleSelectStation(station.id)}
                  role="radio"
                  aria-checked={isCurrent}
                >
                  <span className="station-icon" aria-hidden="true">{station.icon}</span>
                  <div className="station-meta">
                    <span className="station-label">{station.label}</span>
                    <span className="station-sub">{station.tag}</span>
                  </div>
                  {isCurrent && isPlaying && <span className="station-pulse-dot" />}
                </button>
              );
            })}
          </div>

          {/* Controls: Volume & Mute */}
          <footer className="cosmic-controls-bar">
            <button
              type="button"
              className="cosmic-mute-btn"
              onClick={handleToggleMute}
              title={audioState.muted ? "Unmute" : "Mute"}
              aria-label={audioState.muted ? "Unmute" : "Mute"}
            >
              {audioState.muted ? "🔇" : "🔊"}
            </button>
            <div className="cosmic-vol-slider-wrap">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioState.volume}
                onChange={handleVolumeChange}
                className="cosmic-vol-slider"
                aria-label="Cosmic player volume"
              />
              <span className="cosmic-vol-percent">
                {Math.round(audioState.volume * 100)}%
              </span>
            </div>
          </footer>
        </div>
      )}
    </aside>
  );
}
