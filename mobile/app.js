// Ambient AI Voice Scribe - Mobile Extension Application
// Lightweight, human-readable vanilla JS client

const API_BASE = ""; // Relative to server root (e.g. /auth, /patients, /sessions)

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
  recognition: null,
  transcriptChunks: [],
};

// UI Elements
const viewLogin = document.getElementById("viewLogin");
const viewPatients = document.getElementById("viewPatients");
const viewRecorder = document.getElementById("viewRecorder");
const viewNote = document.getElementById("viewNote");

const tabQueue = document.getElementById("tabQueue");
const tabRegister = document.getElementById("tabRegister");
const subviewQueue = document.getElementById("subviewQueue");
const subviewRegister = document.getElementById("subviewRegister");

const navBtnPatients = document.getElementById("navBtnPatients");
const navBtnRecord = document.getElementById("navBtnRecord");
const navBtnNotes = document.getElementById("navBtnNotes");

const authStatusBadge = document.getElementById("authStatusBadge");
const toast = document.getElementById("toast");

// Helper: Show Notification Toast
function showToast(msg, duration = 3000) {
  toast.innerText = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), duration);
}

// Helper: API Fetch with JWT Authorization
async function apiCall(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers["Authorization"] = `Bearer ${state.token}`;
  }

  // Remove Content-Type if sending FormData
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
      localStorage.removeItem("scribe_mobile_token");
      switchView("login");
      throw new Error("Session expired. Please log in again.");
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errData.detail || "Request failed");
    }

    return await res.json();
  } catch (err) {
    console.error("API Error (" + endpoint + "):", err);
    throw err;
  }
}

// Switch Active View
function switchView(viewName) {
  viewLogin.classList.add("hidden");
  viewPatients.classList.add("hidden");
  viewRecorder.classList.add("hidden");
  viewNote.classList.add("hidden");

  navBtnPatients.classList.remove("active");
  navBtnRecord.classList.remove("active");
  navBtnNotes.classList.remove("active");

  if (viewName === "login") {
    viewLogin.classList.remove("hidden");
  } else if (viewName === "patients") {
    viewPatients.classList.remove("hidden");
    navBtnPatients.classList.add("active");
    loadPatients();
  } else if (viewName === "recorder") {
    viewRecorder.classList.remove("hidden");
    navBtnRecord.classList.add("active");
  } else if (viewName === "note") {
    viewNote.classList.remove("hidden");
    navBtnNotes.classList.add("active");
  }
}

// Initialize Application
async function initApp() {
  if (state.token && state.doctor) {
    authStatusBadge.innerText = state.doctor.name || "Doctor Online";
    authStatusBadge.className = "badge badge-online";
    switchView("patients");
  } else {
    authStatusBadge.innerText = "Offline";
    authStatusBadge.className = "badge badge-offline";
    switchView("login");
  }

  setupEventListeners();
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation Tabs
  navBtnPatients.addEventListener("click", () => switchView("patients"));
  navBtnRecord.addEventListener("click", () => {
    if (state.activeSession) {
      switchView("recorder");
    } else {
      showToast("Select a patient first to start recording.");
    }
  });
  navBtnNotes.addEventListener("click", () => {
    if (state.currentNote) {
      switchView("note");
    } else {
      showToast("No active consultation note yet.");
    }
  });

  // Login Form
  document.getElementById("formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    await handleLogin(email, password);
  });

  document.getElementById("btnQuickDemo").addEventListener("click", async () => {
    await handleLogin("doctor@hospital.gov.in", "doctor123");
  });

  // Patient Subview Tabs
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
  document.getElementById("btnToggleRecord").addEventListener("click", toggleRecording);
  document.getElementById("btnBackToQueue").addEventListener("click", () => switchView("patients"));

  // Quick Dictation Button
  document.getElementById("btnAddDictation").addEventListener("click", handleAddDictation);
  document.getElementById("inputDictation").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddDictation();
    }
  });

  // Stop & Generate Note
  document.getElementById("btnStopAndNote").addEventListener("click", handleStopAndSummarize);

  // Note Actions
  document.getElementById("btnApproveNote").addEventListener("click", handleApproveNote);
  document.getElementById("btnPrintNote").addEventListener("click", () => window.print());
  document.getElementById("btnNewPatient").addEventListener("click", () => {
    state.activeSession = null;
    state.currentNote = null;
    state.transcriptChunks = [];
    switchView("patients");
  });
}

// Auth Login Action
async function handleLogin(email, password) {
  try {
    showToast("Signing in...");
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

    authStatusBadge.innerText = state.doctor.name || "Doctor Online";
    authStatusBadge.className = "badge badge-online";

    showToast("Welcome Dr. " + data.doctor_name);
    switchView("patients");
  } catch (err) {
    showToast("Login failed: " + err.message);
  }
}

