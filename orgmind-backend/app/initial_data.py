import logging
import random
import string
from datetime import datetime, timezone, date
from decimal import Decimal
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models import oa
from app.models import system as system_models
from app.core import security

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_system_permissions(db):
    logger.info("Initializing System Permissions...")
    
    # Define permission tree
    system_permissions = [
        {
            "code": "system", "name": "系统管理", "type": "menu", "children": [
                {
                    "code": "system:user", "name": "用户管理", "type": "menu", "children": [
                        {"code": "system:user:list", "name": "用户列表", "type": "button"},
                        {"code": "system:user:add", "name": "用户新增", "type": "button"},
                        {"code": "system:user:edit", "name": "用户修改", "type": "button"},
                        {"code": "system:user:delete", "name": "用户删除", "type": "button"},
                    ]
                },
                {
                    "code": "system:role", "name": "角色管理", "type": "menu", "children": [
                        {"code": "system:role:list", "name": "角色列表", "type": "button"},
                        {"code": "system:role:add", "name": "角色新增", "type": "button"},
                        {"code": "system:role:edit", "name": "角色修改", "type": "button"},
                        {"code": "system:role:delete", "name": "角色删除", "type": "button"},
                    ]
                },
                {
                    "code": "system:employee-role", "name": "职员账号", "type": "menu", "children": [
                        {"code": "system:employee-role:list", "name": "账号列表", "type": "button"},
                        {"code": "system:employee-role:add", "name": "账号新增", "type": "button"},
                        {"code": "system:employee-role:edit", "name": "账号修改", "type": "button"},
                        {"code": "system:employee-role:delete", "name": "账号删除", "type": "button"},
                    ]
                },
                {
                    "code": "system:permission", "name": "权限管理", "type": "menu", "children": [
                        {"code": "system:permission:list", "name": "权限列表", "type": "button"},
                        {"code": "system:permission:add", "name": "权限新增", "type": "button"},
                        {"code": "system:permission:edit", "name": "权限修改", "type": "button"},
                        {"code": "system:permission:delete", "name": "权限删除", "type": "button"},
                    ]
                },
                 {
                    "code": "system:dict", "name": "字典管理", "type": "menu", "children": [
                        {"code": "system:dict:list", "name": "字典列表", "type": "button"},
                        {"code": "system:dict:add", "name": "字典新增", "type": "button"},
                        {"code": "system:dict:edit", "name": "字典修改", "type": "button"},
                        {"code": "system:dict:delete", "name": "字典删除", "type": "button"},
                    ]
                }
            ]
        },
        {
            "code": "oa", "name": "OA管理", "type": "menu", "children": [
                {
                    "code": "oa:department", "name": "部门管理", "type": "menu", "children": [
                        {"code": "oa:department:list", "name": "部门列表", "type": "button"},
                        {"code": "oa:department:add", "name": "部门新增", "type": "button"},
                        {"code": "oa:department:edit", "name": "部门修改", "type": "button"},
                        {"code": "oa:department:delete", "name": "部门删除", "type": "button"},
                    ]
                },
                {
                    "code": "oa:position", "name": "岗位管理", "type": "menu", "children": [
                        {"code": "oa:position:list", "name": "岗位列表", "type": "button"},
                        {"code": "oa:position:add", "name": "岗位新增", "type": "button"},
                        {"code": "oa:position:edit", "name": "岗位修改", "type": "button"},
                        {"code": "oa:position:delete", "name": "岗位删除", "type": "button"},
                    ]
                },
                {
                    "code": "oa:employee", "name": "职员管理", "type": "menu", "children": [
                        {"code": "oa:employee:list", "name": "职员列表", "type": "button"},
                        {"code": "oa:employee:add", "name": "职员新增", "type": "button"},
                        {"code": "oa:employee:edit", "name": "职员修改", "type": "button"},
                        {"code": "oa:employee:delete", "name": "职员删除", "type": "button"},
                    ]
                },
                {
                    "code": "oa:salary", "name": "薪酬项管理", "type": "menu", "children": [
                        {"code": "oa:salary:list", "name": "薪酬项列表", "type": "button"},
                        {"code": "oa:salary:add", "name": "薪酬项新增", "type": "button"},
                        {"code": "oa:salary:edit", "name": "薪酬项修改", "type": "button"},
                        {"code": "oa:salary:delete", "name": "薪酬项删除", "type": "button"},
                    ]
                }
            ]
        },
        {
            "code": "rag", "name": "知识库管理", "type": "menu", "children": [
                {
                    "code": "rag:kb", "name": "知识库", "type": "menu", "children": [
                        {"code": "rag:kb:list", "name": "知识库列表", "type": "button"},
                        {"code": "rag:kb:add", "name": "知识库新增", "type": "button"},
                        {"code": "rag:kb:edit", "name": "知识库修改", "type": "button"},
                        {"code": "rag:kb:delete", "name": "知识库删除", "type": "button"},
                    ]
                },
                {
                    "code": "rag:document", "name": "文档管理", "type": "menu", "children": [
                        {"code": "rag:document:list", "name": "文档列表", "type": "button"},
                        {"code": "rag:document:add", "name": "文档上传", "type": "button"},
                        {"code": "rag:document:delete", "name": "文档删除", "type": "button"},
                    ]
                },
                {
                    "code": "rag:chat", "name": "AI对话", "type": "menu", "children": [
                        {"code": "rag:chat:use", "name": "对话使用", "type": "button"},
                        {"code": "rag:chat:history", "name": "对话历史", "type": "button"},
                    ]
                }
            ]
        },
        {
            "code": "exam", "name": "考试中心", "type": "menu", "children": [
                {
                    "code": "exam:list", "name": "考试列表", "type": "menu", "children": [
                        {"code": "exam:list", "name": "查看考试列表", "type": "button"},
                        {"code": "exam:create", "name": "创建考试", "type": "button"},
                        {"code": "exam:edit", "name": "编辑考试", "type": "button"},
                        {"code": "exam:delete", "name": "删除考试", "type": "button"},
                        {"code": "exam:publish", "name": "发布考试", "type": "button"},
                    ]
                },
                {
                    "code": "exam:take", "name": "在线考试", "type": "menu", "children": [
                        {"code": "exam:take", "name": "参加考试", "type": "button"},
                        {"code": "exam:submit", "name": "提交试卷", "type": "button"},
                    ]
                },
                {
                    "code": "exam:result", "name": "成绩管理", "type": "menu", "children": [
                        {"code": "exam:view-result", "name": "查看成绩", "type": "button"},
                        {"code": "exam:view-all-results", "name": "查看所有成绩", "type": "button"},
                        {"code": "exam:export-results", "name": "导出成绩", "type": "button"},
                    ]
                },
                {
                    "code": "exam:config", "name": "考试配置", "type": "menu", "children": [
                        {"code": "exam:manage-questions", "name": "管理题目", "type": "button"},
                    ]
                }
            ]
        }
    ]

    all_permissions = []

    def create_permission_recursive(data, parent_id=None):
        perm = db.query(system_models.Permission).filter(system_models.Permission.code == data["code"]).first()
        if not perm:
            perm = system_models.Permission(
                code=data["code"],
                name=data["name"],
                type=data.get("type", "menu"),
                parent_id=parent_id,
                sort=data.get("sort", 0)
            )
            db.add(perm)
            db.flush() # Get ID
            logger.info(f"Created permission: {data['code']}")
        
        all_permissions.append(perm)
        
        if "children" in data:
            for child in data["children"]:
                create_permission_recursive(child, parent_id=perm.id)

    for p in system_permissions:
        create_permission_recursive(p)
    
    db.commit()
    logger.info("System Permissions initialized.")
    return all_permissions

