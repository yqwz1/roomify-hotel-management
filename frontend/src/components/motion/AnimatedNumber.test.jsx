import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AnimatedNumber from './AnimatedNumber';

describe('AnimatedNumber', () => {
  it('renders the final value immediately without animation timers', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    render(<AnimatedNumber value={12850} prefix="SAR " />);

    expect(screen.getByText('SAR 12,850')).toBeInTheDocument();
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('preserves percent, decimals, suffix, and formatter output', () => {
    const { rerender } = render(<AnimatedNumber value={42.35} percent decimals={1} />);
    expect(screen.getByText('42.4%')).toBeInTheDocument();

    rerender(<AnimatedNumber value={12.5} suffix=" nights" decimals={1} />);
    expect(screen.getByText('12.5 nights')).toBeInTheDocument();

    rerender(<AnimatedNumber value={3} formatter={(value) => `rooms:${value}`} />);
    expect(screen.getByText('rooms:3')).toBeInTheDocument();
  });
});
