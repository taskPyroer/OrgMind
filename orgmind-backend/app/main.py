from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.initial_data import init_db

# Create Tables (For dev purposes, usually use Alembic)
Base.metadata.create_all(bind=engine)


app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "data", "img")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static/img", StaticFiles(directory=STATIC_DIR), name="static_img")

app.include_router(api_router, prefix=settings.API_V1_STR)
db = SessionLocal()
try:
    init_db(db)
finally:
    db.close()
@app.get("/")
def root():
    return {"message": "Welcome to ERP API"}
