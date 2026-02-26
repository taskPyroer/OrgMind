from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, ForeignKey, Date, Boolean, Float, DateTime, Table
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional
from app.db.base import Base

# 职员账号-角色关联表
oa_employee_account_role = Table(
    'oa_employee_account_role',
    Base.metadata,
    Column('employee_account_id', Integer, ForeignKey('oa_employee_account.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('sys_role.id'), primary_key=True)
)

class Department(Base):
    """
    部门模型
    """
    __tablename__ = "oa_department"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, comment="部门ID")
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False, comment="部门名称")
    # 自关联：父级部门
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("oa_department.id"), nullable=True, comment="父级部门ID")
    leader: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="部门负责人")
    code: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, comment="部门代码")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    # children: 子部门列表
    children = relationship("Department", backref="parent", remote_side=[id])
    # employees: 部门下的员工列表
    employees = relationship("Employee", back_populates="department")

class Position(Base):
    """
    岗位模型
    """
    __tablename__ = "oa_position"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, comment="岗位ID")
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False, comment="岗位名称")
    code: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True, comment="岗位编码")
    level: Mapped[int] = mapped_column(Integer, default=1, comment="岗位级别")
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="岗位描述")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # employees: 该岗位下的员工列表
    employees = relationship("Employee", back_populates="position")

class Employee(Base):
    """
    职员模型
    """
    __tablename__ = "oa_employee"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, comment="职员ID")
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False, comment="姓名")
    gender: Mapped[str] = mapped_column(String(10), default="male", comment="性别: male-男, female-女")
    email: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True, comment="邮箱")
    phone: Mapped[Optional[str]] = mapped_column(String(20), index=True, comment="手机号")
    status: Mapped[str] = mapped_column(String(20), default="active", comment="状态: active-在职, left-离职, suspended-停职")
    join_date: Mapped[Optional[Date]] = mapped_column(Date, comment="入职日期")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # 外键关联
    department_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("oa_department.id"), comment="所属部门ID")
    position_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("oa_position.id"), comment="担任岗位ID")
    
    # 关系属性
    department = relationship("Department", back_populates="employees")
    position = relationship("Position", back_populates="employees")
    account = relationship("EmployeeAccount", uselist=False, back_populates="employee", cascade="all, delete-orphan")

class EmployeeAccount(Base):
    """
    职员账号模型（用于职员登录）
    """
    __tablename__ = "oa_employee_account"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, comment="账号ID")
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("oa_employee.id"), unique=True, nullable=False, comment="关联职员ID")
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False, comment="登录用户名")
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False, comment="加密密码")
    status: Mapped[str] = mapped_column(String(20), default="active", comment="状态: active-正常, inactive-停用")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    employee = relationship("Employee", back_populates="account")
    # 使用字符串引用避免循环导入
    roles = relationship("app.models.system.Role", secondary=oa_employee_account_role, backref="employee_accounts")

class SalaryItem(Base):
    """
    薪酬项模型
    """
    __tablename__ = "oa_salary_item"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, comment="薪酬项ID")
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="薪酬项名称")
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, comment="薪酬项代码")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    item_type: Mapped[str] = mapped_column(String(20), default="fixed", comment="类型: fixed-固定, variable-浮动, deduction-扣款")
    is_taxable: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否纳税")
