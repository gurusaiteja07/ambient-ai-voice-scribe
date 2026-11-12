// ==========================================================================
// Clinic AI Voice Scribe - Mobile Web Application Logic
// Matches Desktop Functionality: Full Doctor Auth (Sign In & Sign Up),
// Patient Queue with Vitals & History, Ambient Voice Scribe with Waveform,
// and Complete ABDM SOAP Note Review with PDF & FHIR Export.
// ==========================================================================

const API_BASE = ""; // Relative to host (works via Vite proxy and direct backend)

const state = {
  token: localStorage.getItem("scribe_mobile_token") || null,
  doctor: JSON.parse(localStorage.getItem("scribe_mobile_doctor") || "null"),
  patients: [],
  selectedPatient: null,
  activeSession: null,
  currentNote: null,
  isRecording: false,
  timerInterval: null,
  recordSeconds: 0,
  mediaRecorder: null,
  stream: null,
  recognition: null,
  audioContext: null,
  analyser: null,
  animFrame: null,
  spokenBuffer: "",
  hasConsent: false,
};

// DOM Elements Cache
const viewLogin = document.getElementById("viewLogin");
const viewPatients = document.getElementById("viewPatients");
const viewRecorder = document.getElementById("viewRecorder");
const viewNote = document.getElementById("viewNote");

const doctorBadgeWrap = document.getElementById("doctorBadgeWrap");
const docAvatar = document.getElementById("docAvatar");
const docName = document.getElementById("docName");
const topbarFacility = document.getElementById("topbarFacility");
const stepperNav = document.getElementById("stepperNav");

const stepQueue = document.getElementById("stepQueue");
const stepConsult = document.getElementById("stepConsult");
const stepNote = document.getElementById("stepNote");

const navBtnPatients = document.getElementById("navBtnPatients");
const navBtnRecord = document.getElementById("navBtnRecord");
const navBtnNotes = document.getElementById("navBtnNotes");

const toast = document.getElementById("toast");

// Helper: Show Notification Toast
function showToast(msg, duration = 3200) {
  if (!toast) return;
  toast.innerText = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), duration);
}

// Helper: Authenticated API Fetch
async function apiCall(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers["Authorization"] = `Bearer ${state.token}`;
  }

  // Remove Content-Type for multipart/form-data
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  try {
    const res = await fetch(API_BASE + endpoint, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      state.token = null;
      state.doctor = null;
      localStorage.removeItem("scribe_mobile_token");
      localStorage.removeItem("scribe_mobile_doctor");
      switchView("login");
      throw new Error("Session expired. Please sign in again.");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Request failed");
    }

    // Check if binary or JSON response
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/pdf") || contentType.includes("octet-stream")) {
      return await res.blob();
    }
    return await res.json();
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

// Switch Views & Update Stepper
function switchView(viewName) {
  viewLogin.classList.add("hidden");
  viewPatients.classList.add("hidden");
  viewRecorder.classList.add("hidden");
  viewNote.classList.add("hidden");

  navBtnPatients.classList.remove("active");
  navBtnRecord.classList.remove("active");
  navBtnNotes.classList.remove("active");

  stepQueue.className = "stepper-item";
  stepConsult.className = "stepper-item";
  stepNote.className = "stepper-item";

  if (viewName === "login") {
    viewLogin.classList.remove("hidden");
    stepperNav.classList.add("hidden");
    doctorBadgeWrap.classList.add("hidden");
  } else {
    stepperNav.classList.remove("hidden");
    doctorBadgeWrap.classList.remove("hidden");

    if (viewName === "patients") {
      viewPatients.classList.remove("hidden");
      navBtnPatients.classList.add("active");
      stepQueue.className = "stepper-item active";
      loadPatients();
    } else if (viewName === "recorder") {
      viewRecorder.classList.remove("hidden");
      navBtnRecord.classList.add("active");
      stepQueue.className = "stepper-item completed";
      stepConsult.className = "stepper-item active";
    } else if (viewName === "note") {
      viewNote.classList.remove("hidden");
      navBtnNotes.classList.add("active");
      stepQueue.className = "stepper-item completed";
      stepConsult.className = "stepper-item completed";
      stepNote.className = "stepper-item active";
    }
  }
}

