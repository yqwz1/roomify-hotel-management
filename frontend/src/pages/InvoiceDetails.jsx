import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FilePlus2,
  Mail,
  Printer,
  Receipt,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmationToast from '../components/ConfirmationToast';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { useAuth } from '../context/AuthProvider';
import {
  GUEST_INVOICES_PATH,
  ROLE_GUEST,
  translateWithFallback,
} from '../components/navigation/navConfig';
import {
  generateInvoice,
  getGuestInvoiceDetails,
  getGuestInvoicePdf,
  getInvoiceDetails,
  getInvoicePdf,
  sendInvoiceEmail,
} from '../services/invoiceService';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  formatLocalizedDateTime,
  getInvoiceDeliveryStatusLabel,
  getPaymentStatusLabel,
  translateBillLineItemLabel,
} from '../utils/localization';

function StatusBadge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-zinc-200 bg-zinc-50 text-zinc-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
  };

  return (
    <span className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

function FactRow({ label, value }) {
  return (
    <div className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-2 text-sm font-bold text-zinc-950">{value}</p>
    </div>
  );
}

function InvoiceLedger({ bill, t, language }) {
  if (!bill) {
    return (
      <EmptyState
        icon={Receipt}
        title={translateWithFallback(t, 'invoiceDetailsPage.emptyTitle', 'No billing data')}
        message={translateWithFallback(
          t,
          'invoiceDetailsPage.emptyMessage',
          'The invoice record exists, but no bill lines are available yet.'
        )}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200">
      <table className="w-full border-collapse">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
              {translateWithFallback(t, 'invoicePreviewPage.descriptionLabel', 'Description')}
            </th>
            <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
              {translateWithFallback(t, 'invoicePreviewPage.amountLabel', 'Amount')}
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
                  {item?.label ? translateBillLineItemLabel(item.label, t) : '-'}
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
            <td className="px-4 py-3 text-sm font-bold text-zinc-950">
              {translateWithFallback(t, 'common.total', 'Total')}
            </td>
            <td className="px-4 py-3 text-right text-lg font-black text-zinc-950">
              {formatLocalizedCurrency(bill.balanceDue ?? 0, language)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const getDeliveryTone = (status) => {
  switch (status) {
    case 'SENT':
      return 'success';
    case 'FAILED':
    case 'ERROR':
      return 'danger';
    case 'ATTEMPT':
      return 'info';
    default:
      return 'neutral';
  }
};

const getPaymentTone = (status) => {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'PARTIALLY_PAID':
      return 'warning';
    case 'FAILED':
      return 'danger';
    default:
      return 'neutral';
  }
};

export default function InvoiceDetails() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { reservationId, confirmationNumber } = useParams();
  const { hasRole } = useAuth();
  const isGuest = hasRole(ROLE_GUEST);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const printFrameRef = useRef(null);

  const invoice = details?.invoice ?? null;
  const pdfAvailable = Boolean(details?.pdfAvailable);
  const lookupKey = isGuest ? confirmationNumber : reservationId;
  const backPath = isGuest ? GUEST_INVOICES_PATH : '/invoices';

  const fetchDetails = useCallback(async () => {
    if (!lookupKey) return;

    setLoading(true);
    setError('');

    try {
      const data = isGuest
        ? await getGuestInvoiceDetails(lookupKey)
        : await getInvoiceDetails(lookupKey);

      setDetails(data);
    } catch (err) {
      setDetails(null);
      setError(err?.response?.data?.message || err?.message || 'Unable to load invoice details');
    } finally {
      setLoading(false);
    }
  }, [isGuest, lookupKey]);

  const loadPreview = useCallback(async () => {
    if (!lookupKey || !pdfAvailable) return null;

    setPreviewLoading(true);
    setPreviewError('');

    try {
      const blob = isGuest
        ? await getGuestInvoicePdf(lookupKey)
        : await getInvoicePdf(lookupKey);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl((current) => {
        if (current) {
          window.URL.revokeObjectURL(current);
        }
        return url;
      });
      return url;
    } catch (err) {
      setPreviewError(err?.response?.data?.message || t('invoicePreviewPage.previewErrorDescription'));
      return null;
    } finally {
      setPreviewLoading(false);
    }
  }, [isGuest, lookupKey, pdfAvailable, t]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  useEffect(() => () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    if (printFrameRef.current) {
      printFrameRef.current.remove();
      printFrameRef.current = null;
    }
  }, [previewUrl]);

  useEffect(() => {
    if (!pdfAvailable) {
      setPreviewError('');
      setPreviewUrl((current) => {
        if (current) {
          window.URL.revokeObjectURL(current);
        }
        return null;
      });
      return;
    }

    loadPreview();
  }, [loadPreview, pdfAvailable]);

  const invoiceFilename = useMemo(() => {
    if (!invoice) {
      return 'invoice.pdf';
    }

    return `invoice-${invoice.invoiceNumber || invoice.confirmationNumber || 'record'}.pdf`;
  }, [invoice]);

  const handleGenerate = async () => {
    if (!reservationId || generating || isGuest) return;

    try {
      setGenerating(true);
      await generateInvoice(reservationId);
      setToast({
        message: translateWithFallback(
          t,
          'invoiceDetailsPage.generateSuccess',
          'Invoice finalized and ready for download.'
        ),
        type: 'success',
      });
      await fetchDetails();
    } catch (err) {
      setToast({
        message: err?.response?.data?.message || err?.message || 'Unable to generate invoice',
        type: 'error',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!reservationId || emailing || isGuest || !pdfAvailable) return;

    try {
      setEmailing(true);
      await sendInvoiceEmail(reservationId);
      setToast({
        message: translateWithFallback(
          t,
          'invoiceDetailsPage.emailSuccess',
          'Invoice email delivery was triggered successfully.'
        ),
        type: 'success',
      });
      await fetchDetails();
    } catch (err) {
      setToast({
        message: err?.response?.data?.message || err?.message || 'Unable to send invoice email',
        type: 'error',
      });
    } finally {
      setEmailing(false);
    }
  };

  const handleDownload = async () => {
    if (downloading || !pdfAvailable) return;

    try {
      setDownloading(true);
      const url = previewUrl || (await loadPreview());
      if (!url) {
        throw new Error('Preview unavailable');
      }

      const link = document.createElement('a');
      link.href = url;
      link.download = invoiceFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setToast({
        message: translateWithFallback(t, 'invoicePreviewPage.downloadFailed', 'Unable to download invoice'),
        type: 'error',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    if (!pdfAvailable) return;

    try {
      const url = previewUrl || (await loadPreview());
      if (!url) {
        throw new Error('Preview unavailable');
      }

      if (printFrameRef.current) {
        printFrameRef.current.remove();
        printFrameRef.current = null;
      }

      const iframe = document.createElement('iframe');
      iframe.setAttribute('title', 'invoice-print-frame');
      iframe.className = 'pointer-events-none fixed bottom-0 right-0 h-0 w-0 border-0 opacity-0';
      iframe.onload = () => {
        const frameWindow = iframe.contentWindow;
        if (!frameWindow) {
          setToast({
            message: translateWithFallback(t, 'invoicePreviewPage.printFailed', 'Unable to print invoice'),
            type: 'error',
          });
          return;
        }

        frameWindow.focus();
        window.setTimeout(() => {
          try {
            frameWindow.print();
          } catch {
            setToast({
              message: translateWithFallback(t, 'invoicePreviewPage.printFailed', 'Unable to print invoice'),
              type: 'error',
            });
          }
        }, 0);
      };
      iframe.src = url;
      printFrameRef.current = iframe;
      document.body.appendChild(iframe);
    } catch {
      setToast({
        message: translateWithFallback(t, 'invoicePreviewPage.printFailed', 'Unable to print invoice'),
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <LoadingState
          message={translateWithFallback(t, 'invoiceDetailsPage.loading', 'Loading invoice details...')}
        />
      </div>
    );
  }

  if (error || !details || !invoice) {
    return (
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <ErrorState
          title={translateWithFallback(t, 'invoiceDetailsPage.errorTitle', 'Invoice details unavailable')}
          message={error || translateWithFallback(t, 'invoiceDetailsPage.errorFallback', 'Invoice record not found')}
          onRetry={fetchDetails}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <ConfirmationToast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <DashboardHero
        eyebrow={translateWithFallback(
          t,
          'invoiceDetailsPage.eyebrow',
          isGuest ? 'Guest invoice' : 'Invoice details'
        )}
        title={invoice.invoiceNumber || translateWithFallback(t, 'invoicePreview', 'Invoice')}
        description={translateWithFallback(
          t,
          'invoiceDetailsPage.description',
          'This reservation-linked invoice view is the practical finance screen missing from the original demo.'
        )}
        meta={[
          invoice.confirmationNumber || translateWithFallback(t, 'common.pending', 'Pending'),
          invoice.guestName || translateWithFallback(t, 'common.guest', 'Guest'),
          getPaymentStatusLabel(invoice.paymentStatus, t),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {translateWithFallback(t, 'invoiceDetailsPage.heroCardTitle', 'Outstanding balance')}
          </p>
          <p className="mt-4 text-3xl font-black">
            {formatLocalizedCurrency(invoice.outstandingBalance ?? 0, i18n.language)}
          </p>
        </div>
      </DashboardHero>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          {translateWithFallback(t, 'back', 'Back')}
        </Link>

        {!isGuest && !pdfAvailable ? (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            <FilePlus2 className="h-4 w-4" />
            {generating
              ? translateWithFallback(t, 'invoicePreviewPage.generating', 'Generating...')
              : translateWithFallback(t, 'invoiceDetailsPage.generateCta', 'Finalize invoice')}
          </button>
        ) : null}

        {!isGuest && pdfAvailable ? (
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={emailing}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            {emailing
              ? translateWithFallback(t, 'invoicePreviewPage.sendingEmail', 'Sending...')
              : translateWithFallback(t, 'invoiceDetailsPage.emailCta', 'Email invoice')}
          </button>
        ) : null}

        {pdfAvailable ? (
          <>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-black"
            >
              <Printer className="h-4 w-4" />
              {translateWithFallback(t, 'invoicePreviewPage.print', 'Print')}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              <Download className="h-4 w-4" />
              {downloading
                ? translateWithFallback(t, 'invoicePreviewPage.downloading', 'Downloading...')
                : translateWithFallback(t, 'invoicePreviewPage.download', 'Download')}
            </button>
          </>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <DashboardPanel
            title={translateWithFallback(t, 'invoiceDetailsPage.summaryTitle', 'Invoice summary')}
            description={translateWithFallback(
              t,
              'invoiceDetailsPage.summaryDescription',
              'The invoice is explicitly linked to the reservation, guest, and payment state.'
            )}
            action={
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={getPaymentTone(invoice.paymentStatus)}>
                  {getPaymentStatusLabel(invoice.paymentStatus, t)}
                </StatusBadge>
                <StatusBadge tone={getDeliveryTone(details.deliveryStatus)}>
                  {getInvoiceDeliveryStatusLabel(details.deliveryStatus, t)}
                </StatusBadge>
                <StatusBadge tone={pdfAvailable ? 'success' : 'warning'}>
                  {pdfAvailable
                    ? translateWithFallback(t, 'common.finalized', 'Finalized')
                    : translateWithFallback(t, 'common.pending', 'Pending')}
                </StatusBadge>
              </div>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FactRow
                label={translateWithFallback(t, 'common.guest', 'Guest')}
                value={invoice.guestName || '-'}
              />
              <FactRow
                label={translateWithFallback(t, 'guestEmailLabel', 'Guest email')}
                value={invoice.guestEmail || '-'}
              />
              <FactRow
                label={translateWithFallback(t, 'reservationDetailsTitle', 'Reservation')}
                value={invoice.confirmationNumber || '-'}
              />
              <FactRow
                label={translateWithFallback(t, 'invoicePreview', 'Invoice')}
                value={invoice.invoiceNumber || translateWithFallback(t, 'common.pending', 'Pending')}
              />
              <FactRow
                label={translateWithFallback(t, 'roomLabel', 'Room')}
                value={invoice.roomNumber ? t('roomNumber', { number: invoice.roomNumber }) : '-'}
              />
              <FactRow
                label={translateWithFallback(t, 'invoiceDetailsPage.stayDatesLabel', 'Stay dates')}
                value={`${formatLocalizedDate(invoice.checkInDate, i18n.language, { dateStyle: 'medium' })} - ${formatLocalizedDate(invoice.checkOutDate, i18n.language, { dateStyle: 'medium' })}`}
              />
              <FactRow
                label={translateWithFallback(t, 'common.total', 'Total')}
                value={formatLocalizedCurrency(invoice.totalPrice ?? 0, i18n.language)}
              />
              <FactRow
                label={translateWithFallback(t, 'checkoutPage.totalPaidLabel', 'Total paid')}
                value={formatLocalizedCurrency(invoice.totalPaid ?? 0, i18n.language)}
              />
              <FactRow
                label={translateWithFallback(t, 'checkoutPage.outstandingBalanceLabel', 'Outstanding balance')}
                value={formatLocalizedCurrency(invoice.outstandingBalance ?? 0, i18n.language)}
              />
              <FactRow
                label={translateWithFallback(t, 'invoiceDetailsPage.deliverySentLabel', 'Latest delivery')}
                value={
                  details.deliverySentAt
                    ? formatLocalizedDateTime(details.deliverySentAt, i18n.language)
                    : translateWithFallback(t, 'common.pending', 'Pending')
                }
              />
            </div>

            {details.deliveryErrorMessage ? (
              <div className="mt-4 rounded-[1.35rem] border border-rose-200 bg-rose-50 p-4 text-sm font-medium leading-6 text-rose-900">
                {details.deliveryErrorMessage}
              </div>
            ) : null}

            {!isGuest && invoice.reservationId ? (
              <div className="mt-4 flex justify-end border-t border-zinc-200 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(`/reservations/${invoice.confirmationNumber}`)}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-black"
                >
                  {translateWithFallback(t, 'invoiceDetailsPage.reservationLinkCta', 'Open reservation')}
                </button>
              </div>
            ) : null}
          </DashboardPanel>

          <DashboardPanel
            title={translateWithFallback(t, 'invoicePreviewPage.ledgerTitle', 'Invoice ledger')}
            description={translateWithFallback(
              t,
              'invoicePreviewPage.ledgerDescription',
              'This keeps the financial breakdown visible on the main invoice record.'
            )}
          >
            <InvoiceLedger bill={details.bill} t={t} language={i18n.language} />
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel
            title={translateWithFallback(t, 'invoicePreviewPage.previewTitle', 'Invoice document')}
            description={translateWithFallback(
              t,
              'invoicePreviewPage.previewDescription',
              'Preview the exact invoice document that can be printed or downloaded.'
            )}
          >
            {!pdfAvailable ? (
              <EmptyState
                icon={Receipt}
                title={translateWithFallback(
                  t,
                  'invoiceDetailsPage.previewPendingTitle',
                  'Invoice PDF not ready yet'
                )}
                message={translateWithFallback(
                  t,
                  'invoiceDetailsPage.previewPendingDescription',
                  'Finalize the invoice first, then this page becomes printable and downloadable.'
                )}
              />
            ) : previewLoading ? (
              <LoadingState
                message={translateWithFallback(
                  t,
                  'invoicePreviewPage.previewLoading',
                  'Loading invoice document...'
                )}
              />
            ) : previewError ? (
              <ErrorState
                title={translateWithFallback(
                  t,
                  'invoicePreviewPage.previewErrorTitle',
                  'Invoice preview unavailable'
                )}
                message={previewError}
                onRetry={loadPreview}
              />
            ) : previewUrl ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-zinc-50">
                  <iframe
                    title={translateWithFallback(
                      t,
                      'invoicePreviewPage.previewFrameTitle',
                      'Invoice preview'
                    )}
                    src={previewUrl}
                    className="h-[28rem] w-full bg-white"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-black"
                  >
                    {translateWithFallback(t, 'invoicePreviewPage.openDocument', 'Open document')}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-black"
                  >
                    <Printer className="h-4 w-4" />
                    {translateWithFallback(t, 'invoicePreviewPage.print', 'Print')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                  >
                    <Download className="h-4 w-4" />
                    {translateWithFallback(t, 'invoicePreviewPage.download', 'Download')}
                  </button>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Receipt}
                title={translateWithFallback(
                  t,
                  'invoicePreviewPage.previewErrorTitle',
                  'Invoice preview unavailable'
                )}
                message={translateWithFallback(
                  t,
                  'invoicePreviewPage.previewErrorDescription',
                  'The invoice document could not be loaded right now.'
                )}
              />
            )}
          </DashboardPanel>

          <DashboardPanel
            title={translateWithFallback(t, 'invoiceDetailsPage.workflowTitle', 'Why this matters')}
            description={translateWithFallback(
              t,
              'invoiceDetailsPage.workflowDescription',
              'This turns billing into a visible hotel workflow instead of a hidden backend utility.'
            )}
          >
            <div className="grid gap-3">
              {[
                translateWithFallback(
                  t,
                  'invoiceDetailsPage.workflowOne',
                  'Every invoice is tied directly to a reservation and its payment lifecycle.'
                ),
                translateWithFallback(
                  t,
                  'invoiceDetailsPage.workflowTwo',
                  'Manager and staff can review finance history without reopening the checkout flow.'
                ),
                translateWithFallback(
                  t,
                  'invoiceDetailsPage.workflowThree',
                  'Guests can view only their own invoice document and payment summary.'
                ),
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium leading-6 text-zinc-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
