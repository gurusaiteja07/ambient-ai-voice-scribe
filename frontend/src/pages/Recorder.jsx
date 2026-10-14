import React, { useState } from "react";
import { User, Activity, CheckSquare, ArrowLeft, AlertCircle } from "lucide-react";
import { RecordButton } from "../components/RecordButton";
import { TranscriptBox } from "../components/TranscriptBox";
import { ConsentModal } from "../components/ConsentModal";
import { useRecorder } from "../hooks/useRecorder";
import { api } from "../api/client";

export function Recorder({ session, patient, language, onConsultationComplete, onBack }) {
  const [chunks, setChunks] = useState([]);
  const [isProcessingStop, setIsProcessingStop] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Audio Chunk Handler: sends each 10s audio blob to backend
  const handleChunkReady = async (audioBlob, chunkNo) => {
    try {
      const res = await api.audio.uploadChunk(session.id, audioBlob, chunkNo);
      setChunks((prev) => [
        ...prev,
        {
          id: res.id || chunkNo,
          chunk_no: res.chunk_no,
          text: res.text,
          timestamp: res.timestamp || new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Failed to upload audio chunk:", err);
    }
  };

  const {
    isRecording,
    duration,
    audioLevel,
    error: recorderError,
    startRecording,
    stopRecording,
  } = useRecorder({
    onChunkReady: handleChunkReady,
    chunkIntervalMs: 10000, // 10-second chunks as per specification
  });

  const handleStartClicked = () => {
    if (!hasConsent) {
      setShowConsentModal(true);
    } else {
      startRecording();
    }
  };

  const handleConsentGranted = () => {
    setHasConsent(true);
    setShowConsentModal(false);
    startRecording();
  };

  const handleStopAndSummarize = async () => {
    if (isRecording) {
      stopRecording();
    }
    setIsProcessingStop(true);
    setErrorMsg(null);
    try {
      const res = await api.sessions.stop(session.id);
      onConsultationComplete({
        sessionId: session.id,
        note: res.note,
        noteId: res.note_id,
      });
    } catch (err) {
      console.error("Stop session failed:", err);
      setErrorMsg("Failed to generate clinical summary: " + (err.response?.data?.detail || err.message));
      setIsProcessingStop(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 16px" }}>
      {/* Patient Consultation Info Card */}
      <div className="glass-panel" style={{ padding: "18px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(13, 148, 136, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={22} color="#2dd4bf" />
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem" }}>{patient.name}</h3>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", gap: "12px" }}>
              <span>ID: <strong>{patient.id}</strong></span>
              <span>•</span>
              <span>{patient.age} yrs / {patient.gender}</span>
              {patient.abha_id && (
                <>
                  <span>•</span>
                  <span style={{ color: "#34d399" }}>ABHA: {patient.abha_id}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>
            SESSION: {session.id}
          </div>
          <span className="badge badge-active" style={{ marginTop: "4px" }}>
            <Activity size={12} /> Consultation In Progress
          </span>
        </div>
      </div>

      {(recorderError || errorMsg) && (
        <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fb7185", borderRadius: "8px", padding: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          <span>{recorderError || errorMsg}</span>
        </div>
      )}

      {/* Main Recording Centerpiece */}
      <div className="glass-panel" style={{ padding: "24px", marginBottom: "20px", textAlign: "center" }}>
        <RecordButton
          isRecording={isRecording}
          duration={duration}
          audioLevel={audioLevel}
          onStart={handleStartClicked}
          onStop={stopRecording}
          disabled={isProcessingStop}
        />
      </div>

      {/* Live Transcript Display */}
      <div style={{ marginBottom: "20px" }}>
        <TranscriptBox chunks={chunks} language={language} />
      </div>

      {/* Finish & Summarize Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          type="button"
          onClick={onBack}
          disabled={isRecording || isProcessingStop}
          className="btn btn-secondary"
        >
          <ArrowLeft size={16} /> Back to Patients
        </button>

        <button
          type="button"
          onClick={handleStopAndSummarize}
          disabled={isProcessingStop || (chunks.length === 0 && !isRecording)}
          className="btn btn-primary"
          style={{ padding: "12px 24px" }}
        >
          <CheckSquare size={18} />
          {isProcessingStop ? "Synthesizing Clinical Note..." : "Finish Consultation & Generate Note"}
        </button>
      </div>

      {/* Patient Consent Dialog */}
      <ConsentModal
        isOpen={showConsentModal}
        patientName={patient.name}
        onConsentGranted={handleConsentGranted}
        onCancel={() => setShowConsentModal(false)}
      />
    </div>
  );
}
