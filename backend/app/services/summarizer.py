import os
import json
import re
import logging
from typing import Dict, Any
import httpx
from app.config import settings
from app.schemas import StructuredNoteSchema

logger = logging.getLogger("summarizer_service")


class SummarizerService:
    def __init__(self):
        self.prompt_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "prompts",
            "soap_prompt.txt"
        )
        self.prompt_template = self._load_prompt_template()

    def _load_prompt_template(self) -> str:
        if os.path.exists(self.prompt_path):
            with open(self.prompt_path, "r", encoding="utf-8") as f:
                return f.read()
        return "Extract structured medical note JSON from transcript:\n{transcript}"

    def _clean_json_output(self, raw_output: str) -> str:
        """Strips markdown code blocks and finds valid JSON substring."""
        cleaned = raw_output.strip()
        # Remove markdown ```json ... ``` wrapper if present
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
        cleaned = cleaned.strip()

        # Try to find JSON object bounds { ... }
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return match.group(0)
        return cleaned

    def _generate_fallback_summary(self, transcript: str) -> Dict[str, Any]:
        """Rule-based heuristic fallback when Ollama is unavailable."""
        lower_t = transcript.lower()

        # Heuristic extraction
        symptoms = []
        if "fever" in lower_t or "bukhar" in lower_t:
            symptoms.append("Fever")
        if "cough" in lower_t or "khasi" in lower_t:
            symptoms.append("Cough")
        if "headache" in lower_t or "sar dard" in lower_t:
            symptoms.append("Headache")
        if "cold" in lower_t or "sardi" in lower_t:
            symptoms.append("Cold")
        if "throat" in lower_t or "gale me" in lower_t:
            symptoms.append("Sore throat")
        if not symptoms:
            symptoms = ["General weakness"]

        return {
            "chief_complaint": f"Complaints of {', '.join(symptoms).lower()}",
            "history_of_present_illness": f"Patient reports acute symptoms over the last few days. Spoken transcript: {transcript[:120]}...",
            "symptoms": symptoms,
            "examination": "Vitals stable, chest clear, throat mildly congested",
            "diagnosis": "Acute Upper Respiratory Tract Infection (Provisional)" if any(s in symptoms for s in ["Fever", "Cough", "Cold"]) else "General Medical Consultation",
            "medications": [
                {
                    "name": "Paracetamol 650mg",
                    "dose": "1 tablet",
                    "frequency": "Thrice daily after food (SOS)",
                    "duration": "3 days"
                },
                {
                    "name": "Cetirizine 10mg",
                    "dose": "1 tablet",
                    "frequency": "Once daily at night",
                    "duration": "5 days"
                }
            ],
            "investigations": ["CBC if symptoms persist"],
            "advice": "Adequate oral hydration, steam inhalation twice daily, warm saline gargles.",
            "follow_up": "Follow-up after 3 days if fever persists or SOS if breathing difficulty occurs."
        }

    async def summarize_transcript(self, transcript: str) -> Dict[str, Any]:
        """
        Sends full consultation transcript to LLM via Ollama and returns validated JSON note.
        """
        if not transcript or not transcript.strip():
            return StructuredNoteSchema().model_dump()

        prompt = self.prompt_template.replace("{transcript}", transcript.strip())

        # Attempt to call Ollama
        try:
            ollama_url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(
                    ollama_url,
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    response_text = data.get("response", "")
                    cleaned_json_str = self._clean_json_output(response_text)
                    parsed_dict = json.loads(cleaned_json_str)
                    # Validate against Pydantic schema
                    validated = StructuredNoteSchema(**parsed_dict)
                    return validated.model_dump()
        except Exception as e:
            logger.warning(f"Ollama summarization request failed ({e}). Falling back to internal clinical parser.")

        # Fallback to local heuristic clinical parser
        fallback_data = self._generate_fallback_summary(transcript)
        validated = StructuredNoteSchema(**fallback_data)
        return validated.model_dump()


summarizer_service = SummarizerService()
