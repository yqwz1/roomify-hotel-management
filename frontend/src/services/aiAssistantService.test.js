import { describe, expect, it, vi } from 'vitest';
import { chatWithAiAssistant, normalizeAiAssistantHistory } from './aiAssistantService';

vi.mock('./api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { answer: 'OK', source: 'GEMINI_API' } }),
  },
}));

describe('aiAssistantService', () => {
  it('does not send the seeded Roomi greeting as backend history', () => {
    const history = normalizeAiAssistantHistory([
      {
        role: 'assistant',
        source: 'ROOMI',
        content: 'Hello! I am Roomi, your hotel management assistant. I can help with pricing recommendations.',
      },
      { role: 'user', content: '2+5' },
    ]);

    expect(history).toEqual([{ role: 'user', content: '2+5' }]);
  });

  it('keeps useful history and ignores empty or invalid messages', () => {
    const history = normalizeAiAssistantHistory([
      { role: 'user', content: ' Analyze revenue ' },
      { role: 'assistant', content: 'Revenue is up.' },
      { role: 'assistant', content: '   ' },
      { role: 'system', content: 'not allowed from frontend' },
    ]);

    expect(history).toEqual([
      { role: 'user', content: 'Analyze revenue' },
      { role: 'assistant', content: 'Revenue is up.' },
    ]);
  });

  it('posts normalized history to the unchanged backend endpoint', async () => {
    const api = (await import('./api')).default;

    await chatWithAiAssistant({
      message: '2+5',
      history: [
        {
          role: 'assistant',
          source: 'ROOMI',
          content: 'Hello! I am Roomi, your hotel management assistant. I can help with pricing recommendations.',
        },
        { role: 'user', content: '2+5' },
      ],
    });

    expect(api.post).toHaveBeenCalledWith(
      '/ai-assistant/chat',
      { message: '2+5', history: [{ role: 'user', content: '2+5' }] },
      { timeout: 120000 }
    );
  });
});