// Initialize Application
function initApp() {
  if (state.token && state.doctor) {
    updateDoctorUI(state.doctor);
    switchView("patients");
  } else {
    switchView("login");
  }
  setupEventListeners();
}

function updateDoctorUI(doc) {
  if (!doc) return;
  const initial = doc.name ? doc.name.charAt(0).toUpperCase() : "D";
  docAvatar.innerText = initial;
  docName.innerText = `Dr. ${doc.name}`;
  if (topbarFacility && doc.hospital) {
    topbarFacility.innerText = `Facility: ${doc.hospital}`;
  }
  doctorBadgeWrap.classList.remove("hidden");
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation Tabs
  navBtnPatients.addEventListener("click", () => switchView("patients"));
  navBtnRecord.addEventListener("click", () => {
    if (state.activeSession) {
      switchView("recorder");
    } else {
      showToast("Select a patient from the queue to start recording.");
    }
  });
  navBtnNotes.addEventListener("click", () => {
    if (state.currentNote) {
      switchView("note");
    } else {
      showToast("No active consultation note yet.");
    }
  });

  // Header Logout
  document.getElementById("btnHeaderLogout").addEventListener("click", handleLogout);

  // Auth Tabs (Sign In vs Sign Up)
  const tabSignIn = document.getElementById("tabSignIn");
  const tabSignUp = document.getElementById("tabSignUp");
  const formLogin = document.getElementById("formLogin");
  const formRegister = document.getElementById("formRegister");

  tabSignIn.addEventListener("click", () => {
    tabSignIn.classList.add("active");
    tabSignUp.classList.remove("active");
    formLogin.classList.remove("hidden");
    formRegister.classList.add("hidden");
  });

  tabSignUp.addEventListener("click", () => {
    tabSignUp.classList.add("active");
    tabSignIn.classList.remove("active");
    formRegister.classList.remove("hidden");
    formLogin.classList.add("hidden");
  });

  // Doctor Sign In Submit
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    await handleLogin(email, password);
  });

  // Doctor Sign Up Submit
  formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("regDocName").value.trim();
    const email = document.getElementById("regDocEmail").value.trim();
    const password = document.getElementById("regDocPassword").value.trim();
    const hospital = document.getElementById("regDocHospital").value.trim() || "District Hospital";

    await handleRegister(name, email, password, hospital);
  });

  // Quick Demo Login
  document.getElementById("btnQuickDemo").addEventListener("click", async () => {
    await handleLogin("doctor@hospital.gov.in", "doctor123");
  });

  // Patient Tabs (Queue vs Register)
  const tabQueue = document.getElementById("tabQueue");
  const tabRegister = document.getElementById("tabRegister");
  const subviewQueue = document.getElementById("subviewQueue");
  const subviewRegister = document.getElementById("subviewRegister");

  tabQueue.addEventListener("click", () => {
    tabQueue.classList.add("active");
    tabRegister.classList.remove("active");
    subviewQueue.classList.remove("hidden");
    subviewRegister.classList.add("hidden");
  });

  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabQueue.classList.remove("active");
    subviewRegister.classList.remove("hidden");
    subviewQueue.classList.add("hidden");
  });

  // Search Patients
  document.getElementById("inputSearchPatients").addEventListener("input", (e) => {
    renderPatientList(e.target.value.toLowerCase());
  });

  // Register Patient Form
  document.getElementById("formRegisterPatient").addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleSavePatient(false);
  });

  document.getElementById("btnSaveAndConsult").addEventListener("click", async () => {
    await handleSavePatient(true);
  });

  // Recorder Controls
  document.getElementById("btnToggleRecord").addEventListener("click", handleRecordToggleClicked);
  document.getElementById("btnBackToQueue").addEventListener("click", () => switchView("patients"));

  // Quick Dictation Box
  document.getElementById("btnAddDictation").addEventListener("click", handleAddDictation);
  document.getElementById("inputDictation").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddDictation();
    }
  });

  // Stop & Generate SOAP Note
  document.getElementById("btnStopAndNote").addEventListener("click", handleStopAndSummarize);

  // SOAP Note Actions
  document.getElementById("btnSaveDraftNote").addEventListener("click", handleSaveDraftNote);
  document.getElementById("btnApproveNote").addEventListener("click", handleApproveNote);
  document.getElementById("btnDownloadPdf").addEventListener("click", handleDownloadPdf);
  document.getElementById("btnDownloadFhir").addEventListener("click", handleDownloadFhir);
  document.getElementById("btnAddMedRow").addEventListener("click", () => addMedRow());
  document.getElementById("btnNewPatient").addEventListener("click", () => {
    state.activeSession = null;
    state.currentNote = null;
    state.hasConsent = false;
    switchView("patients");
  });

  // Consent Modal Controls
  const checkConsent = document.getElementById("checkConsent");
  const btnConfirmConsent = document.getElementById("btnConfirmConsent");
  checkConsent.addEventListener("change", (e) => {
    btnConfirmConsent.disabled = !e.target.checked;
  });

  btnConfirmConsent.addEventListener("click", () => {
    state.hasConsent = true;
    document.getElementById("modalConsent").classList.add("hidden");
    startRecording();
  });

  document.getElementById("btnCloseConsent").addEventListener("click", () => {
    document.getElementById("modalConsent").classList.add("hidden");
  });
  document.getElementById("btnCancelConsent").addEventListener("click", () => {
    document.getElementById("modalConsent").classList.add("hidden");
  });

  // History Modal Close
  document.getElementById("btnCloseHistory").addEventListener("click", () => {
    document.getElementById("modalHistory").classList.add("hidden");
  });
}

