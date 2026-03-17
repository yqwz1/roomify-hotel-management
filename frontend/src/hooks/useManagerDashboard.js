import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getRooms, extractErrorMessage } from '../services/roomService';
import { getStaff } from '../services/staffService';

const STATUS_ORDER = ['AVAILABLE', 'OCCUPIED', 'NEEDS_CLEANING', 'UNDER_MAINTENANCE'];

const STATUS_META = {
  AVAILABLE: {
    label: 'Available',
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    bar: 'bg-emerald-500',
  },
  OCCUPIED: {
    label: 'Occupied',
    tone: 'bg-zinc-950 text-white border-zinc-950',
    bar: 'bg-zinc-950',
  },
  NEEDS_CLEANING: {
    label: 'Needs Cleaning',
    tone: 'bg-amber-50 text-amber-900 border-amber-200',
    bar: 'bg-amber-500',
  },
  UNDER_MAINTENANCE: {
    label: 'Under Maintenance',
    tone: 'bg-rose-50 text-rose-900 border-rose-200',
    bar: 'bg-rose-500',
  },
};

const getDashboardError = (reason) => {
  if (!reason) return 'Failed to load dashboard data.';
  if (reason.response?.data?.message) return reason.response.data.message;
  return extractErrorMessage(reason);
};

export const useManagerDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadIssues, setLoadIssues] = useState([]);

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      setLoadIssues([]);

      const [roomsResult, roomTypesResult, staffResult] = await Promise.allSettled([
        getRooms(),
        api.get('/room-types'),
        getStaff(),
      ]);

      if (ignore) return;

      const issues = [];

      if (roomsResult.status === 'fulfilled') {
        setRooms(roomsResult.value);
      } else {
        setRooms([]);
        issues.push('Room inventory could not be loaded.');
      }

      if (roomTypesResult.status === 'fulfilled') {
        setRoomTypes(roomTypesResult.value.data);
      } else {
        setRoomTypes([]);
        issues.push('Room type summary could not be loaded.');
      }

      if (staffResult.status === 'fulfilled') {
        setStaff(staffResult.value);
      } else {
        setStaff([]);
        issues.push('Staff summary could not be loaded.');
      }

      if (
        roomsResult.status === 'rejected' &&
        roomTypesResult.status === 'rejected' &&
        staffResult.status === 'rejected'
      ) {
        setError(getDashboardError(roomsResult.reason));
      } else {
        setLoadIssues(issues);
      }

      setLoading(false);
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const snapshot = useMemo(() => {
    const totalRooms = rooms.length;
    const statusCountsMap = rooms.reduce((acc, room) => {
      acc[room.status] = (acc[room.status] ?? 0) + 1;
      return acc;
    }, {});

    const statusCounts = STATUS_ORDER.map((status) => ({
      status,
      count: statusCountsMap[status] ?? 0,
      ...STATUS_META[status],
    }));

    const availableRooms = statusCountsMap.AVAILABLE ?? 0;
    const occupiedRooms = statusCountsMap.OCCUPIED ?? 0;
    const cleaningRooms = statusCountsMap.NEEDS_CLEANING ?? 0;
    const maintenanceRooms = statusCountsMap.UNDER_MAINTENANCE ?? 0;

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const readinessRate = totalRooms > 0 ? Math.round((availableRooms / totalRooms) * 100) : 0;

    const activeStaff = staff.filter((member) => member.active).length;
    const inactiveStaff = Math.max(staff.length - activeStaff, 0);

    const floorSummary = Object.entries(
      rooms.reduce((acc, room) => {
        const key = room.floor ?? 'Unassigned';

        if (!acc[key]) {
          acc[key] = {
            floor: key,
            total: 0,
            available: 0,
            occupied: 0,
            cleaning: 0,
            maintenance: 0,
          };
        }

        acc[key].total += 1;
        if (room.status === 'AVAILABLE') acc[key].available += 1;
        if (room.status === 'OCCUPIED') acc[key].occupied += 1;
        if (room.status === 'NEEDS_CLEANING') acc[key].cleaning += 1;
        if (room.status === 'UNDER_MAINTENANCE') acc[key].maintenance += 1;

        return acc;
      }, {})
    )
      .map(([, value]) => value)
      .sort((a, b) => {
        if (typeof a.floor === 'number' && typeof b.floor === 'number') return a.floor - b.floor;
        return String(a.floor).localeCompare(String(b.floor));
      });

    const departmentSummary = Object.entries(
      staff.reduce((acc, member) => {
        const key = member.department?.trim() || 'Unassigned';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    )
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    const roomTypeMix = roomTypes
      .map((roomType) => {
        const assignedRooms = rooms.filter((room) => room.roomType?.id === roomType.id).length;
        return {
          id: roomType.id,
          name: roomType.name,
          basePrice: roomType.basePrice,
          maxGuests: roomType.maxGuests,
          assignedRooms,
        };
      })
      .sort((a, b) => b.assignedRooms - a.assignedRooms || a.name.localeCompare(b.name));

    const alerts = [];

    if (maintenanceRooms > 0) {
      alerts.push({
        title: 'Rooms blocked for maintenance',
        detail: `${maintenanceRooms} room${maintenanceRooms === 1 ? '' : 's'} need follow-up before they can return to inventory.`,
        href: '/room-status',
      });
    }

    if (cleaningRooms > 0) {
      alerts.push({
        title: 'Housekeeping queue needs attention',
        detail: `${cleaningRooms} room${cleaningRooms === 1 ? '' : 's'} are still waiting for cleaning clearance.`,
        href: '/room-status',
      });
    }

    if (inactiveStaff > 0) {
      alerts.push({
        title: 'Inactive staff accounts detected',
        detail: `${inactiveStaff} staff account${inactiveStaff === 1 ? '' : 's'} are inactive and may need review.`,
        href: '/staff',
      });
    }

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
      cleaningRooms,
      maintenanceRooms,
      occupancyRate,
      readinessRate,
      roomTypeCount: roomTypes.length,
      activeStaff,
      inactiveStaff,
      statusCounts,
      floorSummary,
      departmentSummary,
      roomTypeMix,
      alerts,
    };
  }, [roomTypes, rooms, staff]);

  return {
    rooms,
    roomTypes,
    staff,
    loading,
    error,
    loadIssues,
    ...snapshot,
  };
};
