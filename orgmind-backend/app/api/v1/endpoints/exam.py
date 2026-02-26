import uuid
from typing import List, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, get_current_active_user
from app.models import system as models
from app.models import oa
from app.models.exam import Exam, Question, ExamResult, ExamStatus, ExamResultStatus
from app.schemas import exam as schemas
from app.services.exam import ExamService, run_exam_generation_task
from app.utils.response import create_page_response

router = APIRouter()

@router.post("/generate", response_model=schemas.Exam)
def generate_exam(
    request: schemas.ExamGenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Generate an exam using AI based on Knowledge Base content.
    """
    service = ExamService(db)
    try:
        # Create "Generating" record immediately
        exam = service.create_exam_record(request, current_user.id)
        
        # Trigger background task
        background_tasks.add_task(
            run_exam_generation_task,
            exam.id,
            request.kb_id,
            request.question_count,
            request.doc_ids
        )
        
        return exam
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error during exam generation")

@router.get("/all-results", response_model=schemas.ExamResultListItemPage)
def get_all_exam_results(
    current: int = 1,
    pageSize: int = 20,
    exam_title: str = None,
    user_name: str = None,
    status: ExamResultStatus = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get all exam results (for admin/dashboard).
    """
    # Join ExamResult, Exam, and User/Employee to get details
    query = db.query(
        ExamResult.id,
        Exam.id.label("exam_id"),
        Exam.title.label("exam_title"),
        func.coalesce(models.User.full_name, oa.Employee.name, oa.EmployeeAccount.username).label("user_name"),
        ExamResult.score,
        ExamResult.status,
        ExamResult.submit_time
    ).join(Exam, ExamResult.exam_id == Exam.id)\
     .outerjoin(models.User, (ExamResult.user_id == models.User.id) & (ExamResult.user_type == 'sys_user'))\
     .outerjoin(oa.EmployeeAccount, (ExamResult.user_id == oa.EmployeeAccount.id) & (ExamResult.user_type == 'employee'))\
     .outerjoin(oa.Employee, oa.EmployeeAccount.employee_id == oa.Employee.id)
     
    # Apply filters
    if exam_title:
        query = query.filter(Exam.title.ilike(f"%{exam_title}%"))
    
    if user_name:
        term = f"%{user_name}%"
        query = query.filter(
            (models.User.full_name.ilike(term)) |
            (oa.Employee.name.ilike(term)) |
            (oa.EmployeeAccount.username.ilike(term))
        )
        
    if status:
        query = query.filter(ExamResult.status == status)

    total = query.count()
    results = query.order_by(ExamResult.submit_time.desc())\
     .offset((current - 1) * pageSize).limit(pageSize).all()
     
    formatted_results = []
    for r in results:
        # r is a Row object
        formatted_results.append({
            "id": r.id,
            "exam_id": r.exam_id,
            "exam_title": r.exam_title,
            "user_name": r.user_name or "Unknown", # Fallback
            "score": r.score,
            "status": r.status,
            "submit_time": r.submit_time
        })
        
    return create_page_response(formatted_results, total, current, pageSize)

@router.get("/results/{id}", response_model=schemas.ExamResultDetail)
def get_result_by_id(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get exam result by its ID.
    """
    result = db.query(ExamResult).filter(ExamResult.id == id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
        
    # Check permissions: Owner or Superuser/Admin
    is_superuser = getattr(current_user, 'is_superuser', False)
    current_user_type = "employee" if isinstance(current_user, oa.EmployeeAccount) else "sys_user"
    
    is_owner = (result.user_id == current_user.id) and (result.user_type == current_user_type)
    
    if not is_owner and not is_superuser:
         raise HTTPException(status_code=403, detail="Not authorized")

    exam = db.query(Exam).filter(Exam.id == result.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    details = []
    answers_data = result.answers or {}
    
    for q in exam.questions:
        ans_data = answers_data.get(str(q.id), {})
        if isinstance(ans_data, dict):
             user_ans = ans_data.get("user_answer")
             is_correct = ans_data.get("is_correct", False)
        else:
             user_ans = str(ans_data)
             is_correct = False
        
        details.append(schemas.QuestionResult(
            question=q,
            user_answer=str(user_ans) if user_ans is not None else None,
            is_correct=is_correct
        ))
        
    return schemas.ExamResultDetail(
        **schemas.ExamResult.from_orm(result).dict(),
        kb_id=exam.kb_id,
        details=details
    )

@router.get("/{id}", response_model=schemas.Exam)
def get_exam(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get exam details.
    """
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.put("/{id}", response_model=schemas.Exam)
def update_exam(
    id: uuid.UUID,
    exam_in: schemas.ExamUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Update exam (e.g. publish).
    """
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Permission check (only creator or admin)
    if exam.created_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    update_data = exam_in.model_dump(exclude_unset=True)
    
    # Handle questions update if present
    questions_data = update_data.pop('questions', None)
    if questions_data is not None:
        # Existing questions map
        existing_questions = {q.id: q for q in exam.questions}
        
        current_question_ids = set()
        
        for q_data in questions_data:
            q_id = q_data.get('id')
            if q_id and q_id in existing_questions:
                # Update existing
                q = existing_questions[q_id]
                for k, v in q_data.items():
                    if k != 'id' and v is not None:
                        setattr(q, k, v)
                current_question_ids.add(q_id)
            elif not q_id:
                # Create new
                new_q = Question(
                    exam_id=exam.id,
                    content=q_data.get('content'),
                    type=q_data.get('type'),
                    options=q_data.get('options', []),
                    answer=q_data.get('answer'),
                    explanation=q_data.get('explanation'),
                    source_doc_id=q_data.get('source_doc_id')
                )
                db.add(new_q)
                # We don't have ID yet, so can't add to current_question_ids, but it's new so won't be deleted
        
        # Optional: Delete questions not in the list (if list was provided)
        # Only if we are sure the list is exhaustive. Let's assume yes for an "Editor".
        if questions_data is not None:
             for q in exam.questions:
                 if q.id not in current_question_ids and q.id in existing_questions: # Only delete if it was existing
                     db.delete(q)

    for field, value in update_data.items():
        setattr(exam, field, value)
        
    db.commit()
    db.refresh(exam)
    return exam

@router.delete("/{id}", status_code=204)
def delete_exam(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Delete exam.
    Only creator or superuser can delete.
    """
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if exam.created_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Manually delete related results first if cascade is not configured in DB
    db.query(ExamResult).filter(ExamResult.exam_id == id).delete()
    
    db.delete(exam)
    db.commit()
    return None

@router.get("/{id}/detail", response_model=schemas.ExamDetail)
def get_exam_detail(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get exam details with full questions (answers/explanations).
    Only for creator or superuser.
    """
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if not current_user.is_superuser and exam.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view exam details")
        
    return exam

@router.get("/", response_model=schemas.ExamPage)
def get_exams(
    current: int = 1,
    pageSize: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get all exams (visible to user).
    For now, return all published exams + own drafts.
    """
    query = db.query(Exam)
    
    # Check if user is superuser (safely)
    is_superuser = getattr(current_user, 'is_superuser', False)
    is_employee = not hasattr(current_user, 'is_superuser')
    
    if not is_superuser:
        if is_employee:
            # Employees only see published exams
            query = query.filter(Exam.status == ExamStatus.PUBLISHED)
        else:
            # Regular users see published + own drafts
            query = query.filter(
                (Exam.status == ExamStatus.PUBLISHED) | 
                (Exam.created_by == current_user.id)
            )
    
    total = query.count()
    data = query.offset((current - 1) * pageSize).limit(pageSize).all()
    
    return create_page_response(data, total, current, pageSize)

@router.post("/{id}/submit", response_model=schemas.ExamResult)
def submit_exam(
    id: uuid.UUID,
    submission: schemas.ExamSubmitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Submit exam answers and auto-grade.
    """
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if exam.status != ExamStatus.PUBLISHED:
        # Allow creator to test submission in draft
        # Employees cannot create exams, so they cannot submit drafts
        if not hasattr(current_user, 'is_superuser'):
             raise HTTPException(status_code=400, detail="Exam is not published")
             
        if exam.created_by != current_user.id:
            raise HTTPException(status_code=400, detail="Exam is not published")
        
    # Check if already submitted
    user_type = "employee" if isinstance(current_user, oa.EmployeeAccount) else "sys_user"

    existing_result = db.query(ExamResult).filter(
        ExamResult.exam_id == id,
        ExamResult.user_id == current_user.id,
        ExamResult.user_type == user_type
    ).first()
    
    if existing_result and existing_result.status == ExamResultStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="You have already submitted this exam")
        
    # Grading Logic
    total_score = 0
    question_map = {str(q.id): q for q in exam.questions}
    points_per_question = 100 / len(exam.questions) if exam.questions else 0
    
    graded_answers = {}
    
    for q_id, user_ans in submission.answers.items():
        if q_id in question_map:
            q = question_map[q_id]
            correct_ans = q.answer
            
            is_correct = False
            try:
                if q.type == QuestionType.MULTIPLE_CHOICE:
                     # Split by comma, strip, sort
                     u = sorted([x.strip().upper() for x in str(user_ans).split(',') if x.strip()])
                     c = sorted([x.strip().upper() for x in str(correct_ans).split(',') if x.strip()])
                     is_correct = u == c
                else:
                    is_correct = str(user_ans).strip().lower() == str(correct_ans).strip().lower()
            except Exception:
                # Fallback
                is_correct = str(user_ans).strip().lower() == str(correct_ans).strip().lower()
            
            if is_correct:
                total_score += points_per_question
            
            graded_answers[q_id] = {
                "user_answer": user_ans,
                "is_correct": is_correct
            }
            
    # Save Result
    if existing_result:
        result = existing_result
        result.submit_time = datetime.now(timezone.utc)
        result.score = total_score
        result.answers = graded_answers
        result.status = ExamResultStatus.COMPLETED
    else:
        result = ExamResult(
            exam_id=id,
            user_id=current_user.id,
            user_type=user_type,
            score=total_score,
            answers=graded_answers,
            status=ExamResultStatus.COMPLETED,
            submit_time=datetime.now(timezone.utc)
        )
        db.add(result)
        
    db.commit()
    db.refresh(result)
    return result

@router.get("/{id}/result", response_model=schemas.ExamResultDetail)
def get_exam_result(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    user_type = "employee" if isinstance(current_user, oa.EmployeeAccount) else "sys_user"
    result = db.query(ExamResult).filter(
        ExamResult.exam_id == id,
        ExamResult.user_id == current_user.id,
        ExamResult.user_type == user_type
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    details = []
    answers_data = result.answers or {}
    
    for q in exam.questions:
        ans_data = answers_data.get(str(q.id), {})
        if isinstance(ans_data, dict):
             user_ans = ans_data.get("user_answer")
             is_correct = ans_data.get("is_correct", False)
        else:
             user_ans = str(ans_data)
             is_correct = False
        
        details.append(schemas.QuestionResult(
            question=q,
            user_answer=str(user_ans) if user_ans is not None else None,
            is_correct=is_correct
        ))
        
    return schemas.ExamResultDetail(
        **schemas.ExamResult.from_orm(result).dict(),
        kb_id=exam.kb_id,
        details=details
    )
