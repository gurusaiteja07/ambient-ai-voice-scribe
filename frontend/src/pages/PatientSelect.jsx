import React, { useState, useEffect } from "react";
import { UserCheck, UserPlus, ArrowRight, Search, Languages, CreditCard } from "lucide-react";
import { api } from "../api/client";

export function PatientSelect({ onSessionStarted }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("PID-1001");
  const [language, setLanguage] = useState("English");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "Male",
    abha_id: "",
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await api.patients.list();
      setPatients(data);
      if (data.length > 0 && !selectedPatientId) {
        setSelectedPatientId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load patients:", err);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.age) return;
    setLoading(true);
    setError(null);
    try {
      const created = await api.patients.create({
        name: newPatient.name,
        age: parseInt(newPatient.age, 10),
        gender: newPatient.gender,
        abha_id: newPatient.abha_id || undefined,
      });
      setPatients((prev) => [created, ...prev]);
      setSelectedPatientId(created.id);
      setShowCreateForm(false);
      setNewPatient({ name: "", age: "", gender: "Male", abha_id: "" });
    } catch (err) {
      setError("Failed to register patient: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!selectedPatientId) {
      setError("Please select or enter a Patient ID.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = await api.sessions.create(selectedPatientId, language);
      const patient = patients.find((p) => p.id === selectedPatientId) || {
        id: selectedPatientId,
        name: "Patient " + selectedPatientId,
      };
      onSessionStarted({ session, patient, language });
    } catch (err) {
      console.error(err);
      setError("Could not start consultation session: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 16px" }}>
      <div className="glass-panel" style={{ padding: "32px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "4px" }}>Start Outpatient Consultation</h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
            Select an existing patient record or register a new walk-in patient.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "#fb7185",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "0.85rem",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* Toggle Existing vs New Patient */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className={`btn ${!showCreateForm ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1, padding: "10px" }}
          >
            <UserCheck size={16} /> Existing Patient
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className={`btn ${showCreateForm ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1, padding: "10px" }}
          >
            <UserPlus size={16} /> New OPD Registration
          </button>
        </div>

        {showCreateForm ? (
          <form onSubmit={handleCreatePatient} style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Ramesh Kumar"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                  Age *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="125"
                  className="input-field"
                  placeholder="e.g. 45"
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                  Gender *
                </label>
                <select
                  className="input-field"
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                ABHA ID / Health ID (Optional)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: "36px" }}
                  placeholder="14-digit ABHA (e.g. 14-5521-8890-1234)"
                  value={newPatient.abha_id}
                  onChange={(e) => setNewPatient({ ...newPatient, abha_id: e.target.value })}
                />
                <CreditCard size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: "6px" }}>
              Save & Select Patient
            </button>
          </form>
        ) : (
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px" }}>
              Select Patient Record
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
              {patients.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-subtle)", border: "1px dashed var(--border-color)", borderRadius: "8px" }}>
                  No patients found. Click "New OPD Registration" to add one.
                </div>
              ) : (
                patients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className="glass-panel glass-panel-interactive"
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      border: selectedPatientId === p.id ? "1.5px solid #0d9488" : "1px solid var(--border-color)",
                      background: selectedPatientId === p.id ? "rgba(13, 148, 136, 0.15)" : "rgba(255, 255, 255, 0.02)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>{p.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        ID: {p.id} ? {p.age} yrs ? {p.gender}
                      </div>
                    </div>
                    {p.abha_id && (
                      <span className="badge badge-abdm" style={{ fontSize: "0.7rem" }}>
                        ABHA: {p.abha_id}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Consultation Spoken Language */}
        <div style={{ marginBottom: "28px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Languages size={16} color="#2dd4bf" /> Consultation Spoken Language
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px" }}>
            {["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi"].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`btn ${language === lang ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "8px", fontSize: "0.82rem" }}
              >
                {lang}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Multilingual Whisper & LLM will automatically transcribe and translate output to English clinical note.
          </p>
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={handleStartSession}
          disabled={loading || !selectedPatientId}
          className="btn btn-primary"
          style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
        >
          {loading ? "Initializing Session..." : "Start Ambient Consultation"} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
