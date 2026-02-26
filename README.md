# OrgMind 组织智能系统技术文档

## 📖 目录

- [1. 项目概述](#1-项目概述)
- [2. 技术栈](#2-技术栈)
- [3. 系统架构](#3-系统架构)
- [4. 后端详细设计](#4-后端详细设计)
- [5. 前端详细设计](#5-前端详细设计)
- [6. 部署指南](#6-部署指南)
- [7. 系统功能截图](#7-系统功能截图)
- [8. 学习交流](#8-学习交流)
---

<a id="1-项目概述"></a>
## 1. 项目概述 (Project Overview)

OrgMind 是一个集成了 **OA 组织架构管理**、**RAG 知识库问答**、**AI 智能考试** 与 **企业级权限管理** 的现代化组织智能系统。

系统采用前后端分离架构，前端基于 Ant Design Pro (React) 构建，后端采用高性能的 FastAPI (Python) 框架，底层数据存储使用 PostgreSQL 并结合 `pgvector` 实现向量检索能力。

---

<a id="2-技术栈"></a>
## 2. 技术栈 (Technology Stack)

### 2.1 前端 (Frontend)
*   **核心框架**: [React 19](https://react.dev/) + [UmiJS Max](https://umijs.org/)
*   **UI 组件库**: [Ant Design 5.x](https://ant.design/) + [Ant Design Pro Components](https://procomponents.ant.design/)
*   **语言**: TypeScript 5.x
*   **图表可视化**: @ant-design/charts (G2Plot)
*   **构建工具**: Webpack (via Umi)
*   **代码规范**: Biome, ESLint, Prettier

### 2.2 后端 (Backend)
*   **Web 框架**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+) - 高性能异步框架
*   **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) - 数据库交互
*   **数据库**: PostgreSQL + **pgvector** 插件 (向量存储)
*   **AI/LLM 框架**: [LangChain](https://www.langchain.com/) - 构筑 RAG 流水线
*   **数据验证**: Pydantic v2
*   **身份认证**: OAuth2 + JWT (python-jose)
*   **文档处理**: pypdf, docx2txt, python-docx
*   **分词工具**: Jieba (中文分词)

### 2.3 基础设施 (Infrastructure)
*   **向量数据库**: PostgreSQL (pgvector)
*   **模型服务**: 兼容 OpenAI 接口的模型服务 (默认配置接入百智云/DeepSeek)
*   **反向代理**: Nginx (生产环境建议)

---
<a id="3-系统架构"></a>
## 3. 系统架构 (System Architecture)

### 3.1 核心模块划分

| 模块 | 功能描述 | 关键技术点 |
| :--- | :--- | :--- |
| **OA 管理** (OA) | 部门、岗位、职员、薪酬项管理 | 树形结构存储 (`ltree` 或递归查询)，复杂关联查询 |
| **RAG 知识库** (RAG) | 文档上传、解析、切片、向量化、智能问答 | LangChain TextSplitter, Embedding (BGE-M3), Rerank, Vector Search |
| **考试中心** (Exam) | 试卷编辑、在线考试、自动阅卷、成绩看板 | 倒计时控制、防作弊逻辑、自动评分算法 |
| **系统管理** (System) | 用户、角色、权限 (RBAC)、数据字典 | 基于 RBAC 的动态权限控制，前端路由鉴权 |
| **门户** (Portal) | 员工自助服务、AI 助手入口、通知公告 | 响应式布局，个性化推荐 |

### 3.2 核心模块功能矩阵

| 模块 | 主要功能 | 技术亮点 | 关键截图 |
|-----|---------|----------|----------|
| **🏢 OA 管理** | 部门、岗位、职员、薪酬管理 | 树形结构存储、复杂关联查询 | [部门管理](./docs/部门管理.png) |
| **📚 RAG 知识库** | 文档管理、智能问答、向量检索 | LangChain + Embedding + Rerank | [知识库列表](./docs/知识库列表.png) |
| **📝 考试中心** | AI出题、在线考试、成绩分析 | 倒计时控制、防作弊、自动评分 | [考试列表](./docs/考试列表.png) |
| **⚙️ 系统管理** | 用户、角色、权限、字典 | RBAC权限模型、动态路由 | [权限管理](./docs/权限管理.png) |
| **🚪 员工门户** | 自助服务、AI助手、通知 | 响应式布局、个性化推荐 | [门户页面](./docs/门户页面.png) |

### 3.3 核心业务实体关系 (ER Diagram)

![核心业务实体关系图](./docs/核心业务实体关系图.png)
*展示组织架构、知识库与考试中心三大核心领域的实体关系，重点设计包括部门树路径枚举、统一权限模型及题目溯源机制。*

### 3.4 AI 智能问答流程 (RAG Flow)

![智能问答时序图](./docs/智能问答时序图.png)
*展示员工发起 AI 提问时的完整处理流程，包含权限注入、元数据过滤及敏感审计等关键安全设计。*

**核心流程说明：**
1.  **文档上传**: 用户上传 PDF/Word/Markdown 文档
2.  **解析与切片**: 后端服务提取文本，使用 LangChain 进行语义切片
3.  **向量化**: 调用 Embedding 模型 (默认 `bge-m3`) 将文本转换为向量
4.  **存储**: 向量数据存入 PostgreSQL `pgvector` 字段
5.  **检索与生成**: 用户提问 → 生成问题向量 → 数据库相似度检索 → Rerank 重排序 → LLM 生成回答

### 3.5 考试系统核心流程 (Exam System Flow)

![考试系统核心流程架构图](./docs/考试系统核心流程架构图.png)
*展示从 AI 辅助出题、RESTful 试卷交互到即时规则判分的完整闭环流程。*

**考试系统亮点：**
- **AI智能出题**: 基于知识库内容自动生成考试题目
- **防作弊机制**: 倒计时控制、切屏检测、答案锁定
- **自动评分**: 客观题即时评分，主观题AI辅助评分
- **成绩分析**: 多维度成绩统计和可视化展示

---
<a id="4-后端详细设计"></a>
## 4. 后端详细设计 (Backend Details)

### 4.1 目录结构 (`orgmind-backend`)
```bash
orgmind-backend/
├── app/
│   ├── api/             # API 路由定义 (v1/endpoints)
│   ├── core/            # 核心配置 (config.py, security.py)
│   ├── db/              # 数据库连接与基类 (session.py, base.py)
│   ├── models/          # SQLAlchemy 数据模型 (ORM)
│   ├── schemas/         # Pydantic 数据验证模型 (DTO)
│   ├── services/        # 复杂业务逻辑 (rag.py, exam.py, llm.py)
│   └── utils/           # 工具函数
├── data/                # 静态文件存储 (uploads, img)
├── main.py              # 应用入口
├── requirements.txt     # 依赖列表
└── enable_pgvector.py   # 数据库插件初始化脚本
```

### 4.2 关键配置 (`app/core/config.py`)
系统通过环境变量或默认值配置核心参数：
*   **Database**: PostgreSQL 连接串。
*   **Security**: `SECRET_KEY`, `ALGORITHM` (HS256)。
*   **LLM Models (AI 模型配置)**:
    为了简化集成流程，本项目目前**一次性接入了 [长亭百智云](https://baizhi.cloud/landing/model-square)** 的模型广场服务，涵盖了 RAG 所需的全套模型能力。
    *   **智能对话模型 (必须配置)**: 负责最终的答案生成与逻辑推理 (默认配置: `deepseek-v3`)。
    *   **向量模型 (必须配置)**: 负责知识库文档的语义向量化 (默认配置: `bge-m3`)。
    *   **重排序模型 (必须配置)**: 负责对初步检索结果进行语义重排序，提升 RAG 准确率 (默认配置: `bge-reranker-v2-m3`)。
    
    > *说明：虽然默认接入百智云，但系统底层基于标准 OpenAI 接口协议封装。如果您需要对接 Azure OpenAI、阿里通义千问或本地部署的 Ollama 模型，只需在 `.env` 文件中修改对应的 `BASE_URL` 和 `API_KEY` 即可自行替换。*

---
<a id="5-前端详细设计"></a>
## 5. 前端详细设计 (Frontend Details)

### 5.1 目录结构 (`orgmind-frontend`)
```bash
orgmind-frontend/
├── config/              # Umi 配置 (routes.ts, proxy.ts)
├── src/
│   ├── components/      # 全局公共组件
│   ├── pages/           # 页面组件
│   │   ├── OA/          # OA 模块页面
│   │   ├── RAG/         # RAG 模块页面
│   │   ├── Exam/        # 考试模块页面
│   │   └── System/      # 系统管理页面
│   ├── services/        # API 请求层 (定义后端接口调用)
│   ├── access.ts        # 权限控制定义
│   └── app.tsx          # 运行时配置 (初始状态、布局)
└── types/               # TypeScript 类型定义
```

### 5.2 路由与权限 (`config/routes.ts`)
路由配置集成了菜单生成与权限校验：
```typescript
{
  path: '/oa/department',
  name: '部门管理',
  component: './OA/Department',
  access: 'canOaDepartmentList', // 对应 src/access.ts 中的权限判断
}
```

---
<a id="6-部署指南"></a>
## 6. 部署指南 (Deployment Guide)

### 6.1 前置要求
*   Python 3.11+
*   Node.js 20+
*   PostgreSQL 15+ (必须安装 `vector` 扩展)

### 6.2 后端启动
1.  安装依赖: `pip install -r requirements.txt`
2.  初始化数据库: `python enable_pgvector.py` (确保 PG 已安装 vector 插件)
3.  启动服务: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

### 6.3 前端启动
1.  安装依赖: `npm install`
2.  启动开发服: `npm run start` (默认端口 8000，需在 `config/proxy.ts` 配置后端代理)

### 6.4 环境变量
建议在后端根目录创建 `.env` 文件覆盖 `app/core/config.py` 中的默认设置，特别是 `CHAT_API_KEY` 和数据库密码。

---
<a id="7-系统功能截图"></a>
## 7. 系统功能截图 (System Screenshots)

### 7.1 门户与首页

#### 系统首页
![首页](./docs/首页.png)
*系统总览仪表板，展示关键业务指标和快捷入口*

#### 员工门户
![门户页面](./docs/门户页面.png)
*员工自助服务门户，集成个人信息、通知公告和快捷功能*

#### 门户智能问答
![门户智能问答](./docs/门户页面下的智能问答.png)
*基于RAG知识库的智能问答功能，员工可快速获取业务知识*

#### 门户配置
![门户落地页配置](./docs/门户落地页配置.png)
*可配置的门户落地页，支持个性化定制*

### 7.2 组织架构管理 (OA)

#### 部门管理
![部门管理](./docs/部门管理.png)
*树形组织架构管理，支持多级部门结构和拖拽排序*

#### 岗位管理
![岗位管理](./docs/岗位管理.png)
*岗位体系管理，定义岗位职责和汇报关系*

#### 职员管理
![职员管理](./docs/职员管理.png)
*员工信息管理，包括基本信息、岗位分配和状态管理*

#### 职员角色分配
![职员与角色](./docs/职员与角色.png)
*员工角色权限分配，支持一人多角色和权限继承*

#### 薪酬项管理
![薪酬项管理](./docs/薪酬项管理.png)
*薪酬结构配置，支持自定义薪酬项目和计算公式*

### 7.3 RAG知识库系统

#### 知识库列表
![知识库列表](./docs/知识库列表.png)
*企业知识库管理，支持多知识库和权限隔离*

#### 文档管理
![文档管理](./docs/文档管理.png)
*文档上传、分类和版本管理，支持多种文档格式*

#### 文档浏览
![文档浏览](./docs/文档浏览.png)
*在线文档预览，支持高亮标注和目录导航*

#### 智能问答界面
![智能问答](./docs/文档智能问答.png)
*基于上传文档的智能问答，支持多轮对话和上下文理解*

#### 对话历史记录
![对话历史记录](./docs/对话历史记录.png)
*用户问答历史管理，支持对话记录查看和重新提问*

#### 智能问答监控
![智能问答监控](./docs/智能问答监控.png)
*系统监控面板，实时展示问答使用情况和性能指标*

### 7.4 考试中心

#### 考试列表
![考试列表](./docs/考试列表.png)
*考试管理列表，展示考试状态、参与人数和创建信息*

#### AI智能生成试卷
![智能生成后可编辑试卷](./docs/智能生成后可编辑试卷.png)
*基于知识库的AI智能出题，支持人工编辑和题目溯源*

#### 在线考试界面
*考试进行页面，支持倒计时、防切屏和自动保存功能*

#### 考试结果
![考试结果](./docs/考试结果.png)
*个人考试成绩展示，包含得分、答题详情和错题解析*

#### 成绩看板
![成绩看板](./docs/成绩看板.png)
*全员考试成绩统计分析，支持多维度数据展示*

### 7.5 系统管理

#### 用户管理
![用户管理](./docs/用户管理.png)
*系统用户账号管理，支持用户状态控制和密码重置*

#### 角色管理
![角色管理](./docs/角色管理.png)
*角色权限管理，支持角色层级和权限继承*

#### 权限管理
![权限管理](./docs/权限管理.png)
*细粒度权限控制，支持菜单、按钮级别的权限配置*

#### 个人设置
![个人设置](./docs/个人设置.png)
*用户个人中心，支持个人信息修改和密码设置*

---


<a id="8-学习交流"></a>
### 8. 学习交流

| 微信：PJ221BBB            | 公众号：布鲁的Python之旅       |
|------------------------|-----------------------|
| ![个人微信](./docs/wx.png) | ![公众号](./docs/GZ.png) |
