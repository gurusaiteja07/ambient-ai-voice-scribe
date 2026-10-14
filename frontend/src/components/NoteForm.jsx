import React, { useState, useEffect } from "react";
import { CheckCircle2, Lock, Download, FileText, Plus, Trash2, Save, FileCode } from "lucide-react";

export function NoteForm({
  initialNote,
  status = "draft",
  onSave,
  onApprove,
  onExportPdf,
  onExportFhir,
  isSaving,
  isApproving
}) {
  const [note, setNote] = useState({
    chief_complaint: "",
    history_of_present_illness: "",
    symptoms: [],
    examination: "",
    diagnosis: "",
    medications: [],
    investigations: [],
    advice: "",
    follow_up: "",
  });

  const [newSymptom, setNewSymptom] = useState("");
  const isApproved = status === "approved";

  useEffect(() => {
    if (initialNote) {
      setNote({
        chief_complaint: initialNote.chief_complaint || "",
        history_of_present_illness: initialNote.history_of_present_illness || "",
        symptoms: initialNote.symptoms || [],
        examination: initialNote.examination || "",
        diagnosis: initialNote.diagnosis || "",
        medications: initialNote.medications || [],
        investigations: initialNote.investigations || [],
        advice: initialNote.advice || "",
        follow_up: initialNote.follow_up || "",
      });
    }
  }, [initialNote]);

  const handleFieldChange = (field, value) => {
    if (isApproved) return;
    setNote((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSymptom = (e) => {
    e.preventDefault();
    if (!newSymptom.trim() || isApproved) return;
    setNote((prev) => ({
      ...prev,
      symptoms: [...prev.symptoms, newSymptom.trim()],
    }));
    setNewSymptom("");
  };

  const handleRemoveSymptom = (idx) => {
    if (isApproved) return;
    setNote((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== idx),
    }));
  };

  const handleAddMedication = () => {
    if (isApproved) return;
    setNote((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: "", dose: "", frequency: "Once daily", duration: "3 days" },
      ],
    }));
  };

  const handleMedChange = (index, key, val) => {
    if (isApproved) return;
    setNote((prev) => {
      const updated = [...prev.medications];
      updated[index] = { ...updated[index], [key]: val };
      return { ...prev, medications: updated };
    });
  };

  const handleRemoveMedication = (index) => {
    if (isApproved) return;
    setNote((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="glass-panel" style={{ padding: "28px" }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "10px" }}>
            Structured Clinical Note (SOAP)
            {isApproved ? (
              <span className="badge badge-approved">
                <Lock size={12} /> Approved & Signed
              </span>
            ) : (
              <span className="badge badge-draft">
                Draft (Doctor Editable)
              </span>
            )}
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
            {isApproved
              ? "This note has been reviewed, approved, and locked for ABDM compliance."
              : "Review AI-extracted clinical items below. Edit any field before final approval."}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {!isApproved && (
            <>
              <button
                type="button"
                onClick={() => onSave(note)}
                disabled={isSaving}
                className="btn btn-secondary"
              >
                <Save size={16} /> {isSaving ? "Saving..." : "Save Draft"}
              </button>
              <button
                type="button"
                onClick={() => onApprove(note)}
                disabled={isApproving}
                className="btn btn-primary"
              >
                <CheckCircle2 size={16} /> {isApproving ? "Approving..." : "Approve & Sign"}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onExportPdf}
            className="btn btn-secondary"
          >
            <Download size={16} /> PDF Note
          </button>
          <button
            type="button"
            onClick={onExportFhir}
            className="btn btn-secondary"
          >
            <FileCode size={16} /> ABDM FHIR JSON
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "18px" }}>
        {/* 1. Chief Complaint */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>
            1. Chief Complaint
          </label>
          <input
            type="text"
            className="input-field"
            value={note.chief_complaint}
            disabled={isApproved}
            onChange={(e) => handleFieldChange("chief_complaint", e.target.value)}
            placeholder="e.g. Acute high grade fever and productive cough for 3 days"
          />
        </div>

        {/* 2. History of Present Illness */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>
            2. History of Present Illness (HPI)
          </label>
          <textarea
            className="input-field"
            rows={3}
            value={note.history_of_present_illness}
            disabled={isApproved}
            onChange={(e) => handleFieldChange("history_of_present_illness", e.target.value)}
            placeholder="Chronological narrative of symptom progression..."
          />
        </div>

        {/* 3. Symptoms Tags */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>
            3. Reported Symptoms
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
            {note.symptoms.map((sym, idx) => (
              <span
                key={idx}
                style={{
                  background: "rgba(13, 148, 136, 0.2)",
                  border: "1px solid rgba(13, 148, 136, 0.4)",
                  color: "#2dd4bf",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {sym}
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSymptom(idx)}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
                  >
                    &times;
                  </button>
                )}
              </span>
            ))}
          </div>
          {!isApproved && (
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                className="input-field"
                style={{ maxWidth: "240px" }}
                placeholder="Add symptom..."
                value={newSymptom}
                onChange={(e) => setNewSymptom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSymptom(e)}
              />
              <button type="button" onClick={handleAddSymptom} className="btn btn-secondary" style={{ padding: "8px 12px" }}>
                <Plus size={16} /> Add
              </button>
            </div>
          )}
        </div>

        {/* 4. Examination & Vitals */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>
            4. Clinical Examination & Vitals
          </label>
          <input
            type="text"
            className="input-field"
            value={note.examination}
            disabled={isApproved}
            onChange={(e) => handleFieldChange("examination", e.target.value)}
            placeholder="e.g. Temp: 101F, Pulse: 88 bpm, BP: 120/80 mmHg, Chest: Bilateral rhonchi"
          />
        </div>

        {/* 5. Diagnosis */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>
            5. Provisional / Confirmed Diagnosis
          </label>
          <input
            type="text"
            className="input-field"
            style={{ fontWeight: "600", color: "#38bdf8" }}
            value={note.diagnosis}
            disabled={isApproved}
            onChange={(e) => handleFieldChange("diagnosis", e.target.value)}
            placeholder="e.g. Acute Viral Bronchitis / URTI"
          />
        </div>

        {/* 6. Medications Table (Rx) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#cbd5e1" }}>
              6. Medications Prescribed (Rx)
            </label>
            {!isApproved && (
              <button type="button" onClick={handleAddMedication} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>
                <Plus size={14} /> Add Medicine
              </button>
            )}
          </div>

          <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "8px 12px" }}>Medicine Name</th>
                  <th style={{ padding: "8px 12px" }}>Dosage</th>
                  <th style={{ padding: "8px 12px" }}>Frequency</th>
                  <th style={{ padding: "8px 12px" }}>Duration</th>
                  {!isApproved && <th style={{ padding: "8px 12px", width: "40px" }}></th>}
                </tr>
              </thead>
              <tbody>
                {note.medications.length === 0 ? (
                  <tr>
                    <td colSpan={isApproved ? 4 : 5} style={{ padding: "12px", textAlign: "center", color: "var(--text-subtle)" }}>
                      No medications listed yet.
                    </td>
                  </tr>
                ) : (
                  note.medications.map((med, idx) => (
                    <tr key={idx} style={{ borderTop: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "6px 12px" }}>
                        <input
                          type="text"
                          className="input-field"
                          style={{ padding: "6px 8px" }}
                          value={med.name}
                          disabled={isApproved}
                          onChange={(e) => handleMedChange(idx, "name", e.target.value)}
                          placeholder="e.g. Tab Paracetamol"
                        />
                      </td>
                      <td style={{ padding: "6px 12px" }}>
                        <input
                          type="text"
                          className="input-field"
                          style={{ padding: "6px 8px" }}
                          value={med.dose}
                          disabled={isApproved}
                          onChange={(e) => handleMedChange(idx, "dose", e.target.value)}
                          placeholder="e.g. 650 mg"
                        />
                      </td>
                      <td style={{ padding: "6px 12px" }}>
                        <input
                          type="text"
                          className="input-field"
                          style={{ padding: "6px 8px" }}
                          value={med.frequency}
                          disabled={isApproved}
                          onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                          placeholder="e.g. Thrice daily"
                        />
                      </td>
                      <td style={{ padding: "6px 12px" }}>
                        <input
                          type="text"
                          className="input-field"
                          style={{ padding: "6px 8px" }}
                          value={med.duration}
                          disabled={isApproved}
                          onChange={(e) => handleMedChange(idx, "duration", e.target.value)}
                          placeholder="e.g. 5 days"
                        />
                      </td>
                      {!isApproved && (
                        <td style={{ padding: "6px 12px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(idx)}
                            style={{ background: "none", border: "none", color: "#f43f5e", cursor: "pointer" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 7. Advice & Follow Up */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>
              7. Non-pharmacological Advice
            </label>
            <textarea
              className="input-field"
              rows={2}
              value={note.advice}
              disabled={isApproved}
              onChange={(e) => handleFieldChange("advice", e.target.value)}
              placeholder="e.g. Steam inhalation twice daily, warm water gargles, avoid cold drinks"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>
              8. Follow-up Timeline
            </label>
            <textarea
              className="input-field"
              rows={2}
              value={note.follow_up}
              disabled={isApproved}
              onChange={(e) => handleFieldChange("follow_up", e.target.value)}
              placeholder="e.g. Review after 3 days if fever does not subside; SOS if breathless"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
