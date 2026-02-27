from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import io
import os
from datetime import datetime


def generate_application_pdf(application) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    # Title
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontSize=20,
        spaceAfter=12,
        alignment=TA_CENTER,
    )
    elements.append(Paragraph("BAIKAL Grant AI - 신청서", title_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1a56db")))
    elements.append(Spacer(1, 0.5 * cm))

    # Receipt info
    info_style = ParagraphStyle("Info", parent=styles["Normal"], fontSize=10)
    elements.append(Paragraph(f"<b>접수번호:</b> {application.application_number or 'N/A'}", info_style))
    elements.append(Paragraph(f"<b>신청일:</b> {application.submission_date.strftime('%Y-%m-%d %H:%M') if application.submission_date else '-'}", info_style))
    elements.append(Paragraph(f"<b>상태:</b> {application.status}", info_style))
    elements.append(Spacer(1, 0.5 * cm))

    # Answers table
    if application.answers:
        elements.append(Paragraph("<b>신청 내용</b>", styles["Heading2"]))
        elements.append(Spacer(1, 0.3 * cm))

        table_data = [["항목", "내용"]]
        for answer in application.answers:
            field_label = answer.field.label if hasattr(answer, 'field') and answer.field else f"Field {answer.field_id}"
            value = answer.value or (str(answer.value_json) if answer.value_json else "-")
            table_data.append([field_label, value])

        table = Table(table_data, colWidths=[5 * cm, 12 * cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a56db")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, 0), 11),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
        ]))
        elements.append(table)

    elements.append(Spacer(1, 1 * cm))

    # Footer
    footer_style = ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    elements.append(Spacer(1, 0.3 * cm))
    elements.append(Paragraph(f"본 문서는 BAIKAL Grant AI 시스템에서 자동 생성되었습니다. 생성일시: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", footer_style))

    doc.build(elements)
    return buffer.getvalue()
