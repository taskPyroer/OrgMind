import { request } from '@umijs/max';

// Department
export async function getDepartments(params?: any) {
  return request('/api/v1/oa/departments/', {
    method: 'GET',
    params,
  });
}
export async function createDepartment(data: any) {
  return request('/api/v1/oa/departments/', {
    method: 'POST',
    data,
  });
}
export async function updateDepartment(id: number, data: any) {
  return request(`/api/v1/oa/departments/${id}`, {
    method: 'PUT',
    data,
  });
}
export async function deleteDepartment(id: number) {
  return request(`/api/v1/oa/departments/${id}`, {
    method: 'DELETE',
  });
}

// Position
export async function getPositions(params?: any) {
  return request('/api/v1/oa/positions/', {
    method: 'GET',
    params,
  });
}
export async function createPosition(data: any) {
  return request('/api/v1/oa/positions/', {
    method: 'POST',
    data,
  });
}
export async function updatePosition(id: number, data: any) {
  return request(`/api/v1/oa/positions/${id}`, {
    method: 'PUT',
    data,
  });
}
export async function deletePosition(id: number) {
  return request(`/api/v1/oa/positions/${id}`, {
    method: 'DELETE',
  });
}

// Employee
export async function getEmployees(params?: any) {
  return request('/api/v1/oa/employees/', {
    method: 'GET',
    params,
  });
}
export async function createEmployee(data: any) {
  return request('/api/v1/oa/employees/', {
    method: 'POST',
    data,
  });
}
export async function updateEmployee(id: number, data: any) {
  return request(`/api/v1/oa/employees/${id}`, {
    method: 'PUT',
    data,
  });
}
export async function deleteEmployee(id: number) {
  return request(`/api/v1/oa/employees/${id}`, {
    method: 'DELETE',
  });
}

// Salary
export async function getSalaryItems(params?: any) {
  return request('/api/v1/oa/salary-items/', {
    method: 'GET',
    params,
  });
}
export async function createSalaryItem(data: any) {
  return request('/api/v1/oa/salary-items/', {
    method: 'POST',
    data,
  });
}
export async function updateSalaryItem(id: number, data: any) {
  return request(`/api/v1/oa/salary-items/${id}`, {
    method: 'PUT',
    data,
  });
}
export async function deleteSalaryItem(id: number) {
  return request(`/api/v1/oa/salary-items/${id}`, {
    method: 'DELETE',
  });
}
