import { useEffect, useMemo, useState } from 'react';
import ModalFrame from '../common/ModalFrame';
import { Button } from '../ui/button';
import {
  completeRoomService,
  extractInventoryError,
  getInventoryItems,
  previewRoomService,
} from '../../services/inventoryService';
import {
  formatLocalizedCurrency,
  formatLocalizedNumber,
  translateWithFallback,
  translateKnownValue,
} from '../../utils/localization';

const CLEANING_SERVICE_TYPES = [
  'STANDARD_ROOM_CLEANING',
  'DEEP_CLEANING',
  'CHECKOUT_CLEANING',
  'BATHROOM_REFRESH',
];

const MAINTENANCE_SERVICE_TYPES = ['MAINTENANCE_VISIT', 'REPAIR_VISIT'];

const humanizeEnum = (value) =>
  String(value ?? '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getServiceTypeLabel = (value, t) =>
  translateWithFallback(
    t,
    `inventoryPage.serviceTypes.${String(value || '').toLowerCase()}`,
    humanizeEnum(value)
  );

const getDefaultServiceType = (room) =>
  room?.status === 'UNDER_MAINTENANCE' ? 'MAINTENANCE_VISIT' : 'STANDARD_ROOM_CLEANING';

const getAllowedServiceTypes = (room) =>
  room?.status === 'UNDER_MAINTENANCE' ? MAINTENANCE_SERVICE_TYPES : CLEANING_SERVICE_TYPES;

const normalizePreviewItems = (items = []) =>
  items.map((item) => ({
    inventoryItemId: item.inventoryItemId,
    inventoryItemName: item.inventoryItemName,
    category: item.category,
    unitOfMeasure: item.unitOfMeasure,
    standardQuantity: Number(item.standardQuantity ?? 0),
    actualQuantity: Number(item.actualQuantity ?? 0),
    currentStockQuantity: Number(item.currentStockQuantity ?? 0),
    estimatedCost: Number(item.estimatedCost ?? 0),
  }));

export default function ServiceCompletionModal({
  room,
  onClose,
  onCompleted,
  t,
  language,
}) {
  const [serviceType, setServiceType] = useState(getDefaultServiceType(room));
  const [items, setItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemQuantity, setSelectedItemQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [preview, inventory] = await Promise.all([
          previewRoomService(room.id, { serviceType }),
          getInventoryItems({ activeOnly: true }),
        ]);

        if (!active) return;
        setItems(normalizePreviewItems(preview.items));
        setWarnings(Array.isArray(preview.warnings) ? preview.warnings : []);
        setAvailableItems(Array.isArray(inventory) ? inventory : []);
      } catch (err) {
        if (!active) return;
        setError(extractInventoryError(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [room.id, serviceType]);

  const selectableItems = useMemo(
    () =>
      availableItems.filter(
        (item) => !items.some((usageItem) => usageItem.inventoryItemId === item.id)
      ),
    [availableItems, items]
  );

  const totalEstimatedCost = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.estimatedCost ?? 0), 0),
    [items]
  );

  const handleQuantityChange = (inventoryItemId, nextValue) => {
    const numeric = Number(nextValue);
    setItems((current) =>
      current.map((item) => {
        if (item.inventoryItemId !== inventoryItemId) return item;
        const matchedInventoryItem = availableItems.find((candidate) => candidate.id === inventoryItemId);
        const unitCost = Number(matchedInventoryItem?.averageUnitCost ?? 0);
        return {
          ...item,
          actualQuantity: Number.isFinite(numeric) ? numeric : 0,
          estimatedCost: Number.isFinite(numeric) ? numeric * unitCost : 0,
        };
      })
    );
  };

  const handleAddItem = () => {
    const inventoryItemId = Number(selectedItemId);
    const actualQuantity = Number(selectedItemQuantity);
    if (!inventoryItemId || !Number.isFinite(actualQuantity) || actualQuantity <= 0) {
      return;
    }

    const inventoryItem = availableItems.find((item) => item.id === inventoryItemId);
    if (!inventoryItem) return;

    setItems((current) => [
      ...current,
      {
        inventoryItemId: inventoryItem.id,
        inventoryItemName: inventoryItem.name,
        category: inventoryItem.category,
        unitOfMeasure: inventoryItem.unitOfMeasure,
        standardQuantity: 0,
        actualQuantity,
        currentStockQuantity: Number(inventoryItem.currentStockQuantity ?? 0),
        estimatedCost: actualQuantity * Number(inventoryItem.averageUnitCost ?? 0),
      },
    ]);
    setSelectedItemId('');
    setSelectedItemQuantity('1');
  };

  const handleRemoveItem = (inventoryItemId) => {
    setItems((current) => current.filter((item) => item.inventoryItemId !== inventoryItemId));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        serviceType,
        applyStandardTemplate: true,
        notes: notes.trim(),
        items: items
          .filter((item) => Number(item.actualQuantity) > 0)
          .map((item) => ({
            inventoryItemId: item.inventoryItemId,
            actualQuantity: Number(item.actualQuantity),
          })),
      };

      const response = await completeRoomService(room.id, payload);
      onCompleted?.(response);
    } catch (err) {
      setError(extractInventoryError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalFrame
      title={translateWithFallback(t, 'inventoryPage.completeServiceTitle', 'Complete Service')}
      description={translateWithFallback(
        t,
        'inventoryPage.completeServiceDescription',
        'Apply the standard usage, adjust actual quantities when needed, and move the room back into service.'
      )}
      onClose={onClose}
      closeLabel={translateWithFallback(t, 'closeDialog', 'Close')}
      widthClassName="max-w-4xl"
    >
      {loading ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-brand-ink-muted">
            {translateWithFallback(t, 'inventoryPage.loadingServicePreview', 'Loading service usage...')}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                {translateWithFallback(t, 'inventoryPage.roomLabel', 'Room')}
              </p>
              <p className="mt-2 text-lg font-black text-brand-ink">{room.roomNumber}</p>
              <p className="mt-1 text-sm font-medium text-brand-ink-muted">
                {translateKnownValue(room.roomType?.name, t)}
              </p>
            </div>
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                {translateWithFallback(t, 'inventoryPage.serviceTypeLabel', 'Service type')}
              </span>
              <select
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
                className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink"
              >
                {getAllowedServiceTypes(room).map((value) => (
                  <option key={value} value={value}>
                    {getServiceTypeLabel(value, t)}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                {translateWithFallback(t, 'inventoryPage.estimatedCostLabel', 'Estimated cost')}
              </p>
              <p className="mt-2 text-lg font-black text-brand-ink">
                {formatLocalizedCurrency(totalEstimatedCost, language)}
              </p>
            </div>
          </div>

          {warnings.length ? (
            <div className="rounded-[1.25rem] border border-brand-warning/30 bg-brand-warning/10 px-4 py-3 text-sm font-medium text-brand-warning">
              {warnings.join(' · ')}
            </div>
          ) : null}

          <div className="rounded-[1.5rem] border border-brand-surface-border bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-brand-ink">
                  {translateWithFallback(t, 'inventoryPage.actualUsageTitle', 'Actual usage')}
                </p>
                <p className="text-sm font-medium text-brand-ink-muted">
                  {translateWithFallback(
                    t,
                    'inventoryPage.actualUsageDescription',
                    'Accept the standard quantities or adjust them before finalizing the service.'
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-brand-surface-border bg-brand-surface-light px-4 py-5 text-sm font-medium text-brand-ink-muted">
                  {translateWithFallback(
                    t,
                    'inventoryPage.noUsageItemsDescription',
                    'No standard items were found for this service. Add the actual items used below.'
                  )}
                </div>
              ) : null}

              {items.map((item) => (
                <div
                  key={item.inventoryItemId}
                  className="grid gap-3 rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light p-4 md:grid-cols-[1.3fr_0.9fr_0.9fr_auto]"
                >
                  <div>
                    <p className="text-sm font-black text-brand-ink">{item.inventoryItemName}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-ink-hint">
                      {humanizeEnum(item.category)} · {humanizeEnum(item.unitOfMeasure)}
                    </p>
                    <p className="mt-2 text-xs font-medium text-brand-ink-muted">
                      {translateWithFallback(
                        t,
                        'inventoryPage.standardUsageLabel',
                        'Standard: {{value}}',
                        { value: formatLocalizedNumber(item.standardQuantity, language) }
                      )}{' '}
                      ·{' '}
                      {translateWithFallback(
                        t,
                        'inventoryPage.stockOnHandLabel',
                        'On hand: {{value}}',
                        { value: formatLocalizedNumber(item.currentStockQuantity, language) }
                      )}
                    </p>
                  </div>

                  <label className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                      {translateWithFallback(t, 'inventoryPage.actualQuantityLabel', 'Actual quantity')}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={item.actualQuantity}
                      onChange={(event) =>
                        handleQuantityChange(item.inventoryItemId, event.target.value)
                      }
                      className="h-11 w-full rounded-full border border-brand-surface-border bg-white px-4 text-sm font-medium text-brand-ink"
                    />
                  </label>

                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                      {translateWithFallback(t, 'inventoryPage.itemCostLabel', 'Estimated cost')}
                    </span>
                    <div className="flex h-11 items-center rounded-full border border-brand-surface-border bg-white px-4 text-sm font-bold text-brand-ink">
                      {formatLocalizedCurrency(item.estimatedCost, language)}
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.inventoryItemId)}
                      className="h-11 rounded-full border border-brand-danger/30 bg-brand-danger/10 px-4 text-sm font-bold text-brand-danger"
                    >
                      {translateWithFallback(t, 'inventoryPage.removeItemAction', 'Remove')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light p-4 md:grid-cols-[1.2fr_0.8fr_auto]">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                  {translateWithFallback(t, 'inventoryPage.addItemLabel', 'Add extra item')}
                </span>
                <select
                  value={selectedItemId}
                  onChange={(event) => setSelectedItemId(event.target.value)}
                  className="h-11 w-full rounded-full border border-brand-surface-border bg-white px-4 text-sm font-medium text-brand-ink"
                >
                  <option value="">
                    {translateWithFallback(t, 'inventoryPage.selectInventoryItem', 'Select inventory item')}
                  </option>
                  {selectableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                  {translateWithFallback(t, 'inventoryPage.addQuantityLabel', 'Quantity')}
                </span>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={selectedItemQuantity}
                  onChange={(event) => setSelectedItemQuantity(event.target.value)}
                  className="h-11 w-full rounded-full border border-brand-surface-border bg-white px-4 text-sm font-medium text-brand-ink"
                />
              </label>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  className="h-11 border-brand-surface-border"
                >
                  {translateWithFallback(t, 'inventoryPage.addItemAction', 'Add item')}
                </Button>
              </div>
            </div>
          </div>

          <label className="space-y-2 flex flex-col">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {translateWithFallback(t, 'inventoryPage.notesLabel', 'Notes')}
            </span>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="w-full rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3 text-sm font-medium text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/5"
              placeholder={translateWithFallback(
                t,
                'inventoryPage.serviceNotesPlaceholder',
                'Optional completion notes or usage exceptions'
              )}
            />
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-surface-border px-5 py-3 text-sm font-bold text-brand-ink"
            >
              {translateWithFallback(t, 'cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted"
            >
              {saving
                ? translateWithFallback(t, 'saving', 'Saving...')
                : translateWithFallback(
                    t,
                    'inventoryPage.completeServiceAction',
                    'Complete Service'
                  )}
            </button>
          </div>
        </form>
      )}
    </ModalFrame>
  );
}
