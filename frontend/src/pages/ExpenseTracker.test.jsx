import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ExpenseTracker from './ExpenseTracker';
import {
  createExpense,
  deleteExpense,
  getExpenseSummary,
  getExpenses,
} from '../services/expenseService';

vi.mock('../services/expenseService', () => ({
  getExpenses: vi.fn(),
  getExpenseSummary: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  extractExpenseError: (err) => err?.message ?? 'Expense request failed',
}));

vi.mock('../components/inventory/InventoryOperationsPanel', () => ({
  default: () => <section>Inventory &amp; Automation</section>,
}));

const summaryResponse = {
  totalRevenue: 4200,
  totalExpenses: 540,
  netProfit: 3660,
  expensesToday: 40,
  expensesThisWeek: 160,
  expensesThisMonth: 540,
  expenseCount: 2,
  categoryBreakdown: [
    { category: 'CLEANING_SUPPLIES', totalAmount: 320, expenseCount: 1 },
    { category: 'CONSUMABLES', totalAmount: 220, expenseCount: 1 },
  ],
  recentExpenses: [
    {
      id: 2,
      title: 'Paper cups',
      category: 'CONSUMABLES',
      amount: 220,
      expenseDate: '2026-04-24',
      vendor: 'Supply Hub',
      recurring: false,
      updatedAt: '2026-04-24T10:00:00',
    },
  ],
};

const expensesResponse = [
  {
    id: 1,
    title: 'Laundry detergent',
    description: 'Refill housekeeping stock',
    category: 'CLEANING_SUPPLIES',
    amount: 320,
    expenseDate: '2026-04-23',
    vendor: 'Sparkle Supply',
    paymentMethod: 'CARD',
    recurring: true,
    updatedAt: '2026-04-23T09:00:00',
  },
  {
    id: 2,
    title: 'Paper cups',
    description: '',
    category: 'CONSUMABLES',
    amount: 220,
    expenseDate: '2026-04-24',
    vendor: 'Supply Hub',
    paymentMethod: 'CASH',
    recurring: false,
    updatedAt: '2026-04-24T10:00:00',
  },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <ExpenseTracker />
    </MemoryRouter>
  );

describe('ExpenseTracker', () => {
  beforeEach(() => {
    getExpenses.mockReset();
    getExpenseSummary.mockReset();
    createExpense.mockReset();
    deleteExpense.mockReset();
    getExpenses.mockResolvedValue(expensesResponse);
    getExpenseSummary.mockResolvedValue(summaryResponse);
    globalThis.confirm = vi.fn(() => true);
  });

  it('renders loaded expense summaries and recent expenses', async () => {
    renderPage();

    expect(await screen.findByText(/Expense Tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/Laundry detergent/i)).toBeInTheDocument();
    expect(screen.getByTestId('recent-expenses')).toBeInTheDocument();
    expect(screen.getByText(/Total Expenses/i)).toBeInTheDocument();
  });

  it('creates a new expense from the quick-add flow', async () => {
    createExpense.mockResolvedValue({ id: 3 });

    renderPage();

    fireEvent.click((await screen.findAllByRole('button', { name: /Quick Add Expense/i }))[0]);
    fireEvent.change(screen.getByLabelText(/Expense title/i), {
      target: { value: 'Glass cleaner' },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: '25.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save Expense/i }));

    await waitFor(() => {
      expect(createExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Glass cleaner',
          amount: 25.5,
        })
      );
    });
  });

  it('applies vendor filters and reloads the dataset', async () => {
    renderPage();

    await screen.findByText(/Laundry detergent/i);

    fireEvent.change(screen.getByLabelText(/Vendor/i), {
      target: { value: 'sparkle' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));

    await waitFor(() => {
      expect(getExpenses).toHaveBeenLastCalledWith(
        expect.objectContaining({
          vendor: 'sparkle',
        })
      );
      expect(getExpenseSummary).toHaveBeenLastCalledWith(
        expect.objectContaining({
          vendor: 'sparkle',
        })
      );
    });
  });

  it('deletes an expense from the log', async () => {
    deleteExpense.mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(await screen.findAllByRole('button', { name: /Delete/i }).then((buttons) => buttons[0]));

    await waitFor(() => {
      expect(deleteExpense).toHaveBeenCalledWith(1);
    });
  });
});
