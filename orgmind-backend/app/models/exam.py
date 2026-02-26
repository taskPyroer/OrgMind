import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, JSON, Boolean, Numeric
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class ExamStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    GENERATING = "generating"
    FAILED = "failed"

class QuestionType(str, enum.Enum):
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"

class Exam(Base):
    __tablename__ = "exam_exam"
    __table_args__ = {'comment': '考试信息表'}
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True, comment='考试ID')
    title: Mapped[str] = mapped_column(String(200), nullable=False, comment='考试标题')
    description: Mapped[Optional[str]] = mapped_column(Text, comment='考试描述')
    
    kb_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rag_knowledge_base.id"), nullable=False, comment='关联知识库ID')
    
    status: Mapped[ExamStatus] = mapped_column(Enum(ExamStatus), default=ExamStatus.DRAFT, comment='状态')
    
    question_count: Mapped[int] = mapped_column(Integer, default=10, comment='题目数量')
    duration: Mapped[int] = mapped_column(Integer, comment='考试时长(分钟)')
    pass_score: Mapped[float] = mapped_column(Numeric(5, 2), default=60.00, comment='及格分数')
    
    created_by: Mapped[int] = mapped_column(Integer, nullable=False, comment='创建人ID')
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    questions: Mapped[List["Question"]] = relationship("Question", back_populates="exam", cascade="all, delete-orphan")
    results: Mapped[List["ExamResult"]] = relationship("ExamResult", back_populates="exam")

class Question(Base):
    __tablename__ = "exam_question"
    __table_args__ = {'comment': '考试题目表'}
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True, comment='题目ID')
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exam_exam.id"), nullable=False, comment='所属考试ID')
    
    content: Mapped[str] = mapped_column(Text, nullable=False, comment='题干内容')
    type: Mapped[QuestionType] = mapped_column(Enum(QuestionType), nullable=False, comment='题目类型')
    
    # [{"label": "A", "content": "Option A"}, ...]
    options: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=[], comment='选项列表') 
    answer: Mapped[str] = mapped_column(String(500), nullable=False, comment='标准答案') # "A" or "A,B" or "True"
    explanation: Mapped[Optional[str]] = mapped_column(Text, comment='答案解析')
    
    source_doc_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, comment='来源文档ID')
    
    exam: Mapped["Exam"] = relationship("Exam", back_populates="questions")

class ExamResultStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class ExamResult(Base):
    __tablename__ = "exam_result"
    __table_args__ = {'comment': '考试记录表'}
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True, comment='记录ID')
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exam_exam.id"), nullable=False, comment='考试ID')
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, comment='考生ID')
    user_type: Mapped[str] = mapped_column(String(50), default="sys_user", comment='用户类型: sys_user, employee')
    
    score: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, comment='得分')
    # {question_id: answer_value}
    answers: Mapped[Dict[str, Any]] = mapped_column(JSON, default={}, comment='考生答案') 
    
    status: Mapped[ExamResultStatus] = mapped_column(Enum(ExamResultStatus), default=ExamResultStatus.IN_PROGRESS, comment='状态')
    
    start_time: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), comment='开始时间')
    submit_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, comment='交卷时间')
    
    exam: Mapped["Exam"] = relationship("Exam", back_populates="results")
