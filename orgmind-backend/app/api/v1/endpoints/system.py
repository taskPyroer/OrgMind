from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models import system as models
from app.schemas import system as schemas
from app.core import security

from app.utils.response import create_page_response


router = APIRouter()


# --- 字典类型 ---

@router.post("/dict-types/", response_model=schemas.DictType)
def create_dict_type(
        dict_type: schemas.DictTypeCreate,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    db_obj = db.query(models.DictType).filter(models.DictType.code == dict_type.code).first()
    if db_obj:
        raise HTTPException(status_code=400, detail="Dict type code already exists")

    db_item = models.DictType(**dict_type.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/dict-types/", response_model=schemas.DictTypePage)
def read_dict_types(
        current: int = 1,
        pageSize: int = 20,
        name: Optional[str] = None,
        code: Optional[str] = None,
        status: Optional[str] = None,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    query = db.query(models.DictType)
    if name:
        query = query.filter(models.DictType.name.like(f"%{name}%"))
    if code:
        query = query.filter(models.DictType.code.like(f"%{code}%"))
    if status:
        query = query.filter(models.DictType.status == status)

    total = query.count()
    items = query.offset((current - 1) * pageSize).limit(pageSize).all()
    return create_page_response(items, total, current, pageSize)


@router.put("/dict-types/{type_id}", response_model=schemas.DictType)
def update_dict_type(
        type_id: int,
        type_in: schemas.DictTypeUpdate,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    item = db.query(models.DictType).filter(models.DictType.id == type_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Dict type not found")

    update_data = type_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/dict-types/{type_id}", response_model=schemas.DictType)
def delete_dict_type(
        type_id: int,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    item = db.query(models.DictType).filter(models.DictType.id == type_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Dict type not found")

    response = schemas.DictType.model_validate(item)
    db.delete(item)
    db.commit()
    return response


# --- 字典数据 ---

@router.post("/dict-data/", response_model=schemas.DictData)
def create_dict_data(
        dict_data: schemas.DictDataCreate,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    # 检查字典类型是否存在
    dict_type = db.query(models.DictType).filter(models.DictType.id == dict_data.dict_type_id).first()
    if not dict_type:
        raise HTTPException(status_code=404, detail="Dict type not found")

    db_item = models.DictData(**dict_data.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/dict-data/", response_model=schemas.DictDataPage)
def read_dict_data(
        current: int = 1,
        pageSize: int = 20,
        dict_type_id: Optional[int] = None,
        dict_type_code: Optional[str] = None,
        label: Optional[str] = None,
        status: Optional[str] = None,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    query = db.query(models.DictData)

    if dict_type_id:
        query = query.filter(models.DictData.dict_type_id == dict_type_id)

    if dict_type_code:
        # 通过关联 DictType 按类型编码筛选
        query = query.join(models.DictType).filter(models.DictType.code == dict_type_code)

    if label:
        query = query.filter(models.DictData.label.like(f"%{label}%"))

    if status:
        query = query.filter(models.DictData.status == status)

    # 按排序字段升序排列
    query = query.order_by(models.DictData.sort.asc())

    total = query.count()
    items = query.offset((current - 1) * pageSize).limit(pageSize).all()
    return create_page_response(items, total, current, pageSize)


@router.put("/dict-data/{data_id}", response_model=schemas.DictData)
def update_dict_data(
        data_id: int,
        data_in: schemas.DictDataUpdate,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    item = db.query(models.DictData).filter(models.DictData.id == data_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Dict data not found")

    update_data = data_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/dict-data/{data_id}", response_model=schemas.DictData)
def delete_dict_data(
        data_id: int,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    item = db.query(models.DictData).filter(models.DictData.id == data_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Dict data not found")

    response = schemas.DictData.model_validate(item)
    db.delete(item)
    db.commit()
    return response


# --- 用户 ---

@router.post("/users/", response_model=schemas.User)
def create_user(
        user: schemas.UserCreate,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    db_obj = db.query(models.User).filter(models.User.username == user.username).first()
    if db_obj:
        raise HTTPException(status_code=400, detail="Username already registered")

    user_data = user.model_dump(exclude={"role_ids", "password"})
    user_data["hashed_password"] = security.get_password_hash(user.password)

    db_user = models.User(**user_data)

    # 处理用户角色关联
    if user.role_ids:
        roles = db.query(models.Role).filter(models.Role.id.in_(user.role_ids)).all()
        db_user.roles = roles

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/users/", response_model=schemas.UserPage)
def read_users(
        current: int = 1,
        pageSize: int = 20,
        username: Optional[str] = None,
        name: Optional[str] = None,
        email: Optional[str] = None,
        status: Optional[str] = None,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    query = db.query(models.User)
    if username:
        query = query.filter(models.User.username.like(f"%{username}%"))
    if name:
        query = query.filter(models.User.full_name.like(f"%{name}%"))
    if email:
        query = query.filter(models.User.email.like(f"%{email}%"))
    if status:
        query = query.filter(models.User.status == status)

    total = query.count()
    items = query.offset((current - 1) * pageSize).limit(pageSize).all()
    return create_page_response(items, total, current, pageSize)


@router.put("/users/{user_id}", response_model=schemas.User)
def update_user(
        user_id: int,
        user_in: schemas.UserUpdate,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_in.model_dump(exclude_unset=True, exclude={"role_ids"})

    # 处理密码更新（将明文密码转换为哈希存储）
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = security.get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    # 处理用户角色关联
    if user_in.role_ids is not None:
        roles = db.query(models.Role).filter(models.Role.id.in_(user_in.role_ids)).all()
        user.roles = roles

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", response_model=schemas.User)
def delete_user(
        user_id: int,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    response = schemas.User.model_validate(user)
    db.delete(user)
    db.commit()
    return response


# --- 角色 ---

@router.post("/roles/", response_model=schemas.Role)
def create_role(
        role: schemas.RoleCreate,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    db_obj = db.query(models.Role).filter(models.Role.code == role.code).first()
    if db_obj:
        raise HTTPException(status_code=400, detail="Role code already exists")

    role_data = role.model_dump(exclude={"permission_ids"})
    db_role = models.Role(**role_data)

    # 处理角色权限关联
    if role.permission_ids:
        perms = db.query(models.Permission).filter(models.Permission.id.in_(role.permission_ids)).all()
        db_role.permissions = perms

    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role


@router.get("/roles/", response_model=schemas.RolePage)
def read_roles(
        current: int = 1,
        pageSize: int = 20,
        name: Optional[str] = None,
        code: Optional[str] = None,
        status: Optional[str] = None,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    query = db.query(models.Role)
    if name:
        query = query.filter(models.Role.name.like(f"%{name}%"))
    if code:
        query = query.filter(models.Role.code.like(f"%{code}%"))
    if status:
        query = query.filter(models.Role.status == status)

    total = query.count()
    items = query.offset((current - 1) * pageSize).limit(pageSize).all()
    return create_page_response(items, total, current, pageSize)


@router.put("/roles/{role_id}", response_model=schemas.Role)
def update_role(
        role_id: int,
        role_in: schemas.RoleUpdate,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    update_data = role_in.model_dump(exclude_unset=True, exclude={"permission_ids"})
    for field, value in update_data.items():
        setattr(role, field, value)

    # Handle permissions
    if role_in.permission_ids is not None:
        perms = db.query(models.Permission).filter(models.Permission.id.in_(role_in.permission_ids)).all()
        role.permissions = perms

    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.delete("/roles/{role_id}", response_model=schemas.Role)
def delete_role(
        role_id: int,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    response = schemas.Role.model_validate(role)
    db.delete(role)
    db.commit()
    return response


# --- 权限 ---

@router.post("/permissions/", response_model=schemas.Permission)
def create_permission(
        permission: schemas.PermissionCreate,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    db_obj = db.query(models.Permission).filter(models.Permission.code == permission.code).first()
    if db_obj:
        raise HTTPException(status_code=400, detail="Permission code already exists")

    db_perm = models.Permission(**permission.model_dump())
    db.add(db_perm)
    db.commit()
    db.refresh(db_perm)
    return db_perm


@router.get("/permissions/", response_model=schemas.PermissionPage)
def read_permissions(
        current: int = 1,
        pageSize: int = 1000,
        name: Optional[str] = None,
        code: Optional[str] = None,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    query = db.query(models.Permission)
    if name:
        query = query.filter(models.Permission.name.like(f"%{name}%"))
    if code:
        query = query.filter(models.Permission.code.like(f"%{code}%"))

    query = query.order_by(models.Permission.sort.asc())

    total = query.count()
    items = query.offset((current - 1) * pageSize).limit(pageSize).all()
    return create_page_response(items, total, current, pageSize)


@router.put("/permissions/{perm_id}", response_model=schemas.Permission)
def update_permission(
        perm_id: int,
        perm_in: schemas.PermissionUpdate,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    perm = db.query(models.Permission).filter(models.Permission.id == perm_id).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")

    update_data = perm_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(perm, field, value)

    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm


@router.delete("/permissions/{perm_id}", response_model=schemas.Permission)
def delete_permission(
        perm_id: int,
        db: Session = Depends(deps.get_db),
        current_user: models.User = Depends(deps.get_current_active_user)
):
    perm = db.query(models.Permission).filter(models.Permission.id == perm_id).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")

    response = schemas.Permission.model_validate(perm)
    db.delete(perm)
    db.commit()
    return response
