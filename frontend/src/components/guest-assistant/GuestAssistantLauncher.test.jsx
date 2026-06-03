import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GuestAssistantLauncher from './GuestAssistantLauncher';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => children,
  motion: {
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
}));

describe('GuestAssistantLauncher', () => {
  it('uses physical right positioning and does not render unread badge numbers', () => {
    render(
      <GuestAssistantLauncher
        open={false}
        unreadCount={7}
        staffOnline
        onClick={() => {}}
      />
    );

    const launcher = screen.getByRole('button', { name: /open guest assistant/i });
    expect(launcher.className).toContain('right-4');
    expect(launcher.className).toContain('sm:right-6');
    expect(launcher.className).not.toContain('end-4');
    expect(launcher.className).not.toContain('sm:end-6');
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });
});
