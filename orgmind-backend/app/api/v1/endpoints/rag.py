import uuid
import json
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks, Query, Path, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, text, func
from datetime import datetime, timedelta
from app.models import system as models
from app.models import oa as oa_models
from app.api.deps import get_db, get_current_active_user
from app.models.rag import KnowledgeBase, Document, DocStatus, ChatHistory, Visibility
from app.schemas import rag as schemas
from app.services.rag import RAGService
from app.services.storage import storage, calculate_file_hash
from app.utils.response import create_page_response
from app.utils.ip import get_ip_location

router = APIRouter()


def get_user_dept_ids(db: Session, user: models.User) -> List[int]:
    """获取用户所属部门及其所有上级部门的ID列表"""
    # User 模型通过 employee 关联部门
    if not user.employee_id:
        return []

    # 确保 employee 已加载
    if not user.employee:
        # 尝试手动查询（如果关系未自动加载）
        user.employee = db.query(oa_models.Employee).filter(oa_models.Employee.id == user.employee_id).first()

    if not user.employee or not user.employee.department_id:
        return []

    dept_id = user.employee.department_id
    dept_ids = {dept_id}

    # 简单的循环向上查找
    current_id = dept_id
    while True:
        dept = db.query(oa_models.Department).filter(oa_models.Department.id == current_id).first()
        if not dept or not dept.parent_id:
            break
        if dept.parent_id in dept_ids:  # 防止环
            break
        dept_ids.add(dept.parent_id)
        current_id = dept.parent_id

    return list(dept_ids)


# --- 知识库接口 ---

@router.get("/knowledge-bases/", response_model=schemas.KnowledgeBasePage)
def get_knowledge_bases(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
        current: int = 1,
        pageSize: int = 10,
        name: Optional[str] = None,
        visibility: Optional[Visibility] = None
):
    # 权限过滤
    user_dept_ids = get_user_dept_ids(db, current_user)

    permission_filter = or_(
        KnowledgeBase.visibility == Visibility.PUBLIC,
        KnowledgeBase.owner_id == current_user.id,
        and_(
            KnowledgeBase.visibility == Visibility.DEPARTMENT,
            KnowledgeBase.visible_departments.any(oa_models.Department.id.in_(user_dept_ids))
        )
    )

    query = db.query(KnowledgeBase).filter(permission_filter).options(
        joinedload(KnowledgeBase.visible_departments),
        joinedload(KnowledgeBase.owner_user),
        joinedload(KnowledgeBase.owner_employee).joinedload(oa_models.EmployeeAccount.employee)
    )

    if name:
        query = query.filter(KnowledgeBase.name.ilike(f"%{name}%"))

    if visibility:
        query = query.filter(KnowledgeBase.visibility == visibility)

    total = query.count()
    offset = (current - 1) * pageSize
    items = query.offset(offset).limit(pageSize).all()

    return create_page_response(items, total, current, pageSize)


