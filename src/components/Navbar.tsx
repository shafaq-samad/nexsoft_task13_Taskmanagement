import React from 'react';
import { LogOut, LayoutGrid, ShieldCheck, User, Users2 } from 'lucide-react';
import { User as AppUser } from '../types';

interface NavbarProps {
  currentUser: AppUser | null;
  onLogout: () => void;
}

export default function Navbar({ currentUser, onLogout }: NavbarProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-700 uppercase rounded border border-rose-200">
            <ShieldCheck className="w-3 h-3" />
            Admin
          </span>
        );
      case 'Project Manager':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 uppercase rounded border border-amber-200">
            <Users2 className="w-3 h-3" />
            PM
          </span>
        );
      case 'Team Member':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 uppercase rounded border border-blue-200">
            <User className="w-3 h-3" />
            Member
          </span>
        );
    }
  };

  return (
    <nav className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold text-white shadow-xs">
          P
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm font-medium">Workspace</span>
          <span className="text-slate-400 text-sm font-medium">/</span>
          <h1 className="text-md font-semibold text-slate-900 tracking-tight">ProManager Enterprise</h1>
          {currentUser && (
            <span className="ml-2">
              {getRoleBadge(currentUser.role)}
            </span>
          )}
        </div>
      </div>

      {/* User profile & controls */}
      {currentUser && (
        <div className="flex items-center gap-6">
          {/* User Meta */}
          <div className="flex items-center gap-3 pr-5 border-r border-slate-200 h-10">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800 leading-tight">{currentUser.name}</p>
              <p className="text-[11px] text-slate-400">{currentUser.email}</p>
            </div>
            
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white" />
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="text-slate-500 hover:text-slate-800 rounded-lg p-2 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Log Out"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}

