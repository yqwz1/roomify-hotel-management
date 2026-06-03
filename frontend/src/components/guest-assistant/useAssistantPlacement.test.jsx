import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import useAssistantPlacement from './useAssistantPlacement';

function PlacementProbe() {
  const placement = useAssistantPlacement();

  return (
    <div
      data-testid="placement"
      data-side={placement.side}
      data-launcher={placement.launcherClassName}
      data-panel={placement.panelClassName}
      data-prompt={placement.promptClassName}
      style={placement.style}
    />
  );
}

describe('useAssistantPlacement', () => {
  afterEach(() => {
    document.documentElement.dir = '';
  });

  it('places the assistant on the fixed bottom-right side', () => {
    render(<PlacementProbe />);

    const placement = screen.getByTestId('placement');
    expect(placement).toHaveAttribute('data-side', 'right');
    expect(placement).toHaveAttribute('data-launcher', 'right-4 sm:right-6');
    expect(placement).toHaveAttribute('data-prompt', 'assistant-prompt-strip-end');
    expect(placement).toHaveStyle({ left: 'auto' });
  });

  it('does not use logical positioning that can flip into the sidebar', () => {
    document.documentElement.dir = 'rtl';

    render(<PlacementProbe />);

    const placement = screen.getByTestId('placement');
    expect(placement).toHaveAttribute('data-side', 'right');
    expect(placement).toHaveAttribute('data-launcher', 'right-4 sm:right-6');
    expect(placement).toHaveAttribute('data-panel', 'right-4 sm:right-6');
    expect(placement).toHaveAttribute('data-prompt', 'assistant-prompt-strip-end');
    expect(placement).toHaveStyle({ left: 'auto' });
  });
});
