from fastapi import APIRouter, UploadFile, File, HTTPException
import fitz  # PyMuPDF
from docx import Document
import io

router = APIRouter()

@router.post("/api/parse-jd")
async def parse_jd(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith(".pdf"):
            doc = fitz.open(stream=content, filetype="pdf")
            text = "\n".join([page.get_text() for page in doc])
            return {"text": text}
        elif filename.endswith(".docx"):
            doc = Document(io.BytesIO(content))
            text = "\n".join([para.text for para in doc.paragraphs])
            return {"text": text}
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")
