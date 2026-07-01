import { useMemo } from 'react';
import { Project, User } from '../types';

export function useLookupMaps(users: User[], projects: Project[]) {
  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user] as const)), [users]);
  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project] as const)), [projects]);

  return { usersById, projectsById };
}
