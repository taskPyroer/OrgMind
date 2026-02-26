from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.exam import ExamStatus, QuestionType, ExamResultStatus
from app.schemas.base import Page

# --- Question Schemas ---
class QuestionBase(BaseModel):
    content: str
    type: QuestionType
    options: List[Dict[str, Any]] = []
    answer: str
    explanation: Optional[str] = None
    source_doc_id: Optional[UUID] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionPublic(BaseModel):
    id: UUID
    content: str
    type: QuestionType
    options: List[Dict[str, Any]] = []
    
    class Config:
        from_attributes = True

class Question(QuestionPublic):
    # This is the full detail version (admin/result only)
    exam_id: UUID
    answer: str
    explanation: Optional[str] = None
    source_doc_id: Optional[UUID] = None

# --- Exam Schemas ---
class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    kb_id: UUID
    duration: Optional[int] = None
    pass_score: float = 60.0
    question_count: int = 10

class ExamCreate(ExamBase):
    pass

class QuestionUpdate(BaseModel):
    id: Optional[UUID] = None # If None, it's a new question
    content: Optional[str] = None
    type: Optional[QuestionType] = None
    options: Optional[List[Dict[str, Any]]] = None
    answer: Optional[str] = None
    explanation: Optional[str] = None
    source_doc_id: Optional[UUID] = None

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ExamStatus] = None
    duration: Optional[int] = None
    pass_score: Optional[float] = None
    questions: Optional[List[QuestionUpdate]] = None

class Exam(ExamBase):
    id: UUID
    status: ExamStatus
    created_by: int
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionPublic] = []

    class Config:
        from_attributes = True

class ExamDetail(Exam):
    questions: List[Question] = []

class ExamGenerateRequest(BaseModel):
    kb_id: UUID
    question_count: int = 10
    title: str
    description: Optional[str] = None
    doc_ids: Optional[List[UUID]] = None
    duration: int = 60 # Default duration in minutes

# --- Exam Result Schemas ---
class ExamResultBase(BaseModel):
    exam_id: UUID

class ExamResultCreate(ExamResultBase):
    pass

class ExamSubmitRequest(BaseModel):
    answers: Dict[str, str]

class ExamResult(ExamResultBase):
    id: UUID
    user_id: int
    score: float
    answers: Dict[str, Any]
    status: ExamResultStatus
    start_time: datetime
    submit_time: Optional[datetime]

    class Config:
        from_attributes = True

class QuestionResult(BaseModel):
    question: Question # Full detail
    user_answer: Optional[str]
    is_correct: bool

class ExamResultDetail(ExamResult):
    kb_id: Optional[UUID] = None
    details: List[QuestionResult] = []

class ExamResultListItem(BaseModel):
    id: UUID
    exam_id: UUID
    exam_title: str
    user_name: str
    score: float
    status: ExamResultStatus
    submit_time: Optional[datetime]
    
    class Config:
        from_attributes = True

# --- Pagination Response Schemas ---
ExamPage = Page[Exam]
ExamResultListItemPage = Page[ExamResultListItem]
