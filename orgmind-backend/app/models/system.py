from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional
from app.db.base import Base

# 关联表：用户-角色
sys_user_role = Table(
    'sys_user_role',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('sys_user.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('sys_role.id'), primary_key=True)
)

# 关联表：角色-权限
sys_role_permission = Table(
    'sys_role_permission',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('sys_role.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('sys_permission.id'), primary_key=True)
)

class User(Base):
    """
    系统用户
    """
    __tablename__ = "sys_user"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, comment="用户ID")
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False, comment="加密密码")
    email: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True, nullable=True, comment="邮箱")
    full_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="全名")
    status: Mapped[str] = mapped_column(String(20), default="active", comment="状态: active-正常, inactive-停用")
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, comment="是否超级管理员")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # 关联职员 (Optional)
    employee_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("oa_employee.id"), nullable=True, comment="关联职员ID")
    
    # Relationships
    roles = relationship("Role", secondary=sys_user_role, back_populates="users")
    employee = relationship("app.models.oa.Employee", backref="sys_user")

class Role(Base):
    """
    角色
    """
    __tablename__ = "sys_role"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, comment="角色ID")
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False, comment="角色编码")
    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="角色名称")
    status: Mapped[str] = mapped_column(String(20), default="active", comment="状态: active-正常, inactive-停用")
    remark: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="备注")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    users = relationship("User", secondary=sys_user_role, back_populates="roles")
    permissions = relationship("Permission", secondary=sys_role_permission, back_populates="roles")

class Permission(Base):
    """
    权限
    """
    __tablename__ = "sys_permission"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, comment="权限ID")
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False, comment="权限编码")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="权限名称")
    type: Mapped[Optional[str]] = mapped_column(String(20), comment="类型: menu-菜单, button-按钮, api-接口")
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("sys_permission.id"), nullable=True, comment="父级权限ID")
    sort: Mapped[int] = mapped_column(Integer, default=0, comment="排序")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    parent = relationship("Permission", remote_side=[id], backref="children")
    roles = relationship("Role", secondary=sys_role_permission, back_populates="permissions")

class DictType(Base):
    """
    字典类型
    """
    __tablename__ = "sys_dict_type"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, comment="字典类型ID")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="字典名称")
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False, comment="字典类型编码")
    status: Mapped[str] = mapped_column(String(20), default="active", comment="状态: active-正常, inactive-停用")
    remark: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, comment="备注")
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, comment="是否系统参数")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship
    dict_data = relationship("DictData", back_populates="dict_type", cascade="all, delete-orphan")

class DictData(Base):
    """
    字典数据
    """
    __tablename__ = "sys_dict_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, comment="字典数据ID")
    dict_type_id: Mapped[int] = mapped_column(Integer, ForeignKey("sys_dict_type.id"), nullable=False, comment="字典类型ID")
    label: Mapped[str] = mapped_column(String(100), nullable=False, comment="字典标签")
    value: Mapped[str] = mapped_column(String(100), nullable=False, comment="字典键值")
    sort: Mapped[int] = mapped_column(Integer, default=0, comment="排序")
    status: Mapped[str] = mapped_column(String(20), default="active", comment="状态: active-正常, inactive-停用")
    remark: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, comment="备注")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, comment="是否默认值")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship
    dict_type = relationship("DictType", back_populates="dict_data")
