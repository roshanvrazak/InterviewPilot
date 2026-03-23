# backend/app/services/pdf_generator.py
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

class PdfGeneratorService:
    @staticmethod
    def generate_pdf(scorecard_data: dict) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        styles = getSampleStyleSheet()
        
        title_style = styles['Heading1']
        title_style.alignment = 1 # Center
        subtitle_style = styles['Heading2']
        subtitle_style.textColor = colors.HexColor("#2563EB")
        normal_style = styles['Normal']
        
        Story = []
        Story.append(Paragraph("AI Mock Interviewer - Scorecard Report", title_style))
        Story.append(Spacer(1, 12))
        
        overall = scorecard_data.get('overall_score', 'N/A')
        Story.append(Paragraph(f"<b>Overall Score:</b> {overall}/10", subtitle_style))
        Story.append(Spacer(1, 12))
        
        summary = scorecard_data.get('summary', 'No summary provided.')
        Story.append(Paragraph("<b>Summary</b>", subtitle_style))
        Story.append(Paragraph(summary, normal_style))
        Story.append(Spacer(1, 12))
        
        categories = scorecard_data.get('categories', {})
        if categories:
            Story.append(Paragraph("<b>Category Breakdown</b>", subtitle_style))
            for cat_name, cat_data in categories.items():
                score = cat_data.get('score', 'N/A')
                feedback = cat_data.get('feedback', '')
                Story.append(Paragraph(f"<b>{cat_name.replace('_', ' ').title()} ({score}/10):</b> {feedback}", normal_style))
                Story.append(Spacer(1, 6))
        
        # Handle new fields if present
        gap_analysis = scorecard_data.get('gap_analysis', [])
        if gap_analysis:
            Story.append(Paragraph("<b>Gap Analysis</b>", subtitle_style))
            for gap in gap_analysis:
                Story.append(Paragraph(f"• {gap}", normal_style))
            Story.append(Spacer(1, 12))

        tailored_tips = scorecard_data.get('tailored_tips', [])
        if tailored_tips:
            Story.append(Paragraph("<b>Tailored Tips</b>", subtitle_style))
            for tip in tailored_tips:
                Story.append(Paragraph(f"• {tip}", normal_style))
            Story.append(Spacer(1, 12))

        doc.build(Story)
        pdf_value = buffer.getvalue()
        buffer.close()
        return pdf_value
