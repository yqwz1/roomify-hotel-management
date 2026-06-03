import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MotionItem, MotionPage, MotionSection, MotionStagger } from './MotionPage';

vi.mock('framer-motion', () => ({
  useReducedMotion: () => false,
  motion: {
    div: ({ children, initial, animate, exit, transition, variants, whileInView, viewport, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, initial, animate, exit, transition, variants, whileInView, viewport, ...props }) => <section {...props}>{children}</section>,
  },
}));

describe('motion wrappers', () => {
  it('render children and apply reusable motion classes', () => {
    render(
      <MemoryRouter>
        <MotionPage>
          <MotionSection>
            <MotionStagger>
              <MotionItem>Premium motion content</MotionItem>
            </MotionStagger>
          </MotionSection>
        </MotionPage>
      </MemoryRouter>
    );

    expect(screen.getByText('Premium motion content')).toBeInTheDocument();
    expect(screen.getByText('Premium motion content').className).toContain('motion-card-pop');
  });
});