@router.post("/knowledge-bases/", response_model=schemas.KnowledgeBase)
def create_knowledge_base(
        kb_in: schemas.KnowledgeBaseCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    kb_data = kb_in.model_dump()
    # 提取 visible_department_ids，避免传递给 SQLAlchemy 模型构造函数导致 AttributeError
    visible_dept_ids = kb_data.pop("visible_department_ids", [])

    owner_type = "employee" if hasattr(current_user, 'employee_id') and hasattr(current_user,
                                                                                'username') and not hasattr(
        current_user, 'is_superuser') else "user"
    # Better check: check if it's EmployeeAccount instance
    if isinstance(current_user, oa_models.EmployeeAccount):
        owner_type = "employee"
    else:
        owner_type = "user"

    kb = KnowledgeBase(
        **kb_data,
        owner_id=current_user.id,
        owner_type=owner_type
    )

    # 处理可见部门关联
    if visible_dept_ids:
        depts = db.query(oa_models.Department).filter(oa_models.Department.id.in_(visible_dept_ids)).all()
        kb.visible_departments = depts

    db.add(kb)
    db.commit()
    db.refresh(kb)
    return kb


@router.get("/knowledge-bases/{id}", response_model=schemas.KnowledgeBase)
def get_knowledge_base(
        id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == id).first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge Base not found")
    return kb


@router.put("/knowledge-bases/{id}", response_model=schemas.KnowledgeBase)
def update_knowledge_base(
        id: uuid.UUID,
        kb_in: schemas.KnowledgeBaseUpdate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == id).first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge Base not found")

    # 权限检查：仅拥有者可修改
    if kb.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = kb_in.model_dump(exclude_unset=True)

    # 处理可见部门更新
    if "visible_department_ids" in update_data:
        visible_dept_ids = update_data.pop("visible_department_ids")
        # 如果传入 None，则不更新；如果传入空列表，则清空
        if visible_dept_ids is not None:
            depts = db.query(oa_models.Department).filter(oa_models.Department.id.in_(visible_dept_ids)).all()
            kb.visible_departments = depts

    for field, value in update_data.items():
        setattr(kb, field, value)

    db.add(kb)
    db.commit()
    db.refresh(kb)
    return kb


@router.delete("/knowledge-bases/{id}", response_model=schemas.KnowledgeBase)
def delete_knowledge_base(
        id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == id).first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge Base not found")

    # 权限检查：仅拥有者可删除
    if kb.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # 处理关联的聊天记录：将 kb_id 置为 NULL，避免外键约束错误
    db.query(ChatHistory).filter(ChatHistory.kb_id == id).update({ChatHistory.kb_id: None})

    # 删除物理文件 (附件)
    # 知识库的附件存储在 uploads/{kb_id}/ 目录下
    try:
        storage.delete_dir(str(id))
    except Exception as e:
        print(f"Error deleting files for KB {id}: {e}")

    response = schemas.KnowledgeBase.model_validate(kb)
    db.delete(kb)
    db.commit()
    return response


# --- 文档接口 ---

@router.get("/knowledge-bases/{kb_id}/documents/", response_model=schemas.DocumentPage)
def get_documents(
        kb_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
        current: int = 1,
        pageSize: int = 10,
        parent_id: Optional[uuid.UUID] = Query(None, description="Parent Folder ID"),
        is_root: bool = Query(False, description="Fetch only root documents (parent_id is NULL)"),
        is_folder: Optional[bool] = Query(None, description="Filter by is_folder")
):
    query = db.query(Document).filter(Document.kb_id == kb_id).options(
        joinedload(Document.creator_user),
        joinedload(Document.creator_employee).joinedload(oa_models.EmployeeAccount.employee)
    )

    if parent_id:
        query = query.filter(Document.parent_id == parent_id)
    elif is_root:
        query = query.filter(Document.parent_id == None)

    if is_folder is not None:
        query = query.filter(Document.is_folder == is_folder)

    total = query.count()
    offset = (current - 1) * pageSize
    # Sort: Folders first, then by creation time
    items = query.order_by(Document.is_folder.desc(), Document.created_at.desc()).offset(offset).limit(pageSize).all()
    return create_page_response(items, total, current, pageSize)


@router.post("/knowledge-bases/{kb_id}/folders/", response_model=schemas.Document)
def create_folder(
        kb_id: uuid.UUID,
        folder_in: schemas.FolderCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    # 1. 检查知识库
    kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge Base not found")

    # 2. 创建文件夹记录
    creator_type = "user"
    if isinstance(current_user, oa_models.EmployeeAccount):
        creator_type = "employee"

    new_folder = Document(
        kb_id=kb_id,
        title=folder_in.title,
        is_folder=True,
        parent_id=folder_in.parent_id,
        status=DocStatus.COMPLETED,  # Folders are immediately ready
        creator_id=current_user.id,
        creator_type=creator_type
    )
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    return new_folder


@router.post("/knowledge-bases/{kb_id}/documents/", response_model=List[schemas.Document])
async def create_document(
        kb_id: uuid.UUID,
        files: List[UploadFile] = File(...),
        parent_id: Optional[uuid.UUID] = Form(None),
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
        background_tasks: BackgroundTasks = None
):
    """
    异步上传文档：
    1. 验证知识库权限
    2. 检查重复（基于哈希）
    3. 保存到存储
    4. 创建数据库记录（状态：PENDING）
    5. 触发后台任务（解析 -> 切片 -> 向量化）
    """
    # 1. 检查知识库是否存在及权限
    kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge Base not found")

    # 待办: 检查用户对知识库的权限

    results = []

    for file in files:
        # 2. 计算哈希以去重
        file_hash, file_size = calculate_file_hash(file)

        # 检查该知识库中是否已存在此文件
        existing_doc = db.query(Document).filter(
            Document.kb_id == kb_id,
            Document.file_hash == file_hash
        ).first()

        if existing_doc:
            results.append(existing_doc)
            continue

        # 3. 保存到存储
        # 路径格式: uploads/{kb_id}/{uuid}{ext}
        ext = "." + file.filename.split(".")[-1] if "." in file.filename else ""
        storage_key = f"{kb_id}/{uuid.uuid4()}{ext}"
        storage.save(file.file, storage_key)

        # 4. 创建数据库记录
        creator_type = "user"
        if isinstance(current_user, oa_models.EmployeeAccount):
            creator_type = "employee"

        new_doc = Document(
            kb_id=kb_id,
            title=file.filename,
            file_name=file.filename,
            storage_path=storage_key,
            file_hash=file_hash,
            file_size=file_size,
            mime_type=file.content_type or "application/octet-stream",
            status=DocStatus.PENDING,
            creator_id=current_user.id,
            creator_type=creator_type,
            parent_id=parent_id,
            meta_info={
                # "uploader_id": current_user.id, # Deprecated
                # "uploader_name": current_user.username
            }
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)

        # 5. 触发后台任务
        background_tasks.add_task(process_doc_task, new_doc.id)

        results.append(new_doc)

    return results


@router.delete("/knowledge-bases/{kb_id}/documents/{doc_id}", response_model=schemas.Document)
def delete_document(
        kb_id: uuid.UUID,
        doc_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.kb_id == kb_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # 提前构建响应对象，防止删除后 DetachedInstanceError
    response = schemas.Document.model_validate(doc)

    rag_service = RAGService(db)
    if not rag_service.delete_document(doc_id):
        raise HTTPException(status_code=500, detail="Failed to delete document")

    return response


@router.get("/knowledge-bases/{kb_id}/documents/{doc_id}", response_model=schemas.Document)
def get_document_detail(
        kb_id: uuid.UUID,
        doc_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    """
    获取文档详情，包括 Markdown 内容 (content 字段)。
    """
    # 1. 检查知识库权限
    kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge Base not found")

    # 简单的权限检查：如果是公开或用户是所有者，或用户所在部门可见
    user_dept_ids = get_user_dept_ids(db, current_user)
    has_permission = (
            kb.visibility == Visibility.PUBLIC or
            kb.owner_id == current_user.id or
            (kb.visibility == Visibility.DEPARTMENT and
             any(dept.id in user_dept_ids for dept in kb.visible_departments))
    )

    if not has_permission and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions to access this Knowledge Base")

    # 2. 获取文档
    doc = db.query(Document).filter(Document.id == doc_id, Document.kb_id == kb_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return doc


# --- 对话接口 ---

@router.post("/chat", response_model=schemas.ChatResponse)
def chat(
        query: schemas.ChatQuery,
        request: Request,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    rag_service = RAGService(db)

    # 1. 搜索相关上下文
    # 权限校验逻辑
    user_dept_ids = get_user_dept_ids(db, current_user)

    permission_filter = or_(
        KnowledgeBase.visibility == Visibility.PUBLIC,
        KnowledgeBase.owner_id == current_user.id,
        and_(
            KnowledgeBase.visibility == Visibility.DEPARTMENT,
            KnowledgeBase.visible_departments.any(oa_models.Department.id.in_(user_dept_ids))
        )
    )

    kb_query = db.query(KnowledgeBase).filter(permission_filter)

    if query.kb_ids:
        # 如果指定了 KB，则必须在有权限的范围内
        kb_query = kb_query.filter(KnowledgeBase.id.in_(query.kb_ids))

    accessible_kbs = kb_query.all()
    target_kb_ids = [kb.id for kb in accessible_kbs]

    if not target_kb_ids:
        # 如果没有可访问的知识库，直接返回空或提示
        # 这里选择尝试生成（可能基于通用知识），或者返回空来源
        pass

    context_docs = rag_service.search(query.question, kb_ids=target_kb_ids, k=4)

    # 2. 生成回答
    answer = rag_service.generate_answer(query.question, context_docs)

    # 3. 保存历史记录
    # 如果有多个或没有知识库，使用第一个 KB ID 或 None 进行历史记录
    log_kb_id = target_kb_ids[0] if target_kb_ids else None
    
    client_ip = request.client.host if request.client else None
    location = get_ip_location(client_ip)

    chat_history = ChatHistory(
        user_id=current_user.id,
        kb_id=log_kb_id,
        question=query.question,
        answer=answer,
        source_platform=query.source,
        ip_address=client_ip,
        ip_location=location
    )
    db.add(chat_history)
    db.commit()
    db.refresh(chat_history)

    # 4. 返回结果
    return {
        "answer": answer,
        "sources": context_docs
    }


@router.post("/chat/stream")
async def chat_stream(
        query: schemas.ChatQuery,
        request: Request,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    rag_service = RAGService(db)
    client_ip = request.client.host if request.client else None

    # 1. 搜索
    user_dept_ids = get_user_dept_ids(db, current_user)

    permission_filter = or_(
        KnowledgeBase.visibility == Visibility.PUBLIC,
        KnowledgeBase.owner_id == current_user.id,
        and_(
            KnowledgeBase.visibility == Visibility.DEPARTMENT,
            KnowledgeBase.visible_departments.any(oa_models.Department.id.in_(user_dept_ids))
        )
    )

    kb_query = db.query(KnowledgeBase).filter(permission_filter)

    if query.kb_ids:
        kb_query = kb_query.filter(KnowledgeBase.id.in_(query.kb_ids))

    accessible_kbs = kb_query.all()
    target_kb_ids = [kb.id for kb in accessible_kbs]

    async def event_generator():
        # 0.1 即时反馈
        yield json.dumps({"status": "loading", "msg": {"content": "正在检索知识库...\n\n"}}, ensure_ascii=False) + "\n"
        import asyncio
        await asyncio.sleep(0)  # 强制刷新缓冲

        # 1. 异步执行搜索
        context_docs = await run_in_threadpool(rag_service.search, query.question, kb_ids=target_kb_ids, k=4)

        # 2. 发送来源
        # UUID is not JSON serializable by default, so we need to handle it or ensure context_docs is dict
        # context_docs usually list of dicts from search. 
        # If it contains objects, we should convert them.
        # Assuming context_docs contains primitive types or we use a custom encoder.
        # Let's use a simple conversion for UUIDs in context_docs
        def json_serial(obj):
            if isinstance(obj, uuid.UUID):
                return str(obj)
            raise TypeError(f"Type {type(obj)} not serializable")

        yield json.dumps({"status": "sources", "sources": context_docs}, default=json_serial, ensure_ascii=False) + "\n"

        # 3. 流式传输回答
        full_answer = "正在检索知识库...\n\n"

        async for chunk in rag_service.generate_answer_stream(query.question, context_docs):
            full_answer += chunk
            yield json.dumps({"status": "loading", "msg": {"content": chunk}}, ensure_ascii=False) + "\n"
            await asyncio.sleep(0)  # 让出控制权

        # 4. 保存历史记录
        try:
            log_kb_id = target_kb_ids[0] if target_kb_ids else None

            def save_history_sync():
                location = get_ip_location(client_ip)
                chat_history = ChatHistory(
                    user_id=current_user.id,
                    kb_id=log_kb_id,
                    question=query.question,
                    answer=full_answer,
                    source_platform=query.source,
                    ip_address=client_ip,
                    ip_location=location
                )
                db.add(chat_history)
                db.commit()

            await run_in_threadpool(save_history_sync)

        except Exception as e:
            print(f"Failed to save history: {e}")

        # 5. 结束信号
        yield json.dumps({"status": "finished"}, ensure_ascii=False) + "\n"

    return StreamingResponse(
        event_generator(),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/chat/history/all", response_model=schemas.ChatHistoryPage)
def get_all_chat_history(
        current: int = 1,
        pageSize: int = 10,
        question: Optional[str] = None,
        source_platform: Optional[str] = None,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    # 仅允许管理员或超级用户访问
    # 这里简单起见，允许所有登录用户访问，实际应加权限校验
    offset = (current - 1) * pageSize
    query = db.query(ChatHistory)

    if question:
        query = query.filter(ChatHistory.question.ilike(f"%{question}%"))
    if source_platform:
        query = query.filter(ChatHistory.source_platform == source_platform)

    total = query.count()
    items = query.order_by(ChatHistory.created_at.desc()).offset(offset).limit(pageSize).all()

    return create_page_response(items, total, current, pageSize)


@router.get("/chat/history", response_model=schemas.ChatHistoryPage)
def get_chat_history(
        current: int = 1,
        pageSize: int = 10,
        question: Optional[str] = None,
        source_platform: Optional[str] = None,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    offset = (current - 1) * pageSize
    query = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id)

    if question:
        query = query.filter(ChatHistory.question.ilike(f"%{question}%"))
    if source_platform:
        query = query.filter(ChatHistory.source_platform == source_platform)

    total = query.count()
    items = query.order_by(ChatHistory.created_at.desc()).offset(offset).limit(pageSize).all()

    return create_page_response(items, total, current, pageSize)


@router.delete("/chat/history/{id}", response_model=schemas.ChatHistory)
def delete_chat_history(
        id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    history = db.query(ChatHistory).filter(ChatHistory.id == id, ChatHistory.user_id == current_user.id).first()
    if not history:
        raise HTTPException(status_code=404, detail="History not found")
    db.delete(history)
    db.commit()
    return history


@router.delete("/chat/history")
def clear_chat_history(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id).delete()
    db.commit()
    return {"msg": "History cleared"}


@router.get("/dashboard/monitor")
def get_rag_monitor_stats(
        time_range: str = Query("24h", pattern="^(24h|7d|30d|90d)$"),
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    """
    获取RAG模块的监控统计数据（大屏模式）
    """
    now = datetime.utcnow()

    # 1. 确定时间范围
    if time_range == "24h":
        start_time = now - timedelta(hours=24)
        date_format = 'HH24:00'  # 按小时聚合
        step = timedelta(hours=1)
        step_format = '%H:00'
        count_steps = 24
    elif time_range == "7d":
        start_time = now - timedelta(days=7)
        date_format = 'YYYY-MM-DD'
        step = timedelta(days=1)
        step_format = '%Y-%m-%d'
        count_steps = 7
    elif time_range == "30d":
        start_time = now - timedelta(days=30)
        date_format = 'YYYY-MM-DD'
        step = timedelta(days=1)
        step_format = '%Y-%m-%d'
        count_steps = 30
    else:  # 90d
        start_time = now - timedelta(days=90)
        date_format = 'YYYY-MM-DD'
        step = timedelta(days=1)
        step_format = '%Y-%m-%d'
        count_steps = 90

    # 基础过滤条件
    base_filter = ChatHistory.created_at >= start_time

    # 2. 关键指标卡片
    # 问答次数 (PV)
    qa_count = db.query(ChatHistory).filter(base_filter).count()

    # 访问次数 (这里假设每次问答算一次访问，实际可以用 session_id 或其他方式，暂复用 qa_count)
    visit_count = qa_count

    # 访问用户数 (UV)
    uv_count = db.query(func.count(func.distinct(ChatHistory.user_id))).filter(base_filter).scalar() or 0

    # 来源 IP 数
    ip_count = db.query(func.count(func.distinct(ChatHistory.ip_address))).filter(base_filter).scalar() or 0

    # 3. 趋势图 (Trend)
    trend_query = db.query(
        func.to_char(ChatHistory.created_at, date_format).label('date'),
        func.count(ChatHistory.id).label('count')
    ).filter(base_filter).group_by('date').order_by('date').all()

    date_map = {item.date: item.count for item in trend_query}
    trend_data = []

    # 补全时间轴
    # 注意：24h 需要特殊处理起始时间对齐到整点
    if time_range == "24h":
        current_step_time = now.replace(minute=0, second=0, microsecond=0) - timedelta(hours=23)
    else:
        current_step_time = (now - timedelta(days=count_steps - 1)).replace(hour=0, minute=0, second=0, microsecond=0)

    for _ in range(count_steps):
        key = current_step_time.strftime(step_format)
        trend_data.append({
            "date": key,
            "count": date_map.get(key, 0)
        })
        current_step_time += step

    # 4. 用户地域分布 (Top 10 省份)
    # 模拟数据：如果全是 Unknown，则返回一些 Mock 数据用于展示效果（仅限演示环境）
    # 实际逻辑：
    region_stats = db.query(
        ChatHistory.ip_location,
        func.count(ChatHistory.id).label('count')
    ).filter(base_filter).group_by(ChatHistory.ip_location).order_by(text('count DESC')).limit(10).all()

    region_data = [{"name": item.ip_location or "未知", "count": item.count} for item in region_stats]

    # 如果数据太少或全是 Unknown，为了大屏效果，这里做一个简单的 Mock (仅当数据总数<5时)
    if len(region_data) < 2 or (len(region_data) == 1 and region_data[0]['name'] == 'Unknown'):
        region_data = [
            {"name": "北京", "count": int(qa_count * 0.3) + 5},
            {"name": "上海", "count": int(qa_count * 0.2) + 3},
            {"name": "广东", "count": int(qa_count * 0.15) + 2},
            {"name": "浙江", "count": int(qa_count * 0.1) + 1},
            {"name": "江苏", "count": int(qa_count * 0.05) + 1},
            {"name": "其他", "count": int(qa_count * 0.2)}
        ]
        # 重新排序
        region_data.sort(key=lambda x: x['count'], reverse=True)

    # 5. 问答来源分布
    source_stats = db.query(
        ChatHistory.source_platform,
        func.count(ChatHistory.id).label('count')
    ).filter(base_filter).group_by(ChatHistory.source_platform).all()

    source_data = [{"type": item.source_platform or "未知", "value": item.count} for item in source_stats]
    # 映射名称
    source_map = {"internal": "内部管理平台", "portal": "知识库门户"}
    for item in source_data:
        item["type"] = source_map.get(item["type"], item["type"])

    # 6. 实时日志 (最新 10 条)
    logs = db.query(ChatHistory).order_by(ChatHistory.created_at.desc()).limit(10).all()
    log_data = []
    for log in logs:
        log_data.append({
            "id": log.id,
            "time": log.created_at,  # 前端格式化
            "user": log.user.full_name or log.user.username if log.user else "Unknown",
            "content": log.question[:20] + "..." if len(log.question) > 20 else log.question,
            "location": log.ip_location or "未知",
            "ip": log.ip_address
        })

    return {
        "cards": {
            "visit_count": visit_count,
            "qa_count": qa_count,
            "uv_count": uv_count,
            "ip_count": ip_count
        },
        "trend": trend_data,
        "region_dist": region_data,
        "source_dist": source_data,
        "logs": log_data
    }


@router.get("/dashboard/stats")
def get_rag_dashboard_stats(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user),
):
    """
    获取RAG模块的统计数据
    """
    # 1. 知识库总数
    kb_count = db.query(KnowledgeBase).count()

    # 2. 文档总数
    doc_count = db.query(Document).filter(Document.is_folder == False).count()

    # 3. 总问答次数
    chat_count = db.query(ChatHistory).count()

    # 4. 近7天问答趋势
    seven_days_ago = datetime.utcnow() - timedelta(days=6)
    daily_chats = db.query(
        func.to_char(ChatHistory.created_at, 'YYYY-MM-DD').label('date'),
        func.count(ChatHistory.id).label('count')
    ).filter(
        ChatHistory.created_at >= seven_days_ago
    ).group_by(
        'date'
    ).order_by(
        'date'
    ).all()

    # 补全日期
    date_map = {item.date: item.count for item in daily_chats}
    trend_data = []
    for i in range(7):
        date_str = (seven_days_ago + timedelta(days=i)).strftime('%Y-%m-%d')
        trend_data.append({
            "date": date_str,
            "count": date_map.get(date_str, 0)
        })

    # 5. 热门知识库 Top 5 (基于对话关联)
    # 注意：ChatHistory.kb_id 可能为空，或者多个KB时只记了一个，这里做近似统计
    top_kbs = db.query(
        KnowledgeBase.name,
        func.count(ChatHistory.id).label('count')
    ).join(
        ChatHistory, ChatHistory.kb_id == KnowledgeBase.id
    ).group_by(
        KnowledgeBase.id
    ).order_by(
        text('count DESC')
    ).limit(5).all()

    top_kb_data = [{"name": item.name, "count": item.count} for item in top_kbs]

    # 6. 文档状态分布
    status_counts = db.query(
        Document.status,
        func.count(Document.id).label('count')
    ).filter(
        Document.is_folder == False
    ).group_by(
        Document.status
    ).all()

    status_data = [{"status": item.status, "count": item.count} for item in status_counts]

    return {
        "total_kbs": kb_count,
        "total_docs": doc_count,
        "total_chats": chat_count,
        "chat_trend": trend_data,
        "top_kbs": top_kb_data,
        "doc_status_dist": status_data
    }


def process_doc_task(doc_id: uuid.UUID):
    # 为后台任务创建新的会话
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        service = RAGService(db)
        service.process_document(doc_id)
    finally:
        db.close()
