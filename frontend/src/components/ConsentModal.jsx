import React, { useState } from "react";
import { ShieldCheck, AlertCircle, Mic, CheckCircle } from "lucide-react";

export function ConsentModal({ isOpen, patientName, onConsentGranted, onCancel }) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="glass-panel" style={{ maxWidth: "480px", width: "100%", padding: "28px", border: "1px solid rgba(13, 148, 136, 0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "rgba(13, 148, 136, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2dd4bf"
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem" }}>Patient Consent Verification</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ABDM Privacy & Digital Health Guidelines</p>
          </div>
        </div>

        <div style={{
          background: "rgba(255, 255, 255, 0.04)",
          padding: "16px",
          borderRadius: "10px",
          fontSize: "0.88rem",
          color: "#cbd5e1",
          lineHeight: "1.5",
          marginBottom: "20px"
        }}>
          <p style={{ marginBottom: "10px" }}>
            The patient (<strong>{patientName || "Current Patient"}</strong>) has been informed that:
          </p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>This clinical consultation is being transcribed by an on-premise AI voice assistant.</li>
            <li>Audio stays secure within hospital servers and is used only to generate clinical notes.</li>
            <li>The doctor will review, edit, and digitally sign all records before saving.</li>
          </ul>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "24px" }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: "18px", height: "18px", accentColor: "#0d9488" }}
          />
          <span style={{ fontSize: "0.9rem", color: "#f1f5f9" }}>
            Verbal consent obtained from patient or guardian
          </span>
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConsentGranted}
            disabled={!agreed}
            className="btn btn-primary"
          >
            <Mic size={16} /> Proceed to Record
          </button>
        </div>
      </div>
    </div>
  );
}
