import logging
import uuid
import json
import random
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.config import settings
from app.models.rag import Document, DocumentChunk, DocStatus
from app.models.exam import Exam, Question, ExamStatus
from app.schemas.exam import ExamGenerateRequest
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

class ExamService:
    def __init__(self, db: Session):
        self.db = db
        # Initialize Chat Model
        # Reuse settings from RAG module or global settings
        chat_api_key = settings.CHAT_API_KEY
        chat_base_url = settings.CHAT_BASE_URL
        chat_model_name = settings.CHAT_MODEL

        if chat_api_key:
            self.chat_model = ChatOpenAI(
                model=chat_model_name,
                api_key=chat_api_key,
                base_url=chat_base_url,
                temperature=0.3, # Lower temperature for stable JSON output
                max_tokens=4000,
                model_kwargs={"response_format": {"type": "json_object"}}
            )
        else:
            self.chat_model = None
            logger.warning("Chat API Key not set. Exam generation will fail.")

    def create_exam_record(self, request: ExamGenerateRequest, user_id: int) -> Exam:
        """
        Create the initial Exam record with GENERATING status.
        """
        exam = Exam(
            title=request.title,
            description=request.description,
            kb_id=request.kb_id,
            question_count=request.question_count,
            duration=request.duration,
            created_by=user_id,
            status=ExamStatus.GENERATING
        )
        self.db.add(exam)
        self.db.commit()
        self.db.refresh(exam)
        return exam

    def process_exam_generation(self, exam_id: uuid.UUID, kb_id: uuid.UUID, question_count: int, doc_ids: Optional[List[uuid.UUID]] = None):
        """
        The actual heavy lifting of exam generation.
        """
        try:
            # 1. Fetch Content
            # Strategy: Randomly select chunks from the KB to ensure coverage
            
            chunk_query = self.db.query(DocumentChunk).join(Document)\
                .filter(Document.kb_id == kb_id)\
                .filter(Document.status == DocStatus.COMPLETED)
            
            if doc_ids:
                chunk_query = chunk_query.filter(Document.id.in_(doc_ids))
                
            # Count total chunks
            total_chunks = chunk_query.count()
            if total_chunks == 0:
                raise ValueError("No valid content found in the knowledge base.")

            # Sample chunks.
            # We want enough context. Assume each chunk is ~500-1000 chars.
            # We want ~5-10k chars context. So ~10-20 chunks.
            sample_size = min(total_chunks, 20)
            
            # In PostgreSQL, func.random() can be used for random ordering
            chunks = chunk_query.order_by(func.random()).limit(sample_size).all()
            
            context_text = "\n\n".join([f"Source: {c.meta_info.get('source', 'Unknown')}\nContent: {c.content}" for c in chunks])
            
            # 2. Call LLM to generate questions
            questions_data = self._call_llm_generate(context_text, question_count)
            
            # 3. Save Questions
            for q_data in questions_data:
                # Basic validation
                if not q_data.get("content") or not q_data.get("answer"):
                    continue

                # Attempt to find source_doc_id by simple matching snippet to chunk
                source_doc_id = None
                snippet = q_data.get("source_text_snippet", "")
                if snippet:
                     # Find chunk containing this snippet
                     for c in chunks:
                         if snippet in c.content:
                             source_doc_id = c.doc_id  # Fixed: document_id -> doc_id
                             break
                
                question = Question(
                    exam_id=exam_id,
                    content=q_data.get("content"),
                    type=q_data.get("type", "single_choice"),
                    options=q_data.get("options", []),
                    answer=str(q_data.get("answer")),
                    explanation=q_data.get("explanation"),
                    source_doc_id=source_doc_id 
                )
                self.db.add(question)
            
            # 4. Update Exam Status to DRAFT
            # We need to re-fetch the exam because we are in a potentially different session context or just to be safe
            exam = self.db.query(Exam).filter(Exam.id == exam_id).first()
            if exam:
                exam.status = ExamStatus.DRAFT
                self.db.add(exam)
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Exam generation failed: {e}")
            self.db.rollback()
            # Update status to FAILED
            exam = self.db.query(Exam).filter(Exam.id == exam_id).first()
            if exam:
                exam.status = ExamStatus.FAILED
                self.db.add(exam)
                self.db.commit()
            # We don't raise here to avoid crashing the background task, but we logged it.

    def _call_llm_generate(self, context: str, count: int) -> List[Dict]:
        if not self.chat_model:
            raise ValueError("LLM not configured")

        system_prompt = f"""
You are an expert exam question generator. 
Based on the provided text, generate {count} exam questions in Chinese (Simplified).
The questions should test the understanding of the key concepts in the text.

Output Format: JSON object with a key "questions" containing a list of questions.
Each question object must have:
- "content": Question text in Chinese
- "type": One of ["single_choice", "multiple_choice", "true_false"]
- "options": List of objects {{"label": "A", "content": "..."}} (Empty for true_false)
- "answer": Correct answer string (e.g., "A", "A,C", "True")
- "explanation": Brief explanation of the answer in Chinese
- "source_text_snippet": A short snippet from the source text that justifies the answer (to help identify source document)

Ensure the output is valid JSON.
"""
        # Truncate context if too long (approx 20k chars)
        safe_context = context[:20000]
        
        user_prompt = f"""
Generate {count} questions based on the following content:

{safe_context} 
""" 
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = self.chat_model.invoke(messages)
        content = response.content
        
        # Parse JSON
        try:
            # Handle markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            # Attempt to find the first '{' and last '}'
            start = content.find('{')
            end = content.rfind('}') + 1
            if start != -1 and end != -1:
                content = content[start:end]

            data = json.loads(content)
            return data.get("questions", [])
        except json.JSONDecodeError:
            logger.error(f"Failed to parse LLM response: {content}")
            raise ValueError("Failed to generate valid JSON response from AI")

def run_exam_generation_task(exam_id: uuid.UUID, kb_id: uuid.UUID, question_count: int, doc_ids: Optional[List[uuid.UUID]] = None):
    """
    Background task wrapper.
    """
    db = SessionLocal()
    try:
        service = ExamService(db)
        service.process_exam_generation(exam_id, kb_id, question_count, doc_ids)
    finally:
        db.close()
