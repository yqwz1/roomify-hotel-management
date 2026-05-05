import { describe, expect, it } from 'vitest';
import {
  GUEST_BILLING_STATUS_PATH,
  ROLE_ADMIN,
  getNavigationSections,
  getPageMeta,
  ROLE_GUEST,
  ROLE_MANAGER,
  ROLE_STAFF,
  getDefaultRouteForRoles,
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
    expect(paths).toContain('/manager/expenses');
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

  it('routes admins to the admin dashboard by default', () => {
    expect(getDefaultRouteForRoles([ROLE_ADMIN])).toBe('/admin/dashboard');
  });

  it('combines admin and manager navigation for owner users with both roles', () => {
    const paths = getPathsForRoles([ROLE_ADMIN, ROLE_MANAGER]);

    expect(paths).toContain('/staff');
    expect(paths).toContain('/room-types');
    expect(paths).toContain('/manager/dashboard');
    expect(paths).toContain('/manager/expenses');
    expect(getDefaultRouteForRoles([ROLE_ADMIN, ROLE_MANAGER])).toBe('/admin/dashboard');
  });

  it('keeps staff and room type navigation off the manager sidebar', () => {
    const paths = getPathsForRoles([ROLE_MANAGER]);

    expect(paths).not.toContain('/staff');
    expect(paths).not.toContain('/room-types');
  });

  it('keeps direct book-room entry off role sidebars', () => {
    expect(getPathsForRoles([ROLE_MANAGER])).not.toContain('/book');
    expect(getPathsForRoles([ROLE_STAFF])).not.toContain('/book');
  });

  it('prefers explicit reservation detail metadata over the reservations parent item', () => {
    const meta = getPageMeta('/reservations/RSV-1001', [ROLE_STAFF], (key) => key);

    expect(meta.title).toBe('Reservation Details');
    expect(meta.sectionLabel).toBe('Reservations');
  });
});
