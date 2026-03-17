import { useCallback, useMemo, useState } from 'react';
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

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const money = (value) => `$${Number(value ?? 0).toFixed(2)}`;

function DeliveryBadge({ deliveryStatus, invoiceFinalized, deliveryMeta }) {
  if (!invoiceFinalized) {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-900">
        Invoice not finalized
      </span>
    );
  }

  if (deliveryStatus === 'LOADING') {
    return (
      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
        Loading delivery status
      </span>
    );
  }

  if (deliveryStatus === 'SENT') {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-900">
        Delivered by email
      </span>
    );
  }

  if (deliveryStatus === 'FAILED') {
    return (
      <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-rose-900">
        Delivery failed
        {deliveryMeta?.errorMessage ? `: ${deliveryMeta.errorMessage}` : ''}
      </span>
    );
  }

  if (deliveryStatus === 'ERROR') {
    return (
      <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-rose-900">
        Delivery status unavailable
      </span>
    );
  }

  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
      Delivery pending
    </span>
  );
}

function InvoiceLedger({ bill }) {
  if (!bill) {
    return (
      <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center">
        <p className="text-sm font-bold text-zinc-950">No invoice data loaded</p>
        <p className="mt-2 text-sm font-medium text-zinc-500">
          Select a reservation to review the invoice ledger.
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
              Description
            </th>
            <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
              Amount
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
                  {item?.label || 'Line item'}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-zinc-950">
                  {credit ? `-${money(amount)}` : money(amount)}
                </td>
              </tr>
            );
          })}
          <tr className="bg-zinc-50">
            <td className="px-4 py-3 text-sm font-bold text-zinc-950">Total</td>
            <td className="px-4 py-3 text-right text-lg font-black text-zinc-950">
              {money(bill.balanceDue)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function InvoicePreview() {
  const location = useLocation();
  const [selected, setSelected] = useState(null);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState('IDLE');
  const [deliveryMeta, setDeliveryMeta] = useState({ errorMessage: null, sentAt: null });
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const initialQuery = useMemo(
    () =>
      String(
        location.state?.confirmationNumber ?? location.state?.initialQuery ?? ''
      ).trim(),
    [location.state?.confirmationNumber, location.state?.initialQuery]
  );

  const invoiceFinalized = Boolean(bill?.invoiceFinalized);

  const fetchInvoiceData = useCallback(async (confirmationNumber) => {
    if (!confirmationNumber) return;

    setLoading(true);
    setError(null);
    setBill(null);
    setDeliveryStatus('LOADING');
    setDeliveryMeta({ errorMessage: null, sentAt: null });

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
    } catch (err) {
      setError(extractReservationError(err));
      setSelected(null);
      setBill(null);
      setDeliveryStatus('IDLE');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = async (reservation) => {
    await fetchInvoiceData(reservation.confirmationNumber);
  };

  const handleGenerate = useCallback(async () => {
    if (!selected?.id || generating || invoiceFinalized) return;

    try {
      setGenerating(true);
      await generateInvoice(selected.id);
      setToast({ message: 'Invoice generated successfully.', type: 'success' });
      await fetchInvoiceData(selected.confirmationNumber);
    } catch (err) {
      setToast({ message: extractReservationError(err), type: 'error' });
    } finally {
      setGenerating(false);
    }
  }, [fetchInvoiceData, generating, invoiceFinalized, selected]);

  const handleDownload = useCallback(async () => {
    if (!selected?.id || !invoiceFinalized || downloading) return;

    try {
      setDownloading(true);
      const blob = await getInvoicePdf(selected.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${selected.confirmationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setToast({ message: 'Unable to download the invoice.', type: 'error' });
    } finally {
      setDownloading(false);
    }
  }, [downloading, invoiceFinalized, selected]);

  const handlePrint = useCallback(async () => {
    if (!selected?.id || !invoiceFinalized) return;

    try {
      const blob = await getInvoicePdf(selected.id);
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.focus();
      }
    } catch {
      setToast({ message: 'Unable to open the invoice for printing.', type: 'error' });
    }
  }, [invoiceFinalized, selected]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <ConfirmationToast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <DashboardHero
        eyebrow="Billing Workflow"
        title="Invoice Preview"
        description="Search for a reservation, generate the invoice when needed, and then print or download the final document."
        meta={[
          'Reservation-first billing',
          selected ? `Selected ${selected.confirmationNumber}` : 'Awaiting selection',
          invoiceFinalized ? 'Invoice ready' : 'Invoice pending',
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Invoice State
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Finalized
              </p>
              <p className="mt-2 text-lg font-black">{invoiceFinalized ? 'Yes' : 'No'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Delivery
              </p>
              <p className="mt-2 text-lg font-black">
                {invoiceFinalized ? deliveryStatus : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ReservationLookupPanel initialQuery={initialQuery} onSelect={handleSelect} />

        {!selected && !loading ? (
          <DashboardPanel
            title="Select a Reservation"
            description="Load a reservation before generating or previewing its invoice."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {[
                'Invoice generation is a separate action and must happen before print or download.',
                'Delivery status is only available after the invoice is finalized.',
                'Use the confirmation number when possible for the most reliable invoice lookup.',
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
        ) : (
          <div className="space-y-6">
            <DashboardPanel
              title="Invoice Controls"
              description="Generate the invoice first, then print or download the final document."
              action={
                selected ? (
                  <DeliveryBadge
                    deliveryStatus={deliveryStatus}
                    invoiceFinalized={invoiceFinalized}
                    deliveryMeta={deliveryMeta}
                  />
                ) : null
              }
            >
              {loading ? (
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-5 py-10 text-center">
                  <p className="text-sm font-medium text-zinc-500">
                    Loading invoice data...
                  </p>
                </div>
              ) : error ? (
                <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                  {error}
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                        Guest
                      </p>
                      <p className="mt-2 text-lg font-black text-zinc-950">
                        {selected?.guestName || '-'}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        {selected?.guestEmail || 'No guest email provided'}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                        Reservation
                      </p>
                      <p className="mt-2 text-sm font-bold text-zinc-950">
                        <LtrText>{selected?.confirmationNumber}</LtrText>
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        Room {selected?.roomNumber} | {formatDate(selected?.checkInDate)} to{' '}
                        {formatDate(selected?.checkOutDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    {!invoiceFinalized ? (
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={!selected?.id || generating}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                      >
                        <FilePlus2 className="h-4 w-4" />
                        {generating ? 'Generating Invoice...' : 'Generate Invoice'}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handlePrint}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 px-6 py-4 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                        >
                          <Printer className="h-4 w-4" />
                          Print Invoice
                        </button>
                        <button
                          type="button"
                          onClick={handleDownload}
                          disabled={downloading}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                        >
                          <Download className="h-4 w-4" />
                          {downloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </DashboardPanel>

            <DashboardPanel
              title="Invoice Ledger"
              description="Review the charge lines, taxes, and total before printing or downloading."
            >
              <InvoiceLedger bill={bill} />
            </DashboardPanel>

            <DashboardPanel
              title="Billing Signals"
              description="Operational status for invoice delivery and finalization."
            >
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    icon: Receipt,
                    title: 'Finalization',
                    description: invoiceFinalized
                      ? 'The invoice is finalized and locked for downstream actions.'
                      : 'The invoice has not been generated yet.',
                  },
                  {
                    icon: Send,
                    title: 'Delivery',
                    description: invoiceFinalized
                      ? `Current delivery status: ${deliveryStatus}.`
                      : 'Delivery status will appear after invoice generation.',
                  },
                  {
                    icon: Mail,
                    title: 'Email Metadata',
                    description: deliveryMeta?.sentAt
                      ? `Last sent at ${new Date(deliveryMeta.sentAt).toLocaleString()}.`
                      : 'No delivery timestamp is currently available.',
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
