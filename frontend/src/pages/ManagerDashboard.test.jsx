import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ManagerDashboard from './ManagerDashboard';
import { useManagerDashboard } from '../hooks/useManagerDashboard';
import { exportDashboardReport } from '../services/dashboardService';

vi.mock('../context/AuthProvider', () => ({
  useAuth: () => ({
    user: { username: 'Mohammed', roles: ['ROLE_MANAGER'] },
  }),
}));

vi.mock('../hooks/useManagerDashboard', () => ({
  useManagerDashboard: vi.fn(),
}));

vi.mock('../hooks/useRoomTypes', () => ({
  useRoomTypes: () => ({
    roomTypes: [
      { id: 1, name: 'Deluxe Room' },
      { id: 2, name: 'Suite' },
    ],
    fetchRoomTypes: vi.fn(),
  }),
}));

vi.mock('../services/dashboardService', () => ({
  exportDashboardReport: vi.fn(),
  extractDashboardError: (err) => err?.message ?? 'Dashboard request failed',
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ManagerDashboard />
    </MemoryRouter>
  );

const dashboardData = {
  metrics: {
    totalReservations: 18,
    activeReservations: 7,
    totalRevenue: 4200,
    occupancyRate: 0.64,
    averageStayNights: 2.7,
  },
  occupancyTrend: [
    { date: '2026-03-30', occupancyRate: 0.5, occupiedRooms: 25, totalRooms: 50 },
    { date: '2026-03-31', occupancyRate: 0.64, occupiedRooms: 32, totalRooms: 50 },
  ],
  revenueTrend: [
    { date: '2026-03-30', revenue: 1800, reservationCount: 6 },
    { date: '2026-03-31', revenue: 2400, reservationCount: 8 },
  ],
  roomTypeDistribution: [
    { roomTypeName: 'Deluxe Room', totalRooms: 20, occupiedRooms: 14, occupancyRate: 0.7, basePrice: 180 },
  ],
  loading: false,
  error: null,
  reload: vi.fn(),
};

describe('ManagerDashboard', () => {
  beforeEach(() => {
    useManagerDashboard.mockReset();
    exportDashboardReport.mockReset();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:report');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('shows loading state while the live dashboard hook is loading', () => {
    useManagerDashboard.mockReturnValue({
      metrics: null,
      occupancyTrend: [],
      revenueTrend: [],
      roomTypeDistribution: [],
      loading: true,
      error: null,
      reload: vi.fn(),
    });

    renderPage();

    expect(screen.getByText(/Loading live property operations/i)).toBeInTheDocument();
  });

  it('renders live dashboard data and applies date filters', async () => {
    useManagerDashboard.mockImplementation((range) => ({
      ...dashboardData,
      receivedRange: range,
    }));

    renderPage();

    expect(screen.getByText(/Total Reservations/i)).toBeInTheDocument();
    expect(screen.getByTestId('occupancy-trend')).toBeInTheDocument();

    const startInput = screen.getByLabelText(/Start date/i);
    const endInput = screen.getByLabelText(/End date/i);

    fireEvent.change(startInput, { target: { value: '2026-03-01' } });
    fireEvent.change(endInput, { target: { value: '2026-03-31' } });
    fireEvent.click(screen.getByRole('button', { name: /Apply Range/i }));

    await waitFor(() => {
      expect(useManagerDashboard).toHaveBeenLastCalledWith({
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      });
    });
  });

  it('shows retryable error state when the dashboard hook fails', async () => {
    const reload = vi.fn();
    useManagerDashboard.mockReturnValue({
      metrics: null,
      occupancyTrend: [],
      revenueTrend: [],
      roomTypeDistribution: [],
      loading: false,
      error: 'Dashboard failed',
      reload,
    });

    renderPage();

    expect(screen.getByText('Dashboard failed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('exports the current filtered report as JSON', async () => {
    useManagerDashboard.mockReturnValue(dashboardData);
    exportDashboardReport.mockResolvedValue({
      generatedAt: '2026-04-03T10:00:00',
      totalRecords: 4,
      format: 'JSON',
      data: [{ confirmationNumber: 'RSV-1' }],
    });

    renderPage();

    const startInput = screen.getByLabelText(/Start date/i);
    const endInput = screen.getByLabelText(/End date/i);

    fireEvent.change(screen.getByLabelText(/Room type filter/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Reservation status/i), { target: { value: 'CHECKED_IN' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate Export/i }));

    await waitFor(() => {
      expect(exportDashboardReport).toHaveBeenCalledWith({
        startDate: startInput.value,
        endDate: endInput.value,
        exportFormat: 'JSON',
        roomTypeId: 1,
        status: 'CHECKED_IN',
      });
    });

    expect(screen.getByRole('link', { name: /Download JSON Export/i })).toHaveAttribute('href', 'blob:report');
  });
});
