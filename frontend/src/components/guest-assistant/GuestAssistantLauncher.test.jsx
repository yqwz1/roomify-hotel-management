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

  it('uses compact right-side launcher sizing by default', () => {
    render(
      <GuestAssistantLauncher
        open={false}
        staffOnline
        unreadCount={8}
        onClick={vi.fn()}
      />
    );

    const launcher = screen.getByTestId('guest-assistant-launcher');
    expect(launcher).toHaveClass('fixed');
    expect(launcher).toHaveClass('right-4');
    expect(launcher).toHaveClass('sm:right-6');
    expect(launcher.className).toContain('bottom-[calc(var(--roomify-mobile-nav-height)+env(safe-area-inset-bottom,0px)+1rem)]');
    expect(launcher).toHaveClass('sm:bottom-6');
    expect(launcher).toHaveClass('h-16');
    expect(launcher).toHaveClass('w-16');
    expect(launcher).toHaveStyle({ left: 'auto' });
    expect(launcher).toHaveAttribute('data-assistant-side', 'right');
    expect(launcher.className).not.toContain('end-');
    expect(launcher.className).not.toContain('start-');
    expect(launcher).not.toHaveTextContent('8');
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
