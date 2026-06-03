import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AnimatedNumber from './AnimatedNumber';

describe('AnimatedNumber', () => {
  it('renders the final formatted value in tests', () => {
    render(<AnimatedNumber value="SAR 12,450.50" />);

    const value = screen.getByText('SAR 12,450.50');
    expect(value).toBeInTheDocument();
    expect(value).toHaveStyle({ fontVariantNumeric: 'tabular-nums' });
  });

  it('preserves percentage and count formatting without count-up animation', () => {
    render(
      <div>
        <AnimatedNumber value="82.5%" />
        <AnimatedNumber value="1,240 reservations" />
      </div>
    );

    expect(screen.getByText('82.5%')).toBeInTheDocument();
    expect(screen.getByText('1,240 reservations')).toBeInTheDocument();
  });

  it('renders non-numeric values unchanged', () => {
    render(<AnimatedNumber value="Unavailable" />);

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
});
