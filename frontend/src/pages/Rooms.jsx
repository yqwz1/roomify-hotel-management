import { useEffect, useState } from 'react';
import { getRooms } from '../services/roomService';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await getRooms();
        setRooms(data);
      } catch (err) {
        setError('Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) return <div className="p-8">Loading rooms...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Rooms Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Room {room.roomNumber}</h3>
                <p className="text-gray-500 font-medium">{room.type}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                ${room.status === 'Available' ? 'bg-green-100 text-green-800' :
                  room.status === 'Occupied' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {room.status}
              </span>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <span className="text-2xl font-bold text-gray-900">${room.price}</span>
              <span className="text-sm text-gray-500">per night</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}