import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Login } from "./pages/Login";
import { PatientSelect } from "./pages/PatientSelect";
import { Recorder } from "./pages/Recorder";
import { NoteEditor } from "./pages/NoteEditor";
import { api } from "./api/client";

export function App() {
  const [doctor, setDoctor] = useState(null);
  const [currentView, setCurrentView] = useState("login"); // login, patients, recorder, note-editor
  const [activeSession, setActiveSession] = useState(null);
  const [activePatient, setActivePatient] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState("English");
  const [currentNote, setCurrentNote] = useState(null);

  useEffect(() => {
    if (api.auth.isAuthenticated()) {
      const storedDoctor = api.auth.getCurrentDoctor();
      setDoctor(storedDoctor || { name: "Doctor", hospital: "AIIMS New Delhi" });
      setCurrentView("patients");
    } else {
      setCurrentView("login");
    }
  }, []);

  const handleLoginSuccess = (doc) => {
    setDoctor(doc);
    setCurrentView("patients");
  };

  const handleLogout = () => {
    api.auth.logout();
    setDoctor(null);
    setActiveSession(null);
    setActivePatient(null);
    setCurrentNote(null);
    setCurrentView("login");
  };

  const handleSessionStarted = ({ session, patient, language }) => {
    setActiveSession(session);
    setActivePatient(patient);
    setActiveLanguage(language);
    setCurrentView("recorder");
  };

  const handleConsultationComplete = ({ sessionId, note }) => {
    setCurrentNote(note);
    setCurrentView("note-editor");
  };

  const handleNewConsultation = () => {
    setActiveSession(null);
    setActivePatient(null);
    setCurrentNote(null);
    setCurrentView("patients");
  };

  if (currentView === "login") {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--background-color)" }}>
      <Header doctor={doctor} currentView={currentView} onLogout={handleLogout} />

      <main style={{ flex: 1, padding: "28px 20px 48px 20px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
        {currentView === "patients" && (
          <PatientSelect onSessionStarted={handleSessionStarted} />
        )}

        {currentView === "recorder" && activeSession && (
          <Recorder
            session={activeSession}
            patient={activePatient}
            language={activeLanguage}
            onConsultationComplete={handleConsultationComplete}
            onBack={() => setCurrentView("patients")}
          />
        )}

        {currentView === "note-editor" && activeSession && (
          <NoteEditor
            sessionId={activeSession.id}
            patient={activePatient}
            initialNote={currentNote}
            onNewConsultation={handleNewConsultation}
          />
        )}
      </main>

      <footer style={{ background: "#ffffff", borderTop: "1px solid var(--border-color)", padding: "16px 20px", textAlign: "center", fontSize: "0.82rem", color: "var(--muted-color)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <strong>Clinic AI Voice Scribe</strong> &mdash; ABDM & NHA Compliant Public Healthcare Consultation System
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <span>Facility: AIIMS New Delhi</span>
            <span>FHIR R4 Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
