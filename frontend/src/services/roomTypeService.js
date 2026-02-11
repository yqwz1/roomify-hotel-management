/**
 * Room Type Service
 * API client for Room Types CRUD operations.
 * Aligned with backend entity: com.roomify.backend.entity.RoomType
 *
 * Backend fields:
 *   id          Long (auto-generated)
 *   name        String (unique, max 100)
 *   basePrice   BigDecimal (>= 0)
 *   maxGuests   Integer (1–8)
 *   amenities   String (comma-separated TEXT)
 *   description String (TEXT)
 *
 * NOTE: amenities is stored as a comma-separated string on the backend.
 *       The UI works with arrays internally — this service handles conversion.
 */
import api from './api';

// ── Mock Data (mirrors backend schema) ────────────────────────────
let mockRoomTypes = [
    {
        id: 1,
        name: 'Standard Room',
        basePrice: 99.99,
        maxGuests: 2,
        amenities: 'WiFi,TV,Air Conditioning',
        description: 'A comfortable standard room with essential amenities for a pleasant stay.',
    },
    {
        id: 2,
        name: 'Deluxe Room',
        basePrice: 179.99,
        maxGuests: 2,
        amenities: 'WiFi,TV,Air Conditioning,Mini Bar,Room Service',
        description: 'An upgraded room featuring premium furnishings and a curated mini bar.',
    },
    {
        id: 3,
        name: 'Suite',
        basePrice: 349.99,
        maxGuests: 4,
        amenities: 'WiFi,TV,Air Conditioning,Mini Bar,Room Service,Jacuzzi,Balcony',
        description: 'A spacious suite with separate living area, jacuzzi, and private balcony.',
    },
    {
        id: 4,
        name: 'Family Room',
        basePrice: 229.99,
        maxGuests: 6,
        amenities: 'WiFi,TV,Air Conditioning,Extra Beds,Kids Area',
        description: 'A large room designed for families with extra beds and a dedicated kids area.',
    },
];

let nextId = 5;

// Toggle this to `true` when backend endpoints are live
const USE_REAL_API = false;

// ── Helpers ────────────────────────────────────────────────────────
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Convert backend amenities string to an array for the UI.
 */
export const amenitiesStringToArray = (str) => {
    if (!str || typeof str !== 'string') return [];
    return str.split(',').map((s) => s.trim()).filter(Boolean);
};

/**
 * Convert UI amenities array to a comma-separated string for the backend.
 */
export const amenitiesArrayToString = (arr) => {
    if (!arr || !Array.isArray(arr)) return '';
    return arr.map((s) => s.trim()).filter(Boolean).join(',');
};

// ── API Functions ──────────────────────────────────────────────────

/**
 * Fetch all room types with optional pagination params.
 * @param {Object} params - { page, limit, search }
 * @returns {Promise<{ data: RoomType[], pagination }>}
 */
export const getRoomTypes = async (params = {}) => {
    if (USE_REAL_API) {
        const response = await api.get('/room-types', { params });
        return response.data;
    }

    await delay();

    const { page = 1, limit = 10, search = '' } = params;

    let filtered = [...mockRoomTypes];

    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
            (rt) =>
                rt.name.toLowerCase().includes(q) ||
                (rt.description || '').toLowerCase().includes(q)
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
 * @param {Object} data - { name, basePrice, maxGuests, amenities (string), description }
 */
export const createRoomType = async (data) => {
    if (USE_REAL_API) {
        const response = await api.post('/room-types', data);
        return response.data;
    }

    await delay();

    const exists = mockRoomTypes.some(
        (rt) => rt.name.toLowerCase() === data.name.toLowerCase()
    );
    if (exists) {
        throw new Error(`Room type "${data.name}" already exists`);
    }

    const newRoomType = {
        id: nextId++,
        name: data.name,
        basePrice: data.basePrice,
        maxGuests: data.maxGuests,
        amenities: data.amenities, // already a comma-separated string
        description: data.description || '',
    };
    mockRoomTypes.push(newRoomType);
    return { ...newRoomType };
};

/**
 * Update an existing room type.
 */
export const updateRoomType = async (id, data) => {
    if (USE_REAL_API) {
        const response = await api.put(`/room-types/${id}`, data);
        return response.data;
    }

    await delay();

    const index = mockRoomTypes.findIndex((rt) => rt.id === id);
    if (index === -1) throw new Error('Room type not found');

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
    };
    return { ...mockRoomTypes[index] };
};

/**
 * Delete a room type permanently (hard delete — no isActive field).
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
