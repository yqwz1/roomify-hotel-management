/**
 * Room Service
 * Handles API calls related to rooms
 */

export const getRooms = async () => {
    // Mock Data Implementation
    return Promise.resolve([
        { id: 101, roomNumber: '101', type: 'Single', price: 100, status: 'Available' },
        { id: 102, roomNumber: '102', type: 'Double', price: 150, status: 'Occupied' },
        { id: 201, roomNumber: '201', type: 'Suite', price: 300, status: 'Available' },
        { id: 301, roomNumber: '301', type: 'Deluxe', price: 200, status: 'Cleaning' }
    ]);
};