// Authentication Handlers
async function handleLogin(email, password) {
  try {
    showToast("Authenticating doctor...");
    const data = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    state.token = data.access_token;
    state.doctor = {
      id: data.doctor_id,
      name: data.doctor_name,
      hospital: data.hospital,
    };

    localStorage.setItem("scribe_mobile_token", state.token);
    localStorage.setItem("scribe_mobile_doctor", JSON.stringify(state.doctor));

    updateDoctorUI(state.doctor);
    showToast(`Welcome Dr. ${data.doctor_name}`);
    switchView("patients");
  } catch (err) {
    showToast(`Sign in error: ${err.message}`);
  }
}

async function handleRegister(name, email, password, hospital) {
  try {
    showToast("Creating doctor account...");
    const data = await apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, hospital }),
    });

    state.token = data.access_token;
    state.doctor = {
      id: data.doctor_id,
      name: data.doctor_name,
      hospital: data.hospital,
    };

    localStorage.setItem("scribe_mobile_token", state.token);
    localStorage.setItem("scribe_mobile_doctor", JSON.stringify(state.doctor));

    updateDoctorUI(state.doctor);
    showToast(`Account created! Welcome Dr. ${data.doctor_name}`);
    switchView("patients");
  } catch (err) {
    showToast(`Registration error: ${err.message}`);
  }
}

function handleLogout() {
  state.token = null;
  state.doctor = null;
  state.activeSession = null;
  state.currentNote = null;
  localStorage.removeItem("scribe_mobile_token");
  localStorage.removeItem("scribe_mobile_doctor");
  showToast("Signed out successfully.");
  switchView("login");
}

// Load Patient Queue
async function loadPatients() {
  try {
    const list = await apiCall("/patients");
    state.patients = list || [];
    renderPatientList("");
  } catch (err) {
    console.error("Failed to load patients:", err);
  }
}

