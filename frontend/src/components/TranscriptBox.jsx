import React, { useEffect, useRef } from "react";
import { MessageSquare, Clock, Globe } from "lucide-react";

export function TranscriptBox({ chunks = [], language = "English" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chunks]);

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", height: "340px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageSquare size={18} color="#2dd4bf" />
          <h3 style={{ fontSize: "1rem" }}>Live Consultation Transcript</h3>
          <span className="badge badge-draft" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
            {chunks.length} chunks
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <Globe size={14} />
          <span>Language: {language}</span>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          paddingRight: "6px",
        }}
      >
        {chunks.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-subtle)", textAlign: "center", gap: "8px" }}>
            <MessageSquare size={32} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: "0.9rem" }}>No speech captured yet.</p>
            <p style={{ fontSize: "0.78rem" }}>When recording starts, audio chunks are transcribed and displayed here in real time.</p>
          </div>
        ) : (
          chunks.map((chunk, idx) => (
            <div
              key={chunk.id || idx}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                borderLeft: "3px solid #0d9488",
                borderRadius: "4px 8px 8px 4px",
                padding: "10px 14px",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.72rem", color: "#2dd4bf", fontWeight: "600" }}>
                  Chunk #{chunk.chunk_no || idx + 1}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={12} /> {formatTimestamp(chunk.timestamp)}
                </span>
              </div>
              <p style={{ fontSize: "0.92rem", color: "#f1f5f9", lineHeight: "1.5" }}>
                {chunk.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
