import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HotelServices from './HotelServices';
import {
  getServices,
  setServiceActive,
} from '../services/serviceService';

vi.mock('../services/serviceService', () => ({
  createService: vi.fn(),
  extractServiceError: (err) => err?.message ?? 'Failed to load hotel services.',
  getServices: vi.fn(),
  setServiceActive: vi.fn(),
  updateService: vi.fn(),
}));

const services = [
  {
    id: 2,
    name: 'Z Laundry',
    category: 'CLEANING',
    price: 30,
    active: true,
  },
  {
    id: 1,
    name: 'Airport Transfer',
    category: 'OTHER',
    price: 120,
    active: true,
  },
  {
    id: 3,
    name: 'Breakfast',
    category: 'FOOD',
    price: 45,
    active: false,
  },
];

describe('HotelServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    getServices.mockResolvedValue(services);
  });

  it('sorts services by name and shows service-specific action labels', async () => {
    render(<HotelServices />);

    expect(await screen.findByText('Airport Transfer')).toBeInTheDocument();

    const names = screen
      .getAllByText(/Airport Transfer|Breakfast|Z Laundry/)
      .map((element) => element.textContent);

    expect(names).toEqual(['Airport Transfer', 'Breakfast', 'Z Laundry']);
    expect(screen.getAllByRole('button', { name: /Edit Service/i })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /^Deactivate$/i })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /^Activate$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Delete$/i })).not.toBeInTheDocument();
  });

  it('deactivates an active service without deleting it', async () => {
    const user = userEvent.setup();
    setServiceActive.mockResolvedValue({
      ...services[1],
      active: false,
    });

    render(<HotelServices />);

    await screen.findByText('Airport Transfer');
    await user.click(screen.getAllByRole('button', { name: /^Deactivate$/i })[0]);

    await waitFor(() => {
      expect(setServiceActive).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: 'Airport Transfer' }),
        false
      );
    });
    expect(window.confirm).toHaveBeenCalled();
  });
});
