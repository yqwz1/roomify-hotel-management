import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  it('uses a compact fixed-right launcher and panel', () => {
    render(<ManagerAiAssistant />);

    const launcher = screen.getByRole('button', { name: /ask roomi/i });
    expect(launcher.className).toContain('right-4');
    expect(launcher.className).toContain('sm:right-6');
    expect(launcher.className).toContain('h-16');
    expect(launcher.className).toContain('w-16');
    expect(launcher.className).not.toContain('inset-x-0');
    expect(launcher.className).not.toContain('left-0 right-0');

    fireEvent.click(launcher);

    const panel = document.querySelector('[data-assistant-side="right"]');
    expect(panel).toBeTruthy();
    expect(panel.className).toContain('right-4');
    expect(panel.className).toContain('sm:right-6');
    expect(panel.className).toContain('w-[min(24rem,calc(100vw-2rem))]');
    expect(panel.className).not.toContain('inset-x-0');
  });

  it('shows Gemini source label and local loading text', async () => {
    let resolveChat;
    chatWithAiAssistant.mockReturnValue(new Promise((resolve) => {
      resolveChat = resolve;
    }));

    render(<ManagerAiAssistant />);
    fireEvent.click(screen.getByRole('button', { name: /ask roomi/i }));
    fireEvent.change(screen.getByPlaceholderText(/ask about demand/i), {
      target: { value: '2+5' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send prompt/i }));

    expect(screen.getByText('Roomi is thinking...')).toBeInTheDocument();
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
});
