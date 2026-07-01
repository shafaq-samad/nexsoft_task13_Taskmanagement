import React, { useId, useMemo, useRef, useState, useEffect } from 'react';
import { X, Calendar, User, AlignLeft, ShieldAlert, Trash2, CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Task, Project, User as AppUser, TaskStatus, TaskPriority } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  currentProjectId: string;
  projects: Project[];
  users: AppUser[];
  currentUser: AppUser;
  onSave: (taskData: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

export default function TaskModal({
  isOpen,
  onClose,
  task,
  currentProjectId,
  projects,
  users,
  currentUser,
  onSave,
  onDelete
}: TaskModalProps) {
  const isEditing = !!task;
  const modalRef = useRef<HTMLDivElement>(null);
  const modalTitleId = useId();
  const prefersReducedMotion = useReducedMotion();
  
  // Basic Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Todo');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine permissions
  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Project Manager';
  const isTeamMember = currentUser.role === 'Team Member';

  // Strict RBAC Rules for Input Disabling
  const isAssignedToMe = isEditing && task?.assigneeId === currentUser.id;
  const canEditStatus = isAdmin || isManager || (isTeamMember && isAssignedToMe);
  const canEditOtherFields = isAdmin || isManager || !isEditing;
  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user] as const)), [users]);

  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate);
      setAssigneeId(task.assigneeId || '');
      setProjectId(task.projectId);
    } else {
      setTitle('');
      setDescription('');
      setStatus('Todo');
      setPriority('Medium');
      setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setAssigneeId('');
      setProjectId(currentProjectId || projects[0]?.id || '');
    }
    setError('');
  }, [task, isOpen, currentProjectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && canEditOtherFields) {
      setError('Task title is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const taskData: Partial<Task> = {};
      
      if (canEditOtherFields) {
        taskData.title = title;
        taskData.description = description;
        taskData.priority = priority;
        taskData.dueDate = dueDate;
        taskData.assigneeId = assigneeId || null;
        taskData.projectId = projectId;
      }

      if (canEditStatus) {
        taskData.status = status;
      }

      await onSave(taskData);
      onClose();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !onDelete) return;
    if (window.confirm('Are you sure you want to permanently delete this task? This action is only authorized for Admins.')) {
      try {
        setLoading(true);
        await onDelete(task.id);
        onClose();
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Failed to delete task');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            ref={modalRef}
            id="task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            tabIndex={-1}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden transform transition-all focus:outline-none"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 id={modalTitleId} className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                {isEditing ? 'Task details & actions' : 'Create task'}
              </h3>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        {/* Info banners about permissions */}
        {isEditing && isTeamMember && !isAssignedToMe && (
          <div className="bg-rose-50 text-rose-800 text-[11px] px-6 py-3 border-b border-rose-100 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              <strong>ReadOnly view:</strong> This task is assigned to <strong>{task?.assigneeId ? usersById.get(task.assigneeId)?.name || 'Unassigned' : 'Unassigned'}</strong>. You can only modify tasks assigned to you.
            </span>
          </div>
        )}

        {isEditing && isTeamMember && isAssignedToMe && (
          <div className="bg-blue-50 text-blue-800 text-[11px] px-6 py-3 border-b border-blue-100 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Assigned to you:</strong> You are authorized to update the <strong>Status State</strong>. Structural details require higher privileges.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div role="alert" className="bg-rose-50 text-rose-800 text-xs p-3 rounded-lg border border-rose-100">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="task-title-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Task Title
            </label>
            <input
              id="task-title-input"
              data-autofocus="true"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEditOtherFields}
              placeholder="e.g., Secure token rotation service"
              className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-description-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <div className="relative">
              <span className="absolute top-2.5 left-3 text-slate-400">
                <AlignLeft className="w-4 h-4" />
              </span>
              <textarea
                id="task-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEditOtherFields}
                placeholder="Acceptance criteria, edge cases..."
                rows={3}
                className="w-full text-sm border border-slate-200 rounded pl-9 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Project & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-project-select" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Workspace Project
              </label>
              <select
                id="task-project-select"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={!canEditOtherFields}
                className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 font-medium"
              >
                {projects.map((projectOption) => (
                  <option key={projectOption.id} value={projectOption.id}>
                    {projectOption.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-assignee-select" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <select
                  id="task-assignee-select"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  disabled={!canEditOtherFields}
                  className="w-full text-sm border border-slate-200 rounded pl-9 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 font-medium"
                >
                  <option value="">Unassigned</option>
                    {users.map((userOption) => (
                      <option key={userOption.id} value={userOption.id}>
                        {userOption.name} ({userOption.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status & Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="task-status-select" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Status State
              </label>
              <select
                id="task-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={!canEditStatus}
                className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 font-medium"
              >
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-priority-select" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={!canEditOtherFields}
                className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 font-medium"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-due-date-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  id="task-due-date-input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={!canEditOtherFields}
                  className="w-full text-sm border border-slate-200 rounded pl-9 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Delete button (Admin only, when editing) */}
            {isEditing && isAdmin ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors flex items-center gap-2 self-start w-full sm:w-auto justify-center"
              >
                <Trash2 className="w-4 h-4" />
                Delete (Admin)
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded border border-transparent hover:border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                Cancel
              </button>
              
              {(canEditStatus || canEditOtherFields) && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

