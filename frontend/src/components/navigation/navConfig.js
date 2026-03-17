import {
  BedDouble,
  ClipboardCheck,
  DoorClosedLocked,
  FileText,
  LayoutDashboard,
  Receipt,
  Search,
  Settings2,
  Sparkles,
  Tag,
  UserCog,
  Users,
} from 'lucide-react';

export const ROLE_MANAGER = 'ROLE_MANAGER';
export const ROLE_STAFF = 'ROLE_STAFF';
export const ROLE_GUEST = 'ROLE_GUEST';

const ROLE_PRIORITY = [ROLE_MANAGER, ROLE_STAFF, ROLE_GUEST];

export const translateWithFallback = (t, translationKey, fallbackLabel, options) => {
  if (!translationKey) return fallbackLabel;

  const translated = t(translationKey, options);
  return translated === translationKey ? fallbackLabel : translated;
};

export const getPrimaryRole = (roles = []) => ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;

export const getDefaultRouteForRoles = (roles = []) => {
  const primaryRole = getPrimaryRole(roles);

  switch (primaryRole) {
    case ROLE_MANAGER:
      return '/manager/dashboard';
    case ROLE_STAFF:
      return '/staff/dashboard';
    case ROLE_GUEST:
      return '/guest/dashboard';
    default:
      return '/';
  }
};

export const getRoleDisplayLabel = (roles = [], t) => {
  const primaryRole = getPrimaryRole(roles);

  switch (primaryRole) {
    case ROLE_MANAGER:
      return translateWithFallback(t, 'roleManager', 'Manager');
    case ROLE_STAFF:
      return translateWithFallback(t, 'roleStaff', 'Staff');
    case ROLE_GUEST:
      return translateWithFallback(t, 'roleGuest', 'Guest');
    default:
      return translateWithFallback(t, 'user', 'User');
  }
};

const NAVIGATION_CONFIG = [
  {
    id: 'overview',
    translationKey: null,
    fallbackLabel: 'Overview',
    roles: [ROLE_MANAGER, ROLE_STAFF, ROLE_GUEST],
    items: [
      {
        path: '/manager/dashboard',
        translationKey: 'managerDashboardTitle',
        fallbackLabel: 'Manager Dashboard',
        icon: LayoutDashboard,
        roles: [ROLE_MANAGER],
      },
      {
        path: '/staff/dashboard',
        translationKey: 'staffDashboardTitle',
        fallbackLabel: 'Staff Dashboard',
        icon: LayoutDashboard,
        roles: [ROLE_STAFF],
      },
      {
        path: '/guest/dashboard',
        translationKey: 'guestDashboardTitle',
        fallbackLabel: 'Guest Dashboard',
        icon: LayoutDashboard,
        roles: [ROLE_GUEST],
      },
    ],
  },
  {
    id: 'front-desk',
    translationKey: null,
    fallbackLabel: 'Front Desk',
    roles: [ROLE_MANAGER, ROLE_STAFF],
    items: [
      {
        path: '/search',
        translationKey: 'roomSearch',
        fallbackLabel: 'Room Search',
        icon: Search,
        roles: [ROLE_MANAGER, ROLE_STAFF],
      },
      {
        path: '/book',
        translationKey: 'bookRoom',
        fallbackLabel: 'Book Room',
        icon: BedDouble,
        roles: [ROLE_MANAGER, ROLE_STAFF],
      },
      {
        path: '/check-in',
        translationKey: 'checkInTitle',
        fallbackLabel: 'Check-In',
        icon: ClipboardCheck,
        roles: [ROLE_MANAGER, ROLE_STAFF],
      },
      {
        path: '/checkout',
        translationKey: 'checkoutTitle',
        fallbackLabel: 'Checkout',
        icon: DoorClosedLocked,
        roles: [ROLE_MANAGER, ROLE_STAFF],
      },
    ],
  },
  {
    id: 'reservations',
    translationKey: null,
    fallbackLabel: 'Reservations',
    roles: [ROLE_MANAGER, ROLE_STAFF],
    items: [
      {
        path: '/reservations/modify',
        translationKey: 'modifyReservationTitle',
        fallbackLabel: 'Modify Reservation',
        icon: FileText,
        roles: [ROLE_MANAGER, ROLE_STAFF],
      },
      {
        path: '/reservations/cancel',
        translationKey: 'cancelReservationTitle',
        fallbackLabel: 'Cancel Reservation',
        icon: FileText,
        roles: [ROLE_MANAGER, ROLE_STAFF],
      },
    ],
  },
  {
    id: 'rooms',
    translationKey: 'rooms',
    fallbackLabel: 'Rooms',
    roles: [ROLE_MANAGER, ROLE_STAFF],
    items: [
      {
        path: '/rooms-management',
        translationKey: 'roomsManagement',
        fallbackLabel: 'Rooms Management',
        icon: Settings2,
        roles: [ROLE_MANAGER],
      },
      {
        path: '/room-types',
        translationKey: 'roomTypes',
        fallbackLabel: 'Room Types',
        icon: Tag,
        roles: [ROLE_MANAGER],
      },
      {
        path: '/room-status',
        translationKey: 'roomStatus',
        fallbackLabel: 'Room Status',
        icon: Sparkles,
        roles: [ROLE_MANAGER, ROLE_STAFF],
      },
    ],
  },
  {
    id: 'finance',
    translationKey: null,
    fallbackLabel: 'Finance',
    roles: [ROLE_MANAGER, ROLE_STAFF],
    items: [
      {
        path: '/invoice-preview',
        translationKey: 'invoicePreview',
        fallbackLabel: 'Invoices',
        icon: Receipt,
        roles: [ROLE_MANAGER, ROLE_STAFF],
      },
    ],
  },
  {
    id: 'staff-access',
    translationKey: null,
    fallbackLabel: 'Staff & Access',
    roles: [ROLE_MANAGER],
    items: [
      {
        path: '/staff',
        translationKey: 'staffMenu',
        fallbackLabel: 'Staff',
        icon: Users,
        roles: [ROLE_MANAGER],
      },
    ],
  },
  {
    id: 'support',
    translationKey: null,
    fallbackLabel: 'Support',
    roles: [ROLE_GUEST],
    items: [
      {
        path: '/bookings',
        translationKey: 'bookings',
        fallbackLabel: 'Booking Help',
        icon: UserCog,
        roles: [ROLE_GUEST],
      },
    ],
  },
];

