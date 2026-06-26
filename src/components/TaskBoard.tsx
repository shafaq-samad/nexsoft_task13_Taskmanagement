import React from 'react';
import { Calendar, AlertCircle, UserCircle, Tag } from 'lucide-react';
import { Task, User, Project, TaskStatus } from '../types';

interface TaskBoardProps {
  tasks: Task[];
  users: User[];
  projects: Project[];
  currentUser: User;
  onTaskClick: (task: Task) => void;
}

const COLUMNS: { id: TaskStatus; title: string; borderClass: string; bgClass: string; textClass: string; countClass: string }[] = [
  { id: 'Todo', title: 'Todo', borderClass: 'border-slate-200', bgClass: 'bg-slate-200 text-slate-600', textClass: 'text-slate-700', countClass: 'bg-slate-200 text-slate-600' },
  { id: 'In Progress', title: 'In Progress', borderClass: 'border-indigo-200', bgClass: 'bg-indigo-100 text-indigo-600', textClass: 'text-indigo-800', countClass: 'bg-indigo-100 text-indigo-600' },
  { id: 'Review', title: 'Review', borderClass: 'border-slate-200', bgClass: 'bg-slate-200 text-slate-600', textClass: 'text-indigo-800', countClass: 'bg-slate-200 text-slate-600' },
  { id: 'Done', title: 'Done', borderClass: 'border-emerald-200', bgClass: 'bg-emerald-100 text-emerald-600', textClass: 'text-emerald-800', countClass: 'bg-emerald-100 text-emerald-600' }
];

export default function TaskBoard({ tasks, users, projects, currentUser, onTaskClick }: TaskBoardProps) {
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getUserAvatar = (userId: string | null) => {
    const user = users.find(u => u.id === userId);
    if (user?.avatarUrl) {
      return (
        <img 
          src={user.avatarUrl} 
          alt={user.name} 
          referrerPolicy="no-referrer"
          className="w-5 h-5 rounded-full object-cover border border-slate-100 shadow-xs" 
        />
      );
    }
    return <UserCircle className="w-5 h-5 text-slate-400" />;
  };

  const getUserInitials = (userId: string | null) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'UN';
    return user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getUserName = (userId: string | null) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unassigned';
  };

  const getProjectName = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    return proj ? proj.name.replace(/\s*\(.*\)/, '') : 'Unknown Project';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter(t => t.status === col.id);

        return (
          <div 
            key={col.id} 
            id={`column-${col.id.toLowerCase().replace(' ', '-')}`}
            className="flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{col.title}</h2>
                <span className={`${col.countClass} text-xs px-2 py-0.5 rounded-full font-semibold`}>
                  {columnTasks.length}
                </span>
              </div>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">•••</button>
            </div>

            {/* Tasks Container */}
            <div className="space-y-4 min-h-[400px] max-h-[68vh] overflow-y-auto custom-scrollbar pr-1">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/40">
                  <AlertCircle className="w-6 h-6 text-slate-300 mb-1" />
                  <span className="text-xs text-slate-400 font-medium">No tasks here</span>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const isAssignedToMe = task.assigneeId === currentUser.id;
                  const isDone = task.status === 'Done';
                  
                  return (
                    <div
                      key={task.id}
                      id={`task-card-${task.id}`}
                      onClick={() => onTaskClick(task)}
                      className={`group p-4 rounded-xl card-shadow border transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] duration-150 relative bg-white ${
                        isDone 
                          ? 'grayscale opacity-60 border-slate-200' 
                          : task.status === 'In Progress'
                          ? 'border-l-4 border-l-indigo-500 border border-slate-200'
                          : isAssignedToMe 
                          ? 'border-indigo-300 ring-2 ring-indigo-500/5' 
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Highlight label for priority */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        
                        {isAssignedToMe && !isDone && (
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            Assigned to me
                          </span>
                        )}
                      </div>

                      {/* Project Tag */}
                      <div className="flex items-center gap-1 mb-2">
                        <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[10px] font-medium text-slate-500 truncate" title={getProjectName(task.projectId)}>
                          {getProjectName(task.projectId)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className={`text-sm font-semibold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors mb-2 ${
                        isDone ? 'line-through text-slate-400' : ''
                      }`}>
                        {task.title}
                      </h3>

                      {/* Description preview */}
                      {task.description && (
                        <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${
                          isDone ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {task.description}
                        </p>
                      )}

                      {/* Meta information row */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                        <div className="flex items-center gap-2">
                          {/* Mini Avatar / Name */}
                          {users.find(u => u.id === task.assigneeId)?.avatarUrl ? (
                            <img 
                              src={users.find(u => u.id === task.assigneeId)?.avatarUrl} 
                              alt={getUserName(task.assigneeId)}
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 rounded-full object-cover border border-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-800 border border-white flex items-center justify-center text-[8px] text-white font-bold shrink-0">
                              {getUserInitials(task.assigneeId)}
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 truncate max-w-[90px]">
                            {getUserName(task.assigneeId)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium shrink-0">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{task.dueDate.split('-').slice(1).join('/')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

