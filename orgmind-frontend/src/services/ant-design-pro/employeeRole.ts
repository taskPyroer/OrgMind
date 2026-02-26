// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get Employee Account List GET /api/v1/oa/employee-accounts/ */
export async function getEmployeeAccounts(
  params: {
    // query
    current?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
  },
  options?: { [key: string]: any },
) {
  return request<any>('/api/v1/oa/employee-accounts/', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Create Employee Account POST /api/v1/oa/employee-accounts/ */
export async function createEmployeeAccount(body: any, options?: { [key: string]: any }) {
  return request<any>('/api/v1/oa/employee-accounts/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Update Employee Account PUT /api/v1/oa/employee-accounts/{id} */
export async function updateEmployeeAccount(id: number, body: any, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/oa/employee-accounts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Delete Employee Account DELETE /api/v1/oa/employee-accounts/{id} */
export async function deleteEmployeeAccount(id: number, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/oa/employee-accounts/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** Reset Employee Password POST /api/v1/oa/employee-accounts/{id}/reset-password */
export async function resetEmployeePassword(id: number, body: any, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/oa/employee-accounts/${id}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
