/**
 * mockReservations.js
 * Mock reservation data for UI scaffolding.
 * Statuses: PENDING | CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED
 */

export const MOCK_RESERVATIONS = [
    {
        id: 1,
        confirmationNumber: 'RSV-A1B2C3D4E5F6',
        status: 'CONFIRMED',
        roomId: 101,
        roomNumber: '101',
        roomTypeName: 'Deluxe',
        floor: 1,
        guestId: 1,
        guestName: 'Ahmed Al-Rashidi',
        guestEmail: 'ahmed@example.com',
        guestPhone: '+966 50 000 0001',
        guestIdNumber: 'SA123456',
        guestNationality: 'Saudi Arabian',
        checkInDate: '2026-03-06',
        checkOutDate: '2026-03-09',
        nights: 3,
        roomRate: 120.00,
        subtotal: 360.00,
        taxes: 36.00,
        totalPrice: 396.00,
    },
    {
        id: 2,
        confirmationNumber: 'RSV-G7H8I9J0K1L2',
        status: 'PENDING',
        roomId: 205,
        roomNumber: '205',
        roomTypeName: 'Suite',
        floor: 2,
        guestId: 2,
        guestName: 'Sara Al-Otaibi',
        guestEmail: 'sara@example.com',
        guestPhone: '+966 50 000 0002',
        guestIdNumber: 'SA654321',
        guestNationality: 'Saudi Arabian',
        checkInDate: '2026-03-10',
        checkOutDate: '2026-03-15',
        nights: 5,
        roomRate: 250.00,
        subtotal: 1250.00,
        taxes: 125.00,
        totalPrice: 1375.00,
    },
    {
        id: 3,
        confirmationNumber: 'RSV-M3N4O5P6Q7R8',
        status: 'CHECKED_IN',
        roomId: 302,
        roomNumber: '302',
        roomTypeName: 'Family',
        floor: 3,
        guestId: 3,
        guestName: 'Mohammed Al-Qahtani',
        guestEmail: 'mohammed@example.com',
        guestPhone: '+966 50 000 0003',
        guestIdNumber: 'SA789012',
        guestNationality: 'Saudi Arabian',
        checkInDate: '2026-03-04',
        checkOutDate: '2026-03-07',
        nights: 3,
        roomRate: 180.00,
        subtotal: 540.00,
        taxes: 54.00,
        totalPrice: 594.00,
    },
    {
        id: 4,
        confirmationNumber: 'RSV-S9T0U1V2W3X4',
        status: 'CANCELLED',
        roomId: 110,
        roomNumber: '110',
        roomTypeName: 'Standard',
        floor: 1,
        guestId: 4,
        guestName: 'Fatima Al-Zahrani',
        guestEmail: 'fatima@example.com',
        guestPhone: '+966 50 000 0004',
        guestIdNumber: 'SA345678',
        guestNationality: 'Saudi Arabian',
        checkInDate: '2026-03-01',
        checkOutDate: '2026-03-03',
        nights: 2,
        roomRate: 90.00,
        subtotal: 180.00,
        taxes: 18.00,
        totalPrice: 198.00,
    },
    {
        id: 5,
        confirmationNumber: 'RSV-Y5Z6A7B8C9D0',
        status: 'CHECKED_OUT',
        roomId: 401,
        roomNumber: '401',
        roomTypeName: 'Deluxe',
        floor: 4,
        guestId: 5,
        guestName: 'Khalid Al-Harbi',
        guestEmail: 'khalid@example.com',
        guestPhone: '+966 50 000 0005',
        guestIdNumber: 'SA901234',
        guestNationality: 'Saudi Arabian',
        checkInDate: '2026-02-28',
        checkOutDate: '2026-03-02',
        nights: 2,
        roomRate: 120.00,
        subtotal: 240.00,
        taxes: 24.00,
        totalPrice: 264.00,
    },
];

/** Statuses that allow modification */
export const MODIFIABLE_STATUSES = ['PENDING', 'CONFIRMED'];
/** Statuses that allow cancellation */
export const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];
/** Statuses that allow check-in */
export const CHECKINABLE_STATUSES = ['CONFIRMED'];

/**
 * Find a reservation by confirmation number or guest name (case-insensitive).
 * Simulates search delay — returns a Promise for easy API swap later.
 */
export const mockLookup = (query) =>
    new Promise((resolve) => {
        setTimeout(() => {
            const q = query.trim().toLowerCase();
            if (!q) return resolve([]);
            const results = MOCK_RESERVATIONS.filter(
                (r) =>
                    r.confirmationNumber.toLowerCase().includes(q) ||
                    r.guestName.toLowerCase().includes(q)
            );
            resolve(results);
        }, 600);
    });
