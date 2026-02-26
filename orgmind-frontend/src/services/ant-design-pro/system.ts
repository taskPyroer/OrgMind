// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取字典类型列表 GET /api/v1/system/dict-types/ */
export async function getDictTypes(
  params: {
    // query
    current?: number;
    pageSize?: number;
    name?: string;
    code?: string;
    status?: string;
  },
  options?: { [key: string]: any },
) {
  return request<any>('/api/v1/system/dict-types/', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 新建字典类型 POST /api/v1/system/dict-types/ */
export async function createDictType(body: any, options?: { [key: string]: any }) {
  return request<any>('/api/v1/system/dict-types/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新字典类型 PUT /api/v1/system/dict-types/{id} */
export async function updateDictType(id: number, body: any, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/system/dict-types/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除字典类型 DELETE /api/v1/system/dict-types/{id} */
export async function deleteDictType(id: number, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/system/dict-types/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 获取字典数据列表 GET /api/v1/system/dict-data/ */
export async function getDictData(
  params: {
    // query
    current?: number;
    pageSize?: number;
    dict_type_id?: number;
    dict_type_code?: string;
    label?: string;
    status?: string;
  },
  options?: { [key: string]: any },
) {
  return request<any>('/api/v1/system/dict-data/', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 新建字典数据 POST /api/v1/system/dict-data/ */
export async function createDictData(body: any, options?: { [key: string]: any }) {
  return request<any>('/api/v1/system/dict-data/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新字典数据 PUT /api/v1/system/dict-data/{id} */
export async function updateDictData(id: number, body: any, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/system/dict-data/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除字典数据 DELETE /api/v1/system/dict-data/{id} */
export async function deleteDictData(id: number, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/system/dict-data/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

// --- User ---

/** 获取用户列表 GET /api/v1/system/users/ */
export async function getUsers(
  params: {
    current?: number;
    pageSize?: number;
    username?: string;
    name?: string;
    email?: string;
    status?: string;
  },
  options?: { [key: string]: any },
) {
  return request<any>('/api/v1/system/users/', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 新建用户 POST /api/v1/system/users/ */
export async function createUser(body: any, options?: { [key: string]: any }) {
  return request<any>('/api/v1/system/users/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新用户 PUT /api/v1/system/users/{id} */
export async function updateUser(id: number, body: any, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/system/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除用户 DELETE /api/v1/system/users/{id} */
export async function deleteUser(id: number, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/system/users/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

// --- Role ---

/** 获取角色列表 GET /api/v1/system/roles/ */
export async function getRoles(
  params: {
    current?: number;
    pageSize?: number;
    name?: string;
    code?: string;
    status?: string;
  },
  options?: { [key: string]: any },
) {
  return request<any>('/api/v1/system/roles/', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 新建角色 POST /api/v1/system/roles/ */
export async function createRole(body: any, options?: { [key: string]: any }) {
  return request<any>('/api/v1/system/roles/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新角色 PUT /api/v1/system/roles/{id} */
export async function updateRole(id: number, body: any, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/system/roles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除角色 DELETE /api/v1/system/roles/{id} */
export async function deleteRole(id: number, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/system/roles/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

// --- Permission ---

/** 获取权限列表 GET /api/v1/system/permissions/ */
export async function getPermissions(
  params: {
    current?: number;
    pageSize?: number;
    name?: string;
    code?: string;
  },
  options?: { [key: string]: any },
) {
  return request<any>('/api/v1/system/permissions/', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 新建权限 POST /api/v1/system/permissions/ */
export async function createPermission(body: any, options?: { [key: string]: any }) {
  return request<any>('/api/v1/system/permissions/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新权限 PUT /api/v1/system/permissions/{id} */
export async function updatePermission(id: number, body: any, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/system/permissions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除权限 DELETE /api/v1/system/permissions/{id} */
export async function deletePermission(id: number, options?: { [key: string]: any }) {
  return request<any>(`/api/v1/system/permissions/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}
