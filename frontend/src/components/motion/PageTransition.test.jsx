import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PageTransition from './PageTransition';

describe('PageTransition', () => {
  it('renders children inside the cinematic motion shell', () => {
    render(
      <MemoryRouter initialEntries={['/manager/dashboard']}>
        <PageTransition>
          <div>Dashboard content</div>
        </PageTransition>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard content').parentElement).toHaveClass('motion-page-cinematic');
  });
});
