import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, TYPE_CHECKING
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, JSON, Table, and_, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column, backref
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.db.base import Base

from app.models.system import User
from app.models.oa import EmployeeAccount

if TYPE_CHECKING:
    from app.models.oa import Department

# 知识库-部门可见性关联表
rag_kb_department_visibility = Table(
    'rag_kb_department_visibility',
    Base.metadata,
    Column('kb_id', UUID(as_uuid=True), ForeignKey('rag_knowledge_base.id'), primary_key=True, comment='知识库ID'),
    Column('department_id', Integer, ForeignKey('oa_department.id'), primary_key=True, comment='可见部门ID')
)


class Visibility(str, enum.Enum):
    PRIVATE = "private"
    DEPARTMENT = "department"
    PUBLIC = "public"


class DocStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class KnowledgeBase(Base):
    """
    知识库表
    """
    __tablename__ = "rag_knowledge_base"
    __table_args__ = {'comment': '知识库信息表'}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True, comment='知识库ID')
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment='知识库名称')
    description: Mapped[Optional[str]] = mapped_column(String(500), comment='知识库描述')
    owner_id: Mapped[int] = mapped_column(Integer, nullable=False, comment='所有者ID')
    owner_type: Mapped[str] = mapped_column(String(20), default="user", comment='所有者类型: user/employee')
    # 权限控制核心：绑定部门，后续可扩展为多对多 Group
    department_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("oa_department.id"), nullable=True, comment='所属部门ID')
    visibility: Mapped[Visibility] = mapped_column(Enum(Visibility), default=Visibility.PRIVATE, comment='可见性(private/department/public)')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    documents: Mapped[List["Document"]] = relationship("Document", back_populates="knowledge_base", cascade="all, delete-orphan")

    # Polymorphic-like relationships
    owner_user: Mapped[Optional["User"]] = relationship("app.models.system.User",
                              primaryjoin=lambda: and_(KnowledgeBase.owner_id == User.id,
                                                       KnowledgeBase.owner_type == 'user'),
                              foreign_keys=[owner_id],
                              uselist=False,
                              viewonly=True)

    owner_employee: Mapped[Optional["EmployeeAccount"]] = relationship("app.models.oa.EmployeeAccount",
                                  primaryjoin=lambda: and_(KnowledgeBase.owner_id == EmployeeAccount.id,
                                                           KnowledgeBase.owner_type == 'employee'),
                                  foreign_keys=[owner_id],
                                  uselist=False,
                                  viewonly=True)

    @property
    def owner(self):
        if self.owner_type == 'employee':
            return self.owner_employee
        return self.owner_user

    @property
    def creator_info(self):
        info = {"id": self.owner_id, "type": self.owner_type, "name": "Unknown", "username": None}
        obj = self.owner
        if obj:
            info['username'] = obj.username
            if self.owner_type == 'user':
                info['name'] = obj.full_name or obj.username
            elif self.owner_type == 'employee':
                if obj.employee:
                    info['name'] = obj.employee.name
                else:
                    info['name'] = obj.username
        return info

    department: Mapped[Optional["Department"]] = relationship("app.models.oa.Department")

    # 多对多：可见部门列表
    visible_departments: Mapped[List["Department"]] = relationship("app.models.oa.Department", secondary=rag_kb_department_visibility,
                                       backref="visible_kbs")

    @property
    def visible_department_ids(self):
        return [dept.id for dept in self.visible_departments]


