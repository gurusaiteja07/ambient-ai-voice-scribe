# Ambient AI Voice Scribe - Mobile Extension

A lightweight, high-performance mobile web and PWA application designed for doctors and healthcare workers (ASHA/ANM) conducting outpatient consultations on mobile phones and tablets.

## Key Mobile Capabilities
1. **Zero-Setup Touch Interface**: Clean UI built specifically for smartphones (Android & iOS).
2. **Instant Doctor Sign-In**: Quick credential login with demo account shortcut.
3. **Patient Registration & Vitals**: Record patient demographics (Name, Age, Gender, Phone, ABHA ID) and baseline vitals (BP, Pulse, Temp, SpO2).
4. **1-Tap Ambient Voice Scribe**: Real-time microphone listening in English with speech-to-text directly in the mobile browser.
5. **Instant Clinical SOAP Notes**: Auto-generates structured Chief Complaint, HPI, Diagnosis, Rx Medications, Investigations, Advice, and Follow-up.
6. **ABDM FHIR R4 Approval**: One-tap electronic signature and compliance locking.

## How to Run on Mobile
When the backend server is running (`uvicorn app.main:app --host 0.0.0.0 --port 8000`):
1. Connect your smartphone and computer to the same Wi-Fi network.
2. Open Chrome or Safari on your phone and browse to:
   ```
   http://<YOUR_COMPUTER_IP>:8000/mobile/
   ```
3. Tap **"Add to Home Screen"** to install it as an app icon on your phone!

