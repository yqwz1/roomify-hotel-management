import { useEffect, useState } from 'react';
import { getRooms } from '../services/roomService';
import { useTranslation } from 'react-i18next';

export default function Rooms() {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await getRooms();
        setRooms(data);
      } catch (err) {
        console.error('Failed to load rooms:', err);
        setError(t('failedLoadRooms') || 'Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) return <div className="h-full bg-zinc-50 p-6 lg:p-8 font-bold text-zinc-500">{t('loadingRooms') || 'Loading rooms...'}</div>;
  if (error) return <div className="h-full bg-zinc-50 p-6 lg:p-8 font-bold text-red-600">{error}</div>;

  return (
    <div className="h-full bg-zinc-50 p-6 lg:p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-black tracking-tight">{t('roomsTitle') || 'Rooms Management'}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8 border border-zinc-200 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-extrabold text-black">{t('roomNumber', { number: room.roomNumber }) || `Room ${room.roomNumber}`}</h3>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">{room.type}</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0
                ${room.status === 'Available' ? 'border border-zinc-300 bg-white text-black' :
                  room.status === 'Occupied' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                {room.status === 'Available' && t('statusAvailable') ||
                 room.status === 'Occupied' && t('statusOccupied') ||
                 room.status === 'Needs Cleaning' && t('statusNeedsCleaning') ||
                 room.status}
              </span>
            </div>

            <div className="mt-auto flex justify-between items-end pt-5 border-t border-zinc-100">
              <span className="text-3xl font-extrabold text-black">${room.price}</span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">{t('perNight') || 'per night'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
