import { ActivityEntry } from '../contexts/ActivityContext';
import { Project, Task, User } from '../types';

interface WorkspaceInsightsProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  activityEntries: ActivityEntry[];
}

const STATUS_ORDER = ['Todo', 'In Progress', 'Review', 'Done'] as const;

export default function WorkspaceInsights({ tasks, projects, users, activityEntries }: WorkspaceInsightsProps) {
  const taskCounts = STATUS_ORDER.map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length,
  }));

  const workload = users.map((user) => ({
    user,
    count: tasks.filter((task) => task.assigneeId === user.id).length,
  })).sort((left, right) => right.count - left.count);

  const dueSoon = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const diffInDays = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays >= 0 && diffInDays <= 7;
  }).length;

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 card-shadow">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Board Summary</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Tasks</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{tasks.length}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Projects</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{projects.length}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Due this week</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{dueSoon}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Members</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{users.length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 card-shadow">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Mix</p>
        <div className="mt-4 space-y-3">
          {taskCounts.map((item) => (
            <div key={item.status}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{item.status}</span>
                <span className="font-semibold text-slate-900">{item.count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{ width: `${tasks.length ? (item.count / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 card-shadow">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Latest Activity</p>
        <div className="mt-4 space-y-3">
          {activityEntries.slice(0, 4).map((entry) => (
            <div key={entry.id} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-900">{entry.title}</p>
              <p className="mt-1 text-[11px] text-slate-500">{entry.detail}</p>
            </div>
          ))}
          {activityEntries.length === 0 && (
            <p className="text-xs text-slate-500">No activity yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 card-shadow lg:col-span-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workload by Assignee</p>
        <div className="mt-4 space-y-3">
          {workload.map(({ user, count }) => (
            <div key={user.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-500">{user.role}</p>
              </div>
              <div className="text-sm font-bold text-slate-900">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
