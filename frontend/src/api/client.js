import axios from "axios";

// Determines API Base URL based on environment or access host
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // If accessing through Vite dev proxy on port 5173, relative paths route directly
  if (typeof window !== "undefined" && window.location.port === "5173") {
    return "";
  }
  // When accessed directly across LAN via host IP (e.g. 10.145.117.193)
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return "";
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("scribe_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      localStorage.removeItem("scribe_token");
      localStorage.removeItem("scribe_doctor");
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth API
  auth: {
    async login(email, password) {
      const res = await apiClient.post("/auth/login", { email, password });
      if (res.data.access_token) {
        localStorage.setItem("scribe_token", res.data.access_token);
        localStorage.setItem(
          "scribe_doctor",
          JSON.stringify({
            id: res.data.doctor_id,
            name: res.data.doctor_name,
            hospital: res.data.hospital,
          })
        );
      }
      return res.data;
    },
    async register(name, email, password, hospital = "District Hospital") {
      const res = await apiClient.post("/auth/register", {
        name,
        email,
        password,
        hospital,
      });
      if (res.data.access_token) {
        localStorage.setItem("scribe_token", res.data.access_token);
        localStorage.setItem(
          "scribe_doctor",
          JSON.stringify({
            id: res.data.doctor_id,
            name: res.data.doctor_name,
            hospital: res.data.hospital,
          })
        );
      }
      return res.data;
    },
    logout() {
      localStorage.removeItem("scribe_token");
      localStorage.removeItem("scribe_doctor");
    },
    getCurrentDoctor() {
      const doc = localStorage.getItem("scribe_doctor");
      return doc ? JSON.parse(doc) : null;
    },
    isAuthenticated() {
      return !!localStorage.getItem("scribe_token");
    },
  },

  // Patients API
  patients: {
    async list(query = "") {
      const res = await apiClient.get("/patients", { params: { query } });
      return res.data;
    },
    async create(patientData) {
      const res = await apiClient.post("/patients", patientData);
      return res.data;
    },
    async get(patientId) {
      const res = await apiClient.get(`/patients/${patientId}`);
      return res.data;
    },
    async update(patientId, patientData) {
      const res = await apiClient.put(`/patients/${patientId}`, patientData);
      return res.data;
    },
    async getHistory(patientId) {
      const res = await apiClient.get(`/patients/${patientId}/history`);
      return res.data;
    },
  },

  // Sessions API
  sessions: {
    async create(patientId, language = "English") {
      const res = await apiClient.post("/sessions", {
        patient_id: patientId,
        language,
      });
      return res.data;
    },
    async start(patientId, language = "English") {
      return this.create(patientId, language);
    },
    async get(sessionId) {
      const res = await apiClient.get(`/sessions/${sessionId}`);
      return res.data;
    },
    async stop(sessionId) {
      const res = await apiClient.post(`/sessions/${sessionId}/stop`);
      return res.data;
    },
    async getTranscript(sessionId) {
      const res = await apiClient.get(`/sessions/${sessionId}/transcript`);
      return res.data;
    },
  },

  // Audio Chunk & Transcript Upload
  audio: {
    async uploadChunk(sessionId, audioBlob, chunkNo, transcriptText = "") {
      const formData = new FormData();
      if (audioBlob) {
        formData.append("file", audioBlob, `chunk_${chunkNo}.webm`);
      }
      formData.append("chunk_no", chunkNo);
      if (transcriptText) {
        formData.append("transcript_text", transcriptText);
      }

      const res = await apiClient.post(`/sessions/${sessionId}/audio`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    async sendTranscriptChunk(sessionId, chunkNo, text) {
      const res = await apiClient.post(`/sessions/${sessionId}/transcript-chunk`, {
        chunk_no: chunkNo,
        text,
      });
      return res.data;
    },
  },

  // Notes & Export API
  notes: {
    async get(sessionId) {
      const res = await apiClient.get(`/sessions/${sessionId}/note`);
      return res.data;
    },
    async update(sessionId, editedNote) {
      const res = await apiClient.put(`/sessions/${sessionId}/note`, {
        edited_note: editedNote,
      });
      return res.data;
    },
    async approve(sessionId) {
      const res = await apiClient.post(`/sessions/${sessionId}/approve`);
      return res.data;
    },
    getExportUrl(sessionId, format = "pdf") {
      const token = localStorage.getItem("scribe_token");
      return `${API_BASE_URL}/sessions/${sessionId}/export?format=${format}`;
    },
    async downloadFile(sessionId, format = "pdf") {
      const token = localStorage.getItem("scribe_token");
      const res = await apiClient.get(`/sessions/${sessionId}/export`, {
        params: { format },
        responseType: format === "pdf" ? "blob" : "json",
      });
      return res.data;
    },
  },
};

export default apiClient;
