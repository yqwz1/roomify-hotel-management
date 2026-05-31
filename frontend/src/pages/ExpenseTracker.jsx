import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarRange,
  FileSearch,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Repeat,
  Tag,
  Trash2,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import ModalFrame from '../components/common/ModalFrame';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import InventoryOperationsPanel from '../components/inventory/InventoryOperationsPanel';
import { DistributionBarChart } from '../components/charts/DistributionBarChart';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  createExpense,
  deleteExpense,
  extractExpenseError,
  getExpenseSummary,
  getExpenses,
  updateExpense,
} from '../services/expenseService';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  formatLocalizedDateTime,
  formatLocalizedNumber,
  translateWithFallback,
} from '../utils/localization';

import { NativeSelect } from "@/components/ui/native-select";
const EXPENSE_CATEGORIES = [
  'CLEANING_SUPPLIES',
  'CONSUMABLES',
  'MAINTENANCE',
  'UTILITIES',
  'OFFICE_ADMIN',
  'EQUIPMENT',
  'MISCELLANEOUS',
];

const PAYMENT_METHODS = ['CARD', 'CASH', 'ONLINE'];

const CATEGORY_STYLES = {
  CLEANING_SUPPLIES: 'border-brand-primary bg-brand-primary text-brand-primary',
  CONSUMABLES: 'border-brand-success/30 bg-brand-success/10 text-brand-success',
  MAINTENANCE: 'border-brand-warning/30 bg-brand-warning/10 text-brand-warning',
  UTILITIES: 'border-brand-primary-deep bg-brand-primary-deep text-brand-primary-deep',
  OFFICE_ADMIN: 'border-brand-primary bg-brand-primary text-brand-primary',
  EQUIPMENT: 'border-brand-danger/30 bg-brand-danger/10 text-brand-danger',
  MISCELLANEOUS: 'border-brand-surface-border bg-brand-primary-tint text-brand-ink',
};

const toIsoDate = (value) => value.toISOString().split('T')[0];

const getDefaultFilters = () => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    startDate: toIsoDate(monthStart),
    endDate: toIsoDate(today),
    category: '',
    vendor: '',
  };
};

const createEmptyForm = () => ({
  title: '',
  description: '',
  category: 'CLEANING_SUPPLIES',
  amount: '',
  expenseDate: toIsoDate(new Date()),
  vendor: '',
  paymentMethod: 'CARD',
  recurring: false,
  receiptFileName: '',
  receiptFileUrl: '',
});

