import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppSidebar from './AppSidebar';

const mockUseAuth = vi.fn();
let currentDir = 'ltr';

vi.mock('../../context/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      dir: () => currentDir,
    },
  }),
}));

describe('AppSidebar', () => {
  it('anchors the closed sidebar to the left in ltr', () => {
    currentDir = 'ltr';
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['ROLE_MANAGER'],
        username: 'Admin',
      },
    });

    const { container } = render(
      <MemoryRouter>
        <AppSidebar isOpen={false} onClose={() => {}} />
      </MemoryRouter>
    );

    const sidebar = container.querySelector('aside');

    expect(sidebar?.className).toContain('left-0');
    expect(sidebar?.className).toContain('-translate-x-full');
  });

  it('anchors the closed sidebar to the right in rtl', () => {
    currentDir = 'rtl';
    mockUseAuth.mockReturnValue({
      user: {
        roles: ['ROLE_MANAGER'],
        username: 'Admin',
      },
    });

    const { container } = render(
      <MemoryRouter>
        <AppSidebar isOpen={false} onClose={() => {}} />
      </MemoryRouter>
    );

    const sidebar = container.querySelector('aside');

    expect(sidebar?.className).toContain('right-0');
    expect(sidebar?.className).toContain('translate-x-full');
  });
});
