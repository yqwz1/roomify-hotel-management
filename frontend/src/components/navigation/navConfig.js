import {
  BedDouble,
  CalendarDays,
  ClipboardCheck,
  DoorClosedLocked,
  FileText,
  House,
  LayoutDashboard,
  LifeBuoy,
  Receipt,
  Search,
  Settings2,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';

export const ROLE_MANAGER = 'ROLE_MANAGER';
export const ROLE_STAFF = 'ROLE_STAFF';
export const ROLE_GUEST = 'ROLE_GUEST';
export const GUEST_BILLING_STATUS_PATH = '/guest/billing-status';

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

const MANAGER_NAVIGATION_CONFIG = [
  {
    id: 'overview',
    translationKey: 'navOverview',
    fallbackLabel: 'Overview',
    roles: [ROLE_MANAGER],
    items: [
      {
        path: '/',
        translationKey: 'homeNav',
        fallbackLabel: 'Home',
        icon: House,
        roles: [ROLE_MANAGER],
      },
      {
        path: '/manager/dashboard',
        translationKey: 'managerDashboardTitle',
        fallbackLabel: 'Manager Dashboard',
        icon: LayoutDashboard,
        roles: [ROLE_MANAGER],
      },
    ],
  },
  {
    id: 'front-desk',
    translationKey: 'navFrontDesk',
    fallbackLabel: 'Front Desk',
    roles: [ROLE_MANAGER],
    items: [
      {
        path: '/search',
        translationKey: 'roomSearch',
        fallbackLabel: 'Room Search',
        icon: Search,
        roles: [ROLE_MANAGER],
      },
      {
        path: '/book',
        translationKey: 'bookRoom',
        fallbackLabel: 'Book Room',
        icon: BedDouble,
        roles: [ROLE_MANAGER],
      },
      {
        path: '/check-in',
        translationKey: 'checkInTitle',
        fallbackLabel: 'Check-In',
        icon: ClipboardCheck,
        roles: [ROLE_MANAGER],
      },
      {
        path: '/checkout',
        translationKey: 'checkoutTitle',
        fallbackLabel: 'Checkout',
        icon: DoorClosedLocked,
        roles: [ROLE_MANAGER],
      },
    ],
  },
  {
    id: 'reservations',
    translationKey: 'navReservations',
    fallbackLabel: 'Reservations',
    roles: [ROLE_MANAGER],
    items: [
      {
        path: '/reservations/modify',
        translationKey: 'modifyReservationTitle',
        fallbackLabel: 'Modify Reservation',
        icon: FileText,
        roles: [ROLE_MANAGER],
      },
      {
        path: '/reservations/cancel',
        translationKey: 'cancelReservationTitle',
        fallbackLabel: 'Cancel Reservation',
        icon: FileText,
        roles: [ROLE_MANAGER],
      },
    ],
  },
  {
    id: 'rooms',
    translationKey: 'rooms',
    fallbackLabel: 'Rooms',
    roles: [ROLE_MANAGER],
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
        roles: [ROLE_MANAGER],
      },
    ],
  },
  {
    id: 'finance',
    translationKey: 'navFinance',
    fallbackLabel: 'Finance',
    roles: [ROLE_MANAGER],
    items: [
      {
        path: '/invoice-preview',
        translationKey: 'invoicePreview',
        fallbackLabel: 'Invoices',
        icon: Receipt,
        roles: [ROLE_MANAGER],
      },
    ],
  },
  {
    id: 'staff-access',
    translationKey: 'navStaffAccess',
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
    translationKey: 'navSupport',
    fallbackLabel: 'Support',
    roles: [ROLE_MANAGER],
    items: [
      {
        path: '/bookings',
        translationKey: 'bookings',
        fallbackLabel: 'Booking Help',
        icon: CalendarDays,
        roles: [ROLE_MANAGER],
      },
    ],
  },
];

