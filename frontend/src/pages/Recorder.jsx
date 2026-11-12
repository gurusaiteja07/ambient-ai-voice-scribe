import React, { useState } from "react";
import { User, Activity, CheckSquare, ArrowLeft, AlertCircle, ShieldCheck, Languages, Stethoscope, Mic, Send, Sparkles } from "lucide-react";
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
  const [manualSpeech, setManualSpeech] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  // Audio & Speech Chunk Handler: sends audio blob + real-time English transcript to backend
  const handleChunkReady = async (audioBlob, chunkNo, spokenText) => {
    try {
      const res = await api.audio.uploadChunk(session.id, audioBlob, chunkNo, spokenText);
      setChunks((prev) => [
        ...prev,
        {
          id: res.id || chunkNo,
          chunk_no: res.chunk_no,
          text: res.text || spokenText,
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
    liveTranscript,
    error: recorderError,
    startRecording,
    stopRecording,
  } = useRecorder({
    onChunkReady: handleChunkReady,
    chunkIntervalMs: 8000,
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

  const handleAddManualSpeech = async (e) => {
    e.preventDefault();
    if (!manualSpeech.trim()) return;
    try {
      const chunkNo = chunks.length + 1;
      const res = await api.audio.sendTranscriptChunk(session.id, chunkNo, manualSpeech.trim());
      setChunks((prev) => [
        ...prev,
        {
          id: chunkNo,
          chunk_no: chunkNo,
          text: res.text || manualSpeech.trim(),
          timestamp: res.timestamp || new Date().toISOString(),
        },
      ]);
      setManualSpeech("");
    } catch (err) {
      console.error("Error adding manual speech:", err);
    }
  };

  const handleStopAndSummarize = async () => {
    setIsProcessingStop(true);
    setErrorMsg(null);
    try {
      if (isRecording) {
        await stopRecording();
      }
      // Trigger AI summarization on the backend
      const res = await api.sessions.stop(session.id);
      const clinicalNote = res.note?.summary_json || res.note?.edited_json || res.note;
      onConsultationComplete({
        sessionId: session.id,
        note: clinicalNote,
      });
    } catch (err) {
      console.error("Error finalizing consultation:", err);
      setErrorMsg("Failed to generate clinical note: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsProcessingStop(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner: Patient Info Bar */}
      <div className="clinic-card clinic-card-header" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={onBack} disabled={isRecording} className="btn btn-secondary" style={{ padding: "8px 12px", fontSize: "0.82rem" }}>
            <ArrowLeft size={16} /> Patient Queue
          </button>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--heading-color)", display: "flex", alignItems: "center", gap: "8px" }}>
              {patient.name}
              <span style={{ fontSize: "0.82rem", fontWeight: "500", color: "var(--muted-color)" }}>
                ({patient.age}y, {patient.gender})
              </span>
            </h2>
            <div style={{ fontSize: "0.8rem", color: "var(--muted-color)", marginTop: "2px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <span>OPD ID: <strong>{patient.id}</strong></span>
              {patient.abha_id && <span>ABHA: <strong>{patient.abha_id}</strong></span>}
              {patient.phone && <span>Phone: <strong>{patient.phone}</strong></span>}
              {patient.blood_group && <span>Blood Group: <strong>{patient.blood_group}</strong></span>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="badge badge-abdm">
            <Languages size={12} /> {language}
          </span>
          <span className={`badge ${isRecording ? "badge-recording" : "badge-approved"}`}>
            {isRecording ? "Listening Live (English)" : "Ready"}
          </span>
        </div>
      </div>

      {(errorMsg || recorderError) && (
        <div className="alert-box alert-danger">
          <AlertCircle size={18} />
          <span>{errorMsg || recorderError}</span>
        </div>
      )}

      {/* Main Grid: Recording Controller & Live Transcript */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
        {/* Left: Recorder Card */}
        <div className="clinic-card" style={{ padding: "28px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "20px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--light-background)", padding: "6px 14px", borderRadius: "var(--radius-full)", border: "1px solid var(--accent-border)", fontSize: "0.82rem", fontWeight: "600", color: "var(--accent-color)", marginBottom: "14px" }}>
              <Stethoscope size={14} /> Ambient Doctor-Patient Consultation
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--heading-color)", marginBottom: "6px" }}>
              {isRecording ? "Consultation in Progress" : "Start Voice Consultation"}
            </h3>
            <p style={{ fontSize: "0.86rem", color: "var(--muted-color)" }}>
              {isRecording
                ? "Microphone is listening in English. Spoken words are captured live and chunked."
                : "Obtain verbal consent and press Start to record the patient interaction."}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <RecordButton
              isRecording={isRecording}
              duration={duration}
              audioLevel={audioLevel}
              onStart={handleStartClicked}
              onStop={stopRecording}
              disabled={isProcessingStop}
            />

            {liveTranscript && (
              <div style={{ background: "#f8fafc", border: "1px dashed var(--accent-color)", borderRadius: "8px", padding: "10px 14px", width: "100%", fontSize: "0.85rem", color: "#334155" }}>
                <span style={{ fontWeight: "600", color: "var(--accent-color)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <Mic size={14} /> Live Spoken English:
                </span>
                {liveTranscript}
              </div>
            )}
          </div>

          {/* Quick Doctor Dictation / Clinical Notes Input */}
          <form onSubmit={handleAddManualSpeech} style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <input
              type="text"
              value={manualSpeech}
              onChange={(e) => setManualSpeech(e.target.value)}
              placeholder="Dictate or type clinical phrase (e.g. Cough for 3 days, temp 101F)..."
              className="form-input"
              style={{ flex: 1, fontSize: "0.85rem", padding: "10px 12px" }}
            />
            <button type="submit" className="btn btn-secondary" style={{ padding: "10px 14px", fontSize: "0.85rem" }}>
              <Send size={15} /> Add
            </button>
          </form>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "18px" }}>
            <button
              onClick={handleStopAndSummarize}
              disabled={isProcessingStop || (chunks.length === 0 && !isRecording)}
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", fontSize: "0.95rem" }}
            >
              <CheckSquare size={18} />
              {isProcessingStop ? "Generating Clinical SOAP Note..." : "Complete Consultation & Generate Note"}
            </button>
          </div>
        </div>

        {/* Right: Live Transcript Card */}
        <div style={{ height: "100%" }}>
          <TranscriptBox chunks={chunks} language={language} />
        </div>
      </div>

      {showConsentModal && (
        <ConsentModal
          patientName={patient.name}
          onConsentGranted={handleConsentGranted}
          onCancel={() => setShowConsentModal(false)}
        />
      )}
    </div>
  );
}
