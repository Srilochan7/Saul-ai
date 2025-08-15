import os
import json
import re
import requests
from typing import Dict, List

class DocumentSummarizer:
    def __init__(self, api_key: str, model: str = None):
        if not api_key:
            raise ValueError("API key is required")
        
        self.api_key = api_key
        self.model = model or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        self.system_prompt = (
            "You are a precise legal document summarizer. "
            "Analyze the document and return ONLY valid JSON with these exact keys:\n"
            "- full_summary: A comprehensive 4-6 paragraph summary\n"
            "- key_points: Array of concise bullet points (5-8 points)\n"
            "- critical_clauses: Array of objects with 'title' and 'description' fields for important legal clauses\n"
            "- recommendations: Array of actionable recommendations (4-6 points)\n\n"
            "Format critical_clauses as: [{'title': 'Clause Name', 'description': 'Detailed explanation of the clause and its implications'}]\n"
            "No commentary, no code fences, only valid JSON."
        )

    def test_connection(self) -> str:
        """Test the API connection"""
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": 'Return JSON: {"test": "connection successful"}'}
        ]
        return self._make_api_call(messages)

    def _force_json(self, s: str) -> dict:
        """Extract and parse JSON from response string"""
        s = s.strip()
        s = re.sub(r"^```(?:json)?\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
        start = s.find("{")
        end = s.rfind("}")
        if start != -1 and end != -1 and end > start:
            s = s[start:end+1]
        
        try:
            return json.loads(s)
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            print(f"Raw response: {s}")
            raise ValueError(f"Failed to parse JSON response: {e}")

    def _make_api_call(self, messages: List[Dict], temperature: float = 0) -> str:
        """Make API call to Groq"""
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "response_format": {"type": "json_object"},
        }
        
        try:
            response = requests.post(
                self.base_url, 
                headers=self.headers, 
                json=payload, 
                timeout=60
            )
            
            if response.status_code == 401:
                raise ValueError(
                    "Invalid Groq API key. Please check your GROQ_API_KEY in .env file. "
                    "Get a new key from https://console.groq.com/keys"
                )
            elif response.status_code == 429:
                raise ValueError("Rate limit exceeded. Please try again later.")
            elif response.status_code == 400:
                error_detail = response.json().get("error", {}).get("message", "Bad request")
                raise ValueError(f"Bad request to Groq API: {error_detail}")
            
            response.raise_for_status()
            
            response_data = response.json()
            if "choices" not in response_data or not response_data["choices"]:
                raise ValueError("No response from Groq API")
                
            return response_data["choices"][0]["message"]["content"]
            
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Failed to connect to Groq API: {str(e)}")

    def _single_pass(self, text: str) -> dict:
        """Process document in single pass"""
        user_prompt = (
            "Analyze this legal document and provide a comprehensive summary. "
            "Focus on identifying key employment terms, salary, benefits, restrictive clauses, "
            "and any provisions that may impact the parties involved.\n\n"
            "Return JSON with:\n"
            "- full_summary: 4-6 paragraph comprehensive analysis\n"
            "- key_points: 5-8 concise bullet points of main terms\n"
            "- critical_clauses: Array of important clauses with titles and detailed descriptions\n"
            "- recommendations: 4-6 actionable recommendations\n\n"
            f"Document:\n{text[:10000]}"
        )
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        
        raw_response = self._make_api_call(messages, temperature=0)
        return self._force_json(raw_response)

    def _chunk_text(self, text: str, max_chars: int = 12000, overlap: int = 500) -> List[str]:
        """Split text into chunks with overlap"""
        if len(text) <= max_chars:
            return [text]
        
        chunks = []
        i = 0
        while i < len(text):
            end = min(i + max_chars, len(text))
            chunk = text[i:end]
            chunks.append(chunk)
            if end == len(text):
                break
            i = end - overlap
        return chunks

    def summarise_document(self, text: str) -> dict:
        """Main function to summarize document"""
        if not text or len(text.strip()) < 50:
            raise ValueError("Text is too short to summarize")
        
        try:
            if len(text) <= 12000:
                return self._single_pass(text)

            # Process in chunks
            chunks = self._chunk_text(text)
            partials = []
            
            for idx, chunk in enumerate(chunks, start=1):
                print(f"Processing chunk {idx}/{len(chunks)}")
                
                messages = [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": (
                        f"Analyze chunk {idx}/{len(chunks)} of a legal document:\n"
                        "Extract key information and return JSON with short lists for "
                        "key_points and critical_clauses, brief full_summary (2-3 sentences), "
                        "and relevant recommendations.\n\n" + chunk
                    )}
                ]
                
                raw_response = self._make_api_call(messages, temperature=0)
                partials.append(self._force_json(raw_response))

            # Combine chunks
            aggregator_messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": (
                    "Combine these partial legal document analyses into one comprehensive summary. "
                    "Create a cohesive full_summary (4-6 paragraphs), merge and deduplicate "
                    "key_points, combine critical_clauses (with titles and descriptions), "
                    "and provide actionable recommendations.\n\n" + 
                    "Partial analyses:\n" + json.dumps(partials, indent=2)
                )}
            ]
            
            combined_response = self._make_api_call(aggregator_messages, temperature=0)
            return self._force_json(combined_response)
            
        except Exception as e:
            print(f"Error in summarise_document: {e}")
            raise