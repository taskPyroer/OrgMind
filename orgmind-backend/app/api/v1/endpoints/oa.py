from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.api import deps
from app.models import system as system_models
from app.models import oa as models
from app.schemas import oa as schemas
from app.utils.response import create_page_response

router = APIRouter()


# --- 部门 ---
@router.post("/departments/", response_model=schemas.Department)
def create_department(
        dept: schemas.DepartmentCreate,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    db_dept = models.Department(
        name=dept.name,
        parent_id=dept.parent_id,
        leader=dept.leader,
        code=dept.code
    )
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept


@router.get("/departments/", response_model=schemas.DepartmentPage)
def read_departments(
        current: int = 1,
        pageSize: int = 20,
        name: str = None,
        code: str = None,
        leader: str = None,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    """
    获取部门列表 (返回分页数据)
    支持按名称、代码、负责人模糊查询
    """
    query = db.query(models.Department)

    if name:
        query = query.filter(models.Department.name.like(f"%{name}%"))
    if code:
        query = query.filter(models.Department.code.like(f"%{code}%"))
    if leader:
        query = query.filter(models.Department.leader.like(f"%{leader}%"))

    total = query.count()
    data = query.offset((current - 1) * pageSize).limit(pageSize).all()

    return create_page_response(data, total, current, pageSize)


@router.get("/departments/{dept_id}", response_model=schemas.Department)
def read_department(
        dept_id: int,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.put("/departments/{dept_id}", response_model=schemas.Department)
def update_department(
        dept_id: int,
        dept_in: schemas.DepartmentUpdate,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    """
    更新部门信息
    """
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    update_data = dept_in.model_dump(exclude_unset=True)

    # 简单的防循环引用检查
    if "parent_id" in update_data and update_data["parent_id"] == dept_id:
        raise HTTPException(status_code=400, detail="Cannot set parent_id to self")

    for field, value in update_data.items():
        setattr(dept, field, value)

    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/departments/{dept_id}", response_model=schemas.Department)
def delete_department(
        dept_id: int,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    """
    删除部门
    """
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    # 检查是否有子部门
    children_count = db.query(models.Department).filter(models.Department.parent_id == dept_id).count()
    if children_count > 0:
        raise HTTPException(status_code=400,
                            detail="Cannot delete department with sub-departments. Please delete or move them first.")

    response = schemas.Department.model_validate(dept)
    db.delete(dept)
    db.commit()
    return response


# --- 岗位 ---
@router.post("/positions/", response_model=schemas.Position)
def create_position(
        item: schemas.PositionCreate,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    db_item = models.Position(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/positions/", response_model=schemas.PositionPage)
def read_positions(
        current: int = 1,
        pageSize: int = 20,
        name: str = None,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    query = db.query(models.Position)
    if name:
        query = query.filter(models.Position.name.like(f"%{name}%"))

    total = query.count()
    data = query.offset((current - 1) * pageSize).limit(pageSize).all()

    return create_page_response(data, total, current, pageSize)


@router.put("/positions/{position_id}", response_model=schemas.Position)
def update_position(
        position_id: int,
        item_in: schemas.PositionUpdate,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    item = db.query(models.Position).filter(models.Position.id == position_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Position not found")

    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/positions/{position_id}", response_model=schemas.Position)
def delete_position(
        position_id: int,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    item = db.query(models.Position).filter(models.Position.id == position_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Position not found")

    # 检查是否已有员工使用该岗位
    emp_count = db.query(models.Employee).filter(models.Employee.position_id == position_id).count()
    if emp_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete position currently assigned to employees.")

    response = schemas.Position.model_validate(item)
    db.delete(item)
    db.commit()
    return response


# --- 员工 ---
@router.post("/employees/", response_model=schemas.Employee)
def create_employee(
        emp: schemas.EmployeeCreate,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    db_emp = models.Employee(**emp.model_dump())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp


@router.get("/employees/", response_model=schemas.EmployeePage)
def read_employees(
        current: int = 1,
        pageSize: int = 20,
        name: str = None,
        department_id: int = None,
        status: str = None,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    query = db.query(models.Employee).options(
        joinedload(models.Employee.department),
        joinedload(models.Employee.position)
    )

    if name:
        query = query.filter(models.Employee.name.like(f"%{name}%"))
    if department_id:
        query = query.filter(models.Employee.department_id == department_id)
    if status:
        query = query.filter(models.Employee.status == status)

    total = query.count()
    data = query.offset((current - 1) * pageSize).limit(pageSize).all()

    return create_page_response(data, total, current, pageSize)


@router.get("/employees/{emp_id}", response_model=schemas.Employee)
def read_employee(
        emp_id: int,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    emp = db.query(models.Employee).options(
        joinedload(models.Employee.department),
        joinedload(models.Employee.position)
    ).filter(models.Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.put("/employees/{emp_id}", response_model=schemas.Employee)
def update_employee(
        emp_id: int,
        emp_in: schemas.EmployeeUpdate,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = emp_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(emp, field, value)

    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.delete("/employees/{emp_id}", response_model=schemas.Employee)
def delete_employee(
        emp_id: int,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    emp = db.query(models.Employee).options(
        joinedload(models.Employee.department),
        joinedload(models.Employee.position)
    ).filter(models.Employee.id == emp_id).first()

    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # 删除前先转换为 Schema，避免删除后出现 DetachedInstanceError
    result = schemas.Employee.model_validate(emp)

    # 检查并删除关联的职员账号
    if emp.account:
        db.delete(emp.account)

    db.delete(emp)
    db.commit()
    return result


# --- 薪酬项 ---
@router.post("/salary-items/", response_model=schemas.SalaryItem)
def create_salary_item(
        item: schemas.SalaryItemCreate,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    db_item = models.SalaryItem(
        name=item.name,
        code=item.code,
        item_type=item.item_type,
        is_taxable=item.is_taxable
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/salary-items/", response_model=schemas.SalaryItemPage)
def read_salary_items(
        current: int = 1,
        pageSize: int = 20,
        name: Optional[str] = None,
        code: Optional[str] = None,
        item_type: Optional[str] = None,
        is_taxable: Optional[bool] = None,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    query = db.query(models.SalaryItem)

    if name:
        query = query.filter(models.SalaryItem.name.like(f"%{name}%"))
    if code:
        query = query.filter(models.SalaryItem.code.like(f"%{code}%"))
    if item_type:
        query = query.filter(models.SalaryItem.item_type == item_type)
    if is_taxable is not None:
        query = query.filter(models.SalaryItem.is_taxable == is_taxable)

    total = query.count()
    data = query.offset((current - 1) * pageSize).limit(pageSize).all()

    return create_page_response(data, total, current, pageSize)


@router.put("/salary-items/{item_id}", response_model=schemas.SalaryItem)
def update_salary_item(
        item_id: int,
        item_in: schemas.SalaryItemUpdate,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    item = db.query(models.SalaryItem).filter(models.SalaryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Salary item not found")

    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/salary-items/{item_id}", response_model=schemas.SalaryItem)
def delete_salary_item(
        item_id: int,
        db: Session = Depends(deps.get_db),
        current_user: system_models.User = Depends(deps.get_current_active_user)
):
    item = db.query(models.SalaryItem).filter(models.SalaryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Salary item not found")

    response = schemas.SalaryItem.model_validate(item)
    db.delete(item)
    db.commit()
    return response
