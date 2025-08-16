import io
from pathlib import Path
import fitz  # PyMuPDF
from docx import Document as DocxDocument

def _clean_text(text: str) -> str:
    """Clean and normalize extracted text"""
    # Remove excessive whitespace and normalize
    cleaned = " ".join(text.split())
    # Remove common OCR artifacts
    cleaned = cleaned.replace('\ufffd', ' ')  # Replace replacement characters
    return cleaned.strip()

def extract_text(file_bytes: bytes, filename: str | None = None, content_type: str | None = None) -> str:
    """Extract text from various file formats"""
    if not file_bytes:
        raise ValueError("No file data provided")
    
    # Determine file type
    ext = ""
    if filename:
        ext = Path(filename).suffix.lower().strip()

    try:
        # PDF processing
        if ext == ".pdf" or (content_type and "pdf" in content_type):
            with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                if doc.page_count == 0:
                    raise ValueError("PDF contains no pages")
                
                pages_text = []
                for page in doc:
                    page_text = page.get_text("text")
                    if page_text.strip():
                        pages_text.append(page_text)
                
                full_text = "\n".join(pages_text)
                return _clean_text(full_text)

        # DOCX processing
        elif ext == ".docx" or (content_type and "officedocument.wordprocessingml.document" in content_type):
            buf = io.BytesIO(file_bytes)
            doc = DocxDocument(buf)
            
            paragraphs_text = []
            for paragraph in doc.paragraphs:
                if paragraph.text and paragraph.text.strip():
                    paragraphs_text.append(paragraph.text)
            
            if not paragraphs_text:
                raise ValueError("No text content found in DOCX")
            
            full_text = "\n".join(paragraphs_text)
            return _clean_text(full_text)

        # TXT fallback
        else:
            try:
                text = file_bytes.decode("utf-8")
                return _clean_text(text)
            except UnicodeDecodeError:
                text = file_bytes.decode("latin-1", errors="ignore")
                return _clean_text(text)
                
    except Exception as e:
        raise ValueError(f"Failed to extract text: {str(e)}")