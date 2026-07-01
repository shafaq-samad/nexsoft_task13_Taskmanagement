import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useActivityFeed } from '../contexts/ActivityContext';
import { useToast } from '../contexts/ToastContext';
import { api, ApiError } from '../services/api';
import { Project, ProjectCreateRequest } from '../types';

export function useProjects() {
  const { token, user } = useAuth();
  const { recordActivity } = useActivityFeed();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    if (!token || !user) {
      setProjects([]);
      return;
    }

    setIsLoading(true);
    try {
      setProjects(await api.projects.list());
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load projects.';
      showToast(message, true);
    } finally {
      setIsLoading(false);
    }
  }, [showToast, token, user]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(async (payload: ProjectCreateRequest) => {
    const project = await api.projects.create(payload);
    setProjects((current) => [...current, project]);
    showToast(`Project '${project.name}' created.`);
    if (user) {
      recordActivity({
        type: 'project',
        title: 'Project created',
        detail: `${user.name} created ${project.name}.`,
      });
    }
    return project;
  }, [recordActivity, showToast, user]);

  return { projects, isLoading, refreshProjects: loadProjects, createProject, setProjects };
}
