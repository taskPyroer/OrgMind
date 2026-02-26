import { request } from '@umijs/max';

export async function getDashboardStats() {
  return request('/api/v1/dashboard/stats', {
    method: 'GET',
  });
}

export async function getExamTrend() {
  return request('/api/v1/dashboard/charts/exam-trend', {
    method: 'GET',
  });
}

export async function getKbDistribution() {
  return request('/api/v1/dashboard/charts/kb-distribution', {
    method: 'GET',
  });
}