def init_roles_and_users(db, permissions):
    logger.info("Initializing Roles and Users...")
    
    # 1. Create Admin Role
    admin_role = db.query(system_models.Role).filter(system_models.Role.code == "admin").first()
    if not admin_role:
        admin_role = system_models.Role(
            code="admin",
            name="系统管理员",
            remark="拥有所有系统权限"
        )
        db.add(admin_role)
        db.flush()
        logger.info("Created admin role.")

    # 1.1 Create Staff Role
    staff_role = db.query(system_models.Role).filter(system_models.Role.code == "staff").first()
    if not staff_role:
        staff_role = system_models.Role(
            code="staff",
            name="普通职员",
            remark="普通职员权限"
        )
        db.add(staff_role)
        db.flush()
        logger.info("Created staff role.")

    
    # Assign all permissions to admin role
    # First, get all current permissions of the role to avoid duplicates (though relationship assignment usually handles replace)
    # Ideally we just append new ones or reset. For init, let's reset or ensure they are there.
    # Simple way: just set the list.
    
    # We need to fetch all permissions from DB to ensure we have the objects attached to session
    # (The passed 'permissions' might be partial if some already existed)
    all_perms_db = db.query(system_models.Permission).all()
    admin_role.permissions = all_perms_db
    db.commit()
    
    # 2. Create/Update Admin User
    admin_user = db.query(system_models.User).filter(system_models.User.username == "admin").first()
    if not admin_user:
        admin_user = system_models.User(
            username="admin",
            email="admin@example.com",
            full_name="Administrator",
            hashed_password=security.get_password_hash("ant.design"),
            is_superuser=True,
            status="active"
        )
        db.add(admin_user)
        logger.info("Created admin user.")
    else:
        # Ensure admin has the role
        pass
    
    db.flush()
    
    if admin_role not in admin_user.roles:
        admin_user.roles.append(admin_role)
        
    db.commit()
    logger.info("Roles and Users initialized.")

