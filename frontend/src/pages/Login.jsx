import React, { useState } from "react";
import { Stethoscope, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
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
        err.response?.data?.detail || "Invalid credentials. Please verify email and password."
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
      setError("Login failed. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="glass-panel" style={{ maxWidth: "440px", width: "100%", padding: "36px" }}>
        {/* App Logo / Branding */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              boxShadow: "0 8px 24px rgba(13, 148, 136, 0.45)",
            }}
          >
            <Stethoscope size={30} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: "1.6rem", marginBottom: "6px" }}>Ambient AI Voice Scribe</h1>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
            Indian Public Healthcare Consultation Assistant
          </p>
          <div style={{ marginTop: "8px" }}>
            <span className="badge badge-abdm">
              <ShieldCheck size={12} /> NHA & ABDM Compliant
            </span>
          </div>
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>
              Doctor Email
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                required
                className="input-field"
                style={{ paddingLeft: "38px" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.gov.in"
              />
              <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                required
                className="input-field"
                style={{ paddingLeft: "38px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Lock size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "8px" }}
          >
            {loading ? "Authenticating..." : "Sign In to Clinic"} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-color)", textAlign: "center" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--text-subtle)", marginBottom: "10px" }}>
            Testing or Demonstrating?
          </p>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="btn btn-secondary"
            style={{ width: "100%", fontSize: "0.85rem", padding: "8px 12px" }}
          >
            Use Demo Doctor Account (AIIMS)
          </button>
        </div>
      </div>
    </div>
  );
}