class Document(Base):
    """
    文档表
    """
    __tablename__ = "rag_document"
    __table_args__ = {'comment': '知识库文档表'}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True, comment='文档ID')
    kb_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rag_knowledge_base.id"), nullable=False, comment='所属知识库ID')
    title: Mapped[str] = mapped_column(String(200), nullable=False, comment='文档标题')
    content: Mapped[Optional[str]] = mapped_column(Text, comment='文档原始内容(Markdown格式)')  # 原始内容 (Markdown格式)

    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("rag_document.id"), nullable=True, comment='父文档ID(文件夹ID)')
    is_folder: Mapped[bool] = mapped_column(Boolean, default=False, comment='是否为文件夹')

    # 存储信息
    storage_path: Mapped[Optional[str]] = mapped_column(String(500), comment='存储路径/Key')  # 存储服务中的Key/Path
    file_name: Mapped[Optional[str]] = mapped_column(String(200), comment='原始文件名')  # 原始文件名
    file_size: Mapped[Optional[int]] = mapped_column(Integer, comment='文件大小(字节)')  # 字节数
    file_hash: Mapped[Optional[str]] = mapped_column(String(64), index=True, comment='文件哈希值(SHA256)')  # SHA256 Hash，用于去重
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), comment='MIME类型')

    chunk_count: Mapped[int] = mapped_column(Integer, default=0, comment='切片数量')
    status: Mapped[DocStatus] = mapped_column(Enum(DocStatus), default=DocStatus.PENDING, comment='处理状态(pending/processing/completed/failed)')
    error_msg: Mapped[Optional[str]] = mapped_column(Text, comment='错误信息')

    # 创建者信息
    creator_id: Mapped[int] = mapped_column(Integer, nullable=False, comment='创建者ID')
    creator_type: Mapped[str] = mapped_column(String(20), default="user", comment='创建者类型: user/employee')

    # 存储文档级元数据（如作者、来源URL、转换配置等），对标 PandaWiki 的 Metadata
    meta_info: Mapped[Dict[str, Any]] = mapped_column(JSON, default={}, comment='元数据信息')

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    knowledge_base: Mapped["KnowledgeBase"] = relationship("KnowledgeBase", back_populates="documents")
    chunks: Mapped[List["DocumentChunk"]] = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    children: Mapped[List["Document"]] = relationship("Document", backref=backref("parent", remote_side=[id]), cascade="all, delete-orphan")

    creator_user: Mapped[Optional["User"]] = relationship("app.models.system.User",
                                primaryjoin=lambda: and_(Document.creator_id == User.id,
                                                         Document.creator_type == 'user'),
                                foreign_keys=[creator_id],
                                uselist=False,
                                viewonly=True)

    creator_employee: Mapped[Optional["EmployeeAccount"]] = relationship("app.models.oa.EmployeeAccount",
                                    primaryjoin=lambda: and_(Document.creator_id == EmployeeAccount.id,
                                                             Document.creator_type == 'employee'),
                                    foreign_keys=[creator_id],
                                    uselist=False,
                                    viewonly=True)

    @property
    def creator(self):
        if self.creator_type == 'employee':
            return self.creator_employee
        return self.creator_user

    @property
    def creator_info(self):
        info = {"id": self.creator_id, "type": self.creator_type, "name": "Unknown", "username": None}
        obj = self.creator
        if obj:
            info['username'] = obj.username
            if self.creator_type == 'user':
                info['name'] = obj.full_name or obj.username
            elif self.creator_type == 'employee':
                if obj.employee:
                    info['name'] = obj.employee.name
                else:
                    info['name'] = obj.username
        return info


class DocumentChunk(Base):
    """
    向量切片表，对应 PandaWiki 依赖的 RAGLite 中的 Chunk 概念。
    实现了‘存算一体’（数据和向量在同一数据库），利用 pgvector 进行检索。
    """
    __tablename__ = "rag_document_chunk"
    __table_args__ = {'comment': '文档向量切片表'}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, comment='切片ID')
    doc_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rag_document.id"), nullable=False, comment='所属文档ID')

    content: Mapped[str] = mapped_column(Text, nullable=False, comment='切片文本内容')  # 切片文本
    chunk_index: Mapped[Optional[int]] = mapped_column(Integer, comment='切片索引顺序')  # 在原文档中的顺序

    # 向量字段，使用外部模型 bge-m3 (1024维)
    # 需根据实际模型调整
    embedding: Mapped[Optional[List[float]]] = mapped_column(Vector(1024), comment='向量数据(1024维)')

    # 切片级元数据，用于 RAG 检索时的精确过滤（如 page_number, section_name）
    meta_info: Mapped[Dict[str, Any]] = mapped_column(JSON, default={}, comment='切片元数据')

    document: Mapped["Document"] = relationship("Document", back_populates="chunks")


class ChatHistory(Base):
    """
    对话历史表
    """
    __tablename__ = "rag_chat_history"
    __table_args__ = {'comment': 'RAG对话历史记录表'}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, comment='记录ID')
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("sys_user.id"), nullable=False, comment='用户ID')
    kb_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("rag_knowledge_base.id"), nullable=True,
                   comment='关联知识库ID')  # Optional context
    question: Mapped[str] = mapped_column(Text, nullable=False, comment='用户提问')
    answer: Mapped[str] = mapped_column(Text, nullable=False, comment='AI回答')
    source_platform: Mapped[str] = mapped_column(String(50), default='portal', comment='来源平台: internal/portal')
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment='来源IP')
    ip_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment='IP地理位置')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("app.models.system.User")
    knowledge_base: Mapped[Optional["KnowledgeBase"]] = relationship("KnowledgeBase")
