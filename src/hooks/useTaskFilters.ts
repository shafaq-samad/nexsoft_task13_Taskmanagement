import { useMemo } from 'react';
import { Task } from '../types';

export function useTaskFilters(tasks: Task[], searchQuery: string, selectedProjectId: string) {
  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesProject = selectedProjectId === 'all' || task.projectId === selectedProjectId;
      const matchesSearch =
        !normalizedQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description.toLowerCase().includes(normalizedQuery);

      return matchesProject && matchesSearch;
    });
  }, [tasks, searchQuery, selectedProjectId]);

  return filteredTasks;
}
