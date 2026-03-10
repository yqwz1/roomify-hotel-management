import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import { cancelReservation, extractReservationError } from '../services/reservationService';
import StatusPill from '../components/StatusPill';
import { CANCELLABLE_STATUSES } from '../data/mockReservations';
import { LtrText } from '../components/LtrText';
import { useTranslation } from 'react-i18next';

const formatDate = (iso, lang) => {
    if (!iso) return '—';
    const locale = lang?.startsWith('ar') ? 'ar-SA' : 'en-US';
    return new Date(iso + 'T12:00:00').toLocaleDateString(locale, {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

const money = (v) => `$${Number(v ?? 0).toFixed(2)}`;

// ─── Cancel Confirmation Dialog ───────────────────────────────────────────────
function CancelDialog({ reservation, onClose, onConfirm }) {
    const { t, i18n } = useTranslation();
    const [reason, setReason] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState(null);

    const handleConfirm = async () => {
        setConfirming(true);
        setError(null);
        try {
            const result = await cancelReservation(reservation.id, reason);
            onConfirm(result);
        } catch (err) {
            setError(extractReservationError(err));
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">

                {/* Header — red accent */}
                <div className="bg-red-50 border-b border-red-100 px-8 py-5 flex items-start gap-4">
                    <span className="text-2xl mt-0.5">🚫</span>
                    <div>
                        <h2 className="text-lg font-bold text-red-900">{t('cancelReservationTitle')}</h2>
                        <p className="text-xs font-bold font-mono text-red-600 mt-1"><LtrText>{reservation.confirmationNumber}</LtrText></p>
                    </div>
                </div>

                <div className="px-8 py-6 flex flex-col gap-5">
                    {/* Warning */}
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm font-medium text-amber-800">
                        {t('cancelWarning')}
                    </div>

                    {/* Summary */}
                    <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 text-sm">
                        <p className="font-bold text-black">{reservation.guestName}</p>
                        <p className="text-zinc-500 font-medium text-xs mt-1">{t('room')} <LtrText>{reservation.roomNumber}</LtrText> — <LtrText>{formatDate(reservation.checkInDate, i18n.language)}</LtrText> → <LtrText>{formatDate(reservation.checkOutDate, i18n.language)}</LtrText></p>
                        <p className="text-zinc-500 font-medium text-xs mt-1">{reservation.nights} {t('nights')} · {t('totalPaid')}: <strong className="text-black"><LtrText>{money(reservation.totalPrice)}</LtrText></strong></p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-bold text-red-700 border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Cancellation reason */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="cancel-reason" className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            {t('reasonForCancellation')}
                        </label>
                        <textarea
                            id="cancel-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t('cancelReasonPlaceholder')}
                            rows={3}
                            className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-black focus:bg-white focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none transition-all"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-full border border-zinc-200 py-3 text-sm font-bold text-black hover:bg-zinc-50 transition focus:outline-none focus:ring-2 focus:ring-zinc-300"
                        >
                            {t('keepReservation')}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={confirming}
                            className="flex-1 rounded-full bg-red-600 py-3 text-sm font-bold text-white transition shadow-sm hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-red-400"
                        >
                            {confirming ? t('cancelling') : t('yesCancelIt')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
/**
 * CancelReservation  –  /reservations/cancel
 * Staff/Manager view: look up and cancel a reservation.
 * Mock only — no real API calls.
 */
export default function CancelReservation() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [selected, setSelected] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSelect = (r) => { setSelected(r); setShowDialog(false); };

    const handleConfirm = (result) => {
        setShowDialog(false);
        setSelected((prev) => ({ ...prev, status: result?.currentStatus || 'CANCELLED' }));
        setToast({ message: t('cancelSuccess', { conf: selected.confirmationNumber }), type: 'success' });
    };

    return (
        <div className="h-full bg-zinc-50 p-6 lg:p-8">
            <ConfirmationToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

            {showDialog && selected && (
                <CancelDialog
                    reservation={selected}
                    onClose={() => setShowDialog(false)}
                    onConfirm={handleConfirm}
                />
            )}

            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-bold text-black hover:bg-white transition shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300">
                    {t('back')}
                </button>
                <div>
                    <h1 className="text-3xl font-extrabold text-black">{t('cancelReservationTitle')}</h1>
                    <p className="text-sm font-medium text-zinc-500 mt-1">{t('cancelReservationDesc')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Lookup */}
                <div><ReservationLookupPanel onSelect={handleSelect} /></div>

                {/* Selected */}
                <div>
                    {!selected ? (
                        <div className="flex h-full min-h-[250px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-300 bg-transparent p-12 text-center">
                            <span className="text-5xl mb-4">🔍</span>
                            <p className="text-sm font-bold text-black">{t('noReservationSelected')}</p>
                            <p className="text-xs font-medium text-zinc-500 mt-2">{t('searchAndSelectToCancel')}</p>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
                            <div className="mb-6 flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-xl font-extrabold text-black">{selected.guestName}</p>
                                    <p className="text-xs font-mono font-bold text-zinc-400 mt-1"><LtrText>{selected.confirmationNumber}</LtrText></p>
                                </div>
                                <StatusPill status={selected.status} />
                            </div>

                            {!CANCELLABLE_STATUSES.includes(selected.status) && (
                                <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                                    {t('cannotCancel')} <strong>{t(selected.status.toLowerCase()) || selected.status.replace('_', ' ')}</strong>.
                                </div>
                            )}

                            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm mb-6">
                                <div><dt className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t('room')}</dt><dd className="font-bold text-black mt-1">{t('room')} <LtrText>{selected.roomNumber}</LtrText> · {selected.roomTypeName}</dd></div>
                                <div><dt className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t('guestEmail')}</dt><dd className="font-bold text-black mt-1 truncate">{selected.guestEmail}</dd></div>
                                <div><dt className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t('checkInDate')}</dt><dd className="font-bold text-black mt-1"><LtrText>{formatDate(selected.checkInDate, i18n.language)}</LtrText></dd></div>
                                <div><dt className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t('checkOutDate')}</dt><dd className="font-bold text-black mt-1"><LtrText>{formatDate(selected.checkOutDate, i18n.language)}</LtrText></dd></div>
                                <div><dt className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t('nights')}</dt><dd className="font-bold text-black mt-1">{selected.nights}</dd></div>
                                <div><dt className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t('totalPaid')}</dt><dd className="font-extrabold text-lg text-black mt-1"><LtrText>{money(selected.totalPrice)}</LtrText></dd></div>
                            </dl>

                            {CANCELLABLE_STATUSES.includes(selected.status) && (
                                <button
                                    onClick={() => setShowDialog(true)}
                                    className="w-full rounded-full border-2 border-red-600 bg-white hover:bg-red-50 py-4 text-sm font-bold text-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400 shadow-sm"
                                >
                                    {t('cancelThisReservation')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