const PAGE_META = [
  {
    match: (pathname) => /^\/reservations\/[^/]+$/.test(pathname),
    sectionId: 'reservations',
    translationKey: 'reservationDetailsTitle',
    fallbackLabel: 'Reservation Details',
  },
];

const buildSectionLabel = (section, t) => translateWithFallback(t, section.translationKey, section.fallbackLabel);

const buildItemLabel = (item, t) => translateWithFallback(t, item.translationKey, item.fallbackLabel);

export const getNavigationSections = (roles = [], t) =>
  NAVIGATION_CONFIG
    .filter((section) => section.roles.some((role) => roles.includes(role)))
    .map((section) => ({
      ...section,
      label: buildSectionLabel(section, t),
      items: section.items
        .filter((item) => item.roles.some((role) => roles.includes(role)))
        .map((item) => ({
          ...item,
          label: buildItemLabel(item, t),
        })),
    }))
    .filter((section) => section.items.length > 0);

const findSectionById = (sectionId, roles, t) => {
  if (!sectionId) return null;
  return getNavigationSections(roles, t).find((section) => section.id === sectionId) ?? null;
};

export const isNavItemActive = (pathname, itemPath) =>
  pathname === itemPath || pathname.startsWith(`${itemPath}/`);

export const getPageMeta = (pathname, roles = [], t) => {
  const sections = getNavigationSections(roles, t);
  const flatItems = sections.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      sectionId: section.id,
      sectionLabel: section.label,
    }))
  );

  const matchedItem = flatItems.find((item) => isNavItemActive(pathname, item.path));
  if (matchedItem) {
    return {
      title: matchedItem.label,
      sectionLabel: matchedItem.sectionLabel,
    };
  }

  const matchedPageMeta = PAGE_META.find((page) => page.match(pathname));
  if (matchedPageMeta) {
    const section = findSectionById(matchedPageMeta.sectionId, roles, t);
    return {
      title: translateWithFallback(t, matchedPageMeta.translationKey, matchedPageMeta.fallbackLabel),
      sectionLabel: section?.label ?? translateWithFallback(t, 'dashboard', 'Dashboard'),
    };
  }

  return {
    title: translateWithFallback(t, 'dashboard', 'Dashboard'),
    sectionLabel: translateWithFallback(t, 'dashboard', 'Dashboard'),
  };
};
