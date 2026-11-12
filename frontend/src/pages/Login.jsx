import React, { useState } from "react";
import { Stethoscope, Lock, Mail, ArrowRight, ShieldCheck, User, Building2, UserPlus, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";

export function Login({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState("signin"); // "signin" | "register"
  
  // Sign In State
  const [email, setEmail] = useState("doctor@hospital.gov.in");
  const [password, setPassword] = useState("doctor123");

  // Register State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regHospital, setRegHospital] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.auth.login(email.trim(), password);
      const doctor = api.auth.getCurrentDoctor();
      onLoginSuccess(doctor);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Invalid credentials. Please verify your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.auth.register(
        regName.trim(),
        regEmail.trim(),
        regPassword,
        regHospital.trim() || "District Hospital"
      );
      const doctor = api.auth.getCurrentDoctor();
      setSuccessMsg("Account created successfully! Signing in...");
      setTimeout(() => {
        onLoginSuccess(doctor);
      }, 600);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Registration failed. An account with this email may already exist."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail("doctor@hospital.gov.in");
    setPassword("doctor123");
    setLoading(true);
    setError(null);
    try {
      await api.auth.login("doctor@hospital.gov.in", "doctor123");
      const doctor = api.auth.getCurrentDoctor();
      onLoginSuccess(doctor);
    } catch (err) {
      setError("Login failed. Ensure backend service is active.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background-color)", display: "flex", flexDirection: "column" }}>
      {/* Top Clinical Header Bar */}
      <div className="clinic-topbar">
        <div className="clinic-topbar-container" style={{ justifyContent: "space-between" }}>
          <div className="topbar-info">
            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
              <ShieldCheck size={15} color="#38bdf8" /> Ambient AI Clinical Voice Scribe &mdash; Outpatient Department
            </span>
          </div>
          <div className="topbar-badges">
            <span className="badge badge-abdm" style={{ fontSize: "0.74rem" }}>
              ABDM & FHIR R4 Ready
            </span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "36px 20px" }}>
        <div style={{ maxWidth: "980px", width: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "36px", alignItems: "center" }}>
          
          {/* Left Column: System Overview */}
          <div>
            <div className="trust-badges" style={{ marginBottom: "16px" }}>
              <div className="badge-item">
                <ShieldCheck size={14} />
                <span>NHA Guidelines Compliant</span>
              </div>
              <div className="badge-item">
                <Stethoscope size={14} />
                <span>Doctor-in-the-Loop</span>
              </div>
            </div>

            <h1 style={{ fontSize: "2.3rem", fontWeight: "800", color: "var(--heading-color)", marginBottom: "16px", lineHeight: 1.25 }}>
              Ambient AI Voice Scribe for <span style={{ color: "var(--accent-color)" }}>Clinical Consultations</span>
            </h1>

            <p style={{ fontSize: "1.02rem", color: "var(--muted-color)", lineHeight: 1.6, marginBottom: "24px" }}>
              Record patient interactions naturally in English, auto-generate structured clinical SOAP notes in seconds, and eliminate OPD documentation backlogs.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--light-background)", padding: "18px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--heading-color)", fontWeight: "600", fontSize: "0.9rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-color)" }}></div>
                Patient Registration & Baseline Vitals Recording
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--heading-color)", fontWeight: "600", fontSize: "0.9rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-color)" }}></div>
                Real-Time English Speech-to-Text with Live Captioning
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--heading-color)", fontWeight: "600", fontSize: "0.9rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-color)" }}></div>
                Editable Consultation History with Saved Revisions
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--heading-color)", fontWeight: "600", fontSize: "0.9rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-color)" }}></div>
                ABDM HL7 FHIR R4 Bundle & PDF Export
              </div>
            </div>
          </div>

          {/* Right Column: Sign In & Register Form Card */}
          <div className="clinic-card" style={{ padding: "32px 36px" }}>
            
            {/* Tab Switcher: Sign In vs Create Account */}
            <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "10px", marginBottom: "24px" }}>
              <button
                type="button"
                onClick={() => { setActiveTab("signin"); setError(null); setSuccessMsg(null); }}
                style={{
                  flex: 1,
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  backgroundColor: activeTab === "signin" ? "#ffffff" : "transparent",
                  color: activeTab === "signin" ? "var(--accent-color)" : "var(--muted-color)",
                  boxShadow: activeTab === "signin" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s"
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("register"); setError(null); setSuccessMsg(null); }}
                style={{
                  flex: 1,
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  backgroundColor: activeTab === "register" ? "#ffffff" : "transparent",
                  color: activeTab === "register" ? "var(--accent-color)" : "var(--muted-color)",
                  boxShadow: activeTab === "register" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s"
                }}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="alert-box alert-danger" style={{ marginBottom: "16px" }}>
                {error}
              </div>
            )}

            {successMsg && (
              <div className="alert-box alert-success" style={{ marginBottom: "16px" }}>
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORM 1: DOCTOR SIGN IN */}
            {activeTab === "signin" && (
              <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="form-label">Doctor Email</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="email"
                      required
                      className="input-field"
                      style={{ paddingLeft: "40px" }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. doctor@hospital.gov.in"
                    />
                    <Mail size={16} color="var(--subtle-color)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="password"
                      required
                      className="input-field"
                      style={{ paddingLeft: "40px" }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <Lock size={16} color="var(--subtle-color)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px", marginTop: "4px" }}
                >
                  {loading ? "Authenticating..." : "Sign In to Clinic Scribe"} <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* FORM 2: CREATE NEW DOCTOR ACCOUNT */}
            {activeTab === "register" && (
              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label className="form-label">Doctor Full Name *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      required
                      className="input-field"
                      style={{ paddingLeft: "40px" }}
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Dr. Ramesh Gupta"
                    />
                    <User size={16} color="var(--subtle-color)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="email"
                      required
                      className="input-field"
                      style={{ paddingLeft: "40px" }}
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. dr.gupta@hospital.gov.in"
                    />
                    <Mail size={16} color="var(--subtle-color)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Password *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="password"
                      required
                      className="input-field"
                      style={{ paddingLeft: "40px" }}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a strong password"
                    />
                    <Lock size={16} color="var(--subtle-color)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Hospital / Clinic Facility Name</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: "40px" }}
                      value={regHospital}
                      onChange={(e) => setRegHospital(e.target.value)}
                      placeholder="e.g. District General Hospital"
                    />
                    <Building2 size={16} color="var(--subtle-color)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px", marginTop: "6px" }}
                >
                  {loading ? "Creating Account..." : "Create Account & Sign In"} <UserPlus size={16} />
                </button>
              </form>
            )}

            {/* Quick Demo Shortcut */}
            <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1px solid var(--border-color)", textAlign: "center" }}>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="btn btn-secondary"
                style={{ width: "100%", fontSize: "0.84rem", padding: "9px" }}
              >
                Sign In as Default Demo Doctor
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}