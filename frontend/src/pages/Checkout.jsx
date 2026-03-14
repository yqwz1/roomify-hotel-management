import React, { useState, useCallback } from 'react';
import { Search, CreditCard, Receipt } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import LoadingState from '../components/common/LoadingState';
import SuccessState from '../components/common/SuccessState';
import ErrorState from '../components/common/ErrorState';
import ConfirmationToast from '../components/ConfirmationToast';
import {
    searchReservations,
    getBill,
    checkOutReservation,
    extractReservationError,
} from '../services/reservationService';

const formatDateAr = (iso) => {
    if (!iso) return '-';
    return new Date(`${iso}T12:00:00`).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatAmount = (val) => {
    const n = Number(val ?? 0);
    return `$${n.toFixed(2)}`;
};

const FinalBillSection = ({ bill }) => {
    if (!bill?.lineItems?.length) {
        return (
            <Card className="mt-6 border-zinc-200 shadow-sm rounded-3xl">
                <CardContent className="p-8">
                    <p className="text-center text-zinc-500">لا توجد تفاصيل فاتورة متاحة</p>
                </CardContent>
            </Card>
        );
    }

    const balanceDue = Number(bill?.balanceDue ?? 0);
    const hasUnpaidBalance = balanceDue > 0;
    const statusLabel = hasUnpaidBalance ? 'رصيد غير مدفوع' : 'جاهز للخروج';
    const statusClass = hasUnpaidBalance
        ? 'bg-rose-100 text-rose-900 border-rose-200'
        : 'bg-zinc-200 text-zinc-800 border-zinc-200';

    return (
        <Card className="mt-6 border-zinc-200 shadow-sm rounded-3xl">
            <CardHeader>
                <CardTitle className="flex items-center text-lg font-heading text-zinc-900">
                    <Receipt className="ms-2 h-5 w-5 text-zinc-500" />
                    ملخص الفاتورة النهائية
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 text-sm">
                    {bill.lineItems.map((item, idx) => {
                        const amount = Number(item?.amount ?? 0);
                        const credit = !!item?.credit;
                        const label = item?.label ?? '';
                        return (
                            <div key={idx} className="flex justify-between">
                                <span className={credit ? 'text-zinc-500' : 'text-zinc-600'}>
                                    {label}
                                </span>
                                <span
                                    className={`font-bold ${credit ? 'text-zinc-600' : 'text-zinc-900'}`}
                                >
                                    {credit ? `-${formatAmount(amount)}` : formatAmount(amount)}
                                </span>
                            </div>
                        );
                    })}
                    <div className="border-t border-zinc-200 pt-3 mt-3 flex justify-between items-center">
                        <span className="text-base font-bold text-zinc-900">الإجمالي الكلي</span>
                        <span className="text-xl font-black text-rose-900">
                            {formatAmount(bill.balanceDue)}
                        </span>
                    </div>
                    <div
                        className={`mt-4 flex justify-between items-center p-3 rounded-2xl border ${statusClass}`}
                    >
                        <span className="font-bold">حالة الدفع</span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold">{statusLabel}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const Checkout = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [bill, setBill] = useState(null);
    const [billLoading, setBillLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [checkoutError, setCheckoutError] = useState(null);
    const [toast, setToast] = useState(null);

    const fetchBill = useCallback(async (confirmationNumber) => {
        if (!confirmationNumber) return;
        setBillLoading(true);
        setBill(null);
        try {
            const data = await getBill(confirmationNumber);
            setBill(data);
        } catch (err) {
            setBill(null);
            setToast({ message: extractReservationError(err), type: 'error' });
        } finally {
            setBillLoading(false);
        }
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        const q = searchQuery?.trim();
        if (!q) return;

        setSearchLoading(true);
        setSearchError(null);
        setSelected(null);
        setBill(null);
        setCheckoutSuccess(false);
        setCheckoutError(null);

        try {
            const results = await searchReservations(q);
            const reservation = Array.isArray(results) ? results[0] : null;
            if (!reservation) {
                setSearchError('لم يتم العثور على حجز مطابق. جرّب اسم ضيف أو رقم تأكيد آخر.');
                setSelected(null);
                setBill(null);
                return;
            }
            setSelected(reservation);
            await fetchBill(reservation.confirmationNumber);
        } catch (err) {
            setSearchError(extractReservationError(err));
            setSelected(null);
            setBill(null);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!selected?.confirmationNumber || checkoutLoading) return;
        const balance = Number(bill?.balanceDue ?? 0);
        if (balance > 0) {
            setCheckoutError('يوجد رصيد غير مدفوع. يرجى دفع المبلغ المتبقي قبل إتمام الخروج.');
            return;
        }

        setCheckoutLoading(true);
        setCheckoutError(null);

        try {
            await checkOutReservation(selected.confirmationNumber);
            setCheckoutSuccess(true);
            setToast({
                message: `تم تسجيل خروج ${selected.guestName} بنجاح.`,
                type: 'success',
            });
            setSelected(null);
            setBill(null);
            setSearchQuery('');
        } catch (err) {
            const msg = extractReservationError(err);
            setCheckoutError(msg);
            setToast({ message: msg, type: 'error' });
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleReset = () => {
        setSelected(null);
        setBill(null);
        setSearchError(null);
        setCheckoutError(null);
        setSearchQuery('');
    };

    const balanceDue = Number(bill?.balanceDue ?? 0);
    const hasUnpaidBalance = balanceDue > 0;
    const isCheckoutDisabled =
        !selected ||
        billLoading ||
        checkoutLoading ||
        hasUnpaidBalance;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
            <ConfirmationToast
                message={toast?.message}
                type={toast?.type}
                onClose={() => setToast(null)}
            />

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-heading text-black">تسجيل الخروج للضيف</h1>
            </div>

            <Card className="rounded-3xl border-zinc-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-heading text-zinc-900">البحث عن حجز الضيف</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setSearchError(null);
                                }}
                                placeholder="ابحث باسم الضيف أو رقم التأكيد (مثلاً RSV-...)"
                                className="pe-10 rounded-full border-zinc-300 focus-visible:ring-black"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={searchLoading || !searchQuery?.trim()}
                            className="rounded-full bg-black hover:bg-zinc-800 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {searchLoading ? 'جاري البحث...' : 'بحث'}
                        </Button>
                    </form>
                    {searchError && (
                        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                            <p className="text-sm font-medium text-rose-900">{searchError}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {searchLoading && (
                <LoadingState message="جاري البحث عن الحجز..." />
            )}

            {!searchLoading && selected && (
                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="rounded-3xl border-zinc-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-heading text-zinc-900">
                                معلومات الضيف
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-zinc-500 block">اسم الضيف</label>
                                    <div className="font-bold text-lg text-black">
                                        {selected.guestName ?? bill?.guestName ?? '-'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-zinc-500 block">رقم الغرفة</label>
                                        <div className="font-bold text-zinc-900">
                                            {selected.roomNumber ?? bill?.roomNumber ?? '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-zinc-500 block">تاريخ الدخول</label>
                                        <div className="font-bold text-zinc-900">
                                            {formatDateAr(bill?.checkInDate ?? selected.checkInDate)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div>
                        {billLoading ? (
                            <LoadingState message="جاري تحميل الفاتورة النهائية..." />
                        ) : (
                            <FinalBillSection bill={bill} />
                        )}

                        {checkoutError && (
                            <div className="mt-6">
                                <ErrorState
                                    title="تعذر إتمام الخروج"
                                    message={checkoutError}
                                    onRetry={() => setCheckoutError(null)}
                                />
                            </div>
                        )}

                        {hasUnpaidBalance && !checkoutError && (
                            <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-5">
                                <p className="text-rose-900 font-bold">يوجد رصيد غير مدفوع</p>
                                <p className="text-sm text-rose-800 mt-1">
                                    يرجى دفع المبلغ المتبقي ({formatAmount(balanceDue)}) قبل إتمام تسجيل الخروج.
                                </p>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <Button
                                variant="outline"
                                className="rounded-full border-zinc-300 text-zinc-900 hover:bg-zinc-100"
                                onClick={handleReset}
                                disabled={checkoutLoading}
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleCheckout}
                                disabled={isCheckoutDisabled}
                                className="flex items-center gap-2 rounded-full bg-black hover:bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CreditCard className="h-4 w-4 ms-2" />
                                {checkoutLoading
                                    ? 'جاري المعالجة...'
                                    : hasUnpaidBalance
                                        ? 'يجب دفع الرصيد المتبقي أولاً'
                                        : 'إتمام الخروج والدفع'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {checkoutSuccess && !selected && (
                <SuccessState
                    title="تم تسجيل الخروج بنجاح!"
                    message="تم إتمام عملية تسجيل الخروج والدفع للضيف بنجاح."
                />
            )}

            {!searchLoading && !selected && !checkoutSuccess && searchQuery && (
                <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center">
                    <p className="text-zinc-600 font-medium">ابحث عن حجز الضيف لمشاهدة الفاتورة وإتمام الخروج</p>
                </div>
            )}
        </div>
    );
};

export default Checkout;
