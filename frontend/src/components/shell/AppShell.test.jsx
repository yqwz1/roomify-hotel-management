import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppShell from './AppShell';

const mockUseAuth = vi.fn();

vi.mock('../../context/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('./AppSidebar', () => ({
  default: () => <div>Sidebar</div>,
}));

vi.mock('./AppTopbar', () => ({
  default: () => <div>Topbar</div>,
}));

vi.mock('../guest-assistant/FloatingGuestAssistant', () => ({
  default: () => <div>Guest Assistant</div>,
}));

vi.mock('../ai-assistant/ManagerAiAssistant', () => ({
  default: () => <div>Manager AI Assistant</div>,
}));

describe('AppShell', () => {
  it('shows the manager AI assistant for manager-primary users', () => {
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['ROLE_MANAGER'],
      },
    });

    render(
      <MemoryRouter>
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      </MemoryRouter>
    );

    expect(screen.getByText('Manager AI Assistant')).toBeInTheDocument();
  });

  it('hides the manager AI assistant when admin is the primary role', () => {
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
      },
    });

    render(
      <MemoryRouter>
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      </MemoryRouter>
    );

    expect(screen.queryByText('Manager AI Assistant')).not.toBeInTheDocument();
  });
});
