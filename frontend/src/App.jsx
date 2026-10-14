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
      setDoctor(storedDoctor || { name: "Doctor", hospital: "AIIMS" });
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
    <div style={{ minHeight: "100vh", padding: "16px", maxWidth: "1100px", margin: "0 auto" }}>
      <Header doctor={doctor} onLogout={handleLogout} />

      <main style={{ paddingBottom: "40px" }}>
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
    </div>
  );
}

export default App;
