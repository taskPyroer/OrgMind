// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** 获取考试列表 GET /api/v1/exam/ */
export async function getExams(
  params: {
    current?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.Page<API.Exam>>('/api/v1/exam/', {
    method: 'GET',
    params: {
      current: params.current,
      pageSize: params.pageSize,
    },
    ...(options || {}),
  });
}

/** 生成考试 POST /api/v1/exam/generate */
export async function generateExam(
  body: API.ExamGenerateRequest,
  options?: { [key: string]: any },
) {
  return request<API.Exam>('/api/v1/exam/generate', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 获取所有考试结果 GET /api/v1/exam/all-results */
export async function getAllExamResults(
  params: {
    current?: number;
    pageSize?: number;
    exam_title?: string;
    user_name?: string;
    status?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.Page<API.ExamResultListItem>>('/api/v1/exam/all-results', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取考试详情 GET /api/v1/exam/{id} */
export async function getExam(id: string, options?: { [key: string]: any }) {
  return request<API.Exam>(`/api/v1/exam/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取考试结果（通过 Exam ID） GET /api/v1/exam/{id}/result */
export async function getExamResult(id: string, options?: { [key: string]: any }) {
  return request<API.ExamResultDetail>(`/api/v1/exam/${id}/result`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取考试结果（通过 Result ID） GET /api/v1/exam/results/{id} */
export async function getExamResultById(id: string, options?: { [key: string]: any }) {
  return request<API.ExamResultDetail>(`/api/v1/exam/results/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取考试详情（含答案，仅管理员/创建者） GET /api/v1/exam/{id}/detail */
export async function getExamDetail(id: string, options?: { [key: string]: any }) {
  return request<API.ExamDetail>(`/api/v1/exam/${id}/detail`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 删除考试 DELETE /api/v1/exam/{id} */
export async function deleteExam(id: string, options?: { [key: string]: any }) {
  return request<void>(`/api/v1/exam/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 更新考试 PUT /api/v1/exam/{id} */
export async function updateExam(
  id: string,
  body: API.ExamUpdate,
  options?: { [key: string]: any },
) {
  return request<API.Exam>(`/api/v1/exam/${id}`, {
    method: 'PUT',
    data: body,
    ...(options || {}),
  });
}

/** 提交考试 POST /api/v1/exam/{id}/submit */
export async function submitExam(
  id: string,
  body: { answers: Record<string, string> },
  options?: { [key: string]: any },
) {
  return request<API.ExamResult>(`/api/v1/exam/${id}/submit`, {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

// Duplicate getExamResult removed
