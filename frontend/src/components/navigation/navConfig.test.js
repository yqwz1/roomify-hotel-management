import { describe, expect, it } from 'vitest';
import {
  GUEST_BILLING_STATUS_PATH,
  getNavigationSections,
  ROLE_GUEST,
  ROLE_MANAGER,
  ROLE_STAFF,
} from './navConfig';

const getPathsForRoles = (roles) =>
  getNavigationSections(roles, (key) => key).flatMap((section) => section.items.map((item) => item.path));

const getLabelsForRoles = (roles) =>
  getNavigationSections(roles, (key) => key).flatMap((section) => section.items.map((item) => item.label));

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

  it('exposes guest-safe browse and billing navigation paths', () => {
    const paths = getPathsForRoles([ROLE_GUEST]);

    expect(paths).toContain('/search');
    expect(paths).toContain(GUEST_BILLING_STATUS_PATH);
  });

  it('builds the requested staff navigation labels', () => {
    const labels = getLabelsForRoles([ROLE_STAFF]);

    expect(labels).toEqual([
      'Front Desk',
      'Reservations',
      'Arrivals',
      'Departures',
      'Billing',
    ]);
  });
});