const STAFF_NAVIGATION_CONFIG = [
  {
    id: 'front-desk',
    translationKey: 'navFrontDesk',
    fallbackLabel: 'Front Desk',
    roles: [ROLE_STAFF],
    items: [
      {
        path: '/staff/dashboard',
        translationKey: 'navFrontDesk',
        fallbackLabel: 'Front Desk',
        icon: LayoutDashboard,
        roles: [ROLE_STAFF],
      },
    ],
  },
  {
    id: 'reservations',
    translationKey: 'navReservations',
    fallbackLabel: 'Reservations',
    roles: [ROLE_STAFF],
    items: [
      {
        path: '/reservations',
        translationKey: 'navReservations',
        fallbackLabel: 'Reservations',
        icon: CalendarDays,
        roles: [ROLE_STAFF],
      },
    ],
  },
  {
    id: 'arrivals',
    translationKey: 'navArrivals',
    fallbackLabel: 'Arrivals',
    roles: [ROLE_STAFF],
    items: [
      {
        path: '/check-in',
        translationKey: 'navArrivals',
        fallbackLabel: 'Arrivals',
        icon: ClipboardCheck,
        roles: [ROLE_STAFF],
      },
    ],
  },
  {
    id: 'departures',
    translationKey: 'navDepartures',
    fallbackLabel: 'Departures',
    roles: [ROLE_STAFF],
    items: [
      {
        path: '/checkout',
        translationKey: 'navDepartures',
        fallbackLabel: 'Departures',
        icon: DoorClosedLocked,
        roles: [ROLE_STAFF],
      },
    ],
  },
  {
    id: 'billing',
    translationKey: 'navBilling',
    fallbackLabel: 'Billing',
    roles: [ROLE_STAFF],
    items: [
      {
        path: '/invoice-preview',
        translationKey: 'navBilling',
        fallbackLabel: 'Billing',
        icon: Receipt,
        roles: [ROLE_STAFF],
      },
    ],
  },
];

const GUEST_NAVIGATION_CONFIG = [
  {
    id: 'my-stay',
    translationKey: 'navMyStay',
    fallbackLabel: 'My Stay',
    roles: [ROLE_GUEST],
    items: [
      {
        path: '/guest/dashboard',
        translationKey: 'navMyStay',
        fallbackLabel: 'My Stay',
        icon: LayoutDashboard,
        roles: [ROLE_GUEST],
      },
    ],
  },
  {
    id: 'browse-rooms',
    translationKey: 'navBrowseRooms',
    fallbackLabel: 'Browse Rooms',
    roles: [ROLE_GUEST],
    items: [
      {
        path: '/search',
        translationKey: 'navBrowseRooms',
        fallbackLabel: 'Browse Rooms',
        icon: Search,
        roles: [ROLE_GUEST],
      },
    ],
  },
  {
    id: 'get-help',
    translationKey: 'navGetHelp',
    fallbackLabel: 'Get Help',
    roles: [ROLE_GUEST],
    items: [
      {
        path: '/bookings',
        translationKey: 'navGetHelp',
        fallbackLabel: 'Get Help',
        icon: LifeBuoy,
        roles: [ROLE_GUEST],
      },
    ],
  },
  {
    id: 'billing-status',
    translationKey: 'navBillingStatus',
    fallbackLabel: 'Billing Status',
    roles: [ROLE_GUEST],
    items: [
      {
        path: GUEST_BILLING_STATUS_PATH,
        translationKey: 'navBillingStatus',
        fallbackLabel: 'Billing Status',
        icon: Receipt,
        roles: [ROLE_GUEST],
      },
    ],
  },
];

const NAVIGATION_CONFIG_BY_ROLE = {
  [ROLE_MANAGER]: MANAGER_NAVIGATION_CONFIG,
  [ROLE_STAFF]: STAFF_NAVIGATION_CONFIG,
  [ROLE_GUEST]: GUEST_NAVIGATION_CONFIG,
};

const PAGE_META = [
  {
    match: (pathname) => pathname === '/reservations',
    sectionId: 'reservations',
    translationKey: 'navReservations',
    fallbackLabel: 'Reservations',
  },
  {
    match: (pathname) => pathname === '/staff/dashboard',
    sectionId: 'front-desk',
    translationKey: 'navFrontDesk',
    fallbackLabel: 'Front Desk',
  },
  {
    match: (pathname) => /^\/reservations\/[^/]+$/.test(pathname),
    sectionId: 'reservations',
    translationKey: 'reservationDetailsTitle',
    fallbackLabel: 'Reservation Details',
  },
];

const buildSectionLabel = (section, t) => translateWithFallback(t, section.translationKey, section.fallbackLabel);

const buildItemLabel = (item, t) => translateWithFallback(t, item.translationKey, item.fallbackLabel);

const getNavigationConfigForRoles = (roles = []) =>
  NAVIGATION_CONFIG_BY_ROLE[getPrimaryRole(roles)] ?? [];

export const getNavigationSections = (roles = [], t) =>
  getNavigationConfigForRoles(roles)
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
