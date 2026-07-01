import React, { useMemo } from 'react';
import { Calendar, AlertCircle, UserCircle, Tag } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Project, Task, TaskStatus, User } from '../types';

interface TaskBoardProps {
  tasks: Task[];
  users: User[];
  projects: Project[];
  currentUser: User;
  onTaskClick: (task: Task) => void;
  onTaskMove: (taskId: string, nextStatus: TaskStatus) => Promise<void> | void;
}

const COLUMNS: { id: TaskStatus; title: string; countClass: string }[] = [
  { id: 'Todo', title: 'Todo', countClass: 'bg-slate-200 text-slate-600' },
  { id: 'In Progress', title: 'In Progress', countClass: 'bg-indigo-100 text-indigo-600' },
  { id: 'Review', title: 'Review', countClass: 'bg-slate-200 text-slate-600' },
  { id: 'Done', title: 'Done', countClass: 'bg-emerald-100 text-emerald-600' },
];

const STATUS_ORDER: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Done'];

function getAdjacentStatus(currentStatus: TaskStatus, direction: 'previous' | 'next') {
  const index = STATUS_ORDER.indexOf(currentStatus);
  if (direction === 'previous') {
    return STATUS_ORDER[Math.max(0, index - 1)];
  }

  return STATUS_ORDER[Math.min(STATUS_ORDER.length - 1, index + 1)];
}