const humanizeEnum = (value) =>
  String(value ?? '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getCategoryLabel = (category, t) =>
  translateWithFallback(
    t,
    `expenseTrackerPage.categories.${String(category || '').toLowerCase()}`,
    humanizeEnum(category)
  );

const getPaymentMethodLabel = (method, t) =>
  translateWithFallback(
    t,
    `expenseTrackerPage.paymentMethods.${String(method || '').toLowerCase()}`,
    humanizeEnum(method)
  );

function ExpenseFormModal({
  formData,
  setFormData,
  onClose,
  onSubmit,
  saving,
  error,
  editing,
  t,
}) {
  return (
    <ModalFrame
      title={translateWithFallback(
        t,
        editing ? 'expenseTrackerPage.editTitle' : 'expenseTrackerPage.createTitle',
        editing ? 'Edit Expense' : 'Add Expense'
      )}
      description={translateWithFallback(
        t,
        editing ? 'expenseTrackerPage.editDescription' : 'expenseTrackerPage.createDescription',
        'Track operating spend without leaving the manager workspace.'
      )}
      onClose={onClose}
      closeLabel={translateWithFallback(t, 'closeDialog', 'Close')}
      widthClassName="max-w-3xl"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {error ? (
          <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {error}
          </div>
        ) : null}

        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'expenseTrackerPage.titleLabel', 'Expense title')}
            </span>
            <Input
              value={formData.title}
              onChange={(event) =>
                setFormData((current) => ({ ...current, title: event.target.value }))
              }
              className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder={translateWithFallback(
                t,
                'expenseTrackerPage.titlePlaceholder',
                'Laundry detergent'
              )}
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'expenseTrackerPage.amountLabel', 'Amount')}
            </span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(event) =>
                setFormData((current) => ({ ...current, amount: event.target.value }))
              }
              className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder="0.00"
              required
            />
          </label>
        </div>

        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'expenseTrackerPage.categoryLabel', 'Category')}
            </span>
            <NativeSelect
              value={formData.category}
              onChange={(event) =>
                setFormData((current) => ({ ...current, category: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(category, t)}
                </option>
              ))}
            </NativeSelect>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'expenseTrackerPage.dateLabel', 'Date')}
            </span>
            <Input
              type="date"
              value={formData.expenseDate}
              onChange={(event) =>
                setFormData((current) => ({ ...current, expenseDate: event.target.value }))
              }
              className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(
                t,
                'expenseTrackerPage.paymentMethodLabel',
                'Payment method'
              )}
            </span>
            <NativeSelect
              value={formData.paymentMethod}
              onChange={(event) =>
                setFormData((current) => ({ ...current, paymentMethod: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {getPaymentMethodLabel(method, t)}
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>

        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'expenseTrackerPage.vendorLabel', 'Vendor or supplier')}
            </span>
            <Input
              value={formData.vendor}
              onChange={(event) =>
                setFormData((current) => ({ ...current, vendor: event.target.value }))
              }
              className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder={translateWithFallback(
                t,
                'expenseTrackerPage.vendorPlaceholder',
                'Sparkle Supply'
              )}
            />
          </label>

          <label className="flex min-w-0 items-center gap-3 rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-4 md:mt-7">
            <Checkbox
              checked={formData.recurring}
              onCheckedChange={(checked) =>
                setFormData((current) => ({ ...current, recurring: checked === true }))
              }
              className="h-4 w-4 rounded border-brand-surface-border"
            />
            <span className="text-sm font-medium text-brand-ink break-words">
              {translateWithFallback(t, 'expenseTrackerPage.recurringLabel', 'Recurring expense')}
            </span>
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
            {translateWithFallback(t, 'expenseTrackerPage.notesLabel', 'Notes')}
          </span>
          <Textarea
            value={formData.description}
            onChange={(event) =>
              setFormData((current) => ({ ...current, description: event.target.value }))
            }
            rows={4}
            className="w-full min-w-0 rounded-[1.35rem] border-brand-surface-border bg-brand-surface-light px-4 py-3 text-sm font-medium text-brand-ink transition focus-visible:border-brand-primary focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/5"
            placeholder={translateWithFallback(
              t,
              'expenseTrackerPage.notesPlaceholder',
              'Optional operating notes or purchase context'
            )}
          />
        </label>

        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(
                t,
                'expenseTrackerPage.receiptNameLabel',
                'Receipt file name'
              )}
            </span>
            <Input
              value={formData.receiptFileName}
              onChange={(event) =>
                setFormData((current) => ({ ...current, receiptFileName: event.target.value }))
              }
              className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder="receipt-apr-24.pdf"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(
                t,
                'expenseTrackerPage.receiptUrlLabel',
                'Receipt URL or reference'
              )}
            </span>
            <Input
              value={formData.receiptFileUrl}
              onChange={(event) =>
                setFormData((current) => ({ ...current, receiptFileUrl: event.target.value }))
              }
              className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus-visible:border-brand-primary focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/5"
              placeholder="https://files.example/receipt-apr-24.pdf"
            />
          </label>
        </div>

        <div className="flex min-w-0 flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button variant="unstyled" size="none"
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-surface-border px-5 py-3 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light"
          >
            {translateWithFallback(t, 'cancel', 'Cancel')}
          </Button>
          <Button variant="unstyled" size="none"
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted"
          >
            {saving
              ? translateWithFallback(t, 'saving', 'Saving...')
              : translateWithFallback(
                  t,
                  editing ? 'expenseTrackerPage.updateAction' : 'expenseTrackerPage.createAction',
                  editing ? 'Update Expense' : 'Save Expense'
                )}
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}