// Render Patient Cards
function renderPatientList(query = "") {
  const container = document.getElementById("patientList");
  const filtered = state.patients.filter((p) =>
    p.name.toLowerCase().includes(query) ||
    p.id.toLowerCase().includes(query) ||
    (p.abha_id && p.abha_id.toLowerCase().includes(query)) ||
    (p.phone && p.phone.includes(query))
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 32px 14px; color: var(--muted-color); font-size: 0.88rem;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 8px; opacity: 0.5;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <p>No patients found.</p>
        <p style="font-size: 0.78rem;">Use <strong>+ Register Patient</strong> to create a new OPD record.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered
    .map((p) => {
      const v = p.vitals || {};
      return `
      <div class="patient-card">
        <div class="patient-card-top">
          <div>
            <div class="patient-name-title">${escapeHtml(p.name)}</div>
            <div class="patient-meta-text">
              <span><strong>${p.id}</strong></span>
              <span>&bull;</span>
              <span>${p.age}y, ${escapeHtml(p.gender)}</span>
              ${p.blood_group ? `<span>&bull;</span> <span>${escapeHtml(p.blood_group)}</span>` : ""}
            </div>
            ${p.phone ? `<div style="font-size: 0.75rem; color: var(--muted-color); margin-bottom: 4px;">📞 ${escapeHtml(p.phone)}</div>` : ""}
            ${p.abha_id ? `<span class="badge badge-abdm" style="font-size: 0.68rem; margin-top: 2px;">ABHA: ${escapeHtml(p.abha_id)}</span>` : ""}
          </div>
          <button onclick="handleConsultClicked('${p.id}')" class="btn btn-primary btn-sm" style="align-self: flex-start; padding: 6px 12px;">
            Start ➔
          </button>
        </div>

        ${(v.bp || v.pulse || v.temp || v.spo2) ? `
          <div class="vitals-pill-row">
            ${v.bp ? `<span class="vitals-pill">BP: ${escapeHtml(v.bp)}</span>` : ""}
            ${v.pulse ? `<span class="vitals-pill">Pulse: ${escapeHtml(v.pulse)}</span>` : ""}
            ${v.temp ? `<span class="vitals-pill">Temp: ${escapeHtml(v.temp)}°F</span>` : ""}
            ${v.spo2 ? `<span class="vitals-pill">SpO2: ${escapeHtml(v.spo2)}%</span>` : ""}
          </div>` : ""}

        <div style="display: flex; justify-content: flex-end; margin-top: 8px; border-top: 1px solid var(--border-color); padding-top: 6px;">
          <button onclick="handleViewHistory('${p.id}')" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 4px 8px;">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
            Past History
          </button>
        </div>
      </div>`;
    })
    .join("");
}

// Window Globals for onclick handlers
window.handleConsultClicked = function (patientId) {
  const patient = state.patients.find((p) => p.id === patientId);
  if (!patient) return;
  startSessionForPatient(patient);
};

window.handleViewHistory = async function (patientId) {
  try {
    showToast("Loading patient history...");
    const res = await apiCall(`/patients/${patientId}/history`);
    const modal = document.getElementById("modalHistory");
    const title = document.getElementById("historyTitle");
    const body = document.getElementById("historyBody");

    title.innerText = `Consultation History (${res.patient_id})`;
    if (!res.history || res.history.length === 0) {
      body.innerHTML = '<p style="text-align:center; color: var(--muted-color); font-size: 0.84rem; padding: 20px;">No previous consultations recorded.</p>';
    } else {
      body.innerHTML = res.history
        .map((h) => `
        <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700;">
            <span>${escapeHtml(h.session_id)}</span>
            <span class="badge ${h.note_status === "approved" ? "badge-approved" : "badge-draft"}">${escapeHtml(h.note_status)}</span>
          </div>
          <div style="font-size: 0.74rem; color: var(--muted-color); margin: 3px 0;">
            ${h.started_at ? new Date(h.started_at).toLocaleString() : ""}
          </div>
          ${h.summary ? `
            <div style="font-size: 0.78rem; color: var(--default-color); margin-top: 4px;">
              <strong>Chief Complaint:</strong> ${escapeHtml(h.summary.chief_complaint || "N/A")}<br/>
              <strong>Diagnosis:</strong> ${escapeHtml(h.summary.diagnosis || "N/A")}
            </div>
            <button onclick="handleOpenPastNote('${h.session_id}', '${patientId}')" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 4px 8px; margin-top: 6px;">
              Open Clinical Note ➔
            </button>` : ""}
        </div>`)
        .join("");
    }
    modal.classList.remove("hidden");
  } catch (err) {
    showToast("Error loading history: " + err.message);
  }
};

window.handleOpenPastNote = async function (sessionId, patientId) {
  document.getElementById("modalHistory").classList.add("hidden");
  const patient = state.patients.find((p) => p.id === patientId) || { id: patientId, name: "Patient" };
  state.selectedPatient = patient;
  state.activeSession = { id: sessionId };

  try {
    showToast("Loading consultation note...");
    const res = await apiCall(`/sessions/${sessionId}/note`);
    const note = res.edited_json || res.summary_json || {};
    state.currentNote = note;
    populateNoteEditor(note, res.status);
    switchView("note");
  } catch (err) {
    showToast("Could not load note: " + err.message);
  }
};

// Start Consultation Session
async function startSessionForPatient(patient) {
  state.selectedPatient = patient;
  try {
    showToast("Initializing consultation session...");
    const session = await apiCall("/sessions", {
      method: "POST",
      body: JSON.stringify({
        patient_id: patient.id,
        language: "English",
      }),
    });

    state.activeSession = session;
    state.currentNote = null;
    document.getElementById("transcriptFeed").innerHTML = "";
    document.getElementById("recPatientName").innerText = patient.name;
    document.getElementById("recPatientMeta").innerText = `${patient.age}y, ${patient.gender} • OPD: ${patient.id}`;

    switchView("recorder");
  } catch (err) {
    showToast("Error starting consultation: " + err.message);
  }
}

// Save New Patient Form
async function handleSavePatient(autoStart = false) {
  const name = document.getElementById("regName").value.trim();
  const age = parseInt(document.getElementById("regAge").value, 10);
  const gender = document.getElementById("regGender").value;
  const phone = document.getElementById("regPhone").value.trim();
  const blood = document.getElementById("regBloodGroup").value;
  const abha = document.getElementById("regAbha").value.trim();

  const bp = document.getElementById("regBp").value.trim();
  const pulse = document.getElementById("regPulse").value.trim();
  const temp = document.getElementById("regTemp").value.trim();
  const spo2 = document.getElementById("regSpo2").value.trim();

  const medHistory = document.getElementById("regMedHistory").value.trim();
  const allergies = document.getElementById("regAllergies").value.trim();

  if (!name || isNaN(age)) {
    showToast("Please enter patient name and age.");
    return;
  }

  const vitals = {};
  if (bp) vitals.bp = bp;
  if (pulse) vitals.pulse = pulse;
  if (temp) vitals.temp = temp;
  if (spo2) vitals.spo2 = spo2;

  try {
    showToast("Saving patient record...");
    const created = await apiCall("/patients", {
      method: "POST",
      body: JSON.stringify({
        name,
        age,
        gender,
        phone: phone || undefined,
        blood_group: blood || undefined,
        abha_id: abha || undefined,
        vitals: Object.keys(vitals).length > 0 ? vitals : undefined,
        medical_history: medHistory || undefined,
        allergies: allergies || undefined,
      }),
    });

    state.patients.unshift(created);
    document.getElementById("formRegisterPatient").reset();
    showToast("Patient registered successfully!");

    if (autoStart) {
      await startSessionForPatient(created);
    } else {
      document.getElementById("tabQueue").click();
      renderPatientList();
    }
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
}

// Voice Recorder Controls
function handleRecordToggleClicked() {
  if (state.isRecording) {
    stopRecording();
  } else {
    if (!state.hasConsent) {
      document.getElementById("consentPatientName").innerText = state.selectedPatient?.name || "the patient";
      document.getElementById("modalConsent").classList.remove("hidden");
    } else {
      startRecording();
    }
  }
}

// Start Microphone & Speech Capture
async function startRecording() {
  const btn = document.getElementById("btnToggleRecord");
  const ring = document.getElementById("micRing");
  const micLabel = document.getElementById("micLabel");
  const micIcon = document.getElementById("micIcon");
  const recHeader = document.getElementById("recHeaderTitle");
  const recSub = document.getElementById("recSubTitle");
  const liveCaption = document.getElementById("liveCaption");
  const liveCaptionText = document.getElementById("liveCaptionText");
  const btnStop = document.getElementById("btnStopAndNote");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    state.stream = stream;

    // Web Audio Analyser for Waveform
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const actx = new AudioCtx();
      const src = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      state.audioContext = actx;
      state.analyser = analyser;
      animateWaveform();
    }

    // Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.spokenBuffer = "";

    if (SpeechRecognition) {
      try {
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = "en-US";

        recognizer.onresult = (event) => {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript + " ";
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (final) {
            state.spokenBuffer = (state.spokenBuffer + " " + final).trim();
            addTranscriptChunk(final.trim());
          }
          liveCaptionText.innerText = (state.spokenBuffer + " " + interim).trim();
        };

        recognizer.onerror = (e) => console.warn("Speech recognition event:", e.error);
        recognizer.start();
        state.recognition = recognizer;
        liveCaption.classList.remove("hidden");
      } catch (e) {
        console.warn("Speech API start error:", e);
      }
    }

    // MediaRecorder for 8s audio chunks
    const recorder = new MediaRecorder(stream);
    state.mediaRecorder = recorder;
    let chunkCounter = 1;

    recorder.ondataavailable = async (event) => {
      if (event.data && event.data.size > 0 && state.activeSession) {
        const chunkNum = chunkCounter++;
        const currentSpoken = state.spokenBuffer.trim();
        state.spokenBuffer = "";

        const formData = new FormData();
        formData.append("file", event.data, `chunk_${chunkNum}.webm`);
        formData.append("chunk_no", chunkNum);
        if (currentSpoken) {
          formData.append("transcript_text", currentSpoken);
        }

        try {
          await apiCall(`/sessions/${state.activeSession.id}/audio`, {
            method: "POST",
            body: formData,
          });
        } catch (e) {
          console.warn("Audio upload note:", e.message);
        }
      }
    };

    recorder.start(8000);
    state.isRecording = true;
    state.recordSeconds = 0;

    state.timerInterval = setInterval(() => {
      state.recordSeconds++;
      const mins = String(Math.floor(state.recordSeconds / 60)).padStart(2, "0");
      const secs = String(state.recordSeconds % 60).padStart(2, "0");
      document.getElementById("recTimer").innerText = `${mins}:${secs}`;
    }, 1000);

    // UI Updates
    btn.className = "btn-big-record recording";
    ring.classList.remove("hidden");
    micLabel.innerText = "STOP";
    micIcon.innerHTML = '<rect x="6" y="6" width="12" height="12" rx="2" ry="2"/>';
    recHeader.innerText = "Consultation in Progress";
    recSub.innerText = "Microphone listening ambiently in English.";
    btnStop.disabled = false;
  } catch (err) {
    showToast(`Microphone error: ${err.message}`);
  }
}

