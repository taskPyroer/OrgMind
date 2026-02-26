from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, get_current_active_user
from app.models import system as models
from app.models import oa
from app.models.exam import Exam, ExamResult
from app.models.rag import KnowledgeBase, Document
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get dashboard statistics.
    """
    user_count = db.query(models.User).count()
    employee_count = db.query(oa.Employee).count()
    exam_count = db.query(Exam).count()
    kb_count = db.query(KnowledgeBase).count()
    doc_count = db.query(Document).count()
    
    # Calculate pass rate if there are exam results
    total_results = db.query(ExamResult).count()
    passed_results = db.query(ExamResult).join(Exam, ExamResult.exam_id == Exam.id).filter(ExamResult.score >= Exam.pass_score).count()
    pass_rate = (passed_results / total_results * 100) if total_results > 0 else 0

    return {
        "user_count": user_count + employee_count, # Total users (system + employees)
        "system_user_count": user_count,
        "employee_count": employee_count,
        "exam_count": exam_count,
        "kb_count": kb_count,
        "doc_count": doc_count,
        "pass_rate": round(pass_rate, 2)
    }

@router.get("/charts/exam-trend")
def get_exam_trend(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get exam submission trend (last 7 days).
    Groups by date and fills in missing dates with 0.
    """
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=6)  # Last 7 days including today

    # Group by date of submit_time within the range
    results = db.query(
        func.date(ExamResult.submit_time).label("date"),
        func.count(ExamResult.id).label("count")
    ).filter(
        ExamResult.submit_time >= start_date,
        ExamResult.submit_time < end_date + timedelta(days=1)
    ).group_by(func.date(ExamResult.submit_time))\
     .all()
    
    # Convert query results to a dictionary for easy lookup
    result_map = {str(r.date): r.count for r in results}
    
    data = []
    # Iterate through the last 7 days to ensure all dates are present
    for i in range(7):
        current_day = start_date + timedelta(days=i)
        date_str = str(current_day)
        count = result_map.get(date_str, 0)
        data.append({
            "date": date_str,
            "value": count,
            "type": "考试人次"
        })
        
    return data

@router.get("/charts/kb-distribution")
def get_kb_distribution(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get document distribution by Knowledge Base.
    """
    results = db.query(
        KnowledgeBase.name,
        func.count(Document.id).label("count")
    ).join(Document, KnowledgeBase.id == Document.kb_id)\
     .group_by(KnowledgeBase.name)\
     .all()
     
    data = [{"type": r.name, "value": r.count} for r in results]
    return data
