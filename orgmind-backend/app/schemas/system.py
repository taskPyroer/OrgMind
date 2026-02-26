from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.schemas.base import Page

# --- DictData Schemas ---

class DictDataBase(BaseModel):
    label: str
    value: str
    sort: Optional[int] = 0
    status: Optional[str] = "active"
    remark: Optional[str] = None
    is_default: Optional[bool] = False

class DictDataCreate(DictDataBase):
    dict_type_id: int

class DictDataUpdate(BaseModel):
    label: Optional[str] = None
    value: Optional[str] = None
    sort: Optional[int] = None
    status: Optional[str] = None
    remark: Optional[str] = None
    is_default: Optional[bool] = None

class DictData(DictDataBase):
    id: int
    dict_type_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



# --- Permission Schemas ---

class PermissionBase(BaseModel):
    code: str
    name: str
    type: Optional[str] = "menu"
    parent_id: Optional[int] = None
    sort: Optional[int] = 0

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    parent_id: Optional[int] = None
    sort: Optional[int] = None

class Permission(PermissionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Role Schemas ---

class RoleBase(BaseModel):
    code: str
    name: str
    status: Optional[str] = "active"
    remark: Optional[str] = None

class RoleCreate(RoleBase):
    permission_ids: Optional[List[int]] = []

class RoleUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    status: Optional[str] = None
    remark: Optional[str] = None
    permission_ids: Optional[List[int]] = None

class Role(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    permissions: Optional[List[Permission]] = []

    class Config:
        from_attributes = True

# --- User Schemas ---

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    status: Optional[str] = "active"
    is_superuser: Optional[bool] = False
    employee_id: Optional[int] = None

class UserCreate(UserBase):
    password: str
    role_ids: Optional[List[int]] = []

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    status: Optional[str] = None
    is_superuser: Optional[bool] = None
    employee_id: Optional[int] = None
    password: Optional[str] = None
    role_ids: Optional[List[int]] = None

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    roles: Optional[List[Role]] = []

    class Config:
        from_attributes = True

# --- DictType Schemas ---

class DictTypeBase(BaseModel):
    name: str
    code: str
    status: Optional[str] = "active"
    remark: Optional[str] = None
    is_system: Optional[bool] = False

class DictTypeCreate(DictTypeBase):
    pass

class DictTypeUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    status: Optional[str] = None
    remark: Optional[str] = None
    is_system: Optional[bool] = None

class DictType(DictTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    dict_data: Optional[List[DictData]] = []

    class Config:
        from_attributes = True

# --- Pagination Response Schemas ---

DictTypePage = Page[DictType]
DictDataPage = Page[DictData]
UserPage = Page[User]
RolePage = Page[Role]
PermissionPage = Page[Permission]
