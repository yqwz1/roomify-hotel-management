import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StaffServiceRequests from './StaffServiceRequests';
import {
  extractStaffServiceRequestError,
  getStaffServiceRequests,
  updateStaffServiceRequestStatus,
} from '../services/serviceRequestService';

vi.mock('../services/serviceRequestService', () => ({
  getStaffServiceRequests: vi.fn(),
  updateStaffServiceRequestStatus: vi.fn(),
  extractStaffServiceRequestError: vi.fn((err) => err?.message ?? 'Unable to load queue'),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <StaffServiceRequests />
    </MemoryRouter>
  );

describe('StaffServiceRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders requests and updates a request status', async () => {
    const user = userEvent.setup();

    getStaffServiceRequests.mockResolvedValue([
      {
        id: 17,
        guestName: 'Guest User',
        roomNumber: '402',
        serviceType: 'FOOD_DELIVERY',
        description: 'Please send breakfast by 8 AM.',
        priority: 'MEDIUM',
        status: 'PENDING',
        createdAt: '2026-05-18T08:00:00',
      },
    ]);
    updateStaffServiceRequestStatus.mockResolvedValue({
      id: 17,
      guestName: 'Guest User',
      roomNumber: '402',
      serviceType: 'FOOD_DELIVERY',
      description: 'Please send breakfast by 8 AM.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      createdAt: '2026-05-18T08:00:00',
    });

    renderPage();

    expect(await screen.findByText('Guest User')).toBeInTheDocument();
    expect(screen.getByText('Please send breakfast by 8 AM.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Mark In Progress/i }));

    await waitFor(() =>
      expect(updateStaffServiceRequestStatus).toHaveBeenCalledWith(17, 'IN_PROGRESS')
    );

    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('shows an empty state when no staff service requests are available', async () => {
    getStaffServiceRequests.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('No service requests yet')).toBeInTheDocument();
  });

  it('shows a retryable error state when the staff queue fails to load', async () => {
    getStaffServiceRequests.mockRejectedValue(new Error('Service queue unavailable'));

    renderPage();

    expect(await screen.findByText('Unable to load service requests')).toBeInTheDocument();
    expect(extractStaffServiceRequestError).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Service queue unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
