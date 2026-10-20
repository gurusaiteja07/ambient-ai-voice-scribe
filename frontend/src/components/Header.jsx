import React from "react";
import { Stethoscope, ShieldCheck, LogOut, User, Phone, MapPin, Users, Mic, FileText } from "lucide-react";

export function Header({ doctor, currentView, onLogout }) {
  return (
    <header className="header-branding" style={{ width: "100%", position: "sticky", top: 0, zIndex: 100 }}>
      {/* Clinic Top Bar */}
      <div className="clinic-topbar">
        <div className="clinic-topbar-container">
          <div className="topbar-info">
            <div className="topbar-item">
              <Phone size={13} />
              <span>NHA Toll-Free Helpline: <strong>1800-11-4477</strong> / Emergency: <strong>108</strong></span>
            </div>
            <div className="topbar-item">
              <MapPin size={13} />
              <span>OPD Dept, AIIMS New Delhi</span>
            </div>
          </div>
          <div className="topbar-badges">
            <span className="badge badge-abdm" style={{ fontSize: "0.7rem", padding: "3px 8px" }}>
              <ShieldCheck size={12} /> ABDM Facility HPR-09821
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="header-container">
        <div className="clinic-logo">
          <div className="clinic-logo-icon">
            <Stethoscope size={24} />
          </div>
          <div className="clinic-logo-text">
            <h1>Clinic <span style={{ color: "var(--accent-color)" }}>AI Scribe</span></h1>
            <p>Indian Public Healthcare Ambient Consultation</p>
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="stepper-nav" style={{ display: "flex" }}>
          <div className={`stepper-step ${currentView === "patients" ? "active" : currentView !== "login" ? "completed" : ""}`}>
            <Users size={14} />
            <span>1. Patient Queue</span>
          </div>
          <span style={{ color: "var(--subtle-color)", fontSize: "0.8rem" }}>&rsaquo;</span>
          <div className={`stepper-step ${currentView === "recorder" ? "active" : currentView === "note-editor" ? "completed" : ""}`}>
            <Mic size={14} />
            <span>2. Ambient Consultation</span>
          </div>
          <span style={{ color: "var(--subtle-color)", fontSize: "0.8rem" }}>&rsaquo;</span>
          <div className={`stepper-step ${currentView === "note-editor" ? "active" : ""}`}>
            <FileText size={14} />
            <span>3. Clinical Note & ABDM</span>
          </div>
        </div>

        {/* Doctor Info & Logout */}
        {doctor && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="doctor-profile-badge">
              <div className="doctor-avatar">
                {doctor.name ? doctor.name.charAt(0).toUpperCase() : "D"}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.86rem", fontWeight: "700", color: "var(--heading-color)" }}>
                  Dr. {doctor.name}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted-color)" }}>
                  {doctor.hospital || "AIIMS New Delhi"}
                </div>
              </div>
            </div>
            <button onClick={onLogout} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.82rem" }} title="Sign Out">
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
