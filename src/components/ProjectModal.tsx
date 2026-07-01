import React, { useId, useRef, useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, description: string) => Promise<void>;
}

export default function ProjectModal({ isOpen, onClose, onCreateProject }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const modalTitleId = useId();
  const prefersReducedMotion = useReducedMotion();

  useFocusTrap(modalRef, isOpen);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onCreateProject(name, description);
      setName('');
      setDescription('');
      onClose();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setLoading(false);
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
            id="project-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            tabIndex={-1}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden transform transition-all focus:outline-none"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-500" />
                <h3 id={modalTitleId} className="font-bold text-slate-900 text-sm uppercase tracking-wider">New project</h3>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div role="alert" className="bg-rose-50 text-rose-800 text-xs p-3 rounded border border-rose-100">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="project-name-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Client onboarding portal"
              className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white font-medium"
            />
          </div>

          <div>
            <label htmlFor="project-description-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              id="project-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Workspace objectives and timeline..."
              rows={3}
              className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white font-medium"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded border border-transparent hover:border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded shadow-xs transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

