import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AnimatedNumber from './AnimatedNumber';

describe('AnimatedNumber', () => {
  it('renders the final formatted value in tests', () => {
    render(<AnimatedNumber value="SAR 12,450.50" />);

    expect(screen.getByText('SAR 12,450.50')).toBeInTheDocument();
  });

  it('renders non-numeric values unchanged', () => {
    render(<AnimatedNumber value="Unavailable" />);

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
});
