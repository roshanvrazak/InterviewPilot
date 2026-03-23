# backend/app/routers/pdf_export.py
from fastapi import APIRouter, Response
from pydantic import BaseModel
from app.services.pdf_generator import PdfGeneratorService

router = APIRouter()

class ScorecardPayload(BaseModel):
    scorecard: dict

@router.post("/api/export-pdf")
async def export_pdf(payload: ScorecardPayload):
    try:
        pdf_bytes = PdfGeneratorService.generate_pdf(payload.scorecard)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=mock_interview_scorecard.pdf"}
        )
    except Exception as e:
        return Response(content=str(e), status_code=500)
