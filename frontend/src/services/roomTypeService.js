/**
 * Room Type Service
 * API client stubs for Room Types CRUD operations.
 * Currently uses mock data — swap to real API calls when backend is ready.
 */
import api from './api';

// ── Mock Data ──────────────────────────────────────────────────────
// Mirrors the RoomType DB schema: name (unique), basePrice, maxGuests,
// amenities (string[]), description, isActive (soft-delete flag)

let mockRoomTypes = [
    {
        id: 1,
        name: 'Standard Room',
        basePrice: 99.99,
        maxGuests: 2,
        amenities: ['WiFi', 'TV', 'Air Conditioning'],
        description: 'A comfortable standard room with essential amenities for a pleasant stay.',
        isActive: true,
        createdAt: '2026-02-01T10:00:00Z',
        updatedAt: '2026-02-01T10:00:00Z',
    },
    {
        id: 2,
        name: 'Deluxe Room',
        basePrice: 179.99,
        maxGuests: 2,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Room Service'],
        description: 'An upgraded room featuring premium furnishings and a curated mini bar.',
        isActive: true,
        createdAt: '2026-02-01T10:00:00Z',
        updatedAt: '2026-02-01T10:00:00Z',
    },
    {
        id: 3,
        name: 'Suite',
        basePrice: 349.99,
        maxGuests: 4,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Room Service', 'Jacuzzi', 'Balcony'],
        description: 'A spacious suite with separate living area, jacuzzi, and private balcony.',
        isActive: true,
        createdAt: '2026-02-01T10:00:00Z',
        updatedAt: '2026-02-01T10:00:00Z',
    },
    {
        id: 4,
        name: 'Family Room',
        basePrice: 229.99,
        maxGuests: 6,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Extra Beds', 'Kids Area'],
        description: 'A large room designed for families with extra beds and a dedicated kids area.',
        isActive: false,
        createdAt: '2026-02-01T10:00:00Z',
        updatedAt: '2026-02-05T14:30:00Z',
    },
];

let nextId = 5;

// Toggle this to `true` when the backend endpoints are live
const USE_REAL_API = false;

// ── Simulated network delay ────────────────────────────────────────
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

// ── API Stubs ──────────────────────────────────────────────────────

/**
 * Fetch all room types with optional pagination params.
 * @param {Object} params - { page, limit, search }
 * @returns {Promise<{ data: RoomType[], pagination: { page, limit, total, totalPages } }>}
 */
export const getRoomTypes = async (params = {}) => {
    if (USE_REAL_API) {
        const response = await api.get('/room-types', { params });
        return response.data;
    }

    await delay();

    const { page = 1, limit = 10, search = '' } = params;

    let filtered = [...mockRoomTypes];

    // Apply search filter
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
            (rt) =>
                rt.name.toLowerCase().includes(q) ||
                rt.description.toLowerCase().includes(q)
        );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return {
        data,
        pagination: { page, limit, total, totalPages },
    };
};

/**
 * Fetch a single room type by ID.
 * @param {number} id
 * @returns {Promise<RoomType>}
 */
export const getRoomTypeById = async (id) => {
    if (USE_REAL_API) {
        const response = await api.get(`/room-types/${id}`);
        return response.data;
    }

    await delay();
    const roomType = mockRoomTypes.find((rt) => rt.id === id);
    if (!roomType) throw new Error('Room type not found');
    return { ...roomType };
};

/**
 * Create a new room type.
 * @param {Object} data - { name, basePrice, maxGuests, amenities, description }
 * @returns {Promise<RoomType>}
 */
export const createRoomType = async (data) => {
    if (USE_REAL_API) {
        const response = await api.post('/room-types', data);
        return response.data;
    }

    await delay();

    // Check uniqueness constraint on name
    const exists = mockRoomTypes.some(
        (rt) => rt.name.toLowerCase() === data.name.toLowerCase()
    );
    if (exists) {
        throw new Error(`Room type "${data.name}" already exists`);
    }

    const now = new Date().toISOString();
    const newRoomType = {
        id: nextId++,
        ...data,
        isActive: true,
        createdAt: now,
        updatedAt: now,
    };
    mockRoomTypes.push(newRoomType);
    return { ...newRoomType };
};

/**
 * Update an existing room type.
 * @param {number} id
 * @param {Object} data - partial fields to update
 * @returns {Promise<RoomType>}
 */
export const updateRoomType = async (id, data) => {
    if (USE_REAL_API) {
        const response = await api.put(`/room-types/${id}`, data);
        return response.data;
    }

    await delay();

    const index = mockRoomTypes.findIndex((rt) => rt.id === id);
    if (index === -1) throw new Error('Room type not found');

    // Check uniqueness if name changed
    if (data.name && data.name.toLowerCase() !== mockRoomTypes[index].name.toLowerCase()) {
        const exists = mockRoomTypes.some(
            (rt) => rt.name.toLowerCase() === data.name.toLowerCase()
        );
        if (exists) {
            throw new Error(`Room type "${data.name}" already exists`);
        }
    }

    mockRoomTypes[index] = {
        ...mockRoomTypes[index],
        ...data,
        updatedAt: new Date().toISOString(),
    };
    return { ...mockRoomTypes[index] };
};

/**
 * Toggle the active status of a room type (soft delete / reactivate).
 * @param {number} id
 * @returns {Promise<RoomType>}
 */
export const toggleRoomTypeStatus = async (id) => {
    if (USE_REAL_API) {
        const response = await api.patch(`/room-types/${id}/toggle-status`);
        return response.data;
    }

    await delay();

    const index = mockRoomTypes.findIndex((rt) => rt.id === id);
    if (index === -1) throw new Error('Room type not found');

    mockRoomTypes[index] = {
        ...mockRoomTypes[index],
        isActive: !mockRoomTypes[index].isActive,
        updatedAt: new Date().toISOString(),
    };
    return { ...mockRoomTypes[index] };
};

/**
 * Delete a room type permanently (admin only, not exposed in UI by default).
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteRoomType = async (id) => {
    if (USE_REAL_API) {
        await api.delete(`/room-types/${id}`);
        return;
    }

    await delay();

    const index = mockRoomTypes.findIndex((rt) => rt.id === id);
    if (index === -1) throw new Error('Room type not found');
    mockRoomTypes.splice(index, 1);
};
