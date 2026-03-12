import React, { useState } from 'react';
import { Search, CreditCard, Receipt } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const FinalBillSection = () => {
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
                    <div className="flex justify-between">
                        <span className="text-zinc-600">رسوم الغرفة (3 ليالي)</span>
                        <span className="font-bold text-zinc-900">$450.00</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-600">خدمة الغرف</span>
                        <span className="font-bold text-zinc-900">$45.00</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-600">الميني بار</span>
                        <span className="font-bold text-zinc-900">$25.00</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                        <span>خصم خاص (10%)</span>
                        <span className="font-bold">-$52.00</span>
                    </div>
                    <div className="border-t border-zinc-100 pt-2 mt-2 flex justify-between">
                        <span className="text-zinc-600">المجموع الفرعي</span>
                        <span className="font-bold text-zinc-900">$468.00</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-600">ضريبة القيمة المضافة (15%)</span>
                        <span className="font-bold text-zinc-900">$70.20</span>
                    </div>
                    <div className="border-t border-zinc-200 pt-3 mt-3 flex justify-between items-center">
                        <span className="text-base font-bold text-zinc-900">الإجمالي الكلي</span>
                        <span className="text-xl font-black text-black">$538.20</span>
                    </div>
                    <div className="mt-4 flex justify-between items-center bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                        <span className="text-zinc-600 font-bold">حالة الدفع</span>
                        <span className="px-3 py-1 bg-zinc-200 text-zinc-800 rounded-full text-xs font-bold">في انتظار تسجيل الخروج</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const Checkout = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [guestFound, setGuestFound] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setGuestFound(true);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
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
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث باسم الضيف أو رقم الغرفة..."
                                className="pe-10 rounded-full border-zinc-300 focus-visible:ring-black"
                            />
                        </div>
                        <Button type="submit" className="rounded-full bg-black hover:bg-zinc-800 text-white px-8">بحث</Button>
                    </form>
                </CardContent>
            </Card>

            {guestFound && (
                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="rounded-3xl border-zinc-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-heading text-zinc-900">معلومات الضيف</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-zinc-500 block">اسم الضيف</label>
                                    <div className="font-bold text-lg text-black">أحمد محمد</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-zinc-500 block">رقم الغرفة</label>
                                        <div className="font-bold text-zinc-900">204 (فاخرة)</div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-zinc-500 block">تاريخ الدخول</label>
                                        <div className="font-bold text-zinc-900">12 أكتوبر 2023</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div>
                        <FinalBillSection />
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="outline" className="rounded-full border-zinc-300 text-zinc-900 hover:bg-zinc-100" onClick={() => setGuestFound(false)}>إلغاء</Button>
                            <Button className="flex items-center gap-2 rounded-full bg-black hover:bg-zinc-800 text-white">
                                <CreditCard className="h-4 w-4 ms-2" />
                                إتمام الخروج والدفع
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Checkout;
