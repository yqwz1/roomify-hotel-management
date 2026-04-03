import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  FilePlus2,
  Mail,
  Printer,
  Receipt,
  Send,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ConfirmationToast from '../components/ConfirmationToast';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import { Button } from '../components/ui/button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { LtrText } from '../components/LtrText';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import {
  generateInvoice,
  getInvoiceDeliveryStatus,
  getInvoicePdf,
} from '../services/invoiceService';
import {
  extractReservationError,
  getBill,
  getReservationByConfirmationNumber,
} from '../services/reservationService';
import { useTranslation } from 'react-i18next';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  formatLocalizedDateTime,
  getBooleanLabel,
  getInvoiceDeliveryStatusLabel,
  translateKnownValue,
} from '../utils/localization';

function DeliveryBadge({ deliveryStatus, invoiceFinalized, deliveryMeta, t }) {
  if (!invoiceFinalized) {
    return (
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-900">
        {t('invoicePreviewPage.notFinalized')}
      </span>
    );
  }

  if (deliveryStatus === 'LOADING') {
    return (
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
        {t('invoicePreviewPage.loadingDelivery')}
      </span>
    );
  }

  if (deliveryStatus === 'SENT') {
    return (
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-900">
        {t('invoicePreviewPage.delivered')}
      </span>
    );
  }

  if (deliveryStatus === 'FAILED') {
    return (
        <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-rose-900">
        {t('invoicePreviewPage.deliveryFailed')}
        {deliveryMeta?.errorMessage ? `: ${deliveryMeta.errorMessage}` : ''}
      </span>
    );
  }

  if (deliveryStatus === 'ERROR') {
    return (
        <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-rose-900">
        {t('invoicePreviewPage.deliveryUnavailable')}
      </span>
    );
  }

  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
      {t('invoicePreviewPage.deliveryPending')}
    </span>
  );
}

