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
});
