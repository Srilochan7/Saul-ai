import fitz  # PyMuPDF
import logging
import re
import os
import google.generativeai as genai
import json
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Load keys from env
GEMINI_KEYS = [
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2")
]


class PDFProcessor:
    @staticmethod
    def extract_clean_text(file_path: str) -> str:
        all_text = []
        try:
            with fitz.open(file_path) as doc:
                for page in doc:
                    text = page.get_text("text")
                    if text.strip():
                        all_text.append(text.strip())
                    else:
                        blocks = page.get_text("blocks")
                        page_height = page.rect.height
                        clean_blocks = []

                        for block in blocks:
                            if len(block) >= 5:
                                x0, y0, x1, y1, text = block[:5]
                                if (
                                    y0 < 50
                                    or page_height - y1 < 50
                                    or text.strip().isdigit()
                                ):
                                    continue
                                if len(text.strip()) > 3:
                                    clean_blocks.append(" ".join(text.split()))

                        if clean_blocks:
                            all_text.append("\n".join(clean_blocks))

            full_text = "\n\n".join(all_text).strip()
            full_text = re.sub(r"\s+", " ", full_text)
            full_text = re.sub(r"\n\s*\n", "\n\n", full_text)

            logger.info(f"Extracted text length: {len(full_text)} characters")
            logger.info(f"Text preview: {full_text[:300]}...")

            return full_text

        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            raise RuntimeError(f"PDF parsing failed: {e}")


class LegalDocumentValidator:
    LEGAL_KEYWORDS = [
        "agreement",
        "contract",
        "terms",
        "conditions",
        "party",
        "parties",
        "whereas",
        "therefore",
        "hereby",
        "consideration",
        "covenant",
        "termination",
        "breach",
        "liability",
        "confidential",
        "employment",
        "lease",
        "purchase",
        "license",
        "shall",
        "binding",
        "governing law",
    ]

    @classmethod
    def is_legal_document(cls, text: str) -> bool:
        if not text or len(text.split()) < 100:
            return False
        text_lower = text.lower()
        keyword_count = sum(
            1 for keyword in cls.LEGAL_KEYWORDS if keyword in text_lower
        )
        return keyword_count >= 5


class LegalDocumentAnalyzer:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    def analyze_document(self, text: str) -> Dict[str, Any]:
        logger.info("Starting Gemini AI document analysis...")

        try:
            prompt = self._create_analysis_prompt(text)
            response = self.model.generate_content(prompt)
            result = self._parse_gemini_response(response.text)
            logger.info("Gemini AI analysis completed successfully")
            return result

        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return self._fallback_analysis(text)

    def _create_analysis_prompt(self, text: str) -> str:
        return f"""
You are a legal document analysis expert. Analyze the following legal document and return ONLY valid JSON in this exact structure:

{{
  "key_points": [
    "5-6 most important points from the document"
  ],
  "critical_clauses": {{
    "Clause Name": "Detailed explanation of this clause and its implications"
  }},
  "summary": "3-4 paragraph summary of the document with actual details",
  "recommendations": [
    "5-6 actionable recommendations"
  ],
  "actions": [
    "Download Summary",
    "Analyze Another Document"
  ]
}}

Requirements:
1. Extract ACTUAL information from the document text, not generic examples
2. If salary/compensation is mentioned, include the actual amounts
3. If specific positions/roles are mentioned, use those exact terms
4. Identify the actual document type (employment agreement, NDA, lease, etc.)
5. Focus on specific clauses, terms, and obligations in the document
6. Provide practical, actionable recommendations based on the content
7. Return only valid JSON, no other text

Document Text:
{text[:8000]}
"""

    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        try:
            response_text = response_text.strip()

            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]

            result = json.loads(response_text.strip())

            # Ensure actions always exist
            if "actions" not in result:
                result["actions"] = ["Download Summary", "Analyze Another Document"]

            result["originalFileName"] = "uploaded_document.pdf"
            result["uploadedAt"] = datetime.now().isoformat()

            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response: {e}")
            logger.error(f"Response was: {response_text[:500]}...")
            raise ValueError("Invalid response format from AI")

    def _fallback_analysis(self, text: str) -> Dict[str, Any]:
        logger.info("Using fallback analysis")

        text_lower = text.lower()
        if "employment" in text_lower:
            doc_type = "Employment Agreement"
        elif "non-disclosure" in text_lower or "nda" in text_lower:
            doc_type = "Non-Disclosure Agreement"
        else:
            doc_type = "Legal Agreement"

        return {
            "key_points": [
                "Legal document requiring careful review",
                "Contains binding obligations and terms",
                "Professional legal advice recommended",
                "Review all terms before signing",
                "Understand your rights and obligations",
            ],
            "critical_clauses": {
                "Terms and Conditions": "This document contains important legal terms that create binding obligations.",
                "Legal Review Required": "Professional legal review is recommended before signing.",
            },
            "summary": f"This {doc_type.lower()} contains important legal terms and obligations. Due to technical limitations, a detailed AI analysis could not be completed. Please have this document reviewed by a qualified attorney.",
            "recommendations": [
                "Have a qualified attorney review this document",
                "Understand all terms and obligations",
                "Clarify any unclear provisions",
                "Consider negotiating unfavorable terms",
                "Ensure all information is accurate",
                "Keep copies of all signed documents",
            ],
            "actions": ["Download Summary", "Analyze Another Document"],
            "originalFileName": "uploaded_document.pdf",
            "uploadedAt": datetime.now().isoformat(),
        }


async def process_legal_document(file_path: str) -> Dict[str, Any]:
    try:
        processor = PDFProcessor()
        text = processor.extract_clean_text(file_path)

        if not text.strip():
            raise ValueError("No readable text found in PDF")

        validator = LegalDocumentValidator()
        if not validator.is_legal_document(text):
            raise ValueError("Document does not appear to be a legal document")

        analyzer = LegalDocumentAnalyzer()
        result = analyzer.analyze_document(text)

        logger.info("Document analysis completed successfully")
        return result

    except Exception as e:
        logger.error(f"Error processing document: {e}")
        raise