// Stop Microphone Recording
function stopRecording() {
  const btn = document.getElementById("btnToggleRecord");
  const ring = document.getElementById("micRing");
  const micLabel = document.getElementById("micLabel");
  const micIcon = document.getElementById("micIcon");
  const recHeader = document.getElementById("recHeaderTitle");
  const recSub = document.getElementById("recSubTitle");

  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  if (state.animFrame) {
    cancelAnimationFrame(state.animFrame);
    state.animFrame = null;
  }
  if (state.recognition) {
    try { state.recognition.stop(); } catch (e) {}
    state.recognition = null;
  }
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
    try { state.mediaRecorder.stop(); } catch (e) {}
  }
  if (state.stream) {
    state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
  }
  if (state.audioContext && state.audioContext.state !== "closed") {
    state.audioContext.close().catch(() => {});
    state.audioContext = null;
  }

  state.isRecording = false;
  btn.className = "btn-big-record idle";
  ring.classList.add("hidden");
  micLabel.innerText = "START";
  micIcon.innerHTML = '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>';
  recHeader.innerText = "Recording Paused";
  recSub.innerText = "Tap START to resume or generate the note below.";
}

// Waveform Animation Loop
function animateWaveform() {
  if (!state.analyser) return;
  const data = new Uint8Array(state.analyser.frequencyBinCount);
  state.analyser.getByteFrequencyData(data);

  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  const avg = sum / data.length;

  const bars = document.querySelectorAll(".wave-bar");
  bars.forEach((bar, i) => {
    const factor = [0.4, 0.8, 1.2, 0.6, 1.0, 0.7, 1.4, 0.5, 0.9, 0.3][i % 10];
    const h = Math.max(4, Math.min(22, Math.round((avg / 128) * 22 * factor)));
    bar.style.height = `${h}px`;
    if (state.isRecording && avg > 10) {
      bar.classList.add("active");
    } else {
      bar.classList.remove("active");
    }
  });

  if (state.isRecording) {
    state.animFrame = requestAnimationFrame(animateWaveform);
  }
}