// Load Patients from API
async function loadPatients() {
  try {
    const list = await apiCall("/patients");
    state.patients = list || [];
    renderPatientList("");
  } catch (err) {
    console.error("Failed to load patients:", err);
  }
}

// Render Patient List
function renderPatientList(query = "") {
  const container = document.getElementById("patientList");
  const filtered = state.patients.filter((p) =>
    p.name.toLowerCase().includes(query) ||
    p.id.toLowerCase().includes(query) ||
    (p.abha_id && p.abha_id.toLowerCase().includes(query)) ||
    (p.phone && p.phone.includes(query))
  );

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px;">No patients found.</p>';
    return;
  }

  container.innerHTML = filtered
    .map(
      (p) => `
    <div class="patient-item" onclick="startSessionForPatient('${p.id}')">
      <div>
        <div class="patient-item-name">${escapeHtml(p.name)}</div>
        <div class="patient-item-sub">${p.age}y &bull; ${escapeHtml(p.gender)} &bull; ${escapeHtml(p.id)}</div>
        ${p.phone ? `<div class="patient-item-sub">📞 ${escapeHtml(p.phone)}</div>` : ""}
      </div>
      <button class="btn btn-sm btn-primary">Start Scribe ➔</button>
    </div>
  `
    )
    .join("");
}

// Start Session For Patient
async function startSessionForPatient(patientId) {
  const patient = state.patients.find((p) => p.id === patientId);
  if (!patient) return;

  state.selectedPatient = patient;
  showToast("Starting consultation...");

  try {
    const session = await apiCall("/sessions", {
      method: "POST",
      body: JSON.stringify({
        patient_id: patient.id,
        language: "English",
      }),
    });

    state.activeSession = session;
    state.transcriptChunks = [];
    document.getElementById("transcriptFeed").innerHTML = "";

    document.getElementById("recPatientName").innerText = patient.name;
    document.getElementById("recPatientMeta").innerText = `${patient.age}y, ${patient.gender} • ${patient.id}`;

    switchView("recorder");
  } catch (err) {
    showToast("Error starting consultation: " + err.message);
  }
}

// Save New Patient Data & Vitals
async function handleSavePatient(autoStart = false) {
  const name = document.getElementById("regName").value.trim();
  const age = parseInt(document.getElementById("regAge").value, 10);
  const gender = document.getElementById("regGender").value;
  const phone = document.getElementById("regPhone").value.trim();
  const abha = document.getElementById("regAbha").value.trim();

  const bp = document.getElementById("regBp").value.trim();
  const pulse = document.getElementById("regPulse").value.trim();
  const temp = document.getElementById("regTemp").value.trim();
  const spo2 = document.getElementById("regSpo2").value.trim();

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
    showToast("Saving patient...");
    const created = await apiCall("/patients", {
      method: "POST",
      body: JSON.stringify({
        name,
        age,
        gender,
        phone: phone || undefined,
        abha_id: abha || undefined,
        vitals: Object.keys(vitals).length > 0 ? vitals : undefined,
      }),
    });

    state.patients.unshift(created);
    showToast("Patient record saved!");

    // Reset Form
    document.getElementById("formRegisterPatient").reset();

    if (autoStart) {
      await startSessionForPatient(created.id);
    } else {
      tabQueue.click();
      renderPatientList();
    }
  } catch (err) {
    showToast("Failed to save patient: " + err.message);
  }
}

// Toggle Voice Recording
async function toggleRecording() {
  if (state.isRecording) {
    stopRecording();
  } else {
    await startRecording();
  }
}

// Start Microphone Recording & Web Speech Recognition
async function startRecording() {
  const micRing = document.getElementById("micRing");
  const micIcon = document.getElementById("micIcon");
  const recStatus = document.getElementById("recStatusText");
  const liveCaption = document.getElementById("liveCaption");
  const liveCaptionText = document.getElementById("liveCaptionText");
  const btnStop = document.getElementById("btnStopAndNote");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.stream = stream;

    // 1. Web Speech API for Real-time English STT
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let spokenEnglishBuffer = "";

    if (SpeechRecognition) {
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
          spokenEnglishBuffer = (spokenEnglishBuffer + " " + final).trim();
          addTranscriptEntry(final.trim());
        }
        liveCaptionText.innerText = (spokenEnglishBuffer + " " + interim).trim();
      };

      recognizer.onerror = (e) => console.warn("Mobile speech recognition event:", e.error);
      recognizer.start();
      state.recognition = recognizer;
      liveCaption.classList.remove("hidden");
    }

    // 2. MediaRecorder for Audio Chunks
    const recorder = new MediaRecorder(stream);
    state.mediaRecorder = recorder;
    let chunkCounter = 1;

    recorder.ondataavailable = async (event) => {
      if (event.data && event.data.size > 0) {
        const chunkNum = chunkCounter++;
        const currentText = spokenEnglishBuffer.trim();
        spokenEnglishBuffer = "";

        const formData = new FormData();
        formData.append("file", event.data, `chunk_${chunkNum}.webm`);
        formData.append("chunk_no", chunkNum);
        if (currentText) {
          formData.append("transcript_text", currentText);
        }

        try {
          await apiCall(`/sessions/${state.activeSession.id}/audio`, {
            method: "POST",
            body: formData,
          });
        } catch (e) {
          console.warn("Chunk upload note:", e.message);
        }
      }
    };

    recorder.start(8000); // 8-second audio timeslices
    state.isRecording = true;
    state.recordSeconds = 0;

    // Timer Loop
    state.timerInterval = setInterval(() => {
      state.recordSeconds++;
      const mins = String(Math.floor(state.recordSeconds / 60)).padStart(2, "0");
      const secs = String(state.recordSeconds % 60).padStart(2, "0");
      document.getElementById("recTimer").innerText = `${mins}:${secs}`;
    }, 1000);

    micRing.className = "mic-ring recording";
    micIcon.innerText = "⏹️";
    recStatus.innerText = "Recording ambient English consultation...";
    btnStop.disabled = false;
  } catch (err) {
    showToast("Microphone error: " + err.message);
  }
}

