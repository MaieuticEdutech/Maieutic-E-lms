const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetcher(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetcher('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data: any) =>
      fetcher('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => fetcher('/auth/me'),
  },
  users: {
    list: (params?: string) => fetcher(`/users?${params || ''}`),
    get: (id: string) => fetcher(`/users/${id}`),
    update: (id: string, data: any) => fetcher(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetcher(`/users/${id}`, { method: 'DELETE' }),
  },
  courses: {
    list: (params?: string) => fetcher(`/courses?${params || ''}`),
    get: (id: string) => fetcher(`/courses/${id}`),
    create: (data: any) => fetcher('/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetcher(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetcher(`/courses/${id}`, { method: 'DELETE' }),
  },
  enrollments: {
    create: (course_id: string) => fetcher('/enrollments', { method: 'POST', body: JSON.stringify({ course_id }) }),
    my: () => fetcher('/enrollments/my'),
    progress: (data: any) => fetcher('/enrollments/progress', { method: 'POST', body: JSON.stringify(data) }),
  },
  admin: {
    stats: () => fetcher('/admin/stats'),
    recentRegistrations: () => fetcher('/admin/recent-registrations'),
    recentPurchases: () => fetcher('/admin/recent-purchases'),
    courseSales: () => fetcher('/admin/course-sales'),
  },
};