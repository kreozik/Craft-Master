const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function setToken(token: string): void {
  localStorage.setItem('admin_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('admin_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Ошибка сети' }));
    if (res.status === 401) clearToken();
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ===== Auth =====
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<any>('/api/admin/me'),
};

// ===== Stats =====
export const statsApi = {
  get: () => request<any>('/api/admin/stats'),
};

// ===== Users =====
export const usersApi = {
  list: (params: { page?: number; search?: string; role?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.search) q.set('search', params.search);
    if (params.role) q.set('role', params.role);
    return request<any>(`/api/admin/users?${q}`);
  },
  block: (id: number, blocked: boolean) =>
    request(`/api/admin/users/${id}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ blocked }),
    }),
  changeRole: (id: number, role: string) =>
    request(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  resetPassword: (id: number, password: string) =>
    request(`/api/admin/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    }),
  remove: (id: number) =>
    request(`/api/admin/users/${id}`, { method: 'DELETE' }),
};

// ===== Products =====
export const productsApi = {
  list: (params: { page?: number; status?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.status) q.set('status', params.status);
    if (params.search) q.set('search', params.search);
    return request<any>(`/api/admin/products?${q}`);
  },
  changeStatus: (id: number, status: string) =>
    request(`/api/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  remove: (id: number) =>
    request(`/api/admin/products/${id}`, { method: 'DELETE' }),
};

// ===== Orders =====
export const ordersApi = {
  list: (params: { page?: number; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.status) q.set('status', params.status);
    return request<any>(`/api/admin/orders?${q}`);
  },
  get: (id: number) => request<any>(`/api/admin/orders/${id}`),
  changeStatus: (id: number, status: string) =>
    request(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ===== Logs =====
export const logsApi = {
  list: (page = 1) => request<any>(`/api/admin/logs?page=${page}`),
};
