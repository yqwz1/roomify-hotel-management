import { describe, expect, it } from 'vitest';
import {
  getNavigationSections,
  ROLE_GUEST,
  ROLE_MANAGER,
} from './navConfig';

const getPathsForRoles = (roles) =>
  getNavigationSections(roles, (key) => key).flatMap((section) => section.items.map((item) => item.path));

describe('navConfig', () => {
  it('exposes home and bookings navigation for managers', () => {
    const paths = getPathsForRoles([ROLE_MANAGER]);

    expect(paths).toContain('/');
    expect(paths).toContain('/bookings');
  });

  it('does not duplicate the bookings entry for guests', () => {
    const paths = getPathsForRoles([ROLE_GUEST]);
    const bookingPaths = paths.filter((path) => path === '/bookings');

    expect(bookingPaths).toHaveLength(1);
  });
});
