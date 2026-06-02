import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GuestAssistantMessageList from './GuestAssistantMessageList';

describe('GuestAssistantMessageList', () => {
  it('renders animated user and assistant messages with typing state', () => {
    render(
      <GuestAssistantMessageList
        guestView
        language="en"
        typingLabel="Staff is typing..."
        messages={[
          {
            id: 1,
            senderRole: 'GUEST',
            senderDisplayName: 'Guest',
            originalBody: 'Need towels',
            createdAt: '2099-01-01T10:00:00',
          },
          {
            id: 2,
            senderRole: 'AI',
            senderDisplayName: 'Roomie',
            originalBody: 'I can help with that.',
            createdAt: '2099-01-01T10:01:00',
          },
        ]}
      />
    );

    expect(screen.getByText('Need towels')).toBeInTheDocument();
    expect(screen.getByText('I can help with that.')).toBeInTheDocument();
    expect(screen.getByLabelText('Staff is typing...')).toBeInTheDocument();
  });
});
