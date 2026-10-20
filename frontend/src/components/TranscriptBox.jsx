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
    <div className="clinic-card transcript-card" style={{ padding: "20px", height: "100%", minHeight: "360px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <MessageSquare size={18} color="var(--accent-color)" />
          <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--heading-color)" }}>Live Consultation Speech</h3>
          <span className="badge badge-draft" style={{ fontSize: "0.72rem" }}>
            {chunks.length} Chunks
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "var(--muted-color)" }}>
          <Globe size={14} color="var(--accent-color)" />
          <span>{language}</span>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          paddingRight: "6px",
          maxHeight: "340px"
        }}
      >
        {chunks.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--subtle-color)", textAlign: "center", gap: "10px", padding: "40px 20px" }}>
            <MessageSquare size={36} style={{ opacity: 0.35 }} />
            <p style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--muted-color)" }}>No speech recorded yet</p>
            <p style={{ fontSize: "0.82rem", maxWidth: "260px" }}>
              Audio chunks upload every 10 seconds and appear here in real time as the doctor and patient speak.
            </p>
          </div>
        ) : (
          chunks.map((chunk, idx) => (
            <div
              key={chunk.id || idx}
              className="transcript-bubble"
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--accent-color)", fontWeight: "700" }}>
                  Chunk #{chunk.chunk_no || idx + 1}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--muted-color)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={11} /> {formatTimestamp(chunk.timestamp)}
                </span>
              </div>
              <p style={{ fontSize: "0.92rem", color: "var(--default-color)", lineHeight: "1.5" }}>
                {chunk.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
