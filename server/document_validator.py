import re
from typing import Tuple, List

class DocumentValidator:
    def __init__(self):
        # Legal document keywords and patterns
        self.legal_keywords = [
            'contract', 'agreement', 'terms', 'conditions', 'clause', 'hereby', 
            'whereas', 'party', 'parties', 'legal', 'law', 'court', 'jurisdiction',
            'liability', 'damages', 'breach', 'obligations', 'rights', 'duties',
            'employment', 'lease', 'rental', 'purchase', 'sale', 'confidentiality',
            'non-disclosure', 'nda', 'copyright', 'intellectual property', 'patent',
            'trademark', 'license', 'warranty', 'guarantee', 'indemnity', 'settlement',
            'dispute', 'arbitration', 'mediation', 'executor', 'beneficiary', 'trust',
            'will', 'testament', 'probate', 'divorce', 'custody', 'alimony', 'spouse',
            'defendant', 'plaintiff', 'attorney', 'counsel', 'legal representative',
            'incorporate', 'corporation', 'partnership', 'llc', 'business entity',
            'bylaws', 'articles', 'shareholder', 'stockholder', 'board of directors',
            'merger', 'acquisition', 'securities', 'compliance', 'regulatory',
            'statute', 'ordinance', 'regulation', 'code', 'act', 'bill', 'law',
            'constitutional', 'federal', 'state', 'municipal', 'government'
        ]
        
        # Legal document patterns
        self.legal_patterns = [
            r'\b(this\s+agreement|this\s+contract)\b',
            r'\b(party\s+of\s+the\s+first\s+part|party\s+of\s+the\s+second\s+part)\b',
            r'\b(whereas|now\s+therefore)\b',
            r'\b(in\s+witness\s+whereof)\b',
            r'\b(hereby\s+(agree|covenant|warrant))\b',
            r'\b(subject\s+to\s+the\s+terms)\b',
            r'\b(effective\s+date|execution\s+date)\b',
            r'\b(governing\s+law|applicable\s+law)\b',
            r'\b(force\s+and\s+effect)\b',
            r'\b(null\s+and\s+void)\b',
            r'\b(legal\s+counsel|legal\s+advice)\b',
            r'\b(court\s+of\s+competent\s+jurisdiction)\b'
        ]
        
        # Non-legal document indicators
        self.non_legal_indicators = [
            'recipe', 'cooking', 'ingredients', 'bake', 'cook', 'food', 'meal',
            'story', 'novel', 'chapter', 'fiction', 'character', 'plot',
            'tutorial', 'how-to', 'step by step', 'guide', 'instructions',
            'blog', 'post', 'social media', 'tweet', 'facebook', 'instagram',
            'email', 'message', 'chat', 'conversation', 'text message',
            'shopping list', 'grocery', 'buy', 'purchase list', 'todo',
            'diary', 'journal', 'personal', 'thoughts', 'feelings',
            'homework', 'assignment', 'school', 'student', 'teacher', 'class',
            'poem', 'poetry', 'verse', 'rhyme', 'stanza',
            'manual', 'user guide', 'technical documentation', 'software',
            'code', 'programming', 'function', 'variable', 'class', 'import'
        ]

    def validate_document_content(self, text: str) -> Tuple[bool, str, float]:
        """
        Validate if the document content appears to be legal-related
        
        Returns:
            Tuple[bool, str, float]: (is_valid, reason, confidence_score)
        """
        if not text or len(text.strip()) < 50:
            return False, "Document is too short to analyze", 0.0
        
        text_lower = text.lower()
        words = text_lower.split()
        total_words = len(words)
        
        if total_words < 20:
            return False, "Document is too short to be a legal document", 0.0
        
        # Count legal keywords
        legal_word_count = sum(1 for word in self.legal_keywords if word in text_lower)
        legal_word_ratio = legal_word_count / len(self.legal_keywords)
        
        # Check for legal patterns
        pattern_matches = 0
        for pattern in self.legal_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                pattern_matches += 1
        
        pattern_ratio = pattern_matches / len(self.legal_patterns)
        
        # Check for non-legal indicators
        non_legal_count = sum(1 for indicator in self.non_legal_indicators if indicator in text_lower)
        non_legal_ratio = non_legal_count / len(self.non_legal_indicators)
        
        # Calculate confidence score
        legal_score = (legal_word_ratio * 0.6) + (pattern_ratio * 0.4)
        confidence_score = max(0.0, legal_score - (non_legal_ratio * 0.3))
        
        # Determine if document is likely legal
        if confidence_score >= 0.15:  # Threshold for legal document
            return True, "Document appears to be legal-related", confidence_score
        elif non_legal_ratio > 0.1:  # High non-legal content
            return False, self._get_specific_non_legal_reason(text_lower), confidence_score
        else:
            return False, "Document does not appear to contain legal content", confidence_score
    
    def _get_specific_non_legal_reason(self, text_lower: str) -> str:
        """Get specific reason why document isn't legal"""
        if any(word in text_lower for word in ['recipe', 'cooking', 'ingredients', 'bake']):
            return "This appears to be a recipe or cooking document, not a legal document"
        elif any(word in text_lower for word in ['story', 'novel', 'chapter', 'fiction']):
            return "This appears to be a story or fictional content, not a legal document"
        elif any(word in text_lower for word in ['code', 'function', 'import', 'programming']):
            return "This appears to be source code or technical documentation, not a legal document"
        elif any(word in text_lower for word in ['email', 'message', 'chat', 'conversation']):
            return "This appears to be a personal message or email, not a legal document"
        elif any(word in text_lower for word in ['homework', 'assignment', 'school', 'student']):
            return "This appears to be educational content, not a legal document"
        else:
            return "Document does not appear to contain legal content"

    def get_supported_document_types(self) -> List[str]:
        """Get list of supported legal document types"""
        return [
            "Employment Agreements & Contracts",
            "Non-Disclosure Agreements (NDAs)",
            "Lease & Rental Agreements", 
            "Purchase & Sale Agreements",
            "Service Contracts",
            "Partnership Agreements",
            "Corporate Documents & Bylaws",
            "Licensing Agreements",
            "Terms of Service & Privacy Policies",
            "Settlement Agreements",
            "Wills & Estate Documents",
            "Divorce & Custody Papers",
            "Business Formation Documents",
            "Intellectual Property Agreements",
            "Government Regulations & Statutes"
        ]