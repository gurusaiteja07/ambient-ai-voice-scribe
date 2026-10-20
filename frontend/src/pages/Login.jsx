import React, { useState } from "react";
import { Stethoscope, Lock, Mail, ArrowRight, ShieldCheck, HeartPulse, Clock, Award } from "lucide-react";
import { api } from "../api/client";

export function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("doctor@hospital.gov.in");
  const [password, setPassword] = useState("doctor123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.auth.login(email, password);
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
      {/* Top emergency bar */}
      <div className="clinic-topbar">
        <div className="clinic-topbar-container">
          <div className="topbar-info">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <HeartPulse size={14} color="#38bdf8" /> National Health Authority &mdash; Ayushman Bharat Digital Mission
            </span>
          </div>
          <div className="topbar-badges">
            <span style={{ fontSize: "0.75rem", color: "#e2e8f0" }}>Toll-free Support: 1800-11-4477</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: "980px", width: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "32px", alignItems: "center" }}>
          {/* Left Hero Column */}
          <div>
            <div className="trust-badges">
              <div className="badge-item">
                <ShieldCheck size={14} />
                <span>NHA & ABDM Compliant</span>
              </div>
              <div className="badge-item">
                <Award size={14} />
                <span>AIIMS Validated</span>
              </div>
              <div className="badge-item">
                <Clock size={14} />
                <span>Real-Time Ambient AI</span>
              </div>
            </div>

            <h1 style={{ fontSize: "2.4rem", fontWeight: "800", color: "var(--heading-color)", marginBottom: "16px", lineHeight: 1.2 }}>
              Excellence in <span style={{ color: "var(--accent-color)" }}>Healthcare</span> With Ambient AI Scribe
            </h1>

            <p style={{ fontSize: "1.05rem", color: "var(--muted-color)", lineHeight: 1.6, marginBottom: "24px" }}>
              Capture doctor-patient conversations ambiently in Indian languages, generate ABDM FHIR R4 clinical notes in seconds, and eliminate OPD documentation burden.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--light-background)", padding: "18px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--heading-color)", fontWeight: "600", fontSize: "0.92rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-color)" }}></div>
                Multi-Dialect Indian Language Support (Hindi, English, Hinglish)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--heading-color)", fontWeight: "600", fontSize: "0.92rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-color)" }}></div>
                ABHA ID Linked & FHIR R4 Bundle Auto-Generation
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--heading-color)", fontWeight: "600", fontSize: "0.92rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-color)" }}></div>
                Zero Voice Retention & Doctor Review-First Architecture
              </div>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="clinic-card" style={{ padding: "36px" }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div className="clinic-logo-icon" style={{ width: "52px", height: "52px", margin: "0 auto 14px auto", borderRadius: "14px" }}>
                <Stethoscope size={28} />
              </div>
              <h2 style={{ fontSize: "1.45rem", fontWeight: "700", color: "var(--heading-color)" }}>Doctor Sign In</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--muted-color)", marginTop: "4px" }}>
                Access AIIMS OPD Consultation Suite
              </p>
            </div>

            {error && (
              <div className="alert-box alert-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Doctor Email / HPR ID</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    required
                    className="input-field"
                    style={{ paddingLeft: "40px" }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@hospital.gov.in"
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
                style={{ width: "100%", padding: "12px", marginTop: "6px" }}
              >
                {loading ? "Authenticating..." : "Sign In to Clinic Scribe"} <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-color)", textAlign: "center" }}>
              <p style={{ fontSize: "0.82rem", color: "var(--muted-color)", marginBottom: "12px" }}>
                Exploring or Evaluating the System?
              </p>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="btn btn-secondary"
                style={{ width: "100%", fontSize: "0.86rem", padding: "10px" }}
              >
                Quick Sign-in as Demo Doctor (AIIMS)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
