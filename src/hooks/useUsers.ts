import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types';

export function useUsers() {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!token || !user) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    try {
      setUsers(await api.users.list());
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load users.';
      showToast(message, true);
    } finally {
      setIsLoading(false);
    }
  }, [showToast, token, user]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return { users, isLoading, refreshUsers: loadUsers, setUsers };
}
