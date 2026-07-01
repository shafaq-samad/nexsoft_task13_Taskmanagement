import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ActivityType = 'auth' | 'task' | 'project' | 'system';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  timestamp: string;
}

interface ActivityContextValue {
  entries: ActivityEntry[];
  recordActivity: (entry: Omit<ActivityEntry, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  clearActivity: () => void;
}

const ACTIVITY_STORAGE_KEY = 'taskboard-activity-feed';
const ActivityContext = createContext<ActivityContextValue | undefined>(undefined);

const readStoredEntries = (): ActivityEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as ActivityEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<ActivityEntry[]>(readStoredEntries);

  useEffect(() => {
    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(entries.slice(0, 20)));
  }, [entries]);

  const recordActivity = (entry: Omit<ActivityEntry, 'id' | 'timestamp'> & { timestamp?: string }) => {
    setEntries((currentEntries) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: entry.timestamp ?? new Date().toISOString(),
        ...entry,
      },
      ...currentEntries,
    ].slice(0, 20));
  };

  const clearActivity = () => setEntries([]);

  const value = useMemo(() => ({ entries, recordActivity, clearActivity }), [entries]);

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivityFeed() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivityFeed must be used within ActivityProvider');
  }

  return context;
}
