// @ts-ignore
/* eslint-disable */

declare namespace API {
  type CurrentUser = {
    name?: string;
    avatar?: string;
    userid?: string;
    email?: string;
    signature?: string;
    title?: string;
    group?: string;
    tags?: { key?: string; label?: string }[];
    notifyCount?: number;
    unreadCount?: number;
    country?: string;
    access?: string;
    permissions?: string[];
    geographic?: {
      province?: { label?: string; key?: string };
      city?: { label?: string; key?: string };
    };
    address?: string;
    phone?: string;
  };

  type LoginResult = {
    status?: string;
    type?: string;
    currentAuthority?: string;
    token?: string;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type Page<T> = {
    data: T[];
    total: number;
    success: boolean;
    current: number;
    pageSize: number;
  };

  type LoginParams = {
    username?: string;
    password?: string;
    autoLogin?: boolean;
    type?: string;
  };

  type ErrorResponse = {
    /** 业务约定的错误码 */
    errorCode: string;
    /** 业务上的错误信息 */
    errorMessage?: string;
    /** 业务上的请求是否成功 */
    success?: boolean;
  };

  // --- RAG Types ---

  type CreatorInfo = {
    id: number;
    name: string;
    username?: string;
    type: 'user' | 'employee';
  };

  type KnowledgeBase = {
    id: string;
    name: string;
    description?: string;
    owner_id: number;
    department_id?: number;
    visibility: 'private' | 'department' | 'public';
    visible_departments?: { id: number; name: string }[];
    created_at: string;
    updated_at: string;
    creator?: CreatorInfo;
  };

  type Document = {
    id: string;
    kb_id: string;
    title: string;
    content?: string;
    file_path?: string;
    chunk_count: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error_msg?: string;
    created_at: string;
    updated_at: string;
    creator?: CreatorInfo;
    parent_id?: string;
    is_folder?: boolean;
    children?: Document[];
    isLeaf?: boolean;
  };

  type FolderCreate = {
    title: string;
    kb_id: string;
    parent_id?: string;
  };

  // --- Exam Types ---
  type Question = {
    id: string;
    content: string;
    type: 'single_choice' | 'multiple_choice' | 'true_false';
    options: { label: string; content: string }[];
    answer?: string;
    explanation?: string;
    source_doc_id?: string;
  };

  type Exam = {
    id: string;
    title: string;
    description?: string;
    kb_id: string;
    status: 'draft' | 'published' | 'archived' | 'generating' | 'failed';
    question_count: number;
    duration?: number;
    pass_score: number;
    created_by: number;
    created_at: string;
    updated_at: string;
    questions?: Question[];
  };

  type ExamDetail = Exam & {
    questions: Question[];
  };

  type QuestionUpdate = {
    id?: string;
    content?: string;
    type?: 'single_choice' | 'multiple_choice' | 'true_false';
    options?: { label: string; content: string }[];
    answer?: string;
    explanation?: string;
    source_doc_id?: string;
  };

  type ExamUpdate = {
    title?: string;
    description?: string;
    status?: 'draft' | 'published' | 'archived';
    duration?: number;
    pass_score?: number;
    questions?: QuestionUpdate[];
  };

  type ExamGenerateRequest = {
    kb_id: string;
    title: string;
    description?: string;
    question_count?: number;
    doc_ids?: string[];
    duration?: number;
  };

  type ExamResult = {
    id: string;
    exam_id: string;
    kb_id?: string;
    user_id: number;
    score: number;
    answers: Record<string, any>;
    status: 'in_progress' | 'completed';
    start_time: string;
    submit_time?: string;
    details?: {
      question: Question;
      user_answer: string;
      is_correct: boolean;
    }[];
  };

  type ExamResultDetail = ExamResult;

  type ExamResultListItem = {
    id: string;
    exam_title: string;
    user_name: string;
    score: number;
    status: 'in_progress' | 'completed';
    submit_time?: string;
  };

  type ChatQuery = {
    question: string;
    kb_ids?: string[];
    history?: any[];
    source?: string;
  };

  type ChatResponse = {
    answer: string;
    sources: {
      content: string;
      metadata: any;
      score: number;
    }[];
  };

  type ChatHistory = {
    id: number;
    user_id: number;
    kb_id?: string;
    question: string;
    answer: string;
    ip_address?: string;
    ip_location?: string;
    source_platform?: string;
    created_at: string;
  };
}
