import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, User, RefreshCw, PlusCircle, AlertCircle } from "lucide-react";
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
      setMessage("Draft note successfully saved.");
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

  const handleExportPdf = async () => {
    try {
      const blob = await api.notes.downloadFile(sessionId, "pdf");
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `consultation_note_${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to download PDF: " + err.message);
    }
  };

  const handleExportFhir = async () => {
    try {
      const fhirJson = await api.notes.downloadFile(sessionId, "fhir");
      const jsonBlob = new Blob([JSON.stringify(fhirJson, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(jsonBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `abdm_fhir_bundle_${sessionId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to export FHIR JSON: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 16px" }}>
      {/* Patient banner */}
      <div className="glass-panel" style={{ padding: "16px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(13, 148, 136, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={20} color="#2dd4bf" />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem" }}>{patient?.name || "Consultation Patient"}</h3>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              ID: {patient?.id} • {patient?.age} yrs • {patient?.gender}
              {patient?.abha_id && ` • ABHA: ${patient.abha_id}`}
            </div>
          </div>
        </div>

        <button onClick={onNewConsultation} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
          <PlusCircle size={16} /> New Consultation
        </button>
      </div>

      {message && (
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fb7185", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

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
