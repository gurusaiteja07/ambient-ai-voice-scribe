import axios from "axios";

// In development, Vite proxy forwards /auth, /patients, /sessions to http://127.0.0.1:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

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

  // Audio Chunk Upload
  audio: {
    async uploadChunk(sessionId, audioBlob, chunkNo) {
      const formData = new FormData();
      formData.append("file", audioBlob, `chunk_${chunkNo}.webm`);
      formData.append("chunk_no", chunkNo);

      const res = await apiClient.post(`/sessions/${sessionId}/audio`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
