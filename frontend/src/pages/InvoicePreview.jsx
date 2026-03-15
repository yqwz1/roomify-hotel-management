import React, { useCallback, useEffect, useState } from 'react';
import { Download, Printer, Hotel } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { getInvoiceDeliveryStatus, getInvoicePdf } from '../services/invoiceService';

const InvoicePreview = ({ reservationId: propReservationId }) => {
    const { reservationId: routeReservationId } = useParams();
    const reservationId = propReservationId ?? routeReservationId;

    const [status, setStatus] = useState('LOADING');
    const [statusMeta, setStatusMeta] = useState({ errorMessage: null, sentAt: null });
    const [statusError, setStatusError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!reservationId) return;

        let isCancelled = false;

        const fetchStatus = async () => {
            setStatus('LOADING');
            setStatusError(null);
            try {
                const data = await getInvoiceDeliveryStatus(reservationId);
                if (isCancelled) return;
                setStatus(data.status || 'UNKNOWN');
                setStatusMeta({
                    errorMessage: data.errorMessage ?? null,
                    sentAt: data.sentAt ?? null,
                });
            } catch (err) {
                if (isCancelled) return;
                if (err?.response?.status === 404) {
                    setStatus('UNKNOWN');
                    setStatusMeta({ errorMessage: null, sentAt: null });
                } else {
                    setStatus('ERROR');
                    setStatusError('تعذر جلب حالة إرسال البريد الإلكتروني.');
                }
            }
        };

        fetchStatus();

        return () => {
            isCancelled = true;
        };
    }, [reservationId]);

    const handleDownload = useCallback(async () => {
        if (!reservationId || downloading) return;
        try {
            setDownloading(true);
            const blob = await getInvoicePdf(reservationId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${reservationId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            // In a real app you might show a toast
            console.error('Failed to download invoice PDF', err);
        } finally {
            setDownloading(false);
        }
    }, [reservationId, downloading]);

    const handlePrint = useCallback(async () => {
        if (!reservationId) return;
        try {
            const blob = await getInvoicePdf(reservationId);
            const url = window.URL.createObjectURL(blob);
            const printWindow = window.open(url);
            if (printWindow) {
                printWindow.focus();
            }
        } catch (err) {
            console.error('Failed to open invoice PDF for printing', err);
        }
    }, [reservationId]);

    const renderStatusBadge = () => {
        if (!reservationId) {
            return (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
                    لا يوجد حجز محدد
                </span>
            );
        }

        if (status === 'LOADING') {
            return (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
                    جاري تحميل حالة إرسال الفاتورة...
                </span>
            );
        }

        if (status === 'ERROR') {
            return (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-rose-100 text-rose-900">
                    {statusError || 'حدث خطأ أثناء جلب حالة الفاتورة.'}
                </span>
            );
        }

        if (status === 'SENT') {
            return (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-rose-900/10 text-rose-900">
                    تم إرسال الفاتورة إلى البريد الإلكتروني
                </span>
            );
        }

        if (status === 'FAILED') {
            return (
                <span className="inline-flex flex-col sm:flex-row sm:items-center gap-1 px-4 py-1.5 rounded-full text-xs font-medium bg-rose-100 text-rose-900">
                    <span>فشل إرسال الفاتورة إلى البريد الإلكتروني</span>
                    {statusMeta.errorMessage && (
                        <span className="text-[11px] text-rose-800">
                            ({statusMeta.errorMessage})
                        </span>
                    )}
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
                لم يتم إرسال الفاتورة بعد
            </span>
        );
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-rose-900 me-2" style={{ fontFamily: "'Khat Alharf Alyadawi', system-ui, sans-serif" }}>
                        معاينة الفاتورة
                    </h1>
                    <div>
                        {renderStatusBadge()}
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 rounded-full border-rose-900/10 text-rose-900 hover:bg-rose-900 hover:text-white"
                        onClick={handlePrint}
                        disabled={!reservationId}
                    >
                        <Printer className="h-4 w-4 ms-2" />
                        طباعة
                    </Button>
                    <Button
                        className="flex items-center gap-2 rounded-full bg-rose-900 text-white hover:bg-rose-900/90"
                        onClick={handleDownload}
                        disabled={!reservationId || downloading}
                    >
                        <Download className="h-4 w-4 ms-2" />
                        {downloading ? 'جاري التحميل...' : 'تحميل الفاتورة'}
                    </Button>
                </div>
            </div>

            <Card className="bg-white rounded-3xl border-zinc-200 shadow-sm border-t-8 border-t-rose-900">
                <CardContent className="p-8 md:p-12">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-zinc-100 pb-8 mb-8">
                        <div className="flex items-center gap-3 text-black">
                            <Hotel className="h-10 w-10 ms-3" />
                            <div>
                                <h2
                                    className="text-3xl font-black tracking-tighter text-rose-900"
                                    style={{ fontFamily: "'Khat Alharf Alyadawi', system-ui, sans-serif" }}
                                >
                                    روميفاي
                                </h2>
                                <p className="text-sm text-zinc-500 font-medium" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                    فنادق ومنتجعات فاخرة
                                </p>
                            </div>
                        </div>
                        <div className="text-start font-sans">
                            <h3
                                className="text-3xl font-black text-zinc-300 mb-2 tracking-widest text-start"
                                style={{ fontFamily: "'Khat Alharf Alyadawi', system-ui, sans-serif" }}
                            >
                                فاتورة
                            </h3>
                            <p className="text-sm text-zinc-900 font-bold mb-1 text-start" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                {/* Placeholder invoice number until wired to real data */}
                                #INV-XXXX
                            </p>
                            <p className="text-sm text-zinc-500 text-start" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                {/* Static date for now; can be replaced when bill API is wired */}
                                التاريخ: —
                            </p>
                        </div>
                    </div>

                    {/* Guest Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                        <div>
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                فاتورة إلى
                            </h4>
                            <p className="font-black text-black text-xl mb-1" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                {/* Guest name will be wired to real data later */}
                                —
                            </p>
                            <p className="text-zinc-500 text-sm font-medium" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                {/* Guest email placeholder */}
                                —
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                تفاصيل الإقامة
                            </h4>
                            <p className="text-black font-bold text-sm mb-1" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                <span className="text-zinc-500 ms-2 font-normal">الغرفة:</span> —
                            </p>
                            <p className="text-black font-bold text-sm mb-1" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                <span className="text-zinc-500 ms-2 font-normal">الدخول:</span> —
                            </p>
                            <p className="text-black font-bold text-sm" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                <span className="text-zinc-500 ms-2 font-normal">الخروج:</span> —
                            </p>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="mb-8 rounded-2xl border border-zinc-200 overflow-hidden">
                        <table className="w-full text-end border-collapse">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider w-3/4" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                        الوصف
                                    </th>
                                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider w-1/4 text-start" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                        المبلغ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 bg-white">
                                <tr className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="py-4 px-6 text-zinc-900 font-medium text-sm text-start" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                        {/* Line items will be wired to real bill data later */}
                                        —
                                    </td>
                                    <td className="py-4 px-6 text-zinc-900 font-bold text-sm text-start font-mono">
                                        —
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-sm space-y-3 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500 text-sm font-medium" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                    المجموع الفرعي
                                </span>
                                <span className="font-bold text-zinc-900 font-mono">—</span>
                            </div>
                            <div className="flex justify-between items-center text-rose-900">
                                <span className="text-sm font-medium text-rose-900" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                    الخصم
                                </span>
                                <span className="font-bold font-mono">—</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500 text-sm font-medium" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                    ضريبة القيمة المضافة (15%)
                                </span>
                                <span className="font-bold text-zinc-900 font-mono">—</span>
                            </div>
                            <div className="border-t border-zinc-200 pt-4 mt-4 flex justify-between items-center">
                                <span className="text-lg font-black text-black" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                                    الإجمالي الكلي
                                </span>
                                <span className="text-2xl font-black text-black font-mono">—</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-8 border-t border-zinc-200 text-center">
                        <p className="text-zinc-400 text-sm font-medium" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                            شكرًا لاختياركم فنادق ومنتجعات روميفاي. نتمنى رؤيتكم قريبًا.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default InvoicePreview;
