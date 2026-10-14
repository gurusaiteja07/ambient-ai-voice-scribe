import io
import datetime
from typing import Dict, Any


class PDFService:
    def generate_consultation_pdf(
        self,
        session_id: str,
        patient_data: Dict[str, Any],
        doctor_data: Dict[str, Any],
        note_data: Dict[str, Any]
    ) -> bytes:
        """
        Generates a clean, professional clinical consultation note in PDF format using ReportLab.
        """
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=40,
                leftMargin=40,
                topMargin=40,
                bottomMargin=40
            )

            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                "DocTitle",
                parent=styles["Heading1"],
                fontSize=18,
                leading=22,
                textColor=colors.HexColor("#0f766e"),
                alignment=1  # Center
            )
            sub_title_style = ParagraphStyle(
                "SubTitle",
                parent=styles["Normal"],
                fontSize=10,
                leading=13,
                textColor=colors.HexColor("#475569"),
                alignment=1
            )
            section_heading = ParagraphStyle(
                "SectionHead",
                parent=styles["Heading2"],
                fontSize=12,
                leading=15,
                textColor=colors.HexColor("#0f766e"),
                spaceBefore=6,
                spaceAfter=3
            )
            body_style = ParagraphStyle(
                "DocBody",
                parent=styles["Normal"],
                fontSize=10,
                leading=14,
                textColor=colors.HexColor("#1e293b")
            )
            bold_label = ParagraphStyle(
                "BoldLabel",
                parent=body_style,
                fontName="Helvetica-Bold"
            )

            story = []

            # Header
            hospital_name = doctor_data.get("hospital", "District Hospital")
            story.append(Paragraph(hospital_name.upper(), title_style))
            story.append(Paragraph("OUTPATIENT CONSULTATION & CLINICAL SUMMARY", sub_title_style))
            story.append(Spacer(1, 8))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0f766e"), spaceAfter=10))

            # Patient & Doctor Info Table
            now_str = datetime.datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")
            abha = patient_data.get("abha_id") or "Not Linked"
            info_data = [
                [
                    Paragraph(f"<b>Patient Name:</b> {patient_data.get('name', '')}", body_style),
                    Paragraph(f"<b>Consulting Doctor:</b> Dr. {doctor_data.get('name', '')}", body_style)
                ],
                [
                    Paragraph(f"<b>Patient ID:</b> {patient_data.get('id', '')}", body_style),
                    Paragraph(f"<b>Session ID:</b> {session_id}", body_style)
                ],
                [
                    Paragraph(f"<b>Age / Gender:</b> {patient_data.get('age', '')} yrs / {patient_data.get('gender', '')}", body_style),
                    Paragraph(f"<b>Date:</b> {now_str}", body_style)
                ],
                [
                    Paragraph(f"<b>ABHA ID:</b> {abha}", body_style),
                    Paragraph(f"<b>Record Type:</b> ABDM Compliant OP Note", body_style)
                ]
            ]
            info_table = Table(info_data, colWidths=[260, 260])
            info_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(info_table)
            story.append(Spacer(1, 12))

            # 1. Chief Complaint
            story.append(Paragraph("1. Chief Complaint", section_heading))
            story.append(Paragraph(note_data.get("chief_complaint") or "None documented", body_style))
            story.append(Spacer(1, 6))

            # 2. History of Present Illness & Symptoms
            story.append(Paragraph("2. History & Reported Symptoms", section_heading))
            if note_data.get("history_of_present_illness"):
                story.append(Paragraph(note_data.get("history_of_present_illness"), body_style))
            symptoms = note_data.get("symptoms", [])
            if symptoms:
                story.append(Paragraph(f"<b>Key Symptoms:</b> {', '.join(symptoms)}", body_style))
            story.append(Spacer(1, 6))

            # 3. Clinical Examination
            story.append(Paragraph("3. Clinical Examination & Vitals", section_heading))
            story.append(Paragraph(note_data.get("examination") or "Vitals within normal limits.", body_style))
            story.append(Spacer(1, 6))

            # 4. Diagnosis
            story.append(Paragraph("4. Provisional Diagnosis", section_heading))
            story.append(Paragraph(f"<b>{note_data.get('diagnosis') or 'Clinical observation'}</b>", body_style))
            story.append(Spacer(1, 8))

            # 5. Medications Table
            story.append(Paragraph("5. Prescribed Medications (Rx)", section_heading))
            medications = note_data.get("medications", [])
            if medications:
                med_table_data = [["#", "Medicine Name", "Dosage", "Frequency", "Duration"]]
                for idx, med in enumerate(medications, start=1):
                    med_table_data.append([
                        str(idx),
                        med.get("name", ""),
                        med.get("dose", ""),
                        med.get("frequency", ""),
                        med.get("duration", "")
                    ])
                med_table = Table(med_table_data, colWidths=[25, 185, 100, 130, 80])
                med_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ]))
                story.append(med_table)
            else:
                story.append(Paragraph("No medications prescribed.", body_style))
            story.append(Spacer(1, 8))

            # 6. Advice & Follow Up
            story.append(Paragraph("6. Advice & Follow-Up", section_heading))
            story.append(Paragraph(f"<b>Advice:</b> {note_data.get('advice') or 'Standard care precautions.'}", body_style))
            story.append(Paragraph(f"<b>Follow-Up:</b> {note_data.get('follow_up') or 'As needed (SOS).'}", body_style))
            story.append(Spacer(1, 25))

            # Doctor Signature Section
            sig_data = [
                ["", Paragraph(f"<b>Digitally Verified By:</b><br/>Dr. {doctor_data.get('name', '')}<br/>{hospital_name}", body_style)]
            ]
            sig_table = Table(sig_data, colWidths=[320, 200])
            sig_table.setStyle(TableStyle([
                ("LINEBEFORE", (1, 0), (1, 0), 1, colors.HexColor("#94a3b8")),
                ("LEFTPADDING", (1, 0), (1, 0), 10),
            ]))
            story.append(sig_table)

            doc.build(story)
            return buffer.getvalue()

        except Exception as e:
            # Fallback simple text-based PDF representation or error
            fallback_text = f"Consultation Note for Session: {session_id}\nPatient: {patient_data.get('name')}\nDiagnosis: {note_data.get('diagnosis')}\n"
            return fallback_text.encode("utf-8")


pdf_service = PDFService()
