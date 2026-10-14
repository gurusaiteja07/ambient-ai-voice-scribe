import React from "react";
import { Mic, Square, Activity } from "lucide-react";

export function RecordButton({
  isRecording,
  duration,
  audioLevel,
  onStart,
  onStop,
  disabled
}) {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "16px 0" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Pulsing ring when active */}
        {isRecording && (
          <div
            className="pulse-recording"
            style={{
              position: "absolute",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              backgroundColor: "rgba(244, 63, 94, 0.2)",
            }}
          />
        )}

        <button
          onClick={isRecording ? onStop : onStart}
          disabled={disabled}
          className={`btn ${isRecording ? "btn-danger" : "btn-primary"}`}
          style={{
            width: "84px",
            height: "84px",
            borderRadius: "50%",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isRecording
              ? "0 0 25px rgba(244, 63, 94, 0.6)"
              : "0 0 25px rgba(13, 148, 136, 0.5)",
            zIndex: 2,
          }}
        >
          {isRecording ? (
            <>
              <Square size={28} fill="currentColor" />
              <span style={{ fontSize: "0.65rem", marginTop: "4px", fontWeight: "700" }}>STOP</span>
            </>
          ) : (
            <>
              <Mic size={30} />
              <span style={{ fontSize: "0.65rem", marginTop: "4px", fontWeight: "700" }}>START</span>
            </>
          )}
        </button>
      </div>

      {/* Recording Duration & Audio Level */}
      {isRecording ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f43f5e", display: "inline-block" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: "700", color: "#f43f5e" }}>
              {formatTime(duration)}
            </span>
          </div>

          {/* Sound waves visualizer */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "24px" }}>
            {[0.4, 0.8, 1.2, 0.6, 1.0, 0.7, 1.4, 0.5, 0.9, 0.3].map((factor, i) => {
              const height = Math.max(4, Math.min(24, Math.round((audioLevel / 100) * 24 * factor)));
              return (
                <div
                  key={i}
                  className="wave-bar"
                  style={{
                    height: `${height}px`,
                    opacity: audioLevel > 5 ? 0.9 : 0.3,
                  }}
                />
              );
            })}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Listening ambiently... chunks upload every 10s
          </span>
        </div>
      ) : (
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Tap Start to begin ambient consultation recording
        </span>
      )}
    </div>
  );
}
