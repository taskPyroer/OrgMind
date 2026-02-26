from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api import deps
from app.core import security
from app.models import oa as oa_models
from app.models import system as system_models
from app.schemas import oa as oa_schemas
from app.utils.response import create_page_response

router = APIRouter()


@router.get("/", response_model=oa_schemas.EmployeeAccountPage)
def read_employee_accounts(
        db: Session = Depends(deps.get_db),
        current: int = 1,
        pageSize: int = 10,
        keyword: str = None,
        status: str = None,
        current_user: system_models.User = Depends(deps.get_current_active_user)
) -> Any:
    query = db.query(oa_models.EmployeeAccount).join(oa_models.EmployeeAccount.employee)

    if keyword:
        query = query.filter(
            or_(
                oa_models.EmployeeAccount.username.ilike(f"%{keyword}%"),
                oa_models.Employee.name.ilike(f"%{keyword}%")
            )
        )
    if status:
        query = query.filter(oa_models.EmployeeAccount.status == status)

    total = query.count()
    accounts = query.offset((current - 1) * pageSize).limit(pageSize).all()

    return create_page_response(accounts, total, current, pageSize)


@router.post("/", response_model=oa_schemas.EmployeeAccount)
def create_employee_account(
        *,
        db: Session = Depends(deps.get_db),
        item_in: oa_schemas.EmployeeAccountCreate,
        current_user: system_models.User = Depends(deps.get_current_active_user),
) -> Any:
    # 检查职员是否存在
    employee = db.query(oa_models.Employee).filter(oa_models.Employee.id == item_in.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # 检查该职员是否已存在账号
    existing_account = db.query(oa_models.EmployeeAccount).filter(
        oa_models.EmployeeAccount.employee_id == item_in.employee_id).first()
    if existing_account:
        raise HTTPException(status_code=400, detail="Account already exists for this employee")

    # 检查用户名唯一性
    existing_username = db.query(oa_models.EmployeeAccount).filter(
        oa_models.EmployeeAccount.username == item_in.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already registered")

    # 创建账号
    db_obj = oa_models.EmployeeAccount(
        employee_id=item_in.employee_id,
        username=item_in.username,
        hashed_password=security.get_password_hash(item_in.password),
        status=item_in.status
    )

    # 添加角色
    if item_in.role_ids:
        roles = db.query(system_models.Role).filter(system_models.Role.id.in_(item_in.role_ids)).all()
        db_obj.roles = roles

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@router.put("/{id}", response_model=oa_schemas.EmployeeAccount)
def update_employee_account(
        *,
        db: Session = Depends(deps.get_db),
        id: int,
        item_in: oa_schemas.EmployeeAccountUpdate,
        current_user: system_models.User = Depends(deps.get_current_active_user),
) -> Any:
    account = db.query(oa_models.EmployeeAccount).filter(oa_models.EmployeeAccount.id == id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if item_in.status:
        account.status = item_in.status

    if item_in.password:
        account.hashed_password = security.get_password_hash(item_in.password)

    if item_in.role_ids is not None:
        roles = db.query(system_models.Role).filter(system_models.Role.id.in_(item_in.role_ids)).all()
        account.roles = roles

    db.commit()
    db.refresh(account)
    return account


@router.post("/{id}/reset-password", response_model=oa_schemas.EmployeeAccount)
def reset_password(
        *,
        db: Session = Depends(deps.get_db),
        id: int,
        item_in: oa_schemas.EmployeeAccountPasswordReset,
        current_user: system_models.User = Depends(deps.get_current_active_user),
) -> Any:
    account = db.query(oa_models.EmployeeAccount).filter(oa_models.EmployeeAccount.id == id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    account.hashed_password = security.get_password_hash(item_in.new_password)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{id}", response_model=oa_schemas.EmployeeAccount)
def delete_employee_account(
        *,
        db: Session = Depends(deps.get_db),
        id: int,
        current_user: system_models.User = Depends(deps.get_current_active_user),
) -> Any:
    account = db.query(oa_models.EmployeeAccount).filter(oa_models.EmployeeAccount.id == id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    response = oa_schemas.EmployeeAccount.model_validate(account)
    db.delete(account)
    db.commit()
    return response
