export type UserRole = 'Admin' | 'Project Manager' | 'Team Member';

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface ApiErrorResponse {
  error: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  role?: UserRole;
  avatarUrl?: string;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
}

export interface TaskMutationRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string | null;
  projectId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string | null; // User ID
  projectId: string; // Project ID
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  managerId: string | null;
}
