import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, User, RefreshCw, PlusCircle, AlertCircle, ShieldCheck, Download, FileCode } from "lucide-react";
import { NoteForm } from "../components/NoteForm";
import { api } from "../api/client";

export function NoteEditor({ sessionId, patient, initialNote, onNewConsultation }) {
  const [noteData, setNoteData] = useState(initialNote || null);
  const [noteStatus, setNoteStatus] = useState("draft");
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNote();
  }, [sessionId]);

  const loadNote = async () => {
    try {
      const res = await api.notes.get(sessionId);
      setNoteData(res.edited_json || res.summary_json);
      setNoteStatus(res.status);
    } catch (err) {
      console.warn("Could not reload note from server, using initial note:", err);
    }
  };

  const handleSave = async (editedNote) => {
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.notes.update(sessionId, editedNote);
      setNoteData(res.edited_json);
      setMessage("Draft note saved successfully.");
      setTimeout(() => setMessage(null), 3500);
    } catch (err) {
      setError("Failed to save changes: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (editedNote) => {
    setIsApproving(true);
    setError(null);
    setMessage(null);
    try {
      // First persist any current edits
      await api.notes.update(sessionId, editedNote);
      // Then approve
      const res = await api.notes.approve(sessionId);
      setNoteStatus("approved");
      setMessage("Note approved and signed! ABDM FHIR bundle generated successfully.");
    } catch (err) {
      setError("Approval error: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsApproving(false);
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  const handleExportFhir = () => {
    if (!noteData) return;
    const blob = new Blob([JSON.stringify(noteData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FHIR_bundle_${patient.id}_${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner: Patient Info & Actions */}
      <div className="clinic-card clinic-card-header" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--heading-color)" }}>
              {patient.name}
            </h2>
            <span className={`badge ${noteStatus === "approved" ? "badge-approved" : "badge-draft"}`}>
              {noteStatus === "approved" ? "Signed & ABDM Approved" : "Draft (Pending Sign)"}
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--muted-color)", marginTop: "3px" }}>
            OPD ID: <strong>{patient.id}</strong> &bull; Age: {patient.age}y &bull; Gender: {patient.gender}
            {patient.abha_id && <> &bull; ABHA: <strong>{patient.abha_id}</strong></>}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={handleExportPdf} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
            <Download size={15} /> Print / PDF
          </button>
          <button onClick={handleExportFhir} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
            <FileCode size={15} /> FHIR JSON
          </button>
          <button onClick={onNewConsultation} className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
            <PlusCircle size={16} /> Next Patient
          </button>
        </div>
      </div>

      {message && (
        <div className="alert-box alert-success">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="alert-box alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Note Form Component */}
      <NoteForm
        initialNote={noteData}
        status={noteStatus}
        onSave={handleSave}
        onApprove={handleApprove}
        onExportPdf={handleExportPdf}
        onExportFhir={handleExportFhir}
        isSaving={isSaving}
        isApproving={isApproving}
      />
    </div>
  );
}
