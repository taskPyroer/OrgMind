from typing import Generator, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models import system as models
from app.models import oa
from app.db.session import SessionLocal

# 说明：这里从前端视角使用模拟的获取 token 接口，在标准后端 OAuth2 实现中
# 通常会指向一个固定的认证 URL。
# 前端会在请求头中携带 Authorization: Bearer <token>。
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token",
    auto_error=False # 如果未携带 token 不自动抛错，由业务代码自行处理
)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> Union[models.User, oa.EmployeeAccount]:
    if not token:
        # 未获取到 token（通常应从 Authorization 头中获得）
        # 对受保护的接口，这里统一抛出未认证错误
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        user_type: str = payload.get("user_type", "account")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    if user_type == "employee":
        user = db.query(oa.EmployeeAccount).filter(oa.EmployeeAccount.id == int(user_id)).first()
    else:
        user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 检查用户是否为启用状态
    if user.status != "active":
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user

# 为了语义清晰和兼容性提供的别名
get_current_active_user = get_current_user
