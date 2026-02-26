from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime

from app.schemas.system import Role
from app.schemas.base import Page

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    leader: Optional[str] = None
    code: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(DepartmentBase):
    pass

class Department(DepartmentBase):
    id: int
    # 移除 children 和 parent 以避免递归查询和序列化开销
    
    class Config:
        from_attributes = True

# Position Schemas
class PositionBase(BaseModel):
    name: str
    code: Optional[str] = None
    level: Optional[int] = 1
    description: Optional[str] = None

class PositionCreate(PositionBase):
    pass

class PositionUpdate(PositionBase):
    pass

class Position(PositionBase):
    id: int
    class Config:
        from_attributes = True

# Employee Schemas
class EmployeeBase(BaseModel):
    name: str
    gender: Optional[str] = "male"
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = "active"
    join_date: Optional[date] = None
    department_id: Optional[int] = None
    position_id: Optional[int] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int
    department: Optional[Department] = None
    position: Optional[Position] = None
    
    class Config:
        from_attributes = True

# SalaryItem Schemas
class SalaryItemBase(BaseModel):
    name: str
    code: str
    item_type: Optional[str] = "fixed"
    is_taxable: Optional[bool] = True

class SalaryItemCreate(SalaryItemBase):
    pass

class SalaryItemUpdate(SalaryItemBase):
    pass

class SalaryItem(SalaryItemBase):
    id: int
    class Config:
        from_attributes = True

# EmployeeAccount Schemas
class EmployeeAccountBase(BaseModel):
    username: str
    status: Optional[str] = "active"
    employee_id: int

class EmployeeAccountCreate(EmployeeAccountBase):
    password: str
    role_ids: Optional[List[int]] = []

class EmployeeAccountUpdate(BaseModel):
    status: Optional[str] = None
    password: Optional[str] = None
    role_ids: Optional[List[int]] = None

class EmployeeAccountPasswordReset(BaseModel):
    new_password: str

class EmployeeAccount(EmployeeAccountBase):
    id: int
    employee: Optional[Employee] = None
    roles: List[Role] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Pagination Response Schemas ---
DepartmentPage = Page[Department]
PositionPage = Page[Position]
EmployeePage = Page[Employee]
EmployeeAccountPage = Page[EmployeeAccount]
SalaryItemPage = Page[SalaryItem]
