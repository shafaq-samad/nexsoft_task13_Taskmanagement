import {
  ApiErrorResponse,
  AuthResponse,
  LoginRequest,
  Project,
  ProjectCreateRequest,
  RegisterRequest,
  Task,
  TaskMutationRequest,
  User,
} from '../types';

const TOKEN_STORAGE_KEY = 'ent_jwt_token';

// Read API base URL from Vite env. Leave empty to use relative paths.
const API_BASE = (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_BASE_URL : '') || '';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let accessToken: string | null = null;

export const getStoredAccessToken = () => {
  if (typeof window === 'undefined') {
    return accessToken;
  }

  return accessToken ?? window.localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const setStoredAccessToken = (token: string | null) => {
  accessToken = token;

  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

const buildHeaders = (initHeaders?: HeadersInit, includeAuth = true) => {
  const headers = new Headers(initHeaders);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (includeAuth) {
    const token = getStoredAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return headers;
};

async function readResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? (await response.json()) as T | ApiErrorResponse
    : null;

  if (!response.ok) {
    const errorMessage = payload && typeof payload === 'object' && 'error' in payload
      ? payload.error
      : 'Request failed';
    throw new ApiError(errorMessage, response.status);
  }

  return payload as T;
}

async function request<T>(path: string, init: RequestInit = {}, includeAuth = true): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: buildHeaders(init.headers, includeAuth),
  });

  return readResponse<T>(response);
}

export const api = {
  auth: {
    async login(payload: LoginRequest) {
      const response = await request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, false);

      setStoredAccessToken(response.token);
      return response;
    },
    async register(payload: RegisterRequest) {
      const response = await request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, false);

      setStoredAccessToken(response.token);
      return response;
    },
    async me() {
      return request<User>('/api/auth/me');
    },
    logout() {
      setStoredAccessToken(null);
    },
  },
  users: {
    async list() {
      return request<User[]>('/api/users');
    },
  },
  projects: {
    async list() {
      return request<Project[]>('/api/projects');
    },
    async create(payload: ProjectCreateRequest) {
      return request<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },
  tasks: {
    async list(projectId?: string) {
      const params = projectId && projectId !== 'all' ? `?projectId=${encodeURIComponent(projectId)}` : '';
      return request<Task[]>(`/api/tasks${params}`);
    },
    async create(payload: TaskMutationRequest) {
      return request<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async update(taskId: string, payload: TaskMutationRequest) {
      return request<Task>(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    async remove(taskId: string) {
      return request<{ message: string }>(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
    },
  },
};

export const apiRequest = request;

// Base URL for API requests. Set `VITE_API_BASE_URL` in your Vite/hosting env
// (e.g. https://your-backend.example.com) when frontend and backend are deployed separately.
