import uuid
import datetime
from typing import Dict, Any


class FHIRService:
    def create_op_consult_bundle(
        self,
        session_id: str,
        patient_data: Dict[str, Any],
        doctor_data: Dict[str, Any],
        note_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Builds an ABDM-compliant FHIR R4 Document Bundle for Outpatient Consultation Record.
        """
        bundle_id = str(uuid.uuid4())
        composition_id = str(uuid.uuid4())
        patient_resource_id = patient_data.get("id", str(uuid.uuid4()))
        practitioner_resource_id = f"doc-{doctor_data.get('id', '1')}"
        now_iso = datetime.datetime.utcnow().isoformat() + "Z"

        # 1. Composition Resource
        composition = {
            "fullUrl": f"urn:uuid:{composition_id}",
            "resource": {
                "resourceType": "Composition",
                "id": composition_id,
                "meta": {
                    "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord"]
                },
                "status": "final",
                "type": {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "371530004",
                            "display": "Clinical consultation report"
                        }
                    ],
                    "text": "Outpatient Consultation Note"
                },
                "subject": {
                    "reference": f"urn:uuid:{patient_resource_id}",
                    "display": patient_data.get("name", "Unknown Patient")
                },
                "date": now_iso,
                "author": [
                    {
                        "reference": f"urn:uuid:{practitioner_resource_id}",
                        "display": f"Dr. {doctor_data.get('name', 'Consultant')}"
                    }
                ],
                "title": "Prescription & Consultation Note",
                "section": [
                    {
                        "title": "Chief Complaint",
                        "code": {"text": "Chief Complaint"},
                        "text": {
                            "status": "generated",
                            "div": f"<div>{note_data.get('chief_complaint', 'None reported')}</div>"
                        }
                    },
                    {
                        "title": "Clinical Examination & Diagnosis",
                        "code": {"text": "Diagnosis"},
                        "text": {
                            "status": "generated",
                            "div": f"<div>Diagnosis: {note_data.get('diagnosis', 'N/A')}. Exam: {note_data.get('examination', 'N/A')}</div>"
                        }
                    },
                    {
                        "title": "Medications",
                        "code": {"text": "Medications"},
                        "text": {
                            "status": "generated",
                            "div": f"<div>{', '.join([m.get('name', '') for m in note_data.get('medications', [])])}</div>"
                        }
                    },
                    {
                        "title": "Advice & Follow-Up",
                        "code": {"text": "Advice"},
                        "text": {
                            "status": "generated",
                            "div": f"<div>Advice: {note_data.get('advice', 'N/A')}. Follow-up: {note_data.get('follow_up', 'N/A')}</div>"
                        }
                    }
                ]
            }
        }

        # 2. Patient Resource
        patient_resource = {
            "fullUrl": f"urn:uuid:{patient_resource_id}",
            "resource": {
                "resourceType": "Patient",
                "id": patient_resource_id,
                "meta": {
                    "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient"]
                },
                "identifier": [
                    {
                        "type": {"text": "Patient MRN"},
                        "value": str(patient_data.get("id"))
                    }
                ],
                "name": [{"text": patient_data.get("name", "")}],
                "gender": (patient_data.get("gender") or "unknown").lower(),
            }
        }
        if patient_data.get("abha_id"):
            patient_resource["resource"]["identifier"].append({
                "type": {"text": "ABHA ID"},
                "system": "https://healthid.ndhm.gov.in",
                "value": patient_data.get("abha_id")
            })

        # 3. Practitioner Resource
        practitioner_resource = {
            "fullUrl": f"urn:uuid:{practitioner_resource_id}",
            "resource": {
                "resourceType": "Practitioner",
                "id": practitioner_resource_id,
                "name": [{"text": f"Dr. {doctor_data.get('name', '')}"}],
                "qualification": [{"code": {"text": "Registered Medical Practitioner"}}]
            }
        }

        # Build Document Bundle
        entries = [composition, patient_resource, practitioner_resource]

        # Add MedicationRequest resources
        for i, med in enumerate(note_data.get("medications", [])):
            med_id = f"med-{i+1}"
            med_resource = {
                "fullUrl": f"urn:uuid:{med_id}",
                "resource": {
                    "resourceType": "MedicationRequest",
                    "id": med_id,
                    "status": "active",
                    "intent": "order",
                    "medicationCodeableConcept": {"text": med.get("name", "")},
                    "subject": {"reference": f"urn:uuid:{patient_resource_id}"},
                    "dosageInstruction": [
                        {
                            "text": f"{med.get('dose', '')} - {med.get('frequency', '')} for {med.get('duration', '')}"
                        }
                    ]
                }
            }
            entries.append(med_resource)

        bundle = {
            "resourceType": "Bundle",
            "id": bundle_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": now_iso,
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"]
            },
            "identifier": {
                "system": "https://abdm.gov.in/bundles",
                "value": f"SES-BUNDLE-{session_id}"
            },
            "type": "document",
            "timestamp": now_iso,
            "entry": entries
        }

        return bundle


fhir_service = FHIRService()
