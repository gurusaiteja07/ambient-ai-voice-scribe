import React from "react";
import { Stethoscope, ShieldCheck, LogOut, User } from "lucide-react";

export function Header({ doctor, onLogout }) {
  return (
    <header className="glass-panel" style={{ padding: "12px 24px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #0d9488, #06b6d4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(13, 148, 136, 0.4)"
        }}>
          <Stethoscope size={22} color="#ffffff" />
        </div>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
            Ambient AI Voice Scribe
            <span className="badge badge-abdm">
              <ShieldCheck size={12} /> ABDM Ready
            </span>
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Indian Public Healthcare Consultation Assistant
          </p>
        </div>
      </div>

      {doctor && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: "8px" }}>
            <User size={16} color="#2dd4bf" />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>Dr. {doctor.name}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{doctor.hospital || "AIIMS"}</div>
            </div>
          </div>
          <button onClick={onLogout} className="btn btn-secondary" style={{ padding: "8px 12px", fontSize: "0.85rem" }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </header>
  );
}
