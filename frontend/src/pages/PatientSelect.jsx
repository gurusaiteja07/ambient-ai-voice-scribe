import React, { useState, useEffect } from "react";
import { UserCheck, UserPlus, ArrowRight, Search, Languages, CreditCard, ShieldCheck, User } from "lucide-react";
import { api } from "../api/client";

export function PatientSelect({ onSessionStarted }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("PID-1001");
  const [language, setLanguage] = useState("English");
  const [searchQuery, setSearchQuery] = useState("");
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
    const selected = patients.find((p) => p.id === selectedPatientId);
    if (!selected) return;

    setLoading(true);
    setError(null);
    try {
      const session = await api.sessions.start(selected.id, language);
      onSessionStarted({
        session,
        patient: selected,
        language,
      });
    } catch (err) {
      setError("Failed to initialize consultation: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.abha_id && p.abha_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Queue Bar */}
      <div className="clinic-card clinic-card-header" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--heading-color)", display: "flex", alignItems: "center", gap: "10px" }}>
            OPD Patient Queue
            <span className="badge badge-approved" style={{ fontSize: "0.78rem" }}>
              {patients.length} Waiting
            </span>
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--muted-color)", marginTop: "2px" }}>
            Select an active patient or register a new one to begin ambient consultation recording
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Language Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--light-background)", padding: "6px 14px", borderRadius: "var(--radius-full)", border: "1px solid var(--accent-border)" }}>
            <Languages size={16} color="var(--accent-color)" />
            <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--heading-color)" }}>Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ border: "none", background: "transparent", fontWeight: "700", color: "var(--accent-color)", cursor: "pointer", outline: "none", fontSize: "0.86rem" }}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Hinglish (Mixed)</option>
            </select>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-secondary"
            style={{ fontSize: "0.86rem", padding: "8px 16px" }}
          >
            <UserPlus size={16} /> {showCreateForm ? "Close Form" : "Register Patient"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-danger">
          {error}
        </div>
      )}

      {/* New Patient Registration Card */}
      {showCreateForm && (
        <div className="clinic-card" style={{ padding: "24px", border: "1.5px solid var(--accent-border)", backgroundColor: "var(--light-background)" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", color: "var(--heading-color)", display: "flex", alignItems: "center", gap: "8px" }}>
            <UserPlus size={18} color="var(--accent-color)" /> Fast OPD Patient Registration
          </h3>
          <form onSubmit={handleCreatePatient} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "end" }}>
            <div>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Ramesh Kumar"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Age *</label>
              <input
                type="number"
                required
                min="0"
                max="125"
                className="input-field"
                placeholder="Years"
                value={newPatient.age}
                onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Gender *</label>
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
            <div>
              <label className="form-label">ABHA ID (Ayushman Bharat)</label>
              <input
                type="text"
                className="input-field"
                placeholder="XX-XXXX-XXXX-XXXX"
                value={newPatient.abha_id}
                onChange={(e) => setNewPatient({ ...newPatient, abha_id: e.target.value })}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "100%", padding: "10px" }}
              >
                Save & Add to Queue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          className="input-field"
          style={{ paddingLeft: "42px", height: "48px", fontSize: "0.95rem" }}
          placeholder="Search patient by name, OPD number or ABHA ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search size={18} color="var(--subtle-color)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
      </div>

      {/* Patient Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
        {filteredPatients.map((patient) => {
          const isSelected = patient.id === selectedPatientId;
          return (
            <div
              key={patient.id}
              onClick={() => setSelectedPatientId(patient.id)}
              className={`patient-item-card ${isSelected ? "selected" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: isSelected ? "var(--accent-color)" : "var(--accent-subtle)",
                  color: isSelected ? "#ffffff" : "var(--accent-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "1.1rem"
                }}>
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--heading-color)" }}>
                    {patient.name}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted-color)", marginTop: "2px" }}>
                    {patient.age} yrs &bull; {patient.gender} &bull; <strong style={{ color: "var(--heading-color)" }}>{patient.id}</strong>
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    {patient.abha_id ? (
                      <span className="badge badge-abdm" style={{ fontSize: "0.72rem" }}>
                        <ShieldCheck size={11} /> {patient.abha_id}
                      </span>
                    ) : (
                      <span className="badge badge-draft" style={{ fontSize: "0.72rem" }}>
                        No ABHA Linked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <input
                  type="radio"
                  name="selectedPatient"
                  checked={isSelected}
                  onChange={() => setSelectedPatientId(patient.id)}
                  style={{ width: "20px", height: "20px", accentColor: "var(--accent-color)", cursor: "pointer" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="clinic-card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "8px" }}>
        <div>
          <span style={{ fontSize: "0.92rem", color: "var(--default-color)" }}>
            Selected Patient: <strong style={{ color: "var(--accent-color)" }}>
              {patients.find((p) => p.id === selectedPatientId)?.name || "None"}
            </strong>
          </span>
          <span style={{ marginLeft: "12px", fontSize: "0.82rem", color: "var(--muted-color)" }}>
            Language: <strong>{language}</strong>
          </span>
        </div>

        <button
          onClick={handleStartSession}
          disabled={!selectedPatientId || loading}
          className="btn btn-primary"
          style={{ padding: "12px 28px", fontSize: "0.95rem" }}
        >
          {loading ? "Starting Consultation..." : "Start Consultation"} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
