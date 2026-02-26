from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ComponentConfig(BaseModel):
    id: str
    type: str
    props: Dict[str, Any]

class SiteSettings(BaseModel):
    host: Optional[str] = None
    enableHttp: Optional[bool] = None
    httpPort: Optional[int] = None
    enableHttps: Optional[bool] = None
    httpsPort: Optional[int] = None
    certFile: Optional[str] = None
    keyFile: Optional[str] = None
    proxyMode: Optional[str] = None
    baseUrl: Optional[str] = None
    copyright: Optional[Dict[str, Any]] = None
    accessControl: Optional[str] = None
    sidebar: Optional[Dict[str, Any]] = None
    seo: Optional[Dict[str, Any]] = None
    customCode: Optional[Dict[str, Any]] = None

class PortalConfigBase(BaseModel):
    components: List[ComponentConfig]
    siteSettings: Optional[SiteSettings] = None

class PortalConfigCreate(PortalConfigBase):
    pass

class PortalConfigUpdate(PortalConfigBase):
    pass

class PortalConfig(PortalConfigBase):
    class Config:
        from_attributes = True
