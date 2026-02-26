from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.rag import Visibility, DocStatus

# --- Common Schemas ---
class CreatorInfo(BaseModel):
    id: int
    name: str
    username: Optional[str] = None
    type: str
from app.schemas.oa import Department
from app.schemas.base import Page

# --- Knowledge Base Schemas ---
class KnowledgeBaseBase(BaseModel):
    name: str
    description: Optional[str] = None
    # department_id: Optional[int] = None # Deprecated
    visibility: Visibility = Visibility.PRIVATE
    visible_department_ids: List[int] = [] # 支持多选部门

class KnowledgeBaseCreate(KnowledgeBaseBase):
    pass

class KnowledgeBaseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    # department_id: Optional[int] = None
    visibility: Optional[Visibility] = None
    visible_department_ids: Optional[List[int]] = None

class KnowledgeBase(KnowledgeBaseBase):
    id: UUID
    owner_id: int
    created_at: datetime
    updated_at: datetime
    
    # 重新定义以覆盖 Base 中的默认值，确保输出时有值
    visible_department_ids: List[int] = []
    visible_departments: List[Department] = []
    
    creator: Optional[CreatorInfo] = Field(default=None, validation_alias="creator_info")

    class Config:
        from_attributes = True




KnowledgeBasePage = Page[KnowledgeBase]

# --- Document Schemas ---
class DocumentBase(BaseModel):
    title: str
    content: Optional[str] = None
    parent_id: Optional[UUID] = None
    is_folder: bool = False

class DocumentCreate(DocumentBase):
    kb_id: UUID

class FolderCreate(BaseModel):
    title: str
    kb_id: UUID
    parent_id: Optional[UUID] = None

class Document(DocumentBase):
    id: UUID
    kb_id: UUID
    storage_path: Optional[str]
    file_name: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    chunk_count: int
    status: DocStatus
    error_msg: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    creator: Optional[CreatorInfo] = Field(default=None, validation_alias="creator_info")

    class Config:
        from_attributes = True

DocumentPage = Page[Document]

# --- RAG/Chat Schemas ---
class ChatQuery(BaseModel):
    question: str
    kb_ids: List[UUID] = [] # Optional filter
    history: List[dict] = [] # Optional chat history
    source: str = "portal" # internal or portal

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict] # [{title, content, score}]

class ChatHistoryBase(BaseModel):
    question: str
    answer: str
    kb_id: Optional[UUID] = None
    source_platform: Optional[str] = None
    ip_address: Optional[str] = None
    ip_location: Optional[str] = None

class ChatHistoryCreate(ChatHistoryBase):
    pass

class ChatHistory(ChatHistoryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

ChatHistoryPage = Page[ChatHistory]

