import React, { useState } from "react";
import { ShieldCheck, Mic, X } from "lucide-react";

export function ConsentModal({ patientName, onConsentGranted, onCancel }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="clinic-card-header" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={20} color="var(--accent-color)" />
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--heading-color)" }}>Patient Consultation Consent</h3>
          </div>
          <button
            onClick={onCancel}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-color)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <p style={{ fontSize: "0.92rem", color: "var(--default-color)", marginBottom: "16px", lineHeight: 1.5 }}>
            Under NHA & ABDM guidelines, verbal consent must be obtained from <strong>{patientName}</strong> before enabling ambient voice documentation:
          </p>

          <div style={{ background: "var(--light-background)", border: "1px solid var(--accent-border)", borderRadius: "var(--radius-md)", padding: "16px", marginBottom: "20px" }}>
            <ul style={{ paddingLeft: "18px", fontSize: "0.84rem", color: "var(--heading-color)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>The conversation is recorded solely to assist the doctor with OPD clinical notes.</li>
              <li>Audio data is discarded immediately after summarization (zero audio retention).</li>
              <li>The treating doctor reviews, edits, and digitally signs all generated notes before finalizing.</li>
            </ul>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "24px" }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "var(--accent-color)" }}
            />
            <span style={{ fontSize: "0.9rem", color: "var(--heading-color)", fontWeight: "600" }}>
              Verbal consent obtained from patient or legal guardian
            </span>
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button onClick={onCancel} className="btn btn-secondary" style={{ padding: "8px 16px" }}>
              Cancel
            </button>
            <button
              onClick={onConsentGranted}
              disabled={!agreed}
              className="btn btn-primary"
              style={{ padding: "8px 20px" }}
            >
              <Mic size={16} /> Proceed to Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