function ExpenseDetailsModal({ expense, onClose, t, language }) {
  if (!expense) return null;

  return (
    <ModalFrame
      title={translateWithFallback(t, 'expenseTrackerPage.detailTitle', 'Expense Details')}
      description={translateWithFallback(
        t,
        'expenseTrackerPage.detailDescription',
        'Review the full expense record before editing or deleting it.'
      )}
      onClose={onClose}
      closeLabel={translateWithFallback(t, 'closeDialog', 'Close')}
      widthClassName="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-black tracking-tight text-brand-ink break-words">{expense.title}</p>
            <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
              {formatLocalizedDate(expense.expenseDate, language, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <span className="rounded-full border border-brand-surface-border bg-brand-surface-light px-4 py-2 text-sm font-black text-brand-ink break-words">
            {formatLocalizedCurrency(expense.amount, language)}
          </span>
        </div>

        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'expenseTrackerPage.categoryLabel', 'Category')}
            </p>
            <p className="mt-2 text-base font-bold text-brand-ink break-words">
              {getCategoryLabel(expense.category, t)}
            </p>
          </div>

          <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(
                t,
                'expenseTrackerPage.paymentMethodLabel',
                'Payment method'
              )}
            </p>
            <p className="mt-2 text-base font-bold text-brand-ink break-words">
              {expense.paymentMethod
                ? getPaymentMethodLabel(expense.paymentMethod, t)
                : translateWithFallback(t, 'expenseTrackerPage.notProvided', 'Not provided')}
            </p>
          </div>

          <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'expenseTrackerPage.vendorLabel', 'Vendor or supplier')}
            </p>
            <p className="mt-2 text-base font-bold text-brand-ink break-words">
              {expense.vendor || translateWithFallback(t, 'expenseTrackerPage.notProvided', 'Not provided')}
            </p>
          </div>

          <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'expenseTrackerPage.recurringLabel', 'Recurring expense')}
            </p>
            <p className="mt-2 text-base font-bold text-brand-ink break-words">
              {expense.recurring
                ? translateWithFallback(t, 'expenseTrackerPage.recurringYes', 'Yes')
                : translateWithFallback(t, 'expenseTrackerPage.recurringNo', 'No')}
            </p>
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-brand-surface-border bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
            {translateWithFallback(t, 'expenseTrackerPage.notesLabel', 'Notes')}
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-brand-ink break-words">
            {expense.description || translateWithFallback(t, 'expenseTrackerPage.noNotes', 'No notes were added.')}
          </p>
        </div>

        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(
                t,
                'expenseTrackerPage.receiptReferenceTitle',
                'Receipt reference'
              )}
            </p>
            <p className="mt-2 text-sm font-bold text-brand-ink break-words">
              {expense.receiptFileName || expense.receiptFileUrl || translateWithFallback(t, 'expenseTrackerPage.notProvided', 'Not provided')}
            </p>
          </div>

          <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'expenseTrackerPage.lastUpdatedTitle', 'Last updated')}
            </p>
            <p className="mt-2 text-sm font-bold text-brand-ink break-words">
              {formatLocalizedDateTime(expense.updatedAt, language, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}

export default function ExpenseTracker() {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState(getDefaultFilters);
  const [draftFilters, setDraftFilters] = useState(getDefaultFilters);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formData, setFormData] = useState(createEmptyForm());

  const loadData = async (nextFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const [expenseRows, expenseSummary] = await Promise.all([
        getExpenses(nextFilters),
        getExpenseSummary(nextFilters),
      ]);

      setExpenses(expenseRows);
      setSummary(expenseSummary);
    } catch (err) {
      setExpenses([]);
      setSummary(null);
      setError(extractExpenseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recurringCount = useMemo(
    () => expenses.filter((expense) => expense.recurring).length,
    [expenses]
  );

  const financeSignal = useMemo(() => {
    const totalRevenue = Number(summary?.totalRevenue ?? 0);
    const totalExpenses = Number(summary?.totalExpenses ?? 0);

    if (!summary) {
      return translateWithFallback(
        t,
        'expenseTrackerPage.signalLoading',
        'Expense insights will appear as soon as the current period finishes loading.'
      );
    }

    if (totalExpenses === 0) {
      return translateWithFallback(
        t,
        'expenseTrackerPage.signalNoExpenses',
        'No operating expenses have been tracked in this range yet.'
      );
    }

    if (totalExpenses > totalRevenue) {
      return translateWithFallback(
        t,
        'expenseTrackerPage.signalNegative',
        'Spending is higher than booked revenue in this range. Review the latest purchases and category mix.'
      );
    }

    return translateWithFallback(
      t,
      'expenseTrackerPage.signalHealthy',
      'Revenue is covering current operating spend. Use the category breakdown below to keep margins visible.'
    );
  }, [summary, t]);

  const metricCards = useMemo(() => {
    if (!summary) return [];

    return [
      {
        icon: WalletCards,
        label: translateWithFallback(t, 'expenseTrackerPage.metrics.totalExpenses', 'Total Expenses'),
        value: formatLocalizedCurrency(summary.totalExpenses, i18n.language),
        hint: translateWithFallback(
          t,
          'expenseTrackerPage.metrics.totalExpensesHint',
          'Spend inside the current filtered range.'
        ),
      },
      {
        icon: Receipt,
        label: translateWithFallback(t, 'expenseTrackerPage.metrics.totalRevenue', 'Total Revenue'),
        value: formatLocalizedCurrency(summary.totalRevenue, i18n.language),
        hint: translateWithFallback(
          t,
          'expenseTrackerPage.metrics.totalRevenueHint',
          'Revenue returned by the existing dashboard calculator.'
        ),
      },
      {
        icon: TrendingUp,
        label: translateWithFallback(t, 'expenseTrackerPage.metrics.netProfit', 'Net Profit'),
        value: formatLocalizedCurrency(summary.netProfit, i18n.language),
        hint: translateWithFallback(
          t,
          'expenseTrackerPage.metrics.netProfitHint',
          'Revenue minus expenses for the current range.'
        ),
        tone: 'light',
      },
      {
        icon: CalendarRange,
        label: translateWithFallback(t, 'expenseTrackerPage.metrics.thisMonth', 'This Month'),
        value: formatLocalizedCurrency(summary.expensesThisMonth, i18n.language),
        hint: translateWithFallback(
          t,
          'expenseTrackerPage.metrics.thisMonthHint',
          'All expenses posted this calendar month.'
        ),
      },
      {
        icon: Repeat,
        label: translateWithFallback(t, 'expenseTrackerPage.metrics.thisWeek', 'This Week'),
        value: formatLocalizedCurrency(summary.expensesThisWeek, i18n.language),
        hint: translateWithFallback(
          t,
          'expenseTrackerPage.metrics.thisWeekHint',
          'All expenses posted since Monday.'
        ),
      },
      {
        icon: Tag,
        label: translateWithFallback(t, 'expenseTrackerPage.metrics.today', 'Today'),
        value: formatLocalizedCurrency(summary.expensesToday, i18n.language),
        hint: translateWithFallback(
          t,
          'expenseTrackerPage.metrics.todayHint',
          'Today’s operating spend.'
        ),
      },
    ];
  }, [i18n.language, summary, t]);

  const openCreateModal = () => {
    setSelectedExpense(null);
    setFormError(null);
    setFormData(createEmptyForm());
    setModalMode('create');
  };

  const openEditModal = (expense) => {
    setSelectedExpense(expense);
    setFormError(null);
    setFormData({
      title: expense.title ?? '',
      description: expense.description ?? '',
      category: expense.category ?? 'CLEANING_SUPPLIES',
      amount: expense.amount ?? '',
      expenseDate: expense.expenseDate ?? toIsoDate(new Date()),
      vendor: expense.vendor ?? '',
      paymentMethod: expense.paymentMethod ?? 'CARD',
      recurring: Boolean(expense.recurring),
      receiptFileName: expense.receiptFileName ?? '',
      receiptFileUrl: expense.receiptFileUrl ?? '',
    });
    setModalMode('edit');
  };

  const openViewModal = (expense) => {
    setSelectedExpense(expense);
    setModalMode('view');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedExpense(null);
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      category: formData.category,
      amount: Number(formData.amount),
      expenseDate: formData.expenseDate,
      vendor: formData.vendor.trim() || null,
      paymentMethod: formData.paymentMethod || null,
      recurring: Boolean(formData.recurring),
      receiptFileName: formData.receiptFileName.trim() || null,
      receiptFileUrl: formData.receiptFileUrl.trim() || null,
    };

    try {
      if (modalMode === 'edit' && selectedExpense) {
        await updateExpense(selectedExpense.id, payload);
      } else {
        await createExpense(payload);
      }

      closeModal();
      await loadData(filters);
    } catch (err) {
      setFormError(extractExpenseError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expense) => {
    if (
      !window.confirm(
        translateWithFallback(
          t,
          'expenseTrackerPage.deleteConfirm',
          'Delete {{title}} from expense tracking?',
          { title: expense.title }
        )
      )
    ) {
      return;
    }

    try {
      await deleteExpense(expense.id);
      await loadData(filters);
    } catch (err) {
      setError(extractExpenseError(err));
    }
  };

  const handleApplyFilters = async () => {
    if (!draftFilters.startDate || !draftFilters.endDate) {
      setError(
        translateWithFallback(
          t,
          'expenseTrackerPage.filtersRequired',
          'Start date and end date are required.'
        )
      );
      return;
    }

    if (draftFilters.endDate < draftFilters.startDate) {
      setError(
        translateWithFallback(
          t,
          'expenseTrackerPage.filtersInvalid',
          'End date cannot be before start date.'
        )
      );
      return;
    }

    setFilters(draftFilters);
    await loadData(draftFilters);
  };

  const handleResetFilters = async () => {
    const nextFilters = getDefaultFilters();
    setDraftFilters(nextFilters);
    setFilters(nextFilters);
    await loadData(nextFilters);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(t, 'expenseTrackerPage.eyebrow', 'Expense tracking')}
        title={translateWithFallback(t, 'expenseTrackerTitle', 'Expense Tracker')}
        description={translateWithFallback(
          t,
          'expenseTrackerPage.description',
          'Track cleaning supplies, consumables, and operating costs alongside hotel revenue without breaking the existing calculator.'
        )}
        meta={[
          translateWithFallback(
            t,
            'expenseTrackerPage.metaRange',
            '{{start}} to {{end}}',
            {
              start: formatLocalizedDate(filters.startDate, i18n.language, {
                month: 'short',
                day: 'numeric',
              }),
              end: formatLocalizedDate(filters.endDate, i18n.language, {
                month: 'short',
                day: 'numeric',
              }),
            }
          ),
          translateWithFallback(
            t,
            'expenseTrackerPage.metaCount',
            '{{count}} expenses tracked',
            { count: formatLocalizedNumber(summary?.expenseCount ?? 0, i18n.language) }
          ),
          translateWithFallback(
            t,
            'expenseTrackerPage.metaNet',
            'Net {{value}}',
            { value: `\u200E${formatLocalizedCurrency(summary?.netProfit ?? 0, i18n.language)}\u200E` }
          ),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">
                {translateWithFallback(t, 'expenseTrackerPage.snapshotTitle', 'Operating snapshot')}
              </p>
              <p className="mt-3 text-sm font-medium leading-6 text-white/85 break-words">{financeSignal}</p>
            </div>
            <Button
              type="button"
              onClick={openCreateModal}
              className="h-12 bg-white text-brand-ink hover:bg-brand-primary-tint"
            >
              <Plus className="h-4 w-4 shrink-0" />
              {translateWithFallback(t, 'expenseTrackerPage.quickAddAction', 'Quick Add Expense')}
            </Button>
          </div>

          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {translateWithFallback(t, 'expenseTrackerPage.heroExpensesLabel', 'Expenses')}
              </p>
              <p className="mt-2 overflow-hidden text-2xl font-black leading-none tracking-tight sm:text-3xl break-words">
                <span dir="ltr" className="inline-block max-w-full whitespace-nowrap [unicode-bidi:isolate]">
                  {formatLocalizedCurrency(summary?.totalExpenses ?? 0, i18n.language)}
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {translateWithFallback(t, 'expenseTrackerPage.heroRevenueLabel', 'Revenue')}
              </p>
              <p className="mt-2 overflow-hidden text-2xl font-black leading-none tracking-tight sm:text-3xl break-words">
                <span dir="ltr" className="inline-block max-w-full whitespace-nowrap [unicode-bidi:isolate]">
                  {formatLocalizedCurrency(summary?.totalRevenue ?? 0, i18n.language)}
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {translateWithFallback(t, 'expenseTrackerPage.heroRecurringLabel', 'Recurring items')}
              </p>
              <p className="mt-2 overflow-hidden text-2xl font-black leading-none tracking-tight sm:text-3xl break-words">
                {formatLocalizedNumber(recurringCount, i18n.language)}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => (
          <DashboardMetricCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1fr_0.9fr]">
        <DashboardPanel
          title={translateWithFallback(t, 'expenseTrackerPage.filtersTitle', 'Expense Filters')}
          description={translateWithFallback(
            t,
            'expenseTrackerPage.filtersDescription',
            'Filter spend by date range, category, or vendor before comparing it against revenue.'
          )}
          action={
            <Button type="button" variant="outline" onClick={() => loadData(filters)} className="border-brand-surface-border">
              <RefreshCw className="h-4 w-4 shrink-0" />
              {translateWithFallback(t, 'retry', 'Retry')}
            </Button>
          }
        >
          <div className="space-y-5">
            <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                  {translateWithFallback(t, 'expenseTrackerPage.startDateLabel', 'Start date')}
                </span>
                <Input
                  type="date"
                  value={draftFilters.startDate}
                  onChange={(event) =>
                    setDraftFilters((current) => ({ ...current, startDate: event.target.value }))
                  }
                  className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                  {translateWithFallback(t, 'expenseTrackerPage.endDateLabel', 'End date')}
                </span>
                <Input
                  type="date"
                  value={draftFilters.endDate}
                  onChange={(event) =>
                    setDraftFilters((current) => ({ ...current, endDate: event.target.value }))
                  }
                  className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                  {translateWithFallback(t, 'expenseTrackerPage.categoryFilterLabel', 'Category')}
                </span>
                <NativeSelect
                  value={draftFilters.category}
                  onChange={(event) =>
                    setDraftFilters((current) => ({ ...current, category: event.target.value }))
                  }
                  className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  <option value="">{translateWithFallback(t, 'expenseTrackerPage.allCategories', 'All categories')}</option>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category, t)}
                    </option>
                  ))}
                </NativeSelect>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                  {translateWithFallback(t, 'expenseTrackerPage.vendorFilterLabel', 'Vendor')}
                </span>
                <Input
                  value={draftFilters.vendor}
                  onChange={(event) =>
                    setDraftFilters((current) => ({ ...current, vendor: event.target.value }))
                  }
                  className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                  placeholder={translateWithFallback(
                    t,
                    'expenseTrackerPage.vendorFilterPlaceholder',
                    'Filter vendor'
                  )}
                />
              </label>
            </div>

            {error ? (
              <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
                {error}
              </div>
            ) : null}

            <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={handleApplyFilters} className="h-12 bg-brand-primary text-white hover:bg-brand-primary-deep">
                {translateWithFallback(t, 'expenseTrackerPage.applyFilters', 'Apply Filters')}
              </Button>
              <Button type="button" variant="outline" onClick={handleResetFilters} className="h-12 border-brand-surface-border">
                {translateWithFallback(t, 'expenseTrackerPage.resetFilters', 'Reset Filters')}
              </Button>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel
          title={translateWithFallback(t, 'expenseTrackerPage.breakdownTitle', 'Spending by Category')}
          description={translateWithFallback(
            t,
            'expenseTrackerPage.breakdownDescription',
            'See which operating categories are driving the current period’s spend.'
          )}
        >
          {!summary ? (
            <LoadingState message={translateWithFallback(t, 'expenseTrackerPage.loadingBreakdown', 'Loading breakdown...')} />
          ) : summary.categoryBreakdown?.length ? (
            <div className="space-y-6">
              <DistributionBarChart
                data={summary.categoryBreakdown.map((item) => ({
                  name: getCategoryLabel(item.category, t),
                  value: Number(item.totalAmount ?? 0),
                }))}
                labelKey="name"
                valueKey="value"
                valueFormatter={(val) => formatLocalizedCurrency(val, i18n.language)}
                layout="vertical"
                height={350}
                colors={['#264B6B', '#264B6B', '#C97757', '#C97757', '#264B6B', '#264B6B', '#5C6B7A']}
              />
            </div>
          ) : (
            <EmptyState
              title={translateWithFallback(t, 'expenseTrackerPage.breakdownEmptyTitle', 'No category totals yet')}
              message={translateWithFallback(
                t,
                'expenseTrackerPage.breakdownEmptyDescription',
                'Create expenses in the current range to see category totals.'
              )}
              icon={Tag}
            />
          )}
        </DashboardPanel>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <DashboardPanel
          title={translateWithFallback(t, 'expenseTrackerPage.listTitle', 'Expense Log')}
          description={translateWithFallback(
            t,
            'expenseTrackerPage.listDescription',
            'Review the current filtered expense log and make quick corrections when needed.'
          )}
          action={
            <Button variant="unstyled" size="none"
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-w-0 h-12 items-center justify-center gap-2 rounded-full bg-brand-primary px-5 text-sm font-bold text-white transition hover:bg-brand-primary-deep"
            >
              <Plus className="h-4 w-4 shrink-0" />
              {translateWithFallback(t, 'expenseTrackerPage.quickAddAction', 'Quick Add Expense')}
            </Button>
          }
        >
          {loading ? (
            <LoadingState message={translateWithFallback(t, 'expenseTrackerPage.loading', 'Loading expenses...')} />
          ) : error && !summary ? (
            <ErrorState
              title={translateWithFallback(t, 'expenseTrackerPage.listTitle', 'Expense Log')}
              message={error}
              onRetry={() => loadData(filters)}
            />
          ) : expenses.length === 0 ? (
            <EmptyState
              title={translateWithFallback(t, 'expenseTrackerPage.emptyTitle', 'No expenses tracked')}
              message={translateWithFallback(
                t,
                'expenseTrackerPage.emptyDescription',
                'Add cleaning supplies, consumables, or other operating costs to start tracking spend.'
              )}
              icon={WalletCards}
            />
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="rounded-[1.4rem] border border-brand-surface-border bg-white p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.22)]"
                >
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black tracking-tight text-brand-ink break-words">{expense.title}</p>
                      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                        <span
                          className={`max-w-full shrink-0 truncate rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
                            CATEGORY_STYLES[expense.category] ?? CATEGORY_STYLES.MISCELLANEOUS
                          }`}
                        >
                          {getCategoryLabel(expense.category, t)}
                        </span>
                        <span className="max-w-full shrink-0 truncate rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink">
                          {formatLocalizedDate(expense.expenseDate, i18n.language, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {expense.vendor ? (
                          <span className="max-w-full shrink-0 truncate rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink">
                            {expense.vendor}
                          </span>
                        ) : null}
                      </div>
                      {expense.description ? (
                        <p className="mt-3 text-sm font-medium leading-6 text-brand-ink-muted break-words">
                          {expense.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex min-w-0 shrink-0 flex-col items-end gap-3">
                      <span className="max-w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 py-2 text-sm font-black text-brand-ink">
                        {formatLocalizedCurrency(expense.amount, i18n.language)}
                      </span>
                      {expense.recurring ? (
                        <span className="max-w-full truncate rounded-full border border-brand-warning/30 bg-brand-warning/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-warning">
                          {translateWithFallback(t, 'expenseTrackerPage.recurringLabel', 'Recurring expense')}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                    <Button variant="unstyled" size="none"
                      type="button"
                      onClick={() => openViewModal(expense)}
                      className="inline-flex min-w-0 items-center gap-2 rounded-full border border-brand-surface-border bg-brand-surface-light px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-white"
                    >
                      <FileSearch className="h-4 w-4 shrink-0" />
                      {translateWithFallback(t, 'expenseTrackerPage.viewAction', 'View')}
                    </Button>
                    <Button variant="unstyled" size="none"
                      type="button"
                      onClick={() => openEditModal(expense)}
                      className="inline-flex min-w-0 items-center gap-2 rounded-full border border-brand-surface-border bg-brand-surface-light px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-white"
                    >
                      <Pencil className="h-4 w-4 shrink-0" />
                      {translateWithFallback(t, 'editStaff', 'Edit')}
                    </Button>
                    <Button variant="unstyled" size="none"
                      type="button"
                      onClick={() => handleDelete(expense)}
                      className="inline-flex min-w-0 items-center gap-2 rounded-full border border-brand-danger/30 bg-brand-danger/10 px-4 py-2 text-sm font-bold text-brand-danger transition hover:border-brand-danger/40 hover:bg-brand-danger/15"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                      {translateWithFallback(t, 'deleteRoomTitle', 'Delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title={translateWithFallback(t, 'expenseTrackerPage.recentTitle', 'Recent Expenses')}
          description={translateWithFallback(
            t,
            'expenseTrackerPage.recentDescription',
            'A quick read on the latest purchases inside the active date range.'
          )}
        >
          {!summary ? (
            <LoadingState message={translateWithFallback(t, 'expenseTrackerPage.loadingRecent', 'Loading recent expenses...')} />
          ) : summary.recentExpenses?.length ? (
            <div className="space-y-3" data-testid="recent-expenses">
              {summary.recentExpenses.map((expense) => (
                <div key={expense.id} className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-brand-ink break-words">{expense.title}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                        {getCategoryLabel(expense.category, t)}
                      </p>
                    </div>
                    <p className="text-sm font-black text-brand-ink break-words">
                      {formatLocalizedCurrency(expense.amount, i18n.language)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm font-medium text-brand-ink-muted break-words">
                    {expense.vendor || translateWithFallback(t, 'expenseTrackerPage.noVendor', 'No vendor recorded')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={translateWithFallback(t, 'expenseTrackerPage.recentEmptyTitle', 'Nothing recent yet')}
              message={translateWithFallback(
                t,
                'expenseTrackerPage.recentEmptyDescription',
                'Recent expenses will appear here after the first entries are saved.'
              )}
              icon={Receipt}
            />
          )}
        </DashboardPanel>
      </div>

      <InventoryOperationsPanel filters={filters} t={t} language={i18n.language} />

      {(modalMode === 'create' || modalMode === 'edit') && (
        <ExpenseFormModal
          formData={formData}
          setFormData={setFormData}
          onClose={closeModal}
          onSubmit={handleSubmit}
          saving={saving}
          error={formError}
          editing={modalMode === 'edit'}
          t={t}
        />
      )}

      {modalMode === 'view' && (
        <ExpenseDetailsModal
          expense={selectedExpense}
          onClose={closeModal}
          t={t}
          language={i18n.language}
        />
      )}
    </div>
  );
}
