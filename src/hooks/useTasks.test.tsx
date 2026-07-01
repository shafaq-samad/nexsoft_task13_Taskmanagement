import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useTasks } from './useTasks';
import { api } from '../services/api';

const showToast = vi.fn();
const recordActivity = vi.fn();
const currentUser = {
  id: 'user-admin',
  email: 'admin@enterprise.com',
  name: 'Sarah Connor',
  role: 'Admin' as const,
  avatarUrl: '/avatars/admin.svg',
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'token-123',
    user: currentUser,
  }),
}));

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ showToast }),
}));

vi.mock('../contexts/ActivityContext', () => ({
  useActivityFeed: () => ({ recordActivity }),
}));

vi.mock('../services/api', () => ({
  api: {
    tasks: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    projects: { list: vi.fn(), create: vi.fn() },
    users: { list: vi.fn() },
    auth: { login: vi.fn(), register: vi.fn(), me: vi.fn(), logout: vi.fn() },
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

describe('useTasks', () => {
  beforeEach(() => {
    showToast.mockClear();
    recordActivity.mockClear();
    vi.mocked(api.tasks.list).mockResolvedValue([
      {
        id: 'task-1',
        title: 'Initial task',
        description: 'Seeded',
        status: 'Todo',
        priority: 'Medium',
        dueDate: '2026-07-10',
        assigneeId: null,
        projectId: 'proj-alpha',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    vi.mocked(api.tasks.create).mockResolvedValue({
      id: 'task-2',
      title: 'Created task',
      description: '',
      status: 'Todo',
      priority: 'Medium',
      dueDate: '2026-07-15',
      assigneeId: null,
      projectId: 'proj-alpha',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    vi.mocked(api.tasks.update).mockResolvedValue({
      id: 'task-1',
      title: 'Initial task',
      description: 'Seeded',
      status: 'In Progress',
      priority: 'Medium',
      dueDate: '2026-07-10',
      assigneeId: null,
      projectId: 'proj-alpha',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    vi.mocked(api.tasks.remove).mockResolvedValue({ message: 'deleted' });
  });

  it('loads tasks and persists updates', async () => {
    const { result } = renderHook(() => useTasks('all'));

    await waitFor(() => expect(result.current.tasks).toHaveLength(1));

    await act(async () => {
      await result.current.createTask({ title: 'Created task', projectId: 'proj-alpha' });
    });

    expect(result.current.tasks).toHaveLength(2);
    expect(showToast).toHaveBeenCalled();
    expect(recordActivity).toHaveBeenCalled();

    await act(async () => {
      await result.current.moveTaskToStatus('task-1', 'In Progress');
    });

    expect(vi.mocked(api.tasks.update)).toHaveBeenCalledWith('task-1', { status: 'In Progress' });
    expect(result.current.tasks.find((task) => task.id === 'task-1')?.status).toBe('In Progress');
  });
});