function DraggableTaskCard({
  task,
  currentUser,
  usersById,
  projectsById,
  onTaskClick,
  onTaskMove,
  getPriorityColor,
  canMoveTask,
  prefersReducedMotion,
}: {
  task: Task;
  currentUser: User;
  usersById: Map<string, User>;
  projectsById: Map<string, Project>;
  onTaskClick: (task: Task) => void;
  onTaskMove: (taskId: string, nextStatus: TaskStatus) => Promise<void> | void;
  getPriorityColor: (priority: string) => string;
  canMoveTask: boolean;
  prefersReducedMotion: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !canMoveTask,
    data: { task },
  });

  const user = task.assigneeId ? usersById.get(task.assigneeId) : undefined;
  const project = projectsById.get(task.projectId);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!canMoveTask) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      void onTaskMove(task.id, getAdjacentStatus(task.status, 'previous'));
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      void onTaskMove(task.id, getAdjacentStatus(task.status, 'next'));
    }
  };

  return (
    <motion.button
      ref={setNodeRef}
      id={`task-card-${task.id}`}
      onClick={() => onTaskClick(task)}
      onKeyDown={handleKeyDown}
      whileHover={prefersReducedMotion || !canMoveTask ? undefined : { y: -4, scale: 1.01 }}
      whileTap={prefersReducedMotion || !canMoveTask ? undefined : { scale: 0.99 }}
      transition={{ duration: 0.18 }}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.6 : 1,
      }}
      className={`group w-full text-left p-4 rounded-xl card-shadow border transition-all cursor-pointer hover:shadow-md relative bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
        task.status === 'Done'
          ? 'grayscale opacity-60 border-slate-200'
          : task.status === 'In Progress'
            ? 'border-l-4 border-l-indigo-500 border border-slate-200'
            : task.assigneeId === currentUser.id
              ? 'border-indigo-300 ring-2 ring-indigo-500/5'
              : 'border-slate-200'
      }`}
      aria-label={`${task.title}, ${task.status}, priority ${task.priority}. Press Arrow Left or Arrow Right to move.`}
      aria-grabbed={isDragging}
      tabIndex={0}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>

        {task.assigneeId === currentUser.id && task.status !== 'Done' && (
          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
            Assigned to me
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 mb-2">
        <Tag className="w-3 h-3 text-slate-400 shrink-0" />
        <span className="text-[10px] font-medium text-slate-500 truncate" title={project ? project.name : 'Unknown Project'}>
          {project ? project.name.replace(/\s*\(.*\)/, '') : 'Unknown Project'}
        </span>
      </div>

      <h3 className={`text-sm font-semibold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors mb-2 ${task.status === 'Done' ? 'line-through text-slate-400' : ''}`}>
        {task.title}
      </h3>

      {task.description && (
        <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${task.status === 'Done' ? 'text-slate-400' : 'text-slate-500'}`}>
          {task.description}
        </p>
      )}

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-2 min-w-0">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              className="w-5 h-5 rounded-full object-cover border border-slate-100 shrink-0"
            />
          ) : (
            <UserCircle className="w-5 h-5 text-slate-400" />
          )}
          <span className="text-[10px] font-bold text-slate-400 truncate max-w-[90px]">
            {user ? user.name : 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium shrink-0">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{task.dueDate.split('-').slice(1).join('/')}</span>
        </div>
      </div>
    </motion.button>
  );
}

function TaskColumn({
  column,
  tasks,
  currentUser,
  usersById,
  projectsById,
  onTaskClick,
  onTaskMove,
  getPriorityColor,
  prefersReducedMotion,
}: {
  column: { id: TaskStatus; title: string; countClass: string };
  tasks: Task[];
  currentUser: User;
  usersById: Map<string, User>;
  projectsById: Map<string, Project>;
  onTaskClick: (task: Task) => void;
  onTaskMove: (taskId: string, nextStatus: TaskStatus) => Promise<void> | void;
  getPriorityColor: (priority: string) => string;
  prefersReducedMotion: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <motion.section
      layout
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      ref={setNodeRef}
      id={`column-${column.id.toLowerCase().replace(' ', '-')}`}
      className={`flex flex-col min-h-[500px] rounded-2xl transition-all ${isOver ? 'bg-indigo-50/40' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{column.title}</h2>
          <span className={`${column.countClass} text-xs px-2 py-0.5 rounded-full font-semibold`}>
            {tasks.length}
          </span>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Drop here</span>
      </div>

      <div className="space-y-4 min-h-[400px] max-h-[68vh] overflow-y-auto custom-scrollbar pr-1 rounded-xl border border-dashed border-transparent">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/40">
            <AlertCircle className="w-6 h-6 text-slate-300 mb-1" />
            <span className="text-xs text-slate-400 font-medium">No tasks here</span>
          </div>
        ) : (
          tasks.map((task) => {
            const canMoveTask = currentUser.role !== 'Team Member' || task.assigneeId === currentUser.id;
            return (
              <React.Fragment key={task.id}>
                <DraggableTaskCard
                  task={task}
                  currentUser={currentUser}
                  usersById={usersById}
                  projectsById={projectsById}
                  onTaskClick={onTaskClick}
                  onTaskMove={onTaskMove}
                  getPriorityColor={getPriorityColor}
                  canMoveTask={canMoveTask}
                  prefersReducedMotion={prefersReducedMotion}
                />
              </React.Fragment>
            );
          })
        )}
      </div>
    </motion.section>
  );
}

export default function TaskBoard({ tasks, users, projects, currentUser, onTaskClick, onTaskMove }: TaskBoardProps) {
  const prefersReducedMotion = useReducedMotion();
  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user] as const)), [users]);
  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project] as const)), [projects]);
  const tasksByStatus = useMemo(
    () => tasks.reduce<Record<TaskStatus, Task[]>>((accumulator, task) => {
      accumulator[task.status].push(task);
      return accumulator;
    }, { Todo: [], 'In Progress': [], Review: [], Done: [] }),
    [tasks],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const task = tasks.find((item) => item.id === active.id);
    if (!task) {
      return;
    }

    if (!STATUS_ORDER.includes(over.id as TaskStatus)) {
      return;
    }

    const nextStatus = over.id as TaskStatus;
    if (nextStatus !== task.status) {
      void onTaskMove(task.id, nextStatus);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {COLUMNS.map((column) => (
          <React.Fragment key={column.id}>
            <TaskColumn
              column={column}
              tasks={tasksByStatus[column.id]}
              currentUser={currentUser}
              usersById={usersById}
              projectsById={projectsById}
              onTaskClick={onTaskClick}
              onTaskMove={onTaskMove}
              getPriorityColor={getPriorityColor}
              prefersReducedMotion={prefersReducedMotion}
            />
          </React.Fragment>
        ))}
      </div>
      <DragOverlay />
    </DndContext>
  );
}