def init_oa_salary_items(db):
    if db.query(oa.SalaryItem).first():
        return
    
    logger.info("Initializing Salary Items...")
    items = [
        oa.SalaryItem(name="基本工资", code="basic_salary", item_type="fixed", is_taxable=True),
        oa.SalaryItem(name="岗位津贴", code="position_allowance", item_type="fixed", is_taxable=True),
        oa.SalaryItem(name="交通补贴", code="transport_allowance", item_type="fixed", is_taxable=False),
        oa.SalaryItem(name="餐补", code="meal_allowance", item_type="fixed", is_taxable=False),
        oa.SalaryItem(name="绩效奖金", code="performance_bonus", item_type="variable", is_taxable=True),
        oa.SalaryItem(name="社保个人部分", code="social_security_personal", item_type="deduction", is_taxable=False),
        oa.SalaryItem(name="公积金个人部分", code="housing_fund_personal", item_type="deduction", is_taxable=False),
    ]
    db.add_all(items)
    db.commit()
    logger.info("Salary Items initialized.")

def init_oa_employees(db):
    if db.query(oa.Employee).count() >= 200:
        logger.info("Employees already initialized (>= 200).")
        return

    logger.info("Initializing 200 Employees...")
    
    depts = db.query(oa.Department).all()
    positions = db.query(oa.Position).all()
    
    if not depts or not positions:
        logger.warning("Departments or Positions missing, cannot create employees.")
        return

    # 中文姓氏
    surnames = ["李", "王", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴", 
                "徐", "孙", "hu", "朱", "高", "林", "何", "郭", "马", "罗", 
                "梁", "宋", "郑", "谢", "韩", "唐", "冯", "于", "董", "萧"]
    # 中文名字字符（简化，可根据性别组合）
    names_male = ["伟", "强", "磊", "洋", "勇", "军", "杰", "涛", "超", "明", 
                  "刚", "平", "辉", "鹏", "华", "飞", "鑫", "波", "斌", "浩"]
    names_female = ["芳", "娜", "敏", "静", "秀", "娟", "英", "华", "慧", "巧", 
                    "美", "静", "丽", "艳", "丹", "霞", "燕", "琳", "萍", "玲"]

    employees = []
    for i in range(200):
        dept = random.choice(depts)
        pos = random.choice(positions)
        
        # 随机性别
        gender = random.choice(["male", "female"])
        
        # 随机中文名
        surname = random.choice(surnames)
        if gender == "male":
            given_name = "".join(random.choices(names_male, k=random.randint(1, 2)))
        else:
            given_name = "".join(random.choices(names_female, k=random.randint(1, 2)))
        
        name = surname + given_name
        
        # 拼音或随机字符作为邮箱前缀 (这里简化用随机字符防止拼音库依赖)
        random_str = ''.join(random.choices(string.ascii_lowercase, k=6))
        email = f"emp_{random_str}_{i}@example.com"
        phone = f"138{random.randint(10000000, 99999999)}"
        
        employee = oa.Employee(
            name=name,
            gender=gender,
            email=email,
            phone=phone,
            status="active",
            join_date=datetime.now().date(),
            department_id=dept.id,
            position_id=pos.id
        )
        employees.append(employee)
    
    db.add_all(employees)
    db.commit()
    logger.info("200 Employees initialized.")

