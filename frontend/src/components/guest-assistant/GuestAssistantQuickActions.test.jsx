import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GuestAssistantQuickActions from './GuestAssistantQuickActions';

describe('GuestAssistantQuickActions', () => {
  afterEach(() => {
    document.documentElement.dir = '';
  });

  it('aligns quick prompt chips to the assistant side without stretching them', () => {
    render(<GuestAssistantQuickActions onAction={vi.fn()} />);

    const firstPrompt = screen.getAllByRole('button')[0];
    expect(firstPrompt.parentElement).toHaveClass('assistant-prompt-strip');
    expect(firstPrompt.parentElement).toHaveClass('assistant-prompt-strip-end');
    expect(firstPrompt).toHaveClass('shrink-0');
  });

  it('keeps quick prompt chips right-aligned even if the document is rtl', () => {
    document.documentElement.dir = 'rtl';

    render(
      <GuestAssistantQuickActions
        onAction={vi.fn()}
      />
    );

    expect(screen.getAllByRole('button')[0].parentElement).toHaveClass('assistant-prompt-strip-end');
  });
});
