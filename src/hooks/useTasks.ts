import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useActivityFeed } from '../contexts/ActivityContext';
import { useToast } from '../contexts/ToastContext';
import { api, ApiError } from '../services/api';
import { Task, TaskMutationRequest } from '../types';

export function useTasks(selectedProjectId: string) {
  const { token, user } = useAuth();
  const { recordActivity } = useActivityFeed();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!token || !user) {
      setTasks([]);
      return;
    }

    setIsLoading(true);
    try {
      setTasks(await api.tasks.list(selectedProjectId));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load tasks.';
      showToast(message, true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, showToast, token, user]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(async (payload: TaskMutationRequest) => {
    const task = await api.tasks.create(payload);
    setTasks((current) => [...current, task]);
    showToast(`Task '${task.title}' created.`);
    if (user) {
      recordActivity({
        type: 'task',
        title: 'Task created',
        detail: `${user.name} created ${task.title}.`,
      });
    }
    return task;
  }, [recordActivity, showToast, user]);

  const updateTask = useCallback(async (taskId: string, payload: TaskMutationRequest) => {
    const previousTask = tasks.find((task) => task.id === taskId);
    const updatedTask = await api.tasks.update(taskId, payload);
    setTasks((current) => current.map((task) => (task.id === taskId ? updatedTask : task)));
    showToast('Task updated successfully.');
    if (user) {
      const statusChanged = previousTask?.status !== updatedTask.status;
      const assigneeChanged = previousTask?.assigneeId !== updatedTask.assigneeId;
      recordActivity({
        type: 'task',
        title: statusChanged ? 'Task status changed' : 'Task updated',
        detail: statusChanged
          ? `${user.name} moved ${updatedTask.title} to ${updatedTask.status}.`
          : assigneeChanged
            ? `${user.name} reassigned ${updatedTask.title}.`
            : `${user.name} updated ${updatedTask.title}.`,
      });
    }
    return updatedTask;
  }, [recordActivity, showToast, tasks, user]);

  const deleteTask = useCallback(async (taskId: string) => {
    const taskToDelete = tasks.find((task) => task.id === taskId);
    await api.tasks.remove(taskId);
    setTasks((current) => current.filter((task) => task.id !== taskId));
    showToast('Task deleted.');
    if (user && taskToDelete) {
      recordActivity({
        type: 'task',
        title: 'Task deleted',
        detail: `${user.name} deleted ${taskToDelete.title}.`,
      });
    }
  }, [recordActivity, showToast, tasks, user]);

  const moveTaskToStatus = useCallback(async (taskId: string, status: TaskMutationRequest['status']) => {
    if (!status) {
      return null;
    }

    return updateTask(taskId, { status });
  }, [updateTask]);

  const taskCountByStatus = useMemo(() => {
    return tasks.reduce<Record<string, number>>((accumulator, task) => {
      accumulator[task.status] = (accumulator[task.status] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [tasks]);

  return {
    tasks,
    isLoading,
    refreshTasks: loadTasks,
    createTask,
    updateTask,
    moveTaskToStatus,
    deleteTask,
    taskCountByStatus,
    setTasks,
  };
}