function InvoiceLedger({ bill, t, language }) {
  if (!bill) {
    return (
      <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center">
        <p className="text-sm font-bold text-zinc-950">{t('invoicePreviewPage.noDataTitle')}</p>
        <p className="mt-2 text-sm font-medium text-zinc-500">
          {t('invoicePreviewPage.noDataDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200">
      <table className="w-full border-collapse">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
              {t('invoicePreviewPage.descriptionLabel')}
            </th>
            <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
              {t('invoicePreviewPage.amountLabel')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white">
          {(bill.lineItems ?? []).map((item, index) => {
            const amount = Number(item?.amount ?? 0);
            const credit = Boolean(item?.credit);

            return (
              <tr key={`${item?.label ?? 'line'}-${index}`}>
                <td className="px-4 py-3 text-sm font-medium text-zinc-700">
                  {item?.label ? translateKnownValue(item.label, t) : t('checkoutPage.lineItemFallback')}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-zinc-950">
                  {credit
                    ? `-${formatLocalizedCurrency(amount, language)}`
                    : formatLocalizedCurrency(amount, language)}
                </td>
              </tr>
            );
          })}
          <tr className="bg-zinc-50">
            <td className="px-4 py-3 text-sm font-bold text-zinc-950">{t('common.total')}</td>
            <td className="px-4 py-3 text-right text-lg font-black text-zinc-950">
              {formatLocalizedCurrency(bill.balanceDue, language)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function InvoicePreview() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState('IDLE');
  const [deliveryMeta, setDeliveryMeta] = useState({ errorMessage: null, sentAt: null });
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const initialQuery = useMemo(
    () =>
      String(
        location.state?.confirmationNumber ?? location.state?.initialQuery ?? ''
      ).trim(),
    [location.state?.confirmationNumber, location.state?.initialQuery]
  );

  const invoiceFinalized = Boolean(bill?.invoiceFinalized);

  useEffect(() => () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const resetPreview = useCallback(() => {
    setPreviewLoading(false);
    setPreviewError(null);
    setPreviewUrl((current) => {
      if (current) window.URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  const loadPreview = useCallback(async (reservationId) => {
    if (!reservationId) return null;

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const blob = await getInvoicePdf(reservationId);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl((current) => {
        if (current) window.URL.revokeObjectURL(current);
        return url;
      });
      return url;
    } catch {
      setPreviewError(t('invoicePreviewPage.previewErrorDescription'));
      return null;
    } finally {
      setPreviewLoading(false);
    }
  }, [t]);

  const fetchInvoiceData = useCallback(async (confirmationNumber) => {
    if (!confirmationNumber) return;

    setLoading(true);
    setError(null);
    setBill(null);
    setDeliveryStatus('LOADING');
    setDeliveryMeta({ errorMessage: null, sentAt: null });
    resetPreview();

    try {
      const reservation = await getReservationByConfirmationNumber(confirmationNumber);
      const billData = await getBill(reservation.confirmationNumber);

      setSelected(reservation);
      setBill(billData);

      if (!billData?.invoiceFinalized) {
        setDeliveryStatus('IDLE');
        return;
      }

      try {
        const delivery = await getInvoiceDeliveryStatus(reservation.id);
        setDeliveryStatus(delivery?.status || 'UNKNOWN');
        setDeliveryMeta({
          errorMessage: delivery?.errorMessage ?? null,
          sentAt: delivery?.sentAt ?? null,
        });
      } catch (err) {
        if (err?.response?.status === 404) {
          setDeliveryStatus('UNKNOWN');
        } else {
          setDeliveryStatus('ERROR');
        }
      }

      await loadPreview(reservation.id);
    } catch (err) {
      setError(extractReservationError(err));
      setSelected(null);
      setBill(null);
      setDeliveryStatus('IDLE');
      resetPreview();
    } finally {
      setLoading(false);
    }
  }, [loadPreview, resetPreview]);

  const handleSelect = async (reservation) => {
    await fetchInvoiceData(reservation.confirmationNumber);
  };

  const handleGenerate = useCallback(async () => {
    if (!selected?.id || generating || invoiceFinalized) return;

    try {
      setGenerating(true);
      await generateInvoice(selected.id);
      setToast({ message: t('invoicePreviewPage.generateSuccess'), type: 'success' });
      await fetchInvoiceData(selected.confirmationNumber);
    } catch (err) {
      setToast({ message: extractReservationError(err), type: 'error' });
    } finally {
      setGenerating(false);
    }
  }, [fetchInvoiceData, generating, invoiceFinalized, selected, t]);

  const handleRetryData = useCallback(async () => {
    const confirmationNumber = selected?.confirmationNumber || initialQuery;
    if (!confirmationNumber || loading) return;
    await fetchInvoiceData(confirmationNumber);
  }, [fetchInvoiceData, initialQuery, loading, selected?.confirmationNumber]);

  const handleRetryPreview = useCallback(async () => {
    if (!selected?.id || previewLoading) return;
    await loadPreview(selected.id);
  }, [loadPreview, previewLoading, selected?.id]);

  const handleDownload = useCallback(async () => {
    if (!selected?.id || !invoiceFinalized || downloading) return;

    try {
      setDownloading(true);
      const url = previewUrl || (await loadPreview(selected.id));
      if (!url) throw new Error('Preview unavailable');
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${selected.confirmationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setToast({ message: t('invoicePreviewPage.downloadFailed'), type: 'error' });
    } finally {
      setDownloading(false);
    }
  }, [downloading, invoiceFinalized, loadPreview, previewUrl, selected, t]);

  const handlePrint = useCallback(async () => {
    if (!selected?.id || !invoiceFinalized) return;

    try {
      const url = previewUrl || (await loadPreview(selected.id));
      if (!url) throw new Error('Preview unavailable');
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.focus();
      }
    } catch {
      setToast({ message: t('invoicePreviewPage.printFailed'), type: 'error' });
    }
  }, [invoiceFinalized, loadPreview, previewUrl, selected, t]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <ConfirmationToast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <DashboardHero
        eyebrow={t('invoicePreviewPage.heroEyebrow')}
        title={t('invoicePreview')}
        description={t('invoicePreviewPage.description')}
        meta={[
          t('invoicePreviewPage.reservationFirst'),
          selected ? selected.confirmationNumber : t('common.pending'),
          invoiceFinalized ? t('invoicePreviewPage.invoiceReady') : t('invoicePreviewPage.invoicePending'),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {t('invoicePreviewPage.stateTitle')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('common.finalized')}
              </p>
              <p className="mt-2 text-lg font-black">{getBooleanLabel(invoiceFinalized, t)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('common.delivery')}
              </p>
              <p className="mt-2 text-lg font-black">
                {invoiceFinalized ? getInvoiceDeliveryStatusLabel(deliveryStatus, t) : t('common.pending')}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ReservationLookupPanel initialQuery={initialQuery} onSelect={handleSelect} />

        {!selected && !loading ? (
          <DashboardPanel
            title={t('invoicePreviewPage.selectTitle')}
            description={t('invoicePreviewPage.selectDescription')}
          >
            <div className="grid gap-3 md:grid-cols-3">
              {t('invoicePreviewPage.tips', { returnObjects: true }).map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium leading-6 text-zinc-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </DashboardPanel>
        ) : (
          <div className="space-y-6">
            <DashboardPanel
              title={t('invoicePreviewPage.controlsTitle')}
              description={t('invoicePreviewPage.controlsDescription')}
              action={
                selected ? (
                  <DeliveryBadge
                    deliveryStatus={deliveryStatus}
                    invoiceFinalized={invoiceFinalized}
                    deliveryMeta={deliveryMeta}
                    t={t}
                  />
                ) : null
              }
            >
              {loading ? (
                <LoadingState message={t('invoicePreviewPage.loadingData')} />
              ) : error ? (
                <ErrorState
                  title={t('invoicePreviewPage.controlsTitle')}
                  message={error}
                  onRetry={handleRetryData}
                />
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                        {t('common.guest')}
                      </p>
                      <p className="mt-2 text-lg font-black text-zinc-950">
                        {selected?.guestName || '-'}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        {selected?.guestEmail || t('common.noGuestEmailProvided')}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                        {t('reservationDetails')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-zinc-950">
                        <LtrText>{selected?.confirmationNumber}</LtrText>
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        {t('roomNumber', { number: selected?.roomNumber })} |{' '}
                        {formatLocalizedDate(selected?.checkInDate, i18n.language, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        -{' '}
                        {formatLocalizedDate(selected?.checkOutDate, i18n.language, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    {!invoiceFinalized ? (
                      <Button
                        type="button"
                        onClick={handleGenerate}
                        disabled={!selected?.id || generating}
                        className="h-14 w-full bg-zinc-950 text-sm font-bold text-white hover:bg-zinc-800"
                      >
                        <FilePlus2 className="h-4 w-4" />
                        {generating ? t('invoicePreviewPage.generating') : t('invoicePreviewPage.generate')}
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrint}
                          className="h-14 w-full border-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-50"
                        >
                          <Printer className="h-4 w-4" />
                          {t('invoicePreviewPage.print')}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleDownload}
                          disabled={downloading}
                          className="h-14 w-full bg-zinc-950 text-sm font-bold text-white hover:bg-zinc-800"
                        >
                          <Download className="h-4 w-4" />
                          {downloading ? t('invoicePreviewPage.downloading') : t('invoicePreviewPage.download')}
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </DashboardPanel>

            <DashboardPanel
              title={t('invoicePreviewPage.previewTitle')}
              description={t('invoicePreviewPage.previewDescription')}
            >
              {!invoiceFinalized ? (
                <EmptyState
                  title={t('invoicePreviewPage.previewEmptyTitle')}
                  message={t('invoicePreviewPage.previewEmptyDescription')}
                />
              ) : previewLoading ? (
                <LoadingState message={t('invoicePreviewPage.previewLoading')} />
              ) : previewError ? (
                <ErrorState
                  title={t('invoicePreviewPage.previewErrorTitle')}
                  message={previewError}
                  onRetry={handleRetryPreview}
                />
              ) : previewUrl ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-zinc-50">
                    <iframe
                      title={t('invoicePreviewPage.previewFrameTitle')}
                      src={previewUrl}
                      className="h-[28rem] w-full bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                      className="h-12 border-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-50"
                    >
                      {t('invoicePreviewPage.openDocument')}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="h-12 bg-zinc-950 text-sm font-bold text-white hover:bg-zinc-800"
                    >
                      <Download className="h-4 w-4" />
                      {downloading ? t('invoicePreviewPage.downloading') : t('invoicePreviewPage.download')}
                    </Button>
                  </div>
                </div>
              ) : (
                <ErrorState
                  title={t('invoicePreviewPage.previewErrorTitle')}
                  message={t('invoicePreviewPage.previewErrorDescription')}
                  onRetry={handleRetryPreview}
                />
              )}
            </DashboardPanel>

            <DashboardPanel
              title={t('invoicePreviewPage.ledgerTitle')}
              description={t('invoicePreviewPage.ledgerDescription')}
            >
              <InvoiceLedger bill={bill} t={t} language={i18n.language} />
            </DashboardPanel>

            <DashboardPanel
              title={t('invoicePreviewPage.signalsTitle')}
              description={t('invoicePreviewPage.signalsDescription')}
            >
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    icon: Receipt,
                    title: t('invoicePreviewPage.finalizationTitle'),
                    description: invoiceFinalized
                      ? t('invoicePreviewPage.finalizationReady')
                      : t('invoicePreviewPage.finalizationPending'),
                  },
                  {
                    icon: Send,
                    title: t('invoicePreviewPage.deliveryTitle'),
                    description: invoiceFinalized
                      ? t('invoicePreviewPage.deliveryDescriptionReady', {
                          status: getInvoiceDeliveryStatusLabel(deliveryStatus, t),
                        })
                      : t('invoicePreviewPage.deliveryDescriptionPending'),
                  },
                  {
                    icon: Mail,
                    title: t('invoicePreviewPage.metadataTitle'),
                    description: deliveryMeta?.sentAt
                      ? t('invoicePreviewPage.metadataAvailable', {
                          time: formatLocalizedDateTime(deliveryMeta.sentAt, i18n.language),
                        })
                      : t('invoicePreviewPage.metadataPending'),
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="mt-3 text-sm font-bold text-zinc-950">{item.title}</p>
                      <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </DashboardPanel>
          </div>
        )}
      </div>
    </div>
  );
}
