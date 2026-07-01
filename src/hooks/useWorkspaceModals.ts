import { useState } from 'react';
import { Task } from '../types';

export function useWorkspaceModals() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openCreateTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
  };

  const openProjectModal = () => {
    setIsProjectModalOpen(true);
  };

  const closeProjectModal = () => {
    setIsProjectModalOpen(false);
  };

  return {
    isTaskModalOpen,
    isProjectModalOpen,
    editingTask,
    openCreateTask,
    openEditTask,
    closeTaskModal,
    openProjectModal,
    closeProjectModal,
    setEditingTask,
  };
}
