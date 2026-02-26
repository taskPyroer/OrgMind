from typing import Optional, Union
import copy

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from pydantic import ValidationError

from app.api import deps
from app.core.config import settings
from app.models import portal as models
from app.models import oa
from app.schemas import portal as schemas
from app.models import system as system_models

router = APIRouter()

DEFAULT_CONFIG = {
    "components": [
        {
            "id": "topbar",
            "type": "TopBar",
            "props": {
                "logo": {
                    "text": "OrgMind",
                    "src": "",
                    "alt": "OrgMind Logo"
                },
                "buttons": [
                    {
                        "text": "登录",
                        "link": "/user/login",
                        "style": "primary",
                        "target": "_self",
                        "icon": "LoginOutlined"
                    }
                ]
            }
        },
        {
            "id": "banner",
            "type": "Banner",
            "props": {
                "title": "OrgMind 企业知识门户",
                "subtitle": "连接人与知识，构建组织智慧大脑",
                "searchPlaceholder": "搜索知识库、文档或向 AI 提问...",
                "knowledge_base_ids": [],
                "buttons": [
                    {
                        "text": "开始探索",
                        "link": "/portal/docs",
                        "type": "primary"
                    },
                    {
                        "text": "了解更多",
                        "link": "https://github.com/orgmind",
                        "type": "default"
                    }
                ]
            }
        },
        {
            "id": "docs",
            "type": "RecommendedDocs",
            "props": {
                "title": "热门推荐",
                "items": [
                    {
                        "title": "员工入职指南",
                        "summary": "包含公司规章制度、IT 环境配置、行政流程等新手必读内容。",
                        "link": "#"
                    },
                    {
                        "title": "产品技术白皮书",
                        "summary": "详细阐述 OrgMind 核心架构与 AI 引擎实现原理。",
                        "link": "#"
                    },
                    {
                        "title": "2024 年度战略规划",
                        "summary": "公司年度目标拆解与各部门关键结果（OKR）概览。",
                        "link": "#"
                    }
                ]
            }
        },
        {
            "id": "carousel",
            "type": "ProductCarousel",
            "props": {
                "title": "平台亮点",
                "images": [
                    "https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png",
                    "https://gw.alipayobjects.com/zos/rmsportal/sgHpNqYrEYtowYlGTPdM.png"
                ]
            }
        },
        {
            "id": "faq",
            "type": "FAQ",
            "props": {
                "title": "常见问题",
                "items": [
                    {
                        "question": "如何申请知识库权限？",
                        "link": "#"
                    },
                    {
                        "question": "AI 问答结果不准确怎么办？",
                        "link": "#"
                    },
                    {
                        "question": "支持手机端访问吗？",
                        "link": "#"
                    },
                    {
                        "question": "如何上传部门文档？",
                        "link": "#"
                    }
                ]
            }
        },
        {
            "id": "footer",
            "type": "Footer",
            "props": {
                "logo": {
                    "text": "OrgMind"
                },
                "description": "新一代企业级组织智能系统",
                "copyright": {
                    "company": "OrgMind Inc.",
                    "icp": "京ICP备XXXXXXXX号",
                    "text": "© 2024 OrgMind. All Rights Reserved."
                },
                "linkGroups": [
                    {
                        "name": "产品",
                        "links": [
                            {"name": "功能特性", "link": "#"},
                            {"name": "更新日志", "link": "#"}
                        ]
                    },
                    {
                        "name": "支持",
                        "links": [
                            {"name": "帮助中心", "link": "#"},
                            {"name": "API 文档", "link": "#"}
                        ]
                    }
                ]
            }
        }
    ],
    "siteSettings": {
        "host": "0.0.0.0",
        "enableHttp": False,
        "httpPort": 8088,
        "enableHttps": False,
        "httpsPort": 443,
        "proxyMode": "none",
        "baseUrl": "http://localhost:8000",
        "copyright": {
            "show": True,
            "text": "本网站由 OrgMind 提供技术支持"
        },
        "accessControl": "public",
        "sidebar": {
            "show": True,
            "defaultOpen": True,
            "width": 260
        },
        "seo": {
            "description": "OrgMind 知识门户",
            "keywords": "OrgMind, 知识库, 门户"
        },
        "customCode": {
            "head": "",
            "body": ""
        }
    }
}

import logging

logger = logging.getLogger(__name__)


def get_current_user_optional(
        db: Session = Depends(deps.get_db),
        token: str = Depends(deps.reusable_oauth2)
) -> Optional[Union[system_models.User, oa.EmployeeAccount]]:
    if not token:
        logger.info("Portal access: No token provided")
        return None
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        user_type: str = payload.get("user_type", "account")

        logger.info(f"Portal access: Token decoded, user_id={user_id}, user_type={user_type}")

        if user_id is None:
            return None
    except (JWTError, ValidationError) as e:
        logger.warning(f"Portal access: Token validation failed: {str(e)}")
        return None

    if user_type == "employee":
        user = db.query(oa.EmployeeAccount).filter(oa.EmployeeAccount.id == int(user_id)).first()
    else:
        user = db.query(system_models.User).filter(system_models.User.id == int(user_id)).first()

    if not user or user.status != "active":
        logger.info(f"Portal access: User not found or inactive. UserID={user_id}")
        return None

    logger.info(f"Portal access: User authenticated. UserID={user.id}")
    return user


@router.get("/config", response_model=schemas.PortalConfig)
def get_portal_config(
        response: Response,
        key: str = "default",
        db: Session = Depends(deps.get_db),
        current_user: Optional[Union[system_models.User, oa.EmployeeAccount]] = Depends(get_current_user_optional)
):
    # Disable caching to ensure access control changes take effect immediately
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    config_obj = db.query(models.PortalConfig).filter(models.PortalConfig.key == key).first()

    if not config_obj:
        final_config = copy.deepcopy(DEFAULT_CONFIG)
    else:
        final_config = copy.deepcopy(config_obj.config)

    # Access Control Logic (Strictly referencing PandaWiki patterns)
    site_settings = final_config.get("siteSettings", {})
    access_control = site_settings.get("accessControl", "public")

    logger.info(
        f"Portal access config check: mode={access_control}, user={current_user.id if current_user else 'None'}")

    # 1. Forbidden: Block content, but return settings for 403 page rendering
    if access_control == "forbidden":
        final_config["components"] = []
        return final_config

    # 2. Auth: Check login status
    if access_control == "auth":
        if not current_user:
            # Not authenticated: Block content, return settings for Login page rendering
            logger.info("Portal access blocked: Auth required but no user")
            final_config["components"] = []
            return final_config

    # 3. Public or Authenticated: Return full content
    return final_config


@router.put("/config", response_model=schemas.PortalConfig)
def update_portal_config(
        config_in: schemas.PortalConfigUpdate,
        key: str = "default",
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    config = db.query(models.PortalConfig).filter(models.PortalConfig.key == key).first()
    if not config:
        config = models.PortalConfig(key=key, config=config_in.model_dump())
        db.add(config)
    else:
        config.config = config_in.model_dump()

    db.commit()
    db.refresh(config)
    return config.config