def init_oa_employee_accounts(db):
    """Initialize employee accounts with default password"""
    # Check if we have employees but no accounts
    employee_count = db.query(oa.Employee).count()
    account_count = db.query(oa.EmployeeAccount).count()
    
    if employee_count > 0 and account_count < employee_count:
        logger.info("Initializing Employee Accounts...")
        employees = db.query(oa.Employee).all()
        staff_role = db.query(system_models.Role).filter(system_models.Role.code == "staff").first()
        
        accounts_to_create = []
        for emp in employees:
            # Check if account exists
            if not db.query(oa.EmployeeAccount).filter(oa.EmployeeAccount.employee_id == emp.id).first():
                # Use phone as username, fallback to email if phone is missing (though phone is randomly generated in init)
                username = emp.phone if emp.phone else emp.email
                
                account = oa.EmployeeAccount(
                    employee_id=emp.id,
                    username=username,
                    hashed_password=security.get_password_hash("123456"),
                    status="active"
                )
                if staff_role:
                    account.roles.append(staff_role)
                accounts_to_create.append(account)
        
        if accounts_to_create:
            db.add_all(accounts_to_create)
            db.commit()
            logger.info(f"{len(accounts_to_create)} Employee Accounts initialized.")
    else:
        logger.info("Employee Accounts already initialized.")

def init_db(db):
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # --- OA Initialization (Keep existing logic) ---
    if not db.query(oa.Department).first():
        logger.info("Initializing Departments...")
        # Root Department
        dept_root = oa.Department(name="总经办", code="GM001", leader="Admin")
        db.add(dept_root)
        db.flush() 
        
        # Level 1 Departments
        dept_hr = oa.Department(name="人事部", code="HR001", parent_id=dept_root.id, leader="HR Manager")
        dept_finance = oa.Department(name="财务部", code="FIN001", parent_id=dept_root.id, leader="Finance Manager")
        dept_tech = oa.Department(name="技术部", code="TECH001", parent_id=dept_root.id, leader="CTO")
        dept_market = oa.Department(name="市场部", code="MKT001", parent_id=dept_root.id, leader="Marketing Director")
        
        db.add_all([dept_hr, dept_finance, dept_tech, dept_market])
        db.flush()
        
        # Level 2 Departments
        dept_dev1 = oa.Department(name="研发一部", code="DEV001", parent_id=dept_tech.id, leader="Dev Manager 1")
        dept_dev2 = oa.Department(name="研发二部", code="DEV002", parent_id=dept_tech.id, leader="Dev Manager 2")
        
        db.add_all([dept_dev1, dept_dev2])
        db.commit()
        logger.info("Departments initialized.")
    
    # ... (Skipping full OA recreation if it exists, to save space/time, but logic is fine) ...
    # Initialize Positions if not exist
    if not db.query(oa.Position).first():
        logger.info("Initializing Positions...")
        positions = [
            oa.Position(name="总经理", code="GM", level=1),
            oa.Position(name="部门经理", code="MGR", level=2),
            oa.Position(name="主管", code="SUP", level=3),
            oa.Position(name="高级工程师", code="SE", level=4),
            oa.Position(name="工程师", code="ENG", level=5),
            oa.Position(name="专员", code="SPC", level=5),
            oa.Position(name="实习生", code="INT", level=6),
        ]
        db.add_all(positions)
        db.commit()
        logger.info("Positions initialized.")

    # --- System Module Initialization ---
    perms = init_system_permissions(db)
    init_roles_and_users(db, perms)

    # --- OA Data Initialization ---
    init_oa_salary_items(db)
    init_oa_employees(db)
    init_oa_employee_accounts(db)