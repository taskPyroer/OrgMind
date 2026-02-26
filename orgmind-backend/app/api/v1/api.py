from fastapi import APIRouter
from app.api.v1.endpoints import oa, system, login, employee_account, rag, portal, upload, exam, dashboard

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(system.router, prefix="/system", tags=["system"])
api_router.include_router(oa.router, prefix="/oa", tags=["oa"])
api_router.include_router(employee_account.router, prefix="/oa/employee-accounts", tags=["employee-accounts"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
api_router.include_router(portal.router, prefix="/portal", tags=["portal"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(exam.router, prefix="/exam", tags=["exam"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
