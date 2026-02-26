// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** 获取知识库列表 GET /api/v1/rag/knowledge-bases/ */
export async function getKnowledgeBases(
  params: {
    current?: number;
    pageSize?: number;
    name?: string;
    visibility?: 'private' | 'department' | 'public';
  },
  options?: { [key: string]: any },
) {
  return request<{
    data: API.KnowledgeBase[];
    total: number;
    success: boolean;
  }>('/api/v1/rag/knowledge-bases/', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 创建知识库 POST /api/v1/rag/knowledge-bases/ */
export async function createKnowledgeBase(
  body: API.KnowledgeBase,
  options?: { [key: string]: any },
) {
  return request<API.KnowledgeBase>('/api/v1/rag/knowledge-bases/', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 获取知识库详情 GET /api/v1/rag/knowledge-bases/{id} */
export async function getKnowledgeBase(id: string, options?: { [key: string]: any }) {
  return request<API.KnowledgeBase>(`/api/v1/rag/knowledge-bases/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 更新知识库 PUT /api/v1/rag/knowledge-bases/{id} */
export async function updateKnowledgeBase(
  id: string,
  body: API.KnowledgeBase,
  options?: { [key: string]: any },
) {
  return request<API.KnowledgeBase>(`/api/v1/rag/knowledge-bases/${id}`, {
    method: 'PUT',
    data: body,
    ...(options || {}),
  });
}

/** 删除知识库 DELETE /api/v1/rag/knowledge-bases/{id} */
export async function deleteKnowledgeBase(id: string, options?: { [key: string]: any }) {
  return request<API.KnowledgeBase>(`/api/v1/rag/knowledge-bases/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 获取文档列表 GET /api/v1/rag/knowledge-bases/{kbId}/documents/ */
export async function getDocuments(
  kbId: string,
  params: {
    current?: number;
    pageSize?: number;
    parent_id?: string;
    is_root?: boolean;
    is_folder?: boolean;
  },
  options?: { [key: string]: any },
) {
  return request<{ data: API.Document[]; total: number; success: boolean }>(
    `/api/v1/rag/knowledge-bases/${kbId}/documents/`,
    {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

/** 创建文件夹 POST /api/v1/rag/knowledge-bases/{kbId}/folders/ */
export async function createFolder(
  kbId: string,
  body: API.FolderCreate,
  options?: { [key: string]: any },
) {
  return request<API.Document>(`/api/v1/rag/knowledge-bases/${kbId}/folders/`, {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 上传文档 POST /api/v1/rag/knowledge-bases/{kbId}/documents/ */
export async function createDocument(
  kbId: string,
  formData: FormData,
  options?: { [key: string]: any },
) {
  return request<API.Document[]>(`/api/v1/rag/knowledge-bases/${kbId}/documents/`, {
    method: 'POST',
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}

/** 删除文档 DELETE /api/v1/rag/knowledge-bases/{kbId}/documents/{docId} */
export async function deleteDocument(
  kbId: string,
  docId: string,
  options?: { [key: string]: any },
) {
  return request<API.Document>(`/api/v1/rag/knowledge-bases/${kbId}/documents/${docId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 获取文档详情 GET /api/v1/rag/knowledge-bases/{kbId}/documents/{docId} */
export async function getDocument(
  kbId: string,
  docId: string,
  options?: { [key: string]: any },
) {
  return request<API.Document>(`/api/v1/rag/knowledge-bases/${kbId}/documents/${docId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** RAG 对话 POST /api/v1/rag/chat */
export async function chat(body: API.ChatQuery, options?: { [key: string]: any }) {
  return request<API.ChatResponse>('/api/v1/rag/chat', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** RAG 流式对话 POST /api/v1/rag/chat/stream */
export async function chatStream(body: API.ChatQuery, options?: RequestInit) {
  const token = localStorage.getItem('token');
  return fetch('/api/v1/rag/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options?.headers || {}),
    },
    body: JSON.stringify(body),
    ...options,
  });
}

/** 获取对话历史 GET /api/v1/rag/chat/history */
export async function getChatHistory(
  params: {
    current?: number;
    pageSize?: number;
    question?: string;
    source_platform?: string;
  },
  options?: { [key: string]: any },
) {
  return request<{ data: API.ChatHistory[]; total: number; success: boolean }>(
    '/api/v1/rag/chat/history',
    {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

/** 获取所有对话历史（管理员） GET /api/v1/rag/chat/history/all */
export async function getAllChatHistory(
  params: {
    current?: number;
    pageSize?: number;
    question?: string;
    source_platform?: string;
  },
  options?: { [key: string]: any },
) {
  return request<{ data: API.ChatHistory[]; total: number; success: boolean }>(
    '/api/v1/rag/chat/history/all',
    {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

/** 删除对话历史 DELETE /api/v1/rag/chat/history/{id} */
export async function deleteChatHistory(id: string, options?: { [key: string]: any }) {
  return request<API.ChatHistory>(`/api/v1/rag/chat/history/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 清空对话历史 DELETE /api/v1/rag/chat/history */
export async function clearChatHistory(options?: { [key: string]: any }) {
  return request<{ msg: string }>('/api/v1/rag/chat/history', {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 获取RAG仪表盘统计数据 GET /api/v1/rag/dashboard/stats */
export async function getRagDashboardStats(options?: { [key: string]: any }) {
  return request<{
    total_kbs: number;
    total_docs: number;
    total_chats: number;
    chat_trend: { date: string; count: number }[];
    top_kbs: { name: string; count: number }[];
    doc_status_dist: { status: string; count: number }[];
  }>('/api/v1/rag/dashboard/stats', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取RAG监控大屏数据 GET /api/v1/rag/dashboard/monitor */
export async function getRagMonitorStats(
  params: { time_range: '24h' | '7d' | '30d' | '90d' },
  options?: { [key: string]: any }
) {
  return request<{
    cards: {
      visit_count: number;
      qa_count: number;
      uv_count: number;
      ip_count: number;
    };
    trend: { date: string; count: number }[];
    region_dist: { name: string; count: number }[];
    source_dist: { type: string; value: number }[];
    logs: { id: number; time: string; user: string; content: string; location: string; ip: string }[];
  }>('/api/v1/rag/dashboard/monitor', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}
