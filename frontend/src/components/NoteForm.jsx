import React, { useState, useEffect } from "react";
import { CheckCircle2, Lock, Download, FileText, Plus, Trash2, Save, FileCode, Pill, Activity, Stethoscope } from "lucide-react";

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
  const [newInvestigation, setNewInvestigation] = useState("");
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

  const handleAddInvestigation = (e) => {
    e.preventDefault();
    if (!newInvestigation.trim() || isApproved) return;
    setNote((prev) => ({
      ...prev,
      investigations: [...prev.investigations, newInvestigation.trim()],
    }));
    setNewInvestigation("");
  };

  const handleRemoveInvestigation = (idx) => {
    if (isApproved) return;
    setNote((prev) => ({
      ...prev,
      investigations: prev.investigations.filter((_, i) => i !== idx),
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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* SOAP Section 1: Subjective */}
      <div className="clinic-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--heading-color)", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
          <Activity size={18} color="var(--accent-color)" /> Subjective Findings & Clinical History
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="form-label">Chief Complaint</label>
            <input
              type="text"
              disabled={isApproved}
              className="input-field"
              value={note.chief_complaint}
              onChange={(e) => handleFieldChange("chief_complaint", e.target.value)}
              placeholder="e.g. High fever with chills and dry cough for 3 days"
            />
          </div>

          <div>
            <label className="form-label">History of Present Illness (HPI)</label>
            <textarea
              disabled={isApproved}
              className="textarea-field"
              value={note.history_of_present_illness}
              onChange={(e) => handleFieldChange("history_of_present_illness", e.target.value)}
              placeholder="Detailed clinical chronology..."
            />
          </div>

          {/* Symptoms Badges */}
          <div>
            <label className="form-label">Symptoms & Clinical Manifestations</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
              {note.symptoms.map((symptom, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--light-background)",
                    color: "var(--accent-color)",
                    border: "1px solid var(--accent-border)",
                    padding: "5px 12px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.84rem",
                    fontWeight: "600",
                  }}
                >
                  {symptom}
                  {!isApproved && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSymptom(idx)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger-color)", display: "flex" }}
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))}
            </div>

            {!isApproved && (
              <form onSubmit={handleAddSymptom} style={{ display: "flex", gap: "8px", maxWidth: "420px" }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Add symptom (e.g. Headache)..."
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  style={{ height: "38px" }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: "6px 14px", height: "38px", fontSize: "0.84rem" }}>
                  <Plus size={14} /> Add
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* SOAP Section 2: Objective & Diagnosis */}
      <div className="clinic-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--heading-color)", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
          <Stethoscope size={18} color="var(--accent-color)" /> Physical Examination & Assessment
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          <div>
            <label className="form-label">Physical Examination / Vitals</label>
            <textarea
              disabled={isApproved}
              className="textarea-field"
              value={note.examination}
              onChange={(e) => handleFieldChange("examination", e.target.value)}
              placeholder="BP: 120/80 mmHg, Pulse: 78 bpm, Temp: 98.6 F, Chest: Clear bilateral"
            />
          </div>

          <div>
            <label className="form-label">Provisional Diagnosis (ICD-10 / SNOMED-CT)</label>
            <textarea
              disabled={isApproved}
              className="textarea-field"
              value={note.diagnosis}
              onChange={(e) => handleFieldChange("diagnosis", e.target.value)}
              placeholder="e.g. Acute Upper Respiratory Tract Infection (ICD-10: J06.9)"
            />
          </div>
        </div>
      </div>

      {/* SOAP Section 3: Plan & Prescription */}
      <div className="clinic-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "18px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--heading-color)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Pill size={18} color="var(--accent-color)" /> Rx &mdash; Medications & Prescription
          </h3>
          {!isApproved && (
            <button onClick={handleAddMedication} className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
              <Plus size={14} /> Add Medicine
            </button>
          )}
        </div>

        {note.medications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--muted-color)", fontSize: "0.88rem" }}>
            No medications prescribed. Click "Add Medicine" to create a prescription item.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="clinic-table">
              <thead>
                <tr>
                  <th style={{ width: "35%" }}>Medicine / Drug Name</th>
                  <th style={{ width: "20%" }}>Dosage</th>
                  <th style={{ width: "25%" }}>Frequency</th>
                  <th style={{ width: "15%" }}>Duration</th>
                  {!isApproved && <th style={{ width: "5%" }}></th>}
                </tr>
              </thead>
              <tbody>
                {note.medications.map((med, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        disabled={isApproved}
                        className="input-field"
                        style={{ height: "36px", fontSize: "0.88rem" }}
                        value={med.name}
                        onChange={(e) => handleMedChange(idx, "name", e.target.value)}
                        placeholder="e.g. Paracetamol 650mg"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        disabled={isApproved}
                        className="input-field"
                        style={{ height: "36px", fontSize: "0.88rem" }}
                        value={med.dose}
                        onChange={(e) => handleMedChange(idx, "dose", e.target.value)}
                        placeholder="1 tablet"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        disabled={isApproved}
                        className="input-field"
                        style={{ height: "36px", fontSize: "0.88rem" }}
                        value={med.frequency}
                        onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                        placeholder="Thrice daily after food"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        disabled={isApproved}
                        className="input-field"
                        style={{ height: "36px", fontSize: "0.88rem" }}
                        value={med.duration}
                        onChange={(e) => handleMedChange(idx, "duration", e.target.value)}
                        placeholder="5 days"
                      />
                    </td>
                    {!isApproved && (
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          style={{ background: "none", border: "none", color: "var(--danger-color)", cursor: "pointer" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SOAP Section 4: Investigations & Follow-up */}
      <div className="clinic-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--heading-color)", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
          <FileText size={18} color="var(--accent-color)" /> Investigations, Advice & Follow-up
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          <div>
            <label className="form-label">Diagnostic Tests & Investigations</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
              {note.investigations.map((inv, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--light-background)",
                    color: "var(--heading-color)",
                    border: "1px solid var(--border-color)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.82rem",
                  }}
                >
                  {inv}
                  {!isApproved && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInvestigation(idx)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger-color)" }}
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))}
            </div>

            {!isApproved && (
              <form onSubmit={handleAddInvestigation} style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Complete Blood Count (CBC)..."
                  value={newInvestigation}
                  onChange={(e) => setNewInvestigation(e.target.value)}
                  style={{ height: "38px" }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: "6px 14px", height: "38px", fontSize: "0.84rem" }}>
                  <Plus size={14} /> Add
                </button>
              </form>
            )}
          </div>

          <div>
            <label className="form-label">Doctor Advice & Precautions</label>
            <textarea
              disabled={isApproved}
              className="textarea-field"
              value={note.advice}
              onChange={(e) => handleFieldChange("advice", e.target.value)}
              placeholder="e.g. Plenty of oral fluids, rest, avoid cold drinks."
            />
          </div>

          <div>
            <label className="form-label">Follow-up Schedule</label>
            <input
              type="text"
              disabled={isApproved}
              className="input-field"
              value={note.follow_up}
              onChange={(e) => handleFieldChange("follow_up", e.target.value)}
              placeholder="e.g. Review after 5 days or SOS if fever spikes"
            />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="clinic-card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          {isApproved ? (
            <span style={{ color: "var(--success-color)", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.92rem" }}>
              <CheckCircle2 size={18} /> Digitally Signed and Linked with ABHA ID
            </span>
          ) : (
            <span style={{ color: "var(--muted-color)", fontSize: "0.88rem" }}>
              Please review all extracted clinical findings before digitally signing.
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {!isApproved && (
            <>
              <button
                type="button"
                onClick={() => onSave(note)}
                disabled={isSaving || isApproving}
                className="btn btn-secondary"
                style={{ padding: "10px 22px" }}
              >
                <Save size={16} /> {isSaving ? "Saving..." : "Save Draft"}
              </button>
              <button
                type="button"
                onClick={() => onApprove(note)}
                disabled={isSaving || isApproving}
                className="btn btn-success"
                style={{ padding: "10px 24px" }}
              >
                <CheckCircle2 size={16} /> {isApproving ? "Signing & Bundling..." : "Approve & Sign Note"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