// Add Chunk Entry in UI
function addTranscriptChunk(text) {
  if (!text || !text.trim()) return;
  const feed = document.getElementById("transcriptFeed");
  const empty = feed.querySelector(".empty-state");
  if (empty) empty.remove();

  const total = feed.querySelectorAll(".transcript-bubble").length + 1;
  document.getElementById("chunkCountBadge").innerText = `${total} Chunks`;

  const item = document.createElement("div");
  item.className = "transcript-bubble";
  item.innerHTML = `
    <div class="transcript-bubble-top">
      <span style="font-weight: 700; color: var(--accent-color);">Segment #${total}</span>
      <span>${new Date().toLocaleTimeString()}</span>
    </div>
    <p style="color: var(--heading-color);">${escapeHtml(text)}</p>
  `;
  feed.appendChild(item);
  feed.scrollTop = feed.scrollHeight;
}

// Quick Manual Dictation
async function handleAddDictation() {
  const input = document.getElementById("inputDictation");
  const text = input.value.trim();
  if (!text || !state.activeSession) return;

  try {
    await apiCall(`/sessions/${state.activeSession.id}/transcript-chunk`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });

    addTranscriptChunk(text);
    input.value = "";
    document.getElementById("btnStopAndNote").disabled = false;
  } catch (err) {
    showToast(`Error adding phrase: ${err.message}`);
  }
}

