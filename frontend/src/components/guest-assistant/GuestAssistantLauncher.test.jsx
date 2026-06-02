import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GuestAssistantLauncher from './GuestAssistantLauncher';

describe('GuestAssistantLauncher', () => {
  it('renders without a notification number badge', () => {
    render(
      <GuestAssistantLauncher
        open={false}
        staffOnline
        unreadCount={1}
        onClick={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /open guest assistant/i })).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('opens through the compact launcher button', () => {
    const onClick = vi.fn();

    render(
      <GuestAssistantLauncher
        open={false}
        staffOnline={false}
        onClick={onClick}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /open guest assistant/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
