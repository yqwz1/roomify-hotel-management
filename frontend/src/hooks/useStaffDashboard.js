import { useEffect, useMemo, useState } from 'react';
import { searchRooms, extractSearchError } from '../services/searchService';

const createDateWindow = () => {
  const checkInDate = new Date();
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + 1);

  return {
    checkIn: checkInDate.toISOString().split('T')[0],
    checkOut: checkOutDate.toISOString().split('T')[0],
  };
};

export const useStaffDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateWindow] = useState(createDateWindow);

  useEffect(() => {
    let ignore = false;

    const loadInventory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchRooms({
          checkIn: dateWindow.checkIn,
          checkOut: dateWindow.checkOut,
          sortBy: 'PRICE',
          sortDirection: 'ASC',
        });

        if (ignore) return;

        setInventory(response.rooms ?? []);
      } catch (err) {
        if (ignore) return;
        setError(extractSearchError(err));
        setInventory([]);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadInventory();

    return () => {
      ignore = true;
    };
  }, [dateWindow.checkIn, dateWindow.checkOut]);

  const snapshot = useMemo(() => {
    const availableTonight = inventory.length;
    const floorsCovered = new Set(inventory.map((room) => room.floor).filter((value) => value !== null && value !== undefined)).size;
    const roomTypeSummary = Object.entries(
      inventory.reduce((acc, room) => {
        const key = room.roomType?.name || 'Standard';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const startingRate = inventory.reduce((min, room) => {
      const price = Number(room.roomType?.basePrice ?? 0);
      if (!price) return min;
      if (min === null || price < min) return price;
      return min;
    }, null);

    const premiumReady = inventory.filter((room) => {
      const name = room.roomType?.name?.toLowerCase?.() ?? '';
      return name.includes('suite') || name.includes('deluxe');
    }).length;

    const guestCapacityReady = inventory.reduce((max, room) => (
      Math.max(max, Number(room.roomType?.maxGuests ?? 0))
    ), 0);

    const alerts = [];

    if (availableTonight === 0) {
      alerts.push("No rooms are currently available in tonight's search window.");
    } else if (availableTonight <= 3) {
      alerts.push('Inventory is tight tonight. Review alternatives before promising room moves.');
    }

    if (premiumReady === 0 && availableTonight > 0) {
      alerts.push('Premium room inventory is unavailable tonight. Manage upsell expectations carefully.');
    }

    return {
      availableTonight,
      floorsCovered,
      startingRate,
      premiumReady,
      guestCapacityReady,
      roomTypeSummary,
      alerts,
      dateWindow,
    };
  }, [dateWindow, inventory]);

  return {
    inventory,
    loading,
    error,
    ...snapshot,
  };
};
