import { useEffect, useMemo, useState } from 'react';
import { Archive, ClipboardList, PackagePlus, TriangleAlert, Wrench } from 'lucide-react';
import ModalFrame from '../common/ModalFrame';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import LoadingState from '../common/LoadingState';
import DashboardMetricCard from '../dashboard/DashboardMetricCard';
import DashboardPanel from '../dashboard/DashboardPanel';
import { DistributionBarChart } from '../charts/DistributionBarChart';
import { Button } from '../ui/button';
import {
  adjustInventoryItem,
  createInventoryItem,
  createServiceUsageTemplate,
  extractInventoryError,
  getInventoryItems,
  getInventoryRoomTypes,
  getInventorySummary,
  getServiceUsageTemplates,
  restockInventoryItem,
  updateInventoryItem,
  updateServiceUsageTemplate,
} from '../../services/inventoryService';
import {
  formatLocalizedCurrency,
  formatLocalizedDateTime,
  formatLocalizedNumber,
  translateWithFallback,
} from '../../utils/localization';

const INVENTORY_CATEGORIES = [
  'CLEANING_CHEMICALS',
  'TOILETRIES',
  'CONSUMABLES',
  'MAINTENANCE_SUPPLIES',
  'LAUNDRY_LINEN_SUPPLIES',
  'OFFICE_ADMIN_SUPPLIES',
  'MISCELLANEOUS',
];

const INVENTORY_UNITS = ['PIECE', 'BOTTLE', 'LITER', 'MILLILITER', 'KILOGRAM', 'PACK', 'ROLL'];
const STOCK_ADJUSTMENT_TYPES = ['MANUAL_ADJUSTMENT', 'WASTE_DAMAGE', 'RETURN_CORRECTION'];
const SERVICE_TYPES = [
  'STANDARD_ROOM_CLEANING',
  'DEEP_CLEANING',
  'CHECKOUT_CLEANING',
  'BATHROOM_REFRESH',
  'MAINTENANCE_VISIT',
  'REPAIR_VISIT',
];

const humanizeEnum = (value) =>
  String(value ?? '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const emptyItemForm = () => ({
  name: '',
  category: 'CLEANING_CHEMICALS',
  unitOfMeasure: 'PIECE',
  minimumStockThreshold: '0',
  defaultUnitCost: '0',
  initialStockQuantity: '0',
  supplier: '',
  sku: '',
  active: true,
  notes: '',
});

const emptyRestockForm = () => ({
  quantity: '1',
  unitCost: '0',
  supplier: '',
  notes: '',
  linkToExpense: true,
});

const emptyAdjustmentForm = () => ({
  transactionType: 'MANUAL_ADJUSTMENT',
  quantityChange: '1',
  increaseStock: false,
  unitCost: '0',
  notes: '',
});

const emptyTemplateForm = () => ({
  name: '',
  serviceType: 'STANDARD_ROOM_CLEANING',
  roomTypeId: '',
  active: true,
  notes: '',
  items: [],
});

