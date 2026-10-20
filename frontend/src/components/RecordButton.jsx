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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "12px 0" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Pulsing ring when active */}
        {isRecording && (
          <div
            className="pulse-recording"
            style={{
              position: "absolute",
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              backgroundColor: "rgba(223, 21, 41, 0.2)",
            }}
          />
        )}

        <button
          onClick={isRecording ? onStop : onStart}
          disabled={disabled}
          className={`btn ${isRecording ? "btn-danger" : "btn-primary"}`}
          style={{
            width: "88px",
            height: "88px",
            borderRadius: "50%",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isRecording
              ? "0 6px 25px rgba(223, 21, 41, 0.45)"
              : "0 6px 25px rgba(23, 92, 221, 0.4)",
            zIndex: 2,
          }}
        >
          {isRecording ? (
            <>
              <Square size={28} fill="currentColor" />
              <span style={{ fontSize: "0.68rem", marginTop: "4px", fontWeight: "800", letterSpacing: "0.5px" }}>STOP</span>
            </>
          ) : (
            <>
              <Mic size={30} />
              <span style={{ fontSize: "0.68rem", marginTop: "4px", fontWeight: "800", letterSpacing: "0.5px" }}>START</span>
            </>
          )}
        </button>
      </div>

      {/* Recording Duration & Audio Level */}
      {isRecording ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--danger-color)", display: "inline-block" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: "700", color: "var(--danger-color)" }}>
              {formatTime(duration)}
            </span>
          </div>

          {/* Sound waves visualizer */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", height: "24px" }}>
            {[0.4, 0.8, 1.2, 0.6, 1.0, 0.7, 1.4, 0.5, 0.9, 0.3].map((factor, i) => {
              const height = Math.max(4, Math.min(24, Math.round((audioLevel / 100) * 24 * factor)));
              return (
                <div
                  key={i}
                  className="wave-bar"
                  style={{
                    height: `${height}px`,
                    opacity: audioLevel > 5 ? 0.95 : 0.3,
                  }}
                />
              );
            })}
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--muted-color)" }}>
            Capturing ambient audio &bull; Chunks transmit every 10s
          </span>
        </div>
      ) : (
        <span style={{ fontSize: "0.86rem", color: "var(--muted-color)", fontWeight: "500" }}>
          Tap Start to begin consultation recording
        </span>
      )}
    </div>
  );
}
