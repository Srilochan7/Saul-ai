from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class CriticalClause(BaseModel):
    title: str = Field(..., description="Title of the critical clause")
    description: str = Field(..., description="Detailed description of the clause")

class ValidationInfo(BaseModel):
    is_legal_document: bool = Field(..., description="Whether document is legal")
    confidence_score: float = Field(..., description="Confidence score for validation")
    validation_message: str = Field(..., description="Validation message")

class SummaryResponse(BaseModel):
    full_summary: str = Field(..., description="Complete document summary")
    key_points: List[str] = Field(default_factory=list, description="Key points")
    critical_clauses: List[CriticalClause] = Field(default_factory=list, description="Critical clauses with descriptions")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations")
    validation: Optional[ValidationInfo] = Field(None, description="Document validation info")

class DocumentValidationResponse(BaseModel):
    is_legal_document: bool = Field(..., description="Whether document is legal")
    reason: str = Field(..., description="Validation reason")
    confidence_score: float = Field(..., description="Confidence score")
    supported_types: Optional[List[str]] = Field(None, description="Supported document types")
    text_length: int = Field(..., description="Text length")
    filename: str = Field(..., description="Original filename")