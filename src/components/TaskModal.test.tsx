import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TaskModal from './TaskModal';

const users = [
  { id: 'user-admin', name: 'Sarah Connor', email: 'admin@enterprise.com', role: 'Admin' as const, avatarUrl: '/avatars/admin.svg' },
  { id: 'user-member', name: 'Alex Rivera', email: 'alex@enterprise.com', role: 'Team Member' as const, avatarUrl: '/avatars/member-1.svg' },
];

const projects = [
  { id: 'proj-alpha', name: 'Alpha', description: 'Demo', managerId: 'user-admin' },
];

describe('TaskModal', () => {
  it('renders as an accessible dialog and traps focus on the first control', async () => {
    render(
      <TaskModal
        isOpen
        onClose={vi.fn()}
        task={null}
        currentProjectId="proj-alpha"
        projects={projects}
        users={users}
        currentUser={users[0]}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    await waitFor(() => expect(screen.getByLabelText('Task Title')).toHaveFocus());
  });
});
