import { useState, useRef, useEffect, useCallback } from "react";

export function useRecorder({ onChunkReady, chunkIntervalMs = 8000 }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const chunkCounterRef = useRef(1);
  const recognitionRef = useRef(null);
  const speechBufferRef = useRef("");

  // Clean up audio streams, recognition, and contexts
  const cleanup = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Visualizer loop for real-time mic amplitude
  const updateAudioMeter = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));

    animFrameRef.current = requestAnimationFrame(updateAudioMeter);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setLiveTranscript("");
    speechBufferRef.current = "";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Web Audio API for visualizer
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        updateAudioMeter();
      }

      // Initialize Web Speech API for English Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
              const res = event.results[i];
              if (res.isFinal) {
                final += res[0].transcript + " ";
              } else {
                interim += res[0].transcript;
              }
            }
            if (final) {
              speechBufferRef.current = (speechBufferRef.current + " " + final).trim();
            }
            setLiveTranscript((speechBufferRef.current + " " + interim).trim());
          };

          recognizer.onerror = (e) => {
            console.warn("SpeechRecognition event:", e.error);
          };

          recognizer.onend = () => {
            // Auto restart while recording is active
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              try {
                recognizer.start();
              } catch (e) {}
            }
          };

          recognizer.start();
          recognitionRef.current = recognizer;
        } catch (e) {
          console.warn("Could not start Web Speech Recognition:", e);
        }
      }

      // Pick supported MIME type for MediaRecorder
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "";
      const options = selectedMime ? { mimeType: selectedMime } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunkCounterRef.current = 1;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          const currentChunk = chunkCounterRef.current++;
          const currentSpokenText = speechBufferRef.current.trim();
          // Reset segment buffer for next chunk
          speechBufferRef.current = "";

          if (onChunkReady) {
            onChunkReady(event.data, currentChunk, currentSpokenText);
          }
        }
      };

      recorder.start(chunkIntervalMs);
      setIsRecording(true);
      setDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access failed:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Microphone access was denied. Please allow microphone permissions."
          : `Microphone initialization error: ${err.message}`
      );
    }
  }, [chunkIntervalMs, onChunkReady, updateAudioMeter]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isRecording,
    duration,
    audioLevel,
    liveTranscript,
    error,
    startRecording,
    stopRecording,
  };
}