// Stop Consultation and Generate Clinical SOAP Note
async function handleStopAndSummarize() {
  if (state.isRecording) {
    stopRecording();
  }

  showToast("Structuring clinical SOAP note with AI...");
  const btn = document.getElementById("btnStopAndNote");
  btn.disabled = true;
  btn.innerText = "Analyzing & Generating Note...";

  try {
    const res = await apiCall(`/sessions/${state.activeSession.id}/stop`, {
      method: "POST",
    });

    const note = res.note?.summary_json || res.note?.edited_json || res.note || {};
    state.currentNote = note;

    populateNoteEditor(note, "draft");
    switchView("note");
  } catch (err) {
    showToast(`Error generating note: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerText = "Complete Consultation & Generate Note ➔";
  }
}

// Populate SOAP Note Editor
function populateNoteEditor(note, status = "draft") {
  document.getElementById("notePatientName").innerText = `${state.selectedPatient?.name || "Patient"} (Note)`;
  
  const statusBadge = document.getElementById("noteStatusBadge");
  if (status === "approved") {
    statusBadge.innerText = "Signed & ABDM Approved";
    statusBadge.className = "badge badge-approved";
  } else {
    statusBadge.innerText = "Draft (Pending Sign)";
    statusBadge.className = "badge badge-draft";
  }

  document.getElementById("noteComplaint").value = note.chief_complaint || "";
  document.getElementById("noteHpi").value = note.history_of_present_illness || "";
  document.getElementById("noteSymptoms").value = Array.isArray(note.symptoms) ? note.symptoms.join(", ") : (note.symptoms || "");
  document.getElementById("noteExamination").value = note.examination || "";
  document.getElementById("noteDiagnosis").value = note.diagnosis || "";

  // Populate Medication Rows
  const medContainer = document.getElementById("medListContainer");
  medContainer.innerHTML = "";
  const meds = Array.isArray(note.medications) ? note.medications : [];
  if (meds.length === 0) {
    addMedRow();
  } else {
    meds.forEach((m) => addMedRow(m.name, m.dose, m.frequency, m.duration));
  }

  document.getElementById("noteInvestigations").value = Array.isArray(note.investigations) ? note.investigations.join(", ") : (note.investigations || "");
  document.getElementById("noteAdvice").value = note.advice || "";
  document.getElementById("noteFollowUp").value = note.follow_up || "";
}

// Dynamic Medication Rows
function addMedRow(name = "", dose = "1 tablet", freq = "Once daily", dur = "3 days") {
  const container = document.getElementById("medListContainer");
  const row = document.createElement("div");
  row.className = "med-row";
  row.innerHTML = `
    <div style="display: flex; gap: 8px;">
      <input type="text" class="input-field med-name" placeholder="Medicine Name (e.g. Paracetamol 650mg)" value="${escapeHtml(name)}" style="flex: 2;">
      <input type="text" class="input-field med-dose" placeholder="Dose (1 tab)" value="${escapeHtml(dose)}" style="flex: 1;">
      <button type="button" class="btn btn-secondary btn-sm" onclick="this.closest('.med-row').remove()" style="color: var(--danger-color); padding: 4px 8px;">&times;</button>
    </div>
    <div style="display: flex; gap: 8px;">
      <input type="text" class="input-field med-freq" placeholder="Frequency (e.g. TDS after food)" value="${escapeHtml(freq)}" style="flex: 1;">
      <input type="text" class="input-field med-dur" placeholder="Duration (e.g. 5 days)" value="${escapeHtml(dur)}" style="flex: 1;">
    </div>
  `;
  container.appendChild(row);
}

function collectMedicationsFromUI() {
  const meds = [];
  const rows = document.querySelectorAll(".med-row");
  rows.forEach((r) => {
    const name = r.querySelector(".med-name").value.trim();
    const dose = r.querySelector(".med-dose").value.trim();
    const freq = r.querySelector(".med-freq").value.trim();
    const dur = r.querySelector(".med-dur").value.trim();
    if (name) {
      meds.push({ name, dose, frequency: freq, duration: dur });
    }
  });
  return meds;
}

function collectNotePayloadFromUI() {
  const symptomsStr = document.getElementById("noteSymptoms").value.trim();
  const symptomsArr = symptomsStr ? symptomsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const invStr = document.getElementById("noteInvestigations").value.trim();
  const invArr = invStr ? invStr.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return {
    chief_complaint: document.getElementById("noteComplaint").value.trim(),
    history_of_present_illness: document.getElementById("noteHpi").value.trim(),
    symptoms: symptomsArr,
    examination: document.getElementById("noteExamination").value.trim(),
    diagnosis: document.getElementById("noteDiagnosis").value.trim(),
    medications: collectMedicationsFromUI(),
    investigations: invArr,
    advice: document.getElementById("noteAdvice").value.trim(),
    follow_up: document.getElementById("noteFollowUp").value.trim(),
  };
}

// Save Draft Note
async function handleSaveDraftNote() {
  if (!state.activeSession) return;
  const payload = collectNotePayloadFromUI();
  try {
    showToast("Saving draft note...");
    await apiCall(`/sessions/${state.activeSession.id}/note`, {
      method: "PUT",
      body: JSON.stringify({ edited_note: payload }),
    });
    showToast("Draft note saved successfully!");
  } catch (err) {
    showToast(`Save error: ${err.message}`);
  }
}

// Approve & Lock Note
async function handleApproveNote() {
  if (!state.activeSession) return;
  const payload = collectNotePayloadFromUI();

  try {
    showToast("Digitally signing & generating ABDM FHIR bundle...");
    // 1. Save edits first
    await apiCall(`/sessions/${state.activeSession.id}/note`, {
      method: "PUT",
      body: JSON.stringify({ edited_note: payload }),
    });

    // 2. Approve
    await apiCall(`/sessions/${state.activeSession.id}/approve`, {
      method: "POST",
    });

    const statusBadge = document.getElementById("noteStatusBadge");
    statusBadge.innerText = "Signed & ABDM Approved";
    statusBadge.className = "badge badge-approved";
    showToast("Note digitally signed! ABDM FHIR bundle generated.");
  } catch (err) {
    showToast(`Approval error: ${err.message}`);
  }
}

// Download PDF
async function handleDownloadPdf() {
  if (!state.activeSession) return;
  try {
    showToast("Generating official PDF note...");
    const blob = await apiCall(`/sessions/${state.activeSession.id}/export?format=pdf`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consultation_note_${state.activeSession.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.warn("Falling back to print():", err);
    window.print();
  }
}

// Download ABDM FHIR Bundle JSON
async function handleDownloadFhir() {
  if (!state.activeSession) return;
  try {
    showToast("Fetching ABDM FHIR bundle...");
    const fhir = await apiCall(`/sessions/${state.activeSession.id}/export?format=fhir`);
    const blob = new Blob([JSON.stringify(fhir, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FHIR_bundle_${state.selectedPatient?.id || "patient"}_${state.activeSession.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    showToast(`FHIR Export error: ${err.message}`);
  }
}

// Safe HTML Escaping
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}

// Start app on DOM load
document.addEventListener("DOMContentLoaded", initApp);