function InventoryItemModal({ formData, setFormData, onClose, onSubmit, saving, error, editing, t }) {
  return (
    <ModalFrame
      title={translateWithFallback(
        t,
        editing ? 'inventoryPage.editItemTitle' : 'inventoryPage.addItemTitle',
        editing ? 'Edit Inventory Item' : 'Add Inventory Item'
      )}
      description={translateWithFallback(
        t,
        'inventoryPage.itemModalDescription',
        'Set the stock profile, thresholds, and baseline cost for an operational item.'
      )}
      onClose={onClose}
      closeLabel={translateWithFallback(t, 'closeDialog', 'Close')}
      widthClassName="max-w-3xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.itemNameLabel', 'Item name')}
            </span>
            <input
              value={formData.name}
              onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
              placeholder="Surface cleaner"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.categoryLabel', 'Category')}
            </span>
            <select
              value={formData.category}
              onChange={(event) =>
                setFormData((current) => ({ ...current, category: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
            >
              {INVENTORY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {humanizeEnum(category)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.unitLabel', 'Unit')}
            </span>
            <select
              value={formData.unitOfMeasure}
              onChange={(event) =>
                setFormData((current) => ({ ...current, unitOfMeasure: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
            >
              {INVENTORY_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {humanizeEnum(unit)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.minimumThresholdLabel', 'Minimum stock')}
            </span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={formData.minimumStockThreshold}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  minimumStockThreshold: event.target.value,
                }))
              }
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.defaultUnitCostLabel', 'Default unit cost')}
            </span>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={formData.defaultUnitCost}
              onChange={(event) =>
                setFormData((current) => ({ ...current, defaultUnitCost: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
              required
            />
          </label>
        </div>

        {!editing ? (
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.initialStockLabel', 'Initial stock')}
            </span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={formData.initialStockQuantity}
              onChange={(event) =>
                setFormData((current) => ({ ...current, initialStockQuantity: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
            />
          </label>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.supplierLabel', 'Supplier')}
            </span>
            <input
              value={formData.supplier}
              onChange={(event) =>
                setFormData((current) => ({ ...current, supplier: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.skuLabel', 'SKU')}
            </span>
            <input
              value={formData.sku}
              onChange={(event) => setFormData((current) => ({ ...current, sku: event.target.value }))}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
            />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-4">
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(event) => setFormData((current) => ({ ...current, active: event.target.checked }))}
            className="h-4 w-4 rounded border-brand-surface-border"
          />
          <span className="text-sm font-medium text-brand-ink">
            {translateWithFallback(t, 'inventoryPage.activeLabel', 'Active item')}
          </span>
        </label>

        <label className="space-y-2 flex flex-col">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
            {translateWithFallback(t, 'inventoryPage.notesLabel', 'Notes')}
          </span>
          <Textarea
            value={formData.notes}
            onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
            rows={3}
            className="w-full rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3 text-sm font-medium text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/5"
          />
        </label>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-full border border-brand-surface-border px-5 py-3 text-sm font-bold text-brand-ink">
            {translateWithFallback(t, 'cancel', 'Cancel')}
          </button>
          <button type="submit" disabled={saving} className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted">
            {saving ? translateWithFallback(t, 'saving', 'Saving...') : translateWithFallback(t, 'save', 'Save')}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function RestockModal({ item, formData, setFormData, onClose, onSubmit, saving, error, t }) {
  return (
    <ModalFrame
      title={translateWithFallback(t, 'inventoryPage.quickRestockTitle', 'Quick Restock')}
      description={`${item?.name ?? ''} · ${translateWithFallback(
        t,
        'inventoryPage.quickRestockDescription',
        'Add purchased stock and optionally link it to cash spend.'
      )}`}
      onClose={onClose}
      closeLabel={translateWithFallback(t, 'closeDialog', 'Close')}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.quantityLabel', 'Quantity')}
            </span>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={formData.quantity}
              onChange={(event) => setFormData((current) => ({ ...current, quantity: event.target.value }))}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.unitCostLabel', 'Unit cost')}
            </span>
            <input
              type="number"
              min="0.0001"
              step="0.0001"
              value={formData.unitCost}
              onChange={(event) => setFormData((current) => ({ ...current, unitCost: event.target.value }))}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
              required
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
            {translateWithFallback(t, 'inventoryPage.supplierLabel', 'Supplier')}
          </span>
          <input
            value={formData.supplier}
            onChange={(event) => setFormData((current) => ({ ...current, supplier: event.target.value }))}
            className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
          />
        </label>

        <label className="flex items-center gap-3 rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-4">
          <input
            type="checkbox"
            checked={formData.linkToExpense}
            onChange={(event) => setFormData((current) => ({ ...current, linkToExpense: event.target.checked }))}
            className="h-4 w-4 rounded border-brand-surface-border"
          />
          <span className="text-sm font-medium text-brand-ink">
            {translateWithFallback(t, 'inventoryPage.linkExpenseLabel', 'Also record this as cash spend')}
          </span>
        </label>

        <label className="space-y-2 flex flex-col">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
            {translateWithFallback(t, 'inventoryPage.notesLabel', 'Notes')}
          </span>
          <Textarea
            value={formData.notes}
            onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
            rows={3}
            className="w-full rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3 text-sm font-medium text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/5"
          />
        </label>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-full border border-brand-surface-border px-5 py-3 text-sm font-bold text-brand-ink">
            {translateWithFallback(t, 'cancel', 'Cancel')}
          </button>
          <button type="submit" disabled={saving} className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted">
            {saving ? translateWithFallback(t, 'saving', 'Saving...') : translateWithFallback(t, 'inventoryPage.restockAction', 'Restock')}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function AdjustmentModal({ item, formData, setFormData, onClose, onSubmit, saving, error, t }) {
  return (
    <ModalFrame
      title={translateWithFallback(t, 'inventoryPage.adjustStockTitle', 'Adjust Stock')}
      description={`${item?.name ?? ''} · ${translateWithFallback(
        t,
        'inventoryPage.adjustStockDescription',
        'Record waste, corrections, or counted stock differences without creating duplicate cash spend.'
      )}`}
      onClose={onClose}
      closeLabel={translateWithFallback(t, 'closeDialog', 'Close')}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.transactionTypeLabel', 'Adjustment type')}
            </span>
            <select
              value={formData.transactionType}
              onChange={(event) => setFormData((current) => ({ ...current, transactionType: event.target.value }))}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
            >
              {STOCK_ADJUSTMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {humanizeEnum(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.quantityLabel', 'Quantity')}
            </span>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={formData.quantityChange}
              onChange={(event) => setFormData((current) => ({ ...current, quantityChange: event.target.value }))}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
            />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-4">
          <input
            type="checkbox"
            checked={formData.increaseStock}
            onChange={(event) => setFormData((current) => ({ ...current, increaseStock: event.target.checked }))}
            className="h-4 w-4 rounded border-brand-surface-border"
            disabled={formData.transactionType !== 'MANUAL_ADJUSTMENT'}
          />
          <span className="text-sm font-medium text-brand-ink">
            {translateWithFallback(t, 'inventoryPage.increaseStockLabel', 'Increase stock instead of reducing it')}
          </span>
        </label>

        <label className="space-y-2 flex flex-col">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
            {translateWithFallback(t, 'inventoryPage.notesLabel', 'Notes')}
          </span>
          <Textarea
            value={formData.notes}
            onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
            rows={3}
            className="w-full rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3 text-sm font-medium text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/5"
          />
        </label>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-full border border-brand-surface-border px-5 py-3 text-sm font-bold text-brand-ink">
            {translateWithFallback(t, 'cancel', 'Cancel')}
          </button>
          <button type="submit" disabled={saving} className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted">
            {saving ? translateWithFallback(t, 'saving', 'Saving...') : translateWithFallback(t, 'inventoryPage.saveAdjustmentAction', 'Save Adjustment')}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function TemplateModal({
  formData,
  setFormData,
  inventoryItems,
  roomTypes,
  onClose,
  onSubmit,
  saving,
  error,
  editing,
  t,
}) {
  const availableInventoryItems = useMemo(
    () =>
      inventoryItems.filter(
        (inventoryItem) =>
          !formData.items.some((templateItem) => Number(templateItem.inventoryItemId) === inventoryItem.id)
      ),
    [inventoryItems, formData.items]
  );

  const handleTemplateItemChange = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddTemplateItem = () => {
    if (!availableInventoryItems.length) return;
    const candidate = availableInventoryItems[0];
    setFormData((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          inventoryItemId: candidate.id,
          standardQuantity: '1',
          notes: '',
          active: true,
        },
      ],
    }));
  };

  const handleRemoveTemplateItem = (index) => {
    setFormData((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  return (
    <ModalFrame
      title={translateWithFallback(
        t,
        editing ? 'inventoryPage.editTemplateTitle' : 'inventoryPage.addTemplateTitle',
        editing ? 'Edit Usage Template' : 'Add Usage Template'
      )}
      description={translateWithFallback(
        t,
        'inventoryPage.templateModalDescription',
        'Define the standard operational items for each room and service type so staff can finish with one click.'
      )}
      onClose={onClose}
      closeLabel={translateWithFallback(t, 'closeDialog', 'Close')}
      widthClassName="max-w-4xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.templateNameLabel', 'Template name')}
            </span>
            <input
              value={formData.name}
              onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
              placeholder="Standard room cleaning"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.serviceTypeLabel', 'Service type')}
            </span>
            <select
              value={formData.serviceType}
              onChange={(event) => setFormData((current) => ({ ...current, serviceType: event.target.value }))}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
            >
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {humanizeEnum(type)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.roomTypeLabel', 'Room type')}
            </span>
            <select
              value={formData.roomTypeId}
              onChange={(event) => setFormData((current) => ({ ...current, roomTypeId: event.target.value }))}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
            >
              <option value="">
                {translateWithFallback(t, 'inventoryPage.allRoomTypesLabel', 'All room types')}
              </option>
              {roomTypes.map((roomType) => (
                <option key={roomType.id} value={roomType.id}>
                  {roomType.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-4 md:mt-7">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(event) => setFormData((current) => ({ ...current, active: event.target.checked }))}
              className="h-4 w-4 rounded border-brand-surface-border"
            />
            <span className="text-sm font-medium text-brand-ink">
              {translateWithFallback(t, 'inventoryPage.activeTemplateLabel', 'Template is active')}
            </span>
          </label>
        </div>

        <label className="space-y-2 flex flex-col">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
            {translateWithFallback(t, 'inventoryPage.notesLabel', 'Notes')}
          </span>
          <Textarea
            value={formData.notes}
            onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
            rows={3}
            className="w-full rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3 text-sm font-medium text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/5"
          />
        </label>

        <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-brand-ink">
                {translateWithFallback(t, 'inventoryPage.templateItemsTitle', 'Standard items')}
              </p>
              <p className="text-sm font-medium text-brand-ink-muted">
                {translateWithFallback(
                  t,
                  'inventoryPage.templateItemsDescription',
                  'These quantities will be suggested automatically whenever this service is completed.'
                )}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleAddTemplateItem} className="border-brand-surface-border">
              {translateWithFallback(t, 'inventoryPage.addItemAction', 'Add item')}
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {formData.items.map((item, index) => (
              <div key={`${item.inventoryItemId}-${index}`} className="grid gap-3 rounded-[1.25rem] border border-brand-surface-border bg-white p-4 md:grid-cols-[1.2fr_0.8fr_auto]">
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                    {translateWithFallback(t, 'inventoryPage.itemNameLabel', 'Item')}
                  </span>
                  <select
                    value={item.inventoryItemId}
                    onChange={(event) =>
                      handleTemplateItemChange(index, 'inventoryItemId', Number(event.target.value))
                    }
                    className="h-11 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
                  >
                    {[...inventoryItems]
                      .sort((left, right) => left.name.localeCompare(right.name))
                      .map((inventoryItem) => (
                        <option key={inventoryItem.id} value={inventoryItem.id}>
                          {inventoryItem.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                    {translateWithFallback(t, 'inventoryPage.standardQuantityLabel', 'Standard quantity')}
                  </span>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={item.standardQuantity}
                    onChange={(event) =>
                      handleTemplateItemChange(index, 'standardQuantity', event.target.value)
                    }
                    className="h-11 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveTemplateItem(index)}
                    className="h-11 rounded-full border border-brand-danger/30 bg-brand-danger/10 px-4 text-sm font-bold text-brand-danger"
                  >
                    {translateWithFallback(t, 'inventoryPage.removeItemAction', 'Remove')}
                  </button>
                </div>
              </div>
            ))}

            {formData.items.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-brand-surface-border bg-white px-4 py-5 text-sm font-medium text-brand-ink-muted">
                {translateWithFallback(
                  t,
                  'inventoryPage.noTemplateItemsDescription',
                  'Add at least one standard item to make this template usable.'
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-full border border-brand-surface-border px-5 py-3 text-sm font-bold text-brand-ink">
            {translateWithFallback(t, 'cancel', 'Cancel')}
          </button>
          <button type="submit" disabled={saving} className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted">
            {saving ? translateWithFallback(t, 'saving', 'Saving...') : translateWithFallback(t, 'save', 'Save')}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

export default function InventoryOperationsPanel({ filters, t, language }) {
  const [summary, setSummary] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [itemModal, setItemModal] = useState(null);
  const [restockItem, setRestockItem] = useState(null);
  const [adjustmentItem, setAdjustmentItem] = useState(null);
  const [templateModal, setTemplateModal] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [restockForm, setRestockForm] = useState(emptyRestockForm);
  const [adjustmentForm, setAdjustmentForm] = useState(emptyAdjustmentForm);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inventorySummary, items, templateList, roomTypeList] = await Promise.all([
        getInventorySummary(filters),
        getInventoryItems(),
        getServiceUsageTemplates(),
        getInventoryRoomTypes(),
      ]);
      setSummary(inventorySummary);
      setInventoryItems(Array.isArray(items) ? items : []);
      setTemplates(Array.isArray(templateList) ? templateList : []);
      setRoomTypes(Array.isArray(roomTypeList) ? roomTypeList : []);
    } catch (err) {
      setError(extractInventoryError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate]);

  const metricCards = useMemo(
    () => [
      {
        label: translateWithFallback(t, 'inventoryPage.inventoryValueMetric', 'Inventory Value'),
        value: formatLocalizedCurrency(summary?.currentInventoryValue ?? 0, language),
        icon: Archive,
        tone: 'emerald',
      },
      {
        label: translateWithFallback(t, 'inventoryPage.purchaseSpendMetric', 'Purchase Spend'),
        value: formatLocalizedCurrency(summary?.totalPurchaseSpend ?? 0, language),
        icon: PackagePlus,
        tone: 'amber',
      },
      {
        label: translateWithFallback(t, 'inventoryPage.consumptionMetric', 'Consumption Value'),
        value: formatLocalizedCurrency(summary?.totalConsumptionValue ?? 0, language),
        icon: ClipboardList,
        tone: 'sky',
      },
      {
        label: translateWithFallback(t, 'inventoryPage.lowStockMetric', 'Low Stock'),
        value: formatLocalizedNumber(summary?.lowStockCount ?? 0, language),
        icon: TriangleAlert,
        tone: 'rose',
      },
    ],
    [summary, t, language]
  );

  const openCreateItemModal = () => {
    setItemForm(emptyItemForm());
    setFormError(null);
    setItemModal({ mode: 'create', item: null });
  };

  const openEditItemModal = (item) => {
    setItemForm({
      name: item.name,
      category: item.category,
      unitOfMeasure: item.unitOfMeasure,
      minimumStockThreshold: String(item.minimumStockThreshold ?? 0),
      defaultUnitCost: String(item.defaultUnitCost ?? 0),
      initialStockQuantity: '0',
      supplier: item.supplier ?? '',
      sku: item.sku ?? '',
      active: Boolean(item.active),
      notes: item.notes ?? '',
    });
    setFormError(null);
    setItemModal({ mode: 'edit', item });
  };

  const openRestockModal = (item) => {
    setRestockItem(item);
    setRestockForm({
      ...emptyRestockForm(),
      unitCost: String(item.defaultUnitCost ?? item.averageUnitCost ?? 0),
      supplier: item.supplier ?? '',
    });
    setFormError(null);
  };

  const openAdjustmentModal = (item) => {
    setAdjustmentItem(item);
    setAdjustmentForm(emptyAdjustmentForm());
    setFormError(null);
  };

  const openCreateTemplateModal = () => {
    setTemplateForm(emptyTemplateForm());
    setFormError(null);
    setTemplateModal({ mode: 'create', template: null });
  };

  const openEditTemplateModal = (template) => {
    setTemplateForm({
      name: template.name,
      serviceType: template.serviceType,
      roomTypeId: template.roomTypeId ?? '',
      active: Boolean(template.active),
      notes: template.notes ?? '',
      items: Array.isArray(template.items)
        ? template.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            standardQuantity: String(item.standardQuantity ?? 0),
            notes: item.notes ?? '',
            active: Boolean(item.active),
          }))
        : [],
    });
    setFormError(null);
    setTemplateModal({ mode: 'edit', template });
  };

  const handleItemSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...itemForm,
        minimumStockThreshold: Number(itemForm.minimumStockThreshold),
        defaultUnitCost: Number(itemForm.defaultUnitCost),
        initialStockQuantity: Number(itemForm.initialStockQuantity),
      };

      if (itemModal?.mode === 'edit' && itemModal.item) {
        await updateInventoryItem(itemModal.item.id, payload);
      } else {
        await createInventoryItem(payload);
      }
      setItemModal(null);
      await loadData();
    } catch (err) {
      setFormError(extractInventoryError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRestockSubmit = async (event) => {
    event.preventDefault();
    if (!restockItem) return;
    setSaving(true);
    setFormError(null);
    try {
      await restockInventoryItem(restockItem.id, {
        ...restockForm,
        quantity: Number(restockForm.quantity),
        unitCost: Number(restockForm.unitCost),
      });
      setRestockItem(null);
      await loadData();
    } catch (err) {
      setFormError(extractInventoryError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustmentSubmit = async (event) => {
    event.preventDefault();
    if (!adjustmentItem) return;
    setSaving(true);
    setFormError(null);
    try {
      await adjustInventoryItem(adjustmentItem.id, {
        ...adjustmentForm,
        quantityChange: Number(adjustmentForm.quantityChange),
        unitCost: Number(adjustmentForm.unitCost),
      });
      setAdjustmentItem(null);
      await loadData();
    } catch (err) {
      setFormError(extractInventoryError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...templateForm,
        roomTypeId: templateForm.roomTypeId ? Number(templateForm.roomTypeId) : null,
        items: templateForm.items.map((item) => ({
          inventoryItemId: Number(item.inventoryItemId),
          standardQuantity: Number(item.standardQuantity),
          notes: item.notes,
          active: item.active,
        })),
      };

      if (templateModal?.mode === 'edit' && templateModal.template) {
        await updateServiceUsageTemplate(templateModal.template.id, payload);
      } else {
        await createServiceUsageTemplate(payload);
      }
      setTemplateModal(null);
      await loadData();
    } catch (err) {
      setFormError(extractInventoryError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPanel
        title={translateWithFallback(t, 'inventoryPage.workspaceTitle', 'Inventory & Automation')}
        description={translateWithFallback(
          t,
          'inventoryPage.workspaceDescription',
          'Track stock, standard room-service usage, and operational consumption without duplicating expense totals.'
        )}
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={loadData} className="border-brand-surface-border">
              {translateWithFallback(t, 'retry', 'Refresh')}
            </Button>
            <Button type="button" onClick={openCreateItemModal} className="bg-brand-primary text-white hover:bg-brand-primary-deep">
              {translateWithFallback(t, 'inventoryPage.addItemAction', 'Add item')}
            </Button>
          </div>
        }
      >
        {loading ? (
          <LoadingState message={translateWithFallback(t, 'inventoryPage.loading', 'Loading inventory...')} />
        ) : error ? (
          <ErrorState
            title={translateWithFallback(t, 'inventoryPage.workspaceTitle', 'Inventory & Automation')}
            message={error}
            onRetry={loadData}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((card) => (
                <DashboardMetricCard key={card.label} {...card} />
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <DashboardPanel
                title={translateWithFallback(t, 'inventoryPage.itemsTitle', 'Inventory Items')}
                description={translateWithFallback(
                  t,
                  'inventoryPage.itemsDescription',
                  'Use quick restock and manual correction actions to keep stock accurate with minimal data entry.'
                )}
              >
                {inventoryItems.length === 0 ? (
                  <EmptyState
                    title={translateWithFallback(t, 'inventoryPage.emptyItemsTitle', 'No inventory items yet')}
                    message={translateWithFallback(
                      t,
                      'inventoryPage.emptyItemsDescription',
                      'Create the first operational item to start tracking supplies and automatic room consumption.'
                    )}
                    icon={Archive}
                  />
                ) : (
                  <div className="space-y-3">
                    {inventoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[1.35rem] border border-brand-surface-border bg-white p-4 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.22)]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black tracking-tight text-brand-ink">{item.name}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-muted">
                              <span className="rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1">
                                {humanizeEnum(item.category)}
                              </span>
                              <span className="rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1">
                                {humanizeEnum(item.unitOfMeasure)}
                              </span>
                              {item.lowStock ? (
                                <span className="rounded-full border border-brand-danger/30 bg-brand-danger/10 px-3 py-1 text-brand-danger">
                                  {translateWithFallback(t, 'inventoryPage.lowStockBadge', 'Low stock')}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                              {translateWithFallback(t, 'inventoryPage.stockOnHandLabel', 'On hand')}
                            </p>
                            <p className="mt-2 text-2xl font-black text-brand-ink">
                              {formatLocalizedNumber(item.currentStockQuantity, language)}
                            </p>
                            <p className="text-sm font-medium text-brand-ink-muted">
                              {translateWithFallback(
                                t,
                                'inventoryPage.avgUnitCostLabel',
                                'Avg cost {{value}}',
                                { value: formatLocalizedCurrency(item.averageUnitCost, language) }
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm font-medium text-brand-ink-muted md:grid-cols-3">
                          <p>
                            {translateWithFallback(
                              t,
                              'inventoryPage.minimumThresholdCopy',
                              'Minimum stock: {{value}}',
                              { value: formatLocalizedNumber(item.minimumStockThreshold, language) }
                            )}
                          </p>
                          <p>
                            {translateWithFallback(
                              t,
                              'inventoryPage.supplierCopy',
                              'Supplier: {{value}}',
                              { value: item.supplier || '-' }
                            )}
                          </p>
                          <p>
                            {translateWithFallback(
                              t,
                              'inventoryPage.skuCopy',
                              'SKU: {{value}}',
                              { value: item.sku || '-' }
                            )}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openRestockModal(item)}
                            className="rounded-full border border-brand-success/30 bg-brand-success/10 px-4 py-2 text-sm font-bold text-brand-success"
                          >
                            {translateWithFallback(t, 'inventoryPage.restockAction', 'Restock')}
                          </button>
                          <button
                            type="button"
                            onClick={() => openAdjustmentModal(item)}
                            className="rounded-full border border-brand-surface-border bg-brand-surface-light px-4 py-2 text-sm font-bold text-brand-ink"
                          >
                            {translateWithFallback(t, 'inventoryPage.adjustStockAction', 'Adjust stock')}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditItemModal(item)}
                            className="rounded-full border border-brand-surface-border bg-brand-surface-light px-4 py-2 text-sm font-bold text-brand-ink"
                          >
                            {translateWithFallback(t, 'editStaff', 'Edit')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DashboardPanel>

              <div className="space-y-6">
                <DashboardPanel
                  title={translateWithFallback(t, 'inventoryPage.lowStockTitle', 'Low Stock Watch')}
                  description={translateWithFallback(
                    t,
                    'inventoryPage.lowStockDescription',
                    'These items are already at or below their minimum threshold.'
                  )}
                >
                  {summary?.lowStockItems?.length ? (
                    <div className="space-y-3">
                      {summary.lowStockItems.map((item) => (
                        <div key={item.id} className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 p-4">
                          <p className="text-sm font-black text-brand-ink">{item.name}</p>
                          <p className="mt-1 text-sm font-medium text-brand-danger/80">
                            {translateWithFallback(
                              t,
                              'inventoryPage.lowStockCopy',
                              '{{current}} on hand · minimum {{minimum}}',
                              {
                                current: formatLocalizedNumber(item.currentStockQuantity, language),
                                minimum: formatLocalizedNumber(item.minimumStockThreshold, language),
                              }
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title={translateWithFallback(t, 'inventoryPage.lowStockEmptyTitle', 'No low-stock items')}
                      message={translateWithFallback(
                        t,
                        'inventoryPage.lowStockEmptyDescription',
                        'Current stock is above the configured minimum thresholds.'
                      )}
                      icon={TriangleAlert}
                    />
                  )}
                </DashboardPanel>

                <DashboardPanel
                  title={translateWithFallback(t, 'inventoryPage.topConsumedTitle', 'Top Consumed Items')}
                  description={translateWithFallback(
                    t,
                    'inventoryPage.topConsumedDescription',
                    'See which supplies are driving the highest operational usage value in the active period.'
                  )}
                >
                  {summary?.topConsumedItems?.length ? (
                    <div className="space-y-3">
                      {summary.topConsumedItems.slice(0, 6).map((item) => (
                        <div key={item.key} className="rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black text-brand-ink">{item.label}</p>
                            <p className="text-sm font-black text-brand-ink">
                              {formatLocalizedCurrency(item.totalValue, language)}
                            </p>
                          </div>
                          <p className="mt-2 text-sm font-medium text-brand-ink-muted">
                            {translateWithFallback(
                              t,
                              'inventoryPage.topConsumedCopy',
                              '{{quantity}} units used across {{count}} records',
                              {
                                quantity: formatLocalizedNumber(item.totalQuantity, language),
                                count: formatLocalizedNumber(item.recordCount, language),
                              }
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title={translateWithFallback(t, 'inventoryPage.topConsumedEmptyTitle', 'No consumption tracked')}
                      message={translateWithFallback(
                        t,
                        'inventoryPage.topConsumedEmptyDescription',
                        'Service usage records will populate this view after the first cleaning or maintenance completion.'
                      )}
                      icon={ClipboardList}
                    />
                  )}
                </DashboardPanel>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <DashboardPanel
                title={translateWithFallback(t, 'inventoryPage.templatesTitle', 'Usage Templates')}
                description={translateWithFallback(
                  t,
                  'inventoryPage.templatesDescription',
                  'Templates power one-click service completion by preloading standard operational items.'
                )}
                action={
                  <Button type="button" variant="outline" onClick={openCreateTemplateModal} className="border-brand-surface-border">
                    {translateWithFallback(t, 'inventoryPage.addTemplateAction', 'Add template')}
                  </Button>
                }
              >
                {templates.length === 0 ? (
                  <EmptyState
                    title={translateWithFallback(t, 'inventoryPage.emptyTemplatesTitle', 'No templates yet')}
                    message={translateWithFallback(
                      t,
                      'inventoryPage.emptyTemplatesDescription',
                      'Create a cleaning or maintenance template to automate stock deduction and service costing.'
                    )}
                    icon={Wrench}
                  />
                ) : (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div key={template.id} className="rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-brand-ink">{template.name}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-ink-hint">
                              {humanizeEnum(template.serviceType)}
                              {template.roomTypeName ? ` · ${template.roomTypeName}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openEditTemplateModal(template)}
                            className="rounded-full border border-brand-surface-border bg-white px-4 py-2 text-sm font-bold text-brand-ink"
                          >
                            {translateWithFallback(t, 'editStaff', 'Edit')}
                          </button>
                        </div>
                        <p className="mt-3 text-sm font-medium text-brand-ink-muted">
                          {translateWithFallback(
                            t,
                            'inventoryPage.templateItemCountCopy',
                            '{{count}} standard items',
                            { count: formatLocalizedNumber(template.items?.length ?? 0, language) }
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </DashboardPanel>

              <DashboardPanel
                title={translateWithFallback(t, 'inventoryPage.recentUsageTitle', 'Recent Service Usage')}
                description={translateWithFallback(
                  t,
                  'inventoryPage.recentUsageDescription',
                  'Review the latest automated cleaning and maintenance deductions tied to completed room work.'
                )}
              >
                {summary?.recentUsageRecords?.length ? (
                  <div className="space-y-3">
                    {summary.recentUsageRecords.slice(0, 6).map((record) => (
                      <div key={record.id} className="rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-brand-ink">
                              {record.roomNumber ? `Room ${record.roomNumber}` : translateWithFallback(t, 'inventoryPage.generalUsageLabel', 'General service')}
                            </p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-ink-hint">
                              {humanizeEnum(record.serviceType)}
                            </p>
                          </div>
                          <p className="text-sm font-black text-brand-ink">
                            {formatLocalizedCurrency(record.totalCost, language)}
                          </p>
                        </div>
                        <p className="mt-3 text-sm font-medium text-brand-ink-muted">
                          {formatLocalizedDateTime(record.performedAt, language)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={translateWithFallback(t, 'inventoryPage.recentUsageEmptyTitle', 'No usage history yet')}
                    message={translateWithFallback(
                      t,
                      'inventoryPage.recentUsageEmptyDescription',
                      'Completed room services will appear here after standard usage begins flowing through the room board.'
                    )}
                    icon={ClipboardList}
                  />
                )}
              </DashboardPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <DashboardPanel
                title={translateWithFallback(t, 'inventoryPage.movementsTitle', 'Recent Stock Movements')}
                description={translateWithFallback(
                  t,
                  'inventoryPage.movementsDescription',
                  'Every stock change is tracked so managers can separate purchases from actual operational use.'
                )}
              >
                {summary?.recentTransactions?.length ? (
                  <div className="space-y-3">
                    {summary.recentTransactions.slice(0, 8).map((transaction) => (
                      <div key={transaction.id} className="rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-brand-ink">{transaction.itemName}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-ink-hint">
                              {humanizeEnum(transaction.transactionType)}
                            </p>
                          </div>
                          <p className="text-sm font-black text-brand-ink">
                            {formatLocalizedNumber(transaction.quantityChange, language)}
                          </p>
                        </div>
                        <p className="mt-2 text-sm font-medium text-brand-ink-muted">
                          {formatLocalizedDateTime(transaction.occurredAt, language)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={translateWithFallback(t, 'inventoryPage.movementsEmptyTitle', 'No stock movements yet')}
                    message={translateWithFallback(
                      t,
                      'inventoryPage.movementsEmptyDescription',
                      'Restocks, service usage, and manual adjustments will appear here.'
                    )}
                    icon={PackagePlus}
                  />
                )}
              </DashboardPanel>

              <DashboardPanel
                title={translateWithFallback(t, 'inventoryPage.reportingTitle', 'Operational Reporting')}
                description={translateWithFallback(
                  t,
                  'inventoryPage.reportingDescription',
                  'Track consumption by category, room type, and service type without rolling it into cash expense totals twice.'
                )}
              >
                <div className="space-y-6">
                  <div className="rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light p-4">
                    <p className="text-sm font-black text-brand-ink">
                      {translateWithFallback(t, 'inventoryPage.categoryUsageTitle', 'Usage by category')}
                    </p>
                    <div className="mt-4">
                      {summary?.usageByCategory?.length ? (
                        <DistributionBarChart
                          data={summary.usageByCategory.slice(0, 5).map((item) => ({
                            name: humanizeEnum(item.label),
                            value: Number(item.totalValue ?? 0),
                          }))}
                          labelKey="name"
                          valueKey="value"
                          valueFormatter={(val) => formatLocalizedCurrency(val, language)}
                          layout="vertical"
                          height={220}
                          colors={['#264B6B', '#264B6B', '#A32D2D', '#264B6B', '#BA7517']}
                        />
                      ) : (
                        <div className="py-8 text-center text-sm font-medium text-brand-ink-muted">
                          {translateWithFallback(t, 'inventoryPage.noCategoryData', 'No category data available.')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light p-4">
                    <p className="text-sm font-black text-brand-ink">
                      {translateWithFallback(t, 'inventoryPage.serviceUsageTitle', 'Usage by service type')}
                    </p>
                    <div className="mt-4">
                      {summary?.usageByServiceType?.length ? (
                        <DistributionBarChart
                          data={summary.usageByServiceType.slice(0, 5).map((item) => ({
                            name: humanizeEnum(item.label),
                            value: Number(item.averageCost ?? 0),
                          }))}
                          labelKey="name"
                          valueKey="value"
                          valueFormatter={(val) => formatLocalizedCurrency(val, language)}
                          layout="horizontal"
                          height={220}
                          colors={['#264B6B', '#264B6B', '#BA7517', '#264B6B', '#A32D2D']}
                        />
                      ) : (
                        <div className="py-8 text-center text-sm font-medium text-brand-ink-muted">
                          {translateWithFallback(t, 'inventoryPage.noServiceData', 'No service data available.')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DashboardPanel>
            </div>
          </div>
        )}
      </DashboardPanel>

      {itemModal ? (
        <InventoryItemModal
          formData={itemForm}
          setFormData={setItemForm}
          onClose={() => setItemModal(null)}
          onSubmit={handleItemSubmit}
          saving={saving}
          error={formError}
          editing={itemModal.mode === 'edit'}
          t={t}
        />
      ) : null}

      {restockItem ? (
        <RestockModal
          item={restockItem}
          formData={restockForm}
          setFormData={setRestockForm}
          onClose={() => setRestockItem(null)}
          onSubmit={handleRestockSubmit}
          saving={saving}
          error={formError}
          t={t}
        />
      ) : null}

      {adjustmentItem ? (
        <AdjustmentModal
          item={adjustmentItem}
          formData={adjustmentForm}
          setFormData={setAdjustmentForm}
          onClose={() => setAdjustmentItem(null)}
          onSubmit={handleAdjustmentSubmit}
          saving={saving}
          error={formError}
          t={t}
        />
      ) : null}

      {templateModal ? (
        <TemplateModal
          formData={templateForm}
          setFormData={setTemplateForm}
          inventoryItems={inventoryItems}
          roomTypes={roomTypes}
          onClose={() => setTemplateModal(null)}
          onSubmit={handleTemplateSubmit}
          saving={saving}
          error={formError}
          editing={templateModal.mode === 'edit'}
          t={t}
        />
      ) : null}
    </div>
  );
}
