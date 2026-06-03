import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ManagerAiAssistant from './ManagerAiAssistant';
import { chatWithAiAssistant } from '../../services/aiAssistantService';

vi.mock('../../services/aiAssistantService', () => ({
  chatWithAiAssistant: vi.fn(),
  extractAiAssistantError: vi.fn(() => 'AI error'),
}));

vi.mock('./MarkdownMessage', () => ({
  default: ({ content }) => <p>{content}</p>,
}));

describe('ManagerAiAssistant', () => {
  it('shows Gemini source label and local loading text', async () => {
    let resolveChat;
    chatWithAiAssistant.mockReturnValue(new Promise((resolve) => {
      resolveChat = resolve;
    }));

    render(<ManagerAiAssistant />);
    fireEvent.click(screen.getByRole('button', { name: /open manager ai assistant/i }));
    await waitFor(() => {
      expect(screen.getByText('Operations Copilot').closest('aside')).toHaveAttribute('aria-hidden', 'false');
    });
    fireEvent.change(screen.getByPlaceholderText(/ask about demand/i), {
      target: { value: '2+5' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send prompt/i }));

    expect(screen.getByText('Roomi is thinking...')).toBeInTheDocument();
    expect(screen.getByLabelText('Roomi is thinking')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send prompt/i })).toBeDisabled();

    resolveChat({
      answer: 'The answer is 7.',
      source: 'GEMINI_API',
      dataSources: ['ROOMIFY_DB', 'GEMINI_EXPLANATION'],
      fallbackUsed: false,
    });

    await waitFor(() => expect(screen.getByText('Explanation by: Gemini')).toBeInTheDocument());
    expect(screen.getByText('Data source: ROOMIFY_DB')).toBeInTheDocument();
  });

  it('renders as a compact assistant panel with delayed close unmount', async () => {
    vi.useFakeTimers();

    try {
      render(<ManagerAiAssistant />);

      fireEvent.click(screen.getByRole('button', { name: /open manager ai assistant/i }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(20);
      });

      const panel = screen.getByText('Operations Copilot').closest('aside');
      expect(panel).toHaveClass('motion-assistant-panel');
      expect(panel).toHaveClass('motion-roomie-panel-shell');
      expect(panel).toHaveClass('fixed');
      expect(panel).toHaveClass('right-4');
      expect(panel).toHaveClass('sm:right-6');
      expect(panel.className).toContain('w-[min(27rem,calc(100vw-2rem))]');
      expect(panel).toHaveStyle({ left: 'auto' });
      expect(panel).toHaveAttribute('data-assistant-side', 'right');
      expect(screen.getByText(/hotel management assistant/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /close manager ai assistant/i }));

      expect(screen.getByText('Operations Copilot')).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(320);
      });

      expect(screen.queryByText('Operations Copilot')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses a compact floating launcher instead of a wide bar', () => {
    render(<ManagerAiAssistant />);

    const launcher = screen.getByTestId('manager-ai-launcher');
    expect(launcher).toHaveClass('fixed');
    expect(launcher).toHaveClass('right-4');
    expect(launcher).toHaveClass('sm:right-6');
    expect(launcher).toHaveClass('sm:bottom-6');
    expect(launcher).toHaveClass('h-16');
    expect(launcher).toHaveClass('w-16');
    expect(launcher).toHaveStyle({ left: 'auto' });
    expect(launcher).toHaveAttribute('data-assistant-side', 'right');
    expect(launcher.className).not.toContain('end-');
    expect(launcher.className).not.toContain('start-');
    expect(launcher).not.toHaveTextContent(/manager only/i);
    expect(launcher).not.toHaveTextContent(/ask roomi/i);
  });

  it('right-aligns suggested prompt chips inside the compact panel', async () => {
    render(<ManagerAiAssistant />);

    fireEvent.click(screen.getByRole('button', { name: /open manager ai assistant/i }));

    await waitFor(() => {
      expect(screen.getByText('Analyze weekly revenue')).toBeInTheDocument();
    });

    expect(screen.getByText('Analyze weekly revenue').parentElement).toHaveClass('assistant-prompt-strip');
    expect(screen.getByText('Analyze weekly revenue').parentElement).toHaveClass('assistant-prompt-strip-end');
  });
});
