import React from 'react';
import { ShieldCheck, User, Users2, HelpCircle } from 'lucide-react';

export default function RoleGuide() {
  return (
    <div id="role-guide" className="bg-white border border-slate-200 rounded-xl p-6 mb-8 card-shadow">
      <div className="flex items-center gap-3 mb-4">
        <HelpCircle className="w-5 h-5 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Enterprise RBAC & Access Matrix</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        This workspace runs a state machine with strict server-side Role-Based Access Control (RBAC). Check out the roles below:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Admin Card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-rose-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded bg-rose-100 text-rose-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Admin Role</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong>Sarah Connor</strong>. Has full, unrestricted permissions. Can create, update, and is the <span className="text-rose-700 font-semibold">only role</span> authorized to <strong>delete tasks</strong>.
          </p>
        </div>

        {/* PM Card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded bg-amber-100 text-amber-700">
              <Users2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Project Manager</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong>John Miller</strong>. Can design projects, create tasks, and assign members. Authorized to mutate any task details but <span className="text-amber-700 font-semibold">cannot delete tasks</span>.
          </p>
        </div>

        {/* Team Member Card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded bg-blue-100 text-blue-700">
              <User className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Team Member</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong>Alex & Emily</strong>. Can view all project tasks. Strictly restricted to updating the <span className="text-blue-700 font-semibold">status</span> of tasks <span className="text-blue-700 font-semibold">assigned to them</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

