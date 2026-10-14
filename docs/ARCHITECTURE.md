# Ambient AI Voice Scribe - System Architecture

Aligned to the **National Health Authority (NHA) Expression of Interest (EOI)** for the *Standalone Voice Scribe* category.

---

## 1. End-to-End Workflow

```
+------------------------------------+
|  Doctor & Patient Consultation     |
|  (English / Hindi / Bengali / ...) |
+-----------------+------------------+
                  | Ambient mic audio chunks (10-30s WebM/Opus)
                  v
+------------------------------------+
|  Frontend (React PWA / Vite)       |
|  - MediaRecorder API               |
|  - Patient Consent Screen          |
|  - Real-time Audio Visualizer      |
+-----------------+------------------+
                  | HTTP POST multipart/form-data
                  v
+------------------------------------+
|  FastAPI Central Controller        |
|  - JWT Authentication              |
|  - Patient MRN / ABHA Linking      |
|  - Session Lifecycle Management    |
+--------+------------------+--------+
         |                  |
         v                  v
+------------------+  +--------------------------------+
| Speech-to-Text   |  | Local / Scalable Storage       |
| (faster-whisper) |  | - SQLite (Dev) / Postgres (Prod)|
| Multi-language   |  | - Audio chunk WAV/WebM files   |
+--------+---------+  +--------------------------------+
         |
         | Ordered transcript chunks
         v
+------------------------------------+
| AI Clinical Summarizer             |
| (Ollama: Llama-3 / Qwen-2.5)       |
| - Fixed zero-hallucination prompt  |
| - Output: Validated SOAP JSON      |
+-----------------+------------------+
                  |
                  v
+------------------------------------+
| Doctor Review & Edit Form          |
| - Doctor reviews extracted note    |
| - Edit fields before approval      |
| - Single-click "Approve & Sign"    |
+-----------------+------------------+
                  |
       +----------+----------+
       |                     |
       v                     v
+--------------+      +-------------------------------+
| PDF Export   |      | ABDM FHIR R4 Bundle           |
| (ReportLab)  |      | - Composition (OP Consult)    |
| Printable Rx |      | - Patient, Practitioner       |
| Document     |      | - MedicationRequest, Condition|
+--------------+      +-------------------------------+
```

---

## 2. ABDM FHIR R4 Bundle Mapping

The generated ABDM bundle adheres to the NRCES India profile standards:

- **Bundle Resource**: `https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle` (type: `document`)
- **Composition Resource**: Profile `https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord`
  - Sections:
    - Chief Complaint (SNOMED CT)
    - Clinical Examination & Diagnosis
    - Medications (Rx)
    - Advice & Follow-Up
- **Patient Resource**: Linked to Ayushman Bharat Health Account (`ABHA_ID`) where available.
- **Practitioner Resource**: Verified doctor details and registration.
- **MedicationRequest Resources**: Individual prescriptions with dosage instructions and duration.

---

## 3. Evaluation Metrics

Per Section 10 of the Project Plan:
1. **Word Error Rate (WER)**: Transcription accuracy across languages (English, Hindi, Bengali).
2. **Clinical Summary Accuracy**: Doctor rating (1-5 scale) and field-level precision vs. manual transcription.
3. **End-to-End Latency**: Stop Consultation -> structured note generation (< 30 seconds).
4. **Doctor Edit Rate**: Percentage of AI-generated fields modified by the clinician before final approval.
