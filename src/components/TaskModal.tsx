import React, { useState, useEffect } from 'react';
import { X, Calendar, User, AlignLeft, ShieldAlert, Trash2, CheckCircle2 } from 'lucide-react';
import { Task, Project, User as AppUser, TaskStatus, TaskPriority } from '../types';

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

  if (!isOpen) return null;

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
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save task');
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
      } catch (err: any) {
        setError(err.message || 'Failed to delete task');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div id="task-modal" className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
            {isEditing ? 'Task details & actions' : 'Create task'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info banners about permissions */}
        {isEditing && isTeamMember && !isAssignedToMe && (
          <div className="bg-rose-50 text-rose-800 text-[11px] px-6 py-3 border-b border-rose-100 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              <strong>ReadOnly view:</strong> This task is assigned to <strong>{users.find(u => u.id === task.assigneeId)?.name || 'Unassigned'}</strong>. You can only modify tasks assigned to you.
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
            <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-lg border border-rose-100">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Task Title
            </label>
            <input
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
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <div className="relative">
              <span className="absolute top-2.5 left-3 text-slate-400">
                <AlignLeft className="w-4 h-4" />
              </span>
              <textarea
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Workspace Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={!canEditOtherFields}
                className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  disabled={!canEditOtherFields}
                  className="w-full text-sm border border-slate-200 rounded pl-9 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 font-medium"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status & Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Status State
              </label>
              <select
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
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
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded border border-transparent hover:border-slate-200 transition-colors"
              >
                Cancel
              </button>
              
              {(canEditStatus || canEditOtherFields) && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded shadow-xs transition-colors"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