// Stop Voice Recording
function stopRecording() {
  const micRing = document.getElementById("micRing");
  const micIcon = document.getElementById("micIcon");
  const recStatus = document.getElementById("recStatusText");

  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  if (state.recognition) {
    try {
      state.recognition.stop();
    } catch (e) {}
    state.recognition = null;
  }

  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
    try {
      state.mediaRecorder.stop();
    } catch (e) {}
  }

  if (state.stream) {
    state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
  }

  state.isRecording = false;
  micRing.className = "mic-ring idle";
  micIcon.innerText = "🎙️";
  recStatus.innerText = "Recording paused. Tap to resume or generate note below.";
}

// Add Entry to Live Transcript UI
function addTranscriptEntry(text) {
  if (!text || !text.trim()) return;
  const feed = document.getElementById("transcriptFeed");
  const empty = feed.querySelector(".empty-state");
  if (empty) empty.remove();

  const item = document.createElement("div");
  item.className = "transcript-chunk";
  item.innerHTML = `
    <div class="chunk-meta">${new Date().toLocaleTimeString()}</div>
    <div>${escapeHtml(text)}</div>
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
    const chunkNo = state.transcriptChunks.length + 1;
    await apiCall(`/sessions/${state.activeSession.id}/transcript-chunk`, {
      method: "POST",
      body: JSON.stringify({ chunk_no: chunkNo, text }),
    });

    addTranscriptEntry(text);
    input.value = "";
    document.getElementById("btnStopAndNote").disabled = false;
  } catch (err) {
    showToast("Error adding dictation: " + err.message);
  }
}

// Stop Consultation and Generate Clinical SOAP Note
async function handleStopAndSummarize() {
  if (state.isRecording) {
    stopRecording();
  }

  showToast("Generating structured SOAP note with AI...");
  const btn = document.getElementById("btnStopAndNote");
  btn.disabled = true;
  btn.innerText = "Generating Note...";

  try {
    const res = await apiCall(`/sessions/${state.activeSession.id}/stop`, {
      method: "POST",
    });

    const note = res.note?.summary_json || res.note?.edited_json || res.note || {};
    state.currentNote = note;

    populateNoteEditor(note);
    switchView("note");
  } catch (err) {
    showToast("Error generating note: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = "Generate SOAP Clinical Note ➔";
  }
}

// Populate SOAP Note Editor
function populateNoteEditor(note) {
  document.getElementById("notePatientName").innerText = `${state.selectedPatient.name} (Note)`;
  document.getElementById("noteComplaint").value = note.chief_complaint || "";
  document.getElementById("noteHpi").value = note.history_of_present_illness || "";
  document.getElementById("noteDiagnosis").value = note.diagnosis || "";

  const meds = Array.isArray(note.medications)
    ? note.medications.map((m) => `${m.name} - ${m.dose} (${m.frequency}, ${m.duration})`).join("\n")
    : "";
  document.getElementById("noteMedications").value = meds;

  document.getElementById("noteInvestigations").value = Array.isArray(note.investigations)
    ? note.investigations.join(", ")
    : note.investigations || "";

  document.getElementById("noteAdvice").value = note.advice || "";
}

// Approve & Sign Clinical Note
async function handleApproveNote() {
  if (!state.activeSession) return;
  showToast("Signing & approving note...");

  try {
    const res = await apiCall(`/sessions/${state.activeSession.id}/approve`, {
      method: "POST",
    });

    document.getElementById("noteStatusBadge").innerText = "Signed (ABDM Approved)";
    document.getElementById("noteStatusBadge").className = "badge badge-approved";
    showToast("Clinical note approved! ABDM FHIR bundle generated.");
  } catch (err) {
    showToast("Approval error: " + err.message);
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

// Launch App on DOM Load
document.addEventListener("DOMContentLoaded", initApp);

