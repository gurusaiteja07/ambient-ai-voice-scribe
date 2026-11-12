import React, { useState, useEffect } from "react";
import { UserPlus, ArrowRight, Search, Languages, ShieldCheck, User, HeartPulse, History, Phone, Droplet, FileText } from "lucide-react";
import { api } from "../api/client";

export function PatientSelect({ onSessionStarted, onOpenPastNote }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [language, setLanguage] = useState("English");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "record"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "Male",
    abha_id: "",
    phone: "",
    blood_group: "",
    bp: "",
    pulse: "",
    temp: "",
    spo2: "",
    medical_history: "",
    allergies: "",
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

  const handleRecordPatient = async (e, autoStart = false) => {
    if (e) e.preventDefault();
    if (!newPatient.name.trim() || !newPatient.age) {
      setError("Please provide patient name and age.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const vitalsObj = {};
      if (newPatient.bp) vitalsObj.bp = newPatient.bp;
      if (newPatient.pulse) vitalsObj.pulse = newPatient.pulse;
      if (newPatient.temp) vitalsObj.temp = newPatient.temp;
      if (newPatient.spo2) vitalsObj.spo2 = newPatient.spo2;

      const created = await api.patients.create({
        name: newPatient.name.trim(),
        age: parseInt(newPatient.age, 10),
        gender: newPatient.gender,
        abha_id: newPatient.abha_id.trim() || undefined,
        phone: newPatient.phone.trim() || undefined,
        blood_group: newPatient.blood_group || undefined,
        vitals: Object.keys(vitalsObj).length > 0 ? vitalsObj : undefined,
        medical_history: newPatient.medical_history.trim() || undefined,
        allergies: newPatient.allergies.trim() || undefined,
      });

      setPatients((prev) => [created, ...prev]);
      setSelectedPatientId(created.id);
      setActiveTab("queue");

      // Reset form
      setNewPatient({
        name: "",
        age: "",
        gender: "Male",
        abha_id: "",
        phone: "",
        blood_group: "",
        bp: "",
        pulse: "",
        temp: "",
        spo2: "",
        medical_history: "",
        allergies: "",
      });

      if (autoStart) {
        const session = await api.sessions.start(created.id, language);
        onSessionStarted({ session, patient: created, language });
      }
    } catch (err) {
      setError("Failed to record patient: " + (err.response?.data?.detail || err.message));
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

  const handleViewHistory = async (patientId) => {
    try {
      const res = await api.patients.getHistory(patientId);
      setPatientHistory(res);
    } catch (err) {
      console.warn("Could not load history:", err);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.abha_id && p.abha_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.phone && p.phone.includes(searchQuery)) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Header Card */}
      <div className="clinic-card clinic-card-header" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--heading-color)", display: "flex", alignItems: "center", gap: "10px" }}>
            Patient Management & Consultation
            <span className="badge badge-approved" style={{ fontSize: "0.78rem" }}>
              {patients.length} Active Records
            </span>
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--muted-color)", marginTop: "2px" }}>
            Record patient data, vitals, and initiate ambient voice consultation with instant clinical notes.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Language Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--light-background)", padding: "6px 12px", borderRadius: "var(--radius-full)", border: "1px solid var(--accent-border)" }}>
            <Languages size={15} color="var(--accent-color)" />
            <span style={{ fontSize: "0.82rem", fontWeight: "600" }}>Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ border: "none", background: "transparent", fontWeight: "700", color: "var(--accent-color)", cursor: "pointer", outline: "none", fontSize: "0.85rem" }}
            >
              <option value="English">English</option>
            </select>
          </div>

          {/* Tab Switcher */}
          <button
            onClick={() => setActiveTab("queue")}
            className={`btn ${activeTab === "queue" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "0.85rem", padding: "8px 16px" }}
          >
            <User size={15} /> Patient Queue
          </button>
          <button
            onClick={() => setActiveTab("record")}
            className={`btn ${activeTab === "record" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "0.85rem", padding: "8px 16px" }}
          >
            <UserPlus size={15} /> Record Patient Data
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-danger">
          {error}
        </div>
      )}

      {/* TAB 1: RECORD NEW PATIENT DATA */}
      {activeTab === "record" && (
        <div className="clinic-card" style={{ padding: "26px", border: "1.5px solid var(--accent-border)" }}>
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--heading-color)", display: "flex", alignItems: "center", gap: "8px" }}>
              <UserPlus size={18} color="var(--accent-color)" /> Record Full Patient Profile & Vitals
            </h3>
            <p style={{ fontSize: "0.84rem", color: "var(--muted-color)", marginTop: "2px" }}>
              Enter demographics, contact info, and current baseline vitals before beginning consultation.
            </p>
          </div>

          <form onSubmit={(e) => handleRecordPatient(e, false)}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              {/* Basic Details */}
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
                <label className="form-label">Age (Years) *</label>
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
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91 9876543210"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">ABHA ID (Ayushman Bharat)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="14-5521-8890-1234"
                  value={newPatient.abha_id}
                  onChange={(e) => setNewPatient({ ...newPatient, abha_id: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Blood Group</label>
                <select
                  className="input-field"
                  value={newPatient.blood_group}
                  onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            {/* Vitals Section */}
            <div style={{ background: "#f8fafc", padding: "16px 18px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", color: "#1e293b", fontSize: "0.92rem", marginBottom: "12px" }}>
                <HeartPulse size={16} color="var(--accent-color)" /> Baseline Vitals (Optional)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                <div>
                  <label className="form-label" style={{ fontSize: "0.78rem" }}>Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 120/80"
                    value={newPatient.bp}
                    onChange={(e) => setNewPatient({ ...newPatient, bp: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.78rem" }}>Pulse (bpm)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 74"
                    value={newPatient.pulse}
                    onChange={(e) => setNewPatient({ ...newPatient, pulse: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.78rem" }}>Temperature (°F)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 98.6"
                    value={newPatient.temp}
                    onChange={(e) => setNewPatient({ ...newPatient, temp: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.78rem" }}>SpO2 (%)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 98"
                    value={newPatient.spo2}
                    onChange={(e) => setNewPatient({ ...newPatient, spo2: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Medical History & Allergies */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label className="form-label">Past Medical History / Chronic Illness</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="e.g. Type 2 Diabetes for 5 years, Hypertension"
                  value={newPatient.medical_history}
                  onChange={(e) => setNewPatient({ ...newPatient, medical_history: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Known Drug / Food Allergies</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="e.g. Penicillin allergy, Sulfa drugs"
                  value={newPatient.allergies}
                  onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-secondary"
                style={{ padding: "10px 20px" }}
              >
                Save to Queue
              </button>
              <button
                type="button"
                onClick={() => handleRecordPatient(null, true)}
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: "10px 24px" }}
              >
                Save & Start Voice Consultation <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: PATIENT QUEUE & SELECTION */}
      {activeTab === "queue" && (
        <>
          {/* Search Bar */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: "42px", height: "46px", fontSize: "0.92rem" }}
              placeholder="Search patient by name, OPD number, phone or ABHA ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} color="var(--subtle-color)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          </div>

          {/* Patient Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px" }}>
            {filteredPatients.map((patient) => {
              const isSelected = patient.id === selectedPatientId;
              return (
                <div
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setPatientHistory(null);
                  }}
                  className={`patient-item-card ${isSelected ? "selected" : ""}`}
                  style={{ cursor: "pointer", position: "relative" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: isSelected ? "var(--accent-color)" : "var(--accent-subtle)",
                      color: isSelected ? "#ffffff" : "var(--accent-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "1.05rem"
                    }}>
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "1rem", fontWeight: "700", color: "var(--heading-color)" }}>
                        {patient.name}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted-color)", marginTop: "2px" }}>
                        {patient.age}y &bull; {patient.gender} &bull; <strong>{patient.id}</strong>
                      </div>
                      {patient.phone && (
                        <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Phone size={12} /> {patient.phone}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                        {patient.abha_id ? (
                          <span className="badge badge-abdm" style={{ fontSize: "0.7rem" }}>
                            <ShieldCheck size={11} /> {patient.abha_id}
                          </span>
                        ) : (
                          <span className="badge badge-draft" style={{ fontSize: "0.7rem" }}>
                            No ABHA
                          </span>
                        )}
                        {patient.blood_group && (
                          <span className="badge badge-approved" style={{ fontSize: "0.7rem" }}>
                            <Droplet size={11} /> {patient.blood_group}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewHistory(patient.id);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                    >
                      <History size={12} /> History
                    </button>
                    <input
                      type="radio"
                      name="selectedPatient"
                      checked={isSelected}
                      onChange={() => setSelectedPatientId(patient.id)}
                      style={{ width: "18px", height: "18px", accentColor: "var(--accent-color)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Consultation History Modal/Drawer */}
          {patientHistory && (
            <div className="clinic-card" style={{ padding: "18px 24px", background: "#f8fafc", border: "1px solid #cbd5e1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <History size={16} /> Past Consultations for {patientHistory.patient_id} ({patientHistory.total_sessions} total)
                </h4>
                <button onClick={() => setPatientHistory(null)} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.75rem" }}>
                  Close
                </button>
              </div>
              {patientHistory.history.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "#64748b" }}>No past consultations recorded for this patient yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                  {patientHistory.history.map((h, i) => (
                    <div key={i} style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.84rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600" }}>
                        <span>Session: {h.session_id}</span>
                        <span className={`badge ${h.note_status === "approved" ? "badge-approved" : "badge-draft"}`}>
                          {h.note_status}
                        </span>
                      </div>
                      <div style={{ color: "#64748b", marginTop: "3px" }}>
                        Started: {h.started_at ? new Date(h.started_at).toLocaleString() : "N/A"}
                      </div>
                      {h.summary && (
                        <div style={{ marginTop: "4px", color: "#334155" }}>
                          <strong>Chief Complaint:</strong> {h.summary.chief_complaint || "N/A"} &bull; <strong>Diagnosis:</strong> {h.summary.diagnosis || "N/A"}
                        </div>
                      )}
                      {onOpenPastNote && h.note_status !== "none" && (
                        <div style={{ marginTop: "8px", textAlign: "right" }}>
                          <button
                            onClick={() => {
                              const pObj = patients.find((p) => p.id === patientHistory.patient_id) || { id: patientHistory.patient_id, name: "Patient" };
                              onOpenPastNote({ session: { id: h.session_id }, patient: pObj });
                            }}
                            className="btn btn-secondary"
                            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                          >
                            <FileText size={12} /> Open Clinical Note
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="clinic-card" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "0.92rem", color: "var(--default-color)" }}>
                Active Patient: <strong style={{ color: "var(--accent-color)" }}>
                  {selectedPatient ? `${selectedPatient.name} (${selectedPatient.id})` : "None Selected"}
                </strong>
              </span>
              {selectedPatient && selectedPatient.vitals && (
                <span style={{ marginLeft: "14px", fontSize: "0.82rem", color: "var(--muted-color)" }}>
                  BP: {selectedPatient.vitals.bp || "-"} &bull; Pulse: {selectedPatient.vitals.pulse || "-"} &bull; Temp: {selectedPatient.vitals.temp || "-"}
                </span>
              )}
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
        </>
      )}
    </div>
  );
}