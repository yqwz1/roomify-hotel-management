import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import Settings from './Settings';
import { ThemeProvider, THEME_STORAGE_KEY } from '../theme/ThemeProvider';

const renderSettings = () =>
  render(
    <BrowserRouter>
      <ThemeProvider>
        <Settings />
      </ThemeProvider>
    </BrowserRouter>
  );

describe('Settings', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders the premium appearance controls and all ten themes', () => {
    renderSettings();

    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Roomify Premium/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Roomify Classic/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Midnight Emerald/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Royal Gold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aurora Violet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ocean Sapphire/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sunset Coral/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Alpine Mint/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rose Quartz/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Graphite Copper/i })).toBeInTheDocument();
  });

  it('applies and persists the selected theme immediately', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: /Aurora Violet/i }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('aurora-violet');
    });
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('aurora-violet');
    expect(screen.getByRole('status')).toHaveTextContent(/Aurora Violet applied/i);
  });

  it('loads a saved theme from localStorage', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'graphite-copper');

    renderSettings();

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('graphite-copper');
    });
    expect(screen.getByRole('button', { name: /Graphite Copper/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
