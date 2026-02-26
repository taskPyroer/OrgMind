from datetime import timedelta
from typing import Any, Union, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from pydantic import BaseModel

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models import system as models
from app.models import oa

router = APIRouter()


class LoginParams(BaseModel):
    username: str
    password: str
    type: str = "account"
    autoLogin: bool = False


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    old_password: Optional[str] = None


@router.post("/login/account")
def login(
        params: LoginParams,
        db: Session = Depends(deps.get_db)
) -> Any:
    if params.type == "employee":
        stmt = select(oa.EmployeeAccount).where(oa.EmployeeAccount.username == params.username)
        user = db.scalars(stmt).first()
    else:
        stmt = select(models.User).where(models.User.username == params.username)
        user = db.scalars(stmt).first()

    if not user:
        # 出于安全考虑，不暴露用户名是否存在，这里仅返回通用错误状态
        return {
            "status": "error",
            "type": params.type,
            "currentAuthority": "guest",
        }

    # 校验密码
    if not security.verify_password(params.password, str(user.hashed_password)):
        return {
            "status": "error",
            "type": params.type,
            "currentAuthority": "guest",
        }

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    claims = {}
    if params.type == "employee":
        claims["user_type"] = "employee"
        current_authority = "user"  # 职员默认为 user 权限
    else:
        claims["user_type"] = "account"
        current_authority = "admin" if user.is_superuser else "user"

    access_token = security.create_access_token(
        subject=user.id, expires_delta=access_token_expires, claims=claims
    )

    return {
        "status": "ok",
        "type": params.type,
        "currentAuthority": current_authority,
        "token": access_token
    }


@router.post("/login/outLogin")
def logout():
    return {"data": {}, "success": True}


@router.get("/currentUser")
def get_current_user_info(
        current_user: Union[models.User, oa.EmployeeAccount] = Depends(deps.get_current_user),
        db: Session = Depends(deps.get_db)
) -> Any:
    # 重新查询当前用户，并使用预加载避免 N+1 查询问题，确保关联角色和权限一次性加载完成
    # 使用合适的加载策略，避免可能出现的重复记录

    permissions = set()
    is_admin = False
    email = ""
    userid = str(current_user.id)

    if isinstance(current_user, oa.EmployeeAccount):
        # 职员账号
        stmt = select(oa.EmployeeAccount).options(
            joinedload(oa.EmployeeAccount.roles).joinedload(models.Role.permissions)
        ).where(oa.EmployeeAccount.id == current_user.id)
        
        user = db.scalars(stmt).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 职员特定字段
        # 注意：EmployeeAccount 没有直接的 full_name 字段，它在 employee 关联关系中
        # 但我们可能没有预加载 employee。暂时假设使用 username 或者懒加载。
        name = user.username  # 如果已加载，或者使用 user.employee.name
        # 如果可能，尝试获取职员姓名
        if user.employee:
            name = user.employee.name
            email = user.employee.email

        # 来自角色的权限
        for role in user.roles:
            if role.status == 'active':
                for perm in role.permissions:
                    if perm.code:
                        permissions.add(perm.code)

    else:
        # 系统用户
        stmt = select(models.User)
        stmt = stmt.options(
            joinedload(models.User.roles).joinedload(models.Role.permissions)
        )
        stmt = stmt.where(models.User.id == current_user.id)

        user = db.scalars(stmt).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        name = user.full_name or user.username
        email = user.email
        is_admin = user.is_superuser

        for role in user.roles:
            if role.status == 'active':
                if role.code == 'admin':
                    is_admin = True
                for perm in role.permissions:
                    if perm.code:
                        permissions.add(perm.code)

    return {
        "success": True,
        "data": {
            "name": name,
            "avatar": "https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png",
            "userid": userid,
            "email": email,
            "access": "admin" if is_admin else "user",
            "permissions": list(permissions),
        }
    }


@router.put("/currentUser")
def update_current_user_info(
        *,
        db: Session = Depends(deps.get_db),
        item_in: UpdateProfileRequest,
        current_user: Union[models.User, oa.EmployeeAccount] = Depends(deps.get_current_user),
) -> Any:
    """
    更新当前用户信息（包括修改密码）。
    """
    # 处理密码修改
    if item_in.password:
        if not item_in.old_password:
            raise HTTPException(status_code=400, detail="Old password is required to change password")
        if not security.verify_password(item_in.old_password, str(current_user.hashed_password)):
            raise HTTPException(status_code=400, detail="Incorrect old password")
        current_user.hashed_password = security.get_password_hash(item_in.password)

    # 根据用户类型更新其他字段
    if isinstance(current_user, oa.EmployeeAccount):
        # 职员账号 - 更新关联的 Employee 信息
        # 需要重新查询以确保 employee 加载
        stmt = select(oa.EmployeeAccount).where(oa.EmployeeAccount.id == current_user.id)
        user = db.scalars(stmt).first()
        if user and user.employee:
            if item_in.name:
                user.employee.name = item_in.name
            if item_in.email:
                user.employee.email = item_in.email
            if item_in.phone:
                user.employee.phone = item_in.phone
    else:
        # 系统用户
        stmt = select(models.User).where(models.User.id == current_user.id)
        user = db.scalars(stmt).first()
        if user:
            if item_in.name:
                user.full_name = item_in.name
            if item_in.email:
                user.email = item_in.email

    db.commit()
    return {"success": True}
