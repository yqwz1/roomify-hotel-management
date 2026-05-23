import {
  BriefcaseBusiness,
  Bell,
  CalendarDays,
  ClipboardCheck,
  DoorClosedLocked,
  FileText,
  Grid3x3,
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

export const ROLE_ADMIN = 'ROLE_ADMIN';
export const ROLE_MANAGER = 'ROLE_MANAGER';
export const ROLE_STAFF = 'ROLE_STAFF';
export const ROLE_GUEST = 'ROLE_GUEST';
export const GUEST_BILLING_STATUS_PATH = '/guest/billing-status';

const ROLE_PRIORITY = [ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF, ROLE_GUEST];

export const translateWithFallback = (t, translationKey, fallbackLabel, options) => {
  if (!translationKey) return fallbackLabel;

  const translated = t(translationKey, options);
  return translated === translationKey ? fallbackLabel : translated;
};

export const getPrimaryRole = (roles = []) => ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;

export const getDefaultRouteForRoles = (roles = []) => {
  const primaryRole = getPrimaryRole(roles);

  switch (primaryRole) {
    case ROLE_ADMIN:
      return '/admin/dashboard';
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

const PROTECTED_ROUTE_ROLE_MAP = {
  '/room-types': [ROLE_ADMIN],
  '/staff': [ROLE_ADMIN],
  '/rooms': [ROLE_MANAGER],
  '/manager/dashboard': [ROLE_MANAGER],
  '/manager/ai-finance': [ROLE_MANAGER],
  '/admin/dashboard': [ROLE_ADMIN],
  '/admin/notifications': [ROLE_ADMIN],
  '/staff/dashboard': [ROLE_STAFF],
  '/staff/service-requests': [ROLE_MANAGER, ROLE_STAFF],
  '/guest/dashboard': [ROLE_GUEST],
  '/guest/service-requests': [ROLE_GUEST],
  '/rooms-management': [ROLE_MANAGER],
  '/search': [ROLE_MANAGER, ROLE_STAFF, ROLE_GUEST],
  '/book': [ROLE_MANAGER, ROLE_STAFF, ROLE_GUEST],
  '/confirmation': [ROLE_MANAGER, ROLE_STAFF, ROLE_GUEST],
  '/check-in': [ROLE_MANAGER, ROLE_STAFF],
  '/reservations/modify': [ROLE_MANAGER, ROLE_STAFF],
  '/reservations/cancel': [ROLE_MANAGER, ROLE_STAFF],
  '/checkout': [ROLE_MANAGER, ROLE_STAFF],
  '/room-status': [ROLE_MANAGER],
  '/invoice-preview': [ROLE_MANAGER, ROLE_STAFF],
  '/reservations': [ROLE_MANAGER, ROLE_STAFF],
  '/room-grid': [ROLE_MANAGER, ROLE_STAFF],
  [GUEST_BILLING_STATUS_PATH]: [ROLE_GUEST],
  '/services': [ROLE_ADMIN],
  '/manager/expenses': [ROLE_MANAGER],
};

const PROTECTED_ROUTE_ROLE_PATTERNS = [
  { matcher: (pathname) => /^\/reservations\/[^/]+$/.test(pathname), roles: [ROLE_MANAGER, ROLE_STAFF] },
];

const normalizePathname = (pathname = '') => {
  if (typeof pathname !== 'string' || pathname.length === 0) {
    return '';
  }

  return pathname.split('#')[0].split('?')[0] || '/';
};

const getAllowedRolesForPath = (pathname) => {
  if (Object.prototype.hasOwnProperty.call(PROTECTED_ROUTE_ROLE_MAP, pathname)) {
    return PROTECTED_ROUTE_ROLE_MAP[pathname];
  }

  const matchedPattern = PROTECTED_ROUTE_ROLE_PATTERNS.find((rule) => rule.matcher(pathname));
  return matchedPattern?.roles ?? null;
};

export const canAccessPathForRoles = (pathname, roles = []) => {
  const normalizedPath = normalizePathname(pathname);
  if (!normalizedPath) {
    return false;
  }

  const allowedRoles = getAllowedRolesForPath(normalizedPath);
  if (!allowedRoles) {
    return true;
  }

  const roleList = Array.isArray(roles) ? roles : [roles];
  return roleList.some((role) => allowedRoles.includes(role));
};

export const getRoleDisplayLabel = (roles = [], t) => {
  const primaryRole = getPrimaryRole(roles);

  switch (primaryRole) {
    case ROLE_ADMIN:
      return translateWithFallback(t, 'roleAdmin', 'Admin');
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

const ADMIN_NAVIGATION_CONFIG = [
  {
    id: 'overview',
    translationKey: 'navOverview',
    fallbackLabel: 'Overview',
    roles: [ROLE_ADMIN],
    items: [
      {
        path: '/',
        translationKey: 'homeNav',
        fallbackLabel: 'Home',
        icon: House,
        roles: [ROLE_ADMIN],
      },
      {
        path: '/admin/dashboard',
        translationKey: 'adminDashboardTitle',
        fallbackLabel: 'Admin Dashboard',
        icon: LayoutDashboard,
        roles: [ROLE_ADMIN],
      },
      {
        path: '/admin/notifications',
        translationKey: 'adminNotifications.title',
        fallbackLabel: 'Notifications',
        icon: Bell,
        roles: [ROLE_ADMIN],
      },
    ],
  },
  {
    id: 'staff-access',
    translationKey: 'navStaffAccess',
    fallbackLabel: 'Staff & Managers',
    roles: [ROLE_ADMIN],
    items: [
      {
        path: '/staff',
        translationKey: 'staffMenu',
        fallbackLabel: 'Staff & Managers',
        icon: Users,
        roles: [ROLE_ADMIN],
      },
      {
        path: '/room-types',
        translationKey: 'roomTypes',
        fallbackLabel: 'Room Types',
        icon: Tag,
        roles: [ROLE_ADMIN],
      },
      {
        path: '/services',
        translationKey: 'servicesTitle',
        fallbackLabel: 'Services',
        icon: BriefcaseBusiness,
        roles: [ROLE_ADMIN],
      },
    ],
  },
];

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
        path: '/reservations',
        translationKey: 'navReservations',
        fallbackLabel: 'Reservations',
        icon: CalendarDays,
        roles: [ROLE_MANAGER],
      },
      {
        path: '/room-grid',
        translationKey: 'roomGrid.sidebar',
        fallbackLabel: 'Room grid',
        icon: Grid3x3,
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
      {
        path: '/manager/expenses',
        translationKey: 'expenseTrackerTitle',
        fallbackLabel: 'Expenses',
        icon: Receipt,
        roles: [ROLE_MANAGER],
      },
      {
        path: '/manager/ai-finance',
        translationKey: 'aiFinanceTitle',
        fallbackLabel: 'AI Finance',
        icon: Sparkles,
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
      {
        path: '/room-grid',
        translationKey: 'roomGrid.sidebar',
        fallbackLabel: 'Room grid',
        icon: Grid3x3,
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
      {
        path: '/staff/service-requests',
        translationKey: 'navServiceRequests',
        fallbackLabel: 'Service Requests',
        icon: BriefcaseBusiness,
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
        path: '/guest/service-requests',
        translationKey: 'navRequestService',
        fallbackLabel: 'Request Service',
        icon: BriefcaseBusiness,
        roles: [ROLE_GUEST],
      },
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
  [ROLE_ADMIN]: ADMIN_NAVIGATION_CONFIG,
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

// Role-independent overrides for the browser tab title. Keep titles stable
// even when user roles haven't loaded yet, and when an in-app nav label
// (e.g. "Front Desk") wouldn't make sense as a standalone browser title.
const DOCUMENT_TITLE_OVERRIDES = {
  '/': ['homeNav', 'Home'],
  '/login': ['signIn', 'Sign In'],
  '/signup': ['createAccount', 'Create Account'],
  '/unauthorized': ['unauthorizedPage.title', 'Access Denied'],
  '/bookings': ['bookings', 'Bookings'],
  '/admin/dashboard': ['adminDashboardTitle', 'Admin Dashboard'],
  '/admin/notifications': ['adminNotifications.title', 'Notifications'],
  '/manager/dashboard': ['managerDashboardTitle', 'Manager Dashboard'],
  '/staff/dashboard': ['staffDashboardTitle', 'Staff Dashboard'],
  '/staff/service-requests': ['navServiceRequests', 'Service Requests'],
  '/guest/dashboard': ['guestDashboardTitle', 'Guest Dashboard'],
  '/guest/service-requests': ['navRequestService', 'Request Service'],
  '/manager/ai-finance': ['aiFinanceTitle', 'AI Finance'],
  '/manager/expenses': ['expenseTrackerTitle', 'Expense Tracker'],
  '/room-types': ['roomTypes', 'Room Types'],
  '/staff': ['staffMenu', 'Staff & Managers'],
  '/services': ['servicesTitle', 'Services'],
  '/rooms': ['rooms', 'Rooms'],
  '/rooms-management': ['roomsManagement', 'Rooms Management'],
  '/search': ['roomSearch', 'Room Search'],
  '/book': ['bookRoom', 'Book Room'],
  '/confirmation': ['bookingConfirmed', 'Booking Confirmation'],
  '/check-in': ['checkInTitle', 'Check-In'],
  '/checkout': ['checkoutTitle', 'Checkout'],
  '/reservations': ['navReservations', 'Reservations'],
  '/room-grid': ['roomGrid.title', 'Room Grid'],
  '/reservations/modify': ['modifyReservationTitle', 'Modify Reservation'],
  '/reservations/cancel': ['cancelReservationTitle', 'Cancel Reservation'],
  '/invoice-preview': ['invoicePreview', 'Invoice Preview'],
  '/room-status': ['roomStatus', 'Room Status'],
  [GUEST_BILLING_STATUS_PATH]: ['navBillingStatus', 'Billing Status'],
};

const buildSectionLabel = (section, t) => translateWithFallback(t, section.translationKey, section.fallbackLabel);

const buildItemLabel = (item, t) => translateWithFallback(t, item.translationKey, item.fallbackLabel);

// Show only the highest-priority role's navigation. A user with both
// ROLE_ADMIN and ROLE_MANAGER sees the admin nav only (not both flat-mapped
// together, which previously caused duplicate "Overview" sections and
// bled manager surfaces into the admin experience).
const getNavigationConfigForRoles = (roles = []) => {
  const primaryRole = getPrimaryRole(roles);
  return primaryRole ? (NAVIGATION_CONFIG_BY_ROLE[primaryRole] ?? []) : [];
};

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

const resolveMatchedPageMeta = (pathname, roles = [], t) => {
  const matchedPageMeta = PAGE_META.find((page) => page.match(pathname));
  if (matchedPageMeta) {
    const section = findSectionById(matchedPageMeta.sectionId, roles, t);
    return {
      title: translateWithFallback(t, matchedPageMeta.translationKey, matchedPageMeta.fallbackLabel),
      sectionLabel: section?.label ?? translateWithFallback(t, 'dashboard', 'Dashboard'),
    };
  }

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

  return null;
};

export const getPageMeta = (pathname, roles = [], t) => {
  const matchedMeta = resolveMatchedPageMeta(pathname, roles, t);
  if (matchedMeta) {
    return matchedMeta;
  }

  return {
    title: translateWithFallback(t, 'dashboard', 'Dashboard'),
    sectionLabel: translateWithFallback(t, 'dashboard', 'Dashboard'),
  };
};

export const getDocumentTitle = (pathname, roles = [], t) => {
  const override = DOCUMENT_TITLE_OVERRIDES[pathname];
  const pageTitle = override
    ? translateWithFallback(t, override[0], override[1])
    : (resolveMatchedPageMeta(pathname, roles, t)?.title
      ?? translateWithFallback(t, 'notFoundPage.title', 'Page not found'));

  const brandName = translateWithFallback(t, 'brandName', 'Roomify');
  return `${brandName} - ${pageTitle}`;
};
