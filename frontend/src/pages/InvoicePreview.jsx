import React from 'react';
import { Download, Printer, Hotel } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const mockInvoiceData = {
    invoiceId: "INV-2023-089",
    date: "15 أكتوبر 2023",
    guestName: "أحمد محمد",
    guestEmail: "ahmed.m@example.com",
    roomNumber: "204",
    checkIn: "12 أكتوبر 2023",
    checkOut: "15 أكتوبر 2023",
    items: [
        { description: "رسوم الغرفة (فاخرة) - 3 ليالي", amount: 450.00 },
        { description: "خدمة الغرف - عشاء", amount: 45.00 },
        { description: "استهلاك الميني بار", amount: 25.00 }
    ],
    subtotal: 520.00,
    tax: 78.00,
    discount: -52.00,
    total: 546.00,
    status: "مدفوع"
};

const InvoicePreview = () => {
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm">
                <h1 className="text-2xl font-bold font-heading text-black me-2">معاينة الفاتورة</h1>
                <div className="flex gap-3">
                    <Button variant="outline" disabled className="flex items-center gap-2 rounded-full border-zinc-200">
                        <Printer className="h-4 w-4 ms-2" />
                        طباعة
                    </Button>
                    <Button disabled className="flex items-center gap-2 rounded-full bg-black text-white">
                        <Download className="h-4 w-4 ms-2" />
                        تحميل الفاتورة
                    </Button>
                </div>
            </div>

            <Card className="bg-white rounded-3xl border-zinc-200 shadow-sm border-t-8 border-t-black">
                <CardContent className="p-8 md:p-12">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-zinc-100 pb-8 mb-8">
                        <div className="flex items-center gap-3 text-black">
                            <Hotel className="h-10 w-10 ms-3" />
                            <div>
                                <h2 className="text-3xl font-black tracking-tighter text-black">روميفاي</h2>
                                <p className="text-sm text-zinc-500 font-medium">فنادق ومنتجعات فاخرة</p>
                            </div>
                        </div>
                        <div className="text-start font-sans">
                            <h3 className="text-3xl font-black text-zinc-200 mb-2 tracking-widest text-start">فاتورة</h3>
                            <p className="text-sm text-zinc-900 font-bold mb-1 text-start">#{mockInvoiceData.invoiceId}</p>
                            <p className="text-sm text-zinc-500 text-start">التاريخ: {mockInvoiceData.date}</p>
                        </div>
                    </div>

                    {/* Guest Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                        <div>
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">فاتورة إلى</h4>
                            <p className="font-black text-black text-xl mb-1">{mockInvoiceData.guestName}</p>
                            <p className="text-zinc-500 text-sm font-medium">{mockInvoiceData.guestEmail}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">تفاصيل الإقامة</h4>
                            <p className="text-black font-bold text-sm mb-1"><span className="text-zinc-500 ms-2 font-normal">الغرفة:</span> {mockInvoiceData.roomNumber}</p>
                            <p className="text-black font-bold text-sm mb-1"><span className="text-zinc-500 ms-2 font-normal">الدخول:</span> {mockInvoiceData.checkIn}</p>
                            <p className="text-black font-bold text-sm"><span className="text-zinc-500 ms-2 font-normal">الخروج:</span> {mockInvoiceData.checkOut}</p>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="mb-8 rounded-2xl border border-zinc-200 overflow-hidden">
                        <table className="w-full text-end border-collapse">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider w-3/4">الوصف</th>
                                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider w-1/4 text-start">المبلغ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 bg-white">
                                {mockInvoiceData.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="py-4 px-6 text-zinc-900 font-medium text-sm text-start">{item.description}</td>
                                        <td className="py-4 px-6 text-zinc-900 font-bold text-sm text-start font-mono">${item.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-sm space-y-3 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500 text-sm font-medium">المجموع الفرعي</span>
                                <span className="font-bold text-zinc-900 font-mono">${mockInvoiceData.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-rose-900">
                                <span className="text-sm font-medium text-rose-900">الخصم</span>
                                <span className="font-bold font-mono">-${Math.abs(mockInvoiceData.discount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500 text-sm font-medium">ضريبة القيمة المضافة (15%)</span>
                                <span className="font-bold text-zinc-900 font-mono">${mockInvoiceData.tax.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-zinc-200 pt-4 mt-4 flex justify-between items-center">
                                <span className="text-lg font-black text-black">الإجمالي الكلي</span>
                                <span className="text-2xl font-black text-black font-mono">${mockInvoiceData.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-8 border-t border-zinc-200 text-center">
                        <p className="text-zinc-400 text-sm font-medium">شكرًا لاختياركم فنادق ومنتجعات روميفاي. نتمنى رؤيتكم قريبًا.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default InvoicePreview;
