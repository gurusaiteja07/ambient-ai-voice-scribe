import pytest
from app.services.stt_service import stt_service


def test_stt_service_initialization():
    """Validates that STT service initializes properly."""
    assert stt_service is not None
    # Test handling of non-existent audio file
    with pytest.raises(FileNotFoundError):
        stt_service.transcribe_audio_file("non_existent_audio.wav")
