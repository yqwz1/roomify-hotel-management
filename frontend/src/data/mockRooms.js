/**
 * mockRooms.js
 * Static mock data for development/UI scaffolding (Day 1).
 * Replace with real API calls on Day 2.
 */

export const MOCK_ROOMS = [
    {
        id: 1,
        roomNumber: '101',
        floor: 1,
        type: 'Standard',
        status: 'Available',
        price: 89,
        maxGuests: 2,
        amenities: ['WiFi', 'TV', 'AC'],
        description: 'Comfortable standard room with city view.',
    },
    {
        id: 2,
        roomNumber: '102',
        floor: 1,
        type: 'Standard',
        status: 'Occupied',
        price: 89,
        maxGuests: 2,
        amenities: ['WiFi', 'TV', 'AC'],
        description: 'Comfortable standard room with garden view.',
    },
    {
        id: 3,
        roomNumber: '201',
        floor: 2,
        type: 'Deluxe',
        status: 'Available',
        price: 149,
        maxGuests: 3,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony'],
        description: 'Spacious deluxe room with panoramic city view.',
    },
    {
        id: 4,
        roomNumber: '202',
        floor: 2,
        type: 'Deluxe',
        status: 'Reserved',
        price: 149,
        maxGuests: 3,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony'],
        description: 'Spacious deluxe room with sea view.',
    },
    {
        id: 5,
        roomNumber: '301',
        floor: 3,
        type: 'Suite',
        status: 'Available',
        price: 299,
        maxGuests: 4,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi', 'Living Room', 'Kitchenette'],
        description: 'Luxurious suite with separate living area and premium amenities.',
    },
    {
        id: 6,
        roomNumber: '302',
        floor: 3,
        type: 'Suite',
        status: 'Maintenance',
        price: 299,
        maxGuests: 4,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi', 'Living Room', 'Kitchenette'],
        description: 'Premium suite currently under maintenance.',
    },
    {
        id: 7,
        roomNumber: '401',
        floor: 4,
        type: 'Family',
        status: 'Available',
        price: 199,
        maxGuests: 6,
        amenities: ['WiFi', 'TV', 'AC', 'Bunk Beds', 'Extra Bathroom'],
        description: 'Large family room with two bedrooms and bunk beds.',
    },
    {
        id: 8,
        roomNumber: '402',
        floor: 4,
        type: 'Family',
        status: 'Occupied',
        price: 199,
        maxGuests: 6,
        amenities: ['WiFi', 'TV', 'AC', 'Bunk Beds', 'Extra Bathroom'],
        description: 'Spacious family room with connecting rooms.',
    },
    {
        id: 9,
        roomNumber: '501',
        floor: 5,
        type: 'Deluxe',
        status: 'Available',
        price: 169,
        maxGuests: 2,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Rooftop View'],
        description: 'Premium deluxe room on the top floor with rooftop view.',
    },
    {
        id: 10,
        roomNumber: '502',
        floor: 5,
        type: 'Suite',
        status: 'Available',
        price: 349,
        maxGuests: 4,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi', 'Private Terrace'],
        description: 'Executive suite with private terrace and city skyline views.',
    },
    {
        id: 11,
        roomNumber: '103',
        floor: 1,
        type: 'Standard',
        status: 'Available',
        price: 89,
        maxGuests: 2,
        amenities: ['WiFi', 'TV', 'AC'],
        description: 'Economy standard room, cozy and functional.',
    },
    {
        id: 12,
        roomNumber: '203',
        floor: 2,
        type: 'Family',
        status: 'Reserved',
        price: 199,
        maxGuests: 5,
        amenities: ['WiFi', 'TV', 'AC', 'Sofa Bed'],
        description: 'Mid-floor family room with sofa bed.',
    },
];

/** Unique room types for filter dropdowns */
export const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Family'];

/** All possible statuses for filter dropdowns */
export const ROOM_STATUSES = ['Available', 'Occupied', 'Maintenance', 'Reserved'];

/** Available floors */
export const FLOORS = [1, 2, 3, 4, 5];
