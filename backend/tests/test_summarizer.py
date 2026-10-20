import pytest
from app.services.summarizer import summarizer_service
from app.schemas import StructuredNoteSchema


@pytest.mark.asyncio
async def test_summarizer_schema_valid():
    """Step 9 validation: Summarizer produces valid JSON schema for transcripts."""
    mock_transcript = "Doctor: Kya takleef hai? Patient: Mujhe teen din se tez bukhar aur khasi hai. Doctor: Gala dekhta hoon. Take Paracetamol 650mg TDS for 3 days."
    note = await summarizer_service.summarize_transcript(mock_transcript)

    assert isinstance(note, dict)
    assert "chief_complaint" in note
    assert "symptoms" in note
    assert "medications" in note
    assert "diagnosis" in note

    # Check Pydantic validation passes
    validated = StructuredNoteSchema(**note)
    assert validated.chief_complaint != ""
